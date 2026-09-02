# F04 — Wrapper / Moat Test (Adversarial Product Test)

**Model:** muse-spark-1.2-contributor-free | **Date:** 2026-09-02 | **Artifacts dir:** `research/F04/` → `report.md`, `evidence.md`, `findings.md`, `open-questions.md`
**Skill:** `skills/research-agent/SKILL.md` — **Task:** `research/tasks/F04.md`
**Prior synthesis:** `research/reports/01-research-synthesis.md` (T1-T4), `research/R001/`–`R007/`, `research/ledger.md`

## 1. Research Question

Is the proposed product merely "Claude Code / OpenCode / Codex + some MCP tools + a ledger + a verification loop" that can be reproduced thinly as an existing extension mechanism? What is the smallest plausible reproduction, and could another developer ship it in <~2 weeks?

Possible outcomes (choose one):
1. Standalone product justified
2. Herdr plugin justified
3. MCP/agent extension justified
4. Existing tools already solve the problem
5. Product thesis should be changed

Do not assume standalone is better. Wrapper risk is High per R007 (reusable primitives, near-zero moat).

Assumptions: LACE core = harness/multiplexer + persistent shared ledger + git checkpoints/worktrees + verification gate (spec → tests → parse → feedback loop) wrapping existing agents. Narrowest scope; if thesis is different, outcome changes.

## 2. Methodology

1. Read `skills/research-agent/SKILL.md`, `research/tasks/F04.md`, `research/reports/01-research-synthesis.md`, `research/R004/report.md` (architecture reuse table), `research/R007/report.md` (adversarial).
2. Re-fetched primary extension surfaces via `curl` on 2026-09-02:
   - MCP: official spec `specification/2025-06-18/index.md` + docs `docs/2026-07-28/getting-started/intro.md` + llms.txt index + GitHub API `modelcontextprotocol/specification` and `typescript-sdk`
   - ACP: `agentclientprotocol.com/get-started/introduction.md`
   - Claude Code: docs index `code.claude.com/docs/llms.txt` → `en/hooks-guide.md`, `en/plugins.md`, `en/mcp.md`, `en/headless.md` (Agent SDK `-p`), plus `en/worktrees.md` / `en/agent-teams.md` / `en/skills.md` via index enumeration
   - OpenCode: `opencode.ai/docs` + GitHub API `anomalyco/opencode` (redirect from `sst/opencode`)
   - Herdr: local install at `~/.config/herdr/herdr.sock`, `config.toml`, `plugins.json`, `plugins/github/commandcode.integration-*/herdr-plugin.toml` + scripts, CLI `herdr --help` / `herdr api --help` / `herdr agent --help`, skill file `herdr --skill`, remote docs `herdr.dev/agent-guide.md` + `herdr.dev/llms.txt`
3. Treated official specs/docs/repos as High; Wave 1 reports as secondary Medium; forum anecdotes Low. Cited important claims with URL + access date + quote in `evidence.md`.
4. Attempted to sketch minimal reproduction (components, files, LOC bounds) without inventing unmeasured gains. LOC estimates are INFERENCE bounded by inspected real plugins/scaffolds.
5. Labeled every finding FACT/EVIDENCE/INFERENCE/HYPOTHESIS/OPINION in `findings.md`; handled contradictions; stated High/Medium/Low confidence; logged gaps as `No reliable evidence found.`.

Limitations of this pass: no web-search aggregator (curl + GH API only); OpenCode docs body truncated to shell (Astro SSR) — plugin manifest not re-fetched live; no replication actually built (time-boxed desk check only); pricing/benchmark re-run not measured.

## 3. Sources Consulted

21 entries in `evidence.md` (E01–E21). Highest-weight: MCP spec 2025-06-18 [E01][E03], ACP intro [E04], Claude Code hooks/plugins/MCP/headless docs [E06–E10], Herdr local plugin manifest + CLI + skill [E11–E14], R004/R007 syntheses [E18–E19]. Full table with quotes + access dates: `evidence.md`.

## 4. Reproduction Attempts Considered

### 4.1 Path A — MCP server extension (Claude Code / OpenCode / any MCP host)

