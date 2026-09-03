# Phase 2D — Verification Disagreement Investigation

**Instance:** `pallets__flask-4992`  
**Artifacts:** `research/phase2d/raw-one-task-strategy-validation/` only  
**Method:** Read-only transcript/log analysis + harness code-path trace (no SWE-bench, no model, no Docker re-runs)

Diagnostic helper: `research/phase2d/scripts/compare_validation_patches.py`

---

## FACT

### Observed outcomes (from `results.json` / per-arm `result.json`)

| Arm | resolved | failure_class | evaluation_fresh | Full SWE-bench eval |
|-----|----------|---------------|------------------|---------------------|
| Baseline | `true` | `NONE` | `true` | yes |
| Current | `true` | `NONE` | `true` | yes |
| Layered | `false` | `MODEL_OUTPUT_INVALID` | `false` (no full eval) | no — stopped at apply-check |

### Patch checksums (logged `PATCH:` / `ATTEMPT N PATCH:` bytes)

| Artifact | SHA-256 | Bytes | Lines | Trailing `\n` |
|----------|---------|-------|-------|---------------|
| Baseline extracted patch | `3a3940fc557caa6a8cc50c2b76b22cab63100b3bb11939d2d59a8ec6dc6e4d2d` | 1678 | 42 | **no** |
| Current attempt 1 patch | `4bb36562a6fe8754a6fe117be8ebabeab641165402ced6f69e62e8794b585c37` | 1689 | 42 | **no** |
| Layered attempt 1 patch | `3a3940fc557caa6a8cc50c2b76b22cab63100b3bb11939d2d59a8ec6dc6e4d2d` | 1678 | 42 | **no** |
| Layered attempt 2 patch | `abc68b4de69afdd938a754025c35913d14f1bac2e244edbac18f570e004baaf7` | 1719 | 43 | **no** |
| Layered attempt 3 patch | `4bb36562a6fe8754a6fe117be8ebabeab641165402ced6f69e62e8794b585c37` | 1689 | 42 | **no** |

Reference (repo fixture, not from this run): `fixtures/pallets__flask-4992-gold.patch` — SHA-256 `8f0e0ce…` (1664 bytes, **has** trailing `\n`).

### A. Are Baseline and Layered patch bytes identical?

- **Baseline vs Layered attempt 1:** **YES — byte-identical** (same SHA-256).
- **Baseline vs Layered attempt 2:** **NO** — attempt 2 adds `index d4fc310..cc05465 100644` after `diff --git` (+41 bytes vs baseline).
- **Baseline vs Layered attempt 3:** **NO** — attempt 3 matches **Current** patch, not Baseline.
- **Baseline vs Current:** **NO** — one-line docstring wording difference (line 27).

### B. Headers / hunks / trailing lines

**Shared structure (all arms):** 3 hunks on `src/flask/config.py`; same line-number headers:

```
@@ -234,6 +234,7 @@ …
@@ -244,8 +245,8 @@ …
@@ -254,14 +255,18 @@ …
```

**Header annotation difference vs gold fixture:** model patches use `class Config(dict):` in `@@` suffix lines; gold fixture uses `def from_file(`. **Body lines are otherwise the same as gold** except Current/Layered-a3 docstring wording.

**Layered attempt 2 only:** extra git `index …` line (line 2).

**Current / Layered-a3 vs Baseline / Layered-a1** (single hunk-body diff):

```diff
-        :param text: Open the file in text or binary mode.
+        :param text: Whether to open the file in text or binary mode.
```

### C. Truncation location

**Not hunk-truncated.** Third-hunk audit on Baseline patch:

- Header `@@ -254,14 +255,18 @@` expects 14 old / 18 new lines.
- Parsed body delivers **14 old / 18 new** exactly.
- Last line (42): `             if silent and e.errno in (errno.ENOENT, errno.EISDIR):`

The earlier “~42-line truncation” narrative was misleading: the unified diff **hunk arithmetic is complete**, but the patch file **ends without a final newline** (`endswith('\n') == False`). Git reports this as **`corrupt patch at line 42`** (last line).

### D. SWE-bench vs locally logged patch

**Pred JSONL:** **not recoverable** — `full_eval()` wrote to a temp work dir removed after eval (`shutil.rmtree(work_dir)`). No `pred.jsonl` in artifact tree.

**Code-path evidence (harness, not re-run):** the same in-memory `patch` string is passed to:

1. `write_transcript(..., patch, ...)` → logged `PATCH:` block
2. `full_eval(iid, patch, ...)` → `model_patch` in `pred.jsonl`

`write_transcript` only truncates display at 10 000 chars; these patches are 1678–1719 bytes, so **logged `PATCH:` equals the string sent to SWE-bench**.

**SWE-bench aggregate reports (artifact):**

- `baseline/logs/pallets__flask-4992.eval.json` — `resolved_ids: ["pallets__flask-4992"]`, `completed_instances: 1`
- `current/logs/pallets__flask-4992.a1.eval.json` — same

**Eval stdout logs** show fresh runs (`Running 1 instances...`, not cache skip). Per-instance SWE-bench logs (`logs/run_evaluation/.../run_instance.log`, `patch.diff`) were **not retained** (temp cwd deleted).

### E. Testbed base commit

From `manifest-smoke.json` and all three `result.json` records:

```
base_commit: 4c288bc97ea371817199908d0d9b12de9dae327e
repo: pallets/flask
```

All arms used the same instance id and harness `get_image_for_instance(iid)` path. **No artifact suggests different commits between arms.**

### F. Why `git apply --check` failed

**Layered apply-check logs (artifact):**

