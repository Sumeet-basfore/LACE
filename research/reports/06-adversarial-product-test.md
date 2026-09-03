# LACE Adversarial Product Test — Hostile Review

**Date:** 2026-09-03 · **Reviewer role:** hostile reviewer (assume Claude Code, Codex, Cursor, OpenCode exist)
**Scope:** Disprove LACE as a useful *standalone* product. Test cloneability via shell, MCP, hooks, CI. Assess time saved and what LACE must own.
**Sources:** `docs/05-product-thesis.md` (PIVOT), `docs/06-recovery-model.md`, `docs/07-recovery-policy.md`, `context/brain.md` (FACT/EVIDENCE/HYPOTHESIS/DECISION), `context/terminology.md`, `docs/01-research.md`, `docs/02-competitive-landscape.md`, `docs/06-validation-prototype.md`, `research/R001`–`R007`, `research/F01`–`F04`, `research/phase2d/protocol.md` + `analysis/provider-failure.md`, `research/experiment/protocol.md`, `research/reports/01-research-synthesis.md`, `02-validation-synthesis.md`, `05-verification-competitive-gap.md`
**Constraints:** No code modified. No benchmarks run. No new live fetches or quota. No measured performance invented — unproven claims marked **HYPOTHESIS**.

---

## 0. Method and Stance

**FACT:** LACE current thesis is not GO. It is **PIVOT — verification-first extension hypothesis** (thin host-native extension: MCP server `lace-ledger` + Claude Code plugin `lace-gate` + optional Herdr variant, sharing one `spec→tests→gate→parse→feedback` core with worktree isolation, JSONL ledger, Pareto logging). Standalone binary/multiplexer/vector DB/multi-agent DAG is explicitly killed (D-002, D-004, `05-product-thesis.md` Non-Goals).

**DECISION for this review:** Test the *standalone* claim hardest. Assume the attacker is a single strong developer who already uses Claude Code *or* Codex *or* Cursor/OpenCode + `git` + `pytest` + GitHub Actions. The bar is: can they get LACE's value in `<1 week` without LACE? Verdict scale is:

- **BUILDABLE** — clearly differentiated standalone product justified today
- **THIN-BUT-PROMISING** — narrow wedge exists but only as thin extension; needs powered measurement (T1) to graduate
- **WRAPPER** — glue easily cloned via shell/MCP/hooks/CI; no moat as standalone
- **KILL** — no viable wedge even as thin extension

**Labels used below:** `FACT` (logs/specs/artifacts), `EVIDENCE` (measured corpus/experiment), `INFERENCE` (reasoned), `HYPOTHESIS` (unproven), `DECISION` (prior thesis choice).

---

## 1. Why can't a developer reproduce LACE with a shell script?

**Hostile answer: they can — for the verification core, a shell script already is LACE.**

**FACT:** LACE's verification core is three primitives composed, all mature reuse per `R004` and `docs/02-competitive-landscape.md` §3/§6: `git worktree`/`git apply`, `bash` test run, `pytest -k`/JUnit parse. `research/phase2d/protocol.md` defines the full layered loop as:

> `git apply --check` (0.1s, no Docker) → targeted `pytest -k <FAIL_TO_PASS>` (~80s) → `PASS_TO_PASS` regression, bounded 2 retries, structured feedback (test name + assertion + 20-line traceback).

**EVIDENCE:** That loop is already a script. `research/F04/report.md` Path C documents the headless clone as `<30 LOC bash`: `while not gate_pass; do claude -p --bare --mcp-config lace.json "fix failures: $(cat gate.json)" --output-format stream-json; done` + `git worktree add`. `research/experiment/protocol.md` and `research/F02/pilot/harness.py` implement the same loop in stdlib Python + `git worktree add` + `subprocess.run(["python3","run_tests.py"])`. Phase 2C/2D harnesses *are* the shell script LACE claims to be.

**INFERENCE:** A developer who already lives in Claude Code + `git` reproduces 90% of LACE with one script file (*"Claude Code + git worktrees already composes 90%"* — `docs/02-competitive-landscape.md` §6, `docs/04-opportunity.md` §6). The remaining 10% is not runtime but **policy**: deterministic `PostToolUse → gate` that *blocks* merge on red/regression, failure-class separation (D-008), and Pareto logging (`% resolved | regression | cost | latency | pass@3 | recovery` — `R005` §7). A script can enforce that policy too — literally `set -e; gate.sh || exit 1` and a required GitHub status check.

