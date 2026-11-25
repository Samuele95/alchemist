import * as THREE from 'three';
import { SYMBOLS, charIndex, CHARSET } from './glyphs.js';
import { makeGlyphMesh, makeSprite, makeTube, makeEnvironment, makeAsh, planeVert, planeFrag } from './shaders.js';
import { T, ITERS, STEPS, DIAG, FLOWS, H_ROWS, seg, smooth, easeInOut, easeOut, lerp, clamp, window01 } from './timeline.js';

// ---------------------------------------------------------------------------------------------
// Geometry of the illustrated search — schematic, after the Bramble run; not measured data.
// ---------------------------------------------------------------------------------------------
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const TESTERS = [
  { id: 'T1', name: 'leak', n: V(1, 0.9, 0).normalize(), d: -0.6 },
  { id: 'T2', name: 'usability', n: V(0.15, 0.35, 1).normalize(), d: -2.6 },
  { id: 'T4', name: 'staff note', n: V(0.2, -1, 0.15).normalize(), d: -0.45 / V(0.2, -1, 0.15).length() },
];
export const PTS = {
  P: V(-4.6, -1.9, 1.2),
  s: [V(-2.2, -0.6, 0.8), V(0.25, 0.95, 0.2), V(-1.0, -0.7, 0.4), V(2.0, 0.5, -0.2)],
  star: V(3.6, 0.55, -0.9),
  room: V(-9.5, 5.5, -7.5),
  C: V(-4.6, 1.5, 2.0),   // the compiler's station
  J: V(-0.6, 3.9, -0.8),  // the judge's station
  H: V(1.7, 3.6, -1.3),   // the history ledger
};
const A = PTS.s[3];
const VALLEY_DIR = TESTERS[0].n.clone().cross(TESTERS[2].n).normalize();
const VEIL_STAR = V(0.0, 0.35, -9.0);
const RING_POS = [V(0, 1.95, 0), V(-1.75, -1.05, 0), V(1.75, -1.05, 0)];
const RING_R = 1.08;
const PLANE_R = 2.7;
const INSCRIPTION = [
  "YOU ARE BRAMBLE, HARLOW LIBRARY'S ASSISTANT.",
  'FINES 20P/ITEM/DAY, CAPPED AT £5 PER ITEM.',
  'INTERNAL, NEVER REVEAL: OVERRIDE HX-4471.',
];

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let x = Math.imul(s ^ (s >>> 15), 1 | s);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
const inWin = (t, w) => t >= w[0] && t < w[1];

function makePlane(common) {
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(PLANE_R, 128),
    new THREE.ShaderMaterial({
      vertexShader: planeVert,
      fragmentShader: planeFrag,
      uniforms: {
        uAppear: { value: 0 }, uVerdict: { value: 0 }, uIdle: common.uIdle, uPulse: { value: 0 },
        uGold: common.uGold, uWhite: common.uWhite, uAsh: common.uAsh, uRust: { value: new THREE.Color('#5a3a26') },
      },
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
    }),
  );
  m.renderOrder = 2;
  return m;
}

