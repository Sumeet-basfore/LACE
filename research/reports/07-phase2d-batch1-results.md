# Phase 2D Batch 1 — Design Experiment Results

**Date:** 2026-09-03  
**Scope:** 5 new SWE-bench Lite tasks × 3 arms (baseline / current / layered)  
**Model:** `muse-spark-1.2-contributor-free` via OpenCode (frozen)  
**Manifest:** `research/phase2d/batch1-manifest.json`  
**Manifest SHA-256:** `1e59b390486591347440bfabdf6684b2bc6477c96fab2e6f1657fe235f237d73` (short: `1e59b39048659134`)  
**Output:** `research/phase2d/raw-batch1/`  
**Prior gate:** Tasks 1–2 integrity gate **PASS** (`research/phase2d/analysis/batch1-integrity-gate-tasks1-2.md`)

---

## 1. Experiment setup

| Parameter | Value |
|-----------|-------|
| Dataset | SWE-bench Lite (`test` split) |
| Tasks (frozen order) | `astropy__astropy-14365`, `django__django-11019`, `matplotlib__matplotlib-23299`, `mwaskom__seaborn-3190`, `pallets__flask-5063` |
| Selection | Lexicographically smallest unused instance per repo after Phase 2B/2C/2D exclusions; then 5 lexicographically smallest picks |
| Arms | **Baseline** — 1 pi call → full SWE-bench eval, no retry. **Current** — full eval → generic 800-char tail → up to 3 attempts. **Layered** — `git apply --check` → targeted FAIL_TO_PASS pytest → targeted prompt retry → regression PASS_TO_PASS |
| Harness | `python3 research/phase2d/harness.py batch1` (resume-safe) |
| Integrity | Unique `evaluation_run_id` per full eval; `evaluation_fresh=true` required; provider failures fail-closed |
| Patch normalization | EOF newline append active (`patch_normalized` on extracted patches) |

**FACT:** Canonical `research/phase2d/manifest.json` (7 tasks) was **not** modified. Batch 1 uses a separate frozen manifest.

---

## 2. Per-task results

| Task | Baseline | Current | Layered |
|------|----------|---------|---------|
| **astropy__astropy-14365** | ✗ TEST_FAILURE (1 att, 200k tok, 346s) | ✓ NONE (1 att, 195k tok, 162s) | ✗ TEST_FAILURE (3 att, 586k tok, 426s) — **targeted** |
| **django__django-11019** | ✗ TEST_FAILURE (1 att, 199k tok, 308s) | ✗ TEST_FAILURE (3 att, 590k tok, 377s) | ✗ **TIMEOUT** (1 att, 0 tok, 300s) — provider |
| **matplotlib__matplotlib-23299** | ✓ NONE (1 att, 199k tok, 587s) | ✓ NONE (2 att, **recovered**, 384k tok, 407s) | ✗ MODEL_OUTPUT_INVALID (3 att, 605k tok, 498s) — **apply_check** |
| **mwaskom__seaborn-3190** | ✓ NONE (1 att, 211k tok, 339s) | ✓ NONE (1 att, 201k tok, 156s) | ✗ MODEL_OUTPUT_INVALID (3 att, 568k tok, 218s) — **apply_check** |
| **pallets__flask-5063** | ✗ **TIMEOUT** (1 att, 0 tok, 300s) — provider | ✓ NONE (1 att, 214k tok, 376s) | ✗ TEST_FAILURE (3 att, 598k tok, 467s) — **targeted** |

**Evaluation freshness (full-eval arms only):**

| Arm | Full evals run | `evaluation_fresh=true` | `evaluation_cache_hit=false` | Provider-skipped |
|-----|----------------|-------------------------|------------------------------|------------------|
| baseline | 4/5 | 4/4 | 4/4 | 1 (flask TIMEOUT) |
| current | 5/5 | 5/5 | 5/5 | 0 |
| layered | 0/5 | 0 | 0 | 1 (django TIMEOUT); never reached regression full eval |

---

## 3. Per-arm aggregates

