# F02 — Findings (labeled)

## FACT

- **FACT:** Baseline (single-shot, no feedback) achieved 4/5 task-pass (80%) on pilot isolated tasks; candidate (verification-first with worktree + parse→feedback) achieved 5/5 (100%) — point delta +20pp — but with n=5 Wilson 95% CIs overlap (baseline 37.6–96.4%, candidate 56.6–100%). (P04/P05)
- **FACT:** Candidate used `git worktree add/remove` per task for isolation; baseline used temp-dir copies from same SHA `7b9850d`. Both arms started from identical buggy snapshot and specs. (P01/P08)
- **FACT:** Median cost (approx tokens chars/4) baseline 391, candidate 501 → ratio 1.28×; total tokens 2078→3077 ratio 1.48×. Per-retry cost for T03 was 1158/566 = 2.05× tokens and latency 0.124/0.061 = 2.03×. (P04/P05)
- **FACT:** Median latency baseline 0.058s, candidate 0.058s (T03 retry 0.124s). (P04/P05)
- **FACT:** Regression suite `test_regression_simple` passed 5/5 both arms (no new breakage); cumulative full-suite with all 5 correct fixes passes 6/6. (P04–P06)
- **FACT:** Recovery success 0/1 baseline (T03 stayed failed), 1/1 candidate (T03 flawed `except Exception` → corrected `except exceptions` on retry parsing `assert len(calls)==1`). (P05)
- **FACT:** Repeated-run reliability on T04 (bank) 3/3 both arms (deterministic synthetic fixes). (P07)
- **FACT:** R003 prior cost High confidence: multi-agent 3–4× tokens (7,182→22,949–29,278) and ~10× latency (15.6→148–154s) [E01]; feedback alone +4.2pp/+5.4pp HumanEval/MBPP [E02]. (E01/E02)
- **FACT:** SWE-bench family sizes: full 2,294, Lite 300, Verified 500, Multimodal V2 480 (after flaky removal) [E04–E08]; LiveCodeBench ~400 rolling [E09]. (E04–E09)
- **FACT:** Pre-registered threshold T1: ≥10pp gain at ≤2× median cost/latency, regression no worse, n≥30 for 95% CI (synthesis §10; E11). (E11)

## EVIDENCE

- **EVIDENCE (Medium):** Pilot demonstrates *mechanism* that verification gate can rescue a single-shot miss via parse→feedback (T03 exception-filter bug) within one retry — candidate recovered where baseline did not. (P05; consistent with R003 E02 feedback +4–5pp, Medium)
- **EVIDENCE (High):** Overhead scales with retry rate: per-retry cost ≈2× tokens/latency (pilot 2.05×/2.03×) and median overhead 1.28–1.48× at 20% failure rate. Extrapolates to R003's 3–10× at higher failure/iteration rates (E01) — Medium confidence for scaling, High for direction.
- **EVIDENCE (Medium):** Pilot overhead stayed within ≤2× median guardrail only because 4/5 tasks needed zero retries; if ≥2/5 had retried, median would breach 2×. (inference from P04/P05)
- **EVIDENCE (High):** No reliable SWE-bench same-model multi-vs-single A/B retrieved in R003 (gap E10), so pilot is first same-model same-spec comparison in LACE, but synthetic proxy limits comparability (R005 harness confounding warning). (R003 gap; R005 E05)

## INFERENCE

- **INFERENCE (Medium):** Pilot +20pp point estimate is *not statistically significant* — Wilson CIs overlap heavily, n=5 far below powered n (≈93 for 20pp, ≈387 for 10pp). Do not claim improvement; true effect could be 0–50pp. Pilot is variance-estimation + feasibility, not decision. (calc P09/P10)
- **INFERENCE (Medium):** Single-agent loop as default is safer: verification layer's benefit is concentrated on tasks where single-shot misses an edge case (here exception filtering, atomicity, sorting/ties). On trivially fixable tasks candidate adds cost without gain (4/5 identical). Requires selection: gate helps on "detail-sensitive" bugs, not all.
- **INFERENCE (Low-Medium):** Synthetic tasks likely overestimate success and underestimate cost vs real SWE-bench (no retrieval, no multi-file edits, no flakiness — R005 notes V2 dropped 37 flaky tasks, Lite excludes multi-file/>3 hunks). Real Verified run will show lower absolute success and higher latency/cost.

## HYPOTHESIS

- **HYPOTHESIS:** If candidate were run on SWE-bench Verified Lite (n=100+), the same parse→feedback mechanism would lift success modestly (perhaps 4–10pp, per R003 feedback ablations) but median cost would approach 1.5–2× and latency 1.5–3× depending on retry rate — Pareto improvement only if retry rate <30%. Needs testing (n≥100, standardized mini-SWE-agent harness per R005 E05).
- **HYPOTHESIS:** Sub-2-week wrapper extension (R004 MCP/ACP + `git worktree`) could replicate the tested orchestration without a standalone product — T4 moat hypothesis. Not tested in pilot (no replication spike).
- **HYPOTHESIS:** Spec→tests phase adds ~80–90 tokens/task (pilot T01 501−391≈110, T02 88) even when unused — overhead floor independent of recovery.

## OPINION

- **OPINION (Synthesis authors):** "Multi-agent EXPERIMENTAL (not CORE); single-agent loop is default; multi-agent optional gated behind thresholds" (research/reports/01-research-synthesis.md §6) — pilot neither refutes nor confirms, but is consistent: small conditional gain, non-trivial cost.
- **OPINION (Users on R002, paraphrased):** Verification burden and regression risk are top pains — candidate addresses that pain directly, but only if gate's specs/tests are trustworthy (R005 warns tests themselves may be weak — Verified needed human filtering 500/2,294).
- **OPINION (R004 recommendation):** Reuse mature primitives (`git worktree`, ripgrep/BM25, JSONL, containers) — do not build custom bus/parser/vector DB; pilot's worktree isolation is an example of reuse that worked (low complexity).
