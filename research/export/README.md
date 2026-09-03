# LACE Curated Research Corpus (NotebookLM Export Layer)

**Status:** ACTIVE CURATED CORPUS  
**Date:** 2026-09-03  
**Target:** NotebookLM ingestion, Google Drive sync, and Antigravity parallel research interrogation.

---

## 1. Purpose

`research/export/` contains the curated, NotebookLM-ready research corpus for the LACE project. It is structured to provide high-signal, clean, and hallucination-resistant grounding for research synthesis and strategic interrogation.

---

## 2. Source-of-Truth Relationship

- **Git is the Canonical Source of Truth:** All intellectual work, design iterations, experiment protocols, and reports originate in the tracked repository (`context/`, `docs/`, `research/`).
- **`research/export/` is a Derived Projection:** Documents in this folder are either direct copies of canonical specifications or curated summaries. Any edits to core principles must be made in the canonical files and then synchronized via `python3 scripts/export_research.py`.
- **Google Drive is a Distribution Mirror:** Files uploaded to Google Drive for NotebookLM ingestion mirror this directory. Google Drive does **not** replace Git as the canonical archive.
- **Antigravity CLI is a Parallel Engineering Worker:** Antigravity operates as a research/engineering agent reading from and writing back to Git. It does not act as an independent unversioned knowledge store.

---

## 3. Inclusion Rules (Class A Only)

Only high-signal, structured canonical research materials enter this directory:
- Synthesis documents and formal research reports (`research/reports/*.md`).
- Core conceptual model, event schema, and recovery policies (`docs/core/*.md`).
- Market validation frameworks, survey instruments, and problem analyses (`research/market/*.md`, `docs/03-problem-space.md`).
- Security architecture, trust boundary models, and data handling requirements (`docs/security/*.md`).
- Explicit project decisions, experiment rules, and failure taxonomy (`context/decisions.md`, `context/terminology.md`, `context/experiment-rules.md`).
- Curated master synthesis (`LACE-NOTEBOOKLM-MASTER.md`) and state summaries.

---

## 4. Exclusion Rules (Strict Prohibition)

The following items are strictly **forbidden** from entering this directory or NotebookLM:
- **Raw Execution Exhaust:** Model conversational transcripts (`transcript_*.txt`), per-attempt patches (`*.patch`), and evaluator stdout/stderr logs.
- **Provider & Evaluator JSON:** Root `/muse-spark-*.json`, `logs/run_evaluation/**`, and raw test report dumps.
- **Contaminated Run Data:** Inconclusive, crashed, or rate-limited runs (e.g., HTTP 429 traces).
- **Caches & Ephemera:** Python bytecode (`__pycache__`), virtual environments, binary wheels (`*.whl`).
- **Secrets & Credentials:** API keys, tokens, SSH keys, internal URLs, or private environment variables.

---

## 5. Provenance & Update Workflow

1. **Modify Canonical Files:** Edit the authoritative documentation in `docs/`, `context/`, or `research/reports/`.
2. **Execute Export Pipeline:**
   ```bash
   python3 scripts/export_research.py
   ```
3. **Verify Git Diff:**
   ```bash
   git diff -- research/export/
   ```
4. **Mirror to Google Drive:** Follow instructions in `GOOGLE-DRIVE-SETUP.md` to sync approved exports to the shared Google Drive folder for NotebookLM.
