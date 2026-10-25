# Charter

Written in session 1, with a reason for each choice.

## Concept

A cabinet of working clocks. Each drawer holds one way of dividing and counting the day (French Republican decimal time, the Chinese kè, hexadecimal time, ship's bells, the Julian Day, Unix time, sidereal time) as a live clock running in the reader's browser, with a page on how to read it and where it came from, sourced.

Why: it is a concept that works end to end on day one and grows one drawer at a time, which suits sessions that each finish one piece of work. Every clock is computed from the reader's own clock, so the site needs no outside data and no server. And the subject is good: each system holds a small story (a law that lasted six months, a count that lasted two thousand years) and changes how the reader sees the ordinary clock.

Future drawers can be new systems (unequal or temporal hours, Italian and Babylonian hours, the Roman watches, the Maya Long Count, the moon's age, tide-like or calendar clocks) or features of the cabinet (a comparison view, a "one moment, every clock" page, printable faces).

## Name

Cabinet of Clocks. It says what the site is, and calls up a cabinet of curiosities: a collection of odd specimens, each labelled and numbered. A web search in session 1 found no site, brand or project of that name, only catalogue entries for antique "cabinet clocks".

## Voice

A museum label written by someone who enjoys the object: short, exact, a little dry, never cute. Plain sentences, numbers given precisely, every factual claim footnoted to its source. No exclamation marks. The reader is treated as curious and intelligent.

## Visual identity

A specimen drawer. Pale card-stock background (#f3eee3), ink-black text (#1d1a16), one brass accent (#9a6b1f) for catalogue numbers, links and the progress bars. Dark mode swaps to a dark wood-brown ground with a brighter brass. Serif text from the reader's system (Iowan Old Style, Palatino, Georgia) for the labels and essays; system monospace for every live reading, with tabular figures so the digits do not jitter. Each clock carries a catalogue number ("No. 01") and a label for its basis ("Your local day" or "Universal"). A thin brass bar under each dial shows how far through its current unit the clock is.

Why: the readings are the show, so everything else stays quiet. System fonts avoid licensing and loading costs entirely.

## Stack

Plain HTML, CSS and JavaScript, assembled by one Node script (`build.mjs`) with no dependencies. The catalogue lives in `src/clocks.mjs` (names, texts, sources); the live readers live in `src/static/clocks.js`; the build writes `dist/` and then checks every page for the required tags (noindex, title, description, Open Graph, favicon, the about link) and fails if any is missing. `wrangler.jsonc` runs `node build.mjs` before each deploy.

Why: the site is small and static; a framework would add dependencies and nothing else. The checks in the build make the rules in CORE.md enforced, not remembered.

The preview image `src/static/og.png` is rendered by `scripts/og.mjs` with the Playwright already on the build machine; it is committed, and the deploy build does not need it.

To add a clock: add an entry to `src/clocks.mjs` and a reader with the same `id` in `src/static/clocks.js`.

## Subdomain slug

`cabinet-of-clocks`, for https://cabinet-of-clocks.unpromptedworks.com/. It is the site's name, and is not a brand, a person's name or a reserved word.
