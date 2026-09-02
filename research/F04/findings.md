# F04 Findings — Wrapper / Moat Test

Per `skills/research-agent/SKILL.md` labeling hierarchy: **FACT / EVIDENCE / INFERENCE / HYPOTHESIS / OPINION**. Confidence per bullet.

---

## A. Extension Surface Is Mature & Documented (FACT/EVIDENCE)

- **FACT [High]** — MCP 2025-06-18 spec is JSON-RPC 2.0 over stdio / SSE / Streamable HTTP with Host/Client/Server roles and capability negotiation; servers offer Resources/Prompts/Tools [E01].
  - Confidence: **High** — official spec fetched 2026-09-02.

- **FACT [High]** — MCP is positioned as "USB-C for AI" and supported by Claude, ChatGPT, VS Code, Cursor, MCPJam etc.: "MCP provides a standardized way to connect AI applications to external systems" [E02].
  - Confidence: **High**.

- **FACT [High]** — MCP TypeScript SDK exists at `modelcontextprotocol/typescript-sdk` (GitHub API verified) alongside spec repo `modelcontextprotocol/modelcontextprotocol` [E03].
  - Confidence: **High**.

- **FACT [High]** — ACP standardizes editor↔agent like LSP did for language servers: "Local agents run ... via JSON-RPC over stdio. Remote agents ... over HTTP or WebSocket. Full support for remote agents is a work in progress." It reuses MCP JSON representations where possible [E04].
  - Confidence: **High**.

- **FACT [High]** — Claude Code ships hooks as deterministic shell commands at lifecycle events (`PostToolUse`, `Notification`, `SessionStart`, `Stop`, `SessionEnd`, prompt/agent, async, MCP tool) configured in `settings.json` — "certain actions always happen rather than relying on the LLM to choose" [E06].
  - Confidence: **High** — official hook guide.

- **FACT [High]** — Claude Code connects MCP via `claude mcp add --transport http|sse|stdio` or JSON in `.mcp.json`/`~/.claude.json`/`--mcp-config` (including `--bare` mode) with `type: http|streamable-http|sse`; official `mcp-server-dev` plugin scaffolds stdio or HTTP server from one skill invocation [E07].
  - Confidence: **High**.

- **FACT [High]** — Claude Code plugins require `.claude-plugin/plugin.json` (`name`, `description`, `version`, `author`) and skills at `skills/<name>/SKILL.md` namespaced `/plugin:skill`, testable via `--plugin-dir <path>`; standalone `.claude/` alternative documented [E08].
  - Confidence: **High**.

- **FACT [High]** — `claude -p` headless non-interactive mode exists with `--bare` (skip auto-discovery), `--mcp-config`, `--plugin-dir`, `--settings`, `--agents`, `--append-system-prompt`, streams via `--output-format stream-json`, and Python/TS Agent SDK packages [E09].
  - Confidence: **High**.

- **FACT [High]** — Herdr plugin shape is TOML manifest `herdr-plugin.toml` (`id`, `name`, `version`, `min_herdr_version`, `description`, `platforms`, `[[panes]]` with `command`, `[[actions]]` with `command`+`contexts`) shipped as `plugins/github/<id>-<hash>/` with `plugins.json` registry (`enabled`, `source.kind=github`, `resolved_commit`) and `scripts/*.sh` + optional `config/agent-detection/*.toml` [E11].
  - Confidence: **High** — first-hand filesystem of `commandcode.integration` (n=1 instance).

- **FACT [High]** — Herdr multiplexer is live on this machine: socket `~/.config/herdr/herdr.sock` exists, `config.toml` defines prefix `ctrl+space`, terminal, theme; `session.json` shows workspaces `w1`/`w2` with tabs/panes [E12].
  - Confidence: **High** — direct file + `herdr --help`.

- **FACT [High]** — Herdr CLI exposes `workspace`, `tab`, `pane`, `agent`, `worktree`, `terminal`, `notification`, `integration`, `session`, `api (snapshot,schema)`; agent states are `working`/`blocked`/`done`/`idle`/`unknown` with explicit semantics (`idle` ready, `done` post-background, `blocked` approval UI) [E13].
  - Confidence: **High** — binary help is authority.

- **EVIDENCE [Medium]** — Herdr docs at `herdr.dev/llms.txt` (stable 0.8.2) enumerate agent-automation, plugins, socket-api, marketplace, integrations (Pi, Claude, Codex, OpenCode etc.); `herdr.dev/agent-guide.md` prescribes `curl -fsSL https://herdr.dev/install.sh | sh` install path [E14].
  - Confidence: **Medium** — remote docs fetched, not local binary cross-checked beyond help.

- **EVIDENCE [Medium]** — Claude Code surface breadth (subagents, agent view/teams, cross-session messaging, dynamic workflows, worktrees `--worktree`, channels, `/goal`, scheduled tasks `/loop`+cron, `CLAUDE.md`) is listed in docs index [E10] but body not fetched — existence High, detail Medium.

- **FACT [Medium]** — OpenCode docs exist at `opencode.ai/docs` (Starlight shell fetched) but Markdown body not extractable via curl (SSR) [E15]; repo liveness via GitHub API `anomalyco/opencode` (public, "The open source coding agent") and redirect from `sst/opencode` [E16] — site exists but plugin manifest not verified.
  - Confidence: **High** for existence, **Low** for plugin capability detail.

## B. Minimal Reproduction Is Thin (INFERENCE, bounded by first-hand LOC)

