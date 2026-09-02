# Phase 2C Synthesis — Failure & Verification Redesign

**Date:** 2026-09-02 · **Scope:** A01–A04 (powered-30 partial n=11/10 exploratory) · **Model:** muse-spark-1.2-contributor-free · **Dataset:** lite · **Prior:** 02-validation-synthesis (PIVOT, T1 ≥10pp at ≤2× cost/latency, regression ≥)

## 1. Why was the current candidate expensive?

- **Retry count, not verification itself:** 57% of tasks retried 3× (4/7) vs synthetic 20% (1/5) → median tokens 2.97× (189k→563k) vs pilot 1.27×. Each pi call repeats 176k cacheRead (99% of tokens) via `pi -p` fresh cache, so 3 calls = 3× tokens even though feedback is 800 chars. Docker per attempt 32–325s, 3× for failures → latency 2.08× (236s→492s). Successes (12907,10914,22835) are 1.01× — overhead only matters when retry triggers.
- **No cheap gate:** malformed/empty patches (10924,11001,22711) went to Docker (32s) instead of `git apply --check` (0.1s). Full suite (PASS_TO_PASS 13–179 tests) ran every attempt though FAIL_TO_PASS is 1–2 tests.

## 2. Why did it fail to recover tasks?

- **Feedback not actionable:** verification *detected* 100% correctly (swebench flagged all 5 failures as unresolved/patch-apply/empty), but feedback was generic `0 resolved` or `Hunk FAILED` without failing test name, assertion, or file:line. Model retried with different but equally wrong patches (14182: 3 different RST cosmetics, all wrong location; 18869: hallucinated __init__.py 3×).
- **Timeout tasks retried same oversized prompt:** 22711 pi timed out 300s ×4 (1 baseline +3 candidate) with empty patches — retry loop didn't truncate problem_statement or back off.
- **Truncated diffs:** 10924/11001 patches cut mid-hunk — model wasn't told to emit complete hunk, so retries also truncated.

## 3. Which mechanisms actually helped?

- **Deterministic detection:** swebench Docker correctly flags patch-apply, empty, unresolved — 100% accuracy, no false positives. This is valuable as ground truth (not LLM judgment).
- **Success confirmation:** for 5/10 successes, verification confirmed PASS without extra cost (1 attempt) — cheap when no retry.
- **Isolation:** docker per task×arm via lite images, no cross-contamination.

## 4. Which mechanisms were wasteful?

- **Full suite on every attempt:** 234–325s for hallucinated tasks vs 80s targeted FAIL_TO_PASS.
- **Full retry with full problem_statement:** 176k cacheRead repeated 3×, feedback 800 chars not targeted.
- **Generic feedback:** 800-char tail of high-level report, not failing test excerpt.
- **Retry on empty/timeout without prompt fix:** 1200s waste for 22711.

## 5. What verification strategy should replace the current one?

**Choose: LAYERED (D) with TARGETED (B) core, plus REVIEWER (E) optional — effectively HYBRID but named LAYERED.**

- **Why:** Layered subsumes Adaptive (cheap gate) and Targeted (focused signal) and adds regression as final layer. It directly addresses waste: `git apply --check` (0.1s) rejects malformed/empty before Docker; `pytest -k FAIL_TO_PASS` (80s) gives actionable test name; `PASS_TO_PASS` only for final PASS; reviewer (diff-only, ~20k tokens) catches wrong-file hallucinations cheaper than full retry (176k). Expected median 1.3× vs 2.97×, with same or better recovery (because feedback is targeted).
- **Rejected:** CURRENT (too expensive, 0 recovery), ADAPTIVE alone (skips but doesn't improve feedback), REVIEWER alone (not enough), RISK-BASED (high complexity, needs tuning, not measured), TARGETED alone (misses cheap gate).

## 6. What is the smallest viable prototype?

- **Scope:** `git apply --check` → if fail, feed back "complete hunk" and retry without Docker; else `pytest -k FAIL_TO_PASS` (from dataset FAIL_TO_PASS) → extract failing test name + 20-line traceback → targeted prompt (failing test + diff + file context, not full problem_statement) → retry; if PASS then `pytest -k PASS_TO_PASS` (or full) for regression; optional reviewer on diff if file changed not in FAIL_TO_PASS mapping.
- **Implementation:** <200 LOC change to `powered_harness.py`: add `_check_patch()` (git apply), `_targeted_eval()` (swebench with `-k`), and targeted prompt builder. No new deps.
- **Artifacts:** same `runs/powered-30/` structure, but logs record layer.

## 7. What should we measure?

- **Primary:** success (resolved), recovery (failed→PASS after retry), regression (PASS_TO_PASS still PASS)
- **Cost:** totalTokens (native), median ratio candidate/baseline, plus cacheRead vs reasoning split
- **Latency:** pi + verification, P50/P90, cheap vs targeted vs full breakdown
- **Overhead:** number of model calls, Docker seconds per layer
- **Threshold:** Same T1 (≥10pp at ≤2× median cost/latency, regression ≥) but expect layered to meet cost/latency where current breached.

## 8. What should we explicitly avoid?

- Full suite on every retry; generic 800-char tail without test name; retrying same oversized prompt after timeout; truncating diff without `git apply --check`; claiming verification works/fails from n=7 exploratory; building multi-agent, standalone binary, vector DB, or pure-local as wedge.

## 9. Does this revised strategy still look product-worthy?

**UNPROVEN (leaning PROMISING if layered works).**

- **Current "run tests + retry" is WEAK** — trivial plugin (<2 days, F04), no recovery, 2.97× cost. Not product-worthy.
- **Layered + evidence/observability (Pareto ledger) is PROMISING as thin extension** — if it achieves recovery at ≤1.5× with actionable feedback and Pareto transparency that incumbents don't provide. This is still PIVOT (MCP + Claude plugin + Herdr variant), not standalone. Evidence is UNPROVEN until small 5–10 task design experiment measures recovery + cost.

