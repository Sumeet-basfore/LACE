# Phase 2D Provider Failure — Root Cause, Evidence, Fix, Decision

**Date:** 2026-09-03  
**Status:** Fixed in `research/phase2d/harness.py` (harness-only; no protocol/manifest change)

## Root Cause

The Phase 2D harness called `pi` with `--provider opencode` and `--model muse-spark-1.2-contributor-free`. When the provider returned HTTP **429** with `FreeUsageLimitError` (“Rate limit exceeded”), `pi` emitted JSON stream lines with:

- `stopReason: "error"`
- `errorMessage: "OpenAI API error (429): {\"type\":\"FreeUsageLimitError\",...}"`
- zero token usage

The harness **did not inspect** subprocess stderr or pi JSON error fields. It only looked for assistant text / unified diff. With no valid patch, `check_patch()` returned `EMPTY_OUTPUT` (or `PATCH_INVALID` when prompt text containing `diff --git` was echoed in JSON and mis-parsed as a patch).

Retry loops (current: 3 attempts; layered: 3 attempts with structured feedback) then **retried blindly** on what was actually a provider quota failure, contaminating:

- `failure_class` (reported as `EMPTY_OUTPUT` / `PATCH_INVALID` instead of `PROVIDER_RATE_LIMIT`)
- attempt counts and recovery metrics
- verification runs on empty/invalid patches
- token accounting (zeros were accumulated but masked real issue)

## Evidence

From `research/phase2d/raw/baseline/transcript_sympy__sympy-11400.txt` and layered/current transcripts for all 7 manifest tasks:

```
"stopReason":"error"
"errorMessage":"OpenAI API error (429): {\"type\":\"FreeUsageLimitError\",\"message\":\"Error from provider (Console): Rate limit exceeded. Please try again later.\"}"
```

`research/phase2d/raw/results.json` shows **6/7 layered** and **all baseline/current** tasks with `"failure_class": "EMPTY_OUTPUT"` despite provider errors in transcripts. Layered arm attempted 3 retries per task, feeding `PATCH_INVALID` / `EMPTY_OUTPUT` feedback into subsequent prompts while provider was still rate-limited.

## Fix

`harness.py` changes (harness-only):

1. **`classify_provider_failure(exit_code, stderr, stdout, timed_out)`** — inspects pi exit code, stderr, and JSON `errorMessage` / `stopReason` from stdout.
2. **Failure classes distinguished:**
   - `PROVIDER_RATE_LIMIT` — 429, `FreeUsageLimitError`, rate-limit phrases
   - `AUTH_ERROR` — 401/403, invalid API key
   - `NETWORK_ERROR` — connection/DNS/timeout errors
   - `PROVIDER_ERROR` — other API/provider errors
   - `TIMEOUT` — subprocess timeout
   - `EMPTY_OUTPUT` — no patch, no provider failure
   - `MODEL_OUTPUT_INVALID` — patch present but fails apply/format check (renamed from `PATCH_INVALID`)
3. **On provider failure:** patch cleared, usage zeroed (`ZERO_USAGE`), error text preserved in transcript + result fields (`provider_failure`, `provider_error`).
4. **No blind retry** on `PROVIDER_RATE_LIMIT` (and all provider failure classes) — loop breaks immediately.
5. **Verification skipped** when provider failure detected (baseline/current/layered).
6. **Regression tests** in `research/phase2d/test_harness_classification.py` using real 429 stdout fragment.

## Decision

| Question | Decision |
|----------|----------|
| Rerun contaminated Phase 2D? | **No** — prior raw results are invalid for model comparison; discard or archive separately. |
| Change manifest / protocol / layered strategy? | **No** — harness fix only. |
| Change model/provider? | **No** — same `opencode` + `muse-spark-1.2-contributor-free`. |
| Safe for one-task validation? | **Yes**, after unit tests + smoke tests pass — provider failures will abort cleanly with correct classification. |
| When to rerun full Phase 2D? | After provider quota resets and a single-task smoke validation succeeds end-to-end. |

## Validation Checklist (post-fix)

- [ ] `python -m unittest research.phase2d.test_harness_classification`
- [ ] `python research/phase2d/harness.py smoke-patch`
- [ ] `python research/phase2d/harness.py smoke-pi` (live; may return `PROVIDER_RATE_LIMIT` if quota still exhausted — that is correct behavior)
- [ ] One-task Phase 2D validation (manual, not SWE-bench batch)
