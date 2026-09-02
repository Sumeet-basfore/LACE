# F02 — Open Questions & Gaps

## Unanswered by pilot (need follow-up)

1. **What is the true effect size on real repos?** Pilot synthetic n=5 gives +20pp point estimate with overlapping CIs (37.6–96.4% vs 56.6–100%). What is the effect on SWE-bench Verified Lite (300) or Verified (500) with same-model (muse-spark-1.2-contributor-free) standardized on mini-SWE-agent harness [R005 E05]? Power calc says n≈387/arm for 10pp at p=0.5 — will we see ≥10pp at ≤2× cost?

2. **Cost/latency curve vs retry rate:** Pilot median 1.28×, per-retry 2.05× tokens/2.03× latency. If failure rate is 40–60% (real SWE-bench), does median breach 2×? What max retries policy keeps Pareto? Need retry-budget sweep (0,1,2,3 retries) on n≥30.

3. **Regression rate at scale:** Pilot synthetic regression 0/5. R005 notes Verified exists because raw tests were weak (500/2,294) and Multimodal V2 dropped 37 flaky tasks. Does gate *reduce* regression on edits that touch multiple files/hunks (Lite explicitly excludes >3 hunks, multi-file)?

4. **Spec→tests quality:** Candidate's Phase 1 (spec-derived tests) was stubbed in pilot ("# tests for T..."). In practice, LLM-generated tests may be wrong/weak (R005). Does spec→tests→gate improve over direct patch→gate if generated tests are noisy? Needs ablation: gate with LLM-tests vs human reference tests.

5. **Worktree vs tmpdir isolation benefit:** Candidate used `git worktree add/remove`, baseline tmpdir — both isolated. Pilot showed zero difference in regression (both clean). Would worktree matter on large repos with git-index state / parallel edits / file-ownership locking (R003 gap on file-sharded workers)? Not measured.

6. **Human-intervention rate:** Both arms 0 in pilot (autonomous). Real agents need hints/escalations (R002 context loss, R005 metric gap). Does gate reduce intervention rate (recovery without human)? Pilot recovery 1/1 suggests yes, but n=1 anecdotal.

7. **Reliability (pass@3) at temp>0:** Pilot T04 3/3 deterministic (temp 0.2). What is variance at temp 0.7–1.0 across 3 runs per task on real bench? (R005 recommends N≥3 repeats).

8. **T4 wrapper moat:** Can lesson's orchestration (spec→tests→gate + worktree + parse→feedback) be replicated as <2-week MCP extension to Claude Code/OpenCode via existing hooks (R004), vs standalone LACE runtime? No replication spike done — need time-boxed spike.

## Missing evidence (reported as "No reliable evidence found" per skill)

- **No SWE-bench controlled same-model A/B at scale** retrieved in R003/R005 (gap E10). Pilot fills n=5 synthetic, not a substitute.
- **No token-accurate billing** — pilot used chars/4 approx; real API cost (input vs output pricing, cache hits) not measured. Need provider billing log.
- **No contamination analysis** — pilot tasks are novel synthetic, not post-cutoff LiveCodeBench-style [R005 E09]. For real bench need rolling split after model cutoff.
- **No pricing/effort for local vs cloud** — out of scope for F02 but affects hybrid verifiability (R006).

## Follow-up ideas (not scoped for this task)

- **F02b scale run:** Provision Docker harness, run 30–100 Verified Lite tasks per arm with same model, log Pareto scorecard, report with 95% CIs and cost/latency distribution. Time estimate: 2–3 days API + $$$ cost. Pre-register retry cap 2, temperature 0.2 and 0.7 variants.
- **Ablation:** Candidate vs baseline vs "patch→gate without spec→tests" (to isolate spec→tests value).
- **Harness confounding control:** Fix harness prompt/tools identical (e.g., mini-SWE-agent style) and report harness as part of result per R005 §5.4.
- **HerdrDelta tie-in (F03):** If Herdr pane persistence matters, re-run candidate inside Herdr vs tmux+worktree to measure time-to-green / manual recovery delta (T2 threshold: >30% or >50% fewer interventions).

## Artifacts that would be needed to close gaps

- `research/raw/F02/swebench_lite_logs/` — per-task JSONL with prompt, patch, test output, tokens, latency, SHA, model version (for audit).
- Independent reproduction by second worker (different machine) running same `harness.py --arm both` on same SHA to confirm median ratios.
