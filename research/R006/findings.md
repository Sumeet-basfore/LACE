# R006 Findings — Privacy, Local Models & Enterprise

Label for every bullet: **FACT / EVIDENCE / INFERENCE / HYPOTHESIS / OPINION**. Confidence per finding cluster at end.

## 1. Enterprise Restrictions & Source-Code Privacy

- **FACT** — GitHub Copilot docs expose a full enterprise-admin surface dedicated to data governance: `Configure content exclusion`, `Use your own model provider (BYOK)`, `Enterprise managed settings`, `MCP private registry enforcement`, `Local sandboxing`, `Review audit logs`, `Monitor agentic activity`. [E07](https://docs.github.com/en/copilot) — accessed 2026-09-02.
- **INFERENCE** — The existence and breadth of those controls is strong evidence that source-code exfiltration / training / compliance concerns are a real, recurring enterprise objection. Vendors would not build BYOK, content exclusion, and audit logging without sustained buyer pressure. Confidence: **High** (reason: hierarchy 2/3 primary, multiple distinct controls converge on same motive).
- **EVIDENCE** — Ollama and LM Studio both make explicit no-exfiltration privacy claims for local execution: "Nothing you run locally ever leaves your machine." [E01](https://ollama.com) and "Your voice and audio data is processed locally and never leaves your device." + "Zero Data Retention (ZDR) across the board." [E04](https://lmstudio.ai/) — accessed 2026-09-02. These are EVIDENCE that vendors market privacy as a buyer criterion, not proof of market size.
- **INFERENCE** — Regulated industries (finance, healthcare, defense, government) and data-residency regimes are the canonical buyers for air-gapped/offline requirements, but **no enterprise policy PDF was successfully fetched this wave** to quantify prevalence. The inference rests on the product controls above, not on a counted survey. Confidence: **Medium**.
- **HYPOTHESIS** — Enterprise trend is toward *approved cloud with ZDR/BYOK + on-prem gateway* rather than pure offline. LM Studio Bionic explicitly offers hybrid: "Natively local… For your most demanding tasks, run Bionic with … frontier open models such as GLM 5.2, Kimi K3, DeepSeek V4 Pro. Privacy is key… ZDR" [E04](https://lmstudio.ai/). HYPOTHESIS: buyers prefer hybrid over pure-local when ZDR is contractually guaranteed. Needs validation via buyer interviews.

## 2. Local LLM Coding — Maturity & Ecosystem

- **FACT** — A mature local-inference ecosystem exists and is already integrated with coding agents: Ollama distributes open models with one-line install (`ollama/ollama` Docker, install.sh) [E02](https://raw.githubusercontent.com/ollama/ollama/main/README.md); Aider lists `Ollama` and `LM Studio` as first-class LLM providers alongside OpenAI/Anthropic [E06](https://aider.chat/docs/faq.html); LM Studio offers "MLX and llama.cpp under the hood" [E04](https://lmstudio.ai/).
- **FACT** — Continue, an open-source coding agent, described as "CLI, VS Code extension, and JetBrains plugin," is now read-only / no longer actively maintained [E05](https://raw.githubusercontent.com/continuedev/continue/main/README.md) — accessed 2026-09-02. Earlier docs referenced local Ollama usage but current status reduces confidence that it is a forward-leaning local-agent choice.
- **EVIDENCE** — No peer-reviewed SWE-Bench or equivalent local-vs-cloud coding benchmark was retrieved this wave (attempted arXiv fetch returned unrelated paper) [E12]. Therefore **no reliable evidence found** for quantified performance gap locally vs frontier cloud on agentic coding tasks. This is a gap, not a finding.
- **INFERENCE** — From ecosystem structure (small quantized models via Ollama/LM Studio) and known agent architecture (tool calling, long context, function-calling quality matters for coding), local models likely trade capability for privacy. The size of the gap cannot be stated as fact without benchmarks. Confidence in *direction* (gap favors cloud): **High** (well-established in literature, but not evidenced this wave); Confidence in *magnitude*: **Low** (no citation).
- **OPINION** (not evidence) — Community sentiment on HN/Reddit about local coding quality was not fetched/verified this wave. Any claim that "users widely report local models are insufficient for agentic coding" would be OPINION and is deliberately excluded.

## 3. Offline / Air-Gapped Development

- **FACT** — Vendors explicitly market offline-capable modes: Ollama local execution ("Nothing… leaves your machine" [E01]); LM Studio "Download the latest local LLMs directly within the app" for local chats/agentic tasks [E04].
- **FACT** — GitHub Copilot docs include `Local sandboxing` / `Configure local sandbox` and `Cloud sandboxes` as parallel options [E07](https://docs.github.com/en/copilot) — evidence that both local and cloud execution are productized for enterprise isolation needs.
- **INFERENCE** — Air-gapped demand is real but narrow: it maps to classified, on-prem-only, or disconnected environments rather than general enterprise. The fact that vendors hedge with *local sandbox* + *ZDR cloud* options suggests the air-gapped-only segment is a minority of the privacy-concerned market. Confidence: **Medium**.

## 4. Data Residency & Regulated Industries

- **FACT** — Ollama markets "All cloud models are hosted in the US, Europe & Singapore" [E01](https://ollama.com) — implying residency-aware hosting even for its hybrid offering.
- **EVIDENCE** — No residency attestation (SOC 2, HIPAA, FedRAMP), DPA, or enterprise procurement policy doc was successfully parsed this wave (E11 404). Therefore data-residency purchasing criteria cannot be quantified here. Marked as missing evidence.
- **HYPOTHESIS** — Data residency is a *qualifier* (check-box for vendor selection), not a differentiator that alone wins a coding-agent deal. Buyers will shortlist only vendors who satisfy residency/ZDR; they then choose on capability, UX, and integration. Needs procurement-interview validation.

## 5. Local Inference Limitations & 8GB RAM Scenario

- **EVIDENCE** — No hardware benchmark (tokens/sec, context window, tool-calling success) for 8GB RAM machines was retrieved this wave. **No reliable evidence found** for "credible 8GB RAM scenario" performance after searching Ollama docs/library and Aider/LM Studio pages. Searched sources [E01–E07]; capture of quantified RAM vs model-size vs coding success not obtained.
- **INFERENCE** — On 8GB RAM, only small quantized models (e.g., ~3–7B Q4) fit alongside OS/IDE, implying narrow context windows and reduced tool-calling/agentic reasoning vs 70B+ or frontier cloud models. This is general knowledge about quantization/memory, but without a cited benchmark it remains INFERENCE, not EVIDENCE. Do not use for sizing claims. Confidence: **Medium** for direction, **Low** for any numeric threshold.
- **HYPOTHESIS** — 8GB RAM local coding agent is viable for *completion/ask-about-code* but not for *autonomous agentic workflows* (multi-file edits, test loops). The ceiling will be UX-relevant: latency and error rate. LACE should not target 8GB as primary design point; offer degraded local mode with clear expectations if attempted.

## 6. Market Opportunity Assessment (Synthesis)

- **INFERENCE** — Privacy/local is **not REJECTED**: the product-surface evidence (E07 enterprise controls + E01/E04 local claims + E06 local-provider integrations) shows a genuine, persistent need.
- **INFERENCE** — Privacy/local is **not CORE** (general-market wedge). The hybrid trend (local + ZDR cloud, BYOK) and the inactive status of a flagship open local agent (Continue read-only [E05]) indicate that *pure-local* is not the market's preferred answer; *privacy-respecting cloud* increasingly satisfies the same concern for most enterprises.
- **INFERENCE** — Best framing: **IMPORTANT SECONDARY / differentiator** and **NICHE as PRIMARY** — essential to win regulated/air-gapped deals and to differentiate on trust, but not sufficient to carry a general-purpose coding agent alone. Already partially well-served by Ollama + Aider/LM Studio + Copilot Enterprise (content exclusion / BYOK / local sandbox), yet no single vendor owns "private agentic coding" as a crisp, trustworthy story. Gap exists in *packaged, verifiable* local-first agent UX (vs DIY glue). Confidence: **Medium** (limited by missing quantification of segment size and benchmarks).

## Confidence Summary

- Enterprise restrictions exist and drive product controls: **High**
- Local ecosystem maturity (Ollama/LM Studio/Aider): **High**
- Performance gap local vs cloud (direction): **High**; magnitude: **Low** (no benchmark cited)
- 8GB RAM viable envelope: **Low** (no benchmark; inference only)
- Verdict (IMPORTANT SECONDARY / NICHE): **Medium** (needs segment sizing + buyer interviews + benchmarks)
