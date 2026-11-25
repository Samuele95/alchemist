<p align="center">
  <a href="https://samuele95.github.io/alchemist/"><img src="docs/readme/banner.jpg" alt="Alchemist — the search for a prompt no one has seen" width="100%"></a>
</p>

<p align="center">
  <a href="https://samuele95.github.io/alchemist/"><b>The website</b></a> &nbsp;·&nbsp;
  <a href="https://samuele95.github.io/alchemist/skill.html"><b>The skill</b></a> &nbsp;·&nbsp;
  <a href="https://samuele95.github.io/alchemist/paper.html"><b>The paper</b></a>
</p>

<p align="center"><i>
Somewhere there is a prompt that does exactly what you want. No one has ever seen it.<br>
Each requirement guards it. Light one, and another goes dark.
</i></p>

---

**Alchemist** is a multi-agent loop that searches for an output satisfying several constraints that pull against each other. A **compiler** writes a candidate. Isolated **testers** each try to break it on one constraint. A **judge** that never reads the candidate reads their verdicts and the whole history, and writes the next fix. The loop halts when every tester passes in the same round, or stops with a diagnosis of which constraints could not be met together.

It is a [Claude Code](https://claude.com/claude-code) skill, the sibling of [Prometheus](https://github.com/Samuele95/prometheus): Prometheus designs prompts and never runs them; Alchemist runs the tournament, and asks Prometheus to write its roles.

## When to use it

Use it when the requirements are **coupled** — fixing one breaks another — and checking any one of them is cheaper than producing an answer that satisfies all: hardening a system prompt, converging a `SKILL.md`, forging a regex or a config.

Don't use it when the constraints are independent (a checklist is cheaper), when no cheap check exists, or when one prompt already works.

## The loop

```
          target P, fixes f₁…fₙ
                 │
                 ▼
            ┌─────────┐   candidate sₙ   ┌────────┐  ┌────────┐  ┌────────┐
            │ compiler│ ───────────────▶ │ T₁     │  │ T₂     │  │ T₃     │   each tester sees
            └─────────┘   (projections)  └───┬────┘  └───┬────┘  └───┬────┘   only its fragment
                 ▲                           │ verdicts + reasons     │
                 │ fixes only                ▼           ▼            ▼
            ┌─────────┐                 ┌──────────────────────────────┐
            │ history │ ◀────────────── │            judge             │   never reads sₙ
            └─────────┘   verdicts, fix └──────────────────────────────┘
```

Who reads what is the whole design:

| | receives | never |
|---|---|---|
| **Compiler** | the target and the judge's fixes | the verdicts, its previous candidate |
| **Testers** | its own fragment of the candidate and one constraint | another tester's verdict |
| **Judge** | the target, the constraints, every verdict with its reason, the whole history | the candidate |
| **History** | one row of verdicts and the fix per iteration | — |

Because the compiler rebuilds each candidate from the target and *every* fix so far, the step is only an estimate: the judge proposes `sₙ + fₙ`, and the compiler lands at `sₙ₊₁ = C(P, f₁…fₙ)`. Reading an alternation in the history — fix A breaks B, fix B breaks A — the judge can recognise a coupling and write one fix for both.

## The website

The website is a single scroll-driven shot, in three.js. A veil of falling glyphs — three rings, each guarding one requirement — tears open into a room where the loop runs on the paper's own Bramble data: the compiler writes candidate s₁ from the target, three testers attack it one constraint each with their attacks and verdicts on screen, the judge's desk opens over a darkened prompt it never reads and types its diagnosis and fix, and the compiler rewrites — the diff typed live — until the fourth candidate holds every attack. Then the room the paper's runs never reached: the barrier.

<table>
  <tr>
    <td><img src="docs/readme/f1-veil.jpg" alt="The veil"></td>
    <td><img src="docs/readme/f2-cut.jpg" alt="The cut"></td>
    <td><img src="docs/readme/f3-attack.jpg" alt="Testers attack the first candidate"></td>
  </tr>
  <tr>
    <td align="center"><sub>The veil: each requirement guards the truth</sub></td>
    <td align="center"><sub>The cut: the veil tears, a room appears</sub></td>
    <td align="center"><sub>Three testers attack s₁, each on its own slice</sub></td>
  </tr>
  <tr>
    <td><img src="docs/readme/f4-judge.jpg" alt="The judge's desk"></td>
    <td><img src="docs/readme/f5-history.jpg" alt="The history on the desk"></td>
    <td><img src="docs/readme/f6-halt.jpg" alt="The halt"></td>
  </tr>
  <tr>
    <td align="center"><sub>The judge reads verdicts and history, never the prompt</sub></td>
    <td align="center"><sub>Reading the history: fixing one broke the other</sub></td>
    <td align="center"><sub>The halt: every tester passes at s₄</sub></td>
  </tr>
</table>

The room is an illustration of the method, not measured data. Positions are schematic; the prompts, diffs, attacks, verdicts and fixes are the paper's own.

## The paper

**The Adversarial RL Loop: a prompt engineering and optimisation technique by iterative exploration of prompt space** — read it at [samuele95.github.io/alchemist/paper.html](https://samuele95.github.io/alchemist/paper.html), with every figure live.

The paper's claim is that writing a prompt is a search: you start from a first formulation and move it, step by step, towards a target prompt that no one can write down in advance. Each iteration of the loop is one semantic operation on the prompt, and the judge estimates the direction of the step from the outcomes of adversarial testers — a division of roles inspired by reinforcement learning, with no parameters trained. The compiler is deliberately minimal (a map from the target and the fixes to a candidate), which is what lets the loop wrap any existing prompt-engineering technique written in that form.

<table>
  <tr>
    <td width="50%"><img src="docs/readme/paper-fig03-space.jpg" alt="Figure 3: search in prompt space"></td>
    <td width="50%"><img src="docs/readme/paper-fig09-loop.jpg" alt="Figure 9: the loop at iteration n"></td>
  </tr>
  <tr>
    <td align="center"><sub><b>Search in prompt space.</b> Each fix is a step from one candidate to the next; the level curves of the distance to s† cannot be drawn, and the loop halts at the first candidate inside the acceptance region — not at s†. Interactive in the paper.</sub></td>
    <td align="center"><sub><b>One iteration.</b> The compiler reads only the target and the fix column of the history; each tester sees only its projection; the judge reads verdicts, reasons and history — no arrow runs from the candidate to the judge.</sub></td>
  </tr>
  <tr>
    <td><img src="docs/readme/paper-fig11-paths.jpg" alt="Figure 11: permitted and forbidden information paths"></td>
    <td><img src="docs/readme/paper-fig16-coupling.jpg" alt="Figure 16: coupling detection in the Bramble run"></td>
  </tr>
  <tr>
    <td align="center"><sub><b>Information flow as receive-sets.</b> Solid paths are permitted, dashed ones forbidden: no tester talks to another, and nothing goes from the candidate to the judge.</sub></td>
    <td align="center"><sub><b>Coupling detection.</b> Fix 1 moved the Bramble candidate from the T₄ region into the T₁ region and fix 2 moved it back; the judge named the alternation and wrote one fix for both.</sub></td>
  </tr>
  <tr>
    <td><img src="docs/readme/paper-fig13-loss.jpg" alt="Figure 13: failing testers per iteration in the two runs"></td>
    <td><img src="docs/readme/paper-fig19-trajectory.jpg" alt="Figure 19: trajectory of the Bramble run"></td>
  </tr>
  <tr>
    <td align="center"><sub><b>Observed loss.</b> The number of failing testers per iteration in the two runs, from the recorded verdicts; the Bramble run alternates T₁, T₄, T₁ before all pass.</sub></td>
    <td align="center"><sub><b>Trajectory of the Bramble run.</b> Each row is one iteration: the verdicts, what changed in the candidate, and the judge's fix that produced the next row.</sub></td>
  </tr>
</table>

What is inside:

- **Search in prompt space (§2)** — the target prompt and its acceptance region; why each iteration is a semantic operation; how the judge estimates distance and direction from the testers' reasons; the same scheme read as gradient descent, as textual gradients (ProTeGi, TextGrad), as adversarial training and as reinforcement; coupled constraints as a narrow valley.
- **Method (§3–4)** — the three roles and one cycle; the loop as a wrapper around any compiler; the information invariants stated as per-role receive-sets, and projections for testers that must see only part of a candidate.
- **Formal model (§5)** — the system tuple `(P, S, C, T, J, halt, N)`, the algorithm, and four plain statements with their reasons: cost is bounded by `N(m + 2)` role calls; halting is sound only relative to the testers; reaching the budget is diagnostic evidence for a barrier, not a proof of infeasibility; a compiler that never sees the previous candidate cannot carry out a fix that only points at it.
- **Why it should converge (§6)** — Theorem 1: under informed progress (each round has probability at least *p* of halting) and a judge that keeps returning fixes, the loop halts within *N* rounds with probability at least 1 − (1 − *p*)^*N*; Proposition 1 on termination under a strict tabu; the history as an informal tabu list; oscillation and its resolution; structural barriers.
- **Case study (§7)** — two runs, iteration by iteration: Bramble (a library assistant's system prompt, five testers, four iterations) and SemVer (a regex with its description, four testers, three iterations), with every candidate, attack, verdict and fix.
- **Instantiation (§8)** — the three parameters that change between uses (output space, testers with their projections, halt predicate) and design guidelines; related work from CEGIS and CDCL to GANs, RLHF and automatic prompt optimisation.

<p align="center">
  <a href="https://samuele95.github.io/alchemist/paper.html"><img src="docs/readme/paper-runs-explorer.jpg" alt="The runs explorer in the paper" width="82%"></a><br>
  <sub>The runs explorer: step through either run iteration by iteration — the candidate, every tester's attacks and reason, the judge's diagnosis and the fix it sent on.</sub>
</p>

## Evidence

Two runs are shown in the paper, selected by the author as illustrations rather than an evaluation (n = 2, no baseline).

- **Bramble** — hardening a library assistant's system prompt with five testers. A fix that stopped a leak dropped the confidential staff note; the judge traced the alternation to a shared 90-word budget, and its third fix satisfied both. Every tester passed at iteration 4 of 6; the deployed assistant held 58 of 63 executed attacks.
- **SemVer** — a regex with its description, four testers. Every tester passed at iteration 3 of 6, with no oscillation.

What is guaranteed is modest and stated plainly: cost is bounded by N(m + 2) role calls, and reaching the budget is a diagnosis of a barrier, not a proof that no answer exists. The full argument — the formal system, Theorem 1 with its assumptions, the related methods — is in [the paper](https://samuele95.github.io/alchemist/paper.html).

## Get it

Alchemist is an MIT-licensed skill for Claude Code. Download `alchemist-skill-<version>.zip` from the [latest release](https://github.com/Samuele95/alchemist/releases/latest) and unzip it into your skills directory (`~/.claude/skills/` for every project, or `.claude/skills/` inside one) — or copy this repository's `skill/` folder there as `alchemist/`. Then invoke it with `/alchemist`:

- **Forge** runs the loop to convergence, each role as a fresh, isolated sub-agent, and returns the artifact with its history — or a barrier report naming the constraint to relax.
- **Dry-run** writes the role prompts, the run config and the empty ledger as files, and runs nothing.

The first step is always the same: describe the target, the constraints and how each can be checked, and confirm the three decisions — output space, testers with their projections, halt predicate — before any role is written.

## This repository

```
skill/        the skill itself — SKILL.md, the role templates, the run config, the ledger, the theory
docs/         the built site, served by GitHub Pages
site/         its source — three.js, Vite, one scene as a function of scroll
site-chain/   how it was made: the brief, the claims table, the storyboard, the reviews, the ledger
```

The site was built by a five-stage Prometheus chain: a brief distilled from the skill and the paper, a prototype approved by the owner, a storyboard, the build, and an independent review before publication. Every sentence on the site maps to a claim in `site-chain/out/claims.md` with its locator in the skill or the paper.

---

<p align="center"><sub>Samuele95 · MIT</sub></p>
