# LACE Security Research — Redaction Tests

**Status:** HYPOTHESIS · **Scope:** Test specification for redaction engine. No implementation yet.
**Date:** 2026-09-03 · **Track:** B — Security/Trust Validation
**Companion:** `docs/security/data-handling.md`, `docs/security/security-requirements.md` (SR-T5-01, SR-T5-02, SR-T5-03)
**Predecessors:** `research/security/attack-cases.md`

---

## Purpose

Define test cases to measure redaction **recall** (secrets caught) and **precision** (false positives) on realistic data. No real secrets used — all test fixtures use synthetic but realistic patterns.

---

## Redaction Scope (from data-handling.md §5)

**Order:** Redact at capture (before ledger write) AND before re-prompt.
**Method:** 
1. Denylist patterns (private keys, `AKIA...`, `ghp_/gho_/sk-`, `Bearer`, `password=`, PEM blocks, dotenv assignments)
2. Env-value matching (exact values of flagged vars replaced with `[REDACTED:VAR_NAME]`)
3. Structural rules (drop `Authorization`/`Cookie` headers, query `token=` params)
4. Failed commands: store exit code + sanitized argv + redacted excerpt; never verbatim command line.

---

## Test Corpus Design

| Corpus | Source | Size | Secret Density |
|---|---|---|---|
| **C1: Synthetic unit fixtures** | Hand-crafted patterns | 100 cases | 100% (every case has secret) |
| **C2: Real repo sample (public)** | Top 100 GitHub repos by stars (diverse languages) | ~10k files | Unknown (natural) |
| **C3: Simulated verification output** | Generated from Phase 2D harness logs (redacted) | 50 runs | Known (injected) |
| **C4: Adversarial evasion** | Hand-crafted evasion attempts (split, encoded, obfuscated) | 50 cases | 100% |

---

## Test Cases by Pattern Type

### 1. API Key / Token Patterns

| Test ID | Input | Expected Redaction | Pattern Type |
|---|---|---|---|
| RED-AK-01 | `AKIAIOSFODNN7EXAMPLE` | `[REDACTED:AKIA...]` | AWS Access Key ID |
| RED-AK-02 | `AKIAIOSFODNN7EXAMPLE/wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` | `[REDACTED:AKIA...]` | AWS Secret Access Key |
| RED-GH-01 | `ghp_1234567890abcdef1234567890abcdef12345678` | `[REDACTED:ghp_...]` | GitHub Personal Access Token (classic) |
| RED-GH-02 | `github_pat_11A...` | `[REDACTED:github_pat_...]` | GitHub Fine-grained PAT |
| RED-GH-03 | `gho_1234567890abcdef1234567890abcdef12345678` | `[REDACTED:gho_...]` | GitHub OAuth token |
| RED-GH-04 | `ghu_1234567890abcdef1234567890abcdef12345678` | `[REDACTED:ghu_...]` | GitHub User-to-server token |
| RED-GH-05 | `ghs_1234567890abcdef1234567890abcdef12345678` | `[REDACTED:ghs_...]` | GitHub Server-to-server token |
| RED-GH-06 | `ghr_1234567890abcdef1234567890abcdef12345678` | `[REDACTED:ghr_...]` | GitHub Refresh token |
| RED-SK-01 | `sk-1234567890abcdef1234567890abcdef1234567890abcdef` | `[REDACTED:sk-...]` | OpenAI API key |
| RED-ANTH-01 | `sk-ant-api03-...` | `[REDACTED:sk-ant-...]` | Anthropic API key |
| RED-GCP-01 | `ya29.a0AfH6SMC...` | `[REDACTED:ya29...]` | GCP OAuth token |
| RED-AZ-01 | `eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIs...` | `[REDACTED:eyJ...]` | Azure JWT (truncated) |
| RED-GEN-01 | `Bearer sk-1234567890abcdef` | `Bearer [REDACTED:sk-...]` | Authorization header |
| RED-GEN-02 | `Authorization: Token ghp_abcdef123456` | `Authorization: Token [REDACTED:ghp_...]` | Authorization header variant |
| RED-GEN-03 | `api_key=sk-1234567890abcdef` | `api_key=[REDACTED:sk-...]` | Query param / form |
| RED-GEN-04 | `password=secret123` | `password=[REDACTED]` | Password param |
| RED-GEN-05 | `token=ghp_abcdef123456` | `token=[REDACTED:ghp_...]` | Token param |

### 2. Private Key / PEM Blocks

