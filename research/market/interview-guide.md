# LACE Market Validation — Interview Guide

**Status:** HYPOTHESIS · **Scope:** Interview protocol only. No interviews conducted.
**Date:** 2026-09-03 · **Track:** A — Market Validation
**Predecessors:** `research/market/hypotheses.md`, `research/market/survey.md`

---

## Interview Objectives

1. **Validate survey findings** with depth — probe actual incidents, not abstract opinions.
2. **Understand workflow context** — how verification/recovery fits in real development flow.
3. **Explore trust boundaries** — what specific concerns drive adoption/rejection.
4. **Identify buyer dynamics** — who decides, what budget, what approval chain.
5. **Surface unanticipated pain or workarounds** — survey can't capture everything.

---

## Recruitment Criteria (target: 5+ interviews)

| Priority | Criteria | Rationale |
|---|---|---|
| **P1** | Uses coding agent ≥3×/week for feature work (multi-file, regression risk) | Core user per synthesis §1 |
| **P2** | Has experienced ≥1 recovery incident in past 30 days | Behavioral evidence for H2/H3 |
| **P3** | Role: Technical Lead, Staff Engineer, or Engineering Manager | Buyer/influencer per H9 |
| **P4** | Works primarily on private/company repos | Higher trust/WTP segment per H10 |
| **P5** | Uses ≥2 different agents or has tried multiple | Cross-agent perspective |

**Exclusion:** Pure greenfield/single-file users, agent framework builders (not users), non-technical managers.

---

## Interview Structure (45–60 minutes)

### 1. Context & Warm-up (5 min)
- "Walk me through a typical week — how often do you use a coding agent, for what kind of tasks?"
- "Which agent(s), which repos (public/private), typical team size?"
- "Do you have a test suite? CI? Required checks?"

### 2. Recent Incident Deep-Dive (20 min) — **Core behavioral probe**
"Think of the **most recent time** an agent-generated change required you to step in and fix it. Not a hypothetical — the actual last one."

**Probe sequence (do not lead):**
- What was the task? (feature, bug fix, refactor)
- What did the agent produce?
- How did you discover it was wrong? (test failure, manual review, CI, runtime error)
- What exactly did you do to fix it? (step by step)
- How long did the whole recovery take — from noticing to fixed?
- Did you re-run the agent, or fix manually?
- What would have prevented this? (better verification? different prompt? different agent?)

**Repeat for 2nd most recent incident if time permits.**

### 3. Verification Workflow (10 min)
- "On a typical agent task that *looks* correct, what do you do before merging?"
- "Do you read the diff? Run tests locally? Trust CI? Something else?"
- "How often does the agent produce something that *passes tests* but is still wrong (silent regression, wrong logic)?"
- "What's your current 'gate' — what must be true before you merge?"

### 4. Trust & Delegation Scenarios (10 min)
**Scenario A (Verifier):** "A local tool runs your tests in a throwaway container, blocks merge on red/regression, shows you failing test + traceback, redacts secrets. Override is one click."
- "Would you enable this? On which repos? Why/why not?"
- "What's the one thing that would make you disable it?"

**Scenario B (Auto-Retry):** "Same tool detects a test failure, sends ONLY the failing test name, assertion, file:line, 20-line traceback to the agent for one corrective retry. No full context replay."
- "Would you allow this? For which error types?"
- "What would you never let it retry automatically?"

**Scenario C (Non-delegable):** "Push, merge, deploy, secrets, infra, DB migrations — which of these would you never delegate? Why?"

### 5. Buyer & Budget Dynamics (5 min)
- "If this tool cost $20/mo per developer, who would need to approve it?"
- "Is there a budget for developer productivity tools? What's the threshold for individual vs team vs company purchase?"
- "What would need to be true for your team/company to adopt this as standard?"

### 6. Public vs Private Context (5 min) — if applicable
- "Do your answers change for open-source vs company repos?"
- "Different trust bar? Different WTP? Different delegation comfort?"

### 7. Magic Wand & Closing (5 min)
- "If you could fix one thing about coding agents today, what would it be?"
- "Anything we didn't cover that matters?"

---

## Interviewer Guidelines

### DO
- Anchor every question in **specific recent events** ("last time," "most recent").
- Use **silence** after answers — let them elaborate.
- Follow up with "What happened next?" "How did you know?" "What did you see?"
- Distinguish **agent failure** from **verification gap** from **process gap**.
- Note exact language for quotes (with permission).

### DON'T
- Ask "Would you like a feature that...?" (hypothetical preference)
- Ask "How important is...?" (abstract rating)
- Lead with "Don't you think it would be better if...?"
- Accept "It depends" without probing the specific context.
- Conflate the *agent's* capability with the *verification/recovery* pain.

---

## Recording & Analysis

- **Record:** Audio (with consent) + structured notes during interview.
- **Transcribe:** Key incidents verbatim; summarize rest.
- **Code:** Tag each incident with failure class (from `context/terminology.md`), recovery action, time, outcome.
- **Synthesize:** Cross-interview pattern matrix (incident type × recovery action × time × prevention wish).
- **Report:** In `research/market/results.md` with:
  - Participant profiles (anonymized: role, team size, agent, repo type)
  - Incident catalog (table)
  - Trust/delegation themes (quotes + counts)
  - Buyer dynamics (decision map)
  - Divergences from survey hypotheses
  - Limitations (sample size, recruitment bias, interviewer bias)

---

## Informed Consent Template

> "This interview is for LACE research — a project exploring verification and recovery for coding agents. It takes 45–60 minutes. Your responses will be anonymized in any report (role/team size/agent only, no name/company). You'll receive a $50 gift card or OSS donation. You can skip any question or stop at any time. May I record audio for accurate notes? The recording will be deleted after transcription."

---

## Provenance

- Derived from: `research/market/hypotheses.md` (hypotheses H1–H10), `research/reports/12-parallel-research-synthesis.md` §1, §3, §9
- Protocol follows: behavioral event interviewing (critical incident technique), scenario-based trust elicitation, buyer journey mapping
- No hypothetical feature-preference questions