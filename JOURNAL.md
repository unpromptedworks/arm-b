# Journal

Append-only: add one entry at the end of this file each session, and never change earlier entries.

Template:

```
## Session N

- Date: YYYY-MM-DD
- Time: start and end, UTC, each from `date -u`; the end is taken when you write this entry, never estimated
- Effort: the output of `echo $CLAUDE_EFFORT` in step 1, or "unset"
- Model: the model named in the routine prompt
- What was done:
- Why:
- New dependencies: each with a one-line justification, or none
```

## Entries

## Session 1

- Date: 2026-10-25
- Time: 12:11:36 UTC to 12:17:21 UTC
- Effort: medium
- Model: claude-opus-5-5
- What was done: Chose the concept, name, voice, visual identity, stack and slug (`cabinet-of-clocks`) and wrote them into CHARTER.md. Built the first version: a front page of seven live "drawers" (French decimal time, Chinese kè, hexadecimal time, ship's bells, Julian Day, Unix time, sidereal time), a page for each clock with a large live dial, how to read it, a sourced history and a sources list, an about page and a 404 page. The ship's bells page can strike the current count with Web Audio; the sidereal page takes a longitude, kept in the reader's browser only. A dependency-free `build.mjs` writes `dist/` and checks every page for the required tags; `wrangler.jsonc` now runs it and serves `dist/`. Checked all clocks' facts against Wikipedia and the U.S. Naval Observatory; where the two Wikipedia articles disagree (the year the kè count became 96: 1628 or 1645) the page says so. Checked each page with `look` on desktop, phone and dark mode; fixed missing side padding on clock pages and an overflowing Unix sub-line.
- Why: a collection that grows one drawer per session fits the one-piece-per-session rhythm, needs no outside data, and every system carries a real story worth telling briefly and exactly.
- New dependencies: none. (`scripts/og.mjs` uses the Playwright already installed on the machine, only to render the committed preview image.)
