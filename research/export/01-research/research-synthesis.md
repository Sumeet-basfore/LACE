<!-- GENERATED ARTIFACT — COPIED FROM CANONICAL SOURCE -->
<!-- Canonical Source: research/reports/01-research-synthesis.md -->
<!-- Category: research -->
<!-- Synchronization: scripts/export_research.py -->

# LACE Research Synthesis — Wave 1 + Adversarial (R001–R007)

**Date:** 2026-09-02 · **Scope:** 7 tasks (R001–R006 Wave 1 + R007 adversarial) · **Model:** all workers `muse-spark-1.2-contributor-free` · **Workspace:** `research/R00{1-7}/` + `research/ledger.md`
**Skill:** `skills/research-agent/SKILL.md` · **Prior phase artifacts:** 28 files (7× report/evidence/findings/open-questions), ~1,973 lines, 100+ sources

This synthesis answers only after Wave 1 + adversarial are complete. It does not create PRD/architecture — it decides whether a problem worth solving exists and what LACE should be.

---

## 1. Problem — What important problem exists?

**Narrow, high-severity problem (well-evidenced):** Developers lose trust in coding agents on *real* work because agents are unreliable, unverifiable, and costly to steer.

Specifically, recurring pains converged across R002 (15 primary sources: 7 GH issues + HN + blog) and R003/R005:

1. **Context loss & repo understanding failure** — "Small tasks work fine... But when I tried building something real... difficult to keep an agent like Claude Code on track" [R002 E11]. E09 bundles context trimming + hallucination + token-loss. **High severity** — long-horizon tasks are the value proposition.
2. **Hallucinations / unreliable patches** — named failure class: tool-name hallucination, cap-path token loss, ModuleNotFound 45.76%, Method Not Implemented 34.85% persisting despite dehallucination [R002 E09-E10, R003 E06].
3. **Verification burden & regression risk** — PlanBridge exists to add "precise feedback on ... plans" [R002 E03]; GitHub's 2025 agent-mode expands edit surface without guarantees [R002 E01]. SWE-bench shows tests themselves are often weak/incorrect (Verified kept 500/2,294) [R005].
4. **Agent loops / hangs / stuck states** — Cline PLAN hangs indefinitely on Ollama [R002 E04]; opencode SSE delivers only heartbeats [R002 E08]; loops "cost twice as much" [R002 E12 weak]. **High existence, Low magnitude precision.**
5. **Token/cost/latency + missing progress** — 3-10× cost/latency for multi-agent (7k→29k tok, 15s→154s) [R003 E01]; TUI "no progress signal while tool-call arguments stream" [R002 E08].
6. **Privacy / credential sprawl / enterprise trust** — "copy-pasting long-lived API keys into .env ... no lineage" [R002 E02]; Aider/Continue both propose Universal Trust Adapter for MCP [R002 E06-E07]; Copilot already ships BYOK/content exclusion/audit [R006 E07]. **Enterprise blocker, not hobbyist.**

**What is NOT a validated problem:** "lack of multi-agent collaboration," "lack of persistent ledger as a feature," "need for a new agent." No survey n>100 ranks collaboration above reliable single-agent [R007 E08, R002 gap]. Git already provides checkpoints/worktrees.

**Confidence:** Medium-High that the 6 pains above are real and recurring (multiple repos + papers). Low that they justify a *new multi-agent product* — they justify better *verification and steerability*.

## 2. Evidence — What supports the problem?

