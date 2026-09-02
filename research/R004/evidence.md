# R004 Evidence — Coding-Agent Architecture & Techniques

Access date for all web sources: **2026-09-02** unless noted. Quotes truncated for relevance.

| # | Source | Type | URL | Relevance | Key Quote / Data |
|---|--------|------|-----|-----------|-------------------|
| E01 | ReAct paper (Yao et al. 2022) | Primary paper (arXiv) | https://arxiv.org/abs/2210.03629 | Defines ReAct (Reason+Act interleaved) | "We explore the use of LLMs to generate both reasoning traces and task-specific actions in an interleaved manner ... On HotpotQA and Fever, ReAct overcomes hallucination by interacting with Wikipedia API. On ALFWorld and WebShop, ReAct outperforms imitation/RL by 34% and 10% absolute while prompted with only one or two in-context examples." — accessed 2026-09-02 |
| E02 | Model Context Protocol — What is MCP? | Official docs | https://modelcontextprotocol.io/docs/2026-07-28/getting-started/intro.md | Defines MCP purpose/transport | "MCP (Model Context Protocol) is an open-source standard for connecting AI applications to external systems... Think of MCP like a USB-C port for AI applications." — accessed 2026-09-02 |
| E03 | MCP Specification 2025-06-18 | Official spec | https://modelcontextprotocol.io/specification/2025-06-18/index.md | Spec maturity, versioning | Spec dated 2025-06-18 with JSON-RPC 2.0 over stdio/SSE/Streamable HTTP; schema at `schema/2025-06-18/schema.ts`. Versioned spec indicates active maintenance. — accessed 2026-09-02 |
| E04 | MCP GitHub repo | Official repo | https://github.com/modelcontextprotocol/modelcontextprotocol | Authorship & license | Created by David Soria Parra and Justin Spahr-Summers; MIT licensed; contains spec + JSON Schema. — accessed 2026-09-02 |
| E05 | Agent Client Protocol — Introduction | Official docs (Zed/Mintlify) | https://agentclientprotocol.com/get-started/introduction.md | Defines ACP vs MCP/LSP | "ACP standardizes communication between code editors/IDEs and coding agents ... similar to how LSP standardized language server integration. Agents that implement ACP work with any compatible editor." "Local agents run as sub-processes ... via JSON-RPC over stdio. Remote agents ... over HTTP or WebSocket. Full support for remote agents is a work in progress." — accessed 2026-09-02 |
| E06 | Tree-sitter repo (GitHub API) | Official repo metadata | https://api.github.com/repos/tree-sitter/tree-sitter | Maturity/popularity signal | Description: "An incremental parsing system for programming tools" — org `tree-sitter`, incremental parser, widely adopted (checked via GitHub API 2026-09-02). No star count cited without verification. |
| E07 | ripgrep repo (GitHub API) | Official repo metadata | https://api.github.com/repos/BurntSushi/ripgrep | Maturity/popularity signal | Description: "ripgrep recursively searches directories for a regex pattern while respecting your gitignore" —accessed 2026-09-02 |
| E08 | Tree-sitter docs home | Official docs | https://tree-sitter.github.io/tree-sitter/ | Incremental parsing claim | mdBook site title "Introduction - Tree-sitter" confirming active docs; incremental parsing claim per repo description (E06). — accessed 2026-09-02 |
| E09 | Okapi BM25 — Wikipedia | Secondary (foundational) | https://en.wikipedia.org/wiki/Okapi_BM25 | Defines BM25 relevance | Page exists confirming BM25 is a ranking function for information retrieval (probabilistic relevance framework, 1970s-90s origin). Used as standard lexical ranking baseline. — accessed 2026-09-02 |
| E10 | Plan-and-Act / Tree of Thoughts (arXiv 2305.10601) landing | Primary paper metadata | https://arxiv.org/abs/2305.10601 | Existence of planning extensions beyond ReAct | Title "Tree of Thoughts: Deliberate Problem Solving with Large Language Models" confirms planning/search extensions to ReAct are active research. — accessed 2026-09-02 |

## Sources Consulted But Not Directly Cited (methodology note)

- Attempted: OpenAI function-calling docs via curl (blocked/JS-rendered, no reliable quote extracted) — NOT cited.
- Attempted: Zed ACP raw markdown (JS-rendered Mintlify, only introduction.md via alternate `*.md` path succeeded as E05).
- No live benchmark re-run; no Reddit/HN scrape performed (out of scope for this pass, noted as gap).
- No direct fetch of SWE-agent, Aider, Claude Code repo architectures during this task (covered by R001). Findings for those rely on general knowledge and are marked INFERENCE/HYPOTHESIS with LOW-MEDIUM confidence.

## Search Process

1. Fetched MCP docs via `curl` alternate markdown path (`/docs/.../intro.md`) — succeeded.
2. Fetched ACP docs via alternate markdown path (`/get-started/introduction.md`) — succeeded.
3. Fetched arXiv abstract pages for ReAct (2210.03629) and ToT (2305.10601) via curl — succeeded for metadata/abstract.
4. Queried GitHub API for tree-sitter and ripgrep repo metadata — succeeded.
5. Attempted OpenAI docs fetch — failed (JS-heavy), excluded.

No reliable evidence found for several quantitative effectiveness claims (see report Limitations). Web search API not available in this harness; browsing limited to direct URL fetches.

## Source-Quality Notes

- E01, E03, E05 are top-hierarchy (paper, official spec, official docs) → weighted highest.
- E06/E07 are official repos (high but not effectiveness evidence).
- E09 is secondary (Wikipedia) — acceptable for definitional claim, low weight for effectiveness.
- No first-party engineering blog with benchmark numbers was successfully fetched; those claims are therefore marked as gaps.
