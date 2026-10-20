# Two Truths

A small, dependency-free trivia and connections prototype. Solve nine clues, find three trios, then regroup the same answers using a second connection. Either connection may be discovered first.

## Run locally

From this directory:

```sh
python3 -m http.server 4173 --directory dist
```

Open http://localhost:4173. No install or build step is needed.

## Included

- One handcrafted example puzzle
- Last-name aliases, letter hints, and answer reveals
- Two grouping rounds, shuffle, optional nudges, and unlimited attempts
- Local progress saving and a spoiler-free result to copy
- Responsive layout, keyboard controls, reduced-motion support

The prototype has no accounts, daily scheduling, multiplayer, or remote score storage. The puzzle and its two authored classifications live in `dist/app.js`; alternative connections are not automatically judged.

## Verification

JavaScript syntax checked. Browser walkthrough covered wrong-answer feedback, all nine clue answers, both grouping rounds, completion, and saved progress after reloading.
