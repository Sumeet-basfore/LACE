# R003 — Findings

> Labels: FACT / EVIDENCE / INFERENCE / HYPOTHESIS / OPINION — per `skills/research-agent/SKILL.md`
> Confidence: High / Medium / Low with reason. Citations: `evidence.md` IDs.

## Summary

- Multi-agent coding can outperform single-agent on *greenfield synthesis* tasks when communication is structured (chat chain + SOPs + dehallucination/feedback), but gains are task-dependent, cost 3-10x tokens/latency, and break down without role specialization or when context coordination fails.

## Positive Evidence (multi-agent > single-agent)

- **EVIDENCE — ChatDev beats single-agent GPT-Engineer on SRDD (1200 prompts, 5 domains) across all quality metrics.** Quality score 0.3953 vs MetaGPT 0.1523 vs GPT-Engineer baseline lower (Table 1, E01). Pairwise wins vs GPT-Engineer: 77.08% (GPT-4 judge) / 90.16% (human judge) — E01 Table 2. *Confidence: Medium* — methodology clear, dataset self-curated (SRDD), judges include GPT-4 (position bias mitigated per paper) + human experts randomized, but no SWE-bench and no public SRDD reproduction by third party cited. Sample: full SRDD for metrics; pairwise sample size not stated in extracted text.
- **EVIDENCE — ChatDev also beats another multi-agent baseline (MetaGPT) on same SRDD**, wins 57.08% (GPT-4) / 88.00% (human) — E01 Table 2. *Confidence: Medium* — same caveat; suggests not all multi-agent designs equal.
- **EVIDENCE — MetaGPT with SOPs beats GPT-4 alone on HumanEval/MBPP:** 85.9% (HumanEval) and 87.7% (MBPP) Pass@1 vs GPT-4 67% baseline cited in paper (E02). Executable feedback adds +4.2% / +5.4% absolute. *Confidence: Medium* — GPT-4 baseline is 67% per paper's E02 appendix; GPT-4-0613 re-evaluations in appendix show sensitivity to prompt/parsing, so delta depends on prompt hygiene. No confidence intervals reported for HumanEval/MBPP (n=164 / 427).
- **EVIDENCE — MetaGPT beats ChatDev on SoftwareDev (7 sampled of 70 tasks) on executability and efficiency:** Executability 3.75/4 vs ChatDev 2.25; runtime 541s vs 762s (E02 Table 1); human-revision cost 0.83 vs 2.25 (E02 §4). Tokens/line lower (124 vs 249) despite higher total tokens. *Confidence: Low-Medium* — n=7 sampled tasks only; human-rated executability (1-4 scale) introduces subjectivity; single run; no variance reported.
- **EVIDENCE — MacNet shows logistic scaling: performance rises with agents then plateaus, irregular DAG topologies > regular; supports >1000 agents without context overflow via partitioned DAG (E03).** *Confidence: Medium* — claim from arXiv paper + code available; no independent replication cited; task mix includes reasoning beyond pure coding.
- **EVIDENCE — Puppeteer (evolving orchestrator) achieves superior performance with reduced cost vs static orchestration (E04 abstract + E06 README).** *Confidence: Low* — arXiv claim only; detailed tables not extracted in-session; accepted to NeurIPS 2025 per repo but peer review not yet public for numbers.

## Negative / Contradictory Evidence (multi-agent ≯ or < single-agent)

- **EVIDENCE — Multi-agent costs 3-10x single-agent on same task:** E01 Table 3: GPT-Engineer 7,182 tokens / 15.6s vs ChatDev 22,949 tokens / 148.2s and MetaGPT 29,278 tokens / 154s. E02: MetaGPT 31,255 tokens vs ChatDev 19,292 but still ~4x single-agent. *Confidence: High* — directly tabulated, consistent across both papers. Tradeoff is not mitigated except per-line efficiency.
- **FACT — Both primary papers acknowledge failure modes where multi-agent does not help:** E01 §6 Limitations: "agents often implement simple logic, resulting in low information density. Without clear, detailed requirements, agents struggle to grasp task ideas... more suitable for prototype systems rather than complex real-world applications." Also "compared to single-agent approaches, multiple agents require more tokens and time, increasing computational demands." E02 Appendix E.2 discusses Information Overload. *Confidence: High.*
- **EVIDENCE — Role ablation: removing roles is largest performance drop in ChatDev (Figure 3, E01 §4.2).** Naive chaining without SOPs/roles causes "cascading hallucinations... logic inconsistencies" (E02 abstract). *Inference:* Undisciplined multi-agent (just adding agents) likely hurts. *Confidence: Medium.*
- **EVIDENCE — Error persistence in multi-turn communication:** Even with dehallucination, top errors remain ModuleNotFound 45.76%, NameError/ImportError 15.25% each (E01 §4.3); most errors persist across turns. *Confidence: Medium.*
- **FACT — No reliable evidence found for controlled multi-vs-single win on SWE-bench–style issue-resolution.** E08 highlights that existing benchmarks "either focus on single-agent tasks or are confined to narrow domains, failing to capture the dynamics of multi-agent coordination." No A/B with same model/prompt on SWE-bench retrieved in-session (E10). *Confidence: High that gap exists (not that effect is zero).*

