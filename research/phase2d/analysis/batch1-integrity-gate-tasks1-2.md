# Phase 2D Batch 1 — Tasks 1–2 Integrity Gate

**Date:** 2026-09-03  
**Manifest hash:** `1e59b39048659134`

## DECISION: **PASS** — continue with tasks 3–5

Harness and evaluation plumbing are clean. One isolated pi subprocess TIMEOUT on `django__django-11019` [layered] is classified as `provider_failure=TIMEOUT` with zero tokens — not rate-limit contamination.

## FACT — Task 1 `astropy__astropy-14365`

| Arm | resolved | attempts | failure_class | tokens | eval_fresh | eval_cache_hit | verification_layer |
|-----|----------|----------|---------------|--------|------------|----------------|-------------------|
| baseline | false | 1 | TEST_FAILURE | 200,110 | **true** | **false** | full |
| current | **true** | 1 | NONE | 195,323 | **true** | **false** | full |
| layered | false | 3 | TEST_FAILURE | 585,701 | n/a | n/a | **targeted** |

- Layered: apply-check + targeted pytest logs present for attempts 1–3; never reached regression full eval.
- `patch_normalized=true` on all arms with patches.

## FACT — Task 2 `django__django-11019`

| Arm | resolved | attempts | failure_class | tokens | eval_fresh | eval_cache_hit |
|-----|----------|----------|---------------|--------|------------|----------------|
| baseline | false | 1 | TEST_FAILURE | 198,866 | **true** | **false** |
| current | false | 3 | TEST_FAILURE | 589,679 | **true** | **false** |
| layered | false | 1 | **TIMEOUT** | **0** | n/a | n/a |

- Layered django: `provider_failure=TIMEOUT`, `verification_layer=provider_failure`, no verification attempted — correct fail-closed behavior.

## EVIDENCE — Fresh evaluation (full-eval arms)

All baseline/current eval logs show `Running N instances...` (not cache skip). Unique `evaluation_run_id` per invocation recorded in `result.json`.

## INFERENCE

- EOF normalization is active (`patch_normalized=true` where patches extracted).
- No provider-rate-limit misclassification observed.
- Layered pipeline executes intended stages when pi returns a patch.

STOP (gate only — experiment continues).
