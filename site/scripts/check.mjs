// npm --prefix site run check -- --t=<list> | --step=<fraction> | --scrub=<from>,<to> --out=<folder> [--tier=full|lite|static]
// Builds, serves the build, renders frames headless, and fails on page errors, flat frames,
// identical neighbouring frames (frame mode) or up/down mismatches (scrub mode).
import { execSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { PNG } from 'pngjs';

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = process.env.INIT_CWD ? path.resolve(process.env.INIT_CWD) : path.resolve(siteDir, '..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, ...v] = a.replace(/^--/, '').split('=');
  return [k, v.join('=') || true];
}));
const tier = args.tier || 'full';
const out = path.resolve(repoRoot, args.out || 'site-chain/out/frames/adhoc');
fs.mkdirSync(out, { recursive: true });

let ts = [];
let scrub = null;
if (args.t) ts = String(args.t).split(',').map(Number);
else if (args.step) { const s = Number(args.step); for (let x = 0; x <= 1 + 1e-9; x += s) ts.push(+x.toFixed(4)); }
else if (args.scrub) { const [a, b] = String(args.scrub).split(',').map(Number); scrub = [a, b]; }
else { console.log('ERROR: give --t, --step or --scrub'); process.exit(2); }

const lines = [];
const fail = (m) => lines.push('ERROR: ' + m);
const ok = (m) => lines.push('OK: ' + m);

if (!args['no-build']) execSync('npx vite build', { cwd: siteDir, stdio: 'ignore' });

const dist = path.join(siteDir, 'dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  const f = path.join(dist, u === '/' ? 'index.html' : u);
  if (!f.startsWith(dist) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

const stats = (buf) => {
  const png = PNG.sync.read(buf);
  let s = 0, s2 = 0; const n = png.width * png.height;
  for (let i = 0; i < png.data.length; i += 4) { const l = (png.data[i] + png.data[i + 1] + png.data[i + 2]) / 3; s += l; s2 += l * l; }
  const mean = s / n; return { png, mean, std: Math.sqrt(Math.max(0, s2 / n - mean * mean)) };
};
const diff = (a, b) => {
  let d = 0; for (let i = 0; i < a.data.length; i += 4) d += Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]);
  return d / (a.data.length / 4) / 3;
};
const waitFrames = (n) => page.evaluate((n) => new Promise((r) => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
const name = (t, suf = '') => path.join(out, `t-${t.toFixed(3)}${suf}.png`);

try {
  if (!scrub) {
    let prev = null;
    for (const t of ts) {
      await page.goto(`${base}?check=1&t=${t}&tier=${tier}${args.bare ? '&bare=1' : ''}`);
      await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
      await waitFrames(3);
      const buf = await page.screenshot();
      fs.writeFileSync(name(t), buf);
      const st = stats(buf);
      if (st.std < 2 && t > 0) fail(`t=${t.toFixed(3)} — flat frame (std ${st.std.toFixed(2)})`);
      if (prev && tier !== 'static') {
        const d = diff(prev.png, st.png);
        if (d < 0.05) fail(`t=${t.toFixed(3)} — identical to the previous frame (mean diff ${d.toFixed(3)})`);
      }
      prev = st;
    }
    ok(`frames ${ts.length} saved to ${path.relative(repoRoot, out)}`);
  } else {
    await page.goto(`${base}?check=1&tier=${tier}`);
    await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
    const steps = 10, up = [], down = [];
    const at = (i) => scrub[0] + ((scrub[1] - scrub[0]) * i) / steps;
    for (let i = 0; i <= steps; i++) { await page.evaluate((t) => window.__setT(t), at(i)); await waitFrames(3); up[i] = await page.screenshot(); fs.writeFileSync(name(at(i), '-up'), up[i]); }
    for (let i = steps; i >= 0; i--) { await page.evaluate((t) => window.__setT(t), at(i)); await waitFrames(3); down[i] = await page.screenshot(); fs.writeFileSync(name(at(i), '-down'), down[i]); }
    let worst = 0;
    for (let i = 0; i <= steps; i++) {
      const d = diff(PNG.sync.read(up[i]), PNG.sync.read(down[i]));
      worst = Math.max(worst, d);
      if (d > 0.5) fail(`t=${at(i).toFixed(3)} — scrubbing back differs from forward (mean diff ${d.toFixed(2)})`);
    }
    ok(`scrub ${scrub[0]}→${scrub[1]}→${scrub[0]}, ${steps + 1} pairs, worst diff ${worst.toFixed(3)}`);
  }
  for (const e of [...new Set(errors)]) fail(`page error — ${e}`);
} finally {
  await browser.close();
  server.close();
}
const errs = lines.filter((l) => l.startsWith('ERROR')).length;
console.log(`SUMMARY: ${errs === 0 ? 'passed' : 'failed'}, ${errs} errors, tier ${tier}`);
console.log(lines.join('\n'));
process.exit(errs ? 1 : 0);
