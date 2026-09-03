#!/usr/bin/env python3
import json, subprocess, pathlib, time, datetime, hashlib, re, tempfile, shutil, glob, os, sys, uuid

MANIFEST = pathlib.Path("research/phase2d/manifest.json")
DATASET = "lite"
MODEL = "muse-spark-1.2-contributor-free"
PROVIDER = "opencode"
OUT_ROOT = pathlib.Path("research/phase2d/raw")
RESULTS = pathlib.Path("research/phase2d/run-state")
MANIFEST_HASH = hashlib.sha256(MANIFEST.read_bytes()).hexdigest()[:16]
SWE = shutil.which("swebench") or "/tmp/venv2/bin/swebench"


def configure_final_one_task_run():
    """Final one-task validation: manifest-smoke.json, fresh output tree."""
    global MANIFEST, OUT_ROOT, RESULTS, MANIFEST_HASH
    MANIFEST = pathlib.Path("research/phase2d/manifest-smoke.json")
    OUT_ROOT = pathlib.Path("research/phase2d/raw-final-one-task")
    RESULTS = pathlib.Path("research/phase2d/run-state-final-one-task")
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


def normalize_patch(patch):
    """Ensure non-empty patches end with exactly one trailing newline for git apply."""
    if not patch:
        return patch
    if patch.endswith("\n"):
        return patch
    return patch + "\n"


def patch_was_normalized(raw_patch):
    """True when normalize_patch would append a trailing newline."""
    return bool(raw_patch) and not raw_patch.endswith("\n")


def patch_normalization_fields(raw_patch):
    return {"patch_normalized": patch_was_normalized(raw_patch)}


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
        return "", dict(ZERO_USAGE), f"TIMEOUT: {err}", latency, err, timed_out, provider_failure, ""

    provider_class, provider_msg = classify_provider_failure(exit_code, err, out, timed_out=False)
    assistant_text, last_usage = parse_pi_stdout(out)
    raw_patch = extract_patch(assistant_text, out)
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
        patch = normalize_patch(raw_patch)
        usage = usage_from_pi(last_usage)

    return patch, usage, transcript, latency, err, timed_out, provider_failure, raw_patch


def validate_patch_format(patch):
    """Local structural validation only (no testbed)."""
    if not patch.strip():
        return "EMPTY_OUTPUT"
    if "diff --git" not in patch or "@@" not in patch:
        return "MODEL_OUTPUT_INVALID"
    return None


def check_patch(patch):
    """Backward-compatible alias for format-only validation."""
    return validate_patch_format(patch)


def _write_temp_patch(patch):
    tf = tempfile.NamedTemporaryFile(mode="w", suffix=".patch", delete=False)
    tf.write(patch)
    tf.flush()
    tf.close()
    return tf.name


def _docker_testbed_run(image, patch_path, inner_bash, timeout=300):
    cmd = [
        "docker", "run", "--rm",
        "-v", f"{patch_path}:/tmp/patch:ro",
        "--entrypoint", "bash", image, "-c", inner_bash,
    ]
    return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)


def detect_docker_infra(output, returncode=None):
    combined = (output or "").lower()
    markers = (
        "unable to find image",
        "docker: error",
        "error response from daemon",
        "cannot connect to the docker daemon",
        "permission denied while trying to connect",
    )
    return any(m in combined for m in markers)


def apply_check_in_testbed(iid, patch, image=None, timeout=120):
    fmt = validate_patch_format(patch)
    if fmt:
        return fmt, ""
    if image is None:
        image, _, _ = get_image_for_instance(iid)
    patch_path = _write_temp_patch(patch)
    try:
        inner = "cd /testbed && git apply --check /tmp/patch 2>&1; echo EXIT:$?"
        r = _docker_testbed_run(image, patch_path, inner, timeout=timeout)
        out = (r.stdout or "") + (r.stderr or "")
        if detect_docker_infra(out, r.returncode):
            return "INFRA_FAILURE", out
        lines = out.strip().splitlines()
        exit_m = re.search(r"EXIT:(\d+)\s*$", lines[-1] if lines else "")
        inner_rc = int(exit_m.group(1)) if exit_m else r.returncode
        if inner_rc == 0:
            return None, out
        return "MODEL_OUTPUT_INVALID", out
    finally:
        os.unlink(patch_path)


