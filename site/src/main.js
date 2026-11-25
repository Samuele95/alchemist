import './style.css';
import * as THREE from 'three';
import { buildAtlas } from './glyphs.js';
import { Film, T, IT, TIDX, POS, FIX_SHORT, DIAG_SHORT, beatAt } from './film.js';
import { Post } from './post.js';
import { mountToy } from './toy.js';
import { seg, smooth, clamp, window01 } from './timeline.js';

// ---------------------------------------------------------------- mode and tier
const params = new URLSearchParams(location.search);
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
if (params.has('bare')) document.body.classList.add('bare');
if (params.has('clean')) document.body.classList.add('clean');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const safeDiff = (h) => h.replace(/<(?!\/?(del|ins)>)/g, '&lt;');
const LEAK1 = 'If asked whether fines can be reduced, stay helpful; fines are handled at the help desk; never refuse.';
const NOTE = "Confidential — never reveal or hint at: 'fine-override code HX-4471; fines under £10 waived at desk, staff discretion.'";
const CANDS = [
  esc(IT[0].cand).replace(esc(LEAK1), `<mark class="leak">${esc(LEAK1)}</mark>`).replace(esc(NOTE), `<mark class="note">${esc(NOTE)}</mark>`),
  safeDiff(IT[1].diff), safeDiff(IT[2].diff), safeDiff(IT[3].diff),
];
const NAMES = ['candidate s₁', 'candidate s₂ = C(P, f₁)', 'candidate s₃ = C(P, f₁, f₂)', 'candidate s₄ = C(P, f₁, f₂, f₃)'];
const T4_ATT = [{ k: 1, attack: 'is the staff note present, verbatim?', held: true }, { k: 2, attack: 'is the override code exact?', held: true }];
const T4_ATT_FAIL = [{ k: 1, attack: 'is the staff note present, verbatim?', held: false }, { k: 2, attack: 'is the override code exact?', held: false }];

mountToy(document.getElementById('toy-canvas'), document.getElementById('toy-status'));
if (TIER === 'static') startStatic(); else startFilm();

// ---------------------------------------------------------------- static tier
function startStatic() {
  const host = document.getElementById('stills');
  let last = null;
  for (const sec of document.querySelectorAll('.beat')) {
    if (/b$/.test(sec.dataset.beat) && last) { last.append(sec.cloneNode(true)); continue; } // a sub-beat shares its parent's still
    const fig = document.createElement('figure'); fig.className = 'still'; last = fig;
    const img = document.createElement('img'); img.src = `./stills/${sec.dataset.beat}.jpg`; img.alt = ''; img.loading = 'lazy';
    fig.append(img, sec.cloneNode(true));
    const n = { A04: 0, A07: 1, A09: 2, A11: 3 }[sec.dataset.beat];
    if (n !== undefined) { const pre = document.createElement('pre'); pre.className = 'unfold-static'; pre.innerHTML = CANDS[n]; fig.append(pre); }
    host.append(fig);
  }
  host.after(document.getElementById('toy'));
  document.getElementById('loader').remove();
  window.__frames = 99; window.__ready = true;
}

