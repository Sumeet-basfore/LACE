# Research Record — LACE

**Working codename:** LACE (not final) · **Phases:** R001–R007 (Wave 1 + adversarial) + F01–F04 (validation) · **Model:** all workers `muse-spark-1.2-contributor-free` · **Workspace:** `LACE Validation` (w4, 5 tabs) · **Artifacts:** `research/{R001-R007,F01-F04}/` (32 files, ~3,200 lines) + `research/ledger.md` + `research/reports/01-research-synthesis.md` + `02-validation-synthesis.md` · **Date:** 2026-09-02

Condensed authoritative record. Full evidence in ledger and per-task `evidence.md` tables with URLs, dates, quotes. Does not copy synthesis verbatim — extracts strongest findings with confidence preserved.

---

## Executive Summary

- **Validation decision is PIVOT**, not GO and not KILL. The original thesis (standalone, local-first, multi-agent by default, Herdr as core runtime covering all incumbents) is **not validated**. A narrower hypothesis is: *a verification-first harness, implemented as thin host-native extension(s) around existing agents, may improve reliability, recovery, regression detection, and observability* — but this remains a hypothesis gated behind pre-registered thresholds (T1–T4). [02 §12]
- **Strongly validated for affected users (Medium-High):** severe, harness-solvable pains exist — loops/hangs (blocking), hallucination/unreliable edits (silent incorrectness), regression/state loss (data loss), privacy/credential trust (enterprise blocker), plus verification burden and context loss. Validated across 67 GH issues/PRs (F01, 262 fetched → 67 retained) plus 15-source R002 corpus — convergence strengthens existence. **Not validated for market:** corpus prevalence (7–21%) must not be converted to population prevalence — no survey n>100 found, explicitly `No reliable evidence found.` [F01]
- **Verification-first mechanism is feasible but not proven to win at scale:** pilot n=5 synthetic on same model `muse-spark-1.2-contributor-free` showed baseline 80% (4/5) vs candidate 100% (5/5) = +20pp driven by one recovery via `spec→tests→gate→parse→feedback` using worktree isolation, median cost 1.28× (per-retry 2.05× at threshold edge), regression 0, reliability 3/3. Wilson CIs 37.6–96.4% vs 56.6–100% **heavily overlapping** — F02 correctly **does not claim** improvement. Detecting 10pp needs ~300/arm; n=5 is far below n≥30 gate. [F02, 02 §4]
- **Herdr is OPTIONAL INTEGRATION, not CORE:** live 0.8.2 snapshot (protocol 20, 3 workspaces, 11 panes, 5 agents) shows **Material** advantage over tmux on lifecycle (`working/blocked/done/idle/unknown`), observability (`pane read` 4 modes + `api snapshot`), persistence (server owns panes, `session.json` v3), ergonomics — but LACE over Herdr is mostly Duplicates/Thin; only **Real** gaps are task-level observability & recovery (verification gate) and handoff policy. Provisional gate T2 (>30% time-to-green or >50% fewer interventions, n≥20) is **untested**. [F03, 02 §6]
- **Standalone defensibility fails:** thin reproduction is MCP server 250–350 LOC, Claude Code plugin <100 LOC (hooks), Herdr plugin 150–200 LOC (copy of `commandcode.integration` template) — single dev **<1 week**, <2 weeks High confidence per specs + local manifest. Therefore **Outcome 3 (MCP/agent extension) + 2 (Herdr plugin variant)** justified, **standalone REJECTED**, thesis should change if multi-agent stays core. T4 (if <2 weeks via MCP then kill standalone) fails for standalone. [F04, 02 §7-§8]
- **Multi-agent remains EXPERIMENTAL:** no controlled same-model A/B on SWE-bench retrieved after targeted search (`No reliable evidence found.` [R003 E10, F02]), prior gains are narrow (ChatDev 0.395 vs 0.152, MetaGPT +19pp HumanEval via SOPs+feedback) at 3–10× cost, prototype ceiling, no demand signal in 67 issues. [R003, 02 §5]

