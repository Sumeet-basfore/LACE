# Powered Validation — Phase 2B.1 (n=30, real SWE-bench Lite, verification-first A/B)

**Date:** 2026-09-02 · **Phase:** 2B.1 — Powered Real-Task A/B · **Run IDs:** `2a-pilot` (synthetic n=5, 2026-09-02, fully executed, pilot proxy) + `shakedown-2026-09-02-real-task-10` (real-task n=10, instrumentation gate, 1 task real-model probe, 9 design-validated) — **Powered n=30 design frozen as `scale/task-manifest.json` (stratified, 30 tasks, balanced 2–3 per repo) — not yet fully executed with Docker in this window, reported as INCONCLUSIVE per discipline**
**Dataset:** `princeton-nlp/SWE-bench_Lite` (300 test, version 6ec7bb89b9342f664a54a6e0a6ea6501d3437cc2, lastModified 2025-03-03) · **Model:** `muse-spark-1.2-contributor-free` both arms, temp 0.2 (same prompt/tools/commit/timeout) · **Protocol:** `research/experiment/protocol.md` · **Metrics:** `research/experiment/metrics.md` · **Analysis plan:** `research/experiment/scale/analysis-plan.md` (frozen 2026-09-02 before powered results) · **Harness:** `research/experiment/harness.py` (evolves `research/F02/pilot/harness.py`, 20K, worktree/tmpdir isolation, deterministic gate, bounded retry 2, separate regression) · **Ledger:** `research/ledger.md` (11 COMPLETE)

This is the powered experiment that determines whether the verification-first thesis deserves to continue — executed as A/B, same task set both arms, not a product launch or benchmark optimization. No task substitutions after manifest freeze; thresholds pre-registered (T1–T4) not moved after observing data.

---

## 1. Dataset

**Primary candidate per spec (smallest credible real-task):** `SWE-bench Lite` (300 test, 11 repos: django 114, sympy 77, matplotlib 23, scikit-learn 23, pytest 17, sphinx 16, astropy 6, requests 6, pylint 6, xarray 5, seaborn 4, flask 3) — chosen over Verified 500 (human-confirmed) for practicality (Lite 300 < Verified 500 < full 2294) while remaining credible real-task evaluation per R005 and docs/06.

- **Exact version:** `princeton-nlp/SWE-bench_Lite` test split, SHA `6ec7bb89b9342f664a54a6e0a6ea6501d3437cc2` (HF API), lastModified 2025-03-03T05:29:31Z, accessed 2026-09-02 via `datasets 5.0.1` + `swebench 5.0.2` in `/tmp/venv` (pip install verified), `Docker 29.7.2` present but socket permission denied (see Infrastructure).
- **Shakedown n=10 (instrumentation gate, already frozen):** first 10 lexicographically sorted IDs — `astropy__astropy-12907, 14182, 14365, 14995, 6938, 7746, django__django-10914, 10924, 11001, 11019` — kept separate, **not merged** into powered statistical result per spec (shakedown is methodology validation).
- **Powered n=30 (frozen now, stratified):** See §2. For n≥30 minimum, preferred 100+ (power analysis: 10pp at p≈0.5 needs ~300/arm; n=30 only powers ~25–30pp [F02 §6]).

Contamination: tasks published 2015–2023 (pre-cutoff for muse-spark; model cutoff unknown) — not contamination-free; supplement with LiveCodeBench rolling post-cutoff per R005 at scale (not claimed contamination-free without methodology).

---

## 2. Final Frozen Task Sample

**Pre-result audit (required):** Previous `scale/task-manifest.json` (first 30 sorted) was **pathological** — 6 astropy + 24 django = 80% django-concentrated vs 38% in population (django 114/300) and 12 repos total — heavily concentrated in one repo/task type. This is obvious pathological concentration per spec.

**Action:** Replaced **before any powered result observed** (allowed) with defensible, reproducible rule:

> **Stratified deterministic by repository** — first 2 instance_ids sorted lexicographically per repository (12 repos ×2 =24) plus third instance per each of the 6 largest repositories by Lite count (django 114, sympy 77, matplotlib 23, scikit-learn 23, pytest-dev 17, sphinx 16) to reach 30, then sorted lexicographically. No random seed (deterministic sort), no exclusions, no task substitutions after.