def build_pytest_k_expr(fail_to_pass):
    k_parts = []
    for t in fail_to_pass:
        name = t.split("::")[-1].split("[")[0]
        k_parts.append(name)
    return " or ".join(sorted(set(k_parts)))


def parse_pytest_output(combined):
    text = combined or ""
    lower = text.lower()
    if detect_docker_infra(text):
        return {"status": "infra_failure", "passed_count": 0, "failed_count": 0, "error_count": 0, "failed_lines": [], "summary_line": ""}
    if "no tests ran" in lower or re.search(r"collected\s+0\s+items", lower):
        return {"status": "no_tests_collected", "passed_count": 0, "failed_count": 0, "error_count": 0, "failed_lines": [], "summary_line": next((ln for ln in text.splitlines() if "no tests ran" in ln.lower() or "collected 0 items" in ln.lower()), "")}
    failed_lines = []
    for line in text.splitlines():
        stripped = line.strip()
        if re.search(r"\bFAILED\b", stripped) and ("::" in stripped or stripped.startswith("FAILED")):
            failed_lines.append(stripped)
    summary_line = ""
    passed_count = failed_count = error_count = 0
    for line in reversed(text.splitlines()):
        s = line.strip()
        if not s.startswith("="):
            continue
        if not any(k in s.lower() for k in ("passed", "failed", "error", "no tests ran")):
            continue
        summary_line = s
        m = re.search(r"(\d+)\s+failed", s, re.I)
        if m:
            failed_count = int(m.group(1))
        m = re.search(r"(\d+)\s+passed", s, re.I)
        if m:
            passed_count = int(m.group(1))
        m = re.search(r"(\d+)\s+error", s, re.I)
        if m:
            error_count = int(m.group(1))
        break
    if error_count > 0 or failed_count > 0 or failed_lines:
        return {"status": "targeted_failed", "passed_count": passed_count, "failed_count": failed_count, "error_count": error_count, "failed_lines": failed_lines, "summary_line": summary_line}
    if passed_count > 0 and failed_count == 0 and error_count == 0:
        return {"status": "all_passed", "passed_count": passed_count, "failed_count": 0, "error_count": 0, "failed_lines": [], "summary_line": summary_line}
    return {"status": "unknown", "passed_count": passed_count, "failed_count": failed_count, "error_count": error_count, "failed_lines": failed_lines, "summary_line": summary_line}


def extract_failure_evidence(pytest_output, parsed):
    failing_test = ""
    assertion = ""
    traceback = ""
    if parsed["status"] == "no_tests_collected":
        failing_test = parsed.get("summary_line") or "no tests collected"
        assertion = "pytest collected zero tests for -k expression"
        traceback = pytest_output[-2000:]
        return failing_test, assertion, traceback
    if parsed["failed_lines"]:
        failing_test = parsed["failed_lines"][0]
    elif parsed.get("summary_line"):
        failing_test = parsed["summary_line"]
    lines = pytest_output.splitlines()
    for i, line in enumerate(lines):
        if "AssertionError" in line:
            assertion = line.strip()
            traceback = "\n".join(lines[max(0, i - 5): i + 8])
            break
        if not assertion and re.search(r"\bassert\b", line) and ("Error" in line or "error" in line.lower()):
            assertion = line.strip()
            traceback = "\n".join(lines[max(0, i - 5): i + 8])
    if not traceback and failing_test:
        for i, line in enumerate(lines):
            if failing_test.split()[0] in line:
                traceback = "\n".join(lines[max(0, i): i + 15])
                break
    return failing_test, assertion, traceback


