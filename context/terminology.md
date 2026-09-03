# LACE Terminology

## Epistemic Labels

| Term | Definition |
|------|------------|
| **FACT** | Directly observed in artifacts (logs, transcripts, file contents). |
| **EVIDENCE** | Quantified or corpus-backed finding from a defined method. |
| **INFERENCE** | Conclusion drawn from evidence; not directly measured. |
| **HYPOTHESIS** | Claim to be tested; not yet supported. |
| **DECISION** | Project choice; may be made before proof. |

**Rule:** Benchmark results are EVIDENCE for harness design, not product validation.

---

## Core Pipeline Terms

| Term | Definition |
|------|------------|
| **Specification** | Task description, issue statement, or test spec given to the agent. |
| **Execution** | Agent produces a patch or change set. |
| **Verification** | Deterministic check that output meets criteria (apply, tests, regression). |
| **Evidence** | Structured observations from verification (failure class, test name, assertion, traceback, cost, latency). |
| **Recovery** | Bounded retry using minimal corrective context derived from evidence. |
| **Proof** | Final gate: task tests pass and regression suite passes (or explicit failure record). |

---

## Failure Classes

### Provider / infrastructure (not model blame)

| Class | Meaning |
|-------|---------|
| `PROVIDER_RATE_LIMIT` | HTTP 429, quota, `FreeUsageLimitError` |
| `PROVIDER_ERROR` | Other API/provider errors |
| `AUTH_ERROR` | 401/403, invalid credentials |
| `NETWORK_ERROR` | Connection, DNS, transport failures |
| `TIMEOUT` | Subprocess or execution timeout |
| `INFRA_FAILURE` | Docker, image, harness environment failure |

### Model / output

| Class | Meaning |
|-------|---------|
| `EMPTY_OUTPUT` | No patch produced; no provider failure detected |
| `PATCH_INVALID` | Patch malformed or fails apply-check (harness may label `MODEL_OUTPUT_INVALID`) |
| `WRONG_FILE` | Patch targets file(s) not implicated by failing tests |

### Verification

| Class | Meaning |
|-------|---------|
| `TEST_FAILURE` | FAIL_TO_PASS tests still fail after apply |
| `REGRESSION` | PASS_TO_PASS tests break |
| `OTHER` | Unclassified verification outcome |

---

## Experiment Arms (Phase 2D)

| Arm | Description |
|-----|-------------|
| **Baseline** | 1 pi call → 1 full swebench eval → no retry |
| **Current** | Full suite eval → generic 800-char tail → full-context retry (≤2 retries) |
| **Layered** | Cheap apply-check → targeted FAIL_TO_PASS → regression; structured feedback per layer |

---

## Gates

| Gate | Threshold |
|------|-----------|
| **T1** (product) | ≥10pp success at ≤2× cost/latency, regression ≤ baseline, n≥30 |
| **Phase 2D design** | Layered recovery > current; median tokens ≤1.5× baseline; median latency ≤1.5× baseline |

---

## Product Forms (planned, not shipped)

| Term | Meaning |
|------|---------|
| **lace-ledger** | MCP server — JSONL evidence/Pareto logging |
| **lace-gate** | Claude Code plugin — verification hooks |
| **lace-herdr** | Optional Herdr deployment variant |