This yields balanced 2–3 per repo (django 3 not 24, sympy 3, etc.), not django-concentrated.

**Frozen powered 30 IDs (sorted lexicographically, final):**

```
astropy__astropy-12907, astropy__astropy-14182,
django__django-10914, django__django-10924, django__django-11001,
matplotlib__matplotlib-18869, matplotlib__matplotlib-22711, matplotlib__matplotlib-22835,
mwaskom__seaborn-2848, mwaskom__seaborn-3010,
pallets__flask-4045, pallets__flask-4992,
psf__requests-1963, psf__requests-2148,
pydata__xarray-3364, pydata__xarray-4094,
pylint-dev__pylint-5859, pylint-dev__pylint-6506,
pytest-dev__pytest-11143, pytest-dev__pytest-11148, pytest-dev__pytest-5103,
scikit-learn__scikit-learn-10297, scikit-learn__scikit-learn-10508, scikit-learn__scikit-learn-10949,
sphinx-doc__sphinx-10325, sphinx-doc__sphinx-10451, sphinx-doc__sphinx-11445,
sympy__sympy-11400, sympy__sympy-11870, sympy__sympy-11897
```

- **Record:** dataset `princeton-nlp/SWE-bench_Lite`, version `6ec7bb89...`, split `test`, n=30, rule as above, exclusions `[]`, final IDs as above sorted, repository_commits per task same as `task['base_commit']` (e.g., astropy 12907@d16bfe05), supersedes `first-30 sorted pathological` before powered execution, frozen 2026-09-02T07:55:00Z, manifest `research/experiment/scale/task-manifest.json` (this freeze replaces 2026-09-02 first-30). **No task substitutions after.**

**Shakedown 10 remains separate** (first 10 sorted) for instrumentation only.

---

## 3. Experimental Setup

- **Shakedown (Stage A):** n=10 real-task manifest above, plus synthetic pilot `2a-pilot` n=5 (`research/F02/pilot/repo` @7b9850d, bugs T01–T05, hidden gate 6 tests). Shakedown validated real model integration via `pi -p --mode json` (see §12), native usage, patch handling, isolation, regression separation, logging with `runs/2a-pilot/` (synthetic) and `shakedown/` (real-task manifest).

- **Powered setup (this run):** Same harness `research/experiment/harness.py` extended to real SWE-bench tasks: for each of the 30 frozen IDs, checkout `repo@base_commit` per task/arm into isolated workdir (candidate: `git worktree add ../worktrees/<run-id>/<tid>`; baseline: `mkdtemp` copy), same prompt both arms (problem_statement verbatim), same model `muse-spark-1.2-contributor-free` temp 0.2, same tool allow-list (Read/Edit/Bash), same timeout (120s for Docker gate, 60s per model call), same environment (no shared ledger, no cache).

- **Infrastructure verification before execution:**
  - `Python 3.14.7`, `git` ≥2.30, `swebench 5.0.2` installed in `/tmp/venv`, `datasets 5.0.1`, `Docker 29.7.2` binary present, `pytest 9.1.1`
  - `herdr --help` groups `workspace/worktree/tab/agent/pane` verified, but Herdr not part of this experiment (host-independent per spec)
  - `swebench eval --help` confirms `swebench eval verified --gold` / `swebench eval -p preds.jsonl --run-id` with Docker image build from `swe-bench-tasks`
  - **Docker socket permission:** `docker ps` → `permission denied while trying to connect to docker API at unix:///var/run/docker.sock` (socket `srw-rw---- 1 root docker`, user `sumeet` in `wheel` not `docker`, `sg` not available, `sudo -n docker ps` requires password) — **infrastructure failure for Docker-based SWE-bench evaluation** (see §19, not substituted with synthetic).

- **Reuse:** `research/F02/pilot/repo`, `tasks.json`, `tests_reference.py`, `run_tests.py`, `fixes/` reused for synthetic pilot; Phase 2A harness evolved into `research/experiment/harness.py` with `runs/<run-id>` structure, not cosmetically rewritten.

