# Report 09 — Core Model Analysis

**Date:** 2026-09-03 · **Agent:** Research Agent B (modeling only) · **Scope:** Conceptual model vs implementation architecture. No code. No benchmarks. No harness changes.

## 1. Thesis under test

**FACT:** Current thesis pipeline (`docs/06-recovery-model.md`): attempt → evidence → classification → minimal context → recovery → verification → regression proof → outcome.

## 2. Are the 9 concepts sufficient?

**EVIDENCE:** Phase 2C showed generic evidence → 0/5 recovery at ~2.97× tokens (D-005). **FACT:** Phase 2D contamination showed a label depends on classifier version (429 misclassified as `EMPTY_OUTPUT`, D-007). **EVIDENCE:** F02 pilot kept regression at 0 via isolation.

**INFERENCE:** The 9 concepts are sufficient to describe the lifecycle, but over-structured as 9 entities:

- FUNDAMENTAL (6): Task, Attempt, Verification, Evidence, Outcome, Cost.
- DERIVED (3): Patch (= Attempt.output), Failure (= classify(Evidence)), Recovery (= edge decision to next Attempt or stop).
- No 10th entity needed. Adding Agent, Prompt, Container, Ledger, Reviewer, Scheduler would cross into architecture.

**DECISION:** Adopt 6-entity core with 3 derived attributes/edges (`docs/core/concepts.md`).

## 3. Failure taxonomy assessment

| Group | Classes | Judgment |
|-------|---------|----------|
| Provider/infra stop | `PROVIDER_RATE_LIMIT`, `PROVIDER_ERROR`, `AUTH_ERROR`, `NETWORK_ERROR`, `INFRA_FAILURE` | FUNDAMENTAL distinction (D-008). Keep separated; all map to `STOPPED`, zero-bill, no verification. `TIMEOUT` does not belong here by default — ambiguous (infra vs model loop). |
| Model output | `EMPTY_OUTPUT`, `PATCH_INVALID` | Keep, but as Layer-1 fast rejects. `EMPTY_OUTPUT` confidence is MEDIUM-HIGH only post-D-008 fix. |
| Verification | `TEST_FAILURE`, `REGRESSION` | Keep. The only classes allowed full budget / proof path. `REGRESSION` is both a failure and a guardrail. |
| Heuristic | `WRONG_FILE` | HYPOTHESIS — LOW-MEDIUM confidence, mapping-dependent. Keep as provisional label, not core state. Candidate for demotion to evidence attribute if Phase 2D shows no signal. |
| Escape hatch | `OTHER` | Necessary but measures taxonomy incompleteness. Cap at 1 retry. Rising `OTHER` rate = signal to revise taxonomy, not to retry harder. |

**HYPOTHESIS:** 12 classes collapse to 4 behavioral groups (stop / format-reject / verify-and-retry / unclassified). The class names are policy handles, not ontological kinds.

## 4. Survival / ephemerality / immutability

- **Survive (DECISION):** task id + test sets + baseline; prior diffs; bounded evidence excerpts; labels + classifier version; accumulated cost + budget.
- **Ephemeral (HYPOTHESIS):** full transcripts/logs, containers/worktrees, full problem-statement resend. Phase 2D tests whether targeted excerpts suffice.
- **Immutable (DECISION):** task hash, attempt I/O hash, verification log ref, evidence, label+version, outcome+proof, cost. Corrections are new events, never edits (auditability after D-007).
- **NOT core (DECISION):** provider/model/manifest values (frozen config), MCP/plugin shapes, Docker/worktree mechanics, prompt text, pricing, multi-agent.

## 5. Conceptual model vs implementation architecture

| Conceptual model (this report + `docs/core/`) | Implementation architecture (explicitly NOT this) |
|-----------------------------------------------|---------------------------------------------------|
| Entities, states, events, survival rules | MCP server, Claude hook, Herdr variant, JSONL transport |
| `classify(Evidence) → label`, `decide(label, budget) → retry/stop` | Classifier code, policy table values, prompt templates |
| Layer ordering constraint (L1→L2→L3) | Docker invocation, `pytest -k` strings, timeout seconds |
| Cost as abstract accumulator with guardrails | Token counters, latency timers, ledger schema |

**Rule:** if replacing Docker with another sandbox, or MCP with another transport, leaves the statement unchanged, it belongs in the model. Otherwise it is architecture.

## 6. Open risks

1. **HYPOTHESIS:** Minimal context suffices for recovery — unproven until clean Phase 2D.
2. **HYPOTHESIS:** `WRONG_FILE` heuristic is actionable — may be noise.
3. **HYPOTHESIS:** Retry caps (1 vs 2) are right — conceptual bounds, not measured optima.

## 7. Verdict

CORE MODEL STATUS: **PROMISING**

Sufficient with 6+3 reduction; taxonomy usable as 4 behavioral groups; awaits clean Phase 2D for the minimal-context hypothesis. No scale-up implied.

**STOP.**
