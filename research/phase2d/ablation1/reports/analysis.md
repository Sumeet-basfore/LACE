# Phase 2D Ablation 1 — Analysis (pre-run)

**Status:** IMPLEMENTED — awaiting execution  
**Manifest hash:** `d0ecdb63ad1fc3ae`  
**Protocol hash:** `d8d2aabc3c5b20a4`

## Experimental setup

- **FACT:** Harness supports 4 arms: baseline, current, minimal, structured.
- **FACT:** 10 new Lite tasks, 10 unique repos, all prior LACE tasks excluded.
- **FACT:** Validation tests added; full run not started (quota preserved).

## Results table

| Task | Baseline | Current | Minimal | Structured |
|------|----------|---------|---------|------------|
| *(pending)* | | | | |

## Recovery analysis

*(pending run)*

### Q1. Does Current reproduce its Batch 1 advantage?

*(pending)*

### Q2. First-attempt vs recovery?

*(pending — compare `initially_resolved` vs `recovered` per arm)*

### Q3. Minimal preserves improvement at lower cost?

*(pending)*

### Q4. Structured vs Minimal?

*(pending)*

### Q5. Cheapest recovering feedback payload?

*(pending — compare `feedback_bytes` on recovered tasks)*

### Q6. Failure classification useful?

*(pending)*

### Q7. Causal primitive?

*(pending)*

## Token/latency analysis

*(pending)*

## Failure taxonomy

*(pending)*

## Ablation interpretation

*(pending)*

## What remains unproven

- **HYPOTHESIS:** Current Batch 1 advantage is reproducible on a fresh 10-task manifest.
- **HYPOTHESIS:** Minimal feedback can match Current recovery at lower token cost.

## Recommended next experiment

*(pending results)*

## GO / CONTINUE / KILL (recovery-policy hypothesis)

**DECISION (pre-run):** CONTINUE — execute Ablation 1 when quota available; do not scale or prototype until analysis completes.

---

*Update this file after `python3 research/phase2d/harness.py ablation1` completes.*
