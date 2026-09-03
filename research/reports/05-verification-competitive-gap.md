# Verification Competitive Gap — LACE

**Date:** 2026-09-03 · **Scope:** verification loops · failure diagnosis · retry/recovery · test-aware repair · cost/reliability observability · structured execution evidence
**Sources:** first-party docs/specs/repos (R001 HEAD 2026-09-02 12/12 live, F04 E01–E09/E11–E14), GH corpus F01 (67 issues, 262 fetched → 67 retained), R003–R006 papers/benchmarks, F02 pilot `research/F02/pilot/`, `docs/02-competitive-landscape.md`, `docs/05-product-thesis.md`, `docs/06-recovery-model.md`, `context/brain.md`, `context/terminology.md`
**Constraints:** No code modified. No benchmarks run. No model/provider quota beyond current session. No new live fetches — relies on existing research artifacts + training-cutoff knowledge (2026-01-04).
**Thesis guardrail:** Do not change product thesis (PIVOT — verification-first extension hypothesis). This report is descriptive gap analysis, not a scope expansion.
**Epistemic labels:** `FACT` | `EVIDENCE` | `INFERENCE` | `HYPOTHESIS` per `context/terminology.md`.

---

## 0. Method & Confidence

**FACT:** Competitor set tracked in LACE = 12 products verified HEAD 2026-09-02 (R001 E01–13): Claude Code, Codex, OpenCode, Aider, Cline, Roo Code, Cursor, Windsurf, Zed, OpenHands, SWE-agent, Herdr (multiplexer). Herdr 0.8.2 live snapshot (protocol 20, 3 workspaces, 11 panes, 5 integrations) in F03.

**EVIDENCE:** Capability claims weighted per R001 source hierarchy: 1 official docs/specs > 2 official repos > 3 GH issues > 4 benchmarks > training-derived sentiment (Low). F01 GH corpus (67) provides cross-repo pain taxonomy with URL+quote in `research/F01/evidence.md`. F04 provides first-party spec quotes for MCP 2025-06-18, Claude Code hooks/skills/MCP/headless, Herdr plugin manifest + socket API.

**Limit:** **FACT:** No new live doc re-parse or GH/HN search in this task (by instruction: no benchmark, no quota). Where live page was JS-rendered or truncated (OpenCode docs shell E15, Cursor/Windsurf pricing, OpenAI Verified blog body R005 E05), this report carries **Low** confidence and states `No reliable evidence found` rather than inventing screenshots/numbers — per `docs/01-research.md` discipline.

**Reading guide:** A capability is **first-class** only if shipped as product primitive (documented feature, UI, or default workflow) — not merely invocable via `bash` or an undocumented hook. **Possible via hooks/plugins/MCP** = achievable with host-native extension in <2 weeks per F04 desk construction, but not productized. **Genuinely uncommon** = absent as first-class in all 12 incumbents *and* absent from their benchmark scorecards *and* not evidenced as user demand satisfied in 67 GH corpus.

---

## 1. Which Capabilities Are Already First-Class?

*Short answer: basic execution primitives are first-class everywhere; the six focus capabilities are not — except narrow slices of logging and shell test execution.*

