# R004 Findings — Coding-Agent Architecture & Techniques

Labels: **FACT** / **EVIDENCE** / **INFERENCE** / **HYPOTHESIS** / **OPINION**

## ReAct (Reason + Act interleaved)

- **FACT**: ReAct was introduced by Yao et al. (arXiv 2210.03629, Oct 2022, revised Mar 2023) as interleaving reasoning traces with task-specific actions. [E01]
- **EVIDENCE**: On HotpotQA/Fever, ReAct reduced hallucination/error propagation vs chain-of-thought by grounding with Wikipedia API; on ALFWorld/WebShop absolute gains +34% and +10% over imitation/RL with 1-2 shots. [E01]
- **INFERENCE**: ReAct is the de facto agent loop pattern for modern coding agents (Claude Code, OpenHands, SWE-agent all use it); evidence for coding specifically is indirect (general decision-making benchmarks). Confidence: **Medium**.
- **HYPOTHESIS**: For LACE, ReAct-style loop is necessary but not sufficient — needs domain action set (read/edit/test/git) and tighter verification to beat pure ReAct on SWE-bench.

## Plan→Act (and search extensions)

- **FACT**: Planning extensions exist (Plan-and-Act, Tree of Thoughts arXiv 2305.10601, Plan-and-Solve) as documented research directions. [E10]
- **INFERENCE**: Splitting planning from execution helps on multi-file/long-horizon tasks; adds latency and planner quality dependency. Confidence: **Medium** (no coding-agent controlled A/B fetched).
- **HYPOTHESIS**: LACE should offer optional plan phase for multi-step tasks, but default to single-loop ReAct for simple tasks to avoid overhead.

## Tool Calling & Native Function Calling

- **FACT**: Modern LLMs expose native function/tool calling (JSON schema-constrained generation) — not fetched successfully here, but widely documented.
- **INFERENCE**: Native function calling beats free-form text parsing for reliability; most agents (OpenAI, Anthropic, Gemini) now use it. Confidence: **Medium** (source not fetched, but high prior).
- **INFERENCE**: Tool design matters more than model: idempotent, small, well-described tools outperform many overlapping tools.

## MCP (Model Context Protocol)

- **FACT**: MCP is an open standard by Anthropic (authors David Soria Parra, Justin Spahr-Summers) for connecting AI apps to external systems via JSON-RPC 2.0 (stdio, SSE, Streamable HTTP). [E02][E03][E04]
- **FACT**: MCP spec is versioned (e.g., 2025-06-18) with TypeScript-first schema → JSON Schema. [E03]
- **FACT**: MCP is described as "USB-C for AI apps" integrating data sources, tools, workflows. [E02]
- **INFERENCE**: MCP maturity is **moderate-high** (broad ecosystem: Claude, ChatGPT, VS Code, Cursor per E02), but spec still evolving. Reuse is strongly advised vs building bespoke tool bus. Confidence: **High** for definition, **Medium** for maturity trend.
- **HYPOTHESIS**: For LACE, MCP reuse gives free ecosystem of servers; custom tools only where MCP gap exists.

## ACP (Agent Client Protocol)

- **FACT**: ACP standardizes editor↔agent communication, analogous to LSP, supporting local (stdio JSON-RPC) and remote (HTTP/WebSocket) agents; remote support is "work in progress". [E05]
- **FACT**: ACP reuses MCP JSON representations where possible and uses Markdown for user-visible text. [E05]
- **INFERENCE**: ACP is **early-stage** (Zed-led, narrower adoption than MCP/LSP). Reuse if targeting Zed/herdr; otherwise monitor. Confidence: **Medium**.

## Agent Loops (core harness)

- **FACT**: ReAct-style loop (observe → think → act → observe) is the canonical harness; trajectory logging is its natural artifact.
- **INFERENCE**: Loop implementation is trivial (while + LLM + tool dispatch); value is in tool set, state recovery, and budget/cancellation handling. Confidence: **High**.

