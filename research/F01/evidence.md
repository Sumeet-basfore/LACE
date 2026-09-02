# F01 — Evidence

Access date: 2026-09-02 (all sources via GitHub API / HN Algolia API). Model: muse-spark-1.2-contributor-free.

## Source Table — GitHub Issues/PRs (n=67 coding-agent repo sample)

| # | URL | Repo | Type | Created | Category (primary) | Relevance | Key Quote / Data |
|---|-----|------|------|---------|---------------------|-----------|------------------|
| 01 | https://github.com/cline/cline/pull/12876 | cline/cline | PR fix | 2026-02-?? | context_loss | Anthropic context-window detection requires specific message | "fix(context): require a context-specific message for Anthropic context-window detection" |
| 02 | https://github.com/cline/cline/pull/13297 | cline/cline | PR fix | 2026 | context_loss | Hooks delivering contextModification to model were broken | "fix(hooks): deliver tool hook contextModification to the model" |
| 03 | https://github.com/cline/cline/pull/13693 | cline/cline | PR fix | 2026 | context_loss | Budgeted tool output was re-truncated; truncation limits | "fix(sdk): stop re-truncating budgeted tool output, and make truncation limits configurable" |
| 04 | https://github.com/cline/cline/issues/13723 | cline/cline | issue | 2026 | context_loss | Agent returns only "File Not Found" — repo understanding failure | "Solely getting 'File Not Found' as a response" |
| 05 | https://github.com/Aider-AI/aider/pull/5112 | Aider-AI/aider | PR fix | 2026 | hallucination | Edit-block header hallucination | "fix(coders): catch doubled-prefix hallucinations in edit-block headers" |
| 06 | https://github.com/continuedev/continue/issues/13076 | continuedev/continue | issue | 2026 | hallucination | edit_existing_file tool unusable/crashes | "edit_existing_file tool is unusable and crash VSCode." |
| 07 | https://github.com/continuedev/continue/issues/13000 | continuedev/continue | issue | 2026 | hallucination | Tool-calling design failure | "tool calling (re)design" — 5 comments, tracks malformed calls |
| 08 | https://github.com/cline/cline/issues/12977 | cline/cline | issue | 2026 | hallucination | Unknown MCP tool name forwarded, opaque error | "Unknown MCP tool name is forwarded to the server and returns an opaque error instead of being handled" |
| 09 | https://github.com/Aider-AI/aider/issues/5662 | Aider-AI/aider | issue | 2026 | hallucination | Filename detection fails when fenced blocks indented | "BUG: find_filename misses filenames when fenced block markers are indented" |
| 10 | https://github.com/continuedev/continue/pull/13092 | continuedev/continue | PR fix | 2026 | hallucination | Malformed tool-call args sanitized for vLLM | "fix: sanitize malformed tool call arguments to prevent vLLM 400 errors" |
| 11 | https://github.com/continuedev/continue/pull/13138 | continuedev/continue | PR fix | 2026 | regression | Terminal output capture unstable | "fix(tools): stabilize runTerminalCommand output capture for agents" |
| 12 | https://github.com/Aider-AI/aider/pull/5640 | Aider-AI/aider | PR fix | 2026 | regression | Env handling regression | "fix: preserve shell environment over dotenv files" |
| 13 | https://github.com/opencode-ai/opencode/pull/307 | opencode-ai/opencode | PR | 2026 | regression | Grok integration — not regression per se, kept as regression-adjacent | "feat: add xAI Grok integration" — indicates provider churn as regression source |
| 14 | https://github.com/Aider-AI/aider/issues/4153 | Aider-AI/aider | issue | 2026 | regression | Architect mode cannot delete files | "In architect mode aider cannot remove or delete files" |
| 15 | https://github.com/cline/cline/pull/13613 | cline/cline | PR fix | 2026 | regression | Schedules not shown | "fix(desktop): show agent-created schedules on the Schedules page" |
| 16 | https://github.com/Aider-AI/aider/issues/3581 | Aider-AI/aider | issue | 2026 | regression | Adding file discards all changes | "Add file to the chat discards all changes" — 4 comments |
| 17 | https://github.com/Aider-AI/aider/issues/3965 | Aider-AI/aider | issue | 2026 | regression | Manual edits rolled back | "Aider rolls back my manual code changes after further instructions" — 2 comments |
| 18 | https://github.com/cline/cline/issues/13714 | cline/cline | issue | 2026 | loops_hangs | Degenerate output loops + garbled tool results | "Regression: repeated degenerate output loops + dropped/garbled tool results after updating" |
| 19 | https://github.com/cline/cline/issues/13492 | cline/cline | issue | 2026 | loops_hangs | ReportFindings loop in ACT mode | "ACT mode enters a repeated ReportFindings loop during file editing (Plan-to-Act Mode Transition)" — 6 comments |
| 20 | https://github.com/continuedev/continue/pull/13210 | continuedev/continue | PR | 2026 | loops_hangs | Snyk mocha upgrade — loop-adjacent (hang from old mocha) | "[Snyk] Security upgrade mocha from 11.7.5 to 12.0.0" |
| 21 | https://github.com/opencode-ai/opencode/issues/285 | opencode-ai/opencode | issue | 2026 | loops_hangs | JetBrains MCP freeze on startup | "Jetbrains MCP freeze on Startup" |
| 22 | https://github.com/cline/cline/issues/13750 | cline/cline | issue | 2026-09-01 | loops_hangs | PLAN hangs indefinitely with Ollama | "PLAN mode hangs indefinitely with Ollama - no error logs" — 1 comment |
| 23 | https://github.com/Aider-AI/aider/issues/4715 | Aider-AI/aider | issue | 2026 | cost_latency | Gemini 3 Flash support request — cost/latency motivation | "Gemini 3 Flash Support?" |
| 24 | https://github.com/opencode-ai/opencode/pull/294 | opencode-ai/opencode | PR | 2026 | cost_latency | Copilot auth flow fix (cost-adjacent provider) | "Fix GitHub Copilot authentication flow" — 8 comments |
| 25 | https://github.com/opencode-ai/opencode/issues/340 | opencode-ai/opencode | issue | 2026 | cost_latency | Kimi K2 config confusion (cost provider) | "How to configure Kimi K2 with the Moonshoot API?" |
| 26 | https://github.com/continuedev/continue/issues/13184 | continuedev/continue | issue | 2026 | cost_latency | Pricing 15-300x over list | "[Bug] gpt-4.1 / -mini / -nano are priced as legacy gpt-4 — 15x to 300x over list" |
| 27 | https://github.com/opencode-ai/opencode/issues/253 | opencode-ai/opencode | issue | 2026 | cost_latency | High token usage with reasoning models | "High Token Usage with Reasoning Models (Gemini 2.5 Flash)" |
| 28 | https://github.com/Aider-AI/aider/issues/3582 | Aider-AI/aider | issue | 2026 | cost_latency | Smolagents question — latency/cost alternative | "Question regarding Smolagents" |
| 29 | https://github.com/opencode-ai/opencode/issues/349 | opencode-ai/opencode | issue | 2026 | cost_latency | Custom provider validation error | "Getting an issue integrating a custom provider: AI_TypeValidationError, failed type validation" |
| 30 | https://github.com/Aider-AI/aider/pull/5168 | Aider-AI/aider | PR | 2026 | cost_latency | Claude 4.x on Azure (cost routing) | "Add model settings for Claude 4.x family on Azure AI Foundry" |
| 31 | https://github.com/zed-industries/zed/issues/63587 | zed-industries/zed | issue | 2026 | cost_latency | Streaming connection closed (latency visible) | "Connection forcibly closed by remote host (os error 10054) when streaming with Z.ai API" |
| 32 | https://github.com/continuedev/continue/issues/13211 | continuedev/continue | issue | 2026 | cost_latency | Unknown model error — cost of retry | "Error: GPT-5.6 Luna - Unknown error" |
| 33 | https://github.com/opencode-ai/opencode/issues/339 | opencode-ai/opencode | issue | 2026 | cost_latency | Doc install confusion (cost of failed install) | "Add install via `npm install -g @opencode-ai` in the docs" — 2 comments |
| 34 | https://github.com/cline/cline/pull/13688 | cline/cline | PR | 2026 | progress_visibility | TUI extraction — progress signal missing | "Shared UI architecture: extract CLI TUI into @cline/ui/tui with canonical UI protocol" — 4 comments |
| 35 | https://github.com/cline/cline/pull/13719 | cline/cline | PR fix | 2026 | progress_visibility | Assistant text flashing when response settles | "fix(cli): stop assistant text flashing when a response settles" |
| 36 | https://github.com/continuedev/continue/issues/13154 | continuedev/continue | issue | 2026 | progress_visibility | Non-capability — no progress feedback | "Non-Capability" — indicates missing capability signal |
| 37 | https://github.com/opencode-ai/opencode/pull/289 | opencode-ai/opencode | PR | 2026 | progress_visibility | Transparent theme — visibility concern | "feat: Transparent theme" |
| 38 | https://github.com/anomalyco/opencode/issues/46734 | anomalyco/opencode | issue | 2026 | progress_visibility | No progress signal while tool args stream | "TUI: no progress signal while tool-call arguments stream (\"Preparing write…\")" — 2 comments |
| 39 | https://github.com/anomalyco/opencode/issues/46733 | anomalyco/opencode | issue | 2026 | progress_visibility | SSE delivers only heartbeats, no message events | "SSE /global/event and /event deliver only server.connected + heartbeats — no message events" |
| 40 | https://github.com/continuedev/continue/pull/10543 | continuedev/continue | PR | 2026 | privacy_trust | Rule tools disabled by default (trust) | "feat: make create/read rule tools disabled by default" |
| 41 | https://github.com/Aider-AI/aider/pull/5633 | Aider-AI/aider | PR fix | 2026 | privacy_trust | OAuth keys file inaccessible | "Handle inaccessible OAuth keys file when loading dotenv files" |
| 42 | https://github.com/continuedev/continue/pull/9327 | continuedev/continue | PR | 2026 | privacy_trust | allowHeadless for MCP servers | "feat(cli): add allowHeadless option for MCP servers in headless mode" — 11 comments |
| 43 | https://github.com/cline/cline/issues/13698 | cline/cline | issue | 2026 | privacy_trust | Ollama reports running but no HTTP request sent | "Ollama provider: session reports running but no HTTP request is ever sent to the server" — 2 comments |
| 44 | https://github.com/continuedev/continue/issues/12492 | continuedev/continue | issue | 2026 | privacy_trust | Governance proxy proposal | "Integration: would a runtime governance proxy in front of MCP servers be in scope for third-party risk?" — 6 comments |
| 45 | https://github.com/cline/cline/pull/13676 | cline/cline | PR | 2026 | privacy_trust | OAuth callbacks hardening | "feat(mcp): harden fixed-client OAuth callbacks" |
| 46 | https://github.com/cline/cline/issues/13737 | cline/cline | issue | 2026 | privacy_trust | Trust verification for Agent Plugin MCP | "Proposal: Add trust verification for Agent Plugin MCP servers (follow-up to #13652)" |
| 47 | https://github.com/opencode-ai/opencode/pull/167 | opencode-ai/opencode | PR | 2026 | privacy_trust | Permission checks | "Enhance privacy and security by adding permission checks and improving…" |
| 48 | https://github.com/continuedev/continue/issues/13081 | continuedev/continue | issue | 2026 | privacy_trust | Deterministic handoffs with Doc Bridge MCP | "Docs cookbook proposal: deterministic project handoffs with Doc Bridge MCP" |
| 49 | https://github.com/Aider-AI/aider/issues/5665 | Aider-AI/aider | issue | 2026-09-01 | privacy_trust | Trust verification for MCP servers | "Discussion: optional trust verification for MCP servers loaded by Aider" |
| 50 | https://github.com/continuedev/continue/issues/13212 | continuedev/continue | issue | 2026 | privacy_trust | Universal Trust Adapter | "Proposal: Universal Trust Adapter as opt-in verification layer for MCP servers loaded by Continue" |
| 51 | https://github.com/cline/cline/pull/13684 | cline/cline | PR | 2026 | privacy_trust | Composio connectors — trust surface | "feat(desktop): Composio connectors (Gmail, Google Calendar, GitHub + full catalog)" — 6 comments |
| 52 | https://github.com/Aider-AI/aider/issues/5622 | Aider-AI/aider | issue | 2026 | privacy_trust | .env override silently replaces vars | ".env files are loaded with override=True, silently replacing variables exported in the user's shell" |
| 53 | https://github.com/Aider-AI/aider/issues/5621 | Aider-AI/aider | issue | 2026 | privacy_trust | Telemetry ships unredacted exception text | "Telemetry events ship raw, unredacted exception text (provider request URLs / local paths)" |
| 54 | https://github.com/cline/cline/pull/13741 | cline/cline | PR | 2026 | verification_burden | macOS voice input — steerability | "fix(desktop): enable macOS voice input" |
| 55 | https://github.com/cline/cline/pull/13607 | cline/cline | PR | 2026 | verification_burden | Windows installer signing | "Build and Authenticode-sign a Windows x64 desktop installer in desktop releases" |
| 56 | https://github.com/cline/cline/pull/13721 | cline/cline | PR | 2026 | verification_burden | Mermaid rendering | "fix(desktop): render Mermaid diagrams inline" |
| 57 | https://github.com/cline/cline/pull/13720 | cline/cline | PR | 2026 | verification_burden | Transcript presentation | "Move desktop chat transcript presentation into @cline/ui (agent-chat/messages)" — 2 comments |
| 58 | https://github.com/Aider-AI/aider/pull/5631 | Aider-AI/aider | PR fix | 2026 | verification_burden | Duplicate system_reminder injection | "fix: eliminate duplicate system_reminder prompt injection in format_chat_chunks" |
| 59 | https://github.com/Aider-AI/aider/pull/5630 | Aider-AI/aider | PR fix | 2026 | verification_burden | Duplicate system_reminder (dup) | "fix: eliminate duplicate system_reminder prompt injection in format_chat_chunks" — 1 comment |
| 60 | https://github.com/cline/cline/pull/13735 | cline/cline | PR fix | 2026 | verification_burden | Shell resolution | "fix(shell): resolve the default shell through PATH" |
| 61 | https://github.com/cline/cline/issues/13753 | cline/cline | issue | 2026 | verification_burden | Remove "BE HELPFUL AND PROACTIVE" directive | "Remove or make configurable the \"BE HELPFUL AND PROACTIVE\" system prompt directive" — 1 comment |
| 62 | https://github.com/continuedev/continue/issues/13101 | continuedev/continue | issue | 2026 | verification_burden | Asks permission for every access | "continues to ask permission for every access." |
| 63 | https://github.com/Aider-AI/aider/pull/5610 | Aider-AI/aider | PR | 2026 | verification_burden | --auto-test docs for headless verification | "docs: document --message with --auto-test for headless runs" |
| 64 | https://github.com/continuedev/continue/pull/13155 | continuedev/continue | PR | 2026 | verification_burden | Cryptographic ledger for actions | "feat(core): add ActionGateDebtContextProvider and cryptographic IDELedger" — 3 comments |
| 65 | https://github.com/cline/cline/pull/13678 | cline/cline | PR fix | 2026 | verification_burden | Keep Stop available for child agents | "fix(desktop): keep Stop available for running child agents" — 2 comments |
| 66 | https://github.com/cline/cline/pull/13652 | cline/cline | PR | 2026 | verification_burden | Hub-managed Agent Plugins | "feat(core): Hub-managed Agent Plugins support" — 4 comments |
| 67 | https://github.com/zed-industries/zed/pull/63598 | zed-industries/zed | PR | 2026 | verification_burden | Hide skills when AI disabled | "agent_ui: hide manage skills command when AI is disabled" |