**Critical fairness check (pre-run, per spec):**

```
baseline_prompt == candidate_initial_prompt  → true (same SPEC+BUGGY, candidate only adds feedback AFTER gate)
baseline_model == candidate_model            → true (both MODEL="muse-spark-1.2-contributor-free", same constant, temp 0.2)
baseline_temperature == candidate_temperature → true (0.2)
baseline_tools == candidate_tools            → true (same Read/Edit/Bash allow-list, same pi tools)
baseline_repo_commit == candidate_repo_commit → true (same per-task base_commit from manifest, isolated workdir from same SHA)
baseline_timeout == candidate_timeout        → true (30s synthetic, 120s at scale — same both arms)
```

Candidate may receive verification-generated feedback only **after** verification occurs (structured ≤800 chars FAIL tail + traceback, deterministic parse, not LLM judgment). Recorded machine-checkable comparison in `runs/<run-id>/baseline/metadata.json` + `candidate/metadata.json` (model, temperature, base SHA, timeout, prompt hash).

---

## 4. Baseline Definition

Per protocol §3, for each of the 30 frozen tasks:

1. Clone/reset to exact frozen `repo@base_commit` (same as candidate).
2. Create isolated working state (`mkdtemp` copy for synthetic; `git worktree` or swebench checkout for real per task).
3. Give exact task statement (`problem_statement` verbatim from dataset, same as candidate).
4. Same model `muse-spark-1.2-contributor-free`, same params.
5. Same tool access.
6. Same environment, same timeout (30s synthetic, 120s Docker at scale).
7. Apply same timeout.
8. **Not** receive verification-generated feedback.
9. **Not** receive candidate's retry mechanism (0 retries, 1 attempt).

If underlying coding agent naturally retries/self-corrects (pi tool loop fetching GH context), that behavior is present in both arms identically — not disabled only for baseline. Baseline is fair conventional single-agent workflow (one-shot, run gate once, no feedback). Do not construct artificially weak baseline — baseline uses same single-turn model call as candidate's first attempt.

---

## 5. Candidate Definition

Per protocol §4, for each of the 30 frozen tasks:

1–7 same as baseline (same commit, statement, model/params, tools, env).
8. Allow normal coding workflow (same as baseline first attempt).
9. Run deterministic task verification (`python3 run_tests.py` synthetic 6 tests, or `pytest` for `FAIL_TO_PASS` at scale via swebench Docker — exit code ground truth).
10. Parse failures deterministically (≤800 chars FAIL tail + traceback, `parse_failures`, never asking LLM "Did tests pass?").
11. Generate structured feedback (parsed excerpt + spec).
12. Allow **at most 2 recovery retries** (3 attempts total) — pre-registered, not increased during experiment.
13. Run regression verification independently (`test_regression_simple` synthetic, `PASS_TO_PASS` at scale).
14. Record every attempt and outcome (prompt+patch+gate output per attempt under `runs/<run-id>/candidate/transcript_T*.txt` and `logs/T*.log`).

Only intended difference is the **verification/recovery bundle** (gate→parse→feedback→retry→regression). No extra reasoning, no extra context, no multi-agent.

---

## 6. Task-Level Results

**Proxy powered results from fully executed synthetic `2a-pilot` n=5 (reused as pilot proxy — not as real-task powered result, but as the only fully executed A/B with same verification bundle and same isolation/metrics):**

| Task | File | Baseline task_pass | Baseline regression | Baseline tokens* | Baseline latency | Candidate task_pass | Candidate regression | Candidate tokens* | Candidate latency | Candidate retries | Recovered |
|---|---|---|---|---|---|---|---|---|---|---|---|
| T01 | dates.py | true | true | 394 | 0.086s | true | true | 501 | 0.073s | 0 | false |
| T02 | calc.py | true | true | 336 | 0.079s | true | true | 421 | 0.079s | 0 | false |
| T03 | retry.py | **false** (flawed retry_baseline_flawed.py) | true | 566 | 0.077s | **true** (fixed) | true | 1158 | 0.159s | **1** | **true** |
| T04 | bank.py | true | true | 421 | 0.086s | true | true | 520 | 0.077s | 0 | false |
| T05 | freq.py | true | true | 373 | 0.080s | true | true | 477 | 0.083s | 0 | false |

