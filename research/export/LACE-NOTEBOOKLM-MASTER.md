# LACE Research Corpus — Master Synthesis Document

**Status:** CANONICAL MASTER SYNTHESIS  
**Date:** 2026-09-03  
**Corpus Export Layer:** Single High-Signal Grounding Document for NotebookLM Interrogation  
**Epistemic Standard:** FACT | EVIDENCE | INFERENCE | HYPOTHESIS | DECISION

---

## 1. Executive Context

LACE is a research initiative investigating whether **failure-aware verification** can improve the reliability of AI coding agents without requiring massive context expansion, unbounded retries, or expensive multi-agent architectures.

The project operates under a strict epistemic discipline: benchmark results are evidence for harness design and error-recovery algorithms, not validation of product-market fit. The current state is an active **PIVOT** (Decision D-001) toward a thin, host-native extension (MCP server + Claude Code plugin / OpenCode hook). Standalone platform runtimes and default multi-agent swarms have been permanently rejected based on empirical desk teardowns and cost evaluations.

*Source: `context/brain.md`, `context/decisions.md`*

---

## 2. Original Thesis

The original hypothesis behind LACE postulated that an autonomous, end-to-end coding platform with dedicated agent multiplexing, continuous execution logging, and custom agent runtimes could serve as a superior replacement for standard IDE extensions and ad-hoc terminal agents. It assumed that higher autonomy and multi-agent coordination would naturally overcome single-agent reasoning failures on complex software engineering benchmarks.

*Source: `docs/01-research.md`, `docs/05-product-thesis.md`*

---

## 3. What Changed (The Evidence-Driven Pivot)

Four empirical findings dismantled the original thesis during Phase 2 investigations:

1. **Standalone Runtime Defensibility Failed (EVIDENCE):** A competitive desk-construction analysis demonstrated that the core primitives of an agent harness (worktrees, execution hooks, JSONL logging) can be reproduced by a single engineer in under 2 weeks using standard MCP servers (~250–350 LOC) and Claude Code hooks (<100 LOC). Standalone platforms have no defensible moat against incumbent host platforms.  
   *Source: `research/F04/report.md`, `context/decisions.md` (D-002)*

2. **Multi-Agent Inefficiency (EVIDENCE):** Multi-agent orchestration architectures inflated token costs by 3× to 10× without producing statistically significant gains on SWE-bench tasks compared to well-prompted single agents. Furthermore, in an audit of 67 real-world developer issues, zero users requested multi-agent teams.  
   *Source: `research/reports/01-research-synthesis.md`, `research/F01/report.md`, `context/decisions.md` (D-004)*

3. **Naive Retry Economics Failed (EVIDENCE):** The common industry approach of feeding full test suite failures and generic error logs back to the model in an unconstrained retry loop resulted in 0/5 recoveries on hard tasks while blowing median token costs to 2.97× baseline and doubling latency.  
   *Source: `research/experiment/scale/partial-run.md`, `context/decisions.md` (D-005)*

4. **Provider Error Contamination (FACT):** Early automated experiments were contaminated when provider rate limits (HTTP 429 `FreeUsageLimitError`) were misclassified as model `EMPTY_OUTPUT`, causing blind retries that masked real model capabilities.  
   *Source: `research/phase2d/analysis/provider-failure.md`, `context/decisions.md` (D-007)*

---

## 4. Current Thesis

LACE is currently testing the **Verification-First Extension Hypothesis**:

> **HYPOTHESIS:** Failure-aware layered verification can convert test and execution evidence into minimal, actionable corrective context, enabling bounded self-correction at acceptable token cost ($\le 1.5\times$ baseline) and latency without requiring human intervention or full-context re-prompting.

The product form is strictly constrained to a **thin host-native extension**:
- **`lace-ledger`**: An MCP server providing append-only JSONL Pareto logging (`% resolved`, regression rate, token expenditure, and latency).
- **`lace-gate`**: A lightweight execution hook for Claude Code, OpenCode, or Aider that intercepts completed attempts, executes deterministic verification in an isolated container/worktree, and dispatches minimal corrective feedback.

*Source: `docs/05-product-thesis.md`, `context/brain.md`*

---

## 5. Competitive Landscape & Commodity Analysis