| Evidence class | Strength | Source |
|---|---|---|
| GH issues labeling hallucination/context trimming/token loss as bug class | High (multiple repos) | R002 E09-E10, R003 E06 |
| HEAD liveness 12/12 products 2026-09-02 (existence) | High | R001 E02, R007 E02 |
| Tabulated multi-agent cost 3-4× tok, ~10× latency + per-line efficiency numbers | High (tabulated) | R003 E01 Table 3, R007 E05 |
| SOPs + executable feedback +4-5pp HumanEval, prototype ceiling quotes | Medium-High (ablation) | R003 E02, R007 E06-E07 |
| HN/GitHub issues on credential sprawl + MCP trust proposals | Medium (primary issues) | R002 E02-E07 |
| SWE-bench filtering (500/2294 Verified, 480 multimodal) proving test/incorrectness | High (official pages) | R005 E04-E06 |
| LiveCodeBench contamination-free design (~400 rolling problems) | High (paper + site) | R005 E10-E11 |
| Enterprise controls (BYOK/ZDR/sandbox) proving buyer pressure | High (official docs nav) | R006 E07 |
| "No reliable evidence found" for n>100 survey, local-vs-cloud bench, 8GB rig | Gap (explicit) | R002, R003 E10, R006 |

**Contradictory evidence handled:** autonomy push (GitHub 2025 agent mode) vs user request to curb proactivity [R002 E01 vs E05] — weighted toward user pain; scaling logistic (MacNet) vs linear cost blowup — weighted to topology-controlled scaling only.

## 3. Existing Solutions — Who already solves it?

12 products inventoried with HEAD verification [R001]:

- **Single-agent terminal/CLI:** Claude Code (best repo understanding, plan mode, sub-agents, MCP), Codex (`apply_patch`, `AGENTS.md`), OpenCode (provider-agnostic, TUI, pluggable), Aider (SEARCH/REPLACE, git-native, repo-map, Ollama/LM Studio support)
- **Editor-native:** Cline / Roo Code (VS Code, Plan/Act modes), Cursor / Windsurf (VS Code forks, indexing, Composer/Cascade, cloud-first), Zed (Rust, collaboration, provider-agnostic)
- **Autonomous/research:** OpenHands (Docker sandbox, max autonomy), SWE-agent (ACI, benchmark harness)
- **Multiplexer (not an LLM agent):** Herdr (workspace-aware panes/tabs, persistent workspaces, git worktree-friendly) — the only multiplexer-native layer [R001]

**Maturity of primitives (R004):** ReAct (+34% ALFWorld, +10% WebShop [R004 E01]) is mature; MCP 2025-06-18 spec ("USB-C for AI" [R004 E02]) and ACP ("LSP for agents" [R004 E05]) are standards; Tree-sitter/ripgrep/BM25, `git worktree`/`apply`, JSONL trajectory, containers are mature and reusable — "Do not build custom bus/parser/vector DB" [R004].

**Effectiveness limits:** No product covers *all* of provider-agnostic + local/offline + first-class verification + persistent multi-agent + open/hackable at once — but each piece is covered somewhere (Claude Code + git worktrees + Herdr + OpenCode/Aider) [R007]. That is integration, not capability.

## 4. Gap — What remains unsolved?

**True gaps (Medium confidence, needs validation):**

1. **Verification as a first-class loop** — incumbents delegate to `bash`/Docker adhoc; SWE-agent sandbox is closest but not a product primitive. No benchmark reports regression rate or human-intervention rate [R005]. User pain confirms this gap.
2. **Provider-agnostic + auditable + cheap composition** — Aider/OpenCode/Zed do local, but packaged UX is fragile (Continue archived [R006 E05]), and Cursor/Windsurf/Claude Code are cloud-coupled by default.
3. **Cost-adjusted evaluation** — leaderboards report % resolved, ignoring regression/cost/latency/reliability/recovery/context [R005 synthesis].

**Narrow or unproven gaps (Low confidence that gap justifies new product):**

4. **Persistent multi-agent coordination** — only Herdr offers it; R003 shows no SWE-bench A/B, prototype ceiling, high overhead — gap is real but demand is unvalidated (R007).
5. **Local/offline as primary wedge** — runtime exists (Ollama/LM Studio), but ZDR/BYOK increasingly satisfies enterprise without pure-offline [R006, R007]; 8GB promise has no bench.

**Already well-served (do not rebuild):**

