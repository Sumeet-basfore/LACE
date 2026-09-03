# Git Repository Hygiene Audit

**Date:** 2026-09-03  
**Branch:** `main` (local `4788c38`, `origin/main` at `3fda07b`, **1 commit ahead**)  
**Remote:** `https://github.com/Sumeet-basfore/Lace.git`

---

## 1. Repository audit

| Metric | Before cleanup | After `git rm --cached` (staged) |
|--------|----------------|----------------------------------|
| Tracked files | 674 | **182** |
| Staged deletions | — | **492 files** (~569k lines) |
| Tracked raw/logs/muse-spark noise | ~492 paths | **0** |
| `.gitignore` | Broken/untracked (ignored `.cursorrules`) | **Replaced** with research-aware rules |

**FACT:** No `.gitignore` policy existed in the committed tree. Generated SWE-bench outputs, provider report JSON, transcripts, and per-arm `raw/` trees were committed starting in `3fda07b`.

**FACT:** Local HEAD is **one commit ahead** of `origin/main` (`4788c38` adds more `raw-final-one-task` artifacts not yet pushed).

---

## 2. Accidentally committed files

### Root `muse-spark-*.json` (41 files) — **Class D**

SWE-bench evaluator report copies (schema v2, `resolved_ids`, etc.). Example: `muse-spark-1.2-contributor-free.phase2d-pydata__xarray-3364.json`. **Not** provider transcripts; **generated exhaust**.

### `logs/run_evaluation/**` (202 files) — **Class D**

SWE-bench Docker evaluator logs: `run_instance.log`, `test_output.txt` (up to **~1.7 MB** each), `patch.diff`, `report.json`, `eval.sh`.

### `research/phase2d/raw*/**` (134+ files) — **Class C/D**

Includes `raw/`, `raw-contaminated-429/`, `raw-final-one-task/`, `raw-one-task-strategy-validation/`, `raw-smoke-flask-4992/`: `result.json`, `transcript_*.txt`, `*.eval.json`, `*.log`, patches.

### `research/experiment/runs/**` + `research/experiment/scale/runs/**` — **Class C/D**

Pilot and powered-30 per-task transcripts, logs, eval JSON.

### `__pycache__/*.pyc` (3 files) — **Class D**

### Local-only (never tracked, correctly untracked)

- `research/phase2d/ablation1/` (manifest, protocol, contaminated archives)
- `research/phase2d/raw-batch1/`
- `research/reports/05–12`, `07-phase2d-batch1-results.md`
- `Django-*.whl`

---

## 3. Secret scan result

**NOT FOUND** in sampled tracked artifacts (200+ paths including muse-spark JSON, transcripts, eval logs).

Patterns checked: OpenAI `sk-`, GitHub `ghp_`, HF `hf_`, AWS `AKIA`, PEM private keys, bearer tokens.

**DECISION:** No credential rotation required based on scan. **NEEDS MANUAL REVIEW** only for `research/F01/raw/*.json` (large market corpus) if published externally — not scanned exhaustively.

---

## 4. Canonical vs generated classification

| Class | Label | Examples |
|-------|-------|----------|
| **A** | KEEP / TRACK | `harness.py`, tests, `manifest.json`, `protocol.md`, `metrics.md`, `fixtures/`, analysis `*.md`, `research/reports/*.md`, `context/`, `docs/`, `AGENTS.md`, `.cursorrules`, `patch-application-semantics-results.json`, `research/experiment/scale/aggregate.json`, `preflight*.json`, F01/F02 reports |
| **B** | KEEP BUT IGNORE FUTURE | `result.json` inside `raw/` trees (local forensic), `reports/results.json` aggregates when generated |
| **C** | LOCAL RAW ARCHIVE | All `raw*/`, `raw-contaminated-provider/`, `ablation1/raw-contaminated-*`, transcripts, attempt logs |
| **D** | SAFE TO REMOVE FROM TRACKING | `logs/`, `/muse-spark-*.json`, `*.eval.json`, `transcript_*.txt`, `__pycache__`, `runs/` |
| **E** | MANUAL REVIEW | `research/raw/R006/*.html` (competitive intel snapshots, large but cited in research), `research/F01/raw/*.json` (market corpus) |

**INFERENCE:** Canonical reports (`07-phase2d-batch1-results.md`, etc.) cite **methodology and aggregates**, not committed muse-spark JSON paths. Untracking raw artifacts does not break report provenance.

---

## 5. Proposed ignore rules (applied in `.gitignore`)

```gitignore
logs/
/muse-spark-*.json
research/**/raw/
research/**/raw-*/
research/**/runs/
research/**/run-state*/
research/**/logs/
research/**/transcript_*.txt
research/**/*.eval.json
__pycache__/
*.whl
research/F02/pilot/repo/
```

