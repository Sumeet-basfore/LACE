# A03 Evidence

## Current (A)
- Result: 2.97× tokens, 2.08× latency, 0/5 recovery (A01/A02)
- Logs: `research/experiment/scale/runs/powered-30/*/logs/*.log` show Docker 32–325s per attempt, 3 attempts for 4/7 tasks

## Targeted (B)
- Dataset: lite FAIL_TO_PASS sizes 1–7 vs PASS_TO_PASS 13–179 (e.g., 12907 has 2 FAIL vs 13 PASS per A02). Running `pytest -k "test_separable[compound_model6 or compound_model9]"` would be targeted.
- Prior R004: ripgrep/BM25 + Tree-sitter for file mapping — can map test name to source file.
- Synthetic pilot's `parse_failures` succeeded because it had exact test name `test_T03` — real lacks this.

## Adaptive (C)
- `git apply --check` would have caught 10924/11001 in 0.1s vs 32–36s Docker (see logs: `Hunk FAILED`, `malformed patch`)
- Empty patch 22711: `empty patch` in eval.json — cheap check `if not patch.strip()` before Docker

## Layered (D)
- Composition of B+C — no extra evidence needed, inherits both.

## Reviewer (E)
- No direct evidence in powered run, but prior F02 synthetic showed reviewer-like feedback (spec→tests) helped. Need to test diff-only reviewer prompt.

## Risk-based (F)
- Risk signals observed: wrong file (18869), truncated diff (10924), timeout (22711), large problem_statement (22711 widget repro 8k chars). These are measurable.
- Prior R002/R005: test impact and dependency changes as risk — not yet measured for Lite.

## Gaps
- No measurement of targeted Docker time vs full (need to run `pytest -k` subset and time it).
- No reviewer prototype measured.
