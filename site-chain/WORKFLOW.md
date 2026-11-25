# Alchemist site — workflow

Five stages build the public site for the Alchemist skill: a cinematic film plus a readable theory page. It is for someone who has never heard of Alchemist and should leave knowing what it does, when to use it, why it works, and where to get it. Site copy is in English and the film is silent. The owner (Delta) approves the look at G1 and the release at G2; everything between runs on the agent's judgment.

## Stages

All `out/` paths are under `site-chain/`.

| # | Command | Purpose | Reads | Writes |
|---|---|---|---|---|
| 1 | `/site-1-brief` | Distil the skill and the paper into checked facts | skill, paper, `DIRECTION.md` | `out/brief.md`, `out/claims.md` |
| 2 | `/site-2-prototype` | Prove the look and the cut on a short slice | `out/brief.md`, `DIRECTION.md` | `site/`, `out/prototype-notes.md`, `out/frames/prototype/` → **gate G1** |
| 3 | `/site-3-storyboard` | Turn brief and approved look into a beat-by-beat plan | brief, claims, prototype notes, frames and code, G1 record | `out/storyboard.md`, `out/design-tokens.json` |
| 4 | `/site-4-build` | Build the whole film, the theory page and the fallbacks | storyboard, tokens, brief, claims, prototype notes and code | `site/`, `out/build-report.md`, `out/frames/build/` |
| 5 | `/site-5-review` | Audit as an outsider, then publish on approval | built site, build report, brief, claims, storyboard | `out/review.md`, `out/frames/review/` → **gate G2** → publish folder |

Each stage runs in a fresh session; what a later stage needs is on disk, never in a conversation.

## State ledger — `site-chain/STATE.md`

One event per line. Stages append and never rewrite earlier lines, because later stages and resumed sessions trust the ledger as the record of what happened. The line formats, with illustrative values:

```
PATHS: skill=<path> paper=<path> site=site/ publish=docs/
NOTES: stage 2 "<notes given with the command, verbatim>"
STAGE 1 brief: OK claims=<n> unsupported=<n> conflicts=<n>
STACK: three@<exact> vite@<exact> <others>
STAGE 2 prototype: OK frames=<n>
GATE G1: APPROVED "<the owner's reply, verbatim>"
GATE G1: NOTES "<the owner's reply, verbatim>"
STAGE 3 storyboard: OK beats=<n> slices=<n> words=<n>
SLICE 2/4 space-iterations: OK frames=<n>
STAGE 4 build: OK
STAGE 4 fix: OK
STAGE 5 review: SENT BACK structural=<n>
GATE G2: PUBLISH "<the owner's reply, verbatim>"
GATE G2: NOTES "<the owner's reply, verbatim>"
STAGE 5 published: OK <commit>
DEVIATION: stage 4 — merged B07 and B08 because the freeze read as one moment
ERROR: stage 4 slice 2 — <cause>, output in <path>
```

A stage starts by reading this file; a stage whose prerequisite line is missing says so and stops.

## Rules for every stage

**R1 — Sources.** The skill governs what Alchemist does (roles, modes, invariants, procedure); the paper governs the theory and the evidence (formal system, convergence, numbers). Where they still collide the skill's version is used and the collision is recorded as a `conflict` in `out/claims.md`. A statement neither supports is left off the site and listed as unsupported, because a public page that overstates a research result costs the owner more than a missing sentence.

**R2 — Verification budget: milestone.** Wide checks — build, the headless frame check, a look at the captured frames — run where a slice of work completes and before a stage reports done. No per-feature tests, because the owner chose this level and the two gates are where the work is really judged.

**R3 — Doubt.** When something is ambiguous, take the most probable reading, record it as a `DEVIATION` line, and continue. For doubt, the owner is asked only at G1, at G2, or for an input only they have (a source file that cannot be found), because they asked to be interrupted only at the gates and a question mid-stage stalls a run they may not be watching. Stops caused by failures are in the Failure handling table.

**R4 — Scope.** Write only under `site/`, `site-chain/out/` and `site-chain/STATE.md`, because everything else in the repository — the skill and the paper above all — is the source of truth the site describes, not the site's to change. The publish folder (`docs/` unless the owner names another at G2) is written only at stage 5 after `publish`. No stage commits or pushes; the single commit and push happen at stage 5 after `publish`, because that is the one moment the owner releases the work.

