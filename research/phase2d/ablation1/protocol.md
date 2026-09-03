# Phase 2D Ablation 1 Protocol

**Date:** 2026-09-03  
**Experiment:** Isolate source of Current arm improvement (Batch 1: 80% vs baseline 40%)  
**Dataset:** SWE-bench Lite (`test` split), n=10  
**Model:** `muse-spark-1.2-contributor-free`  
**Provider:** `opencode`  
**Harness commit:** `4788c3844068b46f1b51394538e8b1b022a693e3` (at protocol freeze; update if harness changes before run)  
**Protocol hash:** recorded in `protocol.hash` and `experiment-metadata.json`

## Research question

**HYPOTHESIS:** Current's Batch 1 advantage comes from a specific sub-mechanism (first-attempt quality vs recovery vs feedback shape vs failure classification).

**Not in scope:** Layered verification (rejected as CORE after Batch 1).

## Arms

| Arm | Attempts | Retry policy | Feedback |
|-----|----------|--------------|----------|
| **A baseline** | 1 | none | — |
| **B current** | ≤3 | Batch 1 exact: full problem_statement + 800-char eval tail | generic eval tail |
| **C minimal** | ≤2 | 1 retry max | failing test, assertion, file:line only; **no** full problem_statement on retry |
| **D structured** | ≤2 | 1 retry max | failure-class-aware JSON payload; **no** full problem_statement on retry |

Provider/infra failures: **non-retryable**, fail-closed, zero tokens where applicable.

## Task manifest

- File: `research/phase2d/ablation1/manifest.json`
- SHA-256: `d0ecdb63ad1fc3ae1961852f5df71c370343239864ccd508dd859c901e4d2253`
- Short hash: `d0ecdb63ad1fc3ae`
- Selection: lexicographically smallest unused instance per repo after all prior LACE exclusions; then 10 lexicographically smallest picks (10 unique repos).

## Execution

```bash
cd <repo-root>
python3 research/phase2d/harness.py ablation1          # full run (resume-safe)
python3 research/phase2d/harness.py ablation1-smoke  # first manifest task × 4 arms
```

- Sequential: all tasks × all arms
- Resume-safe: skips rows present in `raw/<arm>/result.json`
- Output: `research/phase2d/ablation1/raw/`

## Evaluation integrity (unchanged from Batch 1)

- Unique `evaluation_run_id` per full eval
- `evaluation_fresh=true`, `evaluation_cache_hit=false` required
- Fail-closed on cache hits or stale reports
- Raw and normalized patches stored separately
- EOF patch normalization preserved

## Stop conditions (immediate halt)

- `PROVIDER_RATE_LIMIT`
- `EVALUATION_CACHE_HIT` or broken freshness
- Provider failures counted as model TEST_FAILURE
- Arm/task/model configuration drift
- Patch application infrastructure inconsistency

## Primary metrics

Distinguish **initial success** (`initially_resolved`) from **recovery** (`recovered`).

| Metric | Definition |
|--------|------------|
| `resolved` | Final SWE-bench resolved |
| `initially_resolved` | Resolved on attempt 1 |
| `recovered` | Not resolved attempt 1, resolved finally |
| `failed_after_retry` | Retry used, still unresolved |
| `feedback_bytes` | UTF-8 byte length of retry payload |
| `evidence_categories` | e.g. failing_test, assertion, failure_class |

## Analysis questions (post-run)

1. Does Current reproduce Batch 1 advantage?
2. Advantage mostly first-attempt or recovery?
3. Does Minimal preserve improvement at lower cost?
4. Does Structured beat Minimal?
5. Cheapest feedback payload that still recovers?
6. Is failure classification useful or complexity?
7. Causal primitive: verification vs feedback vs recovery policy vs classification?

## Decision rule (research only — not product GO)

| Outcome | Interpretation |
|---------|----------------|
| Current > Baseline, Minimal ≈ Current | evidence favors **minimal corrective feedback** |
| Current > Baseline, Structured > Minimal | evidence favors **failure-aware recovery policy** |
| Current > Baseline, neither Minimal nor Structured reproduce | investigate hidden implementation differences |
| Current does not reproduce | Batch 1 may be variance; do not escalate |
| All recovery arms costly, no recovery benefit | reconsider LACE thesis |

**DECISION:** Do not declare product GO from this experiment.

## Epistemic discipline

Label claims: FACT | EVIDENCE | INFERENCE | HYPOTHESIS | DECISION  
Do not claim statistical significance (n=10 design experiment).
