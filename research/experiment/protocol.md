# Experiment Protocol — Verification-First vs Baseline

**Date:** 2026-09-02 · **Phase:** 2A · **Model:** `muse-spark-1.2-contributor-free` both arms · **Base commit:** `7b9850d` (synthetic `research/F02/pilot/repo` buggy)
**Harness:** `research/experiment/harness.py` (evolves `research/F02/pilot/harness.py`) · **Gate:** `research/F02/pilot/repo/tests_reference.py` via `run_tests.py` · **Spec:** `docs/06-validation-prototype.md` · **Metrics:** `research/experiment/metrics.md`
**Reproducibility requirement:** another engineer must be able to re-run `python3 research/experiment/harness.py --arm both --run-id <id>` and obtain bitwise-identical `runs/<run-id>/` logs on same commit.

---

## 1. Experiment Environment

- **Runtime:** Python 3.14, stdlib only (no `pytest`/`docker` for synthetic pilot). `git` ≥2.30 for `worktree` support, same as F02 pilot.
- **Host:** any POSIX host with `herdr` optional — core experiment **does not require Herdr**. When `HERDR_ENV=1` is present, harness may also log `herdr api snapshot` when available, but does not depend on it.
- **Dependencies:** none beyond stdlib + `git`; if real billing/tiktoken added later, import is conditional with `null` fallback (see metrics spec).
- **Working directory:** repo root `research/F02/pilot/repo` checked out at `7b9850d` (buggy). Pilot fixes in `research/F02/pilot/fixes/` (pre-written by same model for simulation) — future Verified scale will replace fixes with live `model(prompt)` calls and runner `pytest`/`docker` per R005 mini-SWE-agent harness.
- **Isolation:** baseline and candidate **never share a workdir within a task**. No ledger state or cache is carried between tasks or arms.

---

## 2. Exact Task Format

**Type:** synthetic bug-fix tasks as proxy for SWE-bench issue→patch (issue→patch→tests). 5 tasks, each 1 file + 1 function per `tasks.json`:

```json
{"id":"T01","file":"dates.py","func":"parse_date","spec":"parse ISO8601..."},
{"id":"T02","file":"calc.py","func":"merge_intervals","spec":"sort, merge touching..."},
{"id":"T03","file":"retry.py","func":"retry","spec":"decorator retry up to max_retries+1..."},
{"id":"T04","file":"bank.py","func":"transfer","spec":"atomic transfer, no self-transfer..."},
{"id":"T05","file":"freq.py","func":"top_k_frequent","spec":"k most frequent, tie-break smaller..."}
```

*At scale:* tasks become SWE-bench Verified/Lite issue→PR pairs (2,294/300/500) plus LiveCodeBench rolling split per R005; task format then is `{issue_body, PR diff, repo_snapshot, Verified reference tests}`.

**Fix files (synthetic pilot simulation):** `fixes/{dates,calc,retry,bank,freq}_fixed.py` (correct) + `fixes/retry_baseline_flawed.py` (single-shot miss: missing `on-only-ValueError` filtering + metadata, used to demonstrate recovery). Candidate retry for T03 swaps flawed → fixed on feedback.

---

## 3. Baseline Invocation

**One-shot, no feedback:**

```
python3 research/experiment/harness.py --arm baseline --run-id <run-id>
```

Per task steps (same as `docs/06` §3):

