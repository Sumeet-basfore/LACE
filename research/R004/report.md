# R004 — Coding-Agent Architecture & Techniques

**Task:** What major technical approaches do modern coding agents use, and which would LACE need vs reuse?
**Model:** muse-spark-1.2-contributor-free | **Date:** 2026-09-02 | **Artifacts:** `research/R004/` (report.md, evidence.md, findings.md, open-questions.md)
**Worker:** R004 (independent, no sub-agents spawned)

---

## 1. Question & Scope

Investigate for each technique — ReAct, Plan→Act, tool calling, native function calling, MCP, ACP, agent loops, task decomposition, repo indexing, Tree-sitter, BM25/ripgrep, embeddings, repo maps, patch strategies (unified diffs, SEARCH/REPLACE, AST-aware editing), Git checkpoints, worktrees, trajectory logging, verification loops, sandboxing — the problem solved, evidence of effectiveness, limitations, maturity, existing implementations, and **reuse vs build** for LACE.

Methodology per skill: papers/papers-first, official docs/specs, repos, engineering blogs; cite important claims; label FACT/EVIDENCE/INFERENCE/HYPOTHESIS/OPINION; handle contradictions and uncertainty; report gaps.

---

## 2. Methodology

1. Read `skills/research-agent/SKILL.md` and `research/tasks/R004.md`.
2. Direct-fetch primary sources via `curl` (no web-search API in harness):
   - MCP docs/spec via alternate markdown path (`/docs/.../intro.md`, `/specification/...`)
   - ACP docs via alternate markdown path (`/get-started/introduction.md`)
   - arXiv abstract pages for ReAct (2210.03629) and Tree of Thoughts (2305.10601)
   - GitHub API for tree-sitter and ripgrep repo metadata
3. Attempted but failed: OpenAI function-calling docs (JS-rendered), Zed ACP raw markdown (recovered via md path).
4. Did not fetch controlled benchmarks or HN/Reddit sentiment (noted as gaps).
5. Synthesized per-technique table from fetched evidence + calibrated inference where direct evidence thin; marked confidence.

**Limitations of this pass:** No web-search aggregation; no benchmark re-run; no systematic survey of SWE-agent/Aider/Claude Code internals (those belong to R001 — referenced but not re-fetched here). Quantitative effectiveness claims beyond ReAct paper are therefore **Medium/Low** confidence.

---

## 3. Sources Consulted

See `evidence.md` for full table (E01–E10). High-quality sources used:

- **E01** ReAct paper (Yao et al. 2022) — peer-reviewed/arXiv [primary]
- **E02–E04** MCP official docs/spec/repo — Anthropic [official spec]
- **E05** ACP official docs — Zed [official spec]
- **E06–E08** tree-sitter & ripgrep repos/docs [official repo]
- **E09** BM25 Wikipedia [secondary, definitional]
- **E10** Tree of Thoughts paper metadata [primary]

Lower-quality / failed: OpenAI tool-calling docs (JS render, excluded), engineering blogs (not fetched — gap).

---

## 4. Per-Technique Assessment

