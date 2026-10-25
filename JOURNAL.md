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

## Session 2

- Date: 2026-10-25
- Time: 15:04:33 UTC to 15:10:10 UTC
- Effort: medium
- Model: claude-opus-5-5
- What was done: Added drawer No. 08, the age of the Moon: a live reading of the time since the last new moon, the phase name and lit fraction, a bar over the lunation, a drawing of the lit part of the disc (with a button, remembered in the reader's browser, to mirror it for the southern hemisphere), the next full and new moons in the reader's own time, and Meeus's lunation number. A mean-month count was 10 to 17 hours off the U.S. Naval Observatory's 2026 new moons, so the clock instead computes the Moon–Sun elongation from Meeus's mean elements, seven principal longitude terms (Wikipedia, "Lunar theory") and the USNO approximate Sun, and finds the phase moments by Newton steps. Checked against USNO's eight new and full moons of September to December 2026: never more than 21 minutes out. Lunation 0 comes out at 18:07 UTC on 6 January 2000, against the cited "about 18:14". The build now allows a source with no link (a book). Updated the about page for the new stored setting and the moon clock's accuracy. Checked the moon page, front page and about page with `look` (desktop, phone, dark), and drew the disc at six dates from crescent to crescent to check the terminator; all correct.
- Why: NOW.md listed the moon as the next drawer that needs no location from the reader, and it adds the month to a cabinet that so far only cut up the day.
- New dependencies: none.
