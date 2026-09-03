# LACE Adversarial Product / Moat Test (Agent C — Kill Attempt)

**Date:** 2026-09-03 · **Role:** hostile reviewer, do not defend LACE
**Question:** "Why would anyone install LACE?"
**Scope:** verification-first, failure-aware recovery hypothesis only:
verification evidence → failure classification → minimal corrective context → bounded recovery → regression proof.
**Status of capability:** HYPOTHESIS, NOT validated (Phase 2C: 0/5 recovery at ~2.97× median tokens; Phase 2D contaminated, clean rerun pending — `context/brain.md`, D-005/D-007/D-010).
**Sources:** `context/brain.md`, `context/decisions.md`, `context/terminology.md`, `docs/05-product-thesis.md`, `docs/06-recovery-model.md`, `research/reports/05-verification-competitive-gap.md`, `research/reports/06-adversarial-product-test.md`, F01–F04 artifacts as cited therein.
**Constraints:** No code modified. No benchmarks run. No new live fetches. No moat claims invented. Labels FACT/EVIDENCE/INFERENCE/HYPOTHESIS/DECISION per `context/terminology.md`.

---

## 1. Executive verdict

**Hostile verdict: LACE as an installable product has no moat today. Every proposed capability is reproducible with tools the developer already owns, and the one capability that could justify installation (layered recovery at acceptable cost) is unproven — current measured evidence is 0/5 recovery at ~2.97× cost (EVIDENCE, D-005), with the layered fix unmeasured (HYPOTHESIS, D-010).**

Concretely:

- Q1–Q7 (Claude Code / Cursor / Codex / MCP / hooks / shell / CI): **yes, each reproduces the core** — F04 desk-constructs the full clone as MCP 250–350 LOC + hook <100 LOC + Herdr variant 150–200 LOC, single dev <1 week (EVIDENCE from inspected specs, not a timed build).
- Q8 (weekend build): **yes** — the harness *is* a script (`research/phase2d/harness.py`, `research/F02/pilot/harness.py`); Path C clone is <30 LOC bash (FACT, F04).
- Q9–Q10: **~90% of LACE is commodity** (worktree, JSONL, test execution, retry, search, multiplexer). Nothing in the commodity set is difficult to reproduce. The only hard part — *proving* layered recovery beats current practice at ≤2× cost with regression ≤ baseline — is measurement, not code, and LACE has not done it.
- Q11–Q13 (data / network / lock-in): **none exist.** No proprietary data, no learned policy, no network effect, no lock-in. Switching cost is one deleted `settings.json` entry.
- Q14 (trust/observability): the only gap incumbents genuinely leave open (Pareto scorecard + failure-class separation), but it is a **report and a policy, not a runtime** — publishable without installing anything.
- Q15 (plugin vs standalone): **plugin at most; standalone already killed** (D-002, T4 fails). Even the plugin is a configuration forkable in minutes.

The developer with Claude Code + git + pytest + CI installs LACE and gains, at best, one push cycle (~minutes) per failing task — **if** the unproven layered hypothesis holds. That is a wrapper payoff, not a product payoff.

---

## 2. Capability-by-capability comparison

One row per proposed differentiator from `docs/06-recovery-model.md` + `docs/05-product-thesis.md` wedge. "Incumbent-native reproduction" = what the developer does without LACE.

