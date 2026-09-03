<!-- GENERATED ARTIFACT — COPIED FROM CANONICAL SOURCE -->
<!-- Canonical Source: docs/core/measurement-contract.md -->
<!-- Category: core-model -->
<!-- Synchronization: scripts/export_research.py -->

# LACE Measurement Contract (Conceptual)

**Status:** HYPOTHESIS — conceptual model only. Not implementation. Not benchmark.
**Date:** 2026-09-03 · **Track:** C — Core Model + Measurement Contract
**Predecessors:** `docs/core/concepts.md`, `docs/core/lifecycle.md`, `docs/core/event-model.md`, `docs/core/recovery-policy.md`
**Terminology:** `context/terminology.md` · **Decisions:** D-001–D-010 (`context/decisions.md`)
**Constraint:** Do NOT invent final numerical thresholds beyond those already defined by the research program. Mark unresolved values as HYPOTHESIS.

---

## 1. Purpose

Define the *measurement contract* — what must be measured, how it is computed, and what thresholds (if any) are gates for progression. This contract binds the experiment harness, the evaluation pipeline, and any future product telemetry to a common vocabulary.

---

## 2. Primary Metrics (must be computed for every task)

### 2.1 Outcome Metrics

| Metric | Symbol | Definition | Type | Gate Reference |
|---|---|---|---|---|
| **Initial Success** | `S₁` | Task resolved on Attempt 1 (Verification → PROVEN) | Binary (0/1) | T1 numerator |
| **Recovery Success** | `Sᵣ` | Task resolved on Attempt 2 or 3 (after ≥1 retry) | Binary (0/1) | T1 numerator |
| **Final Resolved** | `S` | `S = S₁ ∨ Sᵣ` — task ultimately PROVEN | Binary (0/1) | T1 primary |
| **Regression** | `R` | Any `PASS_TO_PASS` test failing post-patch vs baseline | Binary (0/1) | T1 guardrail (R=0 required) |

**Accounting rules:**
- `S₁` and `Sᵣ` are mutually exclusive (a task resolves on first attempt OR on recovery, not both).
- `S = 1` iff final Outcome = `PROVEN` (per lifecycle.md).
- `R = 1` iff Layer 3 regression check detects any baseline `PASS_TO_PASS` failure.
- Provider/infra stops (`STOPPED`) count as `S = 0`, `R = 0` — excluded from recovery-rate denominator per D-008.

### 2.2 Cost Metrics

| Metric | Symbol | Definition | Unit | Gate Reference |
|---|---|---|---|---|
| **Token Cost (per attempt)** | `Cₜ⁽ⁿ⁾` | Total tokens (input + output + cache) for Attempt n | Integer | Cost guardrail |
| **Token Cost (per task)** | `Cₜ` | `Σₙ Cₜ⁽ⁿ⁾` across all attempts for task | Integer | T1 denominator (≤2× baseline) |
| **Latency (per attempt)** | `L⁽ⁿ⁾` | Wall-clock time for Attempt n (including verification) | Seconds | Latency guardrail |
| **Latency (per task)** | `L` | `Σₙ L⁽ⁿ⁾` | Seconds | T1 denominator (≤2× baseline) |
| **Verification Duration** | `V⁽ⁿ⁾` | Time spent in verification layers for Attempt n | Seconds | Component of L⁽ⁿ⁾ |

**Cost accounting rules (DECISION D-008):**
- Provider/infra stops: `Cₜ⁽ⁿ⁾ = 0`, `L⁽ⁿ⁾ = 0` for that attempt.
- Cache tokens (`cacheRead`) counted in `Cₜ` — they represent real provider cost.
- Baseline cost = cost of single Attempt 1 with no recovery (current arm behavior).

### 2.3 Process Metrics

| Metric | Symbol | Definition | Type | Gate Reference |
|---|---|---|---|---|
| **Retry Count** | `Nᵣ` | Number of retries (0, 1, or 2) | Integer | Global cap = 2 |
| **Failure Class** | `F` | Primary failure label for final attempt (or first if STOPPED) | Categorical | Stratification |
| **Evidence Size** | `E` | Total chars of structured evidence sent in recovery prompts | Integer | Minimization target |
| **Human Intervention** | `H` | Whether human manually fixed/merged (1) or fully automated (0) | Binary | T2 target (H=0) |

---

## 3. Secondary Metrics (computed per task, aggregated across manifest)

### 3.1 Per-Task Derived

| Metric | Symbol | Formula | Interpretation |
|---|---|---|---|
| **Recovery Rate** | `ρ` | `Sᵣ / (S₁ + Sᵣ)` for resolved tasks | Fraction of successes that needed recovery |
| **Token Overhead** | `Ωₜ` | `Cₜ / Cₜ_baseline` | Cost multiplier vs single-attempt baseline |
| **Latency Overhead** | `Ωₗ` | `L / L_baseline` | Latency multiplier vs baseline |
| **Cost-Adjusted Resolution** | `CAR` | `S / Ωₜ` | Resolution per unit cost |
| **Regression-Adjusted Resolution** | `RAR` | `S × (1 - R)` | Resolution penalized by regression |

