# LACE Market Validation — Survey Instrument

**Status:** HYPOTHESIS · **Scope:** Questionnaire design only. No responses collected.
**Date:** 2026-09-03 · **Track:** A — Market Validation
**Predecessor:** `research/market/hypotheses.md`

---

## Inclusion Criteria (screening)

**S1.** In the past 30 days, have you used a coding agent (Claude Code, Codex, OpenCode, Aider, Cline, Roo, Cursor agent, GitHub Copilot agent mode, or similar) to write or modify code that was committed or opened as a PR?
- [ ] Yes → continue
- [ ] No → **exclude** (not in target population)

**S2.** Which agent(s) do you use at least weekly? (select all)
- [ ] Claude Code
- [ ] Codex (CLI or Desktop)
- [ ] OpenCode
- [ ] Aider
- [ ] Cline
- [ ] Roo Code
- [ ] Cursor Agent
- [ ] GitHub Copilot Agent Mode
- [ ] Other: _______

**S3.** What best describes your primary role?
- [ ] Individual Contributor (IC)
- [ ] Technical Lead / Staff Engineer
- [ ] Engineering Manager
- [ ] Platform / Infrastructure / Security Engineer
- [ ] Founder / Solo Developer
- [ ] Other: _______

**S4.** Typical team size for repos you work on:
- [ ] Solo (1)
- [ ] Small team (2–8)
- [ ] Medium team (9–50)
- [ ] Large team (51–200)
- [ ] Enterprise (200+)

**S5.** What % of your agent-assisted work is on private / company repositories (vs public/OSS)?
- [ ] 0–25%
- [ ] 26–50%
- [ ] 51–75%
- [ ] 76–100%

**S6.** Do you have a test suite (unit/integration/e2e) that runs on your typical agent-assisted changes?
- [ ] Yes, always
- [ ] Yes, sometimes
- [ ] Rarely / no test suite

---

## Behavioral Questions (core — mitigate recall bias with recent-anchoring)

### B1. Verification Frequency (tests H1)
**Anchor:** "Think of your last 5 tasks where you used a coding agent and the agent produced a code change."

For each of those 5 tasks, did you **manually verify** the agent's output before committing/merging? (Verification = reading the diff, running tests locally, checking for regressions, or any human check beyond "looks fine.")

| Task | Verified? | Method (select all) |
|------|-----------|---------------------|
| 1 (most recent) | [ ] Yes [ ] No | [ ] Read diff [ ] Ran tests [ ] Checked regression [ ] Other |
| 2 | [ ] Yes [ ] No | [ ] Read diff [ ] Ran tests [ ] Checked regression [ ] Other |
| 3 | [ ] Yes [ ] No | [ ] Read diff [ ] Ran tests [ ] Checked regression [ ] Other |
| 4 | [ ] Yes [ ] No | [ ] Read diff [ ] Ran tests [ ] Checked regression [ ] Other |
| 5 | [ ] Yes [ ] No | [ ] Read diff [ ] Ran tests [ ] Checked regression [ ] Other |

### B2. Recovery Incidents (tests H2, H3)
**Anchor:** "In the past 30 days, how many times did an agent-generated change require you to step in and fix something the agent got wrong — where the agent's output didn't work, broke tests, introduced a regression, or produced a hallucinated edit?"

- Number of recovery incidents: _______
- Of those, how many were:
  - Agent loop / hang / no output: _______
  - Hallucinated edit (wrong file, doubled prefix, invented API): _______
  - Test failure (FAIL_TO_PASS still failing): _______
  - Regression (PASS_TO_PASS broken): _______
  - Provider error (rate limit, auth, network): _______
  - Other: _______

**Time estimate:** For a typical recovery incident, how much **total time** (reading output, diagnosing, fixing, re-running) did it consume?
- [ ] <5 min
- [ ] 5–15 min
- [ ] 15–30 min
- [ ] 30–60 min
- [ ] >1 hour

### B3. Current Workarounds (tests H4)
For each workaround below, how **sufficient** is it for catching/preventing agent errors in your workflow?

| Workaround | Not Used | Insufficient (1) | Somewhat (2) | Adequate (3) | Good (4) | Excellent (5) |
|---|---|---|---|---|---|---|
| `git worktree` / isolated branches | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| CI required checks (must pass before merge) | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Manual code review (human) | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Running tests locally before push | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Agent self-check prompts ("verify your work") | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Limiting agent scope (single file, small tasks) | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Other: _______ | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |

### B4. Trust in External Verifier (tests H5)
**Scenario:** "A tool runs locally (no cloud), executes your tests in a throwaway container, and **blocks merge** if tests fail or regressions are detected. It shows you the exact failing test + traceback. It does not see your secrets (redacted). You can override the block."

Would you **enable this by default** on your repos?
- [ ] Yes, on all repos
- [ ] Yes, on private/company repos only
- [ ] Yes, on public/OSS repos only
- [ ] No, I would not enable it
- [ ] Only if I can customize the rules

**Follow-up:** What would make you **disable** it? (select all)
- [ ] False positives (blocks valid changes)
- [ ] Slows down my workflow
- [ ] Don't trust it with my code
- [ ] Don't trust it with my secrets
- [ ] Prefer my current CI checks
- [ ] Other: _______

