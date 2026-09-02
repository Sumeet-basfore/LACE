#!/usr/bin/env python3
"""
Powered 30-task A/B harness — minimal ponytail version.
Reuses frozen manifest, same prompt both arms, pi+opencode model, 120s timeout,
deterministic verification via swebench lite, candidate retry ≤2, native usage capture.
"""
import json, subprocess, pathlib, time, datetime, hashlib, re, os, sys, shutil, tempfile, glob

MANIFEST = pathlib.Path("research/experiment/scale/task-manifest.json")
DATASET = "lite"  # alias for SWE-bench/SWE-bench_Lite with image/eval_script
MODEL = "muse-spark-1.2-contributor-free"
PROVIDER = "opencode"
TEMPERATURE = 0.2
TIMEOUT = 120
RUN_ID = "powered-30"
OUT_ROOT = pathlib.Path(f"research/experiment/scale/runs/{RUN_ID}")
RESULTS_PATH = pathlib.Path(f"research/experiment/scale/results/{RUN_ID}.json")
SWE = "/tmp/venv2/bin/swebench"
VENV_PY = "/tmp/venv2/bin/python"

def load_manifest():
    d = json.loads(MANIFEST.read_text())
    return d["ids"], json.loads(MANIFEST.read_text())

def pi_patch(problem_statement, repo, instance_id, feedback=None):
    """Call pi and extract unified diff patch + usage."""
    base = f"""You are fixing a GitHub issue. Repo: {repo}, Issue: {instance_id}

Problem statement:
{problem_statement}

Task: Produce a unified diff patch that fixes the issue. Output ONLY the patch in a ```diff code block starting with 'diff --git'. No explanation outside the patch block. The patch must apply with 'git apply'."""
    if feedback:
        base += f"\n\nPrevious attempt FAILED deterministically. Feedback (≤800 chars):\n{feedback}\n\nFix the patch accordingly, output ONLY corrected diff."
    # pi invocation with timeout handling
    start = time.monotonic()
    cmd = ["pi","-p","--mode","json","--provider",PROVIDER,"--model",MODEL, base]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        out = r.stdout
        err = r.stderr[:2000]
        timed_out = False
        latency = time.monotonic() - start
    except subprocess.TimeoutExpired as e:
        latency = time.monotonic() - start
        out = (e.stdout.decode() if isinstance(e.stdout, bytes) else (e.stdout or "")) if e.stdout else ""
        err = f"TIMEOUT after 300s"
        timed_out = True
        # return empty patch with timeout marker
        usage = {"input":0,"output":0,"totalTokens":0,"cacheRead":0,"cacheWrite":0,"reasoning":0,"cost":0}
        return "", usage, f"TIMEOUT: {err}", latency, err
    # parse assistant text from pi json lines (last assistant message)
    assistant_text = ""
    last_usage = None
    for line in out.splitlines():
        line=line.strip()
        if not line.startswith("{"): continue
        try: j=json.loads(line)
        except: continue
        if j.get("type")=="agent_end" and "usage" in j:
            last_usage=j["usage"]
            msgs=j.get("messages",[])
            for m in reversed(msgs):
                if m.get("role")=="assistant":
                    for c in m.get("content",[]):
                        if c.get("type")=="text" and c.get("text"):
                            assistant_text+=c["text"]+"\n"
                    break
            if assistant_text: break
        if j.get("type")=="message_end" and j.get("message",{}).get("role")=="assistant":
            msg=j["message"]
            if "usage" in msg:
                last_usage=msg["usage"]
            for c in msg.get("content",[]):
                if c.get("type")=="text" and c.get("text"):
                    assistant_text=c["text"]
    if not assistant_text:
        idx = out.rfind("diff --git")
        if idx!=-1:
            assistant_text = out[idx-500:idx+20000]
    input_tok = output_tok = total_tok = cache_read = cache_write = reasoning = 0
    cost = 0
    if last_usage:
        input_tok = last_usage.get("input",0)
        output_tok = last_usage.get("output",0)
        total_tok = last_usage.get("totalTokens", input_tok+output_tok)
        cache_read = last_usage.get("cacheRead",0)
        cache_write = last_usage.get("cacheWrite",0)
        reasoning = last_usage.get("reasoning",0)
        cost = last_usage.get("cost",{}).get("total",0) if isinstance(last_usage.get("cost"),dict) else last_usage.get("cost",0)

    # extract patch from assistant_text
    patch = ""
    m = re.search(r"```diff(.*?)```", assistant_text, re.DOTALL)
    if m:
        patch = m.group(1).strip()
    else:
        m2 = re.search(r"```(.*?)```", assistant_text, re.DOTALL)
        if m2 and "diff --git" in m2.group(1):
            patch = m2.group(1).strip()
        else:
            idx = assistant_text.find("diff --git")
            if idx!=-1:
                patch = assistant_text[idx:idx+20000].split("```")[0].strip()
                patch = patch.split('{"type"')[0].strip()
    if patch and not patch.startswith("diff"):
        idx = patch.find("diff --git")
        if idx!=-1:
            patch = patch[idx:]
        else:
            patch = ""
    transcript = assistant_text[:8000] if assistant_text else out[:8000]
    usage = {"input":input_tok,"output":output_tok,"totalTokens":total_tok,"cacheRead":cache_read,"cacheWrite":cache_write,"reasoning":reasoning,"cost":cost}
    return patch, usage, transcript, latency, r.stderr[:2000]

