# Pilot Analysis — 2a-pilot

**Run ID:** `2a-pilot` · **Date:** 2026-09-02 · **Harness:** `research/experiment/harness.py` (evolves `research/F02/pilot/harness.py`) · **Model:** `muse-spark-1.2-contributor-free` both arms (simulated via pre-written fixes) · **Base commit:** `7b9850d` · **Protocol:** `research/experiment/protocol.md` · **Metrics:** `research/experiment/metrics.md` · **Results:** `research/experiment/results/2a-pilot.json` + `runs/2a-pilot/{baseline,candidate}/result.json`

---

## 1. Sample Size

- **Per-arm n:** 5 synthetic tasks (T01 dates, T02 calc, T03 retry, T04 bank, T05 freq) — same set, same order, same commit, same hidden gate `tests_reference.py` (6 tests: 5 task + `test_regression_simple`).
- **Total trials:** 10 (5 baseline + 5 candidate) + reliability probe 6 extra (T04 ×3 per arm) — reliability probe re-ran separately confirms pass@3 = 3/3 both arms (deterministic synthetic, see §9).
- **Pre-registration:** n=5 is **not powered** for 10pp at p≈0.5 (needs ~300/arm; n=30 only powers ~25–30pp [F02 §6, docs/06 §10]). Pilot purpose is **pipeline validation + variance + overhead estimation**, not claiming product win — same as F02 §1.

---

## 2. Results

**Per-arm table (strict success = task test + regression both PASS; task-only identical here because regression never broke):**

| Arm | n | Task pass n | Strict pass n | Success rate | Wilson 95% CI (task) | Median tokens* | Median latency | Recovery n | Regression pass n | Human intervention |
|-----|---|-------------|---------------|--------------|----------------------|----------------|----------------|------------|-------------------|--------------------|
| **Baseline** | 5 | 4 | 4 | 80% (4/5) | 37.6% – 96.4% | 394 | 0.080s | 0/5 (0%) | 5/5 (100%) | 0 |
| **Candidate** | 5 | 5 | 5 | 100% (5/5) | 56.6% – 100% | 501 | 0.079s | 1/5 (20%) | 5/5 (100%) | 0 |

\* *tokens = proxy chars/4 (see bias below); cost = null for both (not billed) — guardrail evaluated on token proxy.*

**Delta:** pp_task = **+20.0pp** (100% − 80%), pp_strict same. Wilson CIs **heavily overlapping** (baseline upper 96.4% > candidate lower 56.6%). Per-task breakdown: baseline fails only T03 (retry flawed — missing exception filtering + metadata), candidate recovers T03 on retry 1 via `parse_failures` tail → `retry_fixed.py`, retries=1, recovery=true. All other tasks 1 attempt, 0 retries.

**Full-suite cumulative (all 5 correct fixes applied to `repo`):** `python3 run_tests.py` → 6/6 PASS, regression PASS — confirms worktree/tmpdir isolation held (no cross-task mutation).

**Raw logs archived:** `runs/2a-pilot/{baseline,candidate}/{result.json, transcript_T*.txt, logs/T*.log, metadata.json}` + merged `results/2a-pilot.json` with analysis fields `delta`, `thresholds`, `verdict`.

---

## 3. Confidence Intervals Where Meaningful

- **Wilson (small-n, not Wald) per metrics spec:** baseline task 0.8 (0.376–0.964), candidate 1.0 (0.566–1.0). Strict same. Non-overlap test: **ci_nonoverlap = false** — cannot claim significance.
- **Guardrails as ratios (median):** token ratio 501/394 = **1.27×** (total ratio 3079/2078 = 1.48×). Latency ratio 0.079/0.080 = **0.99×**. Both **≤2×** pass as medians. **But** per-retry cost for T03 is 1158/566 = **2.05× tokens** and 0.159/0.077 = **2.06× latency** (F02 detailed values; 2A pilot median dilutes it because only 1/5 tasks retried). Guardrail is **retry-rate dependent** — at higher failure rates median would breach 2×.
- **Power:** with n=5, 95% CI width ~59pp (baseline) — detecting 10pp needs ~300/arm at p≈0.5; even 20pp needs ~93. Pilot CIs correctly signal insufficient n.

