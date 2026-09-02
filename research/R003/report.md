# R003 — Multi-Agent Coding Evidence

**Worker:** R003 · **Model:** muse-spark-1.2-contributor-free · **Date:** 2026-09-02 · **Status:** COMPLETE
**Artifacts:** `research/R003/report.md` · `evidence.md` · `findings.md` · `open-questions.md`
**Skill:** `skills/research-agent/SKILL.md`

## Research Question

Do multiple AI agents collaborating on software-engineering tasks actually improve outcomes vs single-agent? Cover agent specialization, hierarchical planner/worker/reviewer, decentralized vs shared-context, task graphs, communication, parallel coding, file ownership, coordination. Seek quantitative evidence (success, benchmark performance, cost/tokens/latency, failure/regression rates, human intervention) and negative evidence where multi-agent is worse.

## Methodology

- Read `research/tasks/R003.md` + `skills/research-agent/SKILL.md` fully.
- Primary sources first: arXiv papers via direct fetch (`/abs/` + `/html/`), official repos (ChatDev, MetaGPT, AutoGen), official docs where available. Secondary: benchmark analysis.
- Prefer controlled comparisons, report n and metric definitions, label claims FACT/EVIDENCE/INFERENCE/HYPOTHESIS/OPINION, note hierarchy/conflicts, state confidence and gaps, explicitly state "No reliable evidence found" where search fails.
- Search strategy in-session: targeted fetches for known systems (ChatDev 2307.07924, MetaGPT 2308.00352, MacNet 2406.07155, Puppeteer 2505.19591, AutoGen 2308.08155, MultiAgentBench 2503.01935) + arXiv HTML search + DuckDuckGo filtered to arXiv. GitHub raw README fetches for ground truth on architecture. Extracted tables via HTML views; quotes preserved verbatim.
- Limits: arXiv search API rate-limited; no web-search tool; SWE-bench A/B not retrieved in-session — flagged as gap rather than invented.

## Sources Consulted

See `evidence.md` for full table (10 sources). Core set:

- E01 ChatDev (Qian et al., ACL 2024) — 2307.07924
- E02 MetaGPT (Hong et al., ICLR 2024) — 2308.00352
- E03 MacNet — 2406.07155 (collaborative scaling law, >1000 agents)
- E04 Puppeteer/Evolving Orchestration — 2505.19591 (RL orchestrator)
- E05 AutoGen — 2308.08155 (framework)
- E06/E07 Official repos: OpenBMB/ChatDev, geekan/MetaGPT
- E08 MultiAgentBench — 2503.01935 (benchmark gap)
- E09 In-paper coordination/error analyses
- E10 Gap: SWE-bench controlled A/B — no reliable evidence found

Source-quality hierarchy applied: peer-reviewed (E01/E02) > recent arXiv with code (E03-E05) > official repos > benchmark gap note.

## Evidence Summary

### Positive — multi-agent can win, but conditionally

- **SRDD (1200 prompts, 5 domains):** ChatDev multi-agent beats single-agent GPT-Engineer and beats MetaGPT multi-agent. Quality 0.3953 vs 0.1523 (E01 Table 1). Pairwise win rate vs GPT-Engineer 77.08% (GPT-4 judge) / 90.16% (human); vs MetaGPT 57.08% / 88.00% (E01 Table 2). Software stats: multi-agent produces ~2x lines/files (144 vs 70 lines) (E01 Table 3).
- **HumanEval/MBPP:** MetaGPT with GPT-4 + SOPs + executable feedback reaches **85.9% / 87.7% Pass@1** vs GPT-4 67% baseline — SOTA at publication (E02). Feedback alone adds **+4.2pp / +5.4pp** (E02).
- **SoftwareDev (70 tasks, n=7 sampled):** MetaGPT executability **3.75/4 vs ChatDev 2.25**, runtime **541s vs 762s**, human-revision cost **0.83 vs 2.25**, tokens/line **124 vs 249** (E02 Table 1) — more token-efficient per line despite higher total tokens.
- **Scaling:** MacNet logistic growth with agents; irregular DAG > regular; >1000 agents feasible with DAG partitioning (E03). Puppeteer RL orchestrator improves quality while reducing cost vs static graphs (E04).

### Negative — costs and failure modes

- **Cost/latency penalty:** Multi-agent uses **3-4x tokens** (E01: 7,182 vs 22,949-29,278) and **~10x latency** (15.6s vs 148-154s; SoftwareDev 503-762s range) — consistent across papers (High confidence).
- **Prototype ceiling:** Both papers note agents "often implement simple logic, low information density" and without detailed requirements "struggle to grasp task ideas" — suitable for prototypes, not complex real-world apps (E01 §6, E02 App. E.2 information overload).
- **Error persistence:** ModuleNotFound 45.76% of testing errors; Method Not Implemented 34.85% of review issues; many errors persist across turns despite dehallucination (E01 §4.3).
- **Ablation risk:** Removing roles or SOPs causes largest drop; naive chaining causes cascading hallucinations (E01 Fig 3, E02 abstract).

### Coordination mechanisms (what actually helps)

