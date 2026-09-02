# R007 — Adversarial: Prove LACE Should NOT Be Built

**Worker:** R007 (lace-R007) — **Model:** muse-spark-1.2-contributor-free — **Date:** 2026-09-02
**Artifacts:** `research/R007/report.md` · `evidence.md` · `findings.md` · `open-questions.md`
**Skill:** `skills/research-agent/SKILL.md` — **Task:** `research/tasks/R007.md`
**Prior wave inputs:** `research/R001/report.md` · `R002` · `R003` · `R004` · `R005` · `R006`

## Research Question
Try to prove that LACE should NOT be built. Be the skeptic — negative findings are valuable.

LACE hypothesis (from Wave 1): an open, local-capable, provider-agnostic *harness/multiplexer* that orchestrates multiple coding agents with persistent shared state, git checkpoints/worktrees, and a verification loop (spec → tests → gate) — i.e., an agent-of-agents, not a 13th single agent.

## Methodology
1. Read `skills/research-agent/SKILL.md` + `research/tasks/R007.md` fully; identified 8 mandatory bullets.
2. Re-read R001–R006 reports (R001 competitive, R002 pain, R003 multi-agent, R004 architecture, R005 benchmarks, R006 local/privacy) to target critique at Wave 1's own evidence.
3. Re-fetched primary sources via `curl` on 2026-09-02 to weaken LACE: Claude Code overview docs, OpenCode repo, Continue README, arXiv ChatDev/MetaGPT abstracts, GH APIs for repos/issues. Searched for counter-evidence (SWE-bench multi-vs-single A/B, user demand for collaboration, Herdr sufficiency).
4. Applied source-quality hierarchy: papers/specs > official docs/repos > Wave 1 syntheses (secondary, Medium weight where training-derived) > forum anecdotes. Cited important claims with URL + access date + quote in `evidence.md`.
5. Labeled every claim FACT/EVIDENCE/INFERENCE/HYPOTHESIS/OPINION in `findings.md`; handled contradictions; stated confidence and gaps; no invented stats — "No reliable evidence found" where search failed.

Limitations of this adversarial pass: no dedicated web-search tool (curl + GH/HN APIs only); no live benchmark re-run; pricing pages JS-rendered; quantitative supplement beyond R003 papers is thin. Confidence calibrated accordingly.

## Sources Consulted
21 sources in `evidence.md` (E01–E21). Highest-weight: ChatDev/MetaGPT papers (E06/E07), MCP/ACP/ReAct specs (E17), Claude Code docs (E03), GH repos (E04/E20), plus Wave 1 internal evidence (E01/E05/E09/E11/E16/E19) treated as secondary summaries. Full table with quotes: `evidence.md`.

## Evidence Summary (Adversarial)

- **Incumbents exist & are active:** 12/12 products returned 200/301/308 on HEAD 2026-09-02 [E02]; Claude Code overview shows terminal/IDE/desktop/browser agent already integrated [E03]; OpenCode claims "The open source coding agent" [E20].
- **Multi-agent premium is large, gains narrow:** 3-4x tokens, ~10x latency (15.6s vs 148-154s) [E05]; SOTA lift driven by SOPs + executable feedback (+4-5pp) not agent count [E07]; prototype ceiling "simple logic, low information density" + 45.76% ModuleNotFound persists [E06].
- **No SWE-bench A/B:** "No reliable evidence found" for controlled same-model multi vs single on SWE-bench [E08] — absence after explicit search is itself negative evidence.
- **User pain ≠ LACE differentiation:** Top pains are context loss, hallucinations, verification burden, loops/hangs [E09]; users ask to *curb* autonomy [E10]; git already provides checkpoints.
- **Herdr already occupies runtime niche:** socket verified locally [E18]; R001 calls Herdr "the only multiplexer-native layer" in the same gap LACE claims [E01].
- **Local-first is niche:** R006 verdict "IMPORTANT SECONDARY — NICHE as primary, not CORE" [E11]; Continue archived/read-only [E14]; vendors hedge with ZDR cloud [E13]; enterprise solved via BYOK/content exclusion [E15].
- **Wrapper risk:** R004 says reuse ReAct+MCP+Tree-sitter+ripgrep+`git worktree`/trajectory/sandbox and "Do not build custom bus/parser/vector DB" [E16][E17] — LACE is composition, easy to clone.
- **Benchmark slice narrows gain:** SWE-bench Lite filters out multi-file/>3-hunk/file-create tasks [E19]; complexity paid for tasks benchmarks exclude.

## Findings (per 8 bullets)

### 1. Do incumbents already solve the problem? — YES, substantially
Evidence suggests Claude Code / Codex / OpenCode / Cursor plus Herdr collectively cover the LACE stack. R001's "no incumbent covers *all*" is a conjunction test; individually each feature (checkpoints via git, persistence via worktrees/CLAUDE.md, verification via bash/Docker, multiplexing via Herdr, provider-agnostic via OpenCode/Aider) exists. Remaining gap is integration, not capability. **Confidence: Medium** (R001 medium on details, but HEAD + E03 live). Contradicted by R001's gap framing — weighted lower because it's inference on a narrow conjunction.

