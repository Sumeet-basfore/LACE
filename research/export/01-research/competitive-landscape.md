<!-- GENERATED ARTIFACT — COPIED FROM CANONICAL SOURCE -->
<!-- Canonical Source: docs/02-competitive-landscape.md -->
<!-- Category: research -->
<!-- Synchronization: scripts/export_research.py -->

# Competitive Landscape — LACE

**Date:** 2026-09-02 · **Sources:** R001 (12/12 HEAD liveness 2026-09-02), R004 (architecture maturity), R007 (adversarial), F03 (Herdr live 0.8.2 teardown), F04 (wrapper/MCP/Herdr reproduction), F01 (67 GH pain corpus), R005 (benchmarks), R006 (privacy) · **Model:** all workers `muse-spark-1.2-contributor-free` · **Ledger:** `research/ledger.md` (11 tasks COMPLETE) · **Evidence discipline:** weaknesses/pains only if supported by `evidence.md` tables with URL+date+quote; no invented stars/pricing/market share

This is the strategic view. Detailed per-product liveness + redirects in `research/R001/evidence.md` #1–13 and F03 E01-07.

---

## 1. Product Category

| Product | Category | Surface |
|---|---|---|
| **Claude Code** | Single-agent harness — terminal-native | CLI/IDE/desktop/browser |
| **Codex** | Single-agent harness — terminal | CLI (`apply_patch`) |
| **OpenCode** | Single-agent harness — provider-agnostic, open | TUI/CLI |
| **Aider** | Single-agent harness — pair-programming | CLI (git-native) |
| **Cline** | Editor-native autonomous agent | VS Code extension (Plan/Act) |
| **Roo Code** | Editor-native (Cline fork) — opinionated modes | VS Code extension |
| **Cursor** | Editor-native fork — integrated | VS Code fork (proprietary) |
| **Windsurf** | Editor-native fork — integrated | VS Code fork (proprietary) |
| **Zed** | Native editor with agent | Rust editor (proprietary) |
| **OpenHands** | Fully autonomous agent — sandboxed | Docker + server |
| **SWE-agent** | Research harness — ACI benchmark | Research harness |
| **Herdr** | Terminal multiplexer — not an LLM agent | Multiplexer (workspace→tab→pane) |

*Why this matters:* the space already has 4 CLI agents, 3 VS Code agents, 2 forks, 1 native editor, 1 autonomous, 1 research — but **no open harness that orchestrates existing agents with standardized tool/context contracts and persists work across restarts** (R001 gap). That integration slot is the only candidate whitespace, and it is also the thinnest moat (F04).

---

## 2. Core Strength

Each system's acknowledged advantage (per R001, weighted Medium where training-derived, High where live-verified):

- **Claude Code — best-in-class repo understanding + Anthropic model quality.** Plan mode, `AskUserQuestion`, MCP, strong search-first context, `CLAUDE.md` memory + compaction. Docs: "reads your codebase, edits files, runs commands, integrates with tools. Available in terminal, IDE, desktop, browser." [R007 E03, F04 E10]
- **Codex — OpenAI model + `apply_patch` discipline.** Markdown `AGENTS.md` scoping, structured diff, open-source.
- **OpenCode — provider-agnostic, hackable, open ("The open source coding agent" [F04 E20]).** TUI, pluggable models, open harness ethos — closest to LACE's *host* without LACE's verification gate.
- **Aider — battle-tested edits, git integration.** SEARCH/REPLACE blocks, repo-map, broad model support incl local (Ollama/LM Studio [R006]), git-aware.
- **Cline — editor-native autonomy.** Plan/Act autonomy with VS Code API + MCP, workspace context.
- **Roo Code — opinionated modes (Architect/Code/Ask/Debug).** Fork of Cline with mode prompts.
- **OpenHands — max autonomy, strong SWE-bench.** Docker sandbox that can build/run, fully autonomous heavy agent.
- **SWE-agent — benchmark throughput.** Curated ACI, high throughput on SWE-bench, research harness standard.
- **Cursor — fast indexing + Tab + integrated UX.** Codebase indexing, privacy mode, Composer/Agent; closed-source.
- **Windsurf — Cascade + generous free tier.** Similar to Cursor, brand churn but polished.
- **Zed — performance + real-time collaboration.** Rust-native, human collaboration (not agent teams), provider-agnostic.
- **Herdr — agent orchestration layer.** Not an LLM agent: workspace-aware panes/tabs, persistent workspaces, agent lifecycle (`working/blocked/done/idle/unknown`, `agent_prompt_stalled` 5s), `agent prompt --wait`, socket API, `git worktree` wrapper, integrations for 5 agents (pi/claude/codex/copilot/opencode) — **only multiplexer-native layer** [R001, F03 E07/E14].

