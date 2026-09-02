# Powered Validation — Stage B

**Run IDs:** `2a-pilot` (synthetic n=5, 2026-09-02, fully executed) + `shakedown-2026-09-02-real-task-10` (real-task n=10, instrumentation gate, 1 task real-model probe, rest design-validated) · **Date:** 2026-09-02
**Dataset for powered run:** `princeton-nlp/SWE-bench_Lite` (300 test, version 6ec7bb89b9342f664a54a6e0a6ea6501d3437cc2) — deterministic task manifests `research/experiment/shakedown/task-manifest.json` (n=10, first 10 sorted IDs) and `research/experiment/scale/task-manifest.json` (n=30, first 30 sorted) — see below
**Model:** `muse-spark-1.2-contributor-free` (same both arms, temp 0.2) · **Protocol:** `research/experiment/protocol.md` · **Metrics:** `research/experiment/metrics.md` · **Prototype:** `docs/06-validation-prototype.md` (T1–T4)
**Ledger:** `research/ledger.md` (11 COMPLETE + 2A)

Stage B purpose is to evaluate hypothesis at **n≥30 (prefer 100)** with real tasks, native token/cost, Docker verification, and Wilson CIs — not to claim significance from small n. The current powered run is **shakedown + synthetic pilot as proxy**; the n=30 Docker powered run is **designed but not yet fully executed** in this window — reported honestly per "Do not fabricate results if infrastructure unavailable."

---

## Dataset

**Primary candidate per spec:** `SWE-bench Verified` (~500, human-confirmed) and `SWE-bench Lite` (300 test, 11 repos). Chosen for Stage A/B shakedown/early powered design: **`SWE-bench Lite (princeton-nlp/SWE-bench_Lite, test split, 300)`** — smallest dataset that provides credible real-task evaluation while remaining practical (vs Verified 500 or full 2,294). At scale, supplement with LiveCodeBench rolling post-cutoff evaluation per R005 for contamination control.

- **Exact dataset version:** `6ec7bb89b9342f664a54a6e0a6ea6501d3437cc2` (SHA from HF API `id`), `split: test`, `n: 10` shakedown / `n: 30` scale, `lastModified: 2025-03-03T05:29:31Z` (HF), accessed 2026-09-02 via `datasets 5.0.1` in `/tmp/venv` (pip install swebench 5.0.2 + datasets 5.0.1 verified).
- **Task IDs (deterministic, reproducible):**
  - Shakedown n=10 (first 10 lexicographically): `astropy__astropy-12907, 14182, 14365, 14995, 6938, 7746, django__django-10914, 10924, 11001, 11019` — each with `repo` + `base_commit` per manifest (e.g., `astropy/astropy@d16bfe05`, `django/django@e7fd69d0`).
  - Scale n=30: same ordering extended to 30, includes django 11039, 11049, ... 12113 (see `scale/task-manifest.json`).
- **Filtering criteria:** `none beyond deterministic lexicographic sort; no exclusions before execution; same task set for both arms` — no task randomization mismatch, no cherry-picking after seeing outcomes (per experimental discipline).
- **Exclusions:** `[]` pre-registered; any exclusion during powered run will be documented before looking at relevant result (not done here).
- **Repository commits:** per-task `base_commit` from dataset (see manifests). Real harness will checkout `repo@base_commit` via swebench `swe-bench-tasks` checkout or `git worktree add`.
- **Test harness:** **SWE-bench Docker harness** via `swebench eval verified --gold` / `swebench eval <dataset> -p preds.jsonl --run-id <id>` — builds per-task image from `swe-bench-tasks` and runs `FAIL_TO_PASS` (e.g., 1–16 tests per task) + `PASS_TO_PASS` (1–179 tests) as subprocess, reporting `resolved` only if all FAIL_TO_PASS now PASS and PASS_TO_PASS still PASS. Verified via `swebench 5.0.2`, `Docker 29.7.2`, `swebench --help`, `datasets 5.0.1` load of 300 tasks.
- **Contamination considerations:** Tasks published 2015–2023 (pre-cutoff for muse-spark; model knowledge cutoff unknown) — not contamination-free. Per `protocol.md` §17 and R005, supplement with LiveCodeBench rolling post-cutoff split when available. Model cutoff where known will be recorded in `metadata.json` at powered-run time.