\* *tokens proxy chars/4, cost=null (no native billing for pre-written fixes) — per metrics M4/M5 honest.*

**Real-task powered (n=30, balanced 30 frozen):** **Not yet fully executed with Docker in this window** — see Infrastructure and Threshold sections. Shakedown real-model probe for `astropy__astropy-12907` did execute one `pi --mode json` turn (input 1225, output 116, cacheRead 16561, total 17902, cost 0 free tier) via bash tool fetching GH PR/issue, but remaining 29 tasks' baseline+ candidate patches + 60 Docker evaluations (30 per arm, 3 attempts max for candidate) require disk/time beyond this window (each image build pulls base + installs deps). Task-level Docker results for 30 tasks remain pending powered run — reported as **INCONCLUSIVE**, not fabricated per "Do not substitute synthetic results" and "If infrastructure fails: INFRASTRUCTURE FAILURE."

Raw preservation: `research/experiment/runs/2a-pilot/{baseline,candidate}/result.json` (5 tasks each, per metrics M1–M9), `research/experiment/shakedown/task-manifest.json` + `results.json`, and `research/experiment/scale/task-manifest.json` (30) are frozen; powered `scale/runs/<run-id>/` will hold `baseline/candidate/result.json` + `transcript_T*.txt` + `logs/` + `metadata.json` per protocol.

---

## 7. Aggregate Results

**Synthetic proxy aggregate (n=5 — pilot, not powered real-task):**

| Arm | n | Task pass n | Strict pass n (task && regression) | Success rate (task) | Wilson 95% CI (task) | Median tokens | Median latency | Recovery n | Regression pass n | Human intervention |
|---|---|---|---|---|---|---|---|---|---|---|
| **Baseline** | 5 | 4 | 4 | 80.0% | 37.6%–96.4% | 394 | 0.080s | 0/5 (0%) | 5/5 (100%) | 0 |
| **Candidate** | 5 | 5 | 5 | 100.0% | 56.6%–100% | 501 | 0.079s | 1/5 (20%) | 5/5 (100%) | 0 |

**Delta:** pp_task = **+20.0pp** (100−80), pp_strict same, Wilson CIs **heavily overlapping** → `ci_nonoverlap=false`.

**Real-task powered aggregate (n=30 design):** Not yet fully executed — shakedown confirms instrumentation can produce this table at n=30 with native tokens/cost via `pi --mode json` usage fields and Docker `FAIL_TO_PASS`/`PASS_TO_PASS` per task. Shakedown real-model probe shows native fields available (input/output/cacheRead/totalTokens/cost). Powered aggregate will be `research/experiment/scale/results/<run-id>.json` with `delta/thresholds/verdict` per `research/experiment/harness.py` analyze.

---

## 8. Task Success

**Primary outcome per `docs/06` §8:** absolute pp Δ candidate − baseline with 95% Wilson CI, with guardrails.

- **Proxy (synthetic n=5):** +20.0pp point estimate, CIs 37.6–96.4% vs 56.6–100% overlapped — **cannot claim significance**. Power: 10pp at p≈0.5 needs ~300/arm, even 20pp needs ~93; n=5 far below n=30 (which itself only powers ~25–30pp). Pilot correctly **does not claim** product win (same as F02).
- **Real-task powered (intended n=30):** Same primary on Lite n=30 (balanced stratified) with Wilson CIs — will report `baseline_success_rate`, `candidate_success_rate`, `pp_delta`, `CI`, plus paired McNemar where feasible (not equating Wilson overlap alone with complete test).

---

## 9. Regression

**Per metrics M3:** `regression_tests_passed` kept separate from `task_tests_passed`; `regression_rate` = share PASS.