---

## 4. Failures

**By class (protocol §13):**

- **Test assertion (candidate T03 initial):** `test_T03` FAIL on `assert len(calls)==1` with `max_retries=0` (first attempt flawed) — classified as **test assertion**, not compilation. Recovered on retry 1 (structured feedback = last 800 chars tail containing `AssertionError` + test name, deterministic parser `parse_failures`).
- **No other failure classes observed:** 0 compilation/parse, 0 regression, 0 timeout/hang (gate <1s), 0 malformed tool args, 0 hallucinated dependency in pilot.
- **Regression:** 0/5 both arms — `test_regression_simple` passed in every isolated run. No hidden regression introduced; non-inferiority holds (candidate 100% ≥ baseline 100%).

**Failure that *was* planted:** T03 flawed (`retry_baseline_flawed.py`) simulates single-shot miss due to missing exception-filtering — the exact failure mode F01 taxonomy: hallucinated/unreliable edit + tool misuse. It is **constructed** to demonstrate rescue, not a spontaneous model error — so recovery 1/5 is existence proof of mechanism, not general rescue rate.

---

## 5. Instrumentation Problems

- **Token cost via chars/4 proxy remains:** No native `usage` metadata exists for pre-written fixes (no live LLM call), so harness records `token_usage_proxy=true`, `cost=null` per metrics spec M4/M5 — honest, per thesis "never fabricate price calculations." Both arms same bias, so ratio ordinal not dollars. Future Verified scale must use native `usage` (tiktoken) + fetched price card (URL+date) or keep cost null.
- **Deprecation warnings:** `datetime.utcnow()` → use `datetime.now(UTC)` in future (non-blocking).
- **Herdr snapshot:** `HERDR_ENV=1` was 0 in harness run (workspaces 0) because `herdr api snapshot` from subprocess without Herdr context returns empty — when run from inside Herdr tab (`w4`), snapshot would show 3 workspaces; harness handles both with `herdr_snapshot_present=false/true`.
- **Worktree cleanup:** `git worktree remove --force` per task succeeded; `worktrees_2a-pilot` dirs removed; `git worktree list` clean after. No leak.
- **No hang/timeout:** per-gate timeout 30s never hit (gate ~80ms).
- **Logging completeness:** `result.json` per protocol JSON fields present (`run_id, condition, model, task, repository_commit, started_at, finished_at, attempts, task_tests_passed, regression_tests_passed, recovered, human_intervention, token_usage, cost, latency_seconds, timeout, workdir, gate_output_tail`) — verified.

---

## 6. Methodology Problems

- **Synthetic proxy underestimates real repo difficulty:** Per docs/06 §12, synthetic lacks repo scale, retrieval, multi-file edits that Lite explicitly filters [R005], plus contamination and flaky tests (37 multimodal tasks dropped for flaky). Pilot overestimates success (80–100% on 5 toy tasks) and underestimates cost/latency vs real SWE-bench (where gate is `pytest`/`docker` at 10–100s, not <1s). This is intentional for pipeline validation before scaling, but biases external validity **up**.
- **Single-model self-bias:** fixes are pre-written by same model (us) — not a blind generation — and T03 flaw is planted. Pilot measures **harness mechanics** (does gate + parse → feedback + retry *work*), not model quality. Real run needs fresh tasks post-cutoff + LiveCodeBench rolling split [R005].
- **Cost/latency underestimates overhead:** Because gate is cheap, 2× per-retry ratio would be larger on real bench (retry adds full `pytest`/`docker` run), so median 1.27× is optimistic for real scale.
- **Reliability probe too narrow:** Only T04 ×3 probed (3/3 both arms, deterministic synthetic). Synthetic deterministic overestimates reliability; real Verified reliability lower and harness-confounded (mini-SWE-agent per R005). Needs full n×3 at scale.
- **Worktree vs tmpdir not independent:** candidate uses `git worktree`, baseline uses tmpdir copy — both achieve isolation, but the difference itself is not measured as independent variable (intentional — isolation is primitive, not under test). No confounding observed (full-suite cumulative held).

