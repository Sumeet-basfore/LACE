# F03 — Herdr Runtime Teardown

**Worker:** F03 (lace-f03) — **Model:** muse-spark-1.2-contributor-free — **Date:** 2026-09-02
**Artifacts:** `research/F03/report.md` · `evidence.md` · `findings.md` · `open-questions.md`
**Skill:** `skills/research-agent/SKILL.md` — **Task:** `research/tasks/F03.md`
**Synthesis reference:** `research/reports/01-research-synthesis.md` §7/§10 (T2 threshold)

## Research Question

Does Herdr provide a meaningful technical advantage for the proposed product?

Conceptually and/or experimentally compare:

```
tmux + git worktree + existing coding agent
vs
Herdr + git worktree + existing coding agent
vs
proposed LACE orchestration layer
```

Core Q: What can LACE provide that Herdr + existing agent cannot already provide? Provisional gate: Herdr as **CORE** only if `>30% time-to-green` OR `>50% fewer manual interventions` on a credible sample (n≥20, justified). Do not force conclusion.

## Methodology

1. Read `research/tasks/F03.md`, `skills/research-agent/SKILL.md`, `research/reports/01-research-synthesis.md`, `research/ledger.md` fully before probing.
2. Live Herdr probe on this host (no mutations):
   - `herdr status`, `herdr --help`, sub-helps (`workspace`/`pane`/`tab`/`agent`/`worktree`/`api`/`integration`), `herdr --skill`, `herdr api snapshot`, `herdr pane current --current`, `herdr workspace/agent list`, `herdr integration status`, `herdr pane process-info --current`.
   - File checks: `/home/sumeet/.config/herdr/herdr.sock`, `session.json` (v3), `config.toml`, `herdr.log` presence.
3. Baseline checks: `tmux -V` + `tmux list-commands | wc -l`, `git worktree --help` (local man).
4. Official docs via `curl -fsSL`: `https://herdr.dev/llms.txt`, `https://herdr.dev/agent-guide.md`, and raw `v0.8.2` docs `concepts.mdx` + `agent-automation.mdx` (concepts, automation, agents, session-state, socket-api refs).
5. Cross-read Wave 1 inputs: R001 (Herdr as only multiplexer-native layer), R004 (reuse git worktree/MCP/ripgrep — do not build custom bus), R007 §5 (Herdr sufficiency + wrapper risk), synthesis §7/§10 T2 threshold.
6. No new agents spawned; no `workspace create`/`pane split` mutation; `herdr worktree list` probed read-only (returned `not_git_worktree` as expected outside worktree).
7. Source hierarchy enforced: live Herdr socket + official docs > official repos/specs > Wave 1 syntheses (secondary) > forum anecdote. Every important claim cited to `evidence.md` (E01–E23). Gaps state "No reliable evidence found".

**Limitations of this pass:** no `tavily`/`exa` search (same constraint as R001/R007); no n≥20 timed experiment — threshold therefore assessed as *untested* not *failed*; no `agent explain --json` or alternate-screen read depth probed; pricing/bench not JS-rendered.

## Sources Consulted

23 sources in `evidence.md` (E01–E23). Highest-weight: live socket/API (E01–E06), skill + docs (E07/E13–E15), config/session.json (E10–E11), tmux/git baselines (E17–E18). Full table with quotes: `evidence.md`.

## Teardown Matrix

Scores: **Herdr advantage over tmux** = None / Marginal / Material ; **LACE over Herdr+agent** = Duplicates / Thin / Real.