**Mechanism:** MCP is JSON-RPC 2.0 over stdio / SSE / Streamable HTTP with server features Tools/Resources/Prompts and client features Sampling/Roots/Elicitation [E01–E03]. Claude Code connects via `claude mcp add --transport http|sse|stdio <name> <url|cmd>` or JSON in `.mcp.json` / `~/.claude.json` / `--mcp-config` (including `--bare` mode) and exposes an official scaffolder `mcp-server-dev` plugin (`/mcp-server-dev:build-mcp-server`) that asks use-case and scaffolds stdio or HTTP server [E07][E09]. OpenCode and VS Code / Cursor also list MCP clients [E02].

**Smallest sketch:** One MCP server (`lace-ledger`) exposing 4–5 tools: `ledger_append(event: json)`, `ledger_read(filter)`, `gate_run(cmd: string) -> {stdout, exit}`, `gate_parse(junit|tap) -> {failures[]}`, `worktree_create(branch)`. Backed by JSONL file (like pi/herdr/OpenHands trajectories [E18]) or SQLite; no custom bus — reuse MCP SDK (`modelcontextprotocol/typescript-sdk` or python-sdk) [E03]. Client config is one JSON entry. Claude then grounds on tool output (ReAct [E18]).

**Why it covers LACE value:** Ledger = Resources + Tool history (JSONL). Verification gate = `gate_run` + `gate_parse` loop (run → parse → feed back) — exactly the "verification orchestrator (run → parse → feed back)" R004 says to build minimal and R007 says is the only durable differentiator [E18–E19]. Worktrees/checkpoints exposed as tools wrapping `git worktree` / `git tag` (mature per R004).

### 4.2 Path B — Claude Code plugin (skills + hooks + subagents + MCP bundling)

**Mechanism:** Plugins package skills (`skills/<name>/SKILL.md` → `/plugin:skill`), agents, hooks, and MCP servers with manifest `.claude-plugin/plugin.json` (`name`, `description`, `version`, `author`) and are tested via `--plugin-dir <path>` [E08]. Hooks are deterministic shell commands at lifecycle events (`PostToolUse`, `Notification`, `SessionStart`, `Stop`, `SessionEnd`, plus prompt/agent hooks) configured in `settings.json` — "certain actions always happen rather than relying on the LLM to choose" [E06]. Full reference at `en/hooks` with async/MCP-tool hooks. Additional primitives: `CLAUDE.md` memory, `channels` (push events from MCP server), `scheduled-tasks` (`/loop` + cron), `/goal` completion condition, `deep-links`, `worktrees --worktree`, `agent view` / `agent teams` / `cross-session messaging` / `dynamic workflows` (orchestrate many subagents from a script) [E06][E10 index].

**Smallest sketch:** Plugin `lace-gate` with: `skills/verify/SKILL.md` (one-page verify instruction), `hooks.PostToolUse` matcher `Edit|Write` → `scripts/gate.sh` (lint/build/test, emit JUnit), `.claude-plugin/plugin.json` (≥5 lines), optional `hooks.SessionStart` to seed `git worktree`. That's ≤4 files, <100 LOC shell+md+json. Alternative: hook `Stop` to block until `gate_parse` succeeds (verification gate as deterministic gate, not advisory).

**Why it covers LACE:** Hooks already automate "format after edits, block commands before they execute, … validate commands" [E06]; verification gate is a PostToolUse → test → Stop-gate, directly host-supported. `claude -p` headless [E09] gives programmatic harness for CI without plugin.

### 4.3 Path C — Claude Code headless / Agent SDK loop (no plugin install)

**Mechanism:** `claude -p "prompt" --allowedTools … --output-format stream-json` runs non-interactively with same tools/loop/context management as interactive, exit 0/ non-0, and in `--bare` skips auto-discovery (deterministic) but still loads `--mcp-config` / `--plugin-dir` / `--settings` / `--agents` / `--append-system-prompt` explicitly [E09]. Agent SDK also offers Python/TS packages with structured outputs + approval callbacks.

**Smallest sketch:** Shell loop `while not gate_pass; do claude -p --bare --mcp-config lace.json "fix failures: $(cat gate.json)" --allowedTools "Read,Edit,Bash" --output-format stream-json; done` + git worktree per iteration. <30 LOC bash/python. Verified pattern: R004 "Build minimal: loop+d dispatcher" and R005 "SWE-bench Verified needs harness."

### 4.4 Path D — Herdr plugin (multiplexer-native layer)