## Coordination / Architecture Findings

- **FACT — Three distinct coordination patterns observed in evidence:** (1) ChatDev: chat chain = phased waterfall (design→coding→testing) with role-based seminars + communicative dehallucination (E01). (2) MetaGPT: assembly line + SOP-encoded prompt sequences + shared message pool with publish/subscribe + executable feedback (E02). (3) MacNet/Puppeteer: DAG-topology + orchestrator (static or RL-evolved puppeteer) (E03/E04). *Confidence: High* — directly described in sources.
- **EVIDENCE — Shared-context mechanism matters more than agent count:** E01: 57.2% natural language in design vs code-heavy in debugging; E02: SOP + message pool reduces unproductive collaboration; E03: irregular DAG > regular mesh. *Confidence: Medium.*
- **INFERENCE — File ownership / parallel editing not evaluated in retrieved papers.** Both ChatDev/MetaGPT are sequential-phased, not parallel file-sharded workers. No evidence on file-ownership locking vs free-for-all. *Confidence: High that evidence is missing.*
- **HYPOTHESIS — Hierarchical planner→worker→reviewer pattern is implicit in both ChatDev and MetaGPT (instructor/assistant pairs) but not isolated as variable; gains may come from reviewer feedback loop, not hierarchy depth itself.** Needs A/B where reviewer is ablated (E01 ablation shows review boosts executability/quality). *Confidence: Low; needs validation.*
- **OPINION (attributed) — AutoGen authors position multi-agent as generic infrastructure: "flexibly define agent interaction behaviors... both natural language and computer code can be used to program flexible conversation patterns" (E05).** Treat as design claim, not efficacy claim.

## Quantitative Synthesis (where comparable)

| Dimension | Single-agent (GPT-Engineer/GPT-4) | Multi-agent (ChatDev/MetaGPT) | Delta |
|-----------|-----------------------------------|-------------------------------|-------|
| SRDD Quality (E01) | ~0.15 (MetaGPT baseline) implied; GPT-Engineer lower | ChatDev 0.3953 | +0.24 absolute |
| HumanEval Pass@1 (E02) | GPT-4 67% | MetaGPT 85.9% | +18.9pp (+4.2 from feedback) |
| MBPP Pass@1 (E02) | (baseline not cited same way) | MetaGPT 87.7% | +5.4 from feedback |
| Tokens/task (E01) | 7,182 | 22,949–29,278 | ~3-4x increase |
| Latency (E01/E02) | 15.6s | 148–541s | ~10-35x increase (different task sets) |
| Tokens/line (E02) | — | MetaGPT 124 vs ChatDev 249 | ~2x more efficient with SOPs |

*All deltas medium-low confidence due to different datasets, model versions (GPT-3.5/4), and small n for SoftwareDev.*

## Contradictions — How We Weigh Them

- **E01 says ChatDev > MetaGPT on SRDD; E02 says MetaGPT > ChatDev on SoftwareDev.** Weight: Both are primary, same hierarchy, but datasets differ (SRDD 1200 synthetic prompts vs SoftwareDev 7 sampled creative tasks) and metrics differ (automated Quality vs human executability). *Resolution: INFERENCE — each system wins on the benchmark its authors designed; no head-to-head on neutral SWE-bench. Do not generalize to "multi-agent always wins."*
- **E03/E04 claim scaling helps (logistic growth, >1000 agents); E01/E02 show sharply diminishing returns and cost blowup.** Weight: Scaling law is from a paper explicitly studying scaling (E03) with DAG partitioning to avoid context limits; cost blowup is from naive chain/assembly line without that partitioning. *Resolution: INFERENCE — scaling only pays with topology/orchestration control; naive Add-N-Agents likely hurts cost/latency without proportional quality.*

## Gaps

- No SWE-bench controlled A/B; no regression rate / test-flakiness / human-intervention rates reported; no latency/token vs success Pareto curve with confidence intervals — see `open-questions.md`.
