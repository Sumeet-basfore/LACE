# Phase 2D — Patch Application Semantics Experiment

**Instance:** `pallets__flask-4992`  
**Patch source:** Baseline logged bytes from `raw-one-task-strategy-validation/baseline/transcript_pallets__flask-4992.txt` (byte-identical to Layered attempt 1)  
**Testbed:** `swebench/sweb.eval.x86_64.pallets_1776_flask-4992:latest` (`/testbed`, base commit `4c288bc97ea371817199908d0d9b12de9dae327e`)  
**Experiment script:** `research/phase2d/scripts/patch_application_semantics_experiment.py`  
**Raw results:** `research/phase2d/analysis/patch-application-semantics-results.json`

No model calls. No SWE-bench full eval re-run. No harness changes.

---

## FACT

### Patch inputs

| Variant | SHA-256 | Bytes | Trailing `\n` |
|---------|---------|-------|---------------|
| **Original** (artifact bytes) | `3a3940fc557caa6a8cc50c2b76b22cab63100b3bb11939d2d59a8ec6dc6e4d2d` | 1678 | **no** |
| **+newline** (copy only) | `fbfddd47be0bdc715df48c4894a778d52d3e0dadee5dd3117200a01cae3c9b77` | 1679 | yes |
| **Gold reference** (fixture, SWE-bench chain applied) | `db912cc1331807c9b0715766eb45a5fac8c4036a99dd54c9ce998b675d0d8697` | 1664 | yes |

### Tree hashes (`git hash-object src/flask/config.py`)

| State | SHA-1 |
|-------|-------|
| Pristine testbed (no apply) | `d4fc310fe3e46c9828e7337e91725686b5b94abf` |
| Gold-applied reference | `5e48be3323e577fa711bdd1b1b27bdf7730534be` |

### Command outcomes — **original patch** (exact artifact bytes)

| # | Command | Exit | Applied | stderr (key) | Tree matches gold? |
|---|---------|------|---------|--------------|-------------------|
| 1 | `git apply --check /tmp/patch` | **128** | no | `corrupt patch at line 42` | no |
| 2 | `git apply --verbose /tmp/patch` | **128** | no | `corrupt patch at line 42` | no |
| 3 | `git apply --verbose --3way /tmp/patch` | **128** | no | `corrupt patch at line 42` | no |
| 4 | `git apply --verbose --reject /tmp/patch` | **128** | no | `corrupt patch at line 42` | no |
| 5 | `patch --batch --forward --fuzz=5 -p1 -i /tmp/patch` | **0** | **yes** | *(empty)* | **yes** |

**`patch` stdout (original):**
```
patching file src/flask/config.py
patch unexpectedly ends in middle of line
Hunk #3 succeeded at 255 with fuzz 1.
```

### Command outcomes — **+newline patch** (one `\n` appended)

| # | Command | Exit | Applied to tree | Tree matches gold? |
|---|---------|------|-----------------|-------------------|
| 1 | `git apply --check /tmp/patch` | **0** | no *(check only)* | no *(tree unchanged)* |
| 2 | `git apply --verbose /tmp/patch` | **0** | **yes** | **yes** |
| 3 | `git apply --verbose --3way /tmp/patch` | **0** | **yes** | **yes** |
| 4 | `git apply --verbose --reject /tmp/patch` | **0** | **yes** | **yes** |
| 5 | `patch --batch --forward --fuzz=5 -p1 -i /tmp/patch` | **0** | **yes** | **yes** |

**`git apply --check` with newline:** exit 0, stderr empty — patch is **valid** under strict git, but tree is not modified (check-only semantics).

### Answers A–F

| Q | Result |
|---|--------|
| **A. Which accept original?** | **Only** `patch --fuzz=5`. All `git apply*` variants fail. |
| **B. Which matches SWE-bench?** | **`patch --fuzz=5` on original** — only method producing gold tree hash without normalization. Matches SWE-bench’s 4th apply strategy (after three failed `git apply` attempts). |
| **C. EOF newline fixes `--check`?** | **Yes.** `git apply --check` exit 0 on +newline copy; all `git apply` modes then apply cleanly. |
| **D. Tree differences between methods?** | Failed git attempts: pristine tree (`d4fc310…`). Successful applies (original `patch` or any +newline apply): gold tree (`5e48be33…`). **No semantic difference** among successful end states — same `config.py` blob hash. |
| **E. Gate to predict evaluator acceptance?** | Mirror SWE-bench apply chain **or** normalize EOF + `git apply --check` **or** use `patch --fuzz=5` alone. |
| **F. Cheap gate without rejecting evaluator-valid patches?** | **Yes:** (1) append trailing newline if missing, then `git apply --check`; or (2) run SWE-bench’s apply chain until first success (stop before tests). Raw `git apply --check` on unnormalized bytes is **not** sufficient. |

---

## EVIDENCE

### Reproduces Layered apply-check failure

