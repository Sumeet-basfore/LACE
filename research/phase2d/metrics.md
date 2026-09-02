# Phase 2D Metrics

Same as `research/experiment/metrics.md` M1–M9, with phase2d manifest (33424b751c06e621) and 3 arms.

- M1 Task Success: resolved (FAIL_TO_PASS all PASS AND PASS_TO_PASS still PASS) via swebench Docker, Boolean per task.
- M3 Regression: PASS_TO_PASS still PASS, separate from M1, non-inferior gate.
- M4 Tokens: native pi --mode json usage {input,output,totalTokens,cacheRead,cacheWrite,reasoning,cost} sum per task across attempts.
- M5 Cost: free tier cost.total=0, so evaluate on tokens.
- M6 Latency: wall-clock task_start→final_end, plus pi vs verification split, median/IQR/P90 and ratio.
- M7 Recovery: (not initial_pass and final task_pass) for B/C, 0 for A.
- M8 Human: 0 (automated).
- M9 Reliability: single-run only (no pass@3 for n=7).

Aggregation: Wilson 95% CI for proportions (n=7, very wide), median/IQR, median ratio vs baseline.

