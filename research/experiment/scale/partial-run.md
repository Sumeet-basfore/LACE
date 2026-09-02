# Partial Run — powered-30 (incomplete exploratory evidence)

**Status:** incomplete exploratory evidence, not powered benchmark

**Date:** 2026-09-02 · **Run ID:** powered-30 · **Model:** muse-spark-1.2-contributor-free (opencode) · **Dataset:** lite (SWE-bench/SWE-bench_Lite, 300 test, version 6ec7bb89b9342f664a54a6e0a6ea6501d3437cc2) · **Manifest:** research/experiment/scale/task-manifest.json (hash c688611a1e7c8be6, 30 stratified) · **Harness:** research/experiment/scale/powered_harness.py (pi -p --mode json + swebench Docker)

## Tasks completed

- **Baseline:** 11/30 (astropy 12907 PASS, 14182 FAIL, django 10914 PASS, 10924 FAIL patch-apply, 11001 FAIL malformed, matplotlib 18869 FAIL hallucinated, 22711 FAIL empty/timeout, 22835 PASS, seaborn 2848 PASS, 3010 PASS, flask 4045 FAIL empty — see result.json)
- **Candidate:** 10/30 (same 10 minus flask 4045 incomplete due to harness kill mid-task; all 10 paired where complete)
- **Paired n=10:** baseline 5/10 PASS (50%), candidate 5/10 PASS (50%), delta 0.0pp, Wilson 23.7–76.3% both overlapping
- **Median tokens:** baseline 189706, candidate 563434, ratio 2.97× (exceeds 2×)
- **Median latency:** baseline 236.68s, candidate 491.93s, ratio 2.08× (exceeds 2×)
- **Recovery:** 0/5 failed tasks recovered (candidate 3 attempts each, all still FAIL)
- **Infra:** 0, but 1 pi TimeoutExpired (22711 baseline, 300s) handled as empty patch

## Why execution was stopped

- Powered run became too expensive/slow (57% of tasks retried 3×, each pi 300s + Docker 32–325s → 900s per failing candidate task, estimated 10–12h for 30 tasks). Strategy change to Phase 2C autopsy before continuing. Harness was killed mid-flask-4045 (no candidate result for that task). No data deleted.

## No product conclusion

- This is exploratory partial evidence, not a product validation result. Do not claim verification works or fails, or that product is good/bad. CI very wide at n=10, interim delta 0pp does not imply powered 30 will be 0pp. Current implementation is expensive and has not yet demonstrated recovery on real tasks — need to understand failure mechanism before deciding verification value (see 03-phase2c-synthesis.md).

## Artifacts preserved

- `research/experiment/scale/runs/powered-30/baseline/result.json` (11)
- `research/experiment/scale/runs/powered-30/candidate/result.json` (10)
- `research/experiment/scale/runs/powered-30/{baseline,candidate}/transcript_*.txt` (11+10)
- `research/experiment/scale/runs/powered-30/{baseline,candidate}/logs/*.log` and `*.eval.json` (swebench reports)
- `research/experiment/scale/results/powered-30.json` (aggregate, partial)
- `/tmp/powered_run.log` (harness stdout, timeout traces)
- All frozen artifacts unchanged: task-manifest.json, analysis-plan.md, protocol.md

## Next

- Phase 2C autopsy (A01–A04) and synthesis (03-phase2c-synthesis.md) select LAYERED strategy; next is small 5–10 task design experiment comparing baseline vs current vs layered, not another n=30.

