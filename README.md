# Two Truths

A small, dependency-free trivia and connections prototype. Solve nine clues, uncover a hidden truth in three trios, then regroup the same answers to discover a second truth. Either truth may be discovered first.

## Run locally

From this directory:

```sh
python3 -m http.server 4173 --directory dist
```

Open http://localhost:4173. No install or build step is needed.

## Included

- One handcrafted example puzzle
- Last-name aliases, letter hints, and answer reveals
- Two hidden-truth rounds, shuffle, progressive nudges, trio feedback, and unlimited attempts
- Answer celebrations, a perspective-change transition, and a staggered final matrix
- Local progress saving and a result with a symbolic first truth and discovery path to copy (no people, group names, or hidden lenses)
- Responsive layout, keyboard controls, reduced-motion support

The prototype has no accounts, daily scheduling, multiplayer, or remote score storage. The puzzle and its two authored classifications live in `dist/app.js`; alternative connections are not automatically judged.

## Verification

JavaScript syntax and whitespace checks passed. Browser walkthroughs covered both discovery orders, all nine clue answers, letter hints and reveals, progressive and selected-trio nudges, the perspective transition, completion, copied results, and progress after reloading. The final matrix was also checked at a 390px phone width with no horizontal overflow. Motion effects respect the system’s reduced-motion preference.