**HYPOTHESIS the defender must prove:** that the script's ad-hoc policy is unreliable enough that a productized gate saves meaningful time. Today that is `HYPOTHESIS` — Phase 2C showed the current script-like approach recovers 0/5 at ~2.97× median tokens (D-005), but the layered script *is* the proposed fix — both are scripts. No evidence shows a non-script substrate is required.

**Hostile score on this vector: WRAPPER.** If LACE's answer to "why not a shell script" is "our shell script is more structured," that is a wrapper argument, not a platform argument. D-002 already concedes this by killing the standalone runtime.

---

## 2. Why can't an MCP server reproduce it?

**Hostile answer: it can — MCP is the thinnest path to clone LACE, and the spec invites it.**

**FACT:** MCP 2025-06-18 is a versioned standard ("USB-C for AI" — JSON-RPC 2.0 over stdio/SSE/Streamable HTTP, tools/resources/prompts/sampling) with first-party SDKs (`modelcontextprotocol/typescript-sdk`, `python-sdk`) and a first-party scaffolder (`mcp-server-dev` plugin → `/mcp-server-dev:build-mcp-server` → scaffolds stdio or HTTP server) — `research/F04/evidence.md` E01–E03/E07. Claude Code, Codex, OpenCode, Cursor, VS Code all list MCP clients (`F04` E02). Any host can add a server with one JSON entry in `.mcp.json` / `~/.claude.json` / `--mcp-config` (even in `--bare` headless per E09).

**EVIDENCE:** `research/F04/report.md` Path A constructs the full LACE ledger+gate as one MCP server `lace-ledger` with 4–5 tools: `ledger_append`, `ledger_read`, `gate_run` (`{stdout, exit}`), `gate_parse` (JUnit/TAP → `{failures[]}`), `worktree_create` (wraps `git worktree`/`git tag`), backed by JSONL/SQLite like `pi`/`herdr` trajectories (`F04` E18). Estimate: **250–350 LOC, <1 week single dev** (desk estimate bounded by inspected `commandcode.integration` 46 LOC TOML + 3 sh + scaffolder proof — `F04` §6). No custom bus, no custom protocol — `R004` directive is "Do not build custom bus/parser/vector DB."

**INFERENCE:** MCP reproduces *all* LACE protocol value: LACE is a *policy* (“`spec→tests→gate→parse→feedback→regression` that blocks merge”) exposed as *tools*. MCP is purpose-built to expose exactly that. The host already does the agent loop; the server only adds the gate. That is why `docs/04-opportunity.md` §7 says *"MCP is the right transport, not the product."*

