# F01 — Pain Prevalence (Validation)

**Date:** 2026-09-02 · **Model:** muse-spark-1.2-contributor-free · **Artifacts dir:** `research/F01/` · **Skill:** `skills/research-agent/SKILL.md`

## 1. Research Question

Are the previously identified coding-agent pains frequent and consequential enough to justify a product?

Scope: 50–100 GitHub issues where practical + discussions + credible reports, classified into 8 categories: context loss, hallucination, verification burden, regression, loops/hangs, cost/latency, progress visibility, privacy/trust. Answer 5 questions. Distinguish prevalence in corpus vs severity vs broader demand.

## 2. Methodology

- **Sources:** Primary per skill hierarchy: official GitHub issues/PRs (hierarchy 4), HN comments (hierarchy 9 anecdotal), official blog (hierarchy 5). No web-search tool; used GitHub Search API via `gh auth` + HN Algolia API via curl.
- **Queries:** 28 repo-filtered searches (e.g., `repo:cline/cline hang OR stuck OR loop`, `repo:Aider-AI/aider privacy OR credential`, `repo:opencode-ai/opencode context window`) across cline/cline, continuedev/continue, Aider-AI/aider, opencode-ai/opencode, zed-industries/zed, anomalyco/opencode, plus fallback `repos/{owner}/{repo}/issues` for org-renamed repos (OpenHands → OpenHands, RooCodeInc → roovetgit 422 workaround). Also 4 broad queries. Two fetch waves: initial broad (q=context/hallucination generic) then precise repo-filtered.
- **Total fetched:** 262 unique issues/PRs across two waves (`raw/corpus_v2_raw.json` + `raw/corpus_raw.json`), deduplicated.
- **Curation:** Keyword scoring per 8 categories + manual overrides for known pains; true-noise exclusion (DailyArXiv auto-lists, DAO proposals, unrelated product PRs). Result: **67 coding-agent issues/PRs** retained for analysis (`raw/details.json` → `relevant2.json`). This satisfies 50–100 target.
- **Supplemental:** 3 HN comments (one per theme) + 1 engineering blog + 1 official blog + 1 HN search count = 6 discussion/report sources. Total evidence sources ≈73 distinct URLs.
- **Classification:** Each retained issue assigned primary category; counts reported as corpus prevalence only. Severity judged by consequence language (blocks use vs annoyance) and comment count. Harness vs model judged by whether fix is validation/gating vs model invention.
- **Limitations:** Query construction biases counts; fix PRs counted as evidence of prior pain inflate verification/privacy; 40 noise exclusions required judgment (see evidence table for excluded list). No inter-rater reliability.

## 3. Sample Description

- **n:** 67 GitHub issues/PRs (46 PRs, 21 open issues; PRs are fixes revealing prior bug class) + 4 HN/discussion reports + 1 official blog = 73 sources; 67 is the denominator for category prevalence.
- **Repos:** cline/cline n≈28, continuedev/continue n≈16, Aider-AI/aider n≈14, opencode-ai/opencode n≈8, zed-industries/zed n≈2, anomalyco/opencode n=2. All are coding-agent harnesses (terminal or editor). Dates: 2026 (rolling window, one 2026-09-01 recency). See evidence.md table for per-issue dates.
- **Queries/dates:** All searches executed 2026-09-02 via GitHub Search API (search quota 30/req, core 5000). HN Algolia 2026-09-02. Access date for all sources 2026-09-02.
- **Recording:** Every important source in `evidence.md` with URL + date + quote. Full bodies in `raw/details.json`.

## 4. Evidence Summary (by category — prevalence in corpus only)

**Do not extrapolate counts to fake population % — they describe this corpus.**

