# A03 — Verification Strategy Research

**Date:** 2026-09-02 · **Scope:** Compare 6 verification designs against autopsy findings (A01/A02) · **Model:** muse-spark-1.2-contributor-free · **Evidence:** A01 failure taxonomy, A02 cost breakdown, plus external: SWE-bench harness (FAIL_TO_PASS vs PASS_TO_PASS), git apply, ripgrep/BM25, MCP spec, prior R004/R002

## Current Design (A) — Full retry

`agent → full test suite (Docker 32–325s) → generic feedback (800-char tail) → full retry (new pi call, 3×)`

- **Evidence:** A01 shows detection 100% but feedback not actionable; A02 shows 2.97× tokens (3× cacheRead) and 2.08× latency due to 57% retry rate. Timeout tasks waste 1200s.
- **Trade-offs:** Simple to implement, leverages existing swebench Docker, but expensive and unfocused. Reproduces synthetic pilot's heavy-tail risk (per-retry 2.05×) at scale.
- **Cost:** ~190k baseline, ~560k candidate median; latency 236s→492s.
- **Complexity:** Low (already built).
- **Failure modes:** Truncated patches retried with same truncation, hallucinated files retried hallucinated, timeout retries same oversized prompt.

## Strategy B — Targeted (focused tests + exact signal)

`agent → FAIL_TO_PASS only (1–2 tests, ~80s) → extract exact failing test name + assertion + file:line → targeted repair prompt (not full problem_statement) → verify`

- **Evidence:** For 12907, FAIL_TO_PASS is 2 tests vs 13 PASS_TO_PASS; for 14182, 1 vs 13. Running only FAIL_TO_PASS would cut Docker ~60% (80s vs 234s). Feedback with test name would let model edit correct file (14182 edited wrong RST header; with test name `test_rst` it could locate).
- **Trade-offs:** Needs mapping from FAIL_TO_PASS to file (via test file path), and prompt that includes failing test code, not full suite log.
- **Cost:** ~1 extra pi call with small targeted prompt (maybe 50k tokens vs 176k) + 1× targeted Docker (80s) instead of 3× full (700s). Expected median ~1.3× baseline, not 2.97×.
- **Complexity:** Medium — need to parse FAIL_TO_PASS from dataset, run `pytest -k` subset, and craft targeted prompt.
- **Failure modes:** If FAIL_TO_PASS is flaky or requires PASS_TO_PASS to detect regression, need escalation.

## Strategy C — Adaptive (cheap risk checks, verify only when risk high)

`agent → cheap checks (git apply --check 0.1s, lint, import) → risk score (diff size, files changed, test impact) → verify only if risk > threshold, else skip`

- **Evidence:** 10924/11001 fail on `git apply` in 32s via Docker, but `git apply --check` locally would fail in 0.1s without Docker. 22711 empty patch could be skipped. Risk signals: diff size (10924 diff <100 chars but malformed), files changed (18869 changed wrong file), timeout prompt size.
- **Trade-offs:** Requires risk heuristic (maybe simple: patch empty/malformed → immediate retry without Docker; single-file <20 lines → low risk, skip full suite). False negatives (skip verification when needed) risk regression.
- **Cost:** For low-risk successes (12907,10914), skip full Docker → save 90s each, but risk missing regression (though Lite regression is small). For high-risk (malformed), save 2× Docker.
- **Complexity:** Low for cheap check, Medium for risk heuristic.
- **Failure modes:** Over-skipping misses regressions; threshold tuning needed.

## Strategy D — Layered verification (cheap → targeted → regression → deep)

`cheap (apply --check, lint) → targeted FAIL_TO_PASS → regression PASS_TO_PASS → deeper (full suite, type check) only when needed`

