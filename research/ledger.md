# LACE Research Ledger

| Task | Topic | Agent | Status | Artifacts | Completed | Major Findings (1-line) | Confidence | Open Qs |
|------|-------|-------|--------|-----------|-----------|-------------------------|------------|---------|
| R001 | Competitive Landscape | lace-r001 | COMPLETE | `research/R001/report.md`, `evidence.md`, `findings.md`, `open-questions.md` | 2026-09-02 | 12 products live (HEAD verified); no incumbent covers persistence+multi-agent+verification+local+open harness together. Gap is orchestration, not another single agent. | High (existence) / Medium (caps) / Low (sentiment) | 7 Qs: benchmark numbers, pricing, offline support, multi-agent docs, top issues |
| R002 | User Pain & Unmet Needs | lace-r002 | COMPLETE | `research/R002/report.md`, `evidence.md`, `findings.md`, `open-questions.md` | 2026-09-02 | Top pains: context loss, hallucinations, verification burden, loops/hangs; privacy/MCP trust is enterprise blocker. Sample small (n~15) — need larger issue corpus. | Medium / High for loop existence | 8 Qs: prevalence %, cost/latency distribution, harness comparison |
| R003 | Multi-Agent Coding Evidence | lace-r003 | COMPLETE | `research/R003/report.md`, `evidence.md`, `findings.md`, `open-questions.md` | 2026-09-02 | Multi-agent wins on prototypes (SRDD/HumanEval +19pp) with SOPs+feedback, but costs 3-10x tokens/latency, prototype ceiling, no SWE-bench A/B found. Treat as optional, not default. | Medium-Low conditional / High cost penalty | 7 Qs: SWE-bench A/B, Pareto CIs, file ownership |
| R004 | Coding-Agent Architecture & Techniques | lace-r004 | COMPLETE | `research/R004/report.md`, `evidence.md`, `findings.md`, `open-questions.md` | 2026-09-02 | Mature reuse: ReAct, MCP, Tree-sitter, ripgrep/BM25, git worktrees/checkpoints, JSONL, containers. Build minimal: loop+d dispatcher, repo-map ranker, verification orchestrator. | High (ReAct/MCP/ACP/Tree-sitter) / Medium-Low (effectiveness in coding) | 7 Qs: BM25 vs embeddings, patch shootout, MCP scale |
| R005 | Benchmarks & Evaluation | lace-r005 | COMPLETE | `research/R005/report.md`, `evidence.md`, `findings.md`, `open-questions.md` | 2026-09-02 | SWE-bench family (2,294/300/500/480) dominates but needs filtering; LiveCodeBench is contamination-free; all ignore cost/reliability/regression/human-intervention. Propose Pareto scorecard. | High (benchmark structure) / Medium (critiques) | 8 Qs: holdout performance, harness delta, multilingual |
| R006 | Privacy, Local Models & Enterprise | lace-r006 | COMPLETE | `research/R006/report.md`, `evidence.md`, `findings.md`, `open-questions.md` | 2026-09-02 | Enterprise controls are real (BYOK/ZDR/sandbox). Local runtime mature, packaged agent fragile (Continue archived). Verdict: IMPORTANT SECONDARY / differentiator, NICHE as primary, not CORE. Hybrid wins. | High (enterprise demand, runtime maturity) / Low (gap magnitude, 8GB) | 7 Qs: segment sizing, ZDR acceptance, local vs cloud bench, 8GB rig |
| R007 | Adversarial: Prove LACE Should NOT Be Built | lace-r007 | COMPLETE | `research/R007/report.md`, `evidence.md`, `findings.md`, `open-questions.md` | 2026-09-02 | 8-bullet adversarial: incumbents cover each primitive, multi-agent 3-10x cost for +4-5pp, Herdr already occupies runtime, local niche, wrapper risk high. Recommends KILL multi-agent+local core unless T1-T4 thresholds met. | High (cost) / Medium-High (wrapper/niche) / Medium (user demand) | 8 gaps: pricing, SWE-bench A/B, survey, local bench, Herdr teardown |
| F01 | Pain Prevalence (50–100 issues) | lace-f01 | COMPLETE | `research/F01/report.md`, `evidence.md`, `findings.md`, `open-questions.md`, `raw/` | 2026-09-02 | 67 GH issues/PRs sampled: privacy/trust 21% + verification 21% most frequent in corpus; High-severity: loops/hangs (7%), hallucination (9%), regression (10%), privacy (21%) — 4 product-grade harness-solvable clusters validated. No population survey found. | Medium-High (corpus existence/severity) / Low (demand sizing) | 6 gaps: survey n>100, cost magnitude, repo breakdown |
| F02 | Single-Agent vs Verification Orchestration | lace-f02 | COMPLETE | `research/F02/report.md`, `evidence.md`, `findings.md`, `open-questions.md`, `experiment-design.md`, `pilot/` | 2026-09-02 | Pilot n=5 synthetic: baseline 80% (4/5) vs candidate 100% (5/5) = +20pp Wilson CI overlaps (37–96% vs 56–100%), median cost 1.28× (per-retry 2.05× at edge), regression 0, reliability 3/3. Feasibility proven, T1 NOT MET (n=5 <<300 needed for 10pp). | Low (generalization) / Medium (feasibility) | 5 gaps: SWE-bench Verified n≥30, LiveCodeBench split, real billing |
| F03 | Herdr Runtime Teardown | lace-f03 | COMPLETE | `research/F03/report.md`, `evidence.md`, `findings.md`, `open-questions.md` | 2026-09-02 | Herdr 0.8.2 live (3 ws, 11 panes, 5 agents, protocol 20). Material vs tmux on lifecycle/persistence/observability/ergonomics; vs LACE mostly Duplicates/Thin — only Real gaps are task-level observability & recovery (verification gate) & handoff. T2 untested — OPTIONAL INTEGRATION. | High (Herdr description) / Medium-High (vs tmux) / Medium (LACE gap) | T2 n≥20 HerdrDelta needed |
| F04 | Wrapper / Moat Test | lace-f04 | COMPLETE | `research/F04/report.md`, `evidence.md`, `findings.md`, `open-questions.md` | 2026-09-02 | Minimal repro: MCP server 250–350 LOC, Claude plugin <100 LOC hook, Herdr plugin 150–200 LOC (copy template) — single dev <1 week, <2 weeks High confidence. Standalone REJECTED — Outcome 3 (MCP/agent extension) + 2 variant. | High (MCP/hooks/Herdr spec) / Medium-High (<2wk) | OpenCode path Low, no timed build |