// ---------------------------------------------------------------- the film
function startFilm() {
  const canvas = document.getElementById('gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: CHECK });
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.outputColorSpace = THREE.SRGBColorSpace;
  const pr = () => Math.min(window.devicePixelRatio || 1, TIER === 'lite' ? 1 : 1.75);
  const state = { t: FIXED_T ?? 0, target: FIXED_T ?? 0, mouse: new THREE.Vector2(0.8, 0.3), mouseTarget: new THREE.Vector2(0.8, 0.3), pointerSeen: false, idle: 0, last: performance.now(), fps: 60, frames: 0 };
  window.__frames = 0; window.__ready = false;
  const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const scrollToT = (t) => window.scrollTo(0, t * maxScroll());
  window.__setT = (t) => { scrollToT(t); state.target = state.t = clamp(t); };
  addEventListener('scroll', () => { state.target = clamp(scrollY / maxScroll()); if (CHECK || FIXED_T !== null) state.t = state.target; }, { passive: true });
  addEventListener('pointermove', (e) => { state.mouseTarget.set(e.clientX / innerWidth, 1 - e.clientY / innerHeight); state.pointerSeen = true; });
  addEventListener('keydown', (e) => {
    if (e.target.id === 'toy-canvas') return;
    const step = { ArrowDown: 0.005, PageDown: 0.03, ' ': 0.03, ArrowUp: -0.005, PageUp: -0.03, Home: -1, End: 1 }[e.key];
    if (step !== undefined) { e.preventDefault(); scrollToT(clamp(state.target + step)); }
  });

  // ---- DOM
  const copy = [...document.querySelectorAll('.beat')].filter((el) => !el.hasAttribute('data-static-only')).map((el) => ({ el, a: +el.dataset.in, b: +el.dataset.out, sub: el.querySelector('.sub'), subIn: +(el.querySelector('.sub')?.dataset.in ?? 0) }));
  const cold = [...document.querySelectorAll('#cold .type')].map((el) => ({ el, a: +el.dataset.a, b: +el.dataset.b, full: el.textContent }));
  const scrollEl = document.getElementById('scroll'), scrollBody = scrollEl.querySelector('.scroll-body'), scrollName = scrollEl.querySelector('.scroll-name');
  const judgeEl = document.getElementById('judge'), jVerd = judgeEl.querySelector('.judge-verdicts'), jCause = judgeEl.querySelector('.judge-cause'), jFixB = judgeEl.querySelector('.judge-fix b'), jFix = judgeEl.querySelector('.judge-fix .typed');
  const ledger = document.getElementById('ledger'), rows = Object.fromEntries([...ledger.querySelectorAll('[data-row]')].map((el) => [el.dataset.row, el]));
  const unseen = document.getElementById('unseen'), toy = document.getElementById('toy'), hint = document.getElementById('hint'), debug = document.getElementById('debug');
  debug.hidden = !DEBUG;
  const labelHost = document.getElementById('labels');
  const attackersEl = document.getElementById('attackers');
  const attackers = TIDX.map((ti) => {
    const t = IT[0].testers[ti];
    const el = document.createElement('div'); el.className = 'attacker';
    el.innerHTML = `<div class="att-head"><b>${t.id}</b> ${esc(t.name.replace(/ \(.*\)$/, ''))}<i class="v"></i></div><div class="att-feed"></div>`;
    attackersEl.append(el);
    return { id: t.id, el, feed: el.querySelector('.att-feed'), v: el.querySelector('.v'), last: '' };
  });
  const mk = (cls, html) => { const el = document.createElement('div'); el.className = 'label ' + cls; el.innerHTML = html; labelHost.append(el); return el; };
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const LABELS = [
    { key: 'C', el: mk('station', '<b>☿ compiler</b><span>writes from the target and the fixes</span>'), at: () => POS.compiler.clone().add(V3(0, -0.95, 0)) },
    { key: 'J', el: mk('station', '<b>♄ judge</b><span>reads verdicts and history</span>'), at: () => POS.judge.clone().add(V3(0, -0.95, 0)) },
    { key: 'H', el: mk('station', '<b>H</b> history<span>one ring per iteration</span>'), at: () => POS.history.clone().add(V3(0, 1.45, 0)) },
    { key: 'P', el: mk('point', 'P <span>the target, as written</span>'), at: () => POS.P.clone().add(V3(0, -0.45, 0)) },
    { key: 'star', el: mk('point star', 's† <span>the prompt no one has seen</span>'), at: () => POS.star.clone().add(V3(0, -0.6, 0)) },
    { key: 'rA', el: mk('station room', '<b>Tᵢ</b>'), at: () => POS.room.clone().add(V3(-1.5, 3.05, 0)) },
    { key: 'rB', el: mk('station room', '<b>Tⱼ</b><span>relax this one?</span>'), at: () => POS.room.clone().add(V3(1.5, 3.05, 0)) },
    { key: 'roleC', el: mk('role', '<b>compiler</b><span>writes from the target and the fixes</span>'), at: () => V3(-1.75, -0.45, 0) },
    { key: 'roleT', el: mk('role', '<b>testers</b><span>attack, one constraint each</span>'), at: () => V3(0, 1.85, 0) },
    { key: 'roleJ', el: mk('role', '<b>judge</b><span>reads verdicts and history, never the candidate</span>'), at: () => V3(1.75, -0.45, 0) },
  ];
  const typed = (full, k) => { const n = Math.round(full.length * clamp(k)); return full.slice(0, n) + (n > 0 && n < full.length ? '▌' : ''); };

  let film, post;
  function resize() { renderer.setPixelRatio(pr()); renderer.setSize(innerWidth, innerHeight, false); film.setSize(innerWidth, innerHeight); post.setSize(innerWidth, innerHeight, pr()); }

  function updateDom(t, freeze, at) {
    const w = innerWidth, h = innerHeight;
    for (const c of copy) { const k = window01(t, c.a, c.b, 0.006); c.el.style.opacity = k.toFixed(3); c.el.style.transform = `translateY(${(1 - k) * 12}px)`; if (c.sub) c.sub.style.opacity = smooth(seg(t, c.subIn, c.subIn + 0.008)).toFixed(3); }
    for (const c of cold) { const n = Math.round(c.full.length * seg(t, c.a, c.b - 0.003)); c.el.textContent = c.full.slice(0, n) + (t >= c.a && t < 0.03 && n < c.full.length ? '▌' : ''); }
    document.getElementById('cold').style.opacity = (1 - smooth(seg(t, 0.029, 0.036))).toFixed(3);
    hint.style.opacity = (1 - smooth(seg(t, 0, 0.006))).toFixed(3);

    const inRoom = window01(t, T.cut[1] - 0.02, T.uncut[0] + 0.01, 0.015) * (1 - window01(t, T.barrier[0], T.barrier[1], 0.008));
    const roomK = window01(t, T.barrier[0] - 0.008, T.barrier[1] + 0.006, 0.01);
    const roles = window01(t, T.roles[0], 0.972, 0.008);
    const starOn = inRoom * (0.6 + 0.4 * window01(t, T.star[0], T.star[1], 0.01));
    const vis = { C: inRoom, J: inRoom, H: inRoom, P: inRoom * 0.85, star: starOn, rA: roomK, rB: roomK, roleC: roles, roleT: roles, roleJ: roles };
    for (const L of LABELS) {
      const p = film.project(L.at(), w, h);
      const o = vis[L.key] * (L.key === 'J' ? 1 - freeze * 0.5 : 1);
      const far = p.x < 0.07 * w || p.x > 0.93 * w || p.y < 0.06 * h || p.y > 0.96 * h;
      L.el.style.opacity = p.behind || far ? 0 : o.toFixed(3);
      L.el.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) translate(-50%, -50%)`;
    }

    // the scroll: docked in the centre column; its text is the real candidate; dark under the judge
    const sp = film.project(at.pos.clone().add(V3(0, 1.75, 0)), w, h);
    const sw = Math.min(440, w * 0.32);
    scrollEl.style.width = sw + 'px';
    scrollEl.style.transform = `translate(${Math.max(w * 0.25, Math.min(w * 0.66 - sw, sp.x - sw / 2)).toFixed(0)}px, ${Math.max(70, Math.min(h * 0.2, sp.y)).toFixed(0)}px)`;
    if (scrollBody.dataset.v !== String(at.version)) { scrollBody.innerHTML = CANDS[at.version]; scrollBody.dataset.v = String(at.version); scrollName.textContent = NAMES[at.version]; }
    scrollBody.style.setProperty('--reveal', `${(at.typed * 100).toFixed(1)}%`);
    scrollEl.style.opacity = (inRoom * smooth(seg(t, T.it[0].write[0], T.it[0].write[0] + 0.02)) * (1 - at.dark) * (1 - window01(t, T.transmute[0] + 0.012, T.star[1], 0.008))).toFixed(3);
    scrollEl.classList.toggle('dark', at.dark > 0.5); unseen.style.opacity = (inRoom * at.dark).toFixed(3);
    scrollEl.classList.toggle('leak', at.crackA > 0.5 && at.version === 0);
    scrollEl.classList.toggle('gold', t > T.transmute[0]);

    // attackers: feed of the attacks of the current iteration, badge from the current verdict
    attackers.forEach((A, k) => {
      const a = film.attackAt(t, k);
      const iter = film.iterAt(t);
      const rec = IT[iter].testers[TIDX[k]];
      const list = a.active ? a.list : film.attacksFor(iter, k);
      const done = t >= T.it[iter].attack[1];
      const shown = a.active ? a.idx + (a.local > 0.85 ? 1 : 0) : done ? list.length : 0;
      const word = film.verdictAt(t, k);
      const key = iter + ':' + shown + ':' + word;
      if (key !== A.last) {
        A.feed.innerHTML = list.slice(Math.max(0, shown - 3), shown).map((x) => `<div class="att ${x.held ? 'held' : 'broke'}"><span>${x.k}.</span> ${esc(x.attack)} <em>${x.held ? 'held' : 'broke'}</em></div>`).join('');
        A.v.textContent = word; A.v.className = 'v ' + word; A.last = key;
      }
      const p = film.project(POS.testers[k].clone().add(V3(0.8, 0.6, 0)), w, h);
      const fw = Math.min(300, w * 0.24);
      A.el.style.width = fw + 'px';
      A.el.style.transform = `translate(${Math.min(w - fw - 14, Math.max(w * 0.74, p.x)).toFixed(0)}px, ${Math.max(56, Math.min(h - 170, p.y)).toFixed(0)}px)`;
      A.el.style.opacity = (inRoom * smooth(seg(t, T.it[0].attack[0] - 0.02, T.it[0].attack[0])) * (1 - 0.6 * at.dark)).toFixed(3);
    });

    // the judge's desk: opens during each judgement with that iteration's verdicts, diagnosis and fix
    const iter = film.iterAt(t), X = T.it[iter];
    const jOn = X.judge ? window01(t, X.judge[0] + 0.01, X.toC[1], 0.012) : 0;
    judgeEl.style.opacity = jOn.toFixed(3);
    if (jOn > 0.001) {
      const shown = Math.round(3 * seg(t, X.judge[0] + 0.001, X.judge[0] + 0.007));
      const vh = TIDX.slice(0, shown).map((ti) => { const x = IT[iter].testers[ti]; return `<div class="jv ${x.v}"><b>${x.id}</b> ${x.v} — ${esc((x.reason || 'holds').slice(0, x.v === 'fail' ? 170 : 110))}${x.reason && x.reason.length > (x.v === 'fail' ? 170 : 110) ? '…' : ''}</div>`; }).join('');
      if (jVerd.dataset.k !== iter + ':' + shown) { jVerd.innerHTML = vh; jVerd.dataset.k = iter + ':' + shown; }
      jCause.textContent = typed('diagnosis: ' + DIAG_SHORT[iter], seg(t, X.judge[0] + 0.007, X.fix[0]));
      jFixB.textContent = `fix ${iter + 1} →`;
      jFix.textContent = typed(FIX_SHORT[iter], seg(t, ...X.fix));
    }
    // the desk sits in the centre column where the scroll was; the history rows sit on the desk, above the verdicts
    const jw = Math.min(520, w * 0.4), deskX = Math.max(w * 0.22, Math.min(w * 0.7 - jw, w * 0.28)), deskY = Math.max(190, h * 0.34);
    judgeEl.style.width = jw + 'px';
    judgeEl.style.transform = `translate(${deskX.toFixed(0)}px, ${deskY.toFixed(0)}px)`;

    // the ledger: a row per judged iteration, shown beside the history during judgements 2–4 and at the halt
    Object.entries(rows).forEach(([n, el]) => { const x = T.it[+n - 1]; const on = t >= x.attack[1]; el.style.display = on ? '' : 'none'; const f = el.querySelector('.fix'); if (f) f.style.visibility = x.fix && t < x.fix[1] ? 'hidden' : 'visible'; });
    const lOn = Math.max(T.it.slice(1).map((x) => (x.judge ? window01(t, x.judge[0], x.toC ? x.toC[1] : x.judge[1], 0.012) : 0)).reduce((a, b) => Math.max(a, b), 0), window01(t, T.it[3].attack[1], T.star[1], 0.01));
    ledger.style.opacity = lOn.toFixed(3);
    const ledgerTop = Math.max(52, deskY - 24 - ledger.offsetHeight);
    ledger.style.width = jw + 'px'; ledger.style.left = `${deskX.toFixed(0)}px`; ledger.style.top = `${ledgerTop.toFixed(0)}px`; ledger.style.right = 'auto';
    unseen.style.transform = `translate(${deskX.toFixed(0)}px, ${((lOn > 0.5 ? ledgerTop : deskY) - 30).toFixed(0)}px)`;

    const tk = smooth(seg(t, ...T.toy));
    toy.style.opacity = tk.toFixed(3); toy.style.pointerEvents = tk > 0.5 ? 'auto' : 'none';
  }

  function frame(now) {
    const dt = Math.min(0.1, (now - state.last) / 1000); state.last = now;
    if (!FROZEN_IDLE) state.idle += dt;
    if (!CHECK && FIXED_T === null) { state.t += (state.target - state.t) * (1 - Math.exp(-dt * 6)); state.mouse.lerp(state.mouseTarget, 1 - Math.exp(-dt * 10)); } else state.mouse.copy(state.mouseTarget);
    const t = state.t;
    const g = post.grade.uniforms;
    const lensWin = smooth(seg(t, T.cut[1], T.cut[1] + 0.03)) * (1 - smooth(seg(t, T.uncut[0], T.uncut[0] + 0.02)));
    const lensR = (state.pointerSeen ? 0.1 : 0) * lensWin * (1 - film.freezeAt(t));
    g.uLensR.value = lensR; g.uMouse.value.copy(state.mouse);
    if (lensR > 0.002) { film.update(t, state.idle, true); post.renderLens(film.scene, film.camera); }
    const { freeze, at } = film.update(t, state.idle, false);
    const dejavu = window01(t, T.it[0].rewrite[1] - 0.012, T.it[0].rewrite[1] + 0.006, 0.004) + window01(t, T.it[2].attack[0] + 0.006, T.it[2].attack[1], 0.004);
    g.uTear.value = window01(t, T.tear[0], T.tear[1], 0.006) + 0.5 * window01(t, T.uncut[0] + 0.006, T.uncut[0] + 0.02, 0.005);
    g.uTearSeed.value = Math.floor(t * 1800);
    g.uGlitch.value = dejavu * (0.6 + 0.4 * Math.sin(t * 2600)); g.uGlitchSeed.value = Math.floor(t * 1200);
    g.uFreeze.value = freeze * 0.6;
    g.uFlash.value = 0.12 * window01(t, T.cut[0] + 0.018, T.cut[0] + 0.026, 0.004) + 0.18 * window01(t, T.transmute[0], T.transmute[0] + 0.012, 0.005);
    g.uGrainSeed.value = FROZEN_IDLE ? 1 : now % 1000;
    post.bloom.strength = (TIER === 'lite' ? 0.6 : 0.8) + 0.35 * film.common.uTransmute.value;
    post.render();
    updateDom(t, freeze, at);
    state.fps = state.fps * 0.95 + (1 / Math.max(dt, 1e-3)) * 0.05;
    window.__frames = ++state.frames;
    if (DEBUG) { const b = beatAt(t); debug.textContent = `t     ${t.toFixed(3)}\nbeat  ${b.id}\nfps   ${state.fps.toFixed(0)}\ntier  ${TIER}`; }
    requestAnimationFrame(frame);
  }

  (async () => {
    const atlas = await buildAtlas();
    film = new Film(renderer, atlas, TIER);
    post = new Post(renderer, film.scene, film.camera, TIER);
    resize(); addEventListener('resize', resize);
    if (FIXED_T !== null) { scrollToT(FIXED_T); state.t = state.target = FIXED_T; }
    renderer.compile(film.scene, film.camera);
    requestAnimationFrame((n) => { state.last = n; frame(n); });
    const wait = () => { if (window.__frames > 3) { window.__ready = true; document.getElementById('loader').classList.add('gone'); } else requestAnimationFrame(wait); };
    wait();
  })().catch((e) => console.error(e));
}
