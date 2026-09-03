# Phase 2D — Evaluation Freshness Integrity

## FACT

During final one-task validation (`pallets__flask-4992`), **Baseline** and **Current** both reported `resolved=true`, but SWE-bench stdout contained:

```
1 instances already run, skipping...
```

Those arms did **not** perform a fresh full evaluation in that run. They reused a prior SWE-bench result cached under the same `run_id`.

## ROOT CAUSE

`full_eval()` used a deterministic run ID derived only from the instance:

```python
run_id = f"phase2d-{iid}"
```

SWE-bench skips instances when `logs/run_evaluation/{run_id}/.../report.json` already exists for that run ID. Reusing the ID caused cached reports to be aggregated and treated as the current invocation’s outcome.

A secondary hazard was report discovery: the harness fell back to globbing `*.json` in the current working directory, which could pick up unrelated stale reports.

## FIX

`research/phase2d/harness.py` now guarantees per-invocation evaluation identity and fail-closed validation:

1. **Unique run ID** via `build_evaluation_run_id()` including:
   - experiment/session id (`MANIFEST_HASH`)
   - arm (`baseline` / `current` / `layered`)
   - attempt number
   - instance id
   - UTC timestamp + UUID fragment

2. **Isolated evaluation workspace** — each `full_eval()` writes a fresh `pred.jsonl`, runs SWE-bench with `--report-dir` inside a unique temp directory, and never glob-searches for reports.

3. **Post-eval validation** via `validate_evaluation_freshness()`:
   - reject `"instances already run, skipping"` → `EVALUATION_CACHE_HIT`
   - reject reports whose mtime predates the invocation
   - verify report filename contains the current `run_id`
   - verify submitted patch hash matches `patch.diff` when present

4. **Fail closed** — if freshness cannot be proven, `resolved` is forced to `false`.

5. **Explicit result metadata** on every task record:
   - `evaluation_run_id`
   - `evaluation_fresh` (bool)
   - `evaluation_cache_hit` (bool)

## DECISION

- One-task smoke **harness plumbing** (provider classification, apply-check in testbed, evaluation wiring) is acceptable to proceed after this fix.
- **Strategy validation** (Baseline vs Current vs Layered on meaningful resolved rates) remains **blocked** until a one-task re-run confirms fresh full evaluations with non-cached `evaluation_fresh=true` results.
- **Do not run Batch 1** until fresh evaluation integrity is demonstrated on the smoke task.

## Tests

Focused unit tests: `research/phase2d/test_harness_evaluation_freshness.py`

```bash
python3 -m unittest research.phase2d.test_harness_evaluation_freshness -v
```
