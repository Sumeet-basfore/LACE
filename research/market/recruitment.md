# LACE Market Validation — Recruitment Strategy

**Status:** HYPOTHESIS · **Scope:** Recruitment plan only. No recruitment executed.
**Date:** 2026-09-03 · **Track:** A — Market Validation
**Predecessors:** `research/market/hypotheses.md`, `research/market/survey.md`, `research/market/interview-guide.md`

---

## Target Population

**Definition:** Developers who use coding agents (Claude Code, Codex, OpenCode, Aider, Cline, Roo, Cursor Agent, GitHub Copilot Agent Mode) at least weekly for feature-level work on repositories with test suites.

**Estimated size:** Unknown — no public data on active agent users. Proxy: Claude Code has ~100k+ users (anecdotal), Codex waitlist >500k, Aider ~50k stars. Overlap likely high.

**Inclusion criteria (from survey S1–S6):**
- Used coding agent in past 30 days for committed/PR'd code
- Weekly usage on feature work (not just exploration)
- Has test suite (at least sometimes)
- Role: IC, Tech Lead, EM, Platform/Security

---

## Recruitment Channels

| Channel | Method | Expected Yield | Cost | Bias Notes |
|---|---|---|---|---|
| **Agent Discords** (Claude Code, Codex, Aider, Cline, Roo) | Post in #general / #showcase / #help with mod approval; link to screener | 30–50 | $0 | High enthusiast bias; early adopters |
| **GitHub Discussions** (agent repos) | Search "agent" + "workflow" threads; reply with invite | 10–20 | $0 | Users invested enough to discuss |
| **Reddit** (r/claude, r/copilot, r/ProgrammingBuddies, r/ExperiencedDevs) | Text post with screener link; follow subreddit rules | 20–40 | $0 | Broader dev audience; lower agent intensity |
| **Twitter/X** (agent community accounts) | Thread from @LACEresearch (new account) + DM to active posters | 15–30 | $0 | Self-selection; vocal minority |
| **Newsletters** (Claude Code weekly, Aider updates, etc.) | Request inclusion in "community research" section | 20–50 | $0 | Opt-in; engaged users |
| **Referral** (survey → "know others?") | Snowball from completed surveys | 10–20 | $0 | Homophily bias |
| **Paid panels** (Prolific, Respondent.io) | Filter: "uses AI coding assistant weekly" + dev role | 30–50 | $15–25/respondent | More representative; costly |

**Total target:** 150–200 screener completions → 100+ qualified surveys → 5–8 interviews

---

## Screener (hosted on Typeform / Google Forms / custom)

**Questions (match survey S1–S6 + interview criteria):**

1. In the past 30 days, used coding agent for code that was committed/PR'd? (Y/N)
2. Which agent(s) weekly? (multi-select)
3. Primary role? (IC / Tech Lead / EM / Platform-Security / Founder / Other)
4. Team size? (Solo / 2–8 / 9–50 / 51–200 / 200+)
5. % work on private/company repos? (0–25 / 26–50 / 51–75 / 76–100)
6. Test suite on agent-assisted changes? (Always / Sometimes / Rarely-Never)
7. Recovery incidents in past 30 days? (0 / 1–2 / 3–5 / 6+)
8. Willing to do 45-min interview for $50? (Y/N)
9. Email for follow-up (if Y to #8)

**Qualification logic:**
- Survey: S1=Y + S6≠Never
- Interview: Survey qualified + Q7≥1 + Q8=Y + (Role=Tech Lead/EM/Platform OR Q7≥3)

---

## Incentives

| Activity | Incentive | Delivery |
|---|---|---|
| Survey completion (qualified) | $10 gift card (Amazon/GitHub/Starbucks) or $10 OSS donation | Automatic via Tremendous / manual |
| Interview completion | $50 gift card or $50 OSS donation | After interview |
| Referral (qualified survey) | $5 per referral (max 3) | Tracked via unique link |

**Budget estimate:** 100 surveys × $10 + 8 interviews × $50 + 20 referrals × $5 = **$1,500** + platform fees (~10%)

---

## Timeline

| Week | Activity |
|---|---|
| 0 | Finalize screener, survey, interview guide; set up incentive delivery |
| 1 | Launch on Discords, GitHub, Reddit; post X thread |
| 1–2 | Newsletter outreach (async, depends on pub schedule) |
| 2–3 | Paid panel launch (if organic <80 qualified) |
| 3–4 | Interview scheduling + execution (parallel with survey) |
| 4 | Survey close; data export; interview transcription |
| 5 | Analysis + `results.md` |

---

## Bias Mitigation & Limitations (to report in results.md)

| Bias | Mitigation | Residual |
|---|---|---|
| **Enthusiast/early-adopter** | Paid panel supplement; report agent distribution | High — core agent users ARE early adopters |
| **Survivorship** (frustrated quitters missed) | Ask "ever stopped using an agent due to frustration?" in survey | Medium — cannot reach true quitters |
| **Self-report / recall** | Behavioral anchoring (last 5 tasks, past 30 days); interview deep-dive | Medium — mitigated not eliminated |
| **Channel homophily** | Multi-channel; track source per response | Low — diverse channels |
| **Incentive-driven satisficing** | Attention checks in survey; interview validates | Low — $10/$50 not high enough for fraud |
| **Interviewer bias** | Structured guide; two interviewers if possible; audio review | Medium — single interviewer likely |

---

## Sampling Strategy for Segmentation (H9, H10)

**Minimum cell sizes for analysis:**

| Segment | Target n | Rationale |
|---|---|---|
| By agent (top 3) | ≥20 each | Compare Claude Code vs Codex vs Aider |
| By role (IC vs Lead/EM vs Platform) | ≥20 each | Buyer dynamics |
| By team size (Solo vs Team vs Enterprise) | ≥20 each | Adoption context |
| By repo privacy (Private >50% vs Public >50%) | ≥30 each | H10 test |
| By recovery frequency (0 vs 1–2 vs 3+) | ≥20 each | Pain gradient |

**If cells undersized:** Collapse adjacent categories; report as limitation.

---

## Data Management

- **Screener/survey:** Google Forms / Typeform → CSV export → local analysis (Python/pandas)
- **Interviews:** Audio → local transcription (Whisper/local) → anonymized notes
- **PII:** Email only for incentive delivery; deleted after delivery. No names, companies, repo URLs stored.
- **Retention:** Raw data deleted 30 days after `results.md` finalized. Anonymized analysis artifacts retained.

---

## Ethical / Compliance

- No IRB required (non-medical, low risk, voluntary, anonymized).
- Consent obtained at screener start and interview start.
- No deception; purpose disclosed as "research on coding agent verification/recovery."
- Opt-out at any point; data deleted on request.

---

## Go/No-Go Criteria for Proceeding to Analysis

| Metric | Threshold | Action if Missed |
|---|---|---|
| Qualified survey responses | ≥80 by Week 3 | Extend recruitment + add paid panel |
| Interview commits | ≥5 by Week 3 | Extend; reduce to 3 if insights saturate |
| Segment coverage | All 5 segments have ≥10 | Report limitation; analyze what exists |
| Data quality | <10% straight-line / speeding | Clean; re-recruit if >20% |

---

## Provenance

- Derived from: `research/market/hypotheses.md` (sample requirements), `research/market/survey.md` (screener match), `research/market/interview-guide.md` (interview criteria)
- Budget, timeline, channels: practical estimates for solo researcher / small team