**Explicitly NOT ignored:** `manifest.json`, `batch*-manifest.json`, `protocol.md`, `protocol.hash`, `metrics.md`, `experiment-metadata.json`, `research/reports/`, structured analysis JSON under `analysis/`.

---

## 6. Files untracked from Git (staged, not deleted locally)

| Category | Count |
|----------|-------|
| `logs/run_evaluation/**` | 202 |
| `/muse-spark-*.json` | 41 |
| `research/phase2d/raw*/**` | ~134 |
| `research/experiment/runs/**` | 24 |
| `research/experiment/scale/runs/**` | ~190 |
| `__pycache__/**` | 3 |
| **Total staged removals** | **492** |

Plus **`.gitignore`** staged (new).

---

## 7. Files intentionally preserved locally

**FACT:** Verified present after `git rm --cached`:

- `logs/run_evaluation/phase2d-pydata__xarray-3364/run.json`
- `muse-spark-1.2-contributor-free.phase2d-pydata__xarray-3364.json`
- `research/phase2d/ablation1/raw-contaminated-provider/` (+ smoke2 if present)
- `research/phase2d/manifest.json` (unchanged)
- All `raw-batch1/`, `ablation1/` forensic trees

**ignored ≠ deleted**

---

## 8. Git history findings

| Question | Answer |
|----------|--------|
| First commit with `muse-spark*.json` | `3fda07b` (2026-09-03) — `phase2d: classify provider failures correctly` |
| In current HEAD? | **Yes** (until staged removal committed) |
| On `origin/main`? | **Yes** — 66 muse-spark JSON + 52 transcripts on remote |
| Approx bloat | **~29 MB** tracked raw/logs; largest blobs **~1.7 MB** `test_output.txt` files |
| Sensitive content? | **NOT FOUND** — noisy evaluator output only |

Local unpushed commit `4788c38` added additional `raw-final-one-task` smoke artifacts (also untracked by this cleanup).

---

## 9. History rewrite recommendation

**DECISION: NOT REQUIRED** for security (no secrets found).

**OPTIONAL** for GitHub cleanliness — historical blobs remain in `origin/main` until rewritten. **Recommended first step:** commit staged untracking + `.gitignore`, push normally. This stops future noise; does not shrink remote history.

---

## 10. Future history rewrite commands (DO NOT RUN without explicit approval)

```bash
# Option A: git filter-repo (preferred)
pip install git-filter-repo
git filter-repo --path-glob 'muse-spark-*.json' --path logs/ --path-glob 'research/**/raw/**' --force

# Option B: BFG
bfg --delete-files '{muse-spark-*.json,*.eval.json,transcript_*.txt}' .
bfg --delete-folders '{logs,raw,raw-contaminated-429,runs}' .

# After either: force-push requires explicit team approval
# git push --force-with-lease origin main
```

**WARNING:** Rewriting rewrites all contributor history. Only pursue if repo size/public noise justifies it.

---

## 11. Final repository status (post-cleanup, pre-commit)

```
Tracked files:     182 (canonical research + code)
Staged deletions:  492 generated artifacts
Staged addition:   .gitignore

git ls-files | grep -Ei 'muse-spark|transcript|\.eval\.json|\.log'
→ (none)

Frozen files unchanged:
  research/phase2d/manifest.json
  research/phase2d/protocol.md
  research/phase2d/ablation1/manifest.json (untracked, untouched)
```

**Uncommitted working tree** (intentionally not staged): harness improvements, ablation1 implementation, batch1 results, new reports — separate from hygiene commit.

---

## 12. Recommended next action

1. **Review staged hygiene commit:**
   ```bash
   git diff --cached --stat
   git status --short
   ```
2. **Commit hygiene only** (when ready):
   ```bash
   git commit -m "$(cat <<'EOF'
   chore: untrack generated experiment artifacts and add .gitignore

   Stop tracking SWE-bench logs, muse-spark report copies, raw transcripts,
   and per-run eval outputs. Preserve all files locally for forensic review.
   EOF
   )"
   ```
3. **Push** `main` — removes generated files from GitHub tip; history still contains old blobs.
4. **Optional later:** `git filter-repo` if remote history size matters.
5. **Before Ablation 1 smoke:** clear `research/phase2d/ablation1/raw/{baseline,current,minimal}/` resume checkpoints (see prior resume diagnosis); contaminated archives stay local under `raw-contaminated-provider*`.

---

**EVIDENCE:** Safe current-tree cleanup complete. No secrets found. No history rewrite performed. Provenance preserved locally.
