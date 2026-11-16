import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { GRID, LANE } from './data.js';
import { laneX, cellPos, teamOfLane, laneCount } from './sim.js';

// ─────────────────────────────────────────────────────────────
//  Entorno: la Grieta del Invocador reinterpretada para Legion TD
// ─────────────────────────────────────────────────────────────
const TEAM = [
  { main: 0x3aa0ff, glow: 0x58b8ff, hot: 0xbfe6ff, deep: 0x0c2450, cloth: 0x1d4aa6, trim: 0xc8aa6e },
  { main: 0xff4a36, glow: 0xff6448, hot: 0xffd2b8, deep: 0x4a0c0c, cloth: 0xa0221c, trim: 0xc8aa6e },
];
const GOLD = 0xc8aa6e;

// ───────── utilidades de ruido ─────────
let seed = 1337; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const rr = (a, b) => a + rnd() * (b - a);
function noiseField(n) { const f = new Float32Array(n * n); for (let i = 0; i < f.length; i++) f[i] = rnd(); return f; }
function vnoise(f, n, x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const g = (a, b) => f[((b % n + n) % n) * n + ((a % n + n) % n)]; const sm = t => t * t * (3 - 2 * t); const u = sm(xf), v = sm(yf); return (g(xi, yi) * (1 - u) + g(xi + 1, yi) * u) * (1 - v) + (g(xi, yi + 1) * (1 - u) + g(xi + 1, yi + 1) * u) * v; }
function fbm(f, n, x, y, oct = 5) { let a = .5, s = 0, fr = 1, w = 0; for (let i = 0; i < oct; i++) { s += a * vnoise(f, n, x * fr, y * fr); w += a; fr *= 2.03; a *= .5; } return s / w; }
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
function canvasTex(size, draw, repeat, srgb = true, h = size) { const c = document.createElement('canvas'); c.width = size; c.height = h; const ctx = c.getContext('2d'); draw(ctx, size, h); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (repeat) t.repeat.set(repeat, repeat); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
function pixelTex(size, fn, repeat, srgb = true) { return canvasTex(size, (ctx, s) => { const im = ctx.createImageData(s, s); for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) { const [r, g, b] = fn(x / s, y / s, x, y); const i = (y * s + x) * 4; im.data[i] = r; im.data[i + 1] = g; im.data[i + 2] = b; im.data[i + 3] = 255; } ctx.putImageData(im, 0, 0); }, repeat, srgb); }
const cl255 = v => Math.max(0, Math.min(255, v | 0));

// ───────── texturas procedurales ─────────
export function makeTextures(LOW = false) {
  const N = 64, nf = noiseField(N), nf2 = noiseField(N);
  const wf = (f, u, v, fr, oct = 5) => { let a = .5, s = 0; for (let i = 0; i < oct; i++) { s += a * vnoise(f, N, (u * fr * (1 << i)) % N, (v * fr * (1 << i)) % N); a *= .5; } return s; };
  // césped casi neutro: el tono lo ponen los colores de vértice del terreno
  const grass = pixelTex(LOW ? 256 : 512, (u, v) => {
    const n = wf(nf, u, v, 4, 5), n2 = wf(nf2, u, v, 16, 3), bl = wf(nf2, (u * 5) % 1, (v * 60) % 1, 8, 2);
    const k = .78 + (n - .45) * .35 + (n2 - .5) * .22 + (bl - .5) * .16;
    return [cl255(205 * k), cl255(222 * k), cl255(180 * k)];
  }, 1);
  // adoquín (DataTexture: alfa = valor aleatorio por piedra, para el desgaste del borde)
  const cobble = (() => {
    const S = LOW ? 256 : 512, C = 6, data = new Uint8Array(S * S * 4), bump = new Uint8Array(S * S * 4);
    const pts = []; for (let j = 0; j < C; j++) for (let i = 0; i < C; i++) pts.push([.2 + rnd() * .6, .2 + rnd() * .6, rnd(), rnd(), rnd()]);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const u = x / S, v = y / S; const ci = Math.floor(u * C), cj = Math.floor(v * C);
      let d1 = 9, d2 = 9, best = null;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const ii = ((ci + di) % C + C) % C, jj = ((cj + dj) % C + C) % C, p = pts[jj * C + ii]; const dx = u - (ci + di + p[0]) / C, dy = v - (cj + dj + p[1]) / C; const d = Math.hypot(dx, dy); if (d < d1) { d2 = d1; d1 = d; best = p; } else if (d < d2) d2 = d; }
      const e = (d2 - d1) * C; // 0 en la junta
      const n = wf(nf, u, v, 8, 4), n2 = wf(nf2, u, v, 32, 2);
      const inStone = sstep(.06, .2, e);
      const tint = best[2], b0 = .78 + best[3] * .22;
      let r = lerp(196, 176, tint) * b0, g = lerp(190, 178, tint) * b0, b = lerp(172, 182, tint) * b0; // gris cálido / gris azulado
      const sh = .82 + (n - .45) * .5 + (n2 - .5) * .2 - (1 - sstep(.2, .5, e)) * .12;
      r *= sh; g *= sh; b *= sh;
      // junta: tierra oscura con musgo
      const mr = 70 + n2 * 30, mg = 72 + n2 * 34, mb = 44 + n2 * 14;
      const i = (y * S + x) * 4;
      data[i] = cl255(lerp(mr, r, inStone)); data[i + 1] = cl255(lerp(mg, g, inStone)); data[i + 2] = cl255(lerp(mb, b, inStone)); data[i + 3] = cl255(lerp(4, 30 + best[4] * 225, inStone));
      const hgt = cl255(sstep(0, .45, e) * 200 + n2 * 55); bump[i] = bump[i + 1] = bump[i + 2] = hgt; bump[i + 3] = 255;
    }
    const mk = (d, srgb) => { const t = new THREE.DataTexture(d, S, S, THREE.RGBAFormat); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; return t; };
    return { map: mk(data, true), bump: mk(bump, false) };
  })();
  const stone = pixelTex(LOW ? 256 : 512, (u, v) => {
    const tiles = 4, cx = Math.floor(u * tiles), cy = Math.floor(v * tiles), fu = (u * tiles) % 1, fv = (v * tiles + (cx % 2) * .5) % 1; const edge = Math.min(fu, 1 - fu, fv, 1 - fv);
    const n = wf(nf, u, v, 6, 4), n2 = wf(nf2, u, v, 28, 2), tint = (Math.sin(cx * 12.9 + cy * 78.2) * 43758.5 % 1 + 1) % 1;
    let k = .62 + n * .4 + (n2 - .5) * .2 + (tint - .5) * .14; if (edge < .035) k *= .6 + edge * 10 * .4; if (edge < .01) k *= .55;
    return [cl255(150 * k + 20), cl255(146 * k + 18), cl255(138 * k + 18)];
  }, 1);
  const stoneBump = pixelTex(256, (u, v) => { const tiles = 4, cx = Math.floor(u * tiles), fu = (u * tiles) % 1, fv = (v * tiles + (cx % 2) * .5) % 1; const e = Math.min(fu, 1 - fu, fv, 1 - fv); const c = cl255(Math.min(1, e * 18) * 150 + wf(nf, u, v, 12, 3) * 100); return [c, c, c]; }, 1, false);
  const tile = canvasTex(256, (ctx, s) => {
    const g = ctx.createLinearGradient(0, 0, s, s); g.addColorStop(0, '#5d6470'); g.addColorStop(1, '#3e4552'); ctx.fillStyle = '#20242c'; ctx.fillRect(0, 0, s, s); ctx.fillStyle = g; ctx.fillRect(8, 8, s - 16, s - 16);
    for (let i = 0; i < 900; i++) { ctx.fillStyle = `rgba(${rnd() > .5 ? '255,255,255' : '0,0,0'},${rnd() * .06})`; ctx.fillRect(8 + rnd() * (s - 16), 8 + rnd() * (s - 16), 2 + rnd() * 6, 2 + rnd() * 6); }
    ctx.strokeStyle = '#c8aa6e'; ctx.lineWidth = 5; ctx.strokeRect(9, 9, s - 18, s - 18); ctx.strokeStyle = 'rgba(240,226,190,.45)'; ctx.lineWidth = 1.5; ctx.strokeRect(20, 20, s - 40, s - 40);
    ctx.strokeStyle = 'rgba(220,235,255,.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(s / 2, s / 2, 40, 0, 7); ctx.stroke(); ctx.beginPath(); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; ctx.moveTo(s / 2 + Math.cos(a) * 40, s / 2 + Math.sin(a) * 40); ctx.lineTo(s / 2 + Math.cos(a) * 64, s / 2 + Math.sin(a) * 64); } ctx.stroke();
  });
  const glowT = canvasTex(128, (ctx, s) => { const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, s, s); }, 0, false);
  const ring = canvasTex(256, (ctx, s) => { const g = ctx.createRadialGradient(s / 2, s / 2, s * .3, s / 2, s / 2, s / 2); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.75, 'rgba(255,255,255,.9)'); g.addColorStop(.85, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, s, s); }, 0, false);
  const water = pixelTex(256, (u, v) => { const n = wf(nf, u, v, 6, 5), n2 = wf(nf2, u, v, 12, 4); const k = Math.pow(n * .6 + n2 * .6, 2.2); return [cl255(70 + 110 * k), cl255(140 + 100 * k), cl255(170 + 80 * k)]; }, 1);
  // runas (blanco sobre negro, para materiales aditivos)
  const runes = canvasTex(512, (ctx, s, h) => {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, s, h); ctx.strokeStyle = '#fff'; ctx.lineCap = 'round'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 6;
    const n = 16, w = s / n;
    for (let i = 0; i < n; i++) { const x0 = i * w + w * .2, y0 = h * .18, ww = w * .6, hh = h * .64; ctx.lineWidth = 3.2; ctx.beginPath(); const k = 3 + (rnd() * 3 | 0); let px = x0 + rnd() * ww, py = y0; ctx.moveTo(px, py); for (let j = 0; j < k; j++) { px = x0 + (rnd() > .5 ? ww : 0) * (rnd() > .3 ? 1 : .5); py = y0 + hh * (j + 1) / k; ctx.lineTo(px, py); } ctx.stroke(); if (rnd() > .4) { ctx.beginPath(); ctx.arc(x0 + ww / 2, y0 + hh * rnd(), ww * .18, 0, 7); ctx.stroke(); } }
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, h * .06); ctx.lineTo(s, h * .06); ctx.moveTo(0, h * .94); ctx.lineTo(s, h * .94); ctx.stroke();
  }, 0, true, 64);
  const flame = canvasTex(64, (ctx, s, h) => {
    const g = ctx.createRadialGradient(s / 2, h * .72, 1, s / 2, h * .62, s * .5); g.addColorStop(0, 'rgba(255,255,230,1)'); g.addColorStop(.3, 'rgba(255,200,90,.9)'); g.addColorStop(.7, 'rgba(255,90,20,.35)'); g.addColorStop(1, 'rgba(255,40,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(s / 2, 2); ctx.bezierCurveTo(s * .9, h * .45, s * .95, h * .95, s / 2, h - 2); ctx.bezierCurveTo(s * .05, h * .95, s * .1, h * .45, s / 2, 2); ctx.fill();
  }, 0, false, 128);
  // grietas del Nexo (líneas oscuras con borde incandescente)
  const cracks = canvasTex(512, (ctx, s) => {
    ctx.clearRect(0, 0, s, s);
    const branch = (x, y, a, len, w, d) => { if (d > 5 || len < 6) return; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, y); let px = x, py = y; const steps = 5; for (let i = 0; i < steps; i++) { a += (rnd() - .5) * .9; px += Math.cos(a) * len / steps; py += Math.sin(a) * len / steps; ctx.lineTo(px, py); if (rnd() < .3) branch(px, py, a + (rnd() - .5) * 2.2, len * .5, w * .6, d + 1); } ctx.stroke(); };
    ctx.shadowColor = '#fff'; ctx.shadowBlur = 10;
    for (const [col, w0] of [['rgba(255,255,255,.3)', 22], ['rgba(255,255,255,1)', 7]]) { ctx.strokeStyle = col; seed = 4242; for (let i = 0; i < 22; i++) branch(rnd() * s, i % 2 ? s * .5 + (rnd() - .5) * s * .3 : rnd() * s, (i % 2 ? (rnd() > .5 ? 1.57 : -1.57) : rnd() * 6.28) + (rnd() - .5), 200 + rnd() * 220, w0, 0); }
    seed = 98765;
  }, 0, true);
  return { grass, cobble: cobble.map, cobbleBump: cobble.bump, stone, stoneBump, tile, glow: glowT, ring, water, runes, flame, cracks };
}