- **Evidence:** This layers A+B+C: first cheap rejects malformed (10924/11001) in 0.1s, second targeted checks correctness (14182/18869) in 80s, third regression confirms no break (22835's 325s full suite only for final PASS). Current runs all layers every attempt.
- **Trade-offs:** Most cost-effective if most tasks fail at cheap layer (2/7 in our sample are malformed). Adds branching logic.
- **Cost:** Expected median ~1.2–1.4× baseline (only final successes need regression). Latency median ~1.3× vs 2.08×.
- **Complexity:** Medium-High (need to orchestrate layers, decide when to escalate).
- **Failure modes:** Needs correct layer ordering and escalation criteria.

## Strategy E — Independent reviewer (deterministic checks + second reasoning pass only for suspicious changes)

`agent → deterministic checks (diff lint, file existence, test name mapping) → reviewer model (same muse-spark, but only on diff, not full problem) checks "does diff address failing test?" → retry only if reviewer flags`

- **Evidence:** For 18869, reviewer could flag "you edited __init__.py but FAIL_TO_PASS is test_separable (separable.py)" without running Docker. For 14182, reviewer could flag "you removed start_line but test is about RST data rows".
- **Trade-offs:** Adds 1 extra model call (reviewer) but it's on small diff (300 chars) not full problem_statement, so cacheRead small (~10k vs 176k). Could replace 2 of 3 retries.
- **Cost:** Reviewer call ~20k tokens, vs full retry 176k → save ~150k per avoided retry. Latency ~30s vs 300s.
- **Complexity:** Medium — need reviewer prompt that checks diff vs failing test.
- **Failure modes:** Reviewer may hallucinate or be too lenient.

## Strategy F — Risk-based verification (allocate effort by change risk)

Risk signals from A01: files changed (wrong file = high risk), diff size (tiny malformed = high risk), test impact (touches PASS_TO_PASS files), public API/security/db changes, uncertainty (model timeout).

- **Evidence:** 18869 changed wrong file → high risk, should trigger targeted check quickly. 12907 changed correct file (separable.py) with small diff (1 line) → low risk, could verify with cheap check only. 22711 timeout → high uncertainty, should not retry same prompt.
- **Trade-offs:** Needs risk scoring (maybe LLM self-reported uncertainty or diff analysis). Most sophisticated, but also most to tune.
- **Cost:** Variable — low-risk saves, high-risk spends. Expected median similar to D but with better allocation.
- **Complexity:** High — need to define risk features and thresholds.
- **Failure modes:** Risk model itself may be wrong.

## Comparison Summary

| Strategy | Expected cost vs baseline | Expected latency | Recovery potential | Implementation | Evidence strength |
|---|---|---|---|---|---|
| A Current | 2.97× (observed) | 2.08× | 0/5 (observed) | Low | High (measured) |
| B Targeted | ~1.3× | ~1.3× | maybe 1–2/5 (with actionable feedback) | Medium | Medium (inferred from FAIL_TO_PASS size) |
| C Adaptive | ~1.2× | ~1.2× | 0 (skips) but saves on empty | Low | Medium |
| D Layered | ~1.3× | ~1.4× | 1–2/5 (cheap+targeted) | Medium-High | Medium-High (combines B+C) |
| E Reviewer | ~1.4× | ~1.5× | maybe 1/5 (reviewer catches wrong file) | Medium | Low-Medium (not measured) |
| F Risk-based | ~1.3× | ~1.4× | 1–2/5 (if risk signal good) | High | Low (needs tuning) |

## Determination

- **Evidence:** Strong that cheap `git apply --check` and FAIL_TO_PASS-only runs would have saved cost on 3/7 tasks (10924,11001,22711) and that actionable feedback (test name + file) is missing.
- **Trade-offs:** D (Layered) dominates — it includes B's targeted signal and C's cheap gate, with E's reviewer as optional final layer. F is more complex without clear gain over D.
- **Likely cost:** D ~1.3× vs current 2.97× — saves ~60% tokens/latency while providing more actionable feedback.
- **Complexity:** D is the sweet spot: `git apply --check` (trivial) + `pytest -k FAIL_TO_PASS` (already have dataset) + full suite only for final PASS.

