# Direction — the Alchemist film

This file owns the creative direction. Stages check it (1), prove it (2), schedule it (3), build it (4) and judge against it (5). Where the owner's words at gate G1 differ from this file, the owner's words win.

## Premise

The site is one continuous, scroll-driven film about a **search for truth**, in two worlds joined by a single cut.

- **The veil (esoteric — alchemy fused with Matrix)** — where the mystery is felt. A dark, occult world made of falling glyphs: alchemical signs and fragments of prompt text, rings of sigils, an inscription that cannot yet be read. Somewhere behind it is a truth — the prompt that would do exactly what we want — which no one has ever seen. Alchemy here is the esoteric tradition, the patient search for a hidden truth, never a laboratory or its apparatus.
- **The cut (Matrix)** — the veil is torn: the glyphs reveal themselves as coordinates, and the occult world virtualizes into a geometric space.
- **The space (geometry)** — where the method is seen: each iteration of the loop is a step of the search in that space.

Why this shape: the paper describes writing a prompt as a search for a hypothetical target that no one knows in advance, approached step by step. The film enacts that search, first as mystery, then as method, so the viewer feels the idea before reading it.

Owner's direction, 17 Nov 2026: no alchemy laboratory, no vessels, no apparatus. Alchemy means the esoteric approach, the mystery, the search of truth, mixed with Matrix.

## Visual grammar — one form per concept, kept for the whole film

| Concept (source term) | Behind the veil | In the space |
|---|---|---|
| candidate `s` | an inscription being written in glyphs | a bright point |
| output space `S` | the great circle of the seal | the bounded volume the point lives in |
| constraint / tester `Tᵢ` | a guardian sigil that tests one property of the inscription | a surface; its passing side is lit |
| projection | each guardian is shown only its own fragment of the inscription | the point's shadow on that tester's own plane; planes cannot see each other |
| verdict | the sigil ignites or burns out | the plane gilds (pass) or tarnishes (fail) |
| judge `J` | the reader of the ledger, who never sees the inscription | the freeze: time stops, the camera orbits, a diagnosis vector is drawn |
| history `H` | the ledger of verdicts and fixes | a thread through every past position, and glyph columns: iteration, verdicts, fix |
| fix | a line added to the inscription's rules | the vector to the next point |
| oscillation / coupling | lighting one sigil extinguishes another | a zig-zag between two surfaces; a repeated-frame glitch when a state returns |
| target prompt `s†` (hypothetical truth) | a light behind the veil that is never seen directly | a faint star the search approaches and never reaches; its distance lines are dotted and flicker, because no one can draw them |
| tabu effect | — | regions already tried burn out to dull ash |
| convergence, `L(s) = 0` | — | the point enters the region where every surface is lit; gold spreads through everything |
| barrier, no feasible `s` | — | the surfaces close with no shared region; the one to relax is marked |

A row the sources do not support is dropped, never bent to fit (stage 1 checks every row).

## Signature moments — the film contains all of them; stage 3 places them

1. **Cold open.** Black screen; a cursor types the whack-a-mole: fix A, B breaks; fix B, A breaks. Then the question the film answers: how do you find a prompt no one has seen?
2. **The cut.** The veil tears: the falling glyphs and the sigil rings stop, turn edge-on and reveal themselves as coordinates, settling into the points and axes of the space. It plays forward and backward under the scroll.
3. **The lens.** After the cut the pointer carries a lens that shows the veil beneath the geometry: the same moment, read as mystery and as method.
4. **Shadows.** The candidate casts one shadow per tester onto isolated planes.
5. **The freeze.** At the judge's turn time stops; scrolling orbits the camera around the frozen state while the diagnosis is drawn through the whole history thread.
6. **Déjà vu.** When the candidate returns to a state it has been in, the frame repeats with a glitch; the judge reads it as coupling and moves diagonally.
7. **Transmutation.** Convergence turns the whole space to gold.
8. **The sealed room.** A coda: the run that hits its iteration budget, shown as a result — the proof of which constraint to relax.
9. **Your turn.** A small interactive toy that closes the film: drag two constraint surfaces together or apart and watch the point oscillate, converge or get sealed out.

## Look

- **Palette.** Black and gold is the base and the owner's preference; it is not a hard limit. Extend it where colour carries meaning — the alchemical stages (black, white, yellow, red) are an available arc for the film — and remove any colour that means nothing. Pass and fail differ by brightness, texture and motion, never by hue alone, because hue alone fails colour-blind viewers.
- **Matrix.** Borrow the ideas: a world that resolves into code, the frozen-time orbit, the repeated-frame glitch. Render them with Alchemist's own glyphs and palette. No green katakana rain and no names, quotes, typefaces or characters from the films, because the site must read as Alchemist's own and those belong to someone else.
- **Type.** Chosen at stage 3: one display face with an engraved character, one monospace for glyphs and code; open-licensed and self-hosted, because the site is public and should load without third-party requests or licence questions.

## Craft notes — what makes real-time 3D convincing

- **Give the gold something to reflect.** Metal reads as metal only against an environment: a procedural environment map, HDR values, bloom and filmic tone mapping. Flat-lit yellow reads as plastic.
- **Build depth.** Atmospheric falloff, depth of field and parallax layers; an evenly lit, evenly sharp scene reads as a tech demo.
- **The camera never rests and never moves linearly.** Eased moves, a slight constant drift, inertia on the scroll.
- **Put density on the GPU.** Glyphs and particles are instanced or point geometry animated in shaders, in the tens or hundreds of thousands; per-object JavaScript caps the scene at a few hundred and it shows.
- **One image.** Light grain, vignette and a trace of chromatic aberration grade the 3D and the text together.
- **Text is DOM over the canvas**, graded to sit in the world, so it stays sharp, selectable and readable by a screen reader.

## The WOW bar — judged by the owner at G1 and by the reviewer at stage 5

- **W1 Meaning.** Every effect teaches a named idea; an effect with no idea behind it is cut.
- **W2 The cut holds.** Scrubbed forward, backward, slowly and fast, it never breaks or pops.
- **W3 One shot.** The cut is the only cut; there is no stretch where scrolling changes nothing.
- **W4 Alive.** With the scroll at rest something still moves; the pointer changes something in every beat.
- **W5 Smooth.** At least 50 fps median at 1080p on the owner's laptop, read from the `?debug` overlay.
- **W6 Understood.** After the first third of the film a first-time viewer can say what Alchemist does.

## Honesty

- **The space is an illustration of the method, not measured data.** Never label it as embeddings or as a recorded run, and label the toy a simulation, because the site makes scientific claims and a picture presented as a measurement would be a false one.
- **What before why.** The film says what Alchemist does and when to use it before it explains why it works, because a visitor who does not yet know what it does has no reason to care why it works.
