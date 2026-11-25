# Alchemist — Theory

The *why* behind the loop. The SKILL.md gives the operational procedure; this file is the formal grounding. Read it when a design choice needs justification, when convergence stalls and you need to reason about feasibility, or when relating Alchemist to a known paradigm.

## Table of contents

1. The problem: coupled constraints
2. Architecture and role invariants
3. Projections
4. Formal system
5. Convergence
6. Connections to established frameworks
7. Empirical validation

---

## 1. The problem: coupled constraints

Many prompt-engineering tasks require an output that satisfies several constraints at once. When the constraints are **coupled** — fixing one tends to break another — single-pass approaches fail: the engineer fixes A, breaking B; fixes B, breaking A; and oscillates indefinitely.

Alchemist separates generation from verification. Generation (producing a candidate that satisfies everything simultaneously) is hard. Verification (checking one constraint) is easy. The loop converts the hard problem into a sequence of easy checks, with a judge that synthesises the failed checks into a targeted fix. The judge's accumulated history prevents oscillation and yields deeper structural insight over iterations.

## 2. Architecture and role invariants

Three roles, a fixed cycle. Each role is an independent agent with its own prompt and restricted information.

```
  Target P ──┐        ┌── History H
             ▼        ▼
          ┌─────────────────┐
          │   COMPILER  C   │   C(P, H) → s
          └────────┬────────┘
                   │ candidate s
        ┌──────────┼──────────┐
        ▼          ▼          ▼          (projections of s)
   ┌─────────┐┌─────────┐┌─────────┐
   │ Tester1 ││ Tester2 ││ Tester m │    strict, parallel, isolated
   └────┬────┘└────┬────┘└────┬────┘
      v₁│        v₂│        vₘ│
        └──────────┼──────────┘
                   ▼
              ⟨ all pass? ⟩ ── yes ──▶ CONVERGED (return s)
                   │ no
                   ▼
          ┌─────────────────┐
          │    JUDGE  J      │   J(v, H) → fix
          └────────┬────────┘
                   │  H ← H ∪ {fix}
                   └────────────────▶ (next iteration)
```

**Compiler C.** Receives target P and fix history H; produces candidate s. **Never** sees raw test results — only the judge's interpreted fixes. This prevents the compiler from gaming individual tests.

**Testers T = {T₁ … Tₘ}.** Each checks one constraint. They run in **parallel** and are **mutually isolated** — never seeing each other's results. Each receives only a *projection* of s: the subset visible to that test. Testers are instructed to be strict.

**Judge J.** The sole cross-boundary reasoner. Receives all verdicts, the candidate, and the full iteration history. Produces a diagnosis (why it failed) and a fix (what to change). The history is the anti-oscillation mechanism.

### Information-flow invariants (I1–I5)

The flow is a strict DAG within each iteration:

