# Phase 2D Protocol — Layered Recovery Design Experiment

**Date:** 2026-09-02 · **n:** 7 new Lite tasks (manifest 33424b751c06e621, excludes 2B/2C 11 tasks) · **Model:** muse-spark-1.2-contributor-free all arms · **Dataset:** lite (SWE-bench/SWE-bench_Lite)

## Arms

- **A Baseline:** 1 pi call (full problem_statement) → 1 swebench eval (full suite) → no retry.
- **B Current:** 1 pi call → full suite eval → generic 800-char tail → full-context retry (same prompt + feedback) → bounded 2 retries (3 attempts) → each attempt full suite.
- **C Layered:** cheap `git apply --check` (0.1s, no Docker) → if PATCH_INVALID/EMPTY, structured feedback "emit complete hunk" and retry (no Docker); else targeted FAIL_TO_PASS only (docker run with `pytest -k` for FAIL_TO_PASS, ~80s) → extract test name + assertion + file:line + 20-line traceback → targeted prompt (failing test + diff + file context, not full problem_statement) → retry; if FAIL_TO_PASS PASS then regression PASS_TO_PASS only; optional reviewer (diff-only, ~20k tokens) if changed file not in FAIL_TO_PASS mapping.

Same task manifest, same model, same base_commit, same env, same isolation (docker per attempt), resume-safe.

## Failure Taxonomy

PATCH_INVALID, TEST_FAILURE, REGRESSION, TIMEOUT, EMPTY_OUTPUT, WRONG_FILE, INFRA_FAILURE, OTHER. Do not retry INFRA as model failure.

## Metrics

Primary: initial success, recovered failures, final success, recovery rate. Efficiency: totalTokens, cacheRead, latency, verification latency, retries. Reliability: PASS_TO_PASS regression, infra rate. Verification: apply-check runtime, targeted vs full runtime, feedback extraction success.

## Success Gate (design, not powered)

Proceed only if recovery_layered > recovery_current AND median_total_tokens ≤1.5× baseline AND median_latency ≤1.5× baseline AND regression non-inferior.

Do not claim significance from n=7; this is design experiment.

