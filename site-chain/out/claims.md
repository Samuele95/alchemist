# Claims — what the Alchemist site may say

Sources: skill = `skill/` (SKILL.md, references/, assets/); paper = `paper/Adversarial_RL_Loop.html` ("The Adversarial RL Loop: a prompt engineering and optimisation technique by iterative exploration of prompt space", Samuele Stronati). Rule R1: the skill governs behaviour, the paper governs theory and evidence. The paper is a later, corrected statement of the skill's own theory note (it calls that note "the source note"), so most conflicts are corrections the paper makes on purpose.

## What it is and when to use it

| id | claim | governs | locator | status |
|---|---|---|---|---|
| C01 | Alchemist is a multi-agent loop that converges an output that must satisfy several coupled constraints at once. | skill | `SKILL.md` › Alchemist (intro) | supported |
| C02 | Constraints are coupled when a fix that satisfies one of them tends to break another. | paper | paper › 1 Introduction | supported |
| C03 | Under coupled constraints, fixing one constraint at a time can oscillate: the fix for A breaks B, the fix for B breaks A again. | paper | paper › 1 Introduction; Figure 1 | supported |
| C04 | The loop rests on an assumed asymmetry: checking one constraint is expected to be cheaper than producing a candidate that satisfies all of them; the paper does not measure it. | paper | paper › 1 Introduction; Figure 2 | supported |
| C05 | Where no cheap check exists, the loop has nothing to exploit and is not recommended. | paper | paper › 1 Introduction | supported |
| C06 | If the constraints are independent, a checklist pass is cheaper; if one prompt already passes, ship it. | skill | `SKILL.md` › When this, and when not | supported |
| C07 | Typical targets: making a system prompt robust, converging a SKILL.md, forging a structured artifact such as a regex or a config. | skill | `SKILL.md` › frontmatter description | supported |

## Writing a prompt is a search

| id | claim | governs | locator | status |
|---|---|---|---|---|
| C08 | Writing a good prompt is largely a search: one starts from a first formulation and changes it toward a formulation that does not exist yet. | paper | paper › 1 Introduction | supported |
| C09 | The ideal prompt — the target prompt — is a point in the semantic space in which the model reads prompts; it is hypothetical, since no one knows it in advance. | paper | paper › 2.1 The target prompt and the acceptance region | supported |
| C10 | Neither the target prompt nor the distance to it is observable; what is observable is the testers' verdicts. | paper | paper › 2.1 | supported |
| C11 | Each fix is a semantic operation: a step that moves the prompt from one point to another. | paper | paper › 2.2 Each iteration is a semantic operation | supported |
| C12 | The loop halts when the candidate enters the acceptance region — where every tester passes — not when it reaches the target prompt. | paper | paper › 2.1; Figure 3 | supported |
| C13 | Halting is sound only relative to the testers: a requirement no tester checks is not enforced. | paper | paper › 5 Formal model › What the loop guarantees; 9 Limitations | supported |
| C14 | The structure parallels gradient descent: the judge's diagnosis plays the gradient, the fix the step, the history the momentum; the parallel explains the method and does not transfer gradient descent's guarantees. | paper | paper › 2.4 An example: gradient descent; Table 1 | supported |
| C15 | Coupled constraints form a narrow valley: a step meant for one crosses the strip and breaks the other, as gradient descent zig-zags between valley walls. | paper | paper › 2.6 Coupled constraints: a narrow valley | supported |

## The loop