---

## Research Questions

**Wave 1 (R001–R007):** Is there a meaningful, underserved, defensible opportunity for a new harness, treating multi-agent orchestration as hypothesis? Sub-questions: competitive landscape (12 products), user pain, multi-agent evidence, architecture techniques, benchmarks, privacy/local enterprise, plus adversarial "prove should NOT be built." [01 §1]

**Validation (F01–F04):** Is there enough evidence to justify building, and what is the narrowest defensible wedge? F01: are pains frequent/severe enough (50–100 GH sample)? F02: does verification-first orchestration justify complexity vs same-model baseline (pre-registered T1: ≥10pp at ≤2× cost, regression ≤)? F03: does Herdr provide meaningful advantage vs `tmux+worktree+agent` (T2: >30% or >50%)? F04: is product merely `Claude Code/OpenCode + MCP + ledger + gate` reproducible in <2 weeks (T4)? [02 §1, ledger]

---

## Methodology

**Source hierarchy (skill):** 1 papers/specs, 2 official docs, 3 official repos, 4 GH issues/discussions, 5 engineering blogs, 6 benchmarks, 7 dev reports, 8 secondary, 9 forum anecdotes (sentiment only). Higher beats lower on conflict. Prefer recent (≤12 mo) for product behavior, original for stable technique. Every important claim cited with URL + access date + quote in `evidence.md`; all findings labeled **FACT / EVIDENCE / INFERENCE / HYPOTHESIS / OPINION**; contradictions handled; uncertainty + `No reliable evidence found.` stated; no invented benchmark numbers, prices, stars, counts. Workers `muse-spark-1.2-contributor-free`, each in own Herdr tab, did not spawn sub-workers. [SKILL.md, R001–R007/F01–F04 reports]

**Concrete methods:**
- GH Search API + HN Algolia via `curl`/`gh` (no `tavily`/`exa` — limitation throughout). R002: 15 sources; F01: 28 repo-filtered queries across cline/continue/Aider/opencode/zed, 262 fetched → 67 retained after noise exclusion, 4 HN extras, all URLs/quotes saved in `raw/details.json`. [F01 §2]
- Official docs/repos via `curl -I` (HEAD 12/12 live 2026-09-02) + `curl -fsSL` for Herdr (`herdr.dev/*`, skill, `session.json`, `config.toml`) and MCP `specification/2025-06-18`, ACP, Claude Code `code.claude.com/docs/llms.txt` → hooks/plugins/MCP/headless pages, `herdr api snapshot`, `tmux -V`, `git worktree --help`. [F03, F04]
- Papers via `arxiv.org/abs` + `raw.githubusercontent.com` for ChatDev/MetaGPT/AutoGen/MacNet/Puppeteer, SWE-bench family pages (`swebench.com/*`), LiveCodeBench paper + site, HumanEval, Aider leaderboards. Where pages JS-rendered (pricing, Cursor privacy, OpenCode docs) logged as truncated / `No reliable evidence found.` [R001–R006]
- Experiment: F02 pre-registered pilot n=5 synthetic bug-fixes (`F02/pilot/repo` @ `7b9850d`, hidden `tests_reference.py` 6 tests), same model + temp + specs, worktree vs tmpdir, wall-clock + chars/4 tokens, Wilson 95% CI, Pareto scorecard per R005. [F02]

---

## Major Findings

**1. Competitive landscape (R001):** 12/12 products live (HEAD 202, 301, 308) — Claude Code, Codex, OpenCode, Aider, Cline, Roo Code, OpenHands, SWE-agent, Cursor, Windsurf, Zed, Herdr. No incumbent covers provider-agnostic + local/offline + first-class verification + persistent multi-agent + open/hackable *all at once*, but **each piece is covered somewhere** (Claude Code + `git worktree` + Herdr + Aider/OpenCode). Gap is integration, not capability. Herdr is *only multiplexer-native layer* (R001). **Confidence:** High existence, Medium details (training fallback), Low sentiment. [01 §3, F04]