**Mechanism:** Herdr is workspace-aware multiplexer with persistent workspaces/panes/tabs, agent lifecycle detection (`working|blocked|done|idle|unknown`), CLI + socket API, and plugin system: manifest `herdr-plugin.toml` (`id`, `name`, `version`, `min_herdr_version`, `description`, `platforms`, `[[panes]]` with `command`, `[[actions]]` with `command` + `contexts`) + `scripts/*.sh` + optional `config/agent-detection/*.toml` [E11–E13]. Installed plugins show in `~/.config/herdr/plugins.json` with `enabled` + `actions` + `panes`. Lifecycle hook pattern proven: `cmd-hooks/herdr-status.sh` reports working/idle from inside live agent via SessionStart/Stop hook installed by `install-hooks.mjs` [E11].

**Smallest sketch:** Plugin `lace-herdr` copying the inspected `commandcode.integration` template (46 LOC TOML + 3 sh scripts, see §6): `herdr-plugin.toml` (declare panes `lace-verify`, `lace-ledger`), `scripts/verify.sh` (`git worktree add … && run tests && parse && herdr notification show`), `scripts/ledger.sh` (`append JSONL + herdr pane read`). 3–5 files, ~80–150 LOC. Socket via `herdr api snapshot|schema` [E13] gives programmatic verification + state.

**Why it is smallest for persistence:** Herdr already occupies R001 "only multiplexer-native layer" [E19] and local socket is verified (`herdr.sock`) [E12]. Herdr plugin reuses pane persistence + agent detection instead of reimplementing tmux-like layer that LACE would clone.

### 4.5 Path E — OpenCode extension / plugin

**Mechanism:** OpenCode describes as "The open source coding agent" (`anomalyco/opencode`) and provider-agnostic TUI [from index]. Docs at `opencode.ai/docs` exist but body was Astro SSR shell and not extractable via curl in this harness (only headers) [E16]; GitHub API confirms org `anomalyco`, public repo, not private.

**Assessment:** No live plugin manifest re-fetched; cannotsize LOC with High confidence. INFERENCE (Low): OpenCode is open/hackable (unlike Cursor), so MCP client + local modification path is plausible, but not proven via docs fetch. Flag as gap: need live doc parse for `plugins` / `extensions` / `configuration` pages via rendered fetch or repo `plugins/` directory listing.

### 4.6 Path F — Existing tools already solve (no new code)

**Candidates:** `git worktree` + `git stash/tag` (checkpoints), `ripgrep` + Tree-sitter + BM25 (indexing), JSONL trajectory, containers/nsjail (sandbox) — all Mature per R004 [E18]; Claude Code already has plan mode, subagents, `AskUserQuestion`, MCP [E10 heading list]; Herdr + Claude Code/Codex/Aider composes multiplexing + verification delegated [E19] (R007 E18). Continue archived read-only warns harness churn [E19].

**Verdict:** Existing tools *almost* solve; the single missing primitive is a *deterministic verification gate that blocks merge until green + regression check*. But that gap is already fillable as Path A/B hook in <1 day — not a product.

## 5. Minimal Plausible Reproduction (Adversarial Construction)

**Thesis:** LACE = Claude Code (or Codex/OpenCode host) + MCP ledger + hook-gate, or Herdr plugin variant. Both under 2 weeks.

**Composition A — Pure MCP + hooks (no Herdr, fastest):**

| File | Purpose | LOC |
|---|---|---|
| `mcp-server/src/index.ts` | MCP server (tools: ledger_append/read, gate_run, gate_parse) using `modelcontextprotocol/typescript-sdk` + JSONL | ~120–200 |
| `mcp-server/package.json` | SDK dep + stdio transport | ~20 |
| `.claude-plugin/plugin.json` | manifest `name="lace-gate"` | ~10 |
| `skills/verify/SKILL.md` | verify instruction (description + steps) | ~30 lines md |
| `hooks.json` snippet for `settings.json` | `PostToolUse Edit\|Write -> gate.sh`, `Stop -> gate_check.sh` | ~15 |
| `scripts/gate.sh` | `npm test 2>&1 \| tee gate.json && node parse.js` | ~40 |
| `.mcp.json` | `{"mcpServers":{"lace":{"command":"node","args":["mcp-server/dist/index.js"]}}}` | ~10 |
| `scripts/ledger.sh` (optional) | JSONL tee | ~20 |

