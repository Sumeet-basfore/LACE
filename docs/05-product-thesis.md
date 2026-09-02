# Product Thesis — LACE

**Working name:** LACE (codename only — do not finalize branding) · **Date:** 2026-09-02 · **Status:** PIVOT — verification-first extension hypothesis (to be tested, not proven) · **Model:** research all `muse-spark-1.2-contributor-free`
**Research basis:** `research/ledger.md` (11 tasks COMPLETE: R001–R007 + F01–F04) · `research/reports/01-research-synthesis.md` · `02-validation-synthesis.md` · `docs/01-research.md` · `02-competitive-landscape.md` · `03-problem-space.md` · `04-opportunity.md` · **Artifacts:** `research/{R001-R007,F01-F04}/` + `F02/pilot/` · **Current decision:** PIVOT (not GO/KILL) — see Kill Criteria

> **Evidence-discipline labels:** FACT / EVIDENCE / INFERENCE / HYPOTHESIS / DECISION. When research does not establish something: **No reliable evidence found.** Every major product claim traces to research — see `docs/01-research.md` for provenance. Contradictions and confidence levels preserved there.

---

## Working Name

**LACE** is still only a codename for an AI coding-harness idea. Do not finalize branding, domain, or product identity in this thesis. Name appears only for traceability with prior research.

---

## Problem

**Developers lose trust in coding agents on real work because agents are unreliable, unverifiable, and costly to steer — even inside mature harnesses.**

Specifically, for affected users (validated in corpus, not market-sized):

