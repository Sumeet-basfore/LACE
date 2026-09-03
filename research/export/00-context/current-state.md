# LACE Current State

**Last Updated:** 2026-09-03  
**Status:** PIVOT — Verification-First Extension Hypothesis (Unproven)  
**Corpus Classification:** CLASS A (Canonical)  
**Source Provenance:** Synthesized from `context/brain.md`, `context/decisions.md`, `research/reports/07-phase2d-batch1-results.md`, `research/reports/12-parallel-research-synthesis.md`, and `docs/05-product-thesis.md`.

---

## Current Thesis

- **DECISION:** LACE is pursuing a **thin host-native extension** (MCP server + Claude Code plugin / OpenCode hook) rather than a standalone platform or runtime.
- **HYPOTHESIS:** Failure-aware **layered verification** can turn test failure evidence into minimal, actionable corrective context and recover agent failures at acceptable cost (median tokens ≤1.5× baseline) and latency without user intervention.
- **DECISION:** Standalone coding runtimes, multi-agent swarms as default, local-only architectures, and proprietary multiplexers are permanently rejected.

---

## What Has Been Validated

- **FACT:** Provider failures (HTTP 429 `FreeUsageLimitError`) were previously conflated with model failures (`EMPTY_OUTPUT`), contaminating exploratory runs. Harness error classification has been corrected, tested, and validated to fail closed with zero token consumption (`research/phase2d/analysis/provider-failure.md`, D-007, D-008).
- **EVIDENCE:** Real user friction exists around agent loops, hallucination, silent rollbacks, and regression across 67 retained GitHub issue reports from Claude Code, Aider, OpenCode, and Cline (`research/F01/report.md`). Zero of 67 issues requested multi-agent swarms.
- **EVIDENCE:** Naive full-context retry with generic feedback is economically inefficient: powered partial run (n≈7) yielded 0/5 recovery at ~2.97× median tokens and 2.08× latency (`research/experiment/scale/partial-run.md`, D-005).
- **EVIDENCE:** In Phase 2D Batch 1 (clean n=5 on SWE-bench Lite), the Current retry arm achieved 4/5 (80%) resolution at 1.07× median tokens vs baseline (2/5, 40%) (`research/reports/07-phase2d-batch1-results.md`).
- **EVIDENCE:** Standalone agent platforms lack defensibility; desk construction showed core extension primitives (MCP server ~250–350 LOC, Claude hook <100 LOC) can be reproduced in under 2 weeks (`research/F04/report.md`, D-002).

---

## What Has Not Been Validated

- **HYPOTHESIS:** Whether minimal corrective context (e.g., targeted pytest traceback only) can achieve recovery parity with generic full-context retry at lower token cost (untested, pending Ablation 1).
- **HYPOTHESIS:** Whether the Current arm's Batch 1 recovery advantage (80% vs 40%) reproduces on fresh tasks or is an artifact of small sample size (n=5).
- **HYPOTHESIS:** Whether layered verification can outperform baseline when patch application semantics match evaluation container fuzz tolerances.
- **HYPOTHESIS:** Market willingness-to-pay for an external verification gate over native git hooks and CI required checks (no pricing or conversion data exists).

---

## Strongest Evidence

1. **Batch 1 Clean Results (`research/reports/07-phase2d-batch1-results.md`):** 5 tasks × 3 arms executed with fresh evaluation containers and strict error categorization. Demonstrates empirical retry mechanics and token distributions on frozen SWE-bench Lite instances.
2. **User Problem Corpus (`research/F01/report.md`):** 67 verified developer issues proving that looping, test evasion, and lack of deterministic verification gates are real pain points across existing tools.
3. **Desk Defensibility Teardown (`research/F04/report.md`):** Definitive evidence that building a standalone coding runtime is easily replicated, justifying the pivot to a thin extension.

---

## Weakest Evidence

1. **Layered Verification Recovery:** Layered verification scored 0/5 in Batch 1 due to pre-Docker `git apply --check` rejections, leaving its recovery feedback loop unproven in production-like settings.
2. **Market Sizing & Willingness-to-Pay:** Corpus frequency (7–21% of examined issues) reflects sampling bias and does not prove willingness-to-pay. No buyer interviews or pricing surveys have been executed.
3. **Statistical Power:** All clean Phase 2D results to date are n=5 design experiments, not powered statistical validations (do not claim statistical significance).

---

## Current Risks

### Technical
- **Verification Semantic Disagreement:** Strict local verification (`git apply --check`) rejects valid patches that evaluation containers accept with fuzz, creating false-negative gate stops.
- **Context Overhead:** Multi-attempt recovery risks token blowup (>2× baseline) on hard problems without achieving resolution.
- **Feedback Quality:** Automated feedback extractors may generate empty assertion fields on complex test suites, providing the model with uninformative retry prompts.

### Market
- **Commodity Squeeze:** Incumbent coding agents (Claude Code, OpenCode, Cursor) may build native test-and-rollback hooks, eliminating the need for a third-party extension.
- **Friction Heterogeneity:** Developers are split on gate strictness; an overly strict gate causes developers to disable the tool.

### Security
- **Untrusted Execution Sink:** The verification engine runs untrusted agent-generated code inside Docker environments that require strict egress filtering and credential isolation.
- **Prompt Injection in Test Logs:** Malicious or adversarial code can emit jailbreaks in test output traces that get re-fed to the corrective agent.

### Moat
- **Low Barrier to Cloning:** The core mechanism (run test → capture traceback → re-prompt) can be implemented in ~30 lines of bash or a 100-line hook. LACE's only possible moat is empirical Pareto calibration data.

---

## Current Experiments

- **Phase 2D Batch 1:** COMPLETED on clean n=5 data. Layered arm failed design gate; Current arm demonstrated recovery gains.
- **Phase 2D Ablation 1:** IMPLEMENTED and FROZEN (`research/phase2d/ablation1/manifest.json`). Tests 10 fresh tasks across 4 arms (baseline, current, minimal, structured). Execution paused pending model quota.

---

## Current Decision

- **DECISION (D-001):** Pivot to thin verification-first extension (MCP + plugin).
- **DECISION (D-002):** Standalone runtime permanently rejected.
- **DECISION (D-007, D-008):** Discard contaminated historical runs; provider failures fail closed with zero token count.
- **DECISION (D-010):** Do not scale to n=30 powered runs until design gates pass on clean data.

---

## Next Decision Gate

- **Phase 2D Ablation 1 Analysis Gate:**
  - If `minimal` or `structured` feedback recovers ≥10pp over baseline at median tokens ≤1.5× baseline: **CONTINUE** to powered validation.
  - If `current` remains superior and `minimal`/`structured` fail: **REFINE** feedback extraction policy.
  - If all retry arms fail cost/recovery gates across n≥10: **KILL** automated recovery hypothesis and pivot strictly to passive verification/Pareto logging.

---

## Kill Conditions

1. **Recovery Failure:** Failure-aware recovery fails to demonstrate ≥10 percentage points improvement over baseline at ≤1.5× cost at n≥30.
2. **Economic Disadvantage:** Automated recovery costs more in tokens than having a human reject the attempt and prompt afresh.
3. **Native Preemption:** Major agent platforms ship robust verification gates natively before LACE demonstrates distinct value.
4. **Security Intractability:** Inability to sanitize test output traces against prompt injection without destroying corrective context.

---

## Last Updated

2026-09-03 (Repository State Audit & Corpus Pipeline Initialization).
