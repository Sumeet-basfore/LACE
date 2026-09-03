<!-- GENERATED ARTIFACT — COPIED FROM CANONICAL SOURCE -->
<!-- Canonical Source: docs/core/event-model.md -->
<!-- Category: core-model -->
<!-- Synchronization: scripts/export_research.py -->

# LACE Event Model (Conceptual)

**Status:** HYPOTHESIS · **Scope:** What events must exist for audit/replay. Not transport, not schema code.
**Date:** 2026-09-03

> If an event is not needed to reconstruct Outcome, Cost, or why recovery was chosen, it is not core.

## Minimal event set (7)

| # | Event | Emitted when | Carries (bounded) |
|---|-------|--------------|-------------------|
| 1 | `task.opened` | Task accepted | task id, spec ref, baseline, test sets, policy version |
| 2 | `attempt.started` | Attempt N begins | task id, attempt N, input context ref (hash, not full text) |
| 3 | `attempt.completed` | Patch produced or provider error | patch hash + presence flag, or provider error string; tokens, latency |
| 4 | `verification.finished` | A layer concludes | layer id, pass/fail, bounded evidence (test name, assertion, file:line, ≤20-line traceback / apply stderr) |
| 5 | `failure.classified` | Label assigned | failure label + classifier version + confidence |
| 6 | `recovery.decided` | Retry or stop chosen | decision (retry/stop), context-subset ref, budget remaining, reason |
| 7 | `task.closed` | Terminal reached | outcome (`PROVEN`/`FAILED`/`STOPPED`), proof ref, total cost |

## Rules

- **Append-only, ordered per Task.** No updates; corrections are new events (e.g., relabel after D-007 fix = new `failure.classified` with new classifier version, old event retained).
- **Bounded payloads.** Excerpts + hashes + refs. Full logs live outside the model (pointer, not content).
- **Zero-bill stops.** Provider/infra path emits `attempt.completed` (error) → `failure.classified` (provider/infra) → `task.closed(STOPPED)` with `tokens=0`. No `verification.finished`, no `recovery.decided(retry)`.
- **Replay test:** from events 1–7 alone, an auditor must be able to answer: what was tried, what was observed, why it was labeled, why retry/stop was chosen, what it cost, what proves the outcome. Anything not needed for those questions is not an event.

## Explicitly NOT events (architecture, not model)

- Ledger transport (JSONL append, MCP call), hook invocation, Docker start/stop, worktree create/destroy, prompt render, reviewer LLM call internals, outer-scheduler requeue.
