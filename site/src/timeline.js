// The whole film as a function of t in [0, 1]. Every value the film shows is derived here
// or in scene.js from t (and the pointer); nothing accumulates frame to frame (WORKFLOW R5).

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const smooth = (x) => x * x * (3 - 2 * x);
export const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const easeOut = (x) => 1 - Math.pow(1 - x, 3);
export const lerp = (a, b, k) => a + (b - a) * k;
export const window01 = (t, a, b, fade = 0.02) => smooth(seg(t, a, a + fade)) * (1 - smooth(seg(t, b - fade, b)));

// Beats as in site-chain/out/storyboard.md. `teaches` points at site-chain/out/claims.md.
export const BEATS = [
  { id: 'B01', t: [0.0, 0.035], name: 'cold open', teaches: ['C03', 'C08'] },
  { id: 'B02', t: [0.035, 0.085], name: 'the veil', teaches: ['C08', 'C09'] },
  { id: 'B03', t: [0.085, 0.135], name: 'the guardians', teaches: ['C02', 'C03'] },
  { id: 'B04', t: [0.135, 0.18], name: 'what Alchemist is', teaches: ['C01', 'C18', 'C20'] },
  { id: 'B05', t: [0.18, 0.24], name: 'the cut', teaches: ['C09', 'C11'] },
  { id: 'B06', t: [0.24, 0.29], name: 'the space and the star', teaches: ['C09', 'C10', 'C12'] },
  { id: 'B07', t: [0.29, 0.335], name: 'compile', teaches: ['C17'] },
  { id: 'B08', t: [0.335, 0.395], name: 'iteration 1 — test', teaches: ['C18', 'C19', 'C22'] },
  { id: 'B09', t: [0.395, 0.475], name: 'freeze — the judge', teaches: ['C20', 'C21', 'C25'] },
  { id: 'B10', t: [0.475, 0.525], name: 'the step', teaches: ['C11', 'C30'] },
  { id: 'B11', t: [0.525, 0.575], name: 'iteration 2 — déjà vu', teaches: ['C03', 'C47'] },
  { id: 'B12', t: [0.575, 0.65], name: 'freeze — the coupling', teaches: ['C15', 'C33', 'C60', 'C61', 'C32'] },
  { id: 'B13', t: [0.65, 0.7], name: 'one fix for both', teaches: ['C33', 'C47'] },
  { id: 'B14', t: [0.7, 0.76], name: 'transmutation', teaches: ['C46', 'C48'] },
  { id: 'B15', t: [0.76, 0.805], name: 'short of the star', teaches: ['C12', 'C13'] },
  { id: 'B16', t: [0.805, 0.85], name: 'the sealed room', teaches: ['C36', 'C37'] },
  { id: 'B17', t: [0.85, 0.895], name: 'the veil, legible', teaches: ['C04', 'C05', 'C06', 'C07'] },
  { id: 'B18', t: [0.895, 0.94], name: 'the roles', teaches: ['C54', 'C56', 'C57'] },
  { id: 'B19', t: [0.94, 1.0], name: 'your turn', teaches: ['C15', 'C33', 'C58'] },
];
export const beatAt = (t) => BEATS.find((b) => t >= b.t[0] && t < b.t[1]) || BEATS[BEATS.length - 1];
export const midpoints = () => BEATS.map((b) => +((b.t[0] + b.t[1]) / 2).toFixed(4));

export const T = {
  fadeIn: [0.028, 0.05],
  ringIgnite1: [0.095, 0.11],
  ringSwap: [0.115, 0.13],
  spin: [0.135, 0.18],
  rainStop: 0.185,
  cut: [0.185, 0.24],
  tear: [0.2, 0.22],
  lensOn: [0.23, 0.26],
  s1Born: [0.295, 0.325],
  freezes: [[0.4, 0.475], [0.612, 0.65]],
  valley: [0.62, 0.7],
  tabu: [0.625, 0.645],
  transmute: [0.718, 0.76],
  barrier: [0.808, 0.848],
  uncut: [0.85, 0.88],
  legible: [0.86, 0.885],
  roles: [0.9, 0.915],
  toy: [0.945, 0.96],
};

