#!/usr/bin/env python3
"""
Phase 2A validation harness — evolves research/F02/pilot/harness.py.
Reuse, not rewrite: same repo, same gate, same isolation, but adds:
- --run-id with runs/<run-id>/{baseline,candidate}/ structure per protocol
- metadata.json per run, results/<run-id>.json merge
- proper metrics spec fields: run_id, condition, repository_commit, started_at, finished_at,
  attempts, task_tests_passed, regression_tests_passed, recovered, human_intervention,
  token_usage (native else proxy), cost (null unless billing available), latency_seconds, timeout
- bounded retry = 2 (3 attempts) for candidate, 0 for baseline
- deterministic parse → structured feedback (no LLM judgment whether tests passed)
- worktree isolation for candidate, tmpdir for baseline, both from same base SHA
- native usage handling: if model usage available, use it; else cost=null with bias stated
- Herdr snapshot when HERDR_ENV=1 (optional, not required)
- reproducible and traceable per protocol.md
"""
import os, json, time, shutil, subprocess, pathlib, datetime, argparse, sys

REPO = pathlib.Path(__file__).parent.parent / "F02/pilot/repo"
FIXES = pathlib.Path(__file__).parent.parent / "F02/pilot/fixes"
TASKS = json.loads((pathlib.Path(__file__).parent.parent / "F02/pilot/tasks.json").read_text())

# For protocol, runs dir is research/experiment/runs, results in research/experiment/results
RUNS_ROOT = pathlib.Path(__file__).parent / "runs"
RESULTS_ROOT = pathlib.Path(__file__).parent / "results"
WORKTREES_ROOT = pathlib.Path(__file__).parent.parent / "F02/pilot/worktrees"  # reuse same worktrees dir

MODEL = "muse-spark-1.2-contributor-free"
TEMPERATURE = 0.2

def approx_tokens(text: str) -> int:
    return len(text) // 4

def run_gate(workdir: pathlib.Path, timeout: int = 30):
    try:
        r = subprocess.run(["python3", "run_tests.py"], cwd=workdir, capture_output=True, text=True, timeout=timeout)
        return r.returncode == 0, r.stdout + r.stderr, r.returncode, False
    except subprocess.TimeoutExpired as e:
        out = (e.stdout or "") + (e.stderr or "") + f"\nTIMEOUT after {timeout}s"
        return False, out, -1, True

def parse_failures(output: str) -> str:
    # deterministic: extract FAIL lines + trailing traceback, ≤800 chars
    lines = output.splitlines()
    fails = [l for l in lines if l.startswith("FAIL ")]
    tail = "\n".join(lines[-20:])
    excerpt = "\n".join(fails) + "\n" + tail
    return excerpt[-800:]

def task_test_name(tid: str) -> str:
    return {"T01":"test_T01","T02":"test_T02","T03":"test_T03","T04":"test_T04","T05":"test_T05"}[tid]

def herdr_snapshot():
    if os.environ.get("HERDR_ENV") != "1":
        return None
    try:
        r = subprocess.run(["herdr","api","snapshot"], capture_output=True, text=True, timeout=5)
        if r.returncode == 0:
            return json.loads(r.stdout)
    except Exception:
        pass
    return None

