# Phase 2D — Final One-Task Strategy Validation

**Run:** 2026-09-03  
**Task:** `pallets__flask-4992`  
**Manifest:** `research/phase2d/manifest-smoke.json` (hash `3ef6f198fd79d1db`)  
**Model:** `muse-spark-1.2-contributor-free` / **Provider:** `opencode`  
**Output:** `research/phase2d/raw-one-task-strategy-validation/` (fresh; no resume)

---

## FACT

- Exactly **one task × three arms** executed in a new output tree. No prior `result.json` was resumed.
- **Baseline** and **Current** each completed **1 attempt**, reported `resolved=true`, `failure_class=NONE`, with **non-zero** `totalTokens` (182,754 and 184,113).
- **Layered** completed **3 attempts**, reported `resolved=false`, `failure_class=MODEL_OUTPUT_INVALID`, `verification_layer=apply_check`, with **non-zero** `totalTokens` (577,785).
- **No provider failures** occurred on any arm (`provider_failure` absent from all records; no 429/auth/network errors in transcripts or logs).
- **Two full SWE-bench evaluations** ran (Baseline a1, Current a1). Both logs show `Running 1 instances...` / `All instances run.` — **not** `instances already run, skipping`.
- **Layered never reached** targeted pytest or regression full eval: no `*.targeted.log`, no `*.eval.json`, `evaluation_run_id=null`.
- All three Layered apply-check logs report `error: corrupt patch at line 42` (or 43) / `EXIT:128`.

---

## EVIDENCE

### Run configuration

| Item | Value |
|------|-------|
| OUT_ROOT | `research/phase2d/raw-one-task-strategy-validation` |
| MANIFEST_HASH | `3ef6f198fd79d1db` |
| Wall time | ~475 s (~7.9 min) |
| Harness exit | 0 (`Done`) |

### Arm A — Baseline

| Field | Value |
|-------|-------|
| instance_id | `pallets__flask-4992` |
| attempts / retries | 1 / 0 |
| patch_empty | `false` |
| failure_class | `NONE` |
| resolved | `true` |
| totalTokens / cacheRead | 182,754 / 178,673 |
| latency_seconds | 87.13 (pi 59.36, verification 27.76) |
| provider_failure | *(absent)* |
| infra_failure | `false` |
| evaluation_run_id | `phase2d-3ef6f198fd79d1db-baseline-a1-pallets__flask-4992-20260903T123210465114Z-523587cd7e9a` |
| evaluation_fresh | `true` |
| evaluation_cache_hit | `false` |

**Eval log** (`baseline/logs/pallets__flask-4992.log`): `Running 1 instances...`, `Instances resolved: 1`, report written to isolated temp dir with matching run ID.

**Eval report** (`baseline/logs/pallets__flask-4992.eval.json`): `resolved_ids: ["pallets__flask-4992"]`.

### Arm B — Current

| Field | Value |
|-------|-------|
| instance_id | `pallets__flask-4992` |
| attempts / retries | 1 / 0 |
| patch_empty | `false` |
| failure_class | `NONE` |
| resolved | `true` |
| recovered | `false` |
| totalTokens / cacheRead | 184,113 / 182,065 |
| latency_seconds | 126.10 (pi 98.47, verification 27.63) |
| provider_failure | *(absent)* |
| infra_failure | `false` |
| evaluation_run_id | `phase2d-3ef6f198fd79d1db-current-a1-pallets__flask-4992-20260903T123416696799Z-3576ef7151e6` |
| evaluation_fresh | `true` |
| evaluation_cache_hit | `false` |

**Eval log** (`current/logs/pallets__flask-4992.a1.log`): `Running 1 instances...`, `Instances resolved: 1`. Unique run ID distinct from Baseline.

**Retry path:** Not exercised — first-attempt full verification passed; no attempt 2.

### Arm C — Layered

| Field | Value |
|-------|-------|
| instance_id | `pallets__flask-4992` |
| attempts / retries | 3 / 2 |
| patch_empty | `false` (final attempt) |
| failure_class | `MODEL_OUTPUT_INVALID` |
| resolved | `false` |
| recovered | `false` |
| totalTokens / cacheRead | 577,785 / 570,643 |
| latency_seconds | 256.07 (pi 245.64, verification 10.39) |
| provider_failure | *(absent)* |
| infra_failure | `false` |
| evaluation_run_id | `null` |
| evaluation_fresh | `false` |
| evaluation_cache_hit | `false` |

#### Layered verification artifacts (per attempt)