| Test ID | Input | Expected Redaction | Pattern Type |
|---|---|---|---|
| RED-PEM-01 | `-----BEGIN RSA PRIVATE KEY-----\nMIIEow...\n-----END RSA PRIVATE KEY-----` | `[REDACTED:PRIVATE_KEY]` | RSA private key |
| RED-PEM-02 | `-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjE...\n-----END OPENSSH PRIVATE KEY-----` | `[REDACTED:PRIVATE_KEY]` | OpenSSH private key |
| RED-PEM-03 | `-----BEGIN EC PRIVATE KEY-----\nMHcCAQEE...\n-----END EC PRIVATE KEY-----` | `[REDACTED:PRIVATE_KEY]` | EC private key |
| RED-PEM-04 | `-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----` | `[REDACTED:PRIVATE_KEY]` | PKCS#8 private key |
| RED-PEM-05 | `-----BEGIN CERTIFICATE-----\nMIID...\n-----END CERTIFICATE-----` | **NO REDACTION** (public cert) | Certificate (public) |

### 3. Dotenv / Env File Patterns

| Test ID | Input | Expected Redaction | Pattern Type |
|---|---|---|---|
| RED-ENV-01 | `DATABASE_URL=postgres://user:pass@host/db` | `DATABASE_URL=[REDACTED:DATABASE_URL]` | Connection string |
| RED-ENV-02 | `SECRET_KEY=django-insecure-abcdef123456` | `SECRET_KEY=[REDACTED:SECRET_KEY]` | Django secret |
| RED-ENV-03 | `API_TOKEN=ghp_abcdef1234567890` | `API_TOKEN=[REDACTED:API_TOKEN]` | Generic token var |
| RED-ENV-04 | `AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` | `AWS_SECRET_ACCESS_KEY=[REDACTED:AWS_SECRET_ACCESS_KEY]` | AWS secret in env |
| RED-ENV-05 | `export GH_TOKEN=ghp_abcdef123456` | `export GH_TOKEN=[REDACTED:GH_TOKEN]` | Export statement |
| RED-ENV-06 | `# Comment\nDB_PASS=secret\n# End` | `DB_PASS=[REDACTED:DB_PASS]` | With comments |

### 4. Structural Rules (Headers, Query Params)

| Test ID | Input | Expected Redaction | Pattern Type |
|---|---|---|---|
| RED-STR-01 | `curl -H "Authorization: Bearer token123" https://api.example.com` | `curl -H "Authorization: Bearer [REDACTED]"` | Auth header in command |
| RED-STR-02 | `curl -H "Cookie: session=abc123" https://example.com` | `curl -H "Cookie: session=[REDACTED]"` | Cookie header |
| RED-STR-03 | `https://api.example.com?token=sk-123456&foo=bar` | `https://api.example.com?token=[REDACTED:sk-...]&foo=bar` | Query param token |
| RED-STR-04 | `POST /api HTTP/1.1\nAuthorization: Bearer secret\n\n{"key":"value"}` | `Authorization: Bearer [REDACTED]` | HTTP request dump |

### 5. Failed Command Sanitization (SR-T5-03)

| Test ID | Input (failed command) | Expected Stored Form |
|---|---|---|
| RED-CMD-01 | `curl -H "Authorization: Bearer sk-123" https://api.example.com` (exit 1) | `exit_code=1, argv=["curl", "-H", "Authorization: Bearer [REDACTED]", "https://api.example.com"], excerpt="curl: (6) Could not resolve host..."` |
| RED-CMD-02 | `psql "postgres://user:pass@host/db" -c "SELECT 1"` (exit 2) | `exit_code=2, argv=["psql", "postgres://user:[REDACTED]@host/db", "-c", "SELECT 1"], excerpt="psql: error: connection failed"` |
| RED-CMD-03 | `aws s3 cp s3://bucket/key . --access-key AKIA... --secret-key wJalr...` (exit 255) | `exit_code=255, argv=["aws", "s3", "cp", "s3://bucket/key", ".", "--access-key", "[REDACTED:AKIA...]", "--secret-key", "[REDACTED:wJalr...]"], excerpt="Unable to locate credentials"` |

### 6. Adversarial Evasion Attempts