## Status Values
PENDING | SPAWNED | WORKING | BLOCKED | COMPLETE | NEEDS_FOLLOWUP | ARCHIVED

## Log
- 2026-09-02: Workspace bootstrapped. All 6 tasks PENDING.
- 2026-09-02: Skill created at `skills/research-agent/SKILL.md`.
- 2026-09-02: Task definitions created in `research/tasks/R001.md`–`R006.md`.
- 2026-09-02: Artifact dirs `research/R001/`–`R006/` created. Spawn helper at `research/spawn-wave1.sh` (fixed to lowercase names).
- 2026-09-02: 6 panes split (w4:pH,pJ,pK,pM,pN,pP) + 6 pi agents started with --model muse-spark-1.2-contributor-free. All prompted → WORKING.
- 2026-09-02: All 6 workers idle → artifacts verified (4 files each, 238-306 lines). Ledger → COMPLETE.
- 2026-09-02: R007 adversarial task created (research/tasks/R007.md), pane w4:pR, agent lace-r007 started with --model muse-spark-1.2-contributor-free → WORKING.
- 2026-09-02: R007 idle → artifacts verified (284 lines). Ledger → COMPLETE. Wave 1 + adversarial done — ready for synthesis.
- 2026-09-02: Synthesis `research/reports/01-research-synthesis.md` created (10 verdicts: Problem/Evidence/Gap/Opportunity/Multi-Agent EXPERIMENTAL/Herdr OPTIONAL INTEGRATION/Local IMPORTANT SECONDARY/Differentiation/Kill Criteria T1-T4). All 7 tasks COMPLETE, 28 artifacts + synthesis present.
- 2026-09-02: Validation phase bootstrapped — read 01-synthesis + ledger + skill; created tasks F01–F04 (`research/tasks/F01.md`–`F04.md`) + dirs `research/F01/`–`F04/`.
- 2026-09-02: Herdr workspace `LACE Validation` (w4) configured with 5 tabs (Main + F01-F04), 4 panes split (w4:pS,pT,pV,pW), 4 pi agents started with --model muse-spark-1.2-contributor-free and prompted → WORKING.
- 2026-09-02: All 4 validation workers idle → artifacts verified (F01 326 lines + raw, F02 415 lines + pilot repo/harness, F03 286 lines, F04 445 lines). Ledger → COMPLETE.
- 2026-09-02: Validation synthesis `research/reports/02-validation-synthesis.md` created (12 questions: problem validated narrowly, strongest pains = privacy/verification frequent + loops/hallucination/regression severe, harness-solvable wedge proven, verification pilot +20pp but CI overlaps → T1 NOT MET, multi-agent EXPERIMENTAL, Herdr OPTIONAL, standalone REJECTED → MCP/plugin extension better, wedge = verification gate + loop/progress/MCP trust as thin extension, explicit NOTs listed, 6 missing evidences, final decision PIVOT with kill fallback and reusable assets).

