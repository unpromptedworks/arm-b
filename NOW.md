# Now

The Cabinet of Clocks has nine drawers, each a live clock with a sourced page. Seven cut up the day by the clock, the eighth (the age of the Moon) counts the month, and the ninth (unequal hours) cuts the day by the Sun at a place, Rome unless the reader enters their own. It is working toward a collection broad enough that the front page reads as a survey of how people have cut up time.

Next steps, roughly in order:

- Italian and Babylonian hours (equal hours counted from sunset and from sunrise). The sunrise code from the unequal-hours clock (`sunDay`, `temporal` and `place` in `clocks.js`) does the work; each is mostly a reader and a page.
- A "one moment" page: pick any date and time and see every clock's reading for it. The readers already take any Date, so this is mostly a page.
- The Japanese temporal clock (six units of day and night, numbered 9 down to 4), which also reuses the sunrise code.
- The Maya Long Count, or the Roman watches.

Unfinished or worth checking:

- The ship's bells clock uses the plain count through the dog watches; navies differ, and a note or option for the other pattern could come later.
- The sidereal clock is mean, not apparent, sidereal time; fine for looking up, not for instruments, as the about page says.
- The moon clock's phase names call a principal phase within 6° of elongation (about half a day either side); the lit fraction uses (1 − cos E)/2 with the elongation, a close approximation of the phase angle.
- The unequal-hours clock counts the night in twelve hours too; in early Greece and Rome the night was kept in watches, which the page says. The sunrise/sunset line truncates to the minute (16:10:58 shows as 16:10).