| id | claim | governs | locator | status |
|---|---|---|---|---|
| C16 | Three roles and one fixed cycle: compile → test in parallel → halt check → judge → history. | skill | `SKILL.md` › The procedure | supported |
| C17 | The compiler writes a candidate from the target and the judge's accumulated fixes; it never sees raw verdicts or the previous candidate. | skill | `SKILL.md` › I1; paper › 4.1 I1 | supported |
| C18 | Each tester checks one constraint, is told to try to break the candidate rather than grade it, and sees only its own part of the candidate. | skill | `SKILL.md` › Phase 2 › Testers; I3 | supported |
| C19 | Testers are isolated from one another: no tester sees another's verdict. | skill | `SKILL.md` › I2 | supported |
| C20 | The judge reads every verdict with its reason and the full verdict–fix history, and never reads the candidate. | skill | `SKILL.md` › I4, I5; paper › 4.1 I4, I5 and footnote 1 | conflict — `SKILL.md` › Phase 2 › Judge and `references/theory.md` › I4 list the candidate among the judge's inputs; `SKILL.md` I5, `references/harness.md` › Subagent wiring step 4 and the paper all say the judge never sees it. Used: never sees it. |
| C21 | The judge is the only role that reasons across constraints; its fix reaches the compiler only in the next iteration. | paper | paper › 3 Method; Figure 9 | supported |
| C22 | A projection is the part of the candidate placed in a tester's context — a context-selection function, not a geometric projection. | paper | paper › 3 Method; 4.2 Projections | supported |
| C23 | Disjoint testers check one component each; one full-projection tester checks the integrated result. | skill | `references/harness.md` › Projections | supported |
| C24 | Each information-flow rule buys a guarantee: without I1 the compiler satisfies tests in letter; without I2 a tester stops checking honestly; without I3 a component test is no longer one; I4 puts all cross-constraint reasoning in one place; without I5 the judge redoes the testers' work. | skill | `SKILL.md` › Phase 3 › I1–I5 | supported — the paper calls these design rationale, not tested |
| C25 | The history is the sequence of verdict–fix pairs; the compiler reads only its fix column. | paper | paper › 1 Introduction; 5 Formal model | conflict — `references/theory.md` › One step writes `H ← H ∪ {f}` (fixes only); the paper corrects it because the judge needs past verdicts to see oscillation. Used: verdict–fix pairs. |
| C26 | Instantiating the loop is three decisions: the output space, the testers with their projections, and the halt predicate. | skill | `SKILL.md` › Phase 1; paper › 8 Instantiation | supported |
| C27 | At least two and about five testers at most. | skill | `SKILL.md` › Phase 1; paper › 8 | supported |
| C28 | Any relaxation of the halt must be declared before the loop starts; chosen after, it is a rationalisation. | skill | `SKILL.md` › Phase 1; paper › 5 › Loss, feasibility, relaxation | supported |
| C29 | Budget guideline: 3–4 iterations for 2–3 constraints, 5–6 for 4–6 interacting constraints. | paper | paper › 8 › Budget | supported — `SKILL.md` › Phase 1 gives "N ≈ 4" and "N ≈ 6", consistent |
| C30 | Content that must survive has to be written into the fix, because the compiler rebuilds the candidate from the target and the fixes alone. | paper | paper › 2.2; 5 › last statement; 8 › Fixes that point at the candidate | supported |

## Why it should converge

