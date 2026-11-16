import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// Kit de modelado procedural compartido por todos los campeones y criaturas.
// Convenciones: unidades a escala 1, pies en y=0, mirando a +Z, humanoide ≈ 2 de alto.
// ═════════════════════════ materiales ═════════════════════════
const mcache = new Map();
export function M(color, o = {}) {
  const k = [color, o.m ?? .1, o.r ?? .55, o.e ?? 0, o.ec ?? 0, o.t ?? 1, o.ds ? 1 : 0, o.fs ? 1 : 0, o.add ? 1 : 0].join('|');
  let m = mcache.get(k); if (m) return m;
  m = new THREE.MeshStandardMaterial({ color, metalness: o.m ?? .1, roughness: o.r ?? .55, emissive: o.ec ?? 0x000000, emissiveIntensity: o.e ?? 0, transparent: (o.t ?? 1) < 1 || !!o.add, opacity: o.t ?? 1, side: o.ds ? THREE.DoubleSide : THREE.FrontSide, flatShading: !!o.fs });
  if (o.add) m.blending = THREE.AdditiveBlending;
  if ((o.t ?? 1) < 1 || o.add) m.depthWrite = false;
  mcache.set(k, m); return m;
}
const glow = (c, i = 2.2) => M(c, { e: i, ec: c, r: .4 });
const gld = U => U ? M(0xffcf5a, { m: .95, r: .26, e: .45, ec: 0xff9a20 }) : M(0xd4a640, { m: .9, r: .32 });
const cloth = (c, ds) => M(c, { r: .85, ds });
const metal = (c, r = .34) => M(c, { m: .82, r });
const hairM = c => M(c, { r: .72, ds: 1 });
const EYE = M(0x1b1524, { r: .25 });

// ═════════════════════════ geometrías ═════════════════════════
const TAU = Math.PI * 2, PI = Math.PI, _Y = new THREE.Vector3(0, 1, 0);
const GC = new Map();
function cg(key, make) { let g = GC.get(key); if (!g) { g = make(); GC.set(key, g); } return g; }
const U = {
  sph: new THREE.SphereGeometry(1, 20, 14), sphL: new THREE.SphereGeometry(1, 10, 7),
  hemi: new THREE.SphereGeometry(1, 18, 8, 0, TAU, 0, PI / 2),
  box: new THREE.BoxGeometry(1, 1, 1), rbox: new RoundedBoxGeometry(1, 1, 1, 2, .18),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 16), tcyl: new THREE.CylinderGeometry(.4, 1, 1, 10),
  cone: new THREE.ConeGeometry(1, 1, 12), pyr: new THREE.ConeGeometry(1, 1, 4),
  ico: new THREE.IcosahedronGeometry(1, 0), oct: new THREE.OctahedronGeometry(1), dod: new THREE.DodecahedronGeometry(1, 0),
  ring: new THREE.TorusGeometry(1, .07, 6, 36), disc: new THREE.CircleGeometry(1, 32),
};
const f3 = n => n.toFixed(3);
// miembro cónico con extremos redondeados (pivote arriba, cuelga hacia -Y)
function limb(r1, r2, len) {
  return cg(`lb${f3(r1)}_${f3(r2)}_${f3(len)}`, () => {
    const pts = [];
    for (let i = 0; i <= 4; i++) { const a = -PI / 2 + (i / 4) * PI / 2; pts.push(new THREE.Vector2(Math.max(1e-3, Math.cos(a) * r2), -len + Math.sin(a) * r2)); }
    for (let i = 0; i <= 4; i++) { const a = (i / 4) * PI / 2; pts.push(new THREE.Vector2(Math.max(1e-3, Math.cos(a) * r1), Math.sin(a) * r1)); }
    return new THREE.LatheGeometry(pts, 12);
  });
}
const lathe = (key, pts, seg = 20) => cg('la' + key, () => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg));
// tubo a lo largo de una curva con radio variable
function tube(key, pts, rf, seg = 22, rad = 8) {
  return cg('tb' + key, () => {
    const c = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2])));
    const g = new THREE.TubeGeometry(c, seg, 1, rad, false), pos = g.attributes.position, v = new THREE.Vector3(), ctr = new THREE.Vector3();
    for (let i = 0; i <= seg; i++) { c.getPointAt(i / seg, ctr); const rr = rf(i / seg); for (let j = 0; j <= rad; j++) { const k = i * (rad + 1) + j; v.fromBufferAttribute(pos, k).sub(ctr).multiplyScalar(rr).add(ctr); pos.setXYZ(k, v.x, v.y, v.z); } }
    g.computeVertexNormals(); return g;
  });
}
const taper = (a, b, bump = 0, f = 30) => t => (a + (b - a) * t) * (1 + bump * Math.abs(Math.sin(t * f)));
const spindle = (a, b) => t => b + (a - b) * Math.sin(Math.PI * t); // grueso en el centro
// extrusión de un contorno (por defecto, el eje Y del contorno pasa a +Z)
function ext(key, draw, depth, bevel = .012, rotX = PI / 2) {
  return cg('ex' + key, () => { const sh = new THREE.Shape(); draw(sh); const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, curveSegments: 8 }); g.translate(0, 0, -depth / 2); if (rotX) g.rotateX(rotX); return g; });
}
function norm(g) {
  const c = g.index ? g.toNonIndexed() : g.clone();
  for (const k of Object.keys(c.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') c.deleteAttribute(k);
  if (!c.attributes.uv) c.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(c.attributes.position.count * 2), 2));
  return c;
}
const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _m = new THREE.Matrix4(), _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3();
function X(g, p = [0, 0, 0], r = [0, 0, 0], s = 1) { const c = norm(g); _q.setFromEuler(_e.set(r[0], r[1], r[2])); _m.compose(_v1.set(p[0], p[1], p[2]), _q, typeof s === 'number' ? _v2.set(s, s, s) : _v2.set(s[0], s[1], s[2])); return c.applyMatrix4(_m); }
function XAB(g, a, b, r, r2) { const A = new THREE.Vector3(a[0], a[1], a[2]), Bv = new THREE.Vector3(b[0], b[1], b[2]), d = Bv.clone().sub(A), L = d.length(); _q.setFromUnitVectors(_Y, d.multiplyScalar(1 / L)); _m.compose(A.add(Bv).multiplyScalar(.5), _q, _v2.set(r, L, r2 ?? r)); return norm(g).applyMatrix4(_m); }
const merged = (key, fn) => cg('mg' + key, () => mergeGeometries(fn()));
// manto/capa: segmento de cilindro abierto detrás del cuerpo, pivote arriba
const capeGeo = (rT, rB, h, arc) => cg(`cp${f3(rT)}_${f3(rB)}_${f3(h)}_${f3(arc)}`, () => { const g = new THREE.CylinderGeometry(rT, rB, h, 12, 2, true, PI - arc / 2, arc); g.translate(0, -h / 2, 0); return g; });