### 2. Is multi-agent actually worse? — On current evidence, often
Strong evidence shows cost penalty (High confidence) for conditional gains. Multi-agent beats single-agent only on greenfield synthesis (SRDD, 77–90% win vs GPT-Engineer) and function-level (HumanEval) with strict SOPs+feedback; no repo-level SWE-bench A/B found [E08] (High confidence gap). Failure persistence and prototype ceiling limit real-world validity [E06]. **Confidence: High** that multi-agent is cost-worse; **Medium-Low** that it's quality-worse/better depends on task type.

### 3. Does communication overhead dominate? — Often, unless orchestrated
Evidence: total tokens 2-4x despite per-line efficiency win [E07]; information overload noted as limitation; MacNet/Puppeteer show overhead requires DAG + RL orchestrator to mitigate — itself heavy. Undisciplined scaling causes cascading hallucinations. **Confidence: Medium**. For LACE, overhead already visible in single-agent (SSE heartbeats, progress signal gaps [E10]) and multiplies with agents.

### 4. Do users care about the differentiation? — Weak evidence they do
No survey n>100 found (R002 gap). Top pains [E09] do not include "lack of collaboration/persistent ledger" — they include steerability (context loss), hallucination, verification burden. Gated autonomy (PlanBridge, disable "BE HELPFUL") points toward *less* orchestration, not more. Git checkpoints satisfy persistence without a product feature. HN search sparse [E21]. **Confidence: Medium** that differentiation is vendor framing, not buyer language. Treat as gap: "No reliable evidence found" that users rank collaboration above reliable single-agent.

### 5. Does Herdr make the runtime unnecessary? — Plausibly yes
Herdr provides workspace-aware panes, persistent workspaces, delegated verification [E18][E01]; R004 recommends `git worktree` for the same isolation [E16]. If the job is "run multiple agents with persistence," Herdr + Claude Code/Codex/Aider composes a solution today; even tmux + worktrees may suffice. Herdr's weakness is "nascent, thin docs" not missing primitive. LACE would duplicate a local layer with no new primitive. **Confidence: Medium** — no teardown quantifying Herdr vs LACE runtime delta.

### 6. Is local-first too niche? — Yes for core, no for secondary
R006 high-confidence finding based on 7 primary sources: enterprise already served by ZDR/BYOK + content exclusion/audit/local sandboxing [E15]; leading local vendors hedge with ZDR cloud [E13]; flagship local agent Continue archived [E14]; no benchmarks justify 8GB promise [E11]. Local-first is genuine for air-gapped/classified but insufficient as wedge for a general agent. Hybrid is preferred answer. **Confidence: Medium-High** for "niche as primary."

### 7. Would the product become another wrapper? — High risk
R004 maturity table shows every LACE primitive is mature and reusable — ReAct, MCP ("USB-C for AI"), ACP ("LSP for agents"), Tree-sitter, ripgrep/BM25, git primitives, JSONL trajectory, containers. Wrapper that composes them has near-zero moat; OpenCode [E20] and Claude MCP already do similar composition; Continue's archival [E14] warns of "yet another harness" churn. Spec churn (MCP 2025-06-18, ACP remote WIP [E17]) adds maintenance cost. **Confidence: Medium-High.**

### 8. Is technical complexity justified? — Not on current evidence
Incremental gains are small (+4-5pp from feedback is largest isolated lift [E07]) and measured on narrowed slices (Lite filters out the multi-file tasks LACE would target [E19]), while complexity is large (verification loops, repo-map ranking, DAG/RL orchestrator, BYOK/audit). R004 labels Plan→Act, embeddings, AST, ACP-remote as "conditional — add when measured gap appears" — LACE proposes them upfront. Cost-adjusted Pareto not shown. **Confidence: Medium.**

## Contradictions & How Resolved

- **"No incumbent covers all" (R001 inference) vs "each piece is covered somewhere."** Weight: the latter (FACT-level liveness [E02] + docs [E03]) over the former (Medium inference on conjunction). The gap is real but narrow — insufficient for a new product unless integration pain is quantified.
- **"SWE-bench is real-world" vs Lite/Verified фильтрация.** Weight: Verified/Lite pages (higher, human-audited) — they prove raw SWE-bench overstates gradable tasks and excludes the class LACE claims to improve. Weakens LACE's incremental-gain story.
- **"Privacy demands pure local" vs "ZDR/BYOK satisfies enterprise."** Weight: ZDR/BYOK side higher — LM Studio and GitHub docs both invest in it [E13][E15]; pure-local is minority per R006.
- **"Multi-agent scales (MacNet >1000 agents)" vs "cost 3-10x."** Resolution: scaling helps only with DAG/RL orchestration (research-grade), otherwise hurts — supports adversarial overhead story.
- No contradictory evidence silently omitted; missing evidence explicitly logged as "No reliable evidence found."