- Repo indexing/search (ripgrep/BM25 + Tree-sitter + embeddings), patch (diff/SEARCH/REPLACE), git checkpoints/worktrees, trajectory JSONL, sandboxing, tool-calling — all reusable [R004].

## 5. Opportunity — Why could a new harness matter?

**Only if it composes rather than clones, and pays complexity only when Pareto is proven.**

- **Position as harness/multiplexer, not 13th agent.** R001 gap analysis: win is "agent-of-agents" with shared ledger, handoff, recovery, and a verification gate (spec → tests → gate) that wraps existing agents (Claude Code/Codex/Aider) inside Herdr-like panes. Compete on orchestration/persistence/verification, not LLM quality [R001 recommendation].
- **Keep it open/local-hybrid** — "Important secondary" differentiator vs Cursor/Windsurf/Claude Code cloud-first, but not primary [R006]. Ship verifiable local mode (Ollama/LM Studio-compatible, BYOK-ready) with ZDR cloud path — auditable "nothing leaves" for local path.
- **Differentiate on measurement** — publish the missing Pareto scorecard: `% resolved | regression rate | median cost | median time | reliability (σ/pass@3) | recovery rate` on SWE-bench Verified + rolling post-cutoff split [R005]. Rank by Pareto frontier, not raw %.
- **Build only after thresholds (R007 T1-T4), smallest first:** (1) verification harness around single-agent (worktree + test→parse→feedback), (2) Herdr plugin (ledger/checkpoints as extension), (3) enterprise shim (ZDR/BYOK/audit) only if niche validated via interviews. Default: do not build full LACE.

**When NOT to build:** If goal is "better single-agent in terminal," use Claude Code/Codex; if "better in-editor," use Cursor/Cline. Those are better than a wrapper without proven delta.

## 6. Multi-Agent Verdict — **EXPERIMENTAL (not CORE)**

**Verdict: EXPERIMENTAL — single-agent loop is default; multi-agent is an optional mode gated behind thresholds, not the product thesis.**

**Why:**
- **Positive but narrow:** ChatDev beats GPT-Engineer 77%/90% pairwise (SRDD) and MetaGPT lifts GPT-4 67%→85.9%/87.7% on HumanEval/MBPP, but gains are driven by SOPs + executable feedback (+4.2pp/+5.4pp), not agent count, and on curated greenfield/function-level sets [R003, R007 E06-E07].
- **High cost:** 3-4× tokens, ~10× latency (15.6s→148-154s; SoftwareDev 503-762s) [R003 E01, R007 E05] — High confidence penalty.
- **Ceiling + missing evidence:** Authors flag "simple logic, low information density" and 45.76% ModuleNotFound persists [R003 E06]; no controlled same-model multi-vs-single A/B on SWE-bench retrieved — gap explicitly "No reliable evidence found" [R003 E10, R007 E08]. Absence after targeted search is negative evidence.
- **Coordination burden:** Irregular DAG + RL orchestrator (MacNet/Puppeteer) required to mitigate overhead — itself research-grade [R003 E03-E04]; undisciplined chaining causes cascading hallucinations [R003 ablation].
- **User demand weak:** Top pains do not request teams; users ask to curb autonomy [R002 E05 vs E03], not add orchestration [R007].

**Playbook if explored:** 2-3 roles max (planner/worker/reviewer), SOP-encoded phases, DAG/orchestrated turn-taking with token-budget cap, mandatory executable feedback, file-ownership lock per task graph via worktrees. Measure success vs tok/latency/failure/regression/human-intervention (n≥30, CIs) — do not scale to >100 agents without DAG proof [R003].

**Escalate to SUPPORTING only if** T1 passes: ≥10pp Verified gain at ≤2× cost/latency with regression ≤ single-agent.

## 7. Herdr Verdict — **OPTIONAL INTEGRATION** (REFERENCE ONLY if teardown fails)

**Verdict: OPTIONAL INTEGRATION — support Herdr as a first-class host, ship as Herdr plugin where available, but do not require Herdr; tmux + `git worktree` is the baseline.**