**2. User pain → prevalence (R002 + F01):** F01 (67 GH) validates R002 (15-source) with 4× larger corpus:
- Most **frequent in corpus** (not population): privacy/trust 21% (14) + verification burden 21% (14) — inflated by fix PRs that add trust/verification.
- **Most severe (blocks/data loss):** loops/hangs 7% (hangs indefinitely, no logs), hallucination 9% (doubled-prefix, unknown MCP tool), regression 10% (discards all changes, 4 comments), privacy 21% (unredacted telemetry, `.env override`), context loss 6% but High severity for long-horizon ("difficult to keep agent on track... context is state"). **Confidence:** Medium-High existence/severity in corpus, **Low** demand sizing. [F01 §4-§5, 02 §1-§2]

**3. Multi-agent evidence (R003):** Positive but narrow — ChatDev quality 0.3953 vs 0.1523, pairwise 77%/90% vs GPT-Engineer (SRDD 1200), MetaGPT +19pp HumanEval (SOPs+feedback where feedback alone +4.2pp/+5.4pp) — but **3–4× tokens, ~10× latency** (15.6s→148–154s; 503–762s), prototype ceiling ("simple logic, low information density"), **No reliable evidence found** for controlled same-model SWE-bench A/B. Coordination burden needs DAG/RL orchestrator (MacNet/Puppeteer, research-grade). **Verdict:** EXPERIMENTAL, not CORE; 2–3 roles max only if T1 passes. [01 §6, 02 §5]

**4. Architecture techniques (R004):** Mature reuse — ReAct (+34% ALFWorld, +10% WebShop [E01]) mature; MCP 2025-06-18 spec ("USB-C for AI"), ACP ("LSP for agents") are standards; Tree-sitter/ripgrep/BM25, `git worktree`/`apply`, JSONL trajectory, containers mature — directive *"Do not build custom bus/parser/vector DB; reuse primitives; build minimal loop+d dispatcher + repo-map ranker + verification orchestrator; defer embeddings/AST/ACP-remote."* **Confidence:** High general maturity, Medium-Low coding-specific effectiveness. [01 §4, F04]

**5. Benchmarks (R005):** SWE-bench 2,294 (12 repos) → Lite 300 (+23 dev) → Verified 500 (human-filtered with OpenAI, 500/2,294 kept) → Multimodal V2 480 after flaky removal; Java port; LiveCodeBench ~400 rolling contamination-free; HumanEval 164; Aider 225 polyglot. **Critical gaps:** Lite filters *multi-file/>3-hunk/file-create* — precisely LACE claim; harness confounding (Verified standardizes on mini-SWE-agent); *all* ignore cost/reliability/regression/human-intervention; need Pareto scorecard (`% resolved | regression | median cost | time | reliability | recovery`) + rolling post-cutoff split. **Confidence:** High structure, Medium critiques. [01 §4, 02 §11]

**6. Privacy/local (R006 + F01 privacy 21%):** Enterprise controls productized (content exclusion, BYOK, private registry, audit, sandboxing) proving buyer pressure [R006 E07, F01], but *preferred fix is approved cloud with ZDR/BYOK + gateway* — LM Studio hedges ("Privacy is key... ZDR" + "For demanding tasks, run Bionic with frontier models" [R006 E04]). Local runtime mature (Ollama one-line, Docker, broad library), but **packaged local agent is fragile** — Continue *archived read-only* [R006 E05]. No quantified local-vs-cloud gap or 8GB bench (`No reliable evidence found.`). **Verdict:** IMPORTANT SECONDARY / differentiator, **NICHE as primary → REJECTED**, hybrid wins. **Confidence:** High direction, Low magnitude. [01 §8, 02 §1]