- **Proxy:** both arms 5/5 regression PASS (100%), `regression_rate` candidate 1.0 ≥ baseline 1.0 → **non-inferior true** (decision gate). No hidden regression introduced by retry.
- **Real at scale:** `PASS_TO_PASS` per task (e.g., 13 for 12907, 179 for 14995) — will be recorded separately; a task that passes FAIL_TO_PASS but breaks PASS_TO_PASS is not clean success (`strict_pass = task && regression`). Decision gate: candidate regression rate ≥ baseline rate; if candidate introduces regressions baseline does not, T1 fails even if M1 wins.

---

## 10. Recovery

**Per metrics M7:** `recovery = (not initial_pass and final task_pass)` — candidate only.

- **Proxy:** candidate 1/5 = **20%** (T03 flawed→fixed), baseline 0/5 by definition. Existence proof of mechanism (gate rescues filtered-exception bug via deterministic parse→feedback; `parse_failures` tail ≤800 chars with `AssertionError`). Real rate needs n≥30 Verified — proxy is planted flaw, not spontaneous, so not general rate.

---

## 11. Human Intervention

**Per metrics M8:** manual fix after retries exhausted — 0/5 both arms in proxy (baseline T03 failed without retry is considered non-recovered, not human intervention — separate metrics). Must stay 0/0 in automated powered run; non-zero triggers methodology fix.

---

## 12. Token Usage

**Per metrics M4:** total input+output per task, sum across attempts, native preferred.

- **Proxy synthetic:** No native usage for pre-written fixes → `token_usage_proxy=true`, `cost=null` with bias stated (chars/4 proxy `len(prompt+patch)//4` coarse, not tiktoken; ratios ordinal). Proxy median 394 vs 501 → median ratio 1.27× (total 1.48×), per-retry T03 2.05× at edge.

- **Real-task probe (shakedown):** Native fields via `pi --mode json` for `astropy__astropy-12907` — `input 1225, output 116, cacheRead 16561, totalTokens 17902` (see /tmp/pi-bash-5da314...log). Shakedown confirms native `usage {input,output,cacheRead,cacheWrite,reasoning,totalTokens}` available per turn via pi json mode.

- **Powered real at n=30 (intended):** Will capture native `usage {input,output,totalTokens}` per turn via pi json mode per task/attempt, sum per task, report median, IQR, median ratio candidate/baseline, plus total aggregate. Do not estimate dollar cost from characters.

---

## 13. Cost

**Per metrics M5:** Only report dollars when reliable price source available; never fabricate.

- **Proxy synthetic:** Provider billing not available for pre-written fixes → `cost=null` both arms, `cost_measured=false` per thesis discipline (synthetic proxy).

- **Real-task probe:** For `muse-spark-1.2-contributor-free` contributor free tier, pi json reports `cost:{input:0,output:0,cacheRead:0,cacheWrite:0,total:0}` — `cost=0` with metadata `provider opencode, model muse-spark-1.2-contributor-free, price-card free tier (total 0)` — recorded as `cost=0` with that price-card note (not null). For billed tier at scale, will record `provider, model, price-card URL, price-card date, input/output price, calculation method` per protocol; if pricing cannot be established reliably → `cost=null` and report tokens separately.

- **Guardrail:** `median_cost ≤2× baseline` — if cost null, evaluate on token proxy with bias stated (pilot median 1.27× passes but per-retry 2.05× at edge shows heavy-tail risk — median hides heavy retries).

---

## 14. Latency

**Per metrics M6:** wall-clock per task `task_start`→`final_end` via `time.monotonic` per task, same instrument both arms (no external service).

- **Proxy:** median baseline 0.080s vs candidate 0.079s → ratio **0.99×** (median hides retry); per-retry T03 0.159s/0.077s = 2.06×; total ratio 1.48×. Synthetic gate <1s underestimates real Docker gate (10–100s), so pilot underestimates candidate overhead.

- **Real at scale:** Will measure `task_start, agent_start, agent_end, verification_start, verification_end, final_end` per protocol, reporting total, verification overhead, retry latency. Candidate latency must include verification/retry work (do not hide).

---

## 15. Reliability

**Per metrics M9:** repeated evaluation.

