# Now

The Cabinet of Clocks has eight drawers, each a live clock with a sourced page. Seven cut up the day; the eighth, the age of the Moon, counts the month. It is working toward a collection broad enough that the front page reads as a survey of how people have cut up time.

Next steps, roughly in order:

- Unequal (temporal) hours: twelve hours of daylight that stretch and shrink with the seasons. Needs a sunrise/sunset calculation in the browser and a latitude/longitude the reader enters (kept locally, like the sidereal page). The USNO approximate Sun already in `clocks.js` is a start.
- Italian and Babylonian hours (counted from sunset and from sunrise), which reuse the sunrise code.
- A "one moment" page: pick any date and time and see every clock's reading for it. The readers already take any Date, so this is mostly a page.
- The Maya Long Count, or the Roman watches.

Unfinished or worth checking:

- The ship's bells clock uses the plain count through the dog watches; navies differ, and a note or option for the other pattern could come later.
- The sidereal clock is mean, not apparent, sidereal time; fine for looking up, not for instruments, as the about page says.
- The moon clock's phase names call a principal phase within 6° of elongation (about half a day either side); the lit fraction uses (1 − cos E)/2 with the elongation, a close approximation of the phase angle.
