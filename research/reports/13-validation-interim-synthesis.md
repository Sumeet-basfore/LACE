# LACE Validation — Interim Synthesis (Phase 3)

**Date:** 2026-09-03 · **Scope:** Synthesis of three parallel validation workstreams (A: Market, B: Security, C: Core Model). No new research. No SWE-bench. No Phase-2D modification. No production code.
**Status:** WORKSTREAMS IN PROGRESS — artifacts created, data collection not started.
**Predecessors:** `research/reports/12-parallel-research-synthesis.md`, `context/brain.md`, `context/decisions.md`, `context/terminology.md`

---

## 1. Executive Assessment

**Current State:** LACE is in a **validation phase**, not a product phase. The core hypothesis — that a thin verification/recovery layer around existing coding agents has a defensible core — remains **unproven**. Three independent workstreams have been designed with explicit artifacts, hypotheses, and success criteria. No data has been collected.

**Key Tension:** The technical mechanism (layered verification + minimal evidence recovery) has a coherent conceptual model (Track C) and identified security requirements (Track B), but **zero implementation exists** for the security controls that are prerequisites for private-repo use. Market demand (Track A) is unmeasured.

**Posture:** **CONTINUE** — validation is the correct activity. Do not build product. Do not run contaminated experiments. Complete the three workstreams, then decide.

---

## 2. Workstream Status Summary

| Track | Artifacts Created | Data Collected | Hypotheses Testable | Blockers |
|---|---|---|---|---|
| **A: Market** | 5 (hypotheses, survey, interview guide, recruitment, analysis framework, results template) | No | 10 (H1–H10) | Recruitment execution; incentive budget |
| **B: Security** | 7 (threat-model, trust-boundaries, data-handling, security-requirements, attack-cases, redaction-tests, injection-tests, sandbox-tests, analysis) | No | 18 attack cases + 31 MUST requirements | Zero implementation; no sandbox; no redaction |
| **C: Core Model** | 6 (concepts, lifecycle, event-model, recovery-policy, measurement-contract) + existing | N/A (conceptual) | 8 assumptions (HYPOTHESIS) | Depends on Track B for security; Track A for market |

---

## 3. Track A — Market Validation

### Artifacts
- `research/market/hypotheses.md` — 10 core hypotheses (H1–H10) + 3 null hypotheses
- `research/market/survey.md` — Behavioral survey (5-task anchor, 30-day recall, van Westendorp WTP)
- `research/market/interview-guide.md` — 45-60 min critical incident interviews (5+ target)
- `research/market/recruitment.md` — Multi-channel plan (Discord, GitHub, Reddit, X, newsletters, paid panel)
- `research/market/analysis-framework.md` — Pre-registered statistical tests, segmentation plan
- `research/market/results.md` — Reporting template

### Key Hypotheses
| Hypothesis | Threshold | Falsification |
|---|---|---|
| H1: Manual verification ≥50% | Mean rate ≥0.5 | <30% |
| H2: Recovery incidents ≥30% of tasks | Rate ≥0.3 | <15% |
| H4: Workarounds insufficient ≥40% | % rating ≤2 | >60% rate adequate |
| H5: Trust external verifier ≥30% | Enable-by-default ≥30% | <30% |
| H8: WTP at $20/mo ≥15% | Direct choice Yes ≥15% | <5% |

### Unknowns (Track A)
- Actual population prevalence of agent users on feature work
- Selection bias in agent communities (enthusiasts overrepresented)
- Survivorship bias (frustrated quitters unreachable)
- Agent velocity — results may age in weeks
- Buyer segmentation clarity (individual vs team vs platform)

### Track A Verdict (Projected)
**If H1, H2, H8 validated + H5/H7 not blocking → CONTINUE**
**If H1-null + H8-null confirmed → KILL**
**If H1/H2 validated but H5/H7 blocking → PIVOT (local-only)**

---

## 4. Track B — Security / Trust Validation

