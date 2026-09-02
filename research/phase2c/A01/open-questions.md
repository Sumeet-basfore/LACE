# A01 Open Questions

- Would running only FAIL_TO_PASS (1–2 tests) for initial verification give same detection at 1/5 cost?
- Can we make feedback actionable: include failing test name, assertion, and relevant file/line from eval log (not just tail 800 chars of high-level report)?
- Can we detect malformed/truncated patches with `git apply --check` before Docker and feed back "complete hunk" hint without Docker cost?
- For timeout tasks, should we truncate problem_statement or switch to risk-based skip (large repro code → timeout likely)?
- Do we need to distinguish patch-apply failure vs test failure in feedback (different repair strategies)?
- Would a second reasoning pass (reviewer) on the diff itself catch wrong-file hallucinations cheaper than re-running full suite?
- How to avoid retrying same oversized prompt after timeout — backoff or prompt compression?