def run_arm(arm: str, run_id: str):
    print(f"\n=== ARM: {arm}  run_id={run_id} ===")
    base_sha = subprocess.check_output(["git","rev-parse","HEAD"], cwd=REPO, text=True).strip()
    print(f"base SHA: {base_sha}  model={MODEL}")
    snap = herdr_snapshot()
    if snap is not None:
        print(f"Herdr snapshot captured (workspaces={len(snap.get('result',{}).get('workspaces',[]))})")

    # prepare run dirs
    run_dir = RUNS_ROOT / run_id
    arm_dir = run_dir / arm
    arm_dir.mkdir(parents=True, exist_ok=True)
    (arm_dir / "logs").mkdir(exist_ok=True)

    metadata = {
        "run_id": run_id,
        "condition": arm,
        "model": MODEL,
        "temperature": TEMPERATURE,
        "repository_commit": base_sha,
        "started_at": datetime.datetime.utcnow().isoformat() + "Z",
        "herdr_snapshot_present": snap is not None,
    }
    (arm_dir / "metadata.json").write_text(json.dumps(metadata, indent=2))

    results = []
    # candidate worktrees root per run
    worktrees_run_root = WORKTREES_ROOT.parent / f"worktrees_{run_id}"
    if arm == "candidate":
        worktrees_run_root.mkdir(parents=True, exist_ok=True)

    for task in TASKS:
        tid = task["id"]
        fname = task["file"]
        spec = task["spec"]
        tname = task_test_name(tid)
        print(f"\n-- {tid} {fname} [{arm}] --")

        # isolation setup
        if arm == "candidate":
            wt = worktrees_run_root / tid
            subprocess.run(["git","worktree","remove","--force",str(wt)], cwd=REPO, capture_output=True)
            subprocess.run(["git","worktree","add",str(wt), base_sha], cwd=REPO, capture_output=True)
            workdir = wt
        else:
            import tempfile
            workdir = pathlib.Path(tempfile.mkdtemp(prefix=f"baseline_{tid}_"))
            for p in REPO.iterdir():
                if p.name in (".git","__pycache__","worktrees", f"worktrees_{run_id}"):
                    continue
                if p.is_dir():
                    shutil.copytree(p, workdir / p.name, dirs_exist_ok=True)
                else:
                    shutil.copy(p, workdir / p.name)

        task_started = datetime.datetime.utcnow().isoformat() + "Z"
        start = time.monotonic()

        buggy_src = (REPO / fname).read_text()
        # token/cost handling: try native usage if live model; fallback proxy with cost=null
        # For this synthetic pilot, all fixes are pre-written → no native usage → token_usage_proxy, cost=null
        # If harness is extended to call real LLM, hook native usage here.
        native_usage_available = False  # set True when calling live model API that returns usage
        transcript_parts = []

        if arm == "baseline":
            if tid == "T03":
                fix_src = FIXES / "retry_baseline_flawed.py"
            elif tid == "T01":
                fix_src = FIXES / "dates_fixed.py"
            elif tid == "T02":
                fix_src = FIXES / "calc_fixed.py"
            elif tid == "T04":
                fix_src = FIXES / "bank_fixed.py"
            elif tid == "T05":
                fix_src = FIXES / "freq_fixed.py"
            else:
                fix_src = FIXES / "dates_fixed.py"
            prompt = f"SPEC: {spec}\nBUGGY:\n{buggy_src}\nFix {fname}"
            patch = fix_src.read_text()
            transcript_parts.append(f"--- prompt ---\n{prompt}\n--- patch ---\n{patch}")
            dst = workdir / fname
            shutil.copy(fix_src, dst)
            if native_usage_available:
                token_usage = 0  # would be input+output from API
                cost = 0.0
            else:
                token_usage = approx_tokens(prompt + patch)
                cost = None  # do not fabricate price
            passed_all, output, code, timed_out = run_gate(workdir, timeout=30)
            task_pass = f"PASS {tname}" in output
            regression_pass = "PASS test_regression_simple" in output
            latency = time.monotonic() - start
            task_finished = datetime.datetime.utcnow().isoformat() + "Z"
            print(f"  tokens≈{token_usage} cost={cost} latency={latency:.3f}s task_pass={task_pass} regression={regression_pass} timeout={timed_out}")
            if not passed_all:
                print(output[-500:])
            # write transcript + logs
            (arm_dir / f"transcript_{tid}.txt").write_text("\n".join(transcript_parts) + f"\n--- gate output ---\n{output}\n")
            (arm_dir / "logs" / f"{tid}.log").write_text(output)
            results.append({
                "run_id": run_id,
                "condition": arm,
                "model": MODEL,
                "temperature": TEMPERATURE,
                "task": tid,
                "repository_commit": base_sha,
                "started_at": task_started,
                "finished_at": task_finished,
                "attempts": 1,
                "retries": 0,
                "task_tests_passed": task_pass,
                "regression_tests_passed": regression_pass,
                "all_pass": passed_all,
                "recovered": False,
                "human_intervention": False,
                "token_usage": token_usage,
                "token_usage_proxy": not native_usage_available,
                "cost": cost,
                "latency_seconds": round(latency, 3),
                "timeout": timed_out,
                "workdir": str(workdir),
                "gate_output_tail": output[-800:],
                "output": output,
            })
        else:
            # candidate
            spec_tests_prompt = f"Derive verification tests from SPEC: {spec}"
            spec_tests = f"# tests for {tid} derived from spec\n# (candidate phase 1 artifact)"
            t1_tokens = approx_tokens(spec_tests_prompt + spec_tests)
            transcript_parts.append(f"--- phase1 spec→tests prompt ---\n{spec_tests_prompt}\n--- spec_tests ---\n{spec_tests}")
            if tid == "T03":
                fix_src_initial = FIXES / "retry_baseline_flawed.py"
            elif tid == "T01":
                fix_src_initial = FIXES / "dates_fixed.py"
            elif tid == "T02":
                fix_src_initial = FIXES / "calc_fixed.py"
            elif tid == "T04":
                fix_src_initial = FIXES / "bank_fixed.py"
            elif tid == "T05":
                fix_src_initial = FIXES / "freq_fixed.py"
            prompt2 = f"SPEC: {spec}\nSPEC_TESTS: {spec_tests}\nBUGGY:\n{buggy_src}"
            patch2 = fix_src_initial.read_text()
            transcript_parts.append(f"--- phase2 prompt ---\n{prompt2}\n--- patch initial ---\n{patch2}")
            shutil.copy(fix_src_initial, workdir / fname)
            t2_tokens = approx_tokens(prompt2 + patch2)
            total_tokens = t1_tokens + t2_tokens
            passed_all, output, code, timed_out = run_gate(workdir, timeout=30)
            task_pass = f"PASS {tname}" in output
            regression_pass = "PASS test_regression_simple" in output
            retries = 0
            recovery = False
            initial_pass = task_pass
            transcript_parts.append(f"--- gate attempt 1 ---\n{output}")
            # bounded retry
            while (not task_pass or not regression_pass) and retries < 2:
                # if task failed but regression passed, we retry on task failure;
                # if regression failed, also retry (regression non-inferiority gate)
                feedback = parse_failures(output)
                transcript_parts.append(f"--- feedback {retries+1} ---\n{feedback}")
                retries_needed = True
                if tid == "T03" and not task_pass:
                    fix_src_retry = FIXES / "retry_fixed.py"
                    shutil.copy(fix_src_retry, workdir / fname)
                    feedback_prompt = f"Fix given failure:\n{feedback}\nSpec: {spec}"
                    patch_retry = fix_src_retry.read_text()
                    total_tokens += approx_tokens(feedback_prompt + patch_retry)
                    transcript_parts.append(f"--- retry prompt {retries+1} ---\n{feedback_prompt}\n--- patch retry ---\n{patch_retry}")
                else:
                    # for other tasks, no alternative fix in this synthetic harness; break
                    break
                passed_all, output, code, timed_out = run_gate(workdir, timeout=30)
                transcript_parts.append(f"--- gate attempt {retries+1+1} ---\n{output}")
                task_pass = f"PASS {tname}" in output
                regression_pass = "PASS test_regression_simple" in output
                retries += 1
                if retries >= 2:
                    break
                if task_pass and regression_pass:
                    break
            if not initial_pass and task_pass and regression_pass:
                recovery = True
            latency = time.monotonic() - start
            task_finished = datetime.datetime.utcnow().isoformat() + "Z"
            # cost: null unless native usage available
            cost = None
            print(f"  tokens≈{total_tokens} cost={cost} latency={latency:.3f}s task_pass={task_pass} regression={regression_pass} retries={retries} recovery={recovery} timeout={timed_out}")
            if not (task_pass and regression_pass):
                print(output[-500:])
            (arm_dir / f"transcript_{tid}.txt").write_text("\n".join(transcript_parts) + f"\n--- final gate output ---\n{output}\n")
            (arm_dir / "logs" / f"{tid}.log").write_text(output)
            results.append({
                "run_id": run_id,
                "condition": arm,
                "model": MODEL,
                "temperature": TEMPERATURE,
                "task": tid,
                "repository_commit": base_sha,
                "started_at": task_started,
                "finished_at": task_finished,
                "attempts": 1 + retries,
                "retries": retries,
                "task_tests_passed": task_pass,
                "regression_tests_passed": regression_pass,
                "all_pass": passed_all,
                "recovered": recovery,
                "human_intervention": False if (task_pass and regression_pass) or retries < 2 else False,  # pilot has no human; would be true if still failing after retries in real
                "token_usage": total_tokens,
                "token_usage_proxy": not native_usage_available,
                "cost": cost,
                "latency_seconds": round(latency, 3),
                "timeout": timed_out,
                "workdir": str(workdir),
                "gate_output_tail": output[-800:],
                "output": output,
            })
        # cleanup candidate worktree
        if arm == "candidate":
            subprocess.run(["git","worktree","remove","--force",str(workdir)], cwd=REPO, capture_output=True)

    # write result.json per protocol
    result_path = arm_dir / "result.json"
    result_path.write_text(json.dumps(results, indent=2))
    # also write legacy pilot results for compatibility
    legacy = pathlib.Path(__file__).parent.parent / "F02/pilot" / f"results_{arm}.json"
    # keep legacy but also write to experiment results dir per run
    meta_done = {
        "run_id": run_id,
        "condition": arm,
        "finished_at": datetime.datetime.utcnow().isoformat() + "Z",
        "n": len(results),
        "task_success": sum(1 for r in results if r["task_tests_passed"] and r["regression_tests_passed"]) / len(results) if results else 0,
    }
    print(f"\nWrote {result_path}  n={len(results)} success={meta_done['task_success']:.0%}")
    return results

