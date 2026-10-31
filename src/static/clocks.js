// Cabinet of Clocks: every dial on a page is an element with
// data-clock="<id>". Each reader below turns a Date into what that clock
// shows: a main reading, a line under it, and how far through its current
// unit it is (0 to 1), drawn as the bar along the bottom of the dial.
// Nothing here talks to the network; the only stored values are the
// latitude and longitude a reader may type (on the sidereal and unequal-hours
// pages) and the hemisphere chosen on the moon page, all kept in localStorage.

(function () {
  "use strict";

  const pad = (n, w = 2) => String(n).padStart(w, "0");
  const DAY = 86400;

  // Seconds since local midnight, with fraction.
  function localSeconds(d) {
    return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds() + d.getMilliseconds() / 1000;
  }

  function ordinary(d, utc) {
    if (utc) return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} local`;
  }

  const WATCHES = [
    [0, "Middle watch"],
    [4, "Morning watch"],
    [8, "Forenoon watch"],
    [12, "Afternoon watch"],
    [16, "First dog watch"],
    [18, "Last dog watch"],
    [20, "First watch"],
  ];

  function bellCount(d) {
    const half = Math.floor((d.getHours() * 60 + d.getMinutes()) / 30);
    return half % 8 || 8;
  }

  // Strokes in pairs, any odd one last: 5 bells is "●● ●● ●".
  function strokes(n) {
    const parts = [];
    for (let i = 0; i < Math.floor(n / 2); i++) parts.push("●●");
    if (n % 2) parts.push("●");
    return parts.join(" ");
  }

  function longitude() {
    try {
      const v = parseFloat(localStorage.getItem("coc-longitude"));
      return Number.isFinite(v) && v >= -180 && v <= 180 ? v : null;
    } catch (e) {
      return null;
    }
  }

  function hms(hours) {
    const t = Math.floor(hours * 3600);
    return `${pad(Math.floor(t / 3600))}:${pad(Math.floor(t / 60) % 60)}:${pad(t % 60)}`;
  }


  // The Moon. Elongation (Moon's longitude minus the Sun's) from the mean
  // elements in Meeus, Astronomical Algorithms (2nd ed., ch. 47), seven
  // principal periodic terms from Wikipedia's "Lunar theory", and the
  // USNO's approximate Sun (https://aa.usno.navy.mil/faq/sun_approx).
  // 0° is new moon, 180° full. Good to about twenty minutes in time.
  const SYNODIC = 29.530588861; // mean synodic month, days
  const LN0 = 2451550.26; // Meeus lunation 0: new moon of 6 Jan 2000
  const rad = Math.PI / 180;
  const sin = (x) => Math.sin(x * rad);
  const norm = (a) => ((a % 360) + 360) % 360;
  const wrap = (a) => { a = norm(a); return a > 180 ? a - 360 : a; };

  function elongation(jd) {
    const T = (jd - 2451545) / 36525;
    const n = jd - 2451545;
    const L = 218.3164477 + 481267.88123421 * T; // Moon's mean longitude
    const D = 297.8501921 + 445267.1114034 * T; // mean elongation
    const M = 357.5291092 + 35999.0502909 * T; // Sun's mean anomaly
    const Mp = 134.9633964 + 477198.8675055 * T; // Moon's mean anomaly
    const F = 93.272095 + 483202.0175233 * T; // argument of latitude
    const moon = L + 6.2886 * sin(Mp) + 0.2136 * sin(2 * Mp) + 1.2739 * sin(2 * D - Mp) +
      0.6583 * sin(2 * D) - 0.1856 * sin(M) - 0.1144 * sin(2 * F) - 0.0347 * sin(D);
    const g = 357.529 + 0.98560028 * n;
    const sun = 280.459 + 0.98564736 * n + 1.915 * sin(g) + 0.02 * sin(2 * g);
    return norm(moon - sun);
  }

  // The moment near jd when the elongation equals target, by Newton steps.
  function seek(jd, target) {
    let t = jd;
    for (let i = 0; i < 5; i++) t -= wrap(elongation(t) - target) / (360 / SYNODIC);
    return t;
  }

  function lunation(jd) {
    const e = elongation(jd);
    let last = seek(jd - e / (360 / SYNODIC), 0);
    if (last > jd) last = seek(last - SYNODIC, 0);
    let next = seek(last + SYNODIC, 0);
    if (next <= jd) { last = next; next = seek(last + SYNODIC, 0); }
    let full = seek(last + SYNODIC / 2, 180);
    if (full <= jd) full = null;
    return { e, last, next, full, no: Math.round((last - LN0) / SYNODIC) };
  }

  const PHASES = [[0, "New moon"], [90, "First quarter"], [180, "Full moon"], [270, "Last quarter"]];
  function phaseName(e) {
    for (const [at, name] of PHASES) if (Math.abs(wrap(e - at)) < 6) return name;
    if (e < 90) return "Waxing crescent";
    if (e < 180) return "Waxing gibbous";
    if (e < 270) return "Waning gibbous";
    return "Waning crescent";
  }


  // The Sun, for unequal hours. Position from the USNO's approximate
  // formulas (https://aa.usno.navy.mil/faq/sun_approx); rising and setting
  // from the sunrise equation with the Sun's centre 0.833° below the
  // horizon, for refraction and the Sun's half-width (Wikipedia, "Sunrise
  // equation"). Good to a minute or two away from the polar circles.
  const ROME = { lat: 41.9, lon: 12.5 };
  const cos = (x) => Math.cos(x * rad);

  function sunAt(jd) {
    const n = jd - 2451545;
    const g = 357.529 + 0.98560028 * n;
    const q = 280.459 + 0.98564736 * n;
    const L = q + 1.915 * sin(g) + 0.02 * sin(2 * g);
    const e = 23.439 - 0.00000036 * n;
    const ra = norm(Math.atan2(cos(e) * sin(L), cos(L)) / rad);
    return { dec: Math.asin(sin(e) * sin(L)) / rad, eqt: wrap(q - ra) / 360 }; // eqt in days
  }

  // Hour angle of rising/setting in days, or +Infinity (never sets) or
  // -Infinity (never rises).
  function halfDay(jd, lat) {
    const { dec } = sunAt(jd);
    const c = (sin(-0.833) - sin(lat) * sin(dec)) / (cos(lat) * cos(dec));
    if (c < -1) return Infinity;
    if (c > 1) return -Infinity;
    return Math.acos(c) / rad / 360;
  }

  // Rising and setting around the solar noon of day number n (days from
  // J2000.0), each refined once with the Sun's place at that moment.
  function sunDay(n, place) {
    let noon = 2451545 + n - place.lon / 360;
    for (let i = 0; i < 2; i++) noon = 2451545 + n - place.lon / 360 - sunAt(noon).eqt;
    const h = halfDay(noon, place.lat);
    if (!Number.isFinite(h)) return { noon, polar: h > 0 ? "day" : "night" };
    const rise = noon - halfDay(noon - h, place.lat);
    const set = noon + halfDay(noon + h, place.lat);
    return { noon, rise: Number.isFinite(rise) ? rise : noon - h, set: Number.isFinite(set) ? set : noon + h };
  }

  function latitude() {
    try {
      const v = parseFloat(localStorage.getItem("coc-latitude"));
      return Number.isFinite(v) && v >= -90 && v <= 90 ? v : null;
    } catch (e) {
      return null;
    }
  }

  // The reader's place if both numbers are set, otherwise Rome.
  function place() {
    const lat = latitude();
    const lon = longitude();
    return lat !== null && lon !== null ? { lat, lon, own: true } : { ...ROME, own: false };
  }

  // Which unequal hour holds jd: the last rising or setting before it, the
  // next one after it, and so whether it is day or night.
  // Risings ("day") and settings ("night") over the five days around jd,
  // in order, and whether today has none.
  function sunEvents(jd, where) {
    const n = Math.round(jd - 2451545 + where.lon / 360);
    const events = [];
    let polar = null;
    for (let k = -2; k <= 2; k++) {
      const s = sunDay(n + k, where);
      if (s.polar) { if (k === 0) polar = s.polar; continue; }
      events.push([s.rise, "day"], [s.set, "night"]);
    }
    events.sort((a, b) => a[0] - b[0]);
    return { events, polar };
  }

  function temporal(jd, where) {
    const { events, polar } = sunEvents(jd, where);
    let i = events.length - 1;
    while (i >= 0 && events[i][0] > jd) i--;
    const from = events[i];
    const to = events[i + 1];
    if (polar || !from || !to || from[1] === to[1]) return { polar: polar || "day" };
    const len = (to[0] - from[0]) / 12;
    const into = (jd - from[0]) / len;
    return { half: from[1], hour: Math.floor(into) + 1, frac: into - Math.floor(into), len, start: from[0], end: to[0] };
  }

  // Italian and Babylonian hours: equal hours counted from the last
  // sunset and the last sunrise. Null if there was none in the last day.
  function since(jd, where, kind) {
    const { events, polar } = sunEvents(jd, where);
    if (polar) return null;
    let last = null;
    for (const [t, k] of events) if (k === kind && t <= jd) last = t;
    return last !== null && jd - last < 1.05 ? (jd - last) * 24 : null;
  }

  function roman(n) {
    return ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][n - 1];
  }

  function minsec(days) {
    const t = Math.round(days * 86400);
    return `${Math.floor(t / 60)}m ${pad(t % 60)}s`;
  }

  const jdOf = (d) => d.getTime() / 86400000 + 2440587.5;
  const dateOf = (jd) => new Date((jd - 2440587.5) * 86400000);

  const readers = {
    decimal(d) {
      const s = localSeconds(d);
      const ds = Math.floor(s / 0.864); // decimal seconds since midnight
      const h = Math.floor(ds / 10000);
      return {
        main: `${h}:${pad(Math.floor(ds / 100) % 100)}:${pad(ds % 100)}`,
        sub: `decimal hour ${h + 1} of 10`,
        frac: s / DAY,
        utc: false,
      };
    },

    ke(d) {
      const k = localSeconds(d) / 864;
      const whole = Math.floor(k);
      const left = Math.ceil((1 - (k - whole)) * 864);
      return {
        main: `${whole} kè`,
        sub: `kè ${whole + 1} of 100 ends in ${Math.floor(left / 60)}m ${pad(left % 60)}s`,
        frac: k - whole,
        utc: false,
      };
    },

    hex(d) {
      const s = localSeconds(d);
      const u = Math.floor((s / DAY) * 65536);
      const x = u.toString(16).toUpperCase().padStart(4, "0");
      return {
        main: `${x[0]}_${x.slice(1, 3)}_${x[3]}`,
        sub: `.${x} of the day`,
        frac: s / DAY,
        utc: false,
      };
    },

    bells(d) {
      const n = bellCount(d);
      const h = d.getHours();
      let watch = WATCHES[0][1];
      for (const [start, name] of WATCHES) if (h >= start) watch = name;
      const into = (d.getMinutes() % 30) * 60 + d.getSeconds() + d.getMilliseconds() / 1000;
      return {
        main: `${n} bell${n === 1 ? "" : "s"}`,
        sub: `${strokes(n)}  ·  ${watch}`,
        frac: into / 1800,
        utc: false,
      };
    },

    julian(d) {
      const jd = d.getTime() / 86400000 + 2440587.5;
      return {
        main: jd.toFixed(5),
        sub: `MJD ${(jd - 2400000.5).toFixed(5)}`,
        frac: jd - Math.floor(jd),
        utc: true,
      };
    },

    unix(d) {
      const ms = d.getTime();
      const t = Math.floor(ms / 1000);
      const left = 2147483648 - t;
      const days = Math.floor(left / DAY);
      return {
        main: String(t),
        sub: left > 0 ? `32-bit overflow in ${days.toLocaleString("en")}d ${hms((left % DAY) / 3600)}` : "past the 32-bit overflow",
        frac: (ms % 1000) / 1000,
        utc: true,
      };
    },

    sidereal(d) {
      // USNO approximate GMST: D0 is days from J2000.0 to the previous
      // 0h UT, H the hours of UT since then. https://aa.usno.navy.mil/faq/GAST
      const jd = d.getTime() / 86400000 + 2440587.5;
      const jd0 = Math.floor(jd - 0.5) + 0.5;
      const h = (jd - jd0) * 24;
      const d0 = jd0 - 2451545.0;
      const t = (jd - 2451545.0) / 36525;
      let gmst = (6.697375 + 0.065709824279 * d0 + 1.0027379 * h + 0.0000258 * t * t) % 24;
      if (gmst < 0) gmst += 24;
      const lon = longitude();
      let st = gmst;
      let label = "Greenwich mean sidereal time";
      if (lon !== null) {
        st = (((gmst + lon / 15) % 24) + 24) % 24;
        label = `local mean sidereal time at ${Math.abs(lon)}° ${lon < 0 ? "W" : "E"}`;
      }
      return { main: hms(st), sub: label, frac: st / 24, utc: true };
    },
    temporal(d) {
      const where = place();
      const t = temporal(jdOf(d), where);
      const at = where.own ? "your place" : "Rome";
      if (t.polar) {
        return {
          main: t.polar === "day" ? "Sun up" : "Sun down",
          sub: `no rising or setting today at ${at}`,
          frac: 0,
          utc: false,
        };
      }
      return {
        main: `${t.half === "day" ? "Day" : "Night"} hour ${roman(t.hour)}`,
        sub: `an hour of ${minsec(t.len)}  ·  at ${at}`,
        frac: t.frac,
        utc: false,
      };
    },

    italian(d) {
      const where = place();
      const jd = jdOf(d);
      const it = since(jd, where, "night");
      const bab = since(jd, where, "day");
      const at = where.own ? "your place" : "Rome";
      if (it === null || bab === null) {
        return { main: "No count", sub: `no rising or setting today at ${at}`, frac: 0, utc: false };
      }
      const hm = (h) => `${Math.floor(h)}:${pad(Math.floor((h * 60) % 60))}`;
      return {
        main: `${hm(it)}:${pad(Math.floor((it * 3600) % 60))}`,
        sub: `hour ${Math.floor(it) + 1} from sunset  ·  Babylonian ${hm(bab)}  ·  ${at}`,
        frac: it - Math.floor(it),
        utc: false,
      };
    },

    moon(d) {
      const m = lunation(jdOf(d));
      const age = jdOf(d) - m.last;
      const mins = Math.floor(age * 1440);
      const lit = Math.round(((1 - Math.cos(m.e * rad)) / 2) * 100);
      return {
        main: `${Math.floor(mins / 1440)}d ${pad(Math.floor(mins / 60) % 24)}h ${pad(mins % 60)}m`,
        sub: `${phaseName(m.e)}  ·  ${lit}% lit`,
        frac: age / (m.next - m.last),
        utc: true,
      };
    },
  };

  const dials = Array.from(document.querySelectorAll("[data-clock]")).map((el) => ({
    el,
    read: readers[el.dataset.clock],
    main: el.querySelector(".dial-main"),
    sub: el.querySelector(".dial-sub"),
    bar: el.querySelector(".dial-bar span"),
    plain: el.querySelector(".dial-plain"),
  })).filter((x) => x.read);

  function tick() {
    const now = new Date();
    for (const x of dials) {
      const r = x.read(now);
      if (x.main.textContent !== r.main) x.main.textContent = r.main;
      if (x.sub && x.sub.textContent !== r.sub) x.sub.textContent = r.sub;
      if (x.bar) x.bar.style.width = (r.frac * 100).toFixed(2) + "%";
      if (x.plain) x.plain.textContent = "Your clock reads " + ordinary(now, r.utc);
    }
  }

  if (dials.length) {
    tick();
    setInterval(tick, 100);
  }

  // Place boxes (longitude on the sidereal page, latitude and longitude on
  // the unequal-hours page), remembered in this browser only.
  for (const input of document.querySelectorAll("input[data-store]")) {
    const key = input.dataset.store;
    const max = Number(input.max);
    try {
      const saved = parseFloat(localStorage.getItem(key));
      if (Number.isFinite(saved)) input.value = saved;
    } catch (e) { /* blocked */ }
    input.addEventListener("input", () => {
      const v = parseFloat(input.value);
      try {
        if (input.value.trim() === "") localStorage.removeItem(key);
        else if (Number.isFinite(v) && Math.abs(v) <= max) localStorage.setItem(key, String(v));
      } catch (e) {
        /* storage blocked: the clocks keep their defaults */
      }
      tick();
      if (drawSun) drawSun();
    });
  }

  // Unequal-hours page: the day's sunrise and sunset, and the place used.
  const sunFacts = document.getElementById("sun-facts");
  const clockTime = (jd) => dateOf(jd).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const drawSun = sunFacts && (() => {
    const where = place();
    const t = temporal(jdOf(new Date()), where);
    const deg = (v, p, m) => `${Math.abs(v)}° ${v < 0 ? m : p}`;
    const at = `${deg(where.lat, "N", "S")}, ${deg(where.lon, "E", "W")}${where.own ? "" : " (Rome)"}`;
    let line;
    if (t.polar) line = `The Sun ${t.polar === "day" ? "stays up" : "stays down"} all day at ${at}, so there are no unequal hours`;
    else {
      const other = t.half === "day" ? "Sunset" : "Sunrise";
      line = `${t.half === "day" ? "Sunrise was" : "Sunset was"} ${clockTime(t.start)}, ${other.toLowerCase()} at ${clockTime(t.end)} by your clock  ·  ${at}`;
    }
    if (sunFacts.textContent !== line) sunFacts.textContent = line;
  });
  if (drawSun) {
    drawSun();
    setInterval(drawSun, 30000);
  }

  // Moon page: draw the lit part of the disc and name the next phases.
  // Seen from the north the waxing moon is lit on the right; the button
  // mirrors it for the southern hemisphere, remembered in this browser.
  const moonFace = document.getElementById("moon-lit");
  if (moonFace) {
    const svg = document.getElementById("moon-face");
    const facts = document.getElementById("moon-facts");
    const flip = document.getElementById("moon-flip");
    let south = false;
    try { south = localStorage.getItem("coc-south") === "1"; } catch (e) { /* blocked */ }
    const when = (jd) => dateOf(jd).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    const drawMoon = () => {
      const m = lunation(jdOf(new Date()));
      const r = 50;
      const rx = (r * Math.abs(Math.cos(m.e * rad))).toFixed(2);
      const waxing = m.e < 180;
      const crescent = Math.cos(m.e * rad) > 0;
      // Lit limb as a half circle, then back along the terminator.
      const limb = waxing ? 1 : 0;
      const term = waxing === crescent ? 0 : 1;
      moonFace.setAttribute("d", `M0,${-r} A${r},${r} 0 0 ${limb} 0,${r} A${rx},${r} 0 0 ${term} 0,${-r} Z`);
      svg.style.transform = south ? "scaleX(-1)" : "";
      if (flip) flip.textContent = south ? "Show it as seen from the north" : "Show it as seen from the south";
      const next = (m.full ? `Full moon ${when(m.full)}, new moon ` : "New moon ") + when(m.next);
      const line = `${next}, your time  ·  lunation ${m.no}`;
      if (facts.textContent !== line) facts.textContent = line;
    };
    drawMoon();
    setInterval(drawMoon, 60000);
    if (flip) {
      flip.addEventListener("click", () => {
        south = !south;
        try { localStorage.setItem("coc-south", south ? "1" : "0"); } catch (e) { /* blocked */ }
        drawMoon();
      });
    }
  }

  // Ship's bells page: strike the current count with Web Audio.
  const bellButton = document.getElementById("strike");
  if (bellButton) {
    bellButton.addEventListener("click", () => {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const n = bellCount(new Date());
      let at = ctx.currentTime + 0.05;
      for (let i = 0; i < n; i++) {
        strike(ctx, at);
        // close within a pair, a longer gap between pairs
        at += i % 2 === 0 ? 0.35 : 1.0;
      }
      setTimeout(() => ctx.close(), (at - ctx.currentTime + 3) * 1000);
    });
  }

  // A bell-like tone: a few inharmonic partials with a fast attack and a
  // long exponential decay.
  function strike(ctx, at) {
    const partials = [[1, 0.5], [2.76, 0.25], [5.4, 0.12], [8.93, 0.06]];
    const base = 523;
    for (const [ratio, gain] of partials) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.frequency.value = base * ratio;
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(gain * 0.4, at + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 2.5 / ratio + 0.4);
      osc.connect(g).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 3);
    }
  }
})();
