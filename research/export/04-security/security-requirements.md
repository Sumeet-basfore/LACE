<!-- GENERATED ARTIFACT — COPIED FROM CANONICAL SOURCE -->
<!-- Canonical Source: docs/security/security-requirements.md -->
<!-- Category: security -->
<!-- Synchronization: scripts/export_research.py -->

# LACE Security Requirements (Conceptual)

**Status:** HYPOTHESIS — requirements specification only. Not implemented, not verified.
**Date:** 2026-09-03 · **Track:** B — Security/Trust Validation
**Companion:** `docs/security/threat-model.md`, `docs/security/trust-boundaries.md`, `docs/security/data-handling.md`
**Predecessors:** `research/reports/11-security-trust-analysis.md`

---

## 1. Requirement Classification

| Label | Meaning |
|---|---|
| **MUST** | Non-negotiable; violation = security failure; blocks GO-TO-PROTOTYPE |
| **SHOULD** | Strongly expected; violation = residual risk; requires documented acceptance |
| **MAY** | Optional enhancement; violation = no direct risk; nice-to-have |

---

## 2. Requirements by Threat (from threat-model.md)

### T1: Malicious Repository
| ID | Requirement | Level | Verification |
|---|---|---|---|
| SR-T1-01 | Verification executor MUST run in throwaway container/worktree per attempt. | MUST | Integration test: container destroyed after attempt; worktree removed. |
| SR-T1-02 | Baseline worktree MUST be mounted read-only in executor. | MUST | Integration test: write to baseline fails. |
| SR-T1-03 | Repository hooks (pre-commit, prepare-commit-msg, etc.) MUST NOT execute during verification. | MUST | Integration test: hook that writes file does not run. |
| SR-T1-04 | Executor MUST have no network egress by default. | MUST | Integration test: `curl`/`wget`/`nc` from executor fails. |
| SR-T1-05 | Evidence MUST record harness-side exit codes + hashes, NOT repo self-report. | MUST | Unit test: ledger entry contains harness exit code, not test framework claim. |

### T2: Malicious Dependency
| ID | Requirement | Level | Verification |
|---|---|---|---|
| SR-T2-01 | Dependency installation MUST use pinned lockfiles only (no implicit install). | MUST | Integration test: `pip install`/`npm ci` with lockfile only; no `setup.py` execution. |
| SR-T2-02 | Lockfile hashes MUST be verified before install. | SHOULD | Integration test: corrupted lockfile fails install. |
| SR-T2-03 | Offline mirror / vendored deps SHOULD be used where feasible. | MAY | Documentation of mirror setup. |

### T3: Malicious Generated Patch
| ID | Requirement | Level | Verification |
|---|---|---|---|
| SR-T3-01 | Layer 1 static screen MUST reject patches containing network primitives (`curl`, `wget`, `nc`, `socket`, `http.client`, `requests`, `fetch`, `axios`). | MUST | Unit test: patch with `curl` rejected; patch without passes. |
| SR-T3-02 | Layer 1 static screen MUST reject patches containing shell-outs (`subprocess`, `os.system`, `exec`, `shell=True`, `bash -c`, `sh -c`, `powershell -c`). | MUST | Unit test: patch with `subprocess.run` rejected. |
| SR-T3-03 | Layer 1 static screen MUST reject patches that weaken/remove test assertions (delete `assert`, `expect`, `pytest.raises`, `try/except` around test). | MUST | Unit test: patch removing assertion rejected. |
| SR-T3-04 | New executables / setuid bits / service definitions MUST require human approval before verification executes. | MUST | Integration test: `chmod +x` in patch triggers approval gate. |
| SR-T3-05 | Regression gate (Layer 3) MUST be non-inferior to baseline PASS_TO_PASS. | MUST | Integration test: regression introduced → gate fails. |

### T4: Prompt Injection (Direct + Indirect)
| ID | Requirement | Level | Verification |
|---|---|---|---|
| SR-T4-01 | Evidence→prompt MUST use structured extraction (test name, assertion, file:line, bounded traceback) — NEVER raw concatenation. | MUST | Code review: no string concat of raw evidence into prompt template. |
| SR-T4-02 | Untrusted content blocks in prompt MUST be delimited and labeled (e.g., `<<EVIDENCE_START>> … <<EVIDENCE_END>>`). | MUST | Unit test: prompt template contains delimiters. |
| SR-T4-03 | Recovery prompt MUST have fixed instruction hierarchy: system > policy > untrusted evidence (quoted, never as instructions). | MUST | Code review: prompt template structure. |
| SR-T4-04 | Injection test suite MUST be run against evidence→prompt pipeline. | SHOULD | Test suite execution (see `research/security/injection-tests.md`). |

