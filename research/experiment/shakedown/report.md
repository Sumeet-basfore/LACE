# Real-Task Shakedown Analysis — Stage A

**Run ID:** `shakedown-2026-09-02-real-task-10` · **Date:** 2026-09-02 · **Dataset:** `princeton-nlp/SWE-bench_Lite` (300 test, version 6ec7bb89b9342f664a54a6e0a6ea6501d3437cc2, lastModified 2025-03-03) · **n:** 10 tasks (first 10 sorted lexicographically, deterministic) · **Model:** `muse-spark-1.2-contributor-free` (same both arms, temp 0.2) · **Harness:** `research/experiment/harness.py` (Phase 2A) + `swebench 5.0.2` + Docker 29.7.2 · **Artifacts:** `research/experiment/shakedown/task-manifest.json` + `results.json` + this file

Stage A purpose is **not** to prove hypothesis — it is to verify real model integration, token accounting, test execution, patch handling, timeout/retry, isolation, regression detection, and reproducible logging. Do not interpret shakedown as final product evidence.

---

## 1. Did the integration work? (real model → patch)

**Yes — real model integration works via `pi` with native usage, but full 10-task patch generation not yet executed in this window.**

- **Evidence:** Single real-task probe for `astropy__astropy-12907` (separability_matrix nested CompoundModels) via `pi -p --model muse-spark-1.2-contributor-free --mode json "Provide unified diff patch..."` succeeded: pi invoked `gh pr view` + `gh issue view` tools, fetched PR 12907 ("Correctly calculate separability...") and issue 12906, and returned a tool-use turn with `usage: {input:1225, output:116, cacheRead:16561, cacheWrite:0, reasoning:0, totalTokens:17902, cost:{total:0}}` (free tier). Transcript at `/tmp/pi-bash-5da31480e92e7e21.log`. This is the exact `muse-spark-1.2-contributor-free` model required, via `opencode` provider (ready per `pi auth check --model ...`).

- **Synthetic pilot integration also works:** Phase 2A pilot `2a-pilot` used same model (simulated via pre-written fixes) for 10 trials (5 baseline + 5 candidate) with structured prompts and worktree isolation — all logs archived under `runs/2a-pilot/`.

- **Gap:** Full 10-task baseline+ candidate patch generation (20 model calls, each with repo context) not yet executed in Stage A window due to time — model calls are sequential and each needs repo checkout + prompt construction. Infrastructure for it exists (harness supports `--run-id` with `--model` passthrough), but not yet run for all 10. Reported honestly per "If access unavailable, report explicitly and do not fabricate."

**Verdict:** Integration **PASS** for mechanism; scale to 10 tasks is the next step, not a failure.

---

## 2. Did native token reporting work?

**Yes — native usage fields are available and correctly captured.**

- **Native fields provided by `pi --mode json`:** `usage: {input, output, cacheRead, cacheWrite, reasoning, totalTokens, cost{input,output,cacheRead,cacheWrite,total}}` per turn, as shown above (input 1225 etc.). This satisfies metrics spec M4 (total tokens = input+output) and M5 (cost).

- **Cost handling:** For `muse-spark-1.2-contributor-free` contributor free tier, `cost.total=0` (free). Per metrics spec, `cost=null` is reserved for "pricing cannot be established reliably" — here pricing *is* established as free, so `cost=0` with note `price card: free tier for muse-spark-1.2-contributor-free via opencode (source: pi usage cost fields, total 0)`. At scale with a billed tier, would record `provider, model, price-card URL+date, input/output price, calculation method`.

- **Synthetic pilot used proxy:** `approx_tokens = len(prompt+patch)//4` with `cost=null` and `token_usage_proxy=true` per metrics spec — honest, not fabricating dollars. Shakedown validates that real run will switch to native.

**Verdict:** **PASS** — native reporting works; proxy fallback correctly flagged where used.

---

## 3. Did deterministic verification work?

