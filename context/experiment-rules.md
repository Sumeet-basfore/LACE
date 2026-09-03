# LACE Experiment Rules

Binding rules for all research experiments. Violations invalidate results.

## Frozen Parameters (require explicit approval to change)

- Model: `muse-spark-1.2-contributor-free`
- Provider: `opencode`
- Phase 2D manifest: `research/phase2d/manifest.json` (7 tasks)
- Phase 2D protocol: `research/phase2d/protocol.md`
- Layered strategy definition in protocol (arms A/B/C)

## Execution Rules

1. **No SWE-bench batch runs** unless explicitly requested.
2. **No Phase 2D full rerun** until harness validated (unit tests + one-task smoke) and provider quota available.
3. **Resume-safe:** harness must support resuming from `raw/*/result.json` without duplicating work.
4. **Same isolation:** Docker per verification attempt; worktree/base_commit from manifest.
5. **Log everything:** transcripts, eval logs, token usage, failure_class, provider_error when applicable.

## Classification Rules

| Category | Action |
|----------|--------|
| Provider failure | Stop retries; do not count tokens; record `provider_failure` + message |
| Infra failure | Do not retry as model failure; flag `infra_failure` |
| Model output failure | May retry with structured feedback (per arm protocol) |
| Verification failure | May retry with evidence-derived feedback (per arm protocol) |

**Provider failure ≠ model failure ≠ verification failure ≠ infra failure.**

## Metrics (Phase 2D)

Record per task: `resolved`, `recovered`, `attempts`, `failure_class`, `verification_layer`, `totalTokens`, `cacheRead`, `latency_seconds`, `pi_latency`, `verification_latency`.

Primary: initial success, recovered failures, final success, recovery rate.  
Efficiency: tokens, cacheRead, latency per layer.  
Guardrails: regression non-inferior; cost/latency ≤1.5× baseline (design gate).

## Contamination Handling

- If provider errors were misclassified, **discard affected raw results** — do not patch metrics in place.
- Document root cause in `research/phase2d/analysis/`.
- Fix harness first; validate with regression tests before rerun.

## Scaling Gate

Do **not** proceed to n=30 powered runs until:

1. Phase 2D design experiment completes on **clean** data, and
2. Design gate evaluated (layered vs current vs baseline), and
3. Explicit decision to scale.

## Reporting Discipline

- Label results FACT / EVIDENCE / INFERENCE / HYPOTHESIS / DECISION.
- n=7 is a **design experiment** — do not claim statistical significance.
- Partial runs must be labeled **exploratory** (see Phase 2C partial-run.md).
- Never present benchmark evidence as product validation.
