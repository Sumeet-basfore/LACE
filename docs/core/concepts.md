# LACE Core Concepts

**Status:** HYPOTHESIS · **Scope:** Conceptual model only. Not architecture. Not spec. Not code.
**Date:** 2026-09-03 · **Predecessors:** `docs/06-recovery-model.md`, `docs/07-recovery-policy.md` · **Terms:** `context/terminology.md`

> Conceptual model = what must exist to describe the lifecycle.
> Implementation architecture = how it is built (MCP, plugin, Docker, prompts). That is explicitly out of scope here.

## Candidate set under test

`Task, Attempt, Patch, Verification, Evidence, Failure, Recovery, Outcome, Cost`

## Verdict

| Concept | Status | Reason |
|---------|--------|--------|
| **Task** | FUNDAMENTAL | Unit of work. Identity + spec + test sets + baseline. Survives all attempts. Without it, no accounting. |
| **Attempt** | FUNDAMENTAL | Bounded execution unit. The only thing counted against retry budget. Without it, retries are unmeasurable. |
| **Verification** | FUNDAMENTAL | Deterministic check that decides pass/fail. Independent of agent self-report. Without it, no recovery trigger. |
| **Evidence** | FUNDAMENTAL | Structured observation from Verification. The only legal input to classification/recovery. Without it, recovery is blind (Phase 2C failure mode). |
| **Outcome** | FUNDAMENTAL | Terminal state + proof. Required by gates T1 / Phase 2D. Without it, success is unclaimable. |
| **Cost** | FUNDAMENTAL | Tokens + latency per Attempt, accumulated per Task. Required by cost guardrails (≤1.5× / ≤2×). Without it, "acceptable cost" is undefined. |
| **Patch** | DERIVED (value of Attempt) | `Attempt.output`: diff, empty, or absent. Verification operates on it, but it has no lifecycle of its own. Keep as attribute, not a top-level entity. |
| **Failure** | DERIVED (classification of Evidence) | `classify(Evidence, classifier_version) → label`. Not an independent thing; same Evidence can relabel under a fixed classifier (D-007: 429 relabeled from `EMPTY_OUTPUT` to `PROVIDER_RATE_LIMIT`). Keep label + version, not a separate object. |
| **Recovery** | DERIVED (transition decision) | `decide(Failure, budget) → {retry_with(context_subset) \| stop}`. It is the edge between Attempt N and Attempt N+1, not a node. Keep as decision record on the edge. |

**INFERENCE:** Irreducible core = **Task, Attempt, Verification, Evidence, Outcome, Cost** (6). Patch/Failure/Recovery are derived and live as attributes/edges. The 9-concept list is sufficient but 3 are redundant as entities.

## Relationships that matter (only these)

- `Task 1—N Attempt` (bounded: ≤3 per D-policy)
- `Attempt 0..1 Patch` (empty/absent allowed; provider stops have none)
- `Attempt 0..1 Verification` (provider/infra stops have none — DECISION D-008)
- `Verification 1 Evidence` (always bounded excerpts, never full logs)
- `Evidence 1 Failure-label` (via versioned classifier)
- `Failure-label 1 Recovery-decision` (retry with context subset, or stop)
- `Recovery-decision 0..1 Attempt` (next attempt or terminal)
- `Task 1 Outcome` (terminal: proven success or recorded failure)
- `Attempt N Cost`, summed to `Task Cost`

Dropped relationships (do NOT model): agent internals, prompt text, Docker/worktree mechanics, reviewer implementation, ledger transport.

## What is NOT core

- Provider/model names, manifest hashes (frozen config, D-009 — referenced, not modeled).
- `lace-ledger / lace-gate / lace-herdr` shapes (architecture).
- Prompt wording, reviewer design, layer runtimes (~0.1s / ~80s are observations, not concepts).
- Pricing, product claims, multi-agent orchestration (D-004 experimental).
- Full transcripts, full stdout, containers (ephemeral — see lifecycle.md).
