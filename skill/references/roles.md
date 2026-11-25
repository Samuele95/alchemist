# Alchemist — Role design (Phase 2)

The compiler, testers, and judge are not bespoke Alchemist inventions — each is a Prometheus shape with a few context restrictions wired in. Design them by invoking Prometheus (its design / dry-run path) with the spec below, then enforce the invariants. The skeletons in `assets/role-templates/` are what Prometheus fills; this file is the spec it fills them against.

**Why delegate to Prometheus.** Alchemist's job is the tournament, not prompt authorship. Prometheus already knows how to write a strict grader, a history-aware judge, and a constrained generator at the right altitude with their constraints carrying their *because*. Re-deriving that inside Alchemist would duplicate a framework the user already owns and keep the two out of sync. Hand Prometheus the role spec; let it return a well-formed prompt.

---

## Compiler C

**Prometheus shape:** Shape 2 (one-shot task) in the common case; Shape 1 (agentic loop seed) only if the candidate is itself produced by a multi-step sub-process the compiler must run.

**Spec to pass Prometheus:**
- Input: the target specification P, and the accumulated fix history H (a list of the judge's interpreted fixes, in order).
- Output: a single candidate s in the output space S, nothing else — no commentary, no self-evaluation.
- The prompt must instruct the compiler to treat each fix in H as a binding correction to apply, and to carry *all* prior fixes forward, not just the latest (fixes are cumulative; dropping an old one re-introduces a solved failure).

**Invariant to wire in (I1, I5):** the compiler's context contains P and H *only*. It must never be handed a tester verdict, a projection, or the testers' reasoning. If the compiler can see which specific test failed and how, it optimises for the letter of that test rather than the target, and the convergence guarantee is lost.

**Warm-starting:** when a related target was converged earlier, seed the compiler's initial prompt with the techniques that loop discovered (not the old candidate — the *techniques*). This is the transfer-learning effect; it routinely halves iteration count.

---

## Testers Tᵢ

**Prometheus shape:** Shape 6 (LLM-as-judge / grader), strict variant, one per constraint.

**Spec to pass Prometheus, per tester:**
- Input: *only* this tester's projection of the candidate (see `harness.md`, Projections). State the projection explicitly in the prompt so the tester knows its scope.
- The one constraint it checks, stated as a crisp pass/fail criterion — not a score. Alchemist's loss counts failing tests; a tester that returns a 7/10 forces the judge to invent a threshold.
- Output: a `{pass, fail}` verdict plus a short, concrete reason on fail (what broke, where) — the reason feeds the judge, so it must be specific enough to diagnose from.
- **Strict stance, explicitly.** Instruct the tester to *try hard to make the constraint fail* using lateral thinking and inventive edge cases, not merely to evaluate whether it looks fine. Give it explicit permission to be demanding. A lenient tester is the most common cause of a loop that "converges" on a candidate that then fails in use — the loop is only as honest as its weakest tester.

**Invariants to wire in (I2, I3):** each tester's context contains its projection and nothing else — not another tester's projection, verdict, or criterion. Testers must be independently runnable; if one tester's prompt references what another checks, isolation is broken and both verdicts are compromised.

**How many:** minimum 2 (one tester is a checklist — use Prometheus directly). Maximum ~5; past five, either two constraints are fusable into one tester or the target is under-decomposed. One of the testers is usually a full-projection tester checking end-to-end correctness.

---

## Judge J

**Prometheus shape:** Shape 6 (grader), meta variant — it grades the *verdicts against the history*, not the raw candidate.

**Spec to pass Prometheus:**
- Input: the full verdict vector v for this iteration, **and the full history H formatted as a table** (iteration · each tester's verdict · fix applied). The candidate is seen only through the verdicts (I5).
- Output, in this order: (1) root-cause diagnosis — *why* the candidate failed, in terms of the constraints, not the symptoms; (2) candidate fixes with trade-offs; (3) one recommended fix with implementation detail concrete enough for the compiler to apply.
- The prompt must instruct the judge to **read the history for patterns** before proposing a fix:
  - *Oscillation* (a test alternating pass/fail across iterations) → diagnose the **coupling** between the two constraints and propose a fix that satisfies both at once. Do not propose a fix that trades one for the other; that is the oscillation, not the cure.
  - *Repeated failure on the same test* → the current approach to that constraint is exhausted; propose a structurally different approach, not a variation.
  - *Progressive narrowing with no convergence by N* → declare a probable structural barrier (Φ = false), name the specific constraint pair that cannot be jointly satisfied, and recommend which to relax.

**Invariant to wire in (I4):** the judge is the *only* agent that sees across constraint boundaries. All cross-constraint synthesis happens here, against the full H. This is the single most important role to get right: a judge that receives only the latest iteration, not the full history, cannot detect coupling and the loop oscillates forever. If convergence stalls with visible oscillation, check this first.

---

## Audit before running

Before the first iteration (Forge) or before shipping the package (Dry-run), confirm:

- [ ] Every tester returns pass/fail, not a score.
- [ ] Every tester is strict and scoped to its stated projection.
- [ ] No tester prompt references another tester's constraint.
- [ ] The compiler prompt contains P and H only — no verdicts.
- [ ] The judge prompt contains the full-history table and the pattern-reading instructions.
- [ ] The halt predicate (and any relaxation) matches `run-config.yaml`.
- [ ] N is set from the constraint count.

A failed check here is a silent convergence failure later — the loop will run and produce *something*, but the something will not be trustworthy.
