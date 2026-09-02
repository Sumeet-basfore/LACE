# R002 — Open Questions

## Unanswered / Partially Answered

1. **Prevalence quantification** — What % of agent tasks experience hallucination, context loss, or regression in the wild (not just benchmarks)? No reliable survey or telemetry found via GitHub/HN API fetch; need Stack Overflow, JetBrains, GitHub Octoverse, or vendor telemetry.
2. **Cost & latency distribution** — Median / p95 tokens, wall-clock latency, and $ cost per task by model/harness; and how loops amplify cost ("twice as much" [E12] is single-source, no methodology).
3. **Repo understanding depth** — At what repo size / language / build complexity does understanding break down? No controlled breakdown fetched.
4. **Verification effectiveness** — Does plan-preview (e.g., PlanBridge) measurably reduce regressions vs. inline review? No A/B data found.
5. **Approval fatigue threshold** — How many approvals per task before users disable gating or accept risk? No UX study surfaced.
6. **Multi-agent coordination** — Frequency/severity of parallel-edit conflicts, merge races, and shared-state corruption beyond single Cline duplicate-session issue [E15].
7. **Privacy / enterprise** — Concrete enterprise blockers: allow-list policies, data-residency, secret-leak incidents, audit requirements beyond the Kontext framing [E02] and MCP trust proposals [E06][E07].
8. **Local models & low-resource** — Which local models (Ollama, etc.) reliably sustain plan/agent modes without hangs [E04]? Benchmarks per quantized size not fetched.

## Missing Evidence (No reliable evidence found after reasonable search)

- `No reliable evidence found.` for: systematic user survey n>100 ranking agent pains; SWE-bench failure-mode breakdown attributing hallucinations vs. context vs. reasoning; head-to-head agent comparison on long-horizon success; pricing-page cost calculations; Reddit sentiment quantification.
- **What was searched:** GitHub API search + repo issue listing (Cline, Continue, Aider, opencode), HN Algolia (stories + comments), direct curl to GitHub Blog + Anthropic news. Reddit API not accessible without auth; arXiv/openalex not queried; no browser search tool available (2026-09-02).

## Contradictions Needing Deeper Work

- Vendor autonomy narrative [E01] vs. user pushback on proactivity [E05] — need longitudinal study: do users re-enable autonomy after guardrails improve?
- Cost implication of loops [E12] — single title claim vs. silence; needs token accounting from harness logs.

## Follow-Up Ideas (in scope & out-of-scope extensions)

- **In-scope deep dive:** Pull 50–100 recent GitHub issues per harness (Cline, Aider, Continue, opencode, Cursor) coded by pain theme; quantify frequency (lightweight content analysis). Fetch arXiv papers on agent hallucination mitigation.
- **Out-of-scope (note, don't chase now):** Enterprise interview study on privacy/compliance gates; lab study on approval-UX tradeoffs; cost modeling across providers.
- **Methodology fix:** Use proper web-search + Reddit/Stack Overflow API + survey datasets (State of AI, JetBrains) to triangulate prevalence.

## Proposed Next Task

- R002-F1: "Quantify agent pain prevalence via survey + large issue sample (n≥200) + benchmark failure taxonomy."

> All Exx references map to `evidence.md`. Access date 2026-09-02.