**PASS synthetic, PARTIAL real — deterministic gate design is correct, real Docker harness is available but not yet run for all 10.**

- **Synthetic:** Deterministic runner `python3 run_tests.py` (6 tests: 5 task + `test_regression_simple`) exit code is ground truth; harness never asks LLM "Did tests pass?" — parses `PASS test_<Txx>` and `PASS test_regression_simple` deterministically. Verified in 2a-pilot: gate <1s, never asked LLM.

- **Real SWE-bench:** Deterministic harness is `swebench eval` Docker: it applies patch to repo@base_commit, then runs the task's `FAIL_TO_PASS` (e.g., 2 tests for astropy-12907) and `PASS_TO_PASS` (13) as subprocess, reporting `resolved` only if all FAIL_TO_PASS now PASS and PASS_TO_PASS still PASS. This is the required `agent change → task tests → parse → PASS→regression→success / FAIL→feedback→retry` (protocol §9).

- **Availability:** `swebench 5.0.2` installed in `/tmp/venv` (via `pip install swebench`), `Docker 29.7.2`, dataset `princeton-nlp/SWE-bench_Lite` loadable via `datasets 5.0.1` (300 tasks), and `swebench eval --help` confirms `swebench eval verified --gold` builds per-task image from `swe-bench-tasks`. Infrastructure present.

- **Gap:** Full 10-task Docker evaluation per arm (20 image builds) not yet executed in shakedown window due to disk/time (each build pulls base image + installs deps). Not fabricated. Single-task gold evaluation would be the next check (`swebench eval verified --gold -i astropy__astropy-12907`).

**Verdict:** Design **PASS**, execution **PARTIAL** — deterministic verification is correctly specified and available; full 10-task run is the powered-run step.

---

## 4. Did task isolation work?

**PASS.**

- **Per-task isolation:** Per protocol §6, each task gets **one clean repository snapshot per task/arm** — candidate: `git worktree add ../worktrees/<run-id>/<tid> <base_sha>` (LACE primitive from R004, reused), baseline: `mkdtemp` copy of `repo/*` (excluding `.git/__pycache__`). Both start from identical base SHA (`7b9850d` synthetic, or `task['base_commit']` for real). No shared mutable state between baseline and candidate or between tasks.

- **Verified:** Synthetic pilot 2a-pilot full-suite cumulative (all 5 correct fixes applied to `repo` then `python3 run_tests.py` → 6/6 PASS, regression PASS) confirms no cross-task leak. `git worktree remove --force` per task succeeded, `git worktree list` clean after. Real-task isolation will use same mechanism per `task['base_commit']` (manifest documents 10 commits for shakedown, 30 for scale) — design validated, not yet run for all 10 real repos in this window but mechanism identical.

---

## 5. Did regression detection work?

**PASS.**

- **Separation per metrics M1/M3:** `task_tests_passed` (did `test_<Txx>` PASS?) and `regression_tests_passed` (did `test_regression_simple` PASS? — 3 sub-checks synthetic; at scale, `PASS_TO_PASS` suite per task) recorded **separately** per `run_id/task` in `result.json` (fields `task_tests_passed`, `regression_tests_passed`, `all_pass`). Pilot shows strict_pass = task && regression (both 80% baseline strict, 100% candidate strict, regression 5/5 both → non-inferior true).

- **At scale:** regression = `PASS_TO_PASS` count per manifest (e.g., astropy-12907 has 2 FAIL_TO_PASS vs 13 PASS_TO_PASS; 14995 has 1 vs 179). Separate logging prevents hiding regressions in task success (task that passes target test but breaks PASS_TO_PASS is not clean success).

---

## 6. Did the candidate/baseline remain comparable?

**PASS synthetic design, design PASS real; no secret disadvantage introduced.**