**Why:**
- **Herdr already occupies the niche:** socket verified locally [R007 E18]; R001: "the only multiplexer-native layer" — workspace-aware panes, persistent workspaces, delegated verification [R001, R007 E01/E18]. R004 recommends `git worktree` for same isolation [R004].
- **Sufficiency unproven:** No Herdr vs tmux vs LACE teardown exists (gap [R007, R006 F03]); Herdr weakness is "nascent, thin docs" not missing primitive [R001/R007]. Adversarial correctly notes Herdr + Claude Code/Codex/Aider already composes a solution with zero new harness, and Herdr could add ledger/hooks faster than LACE replicates multiplexer [R007 E18].
- **Lazy choice:** Reuse mature primitives (ReAct + MCP + `git worktree` [R004]) — don't invent custom bus. If product is composition, defensibility is near-zero; Continuum archived warns of harness churn [R006 E05, R007 E14].

**When to keep Herdr as CORE RUNTIME:** only if HerdrDelta teardown (T2) shows >30% time-to-green or >50% fewer manual interventions vs tmux+worktrees (n≥20 tasks). Otherwise keep as optional integration / reference architecture.

## 8. Local/Offline Verdict — **IMPORTANT SECONDARY (NICHE as primary → REJECTED)**

**Verdict: IMPORTANT SECONDARY — hybrid, not CORE. Pure-local as primary is REJECTED.**

**Why:** R006 synthesis (7 primary sources, High confidence on direction) converges:
- Enterprise concern is productized (content exclusion, BYOK, private registry, audit, sandboxing) proving buying pressure [R006 E07, R007 E15], but preferred fix is *approved cloud with ZDR/BYOK + gateway* — LM Studio itself hedges: "Privacy is key... ZDR across the board" + "For your most demanding tasks, run Bionic with frontier open models" [R006 E04, R007 E13].
- Local runtime is mature (Ollama one-line install, Docker, broad library [R006 E01-E03]), but *packaged local agent* is fragile: Continue is "no longer actively maintained and is read-only" [R006 E05, R007 E14].
- No quantified local-vs-cloud gap or 8GB bench found after searching Ollama/Aider/LM Studio — `No reliable evidence found.` [R006]. Direction (local < cloud) High, magnitude Low.
- Counter-evidence weighted higher: ZDR/BYOK has broader enterprise investment than pure-local dogma [R006 contradiction 1].

**Implication:** Default to cloud frontier for capability; ship verifiable local mode (Ollama/LM Studio, BYOK-ready) with auditable guarantees ("nothing leaves" for local, ZDR for cloud) for regulated segment. Do not design for 8GB as primary — explicit ceiling, target 16GB+.

## 9. Differentiation — What would make this product meaningfully different?

**Only 3 durable differentiators survive adversarial scrutiny — all outside "another agent":**

1. **Verification gate as product primitive** — not bolted-on `bash` loop, but a harness that enforces spec → tests → gate with regression tracking, recovery success, and cost. No benchmark reports this (gap = opportunity) [R005]; it directly solves top pain [R002]. Start as single-agent wrapper (Herdr plugin) before multi-agent.
2. **Cost-adjusted Pareto transparency** — publish `% resolved | regression | median cost | median time | reliability (pass@3) | recovery` on Verified + rolling split [R005]. Incumbents won't; reproducibility + harness confounding (Verified's mini-SWE-agent admission [R005]) is their weakness.
3. **Hybrid privacy with verifiable claims** — local mode that actually keeps data local ("Nothing you run locally ever leaves your machine" [R006 E01] made auditable) + BYOK/ZDR cloud path with residency pinning (US/EU/SG [R006 E01]). Not pure-local religion.

**Not differentiators (skip):** another LLM, another editor/CLI, another custom parser/vector DB/bus (MCP/ACP already cover it [R004]), "multi-agent teams" as slogan (no demand signal [R007]), worktrees/checkpoints as novel features (git already does it).

