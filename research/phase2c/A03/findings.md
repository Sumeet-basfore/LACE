# A03 Findings

- **Current is too coarse:** full suite + full retry is simple but wastes 60% tokens/latency on retries that could be cheap-rejected.
- **Targeted is the biggest win:** running only FAIL_TO_PASS (1–2 tests) and feeding exact test name+assertion to model would make feedback actionable and cut Docker time ~60%.
- **Layered dominates:** cheap `git apply --check` → targeted → regression → deep is strictly better than any single layer alone, and subsumes Adaptive and Targeted.
- **Reviewer is a cheap add-on:** diff-only reviewer call (~20k tokens) could replace a full retry (176k) for wrong-file cases, but not sufficient alone.
- **Risk-based is overkill for now:** adds complexity without evidence that risk scoring is better than simple layered ordering.
- **Recommended combination:** Layered (D) with Targeted (B) as core, plus Reviewer (E) as optional for suspicious diffs — this is HYBRID but essentially D.

