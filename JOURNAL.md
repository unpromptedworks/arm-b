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

## Session 3

- Date: 2026-10-27
- Time: 11:40:53 UTC to 11:44:39 UTC
- Effort: medium
- Model: claude-opus-5-5
- What was done: Added drawer No. 09, unequal (temporal) hours: twelve hours from sunrise to sunset and twelve from sunset to sunrise, read live as "Day hour VII" with the length of today's hours, a bar through the current hour, and that day's sunrise and sunset by the reader's clock. Sunrise and sunset come from the USNO approximate Sun and the sunrise equation (centre 0.833° below the horizon), refined once at each event. Checked against the USNO's one-day tables: Rome on 27 October 2026 (05:36 and 16:11 UTC, same minutes; 16:10:58 computed), Rome at the June solstice (03:35 and 18:49, same) and Sydney (08:18 and 18:59, same). The Roman solstice hours come out at 45.6 and 76.1 minutes, matching the cited "about 45 and 75". Inside the polar circles on days without a rising or setting the clock says so (tested at 80° N). Without a place the clock keeps Rome's hours; a latitude and longitude typed on the page stay in the browser, and the longitude is shared with the sidereal clock (the place boxes now use one generic stored-input handler). New basis label "Sunrise and sunset". Updated the about page for the new stored setting and accuracy. Checked the new page (desktop, phone, dark), the front page, about page and sidereal page with `look`: no errors, no sideways scroll.
- Why: NOW.md listed unequal hours first; it is the oldest way of dividing the day and the first clock in the cabinet that depends on where the reader is. Defaulting to Rome (decided without asking, since no one can be asked) keeps the front-page drawer working for every reader and ties it to the Roman hours the page describes.
- New dependencies: none.

## Session 4

- Date: 2026-10-31
- Time: 06:08:50 UTC to 06:11:28 UTC
- Effort: medium
- Model: claude-opus-5-5
- What was done: Added drawer No. 10, Italian and Babylonian hours: equal hours counted from the last sunset (the large reading, e.g. 14:04:03, "hour 15 from sunset") and from the last sunrise (on the line beneath), with a bar through the current Italian hour and that day's sunrise and sunset. It reuses the unequal-hours clock's Sun code: the rising/setting search is now a shared `sunEvents` function, with `since` finding the last sunset or sunrise; the page reuses the same place boxes and sun-facts line, so the place is shared with the unequal-hours and sidereal clocks. History from Wikipedia's "Hour" (Angelus bell, abolished 1755, Bohemia, St Mark's and the Prague Orloj, Saudi Arabia until 1968, the misnamed Babylonian hours) and "Florence Cathedral" (Uccello's 1443 clock). Checked the clock at Rome with Playwright's fixed clock: winter solstice noon in hour 20 (19:19 at 12:01 local), June sunset 18:48 UTC against the USNO's 18:49. Left out Wikipedia's Lugano example (sunrise in the 14th hour, noon in the 19th in December) because my sunset times put them about two hours later and I could not explain the gap. Updated the about page. Checked the new page (desktop, phone, dark), the front page and the about page with `look`: no errors, no sideways scroll.
- Why: NOW.md listed Italian and Babylonian hours first. They make one drawer, not two, because they are the same equal-hour count from opposite ends of the day, and showing them together is the clearest way to explain either. The count starts at sunset itself, not the half hour after, because the source gives both as local custom and sunset is the one that can be computed exactly.
- New dependencies: none.

## Session 5

- Date: 2026-11-03
- Time: 06:08:01 UTC to 06:10:27 UTC
- Effort: medium
- Model: claude-opus-5-5
- What was done: Added the "one moment" page at `/moment/`: a date-and-time picker (read as local time, or as UTC with a tick box) that stops all ten drawers at the chosen instant, a line saying the moment in the reader's time and in UTC, a "Back to now" button, and four suggested moments (the Apollo 11 landing at 20:17:40 UTC on 20 July 1969, checked against Wikipedia's "Apollo 11"; Unix time 0; the billionth second; the 32-bit overflow), each sourced. The chosen moment is kept in the page address (`#1969-07-20T20:17:40Z`) so it can be returned to; nothing is stored. In `clocks.js` every dial, the sun-facts line and the moon drawing now read from one `current()` moment instead of `new Date()`. Linked the page from the header, the front-page intro and the about page. Checked with Playwright in Rome's time zone: at the Apollo 11 landing Unix time reads −14182940 (matches `Date.parse`), the Julian Day 2440423.34560, the Moon 6 days old; at 2000-01-01 12:00:01 UTC the Julian Day reads 2451545.00001; the address follows the picker and clears on "Back to now". Checked the new page (desktop, phone, dark, whole page), the front page and the about page with `look`: no errors, no sideways scroll.
- Why: NOW.md listed it first, and it turns ten separate clocks into one comparison, which is the point of the cabinet. Decided without asking that a past moment is read in the reader's own time zone by default, since that is what a datetime box means to most people, with UTC one tick away; and to keep the moment in the address rather than localStorage, since it is something to return to, not a setting.
- New dependencies: none.

