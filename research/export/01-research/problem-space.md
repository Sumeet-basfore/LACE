<!-- GENERATED ARTIFACT — COPIED FROM CANONICAL SOURCE -->
<!-- Canonical Source: docs/03-problem-space.md -->
<!-- Category: research -->
<!-- Synchronization: scripts/export_research.py -->

# Problem Space — LACE

**Date:** 2026-09-02 · **Sources:** R002 (15), F01 (67 GH + 4 HN, 262 fetched → 67 retained), R003 (multi-agent papers), R005 (benchmarks), R006 (privacy) · **Model:** `muse-spark-1.2-contributor-free` · **Ledger:** `research/ledger.md` (11 COMPLETE) · **Discipline:** FACT/EVIDENCE/INFERENCE/HYPOTHESIS/OPINION preserved; no population prevalence invented; corpus prevalence ≠ market prevalence

This defines the validated problem space *after* validation. It separates strongly validated from partially validated, model-level from harness-solvable, and real-but-not-product-worthy-yet.

---

## A. Strongly Validated Problems (severe + cross-repo + harness-relevant)

Entry schema per problem: Problem / Evidence / Severity / Frequency evidence / Harness solvability / Confidence / Existing solutions / Remaining gap

### A1. Verification burden — inconsistent gating, permission spam vs over-proactivity

**Problem:** Agents either over-perform without check or block on every access — no consistent, deterministic verification that checks success + regression before claiming done.

**Evidence:** F01 21% corpus (14/67) — opposite polls Cline #13753 "Remove BE HELPFUL AND PROACTIVE" (1 comment) vs Continue #13101 "asks permission for every access" (heterogeneity) + permission checks PR #167 + Hub-managed plugins #13652 + keep Stop available #13678 + ledger #13155 + auto-test #5610; PlanBridge "precise feedback on plans" [R002 E03] as external gate. **FACT** (poll titles), **EVIDENCE** (PR counts), **OPINION** (preference varies).

**Severity:** High for trust — user cannot tell if work is reviewable. Heterogeneity means one setting fits none.

**Frequency:** 21% corpus — **but** includes fix PRs that *add* verification; not population prevalence. **No reliable evidence found** for how many of overall users are blocked.

**Harness solvability:** **High — almost entirely harness** — deterministic `spec→tests→gate→parse→feedback` loop, permission gates, `PostToolUse` → test hook, `Stop` gate. [F01]

**Confidence:** Medium-High existence/severity in corpus, Low demand sizing.

**Existing solutions:** `bash` adhoc, SWE-agent sandbox, Claude `AskUserQuestion` — none is a product primitive gate that blocks merge on red/regression.

**Remaining gap:** No benchmark reports regression/human-intervention (R005). That's the wedge.

---

### A2. Loops / hangs / stuck agents

**Problem:** Agent hangs indefinitely with no logs or enters degenerate/report loops, costing time, tokens, and requiring manual kill.

**Evidence:** F01 7% (5/67) — Cline #13750 PLAN hangs indefinitely with Ollama (no error logs, 1 comment), #13492 ReportFindings loop in ACT mode (6 comments), #13714 degenerate output loops + garbled tool results, opencode JetBrains MCP freeze #285. R002 E04/E08 SSE delivers only heartbeats. Pilot T03 showed retry *can* rescue exception-filter bug via gate. **FACT/EVIDENCE.**

**Severity:** **High — blocks all use** (needs manual kill).

**Frequency:** 7% corpus — rare in sample but catastrophic when it hits; no population rate.

**Harness solvability:** **High** — timeout, loop detection, `Stop` keep-alive #13678, gate timeout, 5-sec `agent_prompt_stalled` guard in Herdr [F03].

**Confidence:** Medium-High existence/severity, Low population.

**Existing solutions:** Manual `ctrl+c`, Herdr `blocked` detection [F03] — no automatic parse→retry with backoff.

**Remaining gap:** Bounded recovery (cap 2 retries) + progress signal while streaming.

---

### A3. Hallucinated / unreliable edits (tool misuse, doubled prefix, indented blocks)

**Problem:** Agent invents edit-block headers, forwards unknown MCP tool names with opaque error, misses filenames in indented fences, malforms tool-call args — silent wrong edits.

**Evidence:** F01 9% (6/67) — Aider #5112 doubled-prefix hallucination, #5662 indented fenced block, Cline #12977 unknown MCP tool forwarded, Continue #13092 sanitize malformed args (vLLM 400), #13000 tool-calling redesign; H03 jpc0 comment links hallucinated docs → endless feedback loop eating millions of tokens. **EVIDENCE.**

**Severity:** **High — silent incorrectness**, opaque errors.

**Frequency:** 9% corpus.

