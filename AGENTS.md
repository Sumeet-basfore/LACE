# AGENTS.md — Rules for Coding Agents on LACE

Read this file before making changes. Prefer smallest correct diff.

---

## PROJECT CONTEXT

- Read the **smallest relevant set of files** first.
- Prefer existing docs and artifacts over rediscovering project history.
- Start with `context/brain.md` and `context/decisions.md` when changing project behavior or experiments.
- Use `context/terminology.md` for failure-class and epistemic labels.
- Use `context/experiment-rules.md` before touching harnesses or running experiments.

---

## SCOPE

- Do **not** modify unrelated files.
- Do **not** redesign architecture unless explicitly asked.
- Do **not** add features because they seem useful.
- Preserve existing experiment protocols unless explicitly instructed.
- Do **not** build MCP/plugin/UI/production code unless explicitly requested.

---

## EXPERIMENT SAFETY

- **NEVER** run SWE-bench or benchmark experiments unless explicitly requested.
- **NEVER** change frozen model, provider, manifest, or protocol without explicit approval.
- **NEVER** turn an exploratory result into a product claim.
- Treat these as **different categories:**
  - provider errors
  - model failures
  - verification failures
  - infra failures
- Do **not** rerun Phase 2D or scale experiments unless explicitly requested.
- Contaminated experiment data must be discarded, not patched in place.

Frozen defaults: model `muse-spark-1.2-contributor-free`, provider `opencode`.

---

## TOKEN / COST DISCIPLINE

- Do **not** inspect the whole repository unless necessary.
- Do **not** repeat already-known context from `context/` or `docs/`.
- Prefer targeted file reads over broad search.
- Do **not** spawn additional agents unless explicitly instructed.
- Avoid long speculative analysis.
- Before running an expensive command, state why it is necessary.
- Stop once the requested acceptance criteria are satisfied.

---

## IMPLEMENTATION

- Make the **smallest correct change**.
- Reuse existing utilities in harnesses and research code.
- Add **focused tests** for behavior you change.
- Do **not** install new dependencies unless required.
- Do **not** run broad test suites unless directly relevant.
- Match existing code style and naming in the file you edit.

---

## EPISTEMIC DISCIPLINE

When writing docs or reports, label claims:

`FACT` | `EVIDENCE` | `INFERENCE` | `HYPOTHESIS` | `DECISION`

Benchmark evidence informs harness design; it is **not** product validation.

---

## STOP CONDITION

After acceptance criteria pass:

1. Summarize changed files
2. Summarize tests/checks run
3. Report any uncertainty
4. **STOP**

Do not continue exploring or implementing automatically.
