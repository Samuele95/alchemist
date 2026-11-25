// "Your turn": a 2D simulation of coupled constraints. Two bands, one per requirement; a candidate
// point is fixed one requirement at a time (naive) until the history shows an alternation, then the
// judge steps for both. Deterministic in the band positions — no clock, no randomness.

export function mountToy(canvas, statusEl) {
  const g = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  // band = half-plane { p : n·p >= d }, drawn as the boundary line; two bands at an angle form a valley
  const bands = [
    { name: 'A', n: norm([0.25, 1]), d: 280, color: '#e0a640' },
    { name: 'B', n: norm([0.25, -1]), d: -166, color: '#cfd8ff' },
  ];
  let drag = -1;

  function norm(v) { const l = Math.hypot(v[0], v[1]); return [v[0] / l, v[1] / l]; }
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
  const pass = (p, b) => dot(b.n, p) >= b.d;

  function simulate() {
    let p = [70, 60];
    const path = [p], log = [];
    const N = 8;
    for (let it = 1; it <= N; it++) {
      const fails = bands.filter((b) => !pass(p, b));
      log.push(fails.map((b) => b.name).join(''));
      if (!fails.length) return { path, log, result: `halted at iteration ${it}: both requirements pass` };
      // has the history alternated? (A, then B, then A …)
      const alt = log.length >= 2 && log[log.length - 1] !== log[log.length - 2] && log[log.length - 1].length === 1 && log[log.length - 2].length === 1;
      if (alt) {
        // judge: one step for both — the nearest point where both pass, if there is one
        const q = solveBoth(p);
        if (!q) return { path, log, result: `barrier diagnosed at iteration ${it}: no point passes both — relax A or B` };
        p = q;
      } else {
        // naive fix: overshoot across the failing band's boundary
        const b = fails[0];
        const k = b.d - dot(b.n, p) + 70;
        p = [p[0] + b.n[0] * k, p[1] + b.n[1] * k];
      }
      path.push(p);
    }
    return { path, log, result: `budget of ${N} spent without a pass` };
  }
  function solveBoth(p) {
    // project p onto the intersection of the two half-planes (nearest corner or edge point), with a margin
    const m = 18;
    const cands = [];
    for (const b of bands) { const k = b.d + m - dot(b.n, p); cands.push(k > 0 ? [p[0] + b.n[0] * k, p[1] + b.n[1] * k] : p); }
    const [a, b] = bands;
    const det = a.n[0] * b.n[1] - a.n[1] * b.n[0];
    if (Math.abs(det) > 1e-6) {
      const x = ((a.d + m) * b.n[1] - a.n[1] * (b.d + m)) / det, y = (a.n[0] * (b.d + m) - (a.d + m) * b.n[0]) / det;
      cands.push([x, y]);
    }
    const ok = cands.filter((q) => bands.every((bb) => dot(bb.n, q) >= bb.d - 0.5) && q[0] > 0 && q[0] < W && q[1] > 0 && q[1] < H);
    if (!ok.length) return null;
    ok.sort((u, v) => Math.hypot(u[0] - p[0], u[1] - p[1]) - Math.hypot(v[0] - p[0], v[1] - p[1]));
    return ok[0];
  }

  function line(b) {
    // two points of n·p = d inside the canvas
    const t = [-b.n[1], b.n[0]];
    const p0 = [b.n[0] * b.d, b.n[1] * b.d];
    return [[p0[0] - t[0] * 2000, p0[1] - t[1] * 2000], [p0[0] + t[0] * 2000, p0[1] + t[1] * 2000]];
  }

  function draw() {
    g.clearRect(0, 0, W, H);
    g.fillStyle = '#060504';
    g.fillRect(0, 0, W, H);
    // where both pass
    const img = g.getImageData(0, 0, W, H);
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
      const both = bands.every((b) => pass([x, y], b));
      if (both) { const i = (y * W + x) * 4; img.data[i] = 64; img.data[i + 1] = 46; img.data[i + 2] = 16; }
    }
    g.putImageData(img, 0, 0);
    bands.forEach((b, i) => {
      const [p, q] = line(b);
      g.strokeStyle = b.color;
      g.lineWidth = drag === i ? 3 : 2;
      g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke();
      // hatch the failing side
      g.save(); g.globalAlpha = 0.12; g.strokeStyle = b.color; g.lineWidth = 1;
      for (let s = -40; s <= 0; s += 8) { const o = [b.n[0] * s, b.n[1] * s]; g.beginPath(); g.moveTo(p[0] + o[0], p[1] + o[1]); g.lineTo(q[0] + o[0], q[1] + o[1]); g.stroke(); }
      g.restore();
      const mid = [b.n[0] * b.d, b.n[1] * b.d];
      g.fillStyle = b.color; g.font = '500 13px "IBM Plex Mono", monospace';
      g.fillText(b.name, Math.min(W - 20, Math.max(8, mid[0] + 10)), Math.min(H - 10, Math.max(16, mid[1] - 8)));
    });
    const sim = simulate();
    g.strokeStyle = 'rgba(239,230,210,0.6)'; g.lineWidth = 1.2; g.setLineDash([4, 4]);
    g.beginPath(); sim.path.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); g.setLineDash([]);
    sim.path.forEach((p, i) => {
      const last = i === sim.path.length - 1;
      g.fillStyle = last ? '#ffe2a3' : '#efe6d2';
      g.beginPath(); g.arc(p[0], p[1], last ? 6 : 3.5, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#8a8174'; g.font = '11px "IBM Plex Mono", monospace'; g.fillText(`s${i + 1}`, p[0] + 8, p[1] - 6);
    });
    statusEl.textContent = sim.result;
  }

  function pick(e) {
    const r = canvas.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
  }
  canvas.addEventListener('pointerdown', (e) => {
    const p = pick(e);
    let best = -1, bd = 22;
    bands.forEach((b, i) => { const dd = Math.abs(dot(b.n, p) - b.d); if (dd < bd) { bd = dd; best = i; } });
    drag = best;
    if (drag >= 0) canvas.setPointerCapture(e.pointerId);
    draw();
  });
  canvas.addEventListener('pointermove', (e) => { if (drag < 0) return; bands[drag].d = dot(bands[drag].n, pick(e)); draw(); });
  canvas.addEventListener('pointerup', () => { drag = -1; draw(); });
  canvas.tabIndex = 0;
  canvas.addEventListener('keydown', (e) => {
    const k = { ArrowLeft: [0, -8], ArrowRight: [0, 8], ArrowUp: [1, -8], ArrowDown: [1, 8] }[e.key];
    if (!k) return;
    e.preventDefault(); bands[k[0]].d += k[1]; draw();
  });
  document.fonts.ready.then(draw);
  draw();
}