| # | Proposed differentiator | Claude Code today? | Cursor? | Codex? | MCP? | Hooks? | Shell? | CI? | Classification |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Verification evidence (structured: test name + assertion + file:line + bounded traceback + cost/layer) | Yes — `claude -p --output-format stream-json` + parse pytest/JUnit output in a script (FACT, F04 E09) | Yes — Composer/Cascade terminal output + codebase context, paste failures back (per R001 capability set) | Yes — `apply_patch` + shell test run, same parse | Yes — `gate_run`/`gate_parse` tools return `{failures[]}` (F04 Path A) | Yes — `Stop` hook runs gate, writes `gate.json` | Yes — `pytest -k … \| tail -30 > gate.json` | Yes — Actions annotations already post exactly this (test, assertion, file:line) | **NOT A DIFFERENTIATOR** (evidence extraction is parsing; everyone parses the same pytest output) |
| 2 | Failure classification (provider ≠ model ≠ verification ≠ infra; never blind-retry 429) | Yes — parse stderr for 429/`FreeUsageLimitError`/auth/timeout before retry; D-008 fix is one function `classify_provider_failure` (FACT) | Yes — same string match on command output | Yes — same | Yes — return `provider_failure` tool result, client breaks loop | Yes — strongest form: `Stop` hook zeroes tokens, breaks loop (FACT, D-008) | Yes — `case "$stderr" in *429*) exit 0;;` | Partial — CI retries are configurable but coarse; fine-grained class needs the hook, not CI | **EASY TO COPY** (single most valuable behavior, single cheapest fix — a bug fix, not a product) |
| 3 | Minimal corrective context (targeted failure payload, not full problem statement) | Yes — re-prompt with `gate.json` only instead of full context; prompt engineering, not infrastructure (HYPOTHESIS that it recovers more) | Yes — same prompt-shaping in Composer context window | Yes — same | Yes — tool returns minimal payload by construction | Yes — hook injects `gate.json` as the retry prompt | Yes — `claude -p "$(cat gate.json)"` | No — CI tail-paste is manual and usually full-log; automation gap is real but small | **EASY TO COPY** (a prompt template; Phase 2C generic-800-char version measured 0/5 — EVIDENCE the naive form fails, layered form unmeasured) |
| 4 | Bounded recovery (cap 2–3 retries, per-class policy) | Yes — `for i in 1 2; do … done`; `--max-turns` / loop cap | Yes — max-iteration settings on agent modes | Yes — loop cap in script around `codex exec` | Yes — counter in server state | Yes — hook counts `attempts` in ledger, blocks after cap | Yes — trivially | Yes — `strategy.max-attempts` / re-run limits | **NOT A DIFFERENTIATOR** (a loop counter) |
| 5 | Layered verification (L1 apply-check ~0.1s → L2 targeted FAIL_TO_PASS ~80s → L3 regression) | Yes — three shell lines in `PostToolUse`/`Stop` hooks (FACT, F04 Path B) | Yes — same sequence as shell steps / Composer checks | Yes — same | Yes — three tools or one `gate_run --layer` param | Yes — canonical host: L1 in `PostToolUse`, L2+L3 in `Stop` | Yes — `git apply --check && pytest -k <t> && pytest` | Partial — CI does L3 authoritatively but post-push; in-loop L1/L2 ordering is the onlyбежь addition | **EASY TO COPY** (ordering policy; cheapness per layer is EVIDENCE, superiority of ordering is HYPOTHESIS — Phase 2D gate pending) |
| 6 | Regression proof (PASS_TO_PASS must stay green, reported separately) | Partial — scriptable (`pytest` subset diff vs baseline) but not default in any agent loop | Partial — same: scriptable, not productized | Partial — same | Partial — scriptable as `gate_regression` tool | Partial — scriptable in `Stop` hook | Partial — scriptable | **Yes — CI required status checks do this more authoritatively than any agent self-check** (FACT) | **NOT A DIFFERENTIATOR** (CI is the stronger incumbent; in-loop version is a latency optimization worth minutes, not a capability) |
| 7 | Worktree isolation per task | Yes — `git worktree add` one line (FACT, R004 mature reuse) | Yes — same | Yes — same | n/a (wraps git) | n/a | Yes — one line | Yes — fresh runner per job | **NOT A DIFFERENTIATOR** (F03: LACE Δ vs Herdr+agent is *Duplicates* at mechanism) |
| 8 | JSONL ledger / trajectory + Pareto scorecard (`% resolved \| regression \| cost \| latency \| pass@3 \| recovery`) | Partial — raw log yes (`stream-json`); Pareto tuple no, but appendable in ~20 lines | Partial — same | Partial — same | Yes — `ledger_append`/`ledger_read` over JSONL/SQLite, 250–350 LOC total server (F04) | n/a | Yes — `>> ledger.jsonl` | Partial — Actions/Codecov log cost/latency; Pareto tuple is one logger away (R005 §7) | **MODERATELY DEFENSIBLE** as *content* (no incumbent publishes it — FACT, R005), **EASY TO COPY** as *mechanism* (a logger). Durable only after a powered n≥30 publication exists — which LACE has not produced. |
| 9 | `WRONG_FILE` diff-only reviewer / file-scoped correction | Yes — diff the patch, compare files to failing-test mapping; prompt-only | Yes — same | Yes — same | Yes — one tool | Yes — one hook branch | Yes — `git diff --name-only` check | No | **NOT A DIFFERENTIATOR** (heuristic, LOW-MEDIUM confidence per `docs/07-recovery-policy.md`; Lite filters exclude the multi-file slice where it matters — FACT, R005) |
| 10 | Trust / MCP governance proxy (allowlist, redaction, headless policy) | Partial — permissions/`settings.json` allowlists exist natively; cross-cutting proxy is not productized | Partial — enterprise controls exist (cloud-first); thin proxy unmeasured WTP | Partial — same pattern | Yes — proxy is itself an MCP server shape | Partial — hooks enforce allowlists | Partial — wrappers | n/a — enterprise gets stronger guarantees from Copilot ZDR/BYOK/audit (EVIDENCE, R006 E07) | **MODERATELY DEFENSIBLE** as enterprise packaging, **NOT A DIFFERENTIATOR** for the terminal developer (saves zero minutes per patch; WTP unmeasured — `No reliable evidence found`) |
| 11 | Standalone runtime / multiplexer / custom bus / vector DB / multi-agent DAG | Already owned elsewhere (Herdr, tmux, MCP std, ripgrep/BM25/Tree-sitter, SOP-based teams at 3–10× cost — R003/R004/F03) | — | — | — | — | — | — | **NOT A DIFFERENTIATOR** (explicitly killed: D-002, D-004) |