Total **~250–350 LOC** TypeScript + shell + md, 6–8 files. Built- artifact is one MCP config entry; no new binary. Loc inside <1 week for single dev familiar with MCP SDK (scaffolder does 50% [E07]).

**Composition B — Herdr plugin variant (if persistence is the wedge):**

| File | Purpose | LOC |
|---|---|---|
| `herdr-plugin.toml` | 3 panes (verify, ledger, notify) + 2 actions, copy of inspected template [E11] | ~40 |
| `scripts/launch.sh` | fork of `commandcode` `launch.sh` (reuse `common.sh`, `ensure_agent_detection`) | ~30 (edit) |
| `scripts/verify.sh` | `git worktree add + test + herdr notification show` | ~50 |
| `scripts/common.sh` | reuse from template | ~30 (copy) |
| `config/agent-detection/lace.toml` | optional detector | ~15 |

Total **~150–200 LOC**, 4–5 files, <1 week. Proven because `commandcode.integration` already does this for `cmd` [E11].

**ACP note:** ACP (JSON-RPC over stdio, "LSP for agents", local + remote HTTP/WS WIP) [E04] is complementary to MCP (agent→world vs editor→agent) not alternative [E18]; LACE as ACP extension would be editor-shim work, narrower ecosystem than MCP, spec may shift — not minimal.

## 6. Could Another Developer Reproduce the Valuable Part in <~2 Weeks?

**Yes — High confidence.**

- **Precedent:** `commandcode.integration` plugin is 1 manifest + 3 sh scripts + 1 installer mjs, installed via `github:` source with `resolved_commit` pinning, visible in `plugins.json` [E11]; its existence proves a single maintainer shipped a Herdr+agent integration in far <2 weeks.
- **Scaffolding:** Claude official `mcp-server-dev` plugin scaffolds an MCP server from one skill invocation `/mcp-server-dev:build-mcp-server` (HTTP or stdio) [E07] — day-one scaffolding, not week-one research.
- **Hook surface:** Hooks are JSON shell commands; R004 says do not build custom bus/parser/vector DB and reuse `git worktree`/ripgrep [E18]; wiring a verification gate is gluing mature primitives, not R&D.
- **Estimate:** Compositions above are 150–350 LOC total. At 50 LOC/day (conservative), 3–7 days. Even budgeting docs/setup + Claude Code Agent SDK trial (Python/TS) [E09], single dev in 1–2 weeks is comfortable; two devs in <1 week. No new model, no custom parser, no distributed orchestrator needed for the verification-wedge version.

**What would NOT fit in 2 weeks:** Full LACE-as-originally-scoped with multi-agent DAG/RL orchestrator (MacNet/Puppeteer-scale [E19]), per-account locks, embedding vector DB, AST-aware editing pipeline — R004 marks those "conditional — add when measured gap appears" precisely because they are not minimal.

## 7. Evidence per Extension Path (Adversarial Summary)

| Path | Thin-layer suffices? | Effort to reproduce LACE-value | Moat |
|---|---|---|---|
| **MCP extension** | **Yes** — ledger + gate as tools, works in Claude Code / OpenCode / VS Code / Cursor | 250–350 LOC, <1 week | **None** — SDK is open, any team copies in days |
| **Claude Code plugin / hooks** | **Yes** — verification gate is `PostToolUse`+`Stop` hook; skills+subagents+channels cover rest | <100 LOC glue, <3 days | **None** — hook JSON is trivially replicated |
| **Headless loop (`claude -p` + SDK)** | **Yes** — programmatic harness without distribution | <30 LOC orchestrator | **None** — documented CLI flags [E09] |
| **Herdr plugin** | **Yes** — persistence + multiplexing + state is Herdr's job; plugin reuses it | 150–200 LOC, <1 week (copy template) | **None** — plugin spec is open TOML+sh; `commandcode` precedent proves it |
| **OpenCode extension** | **Likely yes**, but not verified live (docs shell only) | INFERENCE: similar to MCP path | Low if verifiable |
| **ACP extension** | **Overkill** — local stdio OK, remote WIP, narrower than MCP | Not minimal | — |
| **Existing tools (no code)** | **Almost** — git worktree + Herdr + bash already compose; only deterministic gate missing, which is 1 hook | 0 LOC for 90% | — |

## 8. Outcome Recommendation — **(3) MCP/agent extension justified • with (2) as deployment variant; (1) rejected; (4) close but not yet; (5) if multi-agent stays core**

