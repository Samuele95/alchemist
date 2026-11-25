# History ledger (H)

The judge reads this ENTIRE table every iteration — never just the last row.
It is the anti-oscillation mechanism: a visible record of what was tried and
what it broke, so coupling and repeated failures are detectable at a glance.
Append-only; never rewrite past rows (the tabu effect depends on failures
staying visible).

One column per tester. Mark pass / fail. The "Fix applied" column is the
judge's recommended fix that was fed to the compiler for the NEXT iteration
(so iteration n's fix produced iteration n+1's candidate).

| Iter | T1 | T2 | T3 | Fix applied (→ next candidate) |
|-----:|:--:|:--:|:--:|--------------------------------|
| 1    | ❌ | ✅ | ❌ | <judge's fix after iteration 1> |
| 2    | ✅ | ❌ | ❌ | <judge's fix after iteration 2 — note if this is an oscillation> |
| 3    | ✅ | ✅ | ✅ | — (converged) |

<!--
Reading guide for the judge:
- Alternating pass/fail on the same test across rows  = OSCILLATION → coupled
  constraints; propose ONE fix that satisfies both, do not trade them.
- Same test failing every row                         = approach exhausted →
  propose a structurally different approach, not a tweak.
- Steady narrowing but still failing at row N         = probable structural
  barrier (Φ = false) → name the constraint pair, recommend which to relax.
-->