**Harness solvability:** **Medium — partial (guardrails).** Harness can reject unknown tools #12977, catch doubled-prefix #5112, sanitize args #13092 — but cannot stop model inventing docs or choosing wrong file — needs better model. Hybrid. [F01]

**Confidence:** Medium existence, Medium hybrid split.

**Existing solutions:** Prompt hygiene + tool description improvements — unproven at scale.

**Remaining gap:** Input/output validation (unknown-tool rejection, fenced-block parser) + feedback that names the parse error for retry.

---

### A4. Regression / state loss

**Problem:** Adding file discards all changes, manual edits rolled back, schedules not shown — loss of work / loss of manual investment.

**Evidence:** F01 10% (7/67) — Aider #3581 "Add file discards all changes" (4 comments), #3965 "rolls back my manual changes" (2), Continue #13613 schedules not shown, terminal output capture unstable #13138. **FACT/EVIDENCE.**

**Severity:** **High — data loss.**

**Frequency:** 10% corpus.

**Harness solvability:** **Medium — hybrid with policy.** Harness can enforce `git worktree` isolation per task, file-ownership locks, and separate `test_regression_*` suite that blocks on red; model still chooses wrong file. [F01, F02 pilot `worktrees/` isolation]

**Confidence:** Medium.

**Existing solutions:** `git checkout` / `stash` / `tag` mature per R004 — but not enforced as gate. Herdr `worktree` wrapper is thin convenience ([F03] Duplicates).

**Remaining gap:** Deterministic regression gate + worktree per task + ownership lock — not a new primitive, just enforced policy (F04 thin).

---

### A5. Privacy / credential trust (MCP surface)

**Problem:** Unredacted telemetry URLs/paths, `.env override=True` silently replacing shell vars, no lineage for long-lived API keys, no opt-in trust for MCP servers — enterprise blocker.

