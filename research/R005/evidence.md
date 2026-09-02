# R005 — Evidence

> How coding agents are evaluated; metrics for LACE.
> Access dates: 2026-09-02. Quotes are verbatim excerpts from sources.

## Source Table

| # | Source | Type | URL | Accessed | Relevance | Key Quote / Data |
|---|--------|------|-----|----------|-----------|-------------------|
| 1 | Jimenez et al., SWE-bench (ICLR 2024) — arXiv:2310.06770 | Primary paper | https://arxiv.org/abs/2310.06770 | 2026-09-02 | Foundational benchmark definition; scale, method, metric | "an evaluation framework consisting of 2,294 software engineering problems drawn from real GitHub issues and corresponding pull requests across 12 popular Python repositories" |
| 2 | SWE-bench official site — leaderboards & docs | Official spec/site | https://www.swebench.com | 2026-09-02 | Canonical leaderboard, variant definitions | Default Verified leaderboard uses "every model in the same mini-SWE-agent environment"; cards for Verified / Lite / Multimodal / ProgramBench |
| 3 | SWE-bench Lite — official page | Official spec | https://www.swebench.com/lite.html | 2026-09-02 | Lite construction & rationale | "SWE-bench Lite provides a smaller, carefully selected subset of 300 tasks… While the full SWE-bench test split comprises 2,294 issue-commit pairs across 12 Python repositories, SWE-bench Lite covers 11 of the original 12 repositories… 23 development instances… Removed instances with images, external hyperlinks, references to specific commit SHAs… fewer than 40 words… edit more than 1 file… gold patch has more than 3 edit hunks… create or remove files… tests with error message checks" |
| 4 | SWE-bench Verified — official page | Official spec | https://www.swebench.com/verified.html | 2026-09-02 | Human-validated subset | "A human-validated subset of 500 SWE-bench instances… Human annotators reviewed each instance to ensure the problem descriptions are clear, the test patches are correct, and the tasks are solvable given the available information… created in collaboration with OpenAI" |
| 5 | OpenAI — Introducing SWE-bench Verified | First-party blog | https://openai.com/index/introducing-swe-bench-verified/ | 2026-09-02 | Verified methodology, annotator process | Human filtering for solvability & test correctness; blog post is the primary cite linked from swebench.com/verified.html (page content truncated by scraper — quote via secondary, primary not fully verified) |
| 6 | SWE-bench Multimodal — official page | Official spec | https://www.swebench.com/multimodal.html | 2026-09-02 | Visual/software benchmark extension | "The original SWE-bench Multimodal release augmented the benchmark with 517 issues containing visual elements… V2 retains 480 tasks selected for reproducible evaluation, with known flaky or ungradeable tests removed" |
| 7 | SWE-bench GitHub org & repo | Official repo | https://github.com/SWE-bench/SWE-bench | 2026-09-02 | Code, dataset, evaluation harness | Repo description: "SWE-bench: Can Language Models Resolve Real-world Github Issues?" — evaluation via repository snapshot + test harness |
| 8 | Tao et al., SWE-bench-Java — arXiv:2408.14354 | Primary paper | https://arxiv.org/abs/2408.14354 | 2026-09-02 | Language extension evidence | "SWE-bench has been released to evaluate issue resolving capabilities of LLMs, but has so far only focused on Python… we have developed a Java [version]… Docker-based evaluation environment and leaderboard… test several powerful LLMs [with] SWE-agent" |
| 9 | Chen et al., Evaluating LLMs Trained on Code (HumanEval) — arXiv:2107.03374 | Primary paper | https://arxiv.org/abs/2107.03374 | 2026-09-02 | Pre-agentic code benchmark baseline | HumanEval: 164 hand-written Python problems; pass@k metric; foundational for later agentic benchmarks |
| 10 | Jain et al., LiveCodeBench — arXiv:2403.07974 | Primary paper | https://arxiv.org/abs/2403.07974 | 2026-09-02 | Contamination-free design, broader capabilities | "LiveCodeBench, a comprehensive and contamination-free evaluation of LLMs for code, which continuously collects new problems over time from contests across three competition platforms, namely LeetCode, AtCoder, and CodeForces. Notably, our benchmark also focuses on a broader range of code related capabilities, such as self-repair, code execution, and test output prediction, beyond just code generation. Currently, LiveCodeBench hosts four hundred high-quality coding problems that were published between May 2023 and May 2024." |
| 11 | LiveCodeBench — official site | Official site | https://livecodebench.github.io/ | 2026-09-02 | Contamination-free methodology | "LiveCodeBench is a holistic and contamination-free evaluation benchmark of LLMs for code that continuously collects new problems over time… collects problems from periodic contests" |
| 12 | LiveCodeBench GitHub | Official repo | https://github.com/LiveCodeBench/LiveCodeBench | 2026-09-02 | Repo metadata | Stars ~936 as of 2026-08-31; description: "Official repository for the paper LiveCodeBench: Holistic and Contamination Free Evaluation of Large Language Models for Code" |
| 13 | SWE-agent — arXiv:2405.15793 (Yang et al.) | Primary paper | https://arxiv.org/abs/2405.15793 | 2026-09-02 | Agent-computer interface for SWE-bench | Agent framework commonly used to evaluate on SWE-bench; cited by SWE-bench-Java as "classic method" |
| 14 | Aider — benchmarks & leaderboards | Official docs | https://aider.chat/docs/benchmarks.html and https://aider.chat/docs/leaderboards/ | 2026-09-02 | Alternative evaluation (editing & polyglot) | Benchmarking "based on the Exercism python exercises" (original); "Aider's polyglot benchmark tests LLMs on 225 challenging Exercism coding exercises across C++, Go, Java, JavaScript, Python, and Rust." Leaderboards report pass rate 1 / pass rate 2 |
| 15 | Aider GitHub | Official repo | https://github.com/Aider-AI/aider | 2026-09-02 | Tool popularity proxy | Stars ~48,663 — widely used pair-programming harness whose benchmarks are de facto evaluation |

## Secondary / Contextual Sources (consulted, not primary evidence)

- SWE-bench Verified leaderboard philosophy: unified mini-SWE-agent environment to control for scaffolding differences — via swebench.com verified view tagline (FACT, directly observed on site).
- ProgramBench mention on swebench.com front page: "We released ProgramBench to benchmark whether models can code meaningful software artifacts from scratch." — not separately investigated (noted as out-of-scope gap in open-questions.md).

## Search Notes

- Attempted arXiv lookups for several suspected contamination/reproducibility critique papers (e.g., 2407.02894, 2410.08039) — returned unrelated papers; no reliable SWE-bench critique paper isolated via title search in this session.
- OpenAI SWE-bench Verified blog body was truncated by scraper; verified existence and linkage from swebench.com but did not capture full body text. Marked as "via secondary, primary not fully verified" for any claims beyond the Verified page summary.
- Leaderboard absolute scores were NOT scraped in this session to avoid inventing stale numbers; task requires methodology over snapshot scores.

## Evidence Quality Notes

- High confidence: row 1–4, 6, 9–11 (primary papers + official pages with verbatim quotes captured).
- Medium confidence: row 5 (blog existence verified, body not fully captured), row 8 (abstract only, not full paper).
- All numbered claims above have direct quotes or observed page elements; no extrapolated numbers.