def should_stop_retries(provider_failure):
    if not provider_failure:
        return False
    return provider_failure["failure_class"] in NON_RETRYABLE_PROVIDER_FAILURES


def write_transcript(path, patch, transcript, err, provider_failure=None, raw_patch=None):
    forensic_patch = raw_patch if raw_patch is not None else patch
    parts = [f"PATCH:\n{forensic_patch[:10000]}", f"TRANSCRIPT:\n{transcript}"]
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
    patch_path = _write_temp_patch(patch)
    k_expr = build_pytest_k_expr(fail_to_pass)
    inner = (
        f"cd /testbed && git apply /tmp/patch 2>&1 && "
        f"python -m pytest -k \"{k_expr}\" -v 2>&1; echo EXIT:$?"
    )
    start = time.monotonic()
    try:
        r = _docker_testbed_run(image, patch_path, inner, timeout=300)
    finally:
        os.unlink(patch_path)
    latency = time.monotonic() - start
    out = (r.stdout or "") + (r.stderr or "")
    parsed = parse_pytest_output(out)
    infra = parsed["status"] == "infra_failure"
    passed = parsed["status"] == "all_passed"
    failing_test, assertion, traceback = extract_failure_evidence(out, parsed)
    if parsed["status"] == "no_tests_collected" and not failing_test:
        failing_test = "no tests collected"
    return passed, failing_test, assertion, traceback, out, latency, infra


def get_evaluation_experiment_id():
    """Stable experiment/session identifier for evaluation run IDs."""
    return MANIFEST_HASH


def _sanitize_run_id_component(value):
    return re.sub(r"[^a-zA-Z0-9._-]+", "-", str(value))


def build_evaluation_run_id(experiment_id, arm, attempt, instance_id, *, now=None, unique=None):
    """
    Unique SWE-bench run ID per full_eval invocation.
    Includes experiment id, arm, attempt, instance, timestamp, and UUID fragment.
    """
    ts = (now or datetime.datetime.utcnow()).strftime("%Y%m%dT%H%M%S%fZ")
    uid = unique or uuid.uuid4().hex[:12]
    return "-".join([
        "phase2d",
        _sanitize_run_id_component(experiment_id),
        _sanitize_run_id_component(arm),
        f"a{attempt}",
        _sanitize_run_id_component(instance_id),
        ts,
        uid,
    ])


def evaluation_report_path(report_dir, model, run_id):
    model_slug = model.replace("/", "__")
    return pathlib.Path(report_dir) / f"{model_slug}.{run_id}.json"


def detect_evaluation_cache_hit(stdout, stderr):
    combined = f"{stdout or ''}\n{stderr or ''}"
    return "instances already run, skipping" in combined


def _patch_digest(patch):
    return hashlib.sha256((patch or "").encode()).hexdigest()


