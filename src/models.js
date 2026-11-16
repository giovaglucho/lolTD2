import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

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

// ═════════════════════════ CAMPEONES ═════════════════════════
const CHAMPS = {
  garen(Up) {
    const steel = metal(0xc6d0e2, .3), blue = M(0x2c5cc0, { m: .55, r: .4 }), gold = gld(Up), cl = cloth(0x1f3d8a, 1), dark = M(0x2b303c, { m: .55, r: .5 });
    const h = humanoid({ bulk: 1.25, skin: 0xe8bb94, topM: blue, sleeveM: dark, foreM: steel, handM: dark, thighM: M(0x26324f, { r: .8 }), shinM: steel, bootM: steel, beltM: gold, hipM: dark });
    const r = h.rig;
    P(r.torso, U.sph, steel, [0, .31, .055], [.25, .2, .13]);
    P(r.torso, U.oct, gold, [0, .34, .19], [.06, .085, .03]);
    P(r.torso, U.cyl, steel, [0, .45, 0], [.17, .07, .14]);
    pauldron(r.armL, -1, steel, gold, .31, .21, { layer: blue, tilt: .32 }); pauldron(r.armR, 1, steel, gold, .31, .21, { layer: blue, tilt: .32 });
    P(r.hips, U.rbox, cl, [0, -.22, .14], [.22, .4, .03]); P(r.hips, U.oct, gold, [0, -.14, .16], [.045, .06, .02]);
    const hm = hairM(0x5c3b22); hairCap(r, hm, { tilt: -.55 }); bangs(r, hm, 4, { len: .1 }); brows(r, hm, .28);
    P(r.head, U.sph, M(0xe8bb94, { r: .62 }), [0, .1, .06], [.2, .14, .2]); // mandíbula marcada
    cape(r, cl, { rT: .32, rM: .37, rB: .46, l1: .55, l2: .78, arc: 2.5, trim: gold });
    r.weapon = sword(r.handR, { len: 1.3, w: .22, blade: metal(0xe4ecf7, .2), guard: gold, grip: M(0x3a2414, { r: .7 }), glow: Up ? 0x8fd0ff : 0 });
    r.armR.rotation.set(-.35, 0, .28); r.foreR.rotation.x = -1.85; r.weapon.rotation.set(.1, 0, 0);
    r.style = 'swing'; r.holdR = true; r.theme = 0x7fc0ff;
    if (Up) { for (const a of [r.armL, r.armR]) { const sx = a === r.armL ? -1 : 1; P(a, U.cone, gold, [sx * .2, .2, 0], [.05, .28, .05], [0, 0, -sx * .9]); } P(r.head, U.ring, gold, [0, .38, 0], [.25, .25, .6], [PI / 2 + .45, 0, 0]); }
    return h;
  },
  ashe(Up) {
    const blueC = cloth(0x3768b0), white = M(0xe9eef5, { r: .78 }), fur = M(0xf6f7fa, { r: .95 }), navy = cloth(0x1f2c4f), gold = gld(Up);
    const ice = M(0xa8ecff, { m: .1, r: .15, e: Up ? 1.6 : .9, ec: 0x48b4ff });
    const h = humanoid({ bulk: .88, head: 1.06, skin: 0xf3d6c2, topM: blueC, sleeveM: blueC, foreM: white, handM: white, thighM: navy, shinM: white, bootM: white, beltM: gold, style: 'bow', eyeM: M(0x2a4a8a, { r: .3 }) });
    const r = h.rig, hs = r.hs;
    const hw = hairM(0xf2f4ff); bangs(r, hw, 5, { len: .13 });
    hairCap(r, hw, { tilt: -.5 });
    P(r.head, U.hemi, cloth(0x2f5ea6, 1), [0, .17 * hs, -.06], [.31 * hs, .36 * hs, .33 * hs], [-.85, 0, 0]); // capucha caída hacia atrás
    const br = tube('ashebraid', [[.17, .14, .02], [.23, -.02, .1], [.24, -.25, .15], [.2, -.5, .16]], taper(.06, .03, .3, 24), 18, 7); r.tails = [P(r.head, br, hw)];
    P(r.torso, U.sph, fur, [0, .44, -.01], [.27, .08, .2]);
    P(r.torso, U.oct, gold, [0, .32, .17], [.04, .06, .02]);
    cape(r, cloth(0x2f5ea6, 1), { rT: .27, rM: .32, rB: .42, l1: .55, l2: .7, arc: 2.6, trim: fur });
    // arco de hielo
    const bow = grp(r.handL, 0, -.03, 0);
    const pts = [[0, .26, -.68], [0, .1, -.4], [0, 0, 0], [0, .1, .4], [0, .26, .68]];
    P(bow, tube('ashebow', pts, spindle(.05, .018), 26, 7), ice);
    P(bow, merged('asheTips', () => [X(U.oct, [0, .28, -.72], [.5, 0, 0], [.05, .12, .05]), X(U.oct, [0, .28, .72], [-.5, 0, 0], [.05, .12, .05]), X(U.oct, [0, -.06, 0], [0, 0, 0], [.06, .09, .09])]), glow(0xbff3ff, Up ? 2.6 : 1.6));
    P(bow, XAB(U.cyl, [0, .26, -.68], [0, .26, .68], .006), M(0xffffff, { e: .8, ec: 0xbfefff }));
    r.weapon = bow;
    const arrow = grp(r.handR, 0, -.03, 0); P(arrow, U.cyl, glow(0xbff3ff, 2), [0, 0, .25], [.012, .7, .012], [PI / 2, 0, 0]); P(arrow, U.oct, glow(0x8fe0ff, 3), [0, 0, .62], [.03, .08, .03], [PI / 2, 0, 0]); arrow.visible = false; r.arrow = arrow;
    r.armL.rotation.set(-.5, 0, -.15); r.foreL.rotation.x = -.6; bow.rotation.x = .0;
    r.theme = 0x7fd8ff;
    return h;
  },
  annie(Up) {
    const pink = cloth(0xd8406e), white = M(0xf6eef0, { r: .8 }), gold = gld(Up);
    const h = humanoid({ bulk: .82, head: 1.28, leg: .72, skin: 0xf4d0b4, topM: pink, sleeveM: pink, thighM: M(0xf4d0b4, { r: .62 }), shinM: white, bootM: cloth(0x5a2a2a), beltM: white, style: 'cast' });
    const r = h.rig, hs = r.hs; r.root.scale.setScalar(.82);
    skirt(r, pink, 'annie', [[.35, -.34], [.3, -.2], [.22, -.02], [.17, .1]], white);
    P(r.torso, U.sph, white, [0, .45, .02], [.17, .06, .14]);
    const hr = hairM(0xb3341c); hairCap(r, hr, { tilt: -.5, w: 1.05, d: 1.05 }); bangs(r, hr, 5, { len: .12 });
    for (const sx of [-1, 1]) P(r.head, U.sph, hr, [sx * .26 * hs, .2 * hs, -.08 * hs], [.1 * hs, .12 * hs, .1 * hs]);
    P(r.head, merged('annieEars', () => [-1, 1].map(sx => X(U.sph, [sx * .17, .48, -.03], [0, 0, 0], [.07, .07, .04]))), M(0x7a3fa0, { r: .8 }));
    const fb = P(r.handR, U.sph, glow(0xff8a2a, 3), [0, -.1, .06], .1); P(r.handR, U.sph, M(0xff5a1a, { e: 2, ec: 0xff5a1a, t: .4, add: 1 }), [0, -.12, .06], .17); r.pulse = [fb];
    // Tibbers
    const fur = M(0x4e2f1f, { r: .95 }), tan = M(0x9a6a44, { r: .9 }), claw = M(0xf2e6cf, { r: .4 }), teye = glow(0xff7a1a, 3);
    const tb = grp(r.root, .95, 0, -.1); tb.rotation.y = -.35; const tbody = grp(tb);
    P(tbody, U.sph, fur, [0, .72, 0], [.46, .52, .4]);
    P(tbody, U.sph, tan, [0, .66, .2], [.3, .36, .24]);
    P(tbody, merged('tibStitch', () => [0, 1, 2, 3].map(i => X(U.box, [-.05 + (i % 2) * .1, .55 + i * .08, .43], [0, 0, (i % 2 ? .6 : -.6)], [.012, .06, .01]))), M(0x2a1a10));
    const th = grp(tbody, 0, 1.28, .05);
    P(th, U.sph, fur, [0, .1, 0], [.34, .3, .3]); P(th, U.sph, tan, [0, .03, .24], [.15, .11, .12]); P(th, U.sph, M(0x1a0e08), [0, .08, .35], [.05, .035, .03]);
    P(th, merged('tibEars', () => [-1, 1].map(sx => X(U.sph, [sx * .25, .34, -.02], [0, 0, 0], [.1, .1, .06]))), fur);
    P(th, merged('tibEyes', () => [-1, 1].map(sx => X(U.sph, [sx * .12, .15, .26], [0, 0, 0], .045))), teye);
    const tarms = [];
    for (const sx of [-1, 1]) {
      const a = grp(tbody, sx * .44, 1.02, .02); a.rotation.z = sx * .35; P(a, limb(.13, .11, .45), fur);
      P(a, U.sph, tan, [0, -.56, .03], [.13, .12, .13]);
      P(a, merged('tibClaw', () => [-1, 0, 1].map(i => X(U.cone, [i * .055, -.66, .08], [PI + .4, 0, 0], [.025, .12, .025]))), claw);
      tarms.push(a);
    }
    for (const sx of [-1, 1]) { P(tbody, limb(.14, .13, .2), fur, [sx * .2, .34, 0]); P(tbody, U.sph, tan, [sx * .2, .08, .07], [.14, .08, .18]); }
    if (Up) { P(tbody, U.sph, M(0xff6a1a, { e: 1.5, ec: 0xff4a0a, t: .35, add: 1 }), [0, .8, 0], [.62, .75, .55]); }
    r.tib = { g: tb, body: tbody, head: th, armL: tarms[0], armR: tarms[1] };
    r.theme = 0xff7a2a;
    return h;
  },
  lux(Up) {
    const white = M(0xf5f3ee, { m: .2, r: .45 }), gold = gld(Up), blue = cloth(0x3b6fd0);
    const h = humanoid({ bulk: .88, head: 1.08, skin: 0xf7dcc6, topM: white, sleeveM: white, foreM: white, handM: white, thighM: white, shinM: white, bootM: gold, beltM: blue, style: 'cast', eyeM: M(0x2d5aa8, { r: .3 }) });
    const r = h.rig, hs = r.hs;
    skirt(r, M(0xf5f3ee, { r: .6, ds: 1 }), 'lux', [[.4, -.68], [.32, -.4], [.23, -.06], [.18, .1]], gold);
    P(r.hips, lathe('luxpanel', [[.31, -.5], [.26, -.25], [.2, .05]]), M(0x3b6fd0, { r: .8, ds: 1 }), [0, 0, .015], [.9, 1, 1.12]);
    P(r.torso, U.oct, gold, [0, .3, .16], [.06, .09, .03]);
    pauldron(r.armL, -1, gold, null, .15, .1, { tilt: .5 }); pauldron(r.armR, 1, gold, null, .15, .1, { tilt: .5 });
    const hb = hairM(0xf6d675); hairCap(r, hb, { tilt: -.5 }); bangs(r, hb, 6, { len: .15 });
    r.tails = [P(r.head, tube('luxhair', [[0, .3, -.15], [0, .12, -.28], [0, -.15, -.32], [0, -.45, -.3], [0, -.7, -.34]], taper(.17, .07, .08, 14), 20, 9), hb)];
    P(r.head, merged('luxside', () => [-1, 1].map(sx => X(tube('luxlock', [[0, 0, 0], [.03, -.15, .02], [.02, -.32, .0]], taper(.06, .025), 10, 6), [sx * .22, .2, .05]))), hb);
    P(r.head, U.ring, gold, [0, .29 * hs, .01], [.265 * hs, .255 * hs, .6], [PI / 2 - .45, 0, 0]);
    P(r.head, U.oct, glow(0x7fb8ff, 2), [0, .37 * hs, .2 * hs], [.035, .05, .02]);
    // bastón con orbe
    const st = grp(r.handR, 0, -.03, 0);
    P(st, U.cyl, white, [0, .3, 0], [.028, 1.45, .028]);
    P(st, U.ring, gold, [0, 1.12, 0], [.15, .17, 1.2]);
    P(st, merged('luxwing', () => [-1, 1].map(sx => X(U.pyr, [sx * .15, 1.0, 0], [0, 0, sx * .9], [.03, .26, .06]))), gold);
    P(st, U.cone, gold, [0, .97, 0], [.05, .12, .05], [PI, 0, 0]);
    const orb = P(st, U.sph, glow(0xfff1b0, Up ? 4 : 3), [0, 1.12, 0], .1); P(st, U.sph, M(0xfff1b0, { e: 2, ec: 0xffe680, t: .35, add: 1 }), [0, 1.12, 0], .17);
    r.pulse = [orb]; r.weapon = st;
    r.armR.rotation.set(-.3, 0, .2); r.foreR.rotation.x = -.75; staffUpright(r, st);
    r.theme = 0xfff0a0;
    return h;
  },
  malphite(Up) {
    const g = new THREE.Group(), root = grp(g), body = grp(root); root.scale.setScalar(1.22);
    const rock = M(0x737b8c, { r: .88, fs: 1 }), dark = M(0x4b5160, { r: .92, fs: 1 }), cry = glow(Up ? 0x7ffff0 : 0x45e0c4, Up ? 2.8 : 2), cryS = M(0x45e0c4, { m: .2, r: .2, e: .9, ec: 0x30c0a8 });
    const hips = grp(body, 0, .6, 0); P(hips, U.dod, dark, [0, .02, 0], [.32, .2, .26]);
    const leg = [], knee = [];
    for (const sx of [-1, 1]) { const l = grp(hips, sx * .24, -.02, 0); P(l, U.ico, rock, [0, -.12, 0], [.19, .2, .19]); const k = grp(l, 0, -.28, 0); P(k, U.dod, rock, [0, -.08, .02], [.17, .17, .17]); P(k, U.dod, dark, [0, -.22, .07], [.18, .1, .23]); leg.push(l); knee.push(k); }
    const torso = grp(body, 0, .68, 0); torso.rotation.x = .12;
    P(torso, U.ico, dark, [0, .12, 0], [.36, .26, .3]);
    const chest = P(torso, U.dod, rock, [0, .5, 0], [.6, .45, .44]);
    P(torso, merged('malPlates', () => [X(U.dod, [-.32, .55, .2], [.3, .2, .1], [.26, .24, .18]), X(U.dod, [.32, .55, .2], [.3, -.2, .1], [.26, .24, .18]), X(U.ico, [0, .78, -.12], [0, .4, 0], [.42, .2, .3])]), M(0x828a9a, { r: .85, fs: 1 }));
    P(torso, merged('malCry', () => [[-.28, .9, -.25, .35, -.5, .3], [.0, 1.0, -.3, .5, -.6, 0], [.3, .92, -.22, .38, -.45, -.35], [.15, .7, -.38, .3, -.9, -.2], [-.18, .66, -.4, .28, -.9, .2]].map(([x, y, z, s, rx, rz]) => X(U.oct, [x, y, z], [rx, 0, rz], [s * .28, s, s * .28]))), cry);
    P(torso, U.oct, cryS, [0, .45, .4], [.12, .16, .06]);
    const head = grp(torso, 0, .88, .2);
    P(head, U.dod, rock, [0, .06, 0], [.2, .18, .2]);
    P(head, merged('malEyes', () => [-1, 1].map(sx => X(U.box, [sx * .08, .07, .17], [0, 0, sx * -.25], [.09, .03, .03]))), glow(0x7ffff0, 3.5));
    P(head, U.pyr, rock, [0, .2, -.02], [.14, .2, .14], [0, .78, 0]);
    const arm = [], fore = [], hand = [];
    for (const sx of [-1, 1]) {
      const a = grp(torso, sx * .62, .62, 0); a.rotation.z = sx * .18;
      P(a, U.dod, rock, [sx * .05, .02, 0], [.3, .26, .3]);
      P(a, merged('malSh' + sx, () => [X(U.oct, [sx * .12, .25, -.05], [0, 0, -sx * .4], [.07, .25, .07]), X(U.oct, [sx * .22, .16, .05], [0, 0, -sx * .9], [.05, .18, .05])]), cry);
      P(a, U.ico, dark, [0, -.25, 0], [.17, .22, .17]);
      const f = grp(a, 0, -.42, 0); f.rotation.x = -.35; P(f, U.dod, rock, [0, -.12, 0], [.2, .24, .2]);
      const hd = grp(f, 0, -.36, .02); P(hd, U.dod, dark, [0, -.06, 0], [.27, .25, .27]);
      arm.push(a); fore.push(f); hand.push(hd);
    }
    const rig = { type: 'hum', root, body, hips, torso, chest, head, legL: leg[0], legR: leg[1], kneeL: knee[0], kneeR: knee[1], armL: arm[0], armR: arm[1], foreL: fore[0], foreR: fore[1], handL: hand[0], handR: hand[1], style: 'slam', hs: 1, b: 1.6, heavy: true, theme: 0x45e0c4 };
    return { g, rig, s: 1 };
  },
  soraka(Up) {
    const teal = cloth(0x2f9a86), gold = gld(Up), white = M(0xf2f0ea, { r: .7 }), skinC = 0xb9a3ee;
    const h = humanoid({ bulk: .86, head: 1.05, leg: 1.04, skin: skinC, topM: teal, sleeveM: white, foreM: M(skinC, { r: .62 }), thighM: teal, shinM: M(skinC, { r: .62 }), bootM: gold, beltM: gold, style: 'cast', eyeM: M(0x2a8a6a, { r: .3, e: .4, ec: 0x2fd0a0 }) });
    const r = h.rig, hs = r.hs;
    skirt(r, M(0x2f9a86, { r: .85, ds: 1 }), 'soraka', [[.42, -.72], [.33, -.4], [.23, -.06], [.18, .1]], gold);
    P(r.torso, merged('sorCollar', () => [X(U.ring, [0, .43, 0], [PI / 2, 0, 0], [.2, .17, 1.4]), X(U.oct, [0, .33, .16], [0, 0, 0], [.05, .08, .03])]), gold);
    P(r.torso, U.cyl, white, [0, .12, 0], [.19, .1, .145]);
    const hw = hairM(0xf4f1ff); hairCap(r, hw, { tilt: -.5 }); bangs(r, hw, 6, { len: .15 });
    r.tails = [P(r.head, tube('sorhair', [[0, .3, -.15], [0, .1, -.3], [0, -.2, -.33], [0, -.55, -.3], [0, -.85, -.36]], taper(.19, .06, .06, 12), 20, 9), hw)];
    P(r.head, merged('sorEars', () => [-1, 1].map(sx => X(U.cone, [sx * .27, .22, -.02], [0, 0, -sx * 1.25], [.04, .18, .025]))), M(skinC, { r: .62 }));
    P(r.head, tube('sorhorn', [[0, .3, .2], [0, .46, .3], [0, .64, .31], [0, .82, .24], [0, .9, .16]], taper(.075, .006, .12, 40), 22, 8), M(0xffe9b0, { r: .3, m: .3, e: Up ? 1.4 : .6, ec: 0xffc860 }));
    // bastón media luna
    const st = grp(r.handR, 0, -.03, 0);
    P(st, U.cyl, gold, [0, .3, 0], [.026, 1.5, .026]);
    P(st, cg('moon', () => new THREE.TorusGeometry(.2, .035, 6, 22, 4.3)), gold, [0, 1.2, 0], 1, [0, 0, -2.15 + PI]);
    const star = P(st, U.oct, glow(0xbffff0, Up ? 3.5 : 2.6), [0, 1.2, 0], [.06, .1, .06]); P(st, U.sph, M(0x9fffe0, { e: 2, ec: 0x6fffd0, t: .3, add: 1 }), [0, 1.2, 0], .14);
    r.pulse = [star]; r.weapon = st;
    r.armR.rotation.set(-.3, 0, .2); r.foreR.rotation.x = -.75; staffUpright(r, st);
    r.theme = 0x8affd8;
    return h;
  },
  darius(Up) {
    const iron = metal(0x3b3f4a, .4), red = cloth(0x8c1b1b, 1), steel = metal(0x9aa0ab, .3), gold = gld(Up), leather = M(0x2a1a14, { r: .7 });
    const h = humanoid({ bulk: 1.32, head: .98, skin: 0xd2a07c, topM: iron, sleeveM: cloth(0x5a1212), foreM: iron, handM: leather, thighM: cloth(0x221418), shinM: iron, bootM: iron, beltM: M(0x6a5a3a, { m: .8, r: .35 }), hipM: cloth(0x221418) });
    const r = h.rig, hs = r.hs;
    P(r.torso, U.sph, steel, [0, .32, .05], [.25, .19, .13]);
    P(r.torso, merged('darChest', () => [X(U.pyr, [0, .3, .19], [PI / 2, 0, 0], [.07, .05, .1]), X(U.ring, [0, .45, 0], [PI / 2, 0, 0], [.18, .15, 1.6])]), Up ? gold : steel);
    for (const [a, sx] of [[r.armL, -1], [r.armR, 1]]) {
      const pg = pauldron(a, sx, iron, steel, .33, .22, { layer: M(0x6a1515, { m: .5, r: .45 }), tilt: .3 });
      P(pg, merged('darSpk', () => [X(U.cone, [0, .18, -.08], [-.3, 0, 0], [.055, .34, .055]), X(U.cone, [.12, .12, .08], [.3, 0, -.6], [.045, .26, .045]), X(U.cone, [-.12, .12, .08], [.3, 0, .6], [.045, .24, .045])]), Up ? gold : steel);
    }
    P(r.hips, U.rbox, red, [0, -.22, .14], [.24, .42, .03]); P(r.hips, U.rbox, red, [0, -.22, -.14], [.24, .42, .03]);
    const hm = hairM(0x2a1d18); hairCap(r, hm, { tilt: -.65, h: .8 });
    P(r.head, U.sph, hm, [0, .08, .06], [.21, .13, .19]); brows(r, hm, .38);
    P(r.head, U.sph, M(0xd2a07c, { r: .62 }), [0, .15, .2], [.12, .06, .06]);
    cape(r, red, { rT: .33, rM: .38, rB: .48, l1: .55, l2: .74, arc: 2.6, trim: Up ? gold : null });
    // hacha noxiana
    const ax = grp(r.handR, 0, -.03, 0);
    P(ax, U.cyl, leather, [0, 0, .35], [.04, 1.75, .04], [PI / 2, 0, 0]);
    P(ax, merged('darWrap', () => [0, 1, 2].map(i => X(U.cyl, [0, 0, -.15 + i * .28], [PI / 2, 0, 0], [.05, .06, .05]))), red);
    P(ax, U.cone, steel, [0, 0, -.6], [.05, .14, .05], [-PI / 2, 0, 0]);
    const bladeG = ext('darBlade', s => { s.moveTo(-.02, .95); s.lineTo(.18, .9); s.quadraticCurveTo(.45, .78, .68, .5); s.quadraticCurveTo(.9, 1.2, .7, 1.9); s.quadraticCurveTo(.45, 1.62, .18, 1.55); s.lineTo(-.02, 1.5); s.lineTo(-.02, .95); }, .05, .02);
    P(ax, bladeG, metal(0x5d6370, .32));
    P(ax, ext('darEdge', s => { s.moveTo(.58, .52); s.quadraticCurveTo(.85, 1.2, .62, 1.85); s.quadraticCurveTo(.8, 1.2, .66, .53); }, .06, .006), Up ? glow(0xff3a2a, 2.5) : metal(0xd8dde6, .18));
    P(ax, ext('darBack', s => { s.moveTo(0, 1.05); s.lineTo(-.4, 1.2); s.lineTo(0, 1.42); }, .06, .015), metal(0x5d6370, .32));
    P(ax, U.cone, steel, [0, 0, 1.68], [.05, .25, .05], [PI / 2, 0, 0]);
    r.weapon = ax; r.armR.rotation.set(-.15, 0, .3); r.foreR.rotation.x = -1.0; ax.rotation.set(-.42, 0, 0);
    r.style = 'swing'; r.holdR = true; r.theme = 0xff3a2a;
    return h;
  },
  jinx(Up) {
    const skinC = 0xf2dde4, dark = cloth(0x2a2440), pink = M(0xff4fa3, { r: .5 }), blueH = hairM(0x2fc4f0);
    const h = humanoid({ bulk: .84, head: 1.1, leg: 1.05, skin: skinC, topM: M(skinC, { r: .62 }), sleeveM: M(skinC, { r: .62 }), handM: M(0x2b2b3a, { r: .7 }), thighM: dark, shinM: M(0x3a2c48, { r: .75 }), bootM: M(0x3a2c48, { r: .7 }), beltM: pink, hipM: dark, style: 'gun', eyeM: M(0xff4fa3, { r: .3, e: .9, ec: 0xff2a8a }) });
    const r = h.rig, hs = r.hs;
    P(r.torso, U.sph, dark, [0, .33, .025], [.215, .11, .155]);
    P(r.torso, merged('jinxAmmo', () => [-2, -1, 0, 1, 2].map(i => X(U.cyl, [Math.sin(i * .35) * .2, -.01, Math.cos(i * .35) * .15], [PI / 2, i * .35, 0], [.02, .06, .02]))), gld(Up));
    hairCap(r, blueH, { tilt: -.5 }); bangs(r, blueH, 6, { len: .17, spread: 1.05 });
    const braidPts = sx => [[sx * .17, .32, -.12], [sx * .3, .16, -.2], [sx * .33, -.2, -.26], [sx * .3, -.65, -.32], [sx * .26, -1.05, -.44], [sx * .2, -1.3, -.66], [sx * .14, -1.38, -.95]];
    r.braids = [-1, 1].map(sx => { const bg = grp(r.head, 0, 0, 0); P(bg, tube('jinxbraid' + sx, braidPts(sx), taper(.07, .025, .28, 46), 46, 7), blueH); P(bg, U.sph, pink, [sx * .14, -1.38, -.95], .035); return bg; });
    // Fishbones
    const lz = grp(r.torso, .4, .2, .02); r.launcher = lz;
    const fbM = M(0x5d7d9c, { m: .45, r: .45 }), teeth = M(0xf4f0e6, { r: .4 });
    P(lz, lathe('fishbody', [[.02, -.62], [.12, -.52], [.18, -.2], [.2, .15], [.22, .38], [.24, .45]]), fbM, [0, 0, .05], 1, [PI / 2, 0, 0]);
    P(lz, U.sph, M(0x1a0f18, { r: .9 }), [0, 0, .44], [.2, .2, .08]);
    P(lz, merged('fishTeeth', () => { const o = []; for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; o.push(X(U.cone, [Math.cos(a) * .2, Math.sin(a) * .2, .5], [0, 0, a - PI / 2], [.035, .11, .03])); } return o.map(gm => gm); }), teeth);
    P(lz, merged('fishFins', () => [X(U.pyr, [0, .24, -.05], [-.5, 0, 0], [.03, .26, .14]), X(U.pyr, [.17, -.1, -.4], [0, 0, -2.2], [.02, .2, .1]), X(U.pyr, [-.17, -.1, -.4], [0, 0, 2.2], [.02, .2, .1]), X(U.pyr, [0, .12, -.6], [-1.1, 0, 0], [.02, .22, .12])]), fbM);
    P(lz, merged('fishEyes', () => [-1, 1].map(sx => X(U.sph, [sx * .17, .08, .3], [0, 0, 0], .04))), glow(0xff3a6a, 3));
    P(lz, merged('fishPaint', () => [X(U.ring, [0, 0, .1], [0, 0, 0], [.205, .205, 1.2]), X(U.ring, [0, 0, -.1], [0, 0, 0], [.19, .19, 1.2])]), pink);
    if (Up) P(lz, U.sph, M(0xff4fa3, { e: 2, ec: 0xff4fa3, t: .4, add: 1 }), [0, 0, .45], .16);
    r.weapon = lz;
    r.armR.rotation.set(-.35, 0, .3); r.foreR.rotation.x = -.9; r.armL.rotation.set(-.9, -.3, -.1); r.foreL.rotation.x = -.7;
    r.holdR = r.holdL = true; r.theme = 0xff4fa3;
    return h;
  },
  leona(Up) {
    const goldA = M(0xe0a63a, { m: .88, r: .28, e: Up ? .25 : 0, ec: 0xff9a20 }), gold = gld(Up), red = cloth(0x8a2a14, 1), white = M(0xf3ead6, { r: .6 });
    const h = humanoid({ bulk: 1.1, skin: 0xc58d62, topM: goldA, sleeveM: cloth(0x6a2210), foreM: goldA, handM: goldA, thighM: cloth(0x5a2010), shinM: goldA, bootM: goldA, beltM: white, hipM: cloth(0x5a2010) });
    const r = h.rig, hs = r.hs;
    skirt(r, red, 'leona', [[.3, -.3], [.26, -.15], [.2, .04]], gold);
    P(r.torso, merged('leoSun', () => { const o = [X(U.cyl, [0, .32, .17], [PI / 2, 0, 0], [.07, .02, .07])]; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; o.push(X(U.pyr, [Math.cos(a) * .1, .32 + Math.sin(a) * .1, .165], [0, 0, a - PI / 2], [.02, .07, .01])); } return o; }), glow(0xfff0b0, Up ? 2.5 : 1.4));
    pauldron(r.armL, -1, goldA, white, .25, .17, { tilt: .4, layer: goldA }); pauldron(r.armR, 1, goldA, white, .25, .17, { tilt: .4, layer: goldA });
    const hb = hairM(0x7a3416); hairCap(r, hb, { tilt: -.5 }); bangs(r, hb, 5, { len: .12 });
    r.tails = [P(r.head, tube('leohair', [[0, .3, -.16], [0, .05, -.3], [0, -.3, -.3], [0, -.62, -.32]], taper(.17, .06, .05, 10), 18, 9), hb)];
    P(r.head, merged('leoCrown', () => { const o = [X(U.ring, [0, .3, .02], [PI / 2 - .45, 0, 0], [.27, .26, .5])]; for (let i = 0; i < 7; i++) { const a = (i / 6 - .5) * 1.9; o.push(X(U.pyr, [Math.sin(a) * .24, .4 + Math.cos(a) * .06, Math.cos(a) * .15], [-.25 * Math.cos(a), 0, -a * .9], [.03, .2 - Math.abs(a) * .05, .015])); } return o; }), gold);
    // gran escudo solar
    const sh = grp(r.handL, -.06, -.08, .05); sh.rotation.set(PI, 0, .45); sh.scale.setScalar(.82);
    P(sh, lathe('leoShield', [[0, .1], [.25, .085], [.45, .045], [.56, 0], [.58, -.03], [.0, -.03]]), goldA);
    P(sh, merged('leoRays', () => { const o = []; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; o.push(X(U.pyr, [Math.cos(a) * .64, 0, Math.sin(a) * .64], [PI / 2, 0, -a + PI / 2], [.06, .2, .02], 1)); } return o; }), gold);
    P(sh, U.ring, metal(0xfff0c0, .2), [0, .06, 0], [.4, .4, .8], [PI / 2, 0, 0]);
    const core = P(sh, U.sph, glow(0xfff2b0, Up ? 3.2 : 2.2), [0, .1, 0], [.16, .06, .16]);
    r.shield = sh; r.pulse = [core];
    r.weapon = sword(r.handR, { len: .95, w: .14, blade: metal(0xf4dc95, .2), guard: gold, grip: M(0x5a2a10, { r: .7 }), glow: Up ? 0xffe680 : 0 });
    r.armR.rotation.set(-.2, 0, .2); r.foreR.rotation.x = -.6; r.weapon.rotation.x = .3;
    r.armL.rotation.set(-.35, .2, -.3); r.foreL.rotation.x = -1.05;
    r.style = 'swing'; r.holdR = true; r.holdL = true; r.theme = 0xffc040;
    return h;
  },
  teemo(Up) {
    const furC = 0xd3995a, fur = M(furC, { r: .9 }), green = cloth(0x5b7d2c), brown = M(0x6a4526, { r: .75 }), cream = M(0xf3e1c0, { r: .85 });
    const h = humanoid({ bulk: .95, head: 1.6, leg: .62, skin: furC, topM: green, sleeveM: green, foreM: fur, handM: fur, thighM: brown, shinM: fur, bootM: M(0x4a3020, { r: .7 }), beltM: brown, style: 'blow', eyeM: M(0x15101c, { r: .2 }) });
    const r = h.rig, hs = r.hs; r.root.scale.setScalar(.7);
    P(r.head, U.sph, cream, [0, .13 * hs, .12 * hs], [.17 * hs, .12 * hs, .14 * hs]);
    P(r.head, U.sph, M(0x2a1a14, { r: .4 }), [0, .17 * hs, .26 * hs], [.035 * hs, .025 * hs, .02 * hs]);
    P(r.head, merged('teemoShine', () => [-1, 1].map(sx => X(U.sphL, [sx * .08 * hs, .21 * hs, .25 * hs], [0, 0, 0], .012 * hs))), M(0xffffff, { e: .6, ec: 0xffffff }));
    P(r.head, merged('teemoEars', () => [-1, 1].map(sx => X(U.cone, [sx * .32 * hs, .26 * hs, -.03], [0, 0, -sx * 1.25], [.08 * hs, .32 * hs, .035 * hs]))), fur);
    P(r.head, merged('teemoEarIn', () => [-1, 1].map(sx => X(U.cone, [sx * .33 * hs, .265 * hs, -.01], [0, 0, -sx * 1.25], [.05 * hs, .24 * hs, .02 * hs]))), M(0xe8a07a, { r: .85 }));
    const hat = M(0x6e8a34, { r: .85, ds: 1 });
    P(r.head, lathe('teemoHat', [[.0, .0], [.38, -.005], [.4, .02], [.3, .04], [.25, .1], [.23, .2], [.15, .26], [0, .28]]), hat, [0, .33 * hs, -.02], [hs, hs, hs], [-.12, 0, 0]);
    P(r.head, U.cyl, brown, [0, .4 * hs, -.03], [.24 * hs, .05 * hs, .24 * hs], [-.12, 0, 0]);
    P(r.head, merged('teemoGog', () => [-1, 1].map(sx => X(U.cyl, [sx * .09 * hs, .43 * hs, .23 * hs], [PI / 2 - .3, 0, 0], [.065 * hs, .04, .065 * hs]))), metal(0x8a6a3a, .4));
    P(r.head, merged('teemoLens', () => [-1, 1].map(sx => X(U.sph, [sx * .09 * hs, .435 * hs, .25 * hs], [0, 0, 0], [.05 * hs, .05 * hs, .02 * hs]))), M(0xffd24a, { m: .3, r: .15, e: .7, ec: 0xffa020 }));
    P(r.torso, U.rbox, brown, [0, .26, -.2], [.3, .32, .16]);
    P(r.torso, U.sph, M(0xc8302a, { r: .6 }), [.06, .5, -.22], [.11, .07, .11]);
    P(r.torso, merged('teemoMush', () => [X(U.cyl, [.06, .43, -.22], [0, 0, 0], [.03, .1, .03]), X(U.sph, [.02, .53, -.15], [0, 0, 0], .018), X(U.sph, [.11, .53, -.28], [0, 0, 0], .018), X(U.sph, [.1, .55, -.17], [0, 0, 0], .015)]), M(0xffffff, { r: .7 }));
    const bg = grp(r.handR, 0, -.03, 0);
    P(bg, U.cyl, M(0x7a5530, { r: .6 }), [0, 0, .32], [.022, .95, .022], [PI / 2, 0, 0]);
    P(bg, merged('teemoBg', () => [X(U.cyl, [0, 0, .78], [PI / 2, 0, 0], [.03, .05, .03]), X(U.cyl, [0, 0, -.12], [PI / 2, 0, 0], [.03, .07, .03]), X(U.cyl, [0, 0, .3], [PI / 2, 0, 0], [.028, .04, .028])]), gld(Up));
    if (Up) P(bg, U.sph, glow(0x9be564, 3), [0, 0, .82], .04);
    r.weapon = bg; r.armR.rotation.set(-.3, 0, .2); r.foreR.rotation.x = -1.1; bg.rotation.x = 1.5;
    r.holdR = true; r.theme = 0x9be564;
    return h;
  },
  yasuo(Up) {
    const tun = cloth(0x2c6a8c), navy = cloth(0x1d2a40), sash = cloth(0x8a2b23), wrap = M(0xd9d0bc, { r: .85 }), steel = metal(0x7d8fa6, .35), gold = gld(Up);
    const h = humanoid({ bulk: 1.05, skin: 0xe3bc95, topM: tun, sleeveM: tun, foreM: wrap, handM: M(0x3a2a20, { r: .7 }), thighM: navy, shinM: wrap, bootM: M(0x2a2420, { r: .7 }), beltM: sash, hipM: navy });
    const r = h.rig, hs = r.hs;
    P(r.torso, U.sph, M(0xe3bc95, { r: .62 }), [0, .34, .1], [.11, .15, .08]);
    P(r.hips, lathe('yasHakama', [[.27, -.36], [.24, -.18], [.2, .04]]), M(0x1d2a40, { r: .85, ds: 1 }));
    const pg = pauldron(r.armL, -1, metal(0x9fb2c8, .3), gold, .27, .15, { tilt: .45, layer: metal(0x6d819c, .35) });
    P(pg, U.cyl, sash, [0, -.02, 0], [.32, .04, .3]);
    P(r.torso, U.ring, sash, [0, .3, 0], [.25, .18, 1.2], [PI / 2, 0, -.7]);
    const hk = hairM(0x1b1a22); hairCap(r, hk, { tilt: -.5, w: 1.04 }); bangs(r, hk, 6, { len: .17, spread: 1.1 }); brows(r, hk, .3);
    r.tails = [P(r.head, tube('yasPony', [[0, .42, -.12], [0, .48, -.3], [0, .32, -.48], [0, .05, -.55], [0, -.3, -.52], [0, -.5, -.6]], taper(.13, .03, .2, 18), 22, 8), hk)];
    P(r.head, U.sph, sash, [0, .43, -.15], .06);
    // katana + vaina
    const kat = grp(r.handR, 0, -.03, 0);
    P(kat, U.cyl, M(0x2a1a1a, { r: .6 }), [0, 0, -.06], [.026, .34, .026], [PI / 2, 0, 0]);
    P(kat, U.cyl, gold, [0, 0, .13], [.07, .02, .07], [PI / 2, 0, 0]);
    P(kat, ext('katBlade', s => { s.moveTo(-.03, 0); s.quadraticCurveTo(-.05, .6, -.0, 1.18); s.lineTo(.03, 1.08); s.quadraticCurveTo(.01, .55, .03, 0); s.lineTo(-.03, 0); }, .02, .006), Up ? M(0xdff6ff, { m: 1, r: .1, e: .8, ec: 0x6fdcff }) : metal(0xeaf2fb, .12), [0, 0, .14]);
    P(r.hips, U.cyl, M(0x2a1a1a, { r: .5 }), [-.24, -.05, .02], [.03, .8, .03], [1.1, 0, .2]);
    const wind = grp(r.root, 0, .9, 0);
    P(wind, cg('yasWind', () => new THREE.TorusGeometry(.62, .01, 5, 40, 2.6)), M(0xd8f6ff, { e: 1.2, ec: 0xbfefff, t: .35, add: 1 }), [0, 0, 0], 1, [PI / 2, 0, 0]);
    P(wind, cg('yasWind2', () => new THREE.TorusGeometry(.5, .008, 5, 40, 2.2)), M(0xd8f6ff, { e: 1.2, ec: 0xbfefff, t: .3, add: 1 }), [0, .35, 0], 1, [PI / 2 + .2, 0, 2]);
    r.wind = wind; r.weapon = kat;
    r.armR.rotation.set(-.15, 0, .3); r.foreR.rotation.x = -.45; kat.rotation.x = 1.15;
    r.style = 'swing'; r.holdR = true; r.theme = 0x9ff0ff;
    return h;
  },
  ezreal(Up) {
    const jack = cloth(0x2d5ba8), white = M(0xe8e4dc, { r: .8 }), pants = cloth(0x6a4a2e), gold = gld(Up), scarf = cloth(0xc0622a, 1);
    const h = humanoid({ bulk: .95, head: 1.06, skin: 0xf2cfae, topM: jack, sleeveM: jack, foreM: jack, handM: M(0x5a3a22, { r: .7 }), thighM: pants, shinM: M(0x4a3020, { r: .7 }), bootM: M(0x4a3020, { r: .7 }), beltM: M(0x3a2a1c, { r: .6 }), style: 'cast', eyeM: M(0x2a5aa8, { r: .3 }) });
    const r = h.rig, hs = r.hs; r.castSide = 'L';
    P(r.torso, U.sph, white, [0, .3, .09], [.12, .17, .09]);
    P(r.hips, lathe('ezCoat', [[.27, -.3], [.23, -.12], [.2, .06]]), M(0x2d5ba8, { r: .85, ds: 1 }));
    P(r.torso, merged('ezTrim', () => [-1, 1].map(sx => X(U.box, [sx * .1, .28, .155], [0, 0, sx * .12], [.025, .36, .02]))), gold);
    P(r.torso, U.ring, scarf, [0, .46, 0], [.16, .14, 2.2], [PI / 2, 0, 0]);
    r.tails = [P(r.torso, tube('ezScarf', [[.08, .46, -.12], [.14, .35, -.22], [.18, .15, -.28], [.2, -.05, -.34]], taper(.06, .04), 12, 6), scarf)];
    const hb = hairM(0xf0cd6a); hairCap(r, hb, { tilt: -.42 });
    P(r.head, merged('ezSpikes', () => { const o = []; for (let i = 0; i < 7; i++) { const a = (i / 6 - .5) * 2.4; o.push(X(U.cone, [Math.sin(a) * .15, .42, Math.cos(a) * .05 - .02], [-.6 + Math.cos(a) * .9, 0, -a * .5], [.08, .26, .06])); } o.push(X(U.cone, [.1, .36, .18], [1.9, 0, -.6], [.07, .2, .05]), X(U.cone, [-.06, .38, .19], [1.9, 0, .4], [.07, .22, .05])); return o; }), hb);
    P(r.head, merged('ezGog', () => [...[-1, 1].map(sx => X(U.cyl, [sx * .09, .37, .2], [PI / 2 - .8, 0, 0], [.06, .05, .06])), X(U.ring, [0, .34, 0], [PI / 2 - .5, 0, 0], [.26, .25, .5])]), M(0x6a4a2a, { m: .5, r: .45 }));
    P(r.head, merged('ezLens', () => [-1, 1].map(sx => X(U.sph, [sx * .09, .39, .22], [PI / 2 - .8, 0, 0], [.045, .02, .045]))), M(0x7fe6ff, { r: .1, e: .6, ec: 0x4fd4ff }));
    // guantelete
    const gt = grp(r.foreL, 0, -.12, 0); gt.scale.setScalar(1.35);
    P(gt, lathe('ezGaunt', [[.06, -.2], [.1, -.15], [.11, .0], [.09, .1]]), metal(0xc9a24a, .3));
    P(gt, merged('ezFins', () => [0, 1, 2].map(i => X(U.pyr, [Math.cos(i * 2.1) * .1, -.05, Math.sin(i * 2.1) * .1], [0, -i * 2.1, 0], [.03, .2, .05]))), metal(0x2d5ba8, .35));
    const gem = P(gt, U.oct, glow(0x5fe0ff, Up ? 4 : 3), [0, -.05, .11], [.05, .07, .04]);
    const palm = P(r.handL, U.sph, M(0x5fe0ff, { e: 2.5, ec: 0x5fe0ff, t: .45, add: 1 }), [0, -.05, .04], .1);
    r.pulse = [gem, palm]; r.weapon = gt;
    r.theme = 0x4fd4ff;
    return h;
  },
};

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

