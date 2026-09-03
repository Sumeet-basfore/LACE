# LACE Recovery Model (Conceptual)

**Status:** HYPOTHESIS — not validated at scale  
**Scope:** Conceptual model only. Not production architecture. Not implementation spec.  
**Date:** 2026-09-03

---

## Pipeline

```
Agent attempt
    ↓
Evidence collection
    ↓
Failure classification
    ↓
Minimal useful context
    ↓
Recovery action
    ↓
Verification
    ↓
Regression proof
    ↓
Final outcome
```

Each stage produces artifacts suitable for logging (JSONL ledger). The model assumes **bounded recovery** (finite retries), not unbounded agent loops.

---

## A. Failure

**What went wrong** — a single primary label per attempt, chosen from the taxonomy below. Failures are mutually exclusive categories for accounting purposes, even when multiple symptoms appear (e.g., empty patch after a 429 is `PROVIDER_RATE_LIMIT`, not `EMPTY_OUTPUT`).

---

## B. Evidence

**What the verification system observed** — structured facts, not agent self-report. Examples:

- Patch apply-check stderr
- Failing test name (`pytest -k` output)
- Assertion message and file:line
- Traceback excerpt (bounded, e.g. 20 lines)
- Token usage, latency, verification layer reached
- Provider error message from pi JSON stream

**Design principle:** Recovery quality depends on the **usefulness and specificity** of evidence, not merely on detecting that something failed. (HYPOTHESIS — Phase 2C showed generic 800-char tails did not enable recovery.)

---

## C. Classification

**What kind of failure occurred** — drives recovery action selection.

### Initial taxonomy

| Class | Category |
|-------|----------|
| `PATCH_INVALID` | Model output — malformed or non-applicable patch |
| `TEST_FAILURE` | Verification — FAIL_TO_PASS still failing |
| `REGRESSION` | Verification — PASS_TO_PASS broken |
| `TIMEOUT` | Execution — time budget exceeded |
| `EMPTY_OUTPUT` | Model output — no patch (no provider error) |
| `WRONG_FILE` | Model output — change not aligned with failing tests |
| `PROVIDER_RATE_LIMIT` | Provider — quota / 429 |
| `PROVIDER_ERROR` | Provider — other API errors |
| `AUTH_ERROR` | Provider — credentials |
| `NETWORK_ERROR` | Provider — transport |
| `INFRA_FAILURE` | Infrastructure — Docker, image, harness |
| `OTHER` | Unclassified |

**Separation rule:** Provider failure ≠ model failure ≠ verification failure ≠ infra failure. Each implies different recovery policy.

---

## D. Recovery Action

**The smallest reasonable action** for that failure class.

| Failure | Recovery action |
|---------|-----------------|
| `PATCH_INVALID` | Patch-format correction prompt; cheap apply-check feedback ("emit complete hunk") |
| `EMPTY_OUTPUT` | Re-prompt with format constraints; no expensive verification until patch exists |
| `TEST_FAILURE` | Targeted failure evidence (test name, assertion, traceback) + **targeted** retry — not full problem statement |
| `REGRESSION` | Regression evidence + corrective retry; do not claim success until PASS_TO_PASS restored |
| `TIMEOUT` | Reduce or reshape execution context — do not blindly replay full context |
| `WRONG_FILE` | Optional reviewer (diff-only) or file-scoped correction |
| `PROVIDER_RATE_LIMIT` | **Stop** — do not blindly retry; wait for quota or abort task |
| `PROVIDER_ERROR` / `AUTH_ERROR` / `NETWORK_ERROR` | **Stop** — surface error; do not count as model failure |
| `INFRA_FAILURE` | Recover infrastructure (image, Docker); do not blame model |

Retries are **bounded** (Phase 2D protocol: max 3 attempts per arm where retries apply).

---

## E. Verification Layers

Spend expensive verification only when cheaper layers pass.

### Layer 1 — Cheap structural validation

- Patch non-empty?
- `diff --git` + `@@` present?
- `git apply --check` or `patch --dry-run` (~0.1s, no Docker)

**Purpose:** Reject malformed output before any container work.

### Layer 2 — Targeted correctness verification

- Run only FAIL_TO_PASS tests (`pytest -k` on implicated tests)
- Extract structured evidence on failure

**Purpose:** Actionable feedback at lower cost than full suite (~80s vs minutes).

### Layer 3 — Regression verification

- Full suite or PASS_TO_PASS subset after Layer 2 passes

**Purpose:** Proof that fix does not break existing behavior.

### Optional — Reviewer

- Diff-only review when changed files do not match FAIL_TO_PASS mapping (suspected `WRONG_FILE`)

**Purpose:** Catch wrong-file edits cheaper than another full-context retry.

---

## Core Design Principle

> **Do not spend expensive verification or context until cheaper evidence says it is necessary.**

This directly addresses the Phase 2C observation (EVIDENCE): the current approach runs full Docker verification on every retry and resends full problem context (~176k cacheRead per pi call), yielding ~2.97× median token cost with 0/5 recovery.

---

## Relationship to Phase 2D Arms

| Arm | Recovery model instantiation |
|-----|------------------------------|
| Baseline | No recovery — single attempt, Layer 3 only |
| Current | Layer 3 only + generic feedback + full-context retry |
| Layered | Layers 1 → 2 → 3 with structured, minimal feedback |

Phase 2D tests whether layered instantiation improves recovery rate at acceptable cost. **Results not yet valid** — prior run contaminated by provider misclassification.

---

## Open Questions

1. **Does targeted evidence improve recovery rate** on real Lite tasks at n=7? (Phase 2D — OPEN)
2. **What is the minimum feedback payload** that enables recovery without full problem statement? (OPEN)
3. **When does optional reviewer pay for itself** vs an extra targeted retry? (OPEN)
4. **Optimal timeout / context-shaping policy** for `TIMEOUT` — not defined. (OPEN)
5. **Cross-task generalization** — n=7 design experiment cannot answer. (OPEN)
6. **Is layered recovery ≤1.5× baseline cost** with non-inferior regression? (Phase 2D design gate — OPEN)

---

## What This Document Does Not Claim

- That layered recovery works (HYPOTHESIS until clean Phase 2D data)
- That LACE is a validated product
- Production architecture, API shapes, or plugin implementation details
- That benchmark % resolved implies user value

See `docs/05-product-thesis.md` for product gates (T1–T4) and `context/brain.md` for current project state.