// ───────── partículas por shader (sin coste de CPU) ─────────
const PSCALE = { value: 1000 };
function makeParticles({ n, radius, height, speed, color, size, swirl = 0, amt = 1, fall = false }) {
  const g = new THREE.BufferGeometry(); const pos = new Float32Array(n * 3), sd = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) sd.set([rnd(), rnd(), rnd(), rnd()], i * 4);
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('seed', new THREE.BufferAttribute(sd, 4));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, height / 2, 0), Math.max(radius, height) + 2);
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { t: { value: rnd() * 50 }, color: { value: new THREE.Color(color) }, amt: { value: amt }, size: { value: size }, R: { value: radius }, H: { value: height }, spd: { value: speed }, sw: { value: swirl }, fall: { value: fall ? 1 : 0 }, psc: PSCALE },
    vertexShader: `attribute vec4 seed; uniform float t,size,R,H,spd,sw,amt,fall,psc; varying float vA;
      void main(){ float ph = fract(seed.x + t*spd*(.6+seed.w*.8)); float a = seed.y*6.2832 + t*sw*(.4+seed.z);
        float r = R*sqrt(seed.z)*(1.-ph*.35*(1.-fall)); float y = mix(ph*H, H*(1.-ph*ph), fall);
        vec3 p = vec3(cos(a)*r, y, sin(a)*r) + vec3(sin(t*.7+seed.w*9.)*.3, 0., cos(t*.6+seed.x*7.)*.3);
        vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv;
        gl_PointSize = size*(.5+seed.w)*psc/max(1.,-mv.z);
        vA = amt*smoothstep(0.,.12,ph)*(1.-smoothstep(.55,1.,ph)); }`,
    fragmentShader: `uniform vec3 color; varying float vA; void main(){ float d = length(gl_PointCoord-.5); float a = smoothstep(.5,0.,d); gl_FragColor = vec4(color*(1.+a*a*1.5), a*vA); }`,
  });
  const p = new THREE.Points(g, m); p.frustumCulled = false; return p;
}

// ───────── geometrías utilitarias ─────────
function colorize(geo, fn) { const p = geo.attributes.position, n = geo.attributes.normal, c = new Float32Array(p.count * 3); const col = new THREE.Color(); for (let i = 0; i < p.count; i++) { fn(col, p.getX(i), p.getY(i), p.getZ(i), n ? n.getY(i) : 1); c.set([col.r, col.g, col.b], i * 3); } geo.setAttribute('color', new THREE.BufferAttribute(c, 3)); return geo; }
const srgb = (c, r, g, b) => c.setRGB(r, g, b, THREE.SRGBColorSpace);
function scaleUV(geo, sx, sy = 1) { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * sx, uv.getY(i) * sy); return geo; }
function strip(geo) { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(k)) g.deleteAttribute(k); return g; }
function jitter(geo, amt, s = 1) { const p = geo.attributes.position; const key = (x, y, z) => `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`; const map = new Map(); for (let i = 0; i < p.count; i++) { const k = key(p.getX(i), p.getY(i), p.getZ(i)); if (!map.has(k)) map.set(k, [rr(-amt, amt), rr(-amt, amt) * s, rr(-amt, amt)]); const o = map.get(k); p.setXYZ(i, p.getX(i) + o[0], p.getY(i) + o[1], p.getZ(i) + o[2]); } return geo; }

// mata de hierba: hojas finas en abanico, normales hacia arriba (sombreado suave)
function tuftGeo(blades = 7, hgt = .7) {
  const P = [], C = []; const base = [.16, .26, .07], tip = [.62, .74, .3];
  for (let i = 0; i < blades; i++) {
    const a = i / blades * 6.283 + rr(-.3, .3), lean = rr(.2, .55), h = hgt * rr(.55, 1.1), w = rr(.07, .12);
    const cx = Math.cos(a), sz = Math.sin(a), px = -sz * w, pz = cx * w, ox = cx * rr(0, .12), oz = sz * rr(0, .12);
    P.push(ox - px, 0, oz - pz, ox + px, 0, oz + pz, ox + cx * lean * h, h, oz + sz * lean * h);
    C.push(...base, ...base, ...tip);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C.map(v => Math.pow(v, 2.2)), 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(P.length).fill(0).map((_, i) => i % 3 === 1 ? 1 : 0), 3)); return g;
}
function flowerGeo() {
  const parts = []; for (let i = 0; i < 4; i++) { const h = new THREE.OctahedronGeometry(rr(.09, .13), 0); h.scale(1, .55, 1); h.translate(rr(-.22, .22), rr(.16, .32), rr(-.22, .22)); parts.push(strip(h)); }
  return mergeGeometries(parts);
}
// árbol estilizado tipo LoL: tronco curvo + copa redondeada en capas
function treeGeos(kind) {
  const trunk = new THREE.CylinderGeometry(.2, .36, 3, 7, 6, true); trunk.translate(0, 1.5, 0);
  const tp = trunk.attributes.position, bend = rr(.25, .55), dir = rr(0, 6.28);
  for (let i = 0; i < tp.count; i++) { const y = tp.getY(i); let x = tp.getX(i), z = tp.getZ(i); const fl = 1 + Math.max(0, .5 - y) * 1.1; x *= fl; z *= fl; const b = bend * Math.pow(y / 3, 2) * 1.4 + Math.sin(y * 1.7) * .08; tp.setXYZ(i, x + Math.cos(dir) * b, y, z + Math.sin(dir) * b); }
  trunk.computeVertexNormals();
  const top = new THREE.Vector3(Math.cos(dir) * bend * 1.4, 3, Math.sin(dir) * bend * 1.4);
  colorize(trunk, (c, x, y) => srgb(c, .36 + y * .02, .25 + y * .015, .17));
  let blobs;
  if (kind === 2) { // conífera estilizada
    blobs = []; for (let i = 0; i < 3; i++) { const cn = new THREE.ConeGeometry(2.1 - i * .55, 2.4, 8, 1); cn.translate(top.x * .6, 2.2 + i * 1.35, top.z * .6); blobs.push([cn, i]); }
  } else {
    const L = kind === 0 ? [[0, 3.4, 0, 1.75], [1.15, 3.0, .35, 1.25], [-1.0, 3.1, -.3, 1.3], [.2, 3.15, 1.0, 1.15], [.25, 4.5, .05, 1.35], [-.2, 5.35, -.1, .85]]
      : [[0, 3.6, 0, 1.55], [.95, 3.3, -.5, 1.15], [-.9, 3.5, .45, 1.1], [0, 4.7, 0, 1.15], [.5, 4.2, .6, .9]];
    blobs = L.map(([x, y, z, r], i) => { let s = new THREE.IcosahedronGeometry(r, 1); s.deleteAttribute('normal'); s.deleteAttribute('uv'); s = mergeVertices(s); jitter(s, r * .08); s.scale(1, .82, 1); s.translate(top.x * .8 + x, y, top.z * .8 + z); return [s, i]; });
  }
  const parts = blobs.map(([g, i]) => { g.computeVertexNormals(); const gg = strip(g); colorize(gg, (c, x, y, z, ny) => { const k = sstep(2., 5.8, y) * .55 + Math.max(0, ny) * .35 - (kind === 2 ? .12 : 0); srgb(c, lerp(.14, .52, k) * (kind === 2 ? .8 : 1), lerp(.3, .72, k), lerp(.16, .32, k) * (kind === 2 ? 1.25 : 1)); }); return gg; });
  return { trunk: strip(trunk), canopy: mergeGeometries(parts) };
}

// ───────── fusión de mallas estáticas (menos draw calls) ─────────
const DYN = new WeakSet(); const dyn = o => { DYN.add(o); return o; };
function bakeStatic(root) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), groups = new Map(), m4 = new THREE.Matrix4();
  const visit = o => { if (DYN.has(o)) return; if (o.isMesh && !o.isInstancedMesh && o !== root && !o.children.length) { if (!groups.has(o.material)) groups.set(o.material, []); groups.get(o.material).push(o); } for (const c of o.children) visit(c); };
  visit(root);
  for (const [mat, list] of groups) {
    if (list.length < 2) continue;
    const geos = list.map(m => { const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k); if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); g.morphAttributes = {}; g.applyMatrix4(m4.multiplyMatrices(inv, m.matrixWorld)); return g; });
    const merged = mergeGeometries(geos); if (!merged) continue;
    const mesh = new THREE.Mesh(merged, mat); mesh.castShadow = list.some(m => m.castShadow); mesh.receiveShadow = list.some(m => m.receiveShadow); root.add(mesh);
    for (const m of list) m.parent.remove(m);
  }
}

