// Loads the built site with no position, waits, and checks that the film plays itself (scrollY advances),
// that a wheel event pauses it, and that the play button resumes it. Prints the measurements; exits 1 on failure.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(siteDir, 'dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  const f = path.join(dist, u === '/' ? 'index.html' : u);
  if (!f.startsWith(dist) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(base + '?tier=lite&dur=60', { waitUntil: 'load' });
await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
await page.waitForTimeout(6000);
const a = await page.evaluate(() => ({ y: scrollY, pressed: document.getElementById('play').getAttribute('aria-pressed'), label: document.getElementById('play').textContent.trim() }));
await page.mouse.wheel(0, 0); await page.waitForTimeout(300);
const b = await page.evaluate(() => ({ y: scrollY, pressed: document.getElementById('play').getAttribute('aria-pressed') }));
await page.waitForTimeout(1500);
const c = await page.evaluate(() => scrollY);
await page.click('#play'); await page.waitForTimeout(2500);
const d = await page.evaluate(() => ({ y: scrollY, pressed: document.getElementById('play').getAttribute('aria-pressed'), bar: document.querySelector('#progress b').style.width }));
console.log({ afterLoad: a, afterWheel: b, stillAfterWheel: c, afterPlay: d, errors });
await browser.close(); server.close();
const ok = a.y > 50 && a.pressed === 'true' && b.pressed === 'false' && Math.abs(c - b.y) < 2 && d.pressed === 'true' && d.y > c + 20 && errors.length === 0;
console.log(ok ? 'OK: autoplay runs, pauses on wheel, resumes on play' : 'FAIL');
process.exit(ok ? 0 : 1);
