# F02 — Evidence

> Model: muse-spark-1.2-contributor-free — Accessed: 2026-09-02
> Scope: Single-agent vs orchestrated verification pilot; prior evidence R003/R005 + pilot execution. No invented stats; gaps marked.

## Source Table — Prior Literature & Benchmarks (R003/R005)

| # | Source | Type | URL | Accessed | Relevance | Key Quote / Data |
|---|--------|------|-----|----------|-----------|-------------------|
| E01 | ChatDev: Communicative Agents — Qian et al. ACL 2024 (arXiv:2307.07924) | Primary paper (peer-reviewed) | https://arxiv.org/abs/2307.07924 | 2026-09-02 | Multi vs single on SRDD; cost table | Quality 0.3953 vs 0.1523; pairwise vs GPT-Engineer 77.08% (GPT-4)/90.16% (human); Table 3: GPT-Engineer 15.6s/7,182 tok/70 lines, MetaGPT 154.0s/29,278 tok/153 lines, ChatDev 148.2s/22,949 tok/144 lines — supports 3–4× tokens, ~10× latency claim (High) |
| E02 | MetaGPT: Meta Programming — Hong et al. ICLR 2024 (arXiv:2308.00352) | Primary paper (peer-reviewed) | https://arxiv.org/abs/2308.00352 | 2026-09-02 | SOP+feedback lift; executability | "MetaGPT achieves 85.9% and 87.7% in Pass@1"; "adding executable feedback leads to +4.2% and +5.4% in Pass@1"; SoftwareDev executability 3.75/4 vs 2.25, time 541s vs 762s, tokens/line 124 vs 249; human revision cost 0.83 vs 2.25 |
| E03 | MacNet: Scaling Multi-Agent Collaboration (arXiv:2406.07155) | Primary paper (arXiv) | https://arxiv.org/abs/2406.07155 | 2026-09-02 | Scaling law, DAG | "irregular topologies outperforming regular ones"; logistic growth, >1000 agents with DAG partitioning |
| E04 | Jimenez et al., SWE-bench (ICLR 2024, arXiv:2310.06770) | Primary paper | https://arxiv.org/abs/2310.06770 | 2026-09-02 | Benchmark definition | "2,294 software engineering problems drawn from real GitHub issues and corresponding pull requests across 12 popular Python repositories" |
| E05 | SWE-bench official site — leaderboard/docs | Official spec | https://www.swebench.com | 2026-09-02 | Variant definitions, harness | "every model in the same mini-SWE-agent environment"; cards for Verified/Lite/Multimodal |
| E06 | SWE-bench Lite (official) | Official spec | https://www.swebench.com/lite.html | 2026-09-02 | Lite construction | "300 tasks… 23 dev… 11/12 repos… Removed instances with images, short statements, >3 hunks, multi-file, create/delete, error-message checks" |
| E07 | SWE-bench Verified (official) | Official spec | https://www.swebench.com/verified.html | 2026-09-02 | Verified | "500 instances… Human annotators reviewed each instance to ensure problem descriptions are clear, test patches correct, tasks solvable… in collaboration with OpenAI" |
| E08 | SWE-bench Multimodal (official) | Official spec | https://www.swebench.com/multimodal.html | 2026-09-02 | Visual extension + flakiness | "517 issues… V2 retains 480 tasks selected for reproducible evaluation, with known flaky or ungradeable tests removed" |
| E09 | LiveCodeBench — Jain et al. (arXiv:2403.07974) + site | Primary paper + site | https://arxiv.org/abs/2403.07974 ; https://livecodebench.github.io/ | 2026-09-02 | Contamination-free design | "continuously collects new problems… from LeetCode, AtCoder, CodeForces … ~400 problems between May 2023–May 2024"; also measures self-repair, execution |
| E10 | Aider benchmarks/leaderboards | Official docs | https://aider.chat/docs/benchmarks.html | 2026-09-02 | Editing evaluation | "225 challenging Exercism exercises across 6 languages" ; stars ~48k (popularity proxy) |
| E11 | Synthesis thresholds (R007/Synthesis §10) | Prior synthesis | research/reports/01-research-synthesis.md | 2026-09-02 | Kill criteria | T1: ≥10pp gain at ≤2× median cost/latency, regression ≤ single-agent, n≥30 for 95% CI; T2 Herdr teardown; T4 wrapper moat |
| E12 | R004 primitives | Repo/official docs | research/R004/report.md ; https://git-scm.com/docs/git-worktree | 2026-09-02 | Mature reuse | ReAct, MCP 2025-06-18, Tree-sitter, ripgrep/BM25, `git worktree`, JSONL, containers — "Do not build custom bus/parser" |

## Pilot Execution Evidence (measured, not cited)

| # | Artifact | Type | Path | Data |
|---|----------|------|------|------|
| P01 | Pilot repo (buggy snapshot) | Local repo | `research/F02/pilot/repo/` @ `7b9850d` | 5 buggy modules; `tests_reference.py` 6 tests; `run_tests.py`; initial gate 1/6 pass (only regression_simple) |
| P02 | Tasks spec | JSON | `research/F02/pilot/tasks.json` | 5 specs (dates, calc, retry, bank, freq) |
| P03 | Fixes (reference) | Files | `research/F02/pilot/fixes/*_fixed.py` | 5 correct patches; `retry_baseline_flawed.py` (single-shot miss: catches Exception not `exceptions`) |
| P04 | Baseline results | JSON log | `research/F02/pilot/results_baseline.json` | 4/5 task-pass (80%), median tokens 391, median latency 0.058s, 0 recoveries, regression 5/5 |
| P05 | Candidate results | JSON log | `research/F02/pilot/results_candidate.json` | 5/5 task-pass (100%), median tokens 501 (1.28×), T03 retry 1158 tokens (2.05×), median latency 0.058s, T03 0.124s (2.03×), 1 recovery, regression 5/5 |
| P06 | Full-suite cumulative | Gate run | `repo` with all 5 fixes applied | 6/6 PASS |
| P07 | Reliability probe | Script output | `pilot/reliability.py` | T04 ×3 both arms 3/3 PASS |
| P08 | Harness | Python | `research/F02/pilot/harness.py` | Orchestration (worktree add/remove, parse→feedback, token/latency logging) |
| P09 | Wilson CI | Calc | `report.md` §5 | baseline Wilson 37.6–96.4%, candidate 56.6–100% (overlapping) |
| P10 | Power calc | Calc | `experiment-design.md` §6 | 10pp at p=0.5 needs ~300–387/arm, 20pp needs ~93 |

## Retrieval Notes

- arXiv HTML via `curl -s -L https://arxiv.org/abs/ID` and `/html/ID` 2026-09-02; quotes trimmed but verbatim.
- Official SWE-bench pages fetched via curl in R005 (see raw notes in R005 evidence; site verified). No pricing/HN sentiment needed for F02 — out of scope.
- Pilot runs executed offline locally 2026-09-02 on Python 3.14.7, git 2.55.0, no pytest/docker dependency (stdlib only). Token approx chars/4 (coarse, labeled).
- No hallucinations: numbers in P04/P05 are from actual `python3 harness.py` stdout + JSON logs; not invented.

## Source-Quality Hierarchy Applied

- Highest: peer-reviewed papers E01/E02, primary SWE-bench paper E04, official specs E05–E08 (over secondary summaries).
- Pilot measurements P04–P07 are primary (direct observation) but Low external validity due to n=5 synthetic.
- Synthesis thresholds E11 are normative (pre-registered), not empirical.
