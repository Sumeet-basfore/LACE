# LACE Research Corpus Policy

**Status:** ACTIVE POLICY  
**Date:** 2026-09-03  
**Scope:** Repository data classification, Git tracking boundaries, and NotebookLM export eligibility.

---

## 1. Purpose & Principle

The LACE project produces multiple tiers of documentation, code, and experimental outputs. Without explicit classification boundaries, AI knowledge-retrieval systems (such as NotebookLM) and version-control systems become polluted by raw execution exhaust, noisy transcripts, and ephemeral runtime state.

**Core Principle:**
> **Git is the canonical source of truth for curated research and code. NotebookLM is an interrogation and synthesis layer that operates exclusively on curated, high-signal canonical research documents. Raw experiment logs remain preserved locally as forensic evidence, but are never fed directly into NotebookLM.**

---

## 2. Corpus Classification Taxonomy

| Class | Category | Git Status | NotebookLM Export | Purpose & Handling |
|---|---|---|---|---|
| **CLASS A** | **CANONICAL** | Tracked | **YES (Curated Export)** | Curated synthesis, hypotheses, reports, verified metrics, conceptual models, and decision logs. |
| **CLASS B** | **FORENSIC / RAW** | Ignored by default (preserved locally) | **NO (Excluded by default)** | Raw execution exhaust, model transcripts, patch diffs, Docker logs, evaluation traces, and contaminated runs. Kept on local disk for reproducibility and post-mortems. |
| **CLASS C** | **LOCAL / EPHEMERAL** | Ignored | **NO (Never exported)** | Python bytecode, virtual environments, editor metadata, caches, and runtime scratch artifacts. Cleanable at any time. |

---

## 3. Detailed Class Definitions & Boundaries

### CLASS A — CANONICAL (Safe for Git & NotebookLM)

Class A consists of high-signal, human-reviewed, and deterministic research artifacts that define the project's intellectual state, evidence base, and design decisions.

**Inclusions:**
- **Research Syntheses & Reports:** `research/reports/*.md` (e.g., `01-research-synthesis.md`, `02-validation-synthesis.md`, `07-phase2d-batch1-results.md`, `12-parallel-research-synthesis.md`).
- **Conceptual & Architectural Specifications:** `docs/core/*.md` (concepts, lifecycle, event-model, recovery-policy, measurement-contract), `docs/05-product-thesis.md`, `docs/06-recovery-model.md`.
- **Market & Problem Research:** `docs/02-competitive-landscape.md`, `docs/03-problem-space.md`, `research/market/*.md` (hypotheses, survey specs, interview guides, analysis frameworks).
- **Security & Trust Specifications:** `docs/security/*.md` (threat model, trust boundaries, data handling, security requirements), `research/security/analysis.md`.
- **Decision Logs & Context:** `context/brain.md`, `context/decisions.md`, `context/terminology.md`, `context/experiment-rules.md`, `research/ledger.md`.
- **Experiment Manifests & Protocols:** `manifest.json`, `batch1-manifest.json`, `protocol.md`, `metrics.md`, `experiment-metadata.json`.
- **Structured Aggregate Summaries:** `research/experiment/scale/aggregate.json`, `preflight-final.json`, `analysis/*-results.json` (compact machine-readable result tables derived from experiments).

**Reasoning:**
NotebookLM excels at synthesizing relationships across distinct conceptual and empirical documents. Class A documents are structured, labeled with epistemic markers (`FACT`, `EVIDENCE`, `INFERENCE`, `HYPOTHESIS`, `DECISION`), and cite specific sources. Feeding Class A documents enables grounded, hallucination-resistant queries.

---

### CLASS B — FORENSIC / RAW (Preserve Locally, Exclude from NotebookLM)

Class B comprises the primary observational exhaust generated during model execution, SWE-bench evaluations, and automated harness runs.

**Inclusions:**
- **Model Transcripts:** `research/**/transcript_*.txt` (full conversational history between agent and model).
- **SWE-bench Reports & Evaluator Logs:** Root `/muse-spark-*.json`, `logs/run_evaluation/**` (`run_instance.log`, `test_output.txt`, `report.json`, `eval.sh`).
- **Raw Execution Traces:** `research/**/raw*/` (e.g., `raw-batch1/`, `raw-contaminated-429/`, `raw-final-one-task/`, `raw-smoke-flask-4992/`, `ablation1/raw-contaminated-provider/`).
- **Per-Attempt Patches:** `*.raw.patch`, `*.normalized.patch`, `*.apply_check.log`.
- **Scraped Raw External Data:** `research/raw/R006/*.html`, `research/F01/raw/*.json` (unprocessed HTML snapshots and raw GitHub search dump files).
- **Contaminated & Archived Runs:** Provider rate-limit artifacts (HTTP 429 traces), interrupted runs, and aborted evaluation sessions.

**Handling & Storage Rule:**
> **"Not exported" does not mean "deleted".**
> Raw experimental evidence must be preserved locally on developer disk under `research/**/raw*/` or dedicated forensic directories for auditability, debugging, and provenance verification. However, Class B files must **NEVER** enter Git tracking (via `.gitignore`) and must **NEVER** be exported into `research/export/` or uploaded to NotebookLM.

**Reasoning:**
1. **Context Window Saturation:** Raw model transcripts and test output dumps are tens of thousands of lines long (often 1–2 MB per task attempt). Ingestion into NotebookLM would dilute the source index, saturate context retrieval, and bias answers toward idiosyncratic execution errors rather than systemic research conclusions.
2. **Epistemic Integrity:** Raw transcripts frequently contain model hallucinations, failed hypotheses, and provider errors (such as HTTP 429 quota exceptions). Unless contextualized by an analytical report, NotebookLM will treat raw model output as factual project findings.
3. **Repository Bloat:** Tracked raw logs expand Git packfiles rapidly (~29 MB of bloat occurred prior to hygiene cleanup), slowing clones and commits without adding semantic value.

---

### CLASS C — LOCAL / EPHEMERAL (Local Only, Do Not Track, Do Not Export)

Class C consists of runtime side-effects, build artifacts, temporary scratchpads, and environment-specific caches.

**Inclusions:**
- Python cache: `__pycache__/`, `*.pyc`, `*.pyo`, `.pytest_cache/`.
- Virtual environments: `.venv/`, `venv/`.
- Local binary wheels: `*.whl`.
- Editor & IDE runtime state: `.commandcode`, `.DS_Store`, `.cache/`.
- Local clone checkouts for tests: `research/F02/pilot/repo/`.
- Ephemeral scratch scripts in agent brain directories: `<appDataDir>/brain/<id>/scratch/`.

**Reasoning:**
Class C artifacts are non-deterministic, machine-specific, and ephemeral. They carry zero research provenance and are actively discarded by Git and export tools.

---

## 4. Export & Provenance Rules

1. **Explicit Manifest Mapping:** The export pipeline (`scripts/export_research.py`) operates via a static, audited JSON manifest (`research/export/export-manifest.json`). No automated directory crawlers or fuzzy discoverers may blindly pull unreviewed files.
2. **Provenance Preservation:** Every exported document in `research/export/` must retain clear provenance pointing to its canonical Git source path, commit/date state, and epistemic category.
3. **Clean Diffs:** The export directory `research/export/` is checked into Git so that changes to the NotebookLM corpus are tracked, auditable, and reviewed via standard PR/commit workflows.
4. **Credential Isolation:** The export process enforces a zero-secrets policy. No API keys, credentials, or environment files may ever enter `research/export/`.
