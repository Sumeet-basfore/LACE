# R007 Open Questions — Adversarial: Prove LACE Should NOT Be Built

## Gaps Where "No reliable evidence found."

1. **Live API pricing / cost at scale for multi-agent loops** — No pricing page fetch succeeded (JS-rendered; no tavily/exa tool). Cost argument rests on paper token counts (E05–E07) not current $/task. Need: fresh fetch of Anthropic Platform, OpenAI Platform, Cursor/Windsurf pricing + per-model $/1K tokens (2026-09) to convert token premium to $ premium.
   - Searched: direct curl to pricing pages — failed to parse; not in Wave 1 raw.

2. **Controlled same-model multi-vs-single A/B on SWE-bench (Verified/Lite) with cost/latency/failure rate** — R003 E10: "No reliable evidence found." No such A/B surfaced in targeted arXiv/repo search. This is the decisive gap — without it, neither side proves repo-level superiority.
   - Follow-up: Run mini-SWE-agent harness, n≥30, 95% CI, report % resolved | cost | latency | regression.

3. **User survey n>100 ranking "collaboration / persistent state / checkpoints" vs "reliable single-agent"** — R002 had n~15 issues/HN hits, no systematic survey. Demand for differentiation unquantified.
   - Follow-up: Stack Overflow / JetBrains survey splice + 5 buyer interviews.

4. **Quantified local-vs-cloud gap on agentic coding (SWE-bench local submissions)** — R006: No reliable evidence found for benchmark table local vs frontier. Direction inferred, magnitude unknown.
   - Follow-up: Pull SWE-bench leaderboard filtered to local-model submissions; run 3 models (Qwen 2.5 Coder 14B Q4, DeepSeek Coder V2 Lite, GLM 4) on same tasks.

5. **8GB RAM agentic-loop usability (tokens/sec, tool-calling success, context window)** — No reliable evidence found after searching Ollama/LM Studio/Aider docs (R006). Cannot size low-resource machine claim.
   - Follow-up: Hardware rig on 8GB Air/Win (llama.cpp bench).

6. **Herdr vs tmux vs LACE runtime head-to-head** — No teardown measured Herdr's panes/workspaces vs tmux + git worktree + Claude Code. Sufficiency of Herdr is hypothetical.
   - Follow-up: Teardown experiment (n≥10 tasks) measuring time-to-green + interventions.

7. **Enterprise policy corpus size for "block cloud AI" segment** — R006 E07 proves controls exist but not segment size. No 10–15 policy doc corpus collected; GitHub Trust Center / DPA language not parsed (404 on versioned paths).
   - Follow-up: Collect finance/healthcare/defense policies + vendor DPAs (Copilot Enterprise, Cursor, Anthropic ZDR).

8. **Wrapper replication speed** — No experiment measured whether Claude Code/OpenCode can add ledger+gate via MCP in <2 weeks (T4 threshold). Churn risk unmeasured.
   - Follow-up: Time-boxed replication spike.

## Unanswered Questions
- Would a *single-agent + strong verification loop* (no multi-agent) already capture most LACE value? R002 suggests yes; not A/B tested.
- Is "persistent state" valuable because of context loss (R002 #1) or is git-level persistence sufficient? No isolation study.
- Does Puppeteer-style RL orchestrator actually reduce cost enough to flip Pareto? Not replicated locally.
- How much of R001's "gap" (not covering all 5 properties) is user-perceived pain vs analyst conjunction? No buyer interview validated.

## Follow-Up Research Ideas (do not chase now)
- **F01 — Pricing sweep (≤12 mo freshness):** Claude Code, Codex, Cursor, OpenCode, Aider — document plan/tier prices, per-model token cost, and ZDR add-on. Cite with access date.
- **F02 — SWE-bench A/B rig:** Same model (e.g., claude-sonnet-4 / gpt-4o) — single-agent ReAct vs 2-3 role SOP+feedback vs DAG-orchestrated, n≥30, cost/latency/regression/variance.
- **F03 — Herdr teardown:** Measure Herdr vs tmux+worktrees, with/without ledger plugin, on multi-file tasks.
- **F04 — Demand survey:** 50 developers, forced-choice: "Would you pay for persistent multi-agent vs better single-agent verification?"
- **F05 — Local benchmark sweep:** Local models on SWE-bench Verified + LiveCodeBench rolling split (post-cutoff) to guard contamination.
- **F06 — Wrapper replication spike:** 2-week attempt to extend Claude Code/OpenCode via MCP with LACE-like verification.

## Scope-Creep Parked (out of R007)
- Model licensing for local distribution (Apache 2.0 vs proprietary) — legal, not researched.
- Hardware roadmap (Apple Silicon vs NVIDIA) for 8GB story — deeper than asked.
- Pricing arbitrage (local inference cost at scale) — R005 territory.

## Thresholds to Revisit Kill/Pivot Decision
See `report.md` § Recommendation: T1 (Pareto ≥10pp at ≤2x cost), T2 (HerdrDelta >30% time-to-green), T3 (pure-local mandatory ≥40%), T4 (replication >2 weeks). Re-evaluate only after F02–F04 data.
