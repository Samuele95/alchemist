SUMMARY: The slice runs from the veil (falling glyphs, three guardian sigils, a veiled light) through the cut into the space and two iterations of the Bramble run (test, judge's freeze, step, oscillation); the milestone check passed in frame mode (6 frames) and scrub mode (11 pairs, worst diff 0.057).
RUN: npm --prefix site install && npm --prefix site run dev — or open the hosted copy: https://claude.ai/artifact/8zctmWkdpjXd2tocR3ffzJ
LOOK AT: #t-0060 the veil and the hidden light · #t-0220 one guardian lights as another burns out · #t-0350 the veil tears · #t-0500 testers and verdicts in the space · #t-0660 the freeze: candidate unseen, ledger, diagnosis vector · #t-0950 déjà vu: T1 passes, T4 fails (locally, ?t=0.66 works the same; #debug or ?debug shows t, fps, beat)
OK: frames t=0.060, 0.220, 0.350, 0.500, 0.660, 0.950 — no page errors, no flat or identical frames (site-chain/out/frames/prototype)
OK: scrub 0.28→0.44→0.28 — the cut plays backward to the same frames (site-chain/out/frames/prototype/scrub)
OK: copy — every caption is a sentence from the brief; claims per beat in site/src/timeline.js (BEATS.teaches)
WARN: t=0.660 — tester labels and the ledger overlap during the orbit; label placement needs a collision pass
WARN: t=0.500 — the fragments travelling from the candidate to each tester are small and brief; they read as sparks rather than text
WARN: veil — the inscription is legible only in part, by design, but it is small at 1280×720
WARN: lens — shows only after the pointer moves; on touch screens it never appears
FAKED: tester planes have no visible "passing side"; the acceptance region is a faint glow, not a shaped region
FAKED: tabu burn-out of tried regions, convergence to gold, barrier and the closing toy are not in the slice
FAKED: only the full tier exists; lite is a count reduction, static and reduced-motion fallbacks are absent; no preloader
FAKED: fps on real hardware is unverified — headless rendering is software-only
FURTHER: 1 — Glyph tunnel: at the cut the camera dives through the rain, which turns into a corridor of coordinates before the space opens around it
FURTHER: 2 — Reasons as text: each tester's reason is written in glyphs along its plane's rim (Matrix code that reads as a sentence), replacing the DOM labels
FURTHER: 3 — The freeze as an engraving: when time stops, the scene becomes black-and-gold linework (an edge shader), like a plate from an alchemical treatise, until the judge's vector is drawn
