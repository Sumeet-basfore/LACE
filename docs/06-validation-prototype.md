# Validation Prototype — Verification-First Experiment

**Date:** 2026-09-02 · **Phase:** 2A (validation prototype & experiment protocol) · **Status:** SPEC · **Model for agents:** `muse-spark-1.2-contributor-free`
**Basis:** `docs/05-product-thesis.md` (PIVOT — verification-first extension hypothesis) · `research/F02/experiment-design.md` + `research/F02/pilot/` (n=5 pilot) · `research/reports/02-validation-synthesis.md` (12 questions)
**Ledger:** `research/ledger.md` (11 tasks COMPLETE: R001–R007 + F01–F04) · **Experiment dir:** `research/experiment/`

This spec defines the smallest possible experimental verification system capable of testing the current product hypothesis before any final product, architecture, or TDD is committed.

---

## 1. Purpose

Establish, with a **reproducible, controlled pilot**, whether deterministic verification + structured feedback + bounded recovery produces a meaningful, cost-bounded improvement over an otherwise identical single-agent workflow — and whether the measurement pipeline itself is sound enough to justify scaling to SWE-bench Verified/Lite at n≥30.

- The pilot is **not** proof of product value — it verifies: harness works, isolation holds, gate is deterministic, baseline and candidate are comparable, metrics are correctly collected, logs are reproducible, task/regression separation works, and cost/latency/reliability instrumentation is honest.
- If pipeline is invalid, **fix methodology before scaling** to n≥30 / n≥100 (research target).

---

## 2. Hypothesis

**H0 (null):** Verification-first orchestration (spec→diagnostic probe→tests→gate, worktree isolation, deterministic parse→feedback, bounded retry ≤2, regression gate) does **not** improve task success over the same-model single-agent loop by ≥10pp absolute at ≤2× median cost/latency with regression no worse, with sufficient n for 95% CI.

**H1 (alternative):** It **does** achieve ≥10pp absolute gain at ≤2× median cost/latency with regression ≤ baseline, with sufficient n for 95% CI.

*Type:* superiority with cost/latency guardrails and regression non-inferiority. Thresholds are **pre-registered stopping rules**, not targets to hit. Prior synthesis expects: prototype gains +4–19pp on SRDD/HumanEval via SOPs+feedback but at 3–10× cost, prototype ceiling, no controlled SWE-bench A/B [R003, 01-research]. F02 pilot (+20pp point estimate at n=5, Wilson CIs overlapping 37.6–96.4% vs 56.6–100%, per-retry 2.05× at edge) is **feasibility, not claim** — this spec preserves its pre-registration and sizes the real test.

---

## 3. Baseline

**Precisely:** same model + same temperature + same repo state + same task spec + same tool allowance, executed as **one-shot normal single-agent coding workflow**:

```
for task in tasks:
  workdir = isolated copy of repo@base_sha (tmpdir, no worktree; no prior feedback)
  start = monotonic()
  prompt = verbatim spec + buggy file source (no gate output, no prior failure)
  patch = model(prompt, max_tokens=800, tools=[Read,Edit,Bash] if real)  # single turn
  apply(patch, workdir)
  result = run("python run_tests.py")  # deterministic gate, once, no retry
  task_pass = "PASS <task_test>" in output
  regression_pass = "PASS test_regression_simple" in output
  latency = now - start
  tokens/cost = native usage if available else recorded as proxy with bias stated
  record {task_pass, regression_pass, tokens, latency, retries=0, recovery=false}
```

*No test-feedback loop* — even if tests fail, baseline does not retry. This mirrors "normal single-agent execution with Bash" per competitive landscape (Claude Code/Codex/Aider all do bash once). Mirrors `research/F02/pilot/harness.py` baseline arm (pre-written fixes; T03 flawed to simulate single-shot miss).

---

## 4. Candidate (Verification-First Loop)

**Precisely:** same model + same temperature + same repo state + same spec + same tool allowance, but **verification-first loop with bounded recovery and worktree isolation** (max 2 retries → up to 3 attempts):

