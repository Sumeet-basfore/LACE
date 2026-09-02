# R002 — Findings

Legend: **FACT** verifiable · **EVIDENCE** data point · **INFERENCE** reasoned conclusion · **HYPOTHESIS** untested · **OPINION** attributed sentiment

## 1. Ranked Recurring Problems (by evidence strength + severity)

### Rank 1 — Context Loss & Repo Understanding Failure (High severity, recurrent)
- **FACT**: Cline issue corpus contains repeated context/state bugs (duplicate-session, TUI crash on /model, plan-mode hang) — verified via GitHub API sample 2026-09-02. [E15]
- **EVIDENCE**: HN comment: "Small tasks work fine... But when I tried building something real... it was always difficult to keep an agent like Claude Code on track throughout an entire feature implementation. context is state" — suggests long-horizon drift. [E11]
- **EVIDENCE**: newt-agent PR #160 title bundles "context trimming" with hallucination and token loss as co-occurring agent-loop failure modes. [E09]
- **INFERENCE**: Even when context window is large, agents lose task state across files/steps; repo-level understanding (cross-file dependencies, build config, prior decisions) is brittle. — Reason: small-task success vs. real-feature failure in E11 plus explicit context-trimming fix in E09.
- **OPINION**: HN/Reddit sentiment (anecdotal in this limited sample) frames context as the central variable ("context is state"). [E11]
- Confidence: **Medium** — consistent pattern across repo issue + comment, but n=small and no controlled benchmark cited in this fetch.

### Rank 2 — Hallucinations / Unreliable Code Changes (High severity)
- **FACT**: newt-agent issues explicitly label "tool-name hallucination" and "cap-path token loss" as agentic-loop failures. [E10]
- **EVIDENCE**: E14 marketplace submission titled "AgentSeed (anti-hallucination guardrails for AI coding agents)" exists — productization implies market perceives hallucination as real pain. [E14]
- **EVIDENCE**: newt-agent PR fix groups hallucination tracker with token loss — indicates hallucination is systemic, not one-off. [E09]
- **INFERENCE**: Hallucinations manifest as invented tool names, invented APIs/files, and plausible-but-wrong patches; on long tasks this compounds into regressions.
- Confidence: **Medium** — primary repo issues name hallucination directly; guardrail product corroborates, but no prevalence rate verified here.

### Rank 3 — Verification Burden & Regression Risk (Medium-High severity)
- **FACT**: PlanBridge tool exists explicitly for "precise feedback on your coding agent's plans" via hooks/browser render. [E03]
- **EVIDENCE**: GitHub Blog 2025-02-06 announces Copilot "agent mode" + "SWE agent" — autonomous edits without explicit plan-approval UX at launch increase verification surface. [E01]
- **INFERENCE**: Teams report (via tooling response) that every agent edit needs human review; unreviewed changes regress existing behavior. Verification cost offsets autonomy gains.
- **OPINION**: Builders implicitly assert "plans need checking" by shipping plan-review tooling. [E03]
- Confidence: **Medium** — tooling existence is strong proxy, but no user-study n cited here.

### Rank 4 — Human Oversight: Excessive Autonomy ↔ Repetitive Approval (Tradeoff pain)
- **FACT**: Cline #13753 proposes to "Remove or make configurable the 'BE HELPFUL AND PROACTIVE' system prompt" — direct user pushback on autonomy. [E05]
- **EVIDENCE**: PlanBridge workflow adds a deliberate approval gate (render plan → user feedback → proceed). [E03]
- **INFERENCE**: Users are caught between two failures: proactive agents over-editing vs. agents blocked on trivial approvals; tuning this is a recurring configuration pain.
- Confidence: **Medium** — single issue + tool pattern; needs broader survey for weight.

