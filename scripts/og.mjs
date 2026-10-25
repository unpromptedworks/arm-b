// Renders src/static/og.png, the 1200x630 preview image, from the site's
// own stylesheet. Run by hand when the design changes; it uses the
// Playwright and Chromium already present in the build machine, so the
// site's build itself needs neither.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import { readFileSync } from "node:fs";

const css = readFileSync("src/static/style.css", "utf8");
const html = `<!doctype html><html><head><style>${css}
body{width:1200px;height:630px;margin:0;display:flex;flex-direction:column;justify-content:center;padding:0 90px;}
h1{font-weight:normal;font-size:96px;line-height:1;margin:0 0 28px;letter-spacing:-0.01em}
h1 span{color:var(--brass)}
.row{display:flex;gap:56px;font-family:var(--mono);font-size:40px;color:var(--ink);margin-top:40px}
.row small{display:block;font-family:var(--serif);font-size:20px;color:var(--muted);letter-spacing:.08em;text-transform:uppercase}
p{font-size:34px;color:var(--muted);margin:0}
</style></head><body>
<h1>Cabinet <span>of</span> Clocks</h1>
<p>Other ways to tell the time, kept running.</p>
<div class="row"><div><small>Decimal</small>5:00:00</div><div><small>Hexadecimal</small>8_00_0</div><div><small>Kè</small>50 kè</div><div><small>Bells</small>●● ●● ●● ●●</div></div>
</body></html>`;

const browser = await chromium.launch();
const pg = await browser.newPage({ viewport: { width: 1200, height: 630 }, colorScheme: "light" });
await pg.setContent(html);
await pg.screenshot({ path: "src/static/og.png" });
await browser.close();
