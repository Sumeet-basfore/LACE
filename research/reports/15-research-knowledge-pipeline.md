# Research Report 15: LACE Research Knowledge Pipeline & Corpus Architecture

**Date:** 2026-09-03  
**Status:** COMPLETED REPORT  
**Scope:** Architecture, implementation, and operational validation of the LACE research corpus export pipeline.  
**Epistemic Standards:** FACT | EVIDENCE | INFERENCE | HYPOTHESIS | DECISION

---

## 1. Current Repository Structure

**FACT:** The LACE repository contains multiple distinct functional layers:
- `context/`: Core epistemic vocabulary (`terminology.md`), operational project state (`brain.md`), binding experiment rules (`experiment-rules.md`), and permanent decisions (`decisions.md`).
- `docs/`: Canonical architecture and conceptual models (`docs/core/`), threat models and data handling policies (`docs/security/`), and strategic analyses (`docs/01` through `05`).
- `research/`: Empirical research tracks, task investigations (`F01`–`F04`, `R001`–`R007`), benchmark harnesses (`research/phase2d/`), and formal reports (`research/reports/01` through `14`).
- `scripts/`: Deterministic automation tools (including `export_research.py`).
- `research/export/`: The newly established curated export projection for NotebookLM ingestion.

---

## 2. Canonical Corpus Definition (Class A)

**DECISION:** Class A consists exclusively of human-reviewed, high-signal canonical research documentation:
- Research syntheses (`research/reports/*.md`)
- Core model specifications (`docs/core/*.md`)
- Market and user problem research (`research/market/*.md`, `docs/03-problem-space.md`)
- Security and trust boundaries (`docs/security/*.md`)
- Decision logs, experiment rules, and failure terminology (`context/*.md`)
- Master single-file synthesis (`research/export/LACE-NOTEBOOKLM-MASTER.md`)

**FACT:** All Class A materials are version-controlled in Git, tracked in `research/export/export-manifest.json`, and mapped to explicit destinations with automated provenance headers.

---

## 3. Raw Evidence Policy (Class B & C)

**DECISION:** Raw experimental evidence is strictly classified as **Class B (Forensic/Raw)**:
- Raw conversational transcripts (`transcript_*.txt`)
- Model patch diffs (`*.raw.patch`, `*.normalized.patch`)
- SWE-bench evaluator dumps (`/muse-spark-*.json`, `logs/run_evaluation/**`)
- Docker container execution logs (`run_instance.log`, `test_output.txt`)
- Contaminated or rate-limited runs (`raw-contaminated-429/`, `raw-contaminated-provider/`)

**POLICY PRINCIPLE:**
> **"Not exported" does not mean "deleted".**
> Raw forensic evidence is intentionally preserved on local disk for reproduction, debugging, and post-mortems, but is excluded from Git tracking via `.gitignore` and barred from entering NotebookLM.

**INFERENCE:** Ingesting raw execution traces into NotebookLM causes severe retrieval dilution, exhausts context windows with stack traces, and induces model hallucinations by treating transient agent debugging errors as verified project facts.

---

## 4. NotebookLM Corpus Design

**DECISION:** The curated export directory (`research/export/`) is structured into seven logical, domain-bounded subdirectories:

```
research/export/
├── 00-context/      # Current state, research principles, terminology
├── 01-research/     # Competitive landscape, problem space, thesis
├── 02-validation/   # Batch 1 results, ablation 1 setup, methodology
├── 03-market/       # Hypotheses, developer survey, interview guide
├── 04-security/     # Threat model, trust boundaries, data handling
├── 05-core-model/   # Concepts, lifecycle, events, recovery policy
└── 06-decisions/    # Permanent decisions, open questions, changelog
```

In addition, two top-level anchors provide immediate orientation:
- `LACE-NOTEBOOKLM-MASTER.md`: A comprehensive 16-section master document synthesizing the entire research corpus.
- `00-current-state.md`: A high-level executive briefing on what is known, what is hypothesized, and what kill criteria apply.

---

## 5. Export Pipeline Implementation

**FACT:** The export pipeline is implemented as an idempotent, zero-dependency Python script at `scripts/export_research.py`, governed by `research/export/export-manifest.json`.

**Key Architectural Properties:**
1. **Deterministic & Idempotent:** Generates stable provenance headers without volatile timestamps; consecutive runs produce zero git diff.
2. **Fail-Closed Security Scan:** Scans all source text for credential-like patterns (API keys, private keys, tokens) and aborts if detected.
3. **Strict Path Filtering:** Explicitly rejects any file containing forbidden path tokens (`/raw/`, `transcript_`, `.eval.json`, `logs/`, `.whl`, `__pycache__`).
4. **Explicit Manifest Mapping:** Operates via 27 explicit source-to-destination mappings; forbids unreviewed fuzzy discovery.

