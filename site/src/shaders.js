import * as THREE from 'three';
import { GRID, GLYPHS, SYMBOLS } from './glyphs.js';

const glyphVert = /* glsl */ `
  attribute vec3 aVeil;
  attribute vec3 aSpace;
  attribute vec4 aSeed;
  attribute vec2 aKindRole;
  attribute vec2 aSize;
  uniform float uFallT, uCut, uIdle, uDecode, uGlyphs, uSymbols, uFreeze, uLens, uTransmute;
  uniform vec3 uA;
  varying vec2 vUv;
  varying float vGlyph, vK, vBright, vRole, vFlick, vFog, vGoldK;
  float h(float n){ return fract(sin(n) * 43758.5453123); }
  void main(){
    float kind = aKindRole.x, role = aKindRole.y;
    float k = 0.0;
    if (uLens < 0.5) { k = clamp((uCut - aSeed.x * 0.4) / 0.6, 0.0, 1.0); k = k * k * (3.0 - 2.0 * k); }
    if (kind > 1.5) k = uCut;            // direct glyphs follow the global cut, already eased in JS
    vec3 veil = aVeil; float bright = 1.0; float gl = aSeed.w;
    if (kind < 0.5) {
      float col = aVeil.y, j = aSeed.z;
      float speed = 0.55 + col * 0.95;
      float span = 24.0;
      float head = 11.0 - mod(col * 97.31 + uFallT * speed, span);
      veil = vec3(aVeil.x, head + j * 0.27, aVeil.z);
      bright = exp(-j * 0.16) * (j < 0.5 ? 1.7 : 0.62);
      gl = floor(h(col * 13.1 + j * 7.7 + floor(uFallT * 2.6 + j * 0.37 + col * 5.0)) * uGlyphs);
    } else if (kind < 1.5) {
      veil += vec3(0.0, sin(uIdle * 0.7 + aSeed.y * 6.2831) * 0.012, 0.0);
      float decoded = step(aSeed.y, uDecode);
      float sym = floor(h(aSeed.x * 31.7 + floor(uFallT * 3.0 + aSeed.y * 4.0)) * uSymbols);
      gl = mix(sym, aSeed.w, decoded);
      bright = mix(0.9, 1.5, decoded);
    }
    vec3 lift = (kind < 0.5) ? (aSeed.xyz - 0.5) * 2.2 * sin(3.14159 * k) : vec3(0.0);
    vec3 world = mix(veil, aSpace, k) + lift;
    // idle twinkle in the space (stops during the freeze: time is held still)
    float tw = 1.0 - uFreeze;
    world += (aSeed.zxy - 0.5) * 0.03 * sin(uIdle * (0.6 + aSeed.y) + aSeed.x * 40.0) * k * tw;

    float rr = uTransmute * 16.0;
    vGoldK = (1.0 - smoothstep(rr - 2.5, rr, distance(world, uA))) * step(0.001, uTransmute);
    vec4 mv = modelViewMatrix * vec4(world, 1.0);
    float size = mix(aSize.x, aSize.y, k);
    float turn = abs(cos(k * 3.14159));          // glyphs turn edge-on mid-cut
    vec2 q = position.xy * size;
    q.x *= (k > 0.02 && k < 0.98) ? max(turn, 0.06) : 1.0;
    mv.xy += q;
    gl_Position = projectionMatrix * mv;

    vUv = uv; vGlyph = gl; vK = k; vBright = bright; vRole = role;
    float fl = step(0.38, h(aSeed.x * 91.0 + floor(uIdle * 7.0 * tw + aSeed.y * 3.0)));
    vFlick = (role > 1.5 && role < 2.5) ? fl : 1.0;
    vFog = exp(-max(0.0, -mv.z - 7.0) * 0.07);
  }
`;
const glyphFrag = /* glsl */ `
  uniform sampler2D uAtlas;
  uniform float uGrid, uFade, uFreeze, uLens;
  uniform vec3 uGold, uWhite, uAsh, uCold;
  varying vec2 vUv;
  varying float vGlyph, vK, vBright, vRole, vFlick, vFog, vGoldK;
  void main(){
    vec2 cell = vec2(mod(vGlyph, uGrid), floor(vGlyph / uGrid));
    vec2 auv = (cell + vec2(vUv.x, 1.0 - vUv.y)) / uGrid;
    auv.y = 1.0 - auv.y;
    float ga = texture2D(uAtlas, auv).r;
    float d = length(vUv - 0.5);
    float disc = smoothstep(0.5, 0.0, d); disc *= disc;
    float a = mix(ga, disc, smoothstep(0.35, 0.85, vK));
    vec3 veilCol = mix(uGold * 0.9, uWhite, clamp(vBright - 1.0, 0.0, 1.0));
    vec3 spaceCol = uAsh * 0.95;
    if (vRole > 0.5 && vRole < 1.5) spaceCol = uGold * 0.5;
    if (vRole > 1.5 && vRole < 2.5) spaceCol = uCold * 0.55;
    if (vRole > 4.5) spaceCol = vec3(0.0);
    if (vRole > 2.5 && vRole < 4.5) spaceCol = uWhite * 1.4;
    vec3 col = mix(veilCol, spaceCol, vK);
    col = mix(col, uGold * (vRole > 4.5 ? 0.0 : 1.25) + uWhite * 0.15, vGoldK * (vRole > 4.5 ? 0.0 : 1.0));
    float b = mix(vBright, 1.0, vK) * mix(vFlick, 1.0, vGoldK) * vFog * uFade;
    // the freeze drains colour from everything but the judge's material
    col = mix(col, vec3(dot(col, vec3(0.33))), uFreeze * 0.55);
    gl_FragColor = vec4(col * b * a, 1.0);
  }
`;

