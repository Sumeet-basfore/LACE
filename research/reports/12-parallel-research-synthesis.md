# LACE Parallel Research Synthesis (A–D)

**Date:** 2026-09-03 · **Scope:** Synthesize four independent tracks + existing LACE research. No new research. No SWE-bench. No Phase-2D modification. No production code.
**Tracks:**
- A — Product/user problem → `research/reports/08-product-problem-research.md`
- B — Core conceptual model → `research/reports/09-core-model-analysis.md` + `docs/core/` + `docs/06-recovery-model.md` + `docs/07-recovery-policy.md`
- C — Adversarial product/moat → `research/reports/10-adversarial-product-test.md` + `research/reports/06-adversarial-product-test.md` + `research/reports/05-verification-competitive-gap.md`
- D — Security/trust → `research/reports/11-security-trust-analysis.md` + `docs/security/`
**Existing LACE:** `docs/01-research.md`, `02-competitive-landscape.md`, `03-problem-space.md`, `04-opportunity.md`, `05-product-thesis.md`, `06-validation-prototype.md`, `research/reports/01`, `02`, `03-phase2c-synthesis.md`, `context/brain.md`, `context/decisions.md` (D-001–D-010), `context/terminology.md`, `context/experiment-rules.md`
**Labels:** FACT | EVIDENCE | INFERENCE | HYPOTHESIS | DECISION per `context/terminology.md`.

---

## 1. Who is the most plausible LACE user?

**EVIDENCE:** F01 (67 GH issues, 262 fetched → 67 retained) triangulated with R002 (15 sources) shows severe episodes (discards-all-changes ×4 comments, rolls-back-manual-work, hangs-no-logs, doubled-prefix, unknown-MCP-tool) occurring inside Claude Code / Codex / OpenCode / Aider / Cline / Roo — i.e. users already on agents doing feature-level work. Zero of 67 requested teams of agents; users asked to curb proactivity instead.

**INFERENCE:** Most plausible user is a developer / small team already using an existing coding agent (Claude Code, Codex, OpenCode, Aider, Cline/Roo, terminal or editor) on **real feature work where reversibility and regression matter** — long-horizon or multi-file edits where a broken change has reviewer or production cost.