def swe_eval(instance_id, patch_text, run_id_suffix):
    """Evaluate single patch via swebench. Returns resolved bool, report dict, log."""
    preds = [{"instance_id": instance_id, "model_patch": patch_text, "model_name_or_path": MODEL}]
    tmpdir = tempfile.mkdtemp(prefix="pred_")
    preds_path = pathlib.Path(tmpdir) / "pred.jsonl"
    with open(preds_path,"w") as f:
        for p in preds:
            f.write(json.dumps(p)+"\n")
    run_id = f"{RUN_ID}-{run_id_suffix}-{instance_id}"
    start = time.monotonic()
    cmd = [SWE,"eval",DATASET,"-p",str(preds_path),"--run-id",run_id,"-i",instance_id,"--timeout","300"]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
    latency = time.monotonic()-start
    # find report
    reports = glob.glob(f"{run_id}.json") + glob.glob(f"gold.{run_id}.json") + glob.glob("*.json")
    # swebench report dir default: finds by run_id? It writes to <run_id>.json or gold...
    # actually swebench writes to <report-dir>/<run_id>.json default report-dir="."
    report = None
    for cand in [f"{run_id}.json", f"gold.{run_id}.json"]:
        if pathlib.Path(cand).exists():
            try: report=json.loads(pathlib.Path(cand).read_text()); break
            except: pass
    if report is None:
        # search any json with instance_id
        for jf in glob.glob("*.json"):
            try:
                j=json.loads(pathlib.Path(jf).read_text())
                if j.get("submitted_ids") and instance_id in j.get("submitted_ids",[]):
                    report=j; break
            except: pass
    # fallback: parse stdout for resolved
    resolved = False
    infra = False
    if report:
        resolved = instance_id in report.get("resolved_ids",[])
        infra = instance_id in report.get("infra_failure_ids",[])
    else:
        # parse stdout
        resolved = "1 resolved" in r.stdout or '"resolved_instances": 1' in r.stdout
    # copy report to tmpdir for preservation
    shutil.rmtree(tmpdir, ignore_errors=True)
    return resolved, infra, report, r.stdout[-4000:]+r.stderr[-2000:], latency