Direct answers to Q1–Q8:

1. **Claude Code? Yes.** Hooks (`PostToolUse`/`Stop`) + headless `-p --bare --mcp-config --output-format stream-json` + `settings.json` reproduce the entire loop more deterministically than LACE-as-server (FACT, F04 E06/E08/E09). The 429 fix that unblocked Phase 2D *is* a hook-shaped fix (D-008).
2. **Cursor? Yes** for the loop (Composer/Cascade + terminal + context shaping); no for authoritative blocking — but neither is LACE authoritative: CI is (INFERENCE).
3. **Codex? Yes** (`apply_patch` + shell + loop cap); same caveat as Cursor.
4. **MCP? Yes — thinnest clone path.** MCP does not reproduce LACE; MCP *is* LACE's proposed form (`lace-ledger`). A competitor "reproducing" it installs the same open spec (FACT, MCP 2025-06-18).
5. **Hooks? Yes — strongest clone path.** ≤4 files, <100 LOC, <3 days desk estimate (F04 Path B). Hooks enforce where MCP only advises.
6. **Shell script? Yes.** The reference harness is stdlib Python + `git worktree` + `subprocess`; Path C is <30 LOC bash (FACT).
7. **CI? Yes for blocking and regression proof — better than LACE.** Required checks on JUnit/TAP are the authoritative gate. LACE's only CI-adjacent wedge is *pre-push* targeted Layer 2 saving one push cycle (~80s–minutes, HYPOTHESIS).
8. **Weekend build? Yes.** Single dev <1 week desk estimate (F04 §6, Medium-High confidence, not a timed build — honestly labeled). T4 timed spike (2-week replication measurement) is still open, but the burden is on LACE: nothing in the design suggests >1 week of novel work.

---

## 3. Reproduction difficulty

| Reproduction path | Effort (per F04 desk construction; timed spike NOT yet run) | What it yields | Gap vs LACE |
|---|---|---|---|
| Shell script + `git worktree` + `pytest -k` | <30 LOC bash, hours (FACT — Path C) | Full layered loop minus enforcement | Policy only (`exit 1` + required check closes it) |
| Claude Code plugin (`lace-gate` shape: SKILL + 2 hooks + manifest) | ≤4 files, <100 LOC, <3 days | Deterministic in-loop gate (L1/L2/L3 + classification + caps) | None — this *is* the proposed LACE extension |
| MCP server (`lace-ledger` shape: 4–5 tools over JSONL) | 250–350 LOC, <1 week | Ledger + `gate_run`/`gate_parse`/`worktree_create` | None — this *is* the proposed LACE extension |
| Herdr variant (`lace-herdr` shape) | 150–200 LOC copy of `commandcode.integration` precedent, <1 week | Same core in a Herdr pane | None — deployment variant by design |
| CI required checks + Pareto logger | Hours (status check) + ~20-line logger | Stronger blocking + the scorecard content | Beats LACE on authority; loses on pre-push latency only |
| **Total standalone reproduction** | **<2 weeks single dev (T4 desk bound; D-002 kills standalone on this basis)** | **Everything LACE-as-platform would ship** | **No residual** |