### Artifacts
- `docs/security/threat-model.md` — 9 threats (T1–T9), 7 assets, trust zones Z1–Z7
- `docs/security/trust-boundaries.md` — 7 zones, data flows, TCB (<2000 LOC), residual risks
- `docs/security/data-handling.md` — Ingress/egress/persistence/redaction policy
- `docs/security/security-requirements.md` — 31 MUST requirements + status tracker
- `research/security/attack-cases.md` — 18 attack cases (AC-T1-01 through AC-T9-02) with test methods
- `research/security/redaction-tests.md` — 50+ test cases across 6 pattern types + evasion
- `research/security/injection-tests.md` — 20+ injection tests across 6 categories
- `research/security/sandbox-tests.md` — 40+ sandbox tests across 9 categories
- `research/security/analysis.md` — Attack matrix + implementation status

### Attack Matrix Status (18 attacks)
| Attack | Control | Status |
|---|---|---|
| 1. Prompt injection via repo files | Structured evidence + delimiters | NOT TESTED |
| 2. Prompt injection via test output | Structured parsing + bounds | NOT TESTED |
| 3. Malicious patch instructions | Layer 1 static screen | NOT TESTED |
| 4. Secrets in env vars | Env allowlist + redaction | NOT TESTED |
| 5. Secrets in tracebacks/logs | Redaction at capture + re-prompt | NOT TESTED |
| 6. Data leakage via retry feedback | Redaction before re-prompt | NOT TESTED |
| 7. Data leakage via persisted logs | Redact-then-write + hash-chain | NOT TESTED |
| 8. Network exfiltration | No egress + Layer 1 screen | NOT TESTED |
| 9. Destructive git ops | Throwaway worktree + denylist | NOT TESTED |
| 10. Destructive Docker ops | No docker socket + denylist | NOT TESTED |
| 11. Repo hook execution | --no-verify + no auto-run | NOT TESTED |
| 12. Container/worktree escape | Drop caps + seccomp + userns | NOT TESTED |
| 13. Sensitive material persistence | Bounded retention + prune | NOT TESTED |
| 14. Provider-side exposure | Minimize context + pin model | NOT TESTED |
| 15. Malicious path targeting | RO baseline + worktree isolation | NOT TESTED |
| 16. Oversized output poisoning | Bounded capture + limits | NOT TESTED |
| 17. Retry-loop abuse | Bounded retries (≤2) + D-008 | DESIGNED |
| 18. Failure-induced priv escalation | Fixed allowlist + no sudo | NOT TESTED |

### Control Implementation Status
- **VERIFIED:** 0
- **TESTED:** 0
- **IMPLEMENTED:** 0
- **DESIGNED:** 7 (policy docs only)
- **NOT IMPLEMENTED:** 31 (all MUST requirements)

### Critical Gaps (Blocking GO-TO-PROTOTYPE)
1. **No verification executor** — cannot run verification safely
2. **No redaction engine** — secrets leak to ledger, provider, prompts
3. **No injection-hardened prompt pipeline** — injection path open
4. **No sandbox profile** — no isolation guarantee
5. **No destructive command denylist/allowlist** — arbitrary execution possible
6. **No env allowlist** — all host secrets leak to executor
6. **No command allowlist** — shell interpolation allowed

### Security Readiness: **LOW** (per `research/reports/12-parallel-research-synthesis.md` §8)
- Credible promise today: **verifiability only** (local gates, separated classes)
- Confidentiality (no-leak): **HYPOTHESIS** — needs redaction + sandbox
- Tamper-evidence: **HYPOTHESIS** — needs hash-chained JSONL + bounded retention

### Track B Verdict (Projected)
**No GO-TO-PROTOTYPE until all MUST requirements ≥ TESTED.**
**Current path:** Implement executor → redaction → prompt pipeline → denylist/allowlist → ledger → adversarial tests.

---

## 5. Track C — Core Model + Measurement Contract

