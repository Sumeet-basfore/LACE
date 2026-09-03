# LACE Trust Boundaries (Conceptual)

**Status:** HYPOTHESIS — conceptual model only. No implementation, no audit.
**Date:** 2026-09-03 · **Track:** B — Security/Trust Validation
**Companion:** `docs/security/threat-model.md`, `docs/security/data-handling.md`
**Predecessors:** `research/reports/11-security-trust-analysis.md`, `research/reports/12-parallel-research-synthesis.md` §8

---

## 1. Trust Zone Definitions

| Zone | Components | Trust Level | Rationale |
|---|---|---|---|
| **Z1: Developer Workstation** | IDE, terminal, git, SSH keys, `.env`, OS credential store | **TRUSTED ROOT** | User's sovereign environment; LACE cannot defend if host compromised (T8). |
| **Z2: Coding Agent Process** | Agent binary, plugin, MCP client, local config | **TRUSTED BUT UNVERIFIED** | Runs with user's privileges; output is untrusted input to LACE. |
| **Z3: LACE Gate / Ledger** | `lace-gate` plugin, `lace-ledger` MCP server, verification orchestrator | **TRUSTED CONTROL PLANE** | Enforces policy; must be auditable, minimal TCB. |
| **Z4: Verification Executor** | Docker/container runtime, worktree manager, test runner, shell | **PRIVILEGED / UNTRUSTED INPUTS** | Highest risk: runs model patches + repo code. Must be isolated. |
| **Z5: Repository + Dependencies** | Source, tests, `package.json`/`pyproject.toml`/lockfiles, transitive deps | **UNTRUSTED** | Attacker-controlled (T1, T2). Never auto-execute hooks/scripts. |
| **Z6: Model Provider** | API endpoint, model weights, inference infra, provider logs | **UNTRUSTED TRANSPORT** | Sees all prompt content; can return malicious output; may leak (T7). |
| **Z7: Evidence Store / Logs** | JSONL ledger, transient traces, CI artifacts, dashboard | **SENSITIVE / REDACTED** | Secret sink if unredacted (T5). Bounded retention, tamper-evident. |

---

## 2. Data Flow Across Boundaries

```
Z1 (Developer) ──────────────────► Z2 (Agent) ──────────────────► Z3 (LACE Gate)
   │                                     │                              │
   │ Secrets, intent                     │ Untrusted patch              │ Policy, verdict
   │                                     ▼                              ▼
   │                              Z5 (Repo) ──────────────────► Z4 (Executor)
   │                                     │                              │
   │                                     │ Untrusted code, tests        │ Isolated exec
   │                                     ▼                              ▼
   │                              Z6 (Provider) ◄──────────────── Z3 (Recovery prompt)
   │                                     │                              │
   │                                     │ Untrusted transport          │ Redacted evidence
   │                                     ▼                              ▼
   └──────────────────────────────► Z7 (Evidence/Logs) ◄──────────────┘
          User review, audit                    Redacted, bounded, tamper-evident
```

**Key boundary rules:**
- **Z2 → Z3:** Agent output (patch) enters LACE as **untrusted**. No execution without Z4 isolation.
- **Z3 → Z4:** Verification commands constructed by LACE (not agent), executed in throwaway container/worktree.
- **Z4 → Z3:** Exit codes, structured test results, bounded excerpts. **Never** raw stdout/stderr verbatim.
- **Z3 → Z6:** Recovery prompts contain **only** structured, redacted evidence. No secrets, no full context.
- **Z6 → Z3:** Model output treated as untrusted (same as Z2→Z3).
- **Z3 → Z7:** Every write redacted at capture. Reads for audit are redacted views.

---

## 3. Explicit Trust Assumptions (what LACE relies on but does not enforce)

| Assumption | Zone | If Violated |
|---|---|---|
| Host OS not compromised (no rootkit, no malicious kernel module) | Z1 | All guarantees void (T8) |
| Developer's SSH/GPG keys not exfiltrated | Z1 | Supply chain compromise |
| Agent binary not supply-chain attacked | Z2 | Agent output malicious by design |
| Docker/container runtime not escaped | Z4 | Host compromise from verification |
| Lockfiles match actual deps (no lockfile injection) | Z5 | T2 malicious dep executes |
| Provider API key not leaked outside SDK transport | Z1/Z6 | Account takeover, billing fraud |
| System clock roughly accurate (for timeouts, TTL) | Z3/Z4 | Retry logic, retention broken |

---

## 4. What Each Zone Must NOT Do

| Zone | Must Not |
|---|---|
| **Z2 (Agent)** | Execute patches, run tests, access secrets, push/merge, modify infra |
| **Z3 (LACE)** | Trust agent self-report, trust provider verdict, send secrets to provider, persist unredacted logs, auto-merge/deploy |
| **Z4 (Executor)** | Run with host privileges, have network egress (default), persist state across attempts, run repo hooks |
| **Z5 (Repo)** | Be trusted for any verdict, self-report test results, execute during verification |
| **Z6 (Provider)** | Be a trust anchor for any decision, receive secrets, execute code, merge changes |
| **Z7 (Logs)** | Contain unredacted secrets, be immutable without tamper-evidence, retain indefinitely |