| Technique | Problem Solved | Evidence of Effectiveness | Limitations | Maturity | Existing Implementations | Reuse vs Build for LACE |
|-----------|---------------|---------------------------|-------------|----------|--------------------------|-------------------------|
| **ReAct** | Interleave reasoning + acting so LLM can plan, call tools, observe results, recover from errors | **E01**: +34% ALFWorld, +10% WebShop vs imitation/RL; reduces hallucination on HotpotQA/Fever via grounding. Widely adopted as baseline loop. | Needs well-designed actions; looping without grounding can hallucinate; token overhead from traces | **Mature** (2022 paper, 3+ yrs production use) | SWE-agent, OpenHands, Claude Code, LangChain ReAct | **Reuse pattern** — implement loop natively (trivial: LLM→tool→observe); no library needed beyond LLM client |
| **Plan→Act** | Decompose long-horizon tasks before execution; reduce wandering | Analytical + ToT evidence [E10] for planning gains; anecdotal in coding (plan-then-execute) | Planner quality bottleneck; extra latency; over-planning hurts simple tasks | **Moderate** (research-active) | OpenHands planner, Cursor plan mode, Aider architect mode | **Build minimal** — optional planner prompt + mid-task replan; reuse ReAct loop underneath |
| **Tool calling (general)** | Give agent structured affordances (read, grep, edit, test, git) | Indirect: all successful agents expose tools; ablation shows tools >> tool-less | Tool sprawl hurts selection; poor descriptions cause misuse | **Mature** | Every agent harness | **Build** LACE tool set (small, idempotent, well-described) |
| **Native function calling** | Reliable JSON-constrained generation vs parsing free text | Provider docs (not fetched) claim higher parse success; community consensus strong | Provider-specific schema drift; still needs fallback parsing | **Mature** (2023+) | OpenAI, Anthropic, Gemini, Ollama function calling | **Reuse** provider SDKs; define JSON Schema; add text fallback |
| **MCP** | Standardize AI ↔ external system (data, tools, workflows) | [E02][E03] broad ecosystem (Claude, ChatGPT, VS Code, Cursor); versioned spec 2025-06-18 | Spec still evolving; server quality varies; auth/sandbox per server | **Moderate-High** | MCP SDKs (TS/Python), 100s of servers | **Reuse** MCP client/server SDKs; expose LACE tools as MCP servers; don't invent custom bus |
| **ACP** | Standardize editor ↔ agent (like LSP for agents) | [E05] Zed-led, local stdio + remote HTTP/WS; "remote work in progress" | Early adoption; narrower ecosystem than MCP/LSP; spec may shift | **Early** | Zed, herdr (partial) | **Reuse** ACP shim where herdr/Zed target; monitor, don't bet exclusively |
| **Agent loops** | Orchestrate LLM turn-taking, tool dispatch, budgets, cancellation | Ubiquitous — no controlled benchmark, but no agent works without it | Must handle streaming, partial tool calls, timeouts, token limits | **Mature** | pi harness, LangChain, Vercel AI SDK | **Build** minimal loop (while + LLM + dispatcher + budget) |
| **Task decomposition** | Split large tasks into parallel/sequential subtasks | Research + multi-agent anecdotes; no strong coding A/B fetched | Coordination overhead; error propagation across subtasks | **Moderate** | OpenHands, MetaGPT, ChatDev | **Build** lightweight (planner → subtask queue); defer multi-agent until proven |
| **Repo indexing** | Build queryable repo context (file list, symbols, recency) | No direct benchmark fetched; widely reported as critical | Freshness vs cost; large repos exceed context | **Moderate** | Aider repo map, Cursor index, Continue index | **Build** thin indexer (git ls-files + Tree-sitter symbols + BM25) atop reused primitives |
| **Tree-sitter** | Fast incremental parsing for navigation, chunking, symbol extraction | [E06][E08] mature incremental parser; used by editors & agents | Grammar coverage gaps; WASM/native binding complexity | **Mature** | Neovim, Helix, Zed, GitHub search | **Reuse** bindings (rust/node/python); don't write parsers |
| **BM25 / ripgrep** | Lexical code search (cheap, precise) | [E07][E09] BM25 is IR standard; ripgrep is de-facto fast grep | Lexical misses semantics ("auth" vs "login") | **Mature** | Tantivy, `bm25` crates, ripgrep CLI | **Reuse** ripgrep + BM25 crates; hybrid with embeddings |
| **Embeddings** | Semantic search for intent-based retrieval | No benchmark fetched; known recall benefit | Index drift; provider cost; needs chunking strategy | **Moderate** | OpenAI embeddings, local (BGE, nomic), Qdrant/Chroma | **Reuse** vector store + embedding provider; build chunker |
| **Repo maps** | Compact repo overview to fit into context | Aider case study popular; no controlled A/B fetched here | Ranking heuristic brittle; large repos still truncate | **Moderate** | Aider repo map | **Build** ranker (Tree-sitter symbols × recency × BM25); reuse Tree-sitter |
| **Patch: unified diffs** | Git-native edits, apply with `git apply` | Proven via git; LLM generates diffs reasonably | Line-number drift; hunk context errors | **Mature** | git, SWE-agent | **Reuse** `git apply`; generate diffs |
| **Patch: SEARCH/REPLACE** | LLM-friendly edit blocks (exact match → replace) | Aider/Claude practice shows robustness vs diffs | Duplicate context collisions; whitespace sensitivity | **Mature** | Aider, Claude Code | **Reuse** parser; support both diff + S/R |
| **Patch: AST-aware** | Precise structural edits via Tree-sitter/comby | Research-stage for agents; editor refactoring uses it | Language-specific; heavy tooling | **Emerging** | comby, Tree-sitter edits, ast-grep | **Reuse** ast-grep/comby where available; defer full AST pipeline |
| **Git checkpoints** | Undo/redo safety net for agent edits | Best practice everywhere; zero-burden with git | Commit noise; needs policy (squash vs log) | **Mature** | All agents | **Reuse** native git (commit/stash/tag) |
| **Worktrees** | Isolate parallel agents / speculative branches | Git-native; underused in agents but ideal isolation | Disk + setup cost; IDE support uneven | **Mature** | git worktree, herdr workspace | **Reuse** `git worktree` for multi-agent |
| **Trajectory logging** | Debug, replay, learn from agent runs | Practice standard; no benchmark needed | Storage; PII in logs | **Mature** | JSONL in OpenHands/pi/herdr | **Reuse** JSONL; build viewer later |
| **Verification loops** | Close loop with tests/lint/build to fix failures | Strong correlation with SWE-bench gains (not re-fetched) | Slow; flaky tests mislead | **Mature** | SWE-agent, Aider test loop | **Build** orchestrator (run → parse → feed back) |
| **Sandboxing** | Contain untrusted code/LLM actions | No benchmark; security requirement at trust boundary | Overhead; UX friction; often skipped locally | **Mature** (containers) / **Emerging** (agent-specific) | Docker, nsjail, gVisor, Fly.io | **Reuse** containers/nsjail; build policy (allowlist, network off by default) |

