# R004 Open Questions — Coding-Agent Architecture & Techniques

## Missing Evidence (No reliable evidence found this pass)

1. **Controlled effectiveness of Plan→Act for coding** — Searched ReAct paper [E01] + ToT metadata [E10]; no coding-specific plan-vs-no-plan A/B with SWE-bench numbers was fetched. Web-search API unavailable; engineering blogs not fetched. Needs: Aider/Claude Code plan-mode bench.
2. **BM25 vs embeddings vs hybrid for code retrieval** — No benchmark with recall@k / context-hit rate at repo scale was fetched. Needs: systematic eval on LACE-sized repos (10k–500k LOC).
3. **Patch strategy win rates** — No head-to-head: unified diff vs SEARCH/REPLACE vs AST-aware (success rate, patch apply rate, edit precision). Needs: sweep on SWE-bench edit logs.
4. **Verification loop iteration sweet spot** — No data on "N test iterations → SWE-bench delta" was fetched. Needs: R005 benchmark synthesis.
5. **MCP server quality / latency at scale** — No measurement of MCP server overhead, auth friction, or failure modes. Needs: hands-on test of top 10 MCP servers.
6. **ACP adoption trajectory** — Only Zed docs [E05] confirm early stage; no adoption stats, no remote-agent case study. Needs: Zed/herdr issue tracker review.
7. **Repo map ranking quality** — Aider repo map referenced but no controlled A/B vs no-map baseline fetched. Needs: ablation on large repos.

## Unanswered Questions

- Which combination of lexical + semantic retrieval actually moves needle for LACE's target repos (monorepo vs small service)?
- Does Tree-sitter-aware chunking beat line-based chunking for embedding recall? By how much?
- Worktree isolation: measurable benefit vs branch-per-agent for parallel agents? Disk/I/O cost?
- Sandboxing default: should LACE sandbox local runs by default (security vs UX)? No user study.
- Native function calling fallback rate: how often do providers still emit malformed JSON at scale?

## Scope-Creep / Out-of-Scope Ideas (not chased, note for later)

- Multi-agent orchestration (covered in R003 — defer to that task).
- Model selection / routing (which model for planner vs actor) — belongs to R006/R005.
- Prompt engineering / system prompts for coding agents — separate research thread.
- Cost/latency benchmarking of full agent loops — belongs to R005.

## Follow-Up Tasks Proposed

- **F1**: Benchmark BM25/ripgrep vs embeddings vs hybrid on 3 LACE-sized repos; measure recall@10 and downstream fix rate.
- **F2**: Patch strategy shootout: generate 200 edits via each strategy, measure apply success and test pass rate.
- **F3**: Fetch and synthesize SWE-bench + Aider leaderboard numbers for verification-loop depth (R005 dependency).
- **F4**: Hands-on MCP server survey: install top 10 servers, measure tool call success, latency, auth pain.
- **F5**: ACP deep dive: read Zed ACP spec markdown + herdr implementation, prototype LACE ACP bridge.

## Contradictions to Revisit

- MCP (broad tool bus) vs ACP (narrow editor contract) — complementary in spec but dual adoption cost is real; revisit after herdr ACP implementation assessment.
- Planning overhead debate — revisit once R003 multi-agent evidence and R005 benchmarks land.