### Artifacts
- `docs/core/concepts.md` — 6 fundamental + 3 derived entities (FACT/INFERENCE)
- `docs/core/lifecycle.md` — 9-state machine, bounded context, immutable events
- `docs/core/event-model.md` — 7-event append-only log, bounded payloads
- `docs/core/recovery-policy.md` — 13-class matrix with per-class caps, evidence, verification
- `docs/core/measurement-contract.md` — 4 primary outcomes, 4 cost, 3 process metrics + statistical gates

### Irreducible Core (DECISION from Track B synthesis)
**Fundamental (6):** Task, Attempt, Verification, Evidence, Outcome, Cost
**Derived (3):** Patch (Attempt.output), Failure (classify(Evidence)), Recovery (edge decision)

### Lifecycle (DECISION)
`PENDING → ATTEMPTING → VERIFYING → CLASSIFIED → {RECOVERING → ATTEMPTING... | PROVEN | FAILED | STOPPED}`
- **Bounded:** ≤2 retries (3 attempts) global; provider/infra = 0 budget (D-008)
- **Cheapest first:** L1 (0.1s) → L2 (~80s) → L3 (regression)
- **Stop ≠ Fail:** STOPPED = untried, excluded from recovery accounting

### Measurement Contract — Primary Gates
| Gate | Metric | Threshold | Status |
|---|---|---|---|
| D-010 | Layered > Current at ≤1.5×, regression non-inferior | n=7 clean | BLOCKED (quota) |
| T1 | ≥10pp resolution gain at ≤2× cost/latency, regression ≤ baseline | n≥30 Verified | HYPOTHESIS |
| T2 | >30% time-to-green or >50% fewer interventions | n≥20 | HYPOTHESIS |
| T3 | ≥40% orgs require local verification | 5 interviews | HYPOTHESIS |
| T4 | 2-week replication spike | Desk estimate | HYPOTHESIS |

### Unresolved Calibration Values (HYPOTHESIS)
- Minimal evidence payload sufficiency (test name + assertion + traceback + hunk?)
- Reviewer cost/benefit (~20k tokens vs extra retry)
- Timeout reshaping factor (0.5× context, 0.7× timeout)
- Retry cap optimality (TEST_FAILURE=2 vs others=1)
- Evidence budget (≤2000 chars), Context budget (≤50k tokens)

### Track C Verdict
**Conceptually coherent; empirically empty.** The model is the smallest sufficient description of the lifecycle. All effectiveness claims are HYPOTHESIS pending clean Phase 2D (D-010) and T1.

---

## 6. Cross-Workstream Contradictions

| Contradiction | Tracks | Severity | Resolution Path |
|---|---|---|---|
| **Market wants external verifier (H5)** but **Security says provider sees all prompt content (T7)** | A vs B | HIGH | Redaction + minimization must be VERIFIED before private-repo market |
| **Market WTP at $20/mo (H8)** but **Security readiness LOW** (no private-repo safe) | A vs B | HIGH | WTP likely lower for public-only; segment H10 critical |
| **Core model assumes structured evidence works** but **Security injection tests not run** | C vs B | MEDIUM | Injection test suite must pass before trusting evidence→prompt |
| **Core model assumes sandbox isolation** but **No sandbox exists** | C vs B | HIGH | Executor implementation is prerequisite for any recovery claim |
| **Market assumes automated retries acceptable (H6)** but **Security says retry-loop abuse possible (Attack 17)** | A vs B | MEDIUM | Bounded retries (≤2) designed; must be TESTED |
| **Core model measures cost/latency** but **Security controls add overhead (sandbox, redaction)** | C vs B | MEDIUM | Overhead must be measured in Ωₜ, Ωₗ; may push past 2× guardrail |

---

## 7. What Remains Unknown (Critical Unknowns)

