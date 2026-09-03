# Product Problem Research — Who is LACE for, what pain, why incumbents insufficient

**Agent:** Research Agent A · **Date:** 2026-09-03 · **Scope:** USER PAIN and VALUE only — not competitive landscape, not architecture
**Thesis under test:** LACE explores whether failure-aware verification can convert verification evidence into minimal, actionable corrective context and enable bounded recovery at acceptable cost and latency [**HYPOTHESIS**, `context/brain.md`, `docs/05-product-thesis.md`]
**Direction (DECISION, not validated):** verification-first, failure-aware recovery, thin host-native extension, coding-agent integration, optional Herdr integration · NOT justified: standalone runtime, multi-agent as core, vector DB, local-first-only
**Constraints:** Do not propose feature list. Do not design architecture. Do not build. Do not run SWE-bench. Do not modify `research/phase2d`. Do not spawn agents.

**Evidence discipline:** Every important statement below carries **FACT / EVIDENCE / INFERENCE / HYPOTHESIS**. Prevalence percentages are not invented; corpus counts are not treated as market prevalence. **No reliable evidence found** is stated explicitly where the 11-task corpus (R001–R007, F01–F04, 67 GH issues + 15-source R002 + pilot n=5) does not support a claim.

---

## 1. Executive summary

**EVIDENCE:** Across F01 (67 GH issues, 262 fetched → 67 retained) triangulated with R002 (15 sources), severe, harness-solvable pains exist for affected users: hallucinated/unreliable edits, loops/hangs, regression/state loss, inconsistent verification burden, and (for enterprise) MCP/credential trust. **FACT** from direct artifacts (doubled-prefix headers, unknown-MCP-tool opaque error, indented-block filename miss, add-file discards all changes, PLAN hangs indefinitely with no logs, ReportFindings loop). **EVIDENCE** for existence in corpus; **HYPOTHESIS** for population prevalence — `No reliable evidence found` for share of all agent users affected (explicit gap in `docs/01-research.md` and `docs/05-product-thesis.md` Open Questions).

**INFERENCE:** The pain is real but *heterogeneous* — opposite polls ("Remove BE HELPFUL AND PROACTIVE" vs "asks permission for every access" — F01) prove one friction level fits none. That heterogeneity is itself the verification-burden pain: no consistent gate that checks success + regression before claiming done.

**EVIDENCE:** Current retry approach ("full suite → generic 800-char tail → full-context retry") recovers 0/5 and costs ~2.97× median tokens (D-005, `context/brain.md` Validated State). **HYPOTHESIS:** layered, failure-aware, targeted feedback (test name + assertion + file:line + 20-line traceback, not full problem_statement) can recover more at lower cost — *not validated*, pending clean Phase 2D n=7 design gate and T1 n≥30 (`context/decisions.md` D-010).

**INFERENCE on workarounds vs gap:** Existing workflows (Claude Code/Cursor/Codex/OpenCode + `git worktree` + `bash` + CI required checks) already solve ~90% of isolation/blocking for a competent developer with one shell script or hook. The remaining ~10% gap is *policy* (deterministic gate that blocks merge on red/regression, failure-class separation that never blind-retries 429, cheap-then-targeted-then-regression layering, and cost/reliability/regression observability) — **EVIDENCE** that no incumbent productizes it as a primitive (`docs/02-competitive-landscape.md` §3, R005 benchmark gap).

**INFERENCE on who cares:** Most likely to care is a narrow, not-yet-sized segment doing real feature work where reversibility and regression matter. Least likely is the casual single-file or greenfield task. Willingness-to-pay vs "just use `git worktree` + required status check" is `No reliable evidence found` — **HYPOTHESIS** must be tested with n>100 survey + buyer interviews before a market claim.

**Product signal for this research:** **PROMISING** (see §10) — validated severe pain for a narrow segment + feasible harness, but magnitude/prevalence/unproven Pareto win keep it from STRONG.

---

## 2. Target user

**INFERENCE — Primary (hypothesized, not sized):** Developers and small teams using existing coding agents (Claude Code, Codex, OpenCode, Aider, Cline/Roo) — terminal or editor — on **real feature work where reversibility and regression matter**: long-horizon edits, multi-file touches, or code where a broken change has reviewer or production cost. **EVIDENCE** for this segment is indirect: F01 issues like "Add file discards all changes" (4 comments, data loss), "rolls back my manual changes" (F01), and context-loss report "difficult to keep agent on track throughout entire feature ... context is state" (F01 H01 / R002 E11) describe *feature-level* use, not one-shot file edits.

