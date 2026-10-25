// The catalogue. Each entry becomes a drawer on the front page and a page
// of its own at /clocks/<slug>/. The `id` names the reader function in
// src/static/clocks.js that turns a Date into this clock's display.
// Body text is HTML; every factual claim points at an entry in `sources`.

export const clocks = [
  {
    no: 1,
    id: "decimal",
    slug: "french-decimal-time",
    name: "French decimal time",
    basis: "local",
    teaser: "Ten hours to the day, a hundred minutes to the hour.",
    description:
      "A live clock showing French Republican decimal time: ten hours a day, one hundred minutes an hour, one hundred seconds a minute.",
    read: `
      <p>The day, from midnight to midnight, is cut into ten hours. Each hour holds one hundred minutes, and each minute one hundred seconds, so a day has 100,000 decimal seconds.</p>
      <p>Midnight is 0:00:00 and noon is 5:00:00. A decimal hour is 2.4 ordinary hours, a decimal minute is 86.4 ordinary seconds, and a decimal second is 0.864 of an ordinary one, so the last figure ticks a little faster than you expect.</p>`,
    history: `
      <p>Jean-Charles de Borda proposed the scheme in November 1792, and the decree of 5 October 1793 set it in law, dividing the day “into ten parts or hours”.<sup><a href="#s1">1</a></sup> It became mandatory for public records on 22 September 1794 and was suspended on 7 April 1795, barely six months later.<sup><a href="#s1">1</a></sup></p>
      <p>It never fully went away at once: some towns, Marseille and Toulouse among them, kept using it for a while, and two clock faces at the Tuileries showed decimal hours until at least 1801.<sup><a href="#s1">1</a></sup></p>`,
    sources: [
      ["Decimal time", "https://en.wikipedia.org/wiki/Decimal_time", "Wikipedia, CC BY-SA 4.0"],
    ],
  },
  {
    no: 2,
    id: "ke",
    slug: "chinese-ke",
    name: "The Chinese kè",
    basis: "local",
    teaser: "A hundred marks on the water clock.",
    description:
      "A live clock counting the day in kè, the traditional Chinese unit of one hundredth of a day, about 14 minutes 24 seconds.",
    read: `
      <p>The day is divided into one hundred kè (刻), counted here from midnight. One kè is 14 minutes and 24 seconds. The bar fills as the current kè passes, and the number above it says how many whole kè have gone by today.</p>
      <p>A hundred kè do not fit evenly into the twelve double hours that were kept alongside them, so a kè boundary rarely lines up with an ordinary hour. At noon, 50 kè have passed.</p>`,
    history: `
      <p>The name means a notch or mark: the kè were the marks on sundials and on the floats of water clocks.<sup><a href="#s1">1</a></sup> By the first millennium BC the day was already divided into 100 kè, alongside the twelve double hours.<sup><a href="#s2">2</a></sup></p>
      <p>The hundred did not quite divide into twelve, and for a few short periods the count was changed to 120, 96 or 108 kè a day.<sup><a href="#s2">2</a></sup> In the seventeenth century it settled at 96, which made each kè exactly a quarter of an hour; the sources disagree on the year, giving 1628 and 1645.<sup><a href="#s1">1</a>, <a href="#s2">2</a></sup></p>`,
    sources: [
      ["Ke (unit)", "https://en.wikipedia.org/wiki/Ke_(unit)", "Wikipedia, CC BY-SA 4.0"],
      ["Decimal time", "https://en.wikipedia.org/wiki/Decimal_time", "Wikipedia, CC BY-SA 4.0"],
    ],
  },
  {
    no: 3,
    id: "hex",
    slug: "hexadecimal-time",
    name: "Hexadecimal time",
    basis: "local",
    teaser: "The day halved, and halved, and halved again.",
    description:
      "A live clock showing hexadecimal time, which splits the day into sixteen hours and 65,536 hex seconds.",
    read: `
      <p>Halve the day sixteen times and you get 65,536 equal parts, written as four hexadecimal digits from 0000 to FFFF. The first digit is the hex hour, the next two the hex minute, the last the hex second, separated by underscores: <code>8_00_0</code> is noon.</p>
      <p>A hex hour is 1½ ordinary hours, a hex minute about 21.1 seconds, and a hex second about 1.318 seconds. Because every unit is a halving, the hour digit alone already tells you which sixteenth of the day you are in: anything starting with 8 to F is afternoon.</p>`,
    history: `
      <p>The Swedish-American engineer John W. Nystrom proposed dividing the day this way in 1863, as part of his “tonal system” of base-16 arithmetic.<sup><a href="#s1">1</a></sup> In 1997 Mark Vincent Rogers proposed a similar system and built it as a JavaScript clock.<sup><a href="#s1">1</a></sup> Neither caught on, but the notation is tidy, and this clock follows it.</p>`,
    sources: [
      ["Hexadecimal time", "https://en.wikipedia.org/wiki/Hexadecimal_time", "Wikipedia, CC BY-SA 4.0"],
    ],
  },
  {
    no: 4,
    id: "bells",
    slug: "ships-bells",
    name: "Ship’s bells",
    basis: "local",
    teaser: "Eight bells, and the watch is over.",
    description:
      "A live clock that tells the time in ship’s bells and watches, the way a bell struck every half hour on board a sailing ship.",
    read: `
      <p>The day at sea is divided into watches of four hours. A bell is struck every half hour: one bell after the first half hour of a watch, two after the second, and so on up to eight bells when the watch ends.<sup><a href="#s1">1</a></sup> The strokes come in pairs, for easier counting, with any odd stroke at the end.<sup><a href="#s1">1</a></sup></p>
      <p>The clock shows the last bell struck, so “three bells in the forenoon watch” covers 9:30 to 10:00 in the morning. Press the bell to hear the current count struck, in your own browser.</p>`,
    history: `
      <p>On sailing ships the watch was timed with a half-hour sandglass, and the bell was struck each time the glass was turned.<sup><a href="#s1">1</a></sup> Eight bells fall at 4, 8 and 12 o’clock.<sup><a href="#s1">1</a></sup></p>
      <p>The watch from 16:00 to 20:00 is split into two short “dog watches”, so that the rota shifts each day and the crew can eat an evening meal.<sup><a href="#s1">1</a></sup> Navies differ over how the bells are counted in the dog watches; this clock uses the plain count, which runs straight on through them.</p>`,
    sources: [
      ["Ship’s bell", "https://en.wikipedia.org/wiki/Ship%27s_bell", "Wikipedia, CC BY-SA 4.0"],
    ],
  },
  {
    no: 5,
    id: "julian",
    slug: "julian-day",
    name: "Julian Day",
    basis: "UTC",
    teaser: "Days since noon, 1 January 4713 BC.",
    description:
      "A live counter of the Julian Day, the astronomers’ continuous count of days since noon on 1 January 4713 BC.",
    read: `
      <p>Astronomers needed one number for a moment, free of months, calendars and reforms. The Julian Day is that number: the days, with a decimal fraction, since noon Universal Time on 1 January 4713 BC in the proleptic Julian calendar.<sup><a href="#s1">1</a></sup></p>
      <p>The day starts at noon, not midnight, so an observer’s whole night falls under one day number. The Modified Julian Date beneath it is the same count minus 2,400,000.5, which starts at midnight on 17 November 1858 and gives a smaller number.<sup><a href="#s1">1</a></sup></p>`,
    history: `
      <p>The starting point comes from the Julian period that Joseph Scaliger proposed in 1583: 7,980 years, the product of three old calendar cycles of 28, 19 and 15 years. All three last began together in 4713 BC.<sup><a href="#s1">1</a></sup> The Smithsonian Astrophysical Observatory introduced the modified count in 1957.<sup><a href="#s1">1</a></sup></p>`,
    sources: [
      ["Julian day", "https://en.wikipedia.org/wiki/Julian_day", "Wikipedia, CC BY-SA 4.0"],
    ],
  },
  {
    no: 6,
    id: "unix",
    slug: "unix-time",
    name: "Unix time",
    basis: "UTC",
    teaser: "Seconds since 1970, the clock inside many computers.",
    description:
      "A live counter of Unix time, the seconds since 00:00:00 UTC on 1 January 1970, with a countdown to the year 2038 overflow.",
    read: `
      <p>Unix time is a count of seconds from 00:00:00 UTC on 1 January 1970.<sup><a href="#s1">1</a></sup> It is widely used in computing, often underneath whatever time a machine shows you.</p>
      <p>It pretends that every day has exactly 86,400 seconds, so it skips leap seconds: when one happens, the count repeats a second.<sup><a href="#s1">1</a></sup> Below the count is the time left until a signed 32-bit counter runs out, one second after 03:14:07 UTC on 19 January 2038.<sup><a href="#s1">1</a></sup></p>`,
    history: `
      <p>The count passed one billion at 01:46:40 UTC on 9 September 2001, and people in Copenhagen marked it at 03:46:40 local time.<sup><a href="#s1">1</a></sup> It is the youngest clock in this cabinet.</p>`,
    sources: [
      ["Unix time", "https://en.wikipedia.org/wiki/Unix_time", "Wikipedia, CC BY-SA 4.0"],
    ],
  },
  {
    no: 7,
    id: "sidereal",
    slug: "sidereal-time",
    name: "Sidereal time",
    basis: "UTC",
    teaser: "A day measured against the stars, four minutes short.",
    description:
      "A live clock showing Greenwich mean sidereal time, and local sidereal time for a longitude you choose: the time kept by the stars.",
    read: `
      <p>Measured against the stars rather than the Sun, the Earth turns once in about 23 hours 56 minutes 4 seconds.<sup><a href="#s1">1</a></sup> A sidereal clock counts 24 sidereal hours in that time, so it gains about four minutes on an ordinary clock every day.</p>
      <p>Sidereal time is the angle from your meridian to the March equinox, expressed in hours. A star crosses your meridian at the same sidereal time every night, so astronomers use it to know what is overhead.<sup><a href="#s1">1</a></sup> Enter your longitude, east positive, to get local sidereal time; it stays in your browser.</p>`,
    history: `
      <p>The solar day is longer because the Earth also moves along its orbit, and has to turn a little further each day before the Sun is back at noon.<sup><a href="#s1">1</a></sup> Over a year the difference adds up to one whole extra turn: the stars rise one more time than the Sun does.</p>
      <p>This clock uses the U.S. Naval Observatory’s approximate formula for Greenwich mean sidereal time, and treats your computer’s clock as Universal Time.<sup><a href="#s2">2</a></sup></p>`,
    sources: [
      ["Sidereal time", "https://en.wikipedia.org/wiki/Sidereal_time", "Wikipedia, CC BY-SA 4.0"],
      ["Computing Greenwich Apparent Sidereal Time", "https://aa.usno.navy.mil/faq/GAST", "U.S. Naval Observatory, U.S. government work"],
    ],
  },
  {
    no: 8,
    id: "moon",
    slug: "age-of-the-moon",
    name: "The age of the Moon",
    basis: "UTC",
    teaser: "Days since the new moon, the oldest month there is.",
    description:
      "A live clock showing the age of the Moon, the time since the last new moon, with its phase drawn and the next full and new moons.",
    read: `
      <p>The reading is the Moon’s age: the time since the last new moon, when the Moon passed between the Earth and the Sun. The number of days counted from the new moon is what has long been called the Moon’s age.<sup><a href="#s2">2</a></sup> The bar fills over one lunation, from one new moon to the next, and the line under the reading names the phase and how much of the face is lit.</p>
      <p>The drawing shows the Moon as seen from the northern hemisphere, where the waxing Moon is lit on the right. From the southern hemisphere it appears the other way round;<sup><a href="#s2">2</a></sup> the button mirrors it. The lunation number is Jean Meeus’s count, which starts at 0 with the first new moon of 2000, at about 18:14 UTC on 6 January.<sup><a href="#s3">3</a></sup></p>`,
    history: `
      <p>On average a lunation lasts 29.53059 days, or 29 days 12 hours 44 minutes 3 seconds, but any single one may run from about 29.27 to 29.83 days.<sup><a href="#s1">1</a></sup> The word <i>synodic</i>, for this month of phases, comes from the Greek for a meeting: of the Sun and the Moon.<sup><a href="#s1">1</a></sup> Calendars still keep it. The Chinese calendar begins its month at the new moon, and the Islamic calendar begins a month when the first crescent is actually seen, so the start of a month cannot be known for certain in advance.<sup><a href="#s3">3</a></sup></p>
      <p>The Moon does not keep even time. Its orbit is an ellipse, and the Sun pulls on it, and the largest corrections have old names. The evection, or something close to it, was known to Ptolemy; the variation, a speeding-up of the Moon as it nears new and full moon, was discovered by Tycho Brahe.<sup><a href="#s4">4</a></sup></p>
      <p>So this clock does not just count off the average month. It works out the angle between the Moon and the Sun from the Moon’s mean motions as given by Meeus,<sup><a href="#s5">5</a></sup> seven of the principal correction terms in its longitude,<sup><a href="#s4">4</a></sup> and the Naval Observatory’s approximate formula for the Sun.<sup><a href="#s6">6</a></sup> Checked against the Observatory’s times for the new and full moons of September to December 2026, it was never more than 21 minutes out.<sup><a href="#s7">7</a></sup></p>`,
    sources: [
      ["Lunar month", "https://en.wikipedia.org/wiki/Lunar_month", "Wikipedia, CC BY-SA 4.0"],
      ["Lunar phase", "https://en.wikipedia.org/wiki/Lunar_phase", "Wikipedia, CC BY-SA 4.0"],
      ["New moon", "https://en.wikipedia.org/wiki/New_moon", "Wikipedia, CC BY-SA 4.0"],
      ["Lunar theory", "https://en.wikipedia.org/wiki/Lunar_theory", "Wikipedia, CC BY-SA 4.0"],
      ["Jean Meeus, Astronomical Algorithms, 2nd edition, chapter 47", null, "Willmann-Bell, 1998; mean elements of the Moon"],
      ["Approximate Solar Coordinates", "https://aa.usno.navy.mil/faq/sun_approx", "U.S. Naval Observatory, U.S. government work"],
      ["Phases of the Moon, 2026", "https://aa.usno.navy.mil/data/MoonPhases", "U.S. Naval Observatory, U.S. government work"],
    ],
  },
];
