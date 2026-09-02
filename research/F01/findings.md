# F01 — Findings

Labels: **FACT** verifiable · **EVIDENCE** data point · **INFERENCE** conclusion · **HYPOTHESIS** untested · **OPINION** stakeholder judgment
Confidence: High / Medium / Low per finding

## Context Loss / Context Management

- **EVIDENCE** — 4 of 67 GitHub sources (6% of corpus) explicitly address context-window detection, truncation, or File Not Found repo understanding failures: cline #12876 (context-window detection), #13693 (budgeted truncation), #13297 (hook contextModification), #13723 (File Not Found). [evidence #01-04]
- **EVIDENCE** — HN comment describes context loss as blocking real feature work, not toy tasks: "Small tasks work fine... But when I tried building something real... difficult to keep an agent like Claude Code on track" [H01] — 1 report, but High severity language.
- **INFERENCE** — Prevalence in corpus (6%) understates severity. Our query underestimated category because many context failures surface as hallucination/regression rather than title containing "context". Medium confidence.
- **HYPOTHESIS** — "Beads memory upgrade" workflow [H04] implies users build external state to compensate — suggests harness-layer mitigation is possible. Needs validation via usage count.
- **OPINION** — Users attribute long-horizon failure to harness vs model differently: "not a model problem but a Claude Code harness problem" [H02].

## Hallucination / Unreliable Edits (n=6, 9%)

- **FACT** — Aider PR #5112 explicitly fixes "doubled-prefix hallucinations in edit-block headers" [evidence #05]. Verifiable.
- **EVIDENCE** — 6 sources show hallucination-adjacent tool misuse: Continue #13076 (edit_existing_file crashes), pilot #13000 (tool calling redesign), Cline #12977 (unknown MCP tool forwarded → opaque error), Aider #5662 (filename misses when fenced blocks indented), Continue #13092 (malformed tool args → vLLM 400). [evidence #06-10]
- **EVIDENCE** — HN comment reports model links to docs that "doesn't state what it claims is stated" and blames environment for compiler error, predicting "endless feedback loop that eats millions of tokens" in agent harness [H03].
- **INFERENCE** — Hallucination splits: model invents content (doubled prefix, file mis-detection) vs harness forwards invalid tool names without validation. Latter is harness-solvable (validation gate). Medium-High confidence.

## Verification Burden