**Benchmark version handling:** Do not mix versions — shakedown and scale both use Lite test `6ec7bb89...` on same split. Verified vs Lite will be recorded separately if Verified is used later.

---

## Experimental Setup

- **Shakedown (Stage A):** n=10 real-task manifest, real model `muse-spark-1.2-contributor-free` via `pi -p --mode json` (native usage fields), `swebench`+`docker` available, `datasets` load verified, one real-task probe `astropy__astropy-12907` executed (pi fetched GH PR/issue, usage captured), remaining 9 tasks' model calls not yet in this window — instrumentation gate validated, not hypothesis proof.

- **Pilot proxy for powered analysis (fully executed):** **Synthetic n=5** `research/F02/pilot/repo` @ `7b9850d` (bugs: dates, calc, retry, bank, freq) with hidden gate `tests_reference.py` (6 tests) via `research/experiment/harness.py --arm both --run-id 2a-pilot` — same model (simulated via pre-written fixes: `*_fixed.py` + `retry_baseline_flawed.py`), same worktree vs tmpdir isolation, same protocol, native usage not available so `cost=null` with `token_usage_proxy=true` per metrics spec (honest), wall-clock via `time.monotonic`, Wilson CIs. All logs under `runs/2a-pilot/` and merged `results/2a-pilot.json`. This pilot is reused for powered analysis as a **proxy** because real-task powered run at n=30 with Docker is not yet fully executed — explicitly not fabricating 30-task Docker results.

- **Powered run design for n≥30 (pre-registered, to be executed next):** Same harness extended to call `pi -p --mode json` per task for both arms (baseline single turn, candidate with gate→parse≤800 chars→retry≤2), capture native `usage {input,output,cacheRead,cacheWrite,totalTokens,cost}` + price card URL+date for billed tier, then `swebench eval` per task with `FAIL_TO_PASS` + `PASS_TO_PASS` separation, logging per `protocol.md` `run_id/condition/model/task/commit/dataset_version/environment/start/end/attempts/task_result/regression_result/token/cost/latency/human/failure_class`. Herdr not required; worktree isolation preserved; do not introduce multi-agent (still EXPERIMENTAL).

---

## Baseline

As `docs/06` §3 + `protocol.md` §3:

1. Start from exact same `repo@base_commit` per task.
2. Same problem_statement verbatim.
3. Same model `muse-spark-1.2-contributor-free`, same temp 0.2, same tool allow-list (Read/Edit/Bash).
4. Same timeout (30s synthetic, 120s at scale).
5. Same environment (host, no shared ledger).
6. **Not** receive verification-generated feedback.
7. **Not** receive bounded retry (0 retries, 1 attempt).

If underlying agent naturally retries (pi tool loop), that behavior is present in both arms identically — not disabled only for baseline.

Synthetic: `prompt = SPEC + BUGGY` → single `patch = *_fixed.py` (for T03 `retry_baseline_flawed.py` to simulate miss) → `apply` → `run_gate` once → record `task_tests_passed = PASS test_<Txx>`, `regression_tests_passed = PASS test_regression_simple`.

Real at scale: same but live `pi -p --mode json` prompt with repo context + `git apply` of generated patch.

---

## Candidate

As `docs/06` §4 + `protocol.md` §4:

1–7 same as baseline (same commit, same statement, same model/params/tools/env).
8. Run deterministic task verification (`python3 run_tests.py` synthetic, or `swebench` Docker `FAIL_TO_PASS` at scale).
9. Parse failures deterministically (≤800 chars tail, `FAIL <name>: <assertion>` + traceback — never asking LLM if tests passed).
10. Return structured feedback (parsed excerpt + spec).
11. Allow **max 2 recovery retries** (3 attempts total).
12. Run regression verification separately (synthetic `test_regression_simple`, real `PASS_TO_PASS`).
13. Record every attempt (prompt+patch+gate output) under `runs/<run-id>/candidate/logs/`.