// ═════════════════════════ utilidades de escena ═════════════════════════
function grp(p, x = 0, y = 0, z = 0) { const g = new THREE.Group(); g.position.set(x, y, z); if (p) p.add(g); return g; }
function P(p, geo, mat, pos, sc, rot) {
  const m = new THREE.Mesh(geo, mat);
  if (pos) m.position.set(pos[0], pos[1], pos[2]);
  if (sc !== undefined) { if (typeof sc === 'number') m.scale.setScalar(sc); else m.scale.set(sc[0], sc[1], sc[2]); }
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  p.add(m); return m;
}
function SEG(p, geo, mat, a, b, r, r2) { const m = new THREE.Mesh(XAB(geo, a, b, r, r2), mat); p.add(m); return m; } // (solo para piezas únicas)

// ═════════════════════════ humanoide base (chibi-heroico) ═════════════════════════
// unidades a escala 1: pies en y=0, coronilla ≈ 1.9-2.0. Mira hacia +Z.
function humanoid(o) {
  const b = o.bulk ?? 1, hs = o.head ?? 1, L = o.leg ?? 1;
  const g = new THREE.Group(), root = grp(g), body = grp(root);
  const skin = M(o.skin ?? 0xf1c9a5, { r: .62 });
  const topM = o.topM ?? M(0x777777, { r: .78 }), pantsM = o.pantsM ?? M(0x3b3b48, { r: .82 }), bootM = o.bootM ?? M(0x4a3322, { r: .68 });
  const hipY = .82 * L;
  const hips = grp(body, 0, hipY, 0);
  P(hips, U.sph, o.hipM ?? pantsM, [0, .02, 0], [.19 * b, .15, .145 * b]);
  const leg = [], knee = [];
  for (const sx of [-1, 1]) {
    const l = grp(hips, sx * .105 * b, -.02, 0);
    P(l, limb(.092 * b, .078 * b, .32 * L), o.thighM ?? pantsM);
    const k = grp(l, 0, -.38 * L, 0);
    P(k, limb(.08 * b, .066 * b, .27 * L), o.shinM ?? bootM);
    P(k, U.sph, bootM, [0, -.35 * L, .045], [.085 * b, .072, .14]);
    leg.push(l); knee.push(k);
  }
  const torso = grp(body, 0, hipY + .07, 0);
  P(torso, U.sph, o.absM ?? topM, [0, .09, 0], [.18 * b, .17, .135 * b]);
  const chest = P(torso, U.sph, topM, [0, .29, 0], [.245 * b, .235, .165 * b]);
  if (!o.noBelt) P(torso, U.cyl, o.beltM ?? M(0x3a2a1c, { r: .6 }), [0, -.01, 0], [.19 * b, .065, .145 * b]);
  P(torso, U.cyl, skin, [0, .49, 0], [.07, .1, .07]);
  const head = grp(torso, 0, .51, 0);
  P(head, U.sph, o.faceM ?? skin, [0, .2 * hs, .01], [.25 * hs, .26 * hs, .24 * hs]);
  if (!o.noEyes) {
    P(head, merged('eyes' + f3(hs), () => [-1, 1].map(sx => X(U.sphL, [sx * .088 * hs, .19 * hs, .222 * hs], [0, 0, 0], [.034 * hs, .047 * hs, .026 * hs]))), o.eyeM ?? EYE);
    P(head, merged('eyeHi' + f3(hs), () => [-1, 1].map(sx => X(U.sphL, [sx * .08 * hs, .205 * hs, .245 * hs], [0, 0, 0], .011 * hs))), M(0xffffff, { e: .8, ec: 0xffffff }));
  }
  const arm = [], fore = [], hand = [];
  for (const sx of [-1, 1]) {
    const a = grp(torso, sx * .29 * b, .43, 0); a.rotation.z = sx * .13;
    P(a, limb(.076 * b, .066 * b, .24), o.sleeveM ?? topM);
    const f = grp(a, 0, -.28, 0); f.rotation.x = -.2;
    P(f, limb(.066 * b, .056 * b, .22), o.foreM ?? skin);
    const h = grp(f, 0, -.27, 0);
    P(h, U.sph, o.handM ?? skin, [0, -.02, .01], [.062 * b, .072, .07]);
    arm.push(a); fore.push(f); hand.push(h);
  }
  const rig = { type: 'hum', root, body, hips, torso, chest, head, legL: leg[0], legR: leg[1], kneeL: knee[0], kneeR: knee[1], armL: arm[0], armR: arm[1], foreL: fore[0], foreR: fore[1], handL: hand[0], handR: hand[1], style: o.style ?? 'swing', hs, b, L };
  return { g, rig, s: 1 };
}
// pelo: casquete inclinado (deja la frente al aire)
function hairCap(r, mat, o = {}) {
  const hs = r.hs;
  return P(r.head, U.hemi, mat, [0, (.2 + (o.dy ?? 0)) * hs, (o.dz ?? -.01) * hs], [.272 * hs * (o.w ?? 1), .29 * hs * (o.h ?? 1), .272 * hs * (o.d ?? 1)], [o.tilt ?? -.45, 0, 0]);
}
function bangs(r, mat, n = 5, o = {}) {
  const hs = r.hs, len = o.len ?? .14, spread = o.spread ?? 1;
  const geo = merged(`bangs${n}_${f3(len)}_${f3(spread)}_${f3(hs)}`, () => {
    const out = [];
    for (let i = 0; i < n; i++) { const u = (i / (n - 1) - .5) * 2, a = u * .95 * spread; out.push(X(U.cone, [Math.sin(a) * .23 * hs, .33 * hs - Math.abs(u) * .03 * hs, Math.cos(a) * .2 * hs], [PI - .5 + Math.abs(u) * .1, a, -u * .25], [.075 * hs, len * hs * (1 - Math.abs(u) * .25), .045 * hs])); }
    return out;
  });
  return P(r.head, geo, mat);
}
function brows(r, mat, ang = .25) {
  const hs = r.hs; const geo = merged(`brow${f3(ang)}_${f3(hs)}`, () => [-1, 1].map(sx => X(U.rbox, [sx * .09 * hs, .265 * hs, .225 * hs], [0, 0, sx * ang], [.085 * hs, .022 * hs, .03 * hs])));
  return P(r.head, geo, mat);
}
function pauldron(arm, sx, mat, trim, w, h2, o = {}) {
  const pg = grp(arm, sx * (o.dx ?? .03), o.dy ?? .07, 0); pg.rotation.z = -sx * (o.tilt ?? .35);
  P(pg, U.hemi, mat, [0, 0, 0], [w, h2, w * (o.d ?? .95)]);
  if (trim) P(pg, U.ring, trim, [0, 0, 0], [w * 1.0, w * (o.d ?? .95), w * .9], [PI / 2, 0, 0]);
  if (o.layer) { P(pg, U.hemi, o.layer, [sx * .04, -.07, 0], [w * .9, h2 * .75, w * .88], [0, 0, -sx * .25]); }
  return pg;
}
function cape(r, mat, o) {
  const c1 = grp(r.torso, 0, o.y ?? .44, o.z ?? -.03);
  P(c1, capeGeo(o.rT, o.rM, o.l1, o.arc), mat);
  const c2 = grp(c1, 0, -o.l1, 0);
  P(c2, capeGeo(o.rM, o.rB, o.l2, o.arc), mat);
  if (o.trim) P(c2, capeGeo(o.rB * 1.01, o.rB * 1.025, .07, o.arc), o.trim, [0, -o.l2 + .07, 0]);
  r.cape = [c1, c2]; return c1;
}
function skirt(r, mat, key, pts, trim) {
  const s = P(r.hips, lathe('sk' + key, pts), mat); r.skirt = true;
  if (trim) { const [rb, yb] = pts[0]; P(r.hips, U.ring, trim, [0, yb + .015, 0], [rb * 1.01, rb * 1.01, .5], [PI / 2, 0, 0]); }
  return s;
}
// ——— armas ———
const bladeGeo = (len, w, tip, th = .035) => ext(`bl${f3(len)}_${f3(w)}_${f3(tip)}`, s => { s.moveTo(-w / 2, 0); s.lineTo(-w * .45, len - tip); s.lineTo(0, len); s.lineTo(w * .45, len - tip); s.lineTo(w / 2, 0); s.lineTo(-w / 2, 0); }, th, .012);
function sword(hand, o) {
  const g = grp(hand, 0, -.03, 0);
  P(g, U.cyl, o.grip, [0, 0, -.02], [.03, o.gripL ?? .26, .03], [PI / 2, 0, 0]);
  P(g, U.sph, o.guard, [0, 0, -(o.gripL ?? .26) / 2 - .03], .045);
  P(g, U.rbox, o.guard, [0, 0, .13], [o.w * 2.5, .06, .08]);
  P(g, bladeGeo(o.len, o.w, o.tip ?? o.w * 1.3), o.blade, [0, 0, .15]);
  if (o.glow) P(g, U.box, glow(o.glow, 2.5), [0, 0, .15 + o.len * .42], [o.w * .18, .04, o.len * .78]);
  return g;
}
function staffUpright(r, st, side = 'R') { st.rotation.x = -(r['arm' + side].rotation.x + r['fore' + side].rotation.x); }