def run():
    ids, manifest = load_manifest()
    # ensure out dirs
    OUT_ROOT.mkdir(parents=True, exist_ok=True)
    for arm in ["baseline","candidate"]:
        (OUT_ROOT/arm).mkdir(parents=True, exist_ok=True)
        (OUT_ROOT/arm/"logs").mkdir(parents=True, exist_ok=True)
    # load problem statements
    from swebench.harness.utils import load_swebench_dataset
    ds = load_swebench_dataset(DATASET, split="test", instance_ids=ids)
    id2inst = {d["instance_id"]:d for d in ds}
    # resume: load existing results if present
    results = {"baseline":[],"candidate":[]}
    for arm in ["baseline","candidate"]:
        p = OUT_ROOT/arm/"result.json"
        if p.exists():
            try:
                results[arm]=json.loads(p.read_text())
                print(f"Resuming {arm}: {len(results[arm])} already done")
            except: results[arm]=[]
    # execution order: task 1 baseline -> candidate, task2 ...
    for iid in ids:
        inst = id2inst[iid]
        ps = inst["problem_statement"]
        repo = inst["repo"]
        for arm in ["baseline","candidate"]:
            # resume skip
            if any(r["instance_id"]==iid for r in results[arm]):
                print(f"Skipping {iid} [{arm}] already done")
                continue
            print(f"\n=== {iid} [{arm}] ===")
            task_start = time.monotonic()
            task_start_iso = datetime.datetime.utcnow().isoformat()+"Z"
            # baseline: single attempt
            if arm=="baseline":
                patch, usage, transcript, pi_lat, pi_err = pi_patch(ps, repo, iid, feedback=None)
                # write transcript
                (OUT_ROOT/arm/f"transcript_{iid}.txt").write_text(f"PATCH:\n{patch[:10000]}\n\nTRANSCRIPT:\n{transcript}\n\nSTDERR:\n{pi_err}")
                # evaluate
                ver_start=time.monotonic()
                resolved, infra, report, eval_log, ver_lat = swe_eval(iid, patch, f"baseline")
                ver_end=time.monotonic()
                total_lat = time.monotonic()-task_start
                total_tok = usage["totalTokens"]
                # preserve report
                if report:
                    (OUT_ROOT/arm/"logs"/f"{iid}.eval.json").write_text(json.dumps(report,indent=2))
                (OUT_ROOT/arm/"logs"/f"{iid}.log").write_text(eval_log)
                rec = {
                    "instance_id": iid,
                    "repo": repo,
                    "base_commit": inst["base_commit"],
                    "condition": arm,
                    "model": MODEL,
                    "provider": PROVIDER,
                    "temperature": TEMPERATURE,
                    "timeout": TIMEOUT,
                    "attempts": 1,
                    "retries": 0,
                    "task_tests_passed": resolved,
                    "regression_tests_passed": resolved,  # strict: resolved means both FAIL_TO_PASS and PASS_TO_PASS; keep separate but for lite resolved==both
                    "resolved": resolved,
                    "infra_failure": infra,
                    "recovered": False,
                    "human_intervention": False,
                    "token_usage": usage,
                    "totalTokens": total_tok,
                    "cost": usage["cost"],
                    "latency_seconds": round(total_lat,2),
                    "pi_latency": round(pi_lat,2),
                    "verification_latency": round(ver_lat,2),
                    "started_at": task_start_iso,
                    "finished_at": datetime.datetime.utcnow().isoformat()+"Z",
                    "patch_empty": not bool(patch.strip()),
                    "patch_preview": patch[:500],
                }
                results[arm].append(rec)
                # write per-arm metadata incrementally
                (OUT_ROOT/arm/"result.json").write_text(json.dumps(results[arm],indent=2))
                print(f"  baseline resolved={resolved} infra={infra} tokens={total_tok} cost={usage['cost']} lat={total_lat:.1f}s")
            else:
                # candidate: retry loop
                attempts = 0
                total_usage = {"input":0,"output":0,"totalTokens":0,"cacheRead":0,"cacheWrite":0,"reasoning":0,"cost":0}
                transcripts=[]
                patches=[]
                resolved=False
                infra=False
                feedback=None
                ver_lat_total=0
                pi_lat_total=0
                patch=""
                for attempt in range(1,4):
                    attempts=attempt
                    patch, usage, transcript, pi_lat, pi_err = pi_patch(ps, repo, iid, feedback=feedback)
                    patches.append(patch)
                    transcripts.append(transcript)
                    for k in total_usage:
                        total_usage[k]+=usage.get(k,0)
                    pi_lat_total+=pi_lat
                    # evaluate
                    resolved, infra, report, eval_log, ver_lat = swe_eval(iid, patch, f"candidate-a{attempt}")
                    ver_lat_total+=ver_lat
                    if report:
                        (OUT_ROOT/arm/"logs"/f"{iid}.a{attempt}.eval.json").write_text(json.dumps(report,indent=2))
                    (OUT_ROOT/arm/"logs"/f"{iid}.a{attempt}.log").write_text(eval_log)
                    # if resolved, break (need regression check - but resolved already includes PASS_TO_PASS)
                    if resolved:
                        break
                    if infra:
                        # infra failure counts as is, don't retry on infra? But protocol says infra is not model failure, but we still record. For candidate, we retry only on test failure, not infra.
                        # If infra, break and mark infra
                        break
                    if attempt==3:
                        break
                    # parse failure for feedback: take eval_log tail
                    feedback = eval_log[-800:]
                    if not feedback.strip():
                        feedback = "Previous patch did not resolve FAIL_TO_PASS tests. Try different approach."
                total_lat = time.monotonic()-task_start
                recovered = attempts>1 and resolved  # simple: retried and now resolved
                (OUT_ROOT/arm/f"transcript_{iid}.txt").write_text("\n\n===== ATTEMPT =====\n\n".join([f"ATTEMPT {i+1} PATCH:\n{p[:8000]}\nTRANSCRIPT:\n{t[:4000]}" for i,p,t in zip(range(len(patches)),patches,transcripts)]))
                rec = {
                    "instance_id": iid,
                    "repo": repo,
                    "base_commit": inst["base_commit"],
                    "condition": arm,
                    "model": MODEL,
                    "provider": PROVIDER,
                    "temperature": TEMPERATURE,
                    "timeout": TIMEOUT,
                    "attempts": attempts,
                    "retries": attempts-1,
                    "task_tests_passed": resolved,
                    "regression_tests_passed": resolved,
                    "resolved": resolved,
                    "infra_failure": infra,
                    "recovered": recovered,
                    "human_intervention": False,
                    "token_usage": total_usage,
                    "totalTokens": total_usage["totalTokens"],
                    "cost": total_usage["cost"],
                    "latency_seconds": round(total_lat,2),
                    "pi_latency": round(pi_lat_total,2),
                    "verification_latency": round(ver_lat_total,2),
                    "started_at": task_start_iso,
                    "finished_at": datetime.datetime.utcnow().isoformat()+"Z",
                    "patch_empty": not bool(patch.strip()),
                    "patch_preview": patch[:500],
                }
                results[arm].append(rec)
                (OUT_ROOT/arm/"result.json").write_text(json.dumps(results[arm],indent=2))
                print(f"  candidate resolved={resolved} infra={infra} attempts={attempts} recovered={recovered} tokens={total_usage['totalTokens']} lat={total_lat:.1f}s")
            # sequential storage management: after each task's both arms, check df
            # we keep images; no pruning needed with 143G
    # write aggregate
    agg = {
        "run_id": RUN_ID,
        "model": MODEL,
        "dataset": DATASET,
        "manifest_hash": hashlib.sha256(MANIFEST.read_bytes()).hexdigest()[:16],
        "baseline": results["baseline"],
        "candidate": results["candidate"],
    }
    pathlib.Path("research/experiment/scale/results/powered-30.json").write_text(json.dumps(agg,indent=2))
    print("\nDone. Results at", RESULTS_PATH)
    # also write runs aggregate for analysis
    return results

if __name__=="__main__":
    run()
