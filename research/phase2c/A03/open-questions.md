# A03 Open Questions

- What is the exact latency of `pytest -k FAIL_TO_PASS` vs full suite for each Lite task (measure)?
- Can we reliably extract failing test name + assertion from swebench eval log (or from pytest -v output) for feedback?
- Should we keep full problem_statement in retry prompt or replace with targeted "failing test + diff + file context"?
- How to decide when to escalate from targeted to regression (e.g., after targeted PASS, run PASS_TO_PASS)?
- For Reviewer, what prompt makes it catch wrong-file edits without hallucinating?
- How to handle timeout tasks — truncate prompt or switch to risk-based skip?

