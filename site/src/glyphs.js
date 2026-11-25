import * as THREE from 'three';

// One atlas of 16 x 16 cells. Cells [0, SYMBOLS) are the esoteric signs (alchemical and planetary
// symbols); the rest are the letters used to write the inscription — the candidate prompt.

const ALCH = Array.from({ length: 116 }, (_, i) => String.fromCodePoint(0x1f700 + i));
const ASTRO = '☉☽☾☿♀♁♂♃♄♅♆♇♈♉♊♋♌♍♎♏♐♑♒♓☊☋☌☍'.split('');
const SIGNS = [...ALCH, ...ASTRO];
const TEXT = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:;'/£-()?!=+*<>{}[]#&%";

export const GRID = 16;
export const SYMBOLS = SIGNS.length;
export const CHARSET = [...SIGNS, ...TEXT.split('')];
export const GLYPHS = Math.min(CHARSET.length, GRID * GRID);

export function charIndex(ch) {
  const i = SIGNS.length + TEXT.indexOf(ch.toUpperCase());
  return i >= SIGNS.length ? i : -1;
}

export async function buildAtlas() {
  await Promise.all([
    document.fonts.load('96px "Noto Sans Symbols"', '🜁☿'),
    document.fonts.load('500 96px "IBM Plex Mono"', 'A'),
  ]);
  const cell = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = cell * GRID;
  const g = canvas.getContext('2d');
  g.fillStyle = '#000';
  g.fillRect(0, 0, canvas.width, canvas.height);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.shadowColor = 'rgba(255,255,255,0.9)';
  g.shadowBlur = 6;
  g.fillStyle = '#fff';
  for (let i = 0; i < GLYPHS; i++) {
    const ch = CHARSET[i];
    const x = (i % GRID) * cell + cell / 2;
    const y = Math.floor(i / GRID) * cell + cell / 2;
    g.font = i < SYMBOLS ? '84px "Noto Sans Symbols"' : '500 92px "IBM Plex Mono"';
    g.fillText(ch, x, y + (i < SYMBOLS ? 4 : 6));
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 4;
  return tex;
}
