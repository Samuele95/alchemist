# Verifier specification — Alchemist site chain (workflow chain, five stages)

What counts as success for the chain, separate from the prompts. Three layers. Out of scope: whether the film is beautiful (the owner judges that at G1) and whether the theory is right (the sources' business).

## Static — on the text of the chain, before any run

The fourteen criteria S1–S14 live in `static-verifier.md`, which is also the prompt that runs them. Each is pass/fail; any fail means do not run the chain yet. Rerun it in a fresh session after editing any prompt.

## Single run — on the artifacts of one pass through the chain

| id | After | Check |
|---|---|---|
| V1 | 1 | Every brief paragraph cites claim ids; five claims sampled at random are found at their locator within a minute. |
| V2 | 1 | Every figure in the brief has a locator; the unsupported list exists. |
| V3 | 2 | The check passes in frame mode and in scrub mode across the cut; `?t=` opens the film at that instant. |
| V4 | 2 | The agent stopped at G1 and `STATE.md` holds a `GATE G1:` line with the owner's reply verbatim. |
| V5 | 3 | `t` ranges are contiguous over 0–1; every beat has `teaches` and `effect → meaning`; all nine signature moments are placed or their absence is a recorded `DEVIATION`. |
| V6 | 4 | Every slice has its `OK` line; the three tiers each show all copy; every `FAKED` item of the prototype is real; nothing unverified is reported as passing. |
| V7 | 5 | Every on-screen sentence maps to a supported claim; the space is nowhere labelled as measured data. |
| V8 | 5 | No commit, push or write to the publish folder happened before `GATE G2: PUBLISH` (WORKFLOW rule R4). |
| V9 | end | The published site loads from its GitHub Pages address with no 404 on assets. |

## Cross-run — only if the chain is rerun or reused

Minimal, because the chain normally runs once.

- Stage 2 rerun with different notes: the notes change the slice and nothing else in `site/`.
- Stage 4 resumed across sessions: no slice is built twice; the final site matches a single-session build at the same `t` values.
- Facts survive: pick three claims at stage 1 and find them unchanged in meaning in the storyboard copy and on the published page.

## Not shipped, and why

- **Dynamic-mode verifier:** stage 5 already judges one run with an independent reviewer, and the owner judges at two gates; a second LLM judge would cost more than it adds.
- **Cross-run verifier prompt:** the chain runs once; the three checks above can be done by hand.
