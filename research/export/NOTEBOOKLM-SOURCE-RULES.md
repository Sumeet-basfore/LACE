# NotebookLM Source Hygiene Rules

**Status:** CANONICAL HYGIENE STANDARD  
**Date:** 2026-09-03  
**Target:** NotebookLM Knowledge Base Governance

---

## 1. Grounding Philosophy

NotebookLM is an AI-powered research interrogation and synthesis instrument. Its reasoning and citations are entirely dependent upon the quality, clarity, and signal-to-noise ratio of its input sources.

If high-signal syntheses are mixed with low-signal execution exhaust, the knowledge base suffers from:
1. **Retrieval Dilution:** Semantically vague queries retrieve debugging traces and stack traces rather than reasoned decisions.
2. **Hallucination Amplification:** The model reads exploratory hallucinations or flawed attempts in raw transcripts and cites them as validated conclusions.
3. **Context Churn:** Massive, unformatted logs exhaust retrieval tokens, crowding out essential architectural constraints.

---

## 2. Ingestion Inclusion Checklist (INCLUDE)

Only include verified Class A artifacts:

- [x] **Canonical Research Summaries:** `research/reports/*.md` (e.g., `01-research-synthesis.md`, `12-parallel-research-synthesis.md`).
- [x] **Decision Logs:** `context/decisions.md` (explicit records of project choices D-001 through D-010).
- [x] **Experiment Reports:** `research/reports/07-phase2d-batch1-results.md` (clean, verified benchmark outcomes).
- [x] **Experiment Protocols & Manifests:** `protocol.md`, `metrics.md`, `batch1-manifest.json`.
- [x] **Architecture & Core Model:** `docs/core/*.md` (concepts, lifecycles, event schemas, measurement contracts).
- [x] **Market & Security Analysis:** `docs/security/*.md`, `research/market/*.md` (threat models, data handling rules, survey frameworks).
- [x] **Curated Open Questions & Changelogs:** `docs/open-questions.md`, `docs/changelog.md`.
- [x] **Master Synthesis:** `LACE-NOTEBOOKLM-MASTER.md` (anchoring single-file summary).

---

## 3. Strict Exclusion Checklist (EXCLUDE BY DEFAULT)

Never include Class B (Forensic/Raw) or Class C (Ephemeral) artifacts:

- [ ] **Raw Model Transcripts:** `research/**/transcript_*.txt` (raw turn-by-turn agent prompts and completions).
- [ ] **Evaluator JSON & Benchmark Dumps:** `/muse-spark-*.json`, `logs/run_evaluation/**/report.json`.
- [ ] **Provider & Execution Logs:** `*.log`, `*.apply_check.log`, terminal captures.
- [ ] **Raw Patch Diffs:** `*.raw.patch`, `*.normalized.patch`.
- [ ] **Contaminated Experiment Runs:** HTTP 429 quota failure runs (`raw-contaminated-429/`, `raw-contaminated-provider/`).
- [ ] **Secrets & Private Credentials:** `.env`, API keys, bearer tokens, certificates.
- [ ] **Runtime State & Caches:** `__pycache__`, `.pytest_cache`, `.venv`, `.whl`.
- [ ] **Docker & Harness Scripts:** `harness.py`, test runners, container startup scripts.

---

## 4. Enforcement

1. **Pre-Export Validation:** The export tool `scripts/export_research.py` enforces a string filter rejecting any path containing `/raw/`, `transcript_`, `.eval.json`, or `.log`.
2. **Secret Scanning:** Any file containing credential-like patterns fails the export pipeline with an immediate halt.
3. **Human Review:** Before copying files to the Google Drive sync folder, verify that no `.txt`, `.log`, or raw `.json` dumps are present in `research/export/`.
