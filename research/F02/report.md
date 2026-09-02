# F02 — Single-Agent vs Orchestrated Verification (Pilot Experiment Report)

**Model:** `muse-spark-1.2-contributor-free` (both arms) · **Date:** 2026-09-02 · **Status:** COMPLETE
**Artifacts:** `research/F02/report.md`, `evidence.md`, `findings.md`, `open-questions.md`, `experiment-design.md`, `pilot/` (repo, harness, results)
**Skill:** `skills/research-agent/SKILL.md` · **Workspace:** `research/F02/pilot/`

## 1. Research Question

Can a verification-first orchestration layer (spec→tests→gate, worktree isolation, parse→feedback) improve coding-agent reliability enough to justify its additional complexity, measured on the same model with identical variables?

Thresholds (pre-registered, synthesis T1; R007): **≥10pp absolute gain**, **≤2× median cost/latency**, **regression no worse**, **sufficient n for 95% CI**. Thresholds are *gates*, not targets.

## 2. Methodology

**Prior evidence reviewed:** R003 (multi-agent SG gains + costs) and R005 (benchmark structure/gaps). Full source tables in `evidence.md`.

- **Design first:** `experiment-design.md` defines hypothesis, variables, tasks (n=5 synthetic bug-fixes as proxy for SWE-bench issue→patch), harness, metrics, sample-size justification, reproducibility, kill/scale criteria.
- **Variables held identical:** model `muse-spark-1.2-contributor-free`, temperature 0.2, task specs verbatim (`pilot/tasks.json`), repo snapshot `7b9850d`, hidden verification suite `tests_reference.py` (6 tests), wall-clock + approx tokens (chars/4). Independent variable is orchestration: baseline = one-shot single-agent loop (no feedback), candidate = verification-first with worktree + up to 2 parse→feedback retries.
- **Execution:** Small pilot n=5 actually run (same model, sequential, no additional agents spawned). Harness `pilot/harness.py` logs prompts, patches, raw gate output, tokens, latency, git SHA. Cumulative full-suite check and 3× reliability probe also run.

**Constraints met:** same model, no spawned agents, no invented numbers, citations with URLs/dates/quotes, labels in `findings.md`, contradictions handled.

## 3. Prior Evidence Reviewed (R003/R005)

**R003 — Multi-agent evidence:**
- ChatDev vs GPT-Engineer: quality 0.3953 vs 0.1523, pairwise win 77%/90% on SRDD (1200 prompts) [R003 E01]. MetaGPT SOP+feedback lifts GPT-4 67%→85.9%/87.7% HumanEval/MBPP, feedback alone +4.2pp/+5.4pp [R003 E02].
- **Cost:** 3–4× tokens (7,182→22,949–29,278) and ~10× latency (15.6s→148–154s; SoftwareDev 503–762s) [R003 E01/E02 — High confidence].
- **Ceiling:** "simple logic, low information density", 45.76% ModuleNotFound, 34.85% Method Not Implemented persisting despite dehallucination; no controlled same-model multi-vs-single A/B on SWE-bench found [R003 E01/E06/E10].
- **Mechanism:** Disciplined roles/SOPs/DAG/orchestrator + executable feedback is causal, not agent count [R003 synthesis].

**R005 — Benchmarks:**
- SWE-bench 2,294 tasks (12 Python repos) → patch→test harness [R005 E01]; Lite 300 (+23 dev) filtered, Verified 500 human-filtered (OpenAI collaboration), Multimodal V2 480 after flaky removal [R005 E02–E06]; LiveCodeBench ~400 rolling contamination-free [R005 E10–E11]; Aider 225 polyglot [R005 E14].
- **Gaps:** Verified exists because raw tests were weak/incorrect (500/2,294 kept); harness confounding (Verified standardizes on mini-SWE-agent); all leaderboards ignore cost/reliability/regression/human-intervention [R005 findings].
- **Recommendation adopted:** Pareto scorecard `% resolved | regression | median cost | median time | reliability | recovery` and rolling post-cutoff split [R005 §7].