**INFERENCE:** There is no step in the pipeline — evidence extraction, classification, minimal-context retry, bounding, layering, regression diff, ledger append — that requires a new primitive, protocol, model, oreditor. Each step wraps a mature primitive (pytest output, string match, prompt template, loop counter, `git apply --check`, `pytest -k`, `git worktree`, JSONL). The difficulty of *coding* LACE is ~zero; the difficulty of *proving* it is everything, and proof does not ship with the install.

---

## 4. Commodity components

Everything in this list is **NOT A DIFFERENTIATOR**. A developer already owns each one; LACE re-labels composition as product.

- Test execution via shell/Docker (`pytest`, `npm test`, JUnit/TAP).
- `git worktree` isolation, `git apply --check`, `git diff --name-only`, stash/tag snapshots.
- JSONL trajectory logging; raw `stream-json` transcripts; pane logs.
- Retry loops and loop caps; timeout + keep-alive.
- Prompt-shaping (800-char tail or targeted payload — both are strings).
- Repo search (ripgrep/BM25/Tree-sitter/repo-map) — explicitly reuse-per-R004.
- Multiplexer lifecycle (tmux/Herdr panes, socket API) — F03 teardown: Duplicates.
- MCP transport itself ("USB-C for AI" — reuse, not moat — `docs/04-opportunity.md` §7).
- Required CI checks as merge gate (stronger than any agent self-report).
- Single-run token/cost counters (every CLI already shows them).
- Progress/steerability signal while streaming (harness-fixable; bundle material, not wedge alone).
- Multi-agent DAG, custom bus, custom vector DB, standalone binary (killed — D-002/D-004).

Q9 answer: capabilities 1, 4, 6, 7, 9, 11 above plus the mechanism-halves of 8 and 10 are commodity.

---

## 5. Potentially differentiated components

Honest hostile concession: two items survive as *uncommon* (per `05-verification-competitive-gap.md` §3.1) — but neither is defensible as code, and neither is proven to work.

| Candidate | Best hostile classification | Why it does not save LACE as product |
|---|---|---|
| **A. Failure-class separation with non-retryable provider Stop** (provider ≠ model ≠ verification ≠ infra) | **EASY TO COPY** (ceiling: MODERATELY DEFENSIBLE as documented policy, never as code) | Saves the most waste per incident (Phase 2D contamination proves blind-retry harm — FACT), but it is one function + one policy row (`PROVIDER_RATE_LIMIT → Stop, max 0`). Copy cost: minutes. No data, no learning, no state required. |
| **B. Layered ordering + minimal corrective context as a tuned policy** (which layer, which payload bytes, which cap per class) | **POTENTIALLY DEFENSIBLE** — the *only* item earning this label, and only as *tuned numbers*, not as mechanism | Mechanism copies in hours (§3). What cannot be copied without the experiment is the *calibration*: minimum payload that recovers, per-class retry budget, timeout/context-shaping rule. But that calibration **does not exist yet** — Phase 2C measured the naive policy failing (0/5), Phase 2D layered policy is unmeasured (D-010). A HYPOTHESIS is not a moat. If Phase 2D/T1 ever produce real numbers, this row graduates to MODERATELY DEFENSIBLE (numbers are publishable; publishing destroys exclusivity but creates credibility — the measurement-lab path). |
| **C. Pareto scorecard publication** (`% resolved \| regression \| cost \| latency \| pass@3 \| recovery` on Verified n≥30 + rolling post-cutoff, Wilson CIs) | **MODERATELY DEFENSIBLE** as credibility asset; **NOT A DIFFERENTIATOR** as software | No incumbent publishes it (FACT, R005) — real whitespace. But it is a *report*, installable value zero: the developer gains it by reading LACE's paper, not installing LACE. Durable only through *continuous* eval credibility (rolling splits incumbents won't maintain) — which LACE has not started. |
| **D. Opt-in MCP governance proxy for open harnesses** | **MODERATELY DEFENSIBLE** as enterprise packaging; **NOT A DIFFERENTIATOR** for the core developer user | Cross-repo demand signal is real (3 identical trust proposals same week + 21% trust corpus — EVIDENCE, F01) but WTP vs ZDR/BYOK is unmeasured (`No reliable evidence found`). Copy cost for the proxy shape is low (it is itself an MCP server); defensibility would come from audits/certifications/enterprise distribution, none of which exist. |