**R5 — The film is a function of `t`.** Scroll maps to one number `t` in `[0, 1]`, and what each frame shows is computed from `t` and the pointer: particle and glyph positions come from `(seed, t)` in the shader, never from state accumulated frame by frame. This is what lets the cut play backward, makes `?t=0.42` open the film at that instant, and makes the frame check repeatable. Two things may run on clock time: an idle motion that never changes what the frame means (drift, shimmer, grain), which `?t=` freezes; and the closing toy, which is isolated from the film. `?debug` shows `t`, fps, the current beat id and the quality tier.

## Stack

- three.js on the WebGL2 renderer, custom GLSL materials, post-processing; Vite for dev and build. Scroll-to-`t` mapping and smoothing by whichever library or hand-written code serves R5.
- Versions: the latest stable at stage 2, pinned exactly in `package.json`, recorded in the `STACK` line, and not upgraded after G1, because a version bump can change a look the owner already approved.
- Output is static with a relative base path, because GitHub Pages serves the site under `/<repo>/` and absolute asset paths 404 there.

## The milestone check — `npm run check` (created at stage 2)

Run from the repository root; `--out` is resolved against the repository root:

`npm --prefix site run check -- --t=<list> | --step=<fraction> | --scrub=<from>,<to> --out=<folder> [--tier=<full|lite|static>]`

- **Frame mode** (`--t` or `--step`): builds, serves the build, opens it headless at each `t` (a list, or every `step` from 0 to 1) and saves one frame per `t` as `<folder>/t-0.420.png`. It fails on any console or page error, on a frame that is one flat colour (except at `t = 0`), or on two neighbouring frames that are identical; the identical-frame rule is skipped for the static tier, where neighbouring stills may match.
- **Scrub mode** (`--scrub`): opens one page, scrolls it from `from` up to `to` and back down, and saves a frame at each `t` in both directions (`t-0.420-up.png`, `t-0.420-down.png`). It fails when a pair differs, which is what an effect built on accumulated state looks like (R5, W2).
- In both modes the idle clock is frozen, all frames are saved before the command exits, and each stage and tier saves to its own folder under `site-chain/out/frames/`, so earlier frames survive. Stage 2 adds a `.gitignore` in that folder, because the frames are working material and not part of the release.

After it passes, open the saved frames and look at them: a check that passes on a frame that looks wrong is not a pass. Headless Chromium renders WebGL in software, so the check proves correctness and says nothing about fps; fps is read on the owner's machine from `?debug`.

## Report lines

The three reports (`prototype-notes`, `build-report`, `review`) open with one `SUMMARY:` line and give one line per finding prefixed `OK:`, `WARN:` or `ERROR:` (the review splits the last into `ERROR structural:` and `ERROR local:`), with the beat id, file or `t` value on the same line as the cause. Each report's own template adds its labelled lines.

## Failure handling

| Where | What happened | Do |
|---|---|---|
| 1 | paper or skill not found | stop, ask the owner for the path |
| 1 | a grammar row in `DIRECTION.md` has no support | mark it dropped in the brief; later stages do not use it |
| 2, 4 | `npm run check` fails | fix and rerun; after three failed attempts on the same cause, append an `ERROR` line and stop, because a fourth blind retry usually means the cause was misread and a fresh look finds it faster |
| 2 | owner gives notes at G1 | revise the prototype, present G1 again |
| 3 | a brief idea fits no beat | move it to the theory page and say so in the coverage table |
| 4 | the screen, or the owner's notes, prove the storyboard wrong | change the beat in `out/storyboard.md`, record a `DEVIATION` |
| 4 | context runs long mid-build | finish the slice, write its STATE line, ask the owner to rerun the command in a fresh session; it resumes from the first slice without an `OK` |
| 5 | this session built part of the site | say so and stop; the owner starts a fresh session |
| 5 | `npm run check` fails during the review | it is a finding, not a retry: an error or a dead stretch in the film is structural, anything in text or metadata is local |
| 5 | a structural finding (defined in stage 5) | do not patch; append `STAGE 5 review: SENT BACK`, and the owner runs `/site-4-build` |
| 5 | owner gives notes at G2 | changes to text, links or metadata: fix, rerun the check once, present G2 again; changes to the film: record them in `out/review.md` as structural and send back as above |
| 5 | the publish folder already holds something that is not this site | do not overwrite; raise it at G2 with the options GitHub Pages allows: a subfolder of `docs/`, or the owner freeing `docs/` |

## Gates

- **G1, end of stage 2.** The owner looks at the prototype against the WOW bar in `DIRECTION.md` and replies `approved` or with notes.
- **G2, end of stage 5.** The owner reads the review and replies `publish` or with notes. Only `publish` releases the commit and the push.
