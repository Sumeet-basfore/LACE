# R003 — Open Questions

> Gaps, missing evidence, contradictions, and follow-ups. Each item notes what was searched and the status.

## Unanswered / Missing Evidence

1. **Controlled SWE-bench multi-vs-single A/B** — *No reliable evidence found.*
   - Searched: arXiv HTML search for "multi-agent SWE-bench", DuckDuckGo filtered to arXiv, MetaGPT/ChatDev papers' benchmarks (they use HumanEval/MBPP/SRDD/SoftwareDev, not SWE-bench).
   - Gap: Need same-model, same-prompt, same-toolset comparison on SWE-bench (or SWE-bench-Lite/Verified) reporting resolved%, cost, latency, with n and CIs. AutoGen/SWE-agent/OpenHands leaderboards are not controlled A/B.
   - Follow-up: Run internal A/B on SWE-bench-Lite (n≥30) with single-agent baseline vs 2-role vs 3-role SOP variant.

2. **Quantitative cost vs quality Pareto with CIs** — *Partial evidence only.*
   - Found: point estimates (E01 Table 3, E02 Table 1) but no variance, no CIs, inconsistent task sets.
   - Gap: Token per resolved task, latency P50/P95, failure rate, regression rate (did fix introduce new test failures?), human-intervention rate — none reported with error bars.
   - Follow-up: Define LACE metrics harness and report Pareto frontier.

3. **File ownership / parallel coding / coordination under concurrency** — *No reliable evidence found.*
   - Searched: task scope items (file ownership, parallel coding, task graphs, agent-to-agent comms) across E01-E07 — only sequential phased workflows found; no sharded parallel workers with merge analysis.
   - Gap: Does parallel file-sharded execution help or cause merge conflicts/race conditions? What locking (optimistic vs pessimistic, Git worktrees, CRDTs) works?
   - Follow-up: Prototype worktree-per-agent experiment; measure conflict rate and rework cost.

4. **Regression rate and long-horizon maintenance** — *No reliable evidence found.*
   - Papers note prototype-scale ceiling and low information density but do not measure regression (post-fix test failures on unrelated files) or maintainability over multiple iterations.

5. **Human intervention rate** — *No reliable evidence found.*
   - Papers report "human revision cost" (E02 Table 1, 0.83-2.25 scale) but not intervention frequency or time-to-fix when agent stalls.

6. **Task-graph vs shared-context ablation** — *Partial.*
   - E03/E04 show topology matters (irregular DAG > regular, RL orchestrator > static), but no isolated A/B of "shared global context vs partitioned per-agent context" on same coding benchmark.

7. **Decentralized vs hierarchical vs flat** — *Open.*
   - Evidence covers hierarchical (MetaGPT assembly line) and centrally orchestrated (Puppeteer) but no clean decentralized (peer-to-peer) vs hierarchical controlled comparison on coding.

## Contradictions Needing Resolution

- **SRDD (ChatDev wins) vs SoftwareDev (MetaGPT wins)** — each uses own benchmark/metrics; needs neutral benchmark (SWE-bench or MultiAgentBench coding split) with blind human eval.
- **Scaling logistic growth (E03) vs linear cost blowup (E01/E02)** — likely reconciled by topology controls; needs cost-aware scaling curve on same task suite from 1→10→100 agents.

## Follow-Up Ideas (out of scope, parked here)

- Evaluate Puppeteer RL orchestrator reproducibility on LACE tasks — does learned policy transfer across task types or overfits?
- Test communicative dehallucination (E01) as standalone plug-in to single-agent loop — may capture most gain without full multi-agent overhead (INFERENCE to test).
- Survey community sentiment (Reddit/HN/Discord) on multi-agent DX — anecdotal only, but useful for adoption risk (not done in-session; treat as OPINION source).
- Contamination check: are SRDD/HumanEval tasks in GPT-4 training data? Affects delta interpretation.
- Token accounting: include tool-call tokens (exec feedback) vs pure generation tokens — papers mix these.

## What Would Change Confidence to High

- Independent replication of E01/E02 tables on third-party task set with preregistered metrics.
- Single blind human rating with inter-rater agreement reported, plus automated test-pass oracle.
- Same-model A/B with ≥50 tasks, reported with Wilson CIs and cost breakdown.

## Search Log (for audit)

- 2026-09-02: Fetched E01/E02 via curl + HTML table extraction; verified abstracts via og:description.
- 2026-09-02: Fetched E03-E05 via arXiv /abs/; E06/E07 via raw.githubusercontent.
- 2026-09-02: Attempted arXiv API query and DuckDuckGo HTML search — limited parsing; switched to direct ID fetch for reliability.
- 2026-09-02: No web-search-tool available; did not spawn agents per constraint; all gaps explicitly labeled.
