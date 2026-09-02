# R006 — Privacy, Local Models & Enterprise

**Task:** Does privacy-first / local coding-agent execution represent a meaningful, underserved market opportunity?  
**Model:** muse-spark-1.2-contributor-free | **Date:** 2026-09-02 | **Artifacts dir:** `research/R006/`  
**Verdict:** **IMPORTANT SECONDARY / differentiator — NICHE as primary, not CORE** (justified below).

---

## 1. Research Question & Scope

Determine whether privacy/local is: genuine underserved need, useful differentiator, merely niche, or already well-served. Do not assume local-first is automatically valuable.

Scope per `research/tasks/R006.md`: enterprise restrictions on external AI tools, source-code privacy concerns, local LLM coding, offline/air-gapped development, regulated industries, data residency, local inference limitations, low-resource machines (8GB RAM where credible evidence exists).

Assumption (narrowest reasonable, per skill): evaluate for a *general-purpose coding agent* (like LACE), not a specialized classified-only tool.

---

## 2. Methodology

- Read `skills/research-agent/SKILL.md` and `research/tasks/R006.md` fully before starting (checked).
- Identified required coverage and artifact contract (report/evidence/findings/open-questions).
- **Search strategy:** Primary sources first (official docs, repos), then secondary. Prefer recent (≤12 mo) for product behavior, original sources for stable technique.
  - Fetched: Ollama homepage/library/README, LM Studio homepage (Bionic), Continue README, Aider LLM-provider docs, GitHub Copilot docs nav (full landing JSON), GitHub Trust Center, Cursor privacy, HF Transformers index.
  - Attempted and logged as missing: versioned GitHub Copilot privacy/data-ownership pages (404), arXiv coding benchmark paper (returned unrelated).
- Recorded every important source in `evidence.md` with URL + access date + key quote.
- Labeled claims FACT/EVIDENCE/INFERENCE/HYPOTHESIS/OPINION; cited important claims; handled contradictions; stated uncertainty.
- No additional agents spawned; no invented stats.

---

## 3. Sources Consulted

See `evidence.md` for full table (E01–E12, accessed 2026-09-02). Primary sources that carried weight:

- **E01 Ollama homepage**, **E02 Ollama README**, **E03 Ollama library** — local runtime maturity.
- **E04 LM Studio (Bionic)** — hybrid local + ZDR cloud positioning.
- **E05 Continue README** — open-source coding agent, now read-only.
- **E06 Aider docs** — explicit Ollama/LM Studio provider support.
- **E07 GitHub Copilot docs nav** — enterprise controls (content exclusion, BYOK, local sandboxing, audit).
- **E08–E12** consulted but lower weight (not parsed to verbatim or missing).

Source-quality hierarchy applied: official docs/repos (1–3) > engineering blogs > benchmarks > attributed reports > forum anecdotes (none quoted this wave). Higher beats lower on conflict.

---

## 4. Evidence (summarized; full quotes in evidence.md)

- **Privacy claims for local execution are explicit and verifiable:**
  - Ollama: "Nothing you run locally ever leaves your machine." [E01](https://ollama.com) — accessed 2026-09-02
  - LM Studio: "Your voice and audio data is processed locally and never leaves your device." and "Zero Data Retention (ZDR) across the board." [E04](https://lmstudio.ai/) — accessed 2026-09-02

- **Enterprise concern is productized, not hypothetical:**
  - Copilot docs nav exposes: content exclusion, BYOK ("Use your own model provider"), enterprise managed settings, MCP private registry enforcement, local sandboxing, audit logs, agentic activity monitoring [E07](https://docs.github.com/en/copilot) — accessed 2026-09-02. The breadth implies sustained enterprise demand.

- **Local coding-agent ecosystem exists but is fragmented:**
  - Ollama one-line install + Docker [E02](https://raw.githubusercontent.com/ollama/ollama/main/README.md); Aider routes to Ollama/LM Studio [E06](https://aider.chat/docs/faq.html); LM Studio bundles MLX/llama.cpp [E04]; Continue (CLI + VS Code + JetBrains) now **read-only / no longer actively maintained** [E05](https://raw.githubusercontent.com/continuedev/continue/main/README.md).

- **Missing / not verifiable this wave:**
  - No quantified enterprise block-rate survey; no SWE-Bench local-vs-cloud benchmark table; no 8GB RAM tokens/sec or tool-calling table. Each marked `No reliable evidence found.` in evidence.md/open-questions.md with search description.

---

## 5. Findings

Full labeled bullets in `findings.md`. Headlines:

**a) Enterprise restrictions are real, but the preferred fix is shifting.** FACT that enterprise-grade controls exist [E07] → INFERENCE that source-code privacy blocks deals (High confidence). HYPOTHESIS: market is moving toward *approved cloud with ZDR/BYOK + gateway* rather than pure offline. LM Studio's own pitch is hybrid: local first, frontier open models via ZDR cloud for hard tasks [E04] (supports hybrid HYPOTHESIS).

**b) Local LLM coding is credible, not frontier.** FACT mature runtime + integration [E01–E06]; FACT a flagship local agent is archived [E05] signals risk. INFERENCE direction (local < cloud on agentic coding) High, magnitude Low (no benchmark cited).

**c) Offline/air-gapped is genuine but narrow.** FACT vendors ship offline modes [E01][E04] and local sandboxes [E07]; INFERENCE it's a minority of the privacy-concerned market (Medium).

**d) Data residency is a qualifier, not a wedge.** FACT Ollama hosts cloud in US/EU/SG [E01]; no DPA parsed this wave — gap noted.