// ───────── escena ─────────
export function createWorld(canvas, nLanes = laneCount ? laneCount() : 2) {
  const params = new URLSearchParams(location.search);
  const LOW = params.get('q') === 'low';
  seed = 1337;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, LOW ? 1 : 2)); renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  const scene = new THREE.Scene();
  const FOGC = 0xbcd2de; scene.fog = new THREE.FogExp2(FOGC, .0019); scene.background = new THREE.Color(FOGC);
  const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 1, 1600);
  const tx = makeTextures(LOW);
  const anim = { parts: [], flames: [], spin: [], bob: [], banners: [] };
  const addParts = p => { anim.parts.push(p); return p; };

  const LX = Array.from({ length: nLanes }, (_, i) => laneX(i)), xMin = LX[0], xMax = LX[nLanes - 1], xC = (xMin + xMax) / 2;
  const laneDist = x => { let d = 1e9; for (const l of LX) d = Math.min(d, Math.abs(x - l)); return d; };
  const nearLane = x => { let d = 1e9, b = 0; for (const l of LX) if (Math.abs(x - l) < d) { d = Math.abs(x - l); b = l; } return b; };
  // ríos entre carriles de equipos distintos (y en el centro del mapa)
  const rivers = [xC]; const riverX = (r, z) => r + Math.sin(z * .045 + .6) * 2.4 + Math.sin(z * .11) * .8;
  const riverD = (x, z) => { let d = 1e9; for (const r of rivers) d = Math.min(d, Math.abs(x - riverX(r, z))); return d; };

  // ───── cielo con nubes y sol ─────
  const sunDir = new THREE.Vector3(-.55, .62, .5).normalize();
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(0x3a78c8) }, mid: { value: new THREE.Color(0x9cc6ea) }, bot: { value: new THREE.Color(FOGC) }, sunDir: { value: sunDir }, t: { value: 0 } },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; vec4 p = projectionMatrix*modelViewMatrix*vec4(position,1.); gl_Position = p; }',
    fragmentShader: `varying vec3 vP; uniform vec3 top,mid,bot,sunDir; uniform float t;
      float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
      float fb(vec2 p){ float s=0., a=.5; for(int i=0;i<5;i++){ s+=a*n(p); p=p*2.03+vec2(1.7,9.2); a*=.5; } return s; }
      void main(){ vec3 d = normalize(vP); float y = d.y;
        vec3 c = mix(bot, mid, smoothstep(-.02,.2,y)); c = mix(c, top, smoothstep(.18,.75,y));
        float s = max(dot(d, sunDir), 0.); c += vec3(1.,.82,.55)*(pow(s,300.)*6. + pow(s,12.)*.35);
        if (y > -.05) { vec2 uv = d.xz/(max(y,0.)+.18)*1.6 + vec2(t*.006, t*.002); float k = fb(uv*.55);
          float cl = smoothstep(.48,.75,k)*smoothstep(-.02,.22,y);
          float lit = clamp(fb(uv*.55 + sunDir.xz*.06) - k + .55, 0., 1.);
          vec3 cc = mix(vec3(.62,.68,.8), vec3(1.,.97,.92), lit); c = mix(c, cc*1.05, cl*.82); }
        gl_FragColor = vec4(c,1.); }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1000, 32, 16), skyMat); sky.frustumCulled = false; sky.renderOrder = -10; scene.add(sky);

  // ───── luces ─────
  const hemi = new THREE.HemisphereLight(0xc6e0ff, 0x4a5a2c, .95); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe6c0, 3.0); sun.position.copy(sunDir).multiplyScalar(100); sun.castShadow = true;
  const SM = LOW ? 1024 : 4096; sun.shadow.mapSize.set(SM, SM); const sc = sun.shadow.camera; sc.left = -62; sc.right = 62; sc.top = 62; sc.bottom = -62; sc.near = 10; sc.far = 260; sun.shadow.bias = -.0005; sun.shadow.normalBias = .05; sun.shadow.radius = 2.5;
  scene.add(sun); scene.add(sun.target);
  const fill = new THREE.DirectionalLight(0x8fb0ff, .55); fill.position.set(60, 35, -40); scene.add(fill);

  // ───── terreno ─────
  const nfT = noiseField(32), nfC = noiseField(32);
  const Z0 = -210, Z1 = 175, X0 = xMin - 190, X1 = xMax + 190;
  function height(x, z) {
    const nn = fbm(nfT, 32, x * .035 + 9, z * .035 + 4, 4), d = laneDist(x);
    const ex = Math.max(0, x - (xMax + 36), (xMin - 36) - x), ez = Math.max(0, -64 - z, z - 56);
    const e = Math.hypot(ex, ez);
    let y = (nn - .5) * 1.6 * sstep(20, 32, d);
    y += 34 * (1 - Math.exp(-e / 34)) * (.45 + nn * 1.1) + Math.max(0, e - 20) * .08;
    const rd = riverD(x, z); if (z > -90 && z < 80) y -= 1.5 * sstep(7.5, 3, rd) * sstep(80, 60, Math.abs(z + 5));
    return y;
  }
  const TW = X1 - X0, TD = Z1 - Z0, segX = Math.round(TW / (LOW ? 3.4 : 2)), segZ = Math.round(TD / (LOW ? 3.4 : 2));
  const tgeo = new THREE.PlaneGeometry(TW, TD, segX, segZ); tgeo.rotateX(-Math.PI / 2); tgeo.translate((X0 + X1) / 2, 0, (Z0 + Z1) / 2);
  const tpos = tgeo.attributes.position; for (let i = 0; i < tpos.count; i++) tpos.setY(i, height(tpos.getX(i), tpos.getZ(i)));
  tgeo.computeVertexNormals();
  {
    const col = new THREE.Color(), cc = new Float32Array(tpos.count * 3), nrm = tgeo.attributes.normal;
    const lush = [.32, .52, .17], yel = [.5, .58, .22], teal = [.21, .42, .22], rock = [.48, .44, .37], sand = [.66, .6, .42], worn = [.46, .52, .26], voidc = [.2, .14, .22];
    const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
    for (let i = 0; i < tpos.count; i++) {
      const x = tpos.getX(i), y = tpos.getY(i), z = tpos.getZ(i), ny = nrm.getY(i);
      const n1 = fbm(nfC, 32, x * .02, z * .02, 4), n2 = fbm(nfC, 32, x * .09 + 3, z * .09 + 7, 3);
      let c = mix3(teal, lush, sstep(.32, .58, n1)); c = mix3(c, yel, sstep(.55, .75, n2) * .55);
      const d = laneDist(x); if (d < 17.5 && z > -48 && z < 40) c = mix3(c, worn, .35);
      c = mix3(c, rock, sstep(.86, .7, ny)); c = mix3(c, mix3(lush, [.62, .66, .5], .5), sstep(14, 40, y) * .35);
      const rd = riverD(x, z); if (Math.abs(z + 5) < 80) c = mix3(c, sand, sstep(7.5, 5, rd) * .85 * sstep(1.5, -.2, y));
      const pd = Math.hypot(x - nearLane(x), (z - (LANE.spawnZ - 4)) * 1.2); c = mix3(c, voidc, sstep(14, 6, pd) * .7);
      const ao = .82 + n2 * .3; srgb(col, c[0] * ao, c[1] * ao, c[2] * ao); cc.set([col.r, col.g, col.b], i * 3);
    }
    tgeo.setAttribute('color', new THREE.BufferAttribute(cc, 3));
  }
  tx.grass.repeat.set(TW / 9, TD / 9);
  const terrM = new THREE.MeshStandardMaterial({ map: tx.grass, vertexColors: true, roughness: 1, metalness: 0 });
  terrM.onBeforeCompile = sh => { // variación de color en espacio de mundo: manchas de trébol, hierba seca y tierra
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP = (modelMatrix*vec4(transformed,1.)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\nvarying vec3 vWP;\nfloat th(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }\nfloat tn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(th(i),th(i+vec2(1,0)),f.x), mix(th(i+vec2(0,1)),th(i+vec2(1,1)),f.x), f.y); }`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        { vec2 w = vWP.xz; float a = tn(w*.13)*.55 + tn(w*.41+7.)*.3 + tn(w*1.7)*.15; float b = tn(w*.07+31.);
          diffuseColor.rgb *= mix(vec3(.7,.84,.8), vec3(1.22,1.14,.84), smoothstep(.2,.8,a));
          float dirt = smoothstep(.6,.8, tn(w*.15+13.)*.7 + tn(w*.9)*.3) * (1.-smoothstep(4.,10.,vWP.y));
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.3,.24,.15), dirt*.7);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(dot(diffuseColor.rgb, vec3(.3,.59,.11))), .12 + b*.12); }`);
  };
  const terrain = new THREE.Mesh(tgeo, terrM); terrain.receiveShadow = true; scene.add(terrain);
  // suelo lejano + anillo de montañas (horizonte)
  const farG = new THREE.RingGeometry(.97, 8, 48, 1); farG.rotateX(-Math.PI / 2); farG.scale(TW / 2, 1, TD / 2); const far = new THREE.Mesh(farG, new THREE.MeshLambertMaterial({ color: 0x4f6a3c })); far.position.set((X0 + X1) / 2, 14, (Z0 + Z1) / 2); scene.add(far);
  {
    const parts = [], nfm = noiseField(32);
    const ring = (Rx, Rz, M, rA, rB, hA, hB, green) => {
      for (let i = 0; i < M; i++) {
        const a = i / M * Math.PI * 2 + rr(-.05, .05), r = rr(rA, rB), hgt = rr(hA, hB);
        const cn = new THREE.ConeGeometry(r, hgt, 14, 7); const p = cn.attributes.position, h2 = hgt / 2, o = rnd() * 20;
        for (let k = 0; k < p.count; k++) { const x = p.getX(k), y = p.getY(k), z = p.getZ(k), t = (y + h2) / hgt, an = Math.atan2(z, x);
          const nn = fbm(nfm, 32, Math.cos(an) * 2 + o, t * 3 + Math.sin(an) * 2 + o, 3); const sc = .75 + nn * .55; const sl = Math.pow(1 - t, .75) / Math.max(1e-3, 1 - t);
          p.setXYZ(k, x * sc * (t < .999 ? sl : 1), y + (nn - .5) * hgt * .12 * (1 - t), z * sc * (t < .999 ? sl : 1)); }
        cn.computeVertexNormals(); const g = strip(cn);
        colorize(g, (c, x, y, z, ny) => { const t = (y + h2) / hgt; const rock = sstep(.25, .6, t) * (green ? .5 : 1); const snow = green ? 0 : sstep(.78, .9, t + (ny - .6) * .15);
          srgb(c, lerp(lerp(.27, .46, rock), .86, snow), lerp(lerp(.4, .48, rock), .9, snow), lerp(lerp(.3, .5, rock), .96, snow)); });
        g.translate(xC + Math.cos(a) * Rx, h2 - 4, -15 + Math.sin(a) * Rz); parts.push(g);
      }
    };
    ring((X1 - X0) / 2 + 10, TD / 2 + 10, LOW ? 30 : 46, 50, 80, 35, 70, true);
    ring((X1 - X0) / 2 + 150, TD / 2 + 150, LOW ? 26 : 40, 80, 130, 110, 210, false);
    const mtn = new THREE.Mesh(mergeGeometries(parts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })); scene.add(mtn);
  }

  // ───── río ─────
  const wM = new THREE.MeshStandardMaterial({ map: tx.water, color: 0x5fb8d0, emissive: 0x0a3a50, emissiveIntensity: .45, roughness: .08, metalness: .25, transparent: true, opacity: .82 });
  tx.water.repeat.set(.7, 8);
  for (const r of rivers) {
    const wg = new THREE.PlaneGeometry(12, 160, 1, 80); wg.rotateX(-Math.PI / 2); const wp = wg.attributes.position;
    for (let i = 0; i < wp.count; i++) { const z = wp.getZ(i) - 5; wp.setX(i, wp.getX(i) + riverX(r, z)); wp.setZ(i, z); }
    const river = new THREE.Mesh(wg, wM); river.position.y = -.55; river.receiveShadow = true; scene.add(river);
    for (const z of [-28, 18]) { // puentes de piedra
      const br = new THREE.Group(); br.position.set(riverX(r, z), 0, z); scene.add(br);
      const deck = new THREE.Mesh(new THREE.BoxGeometry(13, .5, 4.2), null); br.add(deck); deck.position.y = .2; deck.userData.mat = 'stone';
      for (const s of [-1, 1]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(13, .7, .4), null); rail.position.set(0, .75, s * 1.9); rail.userData.mat = 'stone'; br.add(rail); }
      anim.bridges = (anim.bridges || []).concat(br);
    }
  }

  // ───── materiales compartidos ─────
  const stoneM = new THREE.MeshStandardMaterial({ map: tx.stone, bumpMap: tx.stoneBump, bumpScale: 2, roughness: .85, metalness: .02, color: 0xe8e2d6 });
  const darkStoneM = new THREE.MeshStandardMaterial({ map: tx.stone, roughness: .8, color: 0x8a8a92 });
  const goldM = new THREE.MeshStandardMaterial({ color: GOLD, metalness: .85, roughness: .32, emissive: 0x2a1a05, emissiveIntensity: .4, side: THREE.DoubleSide });
  const woodM = new THREE.MeshStandardMaterial({ color: 0x4a3222, roughness: .9 });
  const obsidM = new THREE.MeshStandardMaterial({ color: 0x241a30, roughness: .35, metalness: .5, flatShading: true });
  for (const b of anim.bridges || []) b.traverse(o => { if (o.isMesh) { o.material = stoneM; o.castShadow = o.receiveShadow = true; } });
  const teamMats = TEAM.map(T => ({
    plate: new THREE.MeshStandardMaterial({ color: T.cloth, metalness: .6, roughness: .35, emissive: T.deep, emissiveIntensity: .5 }),
    orb: new THREE.MeshStandardMaterial({ color: T.main, emissive: T.main, emissiveIntensity: 1.3, roughness: .2 }),
    glow: new THREE.SpriteMaterial({ map: tx.glow, color: T.glow, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .7 }),
    rune: new THREE.MeshBasicMaterial({ map: tx.runes, color: T.glow, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }),
  }));
  const flameMat = new THREE.SpriteMaterial({ map: tx.flame, color: 0xffb060, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  const flameGlow = new THREE.SpriteMaterial({ map: tx.glow, color: 0xff7a2a, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .5 });

  // ───── props reutilizables ─────
  const shadowed = o => { o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; };
  function brazier(h = 1.6) {
    const g = new THREE.Group();
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(.32, .5, h, 8), stoneM); ped.position.y = h / 2; g.add(ped);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(.85, .4, .55, 10, 1, true), goldM); bowl.position.y = h + .2; g.add(bowl);
    const coal = new THREE.Mesh(new THREE.CircleGeometry(.75, 10), new THREE.MeshBasicMaterial({ color: 0xff6a20 })); coal.rotation.x = -Math.PI / 2; coal.position.y = h + .38; g.add(coal);
    shadowed(g);
    const f = []; for (let i = 0; i < 3; i++) { const s = new THREE.Sprite(flameMat); s.position.set(rr(-.15, .15), h + .9 + i * .1, rr(-.15, .15)); s.scale.set(.9 - i * .15, 1.6 - i * .3, 1); g.add(s); f.push(s); }
    const gl = new THREE.Sprite(flameGlow); gl.position.y = h + .8; gl.scale.setScalar(4.5); g.add(gl);
    const emb = makeParticles({ n: 14, radius: .5, height: 3.2, speed: .45, color: 0xff8a30, size: .12, swirl: .5 }); emb.position.y = h + .4; g.add(emb); addParts(emb);
    anim.flames.push({ f, gl, ph: rnd() * 10, h }); return g;
  }
  function banner(team) {
    const T = TEAM[team], g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.09, .12, 6.4, 6), woodM); pole.position.y = 3.2; g.add(pole);
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 2.2, 6), goldM); bar.rotation.z = Math.PI / 2; bar.position.set(0, 6.1, 0); g.add(bar);
    const fin = new THREE.Mesh(new THREE.OctahedronGeometry(.2), goldM); fin.position.y = 6.6; g.add(fin);
    if (!anim.bannerGeo) anim.bannerGeo = [];
    if (!anim.bannerGeo[team]) {
      const geo = new THREE.PlaneGeometry(1.9, 3.6, 4, 10); geo.translate(0, -1.8, 0); geo.userData.base = Float32Array.from(geo.attributes.position.array);
      const tex = canvasTex(128, (ctx, s, h) => {
        const c = '#' + new THREE.Color(T.cloth).getHexString(); ctx.fillStyle = c; ctx.fillRect(0, 0, s, h);
        const gr = ctx.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(0,0,0,.35)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, s, h);
        ctx.strokeStyle = '#d8b878'; ctx.lineWidth = 7; ctx.strokeRect(6, 4, s - 12, h - 30);
        ctx.fillStyle = '#e8cf90'; ctx.beginPath(); ctx.moveTo(s / 2, 52); ctx.lineTo(s / 2 + 28, 100); ctx.lineTo(s / 2, 150); ctx.lineTo(s / 2 - 28, 100); ctx.closePath(); ctx.fill();
        ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(s / 2, 74); ctx.lineTo(s / 2 + 14, 100); ctx.lineTo(s / 2, 126); ctx.lineTo(s / 2 - 14, 100); ctx.closePath(); ctx.fill();
        ctx.clearRect(0, h - 26, s, 26); ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, h - 27); ctx.lineTo(s / 2, h - 2); ctx.lineTo(s, h - 27); ctx.fill();
      }, 0, true, 256);
      anim.bannerGeo[team] = { geo, mat: new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: .8, alphaTest: .5 }) };
      anim.banners.push(geo);
    }
    const cloth = new THREE.Mesh(anim.bannerGeo[team].geo, anim.bannerGeo[team].mat); cloth.position.set(0, 6.05, .12); g.add(dyn(cloth));
    return shadowed(g);
  }
  function turret(team) {
    const g = new THREE.Group(), M = teamMats[team];
    const b0 = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.5, 1.1, 8), stoneM); b0.position.y = .55; g.add(b0);
    const r0 = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.15, .18, 8), goldM); r0.position.y = 1.15; g.add(r0);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.45, 5.6, 8), stoneM); shaft.position.y = 4; g.add(shaft);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; const pl = new THREE.Mesh(new THREE.BoxGeometry(.9, 4.4, .35), M.plate); pl.position.set(Math.cos(a) * 1.25, 3.9, Math.sin(a) * 1.25); pl.rotation.y = -a + Math.PI / 2; pl.rotation.x = 0; g.add(pl);
      const sp = new THREE.Mesh(new THREE.ConeGeometry(.28, 1.6, 5), goldM); sp.position.set(Math.cos(a) * 1.55, 7.6, Math.sin(a) * 1.55); sp.rotation.set(Math.sin(a) * .5, 0, -Math.cos(a) * .5); g.add(sp); }
    const r1 = new THREE.Mesh(new THREE.TorusGeometry(1.15, .14, 6, 16), goldM); r1.rotation.x = Math.PI / 2; r1.position.y = 6.2; g.add(r1);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.05, 1.2, 8, 1, true), goldM); cup.position.y = 7.0; g.add(cup);
    const orb = dyn(new THREE.Mesh(new THREE.IcosahedronGeometry(.75, 1), M.orb)); orb.position.y = 8.6; g.add(orb); anim.bob.push({ o: orb, y: 8.6, ph: rnd() * 6 });
    shadowed(g); orb.castShadow = false;
    const gl = new THREE.Sprite(M.glow); gl.scale.setScalar(5); gl.position.y = 8.6; g.add(gl); anim.bob.push({ o: gl, y: 8.6, ph: anim.bob.at(-1).ph });
    return g;
  }
  const smat = new THREE.MeshStandardMaterial({ color: 0x8f8b80, roughness: .85, flatShading: true, side: THREE.DoubleSide });
  function statue() { // guardián de piedra sobre pedestal
    const g = new THREE.Group();
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(2.6, .8, 2.6), stoneM); p1.position.y = .4; g.add(p1);
    const p2 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.2, 2.0), stoneM); p2.position.y = 1.4; g.add(p2);
    const tr = new THREE.Mesh(new THREE.BoxGeometry(2.1, .14, 2.1), goldM); tr.position.y = 2.05; g.add(tr);
    const robe = new THREE.Mesh(new THREE.CylinderGeometry(.55, 1.0, 2.6, 7), smat); robe.position.y = 3.4; g.add(robe);
    const chest = new THREE.Mesh(new THREE.CylinderGeometry(.75, .55, 1.1, 7), smat); chest.position.y = 5.2; g.add(chest);
    for (const s of [-1, 1]) { const pa = new THREE.Mesh(new THREE.SphereGeometry(.42, 7, 5), smat); pa.scale.set(1.1, .7, 1); pa.position.set(s * .8, 5.65, 0); g.add(pa); }
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(.4, 1), smat); head.rotation.x = .25; head.position.y = 6.15; g.add(head);
    const helm = new THREE.Mesh(new THREE.ConeGeometry(.3, .7, 6), smat); helm.position.y = 6.65; g.add(helm);
    // espada clavada al frente, manos sobre el pomo; capa a la espalda
    const sword = new THREE.Mesh(new THREE.BoxGeometry(.2, 3.0, .08), smat); sword.position.set(0, 3.55, .95); g.add(sword);
    const guard = new THREE.Mesh(new THREE.BoxGeometry(1.1, .16, .18), smat); guard.position.set(0, 5.05, .95); g.add(guard);
    for (const s of [-1, 1]) { const arm = new THREE.Mesh(new THREE.CylinderGeometry(.17, .2, 1.3, 6), smat); arm.position.set(s * .5, 5.15, .5); arm.rotation.set(1.0, 0, s * .45); g.add(arm); }
    const hands = new THREE.Mesh(new THREE.SphereGeometry(.24, 6, 5), smat); hands.position.set(0, 5.25, .95); g.add(hands);
    const cape = new THREE.Mesh(new THREE.CylinderGeometry(.85, 1.25, 3.6, 7, 1, true, Math.PI * .6, Math.PI * .8), smat); cape.position.set(0, 3.9, -.12); g.add(cape);
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(.18), goldM); gem.position.set(0, 5.5, .95); g.add(gem);
    return shadowed(g);
  }

  // ───── instanciadores de decoración ─────
  const scatter = { wallTuft: [], tuft: [], brush: [], flower: [], rock: [], bush: [], trees: [[], [], []] };
  const inLaneBox = (x, z, m = 0) => { for (const l of LX) if (Math.abs(x - l) < 17.4 + m && z > -47 - m && z < 39 + m) return true; return false; };

  // ───── carriles ─────
  const laneMeshes = [];
  const cobbleM = new THREE.MeshStandardMaterial({ map: tx.cobble, bumpMap: tx.cobbleBump, bumpScale: 2.5, roughness: .9, metalness: 0, transparent: false });
  tx.cobble.repeat.set(4.5, 13); tx.cobbleBump.repeat.set(4.5, 13);
  cobbleM.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vPath;').replace('#include <uv_vertex>', '#include <uv_vertex>\nvPath = uv;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\nvarying vec2 vPath;\nfloat ph(vec2 p){ return fract(sin(dot(p,vec2(41.3,289.1)))*15731.7); }\nfloat pn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(ph(i),ph(i+vec2(1,0)),f.x), mix(ph(i+vec2(0,1)),ph(i+vec2(1,1)),f.x), f.y); }`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        { float ex = abs(vPath.x-.5)*2.; float ez = max(1.-vPath.y/.06, (vPath.y-.93)/.07);
          float nz = pn(vPath*vec2(9.,34.))*.6 + pn(vPath*vec2(23.,90.))*.4;
          float nb = pn(vPath*vec2(4.,12.));
          float wear = clamp(smoothstep(.55, 1.0, ex + (nz-.5)*.45 + (nb-.5)*.35) + max(ez + (nz-.5)*.6, 0.), 0., 1.);
          float cellR = texture2D(map, vMapUv).a;
          if (cellR < wear) discard;
          float moss = smoothstep(.3, .95, ex + (nz-.5)*.4);
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb*vec3(.72,.86,.55), moss*.7);
          float dirt = smoothstep(.55,.8, pn(vPath*vec2(6.,20.)+3.7)); diffuseColor.rgb *= mix(vec3(1.), vec3(.86,.8,.68), dirt*.7); }`);
  };
  const tileGeo = new THREE.PlaneGeometry(GRID.cell * .94, GRID.cell * .94);
  const WALL_Z0 = -45, WALL_Z1 = 38;
  const wallBlocks = [], mossBlobs = [];
  for (let li = 0; li < nLanes; li++) {
    const team = teamOfLane(li, nLanes), T = TEAM[team], M = teamMats[team];
    const cx = LX[li], g = new THREE.Group(); g.position.set(cx, 0, 0); scene.add(g); laneMeshes.push(g);
    g.userData.team = team;
    // camino de adoquín (bordes desgastados que dejan ver la hierba)
    const path = new THREE.Mesh(new THREE.PlaneGeometry(27, 82), cobbleM); path.rotation.x = -Math.PI / 2; path.position.set(0, .04, -4); path.receiveShadow = true; g.add(path);
    // plataforma de construcción
    const cols = GRID.cols * GRID.cell + 5, depth = GRID.rows * GRID.cell + 5, cz = GRID.z0 + GRID.rows * GRID.cell / 2;
    const platGeo = new THREE.BoxGeometry(cols + 3, .3, depth + 3); { const uv = platGeo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 4, uv.getY(i) * 2); }
    const plat = new THREE.Mesh(platGeo, stoneM); plat.position.set(0, 0, cz); plat.receiveShadow = true; plat.castShadow = true; g.add(plat);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(cols + 4.2, .26, depth + 4.2), goldM); trim.position.set(0, -.04, cz); g.add(trim);
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(cols + 6.5, .16, depth + 6.5), darkStoneM); skirt.position.set(0, -.04, cz); skirt.receiveShadow = true; g.add(skirt);
    const cellMat = new THREE.MeshStandardMaterial({ map: tx.tile, roughness: .55, metalness: .2, emissive: T.deep, emissiveIntensity: team ? .4 : .55, color: team ? 0xffe6dc : 0xd8e2f0 });
    const inst = new THREE.InstancedMesh(tileGeo, cellMat, GRID.cols * GRID.rows); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
    for (let r = 0; r < GRID.rows; r++) for (let c = 0; c < GRID.cols; c++) { const p = cellPos(c, r); m4.compose(new THREE.Vector3(p.x, .17, p.z), q, new THREE.Vector3(1, 1, 1)); inst.setMatrixAt(r * GRID.cols + c, m4); }
    inst.receiveShadow = true; g.add(inst);
    // pilares de esquina con orbes del equipo
    g.userData.orbs = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const pil = new THREE.Group(); pil.position.set(sx * (cols / 2 + 1.5), .1, cz + sz * (depth / 2 + 1.5));
      const b = new THREE.Mesh(new THREE.CylinderGeometry(.7, .95, 1.8, 6), stoneM); b.position.y = .9; pil.add(b);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(.85, .75, .25, 6), goldM); cap.position.y = 1.9; pil.add(cap); shadowed(pil);
      const orb = dyn(new THREE.Mesh(new THREE.OctahedronGeometry(.45), M.orb)); orb.position.y = 2.7; pil.add(orb); g.userData.orbs.push(orb);
      const gl = new THREE.Sprite(M.glow); gl.scale.setScalar(3.2); gl.position.y = 2.7; pil.add(gl);
      g.add(pil);
    }
    // muros laterales: bloques de roca con musgo
    for (const sx of [-1, 1]) {
      for (let z = WALL_Z0; z < WALL_Z1;) { const len = rr(2.2, 3.2); wallBlocks.push([cx + sx * 16.2 + rr(-.12, .12), z + len / 2, rr(1.55, 1.9), rr(1.9, 2.6), len * 1.02, rr(-.05, .05)]); for (let k = 0; k < 3; k++) if (rnd() < .6) mossBlobs.push([cx + sx * 16.2 + rr(-.6, .6), z + rr(0, len), 1]); z += len; }
      // remates de muro
      for (const z of [WALL_Z0 - .6, WALL_Z1 + .6]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.35, 3.2, 6), stoneM); p.position.set(sx * 16.2, 1.6, z); g.add(shadowed(p)); const c = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.2, .3, 6), goldM); c.position.set(sx * 16.2, 3.3, z); g.add(c); }
    }
    // torretas decorativas fuera de los muros
    for (const sx of [-1, 1]) for (const z of [26, -14]) { const tu = turret(team); tu.position.set(sx * 21.5, 0, z); tu.rotation.y = rnd() * 6; g.add(tu); }
    // estandartes, braseros y estatuas
    for (const sx of [-1, 1]) {
      for (const z of [-2, 22]) { const bn = banner(team); bn.position.set(sx * 14.6, 0, z); bn.rotation.y = sx * -.35; g.add(bn); }
      for (const z of [1.8, 34]) { const br = brazier(); br.position.set(sx * 14.4, 0, z); g.add(br); }
      const st = statue(); st.position.set(sx * 11.5, 0, 35.5); st.rotation.y = Math.PI + sx * .45; g.add(st);
    }
    { const br = brazier(1.3); br.position.set(-9.2, 0, -33); g.add(br); const br2 = brazier(1.3); br2.position.set(9.2, 0, -33); g.add(br2); }
    const warm = new THREE.PointLight(0xffa860, nLanes > 2 ? 0 : 14, 30, 1.4); warm.position.set(0, 7, 12); if (nLanes <= 2) g.add(warm);
    g.userData.portal = buildPortal(g);
    g.userData.nexus = buildNexus(g, team);
    g.userData.hp = 1;
    bakeStatic(g);
  }
  { // instancias de muros y musgo
    const wbg = new THREE.BoxGeometry(1, 1, 1, 3, 4, 3); jitter(wbg, .03); wbg.computeVertexNormals(); colorize(wbg, (c, x, y, z, ny) => { const m = sstep(.1, .5, y) * (ny > .5 ? 1 : .85); srgb(c, lerp(1, .46, m), lerp(1, .62, m), lerp(1, .3, m)); });
    const wallM = stoneM.clone(); wallM.vertexColors = true;
    const wm = new THREE.InstancedMesh(wbg, wallM, wallBlocks.length); const mm = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), col = new THREE.Color();
    wallBlocks.forEach(([x, z, w, h, l, ry], i) => { q.setFromEuler(e.set(rr(-.03, .03), ry, rr(-.04, .04))); mm.compose(new THREE.Vector3(x, h / 2 - .1, z), q, new THREE.Vector3(w, h, l)); wm.setMatrixAt(i, mm); col.setHSL(.09, .08, rr(.62, .82)); wm.setColorAt(i, col); });
    wm.castShadow = wm.receiveShadow = true; scene.add(wm);
    for (const [x, z] of mossBlobs) scatter.wallTuft.push([x, 2.0, z, rr(.6, 1.1), rnd() * 6.28]);
  }

  // ───── Portal del Vacío ─────
  function buildPortal(lg) {
    const g = new THREE.Group(); g.position.set(0, 0, LANE.spawnZ - 4.5); lg.add(g);
    const dais = new THREE.Mesh(new THREE.CylinderGeometry(8.4, 9.2, .5, 12), obsidM); dais.position.y = .1; dais.receiveShadow = true; g.add(dais);
    const dais2 = new THREE.Mesh(new THREE.CylinderGeometry(6.6, 7.2, .4, 12), darkStoneM); dais2.position.y = .45; dais2.receiveShadow = true; g.add(dais2);
    const runeMat = new THREE.MeshBasicMaterial({ map: tx.runes, color: 0xb05aff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false });
    const rr1 = new THREE.Mesh(scaleUV(new THREE.CylinderGeometry(8.42, 9.22, .42, 24, 1, true), 6), runeMat); rr1.position.y = .1; g.add(rr1);
    const rr2 = new THREE.Mesh(scaleUV(new THREE.CylinderGeometry(5.6, 6.5, 0, 48, 1, true), 6), runeMat); rr2.position.y = .67; g.add(rr2);
    const decal = new THREE.Mesh(new THREE.PlaneGeometry(34, 30), new THREE.MeshBasicMaterial({ map: tx.glow, color: 0x2a0a40, transparent: true, depthWrite: false, opacity: .85 })); decal.rotation.x = -Math.PI / 2; decal.position.set(0, .06, 2); g.add(decal);
    const decal2 = new THREE.Mesh(new THREE.PlaneGeometry(22, 18), new THREE.MeshBasicMaterial({ map: tx.glow, color: 0x7a2aff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .35 })); decal2.rotation.x = -Math.PI / 2; decal2.position.set(0, .72, 3); g.add(decal2);
    // pilares de obsidiana con runas
    for (const sx of [-1, 1]) {
      const pg = new THREE.Group(); pg.position.set(sx * 7.6, .5, 0); pg.rotation.z = sx * .08; g.add(pg);
      const p = new THREE.Mesh(new THREE.CylinderGeometry(.75, 1.25, 11, 6), obsidM); p.position.y = 5.5; pg.add(p);
      const rs = new THREE.Mesh(new THREE.PlaneGeometry(.75, 8.5), new THREE.MeshBasicMaterial({ map: tx.runes, color: 0xc070ff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
      rs.material.map = tx.runes.clone(); rs.material.map.repeat.set(1, 1); rs.material.map.rotation = Math.PI / 2; rs.material.map.center.set(.5, .5); rs.material.map.needsUpdate = true;
      rs.position.set(0, 5.2, 1.06); rs.rotation.x = -.045; pg.add(rs);
      const tip = dyn(new THREE.Mesh(new THREE.OctahedronGeometry(.9, 0), new THREE.MeshStandardMaterial({ color: 0x9a3aff, emissive: 0x9a3aff, emissiveIntensity: 2.4, flatShading: true }))); tip.scale.y = 1.8; tip.position.y = 12.2; pg.add(tip); anim.spin.push(tip);
      for (let i = 0; i < 3; i++) { const sp = new THREE.Mesh(new THREE.ConeGeometry(.45, 3.2, 5), obsidM); sp.position.set(sx * (1 + i * .5), 1.2 + i * .9, rr(-1, 1)); sp.rotation.z = -sx * (.6 + i * .2); pg.add(sp); }
      shadowed(pg);
    }
    // arco irregular con púas
    const arc = new THREE.Mesh(new THREE.TorusGeometry(6.3, .55, 8, 36), obsidM); arc.position.y = 7; g.add(arc);
    const spikeG = new THREE.ConeGeometry(.35, 2.2, 5); const spikes = new THREE.InstancedMesh(spikeG, obsidM, 20); const mm = new THREE.Matrix4(), q = new THREE.Quaternion();
    for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; const len = rr(.6, 1.4); q.setFromEuler(new THREE.Euler(rr(-.4, .4), 0, a - Math.PI / 2)); mm.compose(new THREE.Vector3(Math.cos(a) * 7.0, 7 + Math.sin(a) * 7.0, rr(-.3, .3)), q, new THREE.Vector3(1, len, 1)); spikes.setMatrixAt(i, mm); }
    spikes.castShadow = true; g.add(spikes);
    const rimGlow = new THREE.Mesh(new THREE.TorusGeometry(5.85, .1, 6, 48), new THREE.MeshBasicMaterial({ color: 0xa860e0 })); rimGlow.position.y = 7; g.add(rimGlow);
    // vórtice
    const swirl = new THREE.Mesh(new THREE.CircleGeometry(5.9, 48), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { t: { value: 0 } },
      vertexShader: 'varying vec2 v; void main(){ v=uv-.5; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: `varying vec2 v; uniform float t;
        float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
        float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
        void main(){ float r = length(v)*2.; float a = atan(v.y, v.x);
          float tw = a + 2.6/(r+.18) - t*.9;
          float arms = sin(tw*3. + r*2.)*.5+.5;
          float nz = n(vec2(tw*1.6, r*5. - t*1.2))*.6 + n(vec2(tw*3.2, r*11. - t*2.))*.4;
          float k = arms*.55 + nz*.6;
          vec3 deep = vec3(.015,.0,.035), mid = vec3(.3,.05,.55), hot = vec3(1.,.45,1.3);
          vec3 c = mix(deep, mid, smoothstep(.4,.95,k)*smoothstep(.08,.6,r));
          c += hot*smoothstep(.8,1.05,k)*smoothstep(.2,.8,r)*.6;
          c += vec3(.75,.3,1.2)*pow(smoothstep(.6,1.,r),5.)*.9;
          c += vec3(.7,.2,1.)*pow(max(0.,1.-r*5.),2.)*1.5;
          float al = smoothstep(1.,.93,r);
          gl_FragColor = vec4(c, al); }`,
    }));
    swirl.position.set(0, 7, -.05); g.add(dyn(swirl)); lg.userData.swirl = swirl;
    const inner = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx.glow, color: 0x8a2aff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .4 })); inner.scale.setScalar(17); inner.position.set(0, 7, .5); g.add(inner);
    // fragmentos flotantes
    const frags = []; const fragM = new THREE.MeshStandardMaterial({ color: 0x3a1a5a, emissive: 0x7a2acc, emissiveIntensity: .9, roughness: .3, metalness: .4, flatShading: true });
    for (let i = 0; i < 12; i++) { const f = dyn(new THREE.Mesh(new THREE.OctahedronGeometry(rr(.25, .6), 0), fragM)); f.scale.y = rr(1.4, 2.4); f.castShadow = true; g.add(f); frags.push({ m: f, a: i / 12 * 6.283, r: rr(7.8, 10), y: rr(2, 12), sp: rr(.15, .35) * (rnd() > .5 ? 1 : -1), ph: rnd() * 6 }); }
    // brotes del Vacío en el suelo
    for (let i = 0; i < 9; i++) { const a = rr(-.2, Math.PI + .2), r = rr(9.5, 13); const sp = new THREE.Mesh(new THREE.ConeGeometry(rr(.3, .6), rr(1.8, 3.8), 5), i % 3 ? obsidM : fragM); sp.position.set(Math.cos(a) * r, .6, -Math.sin(a) * r * .5 - 1); sp.rotation.set(rr(-.4, .4), 0, rr(-.4, .4)); sp.castShadow = true; g.add(sp); }
    g.add(addParts(makeParticles({ n: LOW ? 50 : 110, radius: 8, height: 14, speed: .12, color: 0xb060ff, size: .22, swirl: .25 })));
    const pl = new THREE.PointLight(0xa050ff, 22, 34, 1.4); pl.position.set(0, 6, 5); g.add(pl);
    g.userData = { frags, pl, inner };
    return g;
  }

  // ───── Nexo ─────
  function buildNexus(lg, team) {
    const T = TEAM[team], M = teamMats[team];
    const g = new THREE.Group(); g.position.set(0, 0, LANE.nexusZ); lg.add(g);
    const tiers = [[6.4, 7.0, .55, stoneM], [5.1, 5.6, .5, darkStoneM], [3.7, 4.2, .6, stoneM]]; let y = 0;
    for (const [r1, r2, h, m] of tiers) { const t = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, 8), m); t.position.y = y + h / 2; g.add(t); const tr = new THREE.Mesh(new THREE.CylinderGeometry(r1 + .06, r1 + .06, .12, 8), goldM); tr.position.y = y + h - .02; g.add(tr); y += h; }
    const runeRing = new THREE.Mesh(scaleUV(new THREE.CylinderGeometry(5.3, 6.25, 0, 48, 1, true), 8), new THREE.MeshBasicMaterial({ map: tx.runes, color: T.glow, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
    runeRing.position.y = .57; g.add(runeRing);
    // garras doradas que sostienen el cristal
    const clawG = new THREE.CylinderGeometry(.04, .42, 5, 6, 10); { const p = clawG.attributes.position; for (let k = 0; k < p.count; k++) { const yy = p.getY(k) + 2.5, t = yy / 5; p.setX(k, p.getX(k) + 1.6 * t * t - .4 * t); p.setY(k, yy); } clawG.computeVertexNormals(); }
    for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283; const c = new THREE.Mesh(clawG, goldM); c.position.set(Math.cos(a) * 3.3, y - .1, Math.sin(a) * 3.3); c.rotation.y = -a + Math.PI; g.add(c); }
    const band = new THREE.Mesh(scaleUV(new THREE.CylinderGeometry(5.12, 5.62, .5, 8, 1, true), 4), new THREE.MeshBasicMaterial({ map: tx.runes, color: T.glow, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: .8 })); band.position.y = .8; g.add(band);
    // cristales guardianes
    const gm = new THREE.MeshStandardMaterial({ color: T.main, emissive: T.main, emissiveIntensity: .7, roughness: .2, metalness: .1, flatShading: true });
    for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + .5; const c = new THREE.Mesh(new THREE.OctahedronGeometry(.5, 0), gm); c.scale.y = rr(2, 3); c.position.set(Math.cos(a) * 5.6, 1.3, Math.sin(a) * 5.6); c.rotation.set(Math.sin(a) * .3, 0, -Math.cos(a) * .3); g.add(c); }
    shadowed(g);
    // cristal facetado
    const lath = new THREE.LatheGeometry([new THREE.Vector2(0, -2.4), new THREE.Vector2(1.25, -.7), new THREE.Vector2(1.55, .5), new THREE.Vector2(1.15, 2.7), new THREE.Vector2(0, 4.3)], 6);
    jitter(lath, .08); const cg = lath.toNonIndexed(); cg.computeVertexNormals();
    const cm = new THREE.MeshStandardMaterial({ color: T.main, emissive: T.deep, emissiveIntensity: 1, roughness: .1, metalness: .35, flatShading: true, transparent: true, opacity: .93 });
    const crystal = new THREE.Mesh(cg, cm); crystal.position.y = y + 3.6; crystal.castShadow = true; crystal.renderOrder = 1; g.add(dyn(crystal));
    const core = new THREE.Mesh(cg, new THREE.MeshBasicMaterial({ color: new THREE.Color(T.glow).lerp(new THREE.Color(T.hot), .4), transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false })); core.scale.setScalar(.55); crystal.add(core);
    const crack = new THREE.Mesh(cg, new THREE.MeshBasicMaterial({ map: tx.cracks, color: new THREE.Color(T.hot).lerp(new THREE.Color(0xffc070), .5).multiplyScalar(2.2), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); crack.scale.setScalar(1.015); crack.renderOrder = 3; core.renderOrder = 2; crystal.add(crack);
    // la lathe tiene UV: repetir las grietas alrededor
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx.glow, color: T.glow, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .55 })); halo.scale.set(11, 14, 1); halo.position.y = crystal.position.y + .6; g.add(halo);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(22, 22), new THREE.MeshBasicMaterial({ map: tx.glow, color: T.glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .2 })); ground.rotation.x = -Math.PI / 2; ground.position.y = y + .02; g.add(ground);
    const rings = []; const rmat = new THREE.MeshStandardMaterial({ color: GOLD, emissive: T.main, emissiveIntensity: .9, metalness: .9, roughness: .25 });
    for (let i = 0; i < 2; i++) { const rg = new THREE.Mesh(new THREE.TorusGeometry(3.1 + i * .6, .09, 6, 56), rmat); rg.position.y = crystal.position.y + .6; rg.rotation.set(Math.PI / 2 + (i ? .45 : -.35), i * 1.3, 0); g.add(dyn(rg)); rings.push(rg); }
    const ringGlow = new THREE.Mesh(new THREE.TorusGeometry(3.4, .26, 6, 56), new THREE.MeshBasicMaterial({ map: tx.glow, color: T.glow, transparent: true, opacity: .4, blending: THREE.AdditiveBlending, depthWrite: false })); ringGlow.rotation.x = Math.PI / 2; ringGlow.position.y = crystal.position.y + .6; g.add(dyn(ringGlow));
    const orbit = []; const om = new THREE.MeshStandardMaterial({ color: T.main, emissive: T.main, emissiveIntensity: 1.3, roughness: .15, flatShading: true });
    for (let i = 0; i < 6; i++) { const o = dyn(new THREE.Mesh(new THREE.OctahedronGeometry(rr(.25, .42), 0), om)); o.scale.y = 1.8; o.castShadow = true; g.add(o); orbit.push({ m: o, a: i / 6 * 6.283, r: rr(4.3, 5.2), y: rr(-1, 2.2), sp: rr(.4, .7) }); }
    const sparks = makeParticles({ n: LOW ? 40 : 80, radius: 2.4, height: 6, speed: .9, color: 0xffc080, size: .14, swirl: 1.5, amt: 0, fall: true }); sparks.position.y = crystal.position.y - 1; g.add(addParts(sparks));
    const motes = makeParticles({ n: LOW ? 30 : 60, radius: 5.5, height: 10, speed: .1, color: T.glow, size: .16, swirl: .3 }); g.add(addParts(motes));
    const light = new THREE.PointLight(T.glow, 30, 34, 1.4); light.position.y = crystal.position.y + 1; g.add(light);
    return { group: g, crystal, core, crack, halo, ground, rings, ringGlow, orbit, sparks, light, cm, gm, om, rmat, base: T.main, baseY: crystal.position.y, col: new THREE.Color(T.main), dark: new THREE.Color(0x2a2430) };
  }

  // ───── vegetación y rocas ─────
  const okTree = (x, z) => {
    if (inLaneBox(x, z, 4)) return false;
    for (const l of LX) { if (Math.abs(x - l) < 23 && z > -58 && z < 46) return false; if (Math.abs(x - l) < 30 && z > 38 && z < 80) return false; } // no tapar la vista de la cámara
    if (riverD(x, z) < 8) return false; return true;
  };
  const treeN = Math.round((LOW ? 170 : 300) * (nLanes > 2 ? 1.5 : 1));
  for (let tries = 0, k = 0; k < treeN && tries < 20000; tries++) {
    const x = rr(X0 + 30, X1 - 30), z = rr(-150, 120); if (!okTree(x, z)) continue; const y = height(x, z); if (y > 30) continue;
    const near = laneDist(x) < 60 && z > -80 && z < 70; if (!near && rnd() < .55) continue;
    scatter.trees[rnd() < .2 ? 2 : (rnd() < .5 ? 0 : 1)].push([x, y, z, rr(.75, 1.2), rnd() * 6.28]); k++;
  }
  const treeMatT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }), treeMatC = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9 });
  {
    const mm = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color(), up = new THREE.Vector3(0, 1, 0);
    scatter.trees.forEach((list, kind) => {
      if (!list.length) return; const tg = treeGeos(kind);
      const tr = new THREE.InstancedMesh(tg.trunk, treeMatT, list.length), cn = new THREE.InstancedMesh(tg.canopy, treeMatC, list.length);
      list.forEach(([x, y, z, s, ry], i) => { q.setFromAxisAngle(up, ry); mm.compose(new THREE.Vector3(x, y - .2, z), q, new THREE.Vector3(s, s * rr(.9, 1.15), s)); tr.setMatrixAt(i, mm); cn.setMatrixAt(i, mm);
        const r = rnd(); if (r < .08) col.setRGB(1.25, .95, .55); else if (r < .16) col.setRGB(.8, 1.0, 1.15); else col.setHSL(.28 + rr(-.03, .03), .1, rr(.85, 1.05)).multiplyScalar(1.15); cn.setColorAt(i, col); });
      for (const m of [tr, cn]) { m.castShadow = true; m.receiveShadow = true; scene.add(m); }
    });
  }
  // matas de hierba, maleza alta, flores, arbustos y rocas
  const place = (arr, x, z, s, extra) => { arr.push([x, height(x, z), z, s, rnd() * 6.28, extra]); };
  const den = LOW ? .45 : 1;
  for (const l of LX) for (const sx of [-1, 1]) {
    for (let i = 0; i < 300 * den; i++) { const lx = sx * rr(10.6, 15.2), z = rr(-44, 37); if (z > 2 && z < 21 && Math.abs(lx) < 15) continue; place(scatter.tuft, l + lx, z, rr(.7, 1.3)); }
    for (let i = 0; i < 70 * den; i++) { const lx = sx * rr(11.5, 15.2), z = rr(-42, 36); if (z > 2 && z < 21) continue; place(scatter.flower, l + lx, z, rr(.8, 1.3), rnd()); }
    for (let i = 0; i < 260 * den; i++) { const lx = sx * rr(17.2, 26), z = rr(-50, 42); if (riverD(l + lx, z) < 6) continue; place(scatter.tuft, l + lx, z, rr(.8, 1.5)); }
    for (let i = 0; i < 18; i++) { const lx = sx * rr(17.6, 20), z = rr(-44, 38); place(scatter.bush, l + lx, z, rr(.45, .8)); }
  }
  for (let i = 0; i < 3500 * den * (nLanes > 2 ? 1.6 : 1); i++) { const x = rr(xMin - 70, xMax + 70), z = rr(-75, 62); if (inLaneBox(x, z) || riverD(x, z) < 5.2) continue; place(scatter.tuft, x, z, rr(.8, 1.6)); if (rnd() < .18) place(scatter.flower, x + rr(-1, 1), z + rr(-1, 1), rr(.9, 1.4), rnd()); }
  // maleza de la Grieta (parches de hierba alta)
  for (let p = 0; p < 22 * (nLanes > 2 ? 2 : 1); p++) {
    let x, z, tries = 0; do { x = rr(xMin - 50, xMax + 50); z = rr(-60, 50); tries++; } while ((inLaneBox(x, z, 1.5) || riverD(x, z) < 6.5 || height(x, z) > 3) && tries < 50);
    const n = Math.round(rr(14, 26) * (LOW ? .6 : 1)), ang = rnd() * 3, ex = rr(2, 4.5), ez = rr(1.2, 2.2);
    for (let i = 0; i < n; i++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()); place(scatter.brush, x + Math.cos(a + ang) * r * ex, z + Math.sin(a + ang) * r * ez, rr(.9, 1.3)); }
  }
  for (let i = 0; i < 240 * (nLanes > 2 ? 1.6 : 1); i++) { const x = rr(X0 + 40, X1 - 40), z = rr(-110, 90); if (inLaneBox(x, z, 2) || riverD(x, z) < 4) continue; const big = laneDist(x) > 40 || z < -60 || z > 55; place(scatter.rock, x, z, big ? rr(1, 3.2) : rr(.4, 1.3)); }
  for (const r of rivers) for (let i = 0; i < 160 * den; i++) { const z = rr(-62, 52), s = rnd() > .5 ? 1 : -1; place(scatter.brush, riverX(r, z) + s * rr(3.6, 5.2), z, rr(.6, 1)); }
  for (const r of rivers) for (let i = 0; i < 40; i++) { const z = rr(-60, 50), s = rnd() > .5 ? 1 : -1, x = riverX(r, z) + s * rr(4.5, 6.5); place(scatter.rock, x, z, rr(.4, 1.1)); }
  {
    const mm = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color(), up = new THREE.Vector3(0, 1, 0), e = new THREE.Euler();
    const mk = (geo, mat, list, fn, shadow = false) => { if (!list.length) return; const m = new THREE.InstancedMesh(geo, mat, list.length); list.forEach((it, i) => fn(m, it, i)); m.receiveShadow = true; m.castShadow = shadow; scene.add(m); return m; };
    const grassMat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 1 });
    mk(tuftGeo(10, .6), grassMat, scatter.tuft, (m, [x, y, z, s, ry], i) => { q.setFromAxisAngle(up, ry); mm.compose(new THREE.Vector3(x, y + .02, z), q, new THREE.Vector3(s, s * rr(.8, 1.2), s)); m.setMatrixAt(i, mm); col.setHSL(rr(.2, .3), rr(.35, .6), rr(.42, .6)).multiplyScalar(1.6); m.setColorAt(i, col); });
    mk(tuftGeo(9, .55), grassMat, scatter.wallTuft, (m, [x, y, z, s, ry], i) => { q.setFromAxisAngle(up, ry); mm.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(s, s, s)); m.setMatrixAt(i, mm); col.setHSL(rr(.2, .27), .5, .55).multiplyScalar(1.6); m.setColorAt(i, col); });
    mk(tuftGeo(11, 1.5), grassMat, scatter.brush, (m, [x, y, z, s, ry], i) => { q.setFromAxisAngle(up, ry); mm.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(s * 1.5, s * rr(1.0, 1.4), s * 1.5)); m.setMatrixAt(i, mm); col.setHSL(rr(.36, .43), rr(.35, .5), rr(.3, .4)).multiplyScalar(1.5); m.setColorAt(i, col); }, true);
    const FL = [[1, .98, .9], [1, .85, .3], [1, .55, .7], [.6, .75, 1], [.8, .6, 1], [1, .5, .35]];
    mk(flowerGeo(), new THREE.MeshStandardMaterial({ roughness: .7, emissive: 0x222222 }), scatter.flower, (m, [x, y, z, s, ry, v], i) => { q.setFromAxisAngle(up, ry); mm.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(s, s, s)); m.setMatrixAt(i, mm); const c = FL[Math.floor(v * FL.length)]; col.setRGB(c[0], c[1], c[2], THREE.SRGBColorSpace); m.setColorAt(i, col); });
    const bushG = treeGeos(1).canopy.clone(); bushG.translate(0, -2.6, 0);
    mk(bushG, treeMatC, scatter.bush, (m, [x, y, z, s, ry], i) => { q.setFromAxisAngle(up, ry); mm.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(s, s * .8, s)); m.setMatrixAt(i, mm); col.setHSL(.3, .2, rr(.8, 1)); m.setColorAt(i, col); }, true);
    const rockG = new THREE.DodecahedronGeometry(1, 1); jitter(rockG, .18); rockG.computeVertexNormals(); const rg = strip(rockG);
    colorize(rg, (c, x, y, z, ny) => { const moss = sstep(.6, .9, ny) * .7; srgb(c, lerp(.58, .4, moss), lerp(.56, .5, moss), lerp(.52, .28, moss)); });
    mk(rg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95, flatShading: true }), scatter.rock, (m, [x, y, z, s, ry], i) => { q.setFromEuler(e.set(rr(-.3, .3), ry, rr(-.3, .3))); mm.compose(new THREE.Vector3(x, y + s * .15, z), q, new THREE.Vector3(s, s * rr(.55, .85), s * rr(.8, 1.2))); m.setMatrixAt(i, mm); col.setHSL(.1, .1, rr(.75, 1)); m.setColorAt(i, col); }, true);
  }

  // luciérnagas / motas doradas sobre el mapa
  for (const l of LX) { const mo = makeParticles({ n: LOW ? 60 : 140, radius: 40, height: 9, speed: .025, color: 0xffd890, size: .16, swirl: .02 }); mo.position.set(l + (l < xC ? -8 : 8), .4, -5); scene.add(addParts(mo)); }

  // ───── post-procesado ─────
  const pr = renderer.getPixelRatio();
  const rt = new THREE.WebGLRenderTarget(innerWidth * pr, innerHeight * pr, { type: THREE.HalfFloatType, samples: LOW ? 0 : 4 });
  const composer = new EffectComposer(renderer, rt); composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .42, .55, .92); composer.addPass(bloom);
  const grade = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, vig: { value: .3 }, sat: { value: 1.06 }, con: { value: 1.08 }, flash: { value: 0 }, warm: { value: new THREE.Color(1.04, 1.0, .93) }, cool: { value: new THREE.Color(.9, .97, 1.08) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float vig,sat,con,flash; uniform vec3 warm,cool; varying vec2 vUv;
      void main(){ vec4 c = texture2D(tDiffuse, vUv); float l = dot(c.rgb, vec3(.2126,.7152,.0722));
        c.rgb = mix(vec3(l), c.rgb, sat);
        c.rgb *= mix(cool, warm, smoothstep(.02, .5, l));
        c.rgb = max(.18*pow(max(c.rgb,0.)/.18, vec3(con)), 0.);
        float d = distance(vUv, vec2(.5)); c.rgb *= 1. - vig*smoothstep(.3, .9, d);
        c.rgb += vec3(1.,.15,.12)*flash*(.4 + d*1.6);
        gl_FragColor = c; }`,
  });
  composer.addPass(grade); composer.addPass(new OutputPass());

  function resize() { renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); PSCALE.value = innerHeight * renderer.getPixelRatio() / (2 * Math.tan(camera.fov * Math.PI / 360)); }
  addEventListener('resize', resize); PSCALE.value = innerHeight * renderer.getPixelRatio() / (2 * Math.tan(camera.fov * Math.PI / 360));

  function setNexusHp(lane, ratio) { const g = laneMeshes[lane]; if (g) g.userData.hp = Math.max(0, Math.min(1, ratio)); }

  const tmpC = new THREE.Color();
  function update(t, dt, focus = { x: LX[0], z: 12 }) {
    skyMat.uniforms.t.value = t; sky.position.copy(camera.position);
    for (const p of anim.parts) p.material.uniforms.t.value = t;
    for (const g of laneMeshes) {
      g.userData.swirl.material.uniforms.t.value = t;
      const P = g.userData.portal.userData;
      for (const f of P.frags) { const a = f.a + t * f.sp; f.m.position.set(Math.cos(a) * f.r, f.y + Math.sin(t * .8 + f.ph) * .6, Math.sin(a) * f.r * .45 - 1); f.m.rotation.y = t * .7 + f.ph; f.m.rotation.x = Math.sin(t * .5 + f.ph) * .4; }
      P.pl.intensity = 20 + Math.sin(t * 2.3) * 4 + Math.sin(t * 7.1) * 1.5; P.inner.material.opacity = .45 + Math.sin(t * 1.7) * .1;
      // Nexo
      const n = g.userData.nexus, hp = g.userData.hp ?? 1, dmg = 1 - hp;
      const pulse = .5 + .5 * Math.sin(t * 2.2);
      const flick = hp < .35 ? (Math.sin(t * 31) * Math.sin(t * 17.3) > .25 ? .35 : 1) : 1;
      n.crystal.rotation.y = t * .35; const yy = n.baseY + Math.sin(t * 1.3) * .25 * (.3 + .7 * hp); n.crystal.position.y = yy;
      n.cm.emissiveIntensity = (.45 + pulse * .55) * (.25 + .75 * hp) * flick;
      n.cm.color.copy(n.col).lerp(n.dark, dmg * .85); n.cm.emissive.copy(n.col).multiplyScalar(.55).lerp(n.dark, dmg * .85);
      n.core.material.opacity = (.55 + pulse * .35) * (.2 + .8 * hp) * flick; n.core.scale.setScalar(.5 + pulse * .06);
      n.crack.material.opacity = sstep(.05, .7, dmg) * (hp < .35 ? .7 + .3 * Math.sin(t * 9) : 1);
      n.halo.material.opacity = (.35 + pulse * .25) * (.3 + .7 * hp) * flick; n.halo.position.y = yy + .6;
      n.ground.material.opacity = (.12 + pulse * .08) * (.3 + .7 * hp) * flick;
      n.light.intensity = (16 + pulse * 8) * (.25 + .75 * hp) * flick;
      n.sparks.material.uniforms.amt.value = sstep(.75, .2, hp) * 1.4;
      n.rmat.emissiveIntensity = (.6 + pulse * .5) * (.3 + .7 * hp);
      n.rings.forEach((r, i) => { r.rotation.z = t * (.35 + i * .25) * (i ? -1 : 1); r.position.y = yy + .6; }); n.ringGlow.position.y = yy + .6; n.ringGlow.material.opacity = (.25 + pulse * .2) * hp;
      n.orbit.forEach(o => { const a = o.a + t * o.sp * (.3 + .7 * hp); const fallY = lerp(yy + o.y, .9, sstep(.25, 0, hp)); o.m.position.set(Math.cos(a) * o.r, fallY + Math.sin(t * 1.4 + o.a) * .3, Math.sin(a) * o.r); o.m.rotation.y = t * 1.5 + o.a; });
      n.om.emissiveIntensity = 1.3 * (.2 + .8 * hp);
      for (const o of g.userData.orbs) { o.rotation.y = t * 1.2; o.position.y = 2.7 + Math.sin(t * 2 + o.id) * .12; }
    }
    for (const s of anim.spin) s.rotation.y = t * .8;
    for (const b of anim.bob) b.o.position.y = b.y + Math.sin(t * 1.6 + b.ph) * .22;
    for (const F of anim.flames) { F.f.forEach((s, i) => { const k = 1 + Math.sin(t * (11 + i * 3) + F.ph + i) * .12 + Math.sin(t * 23 + F.ph * 2) * .06; s.scale.set((.9 - i * .15) * (2 - k), (1.6 - i * .3) * k, 1); s.position.y = F.h + .85 + i * .12 + (k - 1) * .5; }); F.gl.material.opacity = .45; F.gl.scale.setScalar(4.2 + Math.sin(t * 9 + F.ph) * .3); }
    for (const geo of anim.banners) { const p = geo.attributes.position, b = geo.userData.base; for (let i = 0; i < p.count; i++) { const x = b[i * 3], y = b[i * 3 + 1], d = -y / 3.6; p.setZ(i, Math.sin(t * 2.4 + y * 1.6 + x * .9) * .18 * d + Math.sin(t * 1.3 + y) * .08 * d); } p.needsUpdate = true; geo.computeVertexNormals(); }
    tx.water.offset.y = -t * .04; tx.water.offset.x = Math.sin(t * .2) * .02;
    // la sombra sigue al foco de cámara
    sun.target.position.set(focus.x, 0, focus.z); sun.position.set(focus.x + sunDir.x * 110, sunDir.y * 110, focus.z + sunDir.z * 110);
  }
  return { renderer, scene, camera, composer, bloom, grade, tx, update, laneMeshes, sun, setNexusHp };
}