| Dimension | tmux+worktree+agent | Herdr+worktree+agent | Proposed LACE layer | Herdr Δ vs tmux | LACE Δ vs Herdr+agent | Verdict per dimension |
|---|---|---|---|---|---|---|
| **Agent lifecycle** | No notion (raw pty) — polling via `capture-pane` heuristics | First-class: `agent start/prompt/wait/read/explain` + states `working/blocked/done/idle/unknown` + `agent_prompt_stalled` 5 s guard [E07/E15] | Semantic lifecycle ("spec satisfied / tests green / regression-free") not pane-idle | **Material** | **Thin** — Herdr provides pane lifecycle; LACE needs *task* lifecycle above it | Herdr sufficient for pane; LACE should add task state, not reimplement pane state |
| **Persistence** | Manual: `tmux resurrect` plugin, manual reattach | Built-in: server owns panes, survives detach/SSH close, `session.json` v3 restores layout + `identity_cwd`, agent session resumption via hooks (`herdr:pi` path, `herdr:codex` id) [E02/E03/E10] | Same + ledger persistence (spec + test gate history) | **Material** (less setup) | **Thin** — git provides content durability; ledger is the gap | Reuse Herdr persistence |
| **Workspace mgmt** | Generic sessions/windows/panes (91 cmds) [E17] | Domain hierarchy workspace→tab→pane, JSON IDs `w1/t/p`, workspace-aware agent rollup [E14/E15] | Task workspaces bound to worktree/branch + panel for ledger | **Material** (domain fit) | **Thin** | Herdr naming matches tmux comment [E11] — mapping 1:1, semantics richer but not novel |
| **Observability** | `capture-pane` + status hacks; no agent/snapshot API | `pane read` (visible/recent/recent-unwrapped/detection, ansi), `pane process-info`, `agent explain`, full `api snapshot` (scroll, focus, titles) [E15/E16] | Task observability (progress, cost, regression, recovery attempts) | **Material** | **Real** — Herdr sees panes, not tasks; verification scorecard is missing [R005 gap] | LACE's only *real* gap here is task-level dashboard |
| **Agent-to-agent control** | `send-keys` to raw pane (no identity) | `agent prompt <name> --wait --timeout` + `agent wait --until blocked` + `pane run/wait-output/send-keys` with name↔pane_id binding [E07/E15] | Policy + ledger-mediated handoff (who spawns whom, file ownership) | **Material** | **Duplicates** at mechanism; **Thin** at policy | Herdr docs recipe "one agent can create work for other agents" already covers control plane [E15] |
| **Task handoff** | Prompt text + branch convention (manual) | Same — `worktree list/create/open/remove` is thin wrapper over `git worktree` [E16]; no task object | Structured handoff: spec + acceptance test + worktree + ownership lock | **None** | **Real but thin** | Neither baseline provides structured handoff; LACE would need to invent it (no blocker in Herdr) |
| **Recovery** | Manual `ctrl+c` / kill pane | `blocked` detection surfaces approvals; `agent send-keys` answers; `herdr --handoff` during update [E07/E13] | Automatic: parse test failure → feedback → retry; auto-revert on regression | **Marginal** (better signal) | **Real** — Herdr recovers *terminal*, not *semantics* | This is the strongest LACE justification (verification loop) — matches R002 top pain |
| **Automation** | Scripts over `tmux send-keys/list-panes/wait-for` (brittle) | Socket API + CLI: JSON creates, `wait-output --match/--regex`, `agent wait --until` with indefinite wait, timeout semantics [E08/E15] | Consumes Herdr API; adds DAG/scheduling + Pareto metrics | **Material** | **Duplicates** (consumer) | LACE is client of Herdr, not replacement |
| **Integration complexity** | Per-agent shell wrapper (ad-hoc) | 18 kinds installable, 5 current (pi/claude/codex/copilot/opencode) via `integration status`; one hook per agent [E09] | Adds LACE hook(s) on top, or plugin | **Marginal** (one install per agent) | **Duplicates** | Reusing Herdr pays cost once; cloning pays it again + drift |
| **Reliability** | Mature (decades), well understood | Stable 0.8.2 observed 11 panes/3 workspaces live; no crash; `unknown` covers uncertain class [E03] | Unproven; inherits agent unreliability [R002/R003] | **None** (parity) | **None** — LACE inherits same agent hangs | No evidence Herdr harms reliability |
| **Ergonomics** | Keyboard-first, config via `.tmux.conf` | Mouse-native + keyboard (`ctrl+space` prefix), workspace agent rollup, sidebar, right-click menus [E11/E13] | Same canvas + ledger panel | **Material** for supervision | **Thin** | Biggest Herdr UX delta is multi-agent supervision without custom tmux status |

