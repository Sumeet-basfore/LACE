#!/usr/bin/env python3
import json, subprocess, pathlib, time, datetime, hashlib, re, tempfile, shutil, glob, os, sys

MANIFEST = pathlib.Path("research/phase2d/manifest.json")
DATASET = "lite"
MODEL = "muse-spark-1.2-contributor-free"
PROVIDER = "opencode"
OUT_ROOT = pathlib.Path("research/phase2d/raw")
RESULTS = pathlib.Path("research/phase2d/run-state")
MANIFEST_HASH = hashlib.sha256(MANIFEST.read_bytes()).hexdigest()[:16]

ZERO_USAGE = {"input": 0, "output": 0, "totalTokens": 0, "cacheRead": 0, "cacheWrite": 0, "reasoning": 0, "cost": 0}

PROVIDER_FAILURE_CLASSES = frozenset({
    "PROVIDER_RATE_LIMIT",
    "PROVIDER_ERROR",
    "AUTH_ERROR",
    "NETWORK_ERROR",
    "TIMEOUT",
})

NON_RETRYABLE_PROVIDER_FAILURES = PROVIDER_FAILURE_CLASSES


def load_manifest():
    d = json.loads(MANIFEST.read_text())
    return d["ids"]


def extract_pi_errors(stdout):
    """Collect provider error messages from pi JSON stream."""
    errors = []
    for line in stdout.splitlines():
        line = line.strip()
        if not line.startswith("{"):
            continue
        try:
            j = json.loads(line)
        except json.JSONDecodeError:
            continue
        for key in ("message",):
            msg = j.get(key)
            if isinstance(msg, dict):
                err = msg.get("errorMessage")
                if err:
                    errors.append(err)
                if msg.get("stopReason") == "error" and err is None:
                    errors.append("provider stopReason=error")
        if j.get("type") == "agent_end":
            for m in j.get("messages", []):
                if m.get("role") == "assistant":
                    err = m.get("errorMessage")
                    if err:
                        errors.append(err)
                    elif m.get("stopReason") == "error":
                        errors.append("provider stopReason=error")
    # de-dupe while preserving order
    seen = set()
    out = []
    for e in errors:
        if e not in seen:
            seen.add(e)
            out.append(e)
    return out


def classify_provider_failure(exit_code, stderr, stdout, timed_out=False):
    """
    Classify pi subprocess / provider failures.
    Returns (failure_class, message) or (None, None) if no provider failure detected.
    """
    if timed_out:
        return "TIMEOUT", stderr or "pi subprocess timed out"

    combined = "\n".join(filter(None, [stderr or "", stdout or ""]))
    combined_l = combined.lower()
    pi_errors = extract_pi_errors(stdout or "")
    message = pi_errors[0] if pi_errors else (stderr or "").strip()
    if pi_errors:
        message = pi_errors[0]
    elif stderr and stderr.strip():
        message = stderr.strip()
    elif exit_code not in (None, 0):
        message = f"pi exited with code {exit_code}"

    has_provider_signal = bool(pi_errors) or exit_code not in (None, 0) or bool(stderr and stderr.strip())

    if not has_provider_signal:
        return None, None

    # Auth failures
    if any(x in combined_l for x in (
        "401", "403", "unauthorized", "authentication", "invalid api key",
        "api key", "auth error", "forbidden",
    )):
        return "AUTH_ERROR", message

    # Rate limits (including opencode FreeUsageLimitError)
    if any(x in combined_l for x in (
        "429", "freeusagelimiterror", "rate limit", "rate_limit",
        "too many requests", "quota exceeded", "usage limit",
    )):
        return "PROVIDER_RATE_LIMIT", message

    # Network failures
    if any(x in combined_l for x in (
        "econnrefused", "enotfound", "etimedout", "eai_again",
        "network error", "connection refused", "connection reset",
        "connection timed out", "dns", "socket hang up", "fetch failed",
        "getaddrinfo",
    )):
        return "NETWORK_ERROR", message

    # Explicit API/provider errors in pi JSON stream
    if pi_errors or "api error" in combined_l or "error from provider" in combined_l:
        return "PROVIDER_ERROR", message

    if exit_code not in (None, 0):
        return "PROVIDER_ERROR", message

    return None, None