| Unknown | Workstream | Cost to Resolve |
|---|---|---|
| Does layered recovery beat current at ≤1.5× with regression non-inferior? | C (D-010) | Low (n=7 clean rerun, quota-guarded) |
| What share of agent users will pay for verification vs `worktree` + CI? | A (H1, H8, H10) | Low-Med (survey n>100 + 5 interviews) |
| Can redaction + sandbox actually hold (no-leak, no-escape, no-injection)? | B | Med (redaction recall + injection suite + sandbox review) |
| Does powered Pareto win exist (≥10pp, ≤2×, n≥30+rolling)? | C (T1) | High (~4–6 weeks Verified + billing + regression split) |
| What is minimum recovery payload, and when does reviewer pay? | C (calibration) | Low (arm variants in n=7) |
| Population prevalence / WTP for private-repo use | A (H10) | Low-Med (stratified survey) |
| Cross-task generalization beyond n=7 | C | Med (larger manifest) |

---

## 8. Assumption Strength Changes (vs Prior Synthesis)

| Assumption | Prior (Report 12) | Current | Change |
|---|---|---|---|
| Pain exists (PM-1..PM-8) | EVIDENCE (F01 corpus) | **UNCHANGED** — corpus evidence stands |
| Layered recovery cheaper than current | HYPOTHESIS | **UNCHANGED** — D-010 blocked |
| Minimal evidence suffices for recovery | HYPOTHESIS | **UNCHANGED** — untested |
| Security readiness LOW | DECISION | **CONFIRMED** — 0/31 MUST implemented |
| Market prevalence unvalidated | HYPOTHESIS | **UNCHANGED** — survey designed |
| Powered Pareto unproven | HYPOTHESIS | **UNCHANGED** — T1 not run |
| Moat = continuously refreshed Pareto | INFERENCE | **UNCHANGED** — requires T1 |
| Standalone has no moat | DECISION (D-002, D-004) | **CONFIRMED** — commodity composition |
| Extension's only moat = unmeasured number | INFERENCE | **UNCHANGED** |
| Contaminated Phase 2D discarded | DECISION (D-007) | **ENFORCED** — no silent changes |

### Stronger Assumptions
- Security requirements are now **explicitly specified** (31 MUSTs) with test cases — clearer path to VERIFIED.
- Market hypotheses are **behavioral not preference-based** — stronger signal if validated.
- Core model is **smaller** (6 fundamental vs 9) — less to implement wrong.

### Weaker Assumptions
- **Zero implementation** for security controls — larger gap than prior synthesis implied.
- **Quota block** on D-010 means no empirical progress on core mechanism since Batch 1.
- **Evasion vectors** for redaction/injection documented — recall/precision cannot be assumed.

---

## 9. Recommended Next Experiments (Priority Order)

| Priority | Experiment | Workstream | Cost | Gates |
|---|---|---|---|---|
| **1** | Clean Ablation 1 rerun (n=7, 4 arms, quota-guarded) | C | Low (quota) | D-010 |
| **2** | Market survey + interviews (n>100, 5+) | A | Low-Med ($1.5k) | H1, H2, H5, H8 |
| **3** | Verification executor (Docker) + SBX-LIF/NET/FS tests | B | Med | SR-T1-01..05 |
| **4** | Redaction engine + RED-* (C1 synthetic) tests | B | Med | SR-T5-01..03 |
| **5** | Evidence extractor + prompt renderer + INJ-* static tests | B | Med | SR-T4-01..04 |
| **6** | Destructive denylist + command allowlist + env allowlist | B | Low | SR-T9-02, SR-T5-04 |
| **7** | Hash-chained JSONL ledger + bounded retention | B | Low | SR-CC-04 |
| **8** | Adversarial escape tests (SBX-ESC-*) | B | Med (privileged env) | SR-T1-01 |
| **9** | T1 powered run (n≥30 Verified, rolling split) | C | High | T1 gate |

**Do NOT:** Run Ablation 1 while quota blocked. Change model/provider in Ablation 1. Run large SWE-bench. Build product code.

---

## 10. Current Decision: **CONTINUE**