## 10. Kill Criteria — Under what conditions should we stop?

**Default posture after adversarial: KILL the multi-agent + local-first core; PIVOT only if thresholds pass. Use R007's pre-registered thresholds — do not renegotiate after building.**

- **T1 — SWE-bench Pareto (multi-agent justification):** On SWE-bench Verified (n≥30, 95% CI), 2-3 role SOP + executable-feedback orchestration must show **≥10pp absolute gain** over same-model single-agent at **≤2× median cost/latency**, with **regression rate ≤ single-agent**. If not met → **kill multi-agent**, keep single-agent + verification.

- **T2 — HerdrDelta (runtime justification):** Teardown Herdr + Claude Code + `git worktree` vs LACE-prototype must show **>30% time-to-green or >50% fewer manual recoveries** (n≥20 tasks). If not met → **kill standalone runtime**, ship as Herdr plugin / MCP extension instead.

- **T3 — Local demand (local-first justification):** 5 regulated-enterprise interviews + policy corpus (10-15 policies/DPAs per R006 F01) must show **contractual ZDR/BYOK insufficient for ≥40%** (pure-local mandatory). If pure-local <15% → **kill local-first as core**, ship hybrid with degraded 8GB mode only.

- **T4 — Wrapper moat (defensibility):** Time-boxed replication spike: can a team add LACE's ledger + verification gate to Claude Code/OpenCode via MCP in **<2 weeks**? If yes → **kill standalone**, publish as MCP extension — no compounding advantage [R004, R007].

**Permanent kill:** if all T1-T4 fail, do not pivot. If T1 or T2 passes in isolation, pursue only that pivot (verification harness or Herdr plugin) — not the full LACE vision.

**Immediate pre-build checklist (from open-questions):**
- Re-verify R001 capabilities (live doc re-parse + top-5 GH issues per product) — R001 was Medium/Low on details.
- Quantify pain prevalence: 50-100 GH issues coded by theme [R002 F] + survey n>100.
- Run F02 SWE-bench A/B rig + F03 8GB hardware rig + F01 policy corpus before sizing niche or quoting performance.

---

## Confidence & Limitations (Synthesis-level)

- **High:** Multi-agent cost penalty; SWE-bench family structure + Lite/Verified filtering; LiveCodeBench contamination-free design; enterprise controls existence; MCP/ACP/Tree-sitter/ripgrep maturity; benchmark disregard for cost/reliability.
- **Medium:** Gap is integration/orchestration+verification (pattern across 12 products, but R001 details are training-derived Medium); wrapper moat argument (R004 reuse table is primary but no replication timing measured).
- **Low:** User demand for multi-agent collaboration as ranked want (no survey n>100, HN search sparse [R002]); magnitude of local-vs-cloud gap and 8GB ceiling (no bench); pricing at scale (no PRD, pages JS-rendered).

**Method limits:** No tavily/exa search tool (curl + GH/HN APIs only); pricing/benchmark bodies teilweise truncated; SWE-bench scores deliberately not scraped to avoid stale invention; Wave 1 relied on HEAD liveness + training fallback — needs live re-verification before build.

## Artifacts & Traceability

- Wave 1: `research/R001/`–`R006/` (report/evidence/findings/open-questions)
- Adversarial: `research/R007/` (8 bullets, 21 sources, thresholds)
- Ledger: `research/ledger.md` (COMPLETE ×7, model compliance verified, contradictions logged)
- Next: targeted follow-ups (F01 policy corpus, F02 A/B rig, F03 8GB rig, wrapper spike) → re-evaluate T1-T4 → then and only then PRD/architecture

> Optimize for discovering whether a problem worth solving exists — do not manufacture a conclusion. Current evidence says: **important verification/steerability problem exists, but LACE as originally scoped (open, local-first, multi-agent orchestrated harness) should not be built — pivot to verification harness / Herdr plugin and prove Pareto before any further build.**