def extract_patch(assistant_text, raw_stdout=""):
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
            if idx != -1:
                patch = assistant_text[idx:idx + 20000].split("```")[0].strip().split('{"type"')[0].strip()
    if not patch and raw_stdout:
        idx = raw_stdout.rfind("diff --git")
        if idx != -1:
            patch = raw_stdout[idx:idx + 20000].split("```")[0].strip().split('{"type"')[0].strip()
    if patch and not patch.startswith("diff"):
        idx = patch.find("diff --git")
        if idx != -1:
            patch = patch[idx:]
        else:
            patch = ""
    return patch


def parse_pi_stdout(stdout):
    assistant_text = ""
    last_usage = None
    for line in stdout.splitlines():
        line = line.strip()
        if not line.startswith("{"):
            continue
        try:
            j = json.loads(line)
        except json.JSONDecodeError:
            continue
        if j.get("type") == "agent_end" and "usage" in j:
            last_usage = j["usage"]
            msgs = j.get("messages", [])
            for m in reversed(msgs):
                if m.get("role") == "assistant":
                    for c in m.get("content", []):
                        if c.get("type") == "text" and c.get("text"):
                            assistant_text += c["text"] + "\n"
                    break
            if assistant_text:
                break
        if j.get("type") == "message_end" and j.get("message", {}).get("role") == "assistant":
            msg = j["message"]
            if "usage" in msg:
                last_usage = msg["usage"]
            for c in msg.get("content", []):
                if c.get("type") == "text" and c.get("text"):
                    assistant_text = c["text"]
    return assistant_text, last_usage


def usage_from_pi(last_usage):
    if not last_usage:
        return dict(ZERO_USAGE)
    cost = last_usage.get("cost", 0)
    if isinstance(cost, dict):
        cost = cost.get("total", 0)
    input_tok = last_usage.get("input", 0)
    output_tok = last_usage.get("output", 0)
    return {
        "input": input_tok,
        "output": output_tok,
        "totalTokens": last_usage.get("totalTokens", input_tok + output_tok),
        "cacheRead": last_usage.get("cacheRead", 0),
        "cacheWrite": last_usage.get("cacheWrite", 0),
        "reasoning": last_usage.get("reasoning", 0),
        "cost": cost,
    }


def pi_patch(problem_statement, repo, iid, feedback=None, targeted=False, failing_test=None):
    if targeted and failing_test:
        base = (
            f"Fix GitHub issue {iid} ({repo}). Failing test: {failing_test}\n"
            f"Feedback: {feedback}\nPrevious patch failed this test. "
            "Produce corrected unified diff (```diff). Output only patch."
        )
    else:
        base = (
            f"You are fixing GitHub issue. Repo: {repo}, Issue: {iid}\n"
            f"Problem statement:\n{problem_statement}\n"
            "Task: Produce unified diff patch that fixes the issue. Output ONLY patch in "
            "```diff code block starting with 'diff --git'. No explanation outside patch block. "
            "Must apply with 'git apply'."
        )
        if feedback:
            base += f"\n\nPrevious attempt FAILED. Feedback:\n{feedback}\nFix accordingly, output ONLY corrected diff."
    start = time.monotonic()
    cmd = ["pi", "-p", "--mode", "json", "--provider", PROVIDER, "--model", MODEL, base]
    exit_code = 0
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        out = r.stdout
        err = (r.stderr or "")[:8000]
        exit_code = r.returncode
        latency = time.monotonic() - start
        timed_out = False
    except subprocess.TimeoutExpired as e:
        latency = time.monotonic() - start
        out = (e.stdout.decode() if isinstance(e.stdout, bytes) else (e.stdout or "")) if e.stdout else ""
        err = "TIMEOUT 300s"
        exit_code = None
        timed_out = True
        provider_failure = {
            "failure_class": "TIMEOUT",
            "message": err,
            "exit_code": exit_code,
            "stderr": err,
        }
        return "", dict(ZERO_USAGE), f"TIMEOUT: {err}", latency, err, timed_out, provider_failure

    provider_class, provider_msg = classify_provider_failure(exit_code, err, out, timed_out=False)
    assistant_text, last_usage = parse_pi_stdout(out)
    patch = extract_patch(assistant_text, out)
    transcript = assistant_text[:8000] if assistant_text else out[:8000]

    provider_failure = None
    if provider_class:
        provider_failure = {
            "failure_class": provider_class,
            "message": provider_msg or "",
            "exit_code": exit_code,
            "stderr": err,
        }
        patch = ""
        usage = dict(ZERO_USAGE)
        if provider_msg:
            transcript = f"PROVIDER_FAILURE: {provider_class}\n{provider_msg}\n\n{transcript}"
    else:
        usage = usage_from_pi(last_usage)

    return patch, usage, transcript, latency, err, timed_out, provider_failure