### Decision Rationale
| Criterion | Evaluation |
|---|---|
| **A. Meaningful pain exists?** | EVIDENCE (F01 corpus, 8 pain points) — but population prevalence unknown |
| **B. Pain frequent/severe?** | HYPOTHESIS — H1/H2 untested at population level |
| **C. Pain unsolved enough?** | HYPOTHESIS — H4 (workarounds insufficient) untested |
| **D. Willingness to pay?** | HYPOTHESIS — H8 (WTP) untested |
| **E. Mechanism operates safely?** | **NO** — Security readiness LOW, 0/31 MUST implemented |
| **F. Mechanism simple enough?** | YES — 6-entity core, 13-class policy, layered verification |
| **G. Plausible moat?** | HYPOTHESIS — requires T1 (powered Pareto) |
| **H. General across models/agents?** | HYPOTHESIS — only tested on muse-spark-1.2/opencode |

### Why Not KILL?
- Pain evidence exists (corpus), not zero.
- Mechanism not disproven — only unproven (contaminated data discarded per D-007, not failed).
- Narrow wedge (verification/recovery layer) survives commodity elimination.

### Why Not PIVOT?
- No alternative reliability mechanism identified with stronger evidence.
- Current mechanism has coherent model and designed security path.

### Why Not GO-TO-PROTOTYPE?
- **Security readiness LOW** — cannot attach to private repos.
- **Mechanism evidence absent** — D-010 blocked by quota; no clean data.
- **Market evidence absent** — no survey/interview data.
- **MOAT unproven** — T1 not run.

---

## 11. Final Synthesis Report Structure (when workstreams complete)

When all three workstreams produce sufficient evidence:

```
TRACK A: Market
  status: COMPLETE / INCOMPLETE
  key findings: [H1–H10 results, nulls, segments]
  confidence: HIGH / MEDIUM / LOW
  unknowns: [list]

TRACK B: Security
  status: COMPLETE / INCOMPLETE
  key findings: [MUST requirements status, attack matrix results, redaction/injection/sandbox metrics]
  confidence: HIGH / MEDIUM / LOW
  unknowns: [list]

TRACK C: Core Model
  status: COMPLETE / INCOMPLETE
  key findings: [D-010 result, calibration values, T1 readiness]
  confidence: HIGH / MEDIUM / LOW
  unknowns: [list]

OVERALL:
  strongest validated assumption: [e.g., "Pain exists for agent users on feature work"]
  weakest assumption: [e.g., "Willingness to pay at $20/mo for private-repo use"]
  biggest business risk: [e.g., "Market too small / WTP too low"]
  biggest technical risk: [e.g., "Layered recovery doesn't beat current at ≤1.5×"]
  biggest security risk: [e.g., "Redaction recall <99% on real repos"]
  biggest moat risk: [e.g., "Pareto number easily copied once published"]
  next cheapest information-positive experiment: [e.g., "Clean Ablation 1 rerun"]
  current decision: KILL / PIVOT / CONTINUE / GO-TO-PROTOTYPE
```

---

## 12. Stop Condition Check

> **If all three workstreams produce sufficient evidence and no critical unresolved contradiction remains, stop and present the synthesis.**

**Current:** All three workstreams have **artifacts designed** but **zero data collected**. Critical contradictions exist (A vs B on private-repo safety vs WTP; C vs B on mechanism assumptions vs security implementation).

**Action:** Execute workstreams in priority order (1→9 above). Do not synthesize until data exists.

---

## Provenance

- Synthesized from: Track A artifacts (`research/market/*.md`), Track B artifacts (`docs/security/*.md`, `research/security/*.md`), Track C artifacts (`docs/core/*.md`)
- Prior synthesis: `research/reports/12-parallel-research-synthesis.md`
- Gates: `context/brain.md` (T1–T4), `context/decisions.md` (D-001–D-010)
- Labels: FACT | EVIDENCE | INFERENCE | HYPOTHESIS | DECISION per `context/terminology.md`
- No fabricated data, benchmarks, pricing, user counts, or market demand.
- All claims labeled; limitations explicit.