| Attempt | Log file | stderr |
|---------|----------|--------|
| 1 | `layered/logs/pallets__flask-4992.a1.apply_check.log` | `error: corrupt patch at line 42` / `EXIT:128` |
| 2 | `layered/logs/pallets__flask-4992.a2.apply_check.log` | `error: corrupt patch at line 43` / `EXIT:128` |
| 3 | `layered/logs/pallets__flask-4992.a3.apply_check.log` | `error: corrupt patch at line 42` / `EXIT:128` |

Line numbers match **last line of patch** (43 when extra `index` line present).

Harness apply-check command (code): `git apply --check /tmp/patch` inside SWE-bench Docker image `/testbed`.

**Ruled out from artifacts:**

| Hypothesis | Evidence |
|------------|----------|
| Wrong file path | All patches target `src/flask/config.py` (valid path for instance) |
| Different base commit between arms | Same `base_commit` recorded everywhere |
| Hunk line-count truncation | Third hunk counts match header (14/18) |
| Layered got a different patch than Baseline on attempt 1 | **Byte-identical** to Baseline |

**Supported by artifacts:**

| Cause | Evidence |
|-------|----------|
| **Patch file corruption (strict git)** | `corrupt patch at line N` where N = last line; patch lacks trailing newline |
| **Not a repository-state mismatch on a1** | Identical patch bytes: Baseline full eval resolved, Layered a1 apply-check failed |

`validate_patch_format()` passed all patches (only checks `diff --git` + `@@` present) — so Layered’s format gate does **not** catch newline corruption.

### G. Why SWE-bench could still report `resolved=true`

**Not established from artifacts alone** which apply command succeeded (instance logs deleted).

**Established:**

1. SWE-bench only marks resolved after patch application + test run; aggregate report shows `completed_instances: 1` and `resolved_instances: 1`.
2. Baseline/Current patches lack trailing newline but still resolved.
3. Layered uses **only** `git apply --check` on the **same bytes** (a1 ≡ baseline).

**Supporting context (installed SWE-bench harness, not in artifact tree):** full eval tries, in order:

1. `git apply --verbose`
2. `git apply --verbose --3way`
3. `git apply --verbose --reject`
4. `patch --batch --forward --fuzz=5 -p1 -i`

Layered apply-check tests **only** step 1’s strict-check equivalent (`git apply --check`), not the full chain.

---

## ROOT CAUSE

**Proven from artifacts:**

1. **Baseline and Layered attempt 1 used the same patch bytes** (SHA-256 `3a3940fc…`).
2. **Disagreement is not due to different extracted patches or different recorded base commits** on that attempt.
3. **`git apply --check` failed with `corrupt patch at line N`** where N is the final patch line; the patch **does not end with a newline**.
4. **Patches are not missing hunk lines** relative to their `@@` headers; the “truncation” appearance is a **missing EOF newline**, not an incomplete third hunk.

**Proven from artifacts + harness/SWE-bench apply-path comparison:**

5. **Layered and full-eval use different patch-acceptance mechanisms.** Layered: single `git apply --check`. SWE-bench full eval: multi-strategy apply chain (including GNU `patch --fuzz=5`). The same patch bytes can be **rejected by Layered** and **accepted by SWE-bench** if a later strategy succeeds.

---

## UNRESOLVED

- **Which SWE-bench apply command** (`git apply`, `--3way`, `--reject`, or `patch --fuzz=5`) actually succeeded — per-instance logs were deleted with temp eval dirs.
- **Whether adding only a trailing newline** would make Layered apply-check pass — not tested (no Docker re-runs per instructions).
- **Whether Baseline/Current patches would fail** `git apply --check` on the identical bytes if re-tested now — logically yes for a1/baseline bytes, but not re-executed.
- **Exact `pred.jsonl` on disk at eval time** — destroyed; inferred identical to logged `PATCH:` via harness code path only.

---

## DECISION

### Can apply-check be trusted as a Layered gate?

| Trust dimension | Verdict |
|-----------------|---------|
| **Detects strict `git apply --check` failure** | **Yes** — logs match git’s corrupt-patch diagnostic on these bytes. |
| **Aligned with SWE-bench full-eval acceptance** | **No** — demonstrated on this task: Baseline `resolved=true` with patch bytes that Layered apply-check rejects on attempt 1. |
| **Safe as a soundness gate before targeted pytest** | **Partially** — it blocks some patches SWE-bench would accept; may also block patches that would fail later, but that was **not observed here** (Baseline resolved). |
| **Current Layered gate for strategy validation** | **Do not treat as equivalent to full-eval patch application** until apply semantics are aligned (e.g., mirror SWE-bench’s apply chain or normalize patch bytes before check). |

**Operational decision:** Apply-check is **trusted to report strict git apply-check results** but **not trusted as a proxy for SWE-bench patch applicability** on this evidence. Strategy comparisons that mix Baseline/Current full-eval resolve rates with Layered apply-check gating are **apples-to-oranges** until resolved.

---

## Appendix — Quick answers

| Question | Answer |
|----------|--------|
| A. Baseline ≡ Layered a1 bytes? | **Yes** |
| B. Header/hunk differences? | a2 has `index` line; Current/a3 one docstring line; `@@` suffix text differs from gold |
| C. Same truncation point? | Same last line; **missing EOF newline**, hunk counts complete |
| D. SWE-bench same patch as logged? | **Inferred yes** (same harness variable; pred file not retained) |
| E. Same base commit? | **Yes** (`4c288bc…`) |
| F. apply-check failure reason? | **`corrupt patch` at last line** (not wrong path / not hunk-count shortfall on a1) |
| G. SWE-bench resolved why? | **Multi-strategy apply vs strict `--check`**; exact winning command **unresolved** |

STOP.