| Metric | Baseline | Current | Layered |
|--------|----------|---------|---------|
| **Final success (resolved)** | **2/5 (40%)** | **4/5 (80%)** | **0/5 (0%)** |
| Recovered (baseline fail → arm pass) | 0 | **2** (astropy, flask) | 0 |
| Harness `recovered=true` (current only) | — | 1 (matplotlib attempt 2) | — |
| Provider failures | 1 | 0 | 1 |
| Median tokens (excl. provider) | **199,702** | **214,359** | **591,640** |
| Mean tokens (excl. provider) | 202,342 | 316,854 | 589,035 |
| Median latency (excl. provider) | **342.5 s** | **376.3 s** | **446.2 s** |
| Mean latency (excl. provider) | 395.0 s | 295.6 s | 402.1 s |

**Token ratio vs baseline median (per task, where baseline produced tokens):**

| Task | Current / baseline | Layered / baseline |
|------|-------------------|-------------------|
| astropy | 0.98× | 2.93× |
| django | 2.97× | n/a (provider) |
| matplotlib | 1.93× | 3.03× |
| seaborn | 0.95× | 2.69× |
| flask | n/a | 2.83× |

---

## 4. Success gate evaluation

Design gate from `research/phase2d/protocol.md` (n=5; **not** powered; do not claim statistical significance):

| Criterion | Threshold | Result | Verdict |
|-----------|-----------|--------|---------|
| `recovery_layered > recovery_current` | layered > current | 0% > 80% | **FAIL** |
| `median_total_tokens ≤ 1.5× baseline` (current) | ≤ 299,554 | 214,359 | **PASS** |
| `median_total_tokens ≤ 1.5× baseline` (layered) | ≤ 299,554 | 591,640 | **FAIL** |
| `median_latency ≤ 1.5× baseline` (current) | ≤ 513.7 s | 376.3 s | **PASS** |
| `median_latency ≤ 1.5× baseline` (layered) | ≤ 513.7 s | 446.2 s | **PASS** |
| Regression non-inferior | no lost baseline wins | layered lost 2/2 baseline wins (matplotlib, seaborn) | **FAIL** (layered) |

**DECISION:** Phase 2D design gate **FAILS** on clean Batch 1 data. Layered orchestration does not beat current on recovery, exceeds the 1.5× token budget, and regresses on tasks baseline already solves.

**EVIDENCE:** Current arm **passes** cost/latency gates and improves recovery vs baseline (40% → 80%), consistent with retry helping when full eval + generic feedback is available — but at up to 2.97× tokens on hard failures (django).

---

## 5. Failure taxonomy

| failure_class | Baseline | Current | Layered |
|---------------|----------|---------|---------|
| NONE (resolved) | 2 | 4 | 0 |
| TEST_FAILURE | 2 | 1 | 2 |
| TIMEOUT (provider) | 1 | 0 | 1 |
| MODEL_OUTPUT_INVALID | 0 | 0 | 2 |

**Provider / infra (excluded from model-failure counts):**

- `django__django-11019` [layered]: `provider_failure=TIMEOUT`, 0 tokens, `verification_layer=provider_failure` — pi subprocess stall, not rate-limit contamination.
- `pallets__flask-5063` [baseline]: same pattern; current succeeded on same task immediately after.

**FACT:** No `PROVIDER_RATE_LIMIT` or `AUTH_ERROR` observed. Failure classification behaves as intended post-harness fix.

---

## 6. Layered path utilization

| Task | Deepest layer reached | Notes |
|------|----------------------|-------|
| astropy | **targeted** pytest | Apply-check passed; 3 attempts failed targeted tests; empty `failing_test`/`traceback` fields |
| django | **provider_failure** | No patch produced |
| matplotlib | **apply_check** | `corrupt patch at line 17` after normalization — blocked before Docker |
| seaborn | **apply_check** | `corrupt patch at line 13` — blocked before Docker |
| flask | **targeted** pytest | Apply-check passed; 3 attempts failed targeted tests |

**INFERENCE:** Layered reached targeted pytest on 2/5 tasks (40%) but **never** reached regression full eval (`evaluation_run_id=null` on all layered rows). The apply-check gate blocked 2 tasks where baseline/current both succeeded — a verification disagreement pattern similar to the one-task smoke (EOF normalization fixes git-apply EOF issues but not corrupt/truncated hunks).

**HYPOTHESIS:** Layered’s stricter apply-check rejects patches that SWE-bench’s `patch --fuzz=5` fallback would accept, causing false negatives on matplotlib/seaborn relative to baseline/current full eval.

---

## 7. Interesting cases

