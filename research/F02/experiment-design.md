# F02 Experiment Design — Single-Agent vs Verification-First Orchestration (Pilot)

**Model:** `muse-spark-1.2-contributor-free` (both arms, same model per synthesis T1) · **Date:** 2026-09-02
**Status:** Pilot (n=5 synthetic tasks) — design first, then execute small pilot (see §9)

## 1. Hypothesis

- **H0:** Verification-first orchestration (spec→tests→gate, worktree isolation, parse→feedback) does **not** improve task success vs same-model single-agent loop by ≥10pp at ≤2× cost/latency with regression no worse.
- **H1:** Verification-first orchestration **does** achieve ≥10pp absolute gain at ≤2× median cost/latency with regression rate ≤ baseline, with sufficient n for 95% CI (synthesis T1, R007).

**Type:** Superiority with cost/latency guardrails. Thresholds are *stopping rules*, not targets — pilot estimates effect size and variance to size a future n≥30 Verified run.

Prior evidence (R003/R005) suggests: prototype gains (+4–19pp on SRDD/HumanEval with SOPs+feedback) but at 3–10× cost/latency and prototype ceiling; no controlled SWE-bench A/B found — so we pre-register that pilot is feasibility + variance estimation, not a claim of superiority.

## 2. Variables

| Variable | Baseline (control) | Candidate (verification-first) | Held constant |
|---|---|---|---|
| Model | muse-spark-1.2-contributor-free | muse-spark-1.2-contributor-free | Identical |
| Temperature | 0.2 (deterministic-ish) | 0.2 | Identical |
| Task spec | verbatim from `pilot/tasks.json` | verbatim | Identical |
| Repo snapshot | `pilot/repo` @ `7b9850d` (buggy) | same snapshot via `git worktree` | Identical |
| Hidden verification suite | `tests_reference.py` (6 tests) | same | Identical |
| Allowed steps | **One shot:** read spec + buggy file → emit patch → run gate once → done. No test-feedback loop. | **Spec→tests→gate:** (1) derive verification tests from spec, (2) emit patch, (3) run gate, (4) parse failure → feedback → retry (max 2 retries), (5) worktree isolation per task | Mechanism under test |
| Cost/latency measurement | wall-clock + approx tokens (chars/4) | same | Identical instrumentation |
| Human intervention | 0 (autonomous) — count if manual fix needed | 0 | Identical |

**Isolation:** Candidate uses `git worktree add ../worktrees/<task>` per task; baseline uses direct checkout (or separate worktree reset) — both start from identical commit so file ownership / mutation effects are observable. Worktree is the LACE primitive recommended in R004/R001, not a confounder.

## 3. Tasks (type / n)

**Type:** Synthetic small-repo bug-fix tasks (issue→patch→tests), chosen as a *proxy* for SWE-bench issue-resolution but runnable offline without harness confounding (R005). Five tasks cover distinct failure modes R002 flagged (parsing, interval logic, decorator state, atomicity, sorting/ties):

- T01 `dates.py:parse_date` — ISO8601 with tz/leap/invalid
- T02 `calc.py:merge_intervals` — sorting, touching, mutation
- T03 `retry.py:retry` — off-by-one, exception filtering, metadata
- T04 `bank.py:transfer` — atomicity, error types, self-transfer
- T05 `freq.py:top_k_frequent` — tie-break, validation, determinism

**Why synthetic not SWE-bench Verified directly:** Full SWE-bench requires Docker harness + issue-specific snapshots (R005) and Python 3.14 lacks `pytest`/`docker` tooling here. Synthetic repo gives *reproducible offline pilot* with ground-truth gate (`tests_reference.py` 6 tests) and regression suite. Trade-off: lower external validity — explicitly noted as limitation; future scale run should use Verified Lite (300) or Verified (500) with mini-SWE-agent standardization (§8).

**n:** Pilot n=5 (minimum per task brief: 3–5). For variance we also run 3 repeated trials on T04 (bank atomicity) to estimate pass@3 / reliability — cheapest reliability signal without 5×3=15 full repeats. Full study needs n≥30 for 95% CI on 10pp (power calc §6).