**INFERENCE — Secondary (enterprise, blocker-level but not primary wedge):** Teams where MCP trust / private registry / audit / `allowHeadless` is a gating requirement. **FACT:** 3 identical trust-adapter proposals same week (Cline #13737, Continue #13212, Aider #5665) — cross-repo — plus unredacted telemetry URLs/paths (`F01` #5621), `.env override=True` silently replacing shell vars (`F01` #5622), `allowHeadless` debate 11 comments (`F01` #9327). **EVIDENCE:** Buyer pressure proved by Copilot BYOK/ZDR/sandboxing productization (`R006` E07). **HYPOTHESIS:** share of buyers who would pay for a thin governance proxy vs accept Copilot ZDR/BYOK is `No reliable evidence found` — explicitly Low demand confidence in `docs/05-product-thesis.md`.

**HYPOTHESIS — Who is probably *not* the user:** Developer doing single-file, short, reversible edits where `undo` or `git checkout` is sufficient; task where verification is trivial (no regression suite or regression cost is zero); user who does not use an agent at all (conventional TDD without agent has no agent-failure to recover). **EVIDENCE for this exclusion:** 0 of 67 GH issues requested "teams of agents" — users instead asked to *curb* proactivity; multi-agent gains are narrow prototype +19pp via SOPs+feedback at 3–10× cost with no SWE-bench A/B (`HYPOTHESIS` — `R003`, `docs/05-product-thesis.md`); Continue archived read-only warns fragile local-agent UX (`R006` E05). For these users, LACE adds complexity without benefit — `No reliable evidence found` that they would adopt a gate.

**INFERENCE on sizing:** **HYPOTHESIS:** Primary is meaningful only for a narrow, not-yet-sized segment. `No reliable evidence found` for population prevalence or broader demand — corpus 7–21% is *corpus only*, not market prevalence, and pricing/bench magnitude not measured (`docs/01-research.md` Explicitly Low confidence on demand sizing). Do not act on broad-ICP assumptions.

---

## 3. Painful moments

Each moment is a lived episode where the developer must intervene, verify, or abandon — not an abstract capability gap. Ordered by harness-solvability, then by severity in corpus.

### PM-1: Verification burden — no consistent gate before "done"

- **What happens (FACT):** Agent either over-performs without check (claims success) or blocks on every access (permission spam). Developer cannot tell if work is reviewable without manually running tests. **FACT** from F01: opposite polls — "Remove BE HELPFUL AND PROACTIVE" (`#13753`) vs "asks permission for every access" (`#13101`); plus permission-checks PR (`#167`), Hub-managed plugins (`#13652`), keep-Stop-available (`#13678`), ledger/IDELedger (`#13155`), auto-test docs for headless (`#5610`), PlanBridge external gate (`R002` E03).
- **Severity (EVIDENCE, Medium-High in corpus):** High for trust — user loses trust in "done." Heterogeneity means any single friction setting annoys a subset.
- **Harness solvability (INFERENCE, High):** Almost entirely harness — deterministic `spec→tests→gate→parse→feedback` loop, `PostToolUse→test` hook, `Stop` gate (`F01`).

### PM-2: Loops / hangs / stuck — "hangs indefinitely, no logs"

- **What happens (FACT):** Agent hangs indefinitely with no error logs, or enters degenerate/report loops, costing tokens and wall time until manual kill. **FACT** F01 7%: Cline `#13750` PLAN hangs with Ollama — no error logs (1 comment), `#13492` ReportFindings loop in ACT mode (6 comments), `#13714` degenerate output loops + garbled tool results, opencode JetBrains MCP freeze `#285`; R002 E04/E08 SSE delivers only heartbeats.
- **Severity (EVIDENCE, High — blocks all use):** Catastrophic when it hits, even if rare in sample.
- **Harness solvability (High):** Timeout, loop detection, `Stop` keep-alive (`#13678`), 5-sec `agent_prompt_stalled` guard in Herdr (`F03`). **EVIDENCE** pilot T03 showed retry *can* rescue exception-filter bug via gate — but current generic retry did not (0/5, D-005).

### PM-3: Hallucinated / unreliable edits — silent incorrectness

- **What happens (FACT):** Agent invents edit-block headers (doubled-prefix), forwards unknown MCP tool names with opaque error, misses filenames in indented fences, malforms tool-call args — edit is wrong without a loud failure. **FACT** F01 9%: Aider `#5112` doubled-prefix, Cline `#12977` unknown MCP tool forwarded, Aider `#5662` filename miss, Continue `#13092` malformed args (vLLM 400).
- **Cost (EVIDENCE):** H03 jpc0 links hallucinated docs → endless feedback loop eating millions of tokens. **INFERENCE:** Silent incorrectness is higher-cost than a loud failure because developer must *discover* it.
- **Harness solvability (Medium — partial guardrails):** Harness can reject unknown tools, catch doubled-prefix, sanitize args — but cannot stop model inventing docs or choosing wrong file (needs better model). Hybrid.

### PM-4: Regression / state loss — "discards all changes," "rolls back manual work"

- **What happens (FACT):** Adding file discards all changes, manual edits rolled back, schedules not shown — loss of work / loss of manual investment. **FACT** F01 10%: Aider `#3581` (4 comments), `#3965` (2), Continue `#13613`, terminal output capture unstable `#13138`.
- **Severity (EVIDENCE, High — data loss):** Directly destroys value.
- **Harness solvability (Medium — hybrid with policy):** `git worktree` isolation per task + file-ownership locks + separate `test_regression_*` suite that blocks on red can prevent loss; model still chooses wrong file.

### PM-5: Trust / MCP credential surface — enterprise blocker

- **What happens (FACT):** Unredacted telemetry URLs/paths, `.env override=True` silently replacing shell vars, no lineage for long-lived API keys, no opt-in trust for MCP servers. **FACT** F01 21%: 3 identical trust proposals same week + telemetry ships raw exception text (`#5621`), `.env override` (`#5622`), governance proxy (`#12492`), `allowHeadless` 11 comments (`#9327`), OAuth hardening (`#13676`).
- **Severity (EVIDENCE, High for enterprise, Low for hobbyist):** Deal blocker, not annoyance.
- **Harness solvability (High):** MCP proxy (allowHeadless precedent), OAuth hardening, `.env` fix, telemetry redaction — all ship as harness code per F01 PRs.

### PM-6: Context loss / repo understanding — "context is state"

- **What happens (FACT):** Context-window detection requires specific message (`#12876`), hooks delivering `contextModification` broken (`#13297`), budgeted output re-truncated (`#13693`), `File Not Found` response (`#13723`). **EVIDENCE** HN: "difficult to keep agent on track ... context is state" (`F01` H01).
- **Severity (INFERENCE, High for long-horizon value proposition, Low population evidence):** F01 captures only 6% for this cluster, under-sampled vs R002 — severity ranking aligns more than counts.
- **Harness solvability (Medium — hybrid):** Repo-map, truncation config, hook delivery help; window is model limit.

### PM-7: Progress / steerability — invisible while streaming

- **What happens (FACT):** TUI has no progress signal while tool-call arguments stream ("Preparing write..." `#46734`), SSE delivers only heartbeats (`#46733`). **FACT** same symptom in two products.
- **Severity (EVIDENCE, Medium — UX/cost transparency, not correctness).**
- **Harness solvability (High):** Harness buffering + `pane read` modes + `herdr --handoff`.

### PM-8: Recovery cost/latency — repeated retries, full context replay

- **What happens (EVIDENCE):** Current approach runs full Docker verification on every retry and resends full problem context (~176k cacheRead per pi call), yielding ~2.97× median token cost with 0/5 recovery (D-005, `context/brain.md`). Pilot per-retry 2.05× at threshold edge (F02). R003 3–10× for multi-agent.
- **Severity (INFERENCE, Medium):** Costly, not correctness, but violates T1 `≤2×` guardrail.
- **Harness solvability (Medium — hybrid):** Pricing-table fix is harness; token blowup is model+prompt discipline + retry cap.

**INFERENCE — which pain LACE addresses:** PM-1, PM-2, PM-4 (as policy), PM-5 map 1:1 to the PIVOT wedge (deterministic verification gate that blocks merge on red/regression + loop/timeout guardrails + MCP trust proxy — `docs/05-product-thesis.md` Primary Wedge). PM-3/PM-6/PM-8 are partially harness-mitigable but model-limited — LACE can provide guardrails and minimal evidence, not a cure.

---

## 4. Existing workflows / workarounds

**FACT — What developers currently do (observed in corpus and live snapshot, not personas):**

- **Manual verification loop (most common — EVIDENCE from fix PRs):** Run `bash` / `pytest` / `npm test` adhoc, `git apply`/`git checkout`/`stash`/`tag` for safety, `git worktree add` for isolation (Herdr `worktree` wrapper is thin over `git worktree` — `F03` teardown). SWE-agent/OpenHands do the same inside Docker/sandbox — but as `bash`/Docker adhoc, not as a gate that blocks merge (`docs/02-competitive-landscape.md` §3). Claude Code `AskUserQuestion`, plan mode, `CLAUDE.md` memory are used to steer, not to gate.

- **Permission friction toggles (heterogeneous — FACT):** Toggle "BE HELPFUL AND PROACTIVE" off vs permission-spam complaints — opposite polls prove no single setting satisfies. Developers file PRs to make this configurable (`#13753` vs `#13101`, `#167`, `#13652`).

- **Kill and retry (PM-2/PM-6 workaround — FACT):** `ctrl+c` / `Stop` keep-alive (`#13678`) / Herdr `blocked` detection / `agent_prompt_stalled` 5s. No automatic parse→retry with backoff — manual kill then re-prompt.

- **Prompt hygiene + tool description hardening (PM-3 workaround — FACT):** Unknown-tool rejection (`#12977`), doubled-prefix catch (`#5112`), malformed-args sanitization (`#13092`) — shipped as one-off harness fixes, not bundled.

- **Shell-script gate (cheap, common — EVIDENCE):** Developers already script `git worktree isolation + run_tests + parse JUnit + block merge` as a one-hook (`PostToolUse→gate.sh`, `Stop→gate_check.sh`) or CI required status check (JUnit/TAP → PR gate). **INFERENCE:** This signals the problem is *policy* missing, not capability — the primitives exist.

- **Conventional CI as post-hoc gate (EVIDENCE, mature):** Push → CI runs full suite → human reads tail → fix → push again. SWE-bench-style `PASS_TO_PASS` / `FAIL_TO_PASS` split is exactly this, but post-push. LiveCodeBench's self-repair and rerun loops are same pattern at benchmark level.

**INFERENCE — Which workarounds are cheap/easy:**

- **Cheap (minutes, <20 LOC):** `git worktree` per task, `git apply --check` / `patch --dry-run` before Docker (Layer 1 ~0.1s), unknown-tool rejection, `allowHeadless` toggle, `keep Stop available` for timeouts, buffered progress signal while streaming. **FACT:** These already ship singly as harness PRs — proves cheap.

- **Expensive (not cheap):** Maintaining a *consistent, deterministic* gate that blocks merge until green + regression check *and* logs `% resolved | regression | cost | latency | reliability | recovery` with `PASS_TO_PASS` separation across repos; correctly classifying provider vs model vs verification vs infra to avoid blind-retry of 429 (D-007/D-008); stitching minimal evidence (test name + assertion + file:line + 20-line traceback, not full tail) into a bounded retry that does not replay full context. **EVIDENCE for cost:** current cheap-looking "full suite → generic 800-char tail → full-context retry" already costs 2.97× and recovers 0/5 — cheap in code, expensive in tokens, and ineffective.

**FACT — What existing tooling already solves:**

- **Resolved / not a product gap:** File read/write, bash, search, MCP bus (2025-06-18 "USB-C for AI"), ACP ("LSP for agents" remote WIP), Tree-sitter/ripgrep/BM25 lexical search, `git worktree`/`apply`, JSONL trajectory, container sandbox — all mature reuse (`docs/02` §3, `R004`, `F04` E01–E04). Herdr already does workspace→tab→pane, persistent `session.json` v3, `agent prompt --wait`, 4-mode `pane read` + `api snapshot`, 5 agent integrations (`F03` 0.8.2, protocol 20). Claude Code already does repo understanding, plan mode, subagents, MCP, `claude -p --bare` headless.

---

## 5. Evidence

### Primary evidence (strength: high where live-verified, medium where pilot/small-corpus)

| Evidence | Source + method | What it shows | Label |
|---|---|---|---|
| 12 products live (Claude Code, Codex, OpenCode, Aider, Cline, Roo, Cursor, Windsurf, Zed, OpenHands, SWE-agent, Herdr 0.8.2 multi-pane) | R001 HEAD 202 via `curl -I` 2026-09-02 | Each primitive exists somewhere; gap is integration/policy, moat near-zero standalone — T4 fails | **FACT** |
| 67 GH issues/PRs (262 fetched → 67 retained, 28 repo-filtered queries) + 15-source R002, all URL+quote in `evidence.md` | F01 + R002 | Existence + severity of PM-1–PM-8 for affected users; cross-repo recurrence; no population prevalence | **EVIDENCE** |
| Fix PRs that *add* verification/trust (e.g., `auto-test` #5610, `IDELedger` #13155, `hub-managed plugins` #13652, `trust-adapter` proposals 3× same week, `allowHeadless` 11 comments) | F01 | Pains are harness-solvable — they already ship as harness code — but piecemeal | **FACT** |
| Opposite polls on proactivity vs permission spam | F01 #13753 vs #13101 | Heterogeneity — ideal verification friction varies by user/task | **FACT** |
| Loops/hangs with no logs; ReportFindings 6-comment loop; doubled-prefix; unknown MCP tool opaque | F01 #13750, #13492, #5112, #12977 | High-severity, blocking or silent-incorrectness episodes inside mature harnesses | **FACT** |
| "Add file discards all changes" (4 comments), "rolls back manual changes" (2) | F01 #3581, #3965 | Regression/state-loss data-loss mode | **FACT** |
| `Progress signal while args stream` (2 products, same symptom) | F01 #46734/#46733 | Steerability gap is harness-fixable | **FACT** |
| Current retry → 0/5 recovery, ~2.97× median tokens, 2.08× latency (powered partial n≈7) | `research/experiment/scale/partial-run.md`, D-005 | Generic tail fails; cost guardrail violated | **EVIDENCE** (not market) |
| Pilot n=5 synthetic: candidate 100% vs baseline 80% (+20pp), Wilson 37.6–96.4% vs 56.6–100% overlapping; median 1.28× (per-retry 2.05× at edge), regression 0, reliability 3/3 | F02 | Mechanism feasible (1 recovery via gate+worktree), not powered for claim; synthetic overestimates, no multi-file/retrieval | **EVIDENCE** (feasibility only) |
| Phase 2D contamination: 429 `FreeUsageLimitError` misclassified as `EMPTY_OUTPUT`, blind retried, amplified cost | `research/phase2d/analysis/provider-failure.md`, D-007/D-008 | Provider ≠ model; fix is classification + zero-cost stop, not more retries | **FACT** |
| Harness fixed (unit-tested classifier, never blind-retry 429, zero tokens on provider failure) | `research/phase2d/harness.py`, `test_harness_classification.py` | Contamination root cause removed; not yet rerun at scale | **DECISION** |
| No incumbent reports regression cost/reliability/recovery Pareto | R005 (all ignore cost/reliability/regression) | Verification is policy gap, not capability — no Pareto scorecard productized | **FACT** |
| Benchmark blind spot: Lite filters remove multi-file/>3-hunk/file-create | R005 | Real tasks where agent most often fails/regresses are excluded — limits generalizability | **FACT** |
| Enterprise BYOK/ZDR/sandbox productized | R006 E07, F04 | Buyer pressure for trust exists; but *preferred* fix is approved cloud with ZDR/BYOK, not pure-local | **EVIDENCE** |
| Continue archived read-only; packaged local agent fragile | R006 E05, F04 | Local-first as primary wedge not justified (T3) | **FACT** |
| Thin reproduction 250–350 LOC MCP, <100 LOC hook, 150–200 LOC Herdr plugin — single dev <1 week | F04 desk construction (bounded by inspected `commandcode.integration` + scaffolder) | Wrapper moat near-zero standalone; extension cheap | **FACT** spec, **INFERENCE** timeline (<2 weeks desk, not measured build) |

### Evidence strength disclaimer

**EVIDENCE:** Corpus (67) proves *existence* and *severity for affected users* (Medium-High). **HYPOTHESIS:** No statement about share of all agent users affected — `No reliable evidence found` for prevalence, magnitude, or willingness-to-pay (`docs/01-research.md` gaps, `docs/05-product-thesis.md` Open Questions 1–4). Fix PRs inflate verification/privacy counts; recent 2026 window only; synthetic pilot overestimates success/noise underestimates cost vs real SWE-bench; OpenCode docs shell truncated (Low confidence where JS-rendered).

---

## 6. Unmet need

**INFERENCE — The gap is not "lack of tools" but "lack of enforced policy that ties tools into a measured loop":**

Existing workflows give developers *all the parts* — `git worktree`, `bash`/`pytest`, `ripgrep`/Tree-sitter, MCP, Herdr panes, Claude Code headless — but no deterministic, reusable contract that says:

1. **Isolation before mutation** — every attempt in a linked worktree/branch with no cross-task mutation, snapshots at `7b9850d`-like pristine commits (F02 both arms kept regression 0 when isolated — **EVIDENCE** that isolation helps; **INFERENCE** that it must be *enforced* product policy).

2. **Gate that blocks merge on red/regression and makes every run observable** — `spec → tests → gate (run_tests) → parse (JUnit/TAP) → feedback → retry cap 2 → block merge on red/regression`, separate `test_regression_*` from task success (SWE-bench Verified pattern), Pareto scorecard `% resolved | regression | median cost | time | reliability | recovery` on Verified n≥30 + rolling split (R005 gap — **FACT** no incumbent does this, **EVIDENCE** no benchmark reports regression/human-intervention).

3. **Failure-aware bounded recovery** — classify `PROVIDER_RATE_LIMIT`/`AUTH`/`NETWORK`/`INFRA` vs `EMPTY_OUTPUT`/`PATCH_INVALID`/`WRONG_FILE` vs `TEST_FAILURE`/`REGRESSION`/`OTHER` (taxonomy `context/terminology.md`, D-008), cheapest safe action per class (apply-check stderr → format hint = no Docker; unknown-tool rejection; file-scoped correction; targeted `pytest -k` evidence → minimal context, not full statement), retry cap 2, escalation conditions — **HYPOTHESIS** (§7) pending Phase 2D layered design gate (`>current recovery AND ≤1.5× cost/latency AND regression non-inferior`, n=7).

**INFERENCE — Why existing tooling does not fill this despite primitives being present:** Each harness fixes one symptom singly (TUI buffering PR, allowHeadless PR, doubled-prefix guard PR) — no product bundles them as a coherent verification/steerability layer. MCP 2025-06-18 + ACP + `PostToolUse`/`Stop` hooks + Herdr plugin system make composition *possible* in <2 weeks, but *no one has shipped* the gate as a first-class primitive — that is the whitespace (`docs/02` §7).

**INFERENCE — What remains intentionally *not* unmet (to avoid over-scoping):** Persistent multi-agent teams (0 of 67 requested teams; ChatDev/MetaGPT +19pp at 3–10×, no SWE-bench A/B — `R003`), pure-local 8GB-first (runtime exists, ZDR/BYOK satisfies broader market, no bench — `R006`), custom vector DB/AST editing (mature baseline ripgrep+Tree-sitter sufficient; conditional `R004`), standalone multiplexer (Herdr already occupies — `F03`). These belong in Experimental until T1–T4 pass.

---

## 7. Value hypothesis

**HYPOTHESIS (to be tested, not claimed):** A verification-first layer that sits *around* an existing agent and turns work into `specification → execution → deterministic verification → structured evidence → bounded recovery → proof` — with worktree isolation, JSONL ledger, and cost/reliability/regression observability — will recover more failures at acceptable cost/latency than the current approach (full suite → generic feedback → full-context retry), when shipped as thin host-native extension(s) reusing mature primitives.

**HYPOTHESIS — Mechanism:** Layered verification (L1 apply-check → L2 targeted `pytest -k` → L3 regression) spends expensive verification only when cheaper layers pass; targeted evidence (test name + assertion + file:line + 20-line traceback) enables minimal corrective context without replaying the entire problem context — Phase 2C showed full-context replay drives 176k `cacheRead` per pi call without recovery. **EVIDENCE** for cost of current path; **HYPOTHESIS** for layered advantage.

**HYPOTHESIS — User value if proven:**

- **Fewer manual takeovers** on PM-2 (hangs) and PM-1 (heterogeneous gate) — bounded recovery (cap 2) + `Stop` keep-alive + progress signal prevents indefinite loops that currently require `ctrl+c`.
- **Less silent incorrectness** on PM-3 — doubled-prefix / unknown-tool guardrails with parse error for retry reduce opaque edits before they reach review.
- **No lost work** on PM-4 — worktree per task prevents "discards all changes" class; regression gate (`PASS_TO_PASS` vs `FAIL_TO_PASS`) prevents "fixed task, broke suite" from merging.
- **Cheaper recovery** on PM-8 — layered targeted steps at edge cost without 2.97× blow-up.
- **Observable trust** on PM-5 — opt-in governance proxy pattern (allowHeadless precedent) for enterprise without local-only religion.

**HYPOTHESIS — Minimal "cheapest safe" recoveries (conceptual, not shipped):** Per `docs/07-recovery-policy.md` matrix: `PATCH_INVALID` → format hint + L1 (~0.1s); `EMPTY_OUTPUT` → format constraint (no Docker); `WRONG_FILE` → optional diff-only review/file-scope (~20k tokens); `TEST_FAILURE` → targeted L2 evidence; `REGRESSION` → revert/isolated fix; `TIMEOUT` → reshape context; `PROVIDER_RATE_LIMIT` → **Stop, zero tokens, no retry** (D-008). No per-class measured benefit invented.

---

## 8. Disqualifying evidence

**EVIDENCE — Evidence that weakens or disqualifies the product hypothesis if it stays unanswered:**

- **Population prevalence / WTP unknown (strongest disqualifier — FACT gap):** `No reliable evidence found` for share of users blocked or willingness to pay for verification/MCP trust vs `Claude Code + git worktree` directly. Corpus 7–21% is *corpus only*. Without survey n>100 + 5 regulated-enterprise interviews, market claim stays **Low** (`docs/05-product-thesis.md` Open Questions, `docs/03-problem-space.md` §E, `docs/01-research.md` §Gaps). **HYPOTHESIS:** wedge could be vocal-minority only.

- **Powered Pareto not shown (strong disqualifier if T1 fails — EVIDENCE gap):** Pilot n=5 is feasibility, not decision — Wilson CIs overlapping; n≈300/arm needed for 10pp at p≈0.5. **DECISION** D-010: do not scale to n=30 powered run until Phase 2D design gate passes cleanly. If candidate fails `≥10pp at ≤2× cost/latency with regression ≤` (non-overlapping CI), **kill orchestration as CORE** (keep community plugin only); at n≥100 failure → **permanent KILL** on verification as CORE (`docs/05-product-thesis.md` Kill Criteria T1).

- **Current retry is not worthwhile (EVIDENCE):** 0/5 recovery at ~2.97× median tokens — proves naive retry is harmful. If layered also fails `>current AND ≤1.5×` at n=7, naive recovery is not saved by structure — design hypothesis weakened.

- **Provider contamination (FACT) proves blind retry amplification is harmful:** 429 → `EMPTY_OUTPUT` misclassification + 3× blind retries burned quota while provider stayed rate-limited (D-007). Any model without failure-class separation is disqualifying — fixed in harness (D-008) but not yet rerun at scale.

- **Lite filters hide LACE's slice (FACT):** Benchmark removes multi-file/>3-hunk/file-create — precisely where `WRONG_FILE` / multi-file failure-aware recovery would show value. Weakens generalizability of any incremental gain measured only on filtered tasks.

- **Standalone defensibility fails (EVIDENCE):** 250–350 LOC MCP + <100 LOC hook + 150–200 LOC Herdr plugin reproducible in <1 week (F04 desk construction, T4 fails for standalone). Wrapper moat near-zero — publishing reusable research without a product would be more defensible than shipping a standalone binary (D-002).

- **Heterogeneity disqualifies one-size friction:** Opposite polls mean any fixed "always block" or "always proactive" gate annoys half the corpus — **EVIDENCE** that gate must be configurable (opt-in governance, allowHeadless pattern), not mandatory.

- **Herdr as CORE not justified (EVIDENCE):** Herdr live snapshot is `FACT` (Material advantage on ergonomics/observability), but T2 `>30% time-to-green or >50% fewer interventions (n≥20)` is **untested** — D-003 keeps Herdr OPTIONAL until measured.

- **Multi-agent / local-first / 8GB as wedge not justified (EVIDENCE):** ChatDev/MetaGPT gains via SOPs+feedback not agent count, high variance on SWE-bench (`01-research-synthesis.md` §10). `No reliable evidence found` that collaboration state juggling solves `STATE_LOSS` (R002 gap). Killing those bets is already **DECISION** D-004.

---

## 9. Open questions

**All `No reliable evidence found` after `curl`+GH/HN APIs (no `tavily`/`exa`), per `docs/01-research.md`:**

1. **Population prevalence / willingness-to-pay — HYPOTHESIS gap:** What share of agent users (Stack Overflow/JetBrains survey n>100 + 5 regulated-enterprise buyer interviews) rank collaboration/persistence vs reliable single-agent + verification + price sensitivity, and what price calibrates against BYOK/ZDR? *Method:* survey + interviews; *gate:* market-sizing before GO.

2. **Powered verification Pareto — EVIDENCE gap:** Does layered recovery beat current at `≤1.5×` cost/latency with regression non-inferior (n=7 design gate), then `≥10pp at ≤2× with regression ≤` at n≥30 (prefer 100+) same-model Verified/Lite with standardized mini-SWE-agent harness, rolling post-cutoff split, real tiktoken `$/1K` + 95% CI? *Method:* Phase 2D clean + powered-30 harness (`research/phase2d/protocol.md`, `research/experiment/protocol.md`); *gate:* T1.

3. **HerdrDelta measured — FACT gap (live snapshot exists, experiment not):** Does `tmux+worktree+agent` vs `Herdr+worktree+agent` vs plugin show `>30% time-to-green or >50% fewer manual interventions` (n≥20, T2)? *Method:* pre-registered timed HerdrDelta; *gate:* T2.

4. **Timed replication spike (T4 measured) — FACT gap (desk estimate only):** Can a team actually add ledger+gate to Claude/OpenCode via MCP in <2 weeks with cost/delta measured? *Method:* 2-week time-boxed build of MCP + Claude plugin + Herdr variant; *gate:* T4 (standalone already fails on desk — measure extension moat).

5. **OpenCode plugin manifest + real pricing — Low confidence path (JS-rendered):** Astro SSR shell truncated, pricing bodies JS-rendered — `No reliable evidence found` in sandbox. *Method:* rendered fetch; *gate:* not product-critical.

6. **Local-vs-cloud quantified gap + 8GB rig — Direction High, magnitude Low:** No SWE-bench table for Qwen 14B Q4 / DeepSeek Lite vs frontier, no 8GB tokens/sec harness. *Method:* 8GB bench + controlled local vs frontier A/B; *gate:* T3 (`≥40%` pure-local mandatory`).

7. **File-ownership / concurrency under parallel agents — FACT gap:** No evidence retrieved (F03/F04 gap) — parallel interference unmeasured. *Gate:* keep multi-agent EXPERIMENTAL.

8. **Minimum feedback payload — HYPOTHESIS gap (docs/07-recovery-policy.md):** What is the minimum evidence (test name? +assertion? +20-line traceback? +hunk?) that enables recovery without full problem statement, and when does optional reviewer (`WRONG_FILE`) pay for itself vs an extra targeted retry? *Method:* Phase 2D feedback-extraction arm variants; *gate:* design refinement.

*Until 1–4 are measured, treat GO claims as unproven — correctly classed as `HYPOTHESIS` in `docs/05-product-thesis.md` and `context/brain.md`.*

---

## 10. Product implication

**DECISION — Current posture remains PIVOT (not GO/KILL):** Narrowest defensible hypothesis that survives validation is the thin **verification-first harness** — deterministic verification, loop/progress guardrails, and observable cost/reliability/regression — shipped as **MCP server `lace-ledger` + Claude Code plugin `lace-gate` (skill + `PostToolUse`/`Stop` hooks), with Herdr plugin `lace-herdr` as deployment variant**, sharing the same verification core (worktree + JSONL ledger + gate parser) — `docs/05-product-thesis.md`. Standalone defensibility already fails (T4), Herdr as CORE unproven (T2), pure-local as wedge rejected until T3 — do not rebuild those.

**INFERENCE — What to do next (research-driven, not feature-driven):**

- **Do not scale to n=30** until Phase 2D design gate passes cleanly on the frozen harness (classification fix + `__pycache__` hygiene + provider quota available) — D-010.
- **Run Phase 2D clean** (n=7, same manifest/protocol, resume-safe) → evaluate `recovery_layered > recovery_current AND median tokens/latency ≤1.5× AND regression non-inferior`. If not met, kill orchestration as CORE or refine feedback caps before any powered run — per `docs/07-recovery-policy.md` matrix (global cap 2, per-class caps 0–2, escalation conditions).
- **If design gate passes,** run powered-30 with real tiktoken billing + regression split + rolling post-cutoff → evaluate T1. If T1 fails at n≥30 → kill orchestration as CORE (community plugin only); at n≥100 → permanent KILL on verification as CORE. If all T1–T4 fail → permanent KILL, publish reusable assets (`research/F01`–`F04` corpus + pilot repo/harness, `07-recovery-policy.md` matrix).
- **In parallel, close the sizing gap:** n>100 survey (Stack Overflow/JetBrains splice + 5 regulated-enterprise interviews) ranking verification/reliability vs collaboration/persistence vs price — the single cheapest way to move market confidence from Low to Medium without burning benchmark quota.

**INFERENCE — What *not* to build regardless of pain:** Feature lists, multi-agent orchestration, standalone multiplexer, custom bus/parser, vector DB over Tree-sitter+ripgrep baseline, 8GB-first promise, ACP-as-primary — all pre-ruled by evidence (`docs/03-problem-space.md` §E, `docs/05-product-thesis.md` Non-Goals, D-002/D-004) and none address PM-1–PM-8 more cheaply than the gate.

**INFERENCE — Why this matters even if "just use CLI + git + CI":** For 90% of tasks, that *is* sufficient (`docs/02` §6 `INFERENCE`, R007). The verification-first extension earns its existence only for the ~10% where trust/reversibility/pareto matter — and where the Pareto win would have to be *proven* at scale before anyone should switch. The PIVOT is the hypothesis that measures whether that 10% is real, worthwhile, and cheap enough to own as glue.

---

## Traceability

- Pains PM-1–PM-8: `docs/03-problem-space.md` A1–A5 + B1–B3 (F01 67 + R002 15, all `evidence.md` with URL+date+quote) + `docs/01-research.md` §2/§7/§Gaps
- Severe + harness-solvable split: `docs/03-problem-space.md` §D (Almost entirely vs Partially harness), `docs/01-research.md` §2
- Current not-worthy / contaminated: `context/brain.md` Validated State table (0/5, ~2.97×, 429→EMPTY_OUTPUT), `context/decisions.md` D-005–D-008/D-010, `research/phase2d/analysis/provider-failure.md`
- Candidate wedge + kill criteria: `docs/05-product-thesis.md` (Primary Wedge 1–3, Supporting, Non-Goals, Success/Kill T1–T4, Open Questions), `context/experiment-rules.md` (Frozen params, scaling gate)
- Recovery model + policy matrix: `docs/06-recovery-model.md` (Layers 1–3, optional reviewer), `docs/07-recovery-policy.md` (12-class matrix, global cap 2, escalation)
- Competitive existence + whitespace: `docs/02-competitive-landscape.md` (12 live 2026-09-02, ReAct/MCP/Tree-sitter mature reuse, §7 whitespace: gate + Pareto + trust proxy)
- Moat/whitespace nuance: `research/reports/05-verification-competitive-gap.md` (six genuinely uncommon gaps), `research/reports/06-adversarial-product-test.md` (§5–§6 time-saved/hostile bar)

---

PRODUCT SIGNAL:
PROMISING