```
for task in tasks:
  workdir = git worktree add ../worktrees/<run_id>/<task> repo@base_sha  # per-task isolation
  start = monotonic()
  # Phase 0 optional diagnostic probe (1 lightweight Read/Grep to verify harness issue exists) — logged, not graded
  # Phase 1: spec→execution (same as baseline prompt, plus optional spec_tests artifact not graded)
  patch_initial = model(SPEC + buggy_source, max_tokens=800)
  apply(patch_initial, workdir)
  total_tokens = tokens(patch_initial)
  # Phase 2: gate → parse → bounded retry
  retries = 0; recovery = False; initial_pass = None
  for attempt in 1..3:
    result = run("python run_tests.py", workdir)  # deterministic runner, exits 1 on any FAIL
    task_pass = "PASS <task_test>" in result.output
    regression_pass = "PASS test_regression_simple" in result.output
    if attempt == 1: initial_pass = task_pass
    if task_pass and regression_pass: break  # success → no further retry
    if attempt == 3: break  # cap 2 retries
    # structured feedback: exact failing test names + assertion excerpt + traceback tail (≤800 chars), deterministic parser
    feedback = parse_failures(result.output)  # deterministic, no LLM judgment whether tests passed
    patch = model("Fix given failure:\n" + feedback + "\nSpec: " + spec, max_tokens=600)
    apply(patch, workdir)
    total_tokens += tokens(patch)
    retries += 1
  if not initial_pass and task_pass: recovery = True
  latency = now - start
  record {task_pass, regression_pass, tokens=total_tokens, latency, retries, recovery}
  git worktree remove --force workdir
```

**Key invariants:** no extra model, no second agent, same tools, same evaluator (`tests_reference.py` hidden suite), same commit SHA. Independent variable is **only** the orchestration (gate + parse + bounded retry + worktree isolation). Candidate reuses `research/F02/pilot/` repo and gate; future scale will reuse same interface on SWE-bench Verified/Lite with mini-SWE-agent harness.

---

## 5. Controlled Variables (held constant)

| Variable | Value / policy | Where enforced |
|---|---|---|
| **Model** | `muse-spark-1.2-contributor-free` both arms (same model per T1) | harness `--model` arg + `metadata.json` |
| **Temperature** | 0.2 (deterministic-ish) | harness prompt + logged |
| **Repository state** | Fixed base commit `@7b9850d` (buggy) in `research/F02/pilot/repo` (synthetic) or Verified/Lite snapshot at scale; no uncommitted changes before task start | `git rev-parse HEAD` logged per run |
| **Task** | Verbatim spec per task (`tasks.json` + per-task `spec` string); same set for both arms within a run | `metadata.json` + task file hash |
| **Tool availability** | Same allowed tools (Read, Edit, Bash for gate) — no extra tool for candidate except gate parser (deterministic, not LLM) | harness allow-list |
| **Starting conditions** | Fresh isolated workdir from base SHA (worktree or tmpdir copy); no prior failure, no ledger state, no cache between tasks | reset procedure (see protocol) |
| **Evaluator** | Same hidden `tests_reference.py` (6 tests: 5 task + 1 regression) or Verified reference tests — runner `run_tests.py` exit code is ground truth; LLM never asked whether tests passed | deterministic runner |
| **Timeout policy** | Per-task gate timeout (synthetic: 30s; Verified: 120s per runner) + per-attempt model call timeout — identical both arms | protocol |
| **Retry policy** | Baseline: 0 retries. Candidate: **max 2 retries** (3 attempts total) — pre-registered, do not change after observing results | candidate loop |
| **Cost/latency instrumentation** | Same wall-clock (`time.monotonic`) + same token accounting (native `usage` if available, else proxy with bias stated) | metrics spec |

---

## 6. Independent Variables (what differs)

**Exactly one independent variable bundle — the verification orchestration:**

- **Baseline = 0:** worktree vs tmpdir is *not* independent — it is isolation mechanism; baseline uses tmpdir copy to avoid worktree churn but achieves same starting-state guarantee, so not counted as difference. The differing bundle is: **deterministic gate + deterministic parse of failure (no LLM judgment) → structured feedback excerpt → bounded retry (cap 2) → regression gate check**, plus worktree isolation as the LACE primitive for task separation (R004/R001 recommendation). No extra model, no multi-agent, no embeddings, no custom protocol.

