# Opportunity — LACE

**Date:** 2026-09-02 · **Sources:** 01-research.md + 02-competitive + 03-problem + syntheses + ledger (11 COMPLETE) · **Validation decision:** PIVOT (not GO/KILL) · **Method:** `muse-spark-1.2-contributor-free`, GH/HN APIs + official docs + live Herdr 0.8.2 + pilot, labels FACT/EVIDENCE/INFERENCE/HYPOTHESIS/DISCISION preserved

---

## 1. Problem Worth Solving

**Severe, recurrent, and harness-addressable for affected users — validated in corpus, not yet sized for market:**

- **Verification burden + inconsistent gating** — 21% corpus (14/67, but includes fix PRs) with heterogeneity (remove proactivity #13753 vs permission spam #13101). PlanBridge external gate exists as symptom. **High severity** for trust — user cannot tell if work is reviewable. [03 A1, F01]
- **Loops/hangs (blocking)** — 7% corpus but 6-comment loop, hangs indefinitely with no logs (#13750). [03 A2]
- **Hallucinated/unreliable edits (silent incorrectness)** — 9% (doubled-prefix #5112, unknown MCP tool opaque #12977) — pilot shows gate can rescue exception-filter bug via parse→feedback at edge cost. [03 A3, F02]
- **Regression/state loss (data loss)** — 10% ("discards all changes" 4 comments #3581). [03 A4]
- **Privacy/credential trust (enterprise blocker)** — 21% with 3 identical trust-adapter proposals same week (Cline #13737 et al.) + unredacted telemetry — cross-repo + buyer pressure proved by Copilot BYOK/ZDR productization [03 A5, R006].

**Why worth solving now:** All above are already being *patched singly* as harness PRs in incumbent repos — the problem is not hypothetical, it's being fixed piecemeal without a coherent verification/steerability layer. Pilot proves the loop is feasible with `git worktree` isolation + JSONL ledger.

**Why still narrow:** **No survey n>100 found** — corpus 7–21% is not population prevalence, and broader demand is **Low confidence**. The problem is validated for a segment but not market-sized; it justifies a *thin wedge*, not a platform.

---

## 2. Existing Solutions

**Each piece exists somewhere, but not as a deterministic product primitive:**

- **Agents:** Claude Code (best repo understanding, plan mode, `CLAUDE.md`), Codex (`apply_patch`, `AGENTS.md`), OpenCode (provider-agnostic, open), Aider (SEARCH/REPLACE, git-native, Ollama/LM Studio), Cline/Roo (Plan/Act modes), Cursor/Windsurf (indexing, Composer/Cascade, cloud-first), Zed (Rust), OpenHands (Docker sandbox, max autonomy), SWE-agent (ACI benchmark harness). **All delegate verification to `bash`/Docker adhoc** — none productizes `spec→tests→gate→parse→feedback→regression` with Pareto logging. [02 §3, F01 pain list]
- **Multiplexers:** Herdr (workspace-aware panes/tabs, persistent workspaces, lifecycle `working/blocked/done/idle/unknown`, socket API, `git worktree` wrapper, 5 integrations) — **only multiplexer-native layer** [R001, F03]; `tmux 3.7c` 91 commands — generic, no agent awareness.
- **Mature primitives (reuse, don't rebuild per R004):** ReAct (mature, +34% ALFWorld [R004]), MCP 2025-06-18 ("USB-C for AI" [F04 E01]), ACP ("LSP for agents" remote WIP), Tree-sitter/ripgrep/BM25, `git worktree`/`apply`, JSONL trajectory, containers — all Host-native.

---

## 3. Remaining Gap

**Three gaps that are *not* owned as product by incumbents (Medium confidence where pilot unproven, High where spec/gap official):**

1. **Deterministic verification gate that blocks merge on red/regression** — none of the 12 exposes it; SWE-agent sandbox is closest but not a gate. No benchmark reports regression/human-intervention — incumbents report `% resolved` alone, ignoring regression/cost/reliability/recovery/context [R005, F02]. F01 shows verification burden is the highest-frequency harness fix.
2. **Cost-adjusted reliability transparency** — incumbents won't publish Pareto scorecard (`% resolved | regression | median cost | time | reliability pass@3 | recovery`) on Verified n≥30 + rolling post-cutoff split for contamination control [F02, R005]. Reproducibility + harness confounding (Verified's mini-SWE-agent admission [R005]) is weakness the thin extension can own first.
3. **Lightweight MCP governance proxy (allowHeadless + OAuth hardening + telemetry redaction)** — 21% corpus with cross-repo demand, but no host-native proxy that is off by default / on for enterprise; Copilot BYOK/ZDR proves buyer pressure for the pattern, but not a thin open solution.

*Gaps that are not sufficient as wedges now:* pure-local 8GB promise (no bench, niche), multi-agent teams (no A/B, no demand in 67, 3–10× cost), custom indexing/vector DB/AST (conditional "add when measured gap appears" [R004]).

---

## 4. Potential Product Wedge

**Narrowest opportunity supported by evidence (not automatically accepted — confirmed by validation):**

> **Verification-first coding-agent infrastructure — deterministic verification, loop/progress guardrails, and observable cost/reliability/regression tracking, shipped as thin extension(s) over existing agents.**

**Is this supported?** **Yes as wedge, no as proven win.**

- **Supported:** wedge maps 1:1 to the highest-severity harness-solvable pains identified in 67 GH (F01), to R005 benchmark gap (`No reliable evidence` for regression/human-intervention reporting), and to pilot feasibility (one recovery via gate with worktree isolation, regression 0, no cross-mutation). It is also the **only** gap that is all of (a) cross-repo recurrent, (b) harness-solvable without new model, and (c) not already claimed as "solved" by incumbents — unlike local/multi-agent.
- **Not proven:** wedge is hypothesized to improve *measurable* reliability. F02 pilot shows +20pp point estimate but **Wilson CIs overlap** (37.6–96.4% vs 56.6–100%) and per-retry cost at threshold edge (2.05×). F02 correctly refuses to claim improvement. Wedge is *validated as severe problem + feasible harness*, not as *proven Pareto win* — that requires n≥30 Verified with real billing (T1).

**Therefore wedge is correctly scoped as the thing to test next in ≤2 weeks, not as a proven product.** [02 §§6-7, F02, F04]

---

## 5. Why Now?

**Evidence-supported (Medium), not manufactured:**

- **Pain is being patched now as harness code:** 67 GH issues from 2026 rolling window are *active PRs fixing* loops/hangs, hallucinated prefixes, re-truncation, governance proxy — not stale backlog. Signals present window where thin verification/steerability glue is being added piecemeal across incumbents.
- **Standards are stable enough to build thin:** MCP 2025-06-18 is versioned spec over stdio/SSE/Streamable HTTP with SDKs in TS/Python [F04 E01-E03]; Claude Code plugin manifest `name/description/version` + skills `skills/<name>/SKILL.md` + hooks `PostToolUse`/`Stop` + headless `claude -p --bare` [F04 E06-E09] and Herdr plugin `herdr-plugin.toml` + socket API protocol 20 [F04 E11-14] are all live and documented — thin composition is cheaper today than a year ago.
- **Benchmark harness is now standardized:** Verified's mini-SWE-agent admission fixes prior harness confounding [R005] — gives a reproducible harness to measure Pareto against, which previously didn't exist.

**Not "why now" on pricing/local:** pricing pages were JS-rendered and not measured, 8GB rig not measured — explicitly *not* used as why-now.

---

## 6. Why Not Just Claude Code / Codex / etc.?

**Direct answer (honest):**

Claude Code (plus Codex/OpenCode/Aider) already is the *agent* — it reads codebase, edits files, runs commands, has plan mode, `CLAUDE.md` memory, subagents, MCP, and `claude -p` headless is the programmatic harness [F04 E10, R007]. **If your need is "a better single agent," use Claude Code/Codex — do not use us.** That is the explicitly documented non-goal.

**Why the extension still could matter on top of Claude Code:** Claude Code's verification is `bash` adhoc — not a deterministic gate that *blocks merge until green + regression check* and logs `regression | median cost | reliability | recovery` per run. F01 shows even Claude-adjacent ecosystem still files `BE HELPFUL` vs permission-spam heterogeneity, hangs, opaque tool errors against Claude-class harnesses — the gap is *policy* (gate), not model quality. LACE as extension adds that policy in **<100 LOC of hooks + one MCP server** (F04), reusing Claude's own hook/skill mechanism — it does not replace Claude.

**Bottom line:** For 90% of tasks, *just Claude Code + git worktrees* (or Herdr + Claude Code) is sufficient and already composes a solution [R007]. The thin extension is for the 10% where trust/reversibility matters and where the Pareto win would have to be proven at scale before anyone should switch.

---

## 7. Why Not Just MCP?

**MCP is the right transport, not the product.**

MCP 2025-06-18 is the *bus* ("USB-C for AI" JSON-RPC over stdio/SSE/Streamable HTTP [F04 E01]) — it is the correct way to expose `ledger_append/read`, `gate_run`, `gate_parse`, `worktree_create` as tools to any MCP host (Claude Code / OpenCode / VS Code / Cursor). F04 composition A is exactly this: 250–350 LOC TS server + `.mcp.json` entry.

**But MCP alone is not a user-facing verification workflow.** MCP gives *tools*; it does not give the *deterministic workflow* (skill instruction `skills/verify/SKILL.md` + hooks `PostToolUse`→`gate.sh` and `Stop`→`gate_check.sh` + headless loop `claude -p --bare --mcp-config` + JSONL ledger view). That workflow is the Claude Code plugin (Path B in F04, <100 LOC). MCP is one half; plugin hooks are the other. Shipping only MCP would leave the gate advisory, not blocking.

**Therefore "just MCP" undersells the workflow and oversells defensibility.** MCP server + plugin together are the validated distribution — either half alone is incomplete, and neither justifies a standalone binary.

---

## 8. Why Not Just a Herdr Plugin?

**Herdr plugin is the right deployment variant for Herdr users — but not the whole product, and not CORE infrastructure.**

F03 teardown shows Herdr as **Material** over tmux only on lifecycle/observability/persistence/ergonomics — `agent prompt --wait`, `pane read` 4 modes, `api snapshot`, `session.json` v3, workspace-aware rollup — but **LACE over Herdr is mostly Duplicates/Thin** except verification gate + task-level dashboard (only *Real* gaps). Herdr's `worktree create/open` is thin wrapper over `git worktree` [F03].

**Why not *just* Herdr (and why not Herdr as CORE):**
- **Not CORE until T2 passes:** provisional gate >30% time-to-green or >50% fewer interventions (n≥20) is **untested** — F03 is conceptual teardown + live snapshot, no timed experiment. Forcing CORE on ergonomics would violate pre-registration. Keep **OPTIONAL INTEGRATION** — detect `HERDR_ENV=1` + `herdr api snapshot`, fall back to `tmux+worktree` baseline.
- **Not just Herdr because reach is broader:** many users are not on Herdr (`tmux 3.7c` baseline is parity for `git worktree` isolation). F04 composition B proves Herdr plugin is 150–200 LOC copy of `commandcode.integration` template — <1 week — but Claude plugin + MCP reaches *all* MCP hosts without Herdr. Herdr plugin is a deployment variant, not the sole form.

**When Herdr *would* become the primary form:** only if a pre-registered n≥20 HerdrDelta experiment proves the >30% / >50% gate — then promote to CORE and make standalone unnecessary (plugin, not platform — F04).

---

## 9. Defensibility

**Honest, evidence-backed (High confidence that moat is thin as standalone):**

- **Near-zero moat as standalone:** Every primitive is mature reuse (R004) and every thin extension is documented as open spec + scaffolder (`/mcp-server-dev:build-mcp-server` [F04 E07]) — F04 desk construction proves composition is 150–350 LOC, single dev <1 week, T4 **fails for standalone** (if <2 weeks via MCP then kill standalone per 01 §10). Any team can add ledger+gate as MCP in days — there is no compounding advantage to a bespoke bus/parser/vector DB; spec churn (MCP 2025-06-18, ACP remote WIP) is tax, not moat. Continue archived warns harness churn [R006].
- **Thin extension's moat is also thin — but correctly priced:** The MCP/plugin itself is easily cloned (same 1-week bound). Its *only* defensible edge is **measured Pareto transparency** on Verified n≥30 + rolling split — publishing `regression | median cost | reliability | recovery` per run is not yet owned by incumbents and is reproducible science, not code alone. Until that measurement exists, even the extension has no moat — which is why validation correctly classes the wedge as *hypothesis to test*.

**What would change defensibility:** passing T1 with Pareto win at ≤2× cost + regression ≤ (n≥30), or T2 HerdrDelta >30% — both require *measured* numbers, not features. Features alone do not create moat.

---

## 10. Product Forms Considered

Direct comparison with evidence weight:

| Form | Minimal repro (F04) | Evidence weight | Verdict per validation |
|---|---|---|---|
| **Standalone application / custom multiplexer** | Would duplicate Herdr workspace lifecycle + socket API + integration hooks + Claude loop — classic wrapper waste [R004, F03] | High (specs + live snapshot) | **REJECTED** — T4 fails (kill standalone). |
| **MCP extension (`lace-ledger` server)** | 250–350 LOC TS + `.mcp.json` entry, stdio+HTTP, JSONL backing | **High** spec+client+SDK | **PRIMARY** — reaches every MCP host (Claude/OpenCode/Cursor/VS Code) — one half of wedge |
| **Host-native plugin (`lace-gate` for Claude Code)** | <100 LOC: `skills/verify/SKILL.md` + `hooks.json` `PostToolUse Edit\|Write→gate.sh` + `Stop→gate_check.sh` + `.claude-plugin/plugin.json` + scaffolder proves 50% scaffolded [F04 E07] | **High** (hook/skill docs) | **PRIMARY** — the other half: workflow that makes gate blocking, not advisory |
| **Herdr plugin (`lace-herdr`)** | 150–200 LOC TOML+sh (copy of `commandcode.integration` 46 LOC + 3 sh) | **High** (local manifest) | **DEPLOYMENT VARIANT** — right host for Herdr users, not sole form; **OPTIONAL INTEGRATION** until T2 passes |
| **Hybrid extension architecture** | MCP server + Claude plugin + optional Herdr plugin sharing same verification core (worktree + JSONL ledger + gate parser) — no standalone binary | **High** (F04 §5-§6) | **STRONGEST EVIDENCE** — narrowest, cheapest composition that captures wedge; distribution is one file change (MCP JSON or plugin dir vs `github:` source) |

**Why hybrid extension wins:** it is the only form that is (a) narrow enough to be validated by F01's harness-solvable clusters, (b) cheap enough to fit ≤2 weeks where standalone does not, (c) host-portable across all 12 incumbents (MCP) while reusing Herdr where available, and (d) gated by the same measurement that would justify expanding.

---

## 11. Opportunity Risks

1. **Thin extension is thin to clone (moat risk)** — same 1-week bound makes wedge instantly copyable; without *measured* Pareto win, opportunity is just shared glue. Requires publishing Verification Pareto before incumbents copy gate.
2. **Cost/latency edge violation** — pilot per-retry 2.05× at threshold edge; at higher failure rates median will breach 2× (F02 guardrail). Not capping retries (2) or noisy gate will invert Pareto.
3. **Synthetic vs real repo gap** — pilot overestimates success (deterministic tasks) and underestimates retrieval/multi-file cost that Lite filters — real Verified may show weaker gain + more flakiness (37 tasks dropped in multimodal for flaky). [R005, F02 §10]
4. **Heterogeneity risk** — opposite polls on proactivity vs permission spam mean one friction level fits none — gate must be configurable (`allowHeadless` pattern [F01]), not mandatory.
5. **Trust surface risk** — MCP proxy adds attack surface (allowHeadless 11 comments, OAuth hardening) — enterprise governance must be correct or trust wedge fails.
6. **No demand sizing** — F01 67-issue corpus is not market; without survey n>100 + 5 buyer interviews, wedge could be real for a vocal minority only.

---

## 12. Kill Conditions

**Preserved pre-registered decision gates (01 §10, F02–F04, do not renegotiate after building):**

- **T1 — SWE-bench Pareto (verification justification):** On Verified (n≥30, 95% CI, prefer 100+) same-model baseline vs candidate with verification must show **≥10pp absolute gain** at **≤2× median cost/latency** with **regression rate ≤ baseline** (Wilson CI non-overlapping). Pilot n=5 **did not meet** (CI overlaps, n≈300 needed for 10pp). **If not met at scale → kill orchestration as CORE** (keep single-agent default, community plugin only). At n≥100 failure → **permanent KILL** on verification as CORE.
- **T2 — HerdrDelta (Herdr as CORE):** `tmux+worktree+agent` vs `Herdr+worktree+agent` vs plugin on n≥20 must show **>30% time-to-green OR >50% fewer manual interventions**. **Not yet measured** (F03 is teardown only). **If not met → kill Herdr CORE** forever — remain OPTIONAL plugin.
- **T3 — Local demand (local as wedge):** 5 regulated-enterprise interviews + policy corpus (10–15 policies/DPAs) must show **ZDR insufficient for ≥40%** (pure-local mandatory). **If pure-local <15% → kill local-first as core** (hybrid degraded only, 16GB+ target, explicit 8GB ceiling).
- **T4 — Wrapper moat (standalone defensibility):** 2-week time-boxed spike — can a team add ledger+gate to Claude/OpenCode via MCP in <2 weeks? **F04 desk estimate says yes (<1 week)** → **T4 already fails for standalone** → **kill standalone** per synthesis (publish as MCP extension). For the *extension itself*, the remaining moat test is whether external replication of gate+ledger *also* clones too easily — then wedge needs deeper differentiation (eval transparency).

**Permanent KILL:** if all T1–T4 fail, do not pivot again. Reusable research/assets preserved: 11-task corpus (67 GH + raw), pilot repo/harness, extension skeletons, ledger/syntheses, Herdr snapshot.

