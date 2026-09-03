<!-- GENERATED ARTIFACT — COPIED FROM CANONICAL SOURCE -->
<!-- Canonical Source: research/reports/02-validation-synthesis.md -->
<!-- Category: validation -->
<!-- Synchronization: scripts/export_research.py -->

# LACE Validation Synthesis — F01–F04

**Date:** 2026-09-02 · **Scope:** 4 validation tasks (F01–F04) building on Wave 1 R001–R007 + 01-synthesis · **Model:** all workers `muse-spark-1.2-contributor-free` · **Workspace:** `LACE Validation` (w4, 5 tabs) — Main + F01-F04 each own tab/worker
**Skill:** `skills/research-agent/SKILL.md` · **Prior synthesis:** `research/reports/01-research-synthesis.md` (10 verdicts, T1-T4 thresholds) · **Artifacts:** F01 326 lines + raw, F02 415 lines + pilot repo/harness, F03 286 lines, F04 445 lines, ~100 sources added
**Ledger:** `research/ledger.md` (11 tasks COMPLETE: R001-R007 + F01-F04)

This is the validation-phase decision record. It does not create PRD/architecture — it decides GO/PIVOT/KILL and the narrowest wedge.

---

## 1. Is the problem sufficiently validated?

**Partially — narrowly validated, not market-validated.**

**Validated for affected users (Medium-High confidence on existence/severity, Low on demand):**
F01 sampled **67 GitHub issues/PRs** (target 50–100 met, 262 fetched, 67 retained after noise exclusion) across cline/cline (28), continuedev/continue (16), Aider-AI/aider (14), opencode-ai/opencode (8), zed (2) plus 4 HN/reports — recording every URL/quote in `F01/evidence.md` and bodies in `raw/details.json`. Cross-repo recurrence is real:

- privacy/trust 21% (14/67) — 3 identical trust-adapter proposals same week (Cline #13737, Continue #13212, Aider #5665) + telemetry ships unredacted URLs/paths [F01]
- verification burden 21% (14/67) — opposite polls (remove proactivity #13753 vs permission spam #13101) showing heterogeneity
- loops/hangs, hallucination, regression each 7–10% but each has ≥3 repos and High severity (hangs indefinitely with no logs, discards all changes, doubled-prefix hallucinations)

F01 concludes **≥4 product-grade clusters** (loops/hangs, hallucination/tool misuse, regression/state loss, privacy/trust) are validated as severe for affected users — convergence with independent R002 n=15 sample strengthens existence claim (triangulation). Harness-solvability judged in Q3.

**Not validated for market:**
F01 explicitly states *"No reliable evidence found"* for population prevalence or broader demand — no survey n>100 retrieved (same gap as R002), HN is anecdotal (hierarchy 9), pricing/bench magnitude not measured. Corpus prevalence (7–21%) **must not** be converted to population % — F01 is disciplined on this, and cost/latency ranking is confounded by inclusion of fix PRs that inflate verification/privacy counts. Therefore we have **existence + severity + harness-lever**, but not **sizing or willingness-to-pay**.

**Verdict:** Enough severe, harness-solvable pains exist to justify a *narrow product wedge* (verification/steerability), but **insufficient to justify a broad standalone platform** or multi-agent bet. This matches 01-synthesis posture exactly and adds 4× larger corpus to strengthen it.

---

## 2. Which pain is strongest?

**No single winner — severity and frequency diverge, and ranking depends on lens:**

- **Most frequent in this corpus (prevalence only, not population):** privacy/trust (21%) and verification burden (21%) — but this is partly artifact of counting fix PRs that *add* trust/verification features. F01 flags this inflation.
- **Most severe (blocks use / data loss, High confidence):** 
  1. **Loops/hangs (7% corpus, but blocking)** — "PLAN mode hangs indefinitely ... no error logs" [F01 #13750], 6-comment ReportFindings loop — blocks all use.
  2. **Hallucination / unreliable edits (9%)** — doubled-prefix headers, unknown MCP tool forwarded with opaque error, filename-miss in indented fenced blocks — silent incorrectness.
  3. **Regression / state loss (10%)** — "Add file to the chat discards all changes" (4 comments) + rollback of manual work — data loss.
  4. **Privacy / credential trust (21%)** — unredacted telemetry URLs/paths, `.env override=True` silently replaces shell vars — enterprise blocker (concentration of proposals proves buyer pressure, not just frequency).

- **Context loss is severe but under-sampled here (6% n=4)** — yet HN comment "difficult to keep agent on track throughout entire feature ... context is state" is rated High severity for long-horizon value proposition [F01 H01/H02]. Prior R002 had stronger context signal; query construction differences explain divergence — severity ranking aligns more than count ranking (F01 contradiction handling).
- **Cost/latency (16%) is Medium severity (billing bug 15-300x, token blowup)** — costly not correctness; progress visibility (9%) is UX, not blocker.

**Strongest for product:** **verification burden + loops/hangs + privacy/trust** form the *strongest harness wedge* — they are both recurrent (cross-repo) and directly harness-addressable (see Q3). Hallucination/regression are co-strong but only partially harness-solvable (need model improvement + guardrails). F01 recommendation converges: ship verification gate + loop/timeout + progress + MCP trust.

---

## 3. Is the pain solvable at the harness layer?

**Yes, for the wedge — with clear split:**

| Category | Harness vs model | Confidence | Why |
|---|---|---|---|
| **Progress visibility, loops/hangs, privacy/trust, verification burden** | **Almost entirely harness** | **High** | F01: progress TUI buffering/SSE heartbeats, loops via timeout/Stop #13678, privacy MCP proxies allowHeadless #9327 / OAuth hardening #13676 / .env fix #5622 / telemetry redaction #5621, verification via permission gates / auto-test #5610 / ledger #13155 — all ship in PRs as harness code |
| **Hallucination, regression, context loss, cost** | **Hybrid (harness can mitigate, not cure)** | **Medium** | Harness can reject unknown tools #12977, catch doubled-prefix #5112, sanitize malformed args #13092, use worktrees + ownership locks + truncation limits #13693 + hook delivery #13297, and fix pricing table #13184. But core doubled-prefix invention / doc fabrication / wrong-file choice #5662 is model-limited. HN H02 hypothesizes even apparent model failures are harness-lever — Medium-High that harness is primary lever even for hybrid pains, but not sufficient alone |

**Implication:** The validated narrow wedge is **solvable at harness** without inventing a new model — which is why F04 thin-layer reproduction works. This is both opportunity (cheap to build as plugin) and moat risk (cheap to copy).

---

## 4. Did verification-first orchestration demonstrate value?

**Feasibility proven, value not proven at the threshold — do not claim improvement without larger n.**

F02 executed the pre-registered pilot **as designed** (`F02/experiment-design.md`):

- Same model `muse-spark-1.2-contributor-free`, temp 0.2, identical repo snapshot `7b9850d`, identical hidden gate `tests_reference.py` (6 tests), worktree isolation for candidate vs tmpdir for baseline, measured task success / tests passing / regression / cost (chars/4) / latency / human intervention / recovery / reliability (T04 ×3). All logs archived in `pilot/results_*.json`.

**Measured (n=5 synthetic):**
- Baseline 4/5 = 80% vs Candidate 5/5 = 100% → **+20pp point estimate**, driven by **one recovery** (T03 exception-filter bug failed baseline, gate parsed `assert len(calls)==1`, second patch fixed)
- Tests passing per isolated run 2/6 (1 task + regression), full-suite cumulative 6/6 both (no cross-task interference)
- Regression 5/5 both — no new breakage
- Cost median 1.28× (total 1.48×), per-retry 2.05× tokens and 2.03× latency **at threshold edge**; latency median 0.058s both (only 1/5 retried)
- Human intervention 0, reliability 3/3 both on T04 (deterministic synthetic underestimates flakiness — R005 V2 dropped 37 flaky tasks)

**Why threshold NOT met:**
- Wilson 95% CI baseline 37.6%–96.4%, candidate 56.6%–100% — **heavily overlapping**. F02 correctly refuses to claim significance. Power calc shows detecting 10pp at p≈0.5 needs ~300/arm; even 20pp needs ~93; n=5 is far below n≥30 synthesis minimum (which itself only powers ~25–30pp). F02 states **T1 NOT MET — insufficient n to claim**, median cost passes but per-retry breaches 2× if retry rate rises.
- Synthetic proxy lacks repo scale/retrieval/multi-file edits that Lite filters [R005] — overestimates success, underestimates cost vs real SWE-bench. Tokens chars/4 is coarse (not billed).

**Value verdict:** **Mechanism demonstrated** (gate can rescue filtered-exception bug via parse→feedback — the SOPs+feedback +4–5pp mechanism from R003), **harness feasible** (worktree + parse→feedback loop runs, no cross-mutation), **but Pareto gate fails** — median cost at edge, required n not reached, regression parity not proven at scale. Keep single-agent loop as default; do not ship orchestration as CORE. This matches 01-synthesis expectation and validates discipline of pre-registration.

**Scale prescription from F02:** n≥30 on SWE-bench Verified Lite (300) with standardized mini-SWE-agent harness, Pareto scorecard (`% resolved | regression | median cost | median time | reliability | recovery`) + LiveCodeBench rolling split for contamination control [R005].

---

## 5. Did multi-agent orchestration demonstrate enough value to remain worth pursuing?

**No — remains EXPERIMENTAL, single-agent + verification is the correctly scoped hypothesis.**

- **F02 did not test multi-agent** — it tested *single-model verification* (same agent, orchestrated loop). The multi-agent evidence remains Wave 1: ChatDev 0.3953 vs 0.1523 quality, MetaGPT +19pp HumanEval via SOPs+feedback, but at 3–4× tokens, ~10× latency, prototype ceiling, no controlled SWE-bench A/B [R003, R007, F02 prior review]. F02 cites that gap explicitly and keeps it as *gap*, not as claim.
- **F01 provides no demand signal for collaboration** — zero issues in 67 requested "teams of agents"; heterogeneity signal instead wants *less* autonomy (remove proactivity vs permission spam). F02 pilot shows the gain came from *one agent retrying with gate*, not from adding agents.
- **F04 moat test reinforces:** full multi-agent DAG/RL orchestrator (MacNet/Puppeteer-scale) would *not* fit in 2 weeks — R004 marks it "conditional — add when measured gap appears." The minimal thin layer that *does* fit in <2 weeks is single-agent verification, not multi-agent.

**Verdict:** Keep **EXPERIMENTAL** per 01-synthesis §6. Do not promote to SUPPORTING or CORE. Multi-agent stays parking lot until T1 passes at n≥30 with regression ≤ baseline. Any multi-agent future should be 2–3 roles max with SOPs + executable feedback + worktree ownership lock — but only after verification-only baseline is measured.

---

## 6. Is Herdr actually necessary?

**No as CORE runtime; yes as OPTIONAL INTEGRATION / reference architecture.**

F03 Herdr teardown is the strongest evidence yet, based on **live 0.8.2 snapshot (protocol 20, 3 workspaces, 11 panes, 5 agents)** and official docs/skill/config plus tmux 3.7c and `git worktree` baseline — High confidence on description:

| Dimension | Herdr Δ vs tmux | LACE Δ vs Herdr+agent | Meaning |
|---|---|---|---|
| Agent lifecycle (`working/blocked/done/idle/unknown`, `agent_prompt_stalled` 5s), observability (`pane read` 4 modes + ANSI, `agent explain`, `api snapshot`), persistence (server owns panes, survives detach, `session.json` v3), workspace-aware hierarchy, agent-to-agent `agent prompt --wait`, automation (`wait-output --regex`, indefinite wait) | **Material** on lifecycle/observability/persistence/ergonomics (mouse + workspace rollup saves setup vs resurrect plugin/status hacks) | **Duplicates** at mechanism; **Thin** at policy — Herdr already does pane lifecycle, socket API exists | Herdr reduces boilerplate for supervision, doesn't change `git worktree` isolation (which is identical under both) |
| Task handoff, recovery (parse failure → feedback → retry, auto-revert), task-level observability (progress/cost/regression/recovery dashboard) | **None/Marginal** | **Real** — Herdr sees panes, not tasks; verification scorecard is missing [R005] | **This is LACE's only Real delta — above the multiplexer, not the multiplexer itself** |

**Threshold T2 adjudication:** Provisional gate `>30% time-to-green OR >50% fewer manual interventions` (n≥20) is **untested** — no controlled HerdrDelta numbers exist after live probe [F03, R007]. F03 correctly refuses to force CORE on ergonomics alone. Therefore Herdr is **OPTIONAL INTEGRATION** — ship as Herdr plugin / socket-API consumer (`herdr api snapshot` when `HERDR_ENV=1`), fall back to `tmux + git worktree` baseline. No hard dependency; document both.

**What LACE would duplicate if built standalone:** workspace/tab/pane lifecycle, socket API, session restore, 18-agent integration hooks — classic wrapper waste flagged by R004/R007. F04 strengthens this: a Herdr plugin is 150–200 LOC (copy of `commandcode.integration` template: 1 TOML + 3 sh scripts) <1 week, proving Herdr is the right *host*, not the thing to rebuild.

**When to promote Herdr to CORE:** only if a pre-registered n≥20 HerdrDelta experiment passes T2; if it fails, remain OPTIONAL forever (plugin, not platform).

---

## 7. Is a standalone product defensible?

**No — on current evidence, standalone is the weakest form.**

Convergence across R004 (mature reuse), R007 (wrapper risk), F03 (runtime duplication), F04 (thin reproduction) is **High confidence**:

- Every LACE primitive is mature and reusable (ReAct, MCP "USB-C for AI" [F04 E03], ACP "LSP for agents" [E04], Tree-sitter/ripgrep/BM25, `git worktree`/`apply`, JSONL, containers) — R004 directive *"Do not build custom bus/parser/vector DB"* directly contradicts owning the bus for standalone.
- Spec churn (MCP 2025-06-18, ACP remote WIP) is maintenance tax for a wrapper, not a moat [R007].
- Continue archived read-only warns of "yet another harness" churn [R006/F04].

**T4 (wrapper moat) decision:** F04 shows replication <2 weeks → **kill standalone** per synthesis T4 (if ledger+gate can be added via MCP in <2 weeks, kill standalone, publish as MCP extension). F04 desk construction is bounded by inspected real plugin (first-hand LOC), scaffolder proof (`/mcp-server-dev:build-mcp-server`), and hook JSON — Medium-High confidence even without timed build (gap logged).

**Standalone becomes defensible only if** T1 and T2 both pass with Pareto win and HerdrDelta prove a platform-level advantage that cannot be captured as a Herdr plugin — no evidence today meets this.

---

## 8. Is an MCP/plugin/Herdr extension the better product?

**Yes — unanimous across validation: thin extension is the correctly scoped product.**

F04 evaluated 6 paths (MCP server, Claude Code plugin/hooks, headless `claude -p` SDK loop, Herdr plugin, OpenCode extension, existing tools) against official specs/docs and a local Herdr install (`herdr.sock`, `plugins.json` with `commandcode.integration` precedent):

- **MCP server (Path A):** ledger + gate as tools via `modelcontextprotocol/typescript-sdk` over stdio/HTTP, one JSON entry in `.mcp.json` / `.claude.json` — 250–350 LOC, **<1 week** with scaffolder [F04 E07/E09]. Ledger = Resources + Tool history (JSONL) as `pi`/`herdr` already do.
- **Claude Code plugin/hooks (Path B):** verification gate as `PostToolUse Edit|Write → gate.sh` + `Stop → gate_check.sh` hooks (deterministic shell, not LLM choice [E06]), plus `skills/verify/SKILL.md` — **<100 LOC**, <3 days. Hook surface is JSON shell commands; R004 says reuse `git worktree`/ripgrep — wiring is glue.
- **Herdr plugin (Path D):** `herdr-plugin.toml` (3 panes verify/ledger/notify) + `scripts/verify.sh` (`git worktree add + herdr notification show`) — **150–200 LOC**, <1 week, copy of inspected `commandcode.integration` (46 LOC TOML + 3 sh) [F04 E11]. Socket via `herdr api snapshot/schema` gives state.

All paths are **<2 weeks for single dev**, High confidence per specs + local manifest, Medium-High for timeline (desk estimate bounded by n=1 real plugin instance, not measured build — gap logged).

**Recommendation (Outcome 3 + 2 variant per F04, now validated):**
- **Primary:** **MCP/server + Claude Code plugin `lace-gate`** (skill + hooks) — install via `claude mcp add` or `--mcp-config` / `--plugin-dir` / `claude -p --bare` [F04 E07-E09]. This is the thinnest composition that captures the validated wedge (verification gate + progress/loops + ledger + MCP trust).
- **Deployment variant:** **Herdr plugin `lace-herdr`** via `github:` source for Herdr users — reuses pane persistence + lifecycle instead of rebuilding it.
- **What F04 rightly defers:** OpenCode extension (docs shell not extracted via curl — Low confidence) and ACP extension (remote WIP, narrower than MCP) — not minimal.

**Why not existing tools alone (Outcome 4):** `git worktree + Herdr + bash` covers 90% — but the deterministic gate that *blocks merge until green + regression check* is exactly one hook (20 LOC). Claiming "already solved" overclaims by that 1%; the thin extension correctly captures the 1% glue.

---

## 9. What should the primary product wedge be?

**Single-agent, verification-first harness with cost/reliability transparency — shipped as thin extension(s), not a platform.**

**Narrow wedge (in priority order, harness-solvable and validated):**

1. **Verification gate as product primitive** — deterministic `spec → tests → gate (run_tests) → parse (JUnit/TAP) → feedback → retry (cap 2) → block merge on red/regression`. Enforce `test_regression_*` suite separate from task success (SWE-bench Verified pattern). Log `% resolved | regression rate | median cost (tokens→$ when billed) | median time | reliability (pass@3) | recovery rate` per R005 — the Pareto scorecard incumbents don't publish.
2. **Loop/timeout + progress/steerability guardrails** — timeout + `Stop` keep-alive [F01 #13678], fix progress signal while streaming (same symptom 2 products), parse→feedback for hallucinated tool names / doubled-prefix / malformed args.
3. **Trust / MCP proxy (allowHeadless + OAuth hardening + telemetry redaction)** — the 21% privacy/trust cluster is the enterprise unlock; ship MCP governance proxy as opt-in (`allowHeadless` precedent [F01 #9327]) rather than selling pure-local.

**Distribution:** MCP server `lace-ledger` (ledger + gate tools) + Claude Code plugin `lace-gate` (skill + `PostToolUse`/`Stop` hooks) + optional Herdr plugin `lace-herdr` (pane reuse). All three share the same verification core (git worktree isolation + JSONL ledger + gate parser) — difference is host.

**Pricing/privacy stance:** Hybrid by default — cloud frontier for capability, verifiable local path (Ollama/LM Studio via same MCP tools, BYOK) with auditable "nothing leaves" for local, ZDR for cloud + residency pinning — per 01-synthesis §8. Do not market pure-local as wedge (IMPORTANT SECONDARY, not CORE [R006/F01]).

---

## 10. What should explicitly NOT be built?

**Do not build — or explicitly defer until T1-T3 pass at scale:**

- **Standalone binary / custom multiplexer / custom bus/parser/vector DB** — duplicates Herdr + Claude Code loop + MCP (R004/F03/F04). Wrapper moat near-zero; T4 already fails for standalone.
- **Custom vector DB / embedding index as core** — lexical (ripgrep/BM25) + Tree-sitter is sufficient baseline; embeddings are conditional (R004).
- **AST-aware editing pipeline as core** — research-stage for agents; editor refactoring already covers it — reuse `ast-grep`/`comby` per language on demand.
- **Multi-agent DAG / RL orchestrator (MacNet/Puppeteer-scale) + per-account locks** — NOT in 2 weeks, prototype ceiling, no SWE-bench A/B, needs SOPs+feedback discipline; marked "add when measured gap appears" [R004/F02]. Keep multi-agent **EXPERIMENTAL**.
- **Pure-local-first distribution / 8GB-as-primary promise** — no bench, niche sizing, ZDR/BYOK satisfies broader market [R006]; target 16GB+ for usable local, degraded 8GB only with explicit ceiling.
- **ACP as primary extension** — remote WIP, narrower ecosystem than MCP — monitor, don't bet exclusively [R004].
- **Any benchmark harness that ignores cost/regression/reliability** — reproduces R005 failure mode. Do not ship a leaderboard number alone; ship the Pareto table.

---

## 11. What evidence is still missing? (decision-critical)

All gaps below were pre-logged as `No reliable evidence found.` and remain untested at scale — they are *kill/pivot gates*, not footnotes:

1. **Population prevalence / demand sizing** — F01 corpus (n=67) gives corpus prevalence, not population. **Need:** survey n>100 (Stack Overflow / JetBrains splice + 5 regulated-enterprise buyer interviews) ranking "collaboration/persistent state" vs "reliable single-agent with verification" + willingness-to-pay. Without this, market claim is Low confidence [F01, R002 gap, R007].
2. **SWE-bench Verified Pareto at scale** — F02 n=5 is feasibility, not decision (Wilson CI overlaps, n≈300 needed for 10pp). **Need:** n≥30 (prefer 100+) on Verified (500) or Lite (300) with standardized mini-SWE-agent harness, real token billing (tiktoken + $/1K), 95% CIs, cost-adjusted Pareto — plus LiveCodeBench-style rolling post-cutoff split for contamination control [F02, R005].
3. **HerdrDelta n≥20 timed experiment** — F03 is conceptual teardown + live snapshot, no time-to-green or intervention-rate measurement. **Need:** pre-registered `tmux+worktree+agent` vs `Herdr+worktree+agent` vs `plugin` on n≥20 tasks measuring time-to-green and manual interventions (T2: >30% or >50%) [F03].
4. **Timed replication spike (T4 measured)** — F04 is desk estimate (150–350 LOC bounded by inspected plugin), not a built artifact. **Need:** 2-week time-boxed build of `lace-ledger` MCP server + `lace-gate` plugin + `lace-herdr` variant, measuring actual build days and regression/cost delta vs baseline — *proving* the moat claim.
5. **OpenCode plugin manifest + gate A/B on real pricing** — OpenCode docs body truncated to shell (Low confidence), pricing pages not re-fetched (JS-rendered), gate regression/cost delta not measured on Verified harness [F04, F01 gap].
6. **Local-vs-cloud agentic gap quantification + 8GB hardware rig** — no SWE-bench table for Qwen 2.5 Coder 14B Q4 / DeepSeek Coder V2 Lite vs frontier, no 8GB tokens/sec harness [R006/F01].

**Until 1-4 are measured, treat all GO claims as unproven.** The validation phase correctly stopped at pilot rather than prematurely scaling.

---

## 12. Final decision — **PIVOT** (with KILL fallback)

**Decision: PIVOT**

> **From:** LACE as originally imagined — open, local-first, multi-agent orchestrated harness with persistent shared state, checkpoints, and Herdr as core runtime — covers all incumbents at once.
> **To:** **Verification-first harness as thin, host-native extension(s)** — a reusable `spec → tests → gate → parse → feedback` loop with worktree isolation, JSONL ledger, and cost/reliability/regression transparency, shipped as **(a) MCP server `lace-ledger` + (b) Claude Code plugin `lace-gate` (skill + PostToolUse/Stop hooks)**, with **(c) Herdr plugin `lace-herdr` as deployment variant** for Herdr users — all sharing the same verification core and Pareto logging, and none requiring a standalone binary, custom multiplexer, or multi-agent orchestrator.

**Why not GO:** Full LACE (multi-agent + local-first + Herdr-core standalone) fails validation on four独立 axes: multi-agent premium 3–10× for narrow prototype gains with no SWE-bench A/B (R003/F02), Herdr CORE requires untested HerdrDelta T2 (F03), pure-local is niche as primary (R006/F01), standalone is trivially reproducible as MCP in <2 weeks (F04 T4 fails). Going would violate pre-registered thresholds T1-T4.

**Why not KILL:** A *narrow, severe, harness-solvable* wedge is validated (F01 67-issue corpus + pilot feasibility) — verification burden / loops-hangs + progress + privacy/trust are real, recurrent, and each have GH issues/PRs that *are* harness code (PRs already patching them). Existing tools *almost* solve but miss the deterministic verification gate — the exact 1% glue that is cheap to ship as extension and maps to the only durable differentiator identified in 01-synthesis §9. Killing would waste reusable research/assets worth preserving.

**Why PIVOT (not GO on pivot):** The pivot itself is **not yet proven to win** — F02 shows median cost at edge (per-retry 2.05×) and no powered CI. Therefore pivot ships as *validated wedge + measured follow-ups*, not as "validated product." It is the narrowest defensible product that *could* justify a new harness, gated behind the same thresholds that killed the broader thesis.

### Narrowest product to build (if PIVOT proceeds)

**Ship in ≤2 weeks, measure before expanding:**

- **`lace-ledger` MCP server** (TS, `modelcontextprotocol/typescript-sdk`, stdio + HTTP): tools `ledger_append/read`, `gate_run`, `gate_parse`, `worktree_create` wrapping `git worktree`/`apply`/`tag`; backing JSONL (or SQLite) like `pi`/`herdr` trajectories [F04].
- **`lace-gate` Claude Code plugin** (`skills/verify/SKILL.md` + `hooks.json` `PostToolUse Edit|Write → gate.sh` + `Stop → gate_check.sh` + `.claude-plugin/plugin.json` ~10 lines + `.mcp.json` entry) — deterministic gate, not advisory.
- **`lace-herdr` plugin variant** (`herdr-plugin.toml` ~40 LOC + `scripts/verify.sh`/`launch.sh` reuse of `commandcode.integration` template [F04 E11]) for Herdr users — optional, not required.
- **Pareto harness** (`run_tests.py`-style gate + `tests_reference.py` separation of task vs regression) logging the R005 scorecard from day one; run `claude -p --bare --mcp-config lace.json --output-format stream-json` loop for CI.

**Gated follow-ups (kill/scale per T1-T4 — do not renegotiate after building):**
- **T1 Pareto:** n≥30 Verified (prefer 100) must show ≥10pp at ≤2× median cost/latency, regression ≤ baseline, Wilson CI non-overlapping — otherwise **kill orchestration** (keep single-agent default).
- **T2 HerdrDelta:** n≥20 tmux vs Herdr+plugin must show >30% time-to-green or >50% fewer interventions — otherwise **kill Herdr CORE** forever (remain OPTIONAL).
- **T3 Local demand:** 5 interviews + policy corpus must show ZDR insufficient for ≥40% — otherwise **kill local-first as wedge** (ship hybrid degraded only).
- **T4 Moat:** 2-week external replication spike — if external dev clones gate+ledger in <2 weeks (F04 predicts yes for extension, but tests standalone assumption), **kill standalone** permanently (already decided — this T4 is now the moat test for the *extension* itself: if it clones too easily, the wedge needs deeper differentiation e.g., eval transparency).

### Permanent KILL triggers

- If T1 fails at n≥100 with real billing on Verified Lite/Verified, **permanent KILL** on verification-first as CORE — keep it as community plugin only, not a product.
- If all T1-T4 fail, **permanent KILL** — do not pivot again.

### Reusable research/assets (if KILL)

- **Research corpus:** `research/R001/`–`R007/` + `F01/`–`F04/` (32 artifacts, 100+ primary sources, pain taxonomy, cost/Pareto analysis) — publish as `research/` for future harness attempts.
- **Pilot repo/harness:** `research/F02/pilot/repo` + `harness.py` + `results_*.json` + `experiment-design.md` — directly reusable for any future SWE-bench Verified rig.
- **Extension skeletons:** F04 minimal compositions (MCP 250-350 LOC, Claude plugin <100 LOC, Herdr plugin 150-200 LOC) — start from inspected `commandcode.integration` template, not greenfield.
- **Ledger + synthesis:** `research/ledger.md` (11 tasks COMPLETE, contradictions logged) + `01`/`02` syntheses — decision record preventing re-litigation.
- **Herdr live snapshot + docs inventory** (F03 E01–E23) and GitHub corpus (`F01/raw/*.json`) — re-usable for any tmux vs Herdr comparison.

---

## Cross-validation & Confidence (synthesis-level)

- **High:** Multi-agent cost penalty (tabulated), SWE-bench structure + Lite filtering + harness confounding, LiveCodeBench contamination-free design, MCP/ACP/Tree-sitter/ripgrep maturity, Herdr runtime description/lifecycle/snapshot/API (live 0.8.2), MCP+hooks+Herdr thin reproduction (<2 weeks bounded by inspected plugin), pain *existence* for 4 clusters (cross-repo GH issues, triangulated R002→F01).
- **Medium:** Pain *severity* ranking (judgment on consequence, not count), hybrid harness vs model attribution for hallucination/context/cost, verification wedge as durable differentiator (inferred from pain + benchmark gap, not yet proven by Pareto win at scale).
- **Low:** Population prevalence/demand (no survey — F01 explicitly low), magnitude of local-vs-cloud gap and 8GB ceiling (no bench), pricing at scale (pages not re-fetched), multi-agent general SWE-bench superiority (no A/B).

**Method limits (honesty):** No tavily/exa search (curl + GH/HN APIs only, as in Wave 1); GH org renames required fallback; corpus built from recent 2026 window; fix-PRs inflate verification/privacy counts; pricing pages JS-rendered; synthetic pilot underestimates real repo scale/retrieval/multi-file difficulty and overestimates reliability; OpenCode docs truncated; no timed replication build — desk estimate not measured.

> Validate, don't manufacture. Current evidence sustains a narrow verification-first extension, not a standalone multi-agent local-first platform. The next build must be the ≤2-week thin extension *plus* the powered measurement that would have to kill it if it fails.

