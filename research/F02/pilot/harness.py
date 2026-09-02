#!/usr/bin/env python3
"""
Reproducible pilot harness: baseline vs candidate verification-first.
Same model (muse-spark-1.2-contributor-free) — simulated by applying pre-written fixes.
Logs wall-clock, approx tokens (chars/4), pass/fail, regression, recovery.
"""
import os, json, time, shutil, subprocess, pathlib

REPO = pathlib.Path(__file__).parent / "repo"
FIXES = pathlib.Path(__file__).parent / "fixes"
TASKS = json.loads((pathlib.Path(__file__).parent / "tasks.json").read_text())

# Approx tokens: chars/4
def approx_tokens(text: str) -> int:
    return len(text) // 4

def run_gate(workdir: pathlib.Path):
    r = subprocess.run(["python3", "run_tests.py"], cwd=workdir, capture_output=True, text=True)
    return r.returncode == 0, r.stdout + r.stderr, r.returncode

def apply_fix(src_path: pathlib.Path, dst_path: pathlib.Path):
    shutil.copy(src_path, dst_path)

def task_test_names(task_id):
    return {
        "T01": "test_T01",
        "T02": "test_T02",
        "T03": "test_T03",
        "T04": "test_T04",
        "T05": "test_T05",
    }[task_id]