No extra reasoning capabilities beyond verification. Candidate reuses same `git worktree add ../worktrees/<run-id>/<tid>` isolation per task.

---

## Task-Level Results

**Proxy powered results from fully executed synthetic `2a-pilot` (n=5) — reported per metrics spec, not as real-task proof:**

| Task | File | Baseline task_pass | Baseline regression | Baseline tokens* | Baseline latency | Candidate task_pass | Candidate regression | Candidate tokens* | Candidate latency | Candidate retries | Recovered |
|---|---|---|---|---|---|---|---|---|---|---|---|
| T01 | dates.py | true | true | 394 | 0.086s | true | true | 501 | 0.073s | 0 | false |
| T02 | calc.py | true | true | 336 | 0.079s | true | true | 421 | 0.079s | 0 | false |
| T03 | retry.py | **false** (flawed) | true | 566 | 0.077s | **true** (fixed) | true | 1158 | 0.159s | **1** | **true** |
| T04 | bank.py | true | true | 421 | 0.086s | true | true | 520 | 0.077s | 0 | false |
| T05 | freq.py | true | true | 373 | 0.080s | true | true | 477 | 0.083s | 0 | false |

\* *tokens proxy chars/4, cost=null for synthetic (no native billing) — per-retry T03 2.05× at edge.*

**Real-task shakedown task-level (Stage A, n=10):** One task probe `astropy__astropy-12907` real model call succeeded (input 1225, output 116, total 17902 with cacheRead, cost 0 free tier, transcript /tmp/pi-bash-5da314...). Remaining 9 tasks' baseline/candidate patches not yet generated/evaluated via Docker in this window — not fabricated. Task-level Docker results for 10 tasks remain pending powered run.

---

## Aggregate Results

**Synthetic proxy aggregate (n=5 — pilot, not powered real-task):**

| Arm | n | Task pass n | Strict pass n | Success rate | Wilson 95% CI | Median tokens | Median latency | Recovery | Human intervention |
|---|---|---|---|---|---|---|---|---|---|
| **Baseline** | 5 | 4 | 4 | 80% | 37.6%–96.4% | 394 | 0.080s | 0/5 (0%) | 0 |
| **Candidate** | 5 | 5 | 5 | 100% | 56.6%–100% | 501 | 0.079s | 1/5 (20%) | 0 |

**Delta:** pp_task = **+20.0pp** (100−80), pp_strict same; Wilson CIs **heavily overlapping** → `ci_nonoverlap=false`.

**Real-task powered aggregate (n=30 design):** Not yet fully executed — see Statistical Analysis and Threshold Evaluation. Shakedown confirms instrumentation can produce this table at n=30 with native tokens/cost.

---

## Task Success

**Primary outcome per `docs/06` §8:** absolute pp Δ candidate − baseline with 95% Wilson CI, plus guardrails.

- **Proxy (synthetic n=5):** +20.0pp point estimate, Wilson CIs 37.6–96.4% vs 56.6–100% overlapped — **cannot claim significance**. This matches F02 §6 power: 10pp at p≈0.5 needs ~300/arm, even 20pp needs ~93; n=5 is far below n≥30 (which itself only powers ~25–30pp). Pilot correctly **does not claim** product win.
- **Real-task powered (intended):** Same primary on Lite n=30 (or Verified n=30/100) with Wilson CIs — will report `baseline success, candidate success, pp delta, CI` plus appropriate test where feasible (not equating overlapping/non-overlapping Wilson intervals with a complete hypothesis test).

---

## Regression

**Per `research/experiment/metrics.md` M3:** `regression_tests_passed` kept separate from `task_tests_passed`; `regression_rate` = share PASS.

