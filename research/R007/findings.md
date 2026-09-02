# R007 Findings — Adversarial: Prove LACE Should NOT Be Built

Labels: **FACT / EVIDENCE / INFERENCE / HYPOTHESIS / OPINION** per `skills/research-agent/SKILL.md`. Each of 8 scope bullets addressed.

## 1. Incumbents Already Solve the Proposed Problem

- **FACT** — All 12 assigned competitors are live on 2026-09-02 (HEAD 200/301/308) including Claude Code, Codex, OpenCode, Cursor, Herdr. [E02]
- **FACT** — Claude Code is described officially as "an agentic coding tool that reads your codebase, edits files, runs commands, and integrates with your development tools. Available in your terminal, IDE, desktop app, and browser." [E03]
- **EVIDENCE** — Claude Code repo is active with hooks, sub-agents, plan mode, `AskUserQuestion`, MCP tool extension per R001; Codex uses `apply_patch` + markdown `AGENTS.md`; OpenCode is provider-pluggable + TUI; Cursor has Composer/Agent + indexing. R001 rated these Medium confidence (training cutoff 2026-01-04) — corroborated by live repo existence and E03 overview page. [E01][E02][E03]
- **INFERENCE** — R001's gap analysis admits "No incumbent covers *all* of" 5 properties, but that is a conjunction test. Any single property (verification, checkpoints, shared state) is individually covered: Claude Code has git checkpoints + session memory (`CLAUDE.md`) + compaction; OpenCode/Aider have provider-agnostic local; Herdr has persistence/multi-agent. The "all at once" gap is narrow and may not justify a new product. Confidence: **Medium**
- **HYPOTHESIS** — LACE's differentiation reduces to composition of features that already exist separately — an integration play, not a capability moat. Needs user evidence that composition pain > switching cost. [E01][E16]
- **OPINION** — User complaints about Claude Code (cost, over-eager edits, permission fatigue) per R001 are Low-confidence anecdotes (no live HN/Reddit fetch) and do not prove users want a new harness — could prove they want the same tool cheaper.

## 2. Multi-Agent Is Actually Worse (on Current Evidence)

- **EVIDENCE** — Multi-agent systems use **3-4x tokens and ~10x latency** vs single-agent: GPT-Engineer 7,182 tok/15.6s vs MetaGPT 29,278 tok/154s vs ChatDev 22,949 tok/148s (SRDD), and MetaGPT 503-762s on SoftwareDev vs 15.6s baseline. [E05][E06][E07]
- **EVIDENCE** — MetaGPT's SOTA 85.9%/87.7% on HumanEval/MBPP vs GPT-4 67% is attributed to **SOPs + executable feedback**; feedback alone adds +4.2pp/+5.4pp, not agent count. Without that, gains are smaller. [E07]
- **EVIDENCE** — Both leading multi-agent papers flag prototype ceiling: "often implement simple logic, low information density" and "struggle to grasp task ideas" without detailed requirements; error persistence 45.76% ModuleNotFound, 34.85% Method Not Implemented despite dehallucination. [E06]
- **FACT** — No controlled same-model multi-vs-single A/B on SWE-bench was retrievable in R003; E08 explicitly: "No reliable evidence found." The absence after targeted search is itself adversarial evidence — if multi-agent dominated repo-level work, such A/B would be prominent. [E08]
- **INFERENCE** — On current evidence, multi-agent trades large cost/latency for modest quality gains that are conditional on strict SOPs, role prompts, and feedback loops — naive scaling hurts (cascading hallucinations, ablation drops). Confidence: **High** for cost, **Medium** for conditional benefit.
- **HYPOTHESIS** — Multi-agent is a research demo optimized for greenfield synthesis (SRDD) and function-level benchmarks, not for iterative repo editing where most developer value lies. Needs SWE-bench A/B with n≥30 to falsify.

## 3. Communication Overhead Dominates Benefits