**7. Validation pilots (F02–F04):**
- **F02:** mechanism feasible (one recovery via gate) but **value not proven** — +20pp overlapping CI, per-retry cost at edge, T1 NOT MET (n=5 <<300 needed for 10pp). [02 §4]
- **F03:** Herdr 0.8.2 live (3 ws, 11 panes, 5 agents, integrations pi/claude/codex/copilot/opencode). **Material** advantage over tmux only on lifecycle/observability/persistence/ergonomics; vs LACE mostly Duplicates/Thin — only **Real** gaps task-level verification + ledger. **OPTIONAL INTEGRATION**, T2 untested. [02 §6]
- **F04:** thin reproduction demonstrated — **MCP 250–350 LOC, Claude hook <100 LOC, Herdr plugin 150–200 LOC** (copy of `commandcode.integration` template) — single dev <1 week, T4 **fails for standalone** → **Outcome 3 (MCP/agent extension) + 2 (Herdr variant)**, standalone REJECTED, thesis should change if multi-agent stays core. **Confidence:** High specs, Medium-High <2 weeks. [02 §7-§8]

---

## Supporting Evidence (strongest, per hierarchy)

| Claim | Source type | Strength | Pointer |
|---|---|---|---|
| 12/12 products live 2026-09-02 (HEAD) | Official docs/repos via `curl -I` | **High** | R001 E02, R007 E02, ledger |
| Multi-agent cost 3–4× tok, ~10× latency (7,182→29k, 15.6s→154s) | Peer-reviewed tables (SRDD) | **High** | R003 E01 T3, F02 |
| Hallucination/context trimming as labeled bug class | GH issues (multiple repos) | **High** | F01 6 hallucination issues, R002 E09-10, R003 E06 |
| SOPs+feedback +4–5pp, prototype ceiling, 45% ModuleNotFound persisting | Peer-reviewed ablations | **Medium-High** | R003 E02, E06 |
| 67 GH issues corpus (4 HRs): loops hangs indefinitely, discards changes, doubled-prefix, unredacted telemetry | Primary GH issues (labeled, quoted) | **Medium-High** corpus | F01 evidence 67 + `raw/details.json` |
| SWE-bench filtering 500/2,294 Verified, 480 multimodal, harness confounding | Official pages + LiveCodeBench paper/site | **High** | R005 E02-06, E10-11 |
| Enterprise BYOK/ZDR/sandbox productized | Official docs nav (Copilot, LM Studio ZDR) | **High** | R006 E04/E07, F01 trust proposals |
| Herdr 0.8.2 live (protocol 20) lifecycle/snapshot/socket, `session.json` v3, integrations | Live runtime + official docs/skill | **High** | F03 E01-07/E14-15 |
| MCP 2025-06-18 JSON-RPC over stdio/SSE/Streamable HTTP, ACP "LSP for agents" | Official specs | **High** | F04 E01-E04, R004 |
| Continue archived read-only (packaged local fragile) | Official repo | **High** | R006 E05, F04 |
| F02 pilot +20pp but Wilson CI overlaps, median 1.28× (per-retry 2.05×), regression 0 | Pilot harness + `results_*.json` | **Medium** feasibility, **Low** generalization | F02 |
| Thin reproduction 150–350 LOC <1 week bounded by inspected plugin | Inspected plugin manifest + scaffolder docs | **High** spec, **Medium-High** timeline | F04 E11-14, 02 §8 |

*All with URLs + access dates in per-task `evidence.md`. Prices/stars/market sizes not invented — gaps logged as `No reliable evidence found.` where pages JS-rendered.*

---

## Contradictions (handled, not omitted)