### 3.2 Aggregate (across manifest of n tasks)

| Metric | Symbol | Formula | Gate Reference |
|---|---|---|---|
| **Initial Success Rate** | `S₁_rate` | `Σ S₁ / n` | Baseline capability |
| **Recovery Success Rate** | `Sᵣ_rate` | `Σ Sᵣ / n` | Recovery capability |
| **Final Resolution Rate** | `S_rate` | `Σ S / n` | **T1 primary: ≥ baseline + 10pp** |
| **Regression Rate** | `R_rate` | `Σ R / n` | **T1 guardrail: ≤ baseline** |
| **Median Token Overhead** | `Ωₜ_median` | `median(Ωₜ)` | **T1 cost: ≤ 2×** |
| **Median Latency Overhead** | `Ωₗ_median` | `median(Ωₗ)` | **T1 latency: ≤ 2×** |
| **Recovery Rate (conditional)** | `ρ_cond` | `Σ Sᵣ / Σ (S₁ + Sᵣ)` | Efficiency of recovery |
| **Pass@k** | `pass@k` | Fraction of tasks resolved within k attempts | **T1: pass@3 ≥ target** |

---

## 4. Statistical Requirements

### 4.1 Confidence Intervals
- All rates reported with **Wilson 95% CI** (binomial proportion).
- All medians reported with **bootstrap 95% CI** (10,000 resamples).
- Overhead ratios reported with **Fieller's method** or log-transformed bootstrap CI.

### 4.2 Sample Size (per research program)
- **Phase 2D design gate (D-010):** n=7 per arm (clean, quota-guarded).
- **T1 product gate:** n≥30 **Verified** tasks (per `context/brain.md`).
- **Rolling split:** Tasks partitioned into rolling windows (e.g., 70/30 temporal) for overfit detection.

### 4.3 Non-Inferiority (Regression)
- **Null:** `R_rate_new - R_rate_baseline > δ` (δ = 0, i.e., regression non-inferior).
- **Test:** One-sided Wilson CI for difference in proportions.
- **Requirement:** Upper bound of 95% CI ≤ 0.

### 4.4 Superiority (Resolution)
- **Null:** `S_rate_new - S_rate_baseline ≤ 0.10`
- **Test:** One-sided Wilson CI for difference in proportions.
- **Requirement:** Lower bound of 95% CI ≥ 0.10.

---

## 5. Measurement Contract per Arm (Ablation 1)

Each arm (baseline, current, minimal, structured) must produce identical measurement schema:

### Per-Task Record (JSONL line)
```json
{
  "task_id": "phase2d-repo__task-1234",
  "arm": "structured",
  "manifest_hash": "sha256:...",
  "protocol_hash": "sha256:...",
  "model": "muse-spark-1.2-contributor-free",
  "provider": "opencode",
  "attempts": [
    {
      "n": 1,
      "outcome": "TEST_FAILURE",
      "failure_class": "TEST_FAILURE",
      "confidence": "HIGH",
      "evidence": {"test": "test_foo", "assertion": "...", "traceback": "...", "hunk": "..."},
      "recovery_action": "targeted_retry",
      "verification_required": "L2_then_L3",
      "tokens": 45231,
      "latency_s": 87.3,
      "layer_reached": 2,
      "tokens_breakdown": {"input": 12000, "output": 3000, "cacheRead": 30231}
    },
    {
      "n": 2,
      "outcome": "PROVEN",
      "failure_class": null,
      "confidence": null,
      "evidence": null,
      "recovery_action": null,
      "verification_required": null,
      "tokens": 38102,
      "latency_s": 72.1,
      "layer_reached": 3,
      "tokens_breakdown": {"input": 15000, "output": 2500, "cacheRead": 20602}
    }
  ],
  "final_outcome": "PROVEN",
  "S1": 0,
  "Sr": 1,
  "S": 1,
  "R": 0,
  "Nr": 1,
  "F": "TEST_FAILURE",
  "Ct": 83333,
  "L": 159.4,
  "E": 1247,
  "H": 0,
  "timestamp_start": "2026-09-03T14:22:10Z",
  "timestamp_end": "2026-09-03T14:24:49Z",
  "run_id": "phase2d-ablation1-20260903-001"
}
```

