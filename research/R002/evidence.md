# R002 — Evidence

Access date for all sources: 2026-09-02 (via curl / GitHub API / HN Algolia API). No dedicated web-search tool available; sources obtained via direct HTTP requests. Key quotes truncated to 300 chars where noted.

## Source Table

| # | Source | Type | URL | Date | Relevance | Key Quote / Data |
|---|--------|------|-----|------|-----------|------------------|
| E01 | GitHub Blog — "GitHub Copilot: The agent awakens" | Official blog (hierarchy 5) | https://github.blog/news-insights/product-news/github-copilot-the-agent-awakens/ | 2025-02-06 (published) | Introduces Copilot agent mode, hints at autonomy/oversight tradeoff | "Introducing agent mode for GitHub Copilot in VS Code... providing a first look at our SWE agent." — signals shift from autocomplete to autonomous edits requiring human review |
| E02 | HN Algolia API — Show HN: Kontext CLI – Credential broker for AI coding agents | Community post / Show HN (hierarchy 9) | https://github.com/kontext-dev/kontext-cli (via https://news.ycombinator.com/item?id=47765374) | 2026-04-14 | Privacy/credential sprawl as enterprise pain — agents given raw API keys | "most teams handle this by copy-pasting long-lived API keys into .env files ... There's no lineage of access. You don't know which developer launched which agent" |
| E03 | HN Algolia API — Show HN: PlanBridge: open-source tool for precise feedback on coding agent plans | Community post | https://github.com/contextbridge/planbridge | indexed 2026 (HN) | Human oversight / plan verification gap | "precision feedback on your coding agent's plans ... uses standard coding agent hooks to open a local browser with the rendered markdown plan" — implies plans need explicit verification |
| E04 | GitHub Issue — Cline #13750: PLAN mode hangs indefinitely with Ollama - no error logs | Repo issue (hierarchy 4) | https://github.com/cline/cline/issues/13750 | 2026 (open) | Agent loops / hangs on local models; low-resource failure | "PLAN mode hangs on 'thinking...' indefinitely when using Ollama, despite Ollama working perfectly in terminal." |
| E05 | GitHub Issue — Cline #13753: Remove or make configurable the "BE HELPFUL AND PROACTIVE" system prompt directive | Repo issue | https://github.com/cline/cline/issues/13753 | 2026 (open) | Excessive autonomy / prompt-driven behavior complaints | Title itself signals user friction with proactive agent behavior |
| E06 | GitHub Issue — Continue #13212: Proposal: Universal Trust Adapter as opt-in verification layer for MCP servers | Repo issue | https://github.com/continuedev/continue/issues/13212 | 2026 | Privacy/trust for MCP tools — community concern about unverified tool execution | "Proposal: Universal Trust Adapter as opt-in verification layer for MCP servers loaded by Continue" |
| E07 | GitHub Issue — Aider #5665: Discussion: optional trust verification for MCP servers loaded by Aider | Repo issue | https://github.com/Aider-AI/aider/issues/5665 | 2026-09-01 | Same privacy/MCP trust pattern across agents | "When Aider loads a third-party MCP server, there's no canonical way to verify *who issued the credential* for that server before Aider executes its tools." |
| E08 | GitHub Issues — sst/opencode #46734 / #46733: TUI progress signal / SSE event delivery failures | Repo issues | https://github.com/anomalyco/opencode/issues/46734 , https://github.com/anomalyco/opencode/issues/46733 | 2026 | Latency/UX gaps: missing progress feedback, streaming failures | "TUI: no progress signal while tool-call arguments stream" + "SSE /global/event and /event deliver only server.connected + heartbeats — no message events" |
| E09 | GitHub PR — newt-agent #160: fix(agent-loop): hallucination tracker + cap-path token loss + context trimming | Repo PR (hierarchy 3) | https://github.com/Gilamonster-Foundation/newt-agent/pull/160 | 2026 | Direct evidence of hallucination + token loss + context trimming bugs in agent loop | Title enumerates three linked failure modes in one fix |
| E10 | GitHub Issue — newt-agent #159: bug(agent): two agentic-loop failures — tool-name hallucination + cap-path token loss | Repo issue | https://github.com/Gilamonster-Foundation/newt-agent/issues/159 | 2026 | Concrete hallucination of tool names + path handling | Title: "two agentic-loop failures — tool-name hallucination + cap-path token loss" |
| E11 | HN Algolia comment #46471287 (comment search: coding agent context loss) | Community comment (hierarchy 9) | https://news.ycombinator.com/item?id=46471287 (via Algolia comment API) | Indexed 2026 | Context loss on long-horizon / real feature work | "Small tasks work fine, medium ones when planned properly. But when I tried building something real... it was always difficult to keep an agent like Claude Code on track throughout an entire feature implementation. ... context is state" |
| E12 | GitHub Search — freelance-agent-skills #1: Repetitive calls cost you twice as much on average agent loops | Repo issue | https://github.com/noron12234/freelance-agent-skills/issues/1 | Indexed 2026 | Cost/token consequence of loops | "Repetitive calls cost you twice as much on average agent loops" |
| E13 | HN Algolia API — empty result for "cursor agent hallucination regression" (0 hits) | API negative result | https://hn.algolia.com/api/v1/search (query=cursor+agent+hallucination+regression) | 2026-09-02 | Negative evidence: no indexed Show HN conflating those terms | `{"nbHits":0}` — suggests sparse dedicated discussion under that exact query; alternative queries needed |
| E14 | GitHub API — search "AI coding agent hallucination" returned 9038 issues (top hit unrelated: mcpso #3750 AgentSeed) | API search | https://api.github.com/search/issues?q=AI+coding+agent+hallucination | 2026-09-02 | Signal/noise: broad term yields many off-topic hits; needs filtered hypothesis | Top hit was "Server submission: AgentSeed (anti-hallucination guardrails for AI coding agents)" — guardrails product indicates perceived hallucination problem |
| E15 | GitHub API — Cline recent issues list (sample 10, 2026) | Primary repo sample | https://api.github.com/repos/cline/cline/issues?per_page=10 | 2026-09-02 | Repo understanding / hangs / prompt friction as recurring Cline themes (in sample) | 5 of 10 sampled: 13750 (Ollama hang), 13753 (proactive prompt), 13748 (TUI crash on /model), 13752 (duplicate-session bug), 13745-linked — pattern of state/coordination bugs |

## Search Log

- HN Algolia `search?query=AI coding agent pain problems` → hit Kontext credential broker (E02)
- HN Algolia `cursor agent hallucination regression` → 0 hits (E13)
- HN Algolia `AI agent coding frustration context window` → hits mostly Show HN tooling (MCP Vault, Toolbase, PlanBridge) indicating meta-response to pain
- HN Algolia `coding agent claude code cursor problems` → low-score Show HN policy enforcement entries
- HN Algolia comment `coding agent context loss` → 2 comments (E11)
- HN Algolia `claude code agent loop cost tokens` → 0 high-quality hits
- GitHub API `search/issues?q=AI+coding+agent+hallucination` → 9038 hits, noisy (E14)
- GitHub API `repos/cline/cline/issues` → verified open hangs/autonomy issues (E04, E05)
- GitHub API `repos/continuedev/continue/issues` → trust/MCP proposal (E06)
- GitHub API `repos/Aider-AI/aider/issues` → trust verification (E07)
- GitHub API `repos/anomalyco/opencode/issues` → TUI/latency stream bugs (E08)
- GitHub API `search/issues?q=hallucination agent loop OR context loss in:title` → 2 hits including newt-agent (E09, E10)
- Direct curl to anthropic.com/news/claude-code → 404 (Not Found) — site structure changed; not citable
- Direct curl to github.blog copilot agent post → success (E01)

## Gaps in Evidence Collection

- No systematic user survey with n>100 retrieved via API (e.g., Stack Overflow survey, GitHub State of Octoverse, JetBrains) — would require browser search
- No Reddit data fetched (Reddit API requires auth; Algolia covers HN only)
- No arXiv paper full-text fetched (would need openalex/crossref search)
- Pricing/cost numbers not fetched (Anthropic/OpenAI pricing pages not curled)
- Benchmark failure-mode breakdowns not fetched (SWE-bench, etc.)

> All URLs accessed 2026-09-02. Quotes are verbatim excerpts from API HTML/JSON bodies, truncated for length. No statistics invented.