**EVIDENCE:** Secondary enterprise segment has blocker-level trust signal: 3 identical trust-adapter proposals same week (Cline #13737, Continue #13212, Aider #5665) + unredacted telemetry + `.env override=True` + `allowHeadless` 11 comments; Copilot BYOK/ZDR/sandboxing productization proves buyer pressure (R006 E07).

**HYPOTHESIS:** Single-file / greenfield / no-regression-suite users are probably *not* users — `undo` suffices and LACE adds friction without benefit.

**DECISION:** Keep primary narrow (feature-work agent users); enterprise trust stays secondary until T3. Do not size to a broad ICP.

---

## 2. What exact pain are we solving?

**FACT:** Eight painful moments documented with artifacts (A §3, `docs/03-problem-space.md`):
PM-1 verification burden (no consistent gate; opposite polls #13753 vs #13101); PM-2 loops/hangs (no logs, ReportFindings 6-comment loop); PM-3 hallucinated edits (doubled-prefix #5112, unknown tool #12977, filename miss #5662); PM-4 regression/state loss (#3581 ×4, #3965); PM-5 MCP/credential trust (#5621, #5622, #9327); PM-6 context loss ("context is state" H01); PM-7 invisible progress while streaming (same symptom 2 products); PM-8 recovery cost blow-up (D-005).

**INFERENCE:** The solvable slice is PM-1 + PM-2 + PM-4-as-policy + PM-5: a deterministic gate that blocks merge on red/regression, loop/timeout guardrails + progress signal, worktree isolation, and opt-in MCP trust proxy. PM-3/PM-6/PM-8 are only partially harness-mitigable (model-limited).

**HYPOTHESIS:** Unifying claim: *no enforced policy ties existing tools into a measured loop* — primitives exist, the gate does not.

---

## 3. Is the pain strong enough?

**EVIDENCE:** Existence + severity for affected users is Medium-High (cross-repo recurrence, High severity: blocking, silent-incorrectness, data loss). Mechanism feasibility shown once (F02 pilot 1 recovery via gate, regression 0).

**FACT:** Strength as *market* is unproven: corpus 7–21% is corpus-only, never population prevalence. `No reliable evidence found` for share blocked, WTP vs `git worktree` + required checks, or price calibration.

**EVIDENCE:** Current retry economics are negative: 0/5 recovery at ~2.97× median tokens, 2.08× latency (D-005); per-retry 2.05× at edge (F02); 3–10× multi-agent cost (R003). Provider-blind-retry contamination (D-007) further proves naive automation amplifies harm.

**INFERENCE:** Pain is strong enough to justify a *narrow wedge experiment*, not a product bet. Heterogeneity (opposite friction polls) means any fixed gate annoys half the corpus — gate must be configurable, which weakens mandatory-gate value.

**DECISION:** Treat market-strength as HYPOTHESIS until n>100 survey + buyer interviews.

---

## 4. What is the smallest useful core model?

**FACT:** Thesis pipeline (`docs/06-recovery-model.md`): attempt → evidence → classification → minimal context → recovery → verification → regression proof → outcome. B reduces 9 concepts to 6 fundamental + 3 derived.

**DECISION (B, adopted):** Irreducible core = **Task, Attempt, Verification, Evidence, Outcome, Cost** (6). Patch (= Attempt.output), Failure (= classify(Evidence, version)), Recovery (= edge decision retry/stop) are derived attributes/edges. 7-event append-only log (`task.opened … task.closed`), bounded excerpts + hashes, zero-bill `STOPPED` distinct from `FAILED`, lifecycle `PENDING → ATTEMPTING → VERIFYING → CLASSIFIED → {RECOVERING | PROVEN | FAILED | STOPPED}`.

**INFERENCE:** 6+3 is sufficient to describe lifecycle; Agent/Prompt/Container/Ledger/Reviewer/Scheduler are architecture, not model. `WRONG_FILE` stays provisional (LOW-MEDIUM, mapping-dependent); `OTHER` capped at 1 retry as taxonomy-incompleteness meter.

**HYPOTHESIS:** Minimal useful context (targeted excerpt, not full problem_statement) suffices for recovery — unproven until clean Phase 2D.

---

## 5. Which proposed capabilities are commodity?

**FACT (C + gap report):** The following are mature reuse (R004) or already productized elsewhere — **NOT differentiators**:
`git worktree` isolation; `git apply --check` / `patch --dry-run`; JSONL trajectory / `stream-json` / pane logs; `bash`/`pytest`/`npm test` execution; retry loops + caps + timeouts; prompt-shaping (800-char tail or targeted payload); ripgrep/BM25/Tree-sitter search; multiplexer lifecycle (tmux/Herdr); MCP transport itself; CI required checks as merge gate (stronger than any agent self-check); single-run token counters; streaming progress signal; standalone multiplexer / custom bus / vector DB / multi-agent DAG (killed D-002/D-004).

**EVIDENCE:** F04 desk-constructs full clone: MCP 250–350 LOC + hook <100 LOC + Herdr 150–200 LOC, single dev <1 week. Path C shell clone <30 LOC. Standalone fails T4.

**INFERENCE:** ~90% of LACE is commodity composition. Value can only live in *policy + calibration*, never in primitives.

---

## 6. Which capabilities may be differentiated?

**EVIDENCE (gap §3.1, six genuinely uncommon — absent first-class in all 12 + absent from scorecards + unsolved in corpus):**
1. Deterministic gate blocking merge on red/regression as primitive;
2. Pareto transparency (`% resolved | regression | cost | latency | pass@3 | recovery` on Verified + rolling split — no incumbent publishes it);
3. Regression gate separated from task success;
4. Failure-class separation with non-retryable provider Stop (D-008);
5. Layered ordering (L1 0.1s → L2 `pytest -k` ~80s → L3 regression);
6. Opt-in MCP governance proxy.

**INFERENCE:** Only the *binding layer* (gate + layering + class separation + Pareto logging) survives §4 elimination. Items 2–4 are whitespace as *absence*, not as difficulty — each copies in hours.

**HYPOTHESIS:** The single hardest-to-copy item is **B: layered ordering + minimal corrective context as tuned numbers** (which payload bytes, which per-class cap) — but calibration does not exist yet (Phase 2D contaminated). Pareto *publication* is moderately defensible as credibility, not as installable software.

---

## 7. What would LACE have to own?

**FACT (C §7):** LACE today owns nothing moat-grade: no proprietary data (ledger local JSONL by design), no workflow state (ephemeral worktrees), no eval data (no powered run published), no learned policies (static 12-class matrix), no network effect (one user's ledger never helps another), no lock-in (removal = delete one JSON entry), no brand/distribution/certification.

**INFERENCE:** To be defensible LACE must own exactly one thing: **powered, continuously refreshed Pareto evidence that its tuned layered policy beats the developer's own hook** — T1 (≥10pp at ≤2×, regression ≤, n≥30, Wilson non-overlap + rolling split) plus re-publication cadence. Everything else forks.

**DECISION:** Until that number exists, price LACE as HYPOTHESIS. Standalone stays killed; extension earns THIN-BUT-PROMISING only after the number.

---

## 8. What are the biggest security/trust constraints?

**FACT (D):** Verification executor concentrates all privilege while consuming the most untrusted inputs (repo + patch + test output). Current harness already persists unredacted 800-char tails/traces that re-send to the provider — secret sink exists today.

**DECISION (D, adopted as policy):** Least-privilege throwaway container/worktree, egress-deny default, destructive git/docker denylist, no push/merge/deploy in-loop (human merges), env allowlist deny-by-default, redact-at-capture AND redact-before-reprompt, structured extraction + quoted untrusted blocks, never execute repo hooks, provider = untrusted transport (local verdicts only), hash-chained redacted JSONL with bounded retention.

**EVIDENCE:** OWASP LLM01/LLM06 + CWE-78/798 ground injection/secret classes; GitHub masking is best-effort precedent — redaction cannot prove zero-leak.

**INFERENCE:** Credible promise today is *verifiability* (local gates, separated classes) only. Confidentiality and tamper-evidence are HYPOTHESIS. Top unresolved risks: unredacted sink, no sandbox profile, evidence→prompt injection path, test-weakening patches faking green, provider sees everything sent.

**DECISION:** SECURITY READINESS: **LOW**. Do not attach to private repos / real credentials beyond experiments until redaction + isolation land. This is an input to the D-010 scale gate.

---

## 9. What should explicitly NOT be built?

**DECISION (standing Non-Goals, confirmed by all four tracks):** Standalone binary / custom multiplexer / custom agent runtime / custom MCP protocol / custom vector DB / multi-agent DAG as default / local-first as primary wedge / 8GB-first promise / 13th general agent / Cursor-parity / custom editor / ACP-as-primary. Plus: mandatory always-block gate (heterogeneity forbids it — advisory-with-blocking-option only), unbounded retries, provider/infra blind retries (max 0), full-suite-on-every-retry, full-context replay by default, auto-push/merge/deploy, repo-hook execution, unredacted persistence.

**INFERENCE:** Violating this list resurrects the rejected broad thesis and its near-zero moat.

---

## 10. Which assumptions remain unvalidated?

**HYPOTHESIS (all OPEN until measured):**
1. Layered > current at ≤1.5× cost/latency, regression non-inferior (Phase 2D n=7 clean — contaminated, D-007/D-010).
2. Minimum feedback payload sufficiency (test name? +assertion? +20-line traceback? +hunk?) without full problem_statement.
3. Reviewer (`WRONG_FILE`) pays for itself vs extra targeted retry (LOW-MEDIUM).
4. Timeout/context-shaping policy optimum; retry caps 1-vs-2 optima.
5. T1 powered Pareto (≥10pp, ≤2×, n≥30 prefer 100+, real billing, rolling split).
6. T2 HerdrDelta (>30% time-to-green or >50% fewer interventions, n≥20).
7. T3 local-mandatory ≥40% (5 interviews + policy review).
8. T4 measured 2-week replication spike (desk estimate only).
9. Population prevalence / WTP (survey n>100 + 5 enterprise interviews).
10. Redaction recall, sandbox escape, injection-suite resistance, minimization measurement (all security controls unimplemented).
11. Cross-task generalization beyond n=7; Lite-filter blind spot (multi-file/>3-hunk excluded where LACE would matter most).

**FACT:** Until 1, 5, 9 close, GO claims are unproven. Current posture is correctly PIVOT-as-hypothesis (`context/brain.md`).

---

## LACE PRODUCT THESIS V2

**HYPOTHESIS (5 sentences):** LACE is a thin verification-first extension around the developer's existing coding agent for feature work where reversibility and regression matter, not a platform. It enforces per-task worktree isolation, a cheap→targeted→regression gate that blocks merge on red, failure-class-aware bounded recovery with minimal evidence-shaped context, and a Pareto ledger of resolved, regression, cost, latency, and recovery. It ships as one MCP server plus one Claude Code plugin (with an optional Herdr variant) sharing a single verification core, reusing all mature primitives. It promises verifiability only — never confidentiality or autonomy — until redaction and sandboxing are built and measured. It graduates from hypothesis to product only on powered Pareto proof (≥10pp at ≤2× with regression non-inferior) refreshed continuously, or it is killed.

---

## TOP 5 OPEN QUESTIONS (ranked by uncertainty × impact ÷ cost-to-validate)

1. **Does layered recovery beat current at ≤1.5× with regression non-inferior?** Uncertainty high, impact decisive (kills or advances core), cost low (n=7 clean rerun, quota-guarded). Validates HYPOTHESIS-1/2 directly.
2. **What share of agent users will pay for verification/MCP trust vs `worktree` + CI?** Uncertainty highest, impact market-defining, cost low-medium (survey n>100 + 5 buyer interviews — cheapest path from Low to Medium market confidence).
3. **Can redaction + sandbox actually hold (no-leak, no-escape, no-injection)?** Uncertainty high, impact gating (LOW readiness blocks private-repo use), cost medium (redaction recall test + injection suite + sandbox review — no benchmark quota needed).
4. **Does the powered Pareto win exist (≥10pp, ≤2×, n≥30+rolling)?** Uncertainty high, impact product-defining, cost high (~4–6 weeks Verified + billing + regression split). Do only after Q1 passes.
5. **What is the minimum recovery payload, and when does the reviewer pay?** Uncertainty medium-high, impact cost-defining (drives the 2.97×→1.3× claim), cost low (arm variants inside the n=7 design experiment).

---

## PRE-BUILD DECISION

**WAIT_FOR_BATCH1**

**Why (DECISION):** The four tracks converge: narrow severe pain exists (A), 6-entity core is sufficient but minimal-context is unproven (B), standalone has no moat and the extension's only moat is an unmeasured number (C), and security readiness is LOW with unredacted sinks live today (D). Choosing PREPARE_FOR_PROTOTYPE now would spend implementation on a hypothesis whose design gate (layered > current at ≤1.5×, D-010) has never passed on clean data and whose safety preconditions (redaction + isolation) are unwritten. PIVOT restates direction without new evidence; KILL overreaches — the thin extension is not disproven, only unproven (contaminated Phase 2D discarded per D-007, not failed). The cheapest information-positive step is the already-frozen clean Batch-1 rerun (quota-guarded, D-008 enforced, resume-safe) plus parallel low-cost survey and redaction/sandbox validation — then decide prototype vs kill on numbers.

**STOP.**