// ——— versión prestigio (mejora de unidad) ———
function prestige(h) {
  const r = h.rig, col = r.theme ?? 0xffd36a; r.root.scale.multiplyScalar(1.15);
  const gG = M(0xffd36a, { m: .9, r: .25, e: 1.3, ec: 0xffa020 }), aura = M(col, { e: 2.5, ec: col, t: .7, add: 1 });
  const sig = grp(r.root, 0, .025, 0);
  P(sig, U.ring, aura, [0, 0, 0], [.82, .82, 1.4], [PI / 2, 0, 0]);
  P(sig, U.disc, M(col, { e: 1, ec: col, t: .22, add: 1, ds: 1 }), [0, 0, 0], .8, [-PI / 2, 0, 0]);
  P(sig, merged('sigRunes', () => { const o = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; o.push(X(U.oct, [Math.cos(a) * .66, 0, Math.sin(a) * .66], [PI / 2, 0, -a], [.05, .1, .02])); } return o; }), gG);
  const mo = grp(r.root, 0, 1.05, 0);
  P(mo, merged('motes', () => [0, 1, 2].map(i => X(U.oct, [Math.cos(i * 2.09) * .72, Math.sin(i * 1.7) * .25, Math.sin(i * 2.09) * .72], [0, 0, 0], [.05, .08, .05]))), glow(col, 3));
  const hs = r.hs ?? 1;
  if (r.head) P(r.head, merged('halo', () => { const o = [X(U.ring, [0, 0, 0], [0, 0, 0], [.3, .3, .5])]; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; o.push(X(U.pyr, [Math.cos(a) * .36, Math.sin(a) * .36, 0], [0, 0, a - PI / 2], [.025, .1, .01])); } return o; }), gG, [0, .3 * hs, -.3 * hs], hs);
  r.sigil = sig; r.motes = mo; r.upgraded = true;
}

