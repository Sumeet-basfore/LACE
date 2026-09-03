# LACE Market Validation — Analysis Framework

**Status:** HYPOTHESIS · **Scope:** Pre-registered analysis plan. No data analyzed.
**Date:** 2026-09-03 · **Track:** A — Market Validation
**Predecessors:** `research/market/hypotheses.md`, `research/market/survey.md`, `research/market/recruitment.md`

---

## Analysis Principles

1. **Pre-registered:** This plan is written before data collection. No post-hoc hypothesis generation.
2. **Labeled claims:** Every finding tagged FACT | EVIDENCE | INFERENCE | HYPOTHESIS | DECISION.
3. **Sample reported:** Every statistic accompanied by n, CI, and limitations.
4. **Null results reported:** Falsified hypotheses get equal weight.
5. **Segments compared:** No aggregate-only reporting where segmentation matters.

---

## Data Preparation

### Cleaning Rules
- Exclude: S1=No (never used agent for committed code), S6=Rarely-Never (no test suite), straight-liners (<2 min survey), speeders (>3 SD below median time).
- Attention check: Embedded "Select 'Somewhat' for this row" in workaround matrix.
- Duplicate detection: Same email + same agent + same role → keep first.

### Weighting (if needed)
- **Agent weighting:** If >60% single agent, compute inverse-propensity weights for agent-stratified estimates. Report both unweighted and weighted.
- **No demographic weighting** — population parameters unknown.

### Derived Variables
- `verification_rate` = mean(B1 verified) across 5 tasks per respondent (0–1)
- `recovery_incidents_30d` = B2 count (integer)
- `recovery_time_share` = (median recovery time × incidents) / (estimated agent-hours/week × 4) — approximate
- `workaround_insufficiency` = mean rating ≤2 across used workarounds
- `trust_verifier` = B4 enable-by-default (binary)
- `delegate_retry` = B5 allow auto-retry (binary: Yes-always / Yes-test-only = 1; No = 0)
- `non_delegable_count` = count of checked items in B5 non-delegable
- `wtp_20` = B6 direct choice (Yes-personal/team/company = 1; Maybe/No = 0)
- `van_westendorp_band` = [PMC, PME] from 4 price points
- `buyer_authority` = B6 budget authority (categorical)

---

## Primary Hypothesis Tests

### H1: Verification Frequency ≥50%
- **Statistic:** Mean `verification_rate` across respondents.
- **Test:** One-sample t-test vs 0.50 (or binomial CI for proportion of respondents with rate ≥0.5).
- **Effect size:** Cohen's d vs 0.50.
- **Segmentation:** By agent, role, team size, repo privacy, task complexity.
- **Report:** Mean ± 95% CI, median, histogram, segment table.

### H2: Recovery Rate ≥30% of Tasks
- **Statistic:** `recovery_incidents_30d` / (estimated tasks/30d). Tasks/30d estimated from "typical agent tasks per week" (survey add-on) or proxy: incidents per respondent.
- **Test:** Poisson rate CI; proportion of respondents with ≥1 incident.
- **Segmentation:** By task complexity (D3), agent, repo privacy.
- **Report:** Rate per 30 days, per task (if tasks known), segment comparison.

### H3: Time Share ≥20%
- **Statistic:** Median `recovery_time_share`.
- **Test:** Bootstrap CI for median (non-parametric).
- **Sensitivity:** Vary agent-hours/week assumption (5/10/20 hrs).
- **Report:** Median share, CI, sensitivity table.

### H4: Workarounds Insufficient (≥40% rate ≤2)
- **Statistic:** Proportion of respondents rating ≥1 used workaround ≤2.
- **Test:** Binomial CI for proportion.
- **Per-workaround:** % rating ≤2 for each workaround (worktree, CI, manual review, local tests, self-check, scope limit).
- **Segmentation:** By team size (CI more relevant for teams), role.
- **Report:** Heatmap of workaround × segment.

### H5: Trust External Verifier (≥30% enable by default)
- **Statistic:** Proportion `trust_verifier` = 1.
- **Test:** Binomial CI vs 0.30.
- **Segmentation:** By repo privacy (H10), role, recovery frequency, secret exposure history (D5).
- **Report:** Overall + segmented; reasons for disable (B4 follow-up) coded.

### H6: Delegate Automated Retries (≥25%)
- **Statistic:** Proportion `delegate_retry` = 1.
- **Test:** Binomial CI vs 0.25.
- **Segmentation:** By failure class comfort (from B5), role, trust_verifier.
- **Report:** Overall + by error type willingness.

### H7: Non-Delegable Actions
- **Statistic:** % selecting each non-delegable action.
- **Test:** Descriptive; rank order.
- **Key threshold:** Any action >80% = hard blocker for automation.
- **Report:** Bar chart with 95% CI per action.