### Required Fields (all arms)
| Field | Required | Notes |
|---|---|---|
| `task_id` | YES | Unique per task |
| `arm` | YES | One of: baseline, current, minimal, structured |
| `manifest_hash` | YES | Frozen manifest hash (D-009) |
| `protocol_hash` | YES | Frozen protocol hash (D-010) |
| `model` / `provider` | YES | Frozen per D-009 |
| `attempts[]` | YES | Full detail per attempt |
| `final_outcome` | YES | PROVEN / FAILED / STOPPED |
| `S1, Sr, S, R, Nr, F` | YES | Primary + process |
| `Ct, L, E, H` | YES | Cost + process |
| `timestamp_start/end` | YES | ISO 8601 UTC |
| `run_id` | YES | Unique per experiment run |

---

## 6. Gate Definitions (from context/brain.md + decisions)

| Gate | Name | Criteria | Status |
|---|---|---|---|
| **D-010** | Phase 2D Design Gate | Layered > Current at ≤1.5× cost/latency, regression non-inferior, n=7 clean | PENDING (quota) |
| **T1** | Product Gate | ≥10pp resolution gain at ≤2× cost/latency, regression ≤ baseline, n≥30 Verified, Wilson non-overlap + rolling split | HYPOTHESIS |
| **T2** | HerdrDelta Gate | >30% time-to-green or >50% fewer interventions, n≥20 | HYPOTHESIS |
| **T3** | Local-Mandatory Gate | ≥40% orgs require local verification (5 interviews + policy review) | HYPOTHESIS |
| **T4** | Replication Gate | Measured 2-week replication spike (desk estimate only currently) | HYPOTHESIS |

---

## 7. Unresolved Values (HYPOTHESIS — to be calibrated)

| Value | Current Assumption | Calibration Method |
|---|---|---|
| **Minimal evidence payload** | test name + assertion + file:line + 20-line traceback + hunk + file stub | Ablation 1 arm variants (minimal vs structured) |
| **Reviewer cost/benefit** | ~20k tokens; pays off if prevents 1 full-context retry | Ablation 1 (WRONG_FILE class) |
| **Timeout reshaping factor** | 0.5× context, 0.7× timeout | Ablation 1 (TIMEOUT class) |
| **Retry cap optimality (1 vs 2)** | TEST_FAILURE=2, others=1 | Ablation 1 + T1 |
| **Evidence budget (chars)** | ≤2000 per recovery prompt | Measurement contract E field |
| **Context budget (tokens)** | ≤50k input per recovery attempt | Measurement contract Ct per attempt |
| **Verification timeout (L1/L2/L3)** | 10s / 120s / 300s | Sandbox profile + empirical |
| **Regression non-inferiority δ** | 0 (strict) | T1 guardrail |

---

## 8. Data Provenance Requirements

Every measurement record must carry:

1. **Task identity:** `task_id` (from frozen manifest)
2. **Configuration identity:** `manifest_hash`, `protocol_hash` (D-009, D-010)
3. **Model identity:** `model`, `provider` (frozen per D-009)
4. **Temporal identity:** `timestamp_start`, `timestamp_end`, `run_id`
5. **Arm identity:** `arm` (baseline/current/minimal/structured)
6. **Classifier version:** `classifier_version` (for failure_class reproducibility)

**Contamination handling (D-007):**
- Records from contaminated runs (provider 429 misclassified) are **discarded**, not patched.
- New run with clean quota produces new `run_id`.
- Manifest/protocol hashes unchanged; only `run_id` and timestamps differ.

---

## 9. Reporting Standard (for synthesis reports)

Every synthesis report (e.g., `research/reports/13-validation-interim-synthesis.md`) must include:

| Section | Required Content |
|---|---|
| **Primary outcomes** | `S_rate`, `R_rate`, `Ωₜ_median`, `Ωₗ_median` with 95% CIs |
| **Per-arm breakdown** | Table with all primary/secondary metrics per arm |
| **Failure class distribution** | Counts + rates per class per arm |
| **Recovery analysis** | `ρ_cond`, `CAR`, `RAR`, retry count histogram |
| **Statistical tests** | Non-inferiority (regression), superiority (resolution) p-values + CIs |
| **Cost breakdown** | Token composition (input/output/cacheRead) per attempt |
| **Limitations** | Sample size, contamination, quota, selection bias |

---

## 10. What This Contract Does Not Define

- Product pricing, packaging, or SLA.
- Dashboard UI, alerting, or visualization.
- Longitudinal tracking across model versions (future work).
- Cross-task generalization metrics (future work).
- Security metrics (redaction recall, sandbox escape) — see Track B.

---

## Provenance

- Derived from: `context/brain.md` (gates T1–T4), `context/decisions.md` (D-001–D-010), `context/terminology.md`, `context/experiment-rules.md`
- Phase 2D results: `research/reports/07-phase2d-batch1-results.md`
- Core model: `docs/core/concepts.md`, `docs/core/lifecycle.md`, `docs/core/event-model.md`, `docs/core/recovery-policy.md`
- Measurement labels: FACT | EVIDENCE | INFERENCE | HYPOTHESIS | DECISION per `context/terminology.md`