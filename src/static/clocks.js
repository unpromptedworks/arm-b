// Cabinet of Clocks: every dial on a page is an element with
// data-clock="<id>". Each reader below turns a Date into what that clock
// shows: a main reading, a line under it, and how far through its current
// unit it is (0 to 1), drawn as the bar along the bottom of the dial.
// Nothing here talks to the network; the only stored value is the
// longitude a reader may type on the sidereal page, kept in localStorage.

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

  // Sidereal page: a longitude box, remembered in this browser only.
  const lonInput = document.getElementById("longitude");
  if (lonInput) {
    const saved = longitude();
    if (saved !== null) lonInput.value = saved;
    lonInput.addEventListener("input", () => {
      const v = parseFloat(lonInput.value);
      try {
        if (lonInput.value.trim() === "") localStorage.removeItem("coc-longitude");
        else if (Number.isFinite(v) && v >= -180 && v <= 180) localStorage.setItem("coc-longitude", String(v));
      } catch (e) {
        /* storage blocked: the clock just stays on Greenwich */
      }
      tick();
    });
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