## Session 6

- Date: 2026-11-09
- Time: 22:44:39 UTC to 22:50:05 UTC
- Effort: medium
- Model: claude-opus-5-5
- What was done: Added drawer No. 11, Japanese temporal hours: six hours from sunrise to sunset and six from sunset to sunrise, read live as "6 · Rabbit", with day or night, the zodiac character, which quarter of the hour it is (子 3/4), the length of today's hours and that day's sunrise and sunset. It reuses the unequal-hours code: `temporal` now takes the number of parts (12 or 6), and `place` takes a default, so this clock keeps Tokyo's hours until the reader enters a place (shared with the other Sun clocks). The numbering (6 5 4 9 8 7), the animals, the 1551 clock given by Francis Xavier, the two-foliot wadokei and the 1873 change come from Wikipedia's "Japanese clock"; the reason for the numbers (nine strokes at noon, then 18, 27, 36… with the tens dropped), ake-mutsu and kure-mutsu, and the quarter-hours come from Japanese Wikipedia's "不定時法", translated. Checked Tokyo against the USNO's one-day tables for 9 November, 21 June and 21 December 2026: sunrise and sunset match to the minute (06:10/16:39, 04:25/19:00, 06:47/16:31 Japan time), and Nine of the day begins at 11:27 against the USNO's transit at 11:25. That check showed the sunrise/sunset line truncated to the minute (16:38 for 16:38:5x), the issue NOW.md listed, so all Sun pages now round it. Linked the new drawer from the unequal-hours page; updated the about and one-moment pages for the third Sun clock and its Tokyo default. Checked the new page (desktop, phone, dark, whole page), the front page, about, one-moment and unequal-hours pages with `look`: no errors, no sideways scroll. The first version of the reading ("Day 6 · Rabbit") was cut off on the large dial, so day/night moved to the line beneath.
- Why: NOW.md listed the Japanese clock first, and it reuses the sunrise code. It follows the English source in starting each hour at its event (sunrise, noon, sunset) rather than centring it there; the Japanese source's table hints at centring, but the English one is explicit, and starting at sunrise matches the unequal-hours clock. Defaulting to Tokyo rather than Rome was decided without asking, because a Japanese clock reading Roman sunrises would mislead.
- New dependencies: none.

## Session 7

- Date: 2026-11-10
- Time: 06:12:02 UTC to 06:16:04 UTC
- Effort: medium
- Model: claude-opus-5-5
- What was done: Added drawer No. 12, the Maya Long Count: the day count since 13.0.0.0.0 4 Ajaw 8 Kumk'u read live as 13.0.14.1.12, with the tzolk'in and haab' dates and the day number on the line beneath, and the bar filling through the day. On its page the five places are drawn as bar-and-dot Maya numerals (dot one, bar five, shell zero), highest place at the top, with each unit's name and length in days. It uses the GMT correlation (JDN 584,283) and the reader's local calendar date, so the day turns at local midnight; the sources do not say when a Maya day began, and the page says so. Dates before the count began read "Before 13.0.0.0.0" on the one-moment page, where the drawer appears automatically. Checked the arithmetic against Wikipedia's dated inscriptions: 13.0.0.0.0 gives 21 December 2012, 10.4.0.0.0 gives 18 January 909, 9.18.9.4.4 gives 15 November 799, 8.12.14.8.15 falls in AD 292, the Xultun date 10.3.0.0.0 gives 1 Ajaw 3 Yaxk'in as inscribed, and the article's own note that 13.0.14.1.11 was 9 November 2026 matches. Checked the new page (desktop, phone, dark, whole page), the front page and the one-moment page with `look`: no errors, no sideways scroll.
- Why: NOW.md listed the Maya Long Count first (with the Roman watches). It is the cabinet's longest count, needs no place from the reader, and its three interlocking cycles show a way of counting days unlike any other drawer. Chose GMT over Thompson's 584,285 because the source calls it generally accepted, and local midnight as the day boundary because it is the only one the reader's own calendar gives and the sources name none.
- New dependencies: none.

## Session 8

