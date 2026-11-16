// Retratos estilo "icono pintado" (LTD2/LoL): busto encuadrado sobre degradado del color de su legión,
// luz de contorno, viñeta y pinceladas suaves. Se generan bajo demanda con un único renderer offscreen y se cachean.
//   getPortrait(key) → dataURL      key = idCampeón | 'u_'+idCampeón (mejorado) | 'c_'+idCriatura
//   preloadPortraits(keys, onProgress) → Promise
//   makePortraits() → Proxy compatible con el código antiguo (portraits[id])
import * as THREE from 'three';
import * as Models from './models.js';
import * as Data from './data.js';
import * as Content from './content/index.js';

const S = 192;            // tamaño final del icono
const R = 256;            // resolución del render 3D
let renderer = null, scene, cam, keyL, rimA, rimB, fill;
const cache = new Map();

function init() {
  if (renderer) return;
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = R;
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(R, R, false); renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  scene = new THREE.Scene();
  fill = new THREE.HemisphereLight(0xe8eeff, 0x2a2238, 1.25); scene.add(fill);
  keyL = new THREE.DirectionalLight(0xfff0dc, 3.0); keyL.position.set(-3, 4, 6); scene.add(keyL);
  rimA = new THREE.DirectionalLight(0x9fd0ff, 3.4); rimA.position.set(5, 3, -5); scene.add(rimA);
  rimB = new THREE.DirectionalLight(0xffc890, 2.2); rimB.position.set(-5, 2, -4); scene.add(rimB);
  cam = new THREE.PerspectiveCamera(28, 1, .05, 200);
}

function champInfo(id) {
  try {
    for (const l of Content.LEGIONS || []) { const c = (l.champions || []).find(c => c && (c.id === id || c.model === id)); if (c) return { model: c.model || c.id, color: l.color, accent: l.accent }; }
  } catch {}
  const f = (Data.FIGHTERS || []).find(f => f.id === id); if (f) return { model: f.id, color: f.color, accent: f.accent };
  return { model: id, color: 0x3a4a6a, accent: 0xc8aa6e };
}
const VOID = /herald|grub|voidling|hunter|baron|chogath|elder|void/;
function resolve(key) {
  if (key.startsWith('c_')) {
    const id = key.slice(2), c = (Data.CREEPS || {})[id];
    const kind = c ? c.k : id, isVoid = VOID.test(id) || VOID.test(kind), isMinion = /minion|super|cannon|melee|caster/.test(kind + id);
    return { kind, creature: true, scale: c ? c.s : 1, color: isVoid ? 0x5a1f8a : isMinion ? 0x2a4a7a : /drake|elder/.test(kind) ? 0x6a3a1a : 0x2f6a2a, accent: isVoid ? 0xd07bff : isMinion ? 0x8fc8ff : /drake/.test(kind) ? 0xffb05a : 0xa8ff7a };
  }
  const up = key.startsWith('u_'), id = up ? key.slice(2) : key, ci = champInfo(id);
  return { kind: ci.model, up, color: ci.color ?? 0x3a4a6a, accent: ci.accent ?? 0xc8aa6e };
}
const rgb = n => [n >> 16 & 255, n >> 8 & 255, n & 255];
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const css = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
function seeded(str) { let h = 2166136261; for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296; }

function render3D(info) {
  init();
  let m; try { m = Models.buildModel(info.kind, 'red', { upgraded: !!info.up }); } catch (e) { return null; }
  if (!m || !m.g) return null;
  const g = new THREE.Group(); g.add(m.g); g.rotation.y = info.creature ? -.55 : -.38; scene.add(g);
  try { if (Models.animate) for (let i = 0; i < 4; i++) Models.animate(m, { moving: false, atk: -1, cast: 0, speed: 8 }, .4, 1 / 30); } catch {}
  g.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(g), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  const head = m.rig && m.rig.head && m.rig.head.isObject3D ? m.rig.head.getWorldPosition(new THREE.Vector3()) : null;
  let target, span;
  if (!info.creature && head && size.y > .3) {
    // busto: cabeza en el tercio superior, hombros abajo
    span = Math.max(size.y * .56, .9); target = new THREE.Vector3(head.x, head.y - span * .16, head.z);
  } else {
    span = Math.max(size.y, size.x * .8) * .82; target = new THREE.Vector3(c.x, c.y + size.y * .1, c.z);
  }
  const dist = span / (2 * Math.tan(cam.fov * Math.PI / 360));
  cam.position.set(target.x + dist * .08, target.y + dist * .05, target.z + dist + Math.max(size.z, size.x) * .1);
  cam.near = .05; cam.far = dist * 6 + 50; cam.updateProjectionMatrix(); cam.lookAt(target);
  const ac = new THREE.Color(info.accent); rimA.color.copy(ac).lerp(new THREE.Color(0xffffff), .35);
  rimB.color.copy(new THREE.Color(info.color)).lerp(new THREE.Color(0xffffff), .5);
  renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, cam);
  scene.remove(g);
  g.traverse(o => { if (o.isMesh) { o.geometry?.dispose?.(); } });
  return renderer.domElement;
}

