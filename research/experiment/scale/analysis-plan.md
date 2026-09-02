# Analysis Plan — Powered Validation (n=30)

**Date:** 2026-09-02 (frozen before any powered result observed) · **Phase:** 2B Stage B · **Dataset:** `princeton-nlp/SWE-bench_Lite` (300 test, version 6ec7bb89b9342f664a54a6e0a6ea6501d3437cc2) · **Model:** `muse-spark-1.2-contributor-free` both arms, temp 0.2 · **Protocol:** `research/experiment/protocol.md` · **Metrics:** `research/experiment/metrics.md` · **Prototype:** `docs/06-validation-prototype.md`

This plan is frozen **before collecting powered outcomes** per Phase 2B requirement — biggest protection against cherry-picking. Any change after this point must be documented as deviation.

---

## 1. Primary Outcome

**Absolute task-success gain in percentage points:** `candidate_success_rate − baseline_success_rate`, where success = `task_tests_passed && regression_tests_passed` (strict success: FAIL_TO_PASS all pass AND PASS_TO_PASS still pass). Task success per task is Boolean (1/0) as defined in metrics M1 with regression non-inferiority gate M3.

*Why pp Δ remains correct:* Product thesis is reliability (does harness make tasks actually pass). pp maps directly to pre-registered **≥10pp** gate (T1) and is interpretable on Lite/Verified. Reported with 95% Wilson CI.

---

## 2. Secondary Outcomes

All per `research/experiment/metrics.md` M1–M9, reported per-task then aggregated:

- **M2 Test success:** fraction of reference tests passing per run (for SWE-bench: |FAIL_TO_PASS ∩ PASS| / |FAIL_TO_PASS| plus PASS_TO_PASS fraction; reported separately, not combined into M1).
- **M3 Regression rate:** share PASS_TO_PASS still pass; **guardrail** candidate ≥ baseline (non-inferior). If candidate worse, T1 fails even if M1 wins.
- **M4 Token usage:** total input+output per task (native `usage` from `pi --mode json` fields `input, output, totalTokens`; if unavailable → `null` with bias statement, not proxy).
- **M5 Cost:** USD per task only when provider reports zero under applicable pricing plan with `provider, model, price-card URL, price-card date, billing tier` recorded; for free tier `cost=0` with that metadata; else `cost=null` and report tokens separately (no fabrication).
- **M6 Latency:** wall-clock per task (`task_start`→`final_end`, with `agent_start/agent_end/verification_start/verification_end` for overhead split); median+IQR, median ratio.
- **M7 Recovery rate:** `recovered = (not initial_pass and final task_pass)` — candidate only, n_recovered/n_total.
- **M8 Human intervention:** manual fix after retries exhausted — must stay 0 in automated run.
- **M9 Reliability / pass@3:** 3 independent runs per task per arm where resources permit; otherwise primary A/B first and document scheme; do not report pass@3 if only one run performed. Distinguish single-run task success vs repeated-run reliability.

---

## 3. Confidence Interval Method

**Wilson 95% CI for proportions** (small-n, not Wald) per metrics spec — use `statsmodels.stats.proportion.proportion_confint` Wilson or equivalent normal approximation fallback: `centre = (p + z²/(2n))/denom`, `margin = z * sqrt(p(1-p)/n + z²/(4n²))/denom`, `denom=1+z²/n`, `z=1.96`. Report Wilson CI for `baseline_success_rate`, `candidate_success_rate`, and Wilson difference CI where feasible.

For paired/matched comparison (same task identities), also calculate **McNemar or paired proportion test** where feasible as additional effect estimate — but do not treat Wilson interval overlap alone as complete significance test (per spec).

---

## 4. Effect-Size Calculation

