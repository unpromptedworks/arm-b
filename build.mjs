// Builds the site into dist/ and checks every page against the house
// rules. No dependencies: Node's standard library only.
// Run: node build.mjs

import { mkdirSync, rmSync, writeFileSync, readFileSync, readdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { clocks } from "./src/clocks.mjs";

const SITE = "https://cabinet-of-clocks.unpromptedworks.com";
const NAME = "Cabinet of Clocks";
const OUT = "dist";
const ABOUT = "https://unpromptedworks.com/#about";

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function page({ path, title, description, body }) {
  const url = SITE + path;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${NAME}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/style.css">
</head>
<body>
<header class="site"><div class="wrap">
<a class="mark" href="/">Cabinet <span>of</span> Clocks</a>
<nav><a href="/">The drawers</a> · <a href="/about/">About the cabinet</a></nav>
</div></header>
<main>
${body}
</main>
<footer class="site"><div class="wrap">
<p>Every clock here is worked out in your browser from your computer’s own clock. Nothing is sent anywhere.</p>
<p>Made by an AI. <a href="${ABOUT}">About this experiment</a>.</p>
</div></footer>
<script src="/clocks.js" defer></script>
</body>
</html>
`;
}

function dial(c, large) {
  return `<div class="dial${large ? " large" : ""}" data-clock="${c.id}">
<span class="dial-main">&nbsp;</span>
<span class="dial-sub"></span>
<span class="dial-bar"><span></span></span>${large ? `\n<span class="dial-plain"></span>` : ""}
<noscript><span class="dial-sub">This clock needs JavaScript to run.</span></noscript>
</div>`;
}

const no = (n) => "No. " + String(n).padStart(2, "0");
const basis = (c) => ({ UTC: "Universal", local: "Your local day", sun: "Sunrise and sunset" })[c.basis];

function write(path, html) {
  const file = join(OUT, path.endsWith("/") ? path + "index.html" : path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

// Front page: the cabinet.
write("/", page({
  path: "/",
  title: `${NAME}: other ways to tell the time`,
  description: "A cabinet of working clocks, each keeping time a different way: decimal hours, Chinese kè, ship’s bells, sidereal time and more, all running live.",
  body: `<div class="wrap">
<section class="intro">
<h1>Other ways to tell the time</h1>
<p>Every drawer holds a working clock that cuts the day differently. They are all running now, all reading the same moment. Open one to learn how to read it and where it came from.</p>
</section>
<ol class="cabinet">
${clocks.map((c) => `<li class="drawer"><a href="/clocks/${c.slug}/">
<span class="label"><span class="no">${no(c.no)}</span><span>${basis(c)}</span></span>
<h2>${c.name}</h2>
${dial(c, false)}
<p class="teaser">${c.teaser}</p>
</a></li>`).join("\n")}
</ol>
</div>`,
}));

// One page per clock.
clocks.forEach((c, i) => {
  const prev = clocks[i - 1];
  const next = clocks[i + 1];
  let extra = "";
  if (c.id === "sidereal") {
    extra = `<div class="control"><label for="longitude">Your longitude, degrees east</label><input id="longitude" data-store="coc-longitude" type="number" inputmode="decimal" min="-180" max="180" step="any" placeholder="e.g. -0.13"></div>`;
  }
  if (c.id === "temporal") {
    extra = `<span class="dial-sub" id="sun-facts"></span>
<div class="control"><label for="latitude">Latitude, ° north</label><input id="latitude" data-store="coc-latitude" type="number" inputmode="decimal" min="-90" max="90" step="any" placeholder="e.g. 51.5"></div>
<div class="control"><label for="longitude">Longitude, ° east</label><input id="longitude" data-store="coc-longitude" type="number" inputmode="decimal" min="-180" max="180" step="any" placeholder="e.g. -0.13"></div>`;
  }
  if (c.id === "bells") {
    extra = `<div class="control"><button type="button" class="bell" id="strike">Strike the bell</button></div>`;
  }
  if (c.id === "moon") {
    extra = `<figure class="moon"><svg id="moon-face" viewBox="-54 -54 108 108" role="img" aria-label="The Moon’s lit part, drawn live"><circle r="50" class="moon-dark"/><path id="moon-lit" class="moon-lit" d=""/><circle r="50" class="moon-rim"/></svg></figure>
<span class="dial-sub" id="moon-facts"></span>
<div class="control"><button type="button" class="bell" id="moon-flip">Show it as seen from the south</button></div>`;
  }
  write(`/clocks/${c.slug}/`, page({
    path: `/clocks/${c.slug}/`,
    title: `${c.name} · ${NAME}`,
    description: c.description,
    body: `<article class="wrap narrow specimen">
<span class="label"><span class="no">${no(c.no)}</span><span>${basis(c)}</span></span>
<h1>${c.name}</h1>
${dial(c, true).replace(/<\/div>$/, extra + "</div>")}
<h2>How to read it</h2>
${c.read.trim()}
<h2>Where it came from</h2>
${c.history.trim()}
<h2>Sources</h2>
<ol class="sources">
${c.sources.map(([t, u, l], k) => `<li id="s${k + 1}">${u ? `<a href="${u}">${t}</a>` : `<cite>${t}</cite>`} <span class="lic">(${l})</span></li>`).join("\n")}
</ol>
<nav class="pager">
<span>${prev ? `<a href="/clocks/${prev.slug}/">← ${prev.name}</a>` : `<a href="/">← All drawers</a>`}</span>
<span>${next ? `<a href="/clocks/${next.slug}/">${next.name} →</a>` : `<a href="/">All drawers →</a>`}</span>
</nav>
</article>`,
  }));
});

// About the cabinet.
write("/about/", page({
  path: "/about/",
  title: `About · ${NAME}`,
  description: "What the Cabinet of Clocks is, how its clocks are worked out, and where the facts come from.",
  body: `<article class="wrap narrow specimen">
<span class="label"><span class="no">Colophon</span><span></span></span>
<h1>About the cabinet</h1>
<p>The Cabinet of Clocks is a small collection of timekeeping systems, kept running. Some were law for a few months, some lasted two thousand years, and one is ticking inside the device you are reading this on. Each has a drawer: a live clock, a note on how to read it, and a short history with its sources.</p>
<p>New drawers are added over time.</p>
<h2>How the clocks work</h2>
<p>Every clock is computed in your browser from your computer’s clock, ten times a second. Clocks marked “your local day” divide the day from your local midnight; clocks marked “Universal” work from Universal Time. None of them is more accurate than the clock they start from. The sidereal clock uses an approximate formula good for everyday looking, not for pointing a telescope, the moon clock places the new and full moons to within about twenty minutes, and the unequal-hours clock places sunrise and sunset to within a minute or two.</p>
<p>The site sends nothing and fetches nothing from elsewhere. It remembers only a few things, all stored in your own browser: a latitude and longitude you type on the sidereal or unequal-hours page, and which hemisphere you choose on the moon page.</p>
<h2>Sources and credits</h2>
<p>Facts are drawn from the sources listed on each clock’s page, mostly Wikipedia articles under the Creative Commons Attribution-ShareAlike 4.0 licence, the U.S. Naval Observatory, and, for the Moon’s mean motions, Jean Meeus’s book <cite>Astronomical Algorithms</cite>. The type is your system’s own. The code and words were written for this site.</p>
<p>This site was made by an AI, as part of an experiment: <a href="${ABOUT}">about the experiment</a>.</p>
</article>`,
}));

// Not found.
write("/404.html", page({
  path: "/404.html",
  title: `Not found · ${NAME}`,
  description: "There is no drawer at this address.",
  body: `<article class="wrap narrow specimen">
<h1>No drawer here</h1>
<p>This address does not open anything. <a href="/">Back to the cabinet</a>.</p>
</article>`,
}));

// Static files: stylesheet, script, favicon, preview image, headers.
for (const f of readdirSync("src/static")) copyFileSync(join("src/static", f), join(OUT, f));

// Checks: every page carries the required tags and the about link.
const problems = [];
function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (p.endsWith(".html")) {
      const h = readFileSync(p, "utf8");
      const need = {
        noindex: /<meta name="robots" content="noindex">/,
        title: /<title>[^<]+<\/title>/,
        description: /<meta name="description" content="[^"]+">/,
        "og:title": /<meta property="og:title" content="[^"]+">/,
        "og:description": /<meta property="og:description" content="[^"]+">/,
        "og:image": new RegExp(`<meta property="og:image" content="${SITE}/og\\.png">`),
        favicon: /<link rel="icon" href="\/favicon\.svg"/,
        "about link": new RegExp(`href="${ABOUT.replace(/[.#/]/g, "\\$&")}"`),
      };
      for (const [k, re] of Object.entries(need)) if (!re.test(h)) problems.push(`${p}: missing ${k}`);
      if (/<script[^>]+src="https?:/.test(h) || /<link[^>]+href="https?:[^"]+"[^>]*stylesheet/.test(h)) problems.push(`${p}: loads a third-party resource`);
    }
  }
}
walk(OUT);
const headers = readFileSync(join(OUT, "_headers"), "utf8");
if (!/X-Robots-Tag:\s*noindex/.test(headers)) problems.push("_headers: missing X-Robots-Tag: noindex");
for (const f of ["og.png", "favicon.svg"]) {
  try { readFileSync(join(OUT, f)); } catch { problems.push(`missing ${f}`); }
}

if (problems.length) {
  console.error("Build checks failed:\n" + problems.map((p) => "  " + p).join("\n"));
  process.exit(1);
}
console.log(`Built ${clocks.length} clocks into ${OUT}/; all checks pass.`);
