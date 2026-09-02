# R005 — Open Questions & Missing Evidence

## Unanswered Questions

1. **What is the true private-holdout performance vs. public leaderboard?** Do SWE-bench scores hold on a truly unseen, post-cutoff holdout? LiveCodeBench suggests contamination matters, but no SWE-bench-specific contamination audit was captured this session. Need: canary-string test or cutoff-date split re-evaluation.
2. **How inflated are scores by harness vs. model?** Verified's unified mini-SWE-agent environment acknowledges harness confounding — but what is the delta when the *same* model is run across different scaffolds (SWE-agent vs. OpenHands vs. Aider vs. minimal loop)? No head-to-head harness ablation found this session.
3. **What fraction of "passing" patches are actually correct?** Verified filtered incorrect test patches — but how many passing patches are still semantically wrong (weak tests)? Requires human re-grading of passing patches, not just failing ones.
4. **Do results transfer to non-Python?** SWE-bench-Java exists but its evaluation numbers and correlation with Python SWE-bench were not captured. Swebench.com claims "42 repos / 9 languages" — is there a released multilingual dataset and do Python rankings predict multilingual rankings?
5. **What about visual/UI tasks at scale?** Multimodal V2 (480 tasks) shows vision matters for some issues — but what is the prevalence of visual issues in real user workloads LACE will see?
6. **What metrics predict user-perceived usefulness?** Benchmarks report % resolved; surveys suggest users care about partial progress, explanation quality, and recovery. No systematic user study linking benchmark score to satisfaction was reviewed.
7. **What is ProgramBench's relationship to SWE-bench?** The swebench.com front page announces ProgramBench ("benchmark whether models can code meaningful software artifacts from scratch") — scope, tasks, and relationship to LACE not investigated. Deferred as out-of-scope for this task.
8. **Cost-adjusted leaderboards — who builds them first?** Aider surfaces cost, but SWE-bench leaderboards do not. Would a Pareto (pass rate vs. cost vs. time) view reorder model rankings materially for LACE's price-sensitive use?

## Missing Evidence (searched, not found or not verified)

- **No reliable evidence found** for a standardized "regression rate" metric reported by any major coding-agent benchmark (searched SWE-bench pages, LiveCodeBench abstract/site, Aider docs — none report delta-regressions separately from pass/fail). If such a benchmark exists, it was not isolated this session.
- **No reliable evidence found** for standardized "human intervention rate" or "time-to-completion" reported alongside SWE-bench scores (searched same sources; no such columns observed on swebench.com leaderboards).
- **No reliable evidence found** for cross-run reliability (variance / pass@k across repeated trials) reported on SWE-bench leaderboards (observed pages report single-shot scores; LiveCodeBench abstract mentions holistic evaluation but not run-variance stats).
- **No reliable evidence found** for a dedicated, peer-reviewed critique paper quantifying SWE-bench contamination or test-weakness rates (title-probe arXiv searches in-session returned unrelated papers; broader search not performed).
- **No reliable evidence found** for verified multilingual SWE-bench release beyond the Java port abstract (the "42 repos / 9 languages" site claim not backed by a dataset card captured this session).

## Follow-up Ideas (scope-creep, intentionally not chased)

- Re-run 50 Verified tasks across 3 harnesses (mini-SWE-agent vs. Aider vs. raw tool loop) with identical model to quantify harness effect.
- Build a time-sliced holdout: issues created after 2025-06-01 vs. public SWE-bench; compare score deltas per model as a contamination proxy.
- Manual audit of 30 "passing" patches for semantic correctness (human re-grade).
- Instrument LACE harness to emit the recommended scorecard (cost, time, context, recovery, regression) and backfill on existing task runs.
- Evaluate ProgramBench and LiveCodeBench's self-repair / execution-prediction sub-tasks for inclusion in LACE's internal eval.
- Survey: what "partial credit" scheme best predicts human preference (e.g., relevant tests pass rate vs. binary task success)?

## Gaps to Close Before Synthesis

- Verify the OpenAI SWE-bench Verified blog in full (body truncated this session).
- Capture 1–2 credible SWE-bench limitation critiques (e.g., SWE-Bench+ or independent reproducibility studies) via targeted search beyond title probes.
- Confirm whether the multilingual SWE-bench expansion is released or aspirational (check dataset hub, not just marketing copy).
