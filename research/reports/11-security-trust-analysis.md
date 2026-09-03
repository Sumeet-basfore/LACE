# Report 11 — Security & Trust Analysis (Research Agent D)

**Date:** 2026-09-03 · **Scope:** Conceptual threat model for verification-first LACE. No code, no benchmarks, no harness changes, no agents spawned.
**Sources:** task brief (15 questions + 9 threat vectors), `docs/06-recovery-model.md`, `docs/07-recovery-policy.md`, `context/brain.md`, `context/decisions.md` (D-001–D-010), `context/terminology.md`, `research/reports/03-phase2c-synthesis.md`, OWASP LLM Top 10 (2025).
**Outputs:** `docs/security/threat-model.md`, `docs/security/data-handling.md`, this report.

## 1. Answers to the 15 questions

1. **What sensitive information can enter LACE?** FACT: source, diffs, filesystem, git history, shell stdout/stderr, test output, env vars, dotenv/credential files, network responses, provider messages, transcripts. INFERENCE: treat all verification artifacts as secret-bearing.
2. **What can be forwarded to providers?** FACT: today, whatever the recovery prompt contains — Phase 2C resent full problem context (~176k cacheRead/call). DECISION: allowlist only — targeted evidence + hunk + stubs; never env/credential/log bodies.
3. **Can verification logs contain secrets?** FACT: yes — harnesses already store 800-char tails, tracebacks, stdout; failed commands echo tokens. EVIDENCE (precedent): log-masking systems (e.g., GitHub Actions) are best-effort only.
4. **Can failed commands expose credentials?** FACT: yes — `curl -H "Authorization:…"`, connection strings, and `set -x` traces land in captured stderr. DECISION: store exit code + masked argv + redacted excerpt, never verbatim secret-bearing commands.
5. **Can recovery context leak env vars?** INFERENCE: yes — the evidence→prompt path re-sends captured output; without redact-before-reprompt, one leaked var propagates to the provider and then to the persisted next-attempt record.
6. **Can malicious repo content manipulate recovery?** INFERENCE: yes — hostile tests/fixtures/hooks produce the very evidence (names, tracebacks, stdout) that shapes the next prompt (indirect prompt injection, OWASP LLM01). DECISION: structured extraction + quoted untrusted blocks + never execute repo hooks.
7. **Can model output cause unsafe verification actions?** INFERENCE: yes — patches are untrusted code; executing them with dev privileges risks RCE/exfiltration/destruction and test-weakening that fakes green. DECISION: Layer-1 screen, isolated low-privilege execution, regression gate, human merges.
8. **What privileges should LACE require?** DECISION: least privilege — low-privilege throwaway container/worktree, no egress by default, denylisted destructive git/docker commands, no push/merge/deploy in-loop, allowlisted env, dedicated service identity.
9. **What should be persisted?** DECISION: failure class, confidence, redacted bounded evidence, recovery action, verification required, retry counts, escalation, tokens/latency/layer, hashes/identifiers — the `07-recovery-policy.md` §7 contract.
10. **What should never be persisted?** DECISION: raw env, unredacted output, credential/dotenv contents, any API keys, secret-bearing transcripts or provider error bodies.
11. **How should evidence be redacted?** HYPOTHESIS: redact-at-capture and redact-before-reprompt; pattern denylist + env-value matching + header/query structural rules; control-char stripping, truncation markers. INFERENCE: best-effort — non-collection (env allowlist) is the stronger control.
12. **How should provider boundaries be represented?** DECISION: provider is untrusted transport, never a trust anchor — local deterministic verdicts; separate failure classes with stop semantics (D-008); minimal context per layer; pinned model/provider (D-009) for anomaly detection.
13. **What happens on provider/infra failure?** FACT + DECISION: stop, zero token billing, no retry-budget consumption, discard contaminated records (D-007/D-008); outer scheduler may requeue as a new run, never as an in-task retry.
14. **How should auditability work?** DECISION: hash-chained redacted JSONL answering what-ran / what-decided / what-was-sent / what-resulted / what-stopped; bounded retention, then prune.
15. **What trust guarantees are realistic?** INFERENCE: verifiability (local gates, separated classes) is credibly promiseworthy now; confidentiality (no-leak) and tamper-evidence are HYPOTHESIS until redaction + sandbox + signing are specified, built, and tested.

## 2. Threat-vector coverage (all 9 modeled)

Malicious repository · malicious dependency · malicious generated patch · prompt injection · secret leakage · untrusted test output · compromised provider · compromised local environment · accidental destructive verification commands — each with impact + proposed controls in `docs/security/threat-model.md` §3. Deepest asymmetry (INFERENCE): the verification executor concentrates all privilege while consuming the most untrusted inputs (repo + patch + test output) — it is the component to isolate first.

## 3. What was deliberately not over-engineered

No crypto protocol design, no full sandbox spec, no DLP product evaluation, no redaction benchmark — DECISION: policy-level model only, matching LACE's stage (unproven hypothesis, D-010 gate unmet). Each control is labeled to the cheapest test that would validate it (redaction recall test, injection test suite, sandbox escape review) rather than specified up front.

## 4. Verdict

SECURITY READINESS: **LOW**

Rationale (INFERENCE): threats are now named and handling policy is written, but zero controls are implemented, measured, or adversarially tested — and the current harness already persists unredacted tails/traces. A LOW rating is the honest input to the D-010 scale gate: do not attach LACE to private repos or real credentials beyond experiments until redaction + isolation land.

## 5. Top 5 unresolved risks

1. **Unredacted secret sink** — ledger/transcripts store raw output today; one echoed token persists indefinitely and re-sends to the provider. (Needs: redact-at-capture + secret-rotation playbook.)
2. **No sandbox profile** — executor privilege vs. untrusted repo/patch/test input is unspecified; worktree isolation alone is not a security boundary. (Needs: container spec, egress-deny,low-privilege user, destructive-denylist.)
3. **Injection via evidence→prompt** — raw traceback/test/repo strings flow into recovery prompts with no quoting, delimiting, or injection test suite. (Needs: structured extraction + adversarial tests.)
4. **Test-weakening patches fake green** — model can delete assertions/skip guards to pass the gate; no patch-screen or mutation check exists. (Needs: Layer-1 screen + regression-required + human merge.)
5. **Provider sees everything sent** — full-context retry maximizes exposure; compromise or logging on the provider side exfiltrates code and any leaked secrets with no minimization measurement. (Needs: layered-payload minimization + per-layer exposure accounting.)

## 6. Stop condition

Three artifacts created; no implementation, no SWE-bench, no `research/phase2d` modification, no agents spawned. Uncertainty: all controls are HYPOTHESIS/DECISION — effectiveness unmeasured; primary sources used for threat classes (OWASP/CWE), not for LACE-specific rates.
