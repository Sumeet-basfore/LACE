<!-- GENERATED ARTIFACT — COPIED FROM CANONICAL SOURCE -->
<!-- Canonical Source: research/market/hypotheses.md -->
<!-- Category: market -->
<!-- Synchronization: scripts/export_research.py -->

# LACE Market Validation — Hypotheses

**Status:** HYPOTHESIS · **Scope:** Market research design only. No data collection yet.
**Date:** 2026-09-03 · **Track:** A — Market Validation
**Predecessors:** `research/reports/08-product-problem-research.md`, `research/reports/12-parallel-research-synthesis.md`

---

## Core Hypotheses (to validate or falsify)

| ID | Hypothesis | Type | Falsification Signal |
|---|---|---|---|
| **H1** | Developers using coding agents manually verify ≥50% of generated patches before merging. | FACT-testable | Survey/interview shows <30% manual verification rate. |
| **H2** | Agent-generated changes require human recovery intervention in ≥30% of non-trivial tasks. | FACT-testable | Recovery rate <15% for multi-file / regression-sensitive tasks. |
| **H3** | The recovery/verification burden consumes ≥20% of total agent-assisted development time. | FACT-testable | Median reported time <10%. |
| **H4** | Current workarounds (git worktree, CI required checks, manual review) are rated "insufficient" by ≥40% of frequent agent users. | FACT-testable | ≥60% rate workarounds as "adequate" or "good enough." |
| **H5** | Developers would trust an external deterministic verifier that blocks merge on red/regression. | FACT-testable | <30% would enable such a gate by default. |
| **H6** | Developers would allow automated corrective retries with bounded evidence (not full context replay). | FACT-testable | <25% would delegate retries to a tool. |
| **H7** | There are actions developers would never delegate to an automated recovery system (push, merge, deploy, secrets). | FACT-testable | "Would delegate everything" responses >20%. |
| **H8** | Willingness to pay (WTP) exists: ≥15% of surveyed users would pay ≥$20/mo for verification + recovery automation. | FACT-testable | WTP at $20/mo <5%. |
| **H9** | Buyer persona differs by context: individuals buy for themselves; teams/EMs buy for policy; platform/security buys for compliance. | FACT-testable | No clear segmentation; single buyer type dominates. |
| **H10** | Value proposition differs between public/OSS work (lower trust barrier) and private/company repos (higher trust requirement, higher WTP). | FACT-testable | No statistically significant difference in WTP or trust thresholds between segments. |

---

## Supporting Assumptions (explicitly labeled)

| ID | Assumption | Label |
|---|---|---|
| A1 | "Coding agent users" = developers who use Claude Code, Codex, OpenCode, Aider, Cline, Roo, or similar tools at least weekly for feature work. | DEFINITION |
| A2 | Pain is concentrated in multi-file, regression-sensitive tasks (not single-file greenfield). | INFERENCE from F01/F02 |
| A3 | Current primitives (git worktree, CI checks) are used but not sufficient for *agent-specific* failure modes (loops, hallucinations, silent regression). | INFERENCE from F01 PM-1, PM-2, PM-4 |
| A4 | Trust boundary: developers will not send unredacted repo contents/secrets to an external verifier. | INFERENCE from security track D |
| A5 | WTP is correlated with team size, repo privacy, and regression cost (production incidents). | HYPOTHESIS |
| A6 | Market size is not "all developers" but "agent users on feature work with regression risk." | DECISION from synthesis §1 |

---

## Null Hypotheses (what would kill the market case)

| Null | If True, Implication |
|---|---|
| H1-null: Manual verification rate <30% | Pain not frequent enough; verification gate is niche. |
| H2-null: Human recovery rate <15% | Recovery automation solves a rare problem. |
| H4-null: Workarounds rated adequate by >60% | No wedge; existing tools suffice. |
| H5-null: Trust in external verifier <30% | Adoption barrier too high; local-only viable. |
| H8-null: WTP at $20/mo <5% | No viable business model at assumed price point. |

---

## Open Questions (not hypotheses — need exploratory data)

1. What is the actual frequency distribution of agent-assisted tasks per developer per week?
2. How does verification/recovery burden scale with task complexity (files changed, test suite size)?
3. What specific agent failure modes cause the most time loss (loops vs hallucinations vs regression vs provider errors)?
4. Do engineering managers perceive this pain differently than ICs?
5. What is the switching cost from current CI-required-checks workflow to a LACE-style gate?
6. How does the presence of existing security/compliance tooling affect WTP?

---

## Measurement Plan (per hypothesis)

| Hypothesis | Primary Measure | Method | Target Sample |
|---|---|---|---|
| H1 | % of patches manually verified | Survey (behavioral: "last 5 agent tasks, how many did you verify?") | n>100 |
| H2 | % of tasks requiring human recovery | Survey + interview (behavioral: "describe last recovery you did") | n>100 + 5 interviews |
| H3 | Time share of verification/recovery | Survey (estimate) + interview (walkthrough) | n>100 + 5 interviews |
| H4 | Workaround sufficiency rating | Survey (Likert 1-5 on each workaround) | n>100 |
| H5 | Trust in external verifier | Survey (scenario-based) + interview (probe boundaries) | n>100 + 5 interviews |
| H6 | Delegation willingness for retries | Survey (scenario: "tool retries with test name + traceback only") | n>100 |
| H7 | Non-delegable actions | Survey (checklist: push, merge, deploy, secrets, infra, DB migrate) | n>100 |
| H8 | WTP at price points | Survey (van Westendorp + direct choice at $10/20/50) | n>100 |
| H9 | Buyer segmentation | Survey (role, team size, who approves tool spend) + interview | n>100 + 5 interviews |
| H10 | Public vs private repo difference | Survey (stratified) + interview | n>100 |

---

## Limitations & Biases (to report in results)

- **Selection bias:** Recruitment from agent communities (Discord, GitHub, newsletters) over-represents enthusiasts.
- **Survivorship bias:** Users who quit agents due to frustration are harder to reach.
- **Self-report bias:** Behavioral questions mitigate but don't eliminate recall distortion.
- **Small interview sample:** 5 interviews = qualitative signal only, not statistical.
- **Agent ecosystem velocity:** Results may age quickly as agents improve.

---

## Success Criteria for Market Track

| Criterion | Threshold |
|---|---|
| Survey completes with n≥100 qualified respondents | REQUIRED |
| ≥3 hypotheses validated (FACT-supported) | REQUIRED for CONTINUE |
| ≥1 null hypothesis confirmed (FACT-supported) | ACCEPTABLE — informs pivot |
| Clear buyer segmentation with WTP signal | REQUIRED for GO-TO-PROTOTYPE |
| No critical trust blocker (H5, H7) confirmed | REQUIRED for GO-TO-PROTOTYPE |

---

## Decision Mapping

| Outcome | Market Track Verdict |
|---|---|
| H1, H2, H8 validated + H5, H7 not blocking | **CONTINUE** (pain + WTP + trust viable) |
| H1 or H2 null confirmed + H8 null confirmed | **KILL** (no pain, no pay) |
| H1/H2 validated but H5/H7 blocking | **PIVOT** (local-only, no external verifier) |
| H1/H2 validated, H8 weak, H5/H7 open | **CONTINUE** (narrower wedge, lower price) |

---

## Provenance

- Derived from: `research/reports/08-product-problem-research.md` §3 (pain points), `research/reports/12-parallel-research-synthesis.md` §1-3, §7, §10
- Terminology: `context/terminology.md`
- Gates: `context/brain.md` (T1/T2/T3/T4)