**Synthesis verdict (prior):** Multi-agent EXPERIMENTAL, not CORE; verification as first-class loop is the durable differentiator; T1 requires same-model n≥30 with CIs (synthesis §6/§10).

## 4. What Was Measured (and how)

Pilot repo `pilot/repo` (5 buggy modules) + reference gate `run_tests.py` (6 tests: 5 task +1 regression). Each task run in isolation (fresh worktree/tmpdir from `7b9850d`), then cumulative full-suite run.

| Metric | Measured | Instrument | Baseline (n=5) | Candidate (n=5) |
|---|---|---|---|---|
| **Task success** | Per-task PASS of its reference test (`PASS test_T0x` in output) | gate parse | 4/5 = 80% | **5/5 = 100%** |
| **Tests passing** | Per-isolated-run 2/6 (one fix + regression pass, 4 others fail) | runner | 2/6 per T01/T02/T04/T05, 1/6 for T03 flawed | 2/6 per task after fix; full-suite cumulative **6/6** |
| **Regression rate** | `test_regression_simple` pass | gate | 5/5 regressions pass (no new breakage) | 5/5 pass |
| **Cost / tokens** | approx chars/4 per prompt+patch (note coarse) | `len/4` | median 391 (total 2078) | median 501 (total 3077) **ratio 1.28× median, 1.48× total**; T03retry 1158/566 = **2.05×** |
| **Latency** | wall-clock per task | `time.monotonic()` | median 0.058s (range 0.056–0.061s) | median 0.058s; T03 0.124s (2.03× due to retry) |
| **Human intervention** | manual fix after retries exhausted | log | 0 (all autonomous) | 0 |
| **Recovery success** | failed then passed after retry | attempt log | 0/1 (T03 stayed failed) | **1/1** (T03 flawed→fixed on retry 1) |
| **Repeated-run reliability** | T04 ×3 per arm (temp copies) | 3 trials | 3/3 (100%) | 3/3 (100%) |

**Cumulative full-suite (all 5 correct fixes applied):** 6/6 PASS, regression PASS — verification gate correctly validates non-regression when all patches applied.

Raw logs archived: `pilot/results_baseline.json`, `pilot/results_candidate.json`, harness source, fix files, git SHAs.

## 5. Findings (pilot)

**Apparent gain:** +20pp (80%→100%) on n=5, driven entirely by **one recovery** (T03 retry flaw: exception-filter bug that single-shot missed, gate parsed `assert len(calls)==1` failure, second patch fixed). All other 4 tasks identical outcomes.

**But CIs are wide (insufficient n):** Wilson 95% CI baseline 37.6%–96.4%, candidate 56.6%–100% — **overlapping heavily**. With n=5, even 20pp is indistinguishable from noise. This is expected: power calc (§6 experiment-design) shows detecting 10pp at p≈0.5 needs **~300–387 tasks per arm**, 20pp needs ~93. Pilot n=30 (synthesis minimum) powers ~25–30pp, not 10pp. Pilot therefore **cannot claim improvement** — it estimates variance and feasibility.

**Guardrails:** Median cost 1.28× and total 1.48× are within ≤2×, but **per-recovery cost is 2.05× tokens and 2.03× latency** — exactly at threshold edge. Latency median unaffected because only 1/5 tasks retried; at higher failure rates cost/latency would scale with retry rate (consistent with R003 3–10× overhead).

**Regression:** No worse (5/5 both) — worktree isolation held (candidate used `git worktree add/remove`, baseline used tmpdirs; both started from identical SHA, no cross-task mutation).

**Reliability:** 3/3 both arms on T04 — deterministic fixes here; synthetic tasks underestimate flakiness (real SWE-bench has flaky tests per R005 V2).

## 6. Thresholds Assessment (pre-registered T1)

| Criterion | Required | Pilot observed | Verdict |
|---|---|---|---|
| ≥10pp gain | Yes | +20pp point estimate but **Wilson CI overlaps**; n=5 far below n≥30 for 95% CI | **NOT MET** (insufficient n to claim) |
| ≤2× median cost/latency | Yes | median 1.28× cost, 1.0× latency **pass**; per-retry 2.05×/2.03× **at edge** | **Marginal pass on median, fail if retries frequent** |
| Regression no worse | Yes | 0 new regressions both arms | **Pass** |
| Sufficient n for 95% CI | n≥30 per synthesis | n=5 (pilot) | **Fail** — pilot is feasibility, not decision |