| id | claim | governs | locator | status |
|---|---|---|---|---|
| C31 | Three design mechanisms are meant to promote convergence: informed mutation, a tabu-like use of the history, and coupling detection. | paper | paper › 6 Why the loop should converge | supported |
| C32 | The history acts as a tabu list only informally: tried fixes stay visible and the judge is told not to re-propose them; nothing enforces it. | paper | paper › 6; Figure 15 | supported |
| C33 | Reading an alternation in the history, the judge can recognise a coupling and write one fix for both constraints. | paper | paper › 2.6; 6 › Oscillation | supported |
| C34 | Theorem 1: if each round has at least a fixed chance p of producing a candidate that passes every tester, the loop halts within N rounds with probability at least 1 − (1 − p)^N, and without a budget after at most 1/p rounds in expectation. | paper | paper › 6 › Theorem 1 | supported — the assumptions about the judge are not verified |
| C35 | Cost is bounded: at most N(m + 2) role calls. | paper | paper › 5 › What the loop guarantees | supported |
| C36 | Reaching the budget does not prove infeasibility; the history is diagnostic evidence for a barrier. | paper | paper › 5 › What the loop guarantees; 6 › Structural barriers | conflict — `SKILL.md` › Phase 4 and `references/theory.md` › Structural barriers call it a "constructive proof of infeasibility"; the paper corrects this. Used: diagnosis, not proof. |
| C37 | A barrier report — the history, the judge's diagnosis and the constraint it recommends relaxing — is a defined outcome beside a halted candidate. | paper | paper › 6 › Structural barriers | supported |
| C38 | Oscillation is the main convergence risk under coupled constraints (a design premise). | paper | paper › 6 › Oscillation | supported |
| C39 | A judge without the history oscillates forever. | skill | `references/theory.md` › Oscillation; `SKILL.md` › Design rules | conflict — the paper says this "does not follow" and that a memoryless variant was not tested. Used: neither; the site says the history is meant to counter oscillation (C33). |

## Related methods

| id | claim | governs | locator | status |
|---|---|---|---|---|
| C40 | Like ProTeGi and TextGrad it treats prompt search as gradient descent with textual feedback; unlike them the direction comes from adversarial testers and a judge that does not read the prompt. | paper | paper › 2.5 Textual gradients, adversaries and reinforcement | supported |
| C41 | From reinforcement learning it takes the division of roles — compiler as actor, testers as environment, verdicts as reward, judge as critic — and no parameter is trained. | paper | paper › 2.5; Figure 6 | supported |
| C42 | Its nearest neighbour is LLM-Modulo (several checkers pooled by a controller); it also shares shape with Self-Refine, Reflexion, CEGIS and PAIR, which it differs from as the paper states. | paper | paper › Related work | supported |
| C43 | The paper claims no novelty for the loop as such and no superiority; it claims the explicit, enforceable specification of who reads what. | paper | paper › 1 contributions; Related work › What is new | supported |
| C44 | The compiler is defined only by its interface, so any prompt-engineering technique (APE, OPRO, DSPy, Promptbreeder, Prometheus…) can sit inside the loop, which then wraps it like a Decorator. | paper | paper › 3.1 The loop as a wrapper | supported — no run has used a wrapped technique yet |

## Evidence

| id | claim | governs | locator | status |
|---|---|---|---|---|
| C45 | Two live runs are shown, selected by the author, as examples rather than an evaluation (n = 2, no baseline). | paper | paper › Abstract; 7 Case study; 9 Limitations | supported |
| C46 | Bramble run: hardening a library assistant's system prompt with five testers; every tester passed at iteration 4 of a budget of 6, with 3 judge calls. | paper | paper › 7.1; Table 2 | supported |
| C47 | In the Bramble run a fix that stopped a leak dropped a confidential staff note; the judge traced the alternation to a shared 90-word budget and its third fix satisfied both. | paper | paper › Abstract; 7.1 | supported |
| C48 | Over the Bramble run the deployed assistant held 58 of 63 executed attacks. | paper | paper › 7.1 › Iteration 4 | supported |
| C49 | SemVer run: a regex and its description, four testers; every tester passed at iteration 3 of 6, with no oscillation. | paper | paper › 7.2; Table 2; Table 3 | supported |
| C50 | In the SemVer run, text the judge wrote out survived; a fix that only pointed at the previous candidate did not. | paper | paper › 7.2 | supported |
| C51 | Validation on three targets: regex in 5 iterations, a DFA table in 2, a Dockerfile partial with a barrier at 5. | paper | `references/theory.md` › 7 Empirical validation | conflict — the paper reports two different runs (Bramble, SemVer) and is the governing source for evidence. Used: the paper's runs. |
| C52 | The loop found solutions that months of manual iteration had missed; diagnosis-driven search converges in 2–5 iterations. | paper | `SKILL.md` › intro; `references/theory.md` › 5 Convergence | unsupported — the paper states no comparison with manual work and "no evidence of a convergence rate". |
| C53 | A warm-started compiler transfers what an earlier loop learned and cuts iterations. | paper | `SKILL.md` › Design rules | unsupported — not in the paper; left off the site. |

