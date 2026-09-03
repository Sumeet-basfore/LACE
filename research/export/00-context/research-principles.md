<!-- GENERATED ARTIFACT — COPIED FROM CANONICAL SOURCE -->
<!-- Canonical Source: docs/research-principles.md -->
<!-- Category: context -->
<!-- Synchronization: scripts/export_research.py -->

# LACE Research Principles

**Status:** CANONICAL POLICY  
**Date:** 2026-09-03  
**Scope:** Foundational research philosophy, epistemic integrity, and experimental standards for the LACE project.

---

## 1. The Core Research Loop

LACE is developed through an explicit, disciplined loop:

$$\text{research} \longrightarrow \text{hypothesis} \longrightarrow \text{experiment} \longrightarrow \text{evidence} \longrightarrow \text{decision} \longrightarrow \text{implementation}$$

We do **never** skip directly from an intriguing idea to implementation. Every design choice must trace to empirical evidence or explicit pre-registered decisions.

---

## 2. Epistemic Taxonomy & Claim Labeling

Every claim made in project documentation, commit messages, and research reports must be strictly labeled:

- **`FACT`**: Directly observed and verifiable in artifacts (e.g., commit hashes, execution stdout, test outputs, raw logs).
- **`EVIDENCE`**: Measured, quantified results from a systematic experiment or corpus query.
- **`INFERENCE`**: Logical deduction reasoned from evidence; not directly observed.
- **`HYPOTHESIS`**: An unverified claim or model to be tested; carries zero factual weight.
- **`DECISION`**: A project policy choice or strategic constraint; may precede full empirical proof.

**Critical Guardrail:**
Benchmark results (e.g., SWE-bench Lite pass rates) are **EVIDENCE** informing harness design and error-recovery algorithms. They are **NOT** validation of product-market fit.

---

## 3. Separation of Failure Classes

Never collapse distinct operational failures into "the model failed." Treat these as completely different categories:

1. **Provider Failure** (HTTP 429, quota exhaustion, network timeouts, auth errors): Stop retries immediately. Never count provider errors as model token consumption.
2. **Model Failure** (Empty output, malformed patch, syntax errors, editing wrong files): Record as model output error; assess if minimal corrective feedback can recover.
3. **Verification Failure** (Task tests still fail, regression suite breaks): Capture structured assertion diffs and determine if recovery retry is justified.
4. **Infrastructure Failure** (Docker daemon crashes, environment image misconfigurations, runner timeouts): Fix the environment; never attribute to agent capability.

---

## 4. Token & Cost Discipline

- Optimize for high-signal work per token consumed.
- Never use paid or limited model quota for speculative tasks, formatting, or repository discovery.
- Automated retry loops must have strict spending caps and latency budgets.
- If an automated retry mechanism consumes $>1.5\times$ the baseline cost without delivering a commensurate recovery gain, it violates the efficiency guardrail.

---

## 5. Scope & Moat Realism

- Approximately $90\%$ of coding agent tooling is commodity composition (worktrees, tmux multiplexers, git commands, test runners).
- Do not build platforms where a 50-line hook or standard MCP server suffices.
- Defensibility cannot come from commodity primitives; it can only arise from verified, calibrated recovery policies and transparent Pareto performance data.