// ═════════════════════════ CRIATURAS ═════════════════════════
const TEAM = { blue: 0x2f74e0, red: 0xd63a30 };
const TEAMGLOW = { blue: 0x7fd0ff, red: 0xffa060 };
function minion(caster, tint) {
  const T = TEAM[tint] ?? TEAM.red, tg = TEAMGLOW[tint] ?? TEAMGLOW.red;
  const team = M(T, { m: .45, r: .42 }), gold = gld(false), steel = metal(0xa3acbc, .32), dark = M(0x2b2f3a, { m: .4, r: .55 });
  const h = humanoid({ bulk: .95, head: 1.05, leg: .82, topM: caster ? cloth(T) : team, sleeveM: dark, foreM: caster ? cloth(T) : steel, handM: dark, thighM: dark, shinM: caster ? dark : team, bootM: caster ? dark : steel, beltM: gold, hipM: dark, noEyes: true, faceM: M(0x3a3640, { r: .7 }), style: caster ? 'cast' : 'swing' });
  const r = h.rig, hs = r.hs; r.root.scale.setScalar(.72);
  const eyes = merged('minEyes', () => [-1, 1].map(sx => X(U.sph, [sx * .08, .2, .24], [0, 0, 0], [.04, .03, .02])));
  if (!caster) {
    P(r.head, U.sph, team, [0, .22, 0], [.29, .29, .29]);
    P(r.head, U.rbox, dark, [0, .2, .17], [.4, .09, .16]);
    P(r.head, eyes, glow(0xffffff, 2.5), [0, 0, .03]);
    P(r.head, U.rbox, gold, [0, .48, -.02], [.05, .14, .36]);
    P(r.head, U.ring, gold, [0, .1, 0], [.29, .29, .6], [PI / 2, 0, 0]);
    P(r.torso, U.sph, team, [0, .3, .045], [.25, .21, .14]); P(r.torso, U.oct, gold, [0, .3, .18], [.05, .07, .02]);
    pauldron(r.armL, -1, team, gold, .17, .11); pauldron(r.armR, 1, team, gold, .17, .11);
    r.weapon = sword(r.handR, { len: .55, w: .12, blade: steel, guard: gold, grip: M(0x3a2414), gripL: .18 });
    r.armR.rotation.set(-.2, 0, .2); r.foreR.rotation.x = -.6; r.weapon.rotation.x = .35;
    const sh = grp(r.foreL, .07, -.15, 0); sh.rotation.z = PI / 2; P(sh, lathe('minShield', [[0, .05], [.2, .04], [.26, 0], [0, -.02]]), team); P(sh, U.ring, gold, [0, .005, 0], [.26, .26, .6], [PI / 2, 0, 0]); P(sh, U.sph, gold, [0, .05, 0], [.06, .03, .06]);
    r.holdR = true;
  } else {
    P(r.head, U.sph, dark, [0, .2, .02], [.26, .26, .26]);
    P(r.head, eyes, glow(tg, 3), [0, 0, .0]);
    P(r.head, lathe('minHood', [[.32, -.04], [.3, .1], [.24, .3], [.14, .5], [.05, .66], [0, .72]]), M(T, { r: .8, ds: 1 }), [0, .15, -.03], 1, [-.2, 0, 0]);
    P(r.head, U.ring, gold, [0, .18, -.03], [.31, .31, .6], [PI / 2 - .2, 0, 0]);
    skirt(r, M(T, { r: .85, ds: 1 }), 'minRobe', [[.3, -.6], [.25, -.3], [.2, .04]], gold);
    P(r.torso, U.rbox, gold, [0, .3, .15], [.06, .3, .03]);
    const st = grp(r.handR, 0, -.03, 0); P(st, U.cyl, M(0x5a3a1e, { r: .7 }), [0, .2, 0], [.025, 1.0, .025]); P(st, U.ring, gold, [0, .74, 0], [.08, .08, 1]);
    const orb = P(st, U.sph, glow(tg, 3), [0, .76, 0], .075); r.pulse = [orb];
    r.armR.rotation.set(-.3, 0, .15); r.foreR.rotation.x = -.7; staffUpright(r, st);
  }
  return h;
}
function superminion(tint) {
  const T = TEAM[tint] ?? TEAM.red, tg = TEAMGLOW[tint] ?? TEAMGLOW.red;
  const team = M(T, { m: .55, r: .38 }), gold = gld(false), steel = metal(0x8a93a6, .35), dark = M(0x262a34, { m: .5, r: .5 });
  const h = humanoid({ bulk: 1.65, head: .85, leg: .85, topM: team, sleeveM: dark, foreM: steel, handM: steel, thighM: dark, shinM: team, bootM: steel, beltM: gold, hipM: dark, noEyes: true, faceM: dark, style: 'slam' });
  const r = h.rig; r.root.scale.setScalar(.78);
  P(r.torso, U.rbox, team, [0, .3, .02], [.6, .44, .38]); P(r.torso, merged('supTrim', () => [X(U.box, [0, .52, .19], [0, 0, 0], [.6, .04, .02]), X(U.oct, [0, .32, .22], [0, 0, 0], [.08, .1, .03])]), gold);
  P(r.torso, U.rbox, glow(tg, 1.6), [0, .2, .21], [.22, .08, .02]);
  P(r.head, U.rbox, team, [0, .2, 0], [.42, .38, .42]); P(r.head, U.box, glow(tg, 3), [0, .2, .21], [.3, .05, .02]);
  P(r.head, merged('supHorns', () => [-1, 1].map(sx => X(tube('supHorn' + sx, [[0, 0, 0], [sx * .12, .1, -.02], [sx * .18, .26, -.08]], taper(.06, .01), 10, 6), [sx * .18, .3, 0]))), gold);
  for (const [a, sx] of [[r.armL, -1], [r.armR, 1]]) { pauldron(a, sx, team, gold, .28, .2, { tilt: .25 }); }
  for (const hd of [r.handL, r.handR]) P(hd, U.rbox, steel, [0, -.06, .02], [.24, .24, .24]);
  P(r.torso, merged('supBack', () => [-1, 0, 1].map(i => X(U.pyr, [i * .18, .5, -.2], [-.5, 0, i * .3], [.05, .3, .05]))), steel);
  return h;
}
function cannonMinion(tint) {
  const T = TEAM[tint] ?? TEAM.red, tg = TEAMGLOW[tint] ?? TEAMGLOW.red;
  const g = new THREE.Group(), root = grp(g), body = grp(root); root.scale.setScalar(.95);
  const team = M(T, { m: .45, r: .42 }), gold = gld(false), iron = metal(0x5a606c, .4), wood = M(0x9a6a3a, { r: .75 });
  P(body, U.rbox, team, [0, .5, -.05], [.75, .3, .95]);
  P(body, U.rbox, wood, [0, .36, -.05], [.8, .08, 1.0]);
  P(body, merged('canTrim', () => [X(U.box, [0, .66, .43], [0, 0, 0], [.76, .04, .03]), X(U.box, [0, .66, -.53], [0, 0, 0], [.76, .04, .03])]), gold);
  const wheels = [];
  for (const sx of [-1, 1]) for (const z of [.28, -.38]) { const w = grp(body, sx * .44, .25, z); P(w, U.cyl, wood, [0, 0, 0], [.25, .08, .25], [0, 0, PI / 2]); P(w, U.ring, iron, [0, 0, 0], [.25, .25, 1.4], [0, PI / 2, 0]); P(w, merged('spokes', () => [0, 1, 2].map(i => X(U.box, [0, 0, 0], [i * PI / 3, 0, 0], [.1, .5, .04]))), iron, [sx * .02, 0, 0]); wheels.push(w); }
  const barrel = grp(body, 0, .75, .05); barrel.rotation.x = -.25;
  P(barrel, lathe('canBarrel', [[.0, -.4], [.2, -.38], [.22, -.1], [.17, .3], [.16, .55], [.2, .6], [.2, .68], [.13, .68]]), iron, [0, 0, 0], 1, [PI / 2, 0, 0]);
  P(barrel, U.ring, gold, [0, 0, .62], [.2, .2, 1.4]); P(barrel, U.ring, gold, [0, 0, .0], [.2, .2, 1.4]);
  P(barrel, U.sph, M(0x140c08), [0, 0, .64], [.13, .13, .04]); P(barrel, U.ring, glow(0xff8a3d, 2.4), [0, 0, .69], [.13, .13, 1]);
  // artillero
  const op = grp(body, 0, .65, -.42);
  P(op, U.sph, team, [0, .25, 0], [.2, .22, .17]);
  const head = grp(op, 0, .55, 0); P(head, U.sph, team, [0, 0, 0], .2); P(head, U.rbox, M(0x2b2f3a), [0, -.02, .12], [.28, .07, .12]); P(head, merged('minEyes2', () => [-1, 1].map(sx => X(U.sph, [sx * .06, -.02, .19], [0, 0, 0], [.03, .022, .015]))), glow(0xffffff, 2.5)); P(head, U.rbox, gold, [0, .18, 0], [.04, .1, .26]);
  const arms = [-1, 1].map(sx => { const a = grp(op, sx * .2, .38, 0); a.rotation.x = -.9; P(a, limb(.06, .05, .3), M(0x2b2f3a, { r: .6 })); return a; });
  return { g, rig: { type: 'cart', root, body, wheels, barrel, head, armL: arms[0], armR: arms[1] }, s: 1 };
}
// ——— golem / bruto genérico (Krug, centinela, brambleback, Cho'Gath) ———
function brute(o) {
  const g = new THREE.Group(), root = grp(g), body = grp(root); root.scale.setScalar(o.s ?? 1);
  const skin = o.skin, dark = o.dark;
  const hips = grp(body, 0, o.hipY ?? .55, 0); P(hips, o.hipGeo ?? U.dod, dark, [0, .02, 0], [.32, .2, .26]);
  const leg = [], knee = [];
  for (const sx of [-1, 1]) { const l = grp(hips, sx * .25, -.02, 0); P(l, o.legGeo ?? U.ico, skin, [0, -.12, 0], [.18, .2, .18]); const k = grp(l, 0, -.26, 0); P(k, o.legGeo ?? U.dod, skin, [0, -.1, .02], [.16, .16, .16]); P(k, U.dod, dark, [0, -.2, .06], [.17, .09, .22]); leg.push(l); knee.push(k); }
  const torso = grp(body, 0, (o.hipY ?? .55) + .06, 0); torso.rotation.x = o.hunch ?? .25;
  P(torso, o.bellyGeo ?? U.ico, o.belly ?? dark, [0, .14, .05], [.36, .28, .32]);
  const chest = P(torso, o.chestGeo ?? U.dod, skin, [0, .48, 0], o.chestS ?? [.62, .46, .46]);
  const head = grp(torso, 0, o.headY ?? .82, o.headZ ?? .3);
  const arm = [], fore = [], hand = [];
  for (const sx of [-1, 1]) {
    const a = grp(torso, sx * (o.shX ?? .62), .6, 0); a.rotation.z = sx * .2;
    P(a, o.shGeo ?? U.dod, skin, [sx * .04, .02, 0], o.shS ?? [.28, .25, .28]);
    P(a, U.ico, dark, [0, -.24, 0], [.15, .22, .15]);
    const f = grp(a, 0, -.42, 0); f.rotation.x = -.4; P(f, o.foreGeo ?? U.dod, skin, [0, -.12, 0], [.19, .23, .19]);
    const hd = grp(f, 0, -.34, .02); P(hd, o.fistGeo ?? U.dod, o.fist ?? dark, [0, -.06, 0], o.fistS ?? [.25, .23, .25]);
    arm.push(a); fore.push(f); hand.push(hd);
  }
  const rig = { type: 'hum', root, body, hips, torso, chest, head, legL: leg[0], legR: leg[1], kneeL: knee[0], kneeR: knee[1], armL: arm[0], armR: arm[1], foreL: fore[0], foreR: fore[1], handL: hand[0], handR: hand[1], style: 'slam', hs: 1, b: 1.6, heavy: true };
  return { g, rig, s: 1 };
}
function krug() {
  const rock = M(0x8a7560, { r: .92, fs: 1 }), dark = M(0x5a4a3e, { r: .95, fs: 1 }), moss = M(0x5f8a3a, { r: .95, fs: 1 }), ember = glow(0xffa040, 2.2);
  const h = brute({ skin: rock, dark, s: 1.05, hunch: .35 });
  const r = h.rig;
  P(r.torso, merged('krugMoss', () => [X(U.ico, [-.2, .85, -.1], [0, 0, 0], [.3, .12, .28]), X(U.ico, [.25, .8, -.05], [.4, 0, 0], [.25, .1, .25]), X(U.ico, [0, .9, -.25], [0, .5, 0], [.3, .12, .2])]), moss);
  P(r.torso, merged('krugCrack', () => [X(U.box, [-.12, .5, .44], [0, 0, .5], [.03, .3, .02]), X(U.box, [.15, .42, .44], [0, 0, -.7], [.03, .25, .02]), X(U.box, [.02, .32, .43], [0, 0, .2], [.02, .2, .02])]), ember);
  P(r.head, U.dod, rock, [0, 0, 0], [.24, .2, .24]);
  P(r.head, merged('krugEyes', () => [-1, 1].map(sx => X(U.sph, [sx * .09, .02, .2], [0, 0, 0], [.045, .035, .02]))), ember);
  P(r.head, U.dod, dark, [0, -.12, .1], [.2, .08, .16]);
  return h;
}
function golemBuff(blue) {
  const skin = blue ? M(0x40619e, { r: .85, fs: 1 }) : M(0x7a3a26, { r: .88, fs: 1 }), dark = blue ? M(0x23365c, { r: .9, fs: 1 }) : M(0x3e1d14, { r: .92, fs: 1 });
  const gc = blue ? 0x5ad8ff : 0xff6a2a;
  const h = brute({ skin, dark, s: 1.0, hunch: .2, chestS: [.66, .5, .46] });
  const r = h.rig;
  P(r.head, U.dod, skin, [0, 0, 0], [.22, .2, .22]);
  P(r.head, merged('buffEyes', () => [-1, 1].map(sx => X(U.sph, [sx * .09, .02, .19], [0, 0, 0], [.05, .04, .02]))), glow(gc, 3.2));
  if (blue) {
    P(r.torso, merged('blueCry', () => [[-.25, .95, -.15, .35, -.3, .4], [0, 1.08, -.2, .5, -.4, 0], [.25, .95, -.15, .35, -.3, -.4], [0, .9, .1, .25, .2, 0]].map(([x, y, z, s, rx, rz]) => X(U.oct, [x, y, z], [rx, 0, rz], [s * .3, s, s * .3]))), glow(0x7fe8ff, 2.2));
    P(r.torso, merged('blueRunes', () => [X(U.box, [0, .5, .46], [0, 0, 0], [.04, .3, .02]), X(U.box, [0, .52, .46], [0, 0, PI / 2], [.04, .24, .02]), X(U.oct, [0, .5, .47], [0, 0, 0], [.08, .08, .02])]), glow(0x5ad8ff, 2.5));
    P(r.head, U.pyr, glow(0x7fe8ff, 1.8), [0, .25, 0], [.06, .2, .06]);
  } else {
    P(r.torso, merged('redThorn', () => { const o = []; for (let i = 0; i < 9; i++) { const a = i * 1.7; o.push(X(U.cone, [Math.cos(a) * .45, .55 + Math.sin(i) * .3, -.2 + Math.sin(a) * .25], [-.8 + Math.sin(i), 0, Math.cos(a) * .6], [.05, .3, .05])); } return o; }), M(0x2a1a10, { r: .7 }));
    P(r.torso, merged('redVines', () => [X(U.ring, [0, .5, 0], [PI / 2, .3, .2], [.62, .44, 1.6]), X(U.ring, [0, .7, 0], [PI / 2, -.4, -.3], [.55, .4, 1.6])]), M(0x3f6a2a, { r: .9 }));
    P(r.torso, U.dod, glow(0xff6a1a, 2.4), [0, .5, .4], [.12, .14, .06]);
    for (const hd of [r.handL, r.handR]) P(hd, U.sph, M(0xff5a1a, { e: 2, ec: 0xff4a0a, t: .35, add: 1 }), [0, -.06, 0], .22);
  }
  return h;
}
function chogath() {
  const skin = M(0x6a3a8e, { r: .6, m: .1 }), dark = M(0x3a1f52, { r: .65 }), bone = M(0xe8dcc4, { r: .45 }), belly = M(0xa07ab8, { r: .7 });
  const h = brute({ skin, dark, belly, s: 1.0, hipY: .6, hunch: .45, chestGeo: U.sph, chestS: [.72, .6, .55], bellyGeo: U.sph, shGeo: U.sph, foreGeo: U.sph, legGeo: U.sph, hipGeo: U.sph, fistGeo: U.sph, fist: skin, fistS: [.18, .16, .18], headY: .95, headZ: .4 });
  const r = h.rig;
  P(r.torso, merged('choSpines', () => { const o = []; for (let i = 0; i < 12; i++) { const row = i % 3, k = Math.floor(i / 3); const x = (row - 1) * .32, y = .45 + k * .17; o.push(X(U.cone, [x, y, -.35 - k * .05], [-1.1 + k * .15, 0, -x * .8], [.06 + k * .01, .4 + k * .06, .06 + k * .01])); } return o; }), bone);
  P(r.torso, merged('choBelly', () => [0, 1, 2].map(i => X(U.sph, [0, .2 + i * .17, .38 - i * .03], [0, 0, 0], [.32 - i * .03, .07, .12]))), belly);
  P(r.head, U.sph, skin, [0, .1, 0], [.42, .3, .38]);
  const jaw = grp(r.head, 0, -.02, .05); P(jaw, U.sph, dark, [0, -.1, .12], [.36, .14, .3]);
  P(jaw, merged('choTeethL', () => { const o = []; for (let i = 0; i < 7; i++) { const a = (i / 6 - .5) * 2.2; o.push(X(U.cone, [Math.sin(a) * .3, -.02, .12 + Math.cos(a) * .26], [0, 0, 0], [.03, .13, .03])); } return o; }), bone);
  P(r.head, merged('choTeethU', () => { const o = []; for (let i = 0; i < 8; i++) { const a = (i / 7 - .5) * 2.2; o.push(X(U.cone, [Math.sin(a) * .32, -.05, .1 + Math.cos(a) * .28], [PI, 0, 0], [.035, .15, .035])); } return o; }), bone);
  P(r.head, U.sph, glow(0xff3ad6, 1.6), [0, -.06, .18], [.25, .06, .2]);
  P(r.head, merged('choEyes', () => [[-.14, .2, .33], [.14, .2, .33], [-.24, .14, .28], [.24, .14, .28], [-.06, .27, .32], [.06, .27, .32]].map(p => X(U.sph, p, [0, 0, 0], .035))), glow(0xff4fd6, 3.5));
  P(r.head, merged('choCrest', () => [-1, 0, 1].map(i => X(U.cone, [i * .18, .32, -.1], [-.9, 0, -i * .4], [.05, .35, .05]))), bone);
  r.jaw = jaw;
  for (const hd of [r.handL, r.handR]) P(hd, merged('choClaws', () => [-1, 0, 1].map(i => X(tube('choClaw', [[0, 0, 0], [0, -.15, .05], [0, -.28, .15]], taper(.05, .005), 8, 6), [i * .08, -.05, .05], [0, 0, 0]))), bone);
  P(r.hips, tube('choTail', [[0, 0, -.1], [0, -.15, -.5], [0, -.45, -.85], [0, -.55, -1.2]], taper(.2, .03), 16, 8), skin);
  return h;
}
function voidhunter() {
  const chit = M(0x3a2456, { m: .35, r: .38 }), plate = M(0x6b3fa0, { m: .4, r: .35 }), dark = M(0x1e1230, { r: .6 }), gl = glow(0xff4fd6, 3), edge = glow(0xd36bff, 2.5);
  const g = new THREE.Group(), root = grp(g), body = grp(root); root.scale.setScalar(.95);
  const hips = grp(body, 0, .82, 0); P(hips, U.sph, chit, [0, 0, -.02], [.2, .14, .18]);
  const leg = [], knee = [];
  for (const sx of [-1, 1]) {
    const l = grp(hips, sx * .14, -.02, 0); l.rotation.x = -.45; P(l, limb(.1, .07, .3), plate);
    const k = grp(l, 0, -.36, 0); k.rotation.x = 1.0; P(k, limb(.07, .05, .3), chit);
    const ft = grp(k, 0, -.34, 0); ft.rotation.x = -.55; P(ft, merged('vhFoot', () => [-1, 0, 1].map(i => X(U.cone, [i * .05, -.06, .08], [1.4, i * .3, 0], [.03, .18, .03]))), dark);
    leg.push(l); knee.push(k);
  }
  const torso = grp(body, 0, .88, 0); torso.rotation.x = .3;
  P(torso, U.sph, chit, [0, .12, 0], [.18, .17, .15]);
  const chest = P(torso, U.sph, plate, [0, .38, .02], [.27, .22, .2]);
  P(torso, merged('vhRibs', () => [0, 1, 2].map(i => X(U.sph, [0, .12 + i * .1, .1], [0, 0, 0], [.17 - i * .01, .03, .08]))), plate);
  P(torso, merged('vhBack', () => [-1, 1].map(sx => X(ext('vhWing', s => { s.moveTo(0, 0); s.quadraticCurveTo(.35, .4, .25, 1.0); s.quadraticCurveTo(.1, .5, 0, 0); }, .02, .01, 0), [sx * .12, .45, -.15], [-.6, sx * .3, -sx * .3], [sx, 1, 1]))), edge);
  P(torso, merged('vhSpk', () => [-1, 0, 1].map(i => X(U.cone, [i * .12, .5, -.17], [-1.2, 0, i * .3], [.04, .3, .04]))), plate);
  const head = grp(torso, 0, .62, .1);
  P(head, U.sph, chit, [0, .05, .06], [.14, .13, .22]);
  P(head, merged('vhCrest', () => [-1, 1].map(sx => X(tube('vhCrest' + sx, [[0, 0, 0], [sx * .05, .12, -.18], [sx * .09, .18, -.45]], taper(.05, .006), 10, 6), [sx * .06, .12, 0]))), plate);
  P(head, merged('vhEyes', () => [[-.07, .1, .2], [.07, .1, .2], [-.11, .05, .15], [.11, .05, .15]].map(p => X(U.sph, p, [0, 0, 0], .028))), gl);
  P(head, merged('vhMand', () => [-1, 1].map(sx => X(tube('vhMand' + sx, [[0, 0, 0], [sx * .06, -.04, .08], [sx * .02, -.06, .17]], taper(.03, .005), 8, 5), [sx * .06, -.04, .2]))), dark);
  const arm = [], fore = [], hand = [];
  for (const sx of [-1, 1]) {
    const a = grp(torso, sx * .27, .48, 0); a.rotation.z = sx * .2; P(a, limb(.07, .06, .26), plate);
    const f = grp(a, 0, -.3, 0); f.rotation.x = -.9; P(f, limb(.06, .05, .22), chit);
    const hd = grp(f, 0, -.25, 0);
    P(hd, ext('vhScythe', s => { s.moveTo(0, -.05); s.quadraticCurveTo(.25, .3, .12, .85); s.quadraticCurveTo(.05, .4, -.08, .02); s.lineTo(0, -.05); }, .03, .01), chit, [0, 0, 0], 1, [0, 0, 0]);
    P(hd, ext('vhScytheE', s => { s.moveTo(.06, .05); s.quadraticCurveTo(.28, .35, .13, .85); s.quadraticCurveTo(.2, .35, .02, .06); }, .036, .004), edge);
    arm.push(a); fore.push(f); hand.push(hd);
  }
  const rig = { type: 'hum', root, body, hips, torso, chest, head, legL: leg[0], legR: leg[1], kneeL: knee[0], kneeR: knee[1], armL: arm[0], armR: arm[1], foreL: fore[0], foreR: fore[1], handL: hand[0], handR: hand[1], style: 'slam', hs: 1, b: 1, digi: true };
  return { g, rig, s: 1 };
}
// ——— cuadrúpedos ———
function wolf() {
  const g = new THREE.Group(), root = grp(g), body = grp(root);
  const fur = M(0x3e4559, { r: .9 }), lt = M(0x6b7590, { r: .9 }), dark = M(0x1d2130, { r: .9 }), eye = glow(0x8fe8ff, 3.2), claw = M(0xd8d2c4, { r: .5 });
  const torso = grp(body, 0, .62, 0);
  P(torso, U.sph, fur, [0, .02, .18], [.28, .3, .36]);
  P(torso, U.sph, fur, [0, -.02, -.28], [.24, .25, .34]);
  P(torso, U.sph, lt, [0, -.12, .12], [.22, .2, .3]);
  P(torso, merged('wolfMane', () => { const o = []; for (let i = 0; i < 9; i++) { const a = (i / 8 - .5) * 2.6; o.push(X(U.cone, [Math.sin(a) * .22, .22 + Math.cos(a) * .06, .25 - Math.abs(a) * .05], [-1.2, 0, -a * .6], [.07, .3, .05])); } for (let i = 0; i < 4; i++) o.push(X(U.cone, [0, .25, .0 - i * .14], [-1.3, 0, 0], [.05, .2, .04])); return o; }), dark);
  const head = grp(torso, 0, .2, .45);
  P(head, U.sph, fur, [0, .05, 0], [.18, .17, .2]);
  P(head, U.sph, lt, [0, -.02, .2], [.09, .08, .16]);
  P(head, U.sph, M(0x0e0e14, { r: .3 }), [0, .03, .35], [.04, .03, .03]);
  const jaw = grp(head, 0, -.06, .08); P(jaw, U.sph, lt, [0, -.02, .12], [.07, .04, .14]);
  P(jaw, merged('wolfFang', () => [-1, 1].map(sx => X(U.cone, [sx * .04, .03, .22], [0, 0, 0], [.012, .05, .012]))), claw);
  P(head, merged('wolfEars', () => [-1, 1].map(sx => X(U.pyr, [sx * .1, .23, -.04], [-.2, 0, -sx * .25], [.07, .17, .05]))), fur);
  P(head, merged('wolfEyes', () => [-1, 1].map(sx => X(U.sph, [sx * .085, .08, .16], [0, 0, 0], [.03, .022, .02]))), eye);
  const legs = [];
  for (const [x, z, f] of [[-.15, .32, 1], [.15, .32, 1], [-.15, -.4, 0], [.15, -.4, 0]]) {
    const l = grp(torso, x, -.05, z); P(l, limb(.075, .055, .26), f ? fur : fur, [0, 0, 0]);
    if (!f) P(l, U.sph, fur, [0, -.05, -.02], [.1, .18, .14]);
    const k = grp(l, 0, -.3, 0); k.rotation.x = f ? 0 : .5; P(k, limb(.05, .04, .2), dark);
    const paw = grp(k, 0, -.24, 0); paw.rotation.x = f ? 0 : -.5; P(paw, U.sph, dark, [0, -.02, .04], [.06, .035, .09]);
    l.userData.knee = k; legs.push(l);
  }
  const tail = grp(torso, 0, .1, -.6); P(tail, tube('wolfTail', [[0, 0, 0], [0, .1, -.2], [0, .05, -.45], [0, -.12, -.62]], spindle(.11, .03), 14, 7), fur);
  return { g, rig: { type: 'quad', root, body, torso, head, jaw, legs, tail }, s: 1 };
}
function gromp() {
  const g = new THREE.Group(), root = grp(g), body = grp(root);
  const skin = M(0x5f9440, { r: .75 }), belly = M(0xd8d07a, { r: .8 }), wart = M(0xb6d85a, { r: .7 }), dark = M(0x2d4a1e, { r: .8 });
  const torso = grp(body, 0, .55, 0);
  P(torso, U.sph, skin, [0, .05, -.05], [.62, .5, .62]);
  P(torso, U.sph, belly, [0, -.08, .2], [.48, .38, .42]);
  P(torso, merged('grompWarts', () => { const o = []; for (let i = 0; i < 14; i++) { const a = i * 2.4, e = .3 + (i % 5) * .15; o.push(X(U.sph, [Math.cos(a) * .55 * Math.cos(e), .1 + Math.sin(e) * .45, -.1 + Math.sin(a) * .5 * Math.cos(e)], [0, 0, 0], .05 + (i % 3) * .02)); } return o; }), wart);
  P(torso, merged('grompFins', () => [-1, 0, 1].map(i => X(U.pyr, [i * .2, .55, -.25], [-.4, 0, i * .3], [.06, .22, .12]))), dark);
  const head = grp(torso, 0, .15, .45);
  P(head, U.sph, skin, [0, 0, 0], [.42, .26, .3]);
  const jaw = grp(head, 0, -.06, -.05); P(jaw, U.sph, belly, [0, -.06, .1], [.4, .14, .26]);
  P(head, cg('grompMouth', () => new THREE.TorusGeometry(.38, .018, 5, 24, PI)), M(0x2a1a14), [0, -.06, .06], [1, .7, 1], [PI / 2, 0, 0]);
  P(head, merged('grompEyeB', () => [-1, 1].map(sx => X(U.sph, [sx * .22, .2, .05], [0, 0, 0], .13))), M(0xffe36a, { r: .3, e: .3, ec: 0xffd030 }));
  P(head, merged('grompPupil', () => [-1, 1].map(sx => X(U.sph, [sx * .25, .22, .16], [0, 0, 0], [.03, .07, .03]))), M(0x111111));
  const legs = [];
  for (const [x, z, f] of [[-.4, .3, 1], [.4, .3, 1], [-.5, -.25, 0], [.5, -.25, 0]]) {
    const l = grp(torso, x, -.15, z);
    if (f) { P(l, limb(.09, .07, .2), skin); P(l, U.sph, skin, [0, -.3, .06], [.1, .04, .12]); }
    else { P(l, U.sph, skin, [0, .05, 0], [.2, .22, .28]); P(l, U.sph, skin, [0, -.33, .12], [.13, .05, .2]); }
    legs.push(l);
  }
  return { g, rig: { type: 'quad', root, body, torso, head, jaw, legs, hop: true }, s: 1 };
}
function raptor() {
  const g = new THREE.Group(), root = grp(g), body = grp(root);
  const red = M(0xc23a24, { r: .7 }), dark = M(0x4a1a12, { r: .8 }), beak = M(0xf2c24a, { r: .45 }), cream = M(0xf0d6a8, { r: .8 });
  const torso = grp(body, 0, .78, 0); torso.rotation.x = -.15;
  P(torso, U.sph, red, [0, 0, 0], [.25, .25, .38]); P(torso, U.sph, cream, [0, -.08, .1], [.18, .16, .28]);
  P(torso, merged('rapBack', () => { const o = []; for (let i = 0; i < 5; i++) o.push(X(U.pyr, [0, .2, .2 - i * .12], [-.9, 0, 0], [.04, .18 - i * .02, .08])); return o; }), dark);
  const neck = grp(torso, 0, .1, .3); neck.rotation.x = .5; P(neck, limb(.09, .07, .26), red, [0, 0, 0], 1, [PI, 0, 0]);
  const head = grp(neck, 0, .32, .02); head.rotation.x = -.5;
  P(head, U.sph, red, [0, 0, 0], [.13, .12, .15]);
  P(head, U.cone, beak, [0, -.03, .2], [.07, .22, .06], [PI / 2 + .15, 0, 0]);
  const jaw = grp(head, 0, -.06, .05); P(jaw, U.cone, beak, [0, 0, .12], [.04, .14, .03], [PI / 2 + .25, 0, 0]);
  P(head, merged('rapEyes', () => [-1, 1].map(sx => X(U.sph, [sx * .09, .04, .06], [0, 0, 0], .025))), glow(0xffe060, 2.5));
  P(head, merged('rapCrest', () => [0, 1, 2, 3].map(i => X(U.pyr, [0, .08 + i * .015, -.05 - i * .06], [-1.2 - i * .15, 0, 0], [.025, .2 - i * .02, .05]))), M(0xffb030, { r: .6 }));
  const wings = [-1, 1].map(sx => { const w = grp(torso, sx * .22, .05, .05); P(w, merged('rapWing', () => [0, 1, 2].map(i => X(U.pyr, [0, -.02 * i, -.08 * i], [1.2 + i * .2, 0, 0], [.03, .3 - i * .05, .07]))), dark); return w; });
  const tail = grp(torso, 0, .03, -.32); P(tail, tube('rapTail', [[0, 0, 0], [0, .03, -.25], [0, .08, -.5]], taper(.13, .03), 10, 7), red);
  P(tail, merged('rapTailF', () => [-1, 0, 1].map(i => X(U.pyr, [i * .05, .08, -.55], [-1.4, 0, i * .4], [.025, .25, .06]))), dark);
  const leg = [], knee = [];
  for (const sx of [-1, 1]) {
    const l = grp(torso, sx * .15, -.12, -.02); l.rotation.x = -.5; P(l, limb(.1, .07, .22), red);
    const k = grp(l, 0, -.28, 0); k.rotation.x = 1.0; P(k, limb(.05, .04, .26), beak);
    const ft = grp(k, 0, -.3, 0); ft.rotation.x = -.5; P(ft, merged('rapToes', () => [-1, 0, 1].map(i => X(U.cone, [i * .04, -.02, .07], [PI / 2, i * .4, 0], [.02, .14, .02]))), dark);
    leg.push(l); knee.push(k);
  }
  return { g, rig: { type: 'bird', root, body, torso, neck, head, jaw, legL: leg[0], legR: leg[1], kneeL: knee[0], kneeR: knee[1], wings, tail }, s: 1 };
}
function scuttle() {
  const g = new THREE.Group(), root = grp(g), body = grp(root);
  const shell = M(0x3aa59a, { r: .5, m: .1 }), rim = M(0xa8e6d0, { r: .6 }), under = M(0xe8dcc0, { r: .8 }), leg = M(0x2a5a64, { r: .6 });
  const torso = grp(body, 0, .45, 0);
  P(torso, lathe('scutShell', [[.55, 0], [.52, .1], [.42, .22], [.25, .3], [0, .33]]), shell);
  P(torso, U.ring, rim, [0, 0, 0], [.55, .55, 1.4], [PI / 2, 0, 0]);
  P(torso, U.sph, under, [0, -.03, 0], [.5, .1, .5]);
  P(torso, ext('scutFin', s => { s.moveTo(-.35, 0); s.quadraticCurveTo(0, .4, .35, 0); }, .03, .01, 0), M(0xf2a65a, { r: .6 }), [0, .27, 0], 1, [0, PI / 2, 0]);
  const head = grp(torso, 0, .05, .45);
  P(head, merged('scutStalk', () => [-1, 1].map(sx => X(U.cyl, [sx * .12, .15, 0], [0, 0, -sx * .2], [.025, .3, .025]))), leg);
  P(head, merged('scutEyes', () => [-1, 1].map(sx => X(U.sph, [sx * .15, .3, .02], [0, 0, 0], .06))), M(0xffffff, { r: .3 }));
  P(head, merged('scutPup', () => [-1, 1].map(sx => X(U.sph, [sx * .15, .3, .07], [0, 0, 0], .03))), glow(0x2affd0, 2));
  const legs = [];
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) { const l = grp(torso, sx * .4, -.02, -.25 + i * .22); l.rotation.set(0, sx * (i - 1) * .4, sx * 1.0); P(l, limb(.04, .035, .3), leg); const k = grp(l, 0, -.32, 0); k.rotation.z = -sx * 1.5; P(k, limb(.035, .01, .38), leg); l.userData.sx = sx; legs.push(l); }
  const claws = [-1, 1].map(sx => { const c = grp(torso, sx * .3, 0, .4); P(c, U.sph, shell, [0, 0, .1], [.08, .07, .14]); P(c, U.cone, rim, [0, 0, .25], [.04, .12, .04], [PI / 2, 0, 0]); return c; });
  return { g, rig: { type: 'crab', root, body, torso, head, legs, armL: claws[0], armR: claws[1] }, s: 1 };
}
// ——— vacío ———
function grub() {
  const g = new THREE.Group(), root = grp(g), body = grp(root);
  const chit = M(0x4a2a72, { m: .3, r: .4 }), soft = M(0x8a5ab8, { r: .6 }), gl = glow(0xd06bff, 2.4), eye = glow(0xff4fd6, 3.5), dark = M(0x1e1030, { r: .6 });
  const segs = [];
  for (let i = 0; i < 5; i++) {
    const r0 = .3 - i * .035, s = grp(body, 0, r0 + .02, .1 - i * .32);
    P(s, U.sph, soft, [0, 0, 0], [r0, r0 * .9, r0 * .95]);
    P(s, U.hemi, chit, [0, .02, 0], [r0 * 1.06, r0 * .98, r0 * .9], [-.1, 0, 0]);
    if (i > 0) P(s, U.box, gl, [0, r0 * .93, .0], [r0 * .9, .03, .05]);
    segs.push(s);
  }
  const head = grp(segs[0], 0, .02, .22);
  P(head, U.sph, chit, [0, 0, 0], [.27, .24, .22]);
  P(head, merged('grubEyes', () => [[-.1, .1, .18], [.1, .1, .18], [-.17, .03, .15], [.17, .03, .15], [0, .16, .16]].map(p => X(U.sph, p, [0, 0, 0], .04))), eye);
  const mand = [-1, 1].map(sx => { const m = grp(head, sx * .1, -.08, .15); P(m, tube('grubMand' + sx, [[0, 0, 0], [sx * .08, 0, .1], [sx * .0, 0, .2]], taper(.04, .006), 8, 5), dark); return m; });
  P(segs[1], merged('grubLegs', () => [-1, 1].map(sx => X(U.cone, [sx * .24, -.18, 0], [0, 0, sx * 2.5], [.03, .15, .03]))), dark);
  P(segs[2], merged('grubLegs2', () => [-1, 1].map(sx => X(U.cone, [sx * .21, -.16, 0], [0, 0, sx * 2.5], [.03, .14, .03]))), dark);
  return { g, rig: { type: 'worm', root, body, segs, head, mand, small: true }, s: 1 };
}
function herald() {
  const g = new THREE.Group(), root = grp(g), body = grp(root);
  const chit = M(0x4a2d78, { m: .35, r: .4 }), plate = M(0x7a4fb8, { m: .45, r: .32 }), dark = M(0x21143a, { r: .6 }), gl = glow(0xd36bff, 2.6), bone = M(0xe6ddf6, { r: .4 });
  const torso = grp(body, 0, .95, 0);
  P(torso, U.sph, chit, [0, 0, 0], [.8, .55, .78]);
  P(torso, merged('herPlates', () => [0, 1, 2].map(i => X(U.hemi, [0, .18 - i * .05, -.2 - i * .22], [-.3 - i * .25, 0, 0], [.75 - i * .1, .4, .45]))), plate);
  P(torso, merged('herSeams', () => [0, 1].map(i => X(U.ring, [0, .14 - i * .06, -.3 - i * .22], [PI / 2 - .3 - i * .25, 0, 0], [.7 - i * .1, .42, .5]))), gl);
  P(torso, merged('herSpikes', () => { const o = []; for (let i = 0; i < 7; i++) { const x = (i - 3) * .2; o.push(X(U.cone, [x, .45 - Math.abs(x) * .3, -.25 - Math.abs(x) * .1], [-.7, 0, -x * .6], [.07, .45 - Math.abs(x) * .3, .07])); } return o; }), bone);
  const eyeG = grp(torso, 0, .08, .62);
  P(eyeG, U.sph, M(0xf6eefe, { r: .2 }), [0, 0, 0], .33);
  P(eyeG, U.sph, glow(0xb04aff, 2.5), [0, 0, .2], [.2, .2, .16]);
  P(eyeG, U.sph, M(0x0a0612), [0, 0, .32], [.04, .13, .03]);
  P(torso, U.ring, plate, [0, .08, .64], [.36, .36, 1.6]);
  P(torso, merged('herSmallEyes', () => [[-.42, .25, .5], [.42, .25, .5], [-.3, .38, .45], [.3, .38, .45]].map(p => X(U.sph, p, [0, 0, 0], .05))), glow(0xff4fd6, 3));
  const claws = [-1, 1].map(sx => {
    const c = grp(torso, sx * .7, -.15, .4); c.rotation.y = sx * -.3;
    P(c, limb(.12, .1, .3), chit, [0, 0, 0], 1, [-1.3, 0, 0]);
    P(c, ext('herPincer', s => { s.moveTo(0, 0); s.quadraticCurveTo(.3, .35, .05, .85); s.quadraticCurveTo(.05, .4, -.12, .05); s.lineTo(0, 0); }, .12, .03), plate, [0, .05, .3], 1, [0, 0, sx * .2]);
    const low = grp(c, 0, -.08, .3); P(low, ext('herPincerL', s => { s.moveTo(0, 0); s.quadraticCurveTo(-.2, .3, .02, .6); s.quadraticCurveTo(-.05, .3, .1, .02); s.lineTo(0, 0); }, .1, .02), plate, [0, 0, 0], 1, [0, 0, -sx * .4]);
    c.userData.low = low; return c;
  });
  const legs = [];
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) {
    const l = grp(torso, sx * .6, -.2, .15 - i * .35); l.rotation.set(0, sx * (1 - i) * .35, sx * 1.1);
    P(l, limb(.07, .06, .5), chit); const k = grp(l, 0, -.55, 0); k.rotation.z = -sx * 1.9; P(k, limb(.06, .01, .7), plate);
    l.userData.sx = sx; legs.push(l);
  }
  return { g, rig: { type: 'crab', root, body, torso, legs, armL: claws[0], armR: claws[1], eye: eyeG, big: true }, s: 1 };
}
function baron() {
  const g = new THREE.Group(), root = grp(g), body = grp(root);
  const skin = M(0x6a2f9a, { r: .5, m: .15 }), belly = M(0xb88ad8, { r: .65 }), plate = M(0x34184e, { m: .4, r: .35 }), bone = M(0xe9dcc0, { r: .4 }), gl = glow(0xd36bff, 2.6), gold = metal(0xd4a640, .3);
  const path = [[0, .45, -2.5], [0, .52, -2.0], [0, .65, -1.48], [0, .86, -.98], [0, 1.15, -.52], [0, 1.5, -.12], [0, 1.82, .25]], rad = [.36, .48, .58, .64, .64, .6, .54];
  const segs = [];
  path.forEach((p, i) => {
    const s = grp(body, p[0], p[1], p[2]); const r0 = rad[i];
    P(s, U.sph, skin, [0, 0, 0], [r0, r0 * .92, r0 * 1.0]);
    P(s, U.sph, belly, [0, -r0 * .25, r0 * .25], [r0 * .78, r0 * .7, r0 * .8]);
    P(s, merged('barPlate' + i, () => [X(U.hemi, [0, r0 * .12, -r0 * .05], [-.35, 0, 0], [r0 * .9, r0 * .95, r0 * .85]), X(U.cone, [0, r0 * 1.0, -r0 * .2], [-.5, 0, 0], [r0 * .16, r0 * .8, r0 * .16]), X(U.cone, [r0 * .6, r0 * .75, -r0 * .1], [-.3, 0, -.8], [r0 * .1, r0 * .5, r0 * .1]), X(U.cone, [-r0 * .6, r0 * .75, -r0 * .1], [-.3, 0, .8], [r0 * .1, r0 * .5, r0 * .1])]), plate);
    P(s, U.ring, gl, [0, r0 * .1, -r0 * .05], [r0 * .92, r0 * .88, 1.4], [PI / 2 - .35, 0, 0]);
    segs.push(s);
  });
  const head = grp(segs[6], 0, .25, .45);
  P(head, U.sph, skin, [0, 0, 0], [.6, .44, .62]);
  P(head, merged('barCrown', () => [X(U.hemi, [0, .12, -.08], [-.3, 0, 0], [.6, .4, .55]), ...[-2, -1, 0, 1, 2].map(i => X(U.cone, [i * .2, .45 - Math.abs(i) * .06, -.25], [-1.0, 0, -i * .35], [.06, .45 - Math.abs(i) * .06, .06]))]), plate);
  P(head, merged('barHorns', () => [-1, 1].map(sx => X(tube('barHorn' + sx, [[0, 0, 0], [sx * .25, .2, -.15], [sx * .4, .55, -.4], [sx * .3, .85, -.75]], taper(.11, .01), 16, 7), [sx * .38, .2, -.1]))), bone);
  const jaw = grp(head, 0, -.18, .1); P(jaw, U.sph, belly, [0, -.06, .22], [.44, .16, .42]);
  P(head, U.sph, glow(0xff3ad6, 2), [0, -.13, .34], [.36, .09, .26]);
  P(head, merged('barTeeth', () => { const o = []; for (let i = 0; i < 9; i++) { const a = (i / 8 - .5) * 2.4; o.push(X(U.cone, [Math.sin(a) * .38, -.12, .3 + Math.cos(a) * .25], [PI, 0, 0], [.03, .12, .03])); } return o; }), bone);
  P(head, merged('barEyes', () => [[-.24, .12, .5], [.24, .12, .5], [-.36, .08, .4], [.36, .08, .4], [-.14, .2, .52], [.14, .2, .52]].map(p => X(U.sph, p, [0, 0, 0], .038))), glow(0xff4fd6, 3.8));
  const mand = [-1, 1].map(sx => { const m = grp(head, sx * .5, -.12, .25); P(m, tube('barMand' + sx, [[0, 0, 0], [sx * .25, -.05, .2], [sx * .2, -.08, .55], [-sx * .05, -.05, .8]], taper(.09, .01), 16, 7), bone); P(m, tube('barMand2' + sx, [[0, 0, 0], [sx * .18, .05, .15], [sx * .15, .1, .4], [-sx * .02, .12, .55]], taper(.06, .008), 12, 6), gold, [0, .1, -.05]); return m; });
  const tents = [];
  for (let i = 0; i < 6; i++) { const sx = i % 2 ? 1 : -1, k = Math.floor(i / 2); const t = grp(segs[2 + k], sx * rad[2 + k] * .85, .1, 0); P(t, tube('barTent' + (sx > 0 ? 'R' : 'L'), [[0, 0, 0], [sx * .25, .25, -.05], [sx * .35, .6, -.2], [sx * .2, .9, -.35]], taper(.11, .015), 14, 6), skin); t.rotation.z = sx * -.2; tents.push(t); }
  return { g, rig: { type: 'worm', root, body, segs, head, jaw, mand, tents, boss: true }, s: 1 };
}
// ——— dragones ———
const wingInG = L1 => cg('wingIn' + f3(L1), () => { const pts = [[0, .1], [L1, .02], [L1 * .97, -.55], [L1 * .72, -.46], [L1 * .45, -.66], [.12, -.6], [0, -.48]]; const g = new THREE.ShapeGeometry(new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], p[1])))); g.rotateX(PI / 2); const ps = g.attributes.position; for (let i = 0; i < ps.count; i++) ps.setY(i, ps.getZ(i) * .12); g.computeVertexNormals(); return g; });
const WTIPS = [[1.0, .1], [.95, -.4], [.6, -.78], [.15, -.62]];
const wingOutG = () => cg('wingOut', () => { const [f1, f2, f3, f4] = WTIPS; const pts = [[0, .06], [.5, .14], f1, [.62, -.1], f2, [.55, -.42], f3, [.3, -.45], f4, [-.03, -.55]]; const g = new THREE.ShapeGeometry(new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], p[1])))); g.rotateX(PI / 2); const ps = g.attributes.position; for (let i = 0; i < ps.count; i++) ps.setY(i, ps.getZ(i) * .12 - Math.hypot(ps.getX(i), ps.getZ(i)) * .05); g.computeVertexNormals(); return g; });
function drake(o) {
  const g = new THREE.Group(), root = grp(g), body = grp(root); root.scale.setScalar(o.scale ?? 1);
  const skin = M(o.body, { r: .55, m: .15, fs: !!o.rocky }), bel = o.bellyGlow ? M(o.belly, { r: .6, e: .9, ec: o.belly }) : M(o.belly, { r: .7 }), horn = M(o.horn, { r: .4, m: .1, e: o.hornE ?? 0, ec: o.glow }), memb = M(o.wing, { r: .7, ds: true, e: o.wingE ?? 0, ec: o.glow }), eye = glow(o.glow, 3.5), dark = M(o.dark ?? 0x1c1820, { r: .6 });
  const E = o.elem;
  const torso = grp(body, 0, 1.0, 0);
  P(torso, U.sph, skin, [0, 0, -.05], [.46, .42, .72]);
  P(torso, U.sph, bel, [0, -.13, .1], [.36, .3, .6]);
  P(torso, U.sph, skin, [0, .04, .45], [.38, .38, .38]);
  P(torso, merged('drkDorsal' + E, () => { const o2 = []; for (let i = 0; i < 6; i++) o2.push(X(E === 'm' ? U.dod : U.cone, [0, .42 - Math.abs(i - 2) * .02, .55 - i * .24], [-.5, 0, 0], E === 'm' ? [.12, .1, .14] : [.07, .26 - i * .025, .07])); return o2; }), E === 'i' || E === 'e' ? M(o.horn, { r: .4, e: 1.2, ec: o.glow }) : horn);
  // cuello segmentado
  const neck = []; let par = torso; const nrot = [1.05, -.28, -.32, -.3];
  for (let i = 0; i < 4; i++) { const n = grp(par, 0, i === 0 ? .15 : .24, i === 0 ? .6 : 0); n.rotation.x = nrot[i]; P(n, U.sph, skin, [0, .13, 0], [.2 - i * .015, .2, .18 - i * .01]); P(n, U.cone, horn, [0, .16, -.16], [.035, .14, .035], [-1.3, 0, 0]); neck.push(n); par = n; }
  const head = grp(par, 0, .26, .02); head.rotation.x = .35;
  P(head, U.sph, skin, [0, .04, 0], [.22, .18, .25]);
  P(head, U.sph, skin, [0, 0, .3], [.14, .1, .25]);
  P(head, merged('drkBrow', () => [-1, 1].map(sx => X(U.sph, [sx * .12, .12, .12], [0, 0, sx * .3], [.08, .04, .14]))), dark);
  const jaw = grp(head, 0, -.07, .05); P(jaw, U.sph, bel, [0, -.03, .24], [.12, .05, .24]);
  P(jaw, merged('drkTeethL', () => [-1, 1].map(sx => X(U.cone, [sx * .07, .02, .35], [0, 0, 0], [.015, .05, .015]))), M(0xf2ead8, { r: .4 }));
  P(head, merged('drkTeeth', () => { const o2 = []; for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) o2.push(X(U.cone, [sx * .1, -.08, .22 + i * .1], [PI, 0, 0], [.014, .06, .014])); return o2; }), M(0xf2ead8, { r: .4 }));
  P(head, merged('drkEyes', () => [-1, 1].map(sx => X(U.sph, [sx * .14, .08, .18], [0, sx * .4, 0], [.035, .028, .03]))), eye);
  P(head, merged('drkHorns' + E, () => { const o2 = []; for (const sx of [-1, 1]) { o2.push(X(tube('drkHorn' + E + sx, [[0, 0, 0], [sx * .06, .1, -.15], [sx * .1, .2, -.38], [sx * .06, .38, -.55]], taper(E === 'm' ? .08 : .06, .008), 14, 6), [sx * .12, .14, -.08])); o2.push(X(tube('drkHornS' + sx, [[0, 0, 0], [sx * .08, -.02, -.1], [sx * .14, .02, -.22]], taper(.035, .005), 8, 5), [sx * .17, .0, -.05])); if (o.extraHorns) o2.push(X(tube('drkHornE' + sx, [[0, 0, 0], [sx * .03, .15, -.08], [sx * .02, .32, -.12], [sx * -.02, .45, -.05]], taper(.045, .006), 10, 5), [sx * .06, .18, .0]), X(tube('drkHornS' + sx, [[0, 0, 0], [sx * .08, -.02, -.1], [sx * .14, .02, -.22]], taper(.035, .005), 8, 5), [sx * .15, -.06, .08])); } return o2; }), horn);
  if (E === 'o') P(head, merged('drkFinO', () => [-1, 1].map(sx => X(ext('finFan', s => { s.moveTo(0, 0); s.lineTo(.35, .1); s.quadraticCurveTo(.3, .25, .38, .35); s.quadraticCurveTo(.15, .32, 0, .12); }, .015, .005, 0), [sx * .18, .06, -.05], [0, sx * -.4 + (sx < 0 ? PI : 0), .3], 1))), M(0x4fd8d0, { r: .5, ds: 1, e: .3, ec: 0x4fd8d0 }));
  if (E === 'c') P(head, merged('drkFinC', () => [-1, 1].map(sx => X(U.pyr, [sx * .2, .08, -.12], [-1.3, 0, -sx * .9], [.03, .3, .09]))), M(0xffffff, { r: .7 }));
  if (E === 'i') P(head, merged('drkNostril', () => [-1, 1].map(sx => X(U.sph, [sx * .05, .05, .52], [0, 0, 0], .025))), glow(0xffa030, 3));
  // cola de 6 segmentos
  const tail = []; par = torso; const trot = [-.18, .05, .08, .1, .1, .1];
  for (let i = 0; i < 6; i++) { const t = grp(par, 0, i === 0 ? -.02 : 0, i === 0 ? -.7 : -.3); t.rotation.x = trot[i]; const rr = .22 - i * .03; P(t, U.sph, skin, [0, 0, -.15], [rr, rr * .9, .22]); tail.push(t); par = t; }
  if (E === 'i') { P(par, U.cone, glow(0xff7a1a, 2.5), [0, 0, -.45], [.12, .45, .12], [-PI / 2, 0, 0]); P(par, U.cone, M(0xffc040, { e: 2, ec: 0xffa020, t: .5, add: 1 }), [0, 0, -.5], [.18, .55, .18], [-PI / 2, 0, 0]); }
  else if (E === 'm') P(par, merged('drkClub', () => [X(U.dod, [0, 0, -.3], [0, 0, 0], .2), X(U.dod, [.1, .1, -.42], [.5, 0, 0], .12), X(U.dod, [-.1, .08, -.38], [0, .5, 0], .12)]), M(0x8a7a62, { r: .9, fs: 1 }));
  else if (E === 'o') P(par, ext('flukes', s => { s.moveTo(0, 0); s.quadraticCurveTo(.3, -.1, .45, -.35); s.quadraticCurveTo(.2, -.25, 0, -.3); s.quadraticCurveTo(-.2, -.25, -.45, -.35); s.quadraticCurveTo(-.3, -.1, 0, 0); }, .02, .01), M(0x4fd8d0, { r: .5, e: .3, ec: 0x4fd8d0 }), [0, 0, -.25], 1, [0, 0, 0]);
  else if (E === 'c') P(par, merged('drkPuff', () => [X(U.sph, [0, 0, -.3], [0, 0, 0], .16), X(U.sph, [.1, .06, -.42], [0, 0, 0], .12), X(U.sph, [-.08, .08, -.45], [0, 0, 0], .11), X(U.sph, [0, -.04, -.55], [0, 0, 0], .1)]), M(0xffffff, { r: .9, e: .25, ec: 0xdff4ff }));
  else P(par, U.cone, horn, [0, 0, -.38], [.08, .4, .05], [-PI / 2, 0, 0]);
  if (E === 'e') P(par, U.cone, M(0xd9b3ff, { e: 2.2, ec: 0xb070ff, t: .55, add: 1 }), [0, 0, -.55], [.15, .5, .15], [-PI / 2, 0, 0]);
  // patas: traseras con muslo + garra, delanteras más pequeñas
  const legs = [];
  for (const [sx, fz, big] of [[-1, -.32, 1], [1, -.32, 1], [-1, .42, 0], [1, .42, 0]]) {
    const l = grp(torso, sx * (big ? .32 : .26), -.15, fz); l.rotation.x = big ? .5 : .2;
    if (big) P(l, U.sph, skin, [0, -.12, 0], [.15, .25, .2]); else P(l, limb(.08, .06, .2), skin);
    const k = grp(l, 0, big ? -.32 : -.26, 0); k.rotation.x = big ? -.9 : -.5; P(k, limb(big ? .08 : .06, .05, big ? .26 : .18), skin);
    const ft = grp(k, 0, big ? -.32 : -.24, 0); ft.rotation.x = .5;
    P(ft, merged('drkClaw' + big, () => [-1, 0, 1].map(i => X(U.cone, [i * .05, -.02, .08], [PI / 2 + .3, i * .35, 0], [.022, big ? .16 : .12, .022]))), horn);
    l.userData.knee = k; legs.push(l);
  }
  // alas de dos segmentos con huesos y membrana
  const wings = [];
  for (const sx of [-1, 1]) {
    const wg = grp(torso, sx * .25, .3, .25); wg.scale.x = sx;
    const sh = grp(wg); sh.rotation.set(0, .25, .35);
    const L1 = .75;
    P(sh, XAB(U.tcyl, [0, 0, 0], [L1, .03, .02], .055, .055), skin);
    P(sh, wingInG(L1), memb);
    const el = grp(sh, L1, .03, .02); el.rotation.set(0, -.15, -.35);
    P(el, merged('wingBones', () => [XAB(U.tcyl, [0, 0, 0], [WTIPS[0][0], 0, WTIPS[0][1]], .04), ...WTIPS.slice(1).map(([x, z]) => XAB(U.tcyl, [0, 0, 0], [x, -Math.hypot(x, z) * .05, z], .025))]), skin);
    P(el, wingOutG(), memb);
    P(el, U.cone, horn, [0, .06, .02], [.03, .14, .03], [0, 0, 0]);
    wings.push({ sh, el });
  }
  if (o.elem === 'e') { P(torso, merged('elderGlow', () => [0, 1, 2, 3].map(i => X(U.box, [0, .3 - i * .02, .3 - i * .25], [-.2, 0, 0], [.04, .02, .18]))), glow(0xd9b3ff, 3)); }
  return { g, rig: { type: 'drake', root, body, torso, neck, head, jaw, tail, legs, wings, flyer: true }, s: 1 };
}

