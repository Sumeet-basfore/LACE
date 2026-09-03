# LACE Research Corpus Index & Classification Guide

**Status:** CANONICAL REPOSITORY INDEX  
**Date:** 2026-09-03  
**Target Environment:** NotebookLM, Google Drive Distribution, Antigravity CLI

---

## 1. Corpus Index (Exported Canonical Documents)

Every document in `research/export/` is audited, version-controlled, and verified safe for NotebookLM ingestion.

| Exported File | Category | Originating Source File | Mode | Purpose & Scope | Evidence / Confidence Status | Ingestion Classification |
|---|---|---|---|---|---|---|
| `00-current-state.md` | Context | `context/brain.md`, `reports/07`, `reports/12` | Derived | Top-level executive orientation on current findings and gates | High (Derived from canonical reports) | **SAFE FOR NOTEBOOKLM** |
| `00-context/current-state.md` | Context | `context/brain.md`, `context/decisions.md` | Derived | Comprehensive project state document with explicit epistemic tags | High (Operational truth) | **SAFE FOR NOTEBOOKLM** |
| `00-context/terminology.md` | Context | `context/terminology.md` | Copied | Epistemic taxonomy, failure classes, and pipeline definitions | High (Binding taxonomy) | **SAFE FOR NOTEBOOKLM** |
| `00-context/research-principles.md` | Context | `docs/research-principles.md` | Copied | Epistemic rules, claim labeling, and cost discipline | High (Binding standard) | **SAFE FOR NOTEBOOKLM** |
| `01-research/research-synthesis.md` | Research | `research/reports/01-research-synthesis.md` | Copied | Foundational synthesis of early agent research and failure modes | Medium-High (Synthesized evidence) | **SAFE FOR NOTEBOOKLM** |
| `01-research/competitive-landscape.md` | Research | `docs/02-competitive-landscape.md` | Copied | Incumbent coding agent teardown and competitive gaps | Medium-High (Desk audit) | **SAFE FOR NOTEBOOKLM** |
| `01-research/problem-space.md` | Research | `docs/03-problem-space.md` | Copied | Taxonomy of 8 developer pain moments in coding agents | High (Grounded in 67 GH issues) | **SAFE FOR NOTEBOOKLM** |
| `01-research/opportunity.md` | Research | `docs/04-opportunity.md` | Copied | Strategic wedge evaluation and defensibility analysis | High (Strategic analysis) | **SAFE FOR NOTEBOOKLM** |
| `01-research/product-thesis.md` | Research | `docs/05-product-thesis.md` | Copied | Product thesis, pre-registered gates T1–T4, and kill criteria | High (Authoritative thesis) | **SAFE FOR NOTEBOOKLM** |
| `02-validation/validation-synthesis.md` | Validation | `research/reports/02-validation-synthesis.md` | Copied | Synthesis of initial pilot evaluations and mechanism feasibility | Medium (Small exploratory n) | **SAFE FOR NOTEBOOKLM** |
| `02-validation/phase2d-batch1-results.md` | Validation | `research/reports/07-phase2d-batch1-results.md` | Copied | Clean empirical evaluation of 5 SWE-bench Lite tasks × 3 arms | High (Measured FACT/EVIDENCE) | **SAFE FOR NOTEBOOKLM** |
| `02-validation/ablation1-status.md` | Validation | `research/phase2d/ablation1/reports/analysis.md` | Copied | Ablation 1 experimental setup (10 tasks, 4 arms, pre-run status) | High (Frozen protocol status) | **SAFE FOR NOTEBOOKLM** |
| `02-validation/experiment-methodology.md` | Validation | `context/experiment-rules.md` | Copied | Binding rules for model freezing, isolation, and metrics | High (Binding protocol) | **SAFE FOR NOTEBOOKLM** |
| `03-market/market-hypotheses.md` | Market | `research/market/hypotheses.md` | Copied | Target user profiles and adoption friction hypotheses | Hypothesis (Unvalidated) | **SAFE FOR NOTEBOOKLM** |
| `03-market/survey.md` | Market | `research/market/survey.md` | Copied | Developer survey instrument for testing failure frequency | Specification (Instrument) | **SAFE FOR NOTEBOOKLM** |
| `03-market/interview-guide.md` | Market | `research/market/interview-guide.md` | Copied | Qualitative user interview protocol for developer pain | Specification (Instrument) | **SAFE FOR NOTEBOOKLM** |
| `03-market/analysis.md` | Market | `research/market/results.md` | Copied | Preliminary market results and pricing sensitivity framework | Low-Medium (Preliminary) | **SAFE FOR NOTEBOOKLM** |
| `04-security/threat-model.md` | Security | `docs/security/threat-model.md` | Copied | Threat model covering injection, sandbox escape, and poisoning | High (System threat analysis) | **SAFE FOR NOTEBOOKLM** |
| `04-security/trust-boundaries.md` | Security | `docs/security/trust-boundaries.md` | Copied | Component privilege levels, network egress, and token flows | High (Architecture spec) | **SAFE FOR NOTEBOOKLM** |
| `04-security/data-handling.md` | Security | `docs/security/data-handling.md` | Copied | Redaction policies for test logs, telemetry, and environment | High (Compliance policy) | **SAFE FOR NOTEBOOKLM** |
| `04-security/security-requirements.md` | Security | `docs/security/security-requirements.md` | Copied | Verification runner security controls and isolation requirements | High (Engineering contract) | **SAFE FOR NOTEBOOKLM** |
| `05-core-model/concepts.md` | Core Model | `docs/core/concepts.md` | Copied | The 6 core entities: Task, Attempt, Verification, Evidence, Outcome, Cost | High (Formal schema) | **SAFE FOR NOTEBOOKLM** |
| `05-core-model/lifecycle.md` | Core Model | `docs/core/lifecycle.md` | Copied | State machine specification from PENDING to PROVEN/STOPPED | High (State machine spec) | **SAFE FOR NOTEBOOKLM** |
| `05-core-model/event-model.md` | Core Model | `docs/core/event-model.md` | Copied | 7-event append-only JSONL schema specification | High (Data format spec) | **SAFE FOR NOTEBOOKLM** |
| `05-core-model/recovery-policy.md` | Core Model | `docs/core/recovery-policy.md` | Copied | Failure-specific dispatch matrix and corrective prompt payload rules | High (Policy specification) | **SAFE FOR NOTEBOOKLM** |
| `05-core-model/measurement-contract.md` | Core Model | `docs/core/measurement-contract.md` | Copied | Accounting definitions for token accounting, cache reads, and latency | High (Measurement contract) | **SAFE FOR NOTEBOOKLM** |
| `06-decisions/decisions.md` | Decisions | `context/decisions.md` | Copied | Permanent decision log D-001 through D-010 | High (Authoritative decisions) | **SAFE FOR NOTEBOOKLM** |
| `06-decisions/open-questions.md` | Decisions | `docs/open-questions.md` | Copied | Consolidated catalog of unresolved technical and market questions | Active tracking | **SAFE FOR NOTEBOOKLM** |
| `06-decisions/changelog.md` | Decisions | `docs/changelog.md` | Copied | Chronological record of pivots, milestones, and architectural phases | Historical record | **SAFE FOR NOTEBOOKLM** |
| `LACE-NOTEBOOKLM-MASTER.md` | Master | Synthesized from all Class A docs | Derived | Comprehensive single-file research master for holistic query synthesis | High (Master synthesis) | **SAFE FOR NOTEBOOKLM** |
| `notebooklm-prompts.md` | Prompts | `research/export/` | Curated | Curated high-value prompts for stress-testing project assumptions | Operational tool | **SAFE FOR NOTEBOOKLM** |