## Evidence Summary

- **Herdr is live and occupied the runtime niche.** `herdr status` + `api snapshot` prove 0.8.2 stable protocol 20, 3 workspaces, 11 panes, 5 agents, integrations for every major agent on this host [E01–E06/E09]. Official docs confirm multiplexer semantics: server owns panes, clients attach, panes survive detach [E13/E14], with three automation primitives (Layout/Pane/Agent) and lifecycle waits [E15].
- **tmux baseline is generic; git worktree is mature.** tmux 3.7c 91 commands — no agent states, no snapshot, no workspace rollup [E17]; `git worktree` primitives (`add/list/remove` etc.) are identical under both multiplexers [E18/E21].
- **No HerdrDelta numbers exist.** Search (curl + GH APIs, same tooling limit as R001) found no controlled n≥20 time-to-green or intervention-rate comparison [E12/E20]. Synthesis provisional T2 was set but never measured [E22]; R007 explicitly logs "No teardown vs Herdr" gap [E20].
- **Incumbent reuse argument holds.** R004 maturity table says reuse `git worktree`/ReAct/MCP/ripgrep — do not build custom bus [E21]; R007 shows Herdr + existing agent already composes a solution [E20]; this probe corroborates — Herdr worktree helpers are thin, reuse is correct.

## Findings (per dimension → cross-cutting)

See `findings.md` for labeled FACT/EVIDENCE/INFERENCE bullets. Cross-cut:

1. **Herdr advantage over tmux is real but narrow: observability + lifecycle + mouse/workspace ergonomics.** It saves setup (no resurrect plugin, no custom status) and surfaces `blocked` without scraping. It does not change `git worktree` mechanics or agent capability.
2. **LACE does not beat Herdr on multiplexer primitives — duplication risk >80%.** Workspace/tab/pane lifecycle, socket API, session restore, and 18-agent integrations would be reimplemented for no measured user pain signal ranking "better multiplexer" above verification/steerability [E23].
3. **LACE's plausible edge is *above* the multiplexer: verification gate + ledger + handoff schema + Pareto transparency.** Those map directly to Wave 1's top pain (verification burden, loops/hangs [E23]) and to R003's SOPs+feedback gain (+4-5pp, not agent count). Herdr does not encode SOPs or parse test output → feed back.
4. **Threshold T2 cannot adjudicate CORE on this evidence.** No n≥20 experiment measuring `>30% time-to-green` or `>50% fewer manual interventions` was found or run here — lack of data is not evidence of lack of effect, but it prevents promoting Herdr (or LACE runtime) to CORE. Per instructions, do not force conclusion.

## Contradictions & How Resolved

- **"Herdr is the only multiplexer-native layer" (R001) vs "tmux + worktrees may suffice" (R007).** Weight: both true at different layers — Herdr is uniquely agent-aware (FACT, E07/E14), but task isolation is provided by `git worktree` either way (FACT, E18). Resolution: Herdr's value is *observability/ergonomics*, not *isolation* — insufficient alone for CORE without timing delta.
- **"LACE needs git worktree" vs "Herdr already wraps worktree."** Weight: complementary — Herdr's `worktree create/open` is convenience [E16]; LACE's need is *policy* (per-task branch, ownership lock, squash). No conflict; LACE reuses Herdr's wrapper.
- **"No reliable evidence found" for pricing/bench vs live socket evidence.** Weight: hierarchy respects absence — do not invent numbers; socket/docs outrank secondary synthesis where they conflict. Gaps explicitly kept as gaps.

## Confidence

