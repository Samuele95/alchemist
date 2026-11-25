// Screenshots of the paper's figures (as rendered in the browser) for the README.
// usage: node scripts/paper-shots.mjs <outDir>
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(siteDir, 'dist');
const out = path.resolve(process.argv[2] || 'paper-shots'); fs.mkdirSync(out, { recursive: true });
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
const page = await browser.newPage({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 2 });
await page.goto(base + 'paper.html', { waitUntil: 'load' });
await page.addStyleTag({ content: 'header.runhead { display: none !important; } figure.figure, figure.float, .ix.framed { background: #fff; padding: 10px 0; }' });
await page.waitForTimeout(2500);
const figs = await page.$$('figure.figure, figure.float, .ix.framed, .ix-teaser');
const list = [];
for (const [i, fig] of figs.entries()) {
  const cap = (await fig.$eval('figcaption', (e) => e.textContent.trim()).catch(() => '')) || '';
  const m = /^Figure (\d+)/.exec(cap);
  const name = m ? `fig${String(m[1]).padStart(2, '0')}` : `ix${i}`;
  const box = await fig.boundingBox(); if (!box || box.height < 40) continue;
  await fig.evaluate((e) => e.scrollIntoView({ block: 'start' })); await page.waitForTimeout(500);
  const b = await fig.boundingBox(); if (!b) continue;
  await page.screenshot({ path: path.join(out, name + '.png'), clip: { x: Math.max(0, b.x), y: Math.max(0, b.y), width: Math.min(b.width, 1100), height: Math.min(b.height, 880) }, animations: 'disabled' });
  list.push({ name, cap: cap.slice(0, 110), h: Math.round(box.height) });
}
console.log(list.map((x) => `${x.name} (${x.h}px) ${x.cap}`).join('\n'));
await browser.close(); server.close();