---

## 2. Non-Exported Repository Artifacts (Class B & C Classification)

The following files and paths exist within the LACE repository or local environments but are explicitly restricted from entering NotebookLM.

| Path / Pattern | Class | Purpose / Description | Ingestion Classification | Reason for Exclusion |
|---|---|---|---|---|
| `research/**/raw*/` | Class B | Raw execution outputs, result.json, per-attempt patches | **DO NOT EXPORT (LOCAL ONLY)** | Saturated context, uncontextualized execution exhaust |
| `research/**/transcript_*.txt` | Class B | Verbatim model conversation logs | **DO NOT EXPORT (LOCAL ONLY)** | Dilutes index; contains model hallucinations & prompt noise |
| `/muse-spark-*.json` | Class B | SWE-bench evaluator raw test output summaries | **DO NOT EXPORT (LOCAL ONLY)** | Machine-generated benchmark dumps; summarized in reports |
| `logs/run_evaluation/**` | Class B | Docker container execution logs (1–2 MB each) | **DO NOT EXPORT (LOCAL ONLY)** | Massive raw text volume; zero semantic synthesis value |
| `research/phase2d/raw-contaminated-429/` | Class B | Archived runs invalidated by provider HTTP 429 errors | **DO NOT EXPORT (LOCAL ONLY)** | Contaminated data; invalid for model/strategy comparison |
| `research/raw/R006/*.html` | Class B | Scraped competitive intelligence web pages | **DO NOT EXPORT (LOCAL ONLY)** | Unprocessed HTML snapshots; summarized in reports |
| `research/F01/raw/*.json` | Class B | Raw GitHub search dump of 262 developer issues | **DO NOT EXPORT (LOCAL ONLY)** | Raw scraping dump; analyzed in `research/F01/report.md` |
| `__pycache__/`, `*.pyc` | Class C | Compiled Python bytecode | **LOCAL ONLY** | Non-human-readable build artifact |
| `.pytest_cache/` | Class C | Pytest execution state | **LOCAL ONLY** | Local test runner cache |
| `.venv/`, `venv/` | Class C | Python virtual environment | **LOCAL ONLY** | Local binaries and installed libraries |
| `*.whl` | Class C | Local wheel binary downloads | **LOCAL ONLY** | Binary package |
| `.commandcode`, `.DS_Store` | Class C | Editor and OS metadata | **LOCAL ONLY** | Machine-specific workspace state |
| `research/F02/pilot/repo/` | Class C | Local test repository git clone | **LOCAL ONLY** | Ephemeral sandbox checkout |
| `.cursorrules`, `AGENTS.md` | Internal | Agent execution instructions | **DO NOT EXPORT** | Internal developer tooling rules; not research evidence |