- **EVIDENCE** — Per-line token efficiency can improve with SOPs (MetaGPT 124-126 tok/line vs ChatDev 249 tok/line) but total tokens still 2-4x. [E07]
- **EVIDENCE** — MacNet identifies logistic scaling with agents (earlier emergence than neural, irregular DAG outperforms regular) and Puppeteer shows RL orchestrator "reduces computational costs" vs static graphs — implying overhead is real until orchestrated. [R003 E03/E04 via E05 summary]
- **INFERENCE** — Natural language best for design (57.2% of design comms) and code language best for debugging per ChatDev §4.3, but R004 notes "Information Overload" (Appendix E.2) as MetaGPT limitation — communication volume itself degrades performance. Disciplined communication is the causal factor, not agent count, and undisciplined scales poorly. [E06][R004]
- **INFERENCE** — For LACE, every additional agent adds tool-call streaming, context, and synchronization cost (SSE heartbeat failures, TUI progress gaps already observed in single-agent per R002 E10). Multi-agent multiplies those failure surfaces. Confidence: **Medium**
- **HYPOTHESIS** — Overhead dominates unless LACE ships a puppeteer-style centralized orchestrator with DAG partitioning and token-budget caps — which itself is research-grade complexity (see #8).

## 4. Users Don't Care About the Differentiation (Persistent State, Checkpoints, Collaboration)

- **EVIDENCE** — R002's ranked pains are context loss/repo drift, hallucinations, verification burden, loops/hangs, token cost/latency — **none** explicitly request "persistent multi-agent collaboration" or "checkpoints as a product." [E09]
- **EVIDENCE** — Users simultaneously ask to *disable* proactive agent behavior ("BE HELPFUL AND PROACTIVE" — Cline #13753) and add *gated* verification (PlanBridge "precise feedback on ... plans") — tension resolves toward *less* autonomy, not more orchestration. [E09][E10]
- **EVIDENCE** — HN comment: "Small tasks work fine... But when I tried building something real... difficult to keep an agent like Claude Code on track throughout an entire feature" — complaint is steerability/context, not lack of agent teams. [E21]
- **INFERENCE** — Checkpoints/state persistence is a means, not an end; git already provides checkpoints, worktrees, and undo for every incumbent. Users care whether code is correct and reviewable, not whether state is "persistent" as a feature. Differentiator language (ledger, checkpoints, collaboration) may be vendor framing, not buyer language. Confidence: **Medium**
- **OPINION** — Negative search signal: HN Algolia query "cursor agent hallucination regression" returned `{"nbHits":0}` — suggests community discourse around differentiation is sparse/noisy, not vocal. [E21] — Low weight (anecdotal hierarchy).
- **FACT** — No reliable evidence found that users rank "collaborative agent teams" above "single reliable agent with good verification" — no survey n>100 retrieved in Wave 1. Gap, not proof of demand.

## 5. Herdr Makes the Runtime Unnecessary

- **FACT** — Herdr is installed on this machine: `/home/sumeet/.config/herdr/herdr.sock` exists; binaries in mise; described as "terminal multiplexer for coding agents... workspace-aware, enables parallel agents." [E18]
- **EVIDENCE** — R001 positions Herdr as "the only multiplexer-native layer" and explicitly notes LACE would compete in "Herdr's neighborhood"; R004 recommends reusing `git worktree` + `git stash` + MCP for exactly the persistence/isolation Herdr already offers. [E01][E16][E18]
- **INFERENCE** — If the runtime problem is "run multiple agents with persistence and isolation," Herdr + existing agent (Claude Code / Codex / Aider) already composes a solution with zero new harness. The user question is whether Herdr's panes/workspaces + git worktrees are *sufficient* — and R001 rates Herdr's weakness as only "nascent, thin docs," not missing capability. [E01][E18]
- **HYPOTHESIS** — LACE as "Herdr but with more opinions" is the weakest moat: Herdr could add ledger/verification hooks faster than LACE could replicate Herdr's multiplexer. Buyer could also achieve equivalent with tmux + Claude Code + git worktrees today. Needs head-to-head teardown Herdr vs tmux vs LACE-proposed runtime (not done).
- **OPINION** — Herdr's community/docs thinness (Low-confidence per R001) cuts both ways: it proves demand not yet validated, not that LACE should replace it.

## 6. Local-First Is Too Niche to Matter

- **EVIDENCE** — R006 verdict, based on 7 primary sources, is "IMPORTANT SECONDARY / differentiator — NICHE as primary, not CORE" and explicitly "Pure-local does not carry the general market alone." [E11]
- **EVIDENCE** — Continue, the flagship open-source local coding agent (CLI + VS Code + JetBrains), is **read-only / no longer actively maintained** as of 2026-09-02 fetch. [E14]
- **EVIDENCE** — Both local vendors hedge: LM Studio offers "Zero Data Retention across the board" *plus* "For your most demanding tasks, run Bionic with ... frontier open models" [E13]; GitHub positions enterprise solution as BYOK + content exclusion + audit logs + local sandboxing, not pure offline [E15].
- **INFERENCE** — Enterprise trend is toward *approved cloud with ZDR/BYOK + gateway* rather than pure offline; local runtime ecosystem (Ollama, LM Studio, Aider-Ollama) is mature, but packaged local *agent* UX is fragmented and fragile. LACE betting on local-first as core would chase a shrinking TAM while conceding frontier capability. [E11][E12][E13][E15]
- **FACT** — No reliable evidence found for 8GB RAM agentic coding benchmarks or quantified local-vs-cloud gap on SWE-bench in R006 after searching Ollama/Aider/LM Studio — gap statement itself undermines sizing claims. [E11]
- **HYPOTHESIS** — Data residency is a qualifier, not a wedge: "hosted in US, Europe & Singapore" already satisfies most buyers; remaining air-gapped/classified niche is real but small and procurement-heavy.

## 7. The Product Would Simply Become Another Wrapper

- **EVIDENCE** — R004 maps every technique LACE would need to a mature reusable primitive: ReAct loop (trivial), MCP tool bus ("USB-C for AI"), ACP (LSP for agents), Tree-sitter/ripgrep/BM25, `git apply`/`git worktree`/trajectory JSONL, container/nsjail sandbox — and explicitly says "Do not build: Custom parser, custom vector DB, custom diff engine, bespoke tool bus (MCP covers it)" and "The cheapest wins... are *composition*." [E16][E17]
- **INFERENCE** — If LACE is composition, its defensibility is near-zero: OpenCode already is "The open source coding agent" with provider-agnostic claim [E20]; Claude Code extends via MCP servers; Aider supports Ollama/LM Studio [R006]. Any wrapper can add verification loop + git checkpoints in weeks. [E20][E12]
- **INFERENCE** — Wrapper failure mode: "yet another harness" that users try and abandon (Continue archived is cautionary tale [E14]); without model quality edge, users default to incumbent with best UX/model. LACE would inherit maintenance burden of tracking MCP/ACP spec churn (MCP 2025-06-18 versioned, ACP remote "work in progress" [E17]) with no compounding advantage.
- **HYPOTHESIS** — The "harness, not another editor/CLI" positioning from R001 is coherent but still a wrapper — the market may not reward it unless it visibly outperforms on cost-adjusted SWE-bench Pareto.

## 8. Technical Complexity Not Justified (Build Cost vs Incremental Gain)

- **EVIDENCE** — R005 shows even SWE-bench Lite *removes* the category LACE claims to improve: "multi-file edits, >3-hunk patches, file create/delete, error-message checks" are filtered out; Verified keeps only 500/2294 after human review; Multimodal V2 dropped 37 tasks for flakiness. Incremental gain is measured on a narrowed slice. [E19]
- **EVIDENCE** — Verification loops, trajectory logging, sandboxing, repo maps, embeddings, DAG orchestration each add latency, storage, and policy complexity per R004; MCP itself is still versioned/evolving, ACP narrower [E17]. Building them correctly (idempotent tools, intent validation, BYOK, audit) is high cost for small measured lift (R003: +4-5pp from executable feedback is largest isolated gain [E07]).
- **INFERENCE** — YAGNI pressure is high: Plan→Act, embeddings, AST-aware editing, ACP-remote are all labeled "conditional — add when measured gap appears, not by default" in R004. LACE proposing them upfront inverts the burden — pays complexity before proving gap. Confidence: **Medium-High**
- **INFERENCE** — Incremental gain vs cloud frontier model quality dwarfs harness gains: even perfect orchestration cannot offset choosing a weaker local model or adding communication overhead. The market leader solves privacy via cloud controls [E15] without harness complexity.
- **HYPOTHESIS** — Unless LACE demonstrates a cost-adjusted Pareto win (e.g., +10pp Verified at ≤2x cost) with n≥30 and confidence intervals, build cost is not justified. Current evidence suggests ≤5pp gains at 3-10x cost.
