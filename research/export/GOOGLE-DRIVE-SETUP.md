# Google Drive & NotebookLM Handoff Guide

**Status:** OPERATIONAL SETUP GUIDE  
**Date:** 2026-09-03  
**Target:** Shared Google Drive & NotebookLM Research Notebook

---

## 1. System Architecture & Authority Boundaries

The knowledge pipeline connects three distinct environments:

$$\text{Git Repository (Canonical Truth)} \xrightarrow{\text{export}} \text{research/export/} \xrightarrow{\text{manual sync}} \text{Google Drive} \xrightarrow{\text{add sources}} \text{NotebookLM}$$

- **Git Repository = Canonical Source of Truth:** All authoritative documentation, code, protocols, and reports live in Git. No document written directly into Google Drive or NotebookLM supersedes Git.
- **`research/export/` = Curated Projection:** The local export directory contains clean, verified markdown files ready for cloud ingestion.
- **Google Drive = Distribution & Sync Mirror:** An organized shared folder structure enabling team members and NotebookLM to ingest the curated corpus.
- **NotebookLM = Research Interrogation Layer:** A retrieval and synthesis workspace for asking questions, detecting contradictions, and auditing hypotheses against the corpus.

---

## 2. Environment Status & Automation Discovery

> [!IMPORTANT]  
> **Automated Cloud Sync Discovery Result:**  
> A system environment audit confirmed that **no Google Drive CLI tool, rclone binary, gcloud SDK, or automated cloud connector is installed or authenticated in this environment.**  
> In accordance with project safety rules, **no unauthenticated API calls, credential generators, or third-party sync scripts were created.**  
> The repository-side export is 100% prepared on disk. Mirroring to Google Drive and NotebookLM is an authenticated **manual handoff** step performed by the developer.

---

## 3. Intended Google Drive Folder Structure

Create a top-level shared folder in Google Drive named **`LACE Research`** with the following subdirectories:

```
LACE Research/
├── 00-Context/
├── 01-Research/
├── 02-Validation/
├── 03-Market/
├── 04-Security/
├── 05-Core-Model/
└── 06-Decisions/
```

### Upload Mapping Table

| Google Drive Folder | Local Source Directory in Repo | Key Files Included |
|---|---|---|
| `LACE Research/` (Root) | `research/export/` | `LACE-NOTEBOOKLM-MASTER.md`, `CORPUS_INDEX.md`, `00-current-state.md` |
| `00-Context/` | `research/export/00-context/` | `current-state.md`, `terminology.md`, `research-principles.md` |
| `01-Research/` | `research/export/01-research/` | `research-synthesis.md`, `competitive-landscape.md`, `problem-space.md`, `opportunity.md`, `product-thesis.md` |
| `02-Validation/` | `research/export/02-validation/` | `validation-synthesis.md`, `phase2d-batch1-results.md`, `ablation1-status.md`, `experiment-methodology.md` |
| `03-Market/` | `research/export/03-market/` | `market-hypotheses.md`, `survey.md`, `interview-guide.md`, `analysis.md` |
| `04-Security/` | `research/export/04-security/` | `threat-model.md`, `trust-boundaries.md`, `data-handling.md`, `security-requirements.md` |
| `05-Core-Model/` | `research/export/05-core-model/` | `concepts.md`, `lifecycle.md`, `event-model.md`, `recovery-policy.md`, `measurement-contract.md` |
| `06-Decisions/` | `research/export/06-decisions/` | `decisions.md`, `open-questions.md`, `changelog.md` |

---

## 4. What Must NEVER Be Uploaded

Do **NOT** upload:
- Any files from `research/**/raw*/` (transcripts, patch diffs, raw logs).
- Evaluator outputs (`/muse-spark-*.json`, `logs/run_evaluation/**`).
- Code harness implementations (`harness.py`, `test_*.py`).
- Git internal directories (`.git/`).
- Local environment files, secrets, or API keys (`.env`).

**Why Raw Artifacts Stay Outside NotebookLM:**
Raw transcripts contain thousands of lines of verbose model hallucinations, syntax errors, and temporary execution failures. Ingesting raw logs saturates NotebookLM's context window, degrades retrieval precision, and causes the model to confuse past execution noise with established project findings.

---

## 5. Master File vs. Individual Source Documents

- **`LACE-NOTEBOOKLM-MASTER.md`:** A comprehensive, single-document synthesis covering the executive context, competitive landscape, empirical benchmark results, core model, and kill criteria.
- **Individual Source Folders (`00` through `06`):** Provide deep, domain-specific granularity for targeted inquiries (e.g., specific event schemas or security threat vectors).
- **NotebookLM Recommendation:**
  - Ingest `LACE-NOTEBOOKLM-MASTER.md` as the primary core anchor source.
  - Ingest individual files from `00`–`06` as supplemental sources for deep retrieval.
  - NotebookLM supports up to 50 sources per notebook; the curated corpus fits comfortably within this quota (~30 files total).

---

## 6. Maintenance & Update Workflow

When repository documentation changes:
1. **Regenerate the Export:**
   ```bash
   python3 scripts/export_research.py
   ```
2. **Review the Diff:**
   ```bash
   git diff -- research/export
   ```
3. **Upload Modified Files to Google Drive:** Replace the updated files in the corresponding Google Drive folder.
4. **Resync in NotebookLM:** In NotebookLM, click the refresh / re-sync icon on updated Google Drive sources to refresh the notebook's retrieval index.
