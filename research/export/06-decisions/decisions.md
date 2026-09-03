<!-- GENERATED ARTIFACT — COPIED FROM CANONICAL SOURCE -->
<!-- Canonical Source: context/decisions.md -->
<!-- Category: decisions -->
<!-- Synchronization: scripts/export_research.py -->

# LACE Decision Log

Concise record of project decisions. Each entry: date, decision, basis, status.

---

## D-001 — PIVOT to verification-first extension

**Date:** 2026-09-02  
**Decision:** Direction is PIVOT (not GO, not KILL) — thin verification-first harness as MCP + Claude Code plugin (+ optional Herdr variant).  
**Basis:** F01–F04 validation; standalone/multi-agent/local-first/Herdr-as-core fail pre-registered gates T1–T4 on current evidence.  
**Status:** Active hypothesis to test.

---

## D-002 — Reject standalone runtime

**Date:** 2026-09-02  
**Decision:** Do not build standalone LACE binary/platform.  
**Basis:** F04 — MCP ~250–350 LOC + Claude hook <100 LOC + Herdr plugin ~150–200 LOC reproducible in <2 weeks (T4 fails for standalone).  
**Status:** Permanent unless evidence changes.

---

## D-003 — Herdr optional, not core

**Date:** 2026-09-02  
**Decision:** Herdr is OPTIONAL integration; default baseline is `tmux + git worktree + agent`.  
**Basis:** F03 teardown; T2 (>30% time-to-green or >50% fewer interventions at n≥20) untested.  
**Status:** Active; T2 gate pending.

---

## D-004 — Multi-agent experimental only

**Date:** 2026-09-02  
**Decision:** Multi-agent orchestration stays EXPERIMENTAL; not default.  
**Basis:** R003 — narrow gains at 3–10× cost; no controlled SWE-bench A/B; 0/67 GH issues requested teams.  
**Status:** Active.

---

## D-005 — Phase 2C: current retry approach insufficient

**Date:** 2026-09-02  
**Decision:** "Full suite → generic 800-char feedback → full-context retry" is not product-worthy as implemented.  
**Basis:** Powered partial run — 0/5 recovery, median tokens 2.97× (exceeds 2× guardrail), latency 2.08×.  
**Status:** EVIDENCE; informs Phase 2D layered design.

---

## D-006 — Phase 2D layered strategy selected for design experiment

**Date:** 2026-09-02  
**Decision:** Test baseline vs current vs layered (cheap apply-check → targeted FAIL_TO_PASS → regression) on n=7 frozen manifest.  
**Basis:** Phase 2C autopsy A01–A04 synthesis (`research/reports/03-phase2c-synthesis.md`).  
**Status:** Protocol frozen; results contaminated — see D-008.

---

## D-007 — Discard contaminated Phase 2D raw results

**Date:** 2026-09-03  
**Decision:** Prior Phase 2D raw results are invalid for model/strategy comparison; do not use in synthesis.  
**Basis:** Provider HTTP 429 `FreeUsageLimitError` misclassified as `EMPTY_OUTPUT`; blind retries amplified contamination (`research/phase2d/analysis/provider-failure.md`).  
**Status:** Active — await clean rerun after quota reset + one-task validation.

---

## D-008 — Provider failures are non-retryable in harness

**Date:** 2026-09-03  
**Decision:** Harness must classify `PROVIDER_RATE_LIMIT`, `PROVIDER_ERROR`, `AUTH_ERROR`, `NETWORK_ERROR`, `TIMEOUT` separately; never blind-retry rate limits; zero token usage on provider failures.  
**Basis:** D-007 root cause analysis; regression tests in `research/phase2d/test_harness_classification.py`.  
**Status:** Implemented in harness; Phase 2D not rerun yet.

---

## D-009 — Frozen experiment parameters

**Date:** 2026-09-02 (Phase 2D), ongoing  
**Decision:** Do not change without explicit approval:
- Model: `muse-spark-1.2-contributor-free`
- Provider: `opencode`
- Phase 2D manifest (7 tasks, hash `33424b751c06e621`)
- Phase 2D protocol arms (baseline / current / layered)

**Status:** Active.

---

## D-010 — Do not scale before design gate

**Date:** 2026-09-02  
**Decision:** No n=30 powered run, no product claims, until Phase 2D design gate evaluated on clean data.  
**Basis:** Phase 2C showed current approach fails cost guardrail; layered is unproven.  
**Status:** Active.