function compose(key, info, src) {
  const cv = document.createElement('canvas'); cv.width = cv.height = S; const x = cv.getContext('2d');
  const base = rgb(info.color >>> 0), acc = rgb(info.accent >>> 0), rnd = seeded(key);
  const light = mix(base, [255, 255, 255], .35), dark = mix(base, [8, 10, 18], .78);
  // fondo: degradado radial del color de legión
  let gr = x.createRadialGradient(S * .5, S * .34, S * .05, S * .5, S * .5, S * .78);
  gr.addColorStop(0, css(light)); gr.addColorStop(.45, css(mix(base, dark, .3))); gr.addColorStop(1, css(dark));
  x.fillStyle = gr; x.fillRect(0, 0, S, S);
  // pinceladas suaves
  x.save(); x.filter = 'blur(7px)'; x.globalCompositeOperation = 'screen';
  for (let i = 0; i < 9; i++) { const c = rnd() < .5 ? acc : light; x.fillStyle = css(c, .08 + rnd() * .12); x.beginPath(); x.ellipse(rnd() * S, rnd() * S * .8, 18 + rnd() * 40, 6 + rnd() * 16, rnd() * 3, 0, 7); x.fill(); }
  x.restore();
  // halo detrás de la figura
  gr = x.createRadialGradient(S * .52, S * .4, 0, S * .52, S * .4, S * .42); gr.addColorStop(0, css(mix(acc, [255, 255, 255], .5), .45)); gr.addColorStop(1, css(acc, 0));
  x.fillStyle = gr; x.fillRect(0, 0, S, S);
  if (src) {
    // brillo exterior (luz de contorno pintada)
    x.save(); x.shadowColor = css(mix(acc, [255, 255, 255], .3), .9); x.shadowBlur = 14; x.filter = 'saturate(1.2) contrast(1.08)';
    x.drawImage(src, 0, 0, R, R, 0, 0, S, S); x.restore();
    // suavizado "pintado": capa difusa superpuesta
    x.save(); x.globalAlpha = .28; x.globalCompositeOperation = 'soft-light'; x.filter = 'blur(2px)'; x.drawImage(src, 0, 0, R, R, 0, 0, S, S); x.restore();
  } else {
    x.fillStyle = css(acc, .85); x.font = `bold ${S * .42}px serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('?', S / 2, S / 2);
  }
  // degradado inferior + viñeta
  gr = x.createLinearGradient(0, S * .6, 0, S); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, css(dark, .75)); x.fillStyle = gr; x.fillRect(0, 0, S, S);
  gr = x.createRadialGradient(S / 2, S * .45, S * .32, S / 2, S / 2, S * .75); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.62)'); x.fillStyle = gr; x.fillRect(0, 0, S, S);
  // brillo superior
  gr = x.createLinearGradient(0, 0, S, S); gr.addColorStop(0, 'rgba(255,255,255,.10)'); gr.addColorStop(.35, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, S, S);
  if (info.up) { x.strokeStyle = 'rgba(255,215,120,.55)'; x.lineWidth = 3; x.strokeRect(1.5, 1.5, S - 3, S - 3); }
  return cv.toDataURL('image/png');
}

export function getPortrait(key) {
  if (!key) key = '?';
  if (cache.has(key)) return cache.get(key);
  let url = '';
  try { const info = resolve(String(key)); url = compose(String(key), info, render3D(info)); }
  catch (e) { console.warn('retrato', key, e); url = ''; }
  cache.set(key, url); return url;
}
export const hasPortrait = key => cache.has(key);

export async function preloadPortraits(keys = [], onProgress) {
  const list = [...new Set(keys)].filter(k => !cache.has(k)); let i = 0;
  for (const k of list) { getPortrait(k); i++; onProgress && onProgress(i, list.length, k); if (i % 2 === 0) await new Promise(r => setTimeout(r, 0)); }
  onProgress && onProgress(list.length, list.length);
}

// Compatibilidad: portraits[id] → dataURL generado bajo demanda
export function makePortraits() {
  return new Proxy({}, { get: (_, k) => typeof k === 'string' && k !== 'then' && k !== 'toJSON' ? getPortrait(k) : undefined, has: () => true });
}