// The Bramble run, as the paper reports it: who fails in each iteration, and the step that follows.
export const ITERS = [
  { test: [0.338, 0.37], verdict: [0.36, 0.392], fails: ['T1'] },
  { test: [0.524, 0.54], verdict: [0.532, 0.552], fails: ['T4'] },
  { test: [0.592, 0.604], verdict: [0.598, 0.612], fails: ['T1'] },
  { test: [0.7, 0.716], verdict: [0.71, 0.73], fails: [] },
];
// steps: s_i -> s_{i+1}
export const STEPS = [[0.477, 0.52], [0.572, 0.592], [0.655, 0.695]];
// diagnosis vectors drawn by the judge during the freezes
export const DIAG = [
  { from: 0, to: 1, draw: [0.435, 0.47], fade: [0.478, 0.5] },
  { from: 2, to: 3, draw: [0.636, 0.652], fade: [0.69, 0.705] },
];

// ---------------------------------------------------------------------------------------------
// Holds (added after G2): story time u stops while a sequence plays on its own local clock k.
// Scroll t ∈ [0, 1] → story time u with the holds inserted; the page grows by their total length.
// ---------------------------------------------------------------------------------------------
export const HOLDS = [
  { id: 'B06b', at: 0.29, len: 0.075, name: 'the machine', teaches: ['C16', 'C17', 'C18', 'C19', 'C20', 'C21', 'C24', 'C25'] },
  { id: 'B07b', at: 0.326, len: 0.04, name: 'a point unfolds into a prompt', teaches: ['C11', 'C65'] },
  { id: 'B10b', at: 0.521, len: 0.04, name: 'the step, as an operation', teaches: ['C17', 'C47', 'C66', 'C67'] },
  { id: 'B13b', at: 0.697, len: 0.035, name: 'the prompt the search found', teaches: ['C46', 'C65'] },
];
export const TOTAL = 1 + HOLDS.reduce((s, h) => s + h.len, 0);

export function storyAt(t) {
  const raw = clamp(t) * TOTAL;
  let acc = 0;
  for (const h of HOLDS) {
    const start = h.at + acc;
    if (raw < start) return { u: raw - acc, hold: null, k: 0 };
    if (raw < start + h.len) return { u: h.at, hold: h, k: (raw - start) / h.len };
    acc += h.len;
  }
  return { u: raw - acc, hold: null, k: 0 };
}
// scroll t of a story time u (outside holds), and of a point inside a hold
export function scrollOf(u) {
  let acc = 0;
  for (const h of HOLDS) if (h.at <= u) acc += h.len;
  return (u + acc) / TOTAL;
}
export function scrollOfHold(h, k) {
  let acc = 0;
  for (const x of HOLDS) { if (x === h) break; acc += x.len; }
  return (h.at + acc + k * h.len) / TOTAL;
}
export function sceneBeatAt(t) {
  const s = storyAt(t);
  return s.hold ? { id: s.hold.id, name: s.hold.name } : beatAt(s.u);
}
// every beat's midpoint in scroll t, holds included, in order
export function scrollMidpoints() {
  const pts = BEATS.map((b) => scrollOf((b.t[0] + b.t[1]) / 2 - 1e-6));
  for (const h of HOLDS) pts.push(scrollOfHold(h, 0.5));
  return pts.sort((a, b) => a - b).map((x) => +x.toFixed(4));
}

// Flow events on the architecture: which permitted path carries what, when (story time u)
export const FLOWS = [
  { f: 'P>C', w: [0.293, 0.31] }, { f: 'C>s0', w: [0.305, 0.326] },
  { f: 'T0>J', w: [0.402, 0.425] }, { f: 'T1>J', w: [0.405, 0.428] }, { f: 'T2>J', w: [0.408, 0.431] }, { f: 'J>H', w: [0.462, 0.476] },
  { f: 'H>C', w: [0.477, 0.497] }, { f: 'P>C', w: [0.477, 0.497] }, { f: 'C>s1', w: [0.497, 0.52] },
  { f: 'T0>J', w: [0.555, 0.566] }, { f: 'T1>J', w: [0.556, 0.567] }, { f: 'T2>J', w: [0.557, 0.568] }, { f: 'J>H', w: [0.566, 0.572] },
  { f: 'H>C', w: [0.572, 0.58] }, { f: 'C>s2', w: [0.58, 0.592] },
  { f: 'T0>J', w: [0.613, 0.628] }, { f: 'T1>J', w: [0.614, 0.629] }, { f: 'T2>J', w: [0.615, 0.63] }, { f: 'J>H', w: [0.647, 0.654] },
  { f: 'H>C', w: [0.655, 0.668] }, { f: 'P>C', w: [0.655, 0.668] }, { f: 'C>s3', w: [0.668, 0.695] },
];
// history rows appear as the judge appends them
export const H_ROWS = [0.47, 0.57, 0.652];
