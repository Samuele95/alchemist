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