// ═════════════════════════ animación procedural ═════════════════════════
const sm = x => x * x * (3 - 2 * x);
function kf(a, base, fr) { // fotogramas clave [t, valor|null(=base)] con interpolación suave
  const v = x => x === null ? base : x;
  if (a <= fr[0][0]) return v(fr[0][1]);
  for (let i = 1; i < fr.length; i++) if (a <= fr[i][0]) { const [t0, v0] = fr[i - 1], [t1, v1] = fr[i]; return v(v0) + (v(v1) - v(v0)) * sm((a - t0) / (t1 - t0)); }
  return v(fr[fr.length - 1][1]);
}
const B = (j, i) => j.userData.b[i];
function S(j, dx = 0, dy = 0, dz = 0) { if (!j) return; const b = j.userData.b; if (!b) return; j.rotation.set(b[0] + dx, b[1] + dy, b[2] + dz); }
function SP(j, dx = 0, dy = 0, dz = 0) { if (!j) return; const p = j.userData.p; j.position.set(p.x + dx, p.y + dy, p.z + dz); }

function animHum(m, r, st, t, w, ph) {
  const a = st.atk >= 0 ? Math.min(1, st.atk) : -1, hurt = st.hurt || 0, ca = st.cast > 0;
  const sp = Math.sin(ph), cp = Math.cos(ph), br = Math.sin(t * 2.1 + m.phase * 3);
  const amp = r.skirt ? .42 : r.heavy ? .5 : .62;
  const dg = r.digi ? -1 : 1;
  S(r.legL, -sp * amp * w); S(r.legR, sp * amp * w);
  S(r.kneeL, dg * w * (.08 + .85 * Math.max(0, cp))); S(r.kneeR, dg * w * (.08 + .85 * Math.max(0, -cp)));
  let by = w * (r.heavy ? .06 : .045) * Math.abs(cp) - w * .02, bz = 0, tx = .1 * w + br * .018, ty = sp * .1 * w, hx = -br * .02, hy = Math.sin(t * .7 + m.phase) * .08 * (1 - w);
  const swR = r.holdR ? .12 : .5, swL = r.holdL ? .12 : .5;
  let aLx = B(r.armL, 0) + sp * swL * w, aLy = B(r.armL, 1), aLz = B(r.armL, 2) - br * .03, aRx = B(r.armR, 0) - sp * swR * w, aRy = B(r.armR, 1), aRz = B(r.armR, 2) + br * .03;
  let fL = B(r.foreL, 0) - .18 * w * (r.holdL ? 0 : 1), fR = B(r.foreR, 0) - .18 * w * (r.holdR ? 0 : 1);
  if (a >= 0) {
    const side = r.castSide === 'L' ? 'L' : 'R';
    switch (r.style) {
      case 'swing': {
        aRx = kf(a, B(r.armR, 0), [[0, null], [.3, -2.85], [.5, .45], [.72, .2], [1, null]]);
        aRz = kf(a, B(r.armR, 2), [[0, null], [.3, .35], [.5, -.15], [1, null]]);
        fR = kf(a, B(r.foreR, 0), [[0, null], [.3, -.7], [.5, -.1], [.72, -.25], [1, null]]);
        ty += kf(a, 0, [[0, 0], [.3, .45], [.5, -.5], [.75, -.3], [1, 0]]);
        tx += kf(a, 0, [[0, 0], [.3, -.15], [.5, .3], [.8, .15], [1, 0]]);
        bz = kf(a, 0, [[0, 0], [.3, -.06], [.5, .28], [.8, .12], [1, 0]]);
        if (!r.holdL) aLx += kf(a, 0, [[0, 0], [.3, .5], [.5, -.7], [1, 0]]); else aLx += kf(a, 0, [[0, 0], [.3, -.2], [.5, -.4], [1, 0]]);
        break;
      }
      case 'cast': {
        const bx = B(r['arm' + side], 0), bf = B(r['fore' + side], 0);
        const ax2 = kf(a, bx, [[0, null], [.32, -.9], [.48, -1.65], [.7, -1.5], [1, null]]), fx2 = kf(a, bf, [[0, null], [.32, -1.7], [.48, -.05], [.7, -.15], [1, null]]);
        if (side === 'R') { aRx = ax2; fR = fx2; aRz = B(r.armR, 2) - .1 * Math.sin(a * PI); } else { aLx = ax2; fL = fx2; aLz = B(r.armL, 2) + .1 * Math.sin(a * PI); }
        ty += (side === 'R' ? 1 : -1) * kf(a, 0, [[0, 0], [.32, .35], [.48, -.3], [1, 0]]);
        bz = kf(a, 0, [[0, 0], [.32, -.04], [.5, .12], [1, 0]]); hx += kf(a, 0, [[0, 0], [.4, -.1], [.6, .05], [1, 0]]);
        break;
      }
      case 'bow': {
        aLx = kf(a, B(r.armL, 0), [[0, null], [.22, -1.55], [.78, -1.55], [1, null]]); aLz = kf(a, B(r.armL, 2), [[0, null], [.22, 0], [.78, 0], [1, null]]); fL = kf(a, B(r.foreL, 0), [[0, null], [.22, -.05], [.78, -.05], [1, null]]);
        aRx = kf(a, B(r.armR, 0), [[0, null], [.22, -1.45], [.5, -1.5], [.56, -1.25], [1, null]]); fR = kf(a, B(r.foreR, 0), [[0, null], [.22, -.5], [.5, -2.0], [.56, -.8], [1, null]]); aRz = kf(a, B(r.armR, 2), [[0, null], [.5, .5], [.56, .7], [1, null]]);
        ty += kf(a, 0, [[0, 0], [.22, .5], [.78, .5], [1, 0]]);
        bz = kf(a, 0, [[0, 0], [.5, 0], [.56, -.06], [1, 0]]);
        break;
      }
      case 'gun': {
        tx += kf(a, 0, [[0, 0], [.3, -.05], [.38, -.22], [.7, -.05], [1, 0]]);
        bz = kf(a, 0, [[0, 0], [.3, .03], [.38, -.12], [1, 0]]);
        ty += kf(a, 0, [[0, 0], [.3, -.2], [.7, -.2], [1, 0]]);
        aRx += kf(a, 0, [[0, 0], [.3, -.25], [.38, -.5], [1, 0]]);
        break;
      }
      case 'slam': {
        aLx = kf(a, B(r.armL, 0), [[0, null], [.38, -2.9], [.55, -.45], [.75, -.55], [1, null]]); aRx = kf(a, B(r.armR, 0), [[0, null], [.38, -2.9], [.55, -.45], [.75, -.55], [1, null]]);
        fL = kf(a, B(r.foreL, 0), [[0, null], [.38, -.3], [.55, -.15], [1, null]]); fR = kf(a, B(r.foreR, 0), [[0, null], [.38, -.3], [.55, -.15], [1, null]]);
        aLz = kf(a, B(r.armL, 2), [[0, null], [.38, .1], [.55, -.1], [1, null]]); aRz = kf(a, B(r.armR, 2), [[0, null], [.38, -.1], [.55, .1], [1, null]]);
        tx += kf(a, 0, [[0, 0], [.38, -.3], [.55, .45], [.8, .3], [1, 0]]);
        by += kf(a, 0, [[0, 0], [.38, .06], [.55, -.08], [1, 0]]); bz = kf(a, 0, [[0, 0], [.38, -.08], [.55, .2], [1, 0]]);
        break;
      }
      case 'blow': {
        aRx = kf(a, B(r.armR, 0), [[0, null], [.3, -1.0], [.75, -1.0], [1, null]]); fR = kf(a, B(r.foreR, 0), [[0, null], [.3, -.55], [.75, -.55], [1, null]]);
        aLx = kf(a, B(r.armL, 0), [[0, null], [.3, -1.2], [.75, -1.2], [1, null]]); fL = kf(a, B(r.foreL, 0), [[0, null], [.3, -.6], [.75, -.6], [1, null]]); aLz = kf(a, B(r.armL, 2), [[0, null], [.3, .25], [.75, .25], [1, null]]);
        hx += kf(a, 0, [[0, 0], [.45, .1], [.52, -.12], [.7, 0], [1, 0]]);
        bz = kf(a, 0, [[0, 0], [.45, .03], [.52, -.06], [1, 0]]);
        break;
      }
    }
  }
  if (ca) { aLx = -2.5 + br * .05; aRx = -2.5 - br * .05; aLz = -.35; aRz = .35; fL = fR = -.25; hx -= .2; }
  r.armL.rotation.set(aLx, aLy, aLz); r.armR.rotation.set(aRx, aRy, aRz);
  r.foreL.rotation.x = fL; r.foreR.rotation.x = fR;
  S(r.torso, tx - hurt * .3, ty, 0); S(r.head, hx - hurt * .35, hy, 0);
  SP(r.body, 0, by, bz);
  if (r.chest) { const s = r.chest.userData.s; r.chest.scale.set(s.x * (1 + br * .012), s.y * (1 + br * .02), s.z * (1 + br * .02)); }
  if (r.cape) { S(r.cape[0], .06 + .28 * w + Math.sin(t * 2.6 + m.phase) * .04 + Math.max(0, bz) * .9); S(r.cape[1], .1 * w + Math.sin(t * 3.3 + m.phase + 1) * .07 + .06 * w * Math.sin(ph * 2) + Math.max(0, bz) * .5); }
  if (r.braids) r.braids.forEach((b2, i) => S(b2, .12 * w + Math.sin(t * 2.4 + i) * .05 + Math.max(0, bz) * .8, 0, Math.sin(ph + i) * .07 * w + (i ? 1 : -1) * Math.sin(t * 1.7) * .03));
  if (r.tails) r.tails.forEach((b2, i) => S(b2, .1 * w + Math.sin(t * 2.2 + i + m.phase) * .05 + Math.max(0, bz) * .6, Math.sin(ph) * .06 * w, 0));
  if (r.launcher) { const k = a >= 0 ? kf(a, 0, [[0, 0], [.3, 0], [.38, 1], [1, 0]]) : 0; SP(r.launcher, 0, k * .04, -k * .2); S(r.launcher, -k * .35 - (a >= 0 ? kf(a, 0, [[0, 0], [.3, .15], [.7, .15], [1, 0]]) : 0)); }
  if (r.arrow) r.arrow.visible = a >= .15 && a < .52;
  if (r.tib) {
    const tb = r.tib, tbr = Math.sin(t * 1.6 + m.phase);
    SP(tb.body, 0, Math.abs(Math.sin(ph)) * .06 * w, 0); S(tb.body, .05 * w, 0, Math.sin(ph) * .05 * w + tbr * .02);
    S(tb.head, tbr * .05, Math.sin(t * .8) * .2, 0);
    S(tb.armR, (a >= 0 ? kf(a, 0, [[0, 0], [.35, -2.4], [.55, -.2], [1, 0]]) : Math.sin(ph) * .4 * w) + tbr * .04); S(tb.armL, (a >= 0 ? kf(a, 0, [[0, 0], [.4, -1.0], [.6, .3], [1, 0]]) : -Math.sin(ph) * .4 * w) - tbr * .04);
  }
  if (r.wind) { r.wind.rotation.y = t * 3; }
}
function animQuad(m, r, st, t, w, ph) {
  const a = st.atk >= 0 ? Math.min(1, st.atk) : -1, hurt = st.hurt || 0, br = Math.sin(t * 2.4 + m.phase * 3);
  if (r.hop) {
    const hp = Math.max(0, Math.sin(ph * .5)); SP(r.body, 0, hp * .32 * w, 0); S(r.body, -Math.cos(ph * .5) * .15 * w);
    r.legs.forEach((l, i) => S(l, (i < 2 ? -1 : 1) * hp * .6 * w));
  } else {
    const off = [0, PI, PI, 0];
    r.legs.forEach((l, i) => { const s2 = Math.sin(ph + off[i]); S(l, s2 * .6 * w); if (l.userData.knee) S(l.userData.knee, (i < 2 ? 1 : -1) * Math.max(0, Math.cos(ph + off[i])) * .6 * w); });
    SP(r.body, 0, Math.abs(Math.sin(ph)) * .05 * w, 0); S(r.body, Math.sin(ph * 2) * .03 * w);
  }
  let hx = br * .03 + Math.sin(ph) * .06 * w, jx = 0, bz = 0;
  if (a >= 0) { hx += kf(a, 0, [[0, 0], [.3, -.35], [.5, .4], [1, 0]]); jx = kf(a, 0, [[0, 0], [.3, .55], [.5, -.05], [1, 0]]); bz = kf(a, 0, [[0, 0], [.3, -.08], [.5, .28], [1, 0]]); }
  S(r.head, hx - hurt * .3); if (r.jaw) S(r.jaw, jx + (r.hop ? Math.max(0, Math.sin(t * 1.3)) * .08 : 0));
  const tp = r.torso.userData.p; r.torso.position.set(tp.x, tp.y + br * .01, tp.z + bz);
  const ts = r.torso.userData.s; r.torso.scale.set(ts.x * (1 + br * .02), ts.y * (1 + br * .025), ts.z);
  if (r.tail) S(r.tail, .1 * w, Math.sin(t * 5 + m.phase) * (.25 + .2 * w), 0);
}
function animBird(m, r, st, t, w, ph) {
  const a = st.atk >= 0 ? Math.min(1, st.atk) : -1, br = Math.sin(t * 2.6 + m.phase * 3), sp = Math.sin(ph), cp = Math.cos(ph);
  S(r.legL, -sp * .7 * w); S(r.legR, sp * .7 * w); S(r.kneeL, Math.max(0, cp) * .7 * w); S(r.kneeR, Math.max(0, -cp) * .7 * w);
  SP(r.body, 0, Math.abs(cp) * .06 * w, a >= 0 ? kf(a, 0, [[0, 0], [.3, -.05], [.5, .3], [1, 0]]) : 0);
  S(r.torso, br * .03 + .1 * w + (a >= 0 ? kf(a, 0, [[0, 0], [.3, -.2], [.5, .35], [1, 0]]) : 0));
  S(r.neck, Math.sin(ph * 2) * .1 * w + (a >= 0 ? kf(a, 0, [[0, 0], [.3, -.3], [.5, .5], [1, 0]]) : 0));
  S(r.head, -br * .05 + Math.sin(t * 3.1 + m.phase) * .08 * (1 - w)); S(r.jaw, a >= 0 ? kf(a, 0, [[0, 0], [.3, .5], [.5, 0], [1, 0]]) : 0);
  r.wings.forEach((wg, i) => S(wg, 0, 0, (i ? -1 : 1) * (a >= 0 ? kf(a, 0, [[0, 0], [.3, .8], [.5, -.2], [1, 0]]) : Math.sin(t * 3) * .1)));
  S(r.tail, Math.sin(ph * 2) * .1 * w, Math.sin(t * 3 + m.phase) * .25, 0);
}
function animDrake(m, r, st, t, w, ph) {
  const a = st.atk >= 0 ? Math.min(1, st.atk) : -1, hurt = st.hurt || 0, f = t * 4.2 + m.phase;
  const flap = Math.sin(f);
  SP(r.body, 0, .3 + Math.sin(f + PI * .5) * .07 + Math.sin(t * 1.1 + m.phase) * .06, a >= 0 ? kf(a, 0, [[0, 0], [.35, -.1], [.55, .25], [1, 0]]) : 0);
  S(r.body, .08 * w + (a >= 0 ? kf(a, 0, [[0, 0], [.35, -.12], [.55, .12], [1, 0]]) : 0), 0, Math.sin(t * 1.3 + m.phase) * .04);
  r.wings.forEach(({ sh, el }) => { S(sh, 0, Math.sin(f - .4) * .1, flap * .5); S(el, 0, 0, Math.sin(f - 1.0) * .45); });
  r.neck.forEach((n, i) => S(n, Math.sin(t * 2 + i * .7 + m.phase) * .05 + (a >= 0 ? kf(a, 0, [[0, 0], [.35, -.18], [.55, .2], [1, 0]]) : 0) - hurt * .1));
  S(r.head, (a >= 0 ? kf(a, 0, [[0, 0], [.35, -.3], [.55, .25], [1, 0]]) : Math.sin(t * 1.7 + m.phase) * .06) - hurt * .3, Math.sin(t * .9 + m.phase) * .15);
  S(r.jaw, a >= 0 ? kf(a, 0, [[0, 0], [.35, .2], [.5, .7], [.8, .3], [1, 0]]) : .05 + Math.max(0, Math.sin(t * .8)) * .1);
  r.tail.forEach((tt, i) => S(tt, Math.sin(t * 2.3 - i * .6 + m.phase) * .07, Math.sin(t * 1.9 - i * .7 + m.phase) * (.12 + .06 * w), 0));
  r.legs.forEach((l, i) => S(l, .15 * w + Math.sin(t * 1.5 + i) * .05));
}
function animWorm(m, r, st, t, w, ph) {
  const a = st.atk >= 0 ? Math.min(1, st.atk) : -1, hurt = st.hurt || 0, n = r.segs.length;
  const spd = r.boss ? 2.2 : 7;
  r.segs.forEach((s, i) => { const k = r.boss ? (1 - i / n) : 1; SP(s, Math.sin(t * spd * (r.boss ? 1 : .6 + .4 * w) - i * .8 + m.phase) * (r.boss ? .14 * k : .1 * (w + .3)), r.boss ? 0 : Math.max(0, Math.sin(t * 8 - i * 1.2)) * .05 * w, 0); });
  if (r.boss) { const lean = a >= 0 ? kf(a, 0, [[0, 0], [.35, -.25], [.55, .35], [1, 0]]) : 0; S(r.body, lean * .3); SP(r.body, 0, 0, lean * .5); }
  S(r.head, (a >= 0 ? kf(a, 0, [[0, 0], [.35, -.3], [.55, .3], [1, 0]]) : Math.sin(t * 1.5 + m.phase) * .06) - hurt * .25, Math.sin(t * .8 + m.phase) * .15);
  if (r.jaw) S(r.jaw, a >= 0 ? kf(a, 0, [[0, 0], [.35, .5], [.55, .1], [1, 0]]) : .05);
  if (r.mand) { const o = a >= 0 ? kf(a, 0, [[0, 0], [.35, .55], [.5, -.15], [1, 0]]) : Math.sin(t * 3 + m.phase) * .08; r.mand.forEach((md, i) => S(md, 0, (i ? -1 : 1) * o, 0)); }
  if (r.tents) r.tents.forEach((tn, i) => S(tn, Math.sin(t * 1.8 + i * 1.3) * .25, 0, Math.cos(t * 1.4 + i) * .2));
}
function animCrab(m, r, st, t, w, ph) {
  const a = st.atk >= 0 ? Math.min(1, st.atk) : -1, br = Math.sin(t * 2 + m.phase);
  r.legs.forEach((l, i) => { const s2 = Math.sin(ph * 1.5 + i * 2.1); S(l, 0, s2 * .25 * w, s2 * .12 * w * l.userData.sx); });
  SP(r.body, 0, Math.abs(Math.sin(ph * 1.5)) * .04 * w + br * .015, 0);
  S(r.torso, br * .02, Math.sin(ph * .75) * .06 * w, 0);
  const lift = a >= 0 ? kf(a, 0, [[0, 0], [.35, -.7], [.5, .25], [1, 0]]) : Math.sin(t * 1.5 + m.phase) * .05;
  const pinch = a >= 0 ? kf(a, 0, [[0, 0], [.35, .6], [.5, -.1], [1, 0]]) : 0;
  for (const c of [r.armL, r.armR]) { S(c, lift); if (c.userData.low) S(c.userData.low, pinch); }
  if (r.eye) { const s = r.eye.userData.s; r.eye.scale.set(s.x, s.y * (Math.sin(t * .9 + m.phase) > .97 ? .15 : 1), s.z); }
  if (r.head) S(r.head, a >= 0 ? kf(a, 0, [[0, 0], [.4, -.15], [1, 0]]) : 0, Math.sin(t * 1.2) * .1, 0);
}
function animCart(m, r, st, t, dt, w) {
  m._wh = (m._wh ?? 0) + dt * w * (st.speed || 8) * .5;
  r.wheels.forEach(wh => S(wh, m._wh));
  const a = st.atk >= 0 ? Math.min(1, st.atk) : -1, rec = a >= 0 ? kf(a, 0, [[0, 0], [.3, 0], [.36, 1], [1, 0]]) : 0;
  SP(r.barrel, 0, 0, -rec * .2); S(r.barrel, -rec * .2);
  SP(r.body, 0, Math.abs(Math.sin(t * 9)) * .015 * w, -rec * .06);
  S(r.head, Math.sin(t * 2 + m.phase) * .05, Math.sin(t * .9 + m.phase) * .3, 0);
  S(r.armL, Math.sin(t * 9) * .1 * w); S(r.armR, -Math.sin(t * 9) * .1 * w);
}
export function animate(model, st, t, dt) {
  // hook opcional por campeón: rig.anim(model, rig, st, t, dt, w, ph) se ejecuta tras la animación genérica
  const r = model.rig; if (!r || !r.type) return;
  if (model.phase === undefined) model.phase = 0;
  model._k = (model._k ?? 0) + ((st.moving ? 1 : 0) - (model._k ?? 0)) * Math.min(1, dt * 8);
  const w = model._k, ph = t * (st.speed || 8) + model.phase;
  switch (r.type) {
    case 'hum': animHum(model, r, st, t, w, ph); break;
    case 'quad': animQuad(model, r, st, t, w, ph); break;
    case 'bird': animBird(model, r, st, t, w, ph); break;
    case 'drake': animDrake(model, r, st, t, w, ph); break;
    case 'worm': animWorm(model, r, st, t, w, ph); break;
    case 'crab': animCrab(model, r, st, t, w, ph); break;
    case 'cart': animCart(model, r, st, t, dt, w); break;
  }
  if (r.pulse) r.pulse.forEach(p => { const s = p.userData.s ?? p.scale.clone(); p.userData.s = s; p.scale.copy(s).multiplyScalar(1 + Math.sin(t * 6 + model.phase) * .12); });
  if (r.motes) { r.motes.rotation.y = t * 1.4; r.motes.position.y = 1.05 + Math.sin(t * 2) * .06; }
  if (r.sigil) r.sigil.rotation.y = -t * .6;
  if (r.anim) r.anim(model, r, st, t, dt, w, ph);
}


// ═════════════════════════ exportaciones del kit ═════════════════════════
export { glow, gld, cloth, metal, hairM, EYE, TAU, PI, U, cg, limb, lathe, tube, taper, spindle, ext, norm, X, XAB, merged, capeGeo, grp, P, SEG, humanoid, hairCap, bangs, brows, pauldron, cape, skirt, bladeGeo, sword, staffUpright, prestige, kf, S, SP, f3, sm, B };
export { THREE };