def check_patch(patch):
    if not patch.strip():
        return "EMPTY_OUTPUT"
    if "diff --git" not in patch or "@@" not in patch:
        return "MODEL_OUTPUT_INVALID"
    with tempfile.NamedTemporaryFile(mode='w', suffix='.patch', delete=False) as tf:
        tf.write(patch)
        tf.flush()
        r = subprocess.run(["patch", "--dry-run", "-p1", "-i", tf.name], capture_output=True, text=True, timeout=5)
        os.unlink(tf.name)
        if r.returncode != 0:
            return "MODEL_OUTPUT_INVALID"
    return None


def should_stop_retries(provider_failure):
    if not provider_failure:
        return False
    return provider_failure["failure_class"] in NON_RETRYABLE_PROVIDER_FAILURES


def write_transcript(path, patch, transcript, err, provider_failure=None):
    parts = [f"PATCH:\n{patch[:10000]}", f"TRANSCRIPT:\n{transcript}"]
    if provider_failure:
        parts.append(
            "PROVIDER_FAILURE:\n"
            f"class={provider_failure['failure_class']}\n"
            f"message={provider_failure.get('message', '')}\n"
            f"exit_code={provider_failure.get('exit_code')}\n"
            f"stderr={provider_failure.get('stderr', '')[:4000]}"
        )
    parts.append(f"ERR:{err}")
    path.write_text("\n".join(parts))


def result_provider_fields(provider_failure):
    if not provider_failure:
        return {}
    return {
        "provider_failure": provider_failure["failure_class"],
        "provider_error": provider_failure.get("message", ""),
    }


def get_image_for_instance(iid):
    from swebench.harness.utils import load_swebench_dataset
    ds = load_swebench_dataset(DATASET, split="test", instance_ids=[iid])
    return ds[0]["image"], ds[0]["FAIL_TO_PASS"], ds[0]["PASS_TO_PASS"]


def targeted_eval(iid, patch, fail_to_pass):
    image, _, _ = get_image_for_instance(iid)
    with tempfile.NamedTemporaryFile(mode='w', suffix='.patch', delete=False) as tf:
        tf.write(patch)
        tf.flush()
        patch_path = tf.name
    k_parts = []
    for t in fail_to_pass:
        name = t.split("::")[-1].split("[")[0]
        k_parts.append(name)
    k_expr = " or ".join(sorted(set(k_parts)))
    start = time.monotonic()
    cmd = [
        "docker", "run", "--rm", "-v", f"{patch_path}:/tmp/patch", "--entrypoint", "bash", image, "-c",
        f"cd /testbed && git apply /tmp/patch 2>&1 && python -m pytest -k \"{k_expr}\" -v 2>&1; echo EXIT:$?",
    ]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    latency = time.monotonic() - start
    os.unlink(patch_path)
    out = r.stdout + r.stderr
    passed = "FAILED" not in out and ("1 passed" in out or "passed" in out)
    if "FAILED" in out:
        passed = False
    elif "passed" in out:
        passed = True
    else:
        passed = False
    failing_test = ""
    assertion = ""
    traceback = ""
    if not passed:
        for line in out.splitlines():
            if "FAILED" in line:
                failing_test = line.strip()
                break
        for i, line in enumerate(out.splitlines()):
            if "AssertionError" in line or "assert" in line:
                assertion = line.strip()
                traceback = "\n".join(out.splitlines()[max(0, i - 5):i + 5])
                break
    infra = "Unable to find image" in out or "docker: Error" in out
    return passed, failing_test, assertion, traceback, out[-4000:], latency, infra