1. **Multi-agent value** — R001 "gap is orchestration" vs R003 "3–10× cost, no SWE-bench A/B, prototype ceiling" — weighted to R003 tables (High) over R001 conjunction inference (Medium); resolved to EXPERIMENTAL until T1. F02 pilot (+20pp at edge cost, n=5) does not resolve — CI overlaps, n insufficient. [01 synthesis §6, 02 §5]
2. **Privacy weight** — R002 credential sprawl as blocker vs R006 "ZDR/BYOK satisfies broader market, pure-local minority" — weighted to R006 primary docs (LM Studio ZDR hedging + Copilot BYOK) over hybrid anecdotes; resolved to IMPORTANT SECONDARY, not CORE; F01 21% privacy supports existence but may inflate from fix PRs — not population. [01 §8, F01]
3. **Benchmark "real-world"** — SWE-bench claimed real-world vs Lite/Verified prove filtering removes multi-file/>3-hunk tasks LACE claims to improve — weighted to Verified/Lite pages (human-audited, higher) — weakens incremental-gain story; F02 reproduces overestimate. [R005, F02]
4. **Autonomy direction** — vendor push (GitHub 2025 agent mode more autonomy) vs user requests to curb proactivity (`BE HELPFUL AND PROACTIVE` remove #13753 vs permission spam #13101) — weighted to user issues (pain) over marketing; shows heterogeneity, not single preference. [F01]
5. **Herdr vs tmux** — R001 "only multiplexer-native" vs R007 "tmux+worktree may suffice" — F03 resolves: Herdr **Material** on ergonomics/observability, but task isolation is identical (`git worktree` either way) — insufficient alone for CORE without T2. [F03]
6. **Wrapper moat vs "covers all" gap** — R001 "no incumbent covers all" (Medium conjunction) vs R004/R007/F04 "each piece covered somewhere, composition cheap" (High specs + live liveness) — weighted to latter — gap is integration, moat near-zero as standalone.
7. **Model vs harness attribution** for context/hallucination — HN H02 "not model but harness" vs GH issues attributing to model — weighted to primary GH issues (4) over anecdotal HN (9), but treated as signal harness can mitigate even model failures.

---

## Evidence Gaps (decision-critical, explicitly logged)

All marked `No reliable evidence found.` after `curl` + GH/HN APIs (no `tavily`/`exa`):

1. **Population prevalence / willingness-to-pay** — no survey n>100 ranking collaboration/persistence vs reliable single-agent — F01 corpus (7–21%) is corpus not population. Need Stack Overflow/JetBrains splice + 5 regulated-enterprise interviews. [F01, 02 §11.1]
2. **SWE-bench Verified Pareto at scale with real billing** — F02 n=5 feasibility only (Wilson overlap, n≈300 needed for 10pp); need n≥30 (prefer 100+) on Verified/Lite with mini-SWE-agent standardization + tiktoken + $/1K + 95% CI + LiveCodeBench rolling split. [F02]
3. **HerdrDelta n≥20 timed experiment** — F03 is conceptual teardown + live snapshot, no time-to-green or intervention measurement (T2 >30% or >50% untested). [F03]
4. **Timed replication spike (T4 measured)** — F04 is desk estimate (150–350 LOC bounded by inspected plugin), not built artifact. Need 2-week time-boxed build of MCP + Claude plugin + Herdr variant. [F04]
5. **OpenCode plugin manifest + real pricing pages** — OpenCode docs shell truncated (Astro SSR), pricing/benchmark bodies JS-rendered — Low confidence on those paths. [F04]
6. **Local-vs-cloud quantified gap + 8GB hardware rig** — no SWE-bench table for Qwen 14B Q4 / DeepSeek Lite vs frontier, no 8GB tokens/sec harness. Direction High, magnitude Low. [R006]
7. **File-ownership / concurrency under parallel agents** — no evidence retrieved (F03/F04 gap) — parallel coding interference unmeasured.

*Until 1–4 are measured, treat GO claims as unproven (validation correctly stopped at pilot).*

---

## Confidence Levels (synthesis-level)

- **High:** 12/12 liveness; multi-agent cost penalty (tabulated); SWE-bench family structure + Lite filtering + harness confounding + LiveCodeBench contamination-free; enterprise controls existence; MCP/ACP/Tree-sitter/ripgrep/`git worktree`/JSONL maturity; Herdr runtime lifecycle/snapshot/API (live 0.8.2); thin reproduction <2 weeks bounded by inspected plugin + scaffolder; pain *existence* for 4 clusters (cross-repo, F01+R002 triangulation).
- **Medium:** Pain *severity* ranking (judgment not count); hybrid harness vs model attribution; verification wedge as durable differentiator (inferred from pain + benchmark gap, not yet proven by Pareto win); fix-PR-inflated prevalence interpretation.
- **Low:** Population prevalence/demand (no survey); magnitude of local-vs-cloud gap + 8GB ceiling; pricing at scale; multi-agent general SWE-bench superiority (no A/B); wrapper replication timeline as measured build (desk estimate only).

**Method limits:** no web-search aggregator (curl+GH/HN APIs only, GH org renames required fallback); pricing/benchmark bodies truncated where JS-rendered; SWE-bench scores deliberately not scraped to avoid stale invention; Wave 1 relied on HEAD + training fallback (Medium) — needs live re-verification; recent 2026 window only; fix PRs inflate verification/privacy counts; synthetic pilot underestimates real repo scale/retrieval/multi-file difficulty and overestimates reliability; OpenCode docs truncated; no timed replication build.

---

## What the Research Ruled Out

- **Do not build:** standalone binary / custom multiplexer / custom MCP protocol / custom vector DB / multi-agent DAG/RL orchestrator as default (MacNet/Puppeteer-scale) / pure-local-first as primary wedge / 8GB-as-primary promise / another general-purpose agent (13th agent) / feature parity with Cursor/Claude Code/Codex / custom editor unless later justified. All are duplicates of mature primitives or unproven bets flagged for deferral. [01 §10 kill list, 02 §10, R004]
- **Multi-agent by default, Herdr as core runtime, local-first as wedge** — explicitly demoted: multi-agent → EXPERIMENTAL until T1, Herdr → OPTIONAL INTEGRATION until T2, local → IMPORTANT SECONDARY unless T3 (≥40% pure-local mandatory). [01 §6-§8, 02 §5-§6]
- **ACP as primary extension** — remote WIP, narrower than MCP — monitor, don't bet. [R004, F04]

---

## Current Conclusion

**PIVOT** (with KILL fallback) per 02 §12 — unanimous across validation:

> **From:** open, local-first, multi-agent harness with persistent shared state, checkpoints, repository intelligence, verification — covers all incumbents.
> **To:** verification-first harness as **thin, host-native extension(s)** — reusable `spec → tests → gate → parse → feedback` loop with worktree isolation, JSONL ledger, cost/reliability/regression transparency, shipped as (a) MCP server `lace-ledger` + (b) Claude Code plugin `lace-gate` (`skills/verify/SKILL.md` + `PostToolUse`/`Stop` hooks), with (c) Herdr plugin `lace-herdr` variant reusing pane persistence — no standalone binary, custom multiplexer, or multi-agent orchestrator, and none requiring pure-local.

**This is a direction to test, not proof of a successful product.** Pilot proved mechanism but not Pareto win (CI overlaps, per-retry at edge, n=5 <<300). Gated follow-ups (T1 ≥10pp at ≤2× cost with regression ≤, n≥30, 95% CI; T2 HerdrDelta >30% or >50% n≥20; T3 local ≥40%; T4 replication) remain kill/scale stops — do not renegotiate. If all T1-T4 fail, **permanent KILL**; if T1 fails at n≥100, kill verification as CORE. Reusable assets preserved: 11-task corpus (67 GH issues + raw), pilot repo/harness, extension skeletons, ledger/syntheses, Herdr snapshot.

