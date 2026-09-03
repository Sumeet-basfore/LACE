# LACE Market Validation — Results

**Status:** PENDING DATA · **Scope:** Results template. No data collected yet.
**Date:** 2026-09-03 · **Track:** A — Market Validation
**Predecessors:** `research/market/hypotheses.md`, `research/market/survey.md`, `research/market/recruitment.md`, `research/market/analysis-framework.md`

---

> **THIS FILE IS A TEMPLATE.** Fill after data collection and analysis per `analysis-framework.md`.
> Do not fabricate responses. Do not invent interviewees.
> Label every claim: FACT | EVIDENCE | INFERENCE | HYPOTHESIS | DECISION.

---

## Sample

| Metric | Value |
|---|---|
| Screener completions | |
| Qualified surveys (n) | |
| Exclusion rate | |
| Interviews completed (k) | |
| Recruitment period | |
| Recruitment sources | |

### Demographics (qualified surveys)

| Dimension | Distribution |
|---|---|
| Primary agent | |
| Role | |
| Team size | |
| Repo privacy (private >50%) | |
| Experience (years) | |
| Task complexity | |
| Recovery frequency (past 30d) | |

### Interview Participants (anonymized)

| ID | Role | Team Size | Agent | Repo Privacy | Recovery Incidents |
|---|---|---|---|---|---|
| I1 | | | | | |
| I2 | | | | | |
| I3 | | | | | |
| I4 | | | | | |
| I5 | | | | | |

---

## Primary Hypothesis Results

| Hypothesis | Result | Statistic | 95% CI | p-value | Label |
|---|---|---|---|---|---|
| **H1:** Verification rate ≥50% | | | | | |
| **H2:** Recovery incidents ≥30% of tasks | | | | | |
| **H3:** Recovery time share ≥20% | | | | | |
| **H4:** Workarounds insufficient ≥40% | | | | | |
| **H5:** Trust verifier ≥30% enable default | | | | | |
| **H6:** Delegate retries ≥25% | | | | | |
| **H7:** Non-delegable actions (per action) | | | | | |
| **H8:** WTP at $20/mo ≥15% | | | | | |
| **H9:** Buyer segmentation (authority × WTP) | | | | | |
| **H10:** Public vs Private difference | | | | | |

### H1 Detail: Verification Frequency
- Overall mean rate:
- Median rate:
- Distribution (histogram):
- By segment:

### H2 Detail: Recovery Incidents
- Incidents per 30 days (mean/median):
- Per-task rate (if tasks estimated):
- By failure class:
- By segment:

### H3 Detail: Time Share
- Median recovery time per incident:
- Estimated agent-hours/week:
- Time share (median, CI):
- Sensitivity (5/10/20 hrs/week):

### H4 Detail: Workaround Sufficiency
| Workaround | % Not Used | % ≤2 (Insufficient) | % 3 (Adequate) | % ≥4 (Good/Excellent) |
|---|---|---|---|---|
| git worktree | | | | |
| CI required checks | | | | |
| Manual review | | | | |
| Local tests | | | | |
| Agent self-check | | | | |
| Scope limiting | | | | |

### H5 Detail: Trust in External Verifier
- Enable by default: % (CI)
- By repo privacy:
- By role:
- By recovery frequency:
- Reasons for disable (coded):

### H6 Detail: Delegation of Retries
- Allow auto-retry: % (CI)
- By error type:
- By trust_verifier:
- Non-delegable actions (% per action):

### H7 Detail: Non-Delegable Actions (Ranked)
| Action | % Never Delegate | 95% CI |
|---|---|---|
| git push | | |
| git merge / PR | | |
| Deploy | | |
| DB migrations | | |
| Secrets / credentials | | |
| Infrastructure | | |
| Install deps | | |
| Arbitrary shell | | |

### H8 Detail: Willingness to Pay
- Direct choice at $20/mo: % Yes (CI)
- Van Westendorp:
  - Too expensive (median):
  - Expensive but consider (median):
  - Bargain (median):
  - Too cheap (median):
  - OPP / IDP:
- By buyer authority:
- By team size:

### H9 Detail: Buyer Segmentation
- Cross-tab: authority × WTP × team size
- Logistic regression (WTP ~ authority + team size + role + agent):

### H10 Detail: Public vs Private Repo
| Metric | Private >50% | Public >50% | Diff | p-value |
|---|---|---|---|---|
| Trust verifier | | | | |
| Delegate retries | | | | |
| WTP $20/mo | | | | |

---

## Interview Findings

### Incident Catalog (from interviews)
| Incident | Failure Class | Recovery Action | Time (min) | Outcome | Prevention Wish |
|---|---|---|---|---|---|
| I1-1 | | | | | |
| I1-2 | | | | | |
| ... | | | | | |

### Trust & Delegation Themes
| Theme | Enablers | Blockers | Conditions | Representative Quotes |
|---|---|---|---|---|
| Verifier trust | | | | |
| Auto-retry trust | | | | |
| Non-delegable rationale | | | | |

### Buyer Dynamics
| Participant | Decision Maker | Budget Source | Approval Steps | Deal Breakers |
|---|---|---|---|---|
| I1 | | | | |
| I2 | | | | |
| ... | | | | |

### Divergences from Survey
| Survey Hypothesis | Interview Consensus | Note |
|---|---|---|
| | | |

---

## Limitations

- **Selection bias:**
- **Self-report bias:**
- **Sample size constraints:**
- **Channel biases:**
- **Interview n small:**
- **Agent velocity:**
- **Data quality flags:**

---

## Market Track Verdict

### Hypothesis Summary
- Supported (FACT/EVIDENCE): H_
- Not supported: H_
- Inconclusive: H_
- Null confirmed: H_

### Decision Mapping
| Criterion | Status |
|---|---|
| ≥3 of H1,H2,H8 validated | |
| H5 not blocking (trust ≥30%) | |
| H7 not blocking (no action >80%) | |
| Overall verdict | **CONTINUE / PIVOT / KILL / INCONCLUSIVE** |

### Recommended Next Experiment
- If CONTINUE:
- If PIVOT:
- If KILL:
- If INCONCLUSIVE:

---

## Provenance

- Data collected: [dates]
- Analysis script: `research/market/analysis/analyze.py` (commit hash)
- Raw data: [storage location, retention policy]
- Analyst: [name/role]
- Reviewer: [name/role]