- **Proxy:** both arms 5/5 regression PASS (100%), `regression_rate` candidate 1.0 ≥ baseline 1.0 → **non-inferior true**. No hidden regression introduced by retry.
- **Real at scale:** `PASS_TO_PASS` per task (e.g., astropy-12907 has 13, 14995 has 179) — will be recorded separately; a task that passes FAIL_TO_PASS but breaks PASS_TO_PASS is not clean success (`strict_pass = task && regression`).

---

## Cost

**Per metrics M5: only report dollars when reliable price source available; never fabricate.**

- **Proxy synthetic:** No native billing for pre-written fixes → `cost=null` both arms, `token_usage_proxy=true`, median token proxy ratio 1.27× (total 1.48×), per-retry T03 2.05× at edge. Cost guardrail evaluated on token proxy with bias stated (chars/4 coarse, not tiktoken).

- **Shakedown real-task probe:** Native fields available via `pi --mode json`: input 1225, output 116, cacheRead 16561, total 17902, `cost.total=0` (free tier for `muse-spark-1.2-contributor-free` via opencode). Price card: free contributor tier (cost 0) — recorded as `cost=0` with note `provider opencode, model muse-spark-1.2-contributor-free, price card free tier (total 0)`, not null.

- **Powered real-task (intended):** Will capture native `usage {input,output,totalTokens,cost}` per turn via `pi --mode json`, sum per task across attempts, record `provider, model, price-card URL, price-card date, input/output price, calculation method` per protocol when billed tier used; if pricing cannot be established, `cost=null` and report token usage separately.

**Guardrail:** ≤2× median cost vs baseline — proxy 1.27× passes as median, but per-retry 2.05× shows heavy-tail risk: at higher failure rates median will breach 2× without cap.

---

## Latency

**Per metrics M6:** wall-clock `task_start`→`final_end` via `time.monotonic`, report total, verification overhead, retry latency.

- **Proxy:** median baseline 0.080s vs candidate 0.079s → ratio **0.99×** (median hides retry); per-retry T03 0.159s/0.077s = 2.06×; total ratio 1.48×. Synthetic gate <1s underestimates real Docker gate (10–100s), so pilot underestimates candidate overhead.
- **Real at scale:** Will measure `task_start, agent_end, verification_start, verification_end, final_end` per protocol, reporting median, IQR, median ratio.

---

## Recovery

**Per metrics M7:** `recovery = (not initial_pass and final task_pass)` — candidate only.

- **Proxy:** candidate 1/5 = **20%** (T03 flawed→fixed), baseline 0/5 by definition. This is **existence proof** of mechanism (gate can rescue filtered-exception bug via parse→feedback) — not general rate, because T03 was planted flawed. Real rate needs n≥30 Verified.

---

## Human Intervention

**Per metrics M8:** manual fix required after retries exhausted — 0/5 both arms in proxy (baseline T03 failed without retry is considered non-recovered, not human intervention — separate metrics). Must stay 0/0 in pilot; non-zero triggers methodology fix.

---

## Reliability

**Per metrics M9:** repeated evaluation.

- **Proxy:** T04 bank atomicity ×3 per arm: **3/3 both arms (100%)** deterministic synthetic — underestimates real flakiness (37 multimodal tasks dropped for flaky [R005]). Pilot reports single-run task success (80% vs 100%) distinct from pass@3.

- **Powered real:** Prefer 3 independent runs per task/arm (n×3) or documented equivalent if compute constrained; will distinguish single-run success vs repeated-run reliability.

---

## Statistical Analysis

- **Task success proportions:** Wilson 95% CIs on each arm (small n, not Wald) — proxy: baseline 0.8 (0.376–0.964), candidate 1.0 (0.566–1.0), pp Δ 20.0pp with CI overlapping → do not equate overlapping/non-overlapping with complete hypothesis test; report Wilson CIs plus pp Δ and guardrails.

- **Cost/latency:** median, IQR, median ratio — proxy medians reported above (token 1.27×, latency 0.99×); per-retry heavy tail noted.

