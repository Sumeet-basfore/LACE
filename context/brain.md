# LACE Project Brain

**Last updated:** 2026-09-03 · **Status:** PIVOT — verification-first extension hypothesis (unproven)

## What LACE Is

LACE is exploring a **verification-first coding-agent harness** focused on:

**specification → execution → verification → evidence → bounded recovery → proof**

It sits around existing agents (not replacing them) and aims to make coding work measurable, reversible, and recoverable when verification fails.

## Current Product Direction (DECISION)

- **Thin host-native extension** — not a standalone platform
- **Verification/recovery core** as the mechanism
- **Likely product forms:** MCP server + Claude Code plugin; optional Herdr integration variant
- **Standalone runtime:** not justified (T4 fails — thin reproduction <2 weeks per F04)

See `docs/05-product-thesis.md` for full thesis; this file is the operational summary.

## Current Experimental Hypothesis (HYPOTHESIS)

Failure-aware **layered verification** can turn verification evidence into minimal, actionable corrective context and recover more failures at acceptable cost/latency — compared to the current approach (full suite → generic feedback → full-context retry).

**Not validated.** Phase 2C partial run showed 0/5 recovery and ~2.97× median token cost for the current approach. Phase 2D (layered design experiment) is pending a clean rerun after harness fix.

## Validated State (EVIDENCE)

| Finding | Source | Label |
|---------|--------|-------|
| Current retry approach: 0/5 recovery, ~2.97× median tokens (powered partial n≈7) | `research/experiment/scale/partial-run.md`, Phase 2C synthesis | EVIDENCE |
| Pilot n=5: mechanism feasible (1 recovery), but CI overlaps — not powered | F02 | EVIDENCE |
| User pains (loops, hallucination, regression, trust) exist in corpus | F01 67 GH issues | EVIDENCE |
| Standalone defensibility fails; extension path survives | F04 | EVIDENCE |
| Phase 2D run contaminated by provider 429 misclassified as EMPTY_OUTPUT | `research/phase2d/analysis/provider-failure.md` | FACT |
| Phase 2D harness fixed to classify provider failures | harness + unit tests | DECISION |

## Epistemic Discipline

Use labels consistently:

| Label | Meaning |
|-------|---------|
| **FACT** | Directly observed (logs, transcripts, committed artifacts) |
| **EVIDENCE** | Measured result from an experiment or corpus |
| **INFERENCE** | Reasoned from evidence |
| **HYPOTHESIS** | To be tested |
| **DECISION** | Project choice, may precede proof |

**Benchmark evidence ≠ product validation.** SWE-bench / Lite results inform design; they do not prove product-market fit.

## Failure Category Separation (DECISION)

These are **different categories** — never conflate in metrics or retries:

- **Provider failure** (429, auth, network) — stop; do not blame model
- **Model failure** (bad/empty patch, wrong file)
- **Verification failure** (tests fail, regression)
- **Infra failure** (Docker, image, harness)

## Design Gates

Do **not** scale experiments before the current design gate passes.

**Phase 2D success gate (design, n=7):** layered recovery > current AND median tokens ≤1.5× baseline AND median latency ≤1.5× baseline AND regression non-inferior. Not powered for significance.

**T1 (product):** ≥10pp at ≤2× cost/latency with regression ≤ baseline at n≥30 Verified. Not met.

## What Not To Do

- Do not run SWE-bench or full benchmarks unless explicitly requested
- Do not change frozen manifest/protocol/model/provider without approval
- Do not present exploratory benchmark results as product validation
- Do not rerun contaminated Phase 2D raw results as valid evidence

## Key Paths

| Path | Purpose |
|------|---------|
| `docs/05-product-thesis.md` | Product direction, gates, kill criteria |
| `docs/01-research.md` | Research record |
| `research/phase2d/protocol.md` | Phase 2D experiment protocol |
| `research/phase2d/harness.py` | Phase 2D harness (provider classification fixed) |
| `docs/06-recovery-model.md` | Conceptual recovery model |
| `context/decisions.md` | Decision log |
| `AGENTS.md` | Rules for coding agents |
