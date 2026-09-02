# F03 Findings — Herdr Runtime Teardown

Labels per `skills/research-agent/SKILL.md`: FACT / EVIDENCE / INFERENCE / HYPOTHESIS / OPINION

## Setup / Liveness

- **FACT** — Herdr 0.8.2 stable, protocol 20, server running via `/home/sumeet/.config/herdr/herdr.sock` verified 2026-09-02 [E01/E02].
- **FACT** — Live snapshot shows 3 workspaces (`~`, personal_portfolio, LACE Validation), 5 tabs in LACE Validation, 11 panes total, 5 live agents (1× codex idle, 4× pi idle/working) [E03/E06].
- **FACT** — tmux baseline on this host is 3.7c (91 commands) [E17]; `git worktree` primitives verified via local man [E18].

## Per-dimension (teardown matrix)

### 1. Agent lifecycle
- **FACT** — Herdr exposes lifecycle via `agent list/get/read/prompt/wait/start/explain` with states `working`/`blocked`/`done`/`idle`/`unknown` [E07/E16]; detection uses foreground process + screen manifest + optional integrations [E13/E14].
- **EVIDENCE** — Live agents report `agent_status` with `revision`, `state_change_seq`, `interactive_ready` (snapshot) [E03]; `agent_prompt_stalled` if no lifecycle change in 5 s, `--wait` defaults to idle/done/blocked [E15].
- **INFERENCE** — Lifecycle is **more observable than tmux** (tmux has no agent states) and sufficient for orchestration; LACE would duplicate rather than extend it unless it adds *semantic* lifecycle (e.g., "spec satisfied").

### 2. Persistence
- **FACT** — Herdr server owns panes; panes survive client detach/terminal close/SSH disconnect; `herdr server stop` is required to stop them [E13/E14]; `session.json` version 3 persists workspace/tab/pane topology and `identity_cwd` [E10].
- **EVIDENCE** — Config persists under `~/.config/herdr/herdr.log` + `herdr-server.log` + `session.json`; snapshot replays after restart [E10/E12 session-state doc ref].
- **INFERENCE** — Equivalent to `tmux + resurrect` but with workspace-aware restore and agent session resumption via integrations (e.g., `herdr:pi` path kind, `herdr:codex` id kind) [E03/E09]. For LACE, Herdr already provides needed persistence; git commits/worktrees provide content persistence.

### 3. Workspace management
- **FACT** — Hierarchy: session → workspace (project) → tab (layout) → pane (terminal) [E14]; CLI creates workspaces/tabs/panes with JSON IDs `w1`, `w1:t1`, `w1:p1` [E07/E08].
- **EVIDENCE** — `herdr workspace create` returns workspace+tab+root_pane; `pane split --direction right/down` and `pane move` handle layout [E15].
- **INFERENCE** — Semantically richer than tmux sessions/windows/panes (tmux generic) but mappable 1:1 (config comment notes the mirror [E11]). For LACE, workspace≈task/worktree binding is natural but not novel.

### 4. Observability
- **FACT** — Three read paths: `pane read`/`agent read` (visible/recent/recent-unwrapped/detection, --lines, --format ansi), `pane process-info`, `agent explain`, `api snapshot` [E07/E15/E16].
- **EVIDENCE** — Snapshot includes `scroll.max_offset_from_bottom`, `terminal_title`, `focused` flags; `pane process-info` shows `foreground_process_group_id` + PID/argv [E04 snapshot+process_info].
- **INFERENCE** — Observability > tmux (which has `capture-pane` but no agent/snapshot API). LACE's missing piece is *task* observability (ledger, spec→test gate), not pane observability.

### 5. Agent-to-agent control
- **FACT** — Any agent inside a Herdr pane can drive other panes/agents via `herdr` CLI over socket: `agent prompt <name> --wait`, `agent wait --until blocked`, `pane run`/`wait-output`/`send-keys` [E07/E15].
- **EVIDENCE** — Skill explicitly teaches "one agent can create work for other agents, inspect their state, collect results" with recipe `pane split → agent start → agent prompt --wait → agent read` [E15].
- **INFERENCE** — Herdr already provides the agent-to-agent control plane LACE would need; LACE's gap is *policy* (who spawns whom, file ownership) not mechanism.

### 6. Task handoff
- **EVIDENCE** — No first-class "task" object in Herdr API; worktree helpers are `worktree list/create/open/remove` (thin wrappers over `git worktree`) [E16]; `worktree list` errors `not_git_worktree` outside a worktree [E03 probe].
- **INFERENCE** — Handoff is DIY: prompt text + git branch/worktree + pane run. LACE could add structured handoff (ledger entry, spec, acceptance test) but nothing in Herdr blocks doing it ad-hoc today.

