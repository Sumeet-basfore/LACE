# Phase 2D — Patch EOF Normalization

## FACT

From `research/phase2d/analysis/patch-application-semantics.md` and artifact replay on `pallets__flask-4992`:

- The exact Baseline model patch (1678 bytes, SHA-256 `3a3940fc…`) **lacked a trailing EOF newline**.
- `git apply --check` in the SWE-bench testbed failed with `error: corrupt patch at line 42` (exit 128).
- Appending **exactly one** `\n` made `git apply --check` pass (exit 0) and all `git apply` modes apply cleanly.
- SWE-bench full eval still accepted the **unnormalized** patch via its `patch --fuzz=5` fallback (step 4 of its apply chain).
- Layered apply-check used only `git apply --check` on raw bytes → false negative vs Baseline/Current full eval.

## DESIGN DECISION

**Normalize patch EOF immediately after extraction, before any structural apply gate or evaluation.**

```python
def normalize_patch(patch: str) -> str:
    if not patch:
        return patch
    if patch.endswith("\n"):
        return patch
    return patch + "\n"
```

Applied in `pi_patch()` after `extract_patch()`. The normalized patch is used for:

- Layered `apply_check_in_testbed`
- Layered `targeted_eval`
- All arms `full_eval`
- Retry loops (each new extraction is normalized)

**Forensics:** transcripts log the **raw** extracted patch (`PATCH:` / `ATTEMPT N PATCH:`). Result records include `patch_normalized: true/false`.

**Not in scope (yet):** SWE-bench’s full multi-strategy apply chain (`patch --fuzz=5` fallback).

## WHY

- Eliminates **formatting-level false negatives** at the Layered apply-check gate without changing model output semantics.
- Preserves raw model bytes in transcripts for auditing and diffing against normalized verification input.
- Minimal, deterministic transform — no whitespace rewriting beyond a single trailing newline when missing.

## UNRESOLVED

- Whether patches that still fail after EOF normalization require SWE-bench’s `patch --fuzz=5` fallback at the Layered gate (other patch classes not observed on this task).
- Whether normalization alone is sufficient across all 7 canonical manifest tasks (only `pallets__flask-4992` proven so far).

## Implementation

| Location | Change |
|----------|--------|
| `harness.py` | `normalize_patch`, `patch_was_normalized`, `patch_normalization_fields` |
| `harness.py` | `pi_patch` returns `raw_patch` as 8th value; normalized patch as primary |
| `harness.py` | `write_transcript(..., raw_patch=…)` logs forensic raw bytes |
| `harness.py` | `result.json` records include `patch_normalized` |

## Tests

`research/phase2d/test_harness_patch_normalization.py`

```bash
python3 -m unittest research.phase2d.test_harness_patch_normalization -v
```

STOP.