export function makeGlyphMesh(n, atlas, common) {
  const geo = new THREE.InstancedBufferGeometry();
  const base = new THREE.PlaneGeometry(1, 1);
  geo.index = base.index;
  geo.setAttribute('position', base.getAttribute('position'));
  geo.setAttribute('uv', base.getAttribute('uv'));
  const attrs = {
    aVeil: new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3),
    aSpace: new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3),
    aSeed: new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4),
    aKindRole: new THREE.InstancedBufferAttribute(new Float32Array(n * 2), 2),
    aSize: new THREE.InstancedBufferAttribute(new Float32Array(n * 2), 2),
  };
  for (const [k, a] of Object.entries(attrs)) geo.setAttribute(k, a);
  geo.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    vertexShader: glyphVert,
    fragmentShader: glyphFrag,
    uniforms: {
      uAtlas: { value: atlas },
      uGrid: { value: GRID },
      uGlyphs: { value: GLYPHS },
      uSymbols: { value: SYMBOLS },
      uCut: { value: 0 },
      ...common,
      uFade: { value: 1 }, // per-mesh; never the shared one, because one mesh must not blank the others
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  return { mesh, attrs, mat };
}

// ---------------------------------------------------------------------------------------------
// Tester plane: gilds when it passes, tarnishes when it fails. Pass and fail differ in brightness,
// texture and motion, not only hue.
// ---------------------------------------------------------------------------------------------
export const planeVert = /* glsl */ `
  varying vec2 vUv; varying vec3 vN; varying vec3 vView;
  void main(){
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vN = normalize(mat3(modelMatrix) * normal);
    vView = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;
export const planeFrag = /* glsl */ `
  uniform float uAppear, uVerdict, uIdle, uPulse;
  uniform vec3 uGold, uAsh, uRust, uWhite;
  varying vec2 vUv; varying vec3 vN; varying vec3 vView;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
  void main(){
    vec2 p = vUv - 0.5; float r = length(p) * 2.0; float ang = atan(p.y, p.x);
    if (r > 1.0) discard;
    float rim = smoothstep(0.93, 0.995, r) * (1.0 - smoothstep(0.995, 1.0, r));
    float rings = smoothstep(0.03, 0.0, abs(fract(r * 7.0) - 0.5) - 0.47) * 0.35;
    float spokes = smoothstep(0.02, 0.0, abs(fract(ang * 12.0 / 6.2831) - 0.5) - 0.48) * 0.2 * smoothstep(0.15, 0.4, r);
    float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vView))), 2.0);
    float pass = smoothstep(0.0, 1.0, uVerdict), fail = smoothstep(0.0, 1.0, -uVerdict);
    float neutral = 1.0 - max(pass, fail);
    // pass: smooth gold sheet, rising specks, bright rim
    float specks = step(0.985, h(floor(vec2(ang * 40.0, r * 30.0 - uIdle * 1.2)))) * pass;
    // fail: crackle, dim, broken rim
    float crack = smoothstep(0.08, 0.0, abs(n2(vUv * 18.0) - 0.5)) * fail;
    float broken = mix(1.0, step(0.45, n2(vec2(ang * 6.0, 1.0))), fail);
    vec3 col = vec3(0.0);
    col += uWhite * 0.12 * (rings + spokes) * neutral;
    col += uGold * (0.05 + 0.18 * fres + 0.28 * (rings + spokes)) * pass;
    col += uGold * specks * 1.2;
    col += uRust * crack * 0.35;
    col += mix(uWhite * 0.22, uGold * 0.95, pass) * rim * broken * (1.0 - fail * 0.75);
    col += uGold * uPulse * 0.3 * (1.0 - r);
    float alpha = (0.05 + 0.08 * pass + 0.42 * fail + rim * 0.8) * uAppear;
    vec3 base = mix(col, uAsh * 0.06 + col, fail);
    gl_FragColor = vec4(base, clamp(alpha, 0.0, 1.0));
  }
