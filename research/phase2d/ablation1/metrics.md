# Ablation 1 Metrics

## Primary (per task × arm)

| Field | Type | Notes |
|-------|------|-------|
| `resolved` | bool | Final SWE-bench outcome |
| `initially_resolved` | bool | Attempt 1 only |
| `recovered` | bool | `attempts > 1` and final resolved |
| `failed_after_retry` | bool | `attempts > 1` and not resolved |

## Secondary (per task × arm)

| Field | Type |
|-------|------|
| `totalTokens` | int |
| `cacheRead` | int |
| `latency_seconds` | float |
| `pi_latency` | float |
| `verification_latency` | float |
| `attempts` | int |
| `retries` | int |
| `failure_class` | string |
| `feedback_bytes` | int |
| `evidence_categories` | list[string] |
| `evaluation_fresh` | bool |
| `evaluation_cache_hit` | bool |
| `patch_normalized` | bool |

## Derived (aggregate per arm)

| Metric | Formula |
|--------|---------|
| Recovery rate (overall) | `count(resolved) / n` |
| Initial success rate | `count(initially_resolved) / n` |
| Recovery among failures | `count(recovered) / count(not initially_resolved)` |
| Median tokens | median excluding provider-timeout rows with 0 tokens |
| Median latency | median excluding provider-timeout rows |
| Token overhead vs baseline | `median_tokens_arm / median_tokens_baseline` |
| Latency overhead vs baseline | `median_latency_arm / median_latency_baseline` |
| Regression rate | tasks where baseline resolved and arm did not |

## Failure taxonomy (minimum)

- `TEST_FAILURE`
- `PATCH_APPLICATION_FAILURE` (includes `MODEL_OUTPUT_INVALID`, apply-check failures)
- `TIMEOUT` / `PROVIDER_*` (non-retryable)
- `EMPTY_OUTPUT`
- `WRONG_FILE` (when detectable)
- `INFRA_FAILURE` / `EVALUATION_*` (non-retryable)

## Batch 1 reference (not compared statistically)

| Arm | Resolved | Median tokens | Median latency |
|-----|----------|---------------|----------------|
| baseline | 40% | 199,702 | 342.5s |
| current | 80% | 214,359 (1.07×) | 376.3s (1.10×) |
| layered | 0% | 591,640 (2.96×) | 446.2s (1.30×) |

Ablation 1 asks whether **current**'s improvement is reproducible and which feedback mechanism explains it.