def validate_evaluation_freshness(
    *,
    stdout,
    stderr,
    report_path,
    run_id,
    instance_id,
    patch,
    patch_log_path,
    invocation_started_at,
):
    """
    Fail-closed validation that an evaluation report belongs to this invocation.
    Returns dict with fresh, cache_hit, invalid_reason, patch_verified.
    """
    cache_hit = detect_evaluation_cache_hit(stdout, stderr)
    if cache_hit:
        return {
            "fresh": False,
            "cache_hit": True,
            "invalid_reason": "EVALUATION_CACHE_HIT",
            "patch_verified": False,
        }

    report_path = pathlib.Path(report_path) if report_path else None
    if report_path is None or not report_path.exists():
        return {
            "fresh": False,
            "cache_hit": False,
            "invalid_reason": "EVALUATION_INVALID",
            "patch_verified": False,
        }

    if run_id not in report_path.name:
        return {
            "fresh": False,
            "cache_hit": False,
            "invalid_reason": "EVALUATION_INVALID",
            "patch_verified": False,
        }

    report_mtime = report_path.stat().st_mtime
    if report_mtime < invocation_started_at - 1.0:
        return {
            "fresh": False,
            "cache_hit": False,
            "invalid_reason": "EVALUATION_INVALID",
            "patch_verified": False,
        }

    patch_verified = False
    patch_log_path = pathlib.Path(patch_log_path) if patch_log_path else None
    if patch_log_path and patch_log_path.exists():
        patch_verified = _patch_digest(patch_log_path.read_text()) == _patch_digest(patch)
    else:
        combined = f"{stdout or ''}\n{stderr or ''}"
        if "No instances to run." in combined and "Running " not in combined:
            return {
                "fresh": False,
                "cache_hit": False,
                "invalid_reason": "EVALUATION_INVALID",
                "patch_verified": False,
            }
        patch_verified = bool((patch or "").strip())

    if not patch_verified:
        return {
            "fresh": False,
            "cache_hit": False,
            "invalid_reason": "EVALUATION_INVALID",
            "patch_verified": False,
        }

    try:
        report = json.loads(report_path.read_text())
    except json.JSONDecodeError:
        return {
            "fresh": False,
            "cache_hit": False,
            "invalid_reason": "EVALUATION_INVALID",
            "patch_verified": False,
        }

    if instance_id not in report.get("submitted_ids", []):
        return {
            "fresh": False,
            "cache_hit": False,
            "invalid_reason": "EVALUATION_INVALID",
            "patch_verified": False,
        }

    return {
        "fresh": True,
        "cache_hit": False,
        "invalid_reason": None,
        "patch_verified": True,
    }


def evaluation_failure_class(eval_meta):
    if eval_meta.get("evaluation_fresh"):
        return None
    if eval_meta.get("evaluation_cache_hit"):
        return "EVALUATION_CACHE_HIT"
    return eval_meta.get("evaluation_invalid_reason") or "EVALUATION_INVALID"


def evaluation_result_fields(eval_meta):
    return {
        "evaluation_run_id": eval_meta["evaluation_run_id"],
        "evaluation_fresh": eval_meta["evaluation_fresh"],
        "evaluation_cache_hit": eval_meta["evaluation_cache_hit"],
    }