- **Phased chat chain** (ChatDev) vs **SOP assembly line + message pool** (MetaGPT) vs **DAG + (RL) orchestrator** (MacNet/Puppeteer). Shared-context via publish/subscribe and partitioned memory avoids context blowup. Natural language best for design (57.2% of design-phase comms); code language best for debugging (E01 §4.3). Irregular topology outperforms uniform (E03). No evidence retrieved on parallel file-sharded workers or file-ownership locking — gap.

## Key Findings (labeled)

- **EVIDENCE (Medium):** On curated greenfield synthesis (SRDD), structured multi-agent (ChatDev) substantially outperforms single-agent GPT-Engineer on quality/consistency/completeness — but dataset is author-curated and judge includes GPT-4.
- **EVIDENCE (Medium):** On function-level benchmarks, SOP + executable feedback (MetaGPT) lifts GPT-4 by ~19pp on HumanEval, with feedback contributing ~4-5pp — sensitive to prompt/parsing hygiene.
- **EVIDENCE (High):** Multi-agent trades 3-10x tokens/latency for 1.5-2x codebase size and modest quality gains; per-line token efficiency can be 2x better with SOPs.
- **FACT (High):** Authors of both leading systems flag prototype-scale ceiling and detail-dependence; not proven for large, long-lived repos.
- **INFERENCE (Medium):** Disciplined communication (roles, SOPs, dehallucination, feedback, DAG/orchestrator) is the causal factor, not agent count alone. Naive scaling hurts.
- **FACT (High):** No controlled same-model multi-vs-single A/B on SWE-bench retrieved — gap, not proof of zero effect (see E10/open-questions).

## Contradictions

- **ChatDev > MetaGPT (SRDD) vs MetaGPT > ChatDev (SoftwareDev).** Both primary, equal hierarchy. Resolution: different datasets/metrics each favor its own system; no neutral benchmark. Do not generalize. Weight both Medium-Low for external validity.
- **Scaling helps (MacNet logistic) vs scaling hurts (cost blowup).** Resolution: scaling helps only with topology/orchestration controls (DAG, RL puppeteer); naive linear chain scales poorly. Higher weight to MacNet on scaling claim (explicit study) and to E01/E02 on cost claim (tabulated).

## Confidence

- **Overall claim "multi-agent improves outcomes vs single-agent": Medium-Low confidence conditional** — strong evidence in narrow slice (greenfield prototypes, function benchmarks with strict prompting), weak/absent evidence for issue-resolution on real repos (SWE-bench) and for long-horizon maintenance.
- **Cost increase: High confidence.**
- **Mechanism (SOP/roles/feedback central): Medium confidence** — supported by ablations in both papers.
- **Scalability >100 agents: Medium confidence for DAG/orchestrated variants, Low for vanilla chains.**

## Limitations (of this research + of the evidence base)

- **This research limits:** no live web-search tool; arXiv search HTML-parsing brittle; only 6 paper families deep-fetched; no independent reproduction run; SWE-bench leaderboard not scraped; numbers taken from HTML tables without PDF cross-check; single-session fetch (2026-09-02).
- **Evidence-base limits:** SRDD and SoftwareDev are author-created, small sampled human ratings (n=7 for SoftwareDev table), no confidence intervals, GPT-4 judge bias risk, HumanEval/MBPP are function-level not repo-level, MetaGPT baseline GPT-4 67% is version-sensitive (0613), no regression rate / test-flakiness / human-intervention rates reported, no file-ownership/parallel-editing experiments found, cost numbers from different model versions (GPT-3.5/4 mix).

## Recommendation (for LACE)

- **Do not default to multi-agent.** For LACE (AI coding harness), treat multi-agent as an *optional mode* for greenfield/prototype synthesis where decomposition + review loops help, with strict SOPs, role prompts, shared message pool, and executable feedback. For iterative repo editing (SWE-bench-like), keep single-agent loop as default until a controlled same-model A/B shows Pareto win.
- **If exploring multi-agent:** implement (a) 2-3 roles max (planner/worker/reviewer) not N-agent swarms, (b) SOP-encoded phases, (c) DAG/orchestrated turn-taking with token-budget cap, (d) mandatory executable feedback (run + parse) — the only feedback ablated with +4-5pp gain, (e) file-ownership lock per task graph to avoid parallel clobbering (no evidence yet — instrument and measure).
- **Measure before scaling:** replicate the E01/E02 Pareto table on LACE tasks — success rate vs tokens, latency, failure rate, regression rate, human-intervention rate — with n≥30, confidence intervals, and blind human rating. Log every run for `research/raw/`.
- **Watch MultiAgentBench (E08) and MacNet/Puppeteer branches (E06) for evolving orchestration maturity; do not build custom orchestrator until RL puppeteer reproducibility is confirmed.**

## Artifact Notes

- All important claims cited to `evidence.md` with URL + access date + quote.
- Findings labeled per skill hierarchy; uncertainty and missing evidence reported in `findings.md` and `open-questions.md`.
- No stats invented; "No reliable evidence found" used for SWE-bench A/B and for file-ownership/parallel metrics.