**HYPOTHESIS that would defeat this clone:** that hosting the gate inside MCP is too advisory (tools don't block) and only a hook-level gate enforces blocking. But MCP + a one-line client rule ("do not merge unless `gate_parse` is green") is equally blocking in practice — GitHub required status checks do the enforcement outside the model. The MCP blocker is organizational, not technical.

**Hostile score: WRAPPER.** An MCP server is not a reproduction of LACE — it *is* LACE's own proposed primary form (`lace-ledger`). A competitor reproducing it is not cloning a product; they are installing the same spec everyone shares. Moat is near-zero as `05-verification-competitive-gap.md` §3 already classifies the MCP path as genuinely uncommon only in its *absence* today, not in its difficulty.

---

## 3. Why can't Claude Code hooks reproduce it?

**Hostile answer: they reproduce it more deterministically than MCP, in <100 LOC.**

**FACT:** Claude Code hooks are *deterministic shell commands at lifecycle events* — "certain actions always happen rather than relying on the LLM to choose" (`F04` E06, quoting `code.claude.com/docs/en/hooks-guide.md`). Events include `PostToolUse`, `Stop`, `SessionStart`, `SessionEnd`, prompt/agent hooks, async and MCP-tool hooks, configured in `settings.json` with matcher e.g. `PostToolUse Edit|Write → jq -r '.tool_input.file_path' | xargs prettier --write`. Plugins bundle skills (`skills/<name>/SKILL.md` → `/plugin:skill`), agents, hooks, and MCP servers via `.claude-plugin/plugin.json` and are tested `--plugin-dir <path>` (E08). Headless `claude -p --bare` still loads `--mcp-config`/`--plugin-dir`/`--settings`/`--agents` explicitly (E09).

**EVIDENCE:** `F04` Path B sketches `lace-gate` as: `skills/verify/SKILL.md` + `hooks.PostToolUse Edit|Write → scripts/gate.sh` (lint/build/test → JUnit) + `hooks.Stop → gate_check.sh` (block until `gate_parse` green) + `.claude-plugin/plugin.json` (≥5 lines) — **≤4 files, <100 LOC, <3 days**. This is exactly `docs/07-recovery-policy.md`'s cheapest path: Layer 1 `apply --check` in `PostToolUse`, Layer 2 `pytest -k` in `Stop`, regression Layer 3 before success.

**FACT:** Even the contamination lesson is a hook fix. Phase 2D's `PROVIDER_RATE_LIMIT` (429 `FreeUsageLimitError`) was misclassified as `EMPTY_OUTPUT` and blind-retried, contaminating all raw (`research/phase2d/analysis/provider-failure.md`). Fix was a harness hook `classify_provider_failure(exit_code, stderr, stdout)` that zeroes tokens and breaks the loop — no model change, no protocol change (D-007/D-008). That is precisely what `Stop` hooks are for.

**INFERENCE:** Hooks are *strictly stronger* than LACE as a product: they enforce the gate inside the agent loop rather than advising it from a server. If a developer can enforce LACE policy with one `settings.json` entry (`PostToolUse → gate.sh; Stop → gate_check.sh`), then LACE's standalone value is not the gate — it is the *gate's content* (which tests, which parse, which caps). And that content is the `docs/07-recovery-policy.md` matrix — a *configuration*, not a product.

**Hostile score: WRAPPER.** Hooks don't reproduce *a* LACE capability; they are LACE's other primary form (`lace-gate`). Publishing LACE as a plugin is publishing a hooks configuration. Any Claude Code user can fork that configuration. The plugin marketplace (`F04` E11–E14 `herdr-plugin.toml` precedent, `commandcode.integration`) makes distribution one `github:` source line — cloning is distribution.

---

## 4. Why can't existing CI/test tooling provide the same value?

**Hostile answer: for the blocking and Pareto parts, CI already does — better.**

**FACT:** Existing CI already provides what LACE calls "deterministic verification that blocks merge":

- `pytest`/`npm test` produce JUnit/TAP that GitHub Actions parses natively; a *required status check* blocks merge on red/regression without any AI. SWE-agent/OpenHands sandboxes already run the full suite in Docker (`docs/02-competitive-landscape.md` §3: "All delegate to `bash`/Docker adhoc; SWE-agent sandbox is closest but verification is `bash`/Docker adhoc, not a gate" — but CI's gate *is* the gate).
- `git worktree` + `git tag` + `stash` provide isolation/snapshots pristinely (`R004` mature reuse). Herdr's `worktree` wrapper is thin over `git worktree` (`F03` teardown: LACE Δ vs `Herdr+agent` is *Duplicates* at mechanism, *Thin* at policy).
- Dashboards (GitHub Actions summary, Codecov, Buildkite) already log cost/latency per run; adding `% resolved | regression | recovery` is a log line away (R005 §7 Pareto: `"% resolved | regression rate | median cost | median time | reliability (σ/pass@3) | recovery rate"` — no new infrastructure, just a logger like `research/experiment/harness.py` + `runs/<run-id>/result.json`).

**EVIDENCE:** The *only* CI gap LACE identifies is that CI runs *after* the agent claims done, while LACE claims to run *inside* the agent loop (`PostToolUse`/`Stop`) and feed structured feedback before a second attempt. But `commit → CI fail → paste CI tail → fix → push` is the same loop every developer already does — `docs/06-recovery-model.md` §B even defines evidence as "failing test name, assertion, file:line, 20-line traceback" — exactly what Actions already posts as an annotation. The difference is latency (80s targeted `pytest -k` in-loop vs minutes full suite in CI) and *automatic* vs *manual* paste.

**INFERENCE:** That latency + automatic paste is where CI loses *on UX*, not on correctness. For a solo developer, the in-loop Layer 2 (~80s) vs post-commit full suite (minutes) saves one push cycle — **minutes, not hours**. For a team, CI's blocking is *stronger* than any in-loop gate (CI is the source of truth; an agent's self-check is not). LACE's credible uniqueness is therefore not "we block on red" (CI does) but "we block *before* you push, with the *targeted* failing subset, without resending full context."

**HYPOTHESIS that would justify LACE over CI:** that targeted in-loop Layer 2 with minimal evidence (`test name + assertion + file:line + 20-line traceback + hunk`, not full `problem_statement` — `docs/06-recovery-model.md` §E, `docs/07-recovery-policy.md` §6) recovers more failures than CI-tail-paste at acceptable `≤1.5×` cost. That is precisely the unproven Phase 2D hypothesis (D-010). Phase 2C showed the CI-like path ("full suite → generic 800-char tail → full-context retry") recovers **0/5 at ~2.97× median tokens** (D-005). But Phase 2D is contaminated and not rerun, so CI vs layered is not yet measured at n=7, let alone n≥30.

**Hostile score: WRAPPER for CI replacement; THIN-BUT-PROMISING for CI augmentation.** Replacing CI's blocking with an agent's self-report is a downgrade. Augmenting CI with an in-loop targeted Layer 2 before push is the only honest CI-adjacent wedge — and it is exactly `gate_run` as a local hook, not a standalone product. Enterprise already gets stronger blocking from Copilot BYOK/ZDR/content-exclusion/audit/sandboxing productization (`R006` E07) than any local gate adds.

---

## 5. Which LACE capabilities would actually save meaningful developer time?

**Hostile filter: a capability saves meaningful time only if it eliminates a human intervention or a full push/CI cycle that existing tools cannot eliminate in a few lines, at scale.**

| LACE capability (from `05-product-thesis.md` + `06-recovery-model.md` + `07-recovery-policy.md`) | Saves meaningful time? | Hostile reasoning (with label) |
|---|---|---|
| **Deterministic verification gate that blocks merge on red/regression (`spec→tests→gate→parse→feedback→retry cap 2 → regression proof`)** | **Borderline — only if inside the agent loop** | **FACT:** Blocks bad merges — but CI required status checks already do this more authoritatively. **EVIDENCE:** 21% verification-burden corpus is heterogeneous (remove proactivity #13753 vs permission spam #13101 — `docs/02` §5) — ideal friction varies per user. **HYPOTHESIS:** In-loop blocking saves one push if it prevents the push at all; pilot +20pp point estimate (1 recovery via gate) had Wilson CIs 37.6–96.4% vs 56.6–100% *heavily overlapping* — not powered. Verdict: saves *reviewer* time (F01 10% regression/data-loss, 4-comment "discards all changes"), not *author* wall time, unless recovery is high. |
| **Failure-class separation (provider/model/verification/infra, never blind-retry 429)** | **Yes — saves the most time per incident** | **FACT:** Phase 2D contamination proved blind retry on `PROVIDER_RATE_LIMIT` (429 `FreeUsageLimitError`) contaminated every task and amplified cost while provider was still rate-limited (`research/phase2d/analysis/provider-failure.md`). **DECISION:** D-008 fix (zero tokens, immediate break) saves *all* subsequent attempts on quota failure. This is the single easiest hostile concession: any developer who has burned retries on 429 will value this. But **EVIDENCE:** this is a one-function harness bug fix (`classify_provider_failure` in `harness.py` + `test_harness_classification.py`), not a product. |
| **Layered verification (L1 `apply --check` ~0.1s → L2 `pytest -k <FAIL_TO_PASS>` ~80s → L3 regression)** | **Yes — if targeted subset is truly faster** | **EVIDENCE:** Phase 2C full-suite-every-retry cost is the measured waste: ~2.97× median tokens, 0/5 recovery (D-005). **HYPOTHESIS:** L1 catches `PATCH_INVALID`/`EMPTY_OUTPUT` without Docker; L2 feeds *minimal corrective context* without resending `~176k cacheRead` full problem_statement (`docs/06-recovery-model.md` core principle). Time saved scales with how often L1/L2 would have rejected — common for `PATCH_INVALID`/`EMPTY_OUTPUT` per `research/phase2d/protocol.md`. But magnitude is minutes, and not measured (D-010). |
| **Test-aware retry (test name + assertion + file:line + 20-line traceback + hunk, not full context)** | **Maybe — mechanism plausible, magnitude unproven** | **EVIDENCE:** Most correlated mechanism in literature is SOPs+executable feedback +4–5pp HumanEval (R003 E02), prototype ceiling noted. Pilot demonstrated 1 recovery via this pattern. **INFERENCE:** This is the *only* capability where F01 hallucination (9% doubled-prefix, unknown MCP tool opaque) and F01 regression (10%) directly map to a fix. But **HYPOTHESIS:** that minimal evidence beats CI tail-paste is not yet shown at n=7. |
| **`WRONG_FILE` diff-only reviewer / file-scoped correction** | **No meaningful time at scale today** | **FACT:** Lite filters remove multi-file/>3-hunk/file-create tasks — precisely where `WRONG_FILE` matters (`R005` E02–E06). In F02 synthetic pilot, all edits are single-file by construction, so wrong-file never fires. **INFERENCE:** Time saved is real on real repos, but Lite excludes the slice LACE would win on, and F01 `WRONG_FILE` is `LOW-MEDIUM` heuristic confidence (`docs/07-recovery-policy.md`). Not a primary time saver until multi-file tasks are measured. |
| **`git worktree` isolation per task** | **Yes — but not LACE-specific** | **FACT:** Provides pristine snapshots (`7b9850d`), no cross-task mutation — F02 both arms showed 0 regression cross-mutation via isolation (`EVIDENCE`). **EVIDENCE:** `F03` teardown: LACE Δ vs `Herdr+agent` is *Duplicates* at mechanism. Every developer can run `git worktree add` in one line. Time saved is real (4-comment `discards all changes` data loss — F01), but moat is zero. |
| **JSONL ledger (trajectory) / Pareto scorecard (`% resolved \| regression \| cost \| latency \| reliability \| recovery`)** | **Saves *team* time, not *author* time per task** | **EVIDENCE:** No benchmark reports regression/recovery/human-intervention; the Pareto gap is real and productized by none (`R005` §7, `docs/02` §7). **INFERENCE:** An honest Pareto scorecard saves *evaluation* time for a team choosing a harness, and *debugging* time when a run fails (20-line traceback + cost/layer is searchable). But a solo developer can grep a log. This is durable differentiation only if LACE *actually publishes* powered Verified n≥30 numbers with Wilson CIs and rolling post-cutoff split — which it has not (`02-validation-synthesis.md` §4). |
| **MCP governance proxy / trust (allowHeadless, OAuth hardening, telemetry redaction)** | **Saves *enterprise buyer* time, not developer time per patch** | **FACT:** F01 21% privacy/trust (3 identical proposals same week — `cline #13737`, `continue #13212`, `aider #5665`, plus `ZDR` hedging — `R006` E04). **EVIDENCE:** Buyer pressure is real (Copilot BYOK/ZDR productization `R006` E07), but **HYPOTHESIS:** willingness-to-pay for a thin proxy vs accepting `ZDR/BYOK` is unmeasured (`No reliable evidence found.` — `01-research.md` gaps). For a terminal user, this saves zero minutes. |
| **Standalone multiplexer / custom bus / vector DB / multi-agent DAG** | **No — costs more time than it saves** | **FACT:** Already killed (D-002, D-004). `R004` directive: "Do not build custom bus/parser/vector DB." `F03` shows standalone would duplicate Herdr workspace lifecycle + socket API. `05-verification-competitive-gap.md` §4 marks these **NOT differentiated**. Multi-agent stays EXPERIMENTAL until T1 — cost 3–10× (`R003`), no demand in 67 issues (`F01`). |

**Hostile summary on time saved — `INFERENCE`:** For the solo developer already on Claude Code + `git` + CI, the only capabilities that *reliably* save wall time are (a) provider-class separation (stops quota burn) and (b) worktree isolation (prevents discard/rollback loss) — both one-function fixes, not a product. The in-loop layered gate + targeted evidence *could* save one push cycle (~80s–minutes) per failing task, but that is `HYPOTHESIS` (Phase 2D) and at most a few minutes — meaningful only if recovery rate at scale is `≥10pp at ≤2×` (T1). Cost-adjusted Pareto transparency saves *decision* time for a team, which is the only durable wedge — but it is a report, not a runtime.

---

## 6. What must LACE own to justify its existence?

**Hostile bar: to be BUILDABLE as a standalone, LACE must own something an MCP + hook + CI cannot take in <1 week. Today it owns nothing.**

| Candidate moat | Does LACE own it today? | What would count as owning it (with label) |
|---|---|---|
| **Proven Pareto win at scale** | **No.** Pilot n=5 is +20pp but Wilson CIs overlap (`F02` — `37.6–96.4%` vs `56.6–100%`); synthetic overestimates success and underestimates retrieval/multi-file cost (`02-validation-synthesis.md` §4). | **EVIDENCE required:** Powered Verified n≥30 (prefer 100+) same-model baseline vs layered, standardized mini-SWE-agent harness, real tiktoken billing, `≥10pp absolute gain at ≤2× median cost/latency with regression ≤ baseline`, Wilson CI non-overlapping + rolling post-cutoff split (`T1`, `05-product-thesis.md` Success Criteria, `research/phase2d/protocol.md` gate). Until then, **HYPOTHESIS**. |
| **HerdrDelta — quantified multiplexer advantage** | **No.** Live 0.8.2 snapshot (protocol 20, 3 ws, 11 panes) is `FACT`; `>30% time-to-green or >50% fewer interventions (n≥20)` is **untested** (`T2`, `F03` teardown). | **EVIDENCE required:** Pre-registered `tmux+worktree+agent` vs `Herdr+worktree+agent` vs plugin on n≥20 tasks measuring time-to-green + manual interventions. If not met, kill Herdr CORE forever (D-003). |
| **Wrapper moat (non-cloneability in <2 weeks)** | **Failed for standalone.** Desk construction proved `lace-ledger` 250–350 LOC + `lace-gate` <100 LOC + `lace-herdr` 150–200 LOC (copy of `commandcode.integration` 46 LOC + 3 sh) — single dev <1 week (`F04` §6). Spec churn (MCP 2025-06-18, ACP remote WIP) is tax not moat (`R004`). Continue archived warns churn (`R006` E05). | **DECISION already taken:** D-002 kills standalone — `T4 already fails for standalone` (`02-validation-synthesis.md` §7). For the *extension itself*, the remaining moat test is timed 2-week external replication spike — if it clones too easily, wedge must deepen via eval transparency, not features. |
| **Distribution / trust surface no one else wants to build** | **No.** MCP governance proxy (allowHeadless 11 comments, OAuth hardening, telemetry redaction) has cross-repo demand (3 identical proposals same week — `F01`), but ZDR/BYOK already satisfies most enterprise (`R006` E07, `R007` E11–E15). `T3` (≥40% pure-local mandatory from 5 interviews + 10–15 policies/DPAs) is untested. | **EVIDENCE required:** `T3` passes — otherwise kill local-first as core (ship hybrid degraded, 16GB+ target, explicit 8GB ceiling). |
| **Population prevalence / willingness-to-pay** | **No.** `No reliable evidence found.` — corpus 7–21% is *corpus only*, not market (`01-research.md` gaps). No survey n>100. | **EVIDENCE required:** survey n>100 (Stack Overflow/JetBrains) + 5 regulated-enterprise buyer interviews ranking collaboration/persistence vs reliable single-agent + verification + price sensitivity (`01-research.md` gaps 1–4). |
| **Credibility as measurement lab** | **Not yet — but the only viable path** | **EVIDENCE required:** Publish the Pareto scorecard incumbents won't: `% resolved | regression rate | median cost | median time | reliability (σ/pass@3) | recovery rate` on Verified (n≥30) + rolling split (`R005` §7, `02-validation-synthesis.md` §8). This is the only durable differentiator `01-research-synthesis.md` calls out — durable because it is *reproducible science*, not code. But it is durable *only after* it exists. |

**INFERENCE — what LACE must *own* to graduate from WRAPPER to THIN-BUT-PROMISING to BUILDABLE:**

1. As a **standalone**: nothing short of a platform-level capability none of the 12 can expose in <2 weeks — which, given `R004`'s mature-reuse table (ReAct + MCP + Tree-sitter + ripgrep + `git worktree` + JSONL + containers), is `HYPOTHESIS` with near-zero prior. Hostile prior for standalone is **WRAPPER**, already decided by D-002/T4.

2. As a **thin extension**: it must own **one number** — the powered Pareto win. The extension's moat is not the `gate.sh` (anyone can copy a hook) but the *evidence that the gate is worth the complexity*: `recovery_layered > recovery_current AND median tokens ≤1.5× AND regression non-inferior` at n=7 (Phase 2D gate), then `≥10pp at ≤2× with regression ≤` at n≥30 (T1). Until that number exists, the extension is correctly priced as `HYPOTHESIS` (`context/brain.md` — "Not validated," `docs/07-recovery-policy.md` §10).

3. As a **measurement lab**: it must own **continuous eval credibility** — rolling post-cutoff Verified/LiveCodeBench-style, with harness pinned (`research/phase2d/protocol.md` + `research/experiment/protocol.md`), real tiktoken billing, public ledger. This is the path `docs/04-opportunity.md` §9 and `05-verification-competitive-gap.md` §3.1 #2 describe as the thin product's only durable wedge.

**Therefore the honest kill line (`DECISION`):**

- Disprove standalone? **Already disproven** (D-002, T4 fails, `05-verification-competitive-gap.md` §4 — `git worktree`/`JSONL`/`ripgrep`/multiplexer/bus as `NOT differentiated`). Do not rebuild them.
- Disprove thin extension? **Not yet — but measure or kill it.** If Phase 2D (n=7) fails the design gate, or T1 fails at n≥30 with real billing and regression split, kill orchestration as CORE (keep single-agent default, community plugin only). At n≥100 failure, permanent KILL on verification as CORE (`05-product-thesis.md` Kill Criteria). If all T1–T4 fail, permanent KILL — do not pivot again; publish reusable assets (pilot repo/harness, `07-recovery-policy.md` matrix, `05-verification-competitive-gap.md` — `02-validation-synthesis.md` §12).

---

## 7. Hostile Cross-Checks (contradictions the defender cannot ignore)

1. **"No incumbent covers all" vs "each piece is covered somewhere"** — `FACT`: 12/12 HEAD 200/301/308 on `2026-09-02` (`R001`); weighted higher than `R001` Medium conjunction inference. Gap is integration, not capability. LACE's integration is itself integrable as MCP in <1 week.

2. **Lite excludes the tasks where LACE would matter** — `FACT`: Verified kept 500/2,294, Lite filters remove multi-file/>3-hunk/file-create tasks (`R005` E02–E06). LACE's multi-file/>3-hunk win is therefore on the slice benchmarks deem ungradable — reduces external validity of any T1 claim unless measured on full Verified + rolling split.

3. **Heterogeneity defeats one friction level** — `EVIDENCE`: remove proactivity (#13753) vs permission spam (#13101) are opposite polls (`F01` 21% verification burden) — ideal gate varies per user/task. A single `PostToolUse → gate` that blocks every `Edit|Write` will be experienced as permission spam by half the corpus. `HYPOTHESIS`: correct product is an *advisory* gate with a blocking *option*, not a mandatory block.

4. **Herdr + `git worktree` already is persistence** — `FACT`: `F03` Herdr live snapshot + `tmux 3.7c` 91 commands — generic, no agent awareness — but the product already sits at `workspace→tab→pane` with socket API + `git worktree` wrapper. Any idea for parallel agents collides with `No reliable evidence found` for demand (0/67 GH issues requested teams — `docs/03-problem-space.md`), high variance in coordination.

5. **The 1% glue is 1%** — `INFERENCE`: LACE as PIVOT is accurately described in `docs/02-competitive-landscape.md` §6 as "1% glue" (deterministic gate + regression check + cost transparency) on 99% mature primitives. A product whose defensible core is 1% glue *should* ship as glue (one hook, one MCP JSON), not as platform.

---

## 8. Verdict

**Verdict — as a *useful standalone product*: `WRAPPER`**

**Reasoning — `EVIDENCE`-backed:**

- **Shell script clones it** — the harness *is* a script (`research/experiment/harness.py`, `research/F02/pilot/harness.py`), and `F04` Path C is <30 LOC bash; policy ("block on red") is one `exit 1` + required status check.
- **MCP clones it** — 250–350 LOC `lace-ledger` server, one JSON entry in `.mcp.json`, stdio/Streamable HTTP — `F04` Path A, MCP 2025-06-18 spec.
- **Hooks clone it more deterministically** — ≤4 files, <100 LOC, `PostToolUse Edit|Write → gate.sh` + `Stop → gate_check.sh` — `F04` Path B. The 429 fix that unblocked Phase 2D is itself a hook (`D-008`).
- **CI already provides the stronger version of the blocking guarantee** — required checks on JUnit/TAP, `PASS_TO_PASS` regression included. In-loop layered Layer 2 vs CI full suite saves minutes at most, and is `HYPOTHESIS` until Phase 2D clean data.

Standalone fails `T4` (reproducible in <2 weeks) — kill already decided (`D-002`). No new fact in this hostile pass revives it. Multi-agent/local-first/standalone thesis remains **not validated** per `01-research-synthesis.md` §10 and `02-validation-synthesis.md` §12.

**Nuance (required honesty): as a *thin host-native extension* — `THIN-BUT-PROMISING`, not `BUILDABLE`**

The hostile review does **not** support `KILL` for the thin extension hypothesis. A narrow, severe, harness-solvable wedge *is* validated for affected users (67 GH corpus + pilot mechanism feasible, 1 recovery via gate with regression 0 — `F02`, `02-validation-synthesis.md` §1–§4), and the genuinely uncommon gaps (`05-verification-competitive-gap.md` §3.1: gate that blocks on red/regression, Pareto transparency, failure-class separation, layered targeted evidence) are still not productized as first-class by any of the 12. The extension is cheap (MCP + hook, no standalone runtime, no vector DB — `R004`), reversible (`git worktree` per task, `7b9850d` pristine snapshot — `F02`), and the only durable wedge if it ever publishes powered Pareto numbers.

But it is **not `BUILDABLE`** today. The powered Pareto win (`≥10pp at ≤2× with regression ≤`, n≥30, Wilson CI non-overlapping + rolling post-cutoff — `T1`) has not been shown, and the design gate (`recovery_layered > recovery_current AND median tokens ≤1.5× AND regression non-inferior`, n=7 — `research/phase2d/protocol.md`) is pending clean data after D-007/D-008. Until that gate, the extension earns `THIN-BUT-PROMISING` — the exact PIVOT posture in `docs/05-product-thesis.md` and `context/brain.md` ("Not validated").

> **If this report had to pick one word under the required four for the overall product question as asked ("useful standalone product"): `WRAPPER`.**
>
> **If forced to grade the surviving thesis:** the thin verification-first extension is `THIN-BUT-PROMISING` — worth the next measurement (Phase 2D clean n=7 → T1 n≥30 Verified with real billing), not worth a standalone build. If T1 fails, follow the pre-registered kill criteria (`05-product-thesis.md` Kill Criteria): kill orchestration as CORE; at n≥100 failure, permanent KILL on verification as CORE; if all T1–T4 fail, permanent KILL of the product and publish reusable assets.

---

## Traceability

- Kill/scope: `docs/05-product-thesis.md` (PIVOT, Non-Goals, Kill Criteria T1–T4), `context/decisions.md` D-001–D-010, `context/brain.md` Validated State + Design Gates.
- Competitive coverage & live HEAD: `research/R001/evidence.md` #1–13 (2026-09-02), `docs/02-competitive-landscape.md` §1–§7, `research/R007/report.md` (8-bullet adversarial).
- Wrapper/MCP/hooks clone paths: `research/F04/report.md` Paths A–D (§4.1–4.4), `research/F04/evidence.md` E01–E14 (MCP 2025-06-18 spec, Claude hooks guide E06, plugins E08, headless E09, `herdr-plugin.toml` E11–E14).
- Verification/pain & heterogeneity: `research/F01/evidence.md` #01–67 + H01–H06 (67 GH issues, 21% verification burden opposite polls, 21% privacy/trust 3× same-week proposals, 10% regression/data-loss, 9% hallucination, 7% loops/hangs, 9% progress, 16% cost), `docs/03-problem-space.md` A1–A5.
- Benchmark gap & Pareto: `research/R005/evidence.md` #1–15, `research/R005/report.md` §7 (`% resolved | regression | cost | latency | pass@3 | recovery`), `research/R003/evidence.md` + `R007` E06/E07 (ChatDev/MetaGPT +19pp, 3–10× cost, no SWE-bench A/B `No reliable evidence found.`).
- Harness/experiment grounding: `docs/06-recovery-model.md` (Layers 1–3), `docs/07-recovery-policy.md` (12-class matrix, caps, `PROVIDER_RATE_LIMIT → Stop, max 0`), `research/phase2d/protocol.md` (n=7 gate), `research/phase2d/analysis/provider-failure.md` (429 → contamination, D-007/D-008), `research/experiment/protocol.md` (5-task synthetic, `7b9850d`, Wilson CIs 37.6–96.4% vs 56.6–100% — `02-validation-synthesis.md` §4), `docs/06-validation-prototype.md` §5–10 (caps, power calc ~300/arm for 10pp).
- Gap as integration not capability / 1% glue: `docs/02-competitive-landscape.md` §6, `docs/04-opportunity.md` §6–§9, `research/reports/05-verification-competitive-gap.md` §3.1 (six genuinely uncommon gaps) + §4 (NOT differentiated: `git worktree`/`JSONL`/search/CI blocking is commodity).
- Method limits: `docs/01-research.md` gaps (`No reliable evidence found.` for prevalence/WTP/pricing/8GB bench, JS-rendered OpenCode docs shell, `tavily`/`exa` not used, `curl`+GH/HN APIs only).

*No code modified. No benchmarks run. No quota consumed.*
