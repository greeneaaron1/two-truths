# Two Truths

A small, dependency-free trivia and connections prototype. Solve nine clues, uncover a hidden truth in three trios, then regroup the same answers to discover a second truth. Either truth may be discovered first.

## Run locally

From this directory:

```sh
python3 -m http.server 4173 --directory dist
```

Open http://localhost:4173. No install or build step is needed.

To preview the redesigned opening even if you have saved puzzle progress, open http://localhost:4173/#welcome. The current design has a charcoal background, a citron headline, and nine colorful animated pieces.

If you see an older design after pulling updates, refresh once with **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows/Linux). Run the server from this repository's root; an existing server on port 4173 may be serving a different checkout. Stop it with Ctrl+C before starting this command again. Styles, scripts, and the icon use content-versioned URLs to avoid reusing cached assets; update each asset's `?v=` value in `dist/index.html` when that asset changes.

## Included

- Puzzle 000 (the original example) and Puzzle 001 (a new set of nine clues)
- Archive navigation with per-puzzle progress and completion status
- A Play opening for each unstarted puzzle, with a gentle row-by-row reveal; opened puzzles resume directly, even before the first answer
- A confirmed start-over action on each completed puzzle’s results screen
- Direct puzzle links (`#puzzle/000`, `#puzzle/001`) and an archive link (`#archive`)
- Opening-screen preview (`#welcome`) that preserves saved progress; Play resumes the latest puzzle
- Last-name aliases, letter hints, and answer reveals
- Two hidden-truth rounds, shuffle, progressive nudges, trio feedback, and unlimited attempts
- Answer celebrations, a perspective-change transition, and a staggered final matrix
- Local progress saving and a result with a symbolic first truth and discovery path to copy (no people, group names, or hidden lenses)
- Responsive layout, keyboard controls, reduced-motion support

The prototype has no accounts, daily scheduling, multiplayer, or remote score storage. Puzzle data and the two authored classifications live in `dist/puzzles.js`; alternative connections are not automatically judged. The last catalog entry is the latest puzzle and opens by default. Original example progress keeps its existing storage key; other puzzles save separately.

## Adding a puzzle

Append an entry to `puzzles` in `dist/puzzles.js` with a unique three-digit ID, nine answers, labels, truth statements, and progressive hints. Each answer needs a stable ID, a name, accepted aliases, a clue, and `field` / `nation` indices. Each of the nine combinations of indices 0–2 must appear exactly once. Avoid surname-only aliases when they would be ambiguous (for example, “Williams”). Keep published IDs and classifications stable so existing saves remain valid.

The two axes currently describe career and nationality. A broader range of puzzle themes will need more general axis names and introductory hints.

## V1 priorities

- Playtest clue difficulty, accepted answers, and ambiguous connections, including Puzzle 001.
- Add a feedback destination.
- Set a publishing cadence and prepare a small backlog of puzzles.
- Finish phone, keyboard, and screen-reader checks on the hosted version.

Accounts, cross-device sync, streaks, and leaderboards can follow after the core game is tested.

## Puzzle 001 editorial references (contains spoilers)

Clues were checked against [James Bond’s Judi Dench profile](https://www.007.com/spotlight-on-dame-judi-dench), [the WTA’s Serena Williams records](https://www.wtatennis.com/players/230234/name/record), [the NFSA’s Strictly Ballroom collection](https://www.nfsa.gov.au/collection/curated/strictly-ballroom) and [Moulin Rouge! notes](https://www.nfsa.gov.au/collection/item/moulin-rouge-love), [Team GB’s Mo Farah retrospective](https://www.teamgb.com/article/sir-mo-farah-mos-greatest-moments/4HJvKoKHclSKJgC4lOB0a2), [the Academy’s Denzel Washington profile](https://www.oscars.org/collection-highlights/denzel-washington), [the Australian Olympic Committee’s Cathy Freeman profile](https://www.olympics.com.au/olympians/cathy-freeman/), [the NEA’s Spike Lee biography](https://www.arts.gov/honors/medals/spike-lee), [Cate Blanchett’s biography](https://en.wikipedia.org/wiki/Cate_Blanchett), and the BFI’s [Kes](https://www.bfi.org.uk/film/6a56af5a-24ab-5b3b-a3bc-6a64ba380994/kes) and [I, Daniel Blake](https://www.bfi.org.uk/film/0e964f0b-e7aa-54e6-a6f3-544f18d14feb/i-daniel-blake) pages.

## Verification

Run `node --test tests/puzzles.test.cjs` for catalog integrity, both discovery orders on both puzzles, per-puzzle share text, save isolation, legacy example progress, and archive routing checks. No dependencies are required.

JavaScript syntax and whitespace checks passed. Browser walkthroughs covered both discovery orders, all nine clue answers, letter hints and reveals, progressive and selected-trio nudges, the perspective transition, completion, copied results, and progress after reloading. The final matrix was also checked at a 390px phone width with no horizontal overflow. Motion effects respect the system’s reduced-motion preference.
