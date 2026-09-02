# Metrics Specification — Verification-First Experiment

**Date:** 2026-09-02 · **Phase:** 2A · **Protocol:** `research/experiment/protocol.md` · **Prototype:** `docs/06-validation-prototype.md`
**Source of truth:** this file defines exact formulas. Do not use approximate or invented definitions when reporting.

Every metric is measured **per task** and then aggregated. All definitions preserve `research/F02/pilot` semantics and R005 Pareto scorecard (`% resolved | regression | median cost | time | reliability | recovery`).

---

## M1 — Task Success

```
Name:       Task Success
Definition: Per-task, did the *task-specific* reference test for that task PASS in the gate run?
            For synthetic pilot: exactly the test named test_<Txx> in tests_reference.py for that task.
            At scale (Verified): did the issue's Verified reference tests (the patched Gold PR's tests) all PASS?
Unit:       Boolean per task (true/false, 1/0)
How measured: Parse gate runner output for substring "PASS test_<Txx>" (synthetic) or runner exit 0 + per-test JUnit/TAP parsing (Verified, no LLM judgment whether tests passed).
            For isolated per-task synthetic runs, other tasks' tests are expected to FAIL — only its own + regression determine success.
When measured: Immediately after each task's final gate invocation (after retries exhausted for candidate, after single run for baseline).
Known bias:
            - Isolated synthetic runs show 2/6 passing per successful task (its own + regression) even when "task success" is true — do not report all-pass (6/6) per isolated run as task success; use task_pass boolean. Full-suite cumulative (all 5 fixes applied) is separate and should be 6/6.
            - Synthetic task_tests are deterministic and known to pilot author but hidden from baseline prompt — simulates Verified hidden suite; self-bias possible.
```

## M2 — Test Success

```
Name:       Test Success
Definition: Fraction of reference tests passing per run (synthetic: 6 tests; Verified: issue's reference test set).
Unit:       Proportion [0,1] (or n_passed / n_total)
How measured: Count "PASS " lines in run_tests.py output divided by total defined tests (synthetic: len(tests)=6).
When measured: Same moment as M1 per task; full-suite cumulative also reports 6/6.
Known bias:
            - For isolated per-task runs, 4 of 6 failures are expected (other tasks unfixed) — test success fraction per isolated run is 1/6 for flawed task, 2/6 for correct single-task fix. Only the task-specific slice determines M1.
```

## M3 — Regression Rate

```
Name:       Regression Rate
Definition: Per task, did the regression suite PASS (Boolean false = rate of 0 regressions per task in pilot)?
            More generally, share of previously-passing regression subtests that break per task.
            Synthetic pilot regression suite: test_regression_simple (3 sub-checks on unrelated functionality, run inside same gate).
            At scale: Verified regression suite = repo test subset not touched by expected fix (per SWE-bench Verified keep, or curated Holdout).
Unit:       Boolean per task in pilot (true = no regression); at scale proportion per task or rate across run.
How measured: Parse "PASS test_regression_simple" in gate output. If present, regression_passed=true (rate 0). If "FAIL test_regression_simple", rate 1.
When measured: Per task gate — recorded separately from task_tests_passed. FAIL on regression while task test passes still counts as task FAIL for overall correctness (task_result and regression_result kept separate, then combined as "success iff both pass" for overall resolved count, but logged separately).
Known bias:
            - Pilot regression is 3 sub-checks on unrelated functionality — small and not representative of real repo regression surface (R005 Lite filters precisely the multi-file slice).
            - Isolated per-task runs cannot detect cross-task regression beyond this suite; full-suite cumulative run catches it.
Decision rule:
            - Primary gate is non-inferiority: candidate regression_pass rate must be ≥ baseline rate. If candidate introduces regressions baseline does not, T1 FAILS even if M1 wins.
```

## M4 — Token Usage

```
Name:       Token Usage
Definition: Total LLM input+output tokens consumed per task (sum across all attempts/prompts for candidate including retries).
Unit:       Integer tokens (per task)
How measured:
            - Preferred (native): model API response field usage {input_tokens, output_tokens} or provider token_count. If available, record verbatim as token_usage_native and use it as canonical metric.
            - Fallback (synthetic pilot simulation): pre-written fixes are NOT live LLM calls, so no native usage exists. Record approx_tokens = len(prompt+patch)//4 as token_usage_proxy and set token_usage_native = null, with bias note "chars/4 proxy, no native usage — not billed". Do NOT sum proxy and native — report one canonical column.
            - Future live Verified runs: always prefer native usage; proxy only if native unavailable, and state bias.
When measured: Sum per task across all prompts+feedback+retry patches in that task's condition (baseline single prompt vs candidate sum of phase1+phase2+retries).
Known bias:
            - chars/4 proxy is coarse (no tiktoken), overcounts short prompts and undercounts verbose patches; pilot ratios therefore ordinal, not dollars. Validation synthesis flagged this. 2A records both and states bias when falling back.
            - Synthetic T03 recovery (flawed→fixed) naturally doubles tokens for that task; median ratio is retry-rate dependent — high failure rate inflates median toward 2×.
```

## M5 — Cost