---

## 6. Google Drive Handoff

**FACT:** A system environment audit confirmed that no Google Drive CLI or cloud SDK (`gdrive`, `rclone`, `gcloud`) is present or authenticated in this environment.

**DECISION:** In adherence to security protocols, no synthetic credentials or unauthenticated external upload tools were configured. The repository-side staging is 100% complete, and mirroring to the shared Google Drive folder (`LACE Research/`) is designated as a secure, authenticated manual handoff performed by the developer per `research/export/GOOGLE-DRIVE-SETUP.md`.

---

## 7. NotebookLM Prompt Pack

**FACT:** A curated interrogation pack has been authored at `research/export/notebooklm-prompts.md`, containing 15 high-value prompts categorized into:
- Foundational & Epistemic Audit (assumptions vs. evidence, historical pivots, internal contradictions).
- Adversarial & Strategic Stress-Testing (standalone platform critique, kill criteria arguments, commodity overlap).
- Technical & Experimental Interrogation (recovery-policy evidence, Batch 1 failure analysis, security sandboxing).

---

## 8. Antigravity Role & Boundary

**DECISION:** Antigravity CLI operates as a parallel research, code analysis, and engineering worker layer:
- **Capabilities:** Executes targeted code audits, implements harness refinements, runs deterministic test suites, and synthesizes analytical reports.
- **Boundary:** Antigravity writes all outputs directly back into the version-controlled Git repository. It does **not** maintain an independent, unversioned knowledge base and does not supersede Git authority.

---

## 9. Git Hygiene Implications

**FACT:** Prior to repository hygiene enforcement, 492 raw execution artifacts (~29 MB of bloat, including 41 `muse-spark-*.json` files and hundreds of Docker evaluator traces) were tracked or present in the tree (`research/reports/14-git-repository-hygiene-audit.md`).

**DECISION:**
- All Class B raw outputs and execution logs are untracked and excluded in `.gitignore`.
- `research/export/` is explicitly preserved and version-controlled (`!research/export/`), ensuring that the NotebookLM-ready projection is peer-reviewable in pull requests.

---

## 10. Security & Privacy Considerations

**FACT:** A comprehensive automated secret scan of all 27 exported canonical documents detected **zero** API keys, credentials, or private key patterns.

**DECISION:**
- Outbound network egress from verification containers is blocked by default.
- Automated tools are barred from executing automated `git push` or merge operations.
- Test failure trace logs must undergo redaction before re-prompting models to prevent prompt injection and credential exfiltration (`docs/security/data-handling.md`).

---

## 11. What Is Automated

1. **Manifest Validation:** Static verification that all canonical source documents exist and are valid regular files.
2. **Corpus Export & Provenance Injection:** Atomic synchronization of canonical documents to `research/export/` with deterministic headers.
3. **Secret Pattern Scanning:** Automatic pre-export scanning for API tokens and private keys.
4. **Git Ignore Boundaries:** Automatic exclusion of generated model exhaust, logs, and raw caches.

---

## 12. What Remains Manual

1. **Google Drive Synchronization:** Copying approved files from `research/export/` to Google Drive `LACE Research/`.
2. **NotebookLM Ingestion & Refresh:** Adding Google Drive sources into the NotebookLM notebook and clicking re-sync upon updates.
3. **Decision Recording:** Reviewing NotebookLM synthesis outputs and translating approved insights into `context/decisions.md`.
4. **Benchmark Quota Authorization:** Explicit approval required prior to launching model runs or SWE-bench evaluations.

---

## 13. Limitations

- **n=5 Statistical Power:** Clean empirical data from Batch 1 is based on a small sample ($n=5$); while informative for design gates, it cannot establish statistical significance.
- **Verification Disagreement:** The local pre-Docker `git apply --check` remains stricter than container fuzz evaluation, requiring the upcoming Ablation 1 experiment to isolate patch application tolerance effects.
- **Manual Cloud Sync Overhead:** Developers must periodically mirror `research/export/` to Google Drive when canonical research documents change.

---

## 14. Future Automation Opportunities

1. **Authenticated Google Drive Webhook/Action:** Once an official service account or OAuth integration is authorized, a GitHub Action can automatically push `research/export/` commits to Google Drive.
2. **Export Integrity CI Gate:** A pre-commit hook or CI workflow running `python3 scripts/export_research.py && git diff --exit-code -- research/export` to ensure the export projection never drifts from canonical docs.
3. **Automated Redaction Filter:** Embedding an AST-based secret scrubber inside `scripts/export_research.py` to complement regex pattern matching.