- Agents hallucinate tool behavior and edit structure (doubled-prefix headers, unknown MCP tool forwarded with opaque error, indented-block filename miss) — **silent incorrectness** [FACT/EVIDENCE — F01 9% (6/67), 02 §2].
- Agents hang or loop indefinitely with no logs or enter degenerate/report loops — **blocks all use** at material cost [FACT — F01 7% (5/67) including #13750 Ollama indefinite + #13492 6-comment loop, R002].
- Agents discard or roll back prior work (add-file discards all changes, 4 comments) — **data loss** [FACT — F01 10% #3581].
- No consistent, deterministic verification that checks success + regression before claiming done — **verification burden is heterogeneous** (remove proactivity #13753 vs permission spam #13101) [FACT — F01 21%, INFERENCE — heterogeneity].
- Progress while streaming is invisible (no signal while args stream, SSE only heartbeats) — **steerability gap** [EVIDENCE — F01 9% two products].
- MCP/credential surface lacks opt-in trust (unredacted telemetry URLs, `.env overrideTrue`, no lineage, `allowHeadless` debate 11 comments) — **enterprise blocker**; buyer pressure proved by Copilot BYOK/ZDR/sandboxing productization [FACT — F01 21% + 3 identical trust proposals same week, EVIDENCE — R006 E07].

A 67-issue GH corpus (F01, 262 fetched → 67 retained, cross-repo) plus independent 15-source R002 converge that these clusters exist and are **High severity** for affected users. **INFERENCE** with **Medium-High** existence/severity confidence. **No reliable evidence found** for population prevalence or broader demand — corpus 7–21% is *corpus only*, not market prevalence, and pricing/bench magnitude not measured — explicitly `Low` confidence on demand sizing [01-research].

What is *not* a validated problem: "lack of multi-agent teams," "lack of persistent ledger as a feature," "need for a new agent" — **0 of 67** issues requested teams; users asked to *curb* proactivity; multi-agent gains are narrow prototype +19pp via SOPs+feedback at 3–10× cost, no SWE-bench A/B [HYPOTHESIS — R003, 02 §5].

---

## Target User

**Do not invent a broad ICP. The validated problem is meaningful only for a narrow, not-yet-sized segment:**

- **Primary target (hypothesized, not sized):** developers and small teams using existing coding agents (Claude Code, Codex, OpenCode, Aider, Cline/Roo) — terminal or editor — on **real feature work where reversibility and regression matter** (long-horizon edits where `git worktree` isolation is already desired). They experience the 6 pains above *inside* current harnesses and already file harness PRs fixing them singly.
- **Secondary target (enterprise, blocker-level but not primary wedge):** teams where MCP trust / private registry / audit / `allowHeadless` is a gating requirement — cross-repo concentration of identical proposals + unredacted telemetry evidences buyer pressure [FACT — F01, R006], but **No reliable evidence found** for how many buyers would pay vs accept Copilot ZDR/BYOK — explicitly `Low` demand confidence, hence secondary.

**Unsupported market assumptions (explicitly labeled, do not act on as facts):**
- How many overall developers are blocked (population prevalence) — **No survey n>100** [HYPOTHESIS — gap 02 §11.1].
- Willingness-to-pay for verification/MCP trust vs using Claude Code + `git worktree` directly — unmeasured [HYPOTHESIS].
- That local-first or 8GB promise is a primary wedge — **ruled out** as primary until T3 (≥40% pure-local mandatory), direction High, magnitude Low, no bench [INFERENCE — R006].

---

## Existing Alternatives

**Each piece exists somewhere — which is why standalone is rejected.** 12 products live (HEAD 2026-09-02) [FACT — R001, 02]:

- **Best agents for single-agent work:** Claude Code (repo understanding, plan mode, `CLAUDE.md`, MCP), Codex (`apply_patch`), OpenCode (provider-agnostic, open, TUI "open source coding agent" [F04 E20]), Aider (SEARCH/REPLACE, git-native, repo-map, Ollama/LM Studio), Cline/Roo (VS Code Plan/Act modes), Cursor/Windsurf (indexing, Composer/Cascade, cloud-first), Zed (Rust), OpenHands (Docker), SWE-agent (ACI benchmark). **All delegate verification to `bash`/Docker adhoc** — none productizes `spec→tests→gate→parse→feedback→regression` with Pareto logging (R005 gap) [FACT — R004, F03].
- **Multiplexer:** Herdr 0.8.2 (protocol 20, 3 ws, 11 panes, 5 integrations) — workspace-aware lifecycle, `agent prompt --wait`, `pane read` 4 modes, `api snapshot`, `session.json` v3, `git worktree` wrapper — **only multiplexer-native layer** [FACT — F03 live snapshot]; `tmux 3.7c` — generic 91 commands, no agent awareness [FACT].

**Why current tools are insufficient for the identified problem:**
- Verification is *policy* missing, not capability: no deterministic gate that *blocks merge until green + regression check* and logs cost/reliability/recovery. That maps 1:1 to the highest-severity harness-solvable pains identified in 67 GH (F01) and to R005 benchmark gap (`No reliable evidence` for regression/human-intervention reporting).
- But insufficient for only ~10% glue: for 90% of tasks, *just Claude Code + git worktrees* (or Herdr + Claude Code) already composes a solution [INFERENCE — R007, F04]. The extension is for the 10% where trust/reversibility/pareto matter — and where the Pareto win is **not yet proven** at scale (pilot CI overlaps, needs n≥30 Verified — see Success Criteria).

---

## Product Hypothesis

**State as hypothesis to validate through implementation and measurement (not requirement):**

> **HYPOTHESIS:** A verification-first layer that sits *around* an existing coding agent and turns coding work into a **measurable loop of specification → execution → deterministic verification → structured feedback → bounded recovery → regression checking** — with **worktree isolation, JSONL ledger, and cost/reliability/regression observability** — will provide a meaningful improvement in reliability, recovery, regression detection, and steerability that justifies its additional complexity, when shipped as **thin host-native extension(s)** (MCP server + Claude Code plugin, optional Herdr plugin variant) reusing mature primitives — without a standalone binary, custom multiplexer/bus/vector DB, or multi-agent orchestrator by default.

**Treatment:** hypothesis to test via ≤2-week thin extension plus powered measurement (T1–T4 gates). Do not upgrade pilot +20pp point estimate (n=5, Wilson CI 37.6–96.4% vs 56.6–100% overlaps, per-retry 2.05× at edge, synthetic overestimate) into proven improvement [EVIDENCE — F02].

---

## Core Value Proposition

*One concise paragraph (hypothesized, not proven):*

A single-agent coding agent that behaves like a **measured, reversible harness** — you specify, it executes in an isolated worktree, a deterministic gate (your tests + regression suite) verifies, failures are parsed into structured feedback for bounded recovery, and every run is logged as a JSONL ledger with its Pareto cost — all installable as one MCP JSON entry or one plugin directory, or one Herdr pane if you already use Herdr, without adopting a new platform, model, or editor.

---

## Primary Wedge

**The smallest valuable capability supported by evidence (not automatically accepted — confirmed by validation):**

**Deterministic verification gate that blocks merge on red/regression and makes every run observable:**

1. **Verification gate as product primitive** — deterministic `spec → tests → gate (run_tests) → parse (JUnit/TAP) → feedback → retry (cap 2) → block merge on red/regression`. Separate `test_regression_*` suite from task success (SWE-bench Verified pattern). [EVIDENCE — F01 21% verification + 10% regression + pilot feasible, F02]
2. **Loop/timeout + progress/steerability guardrails** — timeout + `Stop` keep-alive [F01 #13678], fix progress signal while streaming (same symptom two products #46734/46733), hallucinated-tool rejection / doubled-prefix / malformed-args guardrails with parse error for retry. [FACT — F01, F03]
3. **Trust / MCP governance as opt-in** — governance proxy (allowHeadless precedent 11 comments #9327, OAuth hardening #13676, telemetry redaction #5621) — off by default, on for enterprise; hybrid privacy (verifiable local path Ollama/LM Studio + ZDR cloud) rather than pure-local promise. [FACT — F01 21% + R006]

If the gate does not show **≥10pp at ≤2× cost with regression ≤** at n≥30 (T1), the wedge is not a product — it is a community plugin. Pilot did not meet T1 (n=5, CI overlaps) [EVIDENCE — F02].

---

## Supporting Capabilities

**Only what the wedge requires to be useful (all mature reuse per R004 — do not rebuild):**

- **`git worktree` isolation per task** — linked worktree per branch, pristine snapshots `7b9850d`, no cross-task mutation (F02 both arms no regression) — thin convenience whether via Herdr wrapper or `git worktree add` directly [FACT — F02, F03].
- **JSONL ledger** — append/read over file (like pi/herdr/OpenHands trajectories [F04]) — persistence without custom DB; view over ledger, not new primitive.
- **Pareto harness logging** from day one — `% resolved | regression rate | median cost (tiktoken→$/1K when billed, not chars/4) | median latency | reliability (pass@3) | recovery rate` on Verified n≥30 + rolling post-cutoff split for contamination [R005, F02].
- **Host detection** — when `HERDR_ENV=1`, consume `herdr api snapshot`; otherwise fall back to `tmux+worktree` baseline — documented both, no hard dependency.

---

## Non-Goals

**Explicitly list — do not build, or explicitly defer until T1–T3 pass at scale (violating this resurrects the rejected original multi-agent/local-first/standalone thesis):**

- Standalone custom multiplexer
- Custom agent runtime (replacing Claude Code/Codex/Aider loop)
- Custom MCP protocol (MCP 2025-06-18 is standard — reuse TS/Python SDKs [F04 E01])
- Custom vector database (ripgrep/BM25 + Tree-sitter sufficient baseline; embeddings conditional)
- Multi-agent DAG as default (MacNet/Puppeteer-scale; needs SOPs+feedback discipline; marked "add when measured gap appears" [R004, F02]) — keep EXPERIMENTAL
- Local-first as primary wedge (IMPORTANT SECONDARY only; pure-local niche un-sized until T3 ≥40% mandatory; no 8GB bench [R006])
- 8GB primary promise (explicit ceiling, target 16GB+ for usable local)
- Another general-purpose coding agent (13th agent)
- Feature parity with Cursor/Claude Code/Codex (we *use* them, we don't match them)
- Custom editor unless later justified (ACP remote is WIP, narrower than MCP [R004, F04])

---

## Experimental Features

**Unproven ideas — place here, not in committed requirements. Nothing here is a requirement:**

- Multi-agent collaboration (2–3 roles max, SOP-encoded phases, DAG/orchestrated turn-taking, token-budget cap, file-ownership lock via worktrees — only after verification-only baseline is measured at n≥30)
- Advanced local-model optimization (quantized per-model hooks)
- Herdr-specific enhancements beyond thin plugin (would require T2 >30% time-to-green or >50% fewer interventions, n≥20 — currently OPTIONAL)
- Additional agent protocols (ACP refinement, remote HTTP/WS)
- Advanced repository indexing (embeddings / semantic chunking beyond BM25/Tree-sitter)

*If any experimental item graduates, it must first pass the pre-registered gate and then be moved to Supporting Capabilities with evidence.*

---

## Success Criteria

**Measurable outcomes (preserve research threshold where applicable — T1 is a gate, not a target):**

Per R005 Pareto scorecard, measured per task then aggregated with 95% CIs on a *powered* run:

- **Task success** — 1 if gate exits 0 (all reference tests for task + regression pass) else 0. Report `% resolved` with Wilson 95% CI.
- **Regression rate** — share of previously-passing `test_regression_*` subtests that break (diff vs buggy baseline) — **must be ≤ baseline** (guardrail, not just metric).
- **Median cost** — input+output tokens via tiktoken (not chars/4 proxy used in pilot) → $/1K when billed. Report median + P50/P95 and ratio vs baseline. Guardrail **≤2× median** (pilot per-retry 2.05× already at edge — F02).
- **Median latency** — wall-clock seconds start→gate final verdict. Same guardrail **≤2× median**.
- **Recovery rate** — share that initially failed then passed after bounded retry (cap 2) — the pilot's one recovery (1/1) is the mechanism to scale.
- **Reliability across repeated runs** — `pass@3` / variance on 3 repeats per task (F02 probed T04 3/3 deterministic — real run needs full 30×3).
- **Human intervention** — count if manual fix required after retries exhausted (0 in pilot — must stay 0).

**Research threshold preserved (T1):** on Verified (n≥30, prefer 100+) same-model baseline vs candidate with verification, standardized mini-SWE-agent harness, rolling post-cutoff split — candidate must show **≥10pp absolute gain** at **≤2× median cost/latency** with **regression ≤ baseline**, Wilson CI non-overlapping. For p≈0.5, 10pp needs ~300/arm; n=30 only powers ~25–30pp [F02 power calc] — therefore **n≥30 is minimum, n≈100+ is realistic for 10pp**.

Pilot n=5 **did not meet** this (37.6–96.4% vs 56.6–100% overlaps) — success criteria are *future gates*, not claims. Do not ship verification as CORE until they pass.

---

## Kill Criteria

**Explicitly define when the product direction should stop (do not renegotiate after building — gates are from 01 §10, F02–F04):**

- **T1 — Verification Pareto:** At n≥30 Verified (prefer 100+) if candidate fails to show ≥10pp at ≤2× cost/latency with regression ≤ (CI non-overlapping) → **kill orchestration as CORE** (keep single-agent default, community plugin only). At n≥100 failure → **permanent KILL** on verification as CORE.
- **T2 — Herdr as CORE:** At n≥20 `tmux+worktree+agent` vs `Herdr+worktree+agent` vs plugin if **not** >30% time-to-green *or* >50% fewer manual interventions → **kill Herdr CORE** forever — remain OPTIONAL plugin / `tmux+worktree` baseline (F03 is teardown only — T2 currently untested).
- **T3 — Local as wedge:** At 5 regulated-enterprise interviews + 10–15 policy/DPAs if ZDR insufficient for **<15%** (or ≥40% is the bar for pure-local mandatory) → **kill local-first as core** — ship hybrid degraded only, explicit 8GB ceiling, target 16GB+.
- **T4 — Wrapper moat (standalone):** **Already fails** — F04 desk construction shows MCP server 250–350 LOC + Claude hook <100 LOC + Herdr plugin 150–200 LOC, single dev <1 week (<2 weeks High) → **kill standalone** per synthesis (publish as MCP extension). For the *extension itself*, the remaining moat test is whether external replication of gate+ledger also clones too easily — then wedge must deepen via eval transparency, not features.

**Permanent KILL:** if all T1–T4 fail, do not pivot again. Reusable assets preserved (see Current Decision).

---

## Open Questions

**Only decision-critical unknowns (all `No reliable evidence found.` after `curl`+GH/HN APIs, no `tavily`/`exa`):**

1. **Population prevalence / willingness-to-pay** — corpus 7–21% is not market. Need survey n>100 (Stack Overflow/JetBrains splice + 5 regulated-enterprise buyer interviews) ranking collaboration/persistence vs reliable single-agent + verification + price sensitivity. Without this, market claim stays **Low**.
2. **Powered verification Pareto** — F02 n=5 is feasibility only (CI overlaps, synthetic overestimates success + underestimates multi-file/retrieval cost that Lite filters). Need n≥30 Verified (prefer 100) with real tiktoken billing + regression split + rolling post-cutoff.
3. **HerdrDelta measured** — F03 teardown + live snapshot only, no timed experiment. Need n≥20 pre-registered `tmux vs Herdr+plugin` measuring time-to-green + interventions (T2).
4. **Timed replication spike (T4 measured)** — F04 is desk estimate bounded by inspected `commandcode.integration` template + scaffolder, not built artifact. Need 2-week time-boxed build of MCP + Claude plugin + Herdr variant measuring actual days + regression/cost delta.
5. **OpenCode manifest + real pricing** — OpenCode docs body truncated to shell (Astro SSR), pricing bodies JS-rendered — Low confidence on those paths; need rendered fetch.
6. **Local-vs-cloud quantified gap + 8GB rig** — no bench for Qwen 14B Q4 / DeepSeek Lite vs frontier or 8GB tokens/sec harness [R006] — direction High, magnitude Low.

*Until 1–4 are measured, treat GO claims as unproven.*

---

## Current Decision

> **PIVOT — verification-first extension hypothesis.**

**This is a direction to test, NOT proof of a successful product.** From the original broad thesis (standalone, local-first, multi-agent by default, Herdr as core runtime covering all incumbents) the research **ruled out** multi-agent by default (EXPERIMENTAL until T1), Herdr as CORE (OPTIONAL until T2), pure-local as wedge (IMPORTANT SECONDARY until T3), and standalone defensibility (REJECTED — T4 fails for standalone) [01 §6-§10, 02].

The **narrowest defensible hypothesis** that survives validation is the thin **verification-first harness** — deterministic verification, loop/progress guardrails, and observable cost/reliability/regression — shipped as **MCP server `lace-ledger` + Claude Code plugin `lace-gate` (skill + `PostToolUse`/`Stop` hooks), with Herdr plugin `lace-herdr` as deployment variant**, sharing the same verification core (worktree + JSONL ledger + gate parser) [F04, 02 §9-§10, 04].

**Why not GO:** full platform fails T1–T4 on current evidence (multi-agent 3–10× for narrow gains with no A/B, Herdr CORE unproven, local niche, standalone trivially reproducible). Going would violate pre-registered gates.

**Why not KILL:** a narrow, severe, **harness-solvable** wedge is validated for affected users (F01 67 GH + pilot mechanism proves gate can rescue filtered-exception bug with regression 0), and existing tools *almost* solve but miss the deterministic gate — exactly the 1% glue cheap to ship as extension and the only durable differentiator per 01 §9. Killing would waste reusable assets.

**Why PIVOT is still a hypothesis:** pilot showed feasibility with median cost at edge (per-retry 2.05×) and no powered CI; wedge is *validated as severe problem + feasible harness*, not as *proven Pareto win* — that requires n≥30 Verified with real billing. Next build must be the **≤2-week thin extension plus the powered measurement that would have to kill it if it fails** [F02]. If all T1–T4 fail at scale, **permanent KILL** with reusable assets preserved (11-task corpus + raw, pilot repo/harness, extension skeletons, ledger/syntheses, Herdr snapshot).

---

## Product Principles

Working principles for the extension — evidence over confidence, constraints that R002→F01 pains proved necessary:

1. **Evidence over agent confidence.** Ship `No reliable evidence found.` where gaps exist; do not upgrade corpus 7–21% to population % or pilot +20pp point estimate to proven win. Labels FACT/EVIDENCE/INFERENCE/HYPOTHESIS/DECISION.
2. **Deterministic verification over self-reported success.** Gate exit code + regression suite + parse (JUnit/TAP) beats agent saying "done" — blocks merge on red/regression.
3. **Reversible changes over irreversible automation.** Every change in isolated `git worktree` + JSONL ledger; no cross-task mutation (F02 full-suite 6/6 with regression 0 when isolated).
4. **Measure cost and reliability together.** Pareto scorecard (`% resolved | regression | median cost | time | reliability | recovery`) from day one on Verified + rolling split — not `% resolved` alone (R005 failure mode).
5. **Reuse mature infrastructure.** ReAct, MCP ("USB-C"), ACP ("LSP"), Tree-sitter/ripgrep/BM25, `git worktree`/`apply`, JSONL, containers — do not build custom bus/parser/vector DB; build minimal loop+d dispatcher + gate parser [R004, F04].
6. **Do not add orchestration complexity without measurable benefit.** Pre-registered T1 Pareto gate; cap retries at 2; multi-agent stays EXPERIMENTAL (≤2–3 roles only if T1 passes).
7. **Do not build platform infrastructure when an extension is sufficient.** Prefer host-native extension (MCP server + plugin) over standalone/binary/multiplexer — T4 already fails for standalone (<2 weeks), Herdr stays OPTIONAL until T2. Same verification core, different host.
8. **Keep experimental ideas separate from committed requirements.** Multi-agent collaboration, local-model optimization, Herdr-specific enhancements, advanced indexing belong in *Experimental* (see above) — they graduate only with a passing gate, not by enthusiasm.

---

## Evidence Traceability

All product claims above cite `docs/01-research.md` (which cites `research/R001/`–`R007/` + `F01/`–`F04/` + syntheses). GH issues have URL+date+quote in per-task `evidence.md`; live Herdr snapshot + specs have access dates; pilot logs in `F02/pilot/results_*.json` + `experiment-design.md`; MCP/Claude/Herdr plugin surfaces cited to official specs + inspected local manifest. When research does not establish something, thesis states **No reliable evidence found.** with the gap enumerated in Open Questions.