def full_eval(iid, patch):
    preds = [{"instance_id": iid, "model_patch": patch, "model_name_or_path": MODEL}]
    tmpdir = tempfile.mkdtemp(prefix="pred_")
    preds_path = pathlib.Path(tmpdir) / "pred.jsonl"
    with open(preds_path, "w") as f:
        for p in preds:
            f.write(json.dumps(p) + "\n")
    run_id = f"phase2d-{iid}"
    cmd = ["/tmp/venv2/bin/swebench", "eval", DATASET, "-p", str(preds_path), "--run-id", run_id, "-i", iid, "--timeout", "300"]
    start = time.monotonic()
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
    latency = time.monotonic() - start
    report = None
    for cand in [f"{run_id}.json"]:
        if pathlib.Path(cand).exists():
            try:
                report = json.loads(pathlib.Path(cand).read_text())
                break
            except json.JSONDecodeError:
                pass
    if report is None:
        for jf in glob.glob("*.json"):
            try:
                j = json.loads(pathlib.Path(jf).read_text())
                if j.get("submitted_ids") and iid in j.get("submitted_ids", []):
                    report = j
                    break
            except json.JSONDecodeError:
                pass
    resolved = False
    infra = False
    if report:
        resolved = iid in report.get("resolved_ids", [])
        infra = iid in report.get("infra_failure_ids", [])
    else:
        resolved = "1 resolved" in r.stdout
    shutil.rmtree(tmpdir, ignore_errors=True)
    for f in glob.glob(f"{run_id}.json"):
        pathlib.Path(f).unlink(missing_ok=True)
    return resolved, infra, report, r.stdout[-4000:] + r.stderr[-2000:], latency


