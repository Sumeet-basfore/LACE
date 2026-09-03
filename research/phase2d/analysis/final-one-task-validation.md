# Phase 2D Final One-Task Validation

**Date:** 2026-09-03  
**Task:** `pallets__flask-4992`  
**Manifest:** `research/phase2d/manifest-smoke.json` (hash `3ef6f198fd79d1db`)  
**Output:** `research/phase2d/raw-final-one-task/`  
**Model / provider:** `muse-spark-1.2-contributor-free` / `opencode`

---

## FACT

- All three arms executed on the single smoke-manifest task without provider failures.
- No `provider_failure` fields appear in any `result.json`; no `PROVIDER_RATE_LIMIT` / `EMPTY_OUTPUT` misclassification.
- Successful pi calls recorded non-zero `totalTokens` and `cacheRead` in all arms.
- Layered apply-check ran inside Docker `/testbed` (`git apply --check`); logs at `layered/logs/pallets__flask-4992.a{1,2,3}.apply_check.log`.
- All three layered apply-check attempts failed with `error: corrupt patch at line 42/43` / `EXIT:128`.
- No `*.targeted.log` files were produced — targeted pytest and regression were **not reached**.
- Baseline and Current `resolved=true` in this run coincided with swebench log `1 instances already run, skipping...` (cached prior eval for same `run_id=phase2d-pallets__flask-4992`), not a fresh patch evaluation in this run.
- Gold reference patch (`fixtures/pallets__flask-4992-gold.patch`) passes `apply_check_in_testbed` (`failure_class=None`).
- Model-produced patches in transcripts are ~42 lines and truncated mid-hunk; they fail `git apply --check` in testbed.
- An aborted earlier run (before `final-one-task` CLI) briefly touched canonical `research/phase2d/raw/`; final results are isolated under `raw-final-one-task/`.

---

## EVIDENCE (this run, n=1)

| Arm | Resolved | Attempts | failure_class | totalTokens | Latency (s) | ver_latency (s) |
|-----|----------|----------|---------------|-------------|-------------|-----------------|
| Baseline | true* | 1 | NONE | 183,098 | 52.9 | 7.1 |
| Current | true* | 1 | NONE | 185,803 | 45.9 | 7.0 |
| Layered | false | 3 | MODEL_OUTPUT_INVALID | 595,564 | 451.8 | 10.4 |

\*See FACT: swebench cache skip; not independently verified in this run.

### Arm A — Baseline

| Field | Value |
|-------|--------|
| Model | Success (patch non-empty) |
| Patch extraction | Unified diff extracted; **truncated** (~42 lines) |
| Evaluation | swebench full suite — **skipped (cache)** |
| failure_class | NONE |
| provider_failure | absent |
| infra_failure | false |

### Arm B — Current

| Field | Value |
|-------|--------|
| Attempt 1 | pi success; patch truncated |
| Verification | swebench full — **skipped (cache)** |
| Feedback / retry | Not used (would have stopped after attempt 1 anyway) |
| failure_class | NONE |
| recovered | false |

### Arm C — Layered

| Attempt | Format check | apply-check (testbed) | Targeted pytest | Regression |
|---------|--------------|----------------------|-----------------|------------|
| 1 | pass | **FAIL** corrupt patch L42 | not run | not run |
| 2 | pass | **FAIL** corrupt patch L43 | not run | not run |
| 3 | pass | **FAIL** corrupt patch L43 | not run | not run |

| Field | Value |
|-------|--------|
| apply-check result | `MODEL_OUTPUT_INVALID` all attempts |
| targeted command | not reached (`pytest -k test_from_toml` would run) |
| targeted pytest result | N/A |
| failing test / assertion / traceback | Synthetic: `MODEL_OUTPUT_INVALID` / patch does not apply in testbed / git stderr |
| retry reason | apply-check failure (eligible) |
| recovery | false |
| regression | not reached |

---

## INFERENCE

- Harness **provider classification** and **testbed apply-check plumbing** behave as designed on this task.
- Baseline/Current **resolved=true is not reliable evidence** for this run because swebench reused a prior evaluation artifact for the same instance/run-id.
- Layered did not exercise targeted pytest parsing or recovery on this task because **model output patches were incomplete**, not because apply-check ran on the wrong filesystem (fixed in prior harness change).

---

## HYPOTHESIS

- Truncated pi patches may be a recurring model/output issue on this task; layered apply-check will surface them before expensive targeted/regression steps (intended behavior).
- Fresh swebench eval per validation run may require unique `run_id` suffixes to avoid cache false positives.

---

## DECISION

- **Harness validation (classification, apply-check in testbed, retry gating): PASS** for pre–Batch 1 gate on plumbing.
- **Layered recovery validation: INCONCLUSIVE** on this task — pipeline stopped at apply-check due to corrupt/truncated model patches; targeted/regression never ran.
- **Do not infer product value** from n=1; do not treat Baseline/Current resolved=true as fresh success without cache-busted eval.
- **Proceed to Batch 1** only after deciding swebench run-id/cache policy and optionally re-running one-task with cache bust and/or complete patches.

---

## Verification checklist

| Check | Result |
|-------|--------|
| Provider failures ≠ EMPTY_OUTPUT | PASS |
| Non-zero usage on successful pi calls | PASS |
| apply-check in testbed | PASS (runs; correctly rejects corrupt patches) |
| Targeted pytest parsing | NOT EXERCISED |
| Retries only on eligible failures | PASS (MODEL_OUTPUT_INVALID retries; no provider retries) |
| Canonical manifest unchanged | PASS (`33424b751c06e621`) |

---

## Artifacts

- `research/phase2d/raw-final-one-task/results.json`
- `research/phase2d/raw-final-one-task/{baseline,current,layered}/result.json`
- `research/phase2d/raw-final-one-task/layered/logs/pallets__flask-4992.a*.apply_check.log`