## 4. Harness Description

### Baseline harness (`pilot/harness_baseline.py` — conceptual, executed manually by same model)

```
for task in tasks:
  worktree = fresh_copy(repo@buggy)
  start = time.monotonic()
  prompt = spec + buggy_source
  patch = model(prompt, max_tokens=800)   # single turn, no tools before submit
  apply(patch, worktree)
  result = run("python run_tests.py")     # once
  latency = now - start
  tokens ≈ len(prompt+patch)/4
  record {pass/fail, tests_passing, regression, latency, tokens}
```

**No feedback loop** — even if tests fail, no retry. Mirrors "normal single-agent loop" per F02: agent writes code, runs bash once, reports.

### Candidate harness (`pilot/harness_candidate.py` — verification-first)

```
for task in tasks:
  worktree = git worktree add ../worktrees/<task> repo@buggy   # isolated
  start = time.monotonic()
  # Phase 1: spec → tests
  spec_tests = model("derive tests from spec: " + spec, max_tokens=400)
  write(worktree, "tests_candidate.py", spec_tests)   # not graded, but exercises parse→feedback
  # Phase 2: implement
  patch = model(spec + buggy_source + spec_tests, max_tokens=800)
  apply(patch, worktree)
  # Phase 3: gate + parse→feedback (max 2 retries)
  for attempt in 1..3:
    result = run("python run_tests.py", worktree)   # gate = reference suite
    if result.pass: break
    feedback = parse(result.stderr)  # extract failing test name + assertion
    patch = model("fix given failure: " + feedback, max_tokens=600)
    apply(patch, worktree)
  latency = now - start
  tokens ≈ sum(len(each_prompt+patch)/4)
  record {pass/fail, tests_passing, regression, latency, tokens, retries, recovery_success}
  git worktree remove worktrees/<task>
```

**Key primitives under test:** spec→tests→gate, worktree isolation, parse→feedback. No extra model, no second agent — same model, orchestrated loop.

**Reproducibility steps (§7):** `harness.py` logs prompts, patches, raw test output, token estimate, timing, git SHAs. Re-run is `python harness.py --arm baseline|candidate`.

## 5. Metrics (all per-task, then aggregated)

| Metric | Definition | Instrument |
|---|---|---|
| **Task success** | 1 if `run_tests.py` exits 0 (all reference tests for that task + regression pass) else 0 | gate exit code |
| **Tests passing** | fraction of 6 reference tests passing | runner output parse |
| **Regression rate** | share of previously-passing regression subtests that break (here `test_regression_simple` 3 sub-checks) | diff vs buggy baseline |
| **Cost / tokens** | input+output tokens ≈ chars/4 (approx; note no API billing here) | `len(text)/4` |
| **Latency** | wall-clock seconds from task start to gate final verdict | `time.monotonic()` |
| **Human intervention** | 1 if manual fix required after autonomous retries exhausted | manual log (0 in pilot) |
| **Recovery success** | 1 if task initially failed then passed after retry | attempt log |
| **Repeated-run reliability** | pass@3 / variance on 3 repeats of T04 per arm | 3× run T04 |

All metrics reported per synthesis Pareto scorecard: `% resolved | regression | median cost | median time | reliability | recovery` (R005 §7).

## 6. Sample Size Justification & Analysis Plan

**Pilot n=5:** Not powered for 95% CI on ≥10pp. Purpose is (a) feasibility of harness, (b) variance estimate for sizing, (c) existence proof of overhead.

**Power for future n:** For independent Bernoulli tasks with p≈0.5, detecting 10pp (0.5→0.6) at α=0.05, power 0.8 needs **~300 tasks per arm** (two-proportion z). At p≈0.7 baseline (common for simple tasks), n≈250. If pilot shows σ≈0.3 and effect ≈20pp, n≈40 suffices. Therefore pre-registered scale target is **n≥30 minimum** (synthesis T1), but 30 only powers ~25–30pp effects; true 10pp needs 100+.