| Test ID | Input | Expected Redaction | Evasion Technique |
|---|---|---|---|
| RED-EVA-01 | `sk - 1234567890abcdef` (spaces) | `[REDACTED:sk-...]` | Whitespace splitting |
| RED-EVA-02 | `sk-\n1234567890abcdef` (newline) | `[REDACTED:sk-...]` | Line break splitting |
| RED-EVA-03 | `s k - 1 2 3 4` (interleaved) | **MAY MISS** (document) | Character interleaving |
| RED-EVA-04 | `c2stMTIzNDU2Nzg5MGFiY2RlZg==` (base64) | **MAY MISS** (document) | Base64 encoding |
| RED-EVA-05 | `sk-1234567890abcdef1234567890abcdef1234567890abcdef` (extra long) | `[REDACTED:sk-...]` | Length variation |
| RED-EVA-06 | `sk_1234567890abcdef` (underscore) | **MAY MISS** (document) | Prefix variation |
| RED-EVA-07 | `Authorization:Bearer token` (no space) | `Authorization:Bearer [REDACTED]` | Missing space |
| RED-EVA-08 | `password : secret123` (space around =) | `password : [REDACTED]` | Spacing variation |
| RED-EVA-09 | `PASSWORD=secret123` (uppercase) | `PASSWORD=[REDACTED:PASSWORD]` | Case variation |
| RED-EVA-10 | `sk-1234567890abcdef` in middle of 10KB random text | `[REDACTED:sk-...]` | Needle in haystack |

---

## Metrics

| Metric | Definition | Target |
|---|---|---|
| **Recall (per pattern type)** | TP / (TP + FN) — secrets caught / total secrets present | ≥99% for known patterns (C1, C4) |
| **Precision** | TP / (TP + FP) — non-secrets incorrectly redacted | ≥99.9% (false positive rate <0.1%) |
| **F1** | Harmonic mean of recall/precision | ≥99% |
| **Latency** | Time to redact 1MB text | <100ms |
| **Evasion resistance** | % of C4 cases caught | Documented (not all catchable) |

---

## Test Execution Plan

### Phase 1: Unit Tests (C1)
- Implement redaction engine per data-handling.md §5
- Run 100 synthetic cases (RED-AK-* through RED-EVA-*)
- Measure recall/precision per pattern type
- Document evasion cases that miss (C4)

### Phase 2: Integration Tests (C3)
- Replay Phase 2D harness logs (redacted) through redaction engine
- Inject known secrets into logs at known positions
- Verify all injected secrets caught
- Measure false positives on real log structure

### Phase 3: Corpus Scan (C2) — Optional, resource permitting
- Clone top 100 public repos (shallow)
- Run redaction on all text files
- Manual review of flagged items (sample 100)
- Estimate natural secret density + false positive rate

### Phase 4: Adversarial Suite (C4)
- Run evasion cases (RED-EVA-*)
- Document which evade
- Inform denylist updates

---

## Reporting Template (for `research/security/analysis.md`)

```markdown
## Redaction Test Results

### C1: Synthetic Unit Fixtures (n=100)
| Pattern Type | Cases | Recall | Precision | Notes |
|---|---|---|---|---|
| AWS Keys | | | | |
| GitHub Tokens | | | | |
| OpenAI/Anthropic | | | | |
| PEM Keys | | | | |
| Dotenv | | | | |
| Structural | | | | |
| Failed Commands | | | | |
| Evasion | | | | |

### C3: Simulated Verification Output (n=50 runs)
- Injected secrets: N
- Caught: N (recall: %)
- False positives: N (precision: %)
- Latency: ms per MB

### C4: Adversarial Evasion (n=50)
| Evasion Technique | Caught? | Notes |
|---|---|---|
| Whitespace split | | |
| Newline split | | |
| Base64 | | |
| ... | | |

### Overall Assessment
- Recall ≥99% on known patterns: YES/NO
- Precision ≥99.9%: YES/NO
- Evasion resistance: DOCUMENTED
- Ready for production: NO (HYPOTHESIS until measured)
```

---

## Limitations

- **Cannot prove zero-leak:** Unknown secret formats, custom obfuscation, multi-line splits will evade.
- **No real secrets:** All tests use synthetic data; real-world entropy may differ.
- **Context-dependent:** Redaction in structured evidence (test name, traceback) vs raw logs may differ.
- **Performance vs recall tradeoff:** More patterns = slower; must balance.

---

## Provenance

- Derived from: `docs/security/data-handling.md` §5, `docs/security/security-requirements.md` SR-T5-*
- Patterns from: GitHub secret scanning patterns, AWS/GCP/Azure token formats, OWASP LLM06
- Test design: Unit → Integration → Corpus → Adversarial progression