# Layered Smoke Environment Fix

**Date:** 2026-09-03  
**Status:** Fixed in `research/phase2d/harness.py`

## FACT

- One-task clean smoke (`pallets__flask-4992`) completed with provider handling, baseline, and current **PASS**.
- Layered arm **stopped at apply-check** on all 3 attempts (`failure_class=MODEL_OUTPUT_INVALID`, `verification_layer=apply_check`).
- **Targeted pytest and regression layers were never reached** (`verification_latency` ≈ 0.02s; no `*.targeted.log` files).
- Baseline/current patches that passed full swebench eval were rejected by layered apply-check.

## ROOT CAUSE

- `check_patch()` ran `patch --dry-run -p1` against the **LACE host workspace**, which does not contain the SWE-bench repository checkout (`src/flask/config.py`, etc.).
- Valid patches failed with `can't find file to patch` — not because the patch was wrong for the testbed.
- Targeted pytest parsing used loose substring heuristics (`"passed" in output`, `"FAILED" not in output`), which is fragile.

## FIX

1. **`validate_patch_format()`** — local structural checks only (`EMPTY_OUTPUT`, missing `diff --git`/`@@`).
2. **`apply_check_in_testbed(iid, patch)`** — mounts patch into the **same SWE-bench Docker image** used for evaluation and runs `git apply --check /tmp/patch` inside `/testbed`.
3. **Layered arm** calls `apply_check_in_testbed` instead of host-side `patch --dry-run`; logs to `{iid}.a{n}.apply_check.log`.
4. **`parse_pytest_output()`** — parses pytest summary lines (`N passed`, `N failed`, `no tests ran`, `collected 0 items`) and FAILED test lines; no loose `"passed" in output` logic.
5. **`targeted_eval()`** — uses robust parser; preserves full stdout/stderr in log artifacts.
6. Regression tests in `research/phase2d/test_harness_verification.py`.
7. Smoke CLI: `python research/phase2d/harness.py smoke-apply-check [instance_id]` (uses `fixtures/{iid}-gold.patch` from SWE-bench Lite).

Patches are written to temp files and mounted read-only; **the LACE repository is never modified**.

## DECISION

- The prior layered smoke **does not validate or invalidate** layered recovery — the layered verification pipeline was never exercised.
- Re-run one-task layered smoke (or full 3-arm smoke) only after this fix to observe targeted/regression behavior.
- Baseline and Current arms unchanged (still use full swebench eval only).

## Validation

```bash
python -m unittest research.phase2d.test_harness_classification research.phase2d.test_harness_verification -v
python research/phase2d/harness.py smoke-apply-check pallets__flask-4992
```
