# Brief — the Alchemist site

Every paragraph ends with the claims it rests on (`claims.md`). Sections 1–3 and 10 are for a visitor with thirty seconds; 5–8 for one who stays.

## 1. One sentence

Alchemist is a multi-agent loop that searches for an output satisfying several constraints that pull against each other, by letting isolated testers attack each candidate and a judge read their verdicts to choose the next step. (C01, C02, C18, C20)

## 2. What you get

A run ends one of two ways. Either every tester passes and you get the artifact together with its history — the sequence of verdicts and fixes that shows how the search found it — or the run stops with a barrier report: the history, the judge's diagnosis of which constraints could not be met together, and the one it recommends relaxing. A barrier report is a diagnosis, not a proof that no answer exists. (C55, C37, C36)

## 3. When to use it, and when not

Use it when the requirements are coupled — fixing one breaks another — and checking any one of them is cheaper than producing an answer that satisfies all: hardening a system prompt, converging a SKILL.md, forging a regex or a config. Don't use it when the constraints are independent (a checklist is cheaper), when no cheap check exists, or when one prompt already works. (C02, C04, C05, C06, C07)

## 4. The problem

Writing a prompt that really does what you want is a search for a formulation no one has seen yet. When requirements interact, the search goes in circles: the fix that stops a leak drops a confidential note, the fix that restores the note reopens the leak. In the geometry of the paper, two coupled constraints leave only a narrow strip where both hold, and a step aimed at one crosses the strip and lands on the far side. (C08, C02, C03, C15, C47)

## 5. The loop

Three roles in a fixed cycle. The compiler writes a candidate from the target and the judge's accumulated fixes, never seeing raw verdicts or the previous candidate, so it cannot write to the letter of one test. Each tester gets only its own part of the candidate and one constraint, and is told to break it, not grade it; testers never see each other. The judge reads every verdict, every reason and the whole verdict–fix history, and never reads the candidate itself; it is the only role that reasons across constraints, and its fix reaches the compiler in the next round. The loop stops when every tester passes in the same round. (C16, C17, C18, C19, C20, C21, C24)

Instantiating it takes three decisions — what the compiler may produce, which testers see which part, and the halt condition — with two to about five testers, any relaxation declared before the start, and a budget of 3–4 rounds for 2–3 constraints or 5–6 for 4–6. Because the compiler rebuilds each candidate from scratch, anything that must survive has to be written into the fix itself. (C26, C27, C28, C29, C30, C22, C23)

## 6. Why it works

The paper reads the loop as a search in prompt space. The perfect prompt is a hypothetical point that no one can see, and the distance to it cannot be measured. What can be seen is the testers' verdicts, and the place where all of them pass is the acceptance region. Each fix is a step through that space. The loop halts on entering the acceptance region, not on reaching the hidden target, so its answer is only as good as its testers. (C09, C10, C11, C12, C13)

The parallel is gradient descent: the judge's diagnosis plays the gradient, the fix the step, the history the momentum. The parallel explains the method; it does not carry gradient descent's guarantees. Three mechanisms are meant to drive the search: informed fixes instead of random ones, a history that works as an informal tabu list, and coupling detection — reading an alternation in the history and writing one fix for both sides. (C14, C31, C32, C33, C38)

What is guaranteed is modest and stated plainly. Cost is bounded by N(m + 2) role calls. If each round has at least a fixed chance p of producing a passing candidate, the loop halts within N rounds with probability at least 1 − (1 − p)^N; whether a real judge meets that assumption is not shown. Reaching the budget does not prove that no answer exists. (C35, C34, C36)

## 7. How it relates to known methods

Like ProTeGi and TextGrad it treats prompt search as descent with textual feedback, but the direction comes from adversarial testers and from a judge that never reads the prompt. From reinforcement learning it borrows the division of roles: the compiler as actor, the testers as environment, the verdicts as reward, the judge as critic. No parameter is trained. Its nearest neighbour is LLM-Modulo. Because the compiler is defined only by its interface, any prompt-engineering technique can sit inside the loop and be wrapped by it. The paper claims no novelty for the loop itself, only the explicit specification of who reads what. (C40, C41, C42, C43, C44)