## Quality Checks
- Wave 1: Model compliance all 7 used `muse-spark-1.2-contributor-free` (argv verified). ✓ Artifact contract 4 files each. ✓ Citations with URLs/dates/quotes. ✓ Labels FACT/EVIDENCE/INFERENCE/HYPOTHESIS/OPINION. ✓ No invented stats — gaps as "No reliable evidence found." ✓
- Validation: Model compliance all 4 used `muse-spark-1.2-contributor-free` (herdr agent list). ✓ Each in own tab in same workspace `LACE Validation` (w4:t4 main + t6-t9 workers). ✓ Artifact contract 4 files each (+ experiment-design.md + pilot for F02). ✓ Workers did NOT spawn sub-workers. ✓ Citations + labels + missing evidence. ✓

## Cross-Task Contradictions & Gaps (Synthesis-level)
1. **Multi-agent value** — R001 frames persistent multi-agent as opening; R003 evidence says conditional win on prototypes, high cost, no SWE-bench A/B. Reconciliation: treat multi-agent as EXPERIMENTAL until A/B shows Pareto win. F02 pilot (+20pp at edge cost) does not resolve — n=5 insufficient, CI overlaps.
2. **Privacy weight** — R002 surfaces credential sprawl/MCP trust as blocker; R006 says hybrid ZDR/BYOK satisfies broader market, pure-local is niche. F01 corpus shows privacy/trust 21% most frequent + High severity but cross-repo proposals may inflate — reconciliation: IMPORTANT SECONDARY, not CORE, broader demand still unmeasured (no survey).
3. **Benchmark validity** — R005 shows SWE-bench needs filtering + harness confounding; F02 reproduces harness confounding (synthetic overestimates) and shows cost/latency guardrail matters — need Pareto scorecard on Verified n≥30.
4. **Herdr sufficiency** — R001 "only multiplexer-native" vs R007 "tmux+worktree may suffice" — F03 resolves: Herdr Material advantage on ergonomics/observability, but not on core isolation; LACE runtime would duplicate — OPTIONAL INTEGRATION, T2 untested.
5. **Wrapper moat** — R004 reuse table said composition is cheap; F04 proves it: MCP 250-350 LOC <1 week, kill standalone (T4 fails for standalone). Convergence across R004/R007/F04 — High confidence.
6. **Validation gaps still decision-critical** — No survey n>100, no SWE-bench Verified n≥30 with real billing, no HerdrDelta n≥20, no timed replication build — all pre-registered thresholds remain untested at scale.

## Reports
- `research/reports/01-research-synthesis.md` — 10-verdict synthesis (Wave 1 + adversarial)
- `research/reports/02-validation-synthesis.md` — 12-question validation synthesis (F01–F04 → PIVOT, verification-first harness as MCP/Claude-plugin + Herdr variant, T1-T4 gates) ✓


