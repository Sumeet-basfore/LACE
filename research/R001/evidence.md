# R001 Evidence — Competitive Landscape

Access date for all HEAD checks: **2026-09-02** unless noted. Full fetches limited by tooling; quotes below are from training-data knowledge (cutoff 2026-01-04) and verified liveness checks via `curl -I`. Where a quote could not be re-fetched live, it is marked "via training data, live page not re-fetched".

| # | Source | URL | Type | Accessed | Relevance | Key quote / data |
|---|--------|-----|------|----------|-----------|------------------|
| 1 | Claude Code docs (Anthropic) | https://docs.anthropic.com/en/docs/claude-code | Official docs | 2026-09-02 (HEAD 301→ platform.claude.com verified) | Core capabilities, tool system, architecture | Training: "Claude Code is Anthropic's agentic CLI that operates directly in terminal, with tools for file edit, bash, search" — live redirect confirmed docs exist. |
| 2 | Claude Code repo (anthropics/claude-code) | https://github.com/anthropics/claude-code | Official repo | 2026-09-02 HEAD 200 | Repo existence, issues | HEAD 200 confirms repo live. |
| 3 | Codex (OpenAI) repo | https://github.com/openai/codex | Official repo | 2026-09-02 HEAD 200 | Codex CLI, model, tools | HEAD 200 live. Training: Codex CLI is OpenAI's open-source terminal agent. |
| 4 | OpenCode (SST) | https://github.com/sst/opencode (→ anomalyco/opencode) | Official repo | 2026-09-02 HEAD 301 | OpenCode capabilities | Redirect to anomalyco/opencode confirmed. Training: SST OpenCode is open-source AI coding agent with pluggable models. |
| 5 | Aider | https://github.com/Aider-AI/aider (was paul-gauthier/aider) | Official repo | 2026-09-02 HEAD 301 | Aider pairing workflow | Redirect from paul-gauthier/aider → Aider-AI/aider confirmed. Training: `aider -- model + git-aware edit loop, SEARCH/REPLACE blocks`. |
| 6 | Cline | https://github.com/cline/cline | Official repo | 2026-09-02 HEAD 200 | VS Code autonomous agent | HEAD 200 live. |
| 7 | Roo Code | https://github.com/RooCodeInc/Roo-Code (was RooVetGit/Roo-Code) | Official repo | 2026-09-02 HEAD 301 | Roo Code fork of Cline | Redirect confirmed. |
| 8 | OpenHands (All-Hands-AI) | https://github.com/All-Hands-AI/OpenHands (→ OpenHands/OpenHands) | Official repo | 2026-09-02 HEAD 301 | OpenHands autonomous SWE | Redirect confirmed. |
| 9 | SWE-agent | https://github.com/SWE-agent/SWE-agent | Official repo | 2026-09-02 HEAD 200 | Research agent for SWE-bench | HEAD 200 live. |
| 10 | Cursor docs | https://cursor.com / https://docs.cursor.com | Official docs | 2026-09-02 HEAD 200 | Cursor editor capabilities | HEAD 200 live for cursor.com. Training: Cursor is VS Code fork with Agent, Cursor Tab, Composer. |
| 11 | Windsurf (Codeium) | https://windsurf.com (→ codeium) / https://docs.codeium.com/windsurf | Official docs | 2026-09-02 HEAD 308 | Windsurf editor | HEAD 308 redirect live. |
| 12 | Zed | https://zed.dev | Official docs | 2026-09-02 HEAD 200 | Zed editor + agent | HEAD 200 live. |
| 13 | Herdr | https://github.com/* (local install evidence) / https://herdr.dev (assumed) | Local install + repo | 2026-09-02 local fs | Herdr multiplexer | FACT: `/home/sumeet/.config/herdr/herdr.sock` exists on this machine; binaries in `/home/sumeet/.local/share/mise`. No public website fetch attempted. |
| 14 | Anthropic docs redirect | https://docs.anthropic.com | Official | 2026-09-02 HEAD 301 to platform.claude.com | Verifies Claude Code docs moved | `location: https://platform.claude.com/docs/` |
| 15 | OpenCode site | https://opencode.ai | Official | 2026-09-02 fetch attempted (headers only) | OpenCode marketing | No reliable evidence found — site fetch returned truncated/empty in this environment. |
| 16 | Benchmarks (SWE-bench) | https://www.swebench.com | Benchmark | 2026-09-02 not fetched live | Benchmark methodology | No reliable evidence found in this session — leaderboard not re-fetched. Cited via training knowledge only. |

## Search methodology notes

- Primary source preference: attempted `curl -I` (HEAD) for all 12 products on 2026-09-02; all returned 200/301/308 confirming liveness. Full Markdown fetches were rate/parse-limited in this sandbox (only headers reliably returned). Detailed capability verification therefore relies on training data (cutoff 2026-01-04) and is explicitly marked as needing re-verification.
- Secondary sources (HN/Reddit sentiment, comparative reviews) — No reliable evidence found via live search in this session (no `tavily`/`exa` search tool available; `curl` only). Sentiment summarized from training knowledge and labeled OPINION with low confidence.
- No invented stars, user counts, benchmark scores, or pricing — all such numbers omitted per "No reliable evidence found" rule.

## Source-Quality Hierarchy applied

1. Official docs/repos (1–13) weighted highest where live HEAD confirms existence.
2. Training-derived capability descriptions weighted Medium (need re-verification).
3. Forum sentiment weighted Low (anecdotal).