---

## 3. Relevant Capabilities

Focus: coding loop, tools, repo understanding, editing, verification, persistence, multi-agent, local/provider flexibility, extensibility, runtime/orchestration — maturity per R004 (reuse, don't rebuild).

| Capability | Who does it well today |
|---|---|
| **Coding loop** | All — ReAct is mature (+34% ALFWorld, +10% WebShop [R004 E01]) is baseline loop. Plan→Act is moderate (research-active) — Claude plan mode, Aider architect mode, Cursor plan mode. |
| **Tools** | All — file read/write, bash, search, MCP. Mature but sprawl hurts selection. |
| **Repo understanding** | **Claude Code, Aider, Cursor** strong (search-first + repo-map + indexing). Others good; all use search + `CLAUDE.md`/`AGENTS.md` memory + Tree-sitter/ripgrep/BM25 (mature per R004). |
| **Editing** | Aider (SEARCH/REPLACE precise), Codex (`apply_patch` structured), Claude/Cursor (direct write + Tab). Unified diffs + `git apply` are mature. AST-aware editing is emerging (comby/ast-grep), not needed as core. |
| **Verification** | **No one does verification as first-class product primitive.** SWE-agent/OpenHands sandbox is closest but verification is `bash`/Docker adhoc, not a gate. All delegate to `bash` or Docker; no product exposes `spec→tests→gate→parse→feedback→regression` with Pareto logging (R005 gap). This is the sole candidate differentiator (see §7). |
| **Persistence** | **Herdr + git** — Herdr server owns panes survives detach/SSH close, `session.json` v3 restores layout [F03 E10]; `git worktree`/`stash`/`tag` mature. Claude Code has `CLAUDE.md` memory + session; editors have state. |
| **Multi-agent** | **Herdr only (multiplexer); modes (Cline/Roo) are pseudo-multi.** ChatDev/MetaGPT are research, not products. Prior gains narrow: ChatDev 0.395 vs 0.152, MetaGPT +19pp HumanEval via SOPs+feedback, but 3–10× cost, prototype ceiling, **No reliable evidence found** for SWE-bench A/B [R003, F02]. |
| **Local / provider flexibility** | **Aider, OpenCode, Zed** (provider-agnostic, Ollama/LM Studio); **Ollama/LM Studio** runtime mature (one-line install, Docker, broad library [R006]); **GitHub Copilot** offers BYOK/ZDR/sandboxing (enterprise productized) [R006 E07]. Cursor/Windsurf/Claude Code cloud-first. Continue *archived read-only* warns fragile UX [R006 E05]. |
| **Extensibility** | **All via MCP 2025-06-18** ("USB-C for AI" JSON-RPC over stdio/SSE/Streamable HTTP [F04 E01]) + **ACP** ("LSP for agents" JSON-RPC over stdio/HTTP/WS, remote WIP [F04 E04]). Claude Code adds hooks (`PostToolUse`/`Stop`/`SessionStart`), skills (`skills/<name>/SKILL.md`), subagents, `claude -p --bare` headless [F04 E06-E09]; Herdr adds plugin system (`herdr-plugin.toml` + `scripts/*.sh` + socket API [F04 E11-14]). |
| **Runtime / orchestration** | **Herdr** is workspace→tab→pane with JSON IDs, `agent wait --until blocked`, `pane wait-output --match/regex`, `wait 5-sec lifecycle` [F03 E15]; `tmux 3.7c` 91 commands — generic, no agent awareness. `git worktree` primitives identical under both. **LACE as standalone runtime would duplicate:** workspace lifecycle + socket API + integration hooks — ~duplicate per F03 teardown. |

---

## 4. Relevant Weaknesses

Only where research supports (GH issues or official behavior, not invented). Low-confidence sentiment (training-derived) flagged explicitly.

- **Claude Code — cost, over-eager edits, permission fatigue** (R001 Low sentiment without live HN re-fetch; also F01 opposite polls — remove proactivity #13753 vs permission spam — show heterogeneity).
- **Codex — terminal-only, less mature tooling** (R001 Medium).
- **OpenCode — small community, churn (`sst/opencode → anomalyco/opencode` redirect verified), docs flux** (R001 HEAD 301, small sample in F01).
- **Aider — context-window pain on huge repos, friction with fully autonomous flows** (F01 context_loss n=4).
- **Cline / Roo — token burn, noisy edits, prompt sensitivity, fork split.** Loops/hangs evidenced: PLAN hangs indefinitely with Ollama (§13750), ReportFindings loop (6 comments #13492), TUI flashing. [F01, R001]
- **OpenHands — slow/expensive, Docker friction, container ephemeral** (R001 Medium).
- **SWE-agent — research-only, integration burden** (R001).
- **Cursor — pricing/lock-in, opaque context, closed-source lag** (R001 Low sentiment).
- **Windsurf — polish/brand churn, 308 redirect churn** (R001 HEAD 308).
- **Zed — thin extension ecosystem, agent immaturity** (R001 Medium).
- **SWE-bench-adjacent ecosystem — test incorrectness** — Verified kept only 500/2,294, Lite filters remove multi-file/>3-hunk/file-create tasks (precisely LACE claim) [R005, F02].
- **Herdr — nascent, thin docs, integration 5/18 kinds installed** — but not missing primitive; weakness is maturity not capability [F03, R001].

**Not weak (mature, don't rebuild):** ReAct, MCP, Tree-sitter/ripgrep/BM25, `git worktree`/`apply`, JSONL trajectory, containers — all mature reuse per R004.

---

## 5. User Pain / Open Issues

Reference actual evidence — not personas. F01 corpus (67 GH) + R002 (15) + F03/F04, all with URL+quote in `evidence.md`. Do not convert corpus % to population prevalence.

- **Context loss / drift:** "Small tasks work fine... But when I tried building something real... difficult to keep agent on track throughout entire feature... context is state" [F01 H01, R002 E11] — 6% corpus, but High severity for long-horizon (value proposition). F01 shows fix PRs re-truncating budgeted output, truncation limits, hook delivery failures [F01 #13693, #13297].
- **Hallucinated / unreliable edits:** doubled-prefix headers [F01 #5112], unknown MCP tool forwarded → opaque error [F01 #12977], indented fenced-block filename miss, malformed tool-call args [F01 #13092] — 9% corpus, High severity (silent incorrectness).
- **Verification burden:** opposite polls — remove `BE HELPFUL AND PROACTIVE` [F01 #13753] vs "asks permission for every access" [F01 #13101]; permission checks PR [F01 #167]. Shows heterogeneity — ideal friction varies by user/task. 21% corpus but includes fix PRs.
- **Regression / state loss:** "Add file discards all changes" (4 comments #3581) + "rolls back my manual changes" [F01 #3965] — 10% corpus, High severity (data loss), hybrid harness/model.
- **Loops / hangs:** PLAN hangs indefinitely with Ollama — no logs [F01 #13750]; ReportFindings loop 6 comments [F01 #13492]; degenerate output loops — 7% corpus, High severity (blocks use). Pilot shows retry can rescue one bug but at 2.05× cost.
- **Progress visibility:** same symptom in two products — "no progress signal while tool-call arguments stream" [F01 #46734] + SSE delivers only heartbeats [F01 #46733] — 9% corpus, harness-fixable.
- **Privacy / credential trust:** 21% corpus (14) — 3 identical trust-adapter proposals same week (Cline #13737, Continue #13212, Aider #5665) + telemetry ships unredacted URLs/paths [F01 #5621], `.env override=True` silently replaces shell vars [F01 #5622], `allowHeadless` for MCP [F01 #9327] — cross-repo, High severity for enterprise; buyer pressure proved by Copilot BYOK/ZDR/sandbox productization [R006 E07].
- **Cost / latency:** 16% corpus — pricing 15-300× over list [F01 #13184], high token usage with reasoning models [F01 #253]; pilot per-retry 2.05× at edge; R003 3-10× for multi-agent — Medium severity (costly not correctness).

All above are filed against *incumbent harnesses* — they are direct signals that verification/steerability gaps persist even inside existing solutions.

---

## 6. Overlap With Proposed Product

**Proposed pivoted product (after validation):** thin verification-first extension(s) — MCP server `lace-ledger` + Claude Code plugin `lace-gate` (skill + `PostToolUse`/`Stop` hooks) + optional Herdr plugin `lace-herdr`, sharing the same `spec→tests→gate→parse→feedback` core with worktree isolation, JSONL ledger, and Pareto scorecard. [02 §9-§12]

**Overlap is large — which is why standalone is rejected:**

- **Every primitive overlaps:** ReAct loop, MCP tool bus, Tree-sitter/ripgrep/BM25 search, `git worktree`/`apply`, JSONL trajectory, containers — all mature reuse per R004; LACE would compose them, not invent them. F04 shows each primitive is already host-supported: MCP spec [E01], ACP [E04], Claude hooks/skills/headless `-p --bare` [E06-E09], Herdr plugin manifest + socket [E11-14].
- **Herdr host already does multiplexer part** — workspace-aware panes/tabs, persistence, agent lifecycle (`agent prompt --wait`) [F03]. Plugin reuses it (150-200 LOC copy of `commandcode.integration`), not rebuilds it — overlap ~80% if LACE shipped standalone runtime.
- **Claude Code host already does agent part** — read codebase, edit files, run commands, plan mode, subagents, MCP, `claude -p` headless — verification gate is 1 hook (<20 LOC) on top, not a new agent.
- **Overlap is the moat risk:** F04 shows any team can add ledger+gate as MCP in <2 weeks (250-350 LOC + scaffolder) — so standalone's overlap is defensibility risk (T4 fails). The *different* part is *deterministic verification + regression gate + cost transparency* — that is 1% glue the incumbents don't productize as a gate.

---

## 7. Remaining Whitespace

What appears insufficiently solved after accounting for overlap — Medium confidence where pilot unproven, High where spec/gap is official:

1. **Deterministic verification gate as product primitive** — incumbents delegate to `bash`/Docker adhoc; SWE-agent sandbox is closest but not a gate that *blocks merge on red/regression*. No benchmark reports regression rate or human-intervention rate [R005, F02]. User pain (loops/hangs, silent hallucinations, discarded changes) confirms gap. **Validated wedge.**
2. **Cost-adjusted reliability transparency** — leaderboards report `% resolved` alone, ignoring regression/cost/latency/reliability/recovery/context [R005]. F02 prescribes Pareto scorecard on Verified n≥30 + rolling post-cutoff split — no incumbent publishes this. Reproducibility + harness confounding (Verified's mini-SWE-agent admission [R005]) is weakness the thin extension can own.
3. **Trust / MCP governance as opt-in proxy** — 21% corpus + 3 identical proposals same week prove cross-repo demand; Copilot BYOK/ZDR productization proves buyer pressure, but no incumbent offers a *lightweight, host-native* governance proxy for MCP that is off by default and on for enterprise (`allowHeadless` precedent). **Validated but not market-sized** (no survey).
4. **Steerability affordances that cost <2 weeks** — progress signal while streaming, timeout/Stop keep-alive, hallucinated-tool rejection, worktree ownership lock. Each is harness-fixable (PRs already patch them singly) but no product bundles them as a coherent verification/steerability layer.

**Whitespaces that are *not* sufficient as wedges now (kept Experimental/Secondary):**
- Persistent multi-agent teams — only Herdr offers it, but F02 multi-agent not tested, cost 3–10×, no SWE-bench A/B, no demand in 67 issues — needs T1 Pareto. [02 §5]
- Pure-local / 8GB-first — runtime exists, but ZDR/BYOK satisfies broader market, Continue archived, no bench — IMPORTANT SECONDARY, not primary, until T3 (≥40% pure-local mandatory). [02 §6]

---

## 8. "Why Would Someone Use Us Instead?"

**The most important section — answered honestly with evidence.**

**The strong answer (only for the pivoted wedge, not the original thesis):**

> Use us if you want an existing agent (Claude Code, Codex, OpenCode) to behave like a *measured, reversible* verification loop — spec → tests → gate → structured feedback → bounded recovery → regression check — with cost/reliability/regression logged on every run — without adopting a new platform, model, or editor, and with a single-file install (MCP JSON or plugin) or Herdr pane if you already use Herdr.

That pitch is **narrowly defensible** because:
- It directly solves the highest-severity harness-solvable pains identified in 67 GH issues (verification burden vs loops/hangs vs progress vs privacy) with PR-proven patterns, without claiming to cure model hallucination.
- It ships as **host-native extension**, so you keep your agent/model/editor (rejects "yet another agent" churn Continue warns of).
- It owns the **missing Pareto transparency** no incumbent publishes (regression, cost, reliability, recovery on Verified n≥30 + rolling split) — a durable differentiator only if it *actually* publishes numbers after the powered run.

**Weak or disqualifying answers (say so explicitly):**

- **"Use us instead of Claude Code/Codex because we are a better agent"** — **No reliable evidence.** Head 12/12 live + "reads your codebase, edits files, runs commands..." [R007 E03] + SWE-bench 500/2294 filtering shows frontier models + harness control not solved by a new agent. Standalone as 13th agent is the rejected thesis.
- **"Use us because we are local-first / 8GB promise"** — **Weak.** Runtime is mature, but Copilot BYOK/ZDR already satisfies most enterprise, pure-local niche un-sized, no 8GB bench, Continue archived. Local as *hybrid option* is defensible; as *primary wedge* is not until T3 passes. [02 §6]
- **"Use us because we do multi-agent teams"** — **Weak.** No demand in 67 issues, cost 3–10×, +19pp via SOPs+feedback not agent count, prototype ceiling, no SWE-bench A/B. Teams remain Experimental until T1 Pareto. [02 §5]
- **"Use us instead of Herdr"** — **False comparison.** Herdr is multiplexer, not LLM agent; we *use* Herdr or `tmux+worktree`, we don't replace it. T2 HerdrDelta is untested — no evidence we beat Herdr+agent on time-to-green. [02 §6]
- **"Use us for better repo indexing / vector DB / AST editing"** — **Rejected.** R004 marks those mature reuse — ripgrep/BM25 + Tree-sitter sufficient baseline, embeddings/AST conditional ("add when measured gap appears").

**Honest bottom line per research:** On current evidence, a standalone platform would be "Claude Code/OpenCode + MCP + ledger + gate" with **near-zero moat** — any team can add it in <1 week (F04). The only reason to use us *instead* is that we are **thin enough to use *inside* Claude Code/OpenCode/Herdr** and **measured enough to prove you should** — and that second half is **not yet proven** (pilot CI overlaps, needs n≥30 Verified at scale). Until the powered Pareto run passes T1, the answer remains **"you wouldn't — use Claude Code + Herdr + git worktrees, or add one hook"** [F04]. The PIVOT is a hypothesis to test, not a proven switching reason.