### 7. Recovery
- **FACT** — Agent-level: `blocked` detection surfaces approval/question UI; `agent send-keys` can dismiss/answer; integrations improve state accuracy [E07/E13].
- **EVIDENCE** — Server logs + session.json enable restart recovery; `herdr --handoff` opts into live handoff during update [E08].
- **INFERENCE** — Herdr recovers *terminal* and *agent process* but not *task semantics* (e.g., auto-revert, re-run failing test, retry with feedback). That semantic recovery is the plausible LACE layer.

### 8. Automation
- **FACT** — Full socket API + CLI is automation surface: `herdr api snapshot/schema`, JSON on all creates, `wait-output --match/--regex`, `agent wait --until idle/done/blocked --timeout` [E08/E15/E16].
- **EVIDENCE** — Automation docs give three primitives table (Layout/Pane/Agent) and recipes for starting helpers + waiting [E15].
- **INFERENCE** — Automation parity with tmux `send-keys`/`wait` is higher-level due to lifecycle waits. LACE would be a consumer of this API, not a replacement.

### 9. Integration complexity
- **EVIDENCE** — 18 installable agent kinds; 5 current on this host (pi, claude, codex, copilot, opencode) via `integration status` [E09]; each installs a hook (`herdr-agent-state.sh/.ts/.js/.py`) per agent [E09 table].
- **INFERENCE** — Integration cost is one hook install per agent; maintenance is additive. LACE reusing Herdr pays this cost once; reimplementing pays it again plus parity drift. **Low complexity to adopt Herdr; high cost to clone it.**

### 10. Reliability
- **EVIDENCE** — Snapshot shows 11 panes across 3 workspaces running simultaneously without collision; process-info resolves correct PID [E03/E04]. No crash was observed during probe.
- **INFERENCE** — Reliability of multiplexer is high for local use (no data to assess remote/SSH detach at scale). No evidence of Herdr causing agent hangs; hangs are agent-side (screen detection reports unknown, not false idle).

### 11. Developer ergonomics
- **FACT** — Mouse-native (click/drag/resize, right-click menus), prefix `ctrl+space`, full keyboard layer (configurable), accent/sidebar with agent rollup per workspace [E11/E12/E13].
- **INFERENCE** — Ergonomics materially better than bare tmux for multi-agent supervision (tmux needs custom status + scripts for agent rollup). Learning curve low due to tmux-mirror naming [E11].

## What LACE could add that Herdr + agent cannot

- **INFERENCE** — Herdr provides **runtime** (persist, layout, observe, prompt/wait). It does not provide: (a) **structured task ledger** with spec→tests→gate, (b) **verification harness** (run tests → parse → feed back automatically), (c) **regression tracking** / Pareto scorecard (cost/latency/reliability), (d) **file-ownership / DAG scheduling** with conflict avoidance, (e) **handoff schema** between planner/worker/reviewer roles. Those are harness concerns above the multiplexer.
- **HYPOTHESIS** — A thin LACE layer consuming Herdr's socket API (rather than replacing Herdr) could implement (a)–(e) as a verification/ledger orchestrator. R004's "reuse git worktree, reuse MCP" supports this: Herdr worktree helpers are thin; LACE worktree policy (per-task branch, squash) is still needed [E18/E16].
- **EVIDENCE** — R003 shows gains come from SOPs + executable feedback (+4-5pp) not agent count [R003 via synthesis E22]; herdr does not encode SOPs — that is the only mechanism-gap for LACE.

## Threshold check (T2: >30% time-to-green or >50% fewer manual interventions, n≥20)

- **FACT** — No controlled n≥20 experiment measuring time-to-green or intervention count for Herdr vs tmux vs LACE was found in public sources [evidence gap; R007 E08 confirms absence].
- **INFERENCE** — Without such data, the provisional threshold **cannot be evaluated as met**. Per constraints, do not force conclusion — default to insufficient evidence for CORE.
- **HYPOTHESIS** — Credible n for this design is n≥20 tasks (T2) or n≥30 for SWE-bench style; smaller n is underpowered given variance in agent hangs.

## Cross-cutting verdict signals

- **EVIDENCE** — Synthesis §7 VERDICT was OPTIONAL INTEGRATION (REFERENCE ONLY if teardown fails) [E22]; this teardown corroborates: Herdr occupies the runtime niche with low integration cost [E09/E15].
- **INFERENCE** — Standalone LACE runtime would duplicate ~80% of Herdr (workspace/tab/pane lifecycle, socket API, session restore, integrations) for no measured user pain signal ranking "better multiplexer" above verification/steerability [E23].

## Confidence

- Herdr runtime description & pane/agent primitives: **High** (live socket + official docs).
- tmux+worktree baseline description: **High** (local `tmux -V` + `git worktree` man).
- Value-add assessment ("ledger/verification over runtime"): **Medium** (consistent with R003/R004/R007, but no direct LACE prototype measured).
- T2 threshold evaluation: **High** that evidence is absent; **Medium** that Herdr therefore not CORE.