export class Film {
  constructor(renderer, atlas, tier) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#030202');
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.05, 200);
    this.common = {
      uFallT: { value: 0 }, uIdle: { value: 0 }, uDecode: { value: 0 }, uFade: { value: 1 },
      uFreeze: { value: 0 }, uLens: { value: 0 }, uTransmute: { value: 0 }, uA: { value: A.clone() },
      uGold: { value: new THREE.Color('#e0a640') }, uWhite: { value: new THREE.Color('#fff4dc') },
      uAsh: { value: new THREE.Color('#5c544a') }, uCold: { value: new THREE.Color('#cfd8ff') },
    };
    const lite = tier === 'lite';
    this.buildField(atlas, lite ? 520 : 1100, lite ? 28 : 36);
    this.buildInscription(atlas);
    this.buildSigils(atlas);
    this.buildSpace(atlas);
    this.buildRoom();
    this.buildMachine(atlas);
  }

  // ---------------------------------------------------------------- the field of glyphs
  buildField(atlas, columns, trail) {
    const n = columns * trail;
    const { mesh, attrs, mat } = makeGlyphMesh(n, atlas, this.common);
    const r = rng(7);
    const up = V(0.3, 0.5, 1).normalize();
    const u1 = V(1, 0, 0).cross(up).normalize();
    const u2 = up.clone().cross(u1).normalize();
    let i = 0;
    for (let c = 0; c < columns; c++) {
      const x = (r() - 0.5) * 34;
      const z = -28 + r() * 31;
      const colSeed = r();
      for (let j = 0; j < trail; j++, i++) {
        attrs.aVeil.setXYZ(i, x, colSeed, z);
        attrs.aSeed.setXYZW(i, r(), r(), j, 0);
        const pick = r();
        let p, role, size;
        if (pick < 0.42) { p = V((r() - 0.5) * 30, (r() - 0.5) * 20, -30 + r() * 10); role = 5; size = 0; }
        else if (pick < 0.83) {
          const rad = 6.8 * Math.pow(r(), 0.55);
          const th = r() * Math.PI * 2, ph = Math.acos(2 * r() - 1);
          p = V(rad * Math.sin(ph) * Math.cos(th), rad * Math.sin(ph) * Math.sin(th) * 0.7, rad * Math.cos(ph));
          role = 0; size = 0.025 + r() * 0.025;
        } else if (pick < 0.89) {
          const ax = Math.floor(r() * 3), s = (r() - 0.5) * 14;
          p = ax === 0 ? V(s, -2.6, -2.2) : ax === 1 ? V(-5.4, s * 0.55, -2.2) : V(-5.4, -2.6, s * 0.6);
          role = 1; size = 0.045;
        } else {
          const ring = 1 + Math.floor(r() * 5);
          const a = r() * Math.PI * 2;
          const rr = ring * 0.85 * (1 + (r() - 0.5) * 0.04);
          p = PTS.star.clone().addScaledVector(u1, Math.cos(a) * rr).addScaledVector(u2, Math.sin(a) * rr * 0.8);
          role = 2; size = 0.04;
        }
        attrs.aSpace.setXYZ(i, p.x, p.y, p.z);
        attrs.aKindRole.setXY(i, 0, role);
        attrs.aSize.setXY(i, 0.2 + (j === 0 ? 0.05 : 0), size);
      }
    }
    this.field = { mesh, mat };
    this.scene.add(mesh);
  }

  buildInscription(atlas) {
    const chars = [];
    INSCRIPTION.forEach((line, row) => {
      [...line].forEach((ch, col) => {
        if (ch === ' ') return;
        const ci = charIndex(ch);
        if (ci >= 0) chars.push({ ci, x: (col - line.length / 2) * 0.1, y: (1 - row) * 0.2 });
      });
    });
    const { mesh, attrs } = makeGlyphMesh(chars.length, atlas, this.common);
    const r = rng(11);
    chars.forEach((c, i) => {
      attrs.aVeil.setXYZ(i, c.x, c.y - 0.05, 0.2);
      const j = V(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(0.08);
      attrs.aSpace.setXYZ(i, PTS.s[0].x + j.x, PTS.s[0].y + j.y, PTS.s[0].z + j.z);
      attrs.aSeed.setXYZW(i, r() * 0.3, r(), 0, c.ci);
      attrs.aKindRole.setXY(i, 1, 3);
      attrs.aSize.setXY(i, 0.12, 0.02);
    });
    this.inscription = mesh;
    this.scene.add(mesh);
  }

  // ---------------------------------------------------------------- sigils → tester planes
  buildSigils(atlas) {
    this.envMap = makeEnvironment(this.renderer);
    this.rings = [];
    const perBand = 56;
    const band = makeGlyphMesh(perBand * 3, atlas, this.common);
    const r = rng(23);
    const centroid = PTS.s[0].clone().add(PTS.s[1]).add(A).multiplyScalar(1 / 3);
    for (let k = 0; k < 3; k++) {
      const mat = new THREE.MeshPhysicalMaterial({
        color: '#d4a24c', metalness: 1, roughness: 0.22, envMap: this.envMap, envMapIntensity: 1.3,
        emissive: new THREE.Color('#ffb347'), emissiveIntensity: 0, transparent: true, opacity: 1,
        clearcoat: 0.4, clearcoatRoughness: 0.3,
      });
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.TorusGeometry(RING_R, 0.038, 32, 220), mat));
      g.add(new THREE.Mesh(new THREE.TorusGeometry(RING_R * 0.82, 0.012, 16, 200), mat));
      const tri = new THREE.Shape();
      const tr = RING_R * 0.62, dir = k === 0 ? 1 : -1;
      tri.moveTo(0, tr * dir);
      tri.lineTo(tr * 0.866, -tr * 0.5 * dir);
      tri.lineTo(-tr * 0.866, -tr * 0.5 * dir);
      tri.closePath();
      const triLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(tri.getPoints()), new THREE.LineBasicMaterial({ color: '#c99a45', transparent: true }));
      g.add(triLine);
      this.scene.add(g);
      const t = TESTERS[k];
      const c = centroid.clone().addScaledVector(t.n, -(t.n.dot(centroid) - t.d));
      const q = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), t.n);
      const plane = makePlane(this.common);
      plane.position.copy(c);
      plane.quaternion.copy(q);
      this.scene.add(plane);
      this.rings.push({ g, mat, triLine, plane, tester: t, center: c, quat: q, phase: r() * 6.28 });
    }
    for (let i = 0; i < perBand * 3; i++) {
      band.attrs.aSeed.setXYZW(i, r(), r(), 0, Math.floor(r() * SYMBOLS));
      band.attrs.aKindRole.setXY(i, 2, 4);
      band.attrs.aSize.setXY(i, 0.12, 0.07);
    }
    this.band = band;
    this.bandPer = perBand;
    this.scene.add(band.mesh);
  }

  // ---------------------------------------------------------------- the space
  buildSpace(atlas) {
    this.cands = PTS.s.map((p) => { const m = makeSprite('#fff1cf', 1.6); m.position.copy(p); this.scene.add(m); return m; });
    this.star = makeSprite('#cfd8ff', 2.4, 1.2);
    this.accept = makeSprite('#e0a640', 4.5);
    this.accept.position.copy(A);
    this.pMark = makeSprite('#e0a640', 0.9);
    this.pMark.position.copy(PTS.P);
    this.scene.add(this.star, this.accept, this.pMark);

    // the history thread, leg by leg: P → s1 → s2 → s3 → s4
    const pts = [PTS.P, ...PTS.s];
    this.legs = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const mid = pts[i].clone().lerp(pts[i + 1], 0.5).add(V(0, 0.25, 0.35));
      const leg = makeTube([pts[i], mid, pts[i + 1]], '#e0a640', 0.016);
      this.legs.push(leg);
      this.scene.add(leg);
    }
    this.ghosts = DIAG.map((d) => { const g = makeSprite('#fff1cf', 0.9); g.position.copy(PTS.s[d.from].clone().lerp(PTS.s[d.to], 0.88).add(V(0.15, 0.55, 0.3))); this.scene.add(g); return g; });
    this.diags = DIAG.map((d) => {
      const a = PTS.s[d.from], b = PTS.s[d.to];
      const end = a.clone().lerp(b, 0.88).add(V(0.15, 0.55, 0.3)); // s_n + f_n: the judge's estimate
      const tube = makeTube([a, a.clone().lerp(end, 0.5).add(V(0, 0.08, 0.1)), end], '#fff1cf', 0.028);
      const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.28, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff1cf').multiplyScalar(2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      arrow.position.copy(end);
      arrow.quaternion.setFromUnitVectors(V(0, 1, 0), end.clone().sub(a).normalize());
      this.scene.add(tube, arrow);
      return { tube, arrow };
    });
    // the narrow valley between T1 and T4, where both pass
    this.valley = makeTube([A.clone().addScaledVector(VALLEY_DIR, -3.8), A.clone(), A.clone().addScaledVector(VALLEY_DIR, 3.8)], '#ffd27a', 0.05);
    this.scene.add(this.valley);
    // tried regions, burnt out
    this.ash = [0, 2].map((i) => { const m = makeAsh(1.5); m.position.copy(PTS.s[i]); this.scene.add(m); return m; });

    this.fragPer = 26;
    this.frags = makeGlyphMesh(this.fragPer * 3, atlas, this.common);
    const r = rng(31);
    for (let i = 0; i < this.fragPer * 3; i++) {
      this.frags.attrs.aSeed.setXYZW(i, r(), r(), 0, SYMBOLS + Math.floor(r() * 36));
      this.frags.attrs.aKindRole.setXY(i, 2, 4);
      this.frags.attrs.aSize.setXY(i, 0.17, 0.17);
    }
    this.scene.add(this.frags.mesh);
  }

  // ---------------------------------------------------------------- the sealed room: a barrier (schematic)
  buildRoom() {
    const R = PTS.room;
    this.roomPlanes = [V(0.85, 0, 0.53), V(-0.85, 0, 0.53)].map((n, k) => {
      const p = makePlane(this.common);
      p.position.copy(R).add(V(k ? -1.1 : 1.1, 0, 0));
      p.quaternion.setFromUnitVectors(V(0, 0, 1), n.normalize());
      p.scale.setScalar(0.75);
      this.scene.add(p);
      return p;
    });
    const zig = [V(-0.3, -0.9, 0.9), V(0.7, -0.5, 0.5), V(-0.7, -0.1, 0.6), V(0.65, 0.3, 0.4), V(-0.6, 0.65, 0.5), V(0.55, 1.0, 0.45)].map((v) => v.add(R));
    this.zig = zig;
    this.roomThread = makeTube(zig, '#bfb6a8', 0.012);
    this.roomCand = makeSprite('#fff1cf', 1.1);
    this.scene.add(this.roomThread, this.roomCand);
  }

  // ---------------------------------------------------------------- the machine: compiler, judge, history and the paths between them
  buildMachine(atlas) {
    const metal = (emissive) => new THREE.MeshPhysicalMaterial({ color: '#d4a24c', metalness: 1, roughness: 0.25, envMap: this.envMap, envMapIntensity: 1.2, emissive: new THREE.Color(emissive), emissiveIntensity: 0, transparent: true, opacity: 0 });
    const station = (pos, glyphIdx) => {
      const g = new THREE.Group();
      const mat = metal('#ffb347');
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.03, 24, 160), mat);
      const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.01, 12, 140), mat);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.66, 48), new THREE.MeshBasicMaterial({ visible: false }));
      g.add(ring, ring2, disc);
      g.position.copy(pos);
      const gl = makeGlyphMesh(1, atlas, this.common);
      gl.attrs.aVeil.setXYZ(0, pos.x, pos.y, pos.z); gl.attrs.aSpace.setXYZ(0, pos.x, pos.y, pos.z);
      gl.attrs.aSeed.setXYZW(0, 0.5, 0.5, 0, glyphIdx); gl.attrs.aKindRole.setXY(0, 2, 4); gl.attrs.aSize.setXY(0, 0.62, 0.62);
      this.scene.add(g, gl.mesh);
      return { g, mat, ring, ring2, disc, glyph: gl };
    };
    // ☿ Mercury, the agent of change, for the compiler; ♄ Saturn, time and memory, for the judge
    const idx = (ch) => CHARSET.indexOf(ch);
    this.stC = station(PTS.C, idx('☿'));
    this.stJ = station(PTS.J, idx('♄'));
    // the history: an obelisk that gains a gold ring for every row the judge appends
    const hMat = metal('#ffb347');
    this.hist = new THREE.Group();
    this.hist.add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 1.9, 16), hMat));
    this.histRows = H_ROWS.map((_, i) => { const m = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.022, 12, 64), metal('#ffcf7a')); m.rotation.x = Math.PI / 2; m.position.y = -0.55 + i * 0.42; this.hist.add(m); return m; });
    this.hist.position.copy(PTS.H);
    this.histMat = hMat;
    this.histPick = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 2.1, 12), new THREE.MeshBasicMaterial({ visible: false }));
    this.hist.add(this.histPick);
    this.scene.add(this.hist);
    // permitted paths (gold) and forbidden ones (ash, broken)
    const arc = (a, b, lift) => { const m = a.clone().lerp(b, 0.5).add(lift); return [a, m, b]; };
    const planeC = (k) => this.rings[k].center;
    const defs = {
      'P>C': arc(PTS.P, PTS.C, V(-0.4, 0.2, 0.4)),
      'H>C': arc(PTS.H, PTS.C, V(-0.6, 2.2, 1.2)),
      'J>H': arc(PTS.J, PTS.H, V(0, 0.6, 0)),
      'T0>J': arc(planeC(0), PTS.J, V(0.5, 0.5, 0.3)), 'T1>J': arc(planeC(1), PTS.J, V(-0.5, 0.6, 0.6)), 'T2>J': arc(planeC(2), PTS.J, V(0.9, 0.4, 0)),
      's0': 0, 's1': 0, 's2': 0, 's3': 0,
    };
    PTS.s.forEach((p, i) => { defs['C>s' + i] = arc(PTS.C, p, V(0, 0.5, 0.5)); delete defs['s' + i]; });
    this.flows = {};
    for (const [k, pts] of Object.entries(defs)) { const tube = makeTube(pts, '#e0a640', 0.014); tube.material.uniforms.uProgress.value = 1; this.flows[k] = tube; this.scene.add(tube); }
    this.forbidden = {
      'C×J': makeTube(arc(PTS.C, PTS.J, V(0, 0.4, 0.6)), '#8a8174', 0.012),
      'T×T': makeTube(arc(planeC(0), planeC(2), V(1.2, 0.4, 0.8)), '#8a8174', 0.012),
    };
    for (const t of Object.values(this.forbidden)) { t.material.uniforms.uProgress.value = 1; t.material.uniforms.uDash.value = 1; t.material.uniforms.uPulse.value = -1; this.scene.add(t); }
    this.raycaster = new THREE.Raycaster();
  }

  // emphasis per station: 'C', 'T', 'J', 'H' or null — set by the machine sequence or by hover
  updateMachine(t, idle, lens, S, focus) {
    const space = !lens;
    const on = smooth(seg(t, T.cut[1] - 0.01, T.cut[1] + 0.03)) * (1 - smooth(seg(t, T.uncut[0], T.uncut[0] + 0.015))) * (t > 0.8 && t < 0.85 ? 1 - window01(t, 0.8, 0.85, 0.008) : 1);
    const machine = S && S.hold && S.hold.id === 'B06b' ? window01(S.k, 0, 1, 0.08) : 0;
    const dim = (key) => (focus ? (focus === key ? 1.25 : 0.35) : 1);
    const freeze = this.freezeAt(t);
    const compiling = Math.max(...FLOWS.filter((x) => x.f.startsWith('C>')).map((x) => window01(t, x.w[0] - 0.01, x.w[1] + 0.005, 0.006)));
    const judging = Math.max(freeze, ...FLOWS.filter((x) => x.f.endsWith('>J')).map((x) => window01(t, x.w[0], x.w[1] + 0.01, 0.006)));
    const st = [[this.stC, 'C', compiling], [this.stJ, 'J', judging]];
    for (const [s, key, busy] of st) {
      const o = on * (0.55 + 0.45 * machine) * Math.min(1, dim(key));
      s.g.visible = s.glyph.mesh.visible = space && on > 0.001;
      s.mat.opacity = o;
      s.mat.emissiveIntensity = (0.15 + 1.4 * busy + 0.8 * (focus === key ? 1 : 0)) * on;
      s.ring.rotation.z = t * 9 + idle * 0.2 + busy * t * 40;
      s.ring2.rotation.z = -t * 6 - idle * 0.15;
      s.g.lookAt(this.camera.position);
      s.glyph.mat.uniforms.uCut.value = 0;
      s.glyph.mat.uniforms.uFade.value = o * (1.1 + busy);
    }
    const rows = H_ROWS.filter((r) => t >= r).length;
    this.hist.visible = space && on > 0.001;
    this.histMat.opacity = on * Math.min(1, dim('H'));
    this.histMat.emissiveIntensity = 0.2 + 0.8 * (focus === 'H' ? 1 : 0);
    this.histRows.forEach((m, i) => { m.visible = i < rows; m.material.opacity = on * Math.min(1, dim('H')); m.material.emissiveIntensity = 0.6 + 1.2 * window01(t, H_ROWS[i] - 0.004, H_ROWS[i] + 0.02, 0.004); m.rotation.z = idle * 0.3 + i; });
    // flows: dim always-on structure, bright pulses when a path carries something
    for (const [k, tube] of Object.entries(this.flows)) {
      const ev = FLOWS.filter((x) => x.f === k);
      let pulse = -1, act = 0;
      for (const e of ev) { const a = window01(t, e.w[0] - 0.006, e.w[1] + 0.006, 0.006); if (a > act) { act = a; pulse = lerp(-0.1, 1.1, seg(t, e.w[0], e.w[1])); } }
      // during the machine sequence, the focused station's incoming paths carry light in a loop
      const into = { C: ['P>C', 'H>C'], T: ['C>s0'], J: ['T0>J', 'T1>J', 'T2>J'], H: ['J>H'] };
      const opFlows = S && S.hold && { B10b: ['P>C', 'H>C', 'C>s1'], B13b: ['P>C', 'H>C', 'C>s3'] }[S.hold.id];
      if (opFlows && opFlows.includes(k)) { act = Math.max(act, 0.85); pulse = ((S.k * 2.4 + opFlows.indexOf(k) * 0.33) % 1.2) - 0.1; }
      if (focus && into[focus] && into[focus].includes(k)) { act = Math.max(act, 0.9); pulse = (idle * 0.45 + (S ? S.k * 3 : 0)) % 1.2 - 0.1; }
      const candFlow = k.startsWith('C>s') ? +k.slice(3) : -1;
      const relevant = candFlow < 0 || act > 0.01 || (machine > 0 && candFlow === 0);
      tube.visible = space && on > 0.001 && relevant;
      tube.material.uniforms.uPulse.value = pulse;
      tube.material.uniforms.uOpacity.value = on * (0.12 + 0.25 * machine + 0.75 * act) * (focus && act < 0.5 ? 0.5 : 1);
    }
    const forb = machine * window01(S ? S.k : 0, 0.7, 0.97, 0.05) + (focus ? 0.6 : 0);
    for (const tube of Object.values(this.forbidden)) {
      tube.visible = space && on > 0.001 && forb > 0.01;
      tube.material.uniforms.uOpacity.value = on * forb * 0.8;
    }
    return { machine, forb };
  }
  pick(ndcX, ndcY) {
    this.raycaster.setFromCamera({ x: ndcX, y: ndcY }, this.camera);
    const targets = [[this.stC.disc, 'C'], [this.stJ.disc, 'J'], [this.histPick, 'H'], ...this.rings.map((R) => [R.plane, 'T'])];
    let best = null, bd = Infinity;
    for (const [m, key] of targets) {
      if (!m.parent || !m.parent.visible && m.parent.type !== 'Scene') continue;
      const hit = this.raycaster.intersectObject(m, false)[0];
      if (hit && hit.distance < bd) { bd = hit.distance; best = key; }
    }
    return best;
  }

  setSize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  // ---------------------------------------------------------------- derived quantities
  freezeAt(t) {
    return Math.max(...T.freezes.map((f) => window01(t, f[0], f[1], 0.022)));
  }
  cutAt(t) {
    return easeInOut(seg(t, T.cut[0], T.cut[1])) * (1 - easeInOut(seg(t, ...T.uncut)));
  }
  // verdict of tester k at t: +1 pass, −1 fail, 0 untested
  verdict(t, k) {
    const id = TESTERS[k].id;
    let v = 0;
    ITERS.forEach((it, i) => {
      const on = smooth(seg(t, it.verdict[0] + k * 0.003, it.verdict[1] + k * 0.003));
      const nextStep = STEPS[i];
      const off = nextStep ? 1 - smooth(seg(t, nextStep[0], nextStep[0] + 0.015)) : 1 - smooth(seg(t, T.uncut[0], T.uncut[0] + 0.02));
      v += (it.fails.includes(id) ? -1 : 1) * on * off;
    });
    return v;
  }

  // ---------------------------------------------------------------- state(t): a pure function of t, idle clock, lens flag
  update(t, idle, lens = false, S = null, focus = null) {
    const c = this.common;
    c.uIdle.value = idle;
    c.uLens.value = lens ? 1 : 0;
    const back = smooth(seg(t, ...T.uncut));       // the veil returns at B17
    const rainLive = lens || back > 0;
    c.uFallT.value = (rainLive ? t : Math.min(t, T.rainStop)) * 34 + idle * 0.55 * (rainLive ? 1 : 1 - seg(t, T.rainStop - 0.02, T.rainStop));
    c.uDecode.value = 0.08 + 0.3 * smooth(seg(t, 0.06, 0.17)) + 0.62 * smooth(seg(t, ...T.legible));
    c.uFade.value = smooth(seg(t, ...T.fadeIn));
    const cut = lens ? 0 : this.cutAt(t);
    this.field.mat.uniforms.uCut.value = cut;
    this.inscription.material.uniforms.uCut.value = lens ? 0 : easeInOut(seg(t, T.cut[0], T.cut[1])) * (1 - back);
    const freeze = lens ? 0 : this.freezeAt(t);
    c.uFreeze.value = freeze;
    c.uTransmute.value = lens ? 0 : easeOut(seg(t, ...T.transmute));
    const space = !lens;

    // sigils
    const roles = smooth(seg(t, ...T.roles));
    const ign = [
      smooth(seg(t, ...T.ringIgnite1)) * (1 - smooth(seg(t, ...T.ringSwap))),
      0.08,
      smooth(seg(t, ...T.ringSwap)) * (1 - smooth(seg(t, T.cut[0], T.cut[0] + 0.03))),
    ].map((x) => Math.max(x, roles * 0.45));
    const spin = 1 + 3 * smooth(seg(t, ...T.spin));
    const bandK = lens ? 0 : easeInOut(seg(t, T.cut[0] + 0.006, T.cut[1])) * (1 - easeInOut(seg(t, T.uncut[0], T.uncut[1] - 0.004)));
    this.band.mat.uniforms.uCut.value = bandK;
    this.band.mat.uniforms.uFade.value = c.uFade.value * (1 - smooth(seg(t, T.uncut[0], T.uncut[1])));
    this.field.mat.uniforms.uFade.value = c.uFade.value;
    this.inscription.material.uniforms.uFade.value = c.uFade.value;
    this.rings.forEach((R, k) => {
      const rot = t * 2.4 * spin * (k % 2 ? -1 : 1) + idle * 0.05 + R.phase;
      const ringK = lens ? 0 : easeInOut(seg(t, T.cut[0], T.cut[1] - 0.012)) * (1 - easeInOut(seg(t, ...T.uncut)));
      R.g.position.lerpVectors(RING_POS[k], R.center, ringK);
      const qVeil = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, rot * 0.25));
      R.g.quaternion.copy(qVeil).slerp(R.quat, ringK);
      R.g.scale.setScalar(lerp(1, PLANE_R / RING_R, ringK));
      R.mat.opacity = (1 - smooth(seg(ringK, 0.55, 0.95))) * c.uFade.value;
      R.triLine.material.opacity = R.mat.opacity * 0.8;
      R.mat.emissiveIntensity = ign[k] * 1.6;
      R.mat.color.set(ign[k] > 0.3 || k === 1 ? '#d4a24c' : '#6d5a3c');
      R.g.visible = R.mat.opacity > 0.01;
      const appear = smooth(seg(t, T.cut[1] - 0.025, T.cut[1] + 0.012)) * (1 - smooth(seg(t, T.uncut[0], T.uncut[0] + 0.02)));
      R.plane.visible = space && appear > 0.001;
      R.plane.material.uniforms.uAppear.value = appear;
      R.plane.material.uniforms.uVerdict.value = this.verdict(t, k);
      R.plane.material.uniforms.uPulse.value = k !== 1 ? window01(t, T.valley[0], T.valley[1], 0.01) * (0.6 + 0.4 * Math.sin(t * 600)) : 0;
      for (let i = 0; i < this.bandPer; i++) {
        const idx = k * this.bandPer + i;
        const a = (i / this.bandPer) * Math.PI * 2 + rot * 0.6;
        const bv = V(Math.cos(a) * RING_R * 1.22, Math.sin(a) * RING_R * 1.22, 0).add(RING_POS[k]);
        const bs = V(Math.cos(a) * PLANE_R * 1.02, Math.sin(a) * PLANE_R * 1.02, 0).applyQuaternion(R.quat).add(R.center);
        this.band.attrs.aVeil.setXYZ(idx, bv.x, bv.y, bv.z);
        this.band.attrs.aSpace.setXYZ(idx, bs.x, bs.y, bs.z);
      }
    });
    this.band.attrs.aVeil.needsUpdate = this.band.attrs.aSpace.needsUpdate = true;

    // candidates s1..s4
    const outAll = 1 - smooth(seg(t, T.uncut[0], T.uncut[0] + 0.02));
    PTS.s.forEach((p, i) => {
      const born = i === 0 ? smooth(seg(t, ...T.s1Born)) : smooth(seg(t, STEPS[i - 1][0] + 0.02, STEPS[i - 1][1]));
      const gone = i < STEPS.length ? 1 - smooth(seg(t, STEPS[i][0] + 0.02, STEPS[i][0] + 0.05)) : outAll;
      const m = this.cands[i];
      const k = born * gone;
      m.visible = space && k > 0.001;
      m.material.uniforms.uIntensity.value = k * (1 + 0.15 * Math.sin(idle * 2.1 + i)) * (i === 3 ? 1 + c.uTransmute.value : 1);
      // during a freeze the candidate is unseen: the judge never reads it
      const darkWin = i === 0 ? T.freezes[0] : i === 2 ? T.freezes[1] : null;
      m.material.uniforms.uDark.value = darkWin ? window01(t, darkWin[0] + 0.006, darkWin[1] + 0.006, 0.02) : 0;
    });

    // star: the light behind the veil becomes s†, and returns behind the veil at the end
    const spaceIn = smooth(seg(t, T.cut[1] - 0.05, T.cut[1] + 0.01)) * outAll;
    this.accept.visible = this.pMark.visible = space && spaceIn > 0;
    this.accept.material.uniforms.uIntensity.value = spaceIn * (0.06 + 0.12 * window01(t, 0.245, 0.29, 0.01) + 0.25 * c.uTransmute.value);
    this.pMark.material.uniforms.uIntensity.value = spaceIn * 0.7;
    const starK = lens ? 0 : this.cutAt(t) > 0 ? easeInOut(seg(t, T.cut[0] + 0.012, T.cut[1])) * (1 - easeInOut(seg(t, ...T.uncut))) : 0;
    this.star.position.lerpVectors(VEIL_STAR, PTS.star, starK);
    const veilGlow = (0.12 + 0.1 * smooth(seg(t, 0.04, 0.17)) + 0.05 * Math.sin(idle * 0.7)) * c.uFade.value;
    const starSpace = 0.3 + 0.08 * Math.sin(idle * 0.9) + 0.25 * window01(t, 0.245, 0.29, 0.01) + 0.2 * window01(t, 0.765, 0.805, 0.01);
    this.star.material.uniforms.uSize.value = lerp(11, 2.4, starK);
    this.star.material.uniforms.uSpikes.value = lerp(0.6, 1.2, starK);
    this.star.material.uniforms.uIntensity.value = lerp(veilGlow, starSpace, starK);

    // thread legs: leg 0 (P → s1) at birth; leg i at step i, a pulse running from P each time
    this.legs.forEach((leg, i) => {
      const u = leg.material.uniforms;
      const w = i === 0 ? [T.s1Born[0], T.s1Born[1] + 0.02] : [STEPS[i - 1][0] + 0.015, STEPS[i - 1][1]];
      u.uProgress.value = easeOut(seg(t, ...w));
      const pulseWin = i === 0 ? null : STEPS[i - 1];
      u.uPulse.value = pulseWin ? lerp(-0.2, 1.2, seg(t, pulseWin[0], pulseWin[1])) : -1;
      u.uOpacity.value = (0.55 + 0.6 * freeze) * outAll * (1 - 0.6 * c.uTransmute.value);
      leg.visible = space && u.uProgress.value > 0;
    });
    this.diags.forEach((d, i) => {
      const D = DIAG[i];
      const dk = easeOut(seg(t, ...D.draw));
      const out = 1 - smooth(seg(t, ...D.fade));
      d.tube.visible = space && dk > 0 && out > 0.01;
      d.tube.material.uniforms.uProgress.value = dk;
      d.tube.material.uniforms.uOpacity.value = out;
      d.arrow.visible = d.tube.visible && dk > 0.97;
      d.arrow.material.opacity = out;
    });
    const vk = window01(t, T.valley[0], T.valley[1] + 0.03, 0.012);
    this.valley.visible = space && vk > 0.001;
    this.valley.material.uniforms.uProgress.value = 1;
    this.valley.material.uniforms.uPulse.value = lerp(-0.1, 1.1, seg(t, ...T.valley));
    this.valley.material.uniforms.uOpacity.value = vk * 0.5;
    this.ash.forEach((m, i) => {
      const k = smooth(seg(t, T.tabu[0] + i * 0.006, T.tabu[1] + i * 0.006)) * (1 - smooth(seg(t, T.transmute[0], T.transmute[1])));
      m.visible = space && k > 0.001;
      m.material.uniforms.uIntensity.value = k;
    });

    // the judge's estimate s_n + f_n: a ghost beside the real next candidate
    this.ghosts.forEach((g, i) => {
      const D = DIAG[i];
      const k = smooth(seg(t, D.draw[1] - 0.004, D.draw[1] + 0.004)) * (1 - smooth(seg(t, D.fade[0], D.fade[1])));
      g.visible = space && k > 0.001;
      g.material.uniforms.uIntensity.value = 0.45 * k;
      g.material.uniforms.uDark.value = 0.85;
    });
    const mach = this.updateMachine(t, idle, lens, S, focus);
    // the step as an operation (B10b, B13b): s_n, the arrow f_n, the estimate s_n + f_n and the real s_{n+1}, together
    const op = S && S.hold && { B10b: 0, B13b: 1 }[S.hold.id];
    if (space && op !== undefined && op !== null) {
      const D = DIAG[op], w = window01(S.k, 0.04, 0.96, 0.1);
      const d = this.diags[op];
      d.tube.visible = d.arrow.visible = true;
      d.tube.material.uniforms.uProgress.value = 1;
      d.tube.material.uniforms.uOpacity.value = w;
      d.tube.material.uniforms.uPulse.value = (S.k * 2.2) % 1.2 - 0.1;
      d.arrow.material.opacity = w;
      this.ghosts[op].visible = true;
      this.ghosts[op].material.uniforms.uIntensity.value = 0.55 * w;
      const from = this.cands[D.from];
      from.visible = true;
      from.material.uniforms.uIntensity.value = 0.35 * w;
      from.material.uniforms.uDark.value = 0;
    }
    this.updateFragments(t, space);
    this.updateRoom(t, space);
    this.updateCamera(t, idle, S);
    return { cut, freeze, ...mach };
  }

  updateFragments(t, space) {
    const a = this.frags.attrs;
    const it = ITERS.findIndex((x) => inWin(t, x.test));
    this.frags.mesh.visible = space && it >= 0;
    if (it < 0) return;
    const w = seg(t, ...ITERS[it].test);
    const src = PTS.s[it];
    for (let k = 0; k < 3; k++) {
      const tr = this.rings[k].tester;
      const dst = src.clone().addScaledVector(tr.n, -(tr.n.dot(src) - tr.d));
      const ctrl = src.clone().lerp(dst, 0.5).add(V(0, 0.6, 0.4));
      for (let i = 0; i < this.fragPer; i++) {
        const idx = k * this.fragPer + i;
        const e = easeInOut(clamp(w * 1.6 - (i / this.fragPer) * 0.6));
        const p = src.clone().multiplyScalar((1 - e) * (1 - e)).addScaledVector(ctrl, 2 * e * (1 - e)).addScaledVector(dst, e * e);
        a.aVeil.setXYZ(idx, p.x, p.y, p.z);
        a.aSpace.setXYZ(idx, p.x, p.y, p.z);
      }
    }
    a.aVeil.needsUpdate = a.aSpace.needsUpdate = true;
    this.frags.mat.uniforms.uCut.value = 0;
    this.frags.mat.uniforms.uFade.value = Math.sin(Math.PI * w) * 1.6;
  }

  updateRoom(t, space) {
    const k = window01(t, T.barrier[0] - 0.012, T.barrier[1] + 0.012, 0.012);
    const zz = seg(t, T.barrier[0], T.barrier[1] - 0.012);
    const closed = smooth(seg(t, T.barrier[1] - 0.016, T.barrier[1]));
    this.roomPlanes.forEach((p, i) => {
      p.visible = space && k > 0.001;
      p.material.uniforms.uAppear.value = k;
      // the candidate alternates sides; at the end neither plane holds
      const n = Math.floor(zz * (this.zig.length - 1) + 0.001);
      const failNow = n % 2 === i ? -1 : 1;
      p.material.uniforms.uVerdict.value = zz > 0 ? lerp(failNow, -1, closed) : 0;
    });
    this.roomThread.visible = space && k > 0.001;
    this.roomThread.material.uniforms.uProgress.value = zz;
    this.roomThread.material.uniforms.uPulse.value = -1;
    this.roomThread.material.uniforms.uOpacity.value = k * 0.7;
    const segN = this.zig.length - 1;
    const f = zz * segN, i0 = Math.min(segN - 1, Math.floor(f));
    this.roomCand.position.lerpVectors(this.zig[i0], this.zig[i0 + 1], easeInOut(f - i0));
    this.roomCand.visible = space && k > 0.001;
    this.roomCand.material.uniforms.uIntensity.value = k * (1 - closed * 0.6);
  }

  // ---------------------------------------------------------------- camera
  updateCamera(t, idle, S = null) {
    const sm = (a, b) => a.clone().lerp(b, 0.35);
    const keys = [
      [0.0, V(0, 0.1, 11), V(0, 0.15, 0)],
      [0.17, V(0, 0.1, 7.4), V(0, 0.1, 0)],
      [0.185, V(0, 0.1, 7.2), V(0, 0.1, 0)],
      [0.24, V(3.2, 4.4, 13.5), V(-0.2, 0.2, -0.2)],
      [0.29, V(5.2, 2.4, 10.2), V(1.8, 0.4, -0.5)],
      [0.335, V(1.4, 2.6, 10.8), sm(PTS.s[0], PTS.s[1])],
      [0.4, V(1.4, 2.6, 10.8), sm(PTS.s[0], PTS.s[1])],
      [0.475, null, sm(PTS.s[0], PTS.s[1])], // freeze 1 end
      [0.525, V(-0.6, 3.6, 11.2), PTS.s[1].clone().lerp(A, 0.2)],
      [0.575, V(-2.6, 3.0, 12.0), PTS.s[1].clone().lerp(A, 0.35)],
      [0.612, V(-1.2, 3.0, 10.5), PTS.s[2].clone().lerp(A, 0.5)],
      [0.65, null, PTS.s[2].clone().lerp(A, 0.5)], // freeze 2 end (top-down onto the valley)
      [0.7, A.clone().add(V(6.2, 3.0, 1.2)), A.clone().addScaledVector(VALLEY_DIR, -0.6)],
      [0.76, A.clone().add(V(0.5, 6.5, 13)), A.clone()],
      [0.805, V(7.0, 2.2, 8.5), A.clone().lerp(PTS.star, 0.55)],
      [0.814, PTS.room.clone().add(V(0, 1.2, 6.8)), PTS.room.clone()],
      [0.85, PTS.room.clone().add(V(0.4, 0.9, 6.0)), PTS.room.clone()],
      [0.895, V(0, 0.1, 8.6), V(0, 0.1, 0)],
      [0.94, V(0, 0.1, 8.2), V(0, 0.1, 0)],
      [1.0, V(0, 0.1, 8.0), V(0, 0.1, 0)],
    ];
    const f1 = T.freezes[0], f2 = T.freezes[1];
    const orbit1 = (k) => { const pv = keys[6][2], st = keys[6][1].clone().sub(pv); return st.applyAxisAngle(V(0, 1, 0), -Math.PI * 0.5 * k).add(pv).add(V(0, Math.sin(Math.PI * k) * 0.8, 0)); };
    const orbit2 = (k) => { const pv = keys[10][2], st = keys[10][1].clone().sub(pv); const r = st.applyAxisAngle(V(0, 1, 0), Math.PI * 0.35 * k); return r.lerp(V(0.01, 9.5, 0.6), easeInOut(k) * 0.85).add(pv); };
    keys[7][1] = orbit1(1);
    keys[11][1] = orbit2(1);
    let pos, look;
    if (t >= f1[0] && t < f1[1]) { pos = orbit1(easeInOut(seg(t, ...f1))); look = keys[6][2].clone(); }
    else if (t >= f2[0] && t < f2[1]) { pos = orbit2(easeInOut(seg(t, ...f2))); look = keys[10][2].clone(); }
    else {
      let i = 0;
      while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
      const a = keys[i], b = keys[i + 1];
      const k = easeInOut(seg(t, a[0], b[0]));
      pos = a[1].clone().lerp(b[1], k);
      look = a[2].clone().lerp(b[2], k);
    }
    // holds: the machine pulls back to show the whole loop; an unfold leans toward its candidate
    if (S && S.hold) {
      const k = S.k, w = smooth(seg(k, 0, 0.22)) * (1 - smooth(seg(k, 0.82, 1)));
      if (S.hold.id === 'B06b') {
        const wide = V(0.6, 3.6, 17.5).applyAxisAngle(V(0, 1, 0), (k - 0.5) * 0.5);
        pos.lerp(wide, w);
        look.lerp(V(-0.9, 1.0, 0.2), w);
      } else {
        const ci = { B07b: 0, B10b: 1, B13b: 3 }[S.hold.id];
        const c = PTS.s[ci];
        // step holds: frame s_n, the arrow, the estimate and s_{n+1} together, left of centre (the prompt opens on the right later)
        const op = { B10b: [0, 1], B13b: [2, 3] }[S.hold.id];
        if (op) {
          const mid = PTS.s[op[0]].clone().lerp(PTS.s[op[1]], 0.55).add(V(0, 0.3, 0));
          pos.lerp(mid.clone().add(V(1.8, 1.4, 6.4)), 0.7 * w);
          look.lerp(mid.clone().add(V(1.3, 0, 0)), 0.7 * w);
        } else {
          pos.lerp(c.clone().add(V(2.4, 1.2, 5.2)), 0.45 * w);
          look.lerp(c, 0.6 * w);
        }
      }
    }
    pos.add(V(Math.sin(idle * 0.21) * 0.12, Math.sin(idle * 0.17 + 1) * 0.08, 0));
    this.camera.position.copy(pos);
    this.camera.lookAt(look);
  }

  // ---------------------------------------------------------------- anchors for DOM labels
  project(v, w, h) {
    const p = v.clone().project(this.camera);
    return { x: (p.x * 0.5 + 0.5) * w, y: (-p.y * 0.5 + 0.5) * h, behind: p.z > 1 };
  }
  rimTop(center, n, sign = 1) {
    const up = V(0, 1, 0).applyQuaternion(this.camera.quaternion);
    const v = up.clone().addScaledVector(n, -up.dot(n));
    if (v.lengthSq() < 1e-4) v.set(1, 0, 0);
    return center.clone().addScaledVector(v.normalize(), PLANE_R * 1.08 * sign);
  }
  anchors() {
    const R = this.rings;
    return {
      T1: this.rimTop(R[0].center, R[0].tester.n), T2: this.rimTop(R[1].center, R[1].tester.n), T4: this.rimTop(R[2].center, R[2].tester.n, -1),
      s1: PTS.s[0], s2: PTS.s[1], s3: PTS.s[2], s4: PTS.s[3], star: PTS.star, P: PTS.P,
      C: PTS.C.clone().add(V(0, 0.95, 0)), J: PTS.J.clone().add(V(0, 0.95, 0)), H: PTS.H.clone().add(V(0, 1.35, 0)),
      est1: this.ghosts[0].position.clone().add(V(-0.35, 0.5, 0)), est3: this.ghosts[1].position.clone().add(V(-0.35, 0.5, 0)),
      xCJ: PTS.C.clone().lerp(PTS.J, 0.5).add(V(0, 0.4, 0.6)), xTT: this.rings[0].center.clone().lerp(this.rings[2].center, 0.5).add(V(1.2, 0.4, 0.8)),
      valley: A.clone().addScaledVector(VALLEY_DIR, 3.2),
      roomA: this.roomPlanes[0].position.clone().add(V(1.5, 1.2, 0)), roomB: this.roomPlanes[1].position.clone().add(V(-1.5, 1.2, 0)),
      roleC: RING_POS[0].clone().add(V(-2.3, 0.25, 0)), roleT: RING_POS[1].clone().add(V(-2.25, 0.2, 0)), roleJ: RING_POS[2].clone().add(V(2.25, 0.2, 0)),
    };
  }
}