| Claim | Confidence | Reason |
|---|---|---|
| Herdr runtime description & automation surface | **High** | Live 0.8.2 snapshot + official skill/docs (E01–E07/E13–E15) |
| tmux + worktree baseline vs Herdr comparison | **High** | Local `tmux -V` + `git worktree` man + config comment mapping [E11/E17/E18] |
| Herdr integration coverage (5 current) | **High** | Live `integration status` [E09] |
| Herdr vs tmux ergonomic advantage | **Medium-High** | Docs + config observed; no timed AB |
| "Ledger/verification is the real LACE gap" | **Medium** | Consistent with R002/R003/R005, but no LACE prototype measured |
| Threshold T2 verdict (insufficient evidence for CORE) | **High** that evidence absent; **Medium** that OPTIONAL follows | No n≥20 data found after live probe [open-questions Q1] |

## Limitations & Assumptions

- Narrowest scope: comparison limited to local single-host runtime; `herdr --remote`, named-session isolation, and SSH reattach not probed.
- No mutation: no `workspace create`/`pane split`/`worktree create` side-effects; lifecycle `blocked`/`unknown` precision not measured via `agent explain --json`.
- No web aggregator (`tavily`/`exa` unavailable) — HN/Reddit sentiment not refreshed; R002 pain prevalence not re-sampled.
- Training cutoff vs live Herdr: snapshot is ground truth for 0.8.2 (2026-09-02) but forward API (protocol 21) may shift integration kinds.

## Recommendation — **OPTIONAL INTEGRATION (REFERENCE architecture)**

**Do not make Herdr CORE runtime, and do not build a standalone LACE runtime that duplicates it.** Ship Herdr as a **first-class optional integration** and **reference architecture**; keep `tmux + git worktree` as the documented baseline fallback.

**Why not CORE:** T2 gate (`>30% time-to-green` or `>50% fewer interventions`, n≥20) is **untested** — no credible sample exists in this repo or in public sources searched [evidence gap]. Forcing CORE on ergonomics alone violates "do not force conclusion." Herdr's measured advantages (lifecycle, snapshot API, mouse/workspace rollup) are Material but translate to *developer convenience*, not a proven Pareto win on resolved-rate/cost/regression.

**Why not REJECTED:** Herdr demonstrably reduces boilerplate for multi-agent supervision and agent-aware automation at low adoption cost (`integration install pi/claude/codex` is one hook per agent [E09]). Rejecting it would push LACE to reimplement workspace/tab/pane lifecycle + socket API — classic wrapper waste flagged by R004/R007 [E21/E20].

**What to build instead (smallest first, Herdr-consuming):**

1. **LACE as Herdr plugin / socket-API consumer** — ledger + verification gate: `pane run` tests → parse → `agent prompt` feedback loop, with spec→tests→gate policy and Pareto logging (`% resolved | regression | cost | time | reliability | recovery`). Maps to R002 top pain and R003 feedback lift, not multiplexer delta.
2. **Keep LACE runtime-agnostic** — detect `HERDR_ENV=1` and `herdr api snapshot` when available, fall back to `tmux + git worktree` otherwise. No hard dependency; document both.
3. **Defer Herdr CORE promotion** until a pre-registered n≥20 HerdrDelta experiment passes T2; if it fails, remain OPTIONAL forever (plugin, not platform).

**Replication moat note (links to F04):** Because Herdr's socket API is stable (protocol 20) and plugin docs exist [E12 `plugins.mdx`/`marketplace.mdx`], the moat for a standalone LACE runtime is near-zero — a Herdr plugin can be added in <2 weeks per R007 T4 hypothesis. That reinforces OPTIONAL, not CORE.

## Artifact Contract

- `report.md` — this file
- `evidence.md` — source table (E01–E23, quotes, access dates)
- `findings.md` — labeled FACT/EVIDENCE/INFERENCE/HYPOTHESIS/OPINION per dimension
- `open-questions.md` — gaps, measurement design, follow-up probes
