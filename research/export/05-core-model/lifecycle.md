<!-- GENERATED ARTIFACT — COPIED FROM CANONICAL SOURCE -->
<!-- Canonical Source: docs/core/lifecycle.md -->
<!-- Category: core-model -->
<!-- Synchronization: scripts/export_research.py -->

# LACE Lifecycle (Conceptual States)

**Status:** HYPOTHESIS · **Scope:** State transitions only. No architecture. No code.
**Date:** 2026-09-03

## States

```
PENDING → ATTEMPTING → VERIFYING → CLASSIFIED → { RECOVERING → ATTEMPTING... | PROVEN | FAILED | STOPPED }
```

| State | Meaning | Exits |
|-------|---------|-------|
| `PENDING` | Task accepted, no Attempt yet | → `ATTEMPTING` |
| `ATTEMPTING` | Agent producing Patch (bounded) | → `VERIFYING` (patch exists) / → `CLASSIFIED` (provider error, no verification) |
| `VERIFYING` | Layered check running (L1 → L2 → L3) | → `CLASSIFIED` (evidence ready) / → `PROVEN` (L2+L3 pass) |
| `CLASSIFIED` | Evidence → Failure-label assigned | → `RECOVERING` (retryable + budget left) / → `FAILED` (unrecoverable or budget spent) / → `STOPPED` (provider/infra) |
| `RECOVERING` | Minimal context built for next Attempt | → `ATTEMPTING` (consumes 1 budget unit) |
| `PROVEN` | Terminal: FAIL_TO_PASS pass + regression non-inferior | — |
| `FAILED` | Terminal: model/verification failure, budget spent | — |
| `STOPPED` | Terminal-without-verdict: provider/infra abort, zero-bill | — |

## Rules (DECISION, from D-008 + recovery policy)

1. **Bounded:** ≤2 retries (3 Attempts) across model/verification classes combined. Provider/infra stops consume 0 budget.
2. **Cheapest verification first (HYPOTHESIS):** L1 before L2 before L3. Never pay a higher layer when a lower one fails.
3. **Single label:** one Failure-label per Attempt for accounting, even with multiple symptoms.
4. **No verdict without proof:** `PROVEN` requires Layer 3 regression. Layer 2 alone never proves.
5. **Stop ≠ fail:** `STOPPED` is untried, not model failure. Excluded from recovery-rate accounting.

## What survives across Attempts (minimal useful context)

- Task id, spec ref, baseline commit, FAIL_TO_PASS / PASS_TO_PASS sets.
- Prior Patch diffs (bounded) + per-Attempt Failure-labels + bounded Evidence excerpts (test name, assertion, file:line, ≤20-line traceback, apply stderr).
- Accumulated Cost (tokens, latency) + retry count + classifier version.

## What stays ephemeral (discard after classification)

- Full transcripts, full stdout/stderr, full traceback beyond excerpt.
- Docker containers, worktree checkouts, raw provider stream beyond error string.
- Full problem-statement resend (HYPOTHESIS: not needed for recovery; Phase 2D tests this).

## Immutable / auditable (append-only)

- Task definition hash, Attempt input/output hash, Verification log ref, Evidence record, Failure-label + classifier version, Outcome + proof ref, Cost record.

## Mutable (versioned, not audited per Attempt)

- Classifier taxonomy, recovery policy table, retry caps, prompt wording, layer definitions.