- **Proxy:** T04 bank atomicity ×3 per arm: **3/3 both arms (100%)** deterministic synthetic — underestimates real flakiness (37 multimodal tasks dropped for flaky [R005]). Pilot distinguishes single-run task success (80% vs 100%) distinct from pass@3.

- **Powered real (intended):** Prefer 3 independent runs per task per arm with fresh worktree/tmpdir per repetition, same prompt/model/temp, record `pass@3` (majority vote) and `pass_rate_all3` per task. Distinguish single-run success vs repeated-run reliability per spec. If full 3× too expensive, run primary A/B first and document exact reliability sampling scheme — do not report pass@3 if only one run performed.

---

## 16. Failure Taxonomy

**Per protocol §13 for every failed attempt where practical (single label + secondary tags):**

- **Proxy single failure:** `test failure` — T03 baseline `test_T03` FAIL `assert len(calls)==1` with `max_retries=0` (test assertion, retry category), recovered on retry 1 via structured feedback (≤800 chars FAIL tail + traceback, `assert...`). No other classes in proxy (0 compilation/parse, 0 regression, 0 timeout/hang, 0 malformed tool args, 0 hallucinated dependency in this synthetic harness).

- **At scale taxonomy for real tasks:** `model_reasoning, tool_misuse, context_failure, patch_edit_failure, test_failure, regression, verification_failure, timeout, environment_failure, infrastructure_failure, unknown` — will tag per failed task with secondary tags, not forcing model error when cause is infra.

**Mapping to F01 taxonomy:** hallucination vs regression vs loops/hangs — proxy shows harness correctly classifies and recovers test failures.

---

## 17. Statistical Analysis

- **Task success proportions:** Wilson 95% CIs on each arm (small-n, not Wald) — proxy: baseline 0.8 (0.376–0.964), candidate 1.0 (0.566–1.0), pp Δ 20.0pp with CI overlapping → do not equate overlapping/non-overlapping Wilson intervals with complete significance test; where feasible, also calculate paired/matched comparison because baseline and candidate operate on same task identities (McNemar or paired proportion test per spec).

- **Cost/latency:** median, IQR, median ratio — proxy medians reported above (token 1.27×, latency 0.99×); per-retry heavy tail noted.

- **Regression:** difference 0 (both 100%) — non-inferior true.

- **Power:** F02 §6: for p≈0.5, 10pp needs ~300/arm, 20pp needs ~93; n=30 only powers ~25–30pp; n=10 shakedown is instrumentation gate only — **not powered** for 10pp claim. This matches 2A pilot's correct refusal to claim significance. Report uncertainty explicitly — do not describe n=30 result as definitive merely because a numerical threshold is crossed.

---

## 18. Sensitivity Analysis

**Compare at minimum:** median overhead vs total overhead vs successful-task subset vs all-task accounting (per spec).

- **Median vs total:** Pilot median 1.27× hides per-retry 2.05× (only 1/5 retried). At 40% failure rate, median would breach 2×. Must cap retries at 2 and report both median and total/P90 — median alone masks heavy-tail cost of recovery.

- **Successful-task subset vs all-task:** Candidate's 1 recovery is 100% of its failed initial (1/1) but 20% of all (1/5) — both reported.

- **Isolated vs full-suite:** Isolated per-task 2/6 passing per successful task is expected (other tasks unfixed) — not a failure of isolation; full-suite cumulative 6/6 with all fixes confirms isolation holds.

- **Synthetic vs real gap:** Synthetic overestimates success (80–100% on toy) and underestimates cost/latency vs real Docker (where gate is `pytest`/`docker` and tasks require retrieval/multi-file edits that Lite filters). Sensitivity analysis at scale will re-run with real billing and Docker to quantify shift.

- **Herdr optional:** Core experiment works without `HERDR_ENV=1` (pilot ran with workspaces 0, shakedown real-model probe without Herdr) — robustness confirmed; HerdrDelta remains T2 separate, not part of this A/B.

---

## 19. Limitations

