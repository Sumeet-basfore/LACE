# A01 Evidence

## Sources
- `research/experiment/scale/runs/powered-30/baseline/result.json` (11 entries, 2026-09-02, lite, model muse-spark-1.2-contributor-free)
- `research/experiment/scale/runs/powered-30/candidate/result.json` (10 entries)
- `research/experiment/scale/runs/powered-30/{baseline,candidate}/transcript_*.txt` (11+10)
- `research/experiment/scale/runs/powered-30/{baseline,candidate}/logs/*.log` and `*.eval.json` (swebench reports, docker logs)
- `/tmp/powered_run.log` (harness stdout, timeout traces for 22711)
- `research/experiment/protocol.md` (retry≤2, deterministic verification) and `research/experiment/metrics.md` (M1 resolved, M3 regression, M7 recovery)

## Raw Observations
- astropy 12907: both PASS, patch `cright[-...] = 1` → `= right` (gold-like), eval 84s baseline/83s candidate, tokens 176k vs 178k
- astropy 14182: both FAIL unresolved, baseline patch removes `start_line=3`, candidate a1 similar cosmetic RST, a2/a3 other RST tweaks, eval 96s each, tokens 560k candidate (3×)
- django 10914: both PASS, patch `FILE_UPLOAD_PERMISSIONS None→0o644` (gold), eval 87s, tokens 199k vs 187k
- django 10924: baseline FAIL patch apply `Hunk FAILED at 1208` (forms/fields.py truncated), candidate a1 diff `fields/__init__.py` + `forms/fields.py` truncated, a2/a3 also truncated, eval 32s each (apply fails fast, no Docker test run), tokens 586k candidate
- django 11001: baseline FAIL `malformed patch at line 14`, candidate a1 `re.compile(r'(.*)\s(ASC|DESC)(.*)')` truncated, eval 36s each, tokens 563k candidate
- matplotlib 18869: baseline FAIL unresolved (wrong file `__version_info__`), candidate a1 similar hallucinated `__init__.py`, eval 234s each, tokens 591k candidate
- matplotlib 22711: baseline FAIL empty (pi TimeoutExpired 300s), candidate FAIL a3 empty (3× timeout, 918s total, 588k tokens but all timeout transcripts), eval 0s (empty patch, no container)
- matplotlib 22835: both PASS (artist.py BoundaryNorm), eval 325s baseline, 189k vs 189k tokens, candidate not yet retried (PASS so 1 attempt)
- seaborn 2848,3010: both PASS, eval 105s/92s, tokens 202k/189k baseline, 202k/189k candidate

## Token/Latency Samples (from result.json)
- 12907: baseline totalTokens 176786 (input 360 output 313 cacheRead 176113) latency 177.46s (pi 83.5 + verif 93.95); candidate totalTokens 178613 latency similar (1 attempt)
- 14182: baseline 0? actually baseline for 14182 had tokens 199k? (check) candidate 560065 (3×) latency 400s+ (3×)
- 22711: baseline 0 tokens (timeout, empty), latency 309s (300s pi + 9s eval); candidate 588445 tokens (but all timeout? transcripts show TIMEOUT, tokens 0? discrepancy — result.json shows 588445 but transcripts show TIMEOUT; likely sum of 3× empty + 1 success? need re-check, but indicates waste)

## Verification Logs
- Detection correct: every FAIL has `resolved: false` and either `errors:1` (patch apply) or `unresolved:1` or `empty:1` in eval.json — see logs above.
- Feedback tail: `research/experiment/scale/powered_harness.py` feeds `eval_log[-800:]` — for 14182 this is `No instances to run... 0 resolved` without test name; for 10924 it's `patch unexpectedly ends...` without hint.

## Limitations
- Partial n=11/10, not 30 — exploratory, Wilson CI very wide.
- One task (flask 4045) incomplete candidate due to harness kill.
- Cost =0 for free tier, so token proxy is cost.