| Focus capability | Verdict | Evidence & label |
|---|---|---|
| **Execute tests via shell** | **FACT: First-class as tool, not as gate.** Every harness exposes `bash`/`run` that can invoke `pytest`/`npm test`. Claude Code "reads codebase, edits files, runs commands, integrates with tools" [R007 E03]. Aider documents `--auto-test` for headless verification [F01 #5610, `research/F01/evidence.md` #63]. OpenHands/SWE-agent run inside Docker/sandbox that can execute full suites. | **EVIDENCE:** F01 shows fix PRs *adding* auto-test (support #5610) — proves it was missing as product primitive and added piecemeal. **INFERENCE:** Running tests is first-class; *blocking merge on red/regression* is not (see §3). |
| **Structured execution evidence (trajectory/log)** | **FACT: First-class as raw log.** JSONL trajectory is productized in OpenHands, pi, Herdr (`session.json` v3, `research/F03/evidence.md` F03 E10, F04 ledger note). Herdr provides `pane read` (4 modes), `api snapshot`, agent states `working/blocked/done/idle/unknown` + `agent_prompt_stalled` 5s [F03 E07/E14, F04 E13]. Claude Code ships `CLAUDE.md` memory + compaction + `claude -p --output-format stream-json` [F04 E09]. | **EVIDENCE:** F01GH issues reference IDELedger/cryptographic ledger proposals (#13155, `research/F01/evidence.md` #64) — desired but not yet product. **INFERENCE:** Raw JSONL + pane lifecycle is first-class; *structured failure evidence* (class + test name + assertion + traceback + cost/layer) is not. |
| **Failure visibility (agent stuck/blocked)** | **FACT: First-class in Herdr only, as multiplexer signal.** Herdr exposes `agent prompt --wait`, `pane wait-output --match/regex`, `wait 5-sec lifecycle` [docs/02 §3, F03 teardown]. Cline surfaces loop/hang as terminal output but no structured signal [F01 #13492 6-comment loop, #13750 hang no logs]. | **INFERENCE:** Visibility of *pane blocked* is first-class in Herdr; classification of *why* it failed is not productized anywhere. |
| **Token/cost display (single-run)** | **EVIDENCE: First-class as single-run counter in several CLIs.** Cline/Roo/Aider/OpenHands report per-run tokens/cost opportunistically. | **FACT:** No incumbent publishes the Pareto triplet (`% resolved | regression | median cost | median latency | reliability pass@3 | recovery`) on a reproducible harness — R005 gap explicitly, `docs/02` §7. **INFERENCE:** Single-run cost ≠ cost/reliability observability as defined here. |
| **Repo search / context for repair** | **FACT: First-class.** Claude Code/Aider/Cursor ship repo-map/BM25/Tree-sitter/ripgrep indexing as core [docs/02 §3, R004 mature reuse]. | **INFERENCE:** This serves execution, not test-aware repair feedback — conflating the two overclaims. |

**Bottom line for Q1 — `INFERENCE`:** For the six focus capabilities *as product features* (gate, diagnosis, bounded recovery, test-aware patch, Pareto observability, structured ledger), **none is first-class in any tracked incumbent**. What *is* first-class are the substrate primitives they compose: `bash` test execution, file edits, lexical search, raw JSONL logs, and (only in Herdr) pane lifecycle. The remaining gap is the *policy* that binds those primitives into a product.

---

## 2. Which Capabilities Are Merely Possible Through Hooks/Plugins/MCP?

*Short answer: all six are demonstrably composable today with host-native extension glue — F04 desk-constructs each in 150–350 LOC, single dev <1 week (Medium-High confidence, not a measured build).*

| Focus capability | How it is "merely possible" today (host-native) | First-party surface that enables it | Confidence |
|---|---|---|---|
| **Verification loop (spec→tests→gate→parse→feedback)** | Claude Code `PostToolUse Edit|Write → gate.sh` + `Stop → gate_check.sh` hooks that deterministically run `git apply --check` / `pytest -k` / full suite and block on non-zero exit [F04 E06/E08] | **FACT:** Claude Code Hooks guide E06: "Hooks are user-defined shell commands … gives you deterministic control … Events include `PostToolUse`, `Stop`, `SessionStart`" — example shows `jq -r '.tool_input.file_path' | xargs prettier`. Plugins E08: `.claude-plugin/plugin.json` + `skills/<name>/SKILL.md` + `--plugin-dir` test. Headless E09: `claude -p --bare --mcp-config --output-format stream-json`. | **High** spec, **Medium-High** <100 LOC bound (F04) |
| **Failure diagnosis (classify provider vs model vs verification vs infra)** | `PostToolUse`/`Stop` hook parses JSON stream stderr for 429/`FreeUsageLimitError`/auth/timeout vs empty patch vs `TEST_FAILURE`/`REGRESSION`; taxonomy in `context/terminology.md` + `docs/06-recovery-model.md` §C | Same hooks + `context/brain.md` failure separation DECISION (D-008). Herdr `agent explain` / `api snapshot` provides pane state but not class. | **High** taxonomy exists; **Medium** harness implementation not yet re-measured at n=7 after D-008 fix |
| **Retry/recovery (bounded, evidence-driven)** | Headless loop `claude -p --bare --mcp-config lace.json` that on gate failure extracts `parse_failures(result)` (test name + assertion + traceback tail ≤800 chars) and re-prompts with minimal context, cap 2 retries — exactly F02 candidate arm + `docs/06-recovery-model.md` §D | Headless E09 (`-p` non-interactive, `--mcp-config`, exit code) + MCP tools `gate_run`/`gate_parse` + `git worktree add/remove` (mature per R004) | **Medium-High** feasibility proven F02 pilot (1 recovery via gate at 2.05× per-retry cost, regression 0), but Wilson CIs overlapping 37.6–96.4% vs 56.6–100% [F02 P04–P09] — **HYPOTHESIS** until n≥30 Verified |
| **Test-aware repair (targeted FAIL_TO_PASS → regression)** | **Layered verification** (Phase 2D): Layer 1 `git apply --check` (~0.1s), Layer 2 `pytest -k <FAIL_TO_PASS>` (~80s targeted), Layer 3 full/PASS_TO_PASS regression — only spend Layer 3 when Layer 2 passes [`docs/06-recovery-model.md` §E, `research/phase2d/protocol.md`] | Same hooks + MCP `gate_parse` returning structured evidence per layer; AiderSEARCH/REPLACE + `git apply` mature per R004 | **High** spec exists; **Medium** Layered not yet proven at n=7 (contaminated Phase 2D discarded D-007) |
| **Cost/reliability observability (Pareto scorecard)** | MCP server `lace-ledger` exposing `ledger_append`/`ledger_read` backed by JSONL/SQLite; Pareto logger records `% resolved | regression | median cost (tiktoken→$/1K) | median latency | pass@3 | recovery` per R005 §7 + F02 metrics | MCP spec E01/E03 (`modelcontextprotocol/typescript-sdk` over stdio/Streamable HTTP, JSON-RPC 2.0), ledger Resources pattern like pi/herdr trajectories [F04] | **High** MCP spec, **Medium-High** 250–350 LOC bound (F04) |
| **Structured execution evidence (worktree-isolated ledger)** | `git worktree add ../worktrees/<run_id>/<task> @7b9850d` per task + JSONL ledger append on every gate verdict (patch stderr, test name, traceback excerpt 20 lines, tokens, latency, layer reached) — F02 harness invariant | `git worktree` + JSONL + MCP Resources + Claude `AskUserQuestion`/`CLAUDE.md` memory (reuse, not build [R004]) | **High** mature reuse, **Medium** ledger policy not yet shipped as extension (F04 desk estimate only) |
| **Deployment via Herdr pane** | `herdr-plugin.toml` (`[[panes]] id="verify" command=["sh","scripts/verify.sh"]`) + `scripts/verify.sh` (`git worktree add + herdr notification show`), socket API `herdr api snapshot/schema` [F04 E11–E14] — copy of `commandcode.integration` 46 LOC TOML + 3 sh = 150–200 LOC | **FACT:** Local filesystem E11–E13: `id="commandcode.integration"`, `[[panes]]`, `[[actions]]`, `herdr.sock`, `session.json` v3, plugin managed via `plugins.json` `github:` source | **High** shape, **Medium-High** <1 week |

**Common pattern — `INFERENCE`:** Each focus capability is one thin glue layer on top of a mature primitive: mature = ReAct, MCP, `git worktree`/`apply`, ripgrep/BM25/Tree-sitter, JSONL, containers [R004, docs/02 §6]. The host already exposes the hook to attach the glue (Claude hooks, MCP servers, Herdr plugin panes). Therefore any team can add ledger+gate in <1 week desk-construction (F04) — validated as `HYPOTHESIS` pending timed 2-week spike (T4 measured, D-010).

---

## 3. Which Gaps Appear Genuinely Uncommon?

*Uncommon = absent as first-class in all 12 incumbents AND absent from benchmark scorecards AND not evidenced as "solved" in the 67-issue corpus. These are the only candidate whitespace.*

### 3.1 Genuinely uncommon (High confidence where spec/gap is official)

1. **Deterministic verification gate that blocks merge on red/regression as product primitive**
   - **EVIDENCE:** docs/02 §3: "No one does verification as first-class product primitive … All delegate to `bash` or Docker adhoc" — SWE-agent/OpenHands sandbox is closest but not a gate. F01 21% verification-burden corpus with opposite polls (`BE HELPFUL AND PROACTIVE` #13753 vs permission spam #13101) proves heterogeneity — one friction level fits none. **FACT:** F04 shows gate as 1 hook (<20 LOC) on top of Claude Code [F04 §6] — cheap precisely because no incumbent productized it.
   - **Label:** `EVIDENCE` for gap existence; `INFERENCE` that it is the primary wedge (validated for affected users, Medium-High severity).

2. **Cost-adjusted reliability transparency (Pareto scorecard)**
   - **EVIDENCE:** R005: leaderboards report `% resolved` alone, ignoring regression/cost/latency/reliability/recovery/context — need "minimum viable report: `% resolved | regression rate | median cost | median time | reliability (σ/pass@3) | recovery rate`. Rank by Pareto frontier" [R005 §7]. SWE-bench Verified standardizes on mini-SWE-agent but still does not report this tuple [R005 E02 vs synthesis]. **FACT:** No incumbent publishes this per-run on Verified n≥30 + rolling post-cutoff split for contamination [R005, F02 pilot gap].
   - **Label:** `FACT` for benchmark gap; `INFERENCE` for product opportunity (durable differentiator only if LACE actually publishes numbers after powered run — docs/02 §7 warns it is "not yet proven").

3. **Regression gate separate from task success (`test_regression_*` must stay green)**
   - **EVIDENCE:** R005 Lite/Verified filtering + F02 pilot separate `PASS <task_test>` from `PASS test_regression_simple` with worktree isolation (`research/F02/pilot/harness.py` baseline vs candidate). Incumbents report single pass/fail; no benchmark reports regression rate [R005 §6]. F01 regression/state loss 10% ("discards all changes" 4 comments #3581, rollback #3965) proves user cost when missing.
   - **Label:** `EVIDENCE` for absence; `INFERENCE` for severity ranking (Medium for existence, Low for population prevalence).

4. **Failure-class separation with non-retryable provider handling (provider ≠ model ≠ verification ≠ infra)**
   - **EVIDENCE:** `context/brain.md` DECISION D-007/D-008 + `context/terminology.md` taxonomy + `docs/06-recovery-model.md` §C: provider `PROVIDER_RATE_LIMIT` (429, `FreeUsageLimitError`) must **Stop**, not blind-retry; contaminated Phase 2D misclassified 429 as `EMPTY_OUTPUT` and amplified cost [research/phase2d/analysis/provider-failure.md]. **FACT:** No incumbent harness documents this separation as product policy; all delegate to generic retry.
   - **Label:** `FACT` for classification requirement (from logs); `EVIDENCE` that blind retry is harmful (Phase 2C ~2.97× median tokens, D-005).

5. **Layered verification ordering (cheap apply-check → targeted FAIL_TO_PASS → regression)**
   - **EVIDENCE:** `docs/06-recovery-model.md` §E core principle "Do not spend expensive verification or context until cheaper evidence says necessary" — addresses Phase 2C observation (generic 800-char tail → 0/5 recovery at 2.97×). R004 marks verification loop mature but orchestrator not productized. F02/F04 show each layer is trivial (`git apply --check` ~0.1s, `pytest -k` single test) yet no incumbent exposes it as ordered gate.
   - **Label:** `HYPOTHESIS` for layered > current (Phase 2D design gate not yet cleanly measured — D-010); `EVIDENCE` for per-layer cheapness.

6. **Trust / MCP governance as opt-in proxy (off by default, on for enterprise)**
   - **EVIDENCE:** F01 privacy/trust 21% (14/67) with 3 identical trust-adapter proposals same week (Cline #13737, Continue #13212, Aider #5665) + telemetry ships unredacted URLs [F01 #5621], `.env override=True` [F01 #5622], `allowHeadless` 11 comments [#9327] — cross-repo demand. R006 E07: Copilot BYOK/ZDR/sandbox productization proves buyer pressure for the pattern, but **HYPOTHESIS** that no lightweight host-native governance proxy exists for open harnesses (Continue archived read-only warns fragile UX [R006 E05]).
   - **Label:** `EVIDENCE` for demand signal; `INFERENCE` that opt-in proxy is uncommon as product (Medium).

### 3.2 Gaps that are NOT genuinely uncommon (common as substrate)

- `git worktree` isolation, JSONL trajectory, `git apply`/diff, ripgrep/BM25 search, Tree-sitter parsing, container sandbox — **all mature reuse per R004**, available everywhere — not whitespace.
- Basic ReAct loop, Plan→Act mode, `CLAUDE.md`/`AGENTS.md` memory — baseline loop ubiquitous [R004 E01 +34% ALFWorld].

---

## 4. Which Proposed LACE Capabilities Are NOT Differentiated?

*Each row is a LACE-proposed capability from `docs/05-product-thesis.md` Core/Supporting + `docs/06-recovery-model.md` + `docs/06-validation-prototype.md`. Verdict = whether it survives the gap test above.*

| LACE capability (proposed) | Differentiated? | Why not (with label) |
|---|---|---|
| **`git worktree` isolation per task** | **No — not differentiated** | **FACT:** `git worktree` is mature git primitive; Herdr `worktree` is thin wrapper over it [F03 teardown]. LACE reuses it (F02 worktree vs tmpdir isolation) — same mechanism as `git worktree add` directly. Overlap ~80% if shipped as runtime [docs/02 §6]. **INFERENCE:** Value is policy (enforce isolation), not primitive. |
| **JSONL ledger (append/read, handoff)** | **No — not differentiated as primitive** | **FACT:** JSONL trajectory is mature (OpenHands/pi/herdr) [R004, F04]. F04: MCP server ledger = Resources + Tool history backed by JSONL/SQLite like `pi`/`herdr` — 250–350 LOC desk [F04 E03/E09]. **INFERENCE:** Differentiated only when ledger stores *structured failure evidence + Pareto tuple* (see §3 gaps); file logging alone is commodity. |
| **Repo search / indexing (ripgrep/BM25/Tree-sitter)** | **No — not differentiated** | **FACT:** R004 marks Tree-sitter/ripgrep/BM25 mature reuse — "Do not build custom bus/parser/vector DB; reuse primitives; build minimal loop+dispatcher + repo-map ranker + verification orchestrator; defer embeddings/AST" [R004 §5]. **INFERENCE:** Embedding index as core is explicitly rejected until measured gap appears. |
| **Running tests via `bash` / Docker** | **No — not differentiated** | **FACT:** Every harness already does this; SWE-agent/OpenHands sandbox is closest to verification but still adhoc `bash` [docs/02 §3]. **INFERENCE:** Not a wedge — the wedge is the *gate that blocks on red/regression* (see §3.1). |
| **Basic retry / self-repair loop** | **No — not differentiated as mechanism** | **EVIDENCE:** Phase 2C "full suite → generic 800-char tail → full-context retry" yielded 0/5 recovery at ~2.97× median tokens, D-005 [context/brain.md]. F02 pilot shows same-model retry *can* rescue one bug via parse→feedback at edge cost (2.05× per-retry) but Wilson CIs overlap [F02 P04–P09]. LiveCodeBench already measures self-repair as capability [R005 E10] — not unique to LACE. **INFERENCE:** Retry alone is not differentiated; *targeted layered evidence + minimal context* is the candidate differentiator (still HYPOTHESIS, D-010). |
| **Pareto logging as dashboard** | **Partially — commodity display, rare content** | **EVIDENCE:** Dashboard/pane UI is Duplicates/Thin vs Herdr [F03 teardown: LACE Δ vs Herdr mostly Duplicates except task-level verification + ledger — only **Real** gaps]. **INFERENCE:** A dashboard that merely shows cost is not differentiated; a Pareto scorecard with regression + pass@3 + recovery on Verified n≥30 + rolling split is (see §3.1 #2) — but only if LACE actually publishes it. |
| **Standalone multiplexer / custom bus / custom vector DB** | **No — explicitly not differentiated (kill)** | **FACT:** D-002 permanent kill of standalone binary/multiplexer/bus/vector DB — T4 fails (<2 weeks via MCP per F04). D-003 Herdr optional, D-004 multi-agent experimental. R004 directive "Do not build custom bus/parser/vector DB" [R004 §5]. **INFERENCE:** Shipping these would duplicate Herdr + Claude Code loop + MCP with near-zero moat [docs/02 §6]. |
| **Multi-agent DAG / team orchestration by default** | **No — not differentiated, cost-prohibitive** | **EVIDENCE:** R003: +19pp via SOPs+feedback at 3–10× cost, prototype ceiling, no SWE-bench A/B retrieved — `No reliable evidence found` [R003 E10, docs/02 §5]. 0/67 GH issues requested teams [docs/02 §5]. **HYPOTHESIS:** Must remain EXPERIMENTAL until T1 passes at n≥30 (docs/05 §10). |
| **Progress signal while streaming** | **Weakly differentiated — harness-fixable, not wedge alone** | **EVIDENCE:** F01 9% progress visibility: "no progress signal while tool-call arguments stream" [F01 #46734] + SSE only heartbeats [#46733] — same symptom two products, 4 comments. F03 calls task-level observability only **Real** delta vs Herdr. **INFERENCE:** Fix is necessary (buffer + `pane read` modes + `herdr --handoff`) but alone does not justify a product — bundle with gate to earn wedge. |
| **MCP/ACP transport itself** | **No — not differentiated** | **FACT:** MCP 2025-06-18 is standard ("USB-C for AI", JSON-RPC over stdio/SSE/Streamable HTTP [F04 E01–E02]), ACP is "LSP for agents" (remote WIP) [F04 E04] — LACE reuses TS/Python SDKs. **INFERENCE:** Transport is reach, not moat — per docs/04 §7 "MCP is the right transport, not the product." |

### What remains differentiated after removing the above (`INFERENCE`)

Only the binding layer identified in §3 genuinely survives: **deterministic gate that blocks on red/regression + failure-class separation + layered ordering (cheap→targeted→regression) + Pareto transparency** — shipped as thin host-native extension (MCP server `lace-ledger` + Claude Code plugin `lace-gate` + optional Herdr variant sharing the same verification core) per `docs/05-product-thesis.md` PIVOT. That is ~1% glue on top of incumbents' 99% [docs/02 §6], which is why standalone has near-zero moat and extension's only durable edge is *measured* Pareto on Verified n≥30 + rolling split [R005, docs/04 §9].

---

## 5. Summary Table — First-Class vs Possible vs Uncommon vs Undifferentiated

| Capability | First-class today? | Merely possible via hooks/plugins/MCP? | Genuinely uncommon? | LACE differentiated? |
|---|---|---|---|---|
| **Verification loop (spec→tests→gate→parse→feedback→block)** | No — all `bash`/Docker adhoc [docs/02 §3] | **Yes — Claude hooks PostToolUse/Stop <20 LOC** [F04 E06] | **Yes — #1 gap** | **Yes — primary wedge** (see §3.1 #1) — but `HYPOTHESIS` until T1 n≥30 |
| **Failure diagnosis (provider/model/verification/infra classes)** | No (Herdr blocked/working is not class) | **Yes — parse pi JSON stream + 429/auth/timeout taxonomy** [D-008] | **Yes — #4 gap** | **Yes — as gate policy** (if non-retryable provider Stop enforced) |
| **Retry / recovery (bounded, evidence-driven)** | No (generic loop exists, not bounded/targeted) | **Yes — headless `claude -p --bare` + 800-char tail → layered feedback, cap 2** [F02] | **Yes — #5 shapes it** (layered) | **Partial — retry alone No; targeted layered Yes (HYPOTHESIS)** |
| **Test-aware repair (FAIL_TO_PASS targeted → regression)** | No (SWE-agent closest, not test-aware) | **Yes — `pytest -k <test>` Layer 2 → full suite Layer 3** [06-recovery §E] | **Yes — #3+#5 combined** | **Yes — as layered orchestrator** (D-010 gate) |
| **Cost/reliability observability (Pareto scorecard)** | No single-run cost only; Pareto absent [R005 §7] | **Yes — MCP JSONL ledger + Pareto logger 250–350 LOC** | **Yes — #2 gap** | **Yes — only soft moat if published** [docs/04 §9] |
| **Structured execution evidence (failure class + evidence + cost/layer)** | Raw JSONL Yes; structured No | **Yes — ledger_append / gate_parse MCP tools + worktree** | **Yes — when evidence is specific/timely (see 06-recovery §B)** | **Partial — file log No; structured evidence Yes** |
| **`git worktree` isolation** | **Yes — mature primitive** [R004] | n/a | No | **No** |
| **JSONL / trajectory logging** | **Yes — mature** | n/a | No | **No** (unless Pareto-structured) |
| **Repo indexing (ripgrep/BM25/Tree-sitter)** | **Yes — mature** | n/a | No | **No** |
| **Standalone multiplexer / custom bus / vector DB / multi-agent DAG** | **Yes — elsewhere** | — | No | **No — killed (D-002/D-004)** |

---

## 6. Implications for LACE (Preserve Thesis)

**FACT — Current thesis (D-001, `docs/05-product-thesis.md`):** PIVOT — verification-first extension hypothesis, not proven product; thin host-native extension(s) sharing one verification core: MCP server `lace-ledger` + Claude Code plugin `lace-gate` (skill + `PostToolUse`/`Stop` hooks) + optional Herdr plugin `lace-herdr`.

**INFERENCE from this gap check:** The gap check **strengthens** the PIVOT scoping and **does not warrant** expanding it:

- The six focus capabilities are uniformly **not first-class** but **uniformly composable** via host-native extension in <2 weeks (F04). Therefore a standalone that re-implements them would violate D-002.
- The genuinely uncommon slice is exactly what the PIVOT already claims: gate that blocks merge on red/regression + layered ordering + failure-class separation + Pareto scorecard on Verified + rolling split. No thesis change needed.
- All undifferentiated LACE capabilities (§4 left column) are already marked **reuse, do not rebuild** in R004 and **Non-Goals** in `docs/05-product-thesis.md` — the gap check confirms they should stay out.

**HYPOTHESIS that remains to be tested (D-010):** Layered recovery > current at ≤1.5× baseline cost/latency and regression non-inferior at n=7 design gate; T1 ≥10pp at ≤2× with regression ≤ at n≥30 Verified. Until that powered measurement, even the extension has no moat beyond transparency — per `docs/02` §8 "you wouldn't — use Claude Code + Herdr + git worktrees, or add one hook."

**Open questions unchanged** (from `docs/05-product-thesis.md` §Open Questions): population prevalence n>100 survey, powered Verified Pareto n≥30 (prefer 100+) with real tiktoken→$/1K + 95% CI + LiveCodeBench rolling split, HerdrDelta n≥20 timed, timed replication spike T4 measured, OpenCode manifest + real pricing (JS-rendered), local-vs-cloud quantified 8GB rig — all still `No reliable evidence found`.

---

## 7. Traceability

- Competitive set & liveness: `research/R001/evidence.md` #1–13 (HEAD 2026-09-02), `research/R001/report.md`.
- Pain corpus & severity: `research/F01/evidence.md` #01–67 + H01–H06, `research/F01/report.md`, R002 15-source corpus, `docs/03-problem-space.md` A1–A5.
- Verification gap ("no one does verification as first-class"): `docs/02-competitive-landscape.md` §3 + §7, R004 verification loop row, R005 §7, F01 verification burden 21% (#63–67).
- Pareto benchmark gap: `research/R005/evidence.md` #1–15, `research/R005/report.md` §7, `docs/01-research.md` §5.
- MCP/Claude/Herdr extension surfaces: `research/F04/evidence.md` E01–E14 (spec 2025-06-18, hooks guide, plugins, headless, `herdr-plugin.toml` + socket/socket API), `research/F04/report.md` §5–6.
- Pilot mechanism & cost edge: `research/F02/evidence.md` P01–P10, `research/F02/pilot/results_*.json`, `research/reports/02-validation-synthesis.md` §4, `context/brain.md` Validated State + D-005/D-007/D-008.
- Recovery model & layered design: `docs/06-recovery-model.md` §B–E, `research/phase2d/protocol.md`, `research/phase2d/harness.py` (classification fix), `docs/06-validation-prototype.md` §5–10.
- Thesis, gates, kill criteria: `docs/05-product-thesis.md` §Success Criteria + Kill Criteria, `context/decisions.md` D-001–D-010, `docs/04-opportunity.md` §9.

---

*Stop condition: report created at `research/reports/05-verification-competitive-gap.md`. No code modified. No benchmarks run. No model/provider quota consumed beyond this synthesis. Do not change product thesis.*