An exhaustive audit of 12 incumbent coding tools (including Claude Code, Cursor, OpenCode, Aider, Devin, GitHub Copilot, Continue, and Cline) revealed that ~90% of proposed agent features are already commoditized:

- **Commodity Primitives (NOT Differentiators):** `git worktree` isolation, `git apply --check`, JSONL telemetry, subprocess test execution (`pytest`, `npm test`), retry loops, prompt shaping, and multiplexers (`tmux`).
- **Incumbent Weaknesses & Market Gaps (Uncommon Capabilities):**
  1. *Deterministic Merge Gating:* Incumbents rely on advisory self-checks rather than hard, deterministic verification gates blocking broken or regressive patches.
  2. *Pareto Transparency:* Zero commercial vendors publish live, multi-dimensional trade-off curves measuring token cost, latency, and regression rates across rolling benchmark splits.
  3. *Failure-Class Separation:* Most tools collapse provider rate limits, network timeouts, and model code errors into generic failure states, leading to expensive blind retries.
  4. *Layered Verification:* Staging validation (pre-flight syntax $\to$ targeted unit tests $\to$ full regression suite) is absent from standard agent loops.

*Source: `docs/02-competitive-landscape.md`, `research/reports/05-verification-competitive-gap.md`, `research/reports/12-parallel-research-synthesis.md`*

---

## 6. Problem Evidence (The Developer Pain Corpus)

From an initial pool of 262 GitHub issues across leading agent repositories, 67 high-severity, verifiable problem episodes were analyzed (F01 corpus). Eight distinct developer pain moments were categorized:

1. **PM-1 (Verification Burden):** Developers spend excessive cognitive effort manually reviewing and running tests to verify agent changes.
2. **PM-2 (Looping & Hangs):** Agents enter repetitive editing loops, repeatedly modifying the same wrong file without making progress.
3. **PM-3 (Hallucinated Edits & Wrong Files):** Agents modify files unrelated to the root cause (e.g., editing mock fixtures instead of core logic).
4. **PM-4 (State Loss & Destructive Rollbacks):** Agents discard uncommitted human work or wipe working directories when an attempt fails.
5. **PM-5 (Credential & Security Trust):** Agents leak `.env` secrets or execute un-sandboxed shell commands.
6. **PM-6 (Context Degradation):** As conversation history expands with successive test failure traces, agent reasoning degrades rapidly.
7. **PM-7 (Invisible Progress):** Long-running agent execution lacks fine-grained intermediate progress signals.
8. **PM-8 (Cost Escalation):** Multi-turn retries explode API billing without improving the odds of code resolution.

*Source: `docs/03-problem-space.md`, `research/reports/08-product-problem-research.md`, `research/F01/report.md`*

---

## 7. Experiment History

- **Phase 2A (Pilot n=5):** Initial feasibility test of verification gate. Showed 1 recovery, 0 regressions, but confidence intervals overlapped.  
  *Source: `research/F02/report.md`*
- **Phase 2B (Scale Shakedown):** Discovered that full-suite test execution inside evaluation containers introduces significant latency overhead (~300–600s per task).  
  *Source: `research/experiment/shakedown/report.md`*
- **Phase 2C (Powered Partial Run n≈7):** Naive retry arm evaluated against baseline. Result: 0/5 recovery, 2.97× median tokens, 2.08× latency. Triggered Decision D-005.  
  *Source: `research/experiment/scale/partial-run.md`, `research/reports/03-phase2c-synthesis.md`*
- **Phase 2D (Layered Strategy & Harness Fix):** Discovered provider HTTP 429 errors contaminating runs (D-007). Rebuilt harness with strict classification and fail-closed rate-limit handling (D-008).  
  *Source: `research/phase2d/analysis/provider-failure.md`*

---

## 8. Batch 1 Results (Phase 2D Clean Benchmark)

Phase 2D Batch 1 evaluated 5 fresh SWE-bench Lite tasks across three frozen arms using `muse-spark-1.2-contributor-free` via OpenCode:

| Arm | Method | Resolved Tasks | Recovery Rate | Median Tokens | Token Ratio vs Baseline | Median Latency |
|---|---|---|---|---|---|---|
| **Baseline** | 1 attempt $\to$ full eval | 2/5 (40%) | — | 199,702 | 1.00× | 342.5 s |
| **Current** | Full eval $\to$ 800-char tail retry ($\le 3$ att) | **4/5 (80%)** | **2 recovered** | 214,359 | **1.07×** | 376.3 s |
| **Layered** | `apply --check` $\to$ targeted pytest $\to$ regression | 0/5 (0%) | 0 recovered | 591,640 | **2.96×** | 446.2 s |

**Key Findings & Epistemic Evaluation:**
- **FACT:** Current arm resolved 80% of tasks, recovering 2 baseline failures (`astropy__astropy-14365`, `pallets__flask-5063`) while consuming only 1.07× median tokens.
- **FACT:** Layered arm failed its design gate: 0% resolution, 2.96× token consumption (ceiling was 1.5×), and lost 2 tasks baseline solved (`matplotlib__matplotlib-23299`, `mwaskom__seaborn-3190`).
- **INFERENCE (Verification Disagreement):** Layered's strict pre-Docker `git apply --check` rejected patches with minor hunk formatting issues that SWE-bench's native `patch --fuzz=5` container chain accepts. This prevented the model from ever entering the targeted test execution phase.

*Source: `research/reports/07-phase2d-batch1-results.md`, `research/phase2d/analysis/verification-disagreement.md`*

---

## 9. Ablation 1 Status

Phase 2D Ablation 1 has been fully designed and frozen (`research/phase2d/ablation1/manifest.json`) to isolate the causal mechanism of feedback:
- **Scope:** 10 new Lite tasks across 10 unique repositories (disjoint from all prior LACE runs).
- **Arms (4-way):**
  1. *Baseline:* Single-pass attempt, no retry.
  2. *Current:* Full evaluation with generic 800-character tail feedback.
  3. *Minimal:* Test name and failure count only (minimal bytes).
  4. *Structured:* Failure class label + failing test name + targeted assertion line.
- **Status (FACT):** Code implemented, unit tests passing, protocol frozen. Execution is paused to preserve provider quota until authorized.

*Source: `research/phase2d/ablation1/reports/analysis.md`, `research/phase2d/ablation1/protocol.md`*

---

## 10. Market Validation Status

- **User Profile (INFERENCE):** The viable customer is an experienced engineer or small product team using Claude Code or OpenCode on established, multi-file codebases with existing automated test suites.
- **Adoption Friction (HYPOTHESIS):** Developers are sharply divided on verification strictness. Enforcing an unavoidable blocking gate on every edit creates prohibitive developer annoyance. Therefore, LACE must operate in an **advisory-first mode** with an optional blocking policy for continuous integration or release branches.
- **Willingness to Pay (UNKNOWN):** Market willingness-to-pay remains completely unproven. No commercial pricing survey has been conducted, and native git hooks provide a free alternative.

*Source: `research/market/hypotheses.md`, `research/reports/08-product-problem-research.md`, `research/reports/12-parallel-research-synthesis.md`*

---

## 11. Security & Trust Status

The security posture of LACE is currently rated **LOW / EXPERIMENTAL** (Track D findings):
- **Privilege Concentration:** The verification runner executes agent-generated code inside Docker environments. Untrusted patches have the ability to run arbitrary shell commands during test execution.
- **Prompt Injection via Test Traces:** Adversarial code can write malicious prompt overrides into test assertion messages, which then get re-injected into the corrective prompt sent to the LLM.
- **Data Redaction Requirements:** LACE has established strict specifications for secret scrubbing (`docs/security/data-handling.md`), denying outbound network egress by default, and forbidding automated pushes or merges to remote repositories.
- **DECISION:** LACE must never be connected to private repositories containing production credentials until sandbox isolation and input redaction policies are fully implemented.

*Source: `docs/security/threat-model.md`, `docs/security/data-handling.md`, `research/reports/11-security-trust-analysis.md`*

---

## 12. Core Conceptual Model

Track B consolidated the LACE conceptual architecture into an irreducible set of **6 core entities**:

1. **Task:** The unit of work requested by the user, bounded by a specification and an initial git commit.
2. **Attempt:** A single generative cycle by an agent producing a patch or changeset.
3. **Verification:** The deterministic evaluation process executed against an attempt.
4. **Evidence:** The structured, tamper-evident record of verification results (failure class, failing test names, traceback excerpts, latency, token consumption).
5. **Outcome:** The terminal status of an attempt or task (`PROVEN`, `FAILED`, `STOPPED`).
6. **Cost:** The cumulative accounting of model tokens, cache reads, and elapsed wall-clock seconds.

*Derived concepts:* `Patch` (Attempt output), `Failure` (classified Evidence), `Recovery` (decision edge to re-prompt).  
*Lifecycle:* `PENDING` $\to$ `ATTEMPTING` $\to$ `VERIFYING` $\to$ `CLASSIFIED` $\to$ { `RECOVERING` | `PROVEN` | `FAILED` | `STOPPED` }.

*Source: `docs/core/concepts.md`, `docs/core/lifecycle.md`, `research/reports/09-core-model-analysis.md`*

---

## 13. Current Open Questions

1. **Verification Disagreement:** Will aligning pre-flight apply checks with container fuzz semantics restore baseline wins on matplotlib and seaborn?  
   *Source: `docs/open-questions.md`*
2. **Minimal Payload Efficiency:** What is the absolute minimum feedback payload (in bytes) required to achieve recovery?  
   *Source: `docs/open-questions.md`*
3. **Reproducibility of Current Arm:** Did the Current arm's 80% success in Batch 1 benefit from small-sample variance, or is generic feedback surprisingly effective on this model?  
   *Source: `docs/open-questions.md`*
4. **Test Assertion Tampering:** How reliably can the harness prevent the agent from modifying existing test files to force a green test pass?  
   *Source: `docs/security/threat-model.md`*

---

## 14. Current Decisions (D-001 through D-010)

- **D-001 (PIVOT):** Focus exclusively on a thin verification-first extension (MCP + plugin); do not build a standalone runtime.
- **D-002 (Reject Standalone):** Standalone runtime permanently killed (fails gate T4).
- **D-003 (Herdr Optional):** Multiplexer integration is optional, not core.
- **D-004 (Reject Multi-Agent Core):** Multi-agent orchestration is experimental only.
- **D-005 (Phase 2C Finding):** Naive unconstrained retry is economically non-viable.
- **D-006 (Phase 2D Protocol):** Test layered strategy against baseline and current arms.
- **D-007 (Discard Contaminated Runs):** Provider HTTP 429 contaminated data must never be used for synthesis.
- **D-008 (Harness Error Separation):** Provider failures fail-closed with zero token count; never retry blind rate limits.
- **D-009 (Frozen Parameters):** Model (`muse-spark-1.2-contributor-free`), provider (`opencode`), and manifests are strictly frozen.
- **D-010 (Scaling Gate):** Do not scale to n=30 powered runs until design gates pass on clean data.

*Source: `context/decisions.md`*

---

## 15. Kill Criteria

The LACE project will be formally terminated (KILL) upon encountering any of the following four conditions:

1. **Recovery Inefficacy (Gate T1 Failure):** Ablation 1 and subsequent benchmarks fail to demonstrate that structured/minimal feedback achieves $\ge 10$ percentage points higher resolution than baseline at $\le 1.5\times$ token cost.
2. **Economic Negative Value:** The token cost of automated self-correction exceeds the cost of having a human engineer inspect the diff and prompt a fresh attempt.
3. **Incumbent Preemption:** Leading platforms (Claude Code, Cursor, OpenCode) implement native deterministic rollback and verification gates before LACE achieves differentiation.
4. **Security Intractability:** Inability to prevent prompt injection or credential leakage through automated test feedback traces.

*Source: `docs/05-product-thesis.md`, `context/brain.md`*

---

## 16. Next Actions

1. **Ablation 1 Execution:** Run the frozen 10-task Ablation 1 suite when provider quota is authorized, evaluating baseline vs. current vs. minimal vs. structured feedback.
2. **Apply-Check Semantic Alignment:** Conduct an isolated dry-run verifying whether adding fuzz tolerance to `git apply --check` resolves false-negative patch rejections.
3. **Maintain Corpus Pipeline:** Maintain synchronization between canonical Git documentation and the `research/export/` NotebookLM corpus using `scripts/export_research.py`.

*Source: `research/reports/07-phase2d-batch1-results.md`, `context/brain.md`*
