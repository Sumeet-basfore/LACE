# A01 Findings

## 1. Verification detects, but does not rescue
- Detection 10/10 correct (100%) — swebench Docker correctly flags patch-apply, empty, unresolved. No verification false negatives; gate works.
- Recovery 0/5 (0%) — every task that failed baseline also failed candidate after 3 attempts. Retry loop added cost without benefit at n=10.

## 2. Feedback is the bottleneck, not detection
- For the 5 failures, feedback was generic (`0 resolved` or `Hunk FAILED`) and lacked FAIL_TO_PASS names, assertions, or tracebacks. Model retried with different but equally wrong patches (e.g., 14182 produced 3 different RST cosmetic changes, all wrong).
- Synthetic pilot's `parse_failures` tail worked because hidden tests printed `PASS test_T03`; real swebench logs are less actionable.

## 3. Two distinct failure modes, both unaided by full-retry
- **Truncated / malformed patches** (10924, 11001): model outputs diff that is cut mid-hunk (context window or formatting). `git apply --check` would catch in <0.1s, but current sends to Docker (32–36s) and feeds back only "patch ends in middle of line" — model doesn't learn to emit complete hunk.
- **Wrong-location / hallucinated** (14182, 18869): model edits wrong file. Full test suite still runs (234s) though FAIL_TO_PASS is 1–2 tests; targeted signal (failing test name + file) would be cheaper and more directive.

## 4. Timeout tasks are pure waste
- 22711 pi timed out 300s three times (900s pi + 300s eval = 1200s for candidate) with empty patches — retry loop should have backed off after first timeout (prompt too large) instead of retrying same oversized prompt.

## 5. Successes are small, single-file fixes
- 5 successes (12907,10914,22835,2848,3010) are all <15-line single-file changes with clear FAIL_TO_PASS (1–2 tests). Where model already succeeds, verification adds no value (just confirms).

## 6. No evidence that full test suite + full retry is the right granularity
- Current = agent → full suite (FAIL_TO_PASS+PASS_TO_PASS, 13–325s) → generic feedback → full retry (new pi call with full context). This is expensive and unfocused.

