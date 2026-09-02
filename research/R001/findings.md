# R001 Findings — Competitive Landscape

Labels: **FACT / EVIDENCE / INFERENCE / HYPOTHESIS / OPINION** per `skills/research-agent/SKILL.md`.

## Cross-cutting

- **FACT** — Artifact dir `research/R001/` exists on this machine and HEAD checks on 2026-09-02 confirmed all 12 assigned products have live official URLs (200/301/308). — evidence.md #1–13
- **INFERENCE** — The AI coding-agent ecosystem as of cutoff 2026-01-04 is crowded and stratifying into three layers: (1) terminal/CLI agents (Claude Code, Codex, OpenCode, Aider, OpenHands, SWE-agent), (2) VS Code-fork IDE agents (Cline/Roo, Cursor, Windsurf), (3) native editors/multiplexers (Zed, Herdr). Reasoning: capability sets cluster by surface, not model.
- **HYPOTHESIS** — Differentiation is shifting from "which LLM" to "which agent loop + context + verification strategy" — needs validation via benchmark-controlled comparison.

## Per-product

### Claude Code (Anthropic)
- **FACT** — Anthropic's official agentic CLI that runs in the terminal with file, bash, and search tools. Docs at `docs.anthropic.com` redirect to `platform.claude.com`. — evidence.md #1
- **EVIDENCE** — Official repo `anthropics/claude-code` live (HEAD 200, 2026-09-02). — evidence.md #2
- **EVIDENCE** — Training: single-agent loop with plan mode, `AskUserQuestion`, MCP tool extension; context via codebase search + `CLAUDE.md` memory. — via training, not live re-verified — confidence Medium.
- **OPINION** — Users praise deep repo understanding and low-friction terminal use; complaints cite cost, occasional over-eager edits, permission prompts. — anecdotal, Low confidence (no live HN/Reddit fetch).
- **HYPOTHESIS** — Weakness for LACE: closed-source orchestration, Anthropic-model-coupled, limited local/offline story.

### Codex (OpenAI)
- **FACT** — OpenAI's open-source terminal agent (`openai/codex` repo). — evidence.md #3 HEAD 200.
- **EVIDENCE** — Training: supports multiple OpenAI models, tool system similar to Claude Code (bash, apply_patch), markdown `AGENTS.md` instructions. — Medium confidence.
- **OPINION** — Early adopters report strong model quality but complain about terminal-only surface and less mature tooling vs Claude Code. — Low confidence.
- **INFERENCE** — Differentiator is OpenAI model access + open-source agent loop; weakness is narrower ecosystem vs VS Code agents.

### OpenCode (SST / anomalyco/opencode)
- **FACT** — Open-source agent, repo moved `sst/opencode → anomalyco/opencode` (301 confirmed 2026-09-02). — evidence.md #4
- **EVIDENCE** — Training: pluggable providers (Anthropic/OpenAI/local), TUI, tool system, session persistence. — Medium confidence.
- **INFERENCE** — Differentiator: provider-agnostic + fully open; weakness: smaller community, faster churn, docs instability (redirect).

### Aider
- **FACT** — `paul-gauthier/aider → Aider-AI/aider` redirect confirmed (301). Git-aware pair-programming agent. — evidence.md #5
- **EVIDENCE** — Training: SEARCH/REPLACE block patch strategy, repo-map context, voice/input agnostic, works with many models. — Medium confidence (widely documented).
- **OPINION** — Long-standing users value precise edits and git integration; complaints: context window limits on huge repos, conflict with autonomous agents that bypass git. — Low confidence.
- **INFERENCE** — Differentiator: battle-tested edit strategy + broad model support; weakness: single-agent, non-autonomous by default.

### Cline
- **FACT** — VS Code extension agent `cline/cline` live (HEAD 200). — evidence.md #6
- **EVIDENCE** — Training: autonomous modes (Plan/Act), tool system via VS Code API, MCP support, provider-agnostic. — Medium confidence.
- **OPINION** — Users like autonomy inside editor; complaints: token burn, noisy file edits, prompt sensitivity. — Low confidence.

### Roo Code
- **FACT** — Fork of Cline, `RooVetGit/Roo-Code → RooCodeInc/Roo-Code` (301). — evidence.md #7
- **EVIDENCE** — Training: adds modes (Architect/Code/Ask/Debug), roomodes, custom prompts, multi-model. — Medium confidence.
- **INFERENCE** — Differentiator over Cline: more opinionated modes; weakness: fork lag, community split.