| Category | n | % corpus (n/67) | Recurrence signal | Example |
|----------|---|----------------|-------------------|---------|
| privacy_trust | 14 | 21% | 3 identical trust-adapter proposals same week (Cline #13737, Continue #13212, Aider #5665) — cross-repo | Aider #5621 telemetry ships unredacted URLs |
| verification_burden | 14 | 21% | Opposite polls: #13753 remove proactivity vs #13101 permission spam | Continue #13101 "continues to ask permission for every access" |
| cost_latency | 11 | 16% | Pricing bug 15-300x (#13184) + token blowup (#253) | opencode #253 High Token Usage Gemini 2.5 Flash |
| regression | 7 | 10% | State loss: #3581 add file discards changes (4 comments), #3965 rollback | Aider #3581 |
| hallucination | 6 | 9% | Tool-name hallucination + edit-block doubled prefix | Aider #5112 |
| progress_visibility | 6 | 9% | Same symptom in two products: #46734 no progress while streaming | anomalyco #46734 |
| loops_hangs | 5 | 7% | Hangs with no logs: #13750 Ollama indefinite | Cline #13750 |
| context_loss | 4 | 6% | Window detection + truncation re-apply | Cline #12876, #13693 |
| uncategorized | 1 | 1% | — | — |

Cross-repo recurrence noted where ≥2 products show same symptom (progress, privacy, loops).

## 5. Findings — 5 Required Questions

### Q1. Which problems recur most often? (in sampled corpus — do not extrapolate)

**EVIDENCE:** By count in this 67-source corpus: privacy/trust (21%, 14) and verification burden (21%, 14) are most frequent, followed by cost/latency (16%, 11). Context loss (6%) and loops/hangs (7%) are least frequent here — *but this ranking is an artifact of query construction and inclusion of fix PRs that add verification/privacy features.* Verbatim ranking is valid for corpus, not for population.

Distinguish: **prevalence in corpus** ≠ **population prevalence** — we have no survey n>100. Say explicitly: *No reliable evidence found* for population ranking.

### Q2. Which appear most severe?

**INFERENCE (Medium confidence, reasoning below):**

- **High severity — blocks use or causes data loss:** loops/hangs (hangs indefinitely with no logs, blocks all use; 6-comment loop), hallucination/unreliable edits (silent wrong edits, opaque errors), regression (discards all changes, rolls back manual work), privacy (unredacted telemetry URLs/paths, .env override silently replaces shell vars — enterprise blocker), context loss on long-horizon tasks (HN: "difficult to keep agent on track throughout entire feature" — blocks value proposition even though n=4 here).

- **Medium severity — costly/annoying:** cost/latency (15-300x pricing error is billing bug; token blowup is cost not correctness), verification burden (permission spam vs over-proactivity — annoyance, not data loss), progress visibility (no progress signal while streaming — UX, not correctness).

Severity is judged by consequence, not count. A 7% loops category can still justify a product if blocking.

### Q3. Which are directly solvable at harness layer?

**INFERENCE (High confidence on progress/privacy/loops; Medium on hallucination):**

- **Almost entirely harness:** progress visibility (TUI buffering, SSE heartbeat vs message), loops/hangs (timeout, loop detection, Stop button #13678), privacy/trust (MCP proxies #12492, allowHeadless #9327, OAuth hardening #13676, .env override fix #5622, telemetry redaction #5621), verification burden (permission gates #13101, auto-test #5610, ledger #13155, keep Stop available).

- **Partial harness (validate inputs/outputs):** hallucination (harness can reject unknown MCP tools #12977, catch doubled-prefix #5112, sanitize malformed args #13092, but cannot stop model invention of docs [H03]); regression (harness can do worktrees, file-ownership locks, but model still chooses wrong file #5662); context management (repo-map, truncation limits #13693, hook delivery #13297 help, but window is model limit); cost (pricing table fix #13184 is harness, token blowup is model+prompt discipline).

### Q4. Model vs harness limitations?

**INFERENCE (Medium-High confidence):**

- **Model-limited core:** doubled-prefix invention, fabricating docs, inventing file edits that don't exist — requires better model.
- **Harness-limited core:** forwarding unknown tool names without validation, missing progress signal while streaming, hanging without error logs/timeout, permission spam vs missing guardrails, credential/MCP trust missing, re-truncating already-budgeted output, failing to harden OAuth callbacks.
- **Hybrid:** context loss — model window + harness trimming/re-truncation both contribute. HN H02 explicitly hypothesizes "not a model problem but a harness problem," treating harness as lever even for apparent model failures. Contradiction noted: same user base attributes same failure to opposite layer.

### Q5. Enough evidence to call one or more product-grade problems?

**EVIDENCE + INFERENCE:**

- **Yes — for ≥4 categories with cross-repo, High-severity, recurrent evidence:** loops/hangs (5 sources, 3 repos, blocking), hallucination/tool misuse (6, 3 repos, silent incorrectness), regression/state loss (7, 3 repos, discards work), privacy/trust (14, 4 repos, identical proposals + telemetry leak). Each has multiple primary-source GitHub issues and converges with independent R002 sample, so existence + severity for affected users is validated. **Medium-High confidence on existence/severity.**

- **Broader demand — No reliable evidence found** for how many of the overall user population are blocked or would pay. No n>100 survey retrieved; HN is anecdotal; pricing/bench magnitude not measured. Prevalence in corpus (7-21%) must not be converted to population %. Enterprise privacy demand is inferred from concentration of trust proposals, not measured buyer intent. **Low confidence on market sizing.**

**Recommendation:** Enough validated, severe, harness-solvable pains exist to justify a *narrow* product wedge focused on verification/steerability (the same 3 differentiators from synthesis): verification gate + progress/loop guardrails + trust/MCP proxy. Do not claim multi-agent as validated need here; do not size niche without interviews + survey. Gate building behind kill criteria T1-T4 remains correct per synthesis.

## 6. Contradictions

- **Proactivity vs permission:** Cline #13753 (remove "BE HELPFUL AND PROACTIVE") contradicts Continue #13101 (asks permission for every access). Resolution: weighted as preference heterogeneity — verification burden exists but ideal friction level varies by user/task.
- **Model vs harness attribution:** HN H02 says deterioration is harness, not model, contradicting H01 framing context loss as intrinsic. Resolution: weighted H02 as anecdotal hypothesis (hierarchy 9) below primary GH issues (hierarchy 4); treated as signal that harness improvements can mitigate even model-attributed failures.
- **Cost magnitude:** Continue #13184 claims 15-300x pricing error (single anecdotal issue, not verified against pricing page) contradicts assumption cost blowup is token-driven. Treated as low-weight anecdotal until F02 verifies.
- **Prevalence vs severity mismatch:** Our corpus shows privacy/verification most prevalent, prior R002 emphasized context/hallucination/loops as top pains. Resolution: both samples are small and query-biased; severity ranking aligns more than prevalence ranking, suggesting prevalence counts are not comparable across studies.

## 7. Confidence & Limitations

- **High confidence:** loops/hangs existence + blocking severity; privacy/trust enterprise blocker (cross-repo proposals + telemetry leak); progress visibility harness gap (same symptom 2 products); verification burden heterogeneity.
- **Medium confidence:** hallucination harness vs model split; regression causality; context loss severity despite low n (supported by HN but n=4 in corpus); that 5-category product-grade claim survives after discounting fix-PR inflation.
- **Low confidence:** any population prevalence or broader demand (no survey); cost magnitude; that solving these at harness will shift user behavior.

**Method limits:** GitHub Search API limits and org renames required fallback; corpus built from recent window (2026) so may miss older pains; keyword scoring imperfect (some PRs mis-category); fix PRs counted as evidence inflate verification/privacy counts; no Reddit/Discord sentiment due to auth; no tavily/web search — API-only; pricing pages not re-verified; single coder, no inter-rater.

## 8. Recommendation (per task: is there enough to call product-grade?)

Yes for narrow harness wedge (verification gate + loop/timeout + progress + MCP trust), no for population demand claim. Proceed to F02/F03 thresholds before sizing/pricing build. Ship verification harness as single-agent wrapper first (per synthesis default), measure Pareto (resolved vs regression vs cost vs recovery) before multi-agent.

## Traceability

- Evidence: `research/F01/evidence.md` (67 GitHub + 6 HN/blog sources, every URL + quote)
- Raw: `research/F01/raw/corpus_v2_raw.json`, `raw/corpus_raw.json`, `raw/details.json`, `raw/selected.json`, `raw/relevant2.json`
- Prior synthesis: `research/reports/01-research-synthesis.md`