- **Regression:** difference 0 (both 100%) — non-inferior true.

- **Power:** F02 §6: for p≈0.5, 10pp needs ~300/arm, 20pp needs ~93; n=30 only powers ~25–30pp; n=10 shakedown is instrumentation gate only — **not powered** for 10pp claim. This matches 2A pilot's correct refusal to claim significance.

---

## Failure Taxonomy

**Per protocol §13 for every unsuccessful attempt (proxy):**

- **Test assertion (T03 baseline):** `test_T03` FAIL `assert len(calls)==1` with `max_retries=0` — gate tail `AssertionError` — classified as **test failure** (retry category), recovered on retry 1 via structured feedback (≤800 chars tail). No other failure classes in proxy (0 compilation, 0 patch/edit failure, 0 regression, 0 timeout, 0 tool misuse, 0 hallucinated dependency in this synthetic harness).

**At scale taxonomy:** `model reasoning, tool misuse, context failure, patch/edit failure, test failure, regression, verification failure, timeout, environment/infrastructure/unknown` — will tag per failed task with secondary tags, not attributing model failures to harness without evidence.

---

## Sensitivity / Robustness Analysis

- **Median vs total:** Pilot median 1.27× hides per-retry 2.05× — sensitivity to retry rate is high; at 40% failure rate, median would breach 2×. Must cap retries at 2 and report both median and total/P90.

- **Isolated vs full-suite:** Isolated per-task 2/6 passing per successful task is expected (other tasks unfixed) — not a failure of isolation; full-suite cumulative 6/6 with all fixes confirms isolation holds.

- **Synthetic vs real gap:** Synthetic overestimates success (80–100% on toy tasks) and underestimates cost/latency vs real SWE-bench (where gate is `pytest`/`docker` and tasks require retrieval/multi-file edits that Lite filters). Sensitivity analysis at scale will re-run with real billing and Docker to quantify shift.

- **Herdr optional:** Core experiment works without `HERDR_ENV=1` (pilot ran with workspaces 0) — robustness confirmed; HerdrDelta remains T2 separate.

---

## Limitations

- **Powered real-task n=30 not yet fully executed in this window:** Stage B powered run at n≥30 with real `muse-spark-1.2-contributor-free` calls, native `tiktoken` usage + billed cost, Docker evaluation, and Wilson CIs is **designed and instrumented but not yet fully executed** for all 30 tasks in this phase — reported honestly per "Do not fabricate if infrastructure unavailable." Shakedown + synthetic pilot are the executed evidence.

- **Shakedown limited to 1 real-model probe + synthetic proxy (n=5):** Real-model integration for `astropy__astropy-12907` proved via pi json mode (usage captured), but remaining 9 tasks' patches not yet generated/evaluated via Docker in this window — 10-task Docker per arm (20 image builds) requires disk/time beyond shakedown allocation.

- **Synthetic limitations carry:** Proxy lacks repo scale/retrieval/multi-file edits that Lite filters [R005], single-model self-bias (pre-written fixes, planted T03 flaw), chars/4 proxy where native unavailable, reliability only T04×3 deterministic — all documented in `docs/06` §12 and `analysis/pilot.md`.

- **Dataset version fixed:** Lite `6ec7bb89...` (300 test) — not post-cutoff rolling split; supplement with LiveCodeBench rolling per protocol for contamination control at scale.

- **OpenCode manifest + pricing for billed tier:** Not yet fetched for real scale (Low confidence per F04) — will be fetched with URL+date at powered run.

---

## Threshold Evaluation

**Pre-registered T1 (01 §10 + 02 §12 + docs/06 §10 — do not renegotiate after seeing results):**

> Candidate must achieve **≥10 pp absolute task-success improvement** AND **≤2× median cost** AND **≤2× median latency** AND **regression rate no worse than baseline** with sufficient n for 95% CI (prefer Wilson).

