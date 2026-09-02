# A02 Open Questions

- How much would prompt compression (truncate problem_statement to 2k chars, not 8k) reduce cacheRead?
- Would retaining pi session (not `pi -p` per attempt) reduce cache duplication vs fresh call?
- What is the exact Docker time for FAIL_TO_PASS-only vs full suite for each task (measure via targeted eval)?
- Can we short-circuit retries after first `git apply --check` failure without Docker?
- For free tier, cost is 0 — does token ratio still matter for user-perceived cost when paid tier has $/1k? Need price card for paid tier.
- How to measure reasoning vs waiting time separately (pi's tool use vs model think)?