## Confidence Summary

| Claim | Confidence | Reason |
|-------|-----------|--------|
| Incumbents collectively cover LACE features | **Medium** | HEAD + docs fact, but R001 details are Medium |
| Multi-agent penalty (cost/latency) | **High** | Tabulated in two papers |
| Multi-agent benefit conditional on SOPs/feedback | **Medium** | Ablation shows mechanism, but dataset curated |
| No SWE-bench multi-vs-single A/B | **High** (gap) | Explicit search failure in R003 |
| User differentiation weak | **Medium** | R002 top pains + no n>100 survey |
| Herdr sufficiency | **Medium** | Local FACT + R001 Medium, no teardown |
| Local-first niche sizing | **Medium-High** | 7 primary sources converge (R006) |
| Wrapper risk | **Medium-High** | R004 reuse table is primary |
| Complexity not justified | **Medium** | Small gains vs large build, no Pareto shown |

Calibrated language used: "strong evidence shows" only for cost/absence; else "evidence suggests" (medium) or gap.

## Limitations (of this pass + evidence base)

- No web-search aggregator; HN/Reddit sentiment sample small (n~15 via GH/HN APIs in Wave 1). Prevalence not quantified.
- Pricing pages not verified (JS-rendered) — cost numbers rest on paper token counts, not live API pricing.
- Multi-agent evidence is greenfield/function-level (SRDD/HumanEval), not repo-level SWE-bench — exactly the external-validity gap; cannot generalize to negative proof.
- R001 capability details training-derived (cutoff 2026-01-04) — may miss post-Jan 2026 incumbent features that strengthen or weaken gap.
- No LACE teardown run — Herdr vs tmux vs LACE complexity comparison not measured.

## Recommendation — Kill / Pivot / Thresholds

**Do NOT build LACE as originally scoped (open, local-first, multi-agent orchestrated harness with verification/checkpoints/shared state) — pivot or kill unless thresholds below are met.**

**Recommended posture: KILL the multi-agent + local-first core; PIVOT to a narrow, low-complexity harness IF thresholds pass (below). Default: do not build.**

**Why kill the thesis:** Current evidence shows large overhead (3-10x) for narrow gains (+4-5pp from feedback, prototype ceiling), no repo-level A/B proving multi-agent advantage, incumbents covering each primitive, Herdr already occupying the multiplexer niche, and local-first being niche as primary with a failed precedent (Continue archived). Complexity is high, moat is thin (reusable MCP/ACP/Tree-sitter/git primitives), and user pain language does not request "collaboration."

**Pivot options (only if validated, smallest first):**

1. **Verification harness, not orchestration** — single-agent tool wrapper (git worktree + BTS + test → parse → feedback loop) that wraps an existing agent (Claude Code/Codex) rather than orchestrating teams. Lowest complexity, maps to R002 top pain (verification/regression).
2. **Herdr plugin, not replacement** — ledger/checkpoints as Herdr extension + MCP servers, not a standalone runtime. Test sufficiency via matchup vs Herdr + tmux.
3. **Enterprise compliance shim (ZDR/BYOK/audit)** — if regulated niche validated via buyer interviews, build only the trust surface, not the agent loop.

**Kill/pivot thresholds (measure before any build):**

- **T1 — SWE-bench Pareto:** On SWE-bench Verified (n≥30, 95% CI), a 2-3 role SOP + executable-feedback orchestration must show ≥10pp absolute gain over same-model single-agent at ≤2x median cost/latency, with regression rate ≤ incumbent single-agent. If not met → kill multi-agent.
- **T2 — HerdrDelta:** Teardown of Herdr + Claude Code + `git worktree` vs LACE-prototype must show >30% time-to-green or >50% reduction in manual recovery interventions (n≥20 tasks) — otherwise runtime is unnecessary → kill runtime, build plugin instead.
- **T3 — Local demand:** 5 regulated-enterprise interviews + policy corpus must show contractual ZDR/BYOK *insufficient* for ≥40% of targets (i.e., pure-local mandatory). If pure-local <15% → kill local-first as core, ship hybrid.
- **T4 — Wrapper moat:** Competitor-replication test: whether an existing team can add LACE's differentiation (ledger + verification gate) to Claude Code/OpenCode via MCP in <2 weeks. If yes → kill standalone, publish as MCP extension instead.

If all T1–T4 fail, **permanent kill**. If T1 or T2 passes in isolation, pursue the corresponding pivot (1 or 2) — not the full LACE vision.

## Artifact Contract
- `report.md` — this file
- `evidence.md` — source table + search summary
- `findings.md` — labeled bullets per 8 scope items
- `open-questions.md` — gaps and follow-ups
