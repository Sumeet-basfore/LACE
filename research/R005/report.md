# R005 — Benchmarks & Evaluation

**Task:** How are coding agents currently evaluated, and what metrics would actually matter for LACE?
**Model:** muse-spark-1.2-contributor-free | **Date:** 2026-09-02 | **Artifacts dir:** `research/R005/`
**Skill:** `skills/research-agent/SKILL.md` | **Task file:** `research/tasks/R005.md`

---

## 1. Research Question & Scope

How are SWE/coding agents evaluated today (SWE-bench family, other SWE benchmarks, agentic evaluations), what are the known limitations (reproducibility, contamination, real-world validity), and which metrics should LACE adopt — covering: task success, tests passing, regression rate, human intervention, time-to-completion, token cost, recovery success, context usage, reliability across repeated runs?

Out of scope (noted in open-questions.md): ProgramBench, general LLM leaderboards (MMLU etc.), and per-model score snapshots (intentionally omitted to avoid stale numbers).

---

## 2. Methodology

**Sources consulted:** Primary papers (Jimenez et al. 2310.06770; Jain et al. 2403.07974; Tao et al. 2408.14354; Chen et al. 2107.03374; Yang et al. 2405.15793), official benchmark sites (swebench.com + LiveCodeBench site), official repos (SWE-bench, LiveCodeBench, aider), and the OpenAI SWE-bench Verified blog (existence verified; body truncated by scraper).

**Search strategy:** Preferred primary > secondary, recent ≤12 months for leaderboard/capability claims. Started with SWE-bench family (paper → site → Lite/Verified/Multimodal pages), then contamination-free designs (LiveCodeBench), then classic pre-agentic baseline (HumanEval) and de facto editing benchmarks (Aider polyglot). All important claims cited with access date + quote in `evidence.md`.

**Labeling:** Every finding in `findings.md` carries FACT/EVIDENCE/INFERENCE/HYPOTHESIS/OPINION per skill hierarchy. Contradictions and uncertainty reported below; gaps marked "No reliable evidence found." per constraint.

**Limitations of this review:** Automated scraping truncated the OpenAI Verified blog body; several arXiv title-probe searches returned off-topic papers (no dedicated SWE-bench critique paper isolated by title in this session). Leaderboard numeric scores deliberately not scraped.

---

## 3. Sources Consulted (summary)

Full table with URLs, types, access dates, and verbatim quotes in `evidence.md` (15 sources). Most heavily relied upon:

- Jimenez et al., SWE-bench (2,294 tasks, 12 Python repos) — arXiv:2310.06770
- SWE-bench official site (leaderboard design, Verified uses mini-SWE-agent)
- SWE-bench Lite page (300 tasks + 23 dev; explicit filter criteria)
- SWE-bench Verified page + OpenAI blog (500 human-validated instances)
- SWE-bench Multimodal page (517 → 480 after flaky-test removal)
- LiveCodeBench (Jain et al. 2403.07974) + official site (rolling, contamination-free)
- Aider benchmarks/leaderboards (225 polyglot Exercism tasks; 48k GitHub stars)

---

## 4. Evidence (condensed)