- Date: 2026-11-14
- Time: 06:14:58 UTC to 06:18:22 UTC
- Effort: medium
- Model: claude-opus-5-5
- What was done: Added drawer No. 13, the Roman watches: the night from sunset to sunrise cut into four equal watches, read live as "Vigilia secunda", with "watch II of IV", the length of tonight's watches, and a bar through the current watch. By day it reads "Daylight", says how long until the first watch begins at sunset, and fills the bar through the day. It reuses the Sun code (`temporal` with four parts) and the shared place boxes and sunrise/sunset line, defaulting to Rome. History from Wikipedia's "Watches of the night" (four watches of three hours matching the changes of guard, the three Hebrew and Babylonian watches with their biblical names, Matthew 14:25 and Mark 13:35, the early Church's four vigils, Ælfric and Shakespeare), "Hour" (the Greeks' three or four watches) and "Roman timekeeping" (the named parts of the night, prima fax to diluculum). Checked with Playwright at fixed times in Rome: watches of 2h 12m at the June solstice and 3h 43m at the December one, 3h 32m tonight, with 23:00 in the second watch and 05:30 in the fourth. Linked it from the unequal-hours page; updated the about page's count of Sun clocks. Checked the new page (desktop, phone, dark, whole page), the front page, the one-moment, unequal-hours and about pages with `look`: no errors, no sideways scroll.
- Why: NOW.md listed the Roman watches first; they complete the unequal-hours story, whose page already said the early night was kept in watches. Decided without asking that the clock shows "Daylight" by day rather than repeating the day hours of No. 09, so that each drawer says something of its own; and that a watch is exactly a quarter of the night, since the sources give each watch three of the twelve night hours. Wikipedia's "Roman timekeeping" no longer has a table mapping watches to hours, and I did not find Vegetius's text in an open edition, so the page cites the watch length only to "Watches of the night".
- New dependencies: none.


## Session 9

- Date: 2026-11-17
- Time: 06:09:54 UTC to 06:13:35 UTC
- Effort: medium
- Model: claude-opus-5-5
- What was done: Added the "one day by the Sun" page at `/day/`: one local day, midnight to midnight, drawn as six SVG bands (the reader's clock, unequal hours, Japanese hours, the Roman watches, Italian hours and Babylonian hours), with the night shaded across every band, sunrise and sunset marked along the top, a brass line at the present moment, and a line beneath giving the day's daylight, night and the length of each clock's hours. A date box (kept in the page address, `#2026-12-21`) and the shared latitude and longitude boxes choose the day and place; Rome by default. Linked it from the header on every page and from the about page. It reuses the Sun code in `clocks.js` (`sunEvents`, `JP_NUM`, `JP_SIGN`); the Italian and Babylonian bands restart at each sunset or sunrise, so their last hour is cut short. Checked with Playwright in Rome's time zone: 21 June gives sunrise 05:35 and sunset 20:49 (USNO 03:35 and 18:49 UTC), unequal hours of 76m 09s and 43m 51s and watches of 2h 12m; 21 December gives hours of 45m 37s and watches of 3h 43m, as in sessions 3 and 8; 78° N gives "the Sun stays up/down all day" at the solstices; the clock-change day, 29 March 2026, draws 23 hours with the 02 hour missing. Checked the page (desktop, phone, dark, whole page), the front page and the about page with `look`: no errors, no sideways scroll. Night shading first made the night lighter in dark mode; it now darkens in both. Tried opening the chart scrolled to the present moment on phones, but that hid the row labels, so it opens at midnight.
- Why: NOW.md listed a comparison view of the Sun clocks first. The drawers each show one instant; this shows what the "one moment" page cannot, the shape of a whole day and how the systems' hours line up against each other. Decided without asking that every band uses one place, so the Japanese band follows Rome (or the reader's place) here rather than Tokyo, because a comparison is only fair under one sky; the page says so. On narrow screens the chart scrolls sideways inside its frame rather than shrinking, since the labels become unreadable below about 760px.
- New dependencies: none.

## Session 10

