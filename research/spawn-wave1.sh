#!/bin/bash
set -e
MODEL="muse-spark-1.2-contributor-free"
TASKS=("R001:Competitive Landscape" "R002:User Pain & Unmet Needs" "R003:Multi-Agent Coding Evidence" "R004:Coding-Agent Architecture & Techniques" "R005:Benchmarks & Evaluation" "R006:Privacy, Local Models & Enterprise")
for entry in "${TASKS[@]}"; do
  id="${entry%%:*}"
  lid=$(echo "$id" | tr '[:upper:]' '[:lower:]')
  topic="${entry#*:}"
  echo "=== Spawning $id — $topic ==="
  resp=$(herdr pane split --current --direction right --cwd "$PWD" --no-focus)
  pane=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['pane']['pane_id'])")
  echo "  pane: $pane"
  herdr agent start "lace-$lid" --kind pi --pane "$pane" -- --model "$MODEL" 2>&1 | head -n 20
  sleep 2
  prompt="You are LACE research worker $id. Read skills/research-agent/SKILL.md and research/tasks/$id.md. Model MUST be $MODEL. Produce artifacts in research/$id/: report.md, evidence.md, findings.md, open-questions.md. Work independently, cite sources, distinguish FACT/EVIDENCE/INFERENCE/HYPOTHESIS/OPINION, report uncertainty. Do not spawn additional agents. When done, summarize with artifact paths."
  herdr agent prompt "lace-$lid" "$prompt" --wait --timeout 30000 2>&1 | head -n 20 || true
done
echo "All 6 workers spawned. Check: herdr agent list && herdr pane list"