def run():
    ids = load_manifest()
    for arm in ["baseline", "current", "layered"]:
        (OUT_ROOT / arm).mkdir(parents=True, exist_ok=True)
        (OUT_ROOT / arm / "logs").mkdir(parents=True, exist_ok=True)
        (RESULTS / arm).mkdir(parents=True, exist_ok=True)
    from swebench.harness.utils import load_swebench_dataset
    ds = load_swebench_dataset(DATASET, split="test", instance_ids=ids)
    id2inst = {d["instance_id"]: d for d in ds}
    results = {"baseline": [], "current": [], "layered": []}
    for arm in ["baseline", "current", "layered"]:
        p = OUT_ROOT / arm / "result.json"
        if p.exists():
            try:
                results[arm] = json.loads(p.read_text())
                print(f"Resuming {arm}: {len(results[arm])} done")
            except json.JSONDecodeError:
                results[arm] = []
    for iid in ids:
        inst = id2inst[iid]
        ps = inst["problem_statement"]
        repo = inst["repo"]
        for arm in ["baseline", "current", "layered"]:
            if any(r["instance_id"] == iid for r in results[arm]):
                print(f"Skipping {iid} [{arm}] already done")
                continue
            print(f"\n=== {iid} [{arm}] ===")
            task_start = time.monotonic()
            task_iso = datetime.datetime.utcnow().isoformat() + "Z"
            if arm == "baseline":
                patch, usage, transcript, pi_lat, err, timed_out, provider_failure = pi_patch(ps, repo, iid)
                write_transcript(OUT_ROOT / arm / f"transcript_{iid}.txt", patch, transcript, err, provider_failure)
                ver_start = time.monotonic()
                if provider_failure:
                    resolved, infra, report, eval_log, ver_lat = False, False, None, "", 0.0
                else:
                    resolved, infra, report, eval_log, ver_lat = full_eval(iid, patch)
                if report:
                    pathlib.Path(OUT_ROOT / arm / "logs" / f"{iid}.eval.json").write_text(json.dumps(report, indent=2))
                pathlib.Path(OUT_ROOT / arm / "logs" / f"{iid}.log").write_text(eval_log)
                total_lat = time.monotonic() - task_start
                if provider_failure:
                    fc = provider_failure["failure_class"]
                elif not patch.strip():
                    fc = "EMPTY_OUTPUT"
                elif not resolved:
                    fc = "TEST_FAILURE"
                else:
                    fc = "NONE"
                rec = {
                    "instance_id": iid, "repo": repo, "base_commit": inst["base_commit"],
                    "condition": arm, "model": MODEL, "attempts": 1, "retries": 0,
                    "resolved": resolved, "infra_failure": infra, "failure_class": fc,
                    "verification_layer": "full" if not provider_failure else "skipped_provider_failure",
                    "totalTokens": usage["totalTokens"], "cacheRead": usage["cacheRead"],
                    "latency_seconds": round(total_lat, 2), "pi_latency": round(pi_lat, 2),
                    "verification_latency": round(ver_lat, 2), "started_at": task_iso,
                    "finished_at": datetime.datetime.utcnow().isoformat() + "Z",
                    "patch_empty": not bool(patch.strip()), "token_usage": usage,
                    **result_provider_fields(provider_failure),
                }
                results[arm].append(rec)
                (OUT_ROOT / arm / "result.json").write_text(json.dumps(results[arm], indent=2))
                print(f"  baseline resolved={resolved} tokens={usage['totalTokens']} lat={total_lat:.1f}s fc={fc}")
            elif arm == "current":
                attempts = 0
                total_usage = dict(ZERO_USAGE)
                patches = []
                transcripts = []
                resolved = False
                infra = False
                feedback = None
                ver_total = 0
                pi_total = 0
                provider_failure = None
                failure_class = "NONE"
                for attempt in range(1, 4):
                    attempts = attempt
                    patch, usage, transcript, pi_lat, err, timed_out, provider_failure = pi_patch(ps, repo, iid, feedback=feedback)
                    patches.append(patch)
                    transcripts.append(transcript)
                    pi_total += pi_lat
                    if provider_failure:
                        failure_class = provider_failure["failure_class"]
                        break
                    for k in total_usage:
                        total_usage[k] += usage.get(k, 0)
                    resolved, infra, report, eval_log, ver_lat = full_eval(iid, patch)
                    ver_total += ver_lat
                    if report:
                        pathlib.Path(OUT_ROOT / arm / "logs" / f"{iid}.a{attempt}.eval.json").write_text(json.dumps(report, indent=2))
                    pathlib.Path(OUT_ROOT / arm / "logs" / f"{iid}.a{attempt}.log").write_text(eval_log)
                    if resolved or infra:
                        failure_class = "NONE" if resolved else "INFRA_FAILURE"
                        break
                    if attempt == 3:
                        failure_class = "TEST_FAILURE"
                        break
                    feedback = eval_log[-800:]
                    if not feedback.strip():
                        feedback = "Previous patch did not resolve FAIL_TO_PASS. Try different approach."
                total_lat = time.monotonic() - task_start
                recovered = attempts > 1 and resolved
                pathlib.Path(OUT_ROOT / arm / f"transcript_{iid}.txt").write_text(
                    "\n\n===== ATTEMPT =====\n\n".join(
                        f"ATTEMPT {i + 1} PATCH:\n{p[:8000]}\nTRANSCRIPT:\n{t[:4000]}"
                        for i, p, t in zip(range(len(patches)), patches, transcripts)
                    )
                )
                if provider_failure:
                    fc = provider_failure["failure_class"]
                elif not patches[-1].strip():
                    fc = "EMPTY_OUTPUT"
                else:
                    fc = failure_class
                rec = {
                    "instance_id": iid, "repo": repo, "base_commit": inst["base_commit"],
                    "condition": arm, "model": MODEL, "attempts": attempts, "retries": attempts - 1,
                    "resolved": resolved, "infra_failure": infra, "recovered": recovered,
                    "failure_class": fc, "verification_layer": "full",
                    "totalTokens": total_usage["totalTokens"], "cacheRead": total_usage["cacheRead"],
                    "latency_seconds": round(total_lat, 2), "pi_latency": round(pi_total, 2),
                    "verification_latency": round(ver_total, 2), "started_at": task_iso,
                    "finished_at": datetime.datetime.utcnow().isoformat() + "Z",
                    "patch_empty": not bool(patches[-1].strip()) if patches else True,
                    "token_usage": total_usage,
                    **result_provider_fields(provider_failure),
                }
                results[arm].append(rec)
                (OUT_ROOT / arm / "result.json").write_text(json.dumps(results[arm], indent=2))
                print(f"  current resolved={resolved} attempts={attempts} recovered={recovered} tokens={total_usage['totalTokens']} lat={total_lat:.1f}s fc={fc}")
            else:
                attempts = 0
                total_usage = dict(ZERO_USAGE)
                patches = []
                transcripts = []
                resolved = False
                infra = False
                failure_class = "NONE"
                ver_layer = "none"
                ver_total = 0
                pi_total = 0
                failing_test = ""
                assertion = ""
                traceback = ""
                provider_failure = None
                fail_to_pass = id2inst[iid]["FAIL_TO_PASS"]
                if isinstance(fail_to_pass, str):
                    fail_to_pass = json.loads(fail_to_pass)
                for attempt in range(1, 4):
                    attempts = attempt
                    if attempt == 1:
                        patch, usage, transcript, pi_lat, err, timed_out, provider_failure = pi_patch(ps, repo, iid, feedback=None)
                    else:
                        fb = (
                            f"Failing test: {failing_test}\nAssertion: {assertion}\n"
                            f"Traceback:\n{traceback}\nPrevious diff failed. Fix targeted file."
                        )
                        patch, usage, transcript, pi_lat, err, timed_out, provider_failure = pi_patch(
                            ps, repo, iid, feedback=fb, targeted=True, failing_test=failing_test,
                        )
                    patches.append(patch)
                    transcripts.append(transcript)
                    pi_total += pi_lat
                    if provider_failure:
                        failure_class = provider_failure["failure_class"]
                        ver_layer = "provider_failure"
                        break
                    for k in total_usage:
                        total_usage[k] += usage.get(k, 0)
                    if timed_out:
                        failure_class = "TIMEOUT"
                        ver_layer = "pi_timeout"
                        if attempt == 3:
                            break
                        failing_test = "TIMEOUT"
                        assertion = "pi timeout 300s"
                        traceback = "patch empty due to timeout"
                        continue
                    start_check = time.monotonic()
                    chk = check_patch(patch)
                    ver_total += time.monotonic() - start_check
                    if chk:
                        failure_class = chk
                        ver_layer = "apply_check"
                        failing_test = chk
                        assertion = "patch does not apply"
                        traceback = "git apply --check failed"
                        if attempt == 3:
                            break
                        continue
                    t_pass, ft, ass, tb, t_log, t_lat, t_infra = targeted_eval(iid, patch, fail_to_pass)
                    ver_total += t_lat
                    pathlib.Path(OUT_ROOT / arm / "logs" / f"{iid}.a{attempt}.targeted.log").write_text(t_log)
                    if t_infra:
                        failure_class = "INFRA_FAILURE"
                        ver_layer = "targeted"
                        infra = True
                        break
                    if not t_pass:
                        failure_class = "TEST_FAILURE"
                        ver_layer = "targeted"
                        failing_test = ft
                        assertion = ass
                        traceback = tb
                        if attempt == 3:
                            break
                        continue
                    ver_layer = "regression"
                    resolved, infra, report, eval_log, ver_lat = full_eval(iid, patch)
                    ver_total += ver_lat
                    if report:
                        pathlib.Path(OUT_ROOT / arm / "logs" / f"{iid}.a{attempt}.eval.json").write_text(json.dumps(report, indent=2))
                    pathlib.Path(OUT_ROOT / arm / "logs" / f"{iid}.a{attempt}.log").write_text(eval_log)
                    if resolved:
                        failure_class = "NONE"
                        ver_layer = "regression"
                        break
                    failure_class = "REGRESSION" if "PASS_TO_PASS" in eval_log else "TEST_FAILURE"
                    if attempt == 3:
                        break
                    failing_test = eval_log[-500:]
                    assertion = "regression failed"
                    traceback = eval_log[-500:]
                total_lat = time.monotonic() - task_start
                recovered = attempts > 1 and resolved
                pathlib.Path(OUT_ROOT / arm / f"transcript_{iid}.txt").write_text(
                    "\n\n===== ATTEMPT =====\n\n".join(
                        f"ATTEMPT {i + 1} PATCH:\n{p[:8000]}\nTRANSCRIPT:\n{t[:4000]}"
                        for i, p, t in zip(range(len(patches)), patches, transcripts)
                    )
                )
                rec = {
                    "instance_id": iid, "repo": repo, "base_commit": inst["base_commit"],
                    "condition": arm, "model": MODEL, "attempts": attempts, "retries": attempts - 1,
                    "resolved": resolved, "infra_failure": infra, "recovered": recovered,
                    "failure_class": failure_class, "verification_layer": ver_layer,
                    "totalTokens": total_usage["totalTokens"], "cacheRead": total_usage["cacheRead"],
                    "latency_seconds": round(total_lat, 2), "pi_latency": round(pi_total, 2),
                    "verification_latency": round(ver_total, 2), "started_at": task_iso,
                    "finished_at": datetime.datetime.utcnow().isoformat() + "Z",
                    "patch_empty": not bool(patches[-1].strip()) if patches else True,
                    "token_usage": total_usage,
                    **result_provider_fields(provider_failure),
                }
                results[arm].append(rec)
                (OUT_ROOT / arm / "result.json").write_text(json.dumps(results[arm], indent=2))
                print(f"  layered resolved={resolved} attempts={attempts} recovered={recovered} fc={failure_class} tokens={total_usage['totalTokens']} lat={total_lat:.1f}s")
    agg = {"manifest_hash": MANIFEST_HASH, "baseline": results["baseline"], "current": results["current"], "layered": results["layered"]}
    pathlib.Path("research/phase2d/raw/results.json").write_text(json.dumps(agg, indent=2))
    print("\nDone")