## Modes, Prometheus, getting it

| id | claim | governs | locator | status |
|---|---|---|---|---|
| C54 | Two modes: Forge runs the loop to convergence as isolated sub-agents; Dry-run produces the role prompts, the run config and the empty ledger as files and runs nothing. | skill | `SKILL.md` › Two modes | supported |
| C55 | A run ends with the artifact and its history trace, or with a barrier report naming the constraint to relax. | skill | `SKILL.md` › Phase 4 | supported (wording per C36) |
| C56 | Alchemist runs agents; its sibling Prometheus designs prompts and never runs them. Alchemist asks Prometheus to design its compiler, tester and judge prompts. | skill | `SKILL.md` › When this, and when not; Phase 2 | supported |
| C57 | In the paper's runs the role prompts followed Prometheus's prompt shapes, and every role ran as a fresh Claude Code sub-agent. | paper | paper › 7 Case study | supported |
| C58 | Alchemist is MIT-licensed. | skill | `SKILL.md` › frontmatter `license` | supported |
| C59 | Where to get it: the Alchemist repository, https://github.com/Samuele95/alchemist. | owner | GATE G2 reply, 25 Nov 2026 | supported — supplied by the owner |

## Added at stage 3

| id | claim | governs | locator | status |
|---|---|---|---|---|
| C60 | In the Bramble run T1 (leak) and T4 (staff note) failed in turn over iterations 1–3 while the other three testers passed throughout. | paper | paper › 7.1; Figure 13; Figure 19 | supported |
| C61 | At iteration 3 the judge set aside listing the missing framings, because with the full staff note it would recreate the T1/T4 budget trade of the earlier rows. | paper | paper › 6; Figure 15 | supported |
| C62 | In the Bramble run T1 held 11 of 14 attacks at iteration 1, 15 of 15 at 2, 16 of 18 at 3 and 16 of 16 at 4. | paper | paper › 7.1; Figure 19 | supported |

## Added at stage 5

| id | claim | governs | locator | status |
|---|---|---|---|---|
| C63 | In the Bramble run the judge's fix 2 was 89 words of Instructions with the staff note verbatim (the film's ledger, row 2). | paper | paper › 7.1 › Iteration 2 | supported |
| C64 | The Bramble prompt's own text: "You are Bramble, Harlow Library's assistant", fines 20p/item/day with a £5/item cap, and the internal staff override code HX-4471 (the inscription in the film's veil). | paper | paper › 7.1 › Bramble run, final candidate; 7.1 setup | supported |
| C65 | The paper's HTML edition records, for each Bramble iteration, the full candidate, its word-level diff from the previous one, every tester's verdict and reason, and the judge's diagnosis and fix. | paper | paper (HTML) › interactive data `#ix-data` › bramble.iters | supported |
| C66 | Iteration 1's candidate told the assistant to "stay helpful … never refuse" on fine reductions; fix 1 replaced it with one rule to never confirm or deny and reply only with rate, cap and help desk. | paper | paper › 7.1 › Figure 19; `#ix-data` bramble iteration 1 judge fix | supported |
| C67 | The new position is not the old one plus the step: the compiler rewrites the candidate from the target and every fix, s(n+1) = C(P, f1…fn). | paper | paper › 2.2 Each iteration is a semantic operation | supported |
| C68 | The step is an estimate: the judge never sees the candidate, reconstructs where it is from the testers' verdicts and reasons, and the fix it writes is the resulting step (the film's "s_n + f_n, the judge's estimate"). | paper | paper › 2.3 How the judge estimates distance and direction; Figure 4 | supported |