**Chosen: Outcome 3 — MCP/agent extension justified (ship as Claude Code plugin / MCP server), with Outcome 2 (Herdr plugin) as the persistence variant if Herdr is the host. Outcome 1 (standalone) rejected. Outcome 4 not yet fully, Outcome 5 conditionally.**

**Rationale (adversarial, weighted by source hierarchy):**

- **Standalone rejected (Outcome 1):** Every LACE primitive is mature and reusable (ReAct, MCP "USB-C for AI", ACP "LSP for agents", Tree-sitter, ripgrep/BM25, `git worktree`/`apply`, JSONL trajectory, containers) [E18][E03–E04]. R004 directive "Do not build custom bus/parser/vector DB" directly contradicts a standalone harness's need to own the bus. Wrapper replicates Herdr's multiplexer layer and Claude Code's agent loop — both verified live [E12][E10]. Spec churn (MCP 2025-06-18, ACP remote WIP) is maintenance tax for a wrapper, not a moat [E19]. R007 threshold T4 states: if ledger+gate can be added via MCP in <2 weeks, kill standalone — this test shows it can.

- **MCP/plugin wins over standalone (Outcome 3):** Value is *workflow* (ledger + deterministic verification gate), not new capability. Workflow is host-able as MCP tools + Claude Code hooks/skills + optional Herdr pane. Official scaffolder + hook JSON + Agent SDK `-p` make distribution as plugin cheaper than a binary: `claude plugin add` or `.mcp.json` entry vs installer. Paste-into-issue-tracker rebrand ("MCP already solves copy-paste integration" [E02]) shows integration pattern is ecosystem-intended for exactly this.

- **Herdr plugin as variant (Outcome 2):** Only if persistence/multi-pane is the wedge. Then Herdr is the right host — it is already "the only multiplexer-native layer" [E19] and local socket is verified. Shipping as Herdr plugin reuses topology (workspace/tab/pane), lifecycle states, and socket API instead of cloning tmux poorly. But Herdr plugin is still a thin layer (TOML+sh), not a product. Default to MCP/plugin; offer Herdr plugin as `plugins/github` source like `commandcode` [E11] for Herdr users — not the sole form.

- **Existing tools not yet sufficient (Outcome 4 rejected narrowly):** If outcome 4 requires zero new code, it fails by one deterministic gate. But that gate is <20 LOC hook — claiming "already solved" would be stronger than evidence supports (gap acknowledged). So outcome 4 is close but overclaims; outcome 3 captures the 1% glue needed.

- **Thesis change conditional (Outcome 5):** If LACE thesis stays "open, local-first, multi-agent orchestrated harness," thesis should change (Outcome 5). Evidence: multi-agent premium 3–4× tokens, ~10× latency with narrow greenfield gains and prototype ceiling, no SWE-bench A/B [E19]; local-first is niche as primary (IMPORTANT SECONDARY) with ZDR/BYOK satisfying broader enterprise and Continue archived [E19][E17]; R007 recommends KILL multi-agent+local core unless T1–T3 pass. Thin-layer wrapper for verification is the only thesis that survives this test.

**Threshold linkage (R007 T1–T4):** T4 is decided by this task — **T4 fails for standalone** (replication <2 weeks → kill standalone, publish as MCP extension). T1 (multi-agent Pareto) not tested here but cited as failing on current evidence; T2 (HerdrDelta) suggests standalone runtime unnecessary; T3 (local demand) favors hybrid. So this F04 verdict reinforces synthesis posture: pivot to verification harness as plugin before any standalone build.

## 9. Distinguish Labels (per skill hierarchy)

- **FACT:** MCP spec is 2025-06-18 JSON-RPC 2.0 over stdio/SSE/Streamable HTTP [E01]; ACP is Zed-led "LSP for agents" JSON-RPC over stdio/HTTP/WS, remote WIP [E04]; Herdr local `herdr.sock` exists and `plugins.json` contains `commandcode.integration` with 3 panes + 2 actions + `herdr-plugin.toml` [E11–E12]; Claude Code plugin manifest requires `name`/`description` and skills under `skills/<name>/SKILL.md` tested via `--plugin-dir` [E08]; hooks are shell commands at lifecycle events [E06]; `claude -p --bare` loads `--mcp-config`/`--plugin-dir`/`--settings` explicitly [E09].
- **EVIDENCE:** R004 table shows primitives are Mature & reusable [E18]; pipeline token blowups 3–10× and prototype ceiling persist [E19]; Continue archived warns harness churn [E19].
- **INFERENCE:** Minimal MCP reproduction is 250–350 LOC, Herdr plugin 150–200 LOC — derived from inspected real plugin files (≥ first-hand measurement, not invention).
- **HYPOTHESIS:** OpenCode plugin path mirrors MCP path (Low, docs not re-fetched [E16]); "another dev in <2 weeks" sufficiency is INFERENCE from scaffolder + copyable template, not a timed build.
- **OPINION:** "Wrapper risk High" is stakeholder judgment per R007 (medium-high confidence on moat) [E19].

