---
name: "alchemist"
description: Iterative RL loop that converges a structured output under multiple COUPLED constraints — where single-pass generation oscillates (fixing A breaks B) and verifying is cheaper than generating. A compiler proposes candidates, isolated strict testers each check one constraint, and a judge with full history diagnoses failures and the next fix, looping to convergence or a proven barrier. Use when several interacting requirements must hold at once and you keep playing whack-a-mole — making a system prompt robust, converging a SKILL.md, or forging a structured artifact (regex, DFA table, Dockerfile, config tuple). Trigger on 'converge until it passes', 'iterate until all checks pass', 'generate-test-judge loop', 'my prompt keeps oscillating', or any build where verifying a candidate is far cheaper than producing one. Sibling to Prometheus, which designs prompts; Alchemist runs the tournament and asks Prometheus to design its roles. Not for single-constraint tasks or one-shot generation that already works.
license: MIT
---

# Alchemist

A multi-agent convergence loop for any target that must satisfy **several coupled constraints at once**. It turns on one asymmetry: producing a candidate that satisfies everything is hard, but checking any one constraint is easy. The loop turns the hard problem into a sequence of easy checks, with a judge that synthesises the failures into one targeted fix and whose growing history prevents oscillation.

The full formalism — the system tuple `(P, S, C, T, J, halt, N)`, the convergence argument, and the mapping to RLHF / GANs / CDCL / evolutionary search — lives in `references/theory.md`. Read it when you need the *why*; the SKILL.md gives you the *how*. Developed by Δelta during the construction of the Prompt Cipher skill, where it discovered techniques that months of manual iteration had missed.

## When this, and when not

Alchemist earns its cost only under **coupling**: fixing one constraint tends to break another, so a single pass oscillates. If the constraints are independent, a checklist pass is cheaper and you do not need a loop. If generation is as hard as verification (no cheap check exists), the loop has no asymmetry to turn on. If one prompt already passes, ship it — Alchemist is for the whack-a-mole case, not for polishing something that works.

Alchemist **runs** agents; Prometheus does not. That boundary is deliberate. Prometheus is build-time only — it designs prompts and ships verifiers but never executes them, because the drafting session must not be the observer that measures the artifact. Alchemist is the executor that Prometheus refuses to be. They compose: **Alchemist asks Prometheus to design its compiler, tester, and judge prompts**, then runs the tournament those prompts define.

## Two modes

- **Forge (default) — run the loop.** Instantiate the loop on a concrete target and run it to convergence, orchestrating the roles as isolated subagents. You return the converged artifact plus its history trace (where the discoveries are), or a proof of infeasibility (which constraint to relax).
- **Dry-run — forge the harness, don't fire it.** Produce the role-prompt package, the runner, and the filled `run-config.yaml` as installable files, and stop. Use this when the user wants the auditable artifact, when determinism or token budget rules out a live tournament here, or when they will run it in their own harness. This keeps Alchemist inside Prometheus's build-time discipline when that is what the user wants.

Detection: a concrete target plus "run it / converge it / make it pass" → Forge. "Set up the loop / give me the harness / design the roles / dry run" → Dry-run. A target with an unclear request → ask once which mode. Unattended with no one to ask → Dry-run, because a live tournament spends tokens and makes side effects a returning user did not approve.

## The procedure

The architecture is invariant: `C → T‖ → halt → J → H`, one compiler, *m* parallel testers, a halt predicate, a judge, a growing history. Instantiating it is three decisions and then a loop.

### Phase 1 — Instantiate (the three decisions)

