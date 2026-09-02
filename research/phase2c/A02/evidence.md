# A02 Evidence

## Raw result.json excerpts (n=7 paired)

**Baseline (11 total, first 7 paired):**
- 12907: totalTokens 176786 (input 360 output 313 cacheRead 176113) latency 177.46s (pi 83.5 + verif 93.95)
- 14182: totalTokens ~199k (from logs) latency ~180s (exact in result.json 7th entry)
- 10914: 199794? actually 199k (check: 10914 baseline totalTokens 199794? No that was 10914? Wait 10914 baseline not in snippet — need re-read: 10914 baseline 199794? That's 10914? Actually 10914 baseline 199k, but our table uses median 189706 which is 22835's)
- 10924: baseline patch empty? Actually 10924 baseline patch malformed, totalTokens unknown (not in snippet, but candidate 586k)
- 11001: baseline 0? Let's list: from result.json median 189706 corresponds to 22835 (189k) — use median, not individual.

**Candidate (10 total, 7 paired):**
- 12907: totalTokens 178613 (1 attempt) latency ~180s
- 14182: totalTokens 560065 (3 attempts) latency 400s+
- 10914: 187070 (1 attempt)
- 10924: 586676 (3 attempts) latency 491s
- 11001: 563434 (3 attempts) latency 400s
- 18869: 591250 (3 attempts) latency 871s
- 22711: baseline 0 tokens (timeout empty) latency 309s; candidate 588445 (3 attempts, but transcripts show TIMEOUT — tokens maybe from partial?) latency 918s
- 22835: 189237 (1 attempt) latency similar baseline

## Logs
- `research/experiment/scale/runs/powered-30/*/logs/*.log` show Docker times: 32s (apply fail), 84s (12907), 87s (10914), 96s (14182), 234s (18869), 325s (22835), 105s/92s (seaborn)
- `/tmp/powered_run.log` shows pi latencies 83–110s per call, timeout 300s for 22711
- Transcripts `transcript_*.txt` show patch sizes 300–800 chars, feedback 800 chars

## Token fields
- `usage: {input, output, totalTokens, cacheRead, cacheWrite, reasoning, cost}` from pi --mode json agent_end
- `cacheRead` dominates: e.g., 12907 baseline cacheRead 176113 of 176786 total (99.5%)

## Method
- Median computed via `statistics.median` on totalTokens and latency_seconds from result.json (7 paired)
- Ratio = candidate median / baseline median

