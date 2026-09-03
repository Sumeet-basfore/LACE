<!-- GENERATED ARTIFACT — COPIED FROM CANONICAL SOURCE -->
<!-- Canonical Source: docs/core/recovery-policy.md -->
<!-- Category: core-model -->
<!-- Synchronization: scripts/export_research.py -->

# LACE Core Recovery Policy (Conceptual)

**Status:** HYPOTHESIS — conceptual model only, not validated at scale · **Scope:** Not production architecture, not implementation spec, not harness code
**Date:** 2026-09-03 · **Track:** C — Core Model + Measurement Contract
**Predecessor:** `docs/core/concepts.md`, `docs/core/lifecycle.md`, `docs/core/event-model.md` · **Terminology:** `context/terminology.md` · **Decisions:** D-005 through D-010
**Constraint:** Do NOT run benchmarks. Do NOT modify the harness. Do NOT invent measured performance. Every assumption below is labeled **HYPOTHESIS**.

---

## 1. Purpose

Define a *conceptual* recovery-policy matrix: for each current failure class, what evidence is available, how confident the classification is, what the cheapest safe recovery action is, what verification must re-pass, whether retry is allowed, the per-class retry cap, and when to escalate.

This matrix does **not** claim that any recovery action works. Recovery quality is `HYPOTHESIS` until a clean Phase 2D run (D-010) measures `recovery_layered > recovery_current` at `≤1.5×` cost/latency with regression non-inferior (n=7).

---

## 2. Global Invariants (DECISION — from prior docs)

1. **Bounded recovery.** At most **2 retries → 3 attempts total per task** across model/verification classes combined (`docs/06-recovery-model.md` §D, Phase 2D protocol). The per-class caps below are *within* that global budget, not additive.
2. **Separation rule (DECISION D-008).** `PROVIDER_* / AUTH / NETWORK / INFRA / TIMEOUT` ≠ `EMPTY_OUTPUT / PATCH_INVALID / WRONG_FILE` ≠ `TEST_FAILURE / REGRESSION / OTHER`. Never conflate in metrics, never count a provider/infra stop as a model failure, never blind-retry a 429.
3. **Zero-cost stops.** Provider/infra stops bill **zero tokens** for the failed attempt and do not consume the 2-retry budget. They abort the task.
4. **Cheapest verification first (HYPOTHESIS).** Layer 1 (`git apply --check`, ~0.1s, no Docker) → Layer 2 (targeted `pytest -k <FAIL_TO_PASS>`, ~80s) → Layer 3 (regression `PASS_TO_PASS` / full suite). Never pay Layer 3 when Layer 1/2 already fails.
5. **Isolation.** Every attempt runs in its `git worktree` / Docker snapshot. Never mutate the baseline worktree on failure. Regression proof is required before any claim of success (T1 guardrail: regression ≤ baseline).
6. **Single primary label.** One class per attempt for accounting, even with multiple symptoms (e.g., empty patch *after* 429 = `PROVIDER_RATE_LIMIT`, not `EMPTY_OUTPUT`) — `context/terminology.md`.

> **HYPOTHESIS:** The cheapest safe action per class is cheaper than "full suite → generic 800-char tail → full-context retry" which Phase 2C showed recovers 0/5 at ~2.97× median tokens (D-005). That cost claim is **EVIDENCE** for current approach; that layered is cheaper is **HYPOTHESIS**.

---

## 3. How to Read the Matrix

- **Evidence available — FACT:** what the verification system actually observed (not agent self-report). Bounded excerpts only (e.g., 20-line traceback, 800-char tail) to fit ledger.
- **Confidence — EVIDENCE/HYPOTHESIS:** how reliably the harness can assign this class. `HIGH` = deterministic check (exit code, HTTP status, `git apply`); `MEDIUM` = strong signal with ambiguity; `LOW` = heuristic/unclassified.
- **Cheapest safe recovery — HYPOTHESIS:** the smallest reasonable next step for that class. "Cheapest" means least Docker + least context.
- **Required verification — DECISION/HYPOTHESIS:** the layer that must pass after the action before claiming success.
- **Retry allowed / Max — DECISION/HYPOTHESIS:** whether the harness may auto-retry and the per-class cap *within* the global 2-retry budget.
- **Escalation — DECISION:** when to stop retrying and surface/abort.

No row invents a measured recovery rate. Where prior measurement exists it is cited as **EVIDENCE**; otherwise the action's effectiveness is **HYPOTHESIS**.

