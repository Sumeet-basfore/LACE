# A04 — Product / Differentiation Test (is "run tests + retry" product-worthy?)

**Date:** 2026-09-02 · **Lens:** PIVOT thesis — verification-first as thin host-native extension (MCP + Claude plugin + Herdr variant), not standalone · **Evidence:** A01/A02 (current adds cost without recovery), R001/R004/F04 (thin reproduction <100 LOC), existing agent behavior

## What existing agents already do

- **Claude Code, Codex, OpenCode, Aider, Cursor, Windsurf:** all run `git diff` + `pytest`/`npm test` via bash tool, and retry based on tool output — this is standard single-agent loop. Our current verification is *not* differentiated: it's `swebench eval` Docker vs `pytest` directly, but the loop is same.
- **What they don't do:** run FAIL_TO_PASS vs PASS_TO_PASS separately, keep Pareto log (`% resolved | regression | median cost | time | reliability | recovery`), or provide evidence/observability. They also don't do cheap `git apply --check` before Docker.
- **MCP/plugins already provide:** `mcp-server-dev:build-mcp-server` scaffolder shows MCP server 250–350 LOC, Claude hook <100 LOC, Herdr plugin 150–200 LOC (F04). A simple "run tests + retry" plugin is <2 days and already exists as example (`verify` skill). So "run tests + retry" alone is **not moat** — it is a trivial plugin (Outcome 3+2 variant).

## Is the missing value "verification"?

- No — verification *detection* already exists in agents (they run tests). The missing value is **actionable verification**: targeted failing signal + cheap gate + evidence.
- Current candidate's verification is generic (`0 resolved`) — same as what agents already get from `pytest -v`. So it adds no new information.

## Is it "adaptive verification"?

- Possibly — layering cheap → targeted → regression would be adaptive and not trivial. But still, is it product-worthy? It is a better harness, but still a thin extension unless it has observability.

## Is it "evidence + observability"?

- Yes — R005 Pareto scorecard (`% resolved | regression | median cost | median time | reliability | recovery`) is *not* provided by any incumbent (swebench.com shows only % resolved). Our experiment's `result.json` with per-task `task_tests_passed`, `regression_tests_passed`, `token_usage`, `latency_seconds`, `recovered`, `human_intervention` is the differentiator. A04 argues **observability is the product surface**, verification is just the mechanism.

## Is it "recovery" or "cost-aware reliability"?

- Recovery is the outcome, not the product. Cost-aware reliability (≤2× guardrail) is the constraint that makes verification usable. Current violates it (2.97×). A product must be **cost-aware** — otherwise it's just expensive retry.

## What could plausibly become a meaningful product surface?

- **Not:** standalone binary / custom multiplexer / vector DB (R004 kill list) — all duplicates.
- **Thin but meaningful:** `spec → tests → gate (cheap → targeted → regression) → parse (failing test name + file:line) → evidence ledger (JSONL with cost/latency/recovery) → Pareto dashboard` — this is `lace-ledger` MCP + `lace-gate` plugin but with layered verification and observability, not just `run tests + retry`.
- **Variant for Herdr:** same core, but Herdr provides pane lifecycle + snapshot (already 0.8.2) — variant reuses, not rebuilds.

**Test:** Would an external dev clone this in <2 weeks? For current "run tests + retry" — yes, <2 days (F04). For layered + observability — maybe 1 week, but still <2 weeks, so moat is still thin. Therefore product must compete on **evidence quality and cost-awareness**, not on being hard to clone. This is acceptable for PIVOT (thin extension) but not for standalone.

## Verdict

- **Verification alone is not product-worthy** — it's a trivial plugin.
- **Adaptive verification + evidence/observability could be product-worthy as thin extension** (PIVOT) — if it demonstrably improves recovery at ≤1.5× cost with Pareto transparency that incumbents don't provide.
- **Multi-agent remains EXPERIMENTAL** — not needed for this wedge.