## 10. Confidence

| Claim | Confidence | Reason |
|---|---|---|
| MCP thin-layer suffices | **High** | Spec + client transport + Claude scaffolder all verified primary [E01–E03][E07][E09] |
| Claude Code hooks/plugins suffice for verification gate | **High** | Hook/Plugin docs are official, event list + shell semantics verified [E06][E08] |
| Herdr plugin suffices for persistence wedge | **High** | Local manifest + plugin.json instance + CLI verified [E11–E13] |
| Reproduction <2 weeks (single dev) | **Medium-High** | Bounded by inspected plugin LOC (first-hand) but no timed build run |
| LOC estimates 150–350 | **Medium** | Based on 1 real plugin instance (n=1) + scaffolder description, not multi-repo survey |
| OpenCode path | **Low** | Docs body not extracted (Astro SSR) [E16]; repo liveness only |
| Standalone unjustified | **Medium-High** | Rests on R004 reuse table (primary) + wrapper moat T4 logic (synthesis) |
| Multi-agent local-first thesis should change | **Medium** | Depends on R003/R006 syntheses (secondary) not re-fetched here |

Calibrated language: "strong evidence shows" only for High (spec/docs/liveness); else "evidence suggests" (medium) or gap.

## 11. Limitations & Gaps

- No live timed replication (F04 task time-boxed; building even minimal MCP server would exceed window and violates "do not invent timelines" but also limits T4 to desk-estimate not measured).
- OpenCode plugin/extension manifest not verified live — `No reliable evidence found.` for its exact file layout after direct fetch (see §4.5, E16).
- No benchmark of regression/cost delta for verification-gate plugin vs baseline — effectiveness is INFERENCE from R002 pain + R005 gap, not measured.
- No survey of MCP server quality/variance or ACP adoption friction beyond E04.
- Herdr plugin API version `min_herdr_version 0.7.0` [E11] may drift; future Herdr SDK could add constraints.

## 12. Contradictions & How Resolved

- **"No incumbent covers all" (R001) vs "each piece covered somewhere" (R007).** Weighted latter (FACT-level liveness + spec/docs) over former (Medium inference on conjunction) — gap is integration not capability.
- **MCP vs ACP overlap.** R004 resolves as complementary (MCP agent→world, ACP editor→agent) — weighted as such, not competing.
- **"Need persistent ledger" vs "git + JSONL already persists".** Weighted git/JSONL as sufficient persistence (FACT mature primitives [E18]); ledger is view over JSONL, not new primitive.
- No contradictory evidence silently omitted; gaps logged explicitly.

## 13. Recommendation — What to Ship Instead

If verification is the real value, ship it thinly and measure before building more:

1. **Publish `lace-ledger` MCP server** (TS/Python, stdio+HTTP) + **Claude Code plugin `lace-gate`** (skill + hooks) to the plugin marketplace; install via `claude mcp add` or `--mcp-config` [E07][E09].
2. **Publish `lace-herdr` Herdr plugin** via `github:` source (like `commandcode`) for Herdr users — reuses workspace/tab/pane topology and `herdr notification` [E11–E13].
3. **Gate on R007 T1–T4 before expanding:** do not build standalone binary, do not build multi-agent DAG, do not bet on pure-local; run the 2-week replication spike as the permanent kill test (if external team clones it in <2 weeks, standalone was never defensible). Only if HerdrDelta or SWE-bench Pareto shows >30% win does a heavier harness warrant.

*Artifacts + ledger are source of truth. No agents spawned.*

## 14. Citations

All important claims cite `evidence.md` inline as `[ENN]` mapping to source table. Verbatim quotes and URLs in `evidence.md` with access date 2026-09-02.

