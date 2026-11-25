# Alchemist site — state ledger

Append one line per event; never rewrite earlier lines. Format: `site-chain/WORKFLOW.md`, State ledger.

PATHS: skill=skill/ paper=paper/Adversarial_RL_Loop.html site=site/ publish=docs/
NOTES: owner, before stage 1 "i do not like the alchemy laboratory idea. substitute it with a matrix-alchemy mixture (with alchemy i would like to focus on the esoteric approach, the mistery, the SEARCH OF TRUTH)" — applied to DIRECTION.md and stage 2/3 prompts
DEVIATION: stage 1 — workspace stands in for the Alchemist repo (none on GitHub yet); paper text extracted from the HTML to site-chain/out/paper.txt for reading
STAGE 1 brief: OK claims=59 unsupported=3 conflicts=6
DEVIATION: stage 1 — previous STAGE 1 line miscounted conflicts; correct counts: claims=59 unsupported=3 conflicts=5
STACK: three@0.187.0 vite@8.3.8 playwright-core@1.65.1 pngjs@7.0.0 @fontsource/cinzel@5.3.0 @fontsource/cormorant-garamond@5.3.0 @fontsource/ibm-plex-mono@5.3.0 @fontsource/noto-sans-symbols@5.3.0
DEVIATION: stage 2 — the slice follows the Bramble run from the paper (T1 leak, T2 usability, T4 staff note; positions schematic) so its two iterations show a real oscillation
DEVIATION: stage 2 — hosted copy for G1 published as a private artifact; it reads #t-0420 / #debug because hosted pages pass no query string
STAGE 2 prototype: OK frames=6
GATE G1: APPROVED "TOTALLY APPROVED. IT IS MAGNIFICENT"
DEVIATION: stage 3 — added C60, C61 (supported, with locators) to claims.md; the film shows all four Bramble iterations
STAGE 3 storyboard: OK beats=19 slices=4 words=298
SLICE 1/4 veil: OK frames=5
SLICE 2/4 loop: OK frames=6
DEVIATION: stage 4 — added C62 (per-iteration T1 counts, paper Figure 19) for the tester labels and the theory table
DEVIATION: stage 4 — B11 verdict timing moved earlier and the B13 and B16 camera keys re-framed after looking at the slice frames; storyboard beats unchanged
DEVIATION: stage 4 — static-tier stills are bare renders of each beat midpoint (site/public/stills); B01 is black there by design, its copy sits below
DEVIATION: stage 4 — code written in one pass, then checked slice by slice; slices 3 and 4 checked together after the last fixes
SLICE 3/4 convergence: OK frames=4
SLICE 4/4 outcomes: OK frames=4
STAGE 4 build: OK
STAGE 5 review: SENT BACK structural=1
STAGE 4 fix: OK
STAGE 5 review: SENT BACK structural=1
DEVIATION: stage 4 fix 2 — static stills re-rendered from the fixed build (site/public/stills, share.jpg); label hide margin tightened to the frame; tester labels hidden from t 0.80 (the sealed room); P label fades after the valley step
STAGE 4 fix: OK
DEVIATION: stage 5 — B14 still re-rendered from the current build (review warning: stale still); share.jpg from the same frame
GATE G2: NOTES "Put in the film: a visualization of the various components (Compiler, Testers, Judge) doing their job; a visualization of the actual prompt search in the space THROUGH PROMPT TUNING AND OPTIMIZATION (a point in the semantic space which, extended, becomes a prompt; that prompt gets tuned and tweaked by the judge and we move in a further position of the semantic space - as an algebraic vector operation - and from there it becomes a new input for the compiler). Put in the reading: the whole set of figures, with same interactivity, from the Adversarial RL Loop paper; the whole paper content as a pure theoretical source; the reading split into two menus: a skill description (summary of the theory and the associated proceedings) and the full theory display, with the whole paper. Check if it is valuable to put in the film some 3D interactions and cinematic components associated to the paper figures and content, especially the architecture (the adversarial loop of Compiler-Testers-Judge with history till convergence) and the semantic space visualization operations."
STAGE 5 review: SENT BACK structural=4
DEVIATION: stage 4 fix 3 — four holds inserted (B06b, B07b, B10b, B13b), storyboard revised; reading split into skill.html and paper.html; claims C65–C67 added
STAGE 4 fix: OK
DEVIATION: stage 5 — local fixes: paper.html favicon link moved into <head> (404 on /favicon.ico); B07b panel legend no longer claims edits on the first draft (main.js); C68 added to claims.md (the judge's estimate, paper › 2.3, Figure 4); dist rebuilt by the check
STAGE 5 review: SENT BACK structural=1
DEVIATION: stage 4 fix 4 — B10b/B13b play the step as an operation (s_n, arrow f_n, estimate s_n + f_n, real s_{n+1} = C(P, …), compiler inputs pulsing) before the prompt unfolds; labels on chips; all 23 stills re-rendered from this build
STAGE 4 fix: OK
GATE G2: PUBLISH "publish" (repository: https://github.com/Samuele95/alchemist)
PATHS: skill=skill/ paper=paper/Adversarial_RL_Loop.html site=site/ publish=docs/ (repository Samuele95/alchemist, branch main)
STAGE 5 published: OK 040a144
NOTES: owner, 25 Nov 2026 after publication "The website visualization needs some fixes: the intro scene with the three symbols looks broken; some parts overlap or go off page; the website is too cryptic, it does not properly visualize what the framework actually does. The explanation must be visual: the cinematic and animations must be coherent with the skill job."
DEVIATION: stage 4 fix 5 — intro regression found and fixed: station glyph meshes shared the field's uFade uniform and zeroed it off screen, blanking the glyph rain and the inscription; each glyph mesh now has its own fade
GATE G1b: OPEN — a second prototype (one literal iteration: candidate scroll, three attackers, judge, rewrite) before the film is reshaped around the loop; owner approved building it ("yes")
STAGE 2b prototype (loop.html): OK frames=8 — one literal iteration of the Bramble run: candidate scroll (real text, leaked line lit), three attackers with the paper's recorded attacks and outcomes, the scroll dark for the judge, verdicts + diagnosis + fix typed, the rewrite with its edits, the note crack opening; checked at 1280×720, inside the frame
GATE G1b: APPROVED "approved" — the literal loop grammar (scroll, attackers, judge, rewrite) is the film's grammar from here

## 2026-11-25 — build v2 (literal loop) + review round 1
- Rebuilt the film on storyboard-v2 (film.js + new main.js + index.html beats A01–A16). Checks: full midpoints, lite, static, scrub 0.125→0.165 (worst diff 0.003). Stills A01–A16 re-rendered.
- Review (fresh agent, frames only): send back — B1 empty rewrite panels s₂–s₄ (typed window overran: +0.05 offset > rewrite length) → fixed, version flips at rewrite start; B2 T2 rows "broke" under "pass" (data rows for a passing tester had held=false) → a passing tester holds every attack by definition (attacksFor normalises); B3 compiler/P/judge clipped at the halt (camera pan) → no pan until the barrier.
- Shoulds taken: ledger row appears when verdicts are in, fix cell once written, ledger shown through the halt; fix typing starts right after the verdicts; feeds 3 rows/96px; judge moved bottom-centre (out of the caption); "candidate — unseen by the judge" marker over the desk; role labels in the ring centres; barrier labels above the rings; s† moved above the scroll column; caption "iteration 4 — candidate s₄"; toy says "the toy halted…"; history rod labelled "one ring per iteration"; veil camera back so the top ring fits.
- Published artifact version 1795607364-f1f1. Gate G2 pending (owner). Nothing pushed.