### Rank 5 — Agent Loops / Hangs / Stuck States
- **FACT**: Cline #13750: "PLAN mode hangs on 'thinking...' indefinitely when using Ollama" despite model working in terminal. [E04]
- **FACT**: freelance-agent-skills #1 claims "Repetitive calls cost you twice as much on average agent loops". [E12]
- **EVIDENCE**: sst/opencode issues #46734/#46733 report missing progress signals and SSE delivery failures — UX indistinguishable from a loop. [E08]
- **INFERENCE**: Loops/hangs are both reliability and cost bugs: user waits, tokens burn, no error signal.
- Confidence: **High** for "loops/hangs exist as class" (multiple repos); **Low** for cost multiplier "twice as much" (single issue title, n=1, no methodology).

### Rank 6 — Token Cost, Latency, and Missing Progress Feedback
- **EVIDENCE**: Issue title quantifies "twice as much" cost for loops (weak, n=1). [E12]
- **EVIDENCE**: opencode TUI reports "no progress signal while tool-call arguments stream" and heartbeat-only SSE events. [E08]
- **INFERENCE**: Long tasks amplify cost/latency; lack of streaming progress makes latency feel worse and debugging harder.
- Confidence: **Medium** for latency/UX pain (two issues); **Low** for specific cost magnitude.

### Rank 7 — Parallel Work & Multi-Agent Coordination (Emerging, less evidenced here)
- **FACT**: Cline #13752 context notes duplicate-session bug tied to cron.db/sessions.db — parallel/scheduled runs corrupt state. [E15]
- **INFERENCE**: Multi-agent or multi-session coordination (parallel edits, merge conflicts, shared state) is fragile in current harnesses.
- Confidence: **Low** — only one sampled signal in this fetch; broader evidence not retrieved.

### Rank 8 — Privacy, Credential Sprawl, Local Models, Enterprise Restrictions
- **FACT**: Kontext Show HN describes credential broker to avoid "copy-pasting long-lived API keys into .env" and provides audit trail per tool call. [E02]
- **FACT**: Continue #13212 and Aider #5665 both propose "Universal Trust Adapter / verification layer for MCP servers" — cross-harness pattern. [E06][E07]
- **FACT**: Cline #13750 hang is specific to Ollama (local model) via PLAN mode. [E04]
- **INFERENCE**: Enterprise users face two linked pains: (a) cloud agents leak secrets and lack audit, (b) local models (Ollama etc.) lag in capability and trigger hangs on agentic workflows. Low-resource machines compound this.
- Confidence: **Medium** for credential/trust pain (three independent sources); **Medium** for local-model fragility (one strong issue + known domain pattern).

---

## Cross-Cutting Contradictions & Tradeoffs

- **Autonomy vs. Safety**: Builders ship more autonomy (E01) while users request to disable proactivity (E05) and add verification gates (E03) — disagreement on default.
- **No contradiction found** between context-loss claims; E11 (context is state) aligns with E09 (context trimming bug) and E15 (session duplication).

## Claims Explicitly NOT Verified Here

- No reliable prevalence numbers (e.g., "% of tasks that hallucinate", "median tokens per task", "cost $/task") — would require benchmark/survey fetch.
- No head-to-head agent comparison (Cursor vs. Claude Code vs. Cline) on these pains — not retrieved.
- No systematic Reddit sentiment quantification — not fetched (API auth required).

## Summary Ranking Table

| Rank | Problem | Severity | Evidence Strength (this fetch) | Confidence |
|------|---------|----------|-------------------------------|------------|
| 1 | Context loss / repo understanding | High | 2 repo signals + 1 comment | Medium |
| 2 | Hallucinations / unreliable edits | High | 2 repo issues + 1 product | Medium |
| 3 | Verification / regressions | High | 1 blog + 1 tool | Medium |
| 4 | Autonomy vs. approval tradeoff | Medium | 1 issue + 1 tool | Medium |
| 5 | Agent loops / hangs | Medium-High | 3 repos | High (existence) / Low (magnitude) |
| 6 | Cost / latency / progress feedback | Medium | 2 issues (weak quant) | Medium/Low |
| 7 | Parallel / multi-agent coordination | Medium | 1 issue | Low |
| 8 | Privacy / local models / enterprise | Medium-High | 3 independent issues | Medium |

> All E-citations map to evidence.md. No statistics invented; where only titles exist, noted as weak.