---

## 4. Matrix (concise)

| Class | Confidence | Retry? | Max retries (within global 2) | Cheapest safe action (HYPOTHESIS) | Required verification |
|---|---|---|---|---|---|
| `PATCH_INVALID` | HIGH | yes | 1 | Format correction prompt with `apply --check` stderr | Layer 1 |
| `EMPTY_OUTPUT` | MEDIUM-HIGH | yes | 1 | Re-prompt with explicit diff-format constraint | Layer 1 |
| `WRONG_FILE` | LOW-MEDIUM | yes | 1 | File-scoped correction (+ optional diff-only reviewer) | Layer 2 |
| `TEST_FAILURE` | HIGH | yes | 2 | Targeted evidence retry (test name + assertion + traceback) | Layer 2 → Layer 3 |
| `REGRESSION` | HIGH | yes | 1 | Regression evidence + corrective fix, keep worktree isolated | Layer 3 |
| `TIMEOUT` | MEDIUM | yes (reshaped) | 1 | Reduce/reshape context, shorten timeout, do not replay full | Layer 1 → Layer 2 |
| `OTHER` | LOW | yes | 1 | Bounded generic tail + cautious re-prompt | Layer 1 → Layer 2 |
| `PROVIDER_RATE_LIMIT` | HIGH | **no** | 0 | **Stop** — backoff outside task, surface quota | None |
| `PROVIDER_ERROR` | HIGH | **no** | 0 | **Stop** — surface upstream error | None |
| `AUTH_ERROR` | HIGH | **no** | 0 | **Stop** — surface credential error | None |
| `NETWORK_ERROR` | MEDIUM-HIGH | **no** (harness) | 0 | **Stop** — surface transport error; outer scheduler may requeue | None |
| `INFRA_FAILURE` | HIGH | **no** (model) | 0 model / 1 infra repair | Repair infra (Docker/image/worktree), not model | Layer 1 after repair |

---

## 5. Per-Class Detail

### `PATCH_INVALID` — Model output: malformed or unapplicable patch

- **Evidence available (FACT):** patch length, `diff --git` + `@@` presence, `git apply --check` / `patch --dry-run` stderr (bounded), harness label `MODEL_OUTPUT_INVALID` if applicable.
- **Confidence:** **HIGH** — deterministic syntactic check, no Docker needed.
- **Cheapest safe recovery (HYPOTHESIS):** Structured apply-check feedback: emit `stderr` excerpt + hint "emit complete hunk: `diff --git a/... b/...` + `@@ -l,s +l,s @@`" . Retry prompt contains only that excerpt + file stub, not full problem statement, not full traceback.
- **Required verification:** **Layer 1** `apply --check` must pass before any Docker work. No Layer 2/3 spend until it does.
- **Retry allowed:** yes — **max 1** (HYPOTHESIS: format errors usually correct in one attempt; second failure suggests deeper model issue, better spent on `TEST_FAILURE` budget).
- **Escalation:** if second `apply --check` still fails → escalate to `OTHER`, log bounded stderr, abort task as model failure. Do not loop on format.

### `EMPTY_OUTPUT` — Model output: no patch, no provider failure detected

- **Evidence available (FACT):** zero-length or whitespace-only output, pi JSON stream terminated without `diff`/`patch` block, `tokens=0` for patch segment, absence of `PROVIDER_*` signal (verified after D-008 classification fix).
- **Confidence:** **MEDIUM-HIGH** — after D-008 fix, 429 no longer misclassifies as empty. Residual ambiguity: model intentionally emitting no change vs failure to produce patch.
- **Cheapest safe recovery (HYPOTHESIS):** Re-prompt with explicit format constraint and one minimal example: "If a change is needed, emit a unified diff with `diff --git` and `@@`; if truly no change, emit `NO_PATCH` literal." No Docker until patch exists.
- **Required verification:** **Layer 1** non-empty + apply-check.
- **Retry allowed:** yes — **max 1** (HYPOTHESIS: second empty suggests model incapability on this task; further retries waste budget shown to approach ~2.97× in Phase 2C).
- **Escalation:** second empty → abort as `EMPTY_OUTPUT` failure, zero Docker cost, log as model failure. Do not promote to `TEST_FAILURE`.

### `WRONG_FILE` — Model output: patch targets file(s) not implicated by failing tests