### T5: Secret Leakage (Logs, Evidence, Provider)
| ID | Requirement | Level | Verification |
|---|---|---|---|
| SR-T5-01 | Redaction MUST occur at capture (before ledger write) AND before re-prompt. | MUST | Integration test: secret in env → ledger entry has `[REDACTED]`; recovery prompt has `[REDACTED]`. |
| SR-T5-02 | Redaction MUST use: denylist patterns (keys, tokens, PEM, Bearer) + env-value matching (flagged vars) + structural rules (strip Auth headers, token query params). | MUST | Unit test: each pattern type redacted. |
| SR-T5-03 | Failed commands MUST store exit code + sanitized argv (flag values masked) + redacted excerpt — NEVER verbatim command line. | MUST | Integration test: `curl -H "Authorization: Bearer secret"` → stored as `curl -H "Authorization: Bearer [REDACTED]"`. |
| SR-T5-04 | Env passthrough to executor MUST be deny-by-default allowlist (`PATH`, `LANG`, `CI`, task-declared only). | MUST | Integration test: `SECRET=foo` in host env not present in executor. |
| SR-T5-05 | Provider API keys MUST never appear in prompts (only SDK transport auth). | MUST | Code review: no provider key in prompt template. |
| SR-T5-06 | Ledger retention MUST be bounded (default: task + 30 days) with explicit prune. | SHOULD | Integration test: old ledger entries pruned. |

### T6: Untrusted Test Output
| ID | Requirement | Level | Verification |
|---|---|---|---|
| SR-T6-01 | Test output MUST be parsed via structured formats (JUnit XML, TAP, pytest `--json`) — not prose. | MUST | Integration test: pytest JSON parsed; stdout prose ignored. |
| SR-T6-02 | Excerpts MUST be bounded (20-line traceback, 800-char stdout tail) with explicit `…[truncated]` markers. | MUST | Unit test: long output truncated with marker. |
| SR-T6-03 | Control characters (ANSI, OSC, CSI) MUST be stripped from captured output. | MUST | Unit test: ANSI escape codes removed. |

### T7: Compromised Provider
| ID | Requirement | Level | Verification |
|---|---|---|---|
| SR-T7-01 | Verification verdicts MUST be locally computed (deterministic gates) — never trust provider self-report. | MUST | Architecture: no provider verdict in gate logic. |
| SR-T7-02 | Provider/infra failures (429, 5xx, auth, network) MUST stop task with zero token billing and no retry-budget consumption (D-008). | MUST | Integration test: 429 → STOPPED, tokens=0, retry_count=0. |
| SR-T7-03 | Model/provider MUST be pinned per D-009 (frozen manifest) so anomalies are detectable. | MUST | Config: manifest hash recorded in `task.opened` event. |
| SR-T7-04 | Context sent to provider MUST be minimized (layered evidence, not full context). | SHOULD | Measurement: tokens/prompt vs baseline. |

### T8: Compromised Local Environment
| ID | Requirement | Level | Verification |
|---|---|---|---|
| SR-T8-01 | LACE MUST explicitly document that host compromise (rootkit, malicious kernel, hardware implant) is out of scope. | MUST | Documentation: threat-model.md §3 T8. |
| SR-T8-02 | LACE SHOULD recommend: dedicated service account, minimal host mounts, signed ledger (tamper-evident). | SHOULD | Documentation: deployment guide. |

### T9: Accidental Destructive Verification Commands
| ID | Requirement | Level | Verification |
|---|---|---|---|
| SR-T9-01 | Verification executor MUST run as low-privilege user (non-root, no sudo, no docker group). | MUST | Integration test: `whoami` ≠ root; `docker ps` fails. |
| SR-T9-02 | Destructive commands MUST be on explicit denylist: `git push`, `git clean -fdx`, `rm -rf /`, `docker system prune`, `kubectl delete`, `terraform destroy`, `npm publish`, `pip upload`. | MUST | Unit test: denylist blocks; allowlist passes. |
| SR-T9-03 | No push/merge/deploy in verification loop — success only marks green; human (or branch protection) merges. | MUST | Architecture: no merge/deploy code path in LACE. |
| SR-T9-04 | Bounded retries (≤2) MUST cap blast repetition. | MUST | Integration test: 3rd retry blocked. |

---

## 3. Cross-Cutting Requirements

| ID | Requirement | Level | Threats Covered |
|---|---|---|---|
| SR-CC-01 | All untrusted inputs (repo, patch, test output, provider) MUST be treated as hostile — no trust anchor. | MUST | T1–T7 |
| SR-CC-02 | All secrets MUST be redacted at capture AND before re-prompt — never store-then-redact. | MUST | T5 |
| SR-CC-03 | All verification execution MUST be isolated (container/worktree) with resource limits. | MUST | T1, T2, T3, T9 |
| SR-CC-04 | All ledger writes MUST be append-only, hash-chained, with bounded retention. | MUST | T5, T8 |
| SR-CC-05 | All provider communication MUST be minimized (layered evidence) and pinned (D-009). | SHOULD | T7 |
| SR-CC-06 | All recovery prompts MUST use fixed instruction hierarchy with delimited untrusted blocks. | MUST | T4 |
| SR-CC-07 | All failure accounting MUST separate provider/model/verification/infra (D-008). | MUST | T7, T9 |