**e) 8GB RAM remains a hard ceiling.** `No reliable evidence found.` for credible 8GB agentic coding benchmarks (searched E01–E07). INFERENCE: only small quantized models fit, implying narrow context and weaker tool-calling (Medium direction, Low numeric).

---

## 6. Contradictory Evidence & How Weighted

- **Contradiction 1: "Privacy demands pure local" vs "Privacy satisfied by ZDR cloud."**
  - *Evidence for pure local:* Ollama "nothing leaves" [E01]; LM Studio "processed locally" [E04].
  - *Counter-evidence:* Same LM Studio page immediately offers ZDR cloud frontier models [E04]; GitHub Copilot invests heavily in BYOK + ZDR-style enterprise controls [E07].
  - *Assessment:* ZDR/BYOK has higher recency + broader enterprise product investment than pure-local dogma. Weight counter-evidence higher for *general enterprise*; pure-local remains decisive only for air-gapped/classified niche. Hierarchy tie goes to original vendor docs on both sides; buyer-behavior inference decides.

- **Contradiction 2: "Local ecosystem is thriving" vs "Flagship local agent archived."**
  - *Thriving:* Ollama library breadth [E03], Aider integrations [E06], LM Studio active [E04].
  - *Archived:* Continue read-only [E05].
  - *Assessment:* Runtime layer is thriving; *packaged local-first coding agent* layer is less healthy. LACE should not assume "build on Continue" is future-proof.

- No community sentiment contradiction assessed — no HN/Reddit threads retrieved this wave (deliberately excluded, would be low-hierarchy OPINION).

No contradictory evidence was silently omitted.

---

## 7. Confidence

| Finding | Confidence | Reason |
|---------|------------|--------|
| Enterprise restrictions drive buying criteria / product controls | **High** | Converging primary sources (E07 multiple controls + E01/E04 privacy claims) |
| Local runtime ecosystem maturity | **High** | Multiple independent primary repos/docs agree |
| Local vs cloud agentic performance (direction) | **High** | Established, but not evidenced this wave — so not cited as EVIDENCE |
| Local vs cloud gap (magnitude) | **Low** | No benchmark retrieved |
| 8GB RAM viable envelope | **Low** | No hardware benchmark retrieved; inference only |
| Verdict (IMPORTANT SECONDARY / NICHE) | **Medium** | Needs segment sizing + buyer interviews + benchmarks (open questions) |

Calibrated language used throughout: "evidence suggests" (Medium), "strong evidence shows" (High), "no reliable evidence found" (gap).

---

## 8. Limitations

- Versioned GitHub docs privacy pages returned 404 via direct path — relied on nav JSON [E07] instead of verbatim DPA text.
- Cursor privacy page JS-rendered — not parsed to quote (listed as consulted, not relied on).
- No survey/policy corpus, no SWE-Bench/Terminal-Bench local-vs-cloud table, no 8GB hardware benchmark captured this wave despite searching — all marked as gaps.
- Reddit/HN sentiment explicitly not fetched as evidence; treated as anecdotal per skill and excluded.
- Recency preference noted but not fully exercised: no ≤12 mo pricing/benchmark freshness to cite.

---

## 9. Recommendation (Verdict with Evidence)

**Verdict: IMPORTANT SECONDARY / useful differentiator — NICHE as a primary positioning, REJECTED as CORE.**

- **Not REJECTED:** Genuine underserved need exists for *verifiable* privacy. Evidence [E07] shows enterprises demanded and received content exclusion, BYOK, private registry, local sandboxing, and audit — vendors do not build that surface without buyer pressure. [E01][E04] vendors foreground local-privacy claims for the same reason. Regulated/air-gapped segment cannot use pure cloud.

- **Not CORE:** Pure-local does not carry the general market alone. Counter-evidence [E04] shows the leading local vendor hedging with ZDR cloud frontier models for demanding tasks, and [E07] shows the market leader solving privacy via *approved cloud* controls rather than offline. A general-purpose agent that is *only* local would concede frontier capability without capturing the broader buyer.

- **Already partially well-served, but gap remains:** Runtime is well-served (Ollama [E01–E03], LM Studio [E04]); integration is available (Aider [E06]); but *packaged, trustworthy local-first agentic UX* is not crisp — Continue's archival [E05] is evidence of fragility, and DIY glue (Ollama+Aider) has setup friction. Enterprise ZDR/BYOK offerings are maturing but procurement trust is not yet universal.

**Implication for LACE:**

1. **Build hybrid, market privacy.** Default to cloud frontier for capability, but ship a *verifiable local mode* (Ollama/LM Studio-compatible, BYOK-ready) with clear guarantees: "nothing leaves" for local path [E01-style claim made auditable], plus ZDR-contract language for cloud path [E04-style]. This wins both the general buyer (capability) and the regulated buyer (control).
2. **Don't design for 8GB as primary.** Support degraded local on 8GB with explicit ceiling ("small-context, limited agentic loops") — do not promise parity. Target 16GB+ for usable local agentic work. Revisit after F03 hardware rig.
3. **Close gaps before committing roadmap:** run F01 (policy corpus), F02 (benchmark sweep), F03 (8GB rig) from `open-questions.md` before sizing the niche or quoting performance.

---

## 10. Artifact Index

- `research/R006/report.md` — this file
- `research/R006/evidence.md` — source table + search summary
- `research/R006/findings.md` — labeled FACT/EVIDENCE/INFERENCE/HYPOTHESIS/OPINION bullets
- `research/R006/open-questions.md` — gaps, `No reliable evidence found.` statements, follow-ups

Raw captures retained in `research/raw/R006/` for verification.