- **I1.** Compiler ← {P, judge's fixes}. Never raw verdicts.
- **I2.** Testers are mutually isolated.
- **I3.** Each tester ← only its projection of s.
- **I4.** Judge ← {all verdicts, candidate, full H}. Sole cross-boundary reasoner.
- **I5.** No Compiler→Judge direct path. The judge sees s only through the testers' verdicts.

Each invariant buys a specific guarantee; the operational consequences are in the SKILL.md (Phase 3) and `harness.md`.

## 3. Projections

Each tester sees only a **projection** of the candidate: a function selecting the subset of s visible to that test. Projections are the isolation mechanism — what makes each test independently meaningful.

For a candidate `s = (x₁, x₂, …, x_k)` of k components:

- **Disjoint projection** — `proj(s, i) = {xᵢ}`. The tester sees one component, blind to the rest. Enforces independence: a tester receiving only x₁ cannot reason about x₂.
- **Full projection** — `proj(s, m) = s`. The tester sees everything; it checks holistic properties like end-to-end correctness.

Most loops use a mix: several disjoint testers for component-level constraints, one full-projection tester for the integrated result. If a tester sees the full candidate when it should see a component, the isolation invariant (I3) is violated and the test is meaningless.

## 4. Formal system

Notation: s = candidate, v = verdict vector, H = history, f = fix.

**System.** A loop is a tuple `(P, S, C, T, J, halt, N)`:

- `P` — the target specification.
- `S` — the output space (all valid candidates).
- `C : P × H → S` — the compiler.
- `T = {T₁ … Tₘ}` — testers, each `Tᵢ : proj(S, i) → {pass, fail}`.
- `J : V × H → F` — the judge. V = verdict vector, F = fix space.
- `halt : V → {yes, no}` — convergence predicate.
- `N` — maximum iterations.

**One step.** At iteration n, state is (s, H):

```
s   ← C(P, H)                              compile
v   ← (T₁(proj(s,1)), …, Tₘ(proj(s,m)))    test  ‖ (parallel)
if halt(v)  →  return s                    done
f   ← J(v, H)                              diagnose
H   ← H ∪ {f}                              accumulate
```

**Loss.** The number of failing tests: `L(s) = |{ i : Tᵢ(proj(s,i)) = fail }|`. The loop seeks `s* ∈ S` with `L(s*) = 0`. This is discrete constraint satisfaction.

**Feasibility.** `Φ = ∃ s ∈ S : L(s) = 0`. When Φ is false, no solution exists; the loop cannot converge, but the judge's history provides a *constructive proof of infeasibility* — each failed approach and its trace together demonstrate why no s satisfies all tests.

## 5. Convergence

Three mechanisms drive convergence.

1. **Informed mutation.** The judge's fix is a targeted diagnosis of *why* the test failed, not a random perturbation. This produces directed search rather than a random walk — empirically 2–5 iterations, not the hundreds typical of uninformed evolutionary search.

2. **Tabu effect.** The judge sees the full history H. Fixes already tried and failed are implicitly excluded from future proposals, because their failure is visible. H is a growing tabu list that prunes the search space monotonically.

3. **Coupling detection.** When the judge observes that fixing test i broke test j (a pattern visible in H), it diagnoses the **coupling** and proposes a fix addressing both at once. This breaks oscillations — the prompt-engineering analogue of conjugate-gradient descent using search history to avoid revisiting directions.

### Oscillation

The primary convergence risk. A pattern like `(n: T₁ fail, T₂ pass) → (n+1: T₁ pass, T₂ fail) → (n+2: T₁ fail, T₂ pass)` indicates coupled constraints: fixing T₁ breaks T₂ and vice versa. The judge's history makes the coupling visible, enabling a single fix that satisfies both. Without history (a memoryless judge), the loop oscillates indefinitely — which is why the judge receiving the full H is the load-bearing requirement.

### Structural barriers

When Φ = false, the loop reaches N without converging. The value is diagnostic: H constitutes a constructive proof of infeasibility, each failed approach demonstrating one reason the constraints cannot be jointly satisfied, narrowing the impossible set until the barrier is explicit. This often beats a converged solution — it tells you which constraint to relax.

### Iteration budget

- 2–3 constraints → plan for 3–4 iterations.
- 4–6 interacting constraints → plan for 5–6.
- If iteration 6 fails, the problem likely has a structural barrier (Φ = false for the current constraint set); have the judge identify which constraint to relax.

## 6. Connections to established frameworks

Alchemist sits at the intersection of several paradigms. The differentiator: it operates on **discrete symbolic structures** (prompts, specifications) via informed mutation, not on continuous parameters via gradients.

| Paradigm | Their term → Alchemist |
|---|---|
| **RLHF** | policy (weights) → prompt · reward model → testers · PPO optimiser → judge · gradient update → symbolic fix |
| **GANs** | generator → compiler · discriminator → testers · mode collapse → oscillation · gradient-based → symbolic |
| **SAT / CDCL** | clause → constraint Tᵢ · assignment → fix f · conflict clause → history H · CDCL backjump → coupling fix |
| **Evolutionary (1+1)** | random mutation → informed fix · fitness → halt(v) · ~1000 gens → 2–6 iterations · blind → directed search |

## 7. Empirical validation

Validated on three targets of increasing complexity. The loop found solutions that manual engineering had missed across months of iteration.

| Target | Constraints | Iterations | Outcome | What the loop found |
|---|---|---|---|---|
| Pattern (regex, SemVer) | 3 | 5 | Converged | A compact form satisfying all three constraints at once |
| Tabular (DFA transition table) | 3 | 2 | Converged | Formula compilation into narrative data |
| Code (multi-stage Dockerfile) | 3 | 5 | Partial | Token-density ceiling — structural barrier identified |

The DFA case converged in 2 iterations (vs 5 for the regex) because prior knowledge from the first loop was encoded in the compiler's initial prompt — a **transfer-learning** effect. The Dockerfile case revealed a fundamental impossibility (Φ = false for the joint constraint set), which the judge identified explicitly by iteration 5. The loop ran as fork subagents within a Claude Code session, each role an independent agent with its own prompt and restricted context.
