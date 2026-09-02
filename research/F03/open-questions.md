# F03 Open Questions — Herdr Runtime Teardown

## Gaps that blocked a definitive CORE vs OPTIONAL call

1. **No n≥20 HerdrDelta experiment.** No public or local measurement of `time-to-green` or `manual interventions` across `tmux+worktree+agent` vs `Herdr+worktree+agent` vs `LACE prototype` on a fixed task bench. Threshold T2 (>30% / >50%) is untested.
   - *Follow-up:* Run 20 tasks (e.g., SWE-bench Verified micro-split n=20 or curated repo tasks), same model `muse-spark-1.2-contributor-free`, same worktree isolation, measure wall time to green + intervention count (blocked→manual input). Report 95% CI.

2. **Worktree ergonomics under Herdr vs tmux not quantified.** `herdr worktree create/open/remove` is a thin wrapper [E16]; does it reduce worktree lifecycle friction enough to move T2? No timing data.
   - *Follow-up:* Time `git worktree add + Herdr workspace create` vs `tmux + worktree` setup for 3 parallel tasks; include cleanup cost.

3. **Agent lifecycle false-positive/negative rates.** `blocked`/`unknown` detection accuracy per agent kind (pi/claude/codex/opencode) not measured; `herdr agent explain --json` not probed live.
   - *Follow-up:* Trigger known blocked states (approval dialog, question) per agent, capture `agent explain` output, tabulate precision/recall.

4. **Semantic recovery not prototyped.** Whether LACE's verification loop (test→parse→feedback) materially reduces regressions or manual retries over Herdr+agent's ad-hoc `pane run "npm test"` loop is unmeasured.
   - *Follow-up:* Build minimal LACE verifier (Herdr plugin: `pane run` + parse + `agent prompt` feedback) and A/B on same 20 tasks.

## Measurement design questions

5. **What counts as "time-to-green"?** First passing tests? No-regression green? Human-accepted green? Needs pre-registration.
6. **What counts as "manual intervention"?** Approvals, blocked resolutions, hangs killed via `send-keys ctrl+c`, or context re-prompting? Define taxonomy before counting.
7. **Sample choice justification.** SWE-bench Verified micro tasks vs. real internal repo tasks — external validity tradeoff; Lite filtering excludes multi-file tasks LACE claims to help.

## Integration / adoption questions

8. **Herdr as dependency risk.** Herdr is nascent with thin docs/community (R001 weakness). What is bus-factor / API stability (protocol 20) and fallback if Herdr breaks? Is tmux fallback kept?
   - *Follow-up:* Review herdr changelog + `api schema --json` diff across versions; test `tmux+worktree` fallback path.

9. **Plugin vs standalone packaging.** Marketplace/plugins docs [E12] suggest local plugins with manifest actions/event hooks — can LACE ship as a Herdr plugin (preferred per R007) vs standalone binary? What plugin API limits exist?
   - *Follow-up:* Read `plugins.mdx` + `marketplace.mdx` raw sources; prototype one plugin (ledger pane).

10. **Remote/SSH story not probed.** `herdr --remote` and named sessions are undocumented in this probe; tmux remote via plain SSH is mature. For teams, does Herdr remote add value?
    - *Follow-up:* Test `herdr --remote <host>` vs `ssh + tmux` for detach/reattach + agent survival.

## Scope-creep notes (parked)

- Per-agent cost/latency capture (needs F02 rig).
- File-ownership / DAG scheduling design (needs R003 ownership findings).
- 8GB local-model ergonomics (F03 hardware rig — distinct from runtime teardown).

## When to revisit teardown

- After any n≥20 HerdrDelta run — re-evaluate T2 and update recommendation CORE/OPTIONAL/REFERENCE.
- After Herdr docs re-parse at next stable tag (expected protocol bump) — re-check primitives and integration kinds.
