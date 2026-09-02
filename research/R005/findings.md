# R005 — Findings

> Labels: FACT / EVIDENCE / INFERENCE / HYPOTHESIS / OPINION — per `skills/research-agent/SKILL.md`.

## How coding agents are currently evaluated

- **FACT** — SWE-bench (Jimenez et al., ICLR 2024) defines 2,294 GitHub issue → PR tasks across 12 Python repositories evaluated by applying the agent's patch and running repository tests. [evidence.md#1]
- **FACT** — SWE-bench Lite is a 300-task filtered subset (plus 23 dev instances) covering 11/12 repos, selecting for self-contained issues: removes images/hyperlinks/commit-SHA references, <40-word statements, multi-file edits, >3-hunk gold patches, file create/delete, and error-message-checking tests. [evidence.md#3]
- **FACT** — SWE-bench Verified is a 500-instance human-validated subset built with OpenAI; annotators filtered for clear problem statements, correct test patches, and solvability given available information. The default Verified leaderboard runs every model in the same mini-SWE-agent environment. [evidence.md#2, #4]
- **FACT** — SWE-bench Multimodal extends the benchmark to visual software tasks: V1 had 517 issues with visual elements (screenshots, UI artifacts); V2 retains 480 tasks after removing flaky/ungradeable tests. [evidence.md#6]
- **FACT** — SWE-bench-Java (Tao et al., 2408.14354) ports the methodology to Java with a Docker-based evaluation harness and leaderboard, using SWE-agent as a reference method — demonstrating language generalization beyond Python. [evidence.md#8]
- **EVIDENCE** — HumanEval (Chen et al., 2107.03374) provides 164 hand-written Python function-synthesis problems measured with pass@k; it remains the most-cited pre-agentic baseline that agentic benchmarks build upon. [evidence.md#9]
- **EVIDENCE** — LiveCodeBench (Jain et al., 2403.07974) takes a contamination-free approach: continuously harvesting ~400 problems (May 2023–May 2024 window reported) from LeetCode/AtCoder/CodeForces, and additionally testing self-repair, code execution, and test-output prediction. [evidence.md#10]
- **FACT** — LiveCodeBench's stated design principle is "holistic and contamination free… continuously collects new problems over time" from periodic contests to avoid train-test leakage. [evidence.md#11]
- **EVIDENCE** — Aider's polyglot benchmark tests 225 Exercism exercises across six languages (C++, Go, Java, JavaScript, Python, Rust) and reports pass-rate-1 / pass-rate-2; its original benchmark covers Exercism Python editing tasks. Aider itself has ~48k GitHub stars, making its leaderboards a widely referenced de facto evaluation. [evidence.md#14, #15]
- **FACT** — SWE-agent (Yang et al., 2405.15793) is a widely used agent-computer interface for SWE-bench evaluation; the Verified leaderboard and the Java port both reference it as the standard harness. [evidence.md#13, #8]

## Benchmark comparison (scope)

| Benchmark | Tasks | Language(s) | Source of tasks | Key property | Primary metric |
|-----------|-------|-------------|-----------------|--------------|----------------|
| SWE-bench (full) | 2,294 | Python (12 repos) | GitHub issues→PRs | Real-world repo context, test-based | % resolved (tests pass) |
| SWE-bench Lite | 300 + 23 dev | Python (11 repos) | Filtered SWE-bench | Self-contained, cheaper to run | % resolved |
| SWE-bench Verified | 500 | Python | Human-filtered SWE-bench | Clear statements, correct tests, same harness | % resolved |
| SWE-bench Multimodal V2 | 480 | Python (+ visual) | Issues with images/UI | Vision + code | % resolved |
| SWE-bench-Java | not verified in this session | Java | Java GitHub issues | Cross-language generalization | % resolved |
| HumanEval | 164 | Python | Hand-written | Isolated function synthesis | pass@k |
| LiveCodeBench | ~400 (rolling) | Python (contests) | LeetCode/AtCoder/CodeForces | Contamination-free, time-sliced | pass rate + auxiliary tasks |
| Aider polyglot | 225 | 6 languages | Exercism | Multi-language editing | pass rate 1 / 2 |

## Limitations, reproducibility, contamination, real-world validity

- **INFERENCE** — SWE-bench's test-passing oracle conflates "patch passes existing tests" with "correctly resolves the issue." This is a known validity gap in the literature (tests may be weak, overly permissive, or incomplete), though no single critique paper was isolated in this session's title-based arXiv searches — so this inference leans on the benchmark's own Verified filtering rationale (incorrect test patches were common enough to require human review). Confidence: **Medium**.
- **EVIDENCE** — SWE-bench Verified exists precisely because the raw benchmark contained unclear problem statements and incorrect test patches — 500 of 2,294 were retained after human review. This directly evidences a reproducibility/correctness limitation in the unfiltered set. [evidence.md#4]
- **FACT** — SWE-bench Lite's filtering removes whole classes of real tasks (multi-file edits, file creation/deletion, error-message assertions) to improve tractability — explicitly trading real-world validity for evaluation convenience. [evidence.md#3]
- **FACT** — SWE-bench Multimodal V2 removed flaky/ungradeable tests from V1 (517 → 480), evidencing reproducibility issues in earlier releases. [evidence.md#6]
- **INFERENCE** — Contamination is a structural risk for any static GitHub-derived benchmark: issues and PRs predate most model cutoffs. Verified's human filtering does not address train-test leakage; only rolling benchmarks (LiveCodeBench) structurally mitigate it by harvesting problems after cutoff dates. Confidence: **High** (design logic + LiveCodeBench's stated motivation). [evidence.md#10, #11]
- **HYPOTHESIS** — Leaderboard scores may be inflated by harness effects (prompt/scaffold/tooling). The Verified leaderboard's move to a unified mini-SWE-agent environment is an attempt to control for this, implying prior score comparisons conflated model and scaffolding. Needs validation by re-running same models across harnesses. [evidence.md#2]
- **EVIDENCE** — Language coverage is narrow: core SWE-bench is Python-only (12 repos); only the Java port extends it, and the front page now advertises "42 repositories across 9 programming languages" (observed on swebench.com but not verified against a paper/dataset card in this session). Claims of broader language coverage should be treated as provisional until dataset release is confirmed.
- **INFERENCE** — Benchmark tasks underweight dimensions that matter in practice: iterative refinement, human-in-the-loop, long-horizon planning, cost, and regression risk — none are captured by a single pass/fail per issue. Confidence: **High** (absence of these metrics across all surveyed benchmarks).

## Metrics investigated — gap analysis

| Metric asked in task | Covered by SWE-bench family? | Covered elsewhere? | Gap for LACE |
|----------------------|------------------------------|--------------------|--------------|
| Task success (tests passing) | Yes — primary metric | Yes — all benchmarks | Baseline; insufficient alone |
| Regression rate (existing tests break) | Partially — failing tests = score 0, but no per-test regression attribution | No reliable evidence found for a benchmark that reports regression delta separately | Gap — see recommendation |
| Human intervention (escalation / hints) | No | No reliable evidence found | Gap |
| Time-to-completion (wall-clock) | No | No reliable evidence found | Gap |
| Token / API cost | No (leaderboard ignores cost) | Aider leaderboards surface cost-adjacent signals | Gap |
| Recovery success (self-repair after failure) | No | LiveCodeBench explicitly tests self-repair [evidence.md#10] | Partially covered; adopt for LACE |
| Context usage (tokens / window) | No | No reliable evidence found | Gap |
| Reliability across repeated runs (variance / flakiness) | No — single-shot reported; V2 acknowledges flaky tests | LiveCodeBench notes holistic evaluation but not run-variance reporting | Gap |

## What would actually matter for LACE (provisional — see report.md for rationale)

- **FACT** — None of the surveyed SWE-bench leaderboards report cost, latency, context usage, human-intervention rate, or cross-run reliability alongside pass rate (directly observed on swebench.com pages; no such columns present). [evidence.md#2]
- **INFERENCE** — For LACE (a harness, not a model), the decision-relevant metrics are Pareto trade-offs: pass rate vs. cost, vs. time, vs. reliability — a cheap 40% solver may beat an expensive 45% solver in practice. Confidence: **High**.
- **OPINION** — Users on forums/HN often complain that SWE-bench scores don't predict day-to-day usefulness because benchmarks ignore partial progress and recovery. This finding leans on general community sentiment; no systematic survey was conducted in this session and specific threads were not captured — treat as anecdotal OPINION, not measured fact.

## Confidence summary

- Benchmark definitions & variant structure: **High** (primary papers + official pages with verbatim quotes).
- Contamination as structural risk + rolling benchmarks as mitigation: **High**.
- Specific limitation claims (weak tests, harness effects): **Medium** (inferred from Verified/Lite/Multimodal churn and leaderboard design choices; direct critique paper not isolated this session).
- LACE metric recommendations: **Medium** (well-motivated by gaps but not yet validated against LACE workloads).