### B5. Delegation of Automated Retries (tests H6, H7)
**Scenario:** "Same tool detects a test failure, extracts **only** the failing test name, assertion message, file:line, and a 20-line traceback — **not** the full problem statement or full logs. It sends this minimal evidence to the agent for one corrective retry."

Would you allow this **automated retry**?
- [ ] Yes, always
- [ ] Yes, but only for test failures (not other error types)
- [ ] Yes, but I want to approve each retry
- [ ] No, I prefer to manually fix

**Non-delegable actions:** Which actions would you **never** allow an automated system to perform? (select all)
- [ ] `git push`
- [ ] `git merge` / create PR
- [ ] Deploy to staging/production
- [ ] Run database migrations
- [ ] Access/modify secrets / `.env` / credentials
- [ ] Modify infrastructure (Terraform, CloudFormation, k8s)
- [ ] Install new dependencies
- [ ] Run arbitrary shell commands
- [ ] Other: _______

### B6. Willingness to Pay (tests H8)
**Van Westendorp (4 questions):**
1. At what monthly price would this tool (verification gate + automated recovery + Pareto dashboard) be **too expensive** to consider? $_______/mo
2. At what monthly price would it be **expensive but you'd still consider it**? $_______/mo
3. At what monthly price would it be a **bargain / great value**? $_______/mo
4. At what monthly price would it be **so cheap you'd question quality**? $_______/mo

**Direct choice (tests H8 threshold):**
If the tool cost **$20/mo per developer** (team billing available), would you / your team pay?
- [ ] Yes, I'd pay personally
- [ ] Yes, my team would pay
- [ ] Yes, my company would pay
- [ ] Maybe, need to try first
- [ ] No, not worth $20/mo
- [ ] No, would only use free tier

**Budget authority:** Who decides on tool purchases in your context?
- [ ] Me (individual)
- [ ] My manager / tech lead
- [ ] Engineering manager / director
- [ ] Platform / security team
- [ ] Procurement / finance (enterprise)
- [ ] Other: _______

### B7. Public vs Private Repo Differences (tests H10)
Do your answers to B4 (trust), B5 (delegation), B6 (WTP) **differ** between public/OSS repos and private/company repos?
- [ ] No difference
- [ ] Yes — I trust more / delegate more / pay more for **private** repos
- [ ] Yes — I trust more / delegate more / pay more for **public** repos
- [ ] Not applicable (only work on one type)

---

## Demographic / Context (segmentation for H9)

**D1.** Years of professional software development: _______

**D2.** Primary language(s) for agent-assisted work: _______

**D3.** Typical agent task complexity (select one):
- [ ] Single-file edits / bug fixes
- [ ] Multi-file features (2–5 files)
- [ ] Large features / refactors (5+ files)
- [ ] Varies widely

**D4.** How often do you hit the agent's context limit or need to compact?
- [ ] Never
- [ ] Rarely (<10% of tasks)
- [ ] Sometimes (10–30%)
- [ ] Often (>30%)

**D5.** Have you ever had an agent accidentally expose a secret / credential / key in its output or logs?
- [ ] Yes
- [ ] No
- [ ] Not sure

**D6.** Current monthly spend on developer tools (IDEs, Copilot, Cursor, CI, etc.): $_______/mo

---

## Open-Ended (qualitative signal)

**O1.** Describe the **most frustrating** agent incident you've had in the past 30 days. What happened, how long did it take to recover, what would have prevented it?

**O2.** If you could wave a magic wand and fix **one thing** about how coding agents work today, what would it be?

**O3.** Any other comments on verification, recovery, or trust with coding agents?

---

## Survey Metadata (for analysis)

- **Target n:** >100 qualified respondents
- **Recruitment channels:** Agent Discords, GitHub Discussions, newsletters (Claude Code, Codex, Aider, Cline), Reddit r/claude, r/copilot, Twitter/X agent communities
- **Incentive:** $10 gift card or donation to OSS project of choice
- **Estimated completion time:** 8–12 minutes
- **IRB/ethics:** No PII collected beyond role/team size; responses anonymized in analysis

---

## Analysis Plan (pre-registered)

1. **Screening:** Exclude non-qualified (S1=No). Report exclusion rate.
2. **Weighting:** If sample skews (e.g., >70% Claude Code), report unweighted + agent-weighted results.
3. **Primary tests:**
   - H1: Mean verification rate across 5 tasks (binomial CI)
   - H2: Recovery incidents per 30 days per user (Poisson CI)
   - H3: Median recovery time × incident rate = time share estimate
   - H4: % rating each workaround ≤2 (insufficient/somewhat)
   - H5: % "Yes" on enable-by-default (binomial CI)
   - H6: % "Yes" on automated retry (binomial CI)
   - H7: % selecting each non-delegable action
   - H8: Van Westendorp optimal price band + % "Yes" at $20/mo
   - H9: Cross-tab buyer authority × WTP × team size
   - H10: Stratified comparison (private vs public) with chi-square / t-test
4. **Segmentation:** By agent, role, team size, repo privacy, task complexity.
5. **Limitations section:** Report all biases, non-response, sample constraints.

---

## Provenance

- Derived from: `research/market/hypotheses.md`
- Question design follows: behavioral anchoring (last 5 tasks, past 30 days), scenario-based trust/delegation, van Westendorp for WTP
- No hypothetical feature-preference questions (per orchestrator instructions)