Q10 answer: only **B** is hard to reproduce *if* it ever works — and "hard" means "requires running the powered experiment," not "requires clever code." A weekend builds the mechanism; ~4–6 weeks (n≥30 Verified + billing + regression split + rolling post-cutoff) builds the only non-copyable artifact: the numbers. LACE has spent zero of those weeks.

Deliberately **not** listed as differentiated: anything requiring "learned recovery policies" — no learning system exists in the thesis, harness, or protocol; listing it would invent a moat claim (forbidden). Anything requiring "proprietary data" — the ledger schema is open JSONL by design.

---

## 6. Why LACE might still fail

Even granting the extension hypothesis every benefit of the doubt, hostile failure modes:

1. **The wedge is minutes, and minutes may not clear installation friction.** Best case per §2: one saved push cycle (~80s L2 vs minutes full suite) on failing tasks only. If recovery rate is low (current point estimate: 0/5), expected value per install is near zero. Users uninstall what pays minutes at the cost of a gate that also blocks when wrong.
2. **Heterogeneity defeats one gate strictness.** F01 21% verification corpus contains opposite demands (remove proactivity #13753 vs permission spam #13101 — EVIDENCE). A mandatory `PostToolUse → gate` on every `Edit|Write` will read as permission spam to half the corpus. Correct product is advisory-with-blocking-option — which is weaker, more forkable, and harder to attribute wins to.
3. **CI is the authority; agent self-checks are hearsay.** Teams will keep required CI checks regardless. LACE then sells "pre-CI confidence" — a nice-to-have whose failures CI catches anyway and whose passes CI re-verifies anyway. Nice-to-haves with measurable cost overhead (~2–3× tokens observed) die in procurement.
4. **Cost guardrail already breached once.** D-005: current approach 2.97× median tokens vs 2× guardrail, 2.08× latency, 0/5 recovery. Layered must cut cost *while* raising recovery — the hard direction. Every retry that fails makes trust worse than no retry (user watches tokens burn).
5. **Benchmark slice excludes LACE's best tasks.** Lite filters remove multi-file/>3-hunk/file-create work (FACT, R005) — exactly where `WRONG_FILE` review and targeted evidence would shine. T1 on Lite therefore *understates* real-repo value and *overstates* generalizability simultaneously. Either outcome is attackable.
6. **Distribution is owned by hosts.** Claude Code plugin marketplace, MCP registry, Cursor/Codex extension points set the rules, take the relationship, and can absorb the gate natively (as Aider already absorbed `--auto-test` after F01 #5610 — EVIDENCE of absorption). A one-hook product is one host release away from redundancy.
7. **No compounding asset accrues from usage.** §7 below details: usage produces local logs, not a shared improving model. Month-12 LACE with 10k users is no smarter than day-1 LACE — but day-1 LACE cost support burden. Non-compounding wrappers getازند cloned, not acquired.

---

## 7. What LACE would have to own

Q11–Q14 answers. Bar: an asset that (a) improves with scale, (b) cannot be cloned from the open spec, (c) makes the next user strictly better off.

| Moat candidate | Exists? | Verdict |
|---|---|---|
| Proprietary data | No. Ledger is local JSONL by design; no shared corpus; no consent pipeline; no scale. | **Absent.** Would require opt-in cross-user failure/evidencerecovery telemetry at scale + privacy story — unbuilt, unmeasured, and in tension with the trust wedge. |
| Workflow state | No. Worktrees are ephemeral; ledger is per-run; no cross-task memory productized (`CLAUDE.md` already does memory natively). | **Absent.** Session state is host-owned. |
| Evaluation data | No. No powered run published (n=5 pilot, CIs overlapping; Phase 2D contaminated). | **Absent.** Would require continuous Verified n≥30–100 + rolling post-cutoff + real billing + Wilson CIs, maintained as a live leaderboard. This is the only credible path — and it is a publication, not an install. |
| Learned recovery policies | No. Policy is a static 12-class matrix (`docs/07-recovery-policy.md`); no training, no bandit, no retrieval over past recoveries. | **Absent.** Would require measured per-class success rates driving adaptive budgets — which first requires the evaluation data above. Two unbuilt layers deep. |
| Something else (brand, distribution, certification) | No. Codename only; no marketplace presence; no audit/SOC story. | **Absent.** |
| Network effect (Q12) | No. One user's ledger does not improve another user's recovery. No shared artifact, no protocol participation benefit, no marketplace liquidity. | **None.** |
| Workflow lock-in (Q13) | No. Removal = delete one MCP JSON entry / one `settings.json` hook block / one plugin dir. Ledger is plain JSONL (portable by design — portability *anti*-locks). No proprietary format, no hosted state, no migration cost. | **None. Switching cost ≈ 0.** |
| Trust/observability advantage (Q14) | Partial as whitespace, absent as owned asset. Pareto transparency + failure-class separation are genuinely uncommon (FACT, R005/D-008) but ownable only via *continuous published measurement*, not via installed code. | **Potential only.** First powered publication earns credibility; each subsequent rolling release compounds it. Nothing installed is required to consume it. |

Q15 answer: **yes — LACE could only ever be a plugin, and the thesis already concedes this (D-001/D-002).** Standalone fails T4 (<2 weeks reproduction). The remaining question is not "plugin vs platform" but "plugin vs nothing" — i.e., whether the plugin's measured Pareto win (T1) justifies its complexity over the developer's own 30-line hook. That measurement does not exist.

**Therefore what LACE would have to own to be defensible:** exactly one thing — **powered, continuously refreshed Pareto evidence that its tuned layered policy beats the developer's own hook** (T1: ≥10pp at ≤2× with regression ≤, n≥30, Wilson non-overlap + rolling split), plus the *cadence* of re-publication. Everything else is forkable. If it cannot own that number, it owns nothing.

---

## 8. Kill conditions

Pre-registered gates apply unchanged (`docs/05-product-thesis.md` Kill Criteria; D-005/D-007/D-010). Hostile restatement — kill fast, no renegotiation:

1. **Phase 2D design gate fails on clean data** (layered recovery ≤ current, or median tokens >1.5× baseline, or median latency >1.5× baseline, or regression inferior, n=7) → kill layered orchestration as CORE; keep single-agent default, community plugin only.
2. **T1 fails at n≥30 Verified** (no ≥10pp at ≤2× cost/latency with regression ≤, Wilson CIs overlapping) → kill verification-as-CORE; plugin stays informational only.
3. **T1 fails at n≥100** → permanent KILL on verification as CORE.
4. **T2 fails (n≥20 HerdrDelta)** → Herdr CORE dead forever (already OPTIONAL — D-003).
5. **T3 fails (enterprise interviews + policy review)** → local-first dead as core (already secondary).
6. **T4 measured spike succeeds fast** (external dev clones gate+ledger with equal-or-better Pareto in ≤2 weeks) → even the extension has no feature moat; survive only as measurement lab or die.
7. **All T1–T4 fail → permanent KILL.** No further pivot. Publish reusable assets (corpus, harnesses, policy matrix, gap analyses) and stop.
8. **Hostile early-kill trigger (new):** if the clean Phase 2D rerun reproduces Phase 2C economics (≈0 recovery at >2× cost) on the layered arm, do not spend n≥30 resources — proceed directly to kill-step 2 verdict on design evidence. Burning a powered run to confirm a design failure is waste, not rigor.

---

## 9. Recommendation

**Do not build a product. Do not market an install. Run the single measurement that can kill the hypothesis, in the cheapest possible order — and pre-commit to the kill.**

1. Clean Phase 2D rerun (n=7, quota-guarded, D-008 enforced) → evaluate design gate. Any breach → kill layered CORE immediately (§8.1, §8.8).
2. Only on gate pass: timed T4 replication spike (external dev, 2-week box) in parallel with T1 planning — if the spike matches LACE's numbers, the extension's only future is the measurement lab, not the hook.
3. Only if both survive: powered T1 (n≥30 Verified, real tiktoken billing, regression split, rolling post-cutoff, Wilson CIs). Pass → the project earns THIN-BUT-PROMISING graduation discussion. Fail → kills per §8.2–8.3, no renegotiation.
4. Until then: no branding, no standalone, no multi-agent default, no local-first claims, no new primitives (existing Non-Goals stand). The cheapest honest artifact LACE can ship today is not software — it is the Pareto report incumbents won't publish, *after* it has powered numbers. Today that report would show 0/5 at 2.97×. Do not publish marketing; publish the kill-test protocol and abide by it.

**Why anyone would install LACE today — hostile answer: no one should.** The rational developer reproduces the valuable 10% (provider Stop + worktree + one `Stop` hook running targeted pytest) in an afternoon, keeps authoritative blocking in CI, and skips the wrapper. LACE's installation value is currently negative once token overhead and gate friction are priced in. The burden of proof — one powered number — is entirely on LACE, and it has not been met.

---

WRAPPER