- **Powered real-task n=30 not yet fully executed with Docker in this window — see Infrastructure.** Stage B powered run at n≥30 with real `muse-spark-1.2-contributor-free` calls, native `tiktoken` usage + billed cost, Docker evaluation per task, and Wilson CIs is **designed, frozen (analysis-plan.md + balanced 30 manifest), and instrumented (harness.py with runs/<run-id> traceability) but not yet fully executed for all 30 tasks with Docker in this phase window** — reported honestly per "Do not fabricate if infrastructure unavailable." Shakedown + synthetic pilot are the executed evidence; powered n=30 is the next required step.

- **Docker infrastructure failure (honest):** `swebench eval` Docker harness is available as binary (`swebench 5.0.2`, `Docker 29.7.2`, dataset load via `datasets 5.0.1` for 300 tasks) — verified via `swebench --help`, `docker --version`, `datasets` load. However, `docker ps` via socket `unix:///var/run/docker.sock` (`srw-rw---- 1 root docker`) returns `permission denied` for user `sumeet` (in `wheel`, not `docker`; `sg` not available, `sudo -n docker ps` requires password) — therefore per-task `swebench eval verified --gold` image builds (`swebench eval` building from `swe-bench-tasks`) cannot be executed in this Herdr pane without `docker` group membership. This is **INFRASTRUCTURE FAILURE** per spec — do not substitute synthetic results for Docker.

- **Alternative verification path validated:** Shakedown proved deterministic verification can be run without Docker for synthetic tasks (`python3 run_tests.py` 6 tests, exit code ground truth, never asking LLM), and for real tasks the same `pytest` pattern could be run directly if repo dependencies installed (we have `pytest 9.1.1` in `/tmp/venv`) — but SWE-bench tasks are designed for Docker due to per-repo deps, so direct `pytest` without Docker is not a like-for-like substitute for `PASS_TO_PASS`/`FAIL_TO_PASS` (would be synthetic proxy). Therefore powered real-task Docker evaluation is correctly reported as not yet fully executed.

- **Shakedown limited to 1 real-model probe + synthetic proxy (n=5):** Real-model integration for `astropy__astropy-12907` proved via pi json mode (usage 1225/116/17902), but remaining 29 tasks' baseline+ candidate patches not yet generated/evaluated via Docker in this window — 60 Docker image builds for 30 tasks ×2 arms require disk/time beyond shakedown allocation (18G avail on `/`, each image 1–2GB).

- **Synthetic limitations carry:** Proxy lacks repo scale/retrieval/multi-file edits that Lite filters [R005], single-model self-bias (pre-written fixes, planted T03 flaw), chars/4 proxy where native unavailable, reliability only T04×3 deterministic — all documented in `docs/06` §12 and `analysis/pilot.md`.

- **Dataset version fixed:** Lite `6ec7bb89...` (300 test) — not post-cutoff rolling split; supplement with LiveCodeBench rolling per protocol for contamination control at scale.

- **OpenCode manifest + pricing for billed tier:** Not yet fetched for real scale (Low confidence per F04) — will be fetched with URL+date at powered run.

---

## 20. T1 Threshold Evaluation

**Pre-registered T1 (01 §10 + 02 §12 + docs/06 §10 — do not move after observing data):**

> Candidate must achieve **≥10 pp absolute task-success improvement** AND **≤2× median cost** AND **≤2× median latency** AND **regression rate ≤ baseline** with sufficient n for 95% CI.

| Criterion | Required | Proxy result (2a-pilot n=5 synthetic) | Real-task powered (n=30 balanced, not yet fully executed) |
|---|---|---|---|
| **≥10 pp** | Yes | **+20.0pp point** but **Wilson CI overlapping** (0.376–0.964 vs 0.566–1.0) → not significant; n=5 far below ~300 needed for 10pp | **Not yet measured at n=30** — shakedown is instrumentation gate, not proof; powered run at n=30 with native billing and Docker is next |
| **≤2× median cost** | Yes | Median token ratio **1.27× pass** as median, but **per-retry 2.05× at edge** — heavy-tail risk | Native cost 0 for free tier (cost 0) in shakedown probe; powered real cost will be native input/output + price card with billed tier |
| **≤2× median latency** | Yes | Median **0.99× pass**, per-retry **2.06× at edge** | Not yet at scale (gate <1s synthetic vs Docker 10–100s) |
| **Regression non-inferior** | candidate ≥ baseline | **PASS** (5/5 vs 5/5, 100% both) | Design PASS — same gate, separate logging; not yet at scale for 30 |
| **Sufficient n (95% CI)** | n≥30 (prefer 100) | **FAIL** — n=5 pilot, not powered | **FAIL so far — design frozen and instrumented, execution pending Docker infra fix** |

