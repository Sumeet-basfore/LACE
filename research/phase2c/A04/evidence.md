# A04 Evidence

- F04 thin reproduction: MCP 250–350 LOC, Claude plugin <100 LOC hook, Herdr 150–200 LOC — single dev <1 week (inspected `commandcode.integration` template) — shows "run tests + retry" is trivial.
- R001 competitive landscape: 12/12 products live, each covers provider-agnostic, local, verification, persistence, open — gap is integration, not capability.
- R004: ReAct, MCP, git worktree, ripgrep, JSONL, containers are mature primitives — directive "Do not build custom bus/parser/vector DB".
- A01/A02: current verification adds 2.97× tokens, 2.08× latency, 0/5 recovery — not differentiated.
- R005: swebench leaderboards ignore cost/regression/reliability/human — Pareto scorecard is missing in market.
- Existing agent behavior: `pi` transcript shows `bash` tool `grep -rn "separability_matrix"` and `gh pr view` — agents already do verification via bash.