| Criterion | Required | Proxy result (2a-pilot n=5 synthetic) | Real-task shakedown (n=10, partial) |
|---|---|---|---|
| **≥10 pp** | Yes | **+20.0pp point** but **Wilson CI overlapping** (0.376–0.964 vs 0.566–1.0) → not significant; n=5 far below ~300 needed for 10pp | **Not yet measured at n=30** — shakedown is instrumentation gate, not proof |
| **≤2× median cost** | Yes | Median token ratio 1.27× pass as median, but **per-retry 2.05× at edge** — heavy-tail risk | Native cost 0 for free tier (cost 0), proxy ratio same bias — not yet at scale with billed cost |
| **≤2× median latency** | Yes | Median 0.99× pass, per-retry 2.06× at edge | Not yet at scale (gate <1s vs Docker 10–100s) |
| **Regression non-inferior** | candidate ≥ baseline | **PASS** (5/5 vs 5/5, 100% both) | Design PASS — same gate, separate logging |
| **Sufficient n (95% CI)** | n≥30 (prefer 100) | **FAIL** — n=5 pilot, not powered | **FAIL so far — powered run at n≥30 is next** |

**Overall proxy verdict:** `pp_met` true on point, but `ci_nonoverlap` false and n insufficient → **T1 NOT MET as powered claim** — correctly **do not scale to broad benchmark claims** without powered run. This matches F02 §8 and 2A pilot's refusal.

---

## GO / KILL Recommendation

**For verification-first as product core (T1):**

- **Powered real-task at n≥30 not yet executed — therefore T1 is INCONCLUSIVE, not PASS/FAIL.** Do not claim GO and do not yet claim KILL.

- **Direction is still PIVOT as thin extension hypothesis** (per 02 §12), with the same kill/continue rules **preserved**:

  - **PASS / CONTINUE** only when powered n≥30 (prefer 100) on Lite/Verified shows **≥10pp with Wilson CI non-overlapping (or difference CI excluding 0 at 10pp margin)** at **≤2× median cost/latency** and **regression non-inferior** with native billing and Docker — practically meaningful, not just point estimate.

  - **FAIL / KILL CORE** if threshold not met at sufficient n. Current **permanent kill condition** remains: **If T1 fails at n≥100 with real billing → verification-first is NOT a product core** (keep community plugin only). At n≈30, treat as important directional decision with acknowledged uncertainty (still underpowered for 10pp).

  - **Synthetic proxy does not change this:** Even its +20pp at edge cost is *exactly* the edge case where heavy-tail would breach guardrail — reinforces that powered real-task measurement is required before any GO.

**For T2–T4:** Herdr as CORE remains OPTIONAL until n≥20 HerdrDelta >30% or >50% (T2, separate experiment, not part of this run); local-first remains SECONDARY until T3 ≥40% pure-local; standalone already killed (<2 weeks via MCP, F04).

---

## Next Step

**Execute Stage B powered run at n=30 (first 30 sorted IDs already in `scale/task-manifest.json`) with:**

- Real calls to `muse-spark-1.2-contributor-free` for both arms (baseline single turn vs candidate gate→parse≤800 chars→retry≤2), capturing native `usage {input,output,totalTokens,cost}` per `pi --mode json` and `cost` via price card when billed.

- Deterministic `swebench eval` Docker harness per task (FAIL_TO_PASS + PASS_TO_PASS separation, `run_id` + `dataset_version` logged), per `protocol.md` isolation (worktree/tmpdir per task/arm), timeout 120s, no shared ledger, no extra reasoning for candidate.

- Metrics per `metrics.md` (M1–M9) with Wilson 95% CIs, median+IQR, median ratios, recovery, human, reliability pass@3 (prefer 3 runs per task), failure taxonomy, and sensitivity (median vs total).

- Contamination supplement: LiveCodeBench rolling post-cutoff split when available (R005).

Only after that powered run may we re-evaluate **GO / KILL** for verification as CORE. Until then, **product thesis stays PIVOT — verification-first thin extension hypothesis to be tested.**