All other variables above are controlled.

---

## 7. Metrics

At minimum (Pareto scorecard per R005 §7 + 02 §4): **All are collected per task, then aggregated with CIs; regression is kept separate.**

| # | Metric | Why it matters |
|---|---|---|
| M1 | **Task success** — per-task PASS of its reference test | Primary outcome |
| M2 | **Test success** — fraction of reference tests passing (e.g., 1/6 per isolated run) | Secondary granularity |
| M3 | **Regression rate** — share of regression subtests that break (candidate must not be worse than baseline) | Guardrail — cannot hide regressions in task success |
| M4 | **Median token usage** | Cost proxy — median across tasks per arm, per-task proxy plus total |
| M5 | **Median cost** — dollars if billing available | Guardrail — ≤2× median vs baseline |
| M6 | **Median latency** — wall seconds start→gate final verdict | Guardrail — ≤2× median |
| M7 | **Recovery rate** — share of tasks initially failed then passed after retry (recovered & task_pass) / n | Mechanism check — did loop rescue anything? |
| M8 | **Human intervention** — manual fix required after retries exhausted (0/1 per task) | Autonomy check — must stay 0 in pilot |
| M9 | **Repeated-run reliability / pass@3** — per-task variance over 3 repeats (at least T04) | Flakiness — synthetic deterministic underestimates real SWE-bench flakiness (37 tasks dropped in multimodal for flaky) |

---

## 8. Primary Metric

**Primary outcome is absolute task-success improvement in percentage points (candidate % − baseline %), with 95% Wilson CI on proportions.**

Candidate for primary is that absolute pp gain — and **it remains the correct primary** because product thesis is reliability (does the harness make tasks *actually pass*). We report it as pp difference (not relative %) with CIs, because pp maps directly to the pre-registered **≥10pp** gate (T1) and is interpretable on the synthetic 5-task and later on Verified 500/300.

**However,** primary alone is insufficient to decide product — the pre-registered decision requires **joint** gating with M3–M6 guardrails (regression non-inferiority + cost/latency ≤2×). A large pp win with regression or cost violation is a **FAIL** by definition (see §10). Alternative "tests passing fraction" is secondary — it adds granularity but can hide task-specific pass/fail; cost alone is not value.

**Decision rule:** primary pp Δ is necessary but not sufficient; guardrails are conjunctive.

---

## 9. Secondary Metrics

| Metric | Role in decision |
|---|---|
| **Test success (M2)** | Secondary — share of 6 tests passing per run (baseline isolated runs 2/6 for 4/5 tasks, 1/6 for T03 flawed). Reports granularity but not task-level correctness. |
| **Regression rate (M3)** | **Guardrail** — candidate ≤ baseline; if worse, fail T1 even if M1 wins. Measured by `test_regression_simple` sub-checks (3 in synthetic; full regression suite at scale). |
| **Median token usage (M4)** | Cost proxy — median across tasks; pilot used chars/4 proxy; 2A prefers native `usage` (see metrics spec). Ratio vs baseline. |
| **Median cost (M5)** | Guardrail ≤2× median vs baseline — ** dollars only if billing available**; else `null` with bias stated (see metrics spec: do not fabricate price). |
| **Median latency (M6)** | Guardrail ≤2× median; same instrument both arms. |
| **Recovery rate (M7)** | Mechanism — candidate only; T03 1/1 in F02 pilot demonstrates gate can rescue filtered-exception bug. |
| **Human intervention (M8)** | Must be 0/0 both arms in pilot — non-zero triggers methodology fix. |
| **Reliability / pass@3 (M9)** | Variance — pass@3 on at least T04 (bank atomicity) per F02; synthetic 3/3 deterministic underestimates real flakiness — future Verified needs full 30×3. |

All secondary are reported with CIs where meaningful (Wilson for proportions, median + IQR for skewed cost/latency).

---

## 10. Success Threshold