- **Evidence available (FACT/HYPOTHESIS):** `changed_files` set from patch vs `FAIL_TO_PASS` file mapping (when available), traceback `file:line` vs edits overlap metric, optional diff-only reviewer verdict ("edit outside implicated files").
- **Confidence:** **LOW-MEDIUM** — heuristic; file mapping may be incomplete on real repos (Lite filters hide multi-file cases per R005).
- **Cheapest safe recovery (HYPOTHESIS):** File-scoped correction prompt: "You edited `X` but failing test `Y` points to `Z:line`; restrict edits to `Z` (or explain why `X`)" — optionally invoke diff-only reviewer (~20k tokens, no test run) before any Layer 2. Cheaper than another full-context retry.
- **Required verification:** **Layer 2** targeted test for the implicated file after scope correction. Skip Layer 3 until Layer 2 passes.
- **Retry allowed:** yes — **max 1** (HYPOTHESIS: reviewer cost is non-trivial; cap prevents blow-up; Phase 2C median already at guardrail).
- **Escalation:** still wrong file after correction → abort, mark `WRONG_FILE`, surface file hint to human. Do not burn second retry with same scope.

### `TEST_FAILURE` — Verification: `FAIL_TO_PASS` still failing after apply

- **Evidence available (FACT):** failing test name via `pytest -k`, assertion message + `file:line`, 20-line traceback excerpt, `stdout` tail (bounded ≤800 chars in current, ≤ target excerpt in layered), layer reached = 2, token/latency for attempt.
- **Confidence:** **HIGH** — deterministic test output. Phase 2C pilot showed this evidence *exists* but generic 800-char tail did not enable recovery (0/5).
- **Cheapest safe recovery (HYPOTHESIS):** Targeted retry with *minimal corrective context*: test name + assertion + file:line + 20-line traceback + changed hunk + file stub — **not** full `problem_statement`. This is the layered Layer 2 feedback that Phase 2D tests vs generic tail.
- **Required verification:** **Layer 2** must pass; then **Layer 3** regression before success claim. Never claim success on Layer 2 alone.
- **Retry allowed:** yes — **max 2** (global budget). This class is allowed the full budget because it is the primary recoverable verification failure in the thesis.
- **Escalation:** same test + same traceback after 2nd retry → abort, log `TEST_FAILURE` with recovery=false. If different test fails on retry, that is a new `TEST_FAILURE` but still counts against the same global 2-retry cap — do not reset budget. Escalate to human after cap.

### `REGRESSION` — Verification: `PASS_TO_PASS` broken

- **Evidence available (FACT):** list of `PASS_TO_PASS` names now failing, their assertion/traceback, diff between baseline `PASS_TO_PASS` run and post-patch run, which layer introduced it (typically Layer 3).
- **Confidence:** **HIGH** — deterministic regression set comparison (F02 pilot kept this at 0 regression via isolation — EVIDENCE that isolation helps, not that fix is guaranteed).
- **Cheapest safe recovery (HYPOTHESIS):** Regression-specific corrective prompt: regression test names + `stdout` diff vs baseline + instruction "restore PASS_TO_PASS without losing FAIL_TO_PASS fix; prefer revert of offending hunk." Keep worktree isolated; do not merge.
- **Required verification:** **Layer 3** full/PASS_TO_PASS regression must pass alongside Layer 2. Regression non-inferior is a **guardrail** (T1: regression ≤ baseline). Success is not claimed until both pass.
- **Retry allowed:** yes — **max 1** (HYPOTHESIS: regression fixes often re-break the task test; tight cap limits oscillation. Generous retries here historically cause 3–10× cost per R003).
- **Escalation:** regression persists after corrective attempt → abort as `REGRESSION`, do not merge, keep worktree for inspection. Surface as failure, not success. Do not retry again as `TEST_FAILURE` without addressing regression.

### `TIMEOUT` — Execution: time budget exceeded

- **Evidence available (FACT):** timeout signal, wall-clock duration, layer reached (often Layer 2/3), token usage truncated, subprocess exit 124/timeout string.
- **Confidence:** **MEDIUM** — ambiguous between infra slowness, model hang (degenerate loop per F01 7%), and legit long test suite. Do not attribute to model by default.
- **Cheapest safe recovery (HYPOTHESIS):** Reduce/reshape context — shrink file context window, truncate `problem_statement`, lower `max_tokens`, split multi-file scope to single file — then retry with **shorter** timeout. Never blind-replay identical full context + same timeout.
- **Required verification:** **Layer 1** first, then **Layer 2** with shortened timeout. Skip Layer 3 until Layer 2 passes quickly.
- **Retry allowed:** yes (reshaped) — **max 1** (HYPOTHESIS: blind replay likely repeats hang; "costs twice as much" loops per R002 E12 weak signal support cap).
- **Escalation:** second timeout → abort as `TIMEOUT`, surface duration + layer reached, tag as possible infra. Do not count as `TEST_FAILURE`. Needs human timeout/policy adjustment, not another identical retry.