---

## 4. Implementation Status Tracker (for `research/security/analysis.md`)

| Requirement | Status | Test | Evidence |
|---|---|---|---|
| SR-T1-01 | NOT IMPLEMENTED | | |
| SR-T1-02 | NOT IMPLEMENTED | | |
| SR-T1-03 | NOT IMPLEMENTED | | |
| SR-T1-04 | NOT IMPLEMENTED | | |
| SR-T1-05 | NOT IMPLEMENTED | | |
| SR-T2-01 | NOT IMPLEMENTED | | |
| SR-T2-02 | NOT IMPLEMENTED | | |
| SR-T2-03 | NOT IMPLEMENTED | | |
| SR-T3-01 | NOT IMPLEMENTED | | |
| SR-T3-02 | NOT IMPLEMENTED | | |
| SR-T3-03 | NOT IMPLEMENTED | | |
| SR-T3-04 | NOT IMPLEMENTED | | |
| SR-T3-05 | NOT IMPLEMENTED | | |
| SR-T4-01 | NOT IMPLEMENTED | | |
| SR-T4-02 | NOT IMPLEMENTED | | |
| SR-T4-03 | NOT IMPLEMENTED | | |
| SR-T4-04 | NOT IMPLEMENTED | | |
| SR-T5-01 | NOT IMPLEMENTED | | |
| SR-T5-02 | NOT IMPLEMENTED | | |
| SR-T5-03 | NOT IMPLEMENTED | | |
| SR-T5-04 | NOT IMPLEMENTED | | |
| SR-T5-05 | NOT IMPLEMENTED | | |
| SR-T5-06 | NOT IMPLEMENTED | | |
| SR-T6-01 | NOT IMPLEMENTED | | |
| SR-T6-02 | NOT IMPLEMENTED | | |
| SR-T6-03 | NOT IMPLEMENTED | | |
| SR-T7-01 | NOT IMPLEMENTED | | |
| SR-T7-02 | NOT IMPLEMENTED | | |
| SR-T7-03 | NOT IMPLEMENTED | | |
| SR-T7-04 | NOT IMPLEMENTED | | |
| SR-T8-01 | DESIGNED | docs/threat-model.md | |
| SR-T8-02 | DESIGNED | docs/threat-model.md | |
| SR-T9-01 | NOT IMPLEMENTED | | |
| SR-T9-02 | NOT IMPLEMENTED | | |
| SR-T9-03 | NOT IMPLEMENTED | | |
| SR-T9-04 | NOT IMPLEMENTED | | |
| SR-CC-01 | DESIGNED | trust-boundaries.md | |
| SR-CC-02 | DESIGNED | data-handling.md | |
| SR-CC-03 | DESIGNED | trust-boundaries.md | |
| SR-CC-04 | DESIGNED | data-handling.md | |
| SR-CC-05 | DESIGNED | recovery-policy.md | |
| SR-CC-06 | DESIGNED | trust-boundaries.md | |
| SR-CC-07 | DESIGNED | recovery-policy.md | |

---

## 5. Verification Methods (for each status)

| Status | Meaning | Required Evidence |
|---|---|---|
| **NOT IMPLEMENTED** | No code exists | — |
| **DESIGNED** | Documented in specs, no code | Spec document reference |
| **IMPLEMENTED** | Code exists, not tested | Code reference |
| **TESTED** | Code + automated test passing | Test name + CI run ID |
| **VERIFIED** | Tested + adversarial review / pentest | Review report + date |

---

## 6. GO-TO-PROTOTYPE Security Gate

**No GO-TO-PROTOTYPE until:**
- All **MUST** requirements are at least **TESTED** (code + passing automated test).
- Redaction recall/precision measured on real repo corpus (SR-T5-01, SR-T5-02).
- Sandbox escape attempts documented (SR-T1-01, SR-T3-04).
- Injection test suite passes (SR-T4-04).
- Destructive command denylist validated (SR-T9-02).

**Current readiness: LOW** (0/31 MUST requirements TESTED or VERIFIED).

---

## Provenance

- Derived from: `docs/security/threat-model.md` (T1–T9), `docs/security/data-handling.md`, `docs/security/trust-boundaries.md`
- Terminology: `context/terminology.md`
- Decisions: D-001–D-010 (`context/decisions.md`)
- Status labels per `research/reports/11-security-trust-analysis.md` §5