### OpenHands (All-Hands-AI)
- **FACT** — `All-Hands-AI/OpenHands → OpenHands/OpenHands` (301) — formerly OpenDevin. — evidence.md #8
- **EVIDENCE** — Training: fully autonomous SWE agent with sandboxed execution (Docker), strong on SWE-bench, heavy resource use. — Medium confidence.
- **OPINION** — Praised for autonomy; complaints: slow, expensive, poor persistence, Docker friction. — Low confidence.
- **INFERENCE** — Differentiator: maximal autonomy + sandbox; weakness: not a daily driver editor.

### SWE-agent
- **FACT** — Research agent `SWE-agent/SWE-agent` live (HEAD 200). — evidence.md #9
- **EVIDENCE** — Training: built for SWE-bench with ACI (Agent-Computer Interface), tool-curated interface, strong benchmark focus but minimal product surface. — Medium confidence.
- **INFERENCE** — Differentiator: research benchmark throughput; weakness: not a product, integration burden high.

### Cursor
- **FACT** — Proprietary VS Code fork `cursor.com` live (HEAD 200). — evidence.md #10
- **EVIDENCE** — Training: Agent/Composer, Cursor Tab (autocomplete), codebase indexing, privacy mode. — Medium confidence.
- **OPINION** — Users praise Tab + fast indexing; complaints: pricing changes, vendor lock-in, opaque context. — Low confidence.
- **HYPOTHESIS** — Weakness for power users: closed-source fork lags VS Code upstream, limited local model support.

### Windsurf (Codeium)
- **FACT** — `windsurf.com` live (308) — Codeium's editor, formerly Cascade. — evidence.md #11
- **EVIDENCE** — Training: similar to Cursor (VS Code fork, agentic flows, local indexing). — Medium confidence.
- **OPINION** — Users cite generous free tier vs Cursor; complaints: less polished, brand churn. — Low confidence.

### Zed
- **FACT** — Native editor `zed.dev` live (HEAD 200), Rust-based. — evidence.md #12
- **EVIDENCE** — Training: collaborative editing, fast, built-in agent with tool-calling, provider-agnostic. — Medium confidence.
- **INFERENCE** — Differentiator: performance + collaboration; weakness: smaller extension ecosystem, agent less mature than CLI peers.

### Herdr
- **FACT** — Terminal multiplexer for coding agents; local install verified via `/home/sumeet/.config/herdr/herdr.sock` on this machine. — evidence.md #13
- **EVIDENCE** — Training/context: Herdr multiplexes agent panes, workspace-aware, enables parallel agents. — Medium confidence (local evidence strong, public docs not re-fetched).
- **HYPOTHESIS** — Differentiator: agent orchestration / multi-agent persistence layer — exactly LACE's neighborhood; weakness: nascent, docs/community thin.

## Gap analysis (Why choose a new product?)

- **INFERENCE** — No reliable evidence found that any incumbent nails *all* of: (a) fully local/offline, (b) provider-agnostic, (c) lightweight + fast, (d) strong verification (tests/build gates), (e) true multi-agent coordination with persistence, (f) open and hackable. Each product covers 2–4 of these. Confidence: Medium — based on training synthesis, needs live verification.
- **EVIDENCE** — Multi-agent: most incumbents are single-agent (Claude Code, Aider, Cursor, Cline default). Cline/Roo/OpenHands offer limited orchestration; SWE-agent is research-only; Herdr is the only multiplexer-native entry. Gap: coordinated, persistent multi-agent teams with shared context. — Medium confidence.
- **INFERENCE** — Local/offline + privacy: only Aider/OpenCode/Zed offer plausible local-model paths; Cursor/Windsurf/Claude Code/Codex are cloud-coupled by default. Gap: first-class local model + enterprise air-gap story (R006 scope, but relevant here).
- **INFERENCE** — Verification gap: most agents delegate verification to the user or ad-hoc bash tool; none provide first-class "spec → tests → gate" loop out of the box beyond SWE-agent/OpenHands sandbox. Gap: built-in verification harness.
- **HYPOTHESIS** — "LACE" opportunity: a harness that composes *existing* agents (rather than replacing them) via Herdr-like multiplexing + standardized tool/context contracts — i.e., an agent-of-agents with persistence, not another editor. Needs validation with users.

## Confidence summary

- Product existence/liveness: **High** (HEAD checks 2026-09-02).
- Individual capability details: **Medium** (training data, not live doc re-parse).
- User sentiment/weaknesses: **Low** (no live HN/Reddit fetch; anecdotal via training).
- Gap analysis: **Medium** (pattern across products, but live pricing/benchmark/user-count numbers not verified — intentionally omitted).