**Evidence:** F01 21% (14/67) — 3 **identical trust-adapter proposals same week** (Cline #13737, Continue #13212, Aider #5665) — cross-repo — plus Aider #5621 telemetry ships raw exception text, #5622 `.env override`, Continue #12492 governance proxy, #9327 `allowHeadless` for MCP (11 comments), #13676 OAuth callbacks hardening, #13684 Composio connectors. Buyer pressure proved by GitHub Copilot productizing content exclusion / BYOK / private registry / audit / sandboxing [R006 E07, F04]. **FACT (proposals same week), EVIDENCE (telemetry).**

**Severity:** **High — enterprise/deal blocker** (not hobbyist).

**Frequency:** 21% corpus — but again includes proposals that *add* trust, not just complaints; not population.

**Harness solvability:** **High** — MCP proxy (allowHeadless precedent), OAuth hardening, `.env` fix, telemetry redaction — all ship in PRs as harness code. [F01]

**Confidence:** Medium-High existence/severity for affected/enterprise users, Low demand sizing (no buyer interviews).

**Existing solutions:** Copilot BYOK/ZDR, LM Studio ZDR — but no lightweight host-native governance proxy for open harnesses that is off by default / on for enterprise.

**Remaining gap:** Lightweight MCP governance proxy as opt-in extension — the enterprise unlock in the wedge.

---

## B. Partially Validated Problems

### B1. Context loss / repo understanding

**Problem:** Context-window detection requires specific message (#12876), hooks delivering `contextModification` broken (#13297), budgeted output re-truncated + truncation limits (#13693), `File Not Found` response (#13723). HN: "difficult to keep agent on track... context is state" [F01 H01].

**Evidence:** F01 6% (4/67) — under-sampled vs R002; R002 flagged context as top pain. Query construction explains divergence; severity ranking aligns more than count.

**Severity:** High for long-horizon (value proposition).

**Frequency:** 6% in F01 corpus — small n; broader demand `No reliable evidence found.` (no survey).

**Harness solvability:** **Medium — hybrid** — repo-map, truncation config, hook delivery help, but window is model limit; HN H02 hypothesizes harness lever even for apparent model failures.

**Confidence:** Medium hybrid, Low population.

**Existing solutions:** repo-map, Tree-sitter/ripgrep/BM25 indexing (mature per R004) — reusable.

**Remaining gap:** Only partially harness-addressable; not a primary wedge alone.

---

### B2. Progress / steerability (visibility while streaming)

**Problem:** TUI has no progress signal while tool-call arguments stream ("Preparing write..." [#46734]), SSE delivers only heartbeats no message events [#46733], shared TUI extraction [#13688].

**Evidence:** F01 9% (6/67) — same symptom in two products, 2 comments each. F03 teardown flags task-level observability as LACE's only *Real* delta vs Herdr.

**Severity:** Medium — UX/cost transparency, not correctness.

**Frequency:** 9% corpus.

**Harness solvability:** **High** — harness buffering + `pane read` modes + `herdr --handoff` [F03].

**Confidence:** High harness gap, Medium that bundling it as wedge moves demand.

**Remaining gap:** Worktree-isolated task dashboard (progress/cost/regression) — the Pareto transparency LACE should own.

---

### B3. Cost / latency

**Problem:** Pricing 15–300× over list [#13184], high token usage with reasoning models [#253], high token usage Gemini 2.5 Flash, streaming closed-by-remote [F01]. Pilot per-retry 2.05× at edge; R003 3–10× for multi-agent.

**Evidence:** F01 16% (11) — but magnitude is single anecdotal pricing bug (not verified against pricing page) — Low weight until F02 billing.

**Severity:** Medium — billing bug is High if real, token blowup is cost not correctness.

**Frequency:** 16% corpus — includes provider config confusion, not pure model cost.

**Harness solvability:** **Medium — hybrid** — pricing table fix is harness, token blowup is model+prompt discipline + retry cap.

**Confidence:** Low magnitude until real billing + Verified n≥30.

**Remaining gap:** Cap retries (2) + report median cost with real `tiktoken` — part of Pareto scorecard.

---

## C. Model-Level Problems (not primarily harness-solvable)

- **Doubled-prefix invention, fabricating docs, inventing file edits that don't exist, wrong file choice** — requires better model; harness only guardrails (unknown-tool rejection, sanitized args). F01 #5112, #12977, H03 jpc0. **Harness can mitigate, not cure.**
- **Deep reasoning failures on synthetic vs real repo** — F02 synthetic pilot overestimates success vs real multi-file retrieval that Lite filters — model + harness jointly.

---

## D. Harness-Solvable Problems (summary)

**Almost entirely harness (High confidence):** progress visibility, loops/hangs, privacy/trust, verification burden (permission gates/ledger).

**Partially harness (Medium):** hallucination (input/output validation), regression (worktree + regression suite), context management (repo-map/truncation/hooks), cost (pricing fix + retry cap).

*This split is why F04 thin-layer reproduction works (<2 weeks of harness glue) and also why moat is thin — cheap to build, cheap to copy.*

---

## E. Problems That Are Real But Not Product-Worthy Yet

**Real for affected users, but insufficient evidence to size a product or bet on as primary wedge (all `No reliable evidence found.` for population):**

1. **"Need multi-agent teams"** — 0 of 67 GH issues requested teams; users instead asked to *curb* proactivity (remove `BE HELPFUL` vs permission spam heterogeneity). ChatDev/MetaGPT gains narrow (prototype, +19pp via SOPs+feedback, not agent count). **Keep EXPERIMENTAL until T1 Pareto.** [02 §5]
2. **"Need pure-local / 8GB-first to win"** — runtime mature (Ollama/LM Studio), but ZDR/BYOK satisfies broader market, Continue archived, no SWE-bench bench or 8GB rig. **IMPORTANT SECONDARY, not primary → REJECTED until T3 ≥40% mandatory.** [02 §6, R006]
3. **"Need better repo indexing / custom vector DB / AST editing"** — R004 mature baseline ripgrep/BM25 + Tree-sitter sufficient; embeddings/AST are *conditional* ("add when measured gap appears"). Not product-worthy as v1.
4. **"Need a better standalone multiplexer / ACP-as-primary"** — Herdr already occupies; ACP remote WIP, narrower than MCP. T2 HerdrDelta untested — no evidence beating `tmux+worktree`. Keep OPTIONAL.
5. **Any problem pitched as "lack of multi-file/>3-hunk/file-create support" without measurement** — precisely the slice Lite filters, but pilot not yet measured at scale — needs Verified n≥30 before sizing.

*For each: existence is real for some users, but **No reliable evidence found** for population prevalence, willingness-to-pay, or that harness investment would shift behavior at scale — therefore not product-worthy as committed requirement. They belong in Experimental.*

---

## Evidence Discipline Note

- **Corpus prevalence (7–21%) is not market prevalence.** F01 explicitly forbids conversion: fix PRs inflate verification/privacy, query construction biases counts, no survey n>100. All frequency statements above are *corpus only*.
- **Pilot +20pp is not proven improvement:** n=5, Wilson CIs overlap (37.6–96.4% vs 56.6–100%), chars/4 tokens coarse — F02 correctly refuses claim.
- **Reproduction estimates are desk bounds, not timed builds:** F04 150–350 LOC <1 week bounded by inspected `commandcode.integration` template + scaffolder, not measured build.
- **Labels preserved:** every finding in per-task `findings.md` carries FACT/EVIDENCE/INFERENCE/HYPOTHESIS/OPINION and access dates.