- **INFERENCE [Medium-High]** — Smallest MCP ledger+gate reproduction is **~250–350 LOC** (TS/Python MCP server + plugin JSON + SKILL.md + 2 shell hooks) across 6–8 files — bounded by inspected Herdr plugin instance (46-line TOML + 3 sh scripts) and Claude scaffold promise; no custombus/parser/vector DB needed [E11][E18].
  - Confidence: **Medium** — based on n=1 real plugin instance + scaffolder description, not multi-plugin survey.

- **INFERENCE [Medium-High]** — Smallest Herdr plugin variant is **~150–200 LOC** (TOML + 2–3 sh scripts + optional detector), copying `commandcode.integration` template that already does agent-in-pane + status hook lifecycle [E11]; verified copy cost is edit not write.
  - Confidence: **Medium-High** — template is first-hand.

- **INFERENCE [Medium-High]** — Single developer can ship either composition in **<1 week**; even conservative 50 LOC/day → 3–7 days for code, plus setup/docs → comfortably **<2 weeks**. Scaffolder reduces MCP server to day-one [E07].
  - Confidence: **Medium-High** — not a timed build, so not High.

- **INFERENCE [Medium]** — `claude -p --bare --mcp-config lace.json` loop is **<30 LOC** orchestrator (bash/python), leveraging documented headless flags [E09]; verification-gate-only variant needs no MCP at all (pure hooks).
  - Confidence: **Medium**.

## C. Wrapper Moat Evaluation (INFERENCE/OPINION)

- **EVIDENCE [High]** — R004 reuse table marks every LACE primitive Mature & Reuse: ReAct, MCP 2025-06-18, ACP, Tree-sitter, ripgrep/BM25, `git worktree`/`apply`, JSONL trajectory, containers; Plan→Act/embeddings/AST/ACP-remote are conditional [E18]. Direct quote: "Do not build custom bus/parser/vector DB — MCP covers it."
  - Confidence: **High** for primitive maturity (primary spec/repo backed); **Medium** for "LACE should reuse" recommendation.

- **INFERENCE [Medium-High]** — Standalone harness moat is near-zero: wrapping Claude Code/OpenCode + MCP + ledger + verification replicates a multiplexer layer Herdr already owns ("the only multiplexer-native layer" per R001 [E19]) and an agent loop Claude Code already ships [E10]; spec churn (MCP 2025-06-18, ACP remote WIP [E01][E04]) is maintenance tax, not defensibility.
  - Confidence: **Medium-High** — weighted primary specs + first-hand Herdr socket, but not a market study.

- **EVIDENCE [Medium-High]** — Harness churn precedent: Continue archived read-only (via R007 [E17]) warns standalone wrappers are easily orphaned; MCP ecosystem explicitly aims to commoditize integrations [E02][E07].
  - Confidence: **Medium-High**.

- **OPINION [Medium]** — Wrapper risk is **High** per R007 synthesis: "near-zero moat; OpenCode and Claude MCP already do similar composition" [E19] — stakeholder judgment, weighted Medium-High due to reuse table grounding.
  - Confidence: **Medium** (opinion, attributed).

## D. Outcome Assessment (INFERENCE, adversarial)

- **INFERENCE [Medium-High]** — **Outcome 1 (standalone justified) REJECTED.** Thin-layer paths cover the valuable part (ledger + deterministic verification gate) with 150–350 LOC and no new binary; T4 threshold ("if ledger+gate via MCP <2 weeks, kill standalone" [E19]) is satisfied on desk-estimate.
  - Confidence: **Medium-High**.

- **INFERENCE [Medium-High]** — **Outcome 3 (MCP/agent extension justified) SELECTED.** Value is workflow (ledger + gate), hostable as MCP tools + Claude Code hooks/skills. Distribution as plugin/mcp config is cheaper than product; any team copies in days — but shipping as extension is still justified if verification gap is real.
  - Confidence: **Medium-High**.

- **INFERENCE [Medium]** — **Outcome 2 (Herdr plugin justified) as variant — not standalone.** If persistence/multi-pane is the wedge, Herdr is the correct host (reuse topology + lifecycle + socket API [E13]); but it is still a thin plugin (TOML+sh), not a product [E11]. Default to Outcome 3; offer Outcome 2 as `github:` source for Herdr users.
  - Confidence: **Medium**.

- **INFERENCE [Medium]** — **Outcome 4 (existing tools already solve) close but REJECTED narrowly.** `git worktree` + Herdr + bash compose 90%, but deterministic gate that blocks until green/regression-check is one hook missing — claiming zero new code overclaims by <20 LOC [E06].
  - Confidence: **Medium**.

- **INFERENCE [Medium]** — **Outcome 5 (thesis should change) CONDITIONALLY TRUE** if thesis stays "open, local-first, multi-agent orchestrated harness." Multi-agent premium 3–10× with prototype ceiling and no SWE-bench A/B, local-first niche as primary (IMPORTANT SECONDARY, ZDR/BYOK broader, Continue archived) [E19] invalidate original thesis; verification-only plugin thesis survives.
  - Confidence: **Medium** — depends on secondary synthesis for multi-agent/local claims.

## E. Distinguishing Labels (FACT vs OPINION)

- **FACT:** extension surface definitions, CLI flags, file shapes, socket existence are verifiable directly (E01–E14, local FS) — **High**.
- **EVIDENCE:** reuse maturity, cost premium, churn precedent rest on tables/synthesis [E18–E19] — **High/Medium**.
- **INFERENCE:** LOC bounds and <2-week sufficiency are derived from inspected real plugin + scaffolder, not timed build — **Medium-High**.
- **HYPOTHESIS:** OpenCode extension mirrors MCP path — **Low** (docs shell only [E15]).
- **OPINION:** "wrapper risk High" / "standalone never defensible if clone <2 weeks" — attributed to R007/adversarial framing [E19] — **Medium**.