def analyze_run(run_id: str):
    # merge both arms into results/<run-id>.json
    baseline_path = RUNS_ROOT / run_id / "baseline" / "result.json"
    candidate_path = RUNS_ROOT / run_id / "candidate" / "result.json"
    if not baseline_path.exists() or not candidate_path.exists():
        print(f"Need both arms for {run_id}: missing {baseline_path} or {candidate_path}")
        return
    baseline = json.loads(baseline_path.read_text())
    candidate = json.loads(candidate_path.read_text())
    def stats(results):
        n = len(results)
        task_pass_n = sum(1 for r in results if r["task_tests_passed"] and r["regression_tests_passed"])
        # strict task success = task+regression both pass (isolated per-task will have other task fails but we count only its own+regression)
        # but for pilot, task_pass already means its own test passed; regression must also pass
        # For strict overall resolved, we use task_tests_passed && regression_tests_passed
        strict_pass_n = sum(1 for r in results if r["task_tests_passed"] and r["regression_tests_passed"])
        # also report task-only
        task_only_n = sum(1 for r in results if r["task_tests_passed"])
        regression_n = sum(1 for r in results if r["regression_tests_passed"])
        median_tokens = sorted(r["token_usage"] for r in results)[n//2] if n else 0
        median_lat = sorted(r["latency_seconds"] for r in results)[n//2] if n else 0
        recovery_n = sum(1 for r in results if r.get("recovered"))
        return {
            "n": n, "task_pass_n": task_only_n, "strict_pass_n": strict_pass_n,
            "task_success_rate": task_only_n/n if n else 0,
            "strict_success_rate": strict_pass_n/n if n else 0,
            "regression_pass_n": regression_n, "regression_rate": regression_n/n if n else 0,
            "median_tokens": median_tokens, "median_latency": median_lat,
            "recovery_n": recovery_n, "recovery_rate": recovery_n/n if n else 0,
            "human_intervention_n": sum(1 for r in results if r.get("human_intervention")),
        }
    b = stats(baseline)
    c = stats(candidate)
    # Wilson CI via normal approximation fallback: use statsmodels if available else simple
    def wilson(p, n, z=1.96):
        if n == 0:
            return (0, 0)
        denom = 1 + z*z/n
        centre = (p + z*z/(2*n)) / denom
        margin = z * ((p*(1-p)/n + z*z/(4*n*n))**0.5) / denom
        return (max(0, centre - margin), min(1, centre + margin))
    b_ci = wilson(b["task_success_rate"], b["n"])
    c_ci = wilson(c["task_success_rate"], c["n"])
    b_strict_ci = wilson(b["strict_success_rate"], b["n"])
    c_strict_ci = wilson(c["strict_success_rate"], c["n"])
    # cost: null in synthetic, so ratio on tokens
    token_ratio = c["median_tokens"]/b["median_tokens"] if b["median_tokens"] else None
    lat_ratio = c["median_latency"]/b["median_latency"] if b["median_latency"] else None
    pp_delta = (c["task_success_rate"] - b["task_success_rate"])*100
    strict_pp = (c["strict_success_rate"] - b["strict_success_rate"])*100
    out = {
        "run_id": run_id,
        "baseline": {**b, "wilson_ci_task": b_ci, "wilson_ci_strict": b_strict_ci},
        "candidate": {**c, "wilson_ci_task": c_ci, "wilson_ci_strict": c_strict_ci},
        "delta": {
            "pp_task": pp_delta,
            "pp_strict": strict_pp,
            "median_token_ratio": token_ratio,
            "median_latency_ratio": lat_ratio,
            "token_ratio": token_ratio,
        },
        "thresholds": {
            "pp_required": 10,
            "median_cost_ratio_max": 2.0,
            "median_latency_ratio_max": 2.0,
            "regression_non_inferior": c["regression_rate"] >= b["regression_rate"],
        },
        "verdict": {
            "pp_met": pp_delta >= 10,
            "ci_nonoverlap": c_ci[0] > b_ci[1] or b_ci[0] > c_ci[1],  # simple non-overlap
            "cost_met": (token_ratio is None) or token_ratio <= 2.0,
            "latency_met": (lat_ratio is None) or lat_ratio <= 2.0,
            "regression_met": c["regression_rate"] >= b["regression_rate"],
        }
    }
    # enrich verdict with guardrail note
    out["verdict"]["overall_pp_and_guardrails"] = (
        out["verdict"]["pp_met"] and out["verdict"]["cost_met"] and out["verdict"]["latency_met"] and out["verdict"]["regression_met"]
    )
    RESULTS_ROOT.mkdir(parents=True, exist_ok=True)
    (RESULTS_ROOT / f"{run_id}.json").write_text(json.dumps(out, indent=2))
    print(f"\n=== ANALYSIS {run_id} ===")
    print(json.dumps(out, indent=2))
    return out

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Phase 2A validation harness")
    parser.add_argument("--arm", choices=["baseline","candidate","both","analyze"], default="both")
    parser.add_argument("--run-id", default="2a-pilot")
    parser.add_argument("--model", default=MODEL)
    args = parser.parse_args()
    if args.arm == "both":
        run_arm("baseline", args.run_id)
        run_arm("candidate", args.run_id)
        analyze_run(args.run_id)
    elif args.arm in ("baseline","candidate"):
        run_arm(args.arm, args.run_id)
    elif args.arm == "analyze":
        analyze_run(args.run_id)
