# F01 — Open Questions

## Gaps — No Reliable Evidence Found

- **Population prevalence / market demand:** No n>100 survey, Stack Overflow / Octoverse / JetBrains ranking, or pricing-at-scale data retrieved via API. Corpus prevalence (7-21%) must not be read as population %. What fraction of 10M coding-agent users are blocked vs annoyed? **Follow-up:** run survey n>100 + interviews with 5 regulated enterprises (per T3).
- **Cost/latency magnitude:** Single anecdotal pricing error (#13184: 15-300x) unverified; no measured median token cost or latency for coding tasks. **Follow-up:** F02 bench (A/B same-model single vs multi, n≥30, CIs).
- **Local vs cloud gap & 8GB ceiling:** No hardware rig data; Continue archived signal not quantified. **Follow-up:** F03 8GB rig.
- **Herdr vs tmux delta:** No teardown showing >30% time-to-green or >50% fewer recoveries. **Follow-up:** T2 teardown (n≥20 tasks).
- **Regression/recovery rate:** No benchmark reports regression rate or human-intervention rate (R005 gap persists).
- **Tool-calling design choice:** Continue #13000 proposes redesign but no A/B; unclear which tool schema minimizes hallucination.

## Unanswered (need validation)

- Does fixing harness progress/loop/MCP trust shift context/hallucination as users report [H02], or is that anecdotal?
- Does .env override=True (#5622) and telemetry leak (#5621) cause actual enterprise loss, or just reported concern?
- Are "BE HELPFUL" vs "ask permission" preferences segmentable (enterprise vs hobbyist) or task-dependent?
- Would a Beads-like external memory ([H04]) outperform truncation-limit fixes (#13693) for context loss — which ceiling first?

## Follow-ups

- F02 SWE-bench A/B rig with Pareto scorecard (resolved | regression | cost | time | pass@3 | recovery)
- F03 hardware rig on 8GB vs 16GB+ local
- Wrapper moat spike: can ledger+verification gate be added via MCP in <2 weeks? (T4)
- Re-verify R001 capabilities live (top-5 GH issues per product) before build
- Reddit API authenticated fetch for sentiment diversity (currently HN only)

## Scope-Creep Notes (out of F01 scope, logged here)

- Multi-agent orchestration demand not observed as user request in this corpus; users ask to curb autonomy, not add agents — supports synthesis EXPERIMENTAL verdict. No further pursuit without T1 threshold.
- Editor vs terminal harness preference remains unmeasured.