def run_arm(arm: str):
    print(f"\n=== ARM: {arm} ===")
    results = []
    # fresh base commit hash
    base_sha = subprocess.check_output(["git","rev-parse","HEAD"], cwd=REPO, text=True).strip()
    print(f"base SHA: {base_sha}")

    # For candidate, demonstrate worktree isolation
    worktrees_root = pathlib.Path(__file__).parent / "worktrees"
    worktrees_root.mkdir(exist_ok=True)

    for task in TASKS:
        tid = task["id"]
        fname = task["file"]
        spec = task["spec"]
        print(f"\n-- {tid} {fname} [{arm}] --")

        # setup isolated copy: for baseline use tmp dir, for candidate use git worktree
        if arm == "candidate":
            wt = worktrees_root / f"{tid}"
            # cleanup prior
            subprocess.run(["git","worktree","remove","--force",str(wt)], cwd=REPO, capture_output=True)
            subprocess.run(["git","worktree","add",str(wt), base_sha], cwd=REPO, capture_output=True)
            workdir = wt
        else:
            # baseline: use repo directly but stash after each task (simpler: copy repo to temp)
            import tempfile
            workdir = pathlib.Path(tempfile.mkdtemp(prefix=f"baseline_{tid}_"))
            # copy repo files (excluding .git)
            for p in REPO.iterdir():
                if p.name in (".git","__pycache__","worktrees"):
                    continue
                if p.is_dir():
                    shutil.copytree(p, workdir / p.name, dirs_exist_ok=True)
                else:
                    shutil.copy(p, workdir / p.name)

        # measure
        start = time.monotonic()

        # Simulate model prompts and tokens
        # Baseline: one prompt (spec + buggy source)
        buggy_src = (REPO / fname).read_text()
        if arm == "baseline":
            # choose fix: for T03 use flawed to simulate single-shot miss
            if tid == "T03":
                fix_src = FIXES / "retry_baseline_flawed.py"
                prompt = f"SPEC: {spec}\nBUGGY:\n{buggy_src}\nFix {fname}"
                patch = fix_src.read_text()
            elif tid == "T01":
                fix_src = FIXES / "dates_fixed.py"
                prompt = f"SPEC: {spec}\nBUGGY:\n{buggy_src}"
                patch = fix_src.read_text()
            elif tid == "T02":
                fix_src = FIXES / "calc_fixed.py"
                prompt = f"SPEC: {spec}\nBUGGY:\n{buggy_src}"
                patch = fix_src.read_text()
            elif tid == "T04":
                fix_src = FIXES / "bank_fixed.py"
                prompt = f"SPEC: {spec}\nBUGGY:\n{buggy_src}"
                patch = fix_src.read_text()
            elif tid == "T05":
                fix_src = FIXES / "freq_fixed.py"
                prompt = f"SPEC: {spec}\nBUGGY:\n{buggy_src}"
                patch = fix_src.read_text()
            else:
                patch = ""

            dst = workdir / fname
            apply_fix(fix_src, dst)

            tokens = approx_tokens(prompt + patch)
            # single gate run
            passed, output, code = run_gate(workdir)
            latency = time.monotonic() - start

            # parse per-task pass: check if its test passed (approx via output)
            task_pass = f"PASS {task_test_names(tid)}" in output
            # regression: check test_regression_simple
            regression_pass = "PASS test_regression_simple" in output

            print(f"  tokens≈{tokens} latency={latency:.2f}s pass={task_pass} regression={regression_pass}")
            if not passed:
                print(output[-600:])

            results.append({
                "task": tid, "arm": arm, "tokens": tokens, "latency_s": round(latency,3),
                "task_pass": task_pass, "all_pass": passed, "regression_pass": regression_pass,
                "output": output, "retries": 0, "recovery": False
            })

        else:  # candidate: spec→tests→gate→retry
            # Phase 1: spec→tests (approx prompt)
            spec_tests_prompt = f"Derive verification tests from SPEC: {spec}"
            # synthetic spec tests (not graded) — we just log prompt length
            spec_tests = f"# tests for {tid} derived from spec\n# (candidate phase 1 artifact)"
            t1_tokens = approx_tokens(spec_tests_prompt + spec_tests)

            # Phase 2: initial patch — same flawed start for T03 to demonstrate recovery
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
            buggy_src = (REPO / fname).read_text()
            prompt2 = f"SPEC: {spec}\nSPEC_TESTS: {spec_tests}\nBUGGY:\n{buggy_src}"
            patch2 = fix_src_initial.read_text()
            apply_fix(fix_src_initial, workdir / fname)
            t2_tokens = approx_tokens(prompt2 + patch2)

            total_tokens = t1_tokens + t2_tokens
            attempts = 1
            passed, output, code = run_gate(workdir)
            task_pass = f"PASS {task_test_names(tid)}" in output
            regression_pass = "PASS test_regression_simple" in output

            # parse→feedback loop (max 2 retries)
            retries = 0
            recovery = False
            initial_pass = task_pass
            while not task_pass and retries < 2:
                retries += 1
                attempts += 1
                # feedback is parsed failure
                feedback = output[-800:]  # last 800 chars as parsed error
                # for T03, switch to correct fix on retry
                if tid == "T03":
                    fix_src_retry = FIXES / "retry_fixed.py"
                    apply_fix(fix_src_retry, workdir / fname)
                    feedback_prompt = f"Fix given failure:\n{feedback}\nSpec: {spec}"
                    patch_retry = fix_src_retry.read_text()
                    total_tokens += approx_tokens(feedback_prompt + patch_retry)
                else:
                    # other tasks would retry with same correct fix (no-op here as they already pass)
                    break
                passed, output, code = run_gate(workdir)
                task_pass = f"PASS {task_test_names(tid)}" in output
                regression_pass = "PASS test_regression_simple" in output

            if not initial_pass and task_pass:
                recovery = True

            latency = time.monotonic() - start
            print(f"  tokens≈{total_tokens} latency={latency:.2f}s pass={task_pass} retries={retries} recovery={recovery} regression={regression_pass}")
            if not passed:
                print(output[-600:])

            results.append({
                "task": tid, "arm": arm, "tokens": total_tokens, "latency_s": round(latency,3),
                "task_pass": task_pass, "all_pass": passed, "regression_pass": regression_pass,
                "output": output, "retries": retries, "recovery": recovery
            })

        # cleanup candidate worktree
        if arm == "candidate":
            subprocess.run(["git","worktree","remove","--force",str(workdir)], cwd=REPO, capture_output=True)

    # summarize
    out_path = pathlib.Path(__file__).parent / f"results_{arm}.json"
    out_path.write_text(json.dumps(results, indent=2))
    print(f"\nWrote {out_path}")
    # quick table
    total = len(results)
    passed_n = sum(1 for r in results if r["task_pass"])
    print(f"{arm}: {passed_n}/{total} task-pass ({passed_n/total*100:.0f}%)")
    median_tokens = sorted(r["tokens"] for r in results)[total//2]
    median_lat = sorted(r["latency_s"] for r in results)[total//2]
    print(f"median tokens≈{median_tokens} median latency={median_lat}s")
    return results

if __name__ == "__main__":
    import sys
    arm = sys.argv[1] if len(sys.argv)>1 else "baseline"
    if arm not in ("baseline","candidate"):
        print("usage: harness.py [baseline|candidate|both]")
        sys.exit(1)
    if arm == "both":
        run_arm("baseline")
        run_arm("candidate")
    else:
        run_arm(arm)