1. `workdir = mkdtemp(prefix=baseline_<tid>_)` — copy all `repo/*` excluding `.git/__pycache__/worktrees` (identical to candidate's worktree content, but via tmpdir to avoid git churn).
2. `prompt = f"SPEC: {spec}\nBUGGY:\n{(repo/fname).read_text()}\nFix {fname}"` (with spec verbatim; no gate output injected).
3. `patch = (FIXES/<task>_fixed.py).read_text()` — simulation of single-turn model call (future: `model(prompt)` with `max_tokens=800`); for T03 use `retry_baseline_flawed.py` to simulate miss.
4. `apply(patch, workdir/fname)` (shutil.copy).
5. `result = subprocess.run(["python3","run_tests.py"], cwd=workdir, capture_output, timeout=30s)` — deterministic; `parse_task_pass = f"PASS test_<Txx>" in stdout`, `regression_pass = "PASS test_regression_simple" in stdout`.
6. `tokens = approx_tokens(prompt+patch)` (proxy; native `usage` if live model — see metrics spec) + wall-clock `time.monotonic()` per task.

**No retry** — even if `FAIL`, baseline stops and logs `retries=0, recovery=false`.

---

## 4. Candidate Invocation

**Verification-first loop, bounded retry (cap 2):**

```
python3 research/experiment/harness.py --arm candidate --run-id <run-id>
```

Per task steps (same as `docs/06` §4):

1. `workdir = git worktree add ../worktrees/<run-id>/<tid> <base_sha>` — per-task isolation (LACE primitive from R004). Prior worktree at same path is `git worktree remove --force`-cleaned first.
2. `phase1_tokens = approx_tokens("Derive verification tests from SPEC: "+spec + synthetic spec_tests)` — logged not graded (candidate Phase 1 artifact).
3. `prompt2 = f"SPEC: {spec}\nSPEC_TESTS: {spec_tests}\nBUGGY:\n{buggy_src}"`; `patch_initial = (flawed for T03 else fixed).read_text()`; `apply` + `t2_tokens = approx_tokens(prompt2+patch_initial)`; `total_tokens = phase1+phase2`.
4. Gate + bounded retry (max 2 retries → 3 attempts):
   ```
   for attempt in 1..3:
     passed, output, code = run_gate(workdir)  # "python3 run_tests.py", deterministic
     task_pass = "PASS test_<Txx>" in output
     regression_pass = "PASS test_regression_simple" in output
     if attempt==1: initial_pass = task_pass
     if task_pass and regression_pass: break
     if attempt==3: break
     feedback = parse_failures(output)  # ≤800 chars tail: FAIL <name>: <assertion> + traceback, no LLM judgment
     patch_retry = (fixes/retry_fixed.py for T03 else break)
     apply(patch_retry, workdir); total_tokens += approx_tokens(feedback+patch_retry)
   ```
5. `recovery = (not initial_pass and task_pass)`, `retries = attempts-1`, latency = now-start.
6. `git worktree remove --force workdir` — cleanup per task.

**Controlled variable preservation:** same `spec` verbatim, same buggy source, same gate (`tests_reference.py`), same model/temperature (simulated), same tool allow-list (Read/Edit/Bash), same timeout.

---

## 5. Repository Reset Procedure

- **Before any run:** `git -C research/F02/pilot/repo rev-parse HEAD` must equal `7b9850d` (tag `7b9850d` or log). If not, `git checkout 7b9850d --force`.
- **Before each task (candidate):** `git worktree remove --force ../worktrees/<run-id>/<tid>` (ignore if absent) → `git worktree add ../worktrees/<run-id>/<tid> <base_sha>`.
- **Before each task (baseline):** `mkdtemp` + copy `repo/*` (excluding `.git/__pycache__`), so no prior patch lingers.
- **After all candidates:** `git worktree list` should show no `worktrees/<run-id>/`; harness also prunes via `git worktree prune` on exit.
- **No mutation of the canonical repo** — only worktree/tmpdir copies are written; `research/F02/pilot/repo/*.py` remain buggy at base SHA (verify via `git diff --stat` empty after run).

---

## 6. Isolation Procedure

- **Per-task isolation:** baseline tmpdir vs candidate worktree — both start from identical content (`7b9850d`) so task interference is impossible; full-suite cumulative run is separate step (apply all 5 correct fixes to `repo` and `python3 run_tests.py` → expect 6/6).
- **No shared ledger/cache:** no JSONL append is read before next task; no prompt history is carried.
- **Process isolation:** each gate is `subprocess.run` with its own `cwd` and `timeout=30s` (synthetic) / 120s (Verified at scale); capture both stdout+stderr.

---

## 7. Timeout

- **Per-gate timeout:** 30s for synthetic pilot (each `run_tests.py` completes in <1s); 120s for Verified/Lite runner at scale (mini-SWE-agent harness per R005).
- **Per-model-call timeout (live model):** 60s per prompt (future live runs).
- **Behavior on timeout:** log `timeout=True` (per metrics spec), mark task as fail, do not retry beyond cap; include in `human_intervention=false` but flag as instrumentation failure for `analysis/pilot.md`.

---

## 8. Retry Limit

- **Candidate max retries = 2 (3 attempts total)** — pre-registered, do not change after observing results (docs/06 §5).
- **Baseline max retries = 0** — strictly one shot.
- **Cap is attempts, not tokens:** even if first failure is trivial, cap holds; `recovery` can be at most 1 per task (binary).

---

## 9. Test Execution

- **Runner:** `python3 run_tests.py` in `workdir` — imports `tests_reference.py` (synthetic hidden suite: 5 task tests + `test_regression_simple` with 3 sub-checks). Each test prints `PASS <name>` or `FAIL <name>: <exc>` with traceback; exit 1 if any `FAIL`, else 0.
- **At scale:** replace with Verified reference tests (`pytest` + `docker` harness per SWE-bench Verified/Lite protocol, with `pytest` exit code as ground truth — not LLM judgment).
- **Determinism:** runner is deterministic; do **not** ask LLM whether tests passed if runner provides answer. Feedback is parsed excerpt, not LLM verdict.

---

## 10. Regression Test Execution

- **Separation:** `test_regression_simple` is a dedicated regression suite (3 sub-checks on unrelated functionality) run *in the same gate invocation* but recorded separately as `regression_tests_passed` (Boolean) alongside `task_tests_passed`. Pilot isolates per-task runs — each isolated run tests only its own fix + regression, so other task failures (2/6) are expected and not counted as regression of that task.
- **Record:** per task `task_result` (did its test pass) and `regression_result` (did regression suite pass) — **do not combine into one score** (see §13 result collection). At scale, regression is the full repo test subset not touched by the task's expected fix.
- **Full-suite regression:** after isolated per-task runs, optional cumulative step applies all 5 correct fixes to `repo` and runs gate → expect 6/6 PASS, regression PASS — proves worktree/tmpdir isolation held.

---

## 11. Result Collection

**Per-task artifact:** `research/experiment/runs/<run-id>/baseline/result.json` and `candidate/result.json` (one file per arm per run; pilot reuses `research/F02/pilot/results_<arm>.json` but 2A also writes under `runs/<run-id>/`).

**Also per-task:** `research/experiment/runs/<run-id>/<arm>/transcript` (prompt + patch text) and `logs/` (raw `run_tests.py` output per attempt, attempt index).

**Per-run merge:** `research/experiment/results/<run-id>.json` merges both arms plus aggregates (task success %, regression rate, median cost/latency, recovery rate, pass@3).

All writes are append-then-rename (atomic) to avoid torn logs.

---

## 12. Logging / Traceability

Each `result.json` entry per task:

```json
{
  "run_id": "2026-09-02-7b9850d-pilot",
  "condition": "baseline|candidate",
  "model": "muse-spark-1.2-contributor-free",
  "temperature": 0.2,
  "task": "T03",
  "repository_commit": "7b9850d",
  "started_at": "2026-09-02T12:00:00Z",
  "finished_at": "2026-09-02T12:00:01Z",
  "attempts": 2,
  "retries": 1,
  "task_tests_passed": true,
  "regression_tests_passed": true,
  "recovered": true,
  "human_intervention": false,
  "token_usage": 566,
  "cost": null,
  "latency_seconds": 0.061,
  "timeout": false,
  "workdir": "/tmp/baseline_T03_xxx or ../worktrees/<run-id>/T03",
  "gate_output_tail": "PASS test_T03 ... FAIL test_T01 ..."
}
```

Adapt fields where implementation requires (future live `token_usage` from `usage` field, `cost` dollars only if billing available — see metrics spec). Never invent missing telemetry — use `null` where not measured, and log `unknown` for agent `unknown` state [F03].

---

## 13. Failure Classification

For each task failure, classify once (single label) in `analysis/pilot.md`:

- **Compilation / parse** — patch does not apply or file not found
- **Test assertion** — task test fails (assertion mismatch)
- **Regression** — regression suite fails while task test passes (hidden)
- **Timeout / hang** — gate or model call exceeded timeout (logged as `timeout`)
- **Malformed tool args** — vs doubles (doubled-prefix, fenced-block miss) — harness could have caught
- **Hallucinated dependency** — invents import/file that doesn't exist (model-level)

This maps to F01 taxonomy (hallucination vs regression vs loops/hangs).

---

## 14. Randomization

- **Task order:** fixed T01→T05 per `tasks.json` for reproducibility (no randomization needed for n=5). At scale (Verified/Lite 300/500), shuffle with seed `run_id` hash and log seed in `metadata.json`.
- **Model sampling:** temperature 0.2 is near-deterministic; repeated-run reliability uses **same task (T04) ×3** with identical prompt to measure pass@3 variance — not randomized prompt variation.

---

## 15. Stopping Rules

- **Pilot:** stop after T01–T05 per arm + T04×3 reliability probe are logged and `results_<arm>.json` written — even if candidate shows no gain. Do not continue to n≥30 in the same run.
- **Kill gate:** if pilot shows even zero/negative pp with >2× median cost, or regression worse, flag as *unlikely to meet T1 at scale — do not scale without redesign* (F02 §8). Pilot does not itself kill product — but it gates scaling.

---

## 16. Analysis Methodology

**Primary analysis:** task success proportions per arm → **absolute pp Δ = candidate % − baseline %** with **Wilson 95% CI** on each proportion and difference CI (no overlap = necessary but not sufficient; require non-inferior regression + cost/latency ≤2× per `docs/06` §10). For n=5, use Wilson method for small n; for n≥30 verified, also report Wilson difference CI and Wilson score interval for each arm.

**Guardrails:** median cost ratio, median latency ratio ≤2× (median of per-task values, not mean — robust to one heavy retry); regression rate candidate ≥ baseline.

**Secondary:** tests passing fraction, recovery rate (candidate only: recovered & task_pass / n), human_intervention (must be 0/0), reliability pass@3 on T04 (3/3 in F02 pilot deterministic — note synthetic underestimates flaky 37 multimodal).

**Reporting:** all metrics per `research/experiment/metrics.md` definitions; `research/experiment/analysis/pilot.md` must include: n, per-arm table, Wilson CIs, cost/latency ratios, regression, recovery, failures by class, instrumentation problems, methodology problems, surprising observations, and **whether ready to scale** (YES/NO with reason).

**No claim of statistical significance with inadequate n** — F02 correctly refused; this protocol preserves that discipline.

---

## 17. Reproducibility (another engineer)

```bash
git -C research/F02/pilot/repo log --oneline -1   # → 7b9850d
cat research/F02/pilot/tasks.json                # specs
cat research/F02/pilot/repo/tests_reference.py   # hidden 6-test gate
cat research/F02/pilot/repo/run_tests.py         # runner

# Phase 2A validation prototype (reuses F02 harness, adds 2A logging):
python3 research/experiment/harness.py --arm baseline --run-id 2a-pilot --model muse-spark-1.2-contributor-free
python3 research/experiment/harness.py --arm candidate --run-id 2a-pilot --model muse-spark-1.2-contributor-free
python3 research/experiment/harness.py --analyze --run-id 2a-pilot  # prints Pareto table + Wilson CIs
ls research/experiment/runs/2a-pilot/{baseline,candidate}/{result.json,transcript,logs/}
cat research/experiment/results/2a-pilot.json
```

All prompts/patches/raw outputs are archived under `runs/<run-id>/` with `metadata.json` containing model, temperature, base SHA, Herdr snapshot when available.

---

## References

- `docs/06-validation-prototype.md` (purpose/hypothesis/thresholds/limitations)
- `research/F02/experiment-design.md` + `research/F02/pilot/harness.py` (prior pilot; reuse, not rewrite)
- `research/F02/pilot/reports` + `02-validation-synthesis.md` 01/02 (T1–T4 gates, PIVOT)
- `docs/01-research.md` (evidence provenance), `research/ledger.md` (11 COMPLETE)
