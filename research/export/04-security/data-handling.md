<!-- GENERATED ARTIFACT — COPIED FROM CANONICAL SOURCE -->
<!-- Canonical Source: docs/security/data-handling.md -->
<!-- Category: security -->
<!-- Synchronization: scripts/export_research.py -->

# LACE Data Handling (Conceptual)

**Status:** HYPOTHESIS — policy proposal, not implemented. No redaction, sandbox, or audit code exists.
**Date:** 2026-09-03 · **Companion:** `docs/security/threat-model.md` · **Terms:** `context/terminology.md`

## 1. What can enter LACE (FACT — from harness + task brief)

Source code, diffs, file context · filesystem contents of worktree · git history/metadata · shell commands + stdout/stderr/exit codes · test names, assertions, tracebacks · env vars visible to subprocesses · dotenv/credential files in repo · network responses during install/test · provider messages + usage metadata · transcripts and ledger records.

**INFERENCE:** Assume every verification artifact is secret-bearing until redacted. The highest-risk ingress is (a) env passthrough to subprocesses, (b) failed commands echoing credentials, (c) repos containing live secrets.

## 2. What may be forwarded to providers (DECISION — allowlist)

Allowed: task-relevant code excerpts + failing-test evidence (test name, assertion, file:line, ≤20-line traceback), current hunk, file stubs — the minimal layered payload (`docs/06-recovery-model.md`).
Never sent in prompts: env vars, credential/dotenv contents, provider API keys (only via SDK transport auth, never in prompt text), full unredacted logs, unrelated files.

**INFERENCE:** Layered minimal-evidence design is also a data-minimization control: targeted evidence sends strictly less than full-context retry (Phase 2C: ~176k cacheRead/call repeated 3× — EVIDENCE for current cost, HYPOTHESIS that layered reduces exposure proportionally).

## 3. What should be persisted (DECISION)

Per attempt: `failure_class`, `confidence`, `evidence` (redacted, bounded), `recovery_action`, `verification_required`, `retry_count`, `escalated`, tokens/latency/layer, code + provider-error identifiers (status code, error type — not message bodies containing secrets), harness-side patch hashes. Failed-task worktrees kept isolated until triage, then pruned.

## 4. What should never be persisted (DECISION)

Raw env blocks · unredacted stdout/stderr tails · credential/dotenv file contents · API keys/tokens (any provider's) · full transcripts containing any of the above · provider error bodies verbatim. If captured accidentally: quarantine, redact, rotate the exposed secret.

## 5. Redaction (HYPOTHESIS — proposed, unmeasured)

- **Order:** redact at capture (before ledger write) AND before any re-prompt. Redact-then-store, redact-then-send. Never store-then-redact-views.
- **Method:** denylist patterns (private keys, `AKIA…`, `ghp_/gho_/sk-`, `Bearer`, `password=`, PEM blocks, dotenv assignments) + env-value matching (exact values of flagged vars replaced with `[REDACTED:VAR_NAME]`) + structural rules (drop `Authorization`/`Cookie` headers, query `token=` params).
- **Failed commands:** store exit code + sanitized argv (flags with values masked) + redacted excerpt; never the verbatim command line when it contains a secret-bearing flag.
- **Limits (FACT — GitHub masking precedent):** pattern redaction is best-effort; unknown formats and multi-line splits escape it. **INFERENCE:** redaction reduces but cannot prove zero-leak; the stronger control is not collecting secrets (env allowlist, §6).

## 6. Provider and environment boundaries (DECISION)

- Env passthrough is deny-by-default: verification subprocesses receive an allowlisted env (`PATH`, locale, `CI`-safe vars + task-declared needs). Secrets injected only via scoped, short-lived references, never exported wholesale.
- Verification runs low-privilege, throwaway container/worktree, no network egress by default; installs only from pinned lockfiles.
- Provider boundary: local verdicts only; provider output never executes, never merges, never classifies itself. Provider/infra failures stop the task with zero token billing and no retry-budget consumption (D-008). Contaminated records are discarded, not patched (D-007).
- Local-host compromise is out of scope (see threat model T8); ledger signing (e.g., hash-chained JSONL) is tamper-evident HYPOTHESIS, not tamper-proof.

## 7. Auditability (DECISION — minimal viable)

Each ledger record must answer: what ran (command hash + pinned inputs), what decided (failure class + layer + exit code), what was sent (redacted prompt payload hash + token counts), what resulted (pass/fail/regression), and what stopped (escalation reason). Audit logs themselves are redacted artifacts under §4–5. Retention: bounded (e.g., task + N days), then pruned; no indefinite transcript archive.

## 8. What is explicitly not claimed

No redaction precision/recall numbers, no sandbox escape analysis, no secret-zero-leak proof — all HYPOTHESIS until specified, implemented, and adversarially tested.