**Preserved pre-registered threshold (01 §10 + 02 §12 T1 — do not manipulate after observing results):**

- **≥10 pp absolute gain** (candidate − baseline) on task success, with **95% Wilson CI not overlapping** (or Wilson difference CI excludes 0 at 10pp margin) — evaluated at n≥30 (prefer ≥100). For p≈0.5, 10pp needs ~300/arm; n=30 only powers ~25–30pp [F02 §6 power].
- **≤2× median cost** (tokens→$ when billed; else tokens median ratio) — **median** guardrail (per-task). Pilot per-retry 2.05× already at edge — failure rate drives median, so guardrail is retry-rate dependent.
- **≤2× median latency** — same guardrail, same instrument.
- **Regression rate no worse than baseline** — candidate regression pass share ≥ baseline (non-inferiority); if worse, **FAIL T1 even if pp gain ≥10**.

Pilot n=5 is **not powered** to claim success — Wilson CIs will overlap (F02: 37.6–96.4% vs 56.6–100%). Pilot purpose is to **verify pipeline** and estimate variance/sizing, not to declare product win. Threshold is applied at scale (n≥30 Verified Lite/500 with mini-SWE-agent harness + rolling post-cutoff split).

---

## 11. Kill Condition

**When verification-first approach should be abandoned (pre-registered, from 02 §12 + product thesis):**

- **Kill orchestration as CORE** (keep single-agent default, community plugin only) if candidate fails to show ≥10pp at ≤2× median cost/latency with regression ≤ baseline on Verified n≥30 (prefer 100) with 95% CI. Pilot alone does not kill — but if pilot shows even zero/negative pp with >2× cost (pilot did not — +20pp point but overlapping), flag as *unlikely to meet T1 at scale — do not scale without redesign*.
- **At n≥100 Verified failure → permanent KILL** on verification as CORE.
- **Also abandon if:** guardrail violation dominates (median cost/latency >2× even after capping retries at 2), or regression worse (candidate introduces regressions baseline does not), or reliability collapses (pass@3 variance wide) — piloted as methodology problem, fixed before scaling.
- **Note:** T2–T4 gates remain independent: Herdr as CORE requires n≥20 HerdrDelta >30% or >50%; local-first requires ≥40% pure-local (T3); standalone killed already by F04 (<2 weeks via MCP) — do not conflate verification kill with whole-product kill (reusable assets preserved).

---

## 12. Limitations

**Synthetic tasks:** proxy for SWE-bench issue→patch, but lacks repo scale, retrieval, multi-file edits, contamination, and flaky tests that Lite explicitly filters [R005, F02 §10] — pilot *overestimates* success and *underestimates* cost/latency vs real SWE-bench; ground-truth gate is deterministic and known (real SWE-bench has harness confounding and incorrect tests — Verified kept 500/2,294).

**Small samples:** n=5 pilots and n≥30 validation both underpowered for 10pp at p≈0.5 — will report Wilson CIs and power sizing per F02 §6; do not claim significance with inadequate n.

**Benchmark confounding:** Verified vs candidate both use same model `muse-spark-1.2-contributor-free`, but harness choices (which files are patched, file-ownership locks, whether to derive spec_tests) are not fully standardized — keep per R005 recommendation as mini-SWE-agent harness at scale.

**Contamination & leakage:** hidden `tests_reference.py` is known to pilot author but not to baseline prompt (simulates Verified hidden tests); pilot fixes are pre-written by same model (single-model self-bias) — real run needs fresh tasks post-cutoff + LiveCodeBench rolling split [R005].

**Cost billing:** no tiktoken/$ available in synthetic — pilot used chars/4 proxy; 06 Phase 2A will record native `usage` where possible and state bias where proxy is fallback (see metrics spec); never fabricate price.

**Reliability:** only T04 ×3 in pilot — not full 5×3 variance; synthetic deterministic underestimates real flakiness (37 multimodal tasks dropped for flaky).

**Reproducibility vs validity tradeoff:** synthetic gives clean reproducibility (same commit `7b9850d`, no docker/pytest) but sacrifices external validity — that is intentional for pipeline validation before scaling.