- **Scale & method:** SWE-bench = 2,294 GitHub issues→PRs across 12 Python repos; evaluation = apply patch, run repo tests. [evidence.md#1]
- **Lite:** 300 + 23 dev, 11/12 repos, filtered to exclude images, short statements, multi-file edits, >3-hunk patches, file create/delete, error-message checks. [evidence.md#3]
- **Verified:** 500 instances human-filtered with OpenAI for clear statements / correct tests / solvability; leaderboard standardizes on mini-SWE-agent. [evidence.md#4, #2]
- **Multimodal:** 517 visual issues (V1) → 480 reproducible tasks (V2) after removing flaky/ungradeable tests. [evidence.md#6]
- **Java port:** SWE-bench-Java mirrors methodology with Docker harness; SWE-agent as reference. [evidence.md#8]
- **HumanEval baseline:** 164 hand-written Python problems, pass@k. [evidence.md#9]
- **LiveCodeBench:** ~400 problems (May 2023–May 2024 window) from LeetCode/AtCoder/CodeForces; contamination-free by continuous harvesting; also measures self-repair, code execution, test-output prediction. [evidence.md#10, #11]
- **Aider polyglot:** 225 Exercism exercises across 6 languages; reports pass-rate-1/2. [evidence.md#14]

---

## 5. Findings

### 5.1 How agents are evaluated today

The dominant paradigm is **patch → test harness**: clone repo at issue-time snapshot, apply agent patch, run relevant tests, score 1 if all pass else 0. SWE-bench established this; its variants are the de facto standard. Complementary paradigms:

- **Isolated synthesis** (HumanEval/MBPP): single-function generation with hidden unit tests; no repo context, no tool use.
- **Rolling contest** (LiveCodeBench): time-sliced contest problems to defeat memorization; adds self-repair and execution prediction beyond generation.
- **Editing-specific** (Aider): Exercism-derived rewrite/refactor tasks that stress precise code modification rather than green-field generation.

Leaderboards compare % resolved (or pass@k / pass rate). SWE-bench family dominates citations; LiveCodeBench is the strongest contamination-aware alternative; Aider polyglot is the most-cited multi-language editing signal.

### 5.2 Benchmark comparison at a glance

| Benchmark | Tasks | Langs | Source | Standout property | Metric |
|-----------|-------|-------|--------|-------------------|--------|
| SWE-bench (full) | 2,294 | Python (12) | GitHub issues→PRs | Real repo context | % resolved |
| SWE-bench Lite | 300 + 23 dev | Python (11) | Filtered SWE-bench | Cheap, self-contained | % resolved |
| SWE-bench Verified | 500 | Python | Human-filtered | Correct tests, unified harness | % resolved |
| SWE-bench Multimodal V2 | 480 | Python+visual | Issues w/ images | Vision required | % resolved |
| SWE-bench-Java | n/k this session | Java | Java issues | Cross-language | % resolved |
| HumanEval | 164 | Python | Hand-written | No repo/tools | pass@k |
| LiveCodeBench | ~400 (rolling) | Python | LeetCode etc. | Contamination-free | pass + repair/exec |
| Aider polyglot | 225 | 6 langs | Exercism | Multi-lang editing | pass rate 1/2 |

### 5.3 Benchmark limitations

**Reproducibility.** Verified exists because raw SWE-bench contained unclear statements and incorrect test patches — 500/2,294 retained after review. Multimodal V2 dropped 37 tasks for flakiness. Lite's filters exclude entire real-world categories to gain stability. Together these show the raw benchmark overstates reproducible, gradable tasks.

**Contamination.** Any static GitHub-derived set is inherently memorizable; issues/PRs predate most model cutoffs. Human filtering (Verified) does not fix leakage. Only rolling benchmarks (LiveCodeBench) structurally mitigate contamination by harvesting post-cutoff problems. This is the sharpest design divide in current evaluation.

**Real-world validity.** Lite explicitly removes multi-file, multi-hunk, file-creation, and error-message-sensitive tasks — precisely the tasks where agents most often fail or cause regressions. SWE-bench's pass/fail also conflates "tests pass" with "issue correctly fixed" (tests may be weak). Language coverage remains Python-centric (Java port is nascent; swebench.com's "42 repos / 9 languages" claim was observed but not verified against a dataset release this session). Visual/UI tasks are only partially covered (Multimodal).

**Harness confounding.** Reported scores conflate model capability with scaffolding (prompt, tools, retries). Verified's move to a single mini-SWE-agent environment is an admission that prior cross-system comparisons were not apples-to-apples.

### 5.4 Contradictions & how weighted

No direct paper-vs-paper contradictions were isolated (several arXiv probes returned off-topic papers, so critique literature is under-sampled — noted as a gap).

Apparent tension: *SWE-bench is "real-world" vs. Lite/Verified show it needed heavy filtering to be gradable.* Resolution: weight the official Verified/Lite pages (higher in hierarchy — spec + human audit) over the original paper's "real-world" framing. SWE-bench is real-world in source but not in unfiltered gradability.

Provisional claim: *"42 repos / 9 languages" on swebench.com front page* vs. papers describing 12 Python repos. Resolution: treat papers as authoritative for released SWE-bench; treat front-page text as aspirational / not-yet-documented until a multilingual dataset card is verified (source-quality hierarchy: official page is二级 but paper is primary for what was actually released).

---

## 6. Confidence

| Claim | Confidence | Reason |
|-------|-----------|--------|
| SWE-bench family structure (full/Lite/Verified/Multimodal) | **High** | Primary paper + official pages with verbatim quotes captured |
| Lite/Verified filter criteria & sizes | **High** | Direct page excerpts |
| LiveCodeBench's contamination-free design | **High** | Paper abstract + official site converge |
| Contamination as structural risk; rolling benchmarks as mitigation | **High** | Design logic, widely established |
| Weak-test / harness-confounding critiques | **Medium** | Inferred from Verified/Lite/Multimodal churn & leaderboard design shift; no dedicated critique paper captured this session |
| LACE metric recommendations (below) | **Medium** | Well-motivated by gaps but not validated against LACE workloads |

---

## 7. Recommendation — Metrics LACE Should Actually Track

Surveyed benchmarks report a single % resolved and ignore cost/latency/reliability/human effort. For a harness like LACE, that single number is insufficient — the decision is about Pareto trade-offs.

**Adopt as primary (measure on every run):**

1. **Task success / tests passing** — binary % resolved + granular pass-rate (share of relevant tests passing). Keep SWE-bench-compatible scoring for comparability.
2. **Regression rate** — share of previously-passing tests that break after the agent's patch (separate from task success; the most costly failure mode in practice).
3. **Token cost & wall-clock time** — per-task tokens (input/output), API cost, and end-to-end time. Leaderboards ignore cost; LACE should not.
4. **Reliability across repeated runs** — run each task N≥3 times (temperature >0) and report mean, variance, and pass@k / majority-vote stability; flakiness is currently invisible.
5. **Recovery success** — can the agent self-repair after a failing test / tool error without human help? LiveCodeBench already measures this; SWE-bench does not. Track retry-to-green rate and tool-error recovery.
6. **Context usage** — peak context tokens, truncation events, repo-context recall (files touched vs. files that should have been touched).
7. **Human intervention rate** — escalations, hints, or manual fixes required per task; the most honest measure of "autonomous."

**Report as a cost-adjusted scorecard, not a single number.** Minimum viable report per model/harness: `% resolved | regression rate | median cost | median time | reliability (σ / pass@3) | recovery rate`. Rank by Pareto frontier, not by raw % resolved.

**Evaluation protocol for LACE:**

- Use **SWE-bench Verified (500)** or **Lite (300)** for fast iteration (reproducible, comparable); reserve **full SWE-bench** or a private holdout for final validation.
- Add a **rolling / time-sliced split** (LiveCodeBench-style: problems dated after model cutoff) to guard against contamination.
- **Multi-language spot-check** with Aider-polyglot or SWE-bench-Java subset — at least one non-Python language.
- **Standardize harness** (like Verified's mini-SWE-agent) when comparing models; report harness as part of the result.

---

## 8. Limitations (of this review)

- OpenAI Verified blog body not fully captured (scraper truncation) — claims about annotator process rely on swebench.com/verified summary.
- No dedicated SWE-bench critique paper isolated by title search this session; limitation analysis leans on benchmark authors' own filtering actions rather than independent critique.
- Leaderboard absolute scores not recorded (avoided stale invented numbers per constraint); relative ranking trends not assessed.
- Aider and LiveCodeBench details from abstracts + docs only; full methodology sections not reviewed.
- Multi-language SWE-bench expansion ("42 repos / 9 languages") observed on site but not verified against a released dataset.

---

## 9. What Was Skipped, When to Add It

- Skipped deep dive into ProgramBench and other new variants — add when LACE targets green-field generation.
- Skipped per-model score history — add when choosing a specific model to ship, with a fresh leaderboard scrape.
- Skipped independent contamination audits (canary tests, cutoff-date splits) — add as a dedicated follow-up experiment on LACE's own holdout.

---

## Citations

All citations with URLs, access dates, and verbatim quotes are in `evidence.md`. Every numbered claim above cites evidence.md# rows; no invented stats.