We will report pilot effect with **Wilson 95% CI** and state that CI will be wide (e.g., 3/5 vs 5/5 → CI overlaps). No claim of significance from pilot.

**Analysis:**
- Primary: difference in task success (candidate − baseline) in pp, with Wilson CI.
- Guardrails: median cost ratio, median latency ratio ≤2×; regression rate candidate ≤ baseline.
- Secondary: tests-passing fraction, recovery rate, reliability.
- Pre-register: if cost/latency >2× or regression worse, fail T1 even if success higher.

## 7. Reproducibility Steps

1. `cd research/F02/pilot/repo && git log --oneline` → should be `7b9850d` (buggy) as base.
2. `cat tasks.json && cat tests_reference.py && cat run_tests.py` — all committed.
3. `python3 pilot/harness.py --arm baseline` → writes `pilot/results_baseline.json` with per-task logs.
4. `python3 pilot/harness.py --arm candidate` → writes `pilot/results_candidate.json` (uses `git worktree`).
5. `python3 pilot/summarize.py` → prints Pareto table + Wilson CI + cost/latency ratios.
6. All prompts, patches, raw outputs archived in `pilot/logs/<task>/<arm>/`.

No external services; no pytest/docker dependency; pure stdlib.

## 8. Kill / Scale Criteria (pre-registered, per synthesis T1/T4)

- **Kill multi-agent/orchestration as CORE if:** pilot or scaled n≥30 run fails to show ≥10pp gain at ≤2× cost/latency with regression ≤ baseline (T1). Pilot alone does not kill — but if pilot shows even *negative* or zero gain with >2× cost, we flag as " unlikely to meet T1 at scale — do not scale without redesign."
- **Scale if:** pilot shows ≥10pp or positive trend with cost/latency ≤2× and no regression, and harness is stable → proceed to n=30 on SWE-bench Verified Lite with standardized mini-SWE-agent harness (R005).
- **Wrapper moat (T4):** if orchestration can be replicated as <2-week MCP extension to existing agent (R004), recommend shipping as plugin not standalone.

## 9. Pilot Execution Plan (n=5)

**Practicality:** Synthetic repo is practical; SWE-bench Verified at n=30 is not in this session (requires Docker + pytest + network). We will execute synthetic pilot now (≤30 min wall-clock) and report honest measurements. If harness instability blocks execution, we will document why and what would be needed (Docker + SWE-bench harness + token-accurate billing).

**Execution order (same model, sequential to avoid cross-contamination):**
1. Freeze repo at buggy commit, record SHA.
2. Run baseline arm: for each T01–T05, produce single-shot fix (manual but strictly one attempt, no feedback before gate), apply, gate, log.
3. Reset repo via `git checkout` / worktree remove.
4. Run candidate arm: same tasks, but with spec→tests→gate + up to 2 feedback loops.
5. Re-run T04 ×3 per arm for reliability.
6. Summarize and assess thresholds (§6).

**Threats:** Single-model self-bias (we are both harness and agent); small n; synthetic tasks easier than real repo context (R003 prototype ceiling). Mitigations: keep prompts identical, log everything, label candidate vs baseline explicitly, note that synthetic underestimates real overhead (real repo needs retrieval, larger context).

## 10. Limitations of Pilot

- Synthetic tasks lack repo scale, retrieval, and multi-file edits that R005 Lite explicitly filters — pilot likely *overestimates* success and *underestimates* cost/latency vs real SWE-bench.
- Token estimate chars/4 is coarse (no tiktoken); cost ratio is ordinal, not billed dollars.
- Repeated-run reliability only on one task (T04) — not full variance.
- No human-intervention variance (both autonomous).

## References

- R003 (multi-agent cost 3–10×, SOPs+feedback +4–5pp, SRDD/HumanEval gains, prototype ceiling)
- R005 (SWE-bench 2,294/Lite 300/Verified 500, harness confounding, LiveCodeBench contamination-free, Pareto scorecard)
- Synthesis §6/§10 kill thresholds T1: ≥10pp at ≤2× cost/latency, n≥30, 95% CI
- R004 (git worktree, MCP/ACP, reuse primitives — don't build custom bus)