## Phase 2B.1 — Powered-30 Execution (2026-09-02)

| Task | Topic | Agent | Status | Artifacts | Result |
|------|-------|-------|--------|-----------|--------|
| Powered-30 | Verification-first A/B (n=30, balanced stratified) | Main Orchestrator | BLOCKED (INFRASTRUCTURE) | `research/experiment/scale/task-manifest.json` (hash c688611a, 30 stratified 2–3 per repo), `research/experiment/scale/analysis-plan.md` (frozen), `research/experiment/scale/preflight.json` (docker blocked), `research/experiment/scale/protocol-check.json` (PASS), `research/experiment/analysis/powered-validation-final.md` (22 sections) | Docker socket permission denied (root:docker, user in wheel not docker, sudo usermod requires password, sg not found, chmod 666 not used) — swebench eval verified --gold -i astropy__astropy-12907 → PermissionError 13 via docker.transport.unixconn — powered Docker per-task evaluation for 30 tasks not yet executed; shakedown + synthetic 2a-pilot proxy remain directional evidence; T1 INCONCLUSIVE — not PASS/FAIL |

### Preflight (2026-09-02T08:05:10Z)
- docker version 29.7.2 present but `docker ps` → permission denied, socket srw-rw---- root:docker, id wheel, groups wheel, not docker, swebench 5.0.2 + datasets 5.0.1 + pytest 9.1.1 ready, git 2.55.0, model muse-spark-1.2-contributor-free via opencode ready, task manifest hash c688611a, analysis-plan hash 174678be, protocol hash 589a93d1, disk / 18G avail, working tree clean, Herdr not part of this experiment

### Protocol Fairness (before powered run)
- baseline_prompt == candidate_initial_prompt true, baseline_model == candidate_model true (muse-spark-1.2-contributor-free), baseline_temperature == candidate_temperature true (0.2), baseline_tools == candidate_tools true, baseline_timeout == candidate_timeout true (120s), baseline_repo_commit == candidate_repo_commit true, task_manifest unchanged true — only intended difference verification/recovery bundle

### Next Step
Fix Docker via `sudo usermod -aG docker $USER` + fresh login/newgrp docker (verify docker ps), then execute `python3 research/experiment/harness.py --arm both --run-id powered-30` for 30 stratified tasks with native usage + Docker FAIL_TO_PASS/PASS_TO_PASS per task, then analyze via analysis-plan.md (Wilson + paired McNemar, median ratios, T1 gate).

## Agent Model
Every worker used `muse-spark-1.2-contributor-free`.

## Validation Workspace (Herdr)
- Workspace: `LACE Validation` (w4) — 5 tabs
  - Tab 1 `w4:t4` → Main Orchestrator (pi, working)
  - Tab 2 `w4:t6` → F01 Pain Prevalence (w4:pS, lace-f01, idle, muse-spark-1.2-contributor-free) ✓
  - Tab 3 `w4:t7` → F02 A-B Experiment (w4:pT, lace-f02, idle, muse-spark-1.2-contributor-free) ✓
  - Tab 4 `w4:t8` → F03 Herdr Teardown (w4:pV, lace-f03, idle, muse-spark-1.2-contributor-free) ✓
  - Tab 5 `w4:t9` → F04 Wrapper Moat (w4:pW, lace-f04, idle, muse-spark-1.2-contributor-free) ✓
- Verification: `herdr agent list` shows 4 × `muse-spark-1.2-contributor-free`, each in own tab in same workspace ✓
- Constraint: workers did NOT spawn sub-workers; main orchestrator owns delegation ✓

## Orchestrator Next Steps — COMPLETE
- Inspect F01–F04 artifacts (done ✓), identify contradictions / unsupported claims (done ✓), record in ledger (done ✓)
- Create `research/reports/02-validation-synthesis.md` answering 12 validation questions → GO/PIVOT/KILL (done ✓ — PIVOT)
- No PRD/architecture/TDD yet — gated behind T1-T4 at scale (see synthesis)