def full_eval(iid, patch, arm, attempt=1, experiment_id=None):
    experiment_id = experiment_id or get_evaluation_experiment_id()
    run_id = build_evaluation_run_id(experiment_id, arm, attempt, iid)
    work_dir = pathlib.Path(tempfile.mkdtemp(prefix=f"phase2d-eval-{arm}-a{attempt}-"))
    preds_path = work_dir / "pred.jsonl"
    report_path = evaluation_report_path(work_dir, MODEL, run_id)
    model_slug = MODEL.replace("/", "__")
    invocation_started_at = time.time()

    preds = [{"instance_id": iid, "model_patch": patch, "model_name_or_path": MODEL}]
    with open(preds_path, "w") as f:
        for p in preds:
            f.write(json.dumps(p) + "\n")

    cmd = [
        SWE, "eval", DATASET,
        "-p", str(preds_path),
        "--run-id", run_id,
        "-i", iid,
        "--timeout", "300",
        "--report-dir", str(work_dir),
    ]
    start = time.monotonic()
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=600, cwd=str(work_dir))
    latency = time.monotonic() - start

    patch_log_path = work_dir / "logs" / "run_evaluation" / run_id / model_slug / iid / "patch.diff"
    validation = validate_evaluation_freshness(
        stdout=r.stdout,
        stderr=r.stderr,
        report_path=report_path,
        run_id=run_id,
        instance_id=iid,
        patch=patch,
        patch_log_path=patch_log_path,
        invocation_started_at=invocation_started_at,
    )

    report = None
    resolved = False
    infra = False
    if validation["fresh"] and report_path.exists():
        try:
            report = json.loads(report_path.read_text())
            resolved = iid in report.get("resolved_ids", [])
            infra = iid in report.get("infra_failure_ids", [])
        except json.JSONDecodeError:
            validation = {
                **validation,
                "fresh": False,
                "invalid_reason": "EVALUATION_INVALID",
            }

    if not validation["fresh"]:
        resolved = False
        infra = False

    eval_meta = {
        "evaluation_run_id": run_id,
        "evaluation_fresh": validation["fresh"],
        "evaluation_cache_hit": validation["cache_hit"],
    }
    if validation.get("invalid_reason"):
        eval_meta["evaluation_invalid_reason"] = validation["invalid_reason"]

    eval_log = (r.stdout or "")[-4000:] + (r.stderr or "")[-2000:]
    shutil.rmtree(work_dir, ignore_errors=True)
    return resolved, infra, report, eval_log, latency, eval_meta


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
                patch, usage, transcript, pi_lat, err, timed_out, provider_failure, raw_patch = pi_patch(ps, repo, iid)
                write_transcript(OUT_ROOT / arm / f"transcript_{iid}.txt", patch, transcript, err, provider_failure, raw_patch=raw_patch)
                ver_start = time.monotonic()
                if provider_failure:
                    resolved, infra, report, eval_log, ver_lat = False, False, None, "", 0.0
                    eval_meta = {
                        "evaluation_run_id": None,
                        "evaluation_fresh": False,
                        "evaluation_cache_hit": False,
                    }
                else:
                    resolved, infra, report, eval_log, ver_lat, eval_meta = full_eval(iid, patch, arm, attempt=1)
                if report:
                    pathlib.Path(OUT_ROOT / arm / "logs" / f"{iid}.eval.json").write_text(json.dumps(report, indent=2))
                pathlib.Path(OUT_ROOT / arm / "logs" / f"{iid}.log").write_text(eval_log)
                total_lat = time.monotonic() - task_start
                if provider_failure:
                    fc = provider_failure["failure_class"]
                elif eval_fc := evaluation_failure_class(eval_meta):
                    fc = eval_fc
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
                    **evaluation_result_fields(eval_meta),
                    **patch_normalization_fields(raw_patch),
                }
                results[arm].append(rec)
                (OUT_ROOT / arm / "result.json").write_text(json.dumps(results[arm], indent=2))
                print(f"  baseline resolved={resolved} tokens={usage['totalTokens']} lat={total_lat:.1f}s fc={fc}")
            elif arm == "current":
                attempts = 0
                total_usage = dict(ZERO_USAGE)
                patches = []
                raw_patches = []
                transcripts = []
                resolved = False
                infra = False
                feedback = None
                ver_total = 0
                pi_total = 0
                provider_failure = None
                failure_class = "NONE"
                eval_meta = {
                    "evaluation_run_id": None,
                    "evaluation_fresh": False,
                    "evaluation_cache_hit": False,
                }
                for attempt in range(1, 4):
                    attempts = attempt
                    patch, usage, transcript, pi_lat, err, timed_out, provider_failure, raw_patch = pi_patch(ps, repo, iid, feedback=feedback)
                    patches.append(patch)
                    raw_patches.append(raw_patch)
                    transcripts.append(transcript)
                    pi_total += pi_lat
                    if provider_failure:
                        failure_class = provider_failure["failure_class"]
                        break
                    for k in total_usage:
                        total_usage[k] += usage.get(k, 0)
                    resolved, infra, report, eval_log, ver_lat, eval_meta = full_eval(iid, patch, arm, attempt=attempt)
                    ver_total += ver_lat
                    if report:
                        pathlib.Path(OUT_ROOT / arm / "logs" / f"{iid}.a{attempt}.eval.json").write_text(json.dumps(report, indent=2))
                    pathlib.Path(OUT_ROOT / arm / "logs" / f"{iid}.a{attempt}.log").write_text(eval_log)
                    if eval_fc := evaluation_failure_class(eval_meta):
                        failure_class = eval_fc
                        break
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
                        for i, p, t in zip(range(len(raw_patches)), raw_patches, transcripts)
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
                    **(evaluation_result_fields(eval_meta) if not provider_failure else {
                        "evaluation_run_id": None,
                        "evaluation_fresh": False,
                        "evaluation_cache_hit": False,
                    }),
                    **(patch_normalization_fields(raw_patches[-1]) if raw_patches else {"patch_normalized": False}),
                }
                results[arm].append(rec)
                (OUT_ROOT / arm / "result.json").write_text(json.dumps(results[arm], indent=2))
                print(f"  current resolved={resolved} attempts={attempts} recovered={recovered} tokens={total_usage['totalTokens']} lat={total_lat:.1f}s fc={fc}")
            else:
                attempts = 0
                total_usage = dict(ZERO_USAGE)
                patches = []
                raw_patches = []
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
                eval_meta = {
                    "evaluation_run_id": None,
                    "evaluation_fresh": False,
                    "evaluation_cache_hit": False,
                }
                fail_to_pass = id2inst[iid]["FAIL_TO_PASS"]
                if isinstance(fail_to_pass, str):
                    fail_to_pass = json.loads(fail_to_pass)
                for attempt in range(1, 4):
                    attempts = attempt
                    if attempt == 1:
                        patch, usage, transcript, pi_lat, err, timed_out, provider_failure, raw_patch = pi_patch(ps, repo, iid, feedback=None)
                    else:
                        fb = (
                            f"Failing test: {failing_test}\nAssertion: {assertion}\n"
                            f"Traceback:\n{traceback}\nPrevious diff failed. Fix targeted file."
                        )
                        patch, usage, transcript, pi_lat, err, timed_out, provider_failure, raw_patch = pi_patch(
                            ps, repo, iid, feedback=fb, targeted=True, failing_test=failing_test,
                        )
                    patches.append(patch)
                    raw_patches.append(raw_patch)
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
                    chk, apply_log = apply_check_in_testbed(iid, patch)
                    ver_total += time.monotonic() - start_check
                    pathlib.Path(OUT_ROOT / arm / "logs" / f"{iid}.a{attempt}.apply_check.log").write_text(apply_log or "")
                    if chk:
                        failure_class = chk
                        ver_layer = "apply_check"
                        failing_test = chk
                        assertion = "patch does not apply in testbed"
                        traceback = (apply_log or "git apply --check failed")[-2000:]
                        if chk == "INFRA_FAILURE":
                            infra = True
                            break
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
                    resolved, infra, report, eval_log, ver_lat, eval_meta = full_eval(iid, patch, arm, attempt=attempt)
                    ver_total += ver_lat
                    if report:
                        pathlib.Path(OUT_ROOT / arm / "logs" / f"{iid}.a{attempt}.eval.json").write_text(json.dumps(report, indent=2))
                    pathlib.Path(OUT_ROOT / arm / "logs" / f"{iid}.a{attempt}.log").write_text(eval_log)
                    if eval_fc := evaluation_failure_class(eval_meta):
                        failure_class = eval_fc
                        ver_layer = "regression"
                        resolved = False
                        break
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
                        for i, p, t in zip(range(len(raw_patches)), raw_patches, transcripts)
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
                    **evaluation_result_fields(eval_meta),
                    **(patch_normalization_fields(raw_patches[-1]) if raw_patches else {"patch_normalized": False}),
                }
                results[arm].append(rec)
                (OUT_ROOT / arm / "result.json").write_text(json.dumps(results[arm], indent=2))
                print(f"  layered resolved={resolved} attempts={attempts} recovered={recovered} fc={failure_class} tokens={total_usage['totalTokens']} lat={total_lat:.1f}s")
    agg = {"manifest_hash": MANIFEST_HASH, "baseline": results["baseline"], "current": results["current"], "layered": results["layered"]}
    (OUT_ROOT / "results.json").write_text(json.dumps(agg, indent=2))
    print("\nDone")


def smoke_pi():
    """Minimal live pi invocation to verify provider connectivity."""
    patch, usage, transcript, latency, err, timed_out, provider_failure, _raw_patch = pi_patch(
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
    if len(sys.argv) > 1 and sys.argv[1] == "final-one-task":
        configure_final_one_task_run()
    run()
