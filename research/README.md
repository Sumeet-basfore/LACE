# LACE Research Workspace

Bootstrapped from zero. See `ledger.md` for status.

## Structure
- `tasks/` — 6 bounded task definitions (R001–R006)
- `R001/`–`R006/` — per-task artifact dirs (report.md, evidence.md, findings.md, open-questions.md)
- `raw/` — raw captures
- `evidence/` — curated evidence (cross-task)
- `reports/` — synthesis reports (e.g., 01-research-synthesis.md after Wave 1)
- `ledger.md` — task lifecycle log
- `spawn-wave1.sh` — spawns 6 workers via Herdr with model muse-spark-1.2-contributor-free

## Skill
`skills/research-agent/SKILL.md` — reusable instructions for every worker.

## Spawning Wave 1
```bash
./research/spawn-wave1.sh
herdr agent list
herdr pane list --workspace "$HERDR_WORKSPACE_ID"
```

Each worker:
- model = `muse-spark-1.2-contributor-free`
- reads its `research/tasks/R00X.md` + `skills/research-agent/SKILL.md`
- writes 4 artifacts to `research/R00X/`
- terminal summary only (not full report)

## After Wave 1
Orchestrator inspects artifacts, updates ledger, identifies gaps/contradictions, spawns adversarial task, then synthesizes `research/reports/01-research-synthesis.md`.