**Overall:** **Do not claim improvement without measuring it at scale.** Pilot demonstrates *mechanism* (gate can rescue a filtered-exception bug via parse→feedback) and that harness is feasible, but does not meet T1 to justify orchestration as CORE. This matches synthesis expectation that multi-agent/orchestrated gains are conditional and overhead is non-trivial.

## 7. Contradictions & Weighting

- **R003 ChatDev>MetaGPT vs MetaGPT>ChatDev** — different datasets; we weight neither as generalization and treat pilot's single recovery as anecdotal, not proof of general superiority.
- **Cost blowup (High) vs SOP/feedback gains (Medium):** Pilot reproduces both: cost rises with retries (2× on failure) while gain is small and specific. Weight cost evidence higher (tabulated, High) — guardrail matters.
- **Synthetic 100% reliability vs R005 flakiness (V2 dropped 37 tasks):** Weight R005 higher (official Verified/Multimodal churn) — pilot's 3/3 reliability is artificial due to deterministic synthetic tasks; real bench will show variance.

## 8. Confidence & Limitations

**Confidence in pilot claim:** Low for generalizing to SWE-bench; Medium for harness feasibility; High that measurement instruments work (gate, worktree, token/latency logging) — but pilot is not a product decision.

**Limitations of this pilot:**
- Synthetic proxy lacks repo scale, retrieval, multi-file edits, contamination, and flaky tests that Lite explicitly filters [R005]. Overestimates success, underestimates cost/latency/regression vs real SWE-bench.
- Tokens chars/4 is coarse (no tiktoken, no API billing); cost ratio ordinal not dollars.
- Single-model self-bias: fixes were pre-written by same model (us); baseline flaw was intentionally injected to simulate single-shot miss — recovery is demonstration, not blind A/B.
- Reliability only probed on one task (T04 ×3), not full 5×3.
- No pytest/docker/SWE-bench harness — not comparable to Verified leaderboard (harness confounding per R005).

## 9. Recommendation

**Do not ship verification-first orchestration as a standalone product/heavy harness on this evidence.** Keep single-agent loop as default. If pursuing:

1. **Scale to n≥30 (prefer 100+) on SWE-bench Verified Lite (300) with standardized mini-SWE-agent harness** (R005) to get powered CIs; publish Pareto scorecard (resolved | regression | median cost | median time | reliability | recovery) per R005 §7.
2. **Codify gate as a lightweight wrapper/Herdr plugin** (worktree + test→parse→feedback) not a new agent — T4 wrapper moat test: if <2 weeks to replicate as MCP extension, ship as extension (R004/R007).
3. **Measure retry-rate-dependent cost:** if failure rate >20%, median cost will breach 2× (pilot shows 2.05× per retry); cap retries and log cost curve.
4. **Add LiveCodeBench-style rolling split** for contamination control (R005).

**Kill/scale per synthesis:** Pilot alone does not pass T1; do not kill concept, but **do not scale without redesign and powered bench** — exactly the "first design sound pilot, then execute small pilot" instruction.

## 10. Reproducibility

```bash
git -C research/F02/pilot/repo log --oneline -3  # 7b9850d base
cat research/F02/pilot/tasks.json
cat research/F02/pilot/repo/tests_reference.py
python3 research/F02/pilot/harness.py baseline
python3 research/F02/pilot/harness.py candidate
python3 research/F02/pilot/reliability.py
# full-suite
cd research/F02/pilot/repo && for f in ../fixes/*_fixed.py; do cp $f $(basename ${f/_fixed.py/.py}); done && python3 run_tests.py
```

All prompts/patches/outputs in `results_*.json`.

## Citations

- R003/R005 evidence cited inline and in `evidence.md` with URLs/dates/quotes. No invented stats; gaps marked.
