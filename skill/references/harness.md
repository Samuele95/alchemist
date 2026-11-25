# Alchemist — Run contract (Phase 3)

How the loop actually runs: projections, subagent wiring, the information-flow DAG as an operational checklist, the history ledger, and what to do at the budget boundary. The orchestrator — the agent driving the loop — is the one place that holds P, S and H and enforces the flow. The roles never hold more than their permitted slice; that restriction is the whole mechanism.

## Projections — defining what each tester sees

A projection is a function selecting the subset of the candidate a tester may read. Decide each tester's projection in Phase 1 and record it in `run-config.yaml`.

- **Disjoint** — `proj(s, i) = {xᵢ}`: the tester sees one component of the candidate. Use for component-level constraints that must hold independently. Example: for a `(K, Q)` cipher tuple, one tester sees only K (is the key well-formed?), one sees only Q (is the payload recoverable in principle?).
- **Full** — `proj(s, m) = s`: the tester sees the whole candidate. Use for the one holistic / end-to-end constraint. Example: does running K on Q actually reproduce the original?

Operationally, a projection is enforced by **what you put in that tester's subagent context**. There is no projection without context isolation — handing a "disjoint" tester the full candidate and asking it to "only look at x₁" does not work; models read what they are given. Pass the subagent only the bytes of its projection.

## Subagent wiring (Forge mode)

Run each role as an isolated subagent so the invariants hold by construction — a fresh context per role is the cleanest enforcement of "sees only its permitted slice."

Per iteration n, the orchestrator does:

1. **Compile.** Spawn one compiler subagent. Context: P + the H ledger (fixes column only — not verdicts). Receive candidate s. Record s.
2. **Test (parallel).** Spawn m tester subagents *in the same turn* so they run concurrently. Each context: that tester's projection of s + its single criterion. Receive m verdicts. No tester subagent receives another's context.
3. **Halt check.** Evaluate `halt(v)`. If satisfied, stop and go to Report — do not run the judge on a converged iteration.
4. **Judge.** If not converged, spawn one judge subagent. Context: the full verdict vector v + the full H ledger as a table. Receive diagnosis + one fix. The judge subagent does **not** receive the raw candidate (I5).
5. **Accumulate.** Append a row to the ledger: iteration n, each verdict, the fix applied. This row is what the next judge call reads.
6. **Budget.** If n = N and not converged, go to Report (infeasibility path). Else n ← n+1, back to step 1.

The orchestrator never passes a tester verdict to the compiler, never passes one tester's context to another, and never passes the raw candidate to the judge. If you find yourself wanting to "just let the judge see the candidate to save a round-trip," stop — that is I5, and breaking it turns the judge from a diagnostician into a fourth tester.

### A note on cost and determinism

A live tournament spends real tokens: roughly `(1 compiler + m testers + 1 judge)` subagent calls per iteration, times N. For 4 testers over 5 iterations that is ~30 subagent runs. If the target is expensive or the user wants determinism, prefer **Dry-run mode** — ship the harness and let the user run it under their own budget and seed control. Flag the cost before launching a large Forge run unattended.

## The history ledger (H)

H is the anti-oscillation mechanism; its format is load-bearing. Keep it as a table so the judge sees patterns at a glance (`assets/history-ledger.md` is the template). Columns: iteration · one column per tester (pass/fail) · fix applied that iteration. The judge reads the whole table every call — never just the last row. A judge given only the latest verdicts cannot detect oscillation and the loop will not converge on coupled constraints.

Append-only. Never rewrite past rows: the record of a failed approach is what keeps the judge (and, indirectly, the compiler) from re-trying it — the tabu effect depends on the failures staying visible.

## Halt, budget, and relaxation

- **Halt** is normally "all testers pass" (`L(s) = 0`). Evaluate it on the verdict vector, before the judge.
- **Budget N** comes from the constraint count (2–3 → ~4; 4–6 → ~6). Reaching N is a result, not an error.
- **Relaxation** must be defined in `run-config.yaml` *before* the loop. If a structural barrier is anticipated, the relaxed halt (e.g. "T₃ may return a functional-but-not-full pass") is a design decision made up front. A relaxation invented after seeing the loop stall is a rationalisation and must not be added mid-run; instead, stop, report the barrier, and let the user decide whether to relax and re-run.

## At the budget boundary — infeasibility

If the loop reaches N without converging, do not report failure. Report the **infeasibility proof**:

1. State which constraints never jointly passed.
2. From the ledger, show the coupling: the fix that satisfied constraint i and the verdict showing it broke constraint j, across iterations.
3. Give the judge's final diagnosis of *why* Φ = false for this constraint set.
4. Recommend which single constraint to relax, and what the relaxed loop would likely converge to.

This is frequently the more valuable outcome: it locates the real tension in the specification, which a one-shot success would have hidden.

## Quick failure diagnosis

| Symptom | Likely cause | Fix |
|---|---|---|
| Oscillates and never converges | Judge not seeing full history (I4) | Pass the whole ledger table every judge call, not the last row |
| "Converges" but the artifact fails in use | A lenient tester | Make every tester strict; add the missing edge case to its criterion |
| Compiler keeps satisfying tests in form, not substance | Compiler sees verdicts (I1) | Pass only P + the judge's fixes to the compiler |
| Judge re-does the testers' work instead of diagnosing | Judge sees the raw candidate (I5) | Pass only verdicts + history to the judge |
| Converges on a candidate that games one component | Tester saw more than its projection (I3) | Pass only the projection bytes to that tester |
| All iterations pass immediately | Testers not strict, or constraints uncoupled | If genuinely uncoupled, you did not need Alchemist — use Prometheus |