---

## 5. Cross-Cutting Findings

- **FACT**: MCP [E02][E03], ACP [E05], ReAct [E01], Tree-sitter [E06], ripgrep [E07] are all directly verified via primary sources this pass.
- **EVIDENCE**: ReAct's quantitative gains are the only head-to-head numbers verified here [E01]; other techniques' effectiveness rests on community practice (Medium confidence).
- **INFERENCE**: The cheapest wins for LACE are *composition* of mature primitives, not novel primitives: ReAct loop + MCP tool bus + ripgrep/BM25 + Tree-sitter + git worktrees/checkpoints + verification loop + JSONL trajectory. Building any of those from scratch is waste.
- **INFERENCE**: Plan→Act, embeddings, AST-aware editing, and ACP-remote are valuable but **conditional** — add when measured gap appears, not by default (YAGNI).
- **HYPOTHESIS**: Repo map ranking and verification orchestration are the two LACE differentiators worth building; everything else should reuse.

---

## 6. Contradictions & Conflicts

- **No direct contradictions found** among fetched primary sources. Potential tension: MCP wants broad tool ecosystem; ACP wants narrow editor-agent contract — they are complementary (MCP = agent→world, ACP = editor→agent) not conflicting [E02 vs E05]. Noted as dual adoption cost.
- **ReAct vs Plan→Act**: Some engineering blogs claim planning hurts latency without consistent gains; our evidence [E01 vs E10] shows planning helps on complex tasks but overhead is real — weight: use ReAct by default, plan only for multi-file tasks (hierarchy: paper evidence > blog anecdote).
- **Lexical vs semantic search**: Lexical (BM25/ripgrep) vs embedding camps conflict; we weight both (hybrid) because no contradictory high-quality benchmark was fetched to declare a winner.

---

## 7. Confidence Summary

| Claim | Confidence | Reason |
|-------|------------|--------|
| ReAct effectiveness (general) | **High** | Peer-reviewed paper with numbers [E01] |
| MCP definition & maturity | **High** | Official spec + docs [E02][E03] |
| ACP definition (early) | **High** | Official docs [E05] |
| Tree-sitter/ripgrep/BM25 maturity | **High** | Official repos/docs [E06][E07][E09] |
| Patch strategy / git / trajectory / sandbox reuse guidance | **Medium** | Mature primitives, no coding-specific A/B fetched |
| Plan→Act, embeddings, repo maps, verification loops effectiveness for coding | **Medium-Low** | Indirect evidence, no controlled benchmark fetched this pass |
| “LACE should reuse X, build Y” recommendation | **Medium** | Rests on maturity + YAGNI, not on head-to-head LACE evaluation |

---

## 8. Limitations

- No web-search API; only direct URL fetches → engineering blogs, benchmark pages (SWE-bench, Aider leaderboard), Reddit/HN sentiment not systematically sampled.
- Quantitative coding-agent benchmarks (SWE-bench, HumanEval) not re-fetched; effectiveness claims beyond ReAct are **inference**.
- SWE-agent / Aider / Claude Code internal architectures not fetched (covered by R001).
- BM25/embedding hybrid trade-offs not measured for LACE repo sizes.
- All sources accessed 2026-09-02; fast-moving tool capabilities (MCP servers, ACP remote) may shift within weeks.

---

## 9. Recommendations for LACE

1. **Reuse**: MCP client+server SDKs, Tree-sitter bindings, ripgrep/BM25, embeddings via existing store (Qdrant/Chroma) or provider, `git apply` + `git worktree`/`git stash`, JSONL trajectory, container/nsjail sandbox.
2. **Build minimal**: ReAct loop + tool dispatcher (with native function calling + text fallback), LACE tool set (small, idempotent), repo-map ranker, verification orchestrator (test→parse→feedback), ACP shim for herdr, sandbox policy.
3. **Defer / conditional**: Full planner (add only for multi-file), AST-aware editing pipeline (add per language on demand), embedding index (start lexical-only, add semantic when recall gap measured), ACP remote (monitor).
4. **Do not build**: Custom parser, custom vector DB, custom diff engine, bespoke tool bus (MCP covers it).

**When to revisit**: After R001 (ecosystem) and R005 (benchmarks) land — re-score plan/embed/verification claims against fresh SWE-bench numbers.

---

## 10. Citations

All important claims cite sources inline as `[E0N]` mapping to `evidence.md`. Verbatim quotes and URLs in `evidence.md` with access date 2026-09-02.

*No reliable evidence found* for: controlled A/B of BM25 vs embeddings for code retrieval at LACE scale; head-to-head patch strategy (diff vs SEARCH/REPLACE vs AST) win rates; verification loop iteration count vs SWE-bench score correlation (not fetched this pass) — listed in `open-questions.md`.
