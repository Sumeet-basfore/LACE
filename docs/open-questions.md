# LACE Active Open Questions

**Last Updated:** 2026-09-03  
**Status:** CANONICAL RECORD  
**Corpus Classification:** CLASS A

---

## 1. Experimental & Technical Open Questions

1. **OQ-TECH-01: Verification Disagreement & Fuzz Tolerance**
   - *Question:* Does relaxing pre-Docker `git apply --check` in the layered arm to match SWE-bench evaluation container fuzz tolerances (`patch --fuzz=5`) eliminate the false-negative rejections observed on `matplotlib__matplotlib-23299` and `mwaskom__seaborn-3190`?
   - *Status:* Hypothesized in `research/reports/07-phase2d-batch1-results.md`; pending ablation.

2. **OQ-TECH-02: Minimal Corrective Payload Threshold**
   - *Question:* What is the minimum byte payload (e.g., test name only vs. failing assertion line vs. full traceback) required to induce successful model error recovery?
   - *Status:* Addressed by Phase 2D Ablation 1 protocol (`baseline` vs `current` vs `minimal` vs `structured`).

3. **OQ-TECH-03: Recovery Cost Ceiling**
   - *Question:* Can structured feedback keep multi-attempt median token consumption below the $1.5\times$ baseline ceiling, or does multi-turn prompting inevitably drift toward $>2.5\times$ cost?
   - *Status:* Prior naive run showed $2.97\times$ (D-005); Batch 1 Current arm showed $1.07\times$ on $n=5$. Pending $n\ge 10$ validation.

4. **OQ-TECH-04: Test-Weakening Patch Detection**
   - *Question:* How can an automated gate detect when an agent modifies test assertions or skips tests to falsely achieve a green exit code without requiring a full AST analysis pipeline?
   - *Status:* Outlined in `docs/security/threat-model.md`; requires strict git-path denylist on test directories during recovery.

---

## 2. Product & Market Open Questions

1. **OQ-MKT-01: User Tolerance for Verification Latency**
   - *Question:* Will interactive developers tolerate a 30–60 second verification delay per task attempt, or does synchronous verification break conversational flow?
   - *Status:* Identified as tension point in `research/reports/08-product-problem-research.md`.

2. **OQ-MKT-02: Willingness to Pay for Reversibility Gate**
   - *Question:* Do development teams view automated verification gates as worth an incremental per-seat subscription over existing CI/CD merge requirements?
   - *Status:* Unproven. Survey instrument drafted in `research/market/survey.md`.

3. **OQ-MKT-03: Incumbent Cannibalization**
   - *Question:* Will Anthropic Claude Code, OpenAI Codex, or OpenCode bundle native verification and rollback loops natively within the next 6–12 months?
   - *Status:* High probability risk identified in `research/reports/10-adversarial-product-test.md`.
