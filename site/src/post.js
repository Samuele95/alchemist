import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// One grade over the whole image: lens composite, tear, déjà-vu glitch, freeze, aberration,
// vignette and grain. Runs in linear light before tone mapping (OutputPass).
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    tLens: { value: null },
    uRes: { value: new THREE.Vector2(1, 1) },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uLensR: { value: 0.0 },
    uTear: { value: 0 },
    uTearSeed: { value: 0 },
    uGlitch: { value: 0 },
    uGlitchSeed: { value: 0 },
    uFreeze: { value: 0 },
    uGrainSeed: { value: 0 },
    uFlash: { value: 0 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse, tLens;
    uniform vec2 uRes, uMouse;
    uniform float uLensR, uTear, uTearSeed, uGlitch, uGlitchSeed, uFreeze, uGrainSeed, uFlash;
    varying vec2 vUv;
    float h(float n){ return fract(sin(n) * 43758.5453); }
    float h2(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec2 uv = vUv;
      // the tear: the veil rips along horizontal bands
      float band = floor(uv.y * 54.0);
      float tr = (h(band * 1.7 + uTearSeed) - 0.5) * step(0.55, h(band + uTearSeed * 3.1));
      uv.x += tr * 0.09 * uTear;
      // déjà vu: blocks repeat and slip
      float gb = floor(uv.y * 18.0);
      uv.x += (h(gb + uGlitchSeed) - 0.5) * 0.05 * uGlitch * step(0.6, h(gb * 3.3 + uGlitchSeed));
      vec2 c = uv - 0.5;
      float ca = 0.0012 + 0.006 * uGlitch + 0.0025 * uFreeze + 0.004 * uTear;
      vec3 col;
      col.r = texture2D(tDiffuse, uv + c * ca).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - c * ca).b;
      // lens: the veil beneath the geometry
      vec2 asp = vec2(uRes.x / uRes.y, 1.0);
      float d = length((vUv - uMouse) * asp);
      float inside = smoothstep(uLensR, uLensR - 0.006, d) * step(0.001, uLensR);
      vec3 lens = texture2D(tLens, vUv + (vUv - uMouse) * -0.08 * inside).rgb * vec3(1.08, 0.96, 0.78);
      col = mix(col, lens, inside);
      float rim = smoothstep(0.004, 0.0, abs(d - uLensR)) * step(0.001, uLensR);
      col += vec3(1.6, 1.15, 0.55) * rim;
      // freeze: a cold, held breath
      col = mix(col, vec3(dot(col, vec3(0.3, 0.55, 0.15))) * vec3(0.92, 0.97, 1.08), uFreeze * 0.35);
      col += vec3(1.0, 0.95, 0.85) * uFlash;
      // vignette and grain
      float vig = smoothstep(1.15, 0.25, length(c * vec2(1.25, 1.0)));
      col *= mix(0.35, 1.0, vig);
      float g = h2(vUv * uRes + uGrainSeed) - 0.5;
      col += g * 0.035 * (0.4 + col);
      gl_FragColor = vec4(max(col, 0.0), 1.0);
    }
  `,
};

export class Post {
  constructor(renderer, scene, camera, tier) {
    this.renderer = renderer;
    this.composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType }));
    this.renderPass = new RenderPass(scene, camera);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), tier === 'lite' ? 0.6 : 0.8, 0.55, 0.42);
    this.grade = new ShaderPass(GradeShader);
    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.bloom);
    this.composer.addPass(this.grade);
    this.composer.addPass(new OutputPass());
    this.lensRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
    this.grade.uniforms.tLens.value = this.lensRT.texture;
  }
  setSize(w, h, pr) {
    this.composer.setPixelRatio(pr);
    this.composer.setSize(w, h);
    this.lensRT.setSize(Math.round(w * pr * 0.6), Math.round(h * pr * 0.6));
    this.grade.uniforms.uRes.value.set(w * pr, h * pr);
  }
  renderLens(scene, camera) {
    this.renderer.setRenderTarget(this.lensRT);
    this.renderer.clear();
    this.renderer.render(scene, camera);
    this.renderer.setRenderTarget(null);
  }
  render() {
    this.composer.render();
  }
}
