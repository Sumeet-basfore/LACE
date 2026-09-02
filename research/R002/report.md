# R002 — User Pain & Unmet Needs

**Task:** R002 — What recurring, consequential problems do developers actually experience with AI coding agents?
**Model:** muse-spark-1.2-contributor-free | **Date:** 2026-09-02 | **Artifacts dir:** `research/R002/`
**Skill:** `skills/research-agent/SKILL.md` | **Worker:** R002 (bounded, no sub-agents spawned)

## Research Question

What recurring, consequential problems do developers actually experience with AI coding agents? Weight by frequency + severity, distinguish FACT/EVIDENCE/INFERENCE/HYPOTHESIS/OPINION, prefer primary reports, cite important claims.

## Scope

Per `research/tasks/R002.md`: unreliable code changes, context loss, long-horizon tasks, repo understanding, hallucinations, regressions, verification, debugging, human oversight, excessive autonomy, repetitive approval, agent loops, token/cost, latency, parallel work, multi-agent coordination, privacy, local models, enterprise restrictions, low-resource machines. Do not merely list complaints — identify recurring, consequential problems supported by evidence.

Out-of-scope findings → `open-questions.md`.

## Methodology

- **Constraint:** No dedicated web-search tool; worked via `curl` + GitHub API (`api.github.com`) + HN Algolia API (`hn.algolia.com/api/v1/search`). No Reddit API (auth-gated), no arXiv full-text pull.
- **Primary → secondary:** Started with primary repo issues (Cline, Continue, Aider, opencode/newt-agent), official GitHub Blog, then community posts (HN Show HN/comments). Treated HN/Reddit as anecdotal (skill hierarchy 9) vs. repo issues (hierarchy 3–4) and official docs/blogs (hierarchy 2/5).
- **Preference:** Recent (≤12 months) for product behavior — 2025-02 GitHub Blog + 2026 issues/comments preferred; older fine for foundational technique but none needed.
- **Searches run (verifiable):**
  - HN Algolia: `AI coding agent pain problems`, `cursor agent hallucination regression`, `AI agent coding frustration context window`, `coding agent claude code cursor problems`, `claude code agent loop cost tokens`, comment search `coding agent context loss`
  - GitHub API: `search/issues?q=AI coding agent hallucination`, `search?q=hallucination agent loop OR context loss in:title`, `repos/cline/cline/issues`, `repos/continuedev/continue/issues`, `repos/Aider-AI/aider/issues`, `repos/anomalyco/opencode/issues`, `repos/Aider-AI/aider/issues/5665` detail, `repos/cline/cline/issues/13750` detail
  - Direct curl: `github.blog/.../github-copilot-the-agent-awakens/`, `anthropic.com/news/claude-code` (404)
- **Evidence capture:** Every important source recorded in `evidence.md` with URL, type, date, key quote, access date 2026-09-02.
- **Assumption (per skill §2):** Task ambiguous on "recurring" threshold — adopted narrowest reasonable scope: problem counts as recurring iff observed in ≥2 independent sources OR explicitly labeled as a failure class (e.g., "hallucination") in a primary repo issue.

## Sources Consulted

- Primary: 7 GitHub issues/PRs across 5 repos (Cline, Continue, Aider, opencode, newt-agent) — E04–E10, E15
- Official: 1 GitHub Blog post (Copilot agent mode, 2025-02-06) — E01
- Community/secondary: 3 HN Show HN posts + 1 HN comment — E02, E03, E11; negative-result API responses logged (E13–E14)
- Not consulted due to tool limits: Reddit threads, Stack Overflow / JetBrains / GitHub Octoverse surveys, arXiv papers, pricing pages, SWE-bench breakdowns (gaps noted).

Full table → `evidence.md`.

## Findings (ranked by evidence strength × severity)

### 1. Context Loss & Repo Understanding Failure — Confidence: Medium
Evidence suggests agents succeed on small tasks but drift on real feature work spanning multiple files. E11: "Small tasks work fine... But when I tried building something real... it was always difficult to keep an agent like Claude Code on track" [E11]. E09 bundles "context trimming" with hallucination/token-loss as linked agent-loop bugs [E09]. Cline sample shows duplicate-session and state bugs consistent with context/state fragility [E15]. **Weight: High severity** — long-horizon tasks are the primary value proposition.

### 2. Hallucinations / Unreliable Code Changes — Confidence: Medium
Strong evidence that hallucinations are a named failure class. newt-agent issues label "tool-name hallucination" and "cap-path token loss" [E10][E09]; marketplace submission "AgentSeed (anti-hallucination guardrails)" productizes the pain [E14]. **Weight: High severity** — unreliable patches cause regressions and erode trust.

### 3. Verification Burden & Regression Risk — Confidence: Medium
Agent autonomy shifts cost to human review. PlanBridge exists to add "precise feedback on your coding agent's plans" [E03], implying plans cannot be trusted unattended. GitHub's 2025 agent-mode announcement expands edit surface without detailing verification guarantees [E01]. **Weight: High severity** — unverified edits risk regressions.