### `PROVIDER_RATE_LIMIT` — Provider: 429 / quota / `FreeUsageLimitError`

- **Evidence available (FACT):** HTTP 429, `FreeUsageLimitError` string in pi JSON stream, quota header, provider `error.code=rate_limit`. Phase 2D contamination analysis proved this was previously misclassified as `EMPTY_OUTPUT` (D-007).
- **Confidence:** **HIGH** — string match on provider stream.
- **Cheapest safe recovery (DECISION D-008):** **No recovery inside task.** Stop immediately, zero token billing for the attempt, do not consume retry budget, do not re-prompt, do not run verification layers.
- **Required verification:** **None** — task is not VERIFIED failed, it is UNTRIED due to provider. Do not log as model failure.
- **Retry allowed:** **no** — **max 0** inside harness (never blind-retry rate limits).
- **Escalation:** Surface to operator with `retry_after` hint if present; outer scheduler may requeue the *whole task* after quota window as a **new run**, not as an in-task retry. Discard contaminated raw from metrics (D-007).

### `PROVIDER_ERROR` — Provider: other API errors (5xx, upstream)

- **Evidence available (FACT):** 5xx status, upstream error JSON, pi stream `error.type=provider_error`.
- **Confidence:** **HIGH**.
- **Cheapest safe recovery (DECISION):** **Stop** — same as rate limit but semantic difference is transient upstream vs quota. Do not count as model failure.
- **Required verification:** **None.**
- **Retry allowed:** **no** inside harness — **max 0**. HYPOTHESIS: platform-level exponential backoff belongs outside the task's 2-retry budget if ever enabled; not in harness.
- **Escalation:** Surface, tag for outer requeue as new run with backoff. Keep worktree untouched.

### `AUTH_ERROR` — Provider: 401/403, invalid/expired credentials

- **Evidence available (FACT):** 401/403 status, `invalid_api_key` / `auth_error` string.
- **Confidence:** **HIGH.**
- **Cheapest safe recovery:** **Stop** — no prompt can fix credentials.
- **Required verification:** **None.**
- **Retry allowed:** **no** — **max 0.**
- **Escalation:** Surface credential error to operator, abort task, block further tasks until key rotated. Do not bill tokens.

### `NETWORK_ERROR` — Provider: DNS, ECONNRESET, transport

- **Evidence available (FACT):** DNS failure, `ECONNRESET`, `ETIMEDOUT` at transport, fetch failure before model response.
- **Confidence:** **MEDIUM-HIGH** — usually transient, but indistinguishable from provider edge without deeper probe.
- **Cheapest safe recovery (HYPOTHESIS):** **Stop inside harness** — same stop semantics as provider errors to preserve separation. Cheapest *platform* action would be one outer requeue with backoff, but that is not a harness retry.
- **Required verification:** **None** inside task.
- **Retry allowed:** **no** inside harness — **max 0** against the 2-retry budget.
- **Escalation:** Surface as `NETWORK_ERROR`, allow outer scheduler (outside experiment accounting) to requeue once with backoff if policy permits. Do not count against model recovery rate.

### `INFRA_FAILURE` — Infrastructure: Docker, image, harness, worktree

- **Evidence available (FACT):** Docker daemon error, image pull failed, `worktree add` failed, harness exception traceback, container exit 125/126.
- **Confidence:** **HIGH** — harness owns this layer.
- **Cheapest safe recovery (HYPOTHESIS):** Repair infra, not model: restart Docker, repull image, recreate worktree, retry `Layer 1` only after infra health check passes. Do not re-prompt the model.
- **Required verification:** **Layer 1** after infra repair. Never skip to Layer 2/3 without confirming infra recovered.
- **Retry allowed:** **no** as model retry — **max 0** against 2-retry budget; **1 infra repair attempt** allowed outside that budget (HYPOTHESIS: single repair bounds cost; repeated infra failure suggests host issue, not task issue).
- **Escalation:** still failing after one repair → abort as `INFRA_FAILURE`, exclude from model success/regression accounting, surface host logs. Needs operator, not another model call.

