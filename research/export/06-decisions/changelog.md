<!-- GENERATED ARTIFACT — COPIED FROM CANONICAL SOURCE -->
<!-- Canonical Source: docs/changelog.md -->
<!-- Category: decisions -->
<!-- Synchronization: scripts/export_research.py -->

# LACE Research Changelog

**Status:** CANONICAL RECORD  
**Corpus Classification:** CLASS A

---

## [2026-09-03] — Corpus Architecture & Research Pipeline Milestone

- **Established Research Corpus Export Pipeline:** Implemented `docs/research-corpus-policy.md`, `research/export/`, and deterministic sync tool `scripts/export_research.py`.
- **Integrated Parallel Research Tracks:** Completed cross-track synthesis (`research/reports/12-parallel-research-synthesis.md`) integrating user problem (A), conceptual core (B), adversarial moat test (C), and security boundaries (D).
- **Completed Phase 2D Batch 1:** Evaluated 5 tasks across 3 arms (`baseline`, `current`, `layered`). Documented in `research/reports/07-phase2d-batch1-results.md`.
- **Formulated Phase 2D Ablation 1:** Frozen 10-task manifest and 4-arm protocol (`research/phase2d/ablation1/manifest.json`).
- **Executed Repository Hygiene Audit:** Staged untracking of 492 noisy generated evaluation files and established strict `.gitignore` rules (`research/reports/14-git-repository-hygiene-audit.md`).

---

## [2026-09-02] — The Strategic Pivot & Phase 2C Autopsy

- **DECISION D-001 (The Pivot):** Pivoted from standalone platform concept to thin host-native extension (MCP server + Claude Code plugin).
- **DECISION D-002 (Reject Standalone):** Formally killed standalone binary runtime after desk teardown (F04) showed reproducibility in under 2 weeks.
- **DECISION D-003 (Herdr Optional):** Reduced multiplexer integration from core requirement to optional variant.
- **DECISION D-004 (Reject Multi-Agent Core):** Multi-agent orchestration relegated to experimental research after R003 demonstrated 3–10× cost inflation without clear SWE-bench gains.
- **DECISION D-005 (Phase 2C Finding):** Concluded naive retry ("full suite → generic 800-char feedback → full retry") is economically non-viable (2.97× tokens, 0/5 recovery).
- **DECISION D-006 (Phase 2D Layered Protocol):** Designed layered verification strategy (cheap apply-check → targeted pytest → regression check).

---

## [2026-09-01] — Foundation & Problem Discovery

- **F01 Corpus Audit:** Analyzed 262 developer issues, retaining 67 high-severity pain reports on agent looping, state loss, and test evasion.
- **F02 Mechanism Pilot:** Demonstrated proof-of-concept verification gate on synthetic tasks (1 recovery, 0 regression).
- **F03 Multiplexer Teardown:** Evaluated Herdr/tmux orchestration mechanics.
- **F04 Defensibility Teardown:** Mapped commodity primitives and developer clone velocity.