---

## 5. Minimal TCB (Trusted Computing Base) for LACE

**Goal:** The smallest set of code that must be correct for security guarantees to hold.

| Component | In TCB? | Reason |
|---|---|---|
| `lace-gate` policy engine (gate logic, retry caps, classification) | **YES** | Core safety logic |
| `lace-ledger` JSONL append + redaction at write | **YES** | Audit integrity + secret handling |
| Verification executor (Docker/container launch, worktree create, test runner) | **YES** | Isolation enforcement |
| Redaction engine (denylist + env-value matching) | **YES** | Secret handling at capture |
| MCP server transport (stdio/JSON-RPC) | NO | Transport only; payload validated by TCB |
| Plugin UI / dashboard | NO | Read-only views of redacted data |
| Prompt templates / recovery policies | NO | Data, not code; versioned, auditable |
| Agent integration shim | NO | Untrusted input source |

**TCB target:** <2,000 LOC (policy + ledger + executor + redaction). Everything else composable/replaceable.

---

## 6. Boundary Enforcement Mechanisms (DECISION — policy, not code)

| Boundary | Mechanism | Status |
|---|---|---|
| Z2→Z3 (patch intake) | Schema validation (unified diff only), size cap, `git apply --check` in Z4 before any execution | DESIGNED |
| Z3→Z4 (verification cmd) | Allowlist of commands (`pytest -k`, `git apply`, `cargo test`, `npm test`); no shell interpolation; argv array only | DESIGNED |
| Z4→Z3 (results) | Structured parsers (JUnit XML, TAP, pytest `--json`); bounded excerpts (20 lines traceback, 800 chars stdout); strip ANSI/control chars | DESIGNED |
| Z3→Z6 (recovery prompt) | Template with fixed instruction hierarchy; untrusted evidence blocks delimited + labeled; redaction at render | DESIGNED |
| Z6→Z3 (model output) | Same as Z2→Z3 — treat as untrusted patch | DESIGNED |
| Z3→Z7 (ledger write) | Redact-then-write: denylist patterns + env-value replace + structural header stripping | DESIGNED |
| Z7→Audit (read) | Redacted view only; hash-chained JSONL for tamper-evidence; bounded retention (task + 30 days default) | DESIGNED |
| Z4 isolation | Throwaway container per attempt (or worktree + user namespace); read-only baseline mount; no network; resource limits (CPU, mem, pids, time) | HYPOTHESIS (profile not specified) |

---

## 7. Residual Risks (accepted, documented)

| Risk | Boundary | Mitigation | Residual |
|---|---|---|---|
| Redaction false negatives (unknown secret format) | Z3→Z7, Z3→Z6 | Denylist + env-value + structural; env allowlist in Z4 reduces ingress | **ACCEPTED** — cannot prove zero-leak |
| Container escape (CVE in runtime) | Z4 | User namespace, read-only, no cap, seccomp, minimal base image | **ACCEPTED** — host compromise = T8 |
| Prompt injection via structured evidence | Z3→Z6 | Delimited blocks, fixed instruction hierarchy, no raw concat | **LOW** — design reduces but not eliminates |
| Test-weakening patch passes Layer 2/3 | Z4→Z3 | Regression gate (Layer 3) compares to baseline PASS_TO_PASS; diff-only reviewer for scope | **MEDIUM** — depends on test quality |
| Provider sees all prompt content | Z3→Z6 | Minimize context (layered); no secrets in prompt; pin model (D-009) | **ACCEPTED** — provider is untrusted transport |
| Ledger tampering (local) | Z7 | Hash-chained JSONL; tamper-evident not tamper-proof | **ACCEPTED** — host compromise = T8 |

---

## 8. Open Questions (→ research/security/)

1. What is the redaction recall/precision on real repos with real secrets?
2. Can the sandbox profile (Docker/user-ns/seccomp) be specified and tested against escape attempts?
3. Does the prompt-injection test suite (structured evidence blocks) resist known injection patterns?
4. What is the minimal allowlist of verification commands per language ecosystem?
5. How to handle mono-repos where worktree isolation is expensive?
6. What is the false-positive rate of `git apply --check` vs actual apply failure?

---

## Provenance

- Derived from: `docs/security/threat-model.md` (threats T1–T9), `docs/security/data-handling.md` (data flows), `research/reports/11-security-trust-analysis.md`, `research/reports/12-parallel-research-synthesis.md` §8
- Terminology: `context/terminology.md`
- Decisions: D-001–D-010 (`context/decisions.md`)