Everything task-specific reduces to three choices. Settle them *before* any role is written, and record them in `assets/run-config.yaml` (copy it; it is the loop's single source of truth).

1. **Output space S** — what the compiler produces, stated tightly enough to constrain the search. A system prompt, a `SKILL.md`, a regex, a `(K, Q)` tuple, a config file. The tighter S, the faster convergence.
2. **Testers + projections** — one tester per constraint, and for each the **projection**: the subset of the candidate that tester may see (`references/harness.md`, Projections). Disjoint projections enforce independence; one full-projection tester checks end-to-end properties. Plan for 2 testers minimum, ~5 maximum — past five, constraints are usually fusable or the target is under-decomposed.
3. **Halt predicate** — convergence is normally `all testers pass`. If you anticipate a structural barrier (a constraint you may be unable to fully satisfy), define the **relaxed** halt now — "functional pass on T₃ accepted" — never after the fact. A relaxation chosen before the loop is a design decision; chosen after, it is a rationalisation.

Also set **N**, the iteration budget, from the constraint count: 2–3 constraints → N ≈ 4; 4–6 interacting constraints → N ≈ 6. Hitting N without convergence is itself a result (Phase 4).

The phase closes with a short **collapse block** — S, the testers and their projections, the halt (and any relaxation), N — posted for the user to confirm or correct before any role is drafted. Unattended, state each choice as a marked assumption and proceed. This mirrors Prometheus's interview gate, and for the same reason: collapsing a parameter you never surfaced discards the thing the user was there to set.

### Phase 2 — Forge the roles (delegate to Prometheus)

The three roles **are** Prometheus shapes. Do not hand-roll them; invoke Prometheus (its dry-run / design path) with each role's spec and let it produce a well-formed prompt, then wire in the Alchemist-specific context restrictions. `references/roles.md` gives the spec for each and the exact invariants to enforce; `assets/role-templates/` holds the skeletons Prometheus fills.

- **Compiler C** — a one-shot task prompt (Prometheus Shape 2), or a loop seed (Shape 1) if the candidate is itself produced by a sub-process. Receives P and the judge's accumulated fixes H; produces a candidate s. It **never sees raw tester verdicts** — only the judge's interpreted fixes — so it cannot game individual tests.
- **Testers Tᵢ** — each a strict LLM-as-judge (Prometheus Shape 6), scoped to its projection. Instructed to *try hard to make its constraint fail*, not merely to rate it. Testers never see each other's results.
- **Judge J** — a meta-grader (Shape 6 variant) that is the **sole cross-boundary reasoner**: it sees every verdict, the candidate, and the full history H, and outputs a root-cause diagnosis plus one fix. The history is what lets it detect coupling and refuse fixes already tried.

### Phase 3 — Run (Forge) or Ship (Dry-run)

**The information-flow invariants are the technique.** A loop that leaks forbidden information between roles is not Alchemist; it is a while-loop around a prompt, and it will oscillate or converge on a candidate that games its tests. The orchestrator (you, driving the loop) holds P, S and H and enforces this directed acyclic graph every iteration — these are non-negotiable because each one buys a specific guarantee:

- **I1 — Compiler sees only P and the judge's fixes.** Not raw verdicts. *Because* a compiler that sees per-test results learns to satisfy the letter of each test, not the target.
- **I2 — Testers are mutually isolated.** No tester sees another's projection, verdict, or reasoning. *Because* a tester that knows what its neighbour checks stops checking its own constraint honestly.
- **I3 — Each tester sees only its projection.** *Because* a component test on the whole candidate is no longer a component test; the isolation that makes the verdict meaningful is gone.
- **I4 — The judge is the only agent that sees across boundaries.** All synthesis happens in one place, against the full history. *Because* cross-constraint reasoning scattered across roles cannot detect coupling.
- **I5 — No compiler→judge direct path.** The judge sees the candidate only through the testers' verdicts. *Because* a judge reading the raw candidate starts re-doing the testers' work instead of diagnosing their findings.

In **Forge mode**, run each role as an isolated subagent (fork or general-purpose), passing *only* its permitted context — the invariants above define what "only" means. Each iteration: compile → fan out to testers in parallel → check halt → if not converged, judge → append the fix to the H ledger (`assets/history-ledger.md` is the table the judge reads) → next iteration. Maintain the ledger as a table (iteration, each verdict, fix applied) so the judge can see oscillation and progressive narrowing at a glance. Full run contract, subagent wiring, and the ledger format: `references/harness.md`.

In **Dry-run mode**, skip execution: emit the filled role prompts, the `run-config.yaml`, the empty ledger, and a short runner instruction, as installable files. Nothing is executed here.

### Phase 4 — Report

Two outcomes, both valuable:

- **Converged (L(s) = 0).** Return the artifact *and* the history trace. The trace is not bookkeeping — it is where the method pays off: the sequence of fixes records the techniques the loop discovered (indirect derivations, compilations, structural tricks) that a single pass would never have surfaced.
- **Hit N without converging.** This is a **constructive proof of infeasibility**, not a failure: the accumulated history narrows *why* no candidate satisfies all constraints jointly, and the judge names which constraint to relax. Often more useful than a converged artifact, because it tells the user where the real tension is.

Oscillation (alternating failures across iterations, e.g. T₁ fail / T₂ pass → T₁ pass / T₂ fail) is the signal of coupling, not of a broken loop. The judge's history makes the coupling visible and lets it propose a fix that satisfies both constraints at once — the analogue of a CDCL backjump. If you see oscillation and the judge is *not* resolving it, the judge is probably not receiving the full history (check I4 and the ledger).

## Design rules that carry their weight

- **Strict testers, always.** A tester that merely evaluates passes weak candidates; a tester told to make its constraint fail through lateral edge cases finds the real failures early. The whole loop is only as honest as its most lenient tester.
- **The judge must see the full history, formatted as a table.** A memoryless judge oscillates forever; history is the anti-oscillation mechanism and the coupling detector. This is the single most common way to get Alchemist wrong.
- **Minimum two testers.** One tester is a checklist, not a tournament — there is no coupling to detect, so use Prometheus and ship the prompt directly.
- **Define relaxation before the loop, or not at all.** See Phase 1.
- **Transfer the compiler's initial prompt across related targets.** Seeding a new loop with what an earlier loop learned cuts iterations sharply (the Prompt Cipher DFA target converged in 2 iterations versus 5 for the regex, purely from a warm-started compiler).

## Read when …

| File | Read when |
|---|---|
| `references/theory.md` | you need the formal system, the convergence argument, or the mapping to RLHF / GANs / CDCL / evolutionary search |
| `references/roles.md` | Phase 2: the per-role spec, the Prometheus shape each maps to, and the invariants to wire in |
| `references/harness.md` | Phase 3: projections, subagent wiring, the information-flow DAG, the ledger format, infeasibility handling |
| `assets/run-config.yaml` | Phase 1: the instantiation to copy and fill |
| `assets/history-ledger.md` | Phase 3: the H table the judge reads each iteration |
| `assets/role-templates/` | Phase 2: the compiler / tester / judge skeletons Prometheus fills |
