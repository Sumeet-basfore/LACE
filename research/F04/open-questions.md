# F04 Open Questions — Wrapper / Moat Test

Per `skills/research-agent/SKILL.md`: unanswered questions, missing evidence, follow-up ideas. No reliable evidence found marked explicitly.

---

## 1. Replication Timing (T4) Not Measured

**Gap:** Desk-estimate says <2 weeks, but no timed replication spike was run (no MCP server actually built, no wall-clock, no external team trial). R007 T4 asks "whether an existing team can add ledger+verification gate to Claude Code/OpenCode via MCP in <2 weeks" — this task infers yes from scaffolder + template copy, but did not run the spike.

**Follow-up:** Time-boxed spike: single dev, bare checklist (scaffold MCP server via `mcp-server-dev`, add 4 tools, add hooks `PostToolUse`+`Stop`, verify gate blocks on failure, submit to Claude plugin marketplace), stop at 10 days. External replication by a second dev (not LACE) to confirm portability. Record `started→submitted` hours, LOC, failure modes.

**No reliable evidence found** for wall-clock LOC/day for MCP plugin builds beyond n=1 `commandcode` instance.

## 2. OpenCode Plugin Manifest Not Verified Live

**Gap:** `opencode.ai/docs` returned Astro SSR shell only (headers + script shell, no Markdown body) — plugin/extension file layout, config keys, and MCP client wiring not extracted [E15]. GitHub API confirms repo liveness [E16] but not docs.

**Follow-up:** Re-fetch via rendered browser or `raw.githubusercontent.com/anomalyco/opencode/.../README.md` + repo `plugins/` or `src/plugin` directory listing via GitHub API (`/repos/anomalyco/opencode/contents`). Confirm whether OpenCode supports MCP client and plugin manifest analogous to Claude Code.

**Status:** `No reliable evidence found.` for OpenCode extension manifest after direct curl 2026-09-02.

## 3. ACP Remote & Maturity Risk for LACE-as-ACP

**Gap:** ACP spec says "Full support for remote agents is a work in progress" and scope is editor↔agent, not agent→world [E04]. Could an ACP extension carry ledger+verification, or does it duplicate MCP? R004 marks ACP-remote conditional — no benchmark of adoption friction.

**Follow-up:** Survey Zed + Herdr ACP shim status (does Herdr expose ACP client? does Zed serve it?), attempt minimal ACP handshake over stdio, measure docs/examples completeness vs MCP.

## 4. Herdr Plugin API Drift

**Gap:** Inspected manifest pins `min_herdr_version = "0.7.0"` [E11]; current stable is 0.8.2 [E14]. `panes`/`actions` keys and `agent-detection` override shape may have changed; only one plugin inspected.

**Follow-up:** Fetch `herdr.dev/docs/plugins` + `herdr.dev/docs/socket-api` via raw GitHub (links in `llms.txt`), list ≥3 more plugins from `herdr.dev/docs/marketplace` (GitHub marketplace curation), diff manifest schemas across versions.

## 5. Verification Gate Effectiveness Not Measured

**Gap:** This test shows *can* ship gate as hook/MCP, not *does* gate improve regression/recovery/cost vs baseline. R005 gap ("no benchmark reports regression rate or human-intervention rate") and R002 verification burden are pain signals, but no A/B of gate vs no-gate on SWE-bench Verified or local repo suite.

**Follow-up:** Define Pareto metrics per R005 synthesis (`% resolved | regression | median cost/time | reliability pass@3 | recovery`). Run n≥30 Verified with gate enabled (PostToolUse → test → parse → feedback) vs bare `claude -p` — measure regression delta, manual-intervention delta, cost/latency overhead. This is T1-adjacent.

## 6. Claude Code Hook Coverage Edge Cases

**Gap:** Hook guide notes async hooks and MCP tool hooks in full `en/hooks` reference, not fetched here (only guide [E06]). Does `PostToolUse` fire for MCP tools? For background tasks that outlive `claude -p` 5s grace [E09]? For `--bare` mode? Exact blocking semantics of `Stop` gate need empirical test.

**Follow-up:** Build minimal `Stop` hook that exits non-zero on test failure; verify Claude Code blocks merge/prompt continuation. Test `PostToolUse` matcher `Edit|Write` vs MCP `EditTool` equivalents. Test `claude -p --bare` SessionEnd vs interactive Stop distinction.

## 7. Pricing / Token Cost of Hook-Gate Overhead

**Gap:** R001 notes pricing pages JS-rendered and not verified; R007 cost is paper token counts (3–4×) not live API billing. Hook-gate adds tool turns (ledger_append + gate_run per edit) — live cost delta unknown.

**Follow-up:** Instrument `claude -p --output-format stream-json` token counts with/without gate hooks on 20 tasks; report median $/task and latency, compare to R003 table.

## 8. Existing-Tools-Already-Solve Boundary

**Gap:** Outcome 4 vs 3 hinges on whether a 1-hook gate counts as "existing tools." Purist would say hooks are existing tools (so outcome 4); this report classed it as outcome 3 because hook config is new code. Threshold wording matters.

**Follow-up:** Tighten T4 wording: does ≤20 LOC hook config count as reproduction? If yes, outcome 4 and 3 collapse — re-vote with explicit LOC threshold pre-registered before spike.

## 9. Distribution & Trust Surface Not Evaluated

**Gap:** Not tested: plugin marketplace review, `mcp.json` per-repo vs global scope, Bearer header auth for HTTP MCP [E07], prompt-injection via MCP servers that fetch external content (Claude warning [E07]), Herdr plugin install via `github:` pinning trust model.

**Follow-up:** Threat model + install friction survey: compare `claude plugin install` marketplace vs `claude mcp add --transport http` with header vs Herdr `github:` source — which has lowest onboarding dropoff and safest defaults?

## 10. Local/Offline Enforcement for Thin Layer

**Gap:** R006 hybrid privacy story (BYOK/ZDR/auditable local) not tested for MCP thin layer. Does `claude -p --bare` + local MCP server guarantee "nothing leaves" verifiably? Ollama/LM Studio provider path not probed.

**Follow-up:** Network capture during local-only gate run; verify no egress. Document auditable claim language for local mode ("R006 E01" style) for plugin README.

---

## When to Run Follow-Ups

- Before any standalone build decision: **#1 + #5 + #8** (replication spike + gate effectiveness + threshold wording) — they directly decide T4.
- Before Herdr plugin marketing: **#4**.
- Before claiming OpenCode coverage: **#2**.
- Before enterprise pitch: **#10 + #9**.

