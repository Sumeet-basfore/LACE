# R001 Open Questions — Competitive Landscape

## Missing evidence (no reliable evidence found in this session)

1. **Live benchmark numbers** — SWE-bench, Terminal-Bench, or vendor leaderboards not re-fetched (no search tool available; `curl` limited to HEAD). Cannot quote scores. Need follow-up with `swebench.com` leaderboard + each project's published evals.
2. **Pricing & cost** — No live pricing fetched for Claude Code / Cursor / Windsurf / Cline. Pricing changes monthly; stale numbers would mislead. Needs live doc check.
3. **User counts / stars / downloads** — Intentionally omitted (invented stats prohibited). Need GitHub API + marketplace stats.
4. **HN/Reddit sentiment with citations** — No live search; training-derived sentiment labeled Low confidence. Need targeted search: `site:reddit.com aider vs claude code`, etc.
5. **Herdr public docs** — Local install confirmed, but public URL/docs not verified live. Need `herdr.dev` or GitHub org lookup.
6. **OpenCode full capability parse** — `opencode.ai` fetch returned empty/truncated in this sandbox. Needs browser fetch + repo README parse.

## Unanswered questions

- Q1: Which products now support fully offline/local LLM (ollama/lm-studio) as a first-class provider in Sept 2026? Training says Aider/OpenCode/Zed do, but recent changes unknown.
- Q2: What is the actual multi-agent story for Claude Code (sub-agents) vs Codex vs Cursor vs Herdr in late 2026? Docs changed after cutoff; need re-read.
- Q3: How do patch/edit strategies differ in practice (SEARCH/REPLACE vs apply_patch vs direct write vs structured edit) on large repos? Needs empirical comparison.
- Q4: What are the top 5 open GitHub issues per product right now (signal for weaknesses)? Needs live GitHub Issues API scan.
- Q5: Do any incumbents now offer persistence across restarts (sessions, memory, ledger) comparable to LACE's intended ledger? Needs doc check.
- Q6: For Zed and Windsurf, what is the agent extensibility story (MCP, hooks, skills)? Needs doc parse.
- Q7: What is the enterprise distribution (on-prem, VPC, air-gap) for each? Relevant to R006 but noted here as gap.

## Follow-up ideas (out of scope, noted per skill)

- Comparative teardown: run the same 3 tasks (small bug, refactor, feature) across 6 agents and record tool traces, edit quality, verification — objective gap evidence.
- User interview synthesis (R002 link): map pain points to gaps identified here; validate HYPOTHESIS that "multiplexer + harness" is the real opening.
- Architecture deep-dive (R004 link): diagram tool system + context window strategy per agent; check for shared contracts (MCP, LSP, DAP).
- Pricing/ROI matrix: cost per successful SWE-bench task vs. local-model cost.
- Adversarial check: have a skeptic try to argue "LACE is unnecessary — just use Claude Code + Herdr" and see where it breaks.

## Next steps for orchestrator

- Mark R001 as COMPLETE with confidence Medium (High for existence, Medium for capabilities, Low for sentiment).
- Link to R002–R006 for validation: R002 (pain), R004 (architecture), R006 (privacy/local).
- Schedule refresh in 4–8 weeks — this space moves fast (≤12 month recency rule).