## 8. Evidence

Two runs are shown, selected by the author: illustrations, not an evaluation (n = 2, no baseline). In the Bramble run, a library assistant's system prompt with five testers, a fix that stopped a leak dropped the confidential staff note. The judge read the alternation in the history, traced it to a shared 90-word budget, and its third fix satisfied both. Every tester passed at iteration 4 of 6, and the deployed assistant held 58 of 63 executed attacks. In the SemVer run, a regex with its description and four testers, every tester passed at iteration 3 of 6. That run also showed that text the judge writes out survives, while a fix that only points at the previous candidate does not. (C45, C46, C47, C48, C49, C50)

## 9. Alchemist and Prometheus

Prometheus designs prompts and never runs them; Alchemist runs the tournament. Alchemist asks Prometheus to write its compiler, tester and judge prompts, and the paper's runs used Prometheus's prompt shapes with every role as a fresh Claude Code sub-agent. Alchemist has two modes: Forge runs the loop to the end, Dry-run hands you the role prompts, the config and the empty ledger without running anything. (C56, C57, C54)

## 10. Get it

MIT-licensed skill for Claude Code; the first step is to describe the target, the constraints and how each can be checked, and confirm the three decisions before any role is written. The repository link is still to come (C59, unsupported). (C58, C26)

## 11. Grammar check — `DIRECTION.md` visual grammar against the sources

| row | result | claims | note |
|---|---|---|---|
| candidate `s` → a bright point | kept | C11, C12 | the paper's own figures draw candidates as points |
| output space `S` → bounded volume | kept | C09, C26 | |
| constraint / tester → a surface, passing side lit | kept | C10, C12 | paper Figure 4 draws each tester as a boundary |
| projection → shadow on the tester's own plane | reworded | C22 | the paper stresses a projection is context selection, "not a projection in the linear-algebra sense". Draw it as a fragment of the candidate's text carried to each tester's isolated plane, not as a cast shadow |
| verdict → gild / tarnish | kept | C18 | verdicts carry a reason; show a line of reason text with each |
| judge → the freeze, diagnosis vector drawn | reworded | C20, C21 | the judge never sees the candidate: in the freeze the candidate point goes dark and only the verdicts, reasons and the history thread stay lit |
| history `H` → thread + glyph columns | kept | C25 | columns are verdict–fix pairs |
| fix → vector to the next point | reworded | C11, C30 | the compiler rebuilds from the target and all fixes, so the new point is reached along the whole path, not by adding the last vector alone; the thread redraws from the origin |
| oscillation → zig-zag, repeated-frame glitch | kept | C03, C15, C33, C47 | draw the two surfaces as the walls of a narrow strip (paper Figure 7) |
| target prompt `s†` → faint star never reached | kept | C09, C10, C12 | the paper's level curves are "dotted", "which no one can actually draw" |
| tabu effect → burned regions | kept | C32 | informal; nothing enforces it |
| convergence → enters the region where every surface is lit | kept | C12, C13 | halts at the acceptance region, short of the star |
| barrier → surfaces close, the one to relax is marked | reworded | C36, C37 | a diagnosis, not a proof: the copy says "diagnosed", never "proved impossible" |
| the toy | kept | C15, C33 | labelled a simulation |

## 12. Unsupported — left off the site

- C52: "found solutions months of manual iteration had missed" and "2–5 iterations" as an empirical rate. The paper makes neither claim.
- C53: warm-starting the compiler transfers learning. This is not in the paper.
- C59: the repository link. It does not exist yet.
- Conflicts resolved toward the paper: C20 (the judge never sees the candidate), C25 (the history holds verdict–fix pairs), C36 (a barrier is a diagnosis, not a proof), C39 (the memoryless-judge claim is dropped), C51 (the evidence is the paper's two runs).