### `OTHER` — Unclassified verification outcome

- **Evidence available (FACT):** exit code without known mapping, truncated logs, partial stdout, unknown harness state.
- **Confidence:** **LOW** — by definition, classification failed.
- **Cheapest safe recovery (HYPOTHESIS):** Bounded generic tail (≤800 chars) + cautious re-prompt "verification exited with code X, stdout tail …; ensure patch applies and targeted test Y passes" — require Layer 1 before Layer 2.
- **Required verification:** **Layer 1 → Layer 2** (at least).
- **Retry allowed:** yes — **max 1** (HYPOTHESIS: low confidence warrants tightest cap; generous retries on unclassified outcomes amplified contamination in Phase 2D).
- **Escalation:** still `OTHER` after one retry → abort as `OTHER`, preserve bounded evidence for human triage, log as unclassified. Needs taxonomy improvement, not more retries.

---

## 6. Worked Principle — Why This Matrix Is Cheaper (HYPOTHESIS)

> **Do not spend expensive verification or context until cheaper evidence says it is necessary.**

Current approach (EVIDENCE D-005): every retry pays full Docker suite + full problem_statement resend (~176k `cacheRead` per pi call in Phase 2C) → ~2.97× median tokens, 0/5 recovery.
Layered approach (HYPOTHESIS): `PATCH_INVALID`/`EMPTY_OUTPUT` pay only `apply --check` + format hint; `WRONG_FILE` pays optional reviewer instead of suite; `TEST_FAILURE` pays targeted `pytest -k` + minimal evidence; `REGRESSION` only pays full suite after Layer 2 passes. Provider/infra pay nothing beyond a stop.

Whether layered actually recovers more at `≤1.5×` cost with non-inferior regression is **HYPOTHESIS** — the Phase 2D design gate (n=7) is the first test, and T1 (`≥10pp at ≤2×` with regression ≤, n≥30 Verified) is the product gate. This matrix defines the *policy* to be tested there; it does not pre-claim the result.

---

## 7. Logging Contract (for `lace-ledger` / JSONL — HYPOTHESIS shape, not code)

Each attempt logs: `failure_class`, `confidence`, `evidence` (bounded: test name, assertion, file:line, 20-line traceback, apply stderr, provider error string, tokens, latency, layer reached), `recovery_action` (one of the cheapest rows above), `verification_required`, `retry_allowed`, `retry_count`, `escalated` (bool + reason). Provider/infra stops log `tokens=0`, `retry_count=0`, `escalated=provider|infra`.

---

## 8. Assumptions Explicitly Labeled HYPOTHESIS

1. Targeted evidence (test name + assertion + file:line + 20-line traceback + hunk) is sufficient to fix `TEST_FAILURE` without resending full problem_statement.
2. For `PATCH_INVALID`/`EMPTY_OUTPUT`, a format-only retry is cheaper and sufficient; second format failure indicates model incapability, not prompt wording.
3. `WRONG_FILE` heuristic (changed files vs implicated files) is actionable; diff-only reviewer can catch it cheaper than another full-context retry.
4. One reshaped retry is the right cap for `TIMEOUT`; blind replay repeats hang and the 2.97× blow-up.
5. Regression fixes deserve a tighter cap (1) than task fixes (2) because corrective edits often re-break the task and cause oscillation (R003 cost 3–10×).
6. Provider/auth/network/infra must never consume the 2-retry model budget; outer requeue with backoff, if ever, is a separate platform concern.
7. `OTHER` should be capped at 1 because low-confidence retries amplified contamination in D-007.
8. No row's effectiveness is measured — all recovery→success mappings are **HYPOTHESIS** pending Phase 2D (n=7) and T1 (n≥30 Verified).

---

## 9. What This Document Does Not Claim

- That any per-class recovery action recovers at a specific rate (no measured performance invented).
- That retry caps of 1 vs 2 are optimal — they are conceptual bounds to be tested.
- Production architecture, API shapes, plugin implementation details, or pricing.
- That layered recovery works — HYPOTHESIS until clean Phase 2D data.

See `docs/core/concepts.md` for irreducible entities, `docs/core/lifecycle.md` for state machine, `docs/core/event-model.md` for audit log, `context/brain.md` for gates and validated state, and `context/decisions.md` for D-007/D-008/D-010.

---

## 10. Stop Condition

Conceptual model created at `docs/core/recovery-policy.md`. No benchmarks run. No harness modified. No quota consumed.