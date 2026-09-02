# Prototype Selection — Phase 2C

**Date:** 2026-09-02 · **Selected strategy:** LAYERED (cheap → targeted → regression → review optional) — HYBRID of B+C+E

## Selected

**LAYERED verification**

```
cheap: git apply --check (0.1s) → if fail, feedback "emit complete hunk" and retry (no Docker)
  ↓ pass
targeted: pytest -k FAIL_TO_PASS (1–2 tests, ~80s) → extract failing test name + assertion + file:line → targeted prompt (test + diff, not full problem_statement) → retry
  ↓ pass
regression: pytest -k PASS_TO_PASS or full suite (~100–150s) → confirm no regression
  ↓ pass → resolved
optional: reviewer (diff-only, ~20k tokens, 30s) if changed file not in FAIL_TO_PASS mapping → flag wrong-file hallucination before retry
```

## Why selected

- Directly fixes A01/A02 waste: cheap gate saves 32s Docker for malformed (2/7), targeted signal makes feedback actionable (14182/18869), regression only for final PASS saves 150s per retry.
- Expected median 1.3× vs current 2.97×, latency 1.4× vs 2.08×, with same or better recovery (because feedback is targeted).
- Subsumes Adaptive and Targeted; Reviewer as cheap add-on for wrong-file.

## Rejected

- **CURRENT:** too expensive, 0/5 recovery, generic feedback — fails T1 guardrail.
- **ADAPTIVE alone:** saves cost but doesn't improve feedback, recovery still 0.
- **REVIEWER alone:** could catch wrong-file but not patch malformed or test failure.
- **RISK-BASED:** high complexity, needs risk model tuning, not measured; Layered is simpler and achieves same.
- **TARGETED alone:** misses cheap gate for malformed/empty.

## Expected benefit

- Recovery: 1–2/5 failed tasks (with targeted test name, model can locate correct file; with cheap gate, truncated patches fixed) vs 0/5 current.
- Cost: median ~1.3× baseline (1× for successes, ~1.5× for failures with 1 targeted retry vs 3 full retries).
- Latency: median ~1.4× (80s targeted vs 234s full).

## Expected overhead

- Implementation: <200 LOC to powered_harness.py (add _check_patch, _targeted_eval, targeted prompt).
- Runtime: 1 extra `git apply --check` per attempt (0.1s), 1 targeted Docker per failure (80s) instead of 3 full (700s) — net saving.

## Experiment design (next, small design experiment, not powered)

- **n=5–10 real Lite tasks** (new sample, not the 11 already run — avoid contamination; use stratified 1 per repo, 5 tasks).
- Compare 3 arms on same tasks, same model, same prompt:
  - Baseline (1 attempt, no verification)
  - Current verification (full suite → generic feedback → full retry, as before)
  - Layered (cheap → targeted → regression)
- Measure: success (resolved), recovery, token cost (totalTokens, cacheRead), latency (pi+verif, per layer), regression, infra.

## Success threshold (for layered to be considered better than current)

- **Recovery > current** (≥1 task where layered recovers and current does not) **AND**
- **Median cost ≤1.5× baseline** (vs current 2.97×) **AND**
- **Median latency ≤1.5× baseline** (vs current 2.08×) **AND**
- **Regression non-inferior** (layered regression ≥ baseline).

This is a *design* threshold, not T1 (T1 is ≥10pp at ≤2× for powered n=30). If layered meets this, it is worth scaling to n=30 powered.

## Kill condition

- If layered shows **0 recovery and still >2× cost** (i.e., no benefit over current), **kill layered** and conclude verification as currently conceived is not product-worthy — keep as trivial plugin only, pivot to evidence/observability or kill.
- If layered recovers but regression worse, kill.

## Not yet building

- Do not implement new candidate until this selection is reviewed. Next step is 5-task design experiment with the three arms.