// ═════════════════════════ API ═════════════════════════
function capture(o) { if (o && o.isObject3D) { o.userData.b = [o.rotation.x, o.rotation.y, o.rotation.z]; o.userData.p = o.position.clone(); o.userData.s = o.scale.clone(); if (o.userData.knee) capture(o.userData.knee); if (o.userData.low) capture(o.userData.low); } }
function captureRig(r) { for (const k in r) { const v = r[k]; if (Array.isArray(v)) v.forEach(x => { if (x && x.isObject3D) capture(x); else if (x && typeof x === 'object') Object.values(x).forEach(capture); }); else if (v && v.isObject3D) capture(v); else if (v && typeof v === 'object' && k === 'tib') Object.values(v).forEach(capture); } }
export function buildModel(kind, tint = 'red', opts = {}) {
  let r;
  if (CHAMPS[kind]) { r = CHAMPS[kind](!!opts.upgraded); if (opts.upgraded) prestige(r); }
  else switch (kind) {
    case 'minion': r = minion(false, tint); break; case 'minion_c': r = minion(true, tint); break;
    case 'super': r = superminion(tint); break; case 'cannon': r = cannonMinion(tint); break;
    case 'gromp': r = gromp(); break; case 'wolf': r = wolf(); break; case 'raptor': r = raptor(); break; case 'krug': r = krug(); break;
    case 'buff_blue': r = golemBuff(true); break; case 'buff_red': r = golemBuff(false); break;
    case 'herald': r = herald(); break; case 'grub': r = grub(); break; case 'scuttle': r = scuttle(); break;
    case 'drake_c': r = drake({ elem: 'c', body: 0xa9cde6, belly: 0xf2f8ff, wing: 0x8fbfe2, horn: 0xf4f8ff, glow: 0xdff6ff, wingE: .15, dark: 0x6a8aa8 }); break;
    case 'drake_i': r = drake({ elem: 'i', body: 0x9b2a14, belly: 0xff7a2a, bellyGlow: true, wing: 0x6a1a0c, horn: 0x2a1a14, glow: 0xffb03a, wingE: .35, dark: 0x2a0e08 }); break;
    case 'drake_m': r = drake({ elem: 'm', rocky: true, body: 0x7a6648, belly: 0xc2a46e, wing: 0x5e4c36, horn: 0xe2d6b8, glow: 0xffd24a, dark: 0x3a2e20 }); break;
    case 'drake_o': r = drake({ elem: 'o', body: 0x2a78b8, belly: 0x9fe0e8, wing: 0x2a9fb0, horn: 0xdff6ff, glow: 0x7ff0ff, wingE: .2, dark: 0x123a5a }); break;
    case 'elder': r = drake({ elem: 'e', scale: 1.25, extraHorns: true, body: 0x2c2440, belly: 0x9a88c0, wing: 0x3a2a5e, horn: 0xeee6ff, hornE: .5, glow: 0xd9b3ff, wingE: .6, dark: 0x120c1e }); break;
    case 'baron': r = baron(); break; case 'chogath': r = chogath(); break; case 'voidhunter': r = voidhunter(); break;
    default: r = brute({ skin: M(0x888888, { fs: 1 }), dark: M(0x555555, { fs: 1 }) });
  }
  r.g.traverse(o => {
    if (!o.isMesh) return;
    const m = o.material, sc = Math.max(o.scale.x, o.scale.y, o.scale.z);
    o.castShadow = !m.transparent && (m.emissiveIntensity ?? 0) < 1.5 && sc > .045; o.receiveShadow = false;
  });
  captureRig(r.rig);
  r.kind = kind; return r;
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
  r.wings.forEach(({ sh, el }) => { S(sh, 0, Math.sin(f - .4) * .12, flap * .62); S(el, 0, 0, Math.sin(f - 1.0) * .55); });
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
}
