# A01 — Failure Autopsy (powered-30 partial, n=11 baseline / 10 candidate)

**Date:** 2026-09-02 · **Scope:** 11 baseline + 10 candidate real SWE-bench Lite tasks (partial exploratory, not powered) · **Model:** muse-spark-1.2-contributor-free both arms · **Dataset:** lite (SWE-bench/SWE-bench_Lite, 300 test) · **Artifacts:** `research/experiment/scale/runs/powered-30/{baseline,candidate}/`

## Method
For each completed pair, compared baseline result, candidate initial + retries, verification detection (swebench FAIL_TO_PASS/PASS_TO_PASS via Docker, plus patch-apply), feedback quality (eval log tail ≤800 chars), retry outcome, root cause. Distinguish verification/model/tool/env.

## Per-Task Table

| task | baseline | candidate | initial candidate failure | verification detection | feedback quality | retry result | root cause |
|---|---|---|---|---|---|---|---|
| astropy__astropy-12907 | PASS (resolved, 1 patch) | PASS a1 | none — initial PASS | PASS (detected success, no retry) | n/a | n/a | success — separable.py _cstack 1→right, both arms correct |
| astropy__astropy-14182 | FAIL (unresolved, wrong RST header) | FAIL a3 (3 attempts, all unresolved) | wrong RST change (cosmetic + missing start_line) | correctly detected unresolved each attempt | low — generic swebench log "0 resolved, 1 unresolved" with no failing test name in 800-char tail (log truncated, no FAIL_TO_PASS excerpt) | a2/a3 produced different cosmetic RST diffs, still unresolved | model failure — mis-identified fix location (RST header vs actual bug is data row parsing) |
| django__django-10914 | PASS | PASS a1 | none | PASS | n/a | n/a | success — global_settings FILE_UPLOAD_PERMISSIONS None→0o644, both arms |
| django__django-10924 | FAIL (patch apply failed, malformed) | FAIL a3 (all patch apply failed) | malformed FilePathField patch (truncated hunk) | correctly detected "Patch Apply Failed" | low — feedback = "patch unexpectedly ends in middle of line / Hunk FAILED" (no test signal, just apply error) | a2/a3 also malformed (different file, still truncated) | tool failure — model outputs truncated diff (exceeds context or bad formatting), verification correctly flags apply fail but feedback not actionable (doesn't tell model to emit complete hunk) |
| django__django-11001 | FAIL (malformed compiler.py patch) | FAIL a3 (all malformed) | malformed ordering_parts regex | correctly detected patch malformed | low — same apply error, no test feedback | retries also malformed | tool/model — truncated patch, same as 10924 |
| matplotlib__matplotlib-18869 | FAIL (unresolved, wrong file) | FAIL a3 (all unresolved) | wrong file __init__.py __version_info__ (hallucinated) | correctly detected unresolved | low — generic unresolved, no failing test name, no traceback | a2/a3 hallucinated other files | model failure — hallucinated dependency, verification can't correct without targeted signal |
| matplotlib__matplotlib-22711 | FAIL (empty patch, pi TIMEOUT 300s) | FAIL a3 (all timeout/empty, 918s) | pi timeout → empty patch | correctly detected empty patch (0 resolved, 1 empty) | none — empty patch has no test output to feed back, feedback = eval log "empty patch" | a2/a3 also timeout/empty (same prompt with feedback still large, pi still times out) | environment/model — prompt too large (full widget repro with code), pi times out 300s, verification correctly flags empty but retry loop wastes 3×300s+3×eval |
| matplotlib__matplotlib-22835 | PASS | PASS a1 | none | PASS | n/a | n/a | success — artist.py BoundaryNorm (both arms correct) |
| mwaskom__seaborn-2848 | PASS | PASS a1 | none | PASS | n/a | n/a | success — _oldcore.py hue_order norm fix |
| mwaskom__seaborn-3010 | PASS | PASS a1 | none | PASS | n/a | n/a | success — regression.py dropna fix |
| pallets__flask-4045 | FAIL (empty, pi timeout? eval shows empty patch) | — (candidate not yet, run killed mid-flask) | empty patch | correctly detected empty | — | — | timeout/empty |

**Counts (n=10 paired):** baseline 5/10 PASS (50%), candidate 5/10 PASS (50%) — delta 0pp at this partial (Wilson 50% CI 23.7–76.3% both, overlapping). No recovery (0/5 failed tasks recovered).

## Detection vs Recovery

- **Verification detection: 100% correct** where evaluated — every FAIL (unresolved, patch apply failed, empty) was flagged by swebench (resolved false, errors/empty count). No verification false positive/negative.
- **Recovery: 0%** — 5 tasks that failed baseline also failed candidate after 3 attempts. Retry loop produced new patches but none resolved.

## Feedback Quality

- For **patch-apply failures** (10924, 11001): feedback = `patch unexpectedly ends in middle of line` — tells model patch was truncated but not *why* or *how to fix* (e.g., "emit complete hunk with context lines, don't truncate"). Model retried with different truncation, still failed.
- For **unresolved** (14182, 18869): feedback = generic sweep `0 resolved, 1 unresolved` without FAIL_TO_PASS test names or tracebacks in the 800-char tail (swebench log is high-level, not pytest traceback). Model lacked failing test name, assertion, or file.
- For **empty/timeout** (22711): feedback = `empty patch` — model retried same oversized prompt, timed out again.

**Conclusion:** verification *detected* correctly but *feedback* was not actionable for real tasks. Synthetic pilot's `parse_failures` tail worked because hidden tests printed `PASS test_T03` deterministically; real swebench logs are less parseable.

## Root Cause Taxonomy

- Model failure: 3 (14182, 18869, plus 10914/12907 successes show model *can* succeed when fix is small)
- Tool/patch failure: 2 (10924, 11001 truncated diffs)
- Environment/timeout: 1 (22711 pi 300s)
- Verification failure: 0 (detection correct)
- No infra (docker pull/build ok, 188s–325s eval)

## What verification could have caught cheaper

- Patch malformed / empty could be caught by `git apply --check` locally (<0.1s) without Docker (18869 eval took 234s, 22835 took 325s).
- Unresolved could be triaged by running only FAIL_TO_PASS (1–2 tests) not full PASS_TO_PASS (13–179 tests) — e.g., 12907 has 2 FAIL_TO_PASS vs 13 PASS_TO_PASS; running full suite every attempt wastes 5–10× time.

## Evidence Preservation

All transcripts and `*.eval.json`/`*.log` under `runs/powered-30/` retained. Partial run is exploratory, not powered.

