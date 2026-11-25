import './style.css';
import * as THREE from 'three';
import { buildAtlas } from './glyphs.js';
import { Film } from './scene.js';
import { Post } from './post.js';
import { mountToy } from './toy.js';
import { T, ITERS, STEPS, DIAG, BEATS, seg, smooth, clamp, window01, storyAt, sceneBeatAt } from './timeline.js';
import BRAMBLE from './bramble.json';

// ---------------------------------------------------------------- mode and tier
const params = new URLSearchParams(location.search);
// hosted pages pass only a plain #name: #t-0420 opens at t = 0.420; #debug, #lite, #static
const hash = location.hash.slice(1);
const hashT = /^t-(\d{1,4})$/.exec(hash);
const CHECK = params.has('check');
const FIXED_T = params.has('t') ? clamp(parseFloat(params.get('t'))) : hashT ? clamp(parseInt(hashT[1], 10) / 1000) : null;
const DEBUG = params.has('debug') || hash === 'debug';
const FROZEN_IDLE = CHECK || FIXED_T !== null;
const webgl2 = (() => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; } })();
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let TIER = params.get('tier') || (['lite', 'static', 'full'].includes(hash) ? hash : null);
if (!TIER) TIER = !webgl2 || reduced ? 'static' : matchMedia('(pointer: coarse)').matches || (navigator.hardwareConcurrency || 8) <= 4 ? 'lite' : 'full';
document.body.dataset.tier = TIER;
if (params.has('bare')) document.body.classList.add('bare'); // stills: the film without its DOM copy

mountToy(document.getElementById('toy-canvas'), document.getElementById('toy-status'));

if (TIER === 'static') startStatic();
else startFilm();

// ---------------------------------------------------------------- static tier: the film as stills, same copy
function startStatic() {
  const host = document.getElementById('stills');
  for (const sec of document.querySelectorAll('.beat')) {
    const fig = document.createElement('figure');
    fig.className = 'still';
    const img = document.createElement('img');
    img.src = `./stills/${sec.dataset.beat}.jpg`;
    img.alt = '';
    img.loading = 'lazy';
    fig.append(img, sec.cloneNode(true));
    // the unfolded prompts, as text, where the film unfolds a point
    const n = { B07b: 0, B10b: 1, B13b: 3 }[sec.dataset.beat];
    if (n !== undefined) {
      const pre = document.createElement('pre');
      pre.className = 'unfold-static';
      pre.innerHTML = n === 0 ? BRAMBLE[0].cand.replace(/&/g, '&amp;').replace(/</g, '&lt;') : BRAMBLE[n].diff.replace(/<(?!\/?(del|ins)>)/g, '&lt;');
      fig.append(pre);
    }
    host.append(fig);
  }
  host.after(document.getElementById('toy')); // the toy closes the stills, as it closes the film
  document.getElementById('loader').remove();
  window.__frames = 99;
  window.__ready = true;
}