- **EVIDENCE** — 14 of 67 sources (21%) concern verification/approval/steerability: Cline #13753 ("BE HELPFUL AND PROACTIVE" directive), Continue #13101 ("asks permission for every access"), Aider #5610 (--auto-test docs), Cline #13678 (keep Stop available), #13652 (Hub-managed plugins), Continue #13155 (cryptographic ledger), plus duplicate system_reminder fixes (#58-59). [evidence #54-67]
- **EVIDENCE** — Opposite poles coexist: users complain about over-proactivity (#13753) and over-permissiveness (#13101). Contradiction indicates preference heterogeneity, not absence of burden.
- **INFERENCE** — High prevalence (21% — most frequent in corpus) is inflated by feature PRs counted as evidence of gap (they exist to add verification). True pain may be lower. Still, 3 open issues explicitly name verification friction. Medium confidence.

## Regression

- **EVIDENCE** — 7 sources (10%): Aider #3581 (discards all changes on add file, 4 comments), #3965 (rolls back manual changes), #4153 (architect cannot delete), plus fixes stabilizing terminal capture (#13138) and env preservation (#5640). [evidence #11-17]
- **INFERENCE** — Regressions reported as state-management bugs (adding file discards changes) are harness-solvable via file-ownership locks and worktree isolation. Medium confidence.

## Loops / Hangs / Stuck Agents

- **EVIDENCE** — 5 sources (7%): Cline #13750 (PLAN hangs indefinitely with Ollama, no logs), #13714 (degenerate output loops + garbled tool results), #13492 (repeated ReportFindings loop, 6 comments), opencode #285 (JetBrains MCP freeze on startup). [evidence #18-22]
- **FACT** — All 5 are from 2026 recent issues, 3 with explicit "hang"/"freeze"/"loop" in title. Verifiable.
- **INFERENCE** — Despite modest 7% prevalence, severity is High: hangs block usage entirely and produce no error signal. Loops waste tokens (H03: "eats millions of tokens"). Medium-High confidence that category is product-grade.
- **HYPOTHESIS** — Ollama-local hangs suggest resource/timeout handling gap, not purely model.

## Cost / Latency

- **EVIDENCE** — 11 sources (16%): Continue #13184 (pricing 15-300x over list), opencode #253 (High Token Usage with Gemini 2.5 Flash), #340/#349 (provider config errors), zed #63587 (streaming closed), plus Gemini/Claude Azure routing PRs. [evidence #23-33]
- **EVIDENCE** — Quantitative: #13184 claims "15x to 300x over list" for gpt-4.1 family — unverified against pricing page but verbatim in issue. Treat as anecdotal, not benchmark.
- **INFERENCE** — Cost/latency appears as both pricing bugs (harness maps model to wrong SKU) and true token blowup (reasoning models). Former is harness-solvable (correct pricing table), latter is model+prompt discipline. Low confidence on magnitude without F02 bench.

## Progress Visibility / Steerability

- **EVIDENCE** — 6 sources (9%): opencode #46734 ("TUI: no progress signal while tool-call arguments stream"), #46733 ("SSE delivers only heartbeats — no message events"), Cline #13688 (TUI architecture extraction), #13719 (text flashing). [evidence #34-39]
- **EVIDENCE** — Two independent products (cline, opencode) report same "no progress while streaming" symptom — cross-repo recurrence suggests systemic harness gap, not one-off bug.
- **INFERENCE** — Progress visibility is almost entirely harness-layer (TUI/SSE). High confidence harness-solvable.

## Privacy / Credential Trust

- **EVIDENCE** — 14 sources (21% — tied most frequent): Cline #13737 (trust verification for Agent Plugin MCP), Continue #13212 (Universal Trust Adapter), Aider #5665 (same), #5621 (telemetry ships unredacted URLs/paths), #5622 (.env override=True silently replaces shell vars), Continue #12492 (governance proxy, 6 comments), Cline #13676 (OAuth hardening), opencode #167 (permission checks), Continue #9327 (allowHeadless, 11 comments). [evidence #40-53]
- **INFERENCE** — Co-occurrence of identical trust-adapter proposals in 3 repos (Cline, Continue, Aider) in same week (2026-09-01) signals community-acknowledged enterprise blocker, not isolated complaint. High confidence that privacy/trust is product-grade, but severity is enterprise-niche not hobbyist.
- **OPINION** — Users propose opt-in verification layer; no evidence of demand magnitude beyond proposals.

## Cross-Cutting Questions

1. **Which recur most often? (corpus prevalence)** — **FACT** In this 67-issue coding-agent corpus: verification_burden 21% (14), privacy_trust 21% (14), cost_latency 16% (11) are most frequent by count. Loops/hangs 7%, context_loss 6%, hallucination 9%, regression 10%, progress 9% are less frequent. *Do not extrapolate to population % — distribution reflects query construction and inclusion of fix PRs.* [EVIDENCE]

2. **Which appear most severe?** — **INFERENCE** Severity ranking by consequence (not count): loops/hangs (blocks use, no recovery signal) = High; hallucination + regression (silent incorrect edits, rollback of manual work) = High; privacy/telemetry leaks (#5621 unredacted) = High for enterprise; context loss (long-horizon failure [H01]) = High for value proposition despite low count. Cost/verification/progress are Medium severity (annoyance/cost, not data loss). Medium confidence.

3. **Directly solvable at harness layer?** — **INFERENCE** High harness-solvability: progress visibility (TUI/SSE buffering), loops/hangs (timeout, stop, loop detection), verification burden (permission gates, auto-test, stop button), privacy/trust (MCP proxy, allowHeadless, OAuth validation, .env override fix, telemetry redaction), context management (truncation limits, repo-map, hook delivery). Partial: hallucination (harness can validate tool names/paths but not model invention), regression (worktrees + tests), cost (pricing table vs token blowup is split). High confidence on progress/privacy/loops; Medium on hallucination.

4. **Model vs harness limitations?** — **INFERENCE** Model-limited: core hallucination (doubled prefix invention, doc fabrication [H03]), reasoning token blowup. Harness-limited: forwarding unknown tools (#12977), missing progress signal (#46734), hangs without logs (#13750), permission spam (#13101), credential/MCP trust missing, truncation re-apply (#13693). Hybrid: context loss — model window + harness trimming. Users themselves attribute to harness [H02]. Medium-High confidence.

5. **Enough evidence to call one or more product-grade problems?** — **EVIDENCE/INFERENCE** Yes, for ≥4 categories with cross-repo recurrence and blocking consequence: loops/hangs (5 repos/reports), hallucination/tool misuse (6, cross-repo), regression/state loss (7), privacy/trust (14 with identical proposals across 3 repos). Each has multiple primary-source GitHub issues and is directly referenced in R002/R005 independent sample, so convergent validity. **But** broader demand (how many of 10M users are blocked vs annoyed) remains unmeasured — no n>100 survey found. So "product-grade" = validated existence + severity for affected users, not market sizing. Confidence: Medium-High for existence/severity in corpus; Low for population demand. Say "No reliable evidence found" for population prevalence.

## Contradictions Handled

- Cline #13753 wants less proactivity vs Continue #13101 wants less permission friction — weighted as preference heterogeneity, not contradictory evidence against verification burden.
- HN H02 says deterioration is harness not model — we weight with hierarchy 9 anecdotal vs primary GH issues; treat as hypothesis not fact.
- Cost: #13184 says 15-300x pricing error (anecdotal single issue) vs no pricing page verification — weight low, need F02.

## Confidence Summary

- High: loops/hangs existence, privacy/trust enterprise blocker, progress visibility harness gap, verification burden existence
- Medium: hallucination harness vs model split, regression causality, context loss severity despite low count
- Low: any population prevalence, cost magnitude, whether users will pay for fix
