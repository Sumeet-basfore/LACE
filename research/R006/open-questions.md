# R006 Open Questions — Privacy, Local Models & Enterprise

## Unanswered / Partially Answered

1. **How large is the enterprise "block cloud AI" segment today?** What % of Global 2000 or regulated enterprises explicitly ban code exfiltration to third-party AI APIs? How has this changed since 2023–2024 bans (e.g., Samsung, Apple, JPMorgan anecdotes frequently cited but not fetched as primary source this wave)? What wording do real policy docs use (DPA, BA, FedRAMP)?
   - *Why open:* E07 proves vendors built controls, but segment sizing requires procurement policy corpus or CIO survey (e.g., JetBrains State of Developer Ecosystem, Stack Overflow, or vendor enterprise adoption reports). Not retrieved.

2. **Does ZDR/BYOK satisfy the same buyers who previously demanded fully local?** Under what contract terms (zero training, zero retention, data residency pinning) does a regulated buyer accept cloud over on-prem? Where is the boundary (classified, ITAR, HIPAA) where local is still mandatory?
   - *Why open:* LM Studio's ZDR claim [E04] and GitHub BYOK controls [E07] suggest a shift, but no buyer interview or policy text verified.

3. **What is the *quantified* coding performance gap local vs frontier cloud?** On SWE-Bench, HumanEval, or agentic benchmarks (e.g., Terminal-Bench), how do best local options (e.g., Qwen 2.5 Coder 7B/14B Q4, DeepSeek Coder V2, GLM/Kimi local) compare to cloud frontier (Claude/GPT-4 class) for *agentic* workflows (not just completion)?
   - *Why open:* No reliable evidence found — arXiv fetch [E12] returned unrelated paper; no benchmark table captured. Needs dedicated paper/repo fetch (e.g., SWE-Bench leaderboard local submissions, Ollama model cards with coding scores).

4. **What actually runs usably on 8GB RAM?** For credible evidence: which quantized model + context window + tool-calling success rate sustains an agentic coding loop on 8GB unified memory (macOS) vs 8GB discrete (Windows/Linux)? Tokens/sec, latency, and failure modes?
   - *Why open:* No reliable evidence found on 8GB scenario after searching Ollama docs/library and LM Studio. Needs hardware benchmark sources (e.g., llama.cpp benchmarks, LM Studio hardware guides, community 8GB reports with methodology).

5. **What is the install/UX friction of local-first vs hybrid?** How many steps, how large are downloads, how fragile is local setup for a typical engineer (not ML specialist)? Does LACE's promise of local build on install match reality?
   - *Why open:* Ollama install is one line [E02] but full agent glue (Aider/Ollama config, Continue setup) requires tuning — not measured here. Continue being read-only [E05] raises maintenance risk.

6. **How do Cursor / Copilot / Codeium enterprise privacy offerings compare on verifiable claims?** Who offers contractual ZDR, who offers on-prem, who offers BYOK with customer-owned keys, and what do SOC 2 Type II / audit logs actually cover?
   - *Why open:* Cursor privacy page fetched but not parsed (JS-rendered) [E09]; GitHub trust docs not parsed beyond nav [E08]. Needs doc-deep fetch with correct versioned URLs.

7. **Community sentiment on local coding agents — anecdotal but directional:** Do HN/Reddit users in 2025–2026 describe local agents as "good enough for privacy-sensitive work" or "still too dumb for real tasks"? How vocal is the privacy-first minority?
   - *Why open:* Intentionally not quoted this wave — no HN/Reddit thread fetched with methodology. Would be OPINION tier if fetched, not universal.

## Missing Evidence (explicit gaps)

- `No reliable evidence found.` for quantified enterprise adoption/block rates — searched GitHub docs nav, trust center, general web fetch; no survey/policy corpus retrieved.
- `No reliable evidence found.` for SWE-Bench or equivalent local-vs-cloud agentic coding benchmarks — searched arXiv path and docs; unrelated paper returned.
- `No reliable evidence found.` for 8GB RAM hardware benchmarks with methodology — searched Ollama library/docs, Aider, LM Studio; no tokens/sec or SWE-Bench-on-8GB table captured.
- `No reliable evidence found.` for verbatim enterprise DPA/ZDR contract language — attempted GitHub privacy paths 404; Cursor page not parsed.

## Follow-Up Research Ideas (do not chase now; log)

- **F01 — Enterprise policy corpus:** Collect 10–15 publicly posted AI-use policies (finance, healthcare, defense, FAANG) + vendor DPAs (GitHub Copilot Enterprise, Cursor, Anthropic ZDR). Extract residency/ZDR/training language; label FACT for policy text.
- **F02 — Local coding benchmark sweep:** Pull SWE-Bench Lite / Verified + Terminal-Bench results for top local models (Qwen 2.5 Coder 14B Q4, DeepSeek Coder V2 Lite, Code Llama, GLM 4) vs cloud baselines; record methodology and date.
- **F03 — 8GB hardware rig:** Run llama.cpp / LM Studio benchmark matrix (model × quantization × RAM × tokens/sec × context) on 8GB MacBook Air and 8GB Windows laptop; capture one reproducible artifact.
- **F04 — Buyer interviews (5):** Security/compliance + eng leads at regulated orgs: "What would make you allow cloud? What still requires air-gap?" — attribute as OPINION, not FACT.
- **F05 — Competitive UX teardown:** Time-to-first-local-agent for Ollama+ Aider vs LM Studio Bionic vs Continue vs LACE (steps, download size, failure points).

## Scope-Creep Notes (out of R006, park here)

- Pricing of local vs cloud inference at scale (cost arbitrage) — relevant but R005 territory.
- Model licensing (Apache 2.0 vs proprietary) for commercial local distribution — legal scope, not researched.
- Hardware roadmap (Apple Silicon unified memory vs NVIDIA) — influences 8GB story but deeper than asked.