### 7.1 Current beats baseline on recovery without blowing cost gate

- **astropy:** baseline fails, current resolves in 1 attempt at 0.98× baseline tokens.
- **flask:** baseline provider TIMEOUT; current resolves in 1 attempt (214k tok).

**INFERENCE:** Retry-capable current arm is net-positive on this batch for recovery (+40 pp) while staying within 1.5× median tokens/latency vs baseline.

### 7.2 Layered loses baseline wins

- **matplotlib** and **seaborn:** baseline resolves on attempt 1; layered fails at apply-check with corrupt-patch errors despite `patch_normalized=true`.

**EVIDENCE:** Aligns with `research/phase2d/analysis/verification-disagreement.md` — harness apply-check is stricter than SWE-bench apply chain.

### 7.3 Django — expensive retry, no recovery

- Current: 3 attempts, 590k tokens (2.97× baseline), still TEST_FAILURE.
- Layered: provider TIMEOUT on attempt 1 (no comparison possible).

**FACT:** Naive full-context retry remains costly on hard tasks; neither arm recovers django on this batch.

### 7.4 Astropy — layered uses targeted path but still fails

- Layered spent 586k tokens across 3 targeted attempts vs current’s 195k single-pass success.

**INFERENCE:** Targeted feedback loop did not outperform current’s full-context single shot on this instance.

---

## 8. Artifact integrity

| Check | Status |
|-------|--------|
| 5 tasks × 3 arms in `raw-batch1/*/result.json` | ✓ 15 rows |
| Manifest hash matches frozen manifest | ✓ `1e59b39048659134` |
| No `evaluation_cache_hit=true` on full evals | ✓ |
| Provider failures marked, zero tokens | ✓ 2 cases |
| Tasks 1–2 gate before 3–5 | ✓ PASS then completed |
| Run log | `research/phase2d/logs/batch1-tasks3-5.log` (tasks 3–5 segment) |

---

## 9. Conclusions (labeled)

| Label | Statement |
|-------|-----------|
| **FACT** | Batch 1 completed: 5 tasks × 3 arms, frozen manifest, clean evaluation plumbing. |
| **FACT** | Recovery rates: baseline 40%, current 80%, layered 0%. |
| **FACT** | Design gate fails: layered ≯ current on recovery; layered median tokens 2.96× baseline median (limit 1.5×). |
| **EVIDENCE** | Current arm passes token/latency gates and improves recovery vs baseline on n=5. |
| **EVIDENCE** | Layered apply-check blocked 2/5 tasks before targeted pytest; targeted pytest ran on 2/5; regression full eval ran 0/5. |
| **INFERENCE** | Stricter pre-Docker apply-check likely causes layered to underperform baseline on patches SWE-bench would accept. |
| **INFERENCE** | Generic full-context retry (current) outperforms layered feedback loop on this model+batch — opposite of Phase 2D hypothesis. |
| **HYPOTHESIS** | Aligning layered final verification with SWE-bench apply semantics (or fuzz fallback) would change matplotlib/seaborn outcomes — needs isolated A/B, not assumed. |
| **DECISION** | Do **not** proceed to powered scale with layered as CORE. Recommend **failure analysis** branch: (1) apply-check vs SWE-bench disagreement ablation, (2) diagnose empty targeted feedback fields on astropy/flask, (3) decide kill vs refine before any n=7 canonical manifest rerun. |

**Do not claim statistical significance** — n=5 design experiment only.

---

## 10. Summary statistics

```
Tasks:           5
Arms:            3 (baseline, current, layered)
Total runs:      15

Resolved:
  baseline:      2/5 (40%)
  current:       4/5 (80%)
  layered:       0/5 (0%)

Median tokens (excl. provider timeouts):
  baseline:      199,702
  current:       214,359  (1.07× baseline)
  layered:       591,640  (2.96× baseline)

Median latency (excl. provider timeouts):
  baseline:      342.5 s
  current:       376.3 s  (1.10× baseline)
  layered:       446.2 s  (1.30× baseline)

Provider failures: 2 (django layered, flask baseline)
Design gate:       FAIL

Recommended next action: FAILURE ANALYSIS — apply-check alignment + targeted feedback quality; do not scale layered to powered run without gate pass on clean n≥7
```

PHASE_2D_BATCH1_COMPLETE