## Task Decomposition

- **INFERENCE**: Decomposition (planner → subtasks → workers) is standard for multi-agent and complex single-agent flows; overhead hurts simple tasks. No direct evidence fetched; confidence **Low-Medium**.

## Repo Indexing / Context Building

- **INFERENCE**: All competitive agents build some repo context (file tree, git status, outline, recent edits). Missing this is top failure mode. Confidence: **Medium** (indirect from R001 scope, not directly fetched).

## Tree-sitter

- **FACT**: Tree-sitter is "An incremental parsing system for programming tools" (GitHub org tree-sitter). [E06][E08]
- **INFERENCE**: Tree-sitter is mature and reusable for structure-aware navigation, chunking, symbol extraction, and AST-aware editing support. Reuse via existing bindings (Rust/Node/Python) vs building parser. Confidence: **High** for existence/maturity, **Medium** for effectiveness claim in agents.

## BM25 / ripgrep (lexical search)

- **FACT**: BM25 (Okapi BM25) is a probabilistic ranking function for lexical search. [E09]
- **FACT**: ripgrep is a fast regex search respecting gitignore. [E07]
- **INFERENCE**: BM25 + ripgrep are mature, zero-ML baselines for repo retrieval; embeddings add recall but lexical covers 70-80% of needs with lower cost. Confidence: **Medium**.

## Embeddings (semantic search)

- **INFERENCE**: Dense embeddings help for semantic intent ("where is auth handled?") where lexical fails; cost is index freshness and provider dependency. No primary benchmark fetched — confidence **Low**.

## Repo Maps (Aider-style)

- **HYPOTHESIS**: Repo maps (ranked symbol outlines + file skeletons) are a key LACE differentiator for fitting large repos into context; Aider popularized the pattern but no controlled A/B evidence was fetched here. Confidence: **Low** (needs R001 evidence).

## Patch Strategies

- **INFERENCE**: Three dominant strategies: unified diffs (git apply), SEARCH/REPLACE blocks (Aider/Claude style), AST-aware edits (Tree-sitter/comby). Unified diffs are git-native but brittle; SEARCH/REPLACE is LLM-friendly; AST is most precise but language-specific. No head-to-head benchmark fetched. Confidence: **Medium** (based on community practice).

## Git Checkpoints & Worktrees

- **FACT**: Git is the checkpoint primitive (commit/stash/branch) for agent safety; worktrees enable parallel agents.
- **INFERENCE**: Git checkpoints are mature and must-reuse (native git); worktrees underused but ideal for multi-agent isolation. Confidence: **Medium-High**.

## Trajectory Logging

- **INFERENCE**: Trajectory logging (tool calls + outputs + diffs) is essential for debugging, replay, and learning; most harnesses log JSONL. Low cost, high value. Confidence: **Medium**.

## Verification Loops (test/lint/build)

- **INFERENCE**: Verification loops (run tests → observe failure → fix) are the strongest effectiveness lever for coding agents; SWE-bench gains correlate with more test iterations. No fresh benchmark fetched here. Confidence: **Medium**.

## Sandboxing

- **INFERENCE**: Sandboxing (containers, nsjail, Docker, gVisor) is required at trust boundaries; most local agents run unsandboxed by default (security gap). Confidence: **Medium**.

## Cross-Cutting: Reuse vs Build Summary

- **FACT**: MCP, Tree-sitter, ripgrep, Git are mature external primitives to reuse. [E02][E03][E06][E07]
- **INFERENCE**: LACE should reuse: MCP server/client, Tree-sitter bindings, ripgrep/BM25, embeddings via existing vector store, unified diff + SEARCH/REPLACE hybrid, git worktrees/checkpoints, JSONL trajectory. Build only: herdr-specific ACP shim, LACE tool definitions, repo-map ranker, verification orchestrator, sandbox policy. Confidence: **Medium**.