def smoke_pi():
    """Minimal live pi invocation to verify provider connectivity."""
    patch, usage, transcript, latency, err, timed_out, provider_failure = pi_patch(
        "Return a one-line unified diff for README.md adding a comment.",
        "test/repo",
        "smoke-test",
    )
    print(f"smoke_pi: latency={latency:.2f}s tokens={usage['totalTokens']} provider_failure={provider_failure}")
    print(f"patch_len={len(patch)} err_len={len(err or '')}")
    if provider_failure:
        print(f"  class={provider_failure['failure_class']}")
        print(f"  message={provider_failure.get('message', '')[:200]}")
        return 1
    return 0


def smoke_patch_extraction():
    """Verify patch extraction from representative assistant output."""
    sample = '''Here is the fix:
```diff
diff --git a/foo.py b/foo.py
index 123..456 789
--- a/foo.py
+++ b/foo.py
@@ -1,3 +1,3 @@
 def foo():
-    return 1
+    return 2
```
'''
    patch = extract_patch(sample)
    ok = patch.startswith("diff --git") and "@@" in patch and "return 2" in patch
    print(f"smoke_patch_extraction: ok={ok} patch_lines={len(patch.splitlines())}")
    return 0 if ok else 1


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "smoke-pi":
        raise SystemExit(smoke_pi())
    if len(sys.argv) > 1 and sys.argv[1] == "smoke-patch":
        raise SystemExit(smoke_patch_extraction())
    run()