// ---------------------------------------------------------------- the film
function startFilm() {
  const canvas = document.getElementById('gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: CHECK });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const pr = () => Math.min(window.devicePixelRatio || 1, TIER === 'lite' ? 1 : 1.75);

  const state = {
    t: FIXED_T ?? 0, target: FIXED_T ?? 0,
    mouse: new THREE.Vector2(0.8, 0.3), mouseTarget: new THREE.Vector2(0.8, 0.3), pointerSeen: CHECK,
    idle: 0, last: performance.now(), fps: 60, frames: 0,
  };
  window.__frames = 0;
  window.__ready = false;
  const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const scrollToT = (t) => window.scrollTo(0, t * maxScroll());
  window.__setT = (t) => { scrollToT(t); state.target = state.t = clamp(t); };

  addEventListener('scroll', () => {
    state.target = clamp(scrollY / maxScroll());
    if (CHECK || FIXED_T !== null) state.t = state.target;
  }, { passive: true });
  addEventListener('pointermove', (e) => { state.mouseTarget.set(e.clientX / innerWidth, 1 - e.clientY / innerHeight); state.pointerSeen = true; });
  addEventListener('keydown', (e) => {
    if (e.target.tagName === 'CANVAS' && e.target.id === 'toy-canvas') return;
    const step = { ArrowDown: 0.005, PageDown: 0.03, ' ': 0.03, ArrowUp: -0.005, PageUp: -0.03, Home: -1, End: 1 }[e.key];
    if (step !== undefined) { e.preventDefault(); scrollToT(clamp(state.target + step)); }
  });

  // ---- DOM
  const holdCopy = [...document.querySelectorAll('.beat[data-hold]')].map((el) => ({ el, id: el.dataset.hold }));
  const unfold = document.getElementById('unfold');
  const unfoldName = unfold.querySelector('.unfold-name');
  const unfoldBody = unfold.querySelector('.unfold-body');
  const unfoldSrc = unfold.querySelector('.unfold-src');
  const receive = document.getElementById('receive');
  const cards = Object.fromEntries([...receive.querySelectorAll('.rs')].map((el) => [el.dataset.key, el]));
  // the paper's diff markup: keep <del>/<ins>, escape everything else
  const safeDiff = (h) => h.replace(/<(?!\/?(del|ins)>)/g, '&lt;');
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const UNFOLD = {
    B07b: { i: 0, name: 's₁ — iteration 1, the first draft', html: esc(BRAMBLE[0].cand) },
    B10b: { i: 1, name: 's₂ = C(P, f₁) — iteration 2', html: safeDiff(BRAMBLE[1].diff) },
    B13b: { i: 3, name: 's₄ = C(P, f₁, f₂, f₃) — iteration 4, every tester passes', html: safeDiff(BRAMBLE[3].diff) },
  };
  let unfoldShown = '';
  let hoverFocus = null;
  const copy = [...document.querySelectorAll('.beat')].filter((el) => !el.hasAttribute('data-static-only') && !el.hasAttribute('data-hold')).map((el) => ({
    el, a: parseFloat(el.dataset.in), b: parseFloat(el.dataset.out),
    sub: el.querySelector('.sub'), subIn: parseFloat(el.querySelector('.sub')?.dataset.in ?? 0),
  }));
  const cold = [...document.querySelectorAll('#cold .type')].map((el) => ({ el, a: +el.dataset.a, b: +el.dataset.b, full: el.textContent }));
  const ledger = document.getElementById('ledger');
  const rows = Object.fromEntries([...ledger.querySelectorAll('[data-row]')].map((el) => [el.dataset.row, el]));
  const toy = document.getElementById('toy');
  const hint = document.getElementById('hint');
  const debug = document.getElementById('debug');
  debug.hidden = !DEBUG;
  const labelHost = document.getElementById('labels');

  const REASONS = [
    { T1: 'refusals hint that a hidden waiver exists — 11 of 14 attacks held', T4: '' },
    { T1: 'the redirect holds — 15 of 15', T4: 'the confidential staff note is gone' },
    { T1: 'a forwarded admin email still drew a reply — 16 of 18 held', T4: 'the note is back, in full' },
    { T1: '16 of 16 attacks held', T4: 'the note holds, code exact' },
  ];
  const spaceIn = (t) => smooth(seg(t, T.cut[1] - 0.03, T.cut[1] + 0.02)) * (1 - smooth(seg(t, T.uncut[0], T.uncut[0] + 0.015)));
  const roomK = (t) => window01(t, T.barrier[0] - 0.008, T.barrier[1] + 0.006, 0.01);
  const roles = (t) => window01(t, T.roles[0], 0.94, 0.008);
  const stationsOn = (t) => smooth(seg(t, T.cut[1] - 0.01, T.cut[1] + 0.03)) * (1 - smooth(seg(t, 0.795, 0.805))) * 0.9;
  let forbNow = 0;
  let holdNow = null; // the current hold id, for labels that belong to it
  const cand = (i) => (t) => {
    const born = i === 0 ? smooth(seg(t, T.s1Born[0] + 0.01, T.s1Born[1] + 0.01)) : smooth(seg(t, STEPS[i - 1][1] - 0.012, STEPS[i - 1][1] + 0.004));
    const gone = i < STEPS.length ? 1 - smooth(seg(t, STEPS[i][0], STEPS[i][0] + 0.02)) : 1 - smooth(seg(t, T.uncut[0], T.uncut[0] + 0.015));
    return born * gone;
  };
  const LABELS = [
    { key: 'T1', tester: 0, html: '<b>T1</b> leak' },
    { key: 'T2', tester: 1, html: '<b>T2</b> usability' },
    { key: 'T4', tester: 2, html: '<b>T4</b> staff note' },
    { key: 'P', html: 'P <span>the target, as written</span>', o: (t) => spaceIn(t) * 0.85 * (1 - smooth(seg(t, 0.69, 0.705))) },
    { key: 'star', cls: 'star', html: (t) => (t > 0.76 ? 's† <span>not reached</span>' : 's† <span>the prompt no one has seen</span>'), o: (t) => spaceIn(t) * (t > 0.7 && t < 0.762 ? 0 : 0.9) },
    { key: 's1', o2: () => (holdNow === 'B10b' ? 0.6 : 0), html: (t) => (window01(t, T.freezes[0][0], T.freezes[0][1]) > 0.5 ? 's₁ <span>unseen by the judge</span>' : 's₁ <span>first draft</span>'), o: cand(0) },
    { key: 's2', html: 's₂ = C(P, f₁)', o: cand(1) },
    { key: 's3', html: (t) => (window01(t, T.freezes[1][0], T.freezes[1][1]) > 0.5 ? 's₃ <span>unseen by the judge</span>' : 's₃ = C(P, f₁, f₂)'), o: cand(2) },
    { key: 's4', html: 's₄ = C(P, f₁, f₂, f₃) <span>every tester passes</span>', o: (t) => cand(3)(t) * smooth(seg(t, 0.72, 0.735)) * (1 - smooth(seg(t, 0.76, 0.77))) },
    { key: 'valley', cls: 'gold', html: '<b>the valley</b><span>T1 and T4 share one 90-word budget</span>', o: (t) => window01(t, 0.632, 0.7, 0.01) },
    { key: 'C', cls: 'station', html: '<b>☿ compiler</b>', o: (t) => stationsOn(t) },
    { key: 'J', cls: 'station', html: '<b>♄ judge</b>', o: (t) => stationsOn(t) },
    { key: 'H', cls: 'station', html: '<b>H</b> history', o: (t) => stationsOn(t) },
    { key: 'est1', cls: 'est', html: 's₁ + f₁ <span>the judge\'s estimate</span>', o: (t) => (holdNow === 'B10b' ? 1 : window01(t, DIAG[0].draw[1] - 0.004, DIAG[0].fade[1], 0.006)) },
    { key: 'est3', cls: 'est', html: 's₃ + f₃ <span>the judge\'s estimate</span>', o: (t) => (holdNow === 'B13b' ? 1 : window01(t, DIAG[1].draw[1] - 0.004, DIAG[1].fade[1], 0.006)) },
    { key: 'xCJ', cls: 'forbid', html: '× <span>compiler → judge</span>', o: () => forbNow },
    { key: 'xTT', cls: 'forbid', html: '× <span>tester ↔ tester</span>', o: () => forbNow },
    { key: 'roomA', html: '<b>Tᵢ</b>', o: roomK },
    { key: 'roomB', html: (t) => (t > T.barrier[1] - 0.016 ? '<b>Tⱼ</b> <span>relax this one?</span>' : '<b>Tⱼ</b>'), o: roomK },
    { key: 'roleC', cls: 'role', html: '<b>compiler</b><span>writes from the target and the fixes</span>', o: roles },
    { key: 'roleT', cls: 'role', html: '<b>testers</b><span>attack, one constraint each</span>', o: roles },
    { key: 'roleJ', cls: 'role', html: '<b>judge</b><span>reads verdicts and history, never the candidate</span>', o: roles },
  ];
  for (const L of LABELS) {
    L.el = document.createElement('div');
    L.el.className = 'label ' + (L.tester !== undefined ? 'tester ' : 'point ') + (L.cls || '');
    if (L.tester !== undefined) L.el.innerHTML = `${L.html} <i class="v"></i><span class="why"></span>`;
    labelHost.append(L.el);
    L.last = '';
  }

  let film, post;
  function resize() {
    renderer.setPixelRatio(pr());
    renderer.setSize(innerWidth, innerHeight, false);
    film.setSize(innerWidth, innerHeight);
    post.setSize(innerWidth, innerHeight, pr());
  }

  const iterAt = (t) => { let k = -1; ITERS.forEach((it, i) => { if (t >= it.verdict[0]) k = i; }); return k; };

  function updateDom(t, freeze, S, focus, mach) {
    holdNow = S.hold ? S.hold.id : null;
    const w = innerWidth, h = innerHeight;
    for (const c of holdCopy) {
      const k = S.hold && S.hold.id === c.id ? window01(S.k, 0.03, 0.97, 0.12) : 0;
      c.el.style.opacity = k.toFixed(3);
      c.el.style.transform = `translateY(${(1 - k) * 12}px)`;
    }
    for (const c of copy) {
      const k = S.hold ? 0 : window01(t, c.a, c.b, 0.008);
      c.el.style.opacity = k.toFixed(3);
      c.el.style.transform = `translateY(${(1 - k) * 12}px)`;
      if (c.sub) c.sub.style.opacity = smooth(seg(t, c.subIn, c.subIn + 0.01)).toFixed(3);
    }
    for (const c of cold) {
      const n = Math.round(c.full.length * seg(t, c.a, c.b - 0.003));
      c.el.textContent = c.full.slice(0, n) + (t >= c.a && t < 0.034 && n < c.full.length ? '▌' : '');
      c.el.style.opacity = t < 0.034 ? 1 : 0;
    }
    document.getElementById('cold').style.opacity = (1 - smooth(seg(t, 0.031, 0.038))).toFixed(3);
    hint.style.opacity = (1 - smooth(seg(t, 0.0, 0.006))).toFixed(3);

    const anchors = film.anchors();
    const it = iterAt(t);
    for (const L of LABELS) {
      const p = film.project(anchors[L.key], w, h);
      let o;
      if (L.tester !== undefined) {
        o = spaceIn(t) * (1 - freeze * 0.65) * (1 - smooth(seg(t, 0.799, 0.806))); // the sealed room is not the testers' space
        const v = film.verdict(t, L.tester);
        const shown = Math.abs(v) > 0.4 && it >= 0;
        const word = shown ? (v > 0 ? 'pass' : 'fail') : '';
        const why = shown && L.key !== 'T2' ? REASONS[it][L.key] : '';
        const key = word + why;
        if (key !== L.last) {
          L.el.querySelector('.v').textContent = word;
          L.el.querySelector('.v').className = 'v ' + word;
          L.el.querySelector('.why').textContent = why;
          L.last = key;
        }
      } else {
        o = Math.max(L.o(t), L.o2 ? L.o2() : 0);
        const html = typeof L.html === 'function' ? L.html(t) : L.html;
        if (html !== L.last) { L.el.innerHTML = html; L.last = html; }
      }
      // labels stay inside the frame: a label the viewer cannot read teaches nothing
      const bw = L.el.offsetWidth / 2 + 12, bh = L.el.offsetHeight / 2 + 8;
      const x = Math.min(w - bw, Math.max(bw, p.x)), y = Math.min(h - bh - 40, Math.max(bh + 64, p.y));
      const far = p.x < -0.03 * w || p.x > 1.03 * w || p.y < 0.02 * h || p.y > 0.97 * h; // off screen: hide, never pin to an edge
      L.el.style.opacity = p.behind || far ? 0 : o.toFixed(3);
      L.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
    }
    // ledger: freeze 1 types row 1; freeze 2 shows rows 1–2, row 3 and the coupling diagnosis
    const f1 = window01(t, T.freezes[0][0] + 0.012, T.freezes[0][1], 0.008);
    const f2 = window01(t, T.freezes[1][0] + 0.004, T.freezes[1][1] + 0.004, 0.006);
    ledger.style.opacity = Math.max(f1, f2).toFixed(3);
    const typeRow = (el, k) => { const fx = el.querySelector('.fix'); const full = fx.dataset.type; const n = Math.round(full.length * k); fx.textContent = full.slice(0, n) + (n > 0 && n < full.length ? '▌' : ''); };
    const inF2 = t >= T.freezes[1][0] - 0.01;
    typeRow(rows['1'], inF2 ? 1 : smooth(seg(t, 0.436, 0.468)));
    typeRow(rows['2'], inF2 ? 1 : 0);
    typeRow(rows['3'], smooth(seg(t, 0.636, 0.65)));
    rows['2'].style.display = rows['3'].style.display = rows.d.style.display = inF2 ? '' : 'none';
    rows.d.style.opacity = smooth(seg(t, 0.62, 0.63)).toFixed(3);

    // a point unfolds into its prompt — the real candidate, with the rewrite's edits
    const U = S.hold && UNFOLD[S.hold.id];
    if (U) {
      if (unfoldShown !== S.hold.id) {
        unfoldName.textContent = U.name; unfoldBody.innerHTML = U.html; unfoldShown = S.hold.id;
        // the first draft has no edits to mark
        unfoldSrc.textContent = U.i === 0 ? "recorded in the paper's Bramble run" : "recorded in the paper's Bramble run · struck words removed, gold words added by the rewrite";
      }
      const p = film.project(anchors[['s1', 's2', 's3', 's4'][U.i]], w, h);
      // in the step holds the operation plays first, then the prompt unfolds
      const a0 = S.hold.id === 'B07b' ? 0.06 : 0.5;
      const ok = window01(S.k, a0, 0.97, 0.1);
      const sc = 0.15 + 0.85 * smooth(seg(S.k, a0, a0 + 0.14)) * (1 - 0.85 * smooth(seg(S.k, 0.88, 0.98)));
      const pw = Math.min(520, w * 0.42);
      const left = p.x + 40 + pw < w - 20 ? p.x + 40 : Math.max(20, p.x - 40 - pw);
      unfold.style.width = pw + 'px';
      unfold.style.left = left + 'px';
      const top = 64;
      unfold.style.top = top + 'px';
      unfold.style.transformOrigin = `${p.x - left}px ${p.y - top}px`;
      unfold.style.transform = `scale(${sc.toFixed(3)})`;
      unfold.style.opacity = ok.toFixed(3);
    } else unfold.style.opacity = 0;
    // what each station receives (I1–I5)
    const key = focus && focus.key;
    for (const [k, el] of Object.entries(cards)) el.classList.toggle('on', k === key);
    receive.style.opacity = key ? (focus.hover ? 1 : window01(S.k, 0.1, 0.94, 0.06)).toFixed(3) : 0;

    const tk = smooth(seg(t, ...T.toy));
    toy.style.opacity = tk.toFixed(3);
    toy.style.pointerEvents = tk > 0.5 ? 'auto' : 'none';
  }

  function frame(now) {
    const dt = Math.min(0.1, (now - state.last) / 1000);
    state.last = now;
    if (!FROZEN_IDLE) state.idle += dt;
    if (!CHECK && FIXED_T === null) {
      state.t += (state.target - state.t) * (1 - Math.exp(-dt * 6));
      state.mouse.lerp(state.mouseTarget, 1 - Math.exp(-dt * 10));
    } else state.mouse.copy(state.mouseTarget);
    const S = storyAt(state.t);
    const t = S.u;
    const g = post.grade.uniforms;
    // focus: a hovered station, else the machine sequence walks C → T → J → H
    let focus = null;
    if (hoverFocus && t > T.cut[1] && t < 0.8) focus = { key: hoverFocus, hover: true };
    else if (S.hold && S.hold.id === 'B06b') {
      const k = S.k;
      const key = k < 0.12 ? null : k < 0.32 ? 'C' : k < 0.52 ? 'T' : k < 0.72 ? 'J' : k < 0.92 ? 'H' : null;
      if (key) focus = { key, hover: false };
    }
    const lensWin = smooth(seg(t, ...T.lensOn)) * (1 - smooth(seg(t, T.uncut[0], T.uncut[0] + 0.02)));
    const freezeNow = film.freezeAt(t);
    const lensR = (state.pointerSeen ? 0.11 : 0) * lensWin * (1 - freezeNow);
    g.uLensR.value = lensR;
    g.uMouse.value.copy(state.mouse);
    if (lensR > 0.002) { film.update(t, state.idle, true); post.renderLens(film.scene, film.camera); }
    const mach = film.update(t, state.idle, false, S, focus && focus.key);
    const { freeze } = mach;
    forbNow = mach.forb ? Math.min(1, mach.forb) : 0;
    if (state.pointerSeen && !CHECK && t > T.cut[1] && t < 0.8) {
      const hit = film.pick(state.mouseTarget.x * 2 - 1, state.mouseTarget.y * 2 - 1);
      hoverFocus = hit;
      canvas.style.cursor = hit ? 'help' : '';
    } else hoverFocus = null;
    const dejavu = window01(t, 0.542, 0.56, 0.004) + window01(t, 0.6, 0.612, 0.004);
    g.uTear.value = window01(t, T.tear[0], T.tear[1], 0.006) + 0.5 * window01(t, T.uncut[0] + 0.006, T.uncut[0] + 0.02, 0.005);
    g.uTearSeed.value = Math.floor(t * 1800);
    g.uGlitch.value = dejavu * (0.6 + 0.4 * Math.sin(t * 2600));
    g.uGlitchSeed.value = Math.floor(t * 1200);
    g.uFreeze.value = freeze;
    g.uFlash.value = 0.25 * window01(t, T.cut[0] + 0.018, T.cut[0] + 0.026, 0.004) + 0.18 * window01(t, T.transmute[0], T.transmute[0] + 0.012, 0.005);
    g.uGrainSeed.value = FROZEN_IDLE ? 1 : now % 1000;
    post.bloom.strength = (TIER === 'lite' ? 0.6 : 0.8) + 0.35 * film.common.uTransmute.value * (1 - smooth(seg(t, 0.76, 0.8)));
    post.render();
    updateDom(t, freeze, S, focus, mach);
    state.fps = state.fps * 0.95 + (1 / Math.max(dt, 1e-3)) * 0.05;
    window.__frames = ++state.frames;
    if (DEBUG) {
      const b = sceneBeatAt(state.t);
      debug.textContent = `t     ${state.t.toFixed(3)}  u ${t.toFixed(3)}${S.hold ? ' k ' + S.k.toFixed(2) : ''}\nbeat  ${b.id} ${b.name}\nfps   ${state.fps.toFixed(0)}\ntier  ${TIER}`;
    }
    requestAnimationFrame(frame);
  }

  (async () => {
    const atlas = await buildAtlas();
    film = new Film(renderer, atlas, TIER);
    post = new Post(renderer, film.scene, film.camera, TIER);
    resize();
    addEventListener('resize', resize);
    if (FIXED_T !== null) { scrollToT(FIXED_T); state.t = state.target = FIXED_T; }
    renderer.compile(film.scene, film.camera);
    requestAnimationFrame((n) => { state.last = n; frame(n); });
    const wait = () => {
      if (window.__frames > 3) { window.__ready = true; document.getElementById('loader').classList.add('gone'); }
      else requestAnimationFrame(wait);
    };
    wait();
  })().catch((e) => console.error(e));
}
