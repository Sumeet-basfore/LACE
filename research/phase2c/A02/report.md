# A02 — Cost & Latency Autopsy (powered-30 partial, n=7 paired)

**Date:** 2026-09-02 · **Model:** muse-spark-1.2-contributor-free (free tier cost.total=0) · **Dataset:** lite · **Harness:** powered_harness.py (pi -p --mode json, opencode) + swebench Docker

## Profiles (median of 7 paired tasks, from result.json)

|  | baseline | candidate | ratio | notes |
|---|---|---|---|---|
| median totalTokens (native) | 189,706 | 563,434 | **2.97×** | candidate = baseline + retries (1→3 calls for 4/7 tasks) |
| median input | ~360–1,113 | ~1,000–3,000 (sum) | 2.5–3× | sum of 3× pi calls, each with full problem_statement + feedback |
| median output | 313–758 | 900–2,200 (sum) | 2.8× | |
| cacheRead | 176k–204k per call | 3× = 500k+ | 3× | opencode cacheRead dominates totalTokens (99% is cacheRead, not input) |
| cost | 0 | 0 | 1× | free tier, so ratio measured on tokens proxy |
| median latency total | 236.68s | 491.93s | **2.08×** | pi + verification |
| median pi latency | ~90s | ~300s (3×) | 3× | |
| median verification latency | ~90s | ~250s (3×) | 2.8× | Docker eval 32–325s per attempt, 3× for failures |
| P90 latency | ~400s | ~900s | 2.25× | tail dominated by 22711 (918s candidate) |

**Observed interim (n=7):** candidate median 2.97× tokens, 2.08× latency — exceeds T1 guardrail 2× on both. Synthetic pilot median was 1.27× tokens / 0.99× latency (only 1/5 retried); real tasks retried 4/7 (57%) so guardrail breach is driven by retry rate, not single-retry cost.

## Overhead Decomposition (where data allows)

### 1. Number of model calls (dominant)
- Baseline: 1 pi call per task (7 calls total, 7/7 executed)
- Candidate: 1 call for 3 successes + 3 calls for 4 failures = 15 calls total (7 tasks × avg 2.14 attempts)
- Contribution: **~60% of token overhead** — each extra call repeats full problem_statement (2–5k chars) + patch + cache.

### 2. Input growth / cacheRead duplication
- Each pi call via `pi -p --mode json` sends full `problem_statement` (2–8k chars for matplotlib with repro code) plus repo context from bash tool. `cacheRead` per call is 176k–204k tokens (opencode prompt cache), so 3 calls = 3× cacheRead. This is not "verification output" but repeated context.
- Feedback size: eval log tail 800 chars adds ~200 tokens, minor vs cacheRead.

### 3. Verification output / Docker overhead
- Swebench eval per attempt: 32s (patch apply fail) to 325s (full suite). For 4 failing tasks, candidate runs 3× eval = 96–975s extra latency vs baseline 1×. This is **~30% of latency overhead**.
- For successes, candidate does 1 eval same as baseline, so no overhead — but median is pulled up by failing tasks.

### 4. Context duplication (problem_statement + patch)
- Baseline and candidate both send full problem_statement each call; candidate's retry also resends it plus previous patch + feedback. No prompt compression.

### 5. No major overhead from tool-output differences or long test output fed to model
- Feedback is 800-char eval log tail, not full test output (which is 100s of lines but truncated). So test output length is not a driver — the driver is number of calls.

### 6. Pathological cases
- **matplotlib 18869**: baseline patch hallucinated `__version_info__` (wrong file), eval 234s, candidate did 3× hallucinated patches (591k tokens, 871s) — all waste.
- **22711**: pi timeout 300s ×1 baseline (309s) + 3× candidate (918s) with empty patches — 1200s total for 0 signal. Should have been caught by `git apply --check` or prompt truncation before Docker.
- **10924/11001**: patch truncated, eval 32–36s (fast fail on apply), but still 3× pi calls (586k tokens) — cheap to detect via `git apply --check` without Docker.

## Baseline vs Candidate Token Profile Example

- **Success (12907):** baseline 176,786 tokens (input 360 output 313 cacheRead 176k) / candidate 178,613 (1 attempt, similar) — ratio 1.01×, latency 177s vs 180s — verification adds ~1% when no retry.
- **Failure (14182):** baseline ~199k / candidate 560,065 (3×) — ratio 2.8×, latency 236s vs 491s — retry drives overhead.
- **Malformed (10924):** baseline ~150k / candidate 586,676 (3×) — ratio 3.9×, but Docker cheap (32s) so latency ratio smaller.

## Latency Breakdown

- Pi reasoning: 60–110s per call (including bash tool grep), 3 calls = 180–330s for failures.
- Docker: 32s (apply fail) to 325s (full suite). For 4/7 failures, candidate does 3× Docker = 100–975s extra.
- Waiting vs reasoning: pi's `usage.reasoning` 148–562 tokens, small vs `cacheRead` 176k — most tokens are cached context, not reasoning.

## Conclusion on "verification loop itself"

- Verification loop *detection* (Docker) is not the sole driver — the **retry count** (57% of tasks retried 3×) is. At synthetic pilot retry rate 20% (1/5), median was 1.27×; at real 57%, median 2.97×.
- If retry were targeted (only retry malformed/empty quickly via `git apply --check`, and only run FAIL_TO_PASS for unresolved), overhead would be far lower.

## Estimates (where data allows, not fabricated dollars)

- Eliminating 2 of 3 retries for empty/malformed via cheap check would save ~400k tokens and ~400s per such task (~40% of candidate median).
- Running only FAIL_TO_PASS (1–2 tests) instead of full suite would save ~150s per eval (Docker) for 18869/22835 (325s full vs ~80s targeted).