Original + `git apply --check` → exit **128**, stderr `error: corrupt patch at line 42` — identical to Layered log `pallets__flask-4992.a1.apply_check.log`.

### Reproduces SWE-bench apply path

SWE-bench harness (`GIT_APPLY_CMDS` in `run_evaluation.py`):

1. `git apply --verbose` → fails on original (corrupt line 42)
2. `git apply --verbose --3way` → fails
3. `git apply --verbose --reject` → fails
4. `patch --batch --forward --fuzz=5 -p1 -i` → **succeeds**, warning `patch unexpectedly ends in middle of line`, hunk #3 with fuzz 1

Steps 1–3 never modify the tree; step 4 produces the same `config.py` hash as gold reference.

### Normalization experiment

Appending a single `\n` converts a **git-rejected** patch into one that passes **all** git apply modes cleanly (`Applied patch src/flask/config.py cleanly.`).

### Resulting diffs converge

All successful-apply cases share `tree_hash = 5e48be3323e577fa711bdd1b1b27bdf7730534be`. Git diff content is identical across `original__patch_fuzz5` and `plus_newline__git_apply_verbose` (toml→tomllib, `text` parameter, binary/text open mode).

### Baseline SWE-bench `resolved=true` consistency

Baseline fresh eval reported `resolved=true` on these same bytes. Experiment shows those bytes **do** reach a gold-equivalent tree via SWE-bench’s `patch --fuzz=5` fallback — not via git apply.

---

## INFERENCE

1. **Root disagreement is not patch-content divergence** between Baseline and Layered — it is **apply-tool semantics**.
2. **Git treats a patch file with no final newline as corrupt** (`corrupt patch at line N` where N is the last line). GNU **`patch` tolerates it** and applies with fuzz.
3. SWE-bench **does not use `git apply --check`**; it tries git apply (apply, not check), then falls through to **`patch --fuzz=5`**, which accepts the model output.
4. Layered **`git apply --check` on raw bytes** tests a **stricter condition** than SWE-bench full eval — it rejects patches SWE-bench would apply at step 4.
5. **Normalization (trailing newline) aligns git with evaluator** for this patch — likely a cheap, general pre-check.

---

## DESIGN IMPLICATION

### Recommended LACE pre-test gate (evaluator-compatible, still cheap)

**Option A — Normalize + strict git (preferred for simplicity):**
```
patch' = patch if patch.endswith('\n') else patch + '\n'
git apply --check /tmp/patch   # in testbed
```
- Predicts git-applyable state; matches +newline experiment.
- May still reject patches only `patch --fuzz=5` would accept *(not observed on this instance once normalized)*.

**Option B — SWE-bench apply chain (strongest predictor):**
Run the same 4-command chain as SWE-bench; pass if **any** succeeds (optionally verify with `git apply --check --reverse` or tree diff non-empty). Reset tree between Layered stages.

**Option C — `patch --fuzz=5` only:**
Matches step 4 exactly; weakest git hygiene but highest evaluator fidelity for malformed EOF cases.

**Not recommended:** raw `git apply --check` on unnormalized model output.

### Retain cheap gate?

**Yes**, but gate must be **evaluator-aligned**, not raw strict git on artifact bytes. Minimum fix: **EOF normalization** before apply-check.

---

## UNRESOLVED

- Whether **every** SWE-bench instance falls through to `patch --fuzz=5` on Baseline/Current patches, or only those with EOF/git-parse issues.
- Whether **normalize + `git apply --check`** rejects any patch that SWE-bench would still accept via fuzz-only path (no counterexample on this task).
- Full **FAIL_TO_PASS pytest** after `patch --fuzz=5` not re-run in this experiment’s JSON harness (Baseline already showed `resolved=true`; tree hash equivalence is the proxy used here).

---

## DECISION

| Question | Decision |
|----------|----------|
| **`git apply --check` on raw bytes acceptable?** | **No** — proven false negative vs SWE-bench on `pallets__flask-4992`. |
| **Replace with what?** | **Normalize trailing newline, then `git apply --check`** as default cheap gate; **or** mirror SWE-bench’s 4-step apply chain if maximum fidelity is required. |
| **Trust current Layered apply-check gate?** | **No** for strategy validation — it blocks evaluator-valid patches. |
| **Harness change now?** | **Deferred** per instructions — report only; proposed change is normalization + apply-check or SWE-bench chain, not strategy logic. |

---

## Summary table (original artifact bytes)

```
git apply --check   → FAIL (128, corrupt line 42)
git apply           → FAIL (128, corrupt line 42)
git apply --3way    → FAIL (128, corrupt line 42)
git apply --reject  → FAIL (128, corrupt line 42)
patch --fuzz=5      → PASS (0, gold tree)  ← SWE-bench step 4

+ one trailing newline:
git apply --check   → PASS (0, valid; no tree change)
git apply*          → PASS (0, gold tree)
patch --fuzz=5      → PASS (0, gold tree)
```

STOP.