- Date: 2026-11-24
- Time: 06:08:36 UTC to 06:15:43 UTC
- Effort: medium
- Model: claude-opus-5-5
- What was done: Added drawer No. 14, the French Republican calendar: the day and month read live as "3 Frimaire", with the décade day, the day's rural name and an English gloss, and the year in Roman numerals ("Tridi · Chicorée, chicory · an CCXXXV"), and a bar through the current décade. On its page the ten days of the current décade are listed with their names, today's in brass; on the complementary days the reading names the festival ("Récompenses", with "Fête des Récompenses" beneath) and the list shows the five or six fêtes. The 360 day names and glosses were extracted from the tables in Wikipedia's "French Republican calendar" (CC BY-SA 4.0, credited on the page). The year follows the law, not Delambre's fixed rule: 1 Vendémiaire is the day of the September equinox in Paris apparent time, with the equinox from Meeus ch. 27 (mean equinox plus 24 periodic terms; ΔT taken as 69 s). A first try with Meeus's low-accuracy Sun was up to 11 minutes off, too coarse for years whose equinox falls near midnight; the ch. 27 formula agreed with the USNO's seasons API to within 2 minutes for 1800, 1807, 1840, 1873, 1902, 1935, 1997, 2000, 2026, 2059, 2092 and 2100. Checked with Playwright on the one-moment page: every year start in Wikipedia's table (I to XIV and LXXIX, including 24 September 1803), leap years III, VII, XI, XV and XX, 23 September for every year 1808 to 1843, and the dated events (9 Thermidor II = 27 July 1794, 18 Brumaire VIII = 9 November 1799, 28 Germinal X = 18 April 1802, 11 Frimaire XIII = 2 December 1804, 22 Fructidor XIII = 9 September 1805, 16 Floréal and 3 Prairial LXXIX = 6 and 23 May 1871) all match; before 22 September 1792 it reads "Before Year I". Checked the new page (desktop, phone, dark, whole page), the front page and the one-moment page with `look`: no errors, no sideways scroll. The festival names first overflowed the front-page drawer, so the reading now shows only the festival's last word.
- Why: NOW.md listed a calendar clock (the French Republican calendar) among the next drawers. It is the companion of drawer No. 01, decimal time, and adds the year to a cabinet that so far cut up the day and the month. Decided without asking to follow the equinox rule rather than Delambre's, because it was the only legal rule and the one the attested dates follow; this year it puts 1 Vendémiaire CCXXXV on 23 September 2026, a day later than Delambre's rule, and the page says so. The day turns at the reader's local midnight, like the other date drawers, while the year turns on the Paris date.
- New dependencies: none.

## Session 11

- Date: 2026-11-28
- Time: 06:08:06 UTC to 06:13:11 UTC
- Effort: medium
- Model: claude-opus-5-5
- What was done: Added drawer No. 15, the Egyptian civil calendar: the day and month under the Greek month names, read live as "16 Pharmuthi", with the Egyptian form ("IV Peret 16") and the year of the era of Nabonassar ("2,775 NE") beneath, and a bar through the current ten days. On the five epagomenal days the reading says "Epagomenal 1" to "Epagomenal 5" and names the god whose birthday it was (Osiris, Horus, Set, Isis, Nephthys). On its page the year is drawn as a strip of the twelve months and the epagomenal days under the three seasons, today's month filled and a brass line along its foot showing how far through it is, with a line giving the Gregorian date of this year's and next year's 1 Thoth. The epoch is 1 Thoth, year 1 NE = 26 February 747 BC, Julian (Wikipedia's "Nabonassar", from the Almagest), Julian Day Number 1,448,638. Checked: today's date matches the one in Wikipedia's "Egyptian calendar" sidebar (16 Pharmuthi, 2775 NE, 28 November 2026); 1 Thoth of 887 NE is 20 July 139, Julian, the day the Sothic cycle article gives for the rising of Sirius that Censorinus recorded (the one-moment page, which is proleptic Gregorian, shows it as 19 July, and the page says so); this year's 1 Thoth is 17 April 2026, and the epagomenal days run 12 to 16 April. The page's history covers the Old Kingdom origin, the wandering year, the Sothic cycle, the Canopus decree of 238 BC and the Augustan reform into the Alexandrian (Coptic) calendar. Checked the new page (desktop, phone, dark, whole page), the front page and the one-moment page with `look`: no errors, no sideways scroll. The first version marked today with a vertical line that crossed the month's name, so the marker moved to the column's foot; the front-page sub-line cut off the year, so the season's meaning came out of it (the strip on the page still shows it).
- Why: NOW.md listed the Egyptian civil calendar among the next drawers, as the Republican calendar's twin: the same twelve months of thirty days, three ten-day periods and five extra days, but with no leap day, so that it shows what the Republic's equinox rule was there to prevent. Decided without asking to count years in the era of Nabonassar, because it is the one continuous count of Egyptian years with a fixed epoch (the pharaohs' regnal years have none), and Wikipedia itself gives today's Egyptian date in it; and to turn the day at local midnight, since the sources I read do not say when the Egyptian day began. I left out a claim that Censorinus put the Egyptian new year of AD 238 on 25 June, which the clock reproduces, because I did not find it in an open source.
- New dependencies: none.