- **Primary effect:** `pp_delta = (candidate_rate − baseline_rate)*100`, Wilson CIs on rates, and **paired difference CI** (where feasible, using `statsmodels.stats.contingency_tables.mcnemar` for matched pairs). Report both.
- **Cost/latency effects:** `median_ratio = candidate_median / baseline_median`, plus total aggregate ratio and P90 ratio (sensitivity to heavy-tail).
- **Regression effect:** `regression_rate_delta = candidate_regression_rate − baseline_regression_rate` with Wilson CI where appropriate.

---

## 5. Regression Analysis

Report `baseline_regression_pass_n/n` and `candidate_regression_pass_n/n` separately, plus strict success (`task && regression`). Decision gate: **candidate regression rate ≥ baseline rate** (non-inferior). If candidate introduces regressions baseline does not, T1 fails even if pp Δ ≥10. Include failure taxonomy for every regression failure.

---

## 6. Cost Analysis

- **Per-task:** native `input, output, totalTokens` from `pi --mode json` usage fields; cost only if pricing reliably established with `provider, model, price-card URL, price-card date, input/output price, calculation method` recorded per protocol.
- **Aggregate:** median, IQR, median ratio candidate/baseline; also total aggregate cost/token usage separately (median hides heavy-tail per-retry 2.05× seen in 2a-pilot).
- **Guardrail:** `median_cost ≤2× baseline` (if cost null, evaluate on token proxy with bias stated). Do not hide retry cost.

---

## 7. Latency Analysis

Same as cost: `task_start`→`final_end` wall-clock via `time.monotonic` per task, same instrument both arms. Report median, IQR, median ratio, plus total and P90 and verification overhead (`verification_start→verification_end`) and retry latency. Candidate latency must include verification/retry work (do not hide). Guardrail `median_latency ≤2×`.

---

## 8. Reliability Analysis

Where resources permit: **3 independent runs per task per arm** with fresh worktree/tmpdir per repetition, same prompt/model/temp, record `pass@3` (majority vote) and `pass_rate_all3`. Distinguish single-run task success (primary) vs repeated-run reliability (secondary). If full 3× not feasible, run primary A/B first and document exact reliability sampling scheme used — do not report pass@3 if only one run performed.

---

## 9. Missing-Data Handling

- **Missing token/cost:** if native usage unavailable for a task → `token_usage=null` and `cost=null` with reason `native usage unavailable` (per metrics M4/M5), do not substitute proxy into dollars; include task in success analysis but exclude from cost ratio (report n_missing).
- **Missing latency:** if `finished_at` not recorded → `latency_seconds=null`, exclude from median calc, report n_missing.
- **Infra failure (timeout, Docker build fail, patch apply fail):** log as failure taxonomy class, keep in denominator for task success (counts as fail), do not silently exclude task.
- **No imputation:** do not fabricate missing telemetry.

---

## 10. Infrastructure-Failure Handling

Log per task as `infrastructure_failure` or `environment_failure` taxonomy, count as task fail (0/1), include in aggregate. Do not remove difficult tasks after seeing outcomes. If benchmark environment is corrupted (e.g., Docker daemon down, image unavailable, disk full, model cannot be invoked, reproducibility breaks), stop and report `INFRASTRUCTURE FAILURE` — do not substitute synthetic results.

---

## 11. Task Exclusion Rules

**Pre-registered, before observing results:** No task exclusions after execution began. The only allowed exclusions are **pre-result** and must be documented:

- Infrastructure confirms task repo unavailable (404) at checkout time before any model call — exclude and record reason, but this did not occur for Lite (all repos public).
- If a task's `base_commit` checkout fails before assignment, exclude and record.

**Do not** remove hard tasks, cherry-pick successes, or exclude strange-looking failures after seeing outcomes. Shakedown n=10 tasks are **not** merged into powered statistical result unless protocol explicitly permits (it does not — `research/experiment/analysis/real-task-shakedown.md` and this plan keep them separate).

---

## 12. Stopping Rules

Stop early only for pre-defined reasons:

- Infrastructure invalid (Docker or swebench or model cannot be invoked reliably)
- Benchmark environment corrupted (image build fail for >50% tasks, not single-task fail)
- Reproducibility breaks (logs not traceable)
- Severe safety/data integrity issue
- Protocol cannot be maintained (isolation broken)

**Do not** stop because candidate is losing, winning, or task count after seeing direction. Do not change task count after observing results — frozen manifests below are final.

---

## 13. Task Count and Power Caveat

- **Power:** For p≈0.5, detecting 10pp at α=0.05, power 0.8 needs ~300/arm; n=30 only powers ~25–30pp [F02 §6, docs/06 §10]. Therefore `n=30 → directional evidence`, `n=100+ → substantially stronger evidence`. Do not describe n=30 result as definitive merely because threshold crossed.

- **Report uncertainty:** Even if T1 thresholds appear met at n=30, state confidence as Medium (directional) not High — need n≈100+ for High confidence on 10pp.

---

## 14. Sample Freeze Record

**Previous manifest superseded:** `research/experiment/scale/task-manifest.json` contained first 30 lexicographically sorted IDs (6 astropy + 24 django = 80% django-concentrated) — **pathological** per pre-result audit (repo distribution: django 114/300 =38% in population, but 80% in sample). This manifest is **replaced before any powered result observed** per allowable rule.

**New frozen manifests (reproducible sampling rule):**

- **Shakedown (n=10, already frozen 2026-09-02, instrumentation gate, not powered):** first 10 sorted IDs — `astropy__astropy-12907, 14182, 14365, 14995, 6938, 7746, django__django-10914, 10924, 11001, 11019` — kept separate, not merged into powered n=30 statistical result.

- **Powered (n=30, frozen now before powered execution):** **Stratified deterministic by repository** — first 2 instance_ids sorted lexicographically per repository (12 repos ×2 =24) plus third instance per each of the 6 largest repositories by Lite count (django 114, sympy 77, matplotlib 23, scikit-learn 23, pytest-dev 17, sphinx 16) to reach 30, then sorted lexicographically. This yields balanced 2–3 per repo (not django-concentrated), reproducible without random seed.

**Frozen powered 30 IDs (sorted):**

```
astropy__astropy-12907
astropy__astropy-14182
django__django-10914
django__django-10924
matplotlib__matplotlib-18869
matplotlib__matplotlib-22711
mwaskom__seaborn-2848
mwaskom__seaborn-3010
pallets__flask-4045
pallets__flask-4992
psf__requests-1963
psf__requests-2148
pydata__xarray-3364
pydata__xarray-4094
pylint-dev__pylint-5859
pylint-dev__pylint-6506
pytest-dev__pytest-11143
pytest-dev__pytest-11148
scikit-learn__scikit-learn-10297
scikit-learn__scikit-learn-10508
sphinx-doc__sphinx-10325
sphinx-doc__sphinx-10451
sympy__sympy-11400
sympy__sympy-11870
django__django-11001
matplotlib__matplotlib-22835
pytest-dev__pytest-5103
scikit-learn__scikit-learn-10949
sphinx-doc__sphinx-11445
sympy__sympy-11897
```

Wait — sorted list must be lexicographically sorted as final; regenerate. Actually per rule, final 30 sorted lexicographically are:

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

**Record:** dataset `princeton-nlp/SWE-bench_Lite`, version `6ec7bb89b9342f664a54a6e0a6ea6501d3437cc2`, split `test`, n=30, rule `stratified deterministic by repo (2 per repo +1 for 6 largest)`, no exclusions, no random seed (deterministic sort), final IDs as above sorted lexicographically, final manifest `research/experiment/scale/task-manifest.json` (this freeze replaces 2026-09-02 first-30 sorted manifest) — **No task substitutions after this point.**

- **Scale target:** minimum 30 (this freeze), preferred 100+ (future, same stratified rule extended).