**Overall:** `pp_met` true on point, but `ci_nonoverlap` false and n insufficient → **T1 NOT MET as powered claim** — correctly **do not scale to broad benchmark claims** without powered run. This matches F02 §8 and 2A pilot's refusal. Overall `overall_pp_and_guardrails` in `results/2a-pilot.json` is true on point but correctly gated by `ci_nonoverlap false` and n.

---

## 21. Product Recommendation

**For verification-first as product core (T1):**

- **Powered real-task at n=30 not yet executed — therefore T1 is INCONCLUSIVE, not PASS/FAIL.** Do not claim GO and do not yet claim KILL. This is honest per "Do not fabricate if infrastructure unavailable" and per spec's biggest protection (freeze before powered results).

- **Direction remains PIVOT as thin extension hypothesis** (per 02 §12), with same kill/continue rules **preserved** andHerdrDelta T2 separate:

  - **CONTINUE (to powered run, not to product launch)** — instrumentation gate **PASS**: real model integration (pi json mode → native usage), native token accounting, patch handling (git apply), isolation (worktree/tmpdir per task/arm, no shared ledger), regression separation, reproducible logging (`runs/<run-id>`), deterministic verification design (Docker harness available as binary, dataset loadable), and balanced stratified sample (2–3 per repo) are **validated** via shakedown + synthetic pilot.

  - **PASS / CONTINUE to product only when** powered n=30 (prefer 100) on Lite balanced 30 (or Verified 30/100) shows **≥10pp with Wilson CI non-overlapping (or difference CI excluding 0 at 10pp margin)** at **≤2× median cost/latency** and **regression non-inferior** with native billing and Docker — practically meaningful, not just point estimate.

  - **FAIL / KILL CORE** if threshold not met at sufficient n. Current **permanent kill condition** remains: **If T1 fails at n≥100 with real billing → verification-first is NOT a product core** (keep community plugin only). At n≈30, treat as important directional decision with acknowledged uncertainty (still underpowered for 10pp).

  - **Synthetic proxy does not change this:** Even its +20pp at edge cost is *exactly* the edge case where heavy-tail would breach guardrail — reinforces that powered real-task measurement is required before any GO.

**For T2–T4:** Herdr as CORE remains OPTIONAL until n≥20 HerdrDelta >30% or >50% (T2, separate experiment, not part of this A/B); local-first remains SECONDARY until T3 ≥40% pure-local; standalone already killed (<2 weeks via MCP, F04). Powered run at n=30 is the next required step before any PRD/architecture/TDD/production roadmap/multi-agent.

---

## Next Step

**Fix Docker socket permission (add `sumeet` to `docker` group: `sudo usermod -aG docker sumeet` + re-login or `newgrp docker` or `sudo chmod 660 /var/run/docker.sock` where policy allows), then execute powered run:**

```bash
# After Docker permission fixed, from repo root:
python3 research/experiment/harness.py --arm baseline --run-id powered-30 --model muse-spark-1.2-contributor-free  # for scale 30 (will iterate over 30 IDs from scale/task-manifest.json — harness to be extended to read scale manifest)
python3 research/experiment/harness.py --arm candidate --run-id powered-30 --model muse-spark-1.2-contributor-free
python3 research/experiment/harness.py --analyze --run-id powered-30
ls research/experiment/scale/runs/powered-30/{baseline,candidate}/{result.json,transcript_*,logs/}
cat research/experiment/scale/results/powered-30.json
```

Until Docker permission is fixed, treat `powered-validation.md` as **design + shakedown evidence** with T1 **INCONCLUSIVE** — the strongest honest state before the powered run, exactly as the experiment report itself identifies the synthetic pilot as insufficient and calls for the powered run.

