# LACE Current State Overview

**Status:** PIVOT — Verification-First Extension Hypothesis (Unproven)  
**Date:** 2026-09-03  
**Corpus Export Layer:** Top-Level Executive Orientation for NotebookLM  
**Provenance:** Derived from `context/brain.md`, `context/decisions.md`, `research/reports/07-phase2d-batch1-results.md`, and `research/reports/12-parallel-research-synthesis.md`.

---

## WHAT WE KNOW [FACT / EVIDENCE]

- **FACT:** Naive retry with full-context and generic feedback is economically expensive: powered partial run (n≈7) yielded 0/5 recovery at ~2.97× median tokens and 2.08× latency (`research/experiment/scale/partial-run.md`, D-005).
- **FACT:** Phase 2D Batch 1 (clean n=5 on SWE-bench Lite) resolved 2/5 (40%) on baseline, 4/5 (80%) on current retry, and 0/5 (0%) on layered verification (`research/reports/07-phase2d-batch1-results.md`).
- **FACT:** Layered verification in Batch 1 failed its design gate: median tokens were 2.96× baseline (limit was 1.5×), and it regressed on tasks baseline already solved (matplotlib, seaborn) due to a strict pre-Docker `git apply --check` gate (`research/reports/07-phase2d-batch1-results.md`).
- **FACT:** Provider errors (HTTP 429 `FreeUsageLimitError`) previously contaminated raw runs by being misclassified as `EMPTY_OUTPUT`. The harness error taxonomy has been fixed and regression-tested to fail-closed without consuming tokens (D-007, D-008).
- **EVIDENCE:** Real user friction around agent loops, hallucinated file paths, state loss, and unverifiable rollbacks exists across 67 retained GitHub issues across Claude Code, Aider, OpenCode, and Cline (F01). Zero of 67 issues requested multi-agent swarms.
- **EVIDENCE:** Standalone coding runtime is not defensible: desk construction shows core primitives (MCP ~250–350 LOC, hook <100 LOC) can be reproduced in under 2 weeks (F04, D-002).

---

## WHAT WE THINK [INFERENCE]

- **INFERENCE:** ~90% of proposed LACE capabilities (worktree isolation, test execution, retry loops, JSONL logging) are commodity building blocks. Any defensible value resides strictly in **policy and calibration** (failure classification, minimal corrective feedback payloads, and Pareto-optimal verification stopping rules).
- **INFERENCE:** The stricter `git apply --check` in the layered harness caused false negatives compared to SWE-bench's native `patch --fuzz=5` fallback, causing layered to fail before running targeted pytest.
- **INFERENCE:** The most plausible user is an engineer or small team already using Claude Code, OpenCode, or Aider doing multi-file feature development where reversibility and regression matter. Single-file or greenfield users do not need LACE.
- **INFERENCE:** Mandatory blocking gates will alienate half of potential users due to friction heterogeneity; gates must offer configurable advisory vs. blocking modes.

---

## WHAT WE DON'T KNOW [OPEN UNCERTAINTIES]

- **UNKNOWN:** Whether minimal corrective context (e.g., targeted pytest traceback only) can achieve recovery parity with generic full-context retry at lower token cost.
- **UNKNOWN:** Whether the Current arm's Batch 1 recovery advantage (80% vs 40%) reproduces on fresh tasks or is an artifact of small sample size (n=5).
- **UNKNOWN:** Market willingness-to-pay (WTP) for an external verification gate over native git hooks and CI required checks.
- **UNKNOWN:** Whether prompt injection in test outputs can be safely neutralized without breaking corrective feedback fidelity.

---

## CURRENT HYPOTHESIS

- **Product Hypothesis:** Failure-aware verification can convert verification evidence into minimal, actionable corrective context and enable bounded recovery at acceptable cost (<1.5× baseline) and latency without user intervention.
- **Architecture Hypothesis:** A thin host-native extension (MCP server + Claude Code plugin / OpenCode hook) is the only viable architectural form factor; standalone runtimes are rejected.

---

## CURRENT DECISION

- **Direction:** PIVOT (not GO, not KILL) — focus exclusively on a thin verification-first extension (D-001).
- **Standalone Runtime:** Permanently REJECTED (D-002).
- **Multi-Agent Orchestration:** REJECTED as core; stays strictly experimental (D-004).
- **Experiment Gate:** Do not scale to n=30 powered runs until the Phase 2D design gate passes on clean data (D-010).
- **Ablation 1 Protocol:** Execute Phase 2D Ablation 1 (comparing baseline, current, minimal, and structured feedback) once model quota is available, without modifying manifest or parameters.

---

## KEY EVIDENCE

1. `research/reports/07-phase2d-batch1-results.md`: Clean 5-task 3-arm empirical result establishing Current arm (80% resolved, 1.07× median tokens) vs. Layered arm (0% resolved, 2.96× median tokens).
2. `research/experiment/scale/partial-run.md`: 0/5 recovery, 2.97× tokens in naive full-suite retry.
3. `research/F01/report.md`: 67 real-world developer issue reports detailing looping, regression, and trust failure modes.
4. `research/F04/report.md`: Teardown proving standalone coding-agent platforms lack moat and fail pre-registered gate T4.
5. `research/reports/12-parallel-research-synthesis.md`: Integrated cross-track synthesis on user profile, core data model (6 entities), commodity analysis, and security constraints.

---

## OPEN QUESTIONS

1. **Verification Disagreement:** Does relaxing `git apply` checks to match evaluation container fuzz semantics recover the baseline wins lost on matplotlib and seaborn?
2. **Minimal Payload Efficiency:** What is the cheapest feedback payload in bytes that triggers successful model self-correction?
3. **Enterprise Privacy vs. Cloud Feedback:** Can a local-only verification gate provide value if corrective retry prompts must be sent to third-party cloud LLM providers?

---

## NEXT EXPERIMENT

- **Phase 2D Ablation 1:** Execute the frozen 10-task × 4-arm protocol (`baseline`, `current`, `minimal`, `structured`) specified in `research/phase2d/ablation1/manifest.json` and `protocol.md`.
- **Purpose:** Determine whether minimal targeted feedback can match the recovery rate of generic full-context retry while keeping median tokens strictly below the 1.5× baseline ceiling.

---

## KILL CRITERIA

LACE project will be formally terminated (KILL) if:
1. **Recovery Inefficacy (T1 Gate Failure):** Phase 2D Ablation 1 fails to demonstrate that structured or minimal feedback achieves ≥10 percentage points recovery improvement over baseline at ≤1.5× token cost at n≥30.
2. **Economic Non-Viability:** The cheapest corrective feedback payload requires >2× baseline tokens, making human rejection and re-prompting cheaper than automated recovery.
3. **Moat Collapse:** Native tool providers (Anthropic Claude Code, OpenCode) implement deterministic test-failure rollback hooks natively, rendering an external extension redundant before differentiation is established.
4. **Security Blocker:** Sandboxing and unredacted prompt-injection risks cannot be contained within acceptable open-source risk thresholds.
