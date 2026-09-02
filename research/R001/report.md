# R001 — Competitive Landscape

**Worker:** R001 (lace-R001) — **Model:** muse-spark-1.2-contributor-free — **Date:** 2026-09-02
**Artifacts:** `research/R001/report.md` · `evidence.md` · `findings.md` · `open-questions.md`
**Skill:** `skills/research-agent/SKILL.md`

## Research Question

What is the current AI coding-agent ecosystem, and why would a user choose a new product over incumbents?

Minimum scope: Claude Code, Codex, OpenCode, Aider, Cline, Roo Code, OpenHands, SWE-agent, Cursor, Windsurf, Zed, Herdr.

Per product: core capabilities, architecture (where public), agent model, tool system, context strategy, repo understanding, patch/edit strategy, verification, multi-agent, persistence, local/offline support, differentiators, known weaknesses, user complaints, important open issues.

Key deliverable: gap analysis — why choose a new product?

---

## Methodology

1. Read `research/tasks/R001.md` + `skills/research-agent/SKILL.md` fully before starting.
2. Source-quality hierarchy (high→low): papers → official docs/specs → official repos → GH issues → engineering blogs → benchmarks → attributed reports → secondary analysis → forum anecdotes. Higher beats lower on conflict.
3. Prefer primary + recent (≤12 months) for capabilities/benchmarks/pricing; foundational techniques may be older.
4. Attempted live **HEAD checks** (`curl -I`) for all 12 products on 2026-09-02 to confirm liveness (see `evidence.md` #1–13). Full Markdown/doc fetches were truncated in this sandbox, so deep capability claims fall back to training knowledge (cutoff 2026-01-04) and are explicitly labeled with **Medium** confidence and marked for re-verification.
5. Contradictory evidence actively sought (e.g., "Cursor is fully local" vs "Cursor is cloud-only") — resolved by hierarchy + recency.
6. Every important claim labeled **FACT / EVIDENCE / INFERENCE / HYPOTHESIS / OPINION** in `findings.md`; citations point to `evidence.md`.
7. No invented stats: stars, user counts, benchmark scores, and pricing omitted where not live-verified ("No reliable evidence found").

**Limitations:** No `tavily`/`exa` search tool available; sentiment not live-fetched from HN/Reddit; benchmark leaderboards not re-fetched; `opencode.ai` returned empty in-fetch. Confidence calibrated accordingly.

---

## Sources Consulted

- Official docs/repos for all 12 products (HEAD verified 2026-09-02): Anthropic Claude Code docs, `anthropics/claude-code`, `openai/codex`, `sst/opencode→anomalyco/opencode`, `Aider-AI/aider`, `cline/cline`, `RooCodeInc/Roo-Code`, `OpenHands/OpenHands`, `SWE-agent/SWE-agent`, `cursor.com`, `windsurf.com`, `zed.dev`, local Herdr install. — evidence.md #1–13
- Training data (cutoff 2026-01-04) for capability details — flagged Medium confidence.
- Secondary/comparative reviews and HN/Reddit — **No reliable evidence found** live; training-derived sentiment retained as Low-confidence OPINION.

Full source table: `research/R001/evidence.md`.

---

## Evidence Summary

- **Liveness:** All 12 products returned 200/301/308 on HEAD 2026-09-02 — **High** confidence they exist and are maintained.
- **Repos that moved:** OpenCode (`sst/opencode → anomalyco/opencode`), Aider (`paul-gauthier/aider → Aider-AI/aider`), Roo (`RooVetGit → RooCodeInc`), OpenHands (`All-Hands-AI → OpenHands`) — redirects confirmed.
- **No reliable evidence found** for live benchmark scores, pricing, user counts, or verbatim HN/Reddit quotes in this session — intentionally omitted rather than invented.

---

## Findings

### Overview table (confidence: High for existence, Medium for details)

| Product | Surface | Agent model | Tool system | Context strategy | Repo understanding | Patch/edit | Verification | Multi-agent | Persistence | Local/offline | Differentiator |
|---------|---------|-------------|-------------|------------------|--------------------|------------|--------------|-------------|-------------|---------------|----------------|
| **Claude Code** | CLI (terminal) | Single-agent loop, plan mode, `AskUserQuestion`, MCP | file read/write, bash, search, MCP | search + `CLAUDE.md` memory, recent compaction | Strong (search-first) | Direct edits via tool, ask-before-edit | Bash + user | Sub-agents (limited) | Session + memory file | Cloud-coupled | Best-in-class repo understanding + Anthropic model quality |
| **Codex** | CLI | Single-agent, markdown `AGENTS.md` | `apply_patch`, bash, search | `AGENTS.md`, search | Good | `apply_patch` (structured diff) | Bash | No | Session | Cloud OpenAI | Open-source + OpenAI models |
| **OpenCode** | CLI/TUI | Single-agent, provider-pluggable | Tools + plugins | Search, session context | Good | Direct edit | Bash | No | Session | Yes (local providers) | Provider-agnostic, open, hackable |
| **Aider** | CLI | Pair-programming loop (human-in-the-loop) | SEARCH/REPLACE blocks | Repo-map, git-aware | Excellent (git-native) | SEARCH/REPLACE (precise) | Git diff + tests | No | Git | Yes (broad model support incl local) | Battle-tested edits, git integration |
| **Cline** | VS Code extension | Autonomous (Plan/Act) | VS Code API + MCP | Workspace + MCP | Good | Direct write via VS Code | Terminal + tasks | Modes, no true multi-agent | VS Code state | Provider-agnostic (local possible) | Editors-native autonomy |
| **Roo Code** | VS Code extension (Cline fork) | Modes: Architect/Code/Ask/Debug, roomodes | Same as Cline + mode prompts | Mode-scoped context | Good | Direct write | Terminal | Mode-based pseudo-multi | VS Code state | Provider-agnostic | Opinionated modes |
| **OpenHands** | CLI/server + Docker sandbox | Fully autonomous | Sandboxed bash, browser, editor | Full workspace + sandbox | Strong (sandbox can build/run) | Direct edit in container | Docker sandbox (build/test) | Limited (single heavy agent) | Container ephemeral | Self-hostable | Max autonomy, strong SWE-bench |
| **SWE-agent** | Research harness | ACI (curated interface) | Curated tools (thin ACI) | Issue + repo snapshot | Benchmark-focused | Structured patch | Test harness | No | Ephemeral | Self-hostable | Benchmark throughput |
| **Cursor** | VS Code fork (proprietary) | Agent + Composer + Tab | Editor tools, indexing | Codebase indexing, privacy mode | Strong (index) | Direct edit, Tab prediction | Built-in + terminal | No | Editor state | Cloud-first, privacy mode | Fast indexing + Tab, integrated UX |
| **Windsurf** | VS Code fork (proprietary) | Similar to Cursor (Cascade) | Editor tools | Indexing | Strong | Direct edit | Built-in | No | Editor state | Cloud-first | Generous free tier |
| **Zed** | Native (Rust) editor | Built-in agent | Tool-calling via editor | Workspace + collaboration | Good | Direct edit | Terminal | Collaboration (humans), not agents | Editor state | Provider-agnostic | Performance + real-time collaboration |
| **Herdr** | Terminal multiplexer | Orchestrator (not an LLM agent) | Pane/tab/workspace control | Workspace-aware | Multiplexer-level | Delegates to agents | Delegated | **Yes — multi-agent panes** | **Yes — persistent panes/workspaces** | Local-first | Agent orchestration layer |

Details and weaknesses per product: `findings.md`.

### Contradictions & how resolved

- **"Cursor/Windsurf are fully local"** vs **"they are cloud-first."** — Hierarchy: official docs > anecdotes. Evidence suggests cloud-first with privacy/indexing options, local LLM not first-class. Weighted cloud-first; flagged for re-verification (Medium confidence).
- **"Aider is autonomous"** vs **"Aider is pair-programming."** — Official repo positions it as pair-programming by design; autonomous wrappers exist but are not core. Weighted pair-programming (higher source quality).
- **No hidden contradiction on repo moves** — redirects confirm community forks/moves (OpenCode, Roo, Aider, OpenHands) are FACT, not rumor.

### Known weaknesses & user complaints (Low confidence — no live fetch, labeled OPINION)

- Claude Code: cost, over-eager edits, permission fatigue.
- Codex: terminal-only, less mature tooling.
- OpenCode: small community, churn, docs flux.
- Aider: context-window pain on huge repos, friction with fully autonomous flows.
- Cline/Roo: token burn, noisy edits, prompt sensitivity, fork split.
- OpenHands: slow, expensive, Docker friction, poor persistence.
- SWE-agent: research-only, integration burden.
- Cursor: pricing/lock-in, opaque context, closed-source lag.
- Windsurf: polish/brand churn.
- Zed: thin extension ecosystem, agent immaturity.
- Herdr: nascent, thin docs/community.

---

## Gap Analysis — Why choose a new product?

**Short answer:** No incumbent covers *all* of (a) provider-agnostic + local/offline, (b) lightweight/fast, (c) first-class verification, (d) true persistent multi-agent coordination, (e) open/hackable harness. A new product wins only if it **composes** rather than clones.

**Evidence-backed gaps (Medium confidence):**

1. **Persistent multi-agent coordination.** Most are single-agent (Claude Code, Aider, Cursor, Zed) or single heavy agent (OpenHands). Cline/Roo add modes but not coordinated teams. Herdr is the only multiplexer-native layer. Gap: *teams* of agents with shared ledger, handoff, and recovery — exactly LACE's thesis. — INFERENCE, findings.md Gap
2. **Verification as a first-class loop.** Incumbents delegate to `bash` or Docker adhoc; SWE-agent/OpenHands sandbox is closest but not a product primitive. Gap: spec → tests → gate harness built in, not bolted on. — INFERENCE
3. **Local/offline + enterprise air-gap.** Only Aider/OpenCode/Zed plausibly support local models; Cursor/Windsurf/Claude Code/Codex are cloud-coupled by default. Gap is sharpened in R006: on-prem/VPC story is weak across the board. — INFERENCE
4. **Harness, not another editor/CLI.** The space has 4 CLI agents, 3 VS Code agents, 1 research harness, 1 native editor, 1 multiplexer — but no open harness that *orchestrates existing agents* with standardized tool/context contracts (MCP/LSP/skill) and persists work across restarts. HYPOTHESIS: LACE as "agent-of-agents" is the opening; needs user validation (R002). — HYPOTHESIS

**When NOT to build:** If the goal is just "better single-agent in terminal," use Claude Code or Codex. If "better in-editor," use Cursor/Cline. A new product is justified only if it *composes* these (Herdr-style multiplexing + ledger + verification) rather than replacing one.

---

## Confidence

- Product existence & liveness: **High** (HEAD 2026-09-02).
- Individual capability breakdown: **Medium** (training cutoff 2026-01-04, not live doc re-parse).
- User sentiment/weaknesses: **Low** (no live HN/Reddit fetch).
- Gap analysis: **Medium** (pattern across products, but numbers not verified).

---

## Limitations & Assumptions

- Assumption: narrowest reasonable scope — 12 products as listed; "Herdr" interpreted as the terminal multiplexer observed locally (not a generic term).
- No live search tool; `curl` limited to HEAD — deep docs, issues, benchmarks, and sentiment not re-fetched.
- No invented benchmark/pricing/stars — gaps explicitly noted.
- Training cutoff 2026-01-04; capabilities may have shifted by Sept 2026.

---

## Recommendation

1. **Position LACE as a harness/multiplexer, not a 13th agent.** Compete on orchestration, persistence, and verification — not on LLM quality. Integrate Claude Code/Codex/Aider *inside* Herdr-like panes rather than cloning them.
2. **Re-verify before building:** live-fetch docs for Claude Code sub-agents, OpenCode providers, and Zed agent extensibility; pull top 5 GH issues per product; fetch SWE-bench leaderboard.
3. **Validate gap with users (R002):** confirm multi-agent + persistence pain is real and not solved by "Claude Code + tmux."
4. **Keep open/local story first-class** (links to R006) — that's the clearest durable differentiator vs Cursor/Windsurf/Claude Code.

---

## Artifact Contract

- `report.md` — this file
- `evidence.md` — source table with URLs, dates, quotes
- `findings.md` — labeled FACT/EVIDENCE/INFERENCE/HYPOTHESIS/OPINION bullets
- `open-questions.md` — gaps and follow-ups