### H8: WTP at $20/mo ≥15%
- **Statistic:** Proportion `wtp_20` = 1.
- **Test:** Binomial CI vs 0.15.
- **Van Westendorp:** Plot cumulative curves; derive Optimal Price Point (OPP) and Indifference Price Point (IDP).
- **Segmentation:** By buyer authority (individual vs team vs company), team size, role.
- **Report:** WTP curve, OPP/IDP, segment table.

### H9: Buyer Segmentation
- **Statistic:** Cross-tab `buyer_authority` × `wtp_20` × team size × role.
- **Test:** Chi-square for independence; logistic regression for WTP predictors.
- **Report:** Decision map (who approves at what price), odds ratios.

### H10: Public vs Private Repo Difference
- **Statistic:** Difference in `trust_verifier`, `delegate_retry`, `wtp_20` between S5 strata (Private >50% vs Public >50%).
- **Test:** Two-proportion z-test (binary) / t-test (continuous) with Bonferroni correction for 3 comparisons.
- **Effect size:** Risk difference + 95% CI.
- **Report:** Stratified table, p-values, CIs.

---

## Interview Analysis (Qualitative)

### Coding Framework
1. **Incident catalog:** Each incident → {failure_class, recovery_action, time_minutes, outcome, prevention_wish}
2. **Trust themes:** Code B4/B5 responses → {enabler, blocker, condition, workaround}
3. **Buyer journey:** Code B6/B7 → {decision_maker, budget_source, approval_steps, deal_breaker}
4. **Public/private delta:** Code B7 → {same, higher_private, higher_public, reason}

### Synthesis Method
- **Pattern matrix:** Rows = participants (anonymized), Columns = coded themes.
- **Saturation check:** After 5 interviews, assess if new incidents/themes emerge. If yes, recruit 2–3 more.
- **Divergence log:** Explicitly note where interviews contradict survey hypotheses.

### Integration with Survey
- **Triangulation:** Survey gives prevalence; interviews give mechanism/context.
- **Weight:** Survey = primary for H1–H10 tests; Interviews = explanatory for significant + non-significant findings.
- **Contradiction protocol:** If interview consensus contradicts survey majority, flag in results.md as "qualitative divergence — investigate."

---

## Reporting Template (results.md structure)

```markdown
# LACE Market Validation — Results

## Sample
- Screener completions: N
- Qualified surveys: n (exclusion rate: X%)
- Interviews completed: k
- Recruitment sources: table
- Demographics: table (role, team size, agent, repo privacy, experience)

## Primary Hypothesis Results
| Hypothesis | Result | Statistic | 95% CI | p-value | Verdict |
|---|---|---|---|---|---|
| H1: Verification ≥50% | SUPPORTED / NOT SUPPORTED | ... | ... | ... | FACT/EVIDENCE |
| H2: Recovery ≥30% | ... | ... | ... | ... | ... |
...

## Segmentation Results
- By agent: table
- By role: table
- By team size: table
- By repo privacy: table (H10)

## Interview Findings
- Incident catalog summary (table)
- Trust/delegation themes (quotes + counts)
- Buyer dynamics (decision map)
- Divergences from survey

## Limitations
- Sample biases (channel, enthusiast, survivorship)
- Self-report limitations
- Interview n small
- Agent ecosystem velocity

## Market Track Verdict
- H1–H10 summary: # supported, # not supported, # inconclusive
- Null hypotheses confirmed: list
- Overall: CONTINUE / PIVOT / KILL per decision mapping
- Recommended next experiment
```

---

## Statistical Rigor

- **Alpha:** 0.05 (two-tailed) for primary hypotheses.
- **Correction:** Bonferroni for H10 (3 comparisons → α=0.0167). No correction for H1–H9 (distinct constructs).
- **CIs:** 95% for all estimates (Wilson for proportions, bootstrap for medians).
- **Power:** Post-hoc observed power reported for non-significant results.
- **Software:** Python (scipy, statsmodels, pingouin) or R — scripts in `research/market/analysis/`.

---

## Decision Criteria (from hypotheses.md)

| Outcome | Criteria |
|---|---|
| **CONTINUE** | ≥3 of H1,H2,H8 validated (FACT/EVIDENCE) + H5,H7 not blocking (>30% trust, <80% hard block) |
| **PIVOT** | H1/H2 validated but H5/H7 blocking (trust <30% OR any non-delegable >80%) |
| **KILL** | H1-null confirmed (verification <30%) AND H8-null confirmed (WTP <5%) |
| **INCONCLUSIVE** | Sample <80 or >30% data quality flags |

---

## Provenance

- Pre-registered before data collection.
- Derived from: `research/market/hypotheses.md` (hypotheses, success criteria), `research/market/survey.md` (variables), `research/market/recruitment.md` (sample plan)
- Follows: `context/terminology.md` labeling, `context/brain.md` gate philosophy