| Attempt | Format check | Apply-check | Apply-check log | Targeted pytest | Regression |
|---------|--------------|-------------|-----------------|-----------------|------------|
| 1 | pass (reached apply-check) | **fail** | `corrupt patch at line 42` | not reached | not reached |
| 2 | pass | **fail** | `corrupt patch at line 43` | not reached | not reached |
| 3 | pass | **fail** | `corrupt patch at line 42` | not reached | not reached |

**Targeted pytest command** (would run if apply-check passed):

```text
python -m pytest -k "test_config_from_file_toml" -v
```

(`FAIL_TO_PASS`: `tests/test_config.py::test_config_from_file_toml`)

**Structured failure evidence (apply-check gate):**

| Field | Value |
|-------|-------|
| failing_test | `MODEL_OUTPUT_INVALID` |
| assertion | `patch does not apply in testbed` |
| file:line | *(not available — failure before pytest)* |
| traceback | apply-check log tail (`git apply --check` stderr) |
| retry reason | apply-check failed → targeted retry with structured feedback (attempts 2–3) |
| recovery | `false` |
| regression result | *(not run)* |

**Artifacts present:** `layered/logs/pallets__flask-4992.a{1,2,3}.apply_check.log`, `layered/transcript_pallets__flask-4992.txt`  
**Artifacts absent:** `*.targeted.log`, `*.eval.json`, `*.log` (regression)

### Evaluation freshness verification (full eval arms only)

| Arm | evaluation_fresh | evaluation_cache_hit | SWE-bench stdout | Unique run_id |
|-----|------------------|----------------------|------------------|---------------|
| Baseline | ✅ true | ✅ false | `Running 1 instances...` | ✅ distinct |
| Current | ✅ true | ✅ false | `Running 1 instances...` | ✅ distinct |
| Layered | N/A (no full eval) | N/A | — | — |

Baseline and Current run IDs differ from each other and from any prior `phase2d-{iid}` scheme.

### Patch extraction note

Transcript-stored patches are **~42 lines** and end mid-hunk (`if silent and e.errno in (errno.ENOENT, errno.EISDIR):`). Same truncation pattern across all arms. Baseline/Current still achieved SWE-bench `resolved=true` with fresh eval; Layered `git apply --check` rejected the same class of patch as corrupt.

---

## INFERENCE

- The **evaluation-freshness fix works** for full-eval arms: no cache-skip messages, unique run IDs, `evaluation_fresh=true` on both Baseline and Current.
- **Harness plumbing is validated** for this task: model calls succeed, tokens recorded, provider classification not triggered, Layered gates execute in order through apply-check.
- **Layered recovery/regression path was not exercised** on this task because apply-check blocked all three attempts before targeted pytest.
- **Verification-layer divergence:** SWE-bench full eval accepted patches that `git apply --check` inside `/testbed` rejected as corrupt. Baseline/Current `resolved=true` therefore does not imply Layered apply-check would pass on the same extracted patch bytes.
- **Current retry loop was not stress-tested** — first attempt resolved, so generic feedback retry never ran.

---

## HYPOTHESIS

- Model output may be **truncated before the diff closes**, yet SWE-bench’s in-container patch application may be more tolerant than strict `git apply --check` (or applies partial hunks sufficient for `test_config_from_file_toml`).
- Layered’s earlier **apply-check gate** surfaces patch integrity problems that Baseline/Current **full eval masks** on this instance.
- Targeted retry feedback after apply-check failure may not improve patch completeness if the root cause is output truncation rather than test-level logic errors.

*(Not tested on this run; requires controlled patch-completeness experiments.)*

---

## DECISION

| Item | Status |
|------|--------|
| Fresh evaluation integrity (Baseline/Current) | **PASS** — `evaluation_fresh=true`, no cache hits |
| Provider error handling | **PASS** — no provider failures |
| Non-zero token usage on successful model calls | **PASS** |
| Layered pipeline through apply-check | **PASS** (gate executed correctly) |
| Layered targeted pytest / regression | **NOT REACHED** — blocked by apply-check |
| Cross-arm strategy comparison on this task | **BLOCKED for product conclusions** — single instance; Layered incomplete; verification layers disagree |
| Batch 1 | **DO NOT RUN** — multi-task strategy validation still required; Layered end-to-end path not demonstrated |

**Next validation gate (not executed here):** at least one Layered run where apply-check passes and targeted pytest executes, with fresh regression eval (`evaluation_fresh=true`).

---

## Artifact index

```
research/phase2d/raw-one-task-strategy-validation/
├── results.json
├── baseline/result.json, transcript_*, logs/pallets__flask-4992.{log,eval.json}
├── current/result.json, transcript_*, logs/pallets__flask-4992.a1.{log,eval.json}
└── layered/result.json, transcript_*, logs/pallets__flask-4992.a{1,2,3}.apply_check.log
```

PHASE_2D_ONE_TASK_STRATEGY_COMPLETE