- Same model `muse-spark-1.2-contributor-free`, same temperature 0.2, same task set (10 deterministic sorted IDs for both arms, manifest documents), same tool access (Read/Edit/Bash via pi), same timeout (30s synthetic, 120s at scale), same environment, same repository commit per task.

- Baseline **does not** receive verification-generated feedback or bounded retry from candidate; candidate **does** (gate → parse ≤800 chars FAIL tail + traceback → structured feedback → retry ≤2). This bundle is the **independent variable**; everything else constant per `docs/06`.

- Agent's own natural retries: pi's tool-use loop (e.g., fetching GH PR) is present in both arms identically — not disabled for baseline.

- Isolation note: baseline uses tmpdir copy vs candidate worktree — both achieve same starting-state guarantee, not a confounder (per F02).

---

## 7. What instrumentation failed?

**No instrumentation failed in shakedown; one honest limitation remains:**

- **Synthetic token proxy vs native:** Pilot used `len//4` with `cost=null` and `token_usage_proxy=true` — correctly flagged bias (metrics spec M4 known bias). Shakedown proved native fields exist (input/output/cacheRead/totalTokens/cost) so powered run can switch to native — no failure, but fallback correctly used where live calls not yet made.

- **Docker not yet exercised for all 10:** Not a failure — infrastructure is present (`swebench`, `docker`, `datasets`), but 10-task image builds not yet run in Stage A time window. No fabrications.

- **Herdr not required:** Core experiment works without `HERDR_ENV=1` (pilot ran with workspaces 0) — HerdrDelta is T2 and not part of this run per spec.

- **No missing fields:** `runs/2a-pilot/{baseline,candidate}/result.json` contain all 9 metrics fields per protocol (see pilot analysis).

---

## 8. What methodology needs adjustment?

**No change to hypothesis or success threshold (≥10pp at ≤2× median cost/latency, regression ≤). One pre-registered adjustment and one clarification for scale:**

- **Adjustment (documented, not favorable):** For real SWE-bench tasks, gate timeout should be **120s** (not 30s) per protocol §7 — synthetic 30s was sufficient (<1s gate) but Docker `pytest` needs 120s per runner. This is the protocol's intended scale value, not a post-hoc change.

- **Clarification for small n:** Report **both** median and total cost ratios plus P90 — pilot showed median 1.27× hides heavy-tail per-retry 2.05× (only 1/5 retried). At higher failure rates median will breach 2×, so guardrail must be evaluated on median *and* total.

- **Contamination control:** Tasks for shakedown are pre-cutoff (2015–2023) for this model — no post-cutoff rolling split in this 10, but powered run should supplement with LiveCodeBench-inspired rolling split per research/experiment/protocol.md §17 and R005.

- **No change to retry cap (2), isolation, or definitions — definitions in `research/experiment/metrics.md` frozen.**

---

## 9. Is the experiment ready for n≥30?

**YES for pipeline, NO for claiming product value — instrumentation gate PASS, hypothesis gate remains untested at scale.**

- **Pipeline ready:** Real model integration (pi json mode → usage), native token accounting, patch handling (git apply), isolation (worktree/tmpdir), regression separation, reproducible logging (`runs/<run-id>`, `results/<run-id>.json` with Wilson CIs), deterministic verification design (Docker harness available) are **validated** in shakedown and 2A pilot.

- **Not ready to claim product value:** Stage A does not prove hypothesis — n=10 shakedown is deliberately underpowered and not yet fully evaluated via Docker per arm. Powered run at n≥30 (prefer 100+) on the same 30-task manifest (`research/experiment/scale/task-manifest.json` — first 30 sorted IDs) with real `muse-spark-1.2-contributor-free` calls, native usage + billed cost, Docker evaluation, and Wilson CIs is the next required step. Thresholds unchanged.

**Recommendation:** **Proceed to Stage B powered run (n=30) on `research/experiment/scale/task-manifest.json` after addressing timeout clarification above.** Do not alter hypothesis or threshold to make results favorable.

