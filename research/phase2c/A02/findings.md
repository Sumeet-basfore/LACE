# A02 Findings

## Main cost driver is retry count, not verification per se
- At 1 retry (synthetic pilot, 1/5 tasks), median 1.27×; at 3 retries for 57% of real tasks, median 2.97×. Cost scales with failure rate × attempts.

## CacheRead duplication is the token multiplier
- 99% of tokens are cacheRead (176k per call), so 3 calls = 3× tokens even though feedback is small. This is an artifact of `pi -p` sending full problem_statement + history each call via opencode cache.

## Docker overhead is secondary but non-negligible for hallucinated tasks
- Full suite 234–325s vs apply-fail 32s — running full suite for every retry wastes ~200s per attempt for tasks that could be rejected by `git apply --check` or FAIL_TO_PASS-only run.

## Timeout tasks are pathological for candidate
- 22711: 300s pi timeout ×4 (1 baseline +3 candidate) = 1200s pi + 1200s eval = 2400s for 0 signal. Layered check (prompt size → truncate or skip) would avoid.

## Successes add almost no overhead
- 3/7 successes (12907,10914,22835,2848,3010) have ratio ~1.0–1.1× — verification overhead only matters when retry triggers.

## Latency ratio 2.08× is slightly better than token ratio because Docker for successes is single