### 4. Human Oversight: Excessive Autonomy ↔ Repetitive Approval — Confidence: Medium
Tradeoff pain is explicit. Cline users ask to disable "BE HELPFUL AND PROACTIVE" [E05] while PlanBridge adds a deliberate approval gate [E03]. Users want neither blind autonomy nor constant "approve" clicks.

### 5. Agent Loops / Hangs / Stuck States — Confidence: High (existence) / Low (magnitude)
Multiple repos report hangs: Cline PLAN mode "hangs indefinitely" on Ollama [E04]; opencode SSE delivers "only heartbeats — no message events" [E08]; freelance-agent-skills title claims loops "cost twice as much" (weak, n=1) [E12]. **Weight: Medium-High** — loops waste time/tokens and need manual kill.

### 6. Token Cost, Latency, Missing Progress Feedback — Confidence: Medium/Low
Related to loops. opencode TUI has "no progress signal while tool-call arguments stream" [E08]; cost claim in E12 is unvalidated. No pricing-page evidence fetched. **Weight: Medium** — pronounced on long tasks and low-resource machines.

### 7. Parallel Work & Multi-Agent Coordination — Confidence: Low
Single strong signal: Cline duplicate-session bug tied to parallel/scheduled runs [E15/E15 via #13752]. Multi-agent coordination pain is hypothesized more broadly but not evidenced in this fetch.

### 8. Privacy, Local Models, Enterprise Restrictions, Low-Resource Machines — Confidence: Medium
Credential sprawl is well-evidenced: Kontext broker notes teams "copy-pasting long-lived API keys into .env" with no audit lineage [E02]; Continue and Aider both propose Universal Trust Adapter for MCP credential verification [E06][E07]. Local-model fragility evidenced by Cline+Ollama hang [E04]. **Weight: Medium-High for enterprise** — security/audit/compliance blocker.

Ranking detail → `findings.md`.

## Contradictory Evidence

- **Autonomy vs. safety:** Official agent-mode push (more autonomy) [E01] contradicts user request to curb proactivity [E05] and tooling to gate plans [E03]. Resolution: Weight user reports (E05) and tool adoption (E03) over vendor announcements when assessing pain — vendor docs describe intent, issues describe experienced pain. Hierarchy + recency favors issues/blogs for capability claims, but both are valid perspectives; conflict reflects a real tradeoff, not a factual error.
- **Cost magnitude:** Single issue title "twice as much" [E12] vs. silent majority (no other cost quantification found). Weight as **Low** — insufficient methodology; note as gap rather than fact.
- No contradictory evidence found for context loss or hallucination as a class; sources converge.

Actively searched for counter-evidence (e.g., claims that context loss is solved) via Algolia/HN — no credible "solved" claim surfaced in this fetch.

## Uncertainty & Confidence

- Per-finding confidence labeled above (High/Medium/Low) with reasons in `findings.md`.
- **Calibrated language:** "Strong evidence shows" only for loop/hang existence (multiple repos). Otherwise "evidence suggests" (medium) or "no reliable evidence found" (gaps).
- **Why uncertainty remains:** No dedicated search tool → small, API-driven sample (GitHub n~10 issues, HN n~6 hits); no large-scale surveys (Stack Overflow, JetBrains) or benchmark breakdowns fetched; quotes limited to 300-char API excerpts to avoid hallucination.

## Limitations

1. **Sample size:** Evidence drawn from ~15 primary sources via direct API; not a systematic literature review. Prevalence/frequency cannot be quantified.
2. **Tooling limit:** No Reddit, arXiv, or pricing benchmarks fetched; HN Algolia returned sparse hits for exact queries (E13). Broader sentiment not captured.
3. **Recency bias:** 2026 issues dominate; older foundational pains may be under-represented.
4. **No attribution of solved vs. open issues:** Some issues were closed (e.g., Cline #13748 TUI crash) but treated as historical signal.

## Missing Evidence

- `No reliable evidence found.` for: (a) quantified hallucination rate or regression rate in the wild, (b) median token cost/latency per agent task, (c) head-to-head agent comparison on context retention, (d) enterprise privacy incident counts, (e) systematic survey n>100 on developer pain ranking. Searched via GitHub search + HN Algolia; none surfaced via those APIs. Listed as follow-ups in `open-questions.md`.

## Recommendation

For LACE design (firm implications from this limited fetch):
- Prioritize **context/state integrity** (session persistence, repo map, change-scoped context) and **verification affordances** (plan preview/diff, selective approval) — highest severity + most corroborated.
- Treat **hallucination as first-class error** (tool-name/path validation, guardrails) rather than rare edge case.
- Default to **gated autonomy** (ask before destructive edits) with escape hatch to curb proactivity — resolves the proactive↔approval tension.
- Add **progress/cancellation UX** for loops/hangs and local-model fallback paths; audit-friendly credential handling (short-lived tokens, per-call audit) for enterprise.

> All important claims cited as `[Exx]` → `evidence.md` with URL, type, date, quote, accessed 2026-09-02. No statistics invented. See `findings.md` for FACT/EVIDENCE/INFERENCE/HYPOTHESIS/OPINION labels; `open-questions.md` for gaps and follow-ups.