`;

// Glowing point sprite (candidate, star, acceptance region)
const spriteVert = /* glsl */ `
  uniform float uSize; varying vec2 vUv;
  void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0); mv.xy += position.xy * uSize; gl_Position = projectionMatrix * mv; }
`;
const spriteFrag = /* glsl */ `
  uniform vec3 uColor; uniform float uIntensity, uSpikes, uDark;
  varying vec2 vUv;
  void main(){
    vec2 p = vUv - 0.5; float r = length(p) * 2.0;
    float core = exp(-r * r * 60.0) * 3.0 + exp(-r * 6.0) * 0.6;
    float spikes = uSpikes * (exp(-abs(p.x) * 160.0) + exp(-abs(p.y) * 160.0)) * exp(-r * 2.5);
    vec3 col = uColor * (core + spikes) * uIntensity;
    // dark: the judge's view — the candidate is unseen, only a thin outline remains
    float ring = smoothstep(0.03, 0.0, abs(r - 0.32)) * 0.6;
    col = mix(col, uColor * ring * 0.8, uDark);
    gl_FragColor = vec4(col, 1.0);
  }
`;
export function makeSprite(color, size, spikes = 0) {
  const mat = new THREE.ShaderMaterial({
    vertexShader: spriteVert,
    fragmentShader: spriteFrag,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uSize: { value: size },
      uIntensity: { value: 1 },
      uSpikes: { value: spikes },
      uDark: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  m.frustumCulled = false;
  m.renderOrder = 5;
  return m;
}

// Tube drawn up to a progress, with a travelling pulse
const tubeFrag = /* glsl */ `
  uniform float uProgress, uPulse, uOpacity, uDash; uniform vec3 uColor;
  varying vec2 vUv;
  void main(){
    if (vUv.x > uProgress) discard;
    if (uDash > 0.5 && fract(vUv.x * 26.0) < 0.5) discard;
    float tip = smoothstep(uProgress - 0.04, uProgress, vUv.x);
    float pulse = exp(-pow((vUv.x - uPulse) * 18.0, 2.0)) * 2.5;
    gl_FragColor = vec4(uColor * (0.7 + tip * 1.5 + pulse) * uOpacity, 1.0);
  }
`;
const tubeVert = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
export function makeTube(points, color, radius) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.3);
  const geo = new THREE.TubeGeometry(curve, 200, radius, 8, false);
  const mat = new THREE.ShaderMaterial({
    vertexShader: tubeVert,
    fragmentShader: tubeFrag,
    uniforms: { uProgress: { value: 0 }, uPulse: { value: -1 }, uOpacity: { value: 1 }, uDash: { value: 0 }, uColor: { value: new THREE.Color(color) } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const m = new THREE.Mesh(geo, mat);
  m.frustumCulled = false;
  return m;
}

// Procedural environment so the gold sigils have something to reflect.
export function makeEnvironment(renderer) {
  const env = new THREE.Scene();
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(50, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `varying vec3 vP; void main(){ float y = vP.y; vec3 c = mix(vec3(0.02,0.015,0.01), vec3(0.35,0.24,0.1), smoothstep(-0.2, 0.9, y)); c += vec3(1.6,1.2,0.6) * pow(max(0.0, dot(vP, normalize(vec3(0.4,0.8,0.3)))), 24.0); gl_FragColor = vec4(c,1.0); }`,
    }),
  );
  env.add(sky);
  const panel = (x, y, z, w, h, c, k) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    env.add(m);
  };
  panel(-14, 6, 8, 10, 3, '#ffd28a', 3.2);
  panel(16, -2, 6, 6, 12, '#ffffff', 1.4);
  panel(0, 18, -6, 18, 4, '#fff1d0', 2.4);
  panel(-6, -14, -10, 8, 8, '#b06a20', 1.2);
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(env, 0.02);
  pm.dispose();
  return rt.texture;
}


// Ash: a region already tried, burnt out (the history as an informal tabu list). Darkens what is behind it.
export function makeAsh(size) {
  const mat = new THREE.ShaderMaterial({
    vertexShader: spriteVert,
    fragmentShader: `
      uniform float uIntensity; uniform vec3 uColor; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main(){
        vec2 p = vUv - 0.5; float r = length(p) * 2.0;
        if (r > 1.0) discard;
        float body = smoothstep(1.0, 0.35, r);
        float ember = smoothstep(0.08, 0.0, abs(r - 0.82 - 0.06 * h(floor(vec2(atan(p.y, p.x) * 9.0, 0.0))))) ;
        vec3 col = vec3(0.02, 0.015, 0.012) + uColor * ember * 1.4;
        gl_FragColor = vec4(col, (body * 0.82 + ember * 0.6) * uIntensity);
      }`,
    uniforms: { uSize: { value: size }, uIntensity: { value: 0 }, uColor: { value: new THREE.Color('#b8641c') } },
    transparent: true, depthWrite: false,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  m.frustumCulled = false;
  m.renderOrder = 4;
  return m;
}