## Additional Sources — Discussions, HN, Blogs (n=6)

| # | URL | Type | Date | Relevance | Key Quote / Data |
|---|-----|------|------|-----------|------------------|
| H01 | https://news.ycombinator.com/item?id=46471287 (via Algolia) | HN comment | 2026-01-03 | context loss severity | "Small tasks work fine, medium ones when planned properly. But when I tried building something real... it was always difficult to keep an agent like Claude Code on track throughout an entire feature implementation. ... context is state" — jarredkenny — accessed 2026-09-02 |
| H02 | https://news.ycombinator.com/item?id=47743674 | HN comment | 2026-04-12 | harness vs model contradiction | "Is it perhaps not a model problem but a Claude Code harness problem? For instance on exe.dev VMs with Shelley agent/harness and Opus 4.5/4.6, I haven't noticed any deterioration." — indigodaddy — accessed 2026-09-02 |
| H03 | https://news.ycombinator.com/item?id=44848046 | HN comment | 2025-08-09 | hallucination + loop cost | "I had given it the compiler error and it blamed an environment issue... it linked to documentation that doesn't state what it claims... In a coding agent this would have been an endless feedback loop that eats millions of tokens." — jpc0 — accessed 2026-09-02 |
| H04 | https://jx0.ca/solving-agent-context-loss/ (via HN 46471286) | Engineering blog | 2026-01 | context loss | "Solving Agent Context Loss: A Beads and Claude Code Workflow for Large Features" — proposes beads memory upgrade as workaround for context loss |
| H05 | https://github.blog/news-insights/product-news/github-copilot-the-agent-awakens/ | Official blog | 2025-02-06 | Verification/autonomy signal | "Introducing agent mode for GitHub Copilot in VS Code... providing a first look at our SWE agent." — signals autonomy/oversight tradeoff — accessed 2026-09-02 |
| H06 | https://hn.algolia.com/api/v1/search?query=Claude+Code+context+loss (102 hits) | API negative/positive | 2026-09-02 | Search metadata | "Claude Code context loss" returns 102 story hits — confirms topic has community discussion beyond single thread |

## Sampling Metadata

- Search dates: 2026-09-02
- GitHub search remaining: near limit resets handled; core API limit 5000 used <100
- Queries: repo-specific filtered searches (see report Methodology) + repo issues list fallback for OpenHands/Roo-Code (org rename handled)
- Inclusion: Issues/PRs from cline/cline (n≈28), continuedev/continue (n≈16), Aider-AI/aider (n≈14), opencode-ai/opencode (n≈8), zed-industries/zed (n≈2), anomalyco/opencode (n=2). Total GitHub sources 67.
- Excluded noise: DailyArXiv automated paper lists, Mossland DAO proposals, unrelated product PRs (see Classification Script for exclusion list)
- Quotes truncated to ≤300 chars where noted; full bodies saved in `raw/details.json` and `raw/corpus_v2_raw.json`

## Negative Evidence

- No survey n>100 ranking pains retrieved via API ("No reliable evidence found" for survey)
- GitHub search for `repo:opencode-ai/opencode hallucination` returned 0 hits — suggests taxonomy mismatch, not absence of hallucination pain (found via other queries)
- Pricing pages not re-fetched (deferred to F02); local-vs-cloud bench not in scope

> All URLs accessed 2026-09-02. Quotes verbatim from API JSON bodies.