```
Name:       Cost
Definition: Estimated monetary cost per task in USD.
Unit:       USD (per task; also report median across run)
How measured:
            - Only if model pricing and token billing are available. Cost = (input_tokens/1e6 * input_price_per_1M) + (output_tokens/1e6 * output_price_per_1M) using provider price card at access date.
            - Synthetic pilot: provider billing is NOT available for pre-written fixes — therefore record cost = null, do NOT estimate via chars/4 * assumed price. Set cost_measured = false and state "monetary cost cannot be reliably measured — token proxy not billed" per thesis metrics discipline.
            - Live runs: if native usage available and price card fetched with URL+date, compute cost; else cost = null.
When measured: Per task, derived from M4 native usage immediately after final gate; aggregated median cost ratio reported only if cost non-null for both arms.
Known bias:
            - Never fabricate price calculations from proxy tokens. Pilot will report cost=null for both arms (honest). Future scale must fetch price card with access date or cost stays null.
            - Guardrail is ≤2× median cost vs baseline — applies only when cost is measured; if cost null, gate is evaluated on token proxy ratio instead (stated as proxy, not dollars).
```

## M6 — Latency

```
Name:       Latency
Definition: Wall-clock seconds from task start (first prompt construction) to gate final verdict (last run_tests.py exit), per task.
Unit:       Seconds (float, monotonic)
How measured: time.monotonic() before first workdir setup and after final gate return, per task; same instrument both arms (no external service).
When measured: Per task, at final gate; aggregated median across run (median robust to one heavy retry).
Known bias:
            - Synthetic gate runs are <1s (baseline median 0.058s pilot); per-retry candidate T03 0.124s (2.03×) shows retry overhead is measurable even in synthetic — but real Verified gate (pytest/docker) will be 10–100s, so pilot underestimates candidate overhead vs real. Report both.
```

## M7 — Recovery Rate

```
Name:       Recovery Rate
Definition: Share of tasks that initially FAILED (first gate after first patch) then PASSED after bounded retry (≤2) within same candidate run.
Unit:       Proportion per run: n_recovered / n_total (candidate only; baseline has no retry so recovery 0 by definition).
How measured: Candidate loop records initial_pass (attempt 1 task_pass) and final task_pass; recovered = (not initial_pass and final_task_pass). Baseline recovered always 0. F02 pilot: T03 flawed→fixed = 1/5 = 20% candidate recovery.
When measured: Per task after retry loop, aggregated per candidate run.
Known bias:
            - Pilot recovery is constructed (T03 was planted flawed to demonstrate rescue of exception-filter bug via parse→feedback) — not a spontaneous model error. Therefore recovery rate in pilot is existence proof of mechanism, not evidence of general rescue rate — real rate needs n≥30 Verified.
```

## M8 — Human Intervention

```
Name:       Human Intervention
Definition: Per task, was a manual fix required after bounded retries were exhausted (autonomous recovery failed and human would have to intervene)?
Unit:       Boolean per task (false = autonomous, true = manual needed)
How measured: 1 if final task_pass==false after max retries and a human would need to edit; in pilot harness logged as human_intervention = (not task_pass and retries==2) — i.e., all retries exhausted and still fail. Pilot: 0/5 both arms (baseline T03 failed without retry is considered non-recovered, not human intervention — human would still be needed, but baseline has no retry so this is captured by recovery, not intervention).
When measured: After retry loop, per task. Must stay 0/0 in pilot feasibility; non-zero triggers methodology fix (gate not informative enough, or prompt not actionable).
Known bias:
            - For isolated single-shot baseline, a failed task without retry is logically a missed recovery opportunity, not a human-intervention count — separate metrics keep them distinct.
```

## M9 — Reliability / pass@3

```
Name:       Reliability / pass@3
Definition: Per-task variance across repeated runs with identical spec/prompt (temperature 0.2 near-deterministic). pass@3 = (task passes in majority vote across 3 runs) or proportion of tasks passing all 3. Also report pass_rate across repeats.
Unit:       Proportion (per tested task) or share of tasks where all 3 pass.
How measured: Re-run the same task ×3 with identical prompt and fresh workdir each time (same as F02 T04 ×3 per arm). F02 pilot: T04 ×3 both arms 3/3 (100%) deterministic — synthetic underestimates real flakiness (37 multimodal tasks dropped for flaky [R005]).
When measured: Pilot probes T04 ×3 per arm; future Verified scale should probe full run ×3 per task for variance (report pass@3, not just mean).
Known bias:
            - Synthetic deterministic tasks (bank atomicity) overestimate reliability; real SWE-bench Verified reliability is lower and harness-confounded (mini-SWE-agent standardization [R005]). Report synthetic reliability as pipeline check, not general claim.
```

---

## Aggregation & Reporting

- **Primary:** absolute task-success pp Δ with **Wilson 95% CI** on each proportion and difference CI (or Wilson score intervals). For n=5, use Wilson method for small n (e.g., `statsmodels.stats.proportion.proportion_confint` Wilson); do not use Wald. For n≥30, same method.
- **Guardrails:** median token ratio, median cost ratio (if cost non-null, else proxy), median latency ratio ≤2× vs baseline (median of per-task values, not mean — robust to one heavy retry). Report median + IQR/median absolute deviation.
- **Do not claim significance with inadequate n** — F02 correctly refused with n=5 (37.6–96.4% vs 56.6–100% overlaps). Show CI and power sizing per F02 §6: for p≈0.5, 10pp needs ~300/arm; n=30 only powers ~25–30pp.
- **Pareto report per run:** `% resolved | regression rate | median cost | median time | reliability | recovery` (R005 §7), plus human_intervention.
- **Never fabricate price:** if cost null (synthetic proxy), report `cost: null — not billed (proxy only)` and evaluate guardrail on token proxy with bias stated.