**No methodology fix required before scaling except:** for Verified scale, switch token accounting to native usage + real billing, expand reliability to all tasks, and add contamination guards. Otherwise pipeline is **valid** for its stated purpose.

---

## 7. Surprising Observations

- **Recovery at edge cost is *exactly* at threshold:** per-retry token and latency ratios both ~2.05× — the best-case recovery in the *easiest* synthetic setting is already at the 2× guardrail. At real failure rates >20%, median will breach 2× without retry-rate control (cap 2 is already minimal).
- **Latency median almost flat (0.99×) despite retry:** Because only 1/5 tasks retried, median hides overhead — total ratio 1.48× is more sensitive. Future reporting should report both median and total (or P90) — median alone masks heavy-tail cost of recovery.
- **Isolated per-task 2/6 passing per successful task is counterintuitive:** runner reports 2/6 (its own + regression) for 4/5 tasks — not a failure of isolation but expected (other tasks unfixed). Task-pass boolean is correct primary; test-success fraction per isolated run is not task success.
- **Herdr optional works without Herdr:** pilot ran without `HERDR_ENV=1` workspaces, still completed — validating that core experiment does not depend on Herdr, as required. Herdr integration can be tested later as deployment variant.
- **No regression despite worktree vs tmpdir divergence:** both isolation mechanisms held — reassuring for hybrid `tmux+worktree` fallback path (F03).

---

## 8. Whether the Experiment Is Ready to Scale

**YES — pipeline is valid for scaling, with caveats and revised sizing.**

- **Harness works:** start from isolated `7b9850d` → allow agent (simulated fix) → deterministic `run_tests.py` gate → deterministic `parse_failures` (no LLM judgment) → structured feedback excerpt → bounded retry (cap 2) → regression separation (task vs `test_regression_simple`) → record outcome (all protocol JSON fields, transcripts, logs, metadata, merged results).
- **Instrumentation works:** baseline and candidate comparable (same model/temp/spec/commit/evaluator/timeout, only verification bundle differs); metrics collected per metrics spec with Wilson CIs and median + ratio; logs reproducible via `python3 harness.py --arm both --run-id <id>` (see protocol §17).
- **Gate deterministic:** LLM never asked whether tests passed — runner exit code is ground truth; feedback is parsed excerpt.
- **Logs reproducible & traceable:** `runs/<run-id>/{baseline,candidate}/{result.json, transcript_T*.txt, logs/T*.log, metadata.json}` plus `results/<run-id>.json` with `delta/thresholds/verdict`.

**But do not claim product value from this pilot:**

- **Sample size:** n=5 → Wilson CIs 37.6–96.4% vs 56.6–100% overlap → `pp_met` true on point (+20pp ≥10) but `ci_nonoverlap` false → **T1 pre-registered gate NOT met** (needs n≥30, prefer 100+). Pilot correctly **does not scale to broad benchmark claims**.
- **Ready to scale toward:** SWE-bench Verified n≥30 (prefer 100+) with mini-SWE-agent harness (R005), adding LiveCodeBench rolling post-cutoff split, native `tiktoken` usage + price card, full reliability pass@3 (n×3), and Herdr vs tmux arm if testing runtime — only after pipeline validated (now validated).

**Recommendation:** **Scale to n=30 Verified Lite (300) pilot with real model calls and real billing** — keep same verification core (worktree + gate + parse + retry 2 + regression separation), same metrics spec, same T1 guardrails (≥10pp at ≤2× median cost/latency, regression non-inferior, 95% CI). Do not implement multi-agent in next phase — multi-agent remains **EXPERIMENTAL** until single-agent verification baseline is proven. Herdr remains **optional** — test Herdr plugin variant in parallel as deployment variant, not as dependence.

