# Phase 2D Batch 1 — Frozen setup

**Date:** 2026-09-03  
**Manifest:** `research/phase2d/batch1-manifest.json`  
**SHA-256:** `1e59b390486591347440bfabdf6684b2bc6477c96fab2e6f1657fe235f237d73`  
**Short hash:** `1e59b39048659134`

## FACT

- Canonical `research/phase2d/manifest.json` was **not** modified.
- Batch 1 uses 5 **new** Lite tasks, same set for baseline / current / layered.
- Model: `muse-spark-1.2-contributor-free` · Provider: `opencode`
- Output: `research/phase2d/raw-batch1/` (fresh)
- Selection: lexicographically smallest unused instance per repo after excluding Phase 2B/2C executed tasks, contaminated Phase 2D 7-task set, and smoke task `pallets__flask-4992`; then the 5 lexicographically smallest of those picks.

## Tasks (frozen order)

1. `astropy__astropy-14365`
2. `django__django-11019`
3. `matplotlib__matplotlib-23299`
4. `mwaskom__seaborn-3190`
5. `pallets__flask-5063`

## Execution

Sequential. Integrity gate after tasks 1–2 before continuing 3–5.
