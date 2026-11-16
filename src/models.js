import * as THREE from 'three';

// ───────── helpers de materiales y primitivas ─────────
const mcache = new Map();
export function M(color, o = {}) {
  const k = color + '|' + (o.m ?? .1) + '|' + (o.r ?? .55) + '|' + (o.e ?? 0) + '|' + (o.ec ?? 0) + '|' + (o.t ?? 1) + '|' + (o.ds ? 1 : 0);
  let m = mcache.get(k); if (m) return m;
  m = new THREE.MeshStandardMaterial({ color, metalness: o.m ?? .1, roughness: o.r ?? .55, emissive: o.ec ?? 0x000000, emissiveIntensity: o.e ?? 0, transparent: (o.t ?? 1) < 1, opacity: o.t ?? 1, side: o.ds ? THREE.DoubleSide : THREE.FrontSide });
  mcache.set(k, m); return m;
}
const glow = (c, i = 2.2) => M(c, { e: i, ec: c, r: .3 });
const G = {
  sph: new THREE.SphereGeometry(1, 20, 14), box: new THREE.BoxGeometry(1, 1, 1), cyl: new THREE.CylinderGeometry(1, 1, 1, 16),
  cone: new THREE.ConeGeometry(1, 1, 14), tor: new THREE.TorusGeometry(1, .12, 8, 28), oct: new THREE.OctahedronGeometry(1), ico: new THREE.IcosahedronGeometry(1, 1),
  cap: new THREE.CapsuleGeometry(1, 1, 6, 14), plane: new THREE.PlaneGeometry(1, 1),
};
function mesh(geo, mat, sx, sy, sz, x = 0, y = 0, z = 0, p) {
  const m = new THREE.Mesh(geo, mat); m.scale.set(sx, sy ?? sx, sz ?? sx); m.position.set(x, y, z); m.castShadow = true; if (p) p.add(m); return m;
}
const sph = (p, mat, r, x, y, z, sy, sz) => mesh(G.sph, mat, r, sy ?? r, sz ?? r, x, y, z, p);
const box = (p, mat, w, h, d, x, y, z) => mesh(G.box, mat, w, h, d, x, y, z, p);
const cyl = (p, mat, r, h, x, y, z, r2) => { const m = mesh(G.cyl, mat, r, h, r, x, y, z, p); if (r2 !== undefined) { m.geometry = new THREE.CylinderGeometry(r2, r, 1, 14); } return m; };
const cone = (p, mat, r, h, x, y, z) => mesh(G.cone, mat, r, h, r, x, y, z, p);
const grp = (p, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); if (p) p.add(g); return g; };

// ───────── humanoide base ─────────
function humanoid(o) {
  const g = new THREE.Group(), body = grp(g), s = o.s || 1;
  const skin = M(o.skin ?? 0xf0c8a0, { r: .6 }), armor = M(o.armor, { m: o.metal ?? .55, r: o.rough ?? .4 }), cloth = M(o.cloth ?? o.armor, { r: .75 }), acc = M(o.accent, { m: .7, r: .3 });
  const hipY = .78 * s;
  const legL = grp(body, -.16 * s, hipY, 0), legR = grp(body, .16 * s, hipY, 0);
  for (const l of [legL, legR]) { cyl(l, cloth, .1 * s, .7 * s, 0, -.34 * s, 0); box(l, armor, .17 * s, .1 * s, .26 * s, 0, -.72 * s, .04 * s); }
  const torso = grp(body, 0, hipY, 0);
  mesh(G.cap, armor, .27 * s, .34 * s, .2 * s, 0, .38 * s, 0, torso);
  box(torso, acc, .56 * s, .06 * s, .4 * s, 0, .04 * s, 0); // cinturón
  const head = grp(body, 0, hipY + .95 * s, 0);
  sph(head, skin, .2 * s, 0, 0, 0);
  const eyeM = M(0x111111);
  sph(head, eyeM, .03 * s, -.07 * s, .02 * s, .18 * s); sph(head, eyeM, .03 * s, .07 * s, .02 * s, .18 * s);
  const armL = grp(body, -.36 * s, hipY + .8 * s, 0), armR = grp(body, .36 * s, hipY + .8 * s, 0);
  for (const a of [armL, armR]) { cyl(a, armor, .08 * s, .55 * s, 0, -.26 * s, 0); sph(a, skin, .08 * s, 0, -.56 * s, 0); sph(a, acc, .13 * s, 0, .02 * s, 0); }
  const handR = grp(armR, 0, -.56 * s, 0), handL = grp(armL, 0, -.56 * s, 0);
  return { g, rig: { body, legL, legR, armL, armR, head, torso, handL, handR, s }, mats: { skin, armor, cloth, acc }, s };
}
const hair = (rig, color, kind = 'short') => {
  const s = rig.s, h = M(color, { r: .7 });
  sph(rig.head, h, .22 * s, 0, .05 * s, -.02 * s, .17 * s, .22 * s);
  if (kind === 'long') { box(rig.head, h, .4 * s, .8 * s, .1 * s, 0, -.38 * s, -.17 * s); }
  if (kind === 'pony') { const p = cyl(rig.head, h, .05 * s, .7 * s, 0, -.25 * s, -.28 * s); p.rotation.x = -.5; }
  if (kind === 'braids') for (const sx of [-1, 1]) { const b = cyl(rig.head, h, .045 * s, 1.1 * s, sx * .22 * s, -.45 * s, -.05 * s); b.rotation.z = sx * .08; }
};
const weapon = {
  sword(h, s, mat, big = 1) { const g = grp(h); g.rotation.x = Math.PI / 2 + .3; box(g, mat, .1 * s * big, 1.2 * s * big, .03 * s, 0, .6 * s * big, 0); box(g, M(0x6b4a1d), .35 * s, .06 * s, .08 * s, 0, 0, 0); cyl(g, M(0x3a2a14), .04 * s, .3 * s, 0, -.12 * s, 0); return g; },
  axe(h, s, mat) { const g = grp(h); g.rotation.x = Math.PI / 2 + .2; cyl(g, M(0x3a2a14), .04 * s, 1.5 * s, 0, .4 * s, 0); const b = box(g, mat, .75 * s, .55 * s, .06 * s, .35 * s, 1 * s, 0); const b2 = box(g, mat, .75 * s, .55 * s, .06 * s, -.35 * s, 1 * s, 0); return g; },
  staff(h, s, orb, mat) { const g = grp(h); g.rotation.x = .1; cyl(g, mat, .035 * s, 1.7 * s, 0, .3 * s, 0); const o = sph(g, glow(orb, 3), .13 * s, 0, 1.25 * s, 0); const l = new THREE.PointLight(orb, 1.2, 5); l.position.set(0, 1.25 * s, 0); g.add(l); return g; },
};

// ───────── campeones ─────────
const CHAMPS = {
  garen(d) {
    const h = humanoid({ armor: 0x4a79d8, accent: 0xf0c75e, cloth: 0x2d3f78, s: 1.12, metal: .75, rough: .28 }); const { rig: r, mats } = h, s = r.s;
    sph(r.armL, mats.armor, .22 * s, 0, .05 * s, 0); sph(r.armR, mats.armor, .22 * s, 0, .05 * s, 0);
    hair(r, 0x6b4a2a);
    const helm = sph(r.head, M(0xb8c6e0, { m: .9, r: .25 }), .24 * s, 0, .06 * s, 0, .2 * s, .24 * s);
    box(r.head, M(0xf0c75e, { m: .8 }), .04 * s, .3 * s, .3 * s, 0, .22 * s, -.02 * s);
    const cape = box(r.body, M(0x2f5ec9, { r: .8, ds: 1 }), .55 * s, 1.2 * s, .05 * s, 0, 1.15 * s, -.26 * s); r.cape = cape; cape.rotation.x = .08;
    r.weapon = weapon.sword(r.handR, s, M(0xdfe8f5, { m: .95, r: .2 }), 1.25);
    return h;
  },
  ashe(d) {
    const h = humanoid({ armor: 0xdfeeff, cloth: 0x3d7ec4, accent: 0x7fd0ff, s: .98, metal: .2, skin: 0xf5dcc6 }); const { rig: r } = h, s = r.s;
    hair(r, 0xf4f8ff, 'long');
    const hood = sph(r.head, M(0x2a5a9a, { r: .8 }), .26 * s, 0, .05 * s, -.04 * s, .22 * s, .26 * s); hood.scale.y = .9;
    const bow = new THREE.Mesh(new THREE.TorusGeometry(.7 * s, .035 * s, 8, 28, Math.PI), M(0x9fe4ff, { e: 1.2, ec: 0x5fb8ff, m: .4 })); bow.rotation.set(0, Math.PI / 2, Math.PI / 2); bow.castShadow = true; r.handL.add(bow); bow.position.set(.0, 0, .1 * s); r.weapon = bow;
    cyl(r.torso, M(0x2a5a9a), .08 * s, .6 * s, .12 * s, .5 * s, -.28 * s).rotation.x = .3;
    return h;
  },
  annie(d) {
    const h = humanoid({ armor: 0xe03a78, cloth: 0xc8285f, accent: 0xff9a3d, s: .82, metal: .1, rough: .7 }); const { rig: r } = h, s = r.s;
    cone(r.body, M(0xc8285f, { r: .8 }), .5 * s, .9 * s, 0, .95 * s, 0).scale.set(.5 * s, .9 * s, .5 * s);
    hair(r, 0x3a1010, 'long');
    const bowM = M(0xff4a7d); box(r.head, bowM, .3 * s, .1 * s, .06 * s, 0, .24 * s, .0);
    // Tibbers
    const t = grp(h.g, .75 * s, 0, .2 * s); const bm = M(0x6a3a1a, { r: .9 });
    sph(t, bm, .32 * s, 0, .4 * s, 0, .28 * s, .26 * s); sph(t, bm, .2 * s, 0, .78 * s, .05 * s); sph(t, glow(0xff6a2a, 3), .04 * s, -.07 * s, .82 * s, .22 * s); sph(t, glow(0xff6a2a, 3), .04 * s, .07 * s, .82 * s, .22 * s);
    sph(t, bm, .07 * s, -.14 * s, .93 * s, 0); sph(t, bm, .07 * s, .14 * s, .93 * s, 0); r.tibbers = t;
    const fl = sph(r.handR, glow(0xff7a2a, 3), .12 * s, 0, -.1 * s, .05 * s); r.weapon = fl; const pl = new THREE.PointLight(0xff7a2a, 1.5, 5); r.handR.add(pl);
    return h;
  },
  lux(d) {
    const h = humanoid({ armor: 0xf4f2ea, cloth: 0x4a78d0, accent: 0xf2c94c, s: 1.0, metal: .7, rough: .25, skin: 0xf7dcc3 }); const { rig: r } = h, s = r.s;
    hair(r, 0xf7e27a, 'long');
    const tiara = M(0xf2c94c, { m: .9, r: .2 }); box(r.head, tiara, .34 * s, .06 * s, .06 * s, 0, .2 * s, .12 * s);
    for (const sx of [-1, 1]) { const w = box(r.torso, glow(0xfff3b0, 1.3), .02, .9 * s, .35 * s, sx * .35 * s, .5 * s, -.28 * s); w.rotation.z = sx * -.5; w.material = M(0xfff3b0, { e: 1.2, ec: 0xfff3b0, t: .55, ds: 1 }); }
    r.weapon = weapon.staff(r.handR, s, 0xfff0b0, tiara);
    return h;
  },
  malphite(d) {
    const g = new THREE.Group(), body = grp(g), s = 1.45; const rock = M(0x7b7f8a, { r: .9, m: .05 }), dark = M(0x4a4d56, { r: .95 }), cry = glow(0x58e0a3, 2.4);
    const legL = grp(body, -.28 * s, .5 * s, 0), legR = grp(body, .28 * s, .5 * s, 0);
    for (const l of [legL, legR]) box(l, rock, .34 * s, .6 * s, .4 * s, 0, -.25 * s, 0);
    const torso = grp(body, 0, .5 * s, 0); box(torso, rock, .95 * s, .9 * s, .6 * s, 0, .55 * s, 0); box(torso, dark, .7 * s, .5 * s, .4 * s, 0, .6 * s, .1 * s);
    const head = grp(body, 0, 1.5 * s, .05 * s); box(head, rock, .4 * s, .32 * s, .38 * s, 0, 0, 0); box(head, glow(0x58e0a3, 3), .3 * s, .06 * s, .02 * s, 0, 0, .2 * s);
    const armL = grp(body, -.62 * s, 1.35 * s, 0), armR = grp(body, .62 * s, 1.35 * s, 0);
    for (const a of [armL, armR]) { box(a, rock, .34 * s, .8 * s, .34 * s, 0, -.35 * s, 0); box(a, dark, .46 * s, .4 * s, .46 * s, 0, -.8 * s, 0); box(a, rock, .5 * s, .26 * s, .5 * s, 0, .08 * s, 0); }
    for (const [x, y, z, sc] of [[-.3, 1.2, -.3, .35], [.2, 1.3, -.32, .5], [0, 1.0, -.34, .3]]) { const c = cone(torso, cry, .1 * s, sc * s, x * s, y * s * .6 + .3 * s, z * s); c.rotation.x = -.6; }
    return { g, rig: { body, legL, legR, armL, armR, head, torso, s }, mats: {}, s };
  },
  soraka(d) {
    const h = humanoid({ armor: 0xdfe6ff, cloth: 0x8f7fe0, accent: 0xf2c94c, s: 1.0, metal: .3, skin: 0xc9b6ff }); const { rig: r } = h, s = r.s;
    hair(r, 0xf2f0ff, 'long'); const horn = M(0xfff5d6, { r: .4 });
    for (const sx of [-1, 1]) { const hn = cone(r.head, horn, .05 * s, .4 * s, sx * .14 * s, .28 * s, 0); hn.rotation.z = -sx * .4; }
    cone(r.body, M(0x8f7fe0, { r: .7 }), .55 * s, 1.0 * s, 0, .75 * s, 0).scale.set(.55 * s, 1 * s, .55 * s);
    r.weapon = weapon.staff(r.handR, s, 0xb99cff, M(0xf2c94c, { m: .8 }));
    const sw = sph(r.torso, M(0xb99cff, { e: 1, ec: 0xb99cff, t: .6 }), .5 * s, 0, 1.1 * s, -.3 * s, .6 * s, .04 * s);
    return h;
  },
  darius(d) {
    const h = humanoid({ armor: 0x6a1515, cloth: 0x2a1212, accent: 0xaaaaaa, s: 1.22, metal: .85, rough: .35, skin: 0xcaa07c }); const { rig: r, mats } = h, s = r.s;
    sph(r.armL, mats.armor, .26 * s, 0, .05 * s, 0, .2 * s, .26 * s); sph(r.armR, mats.armor, .26 * s, 0, .05 * s, 0, .2 * s, .26 * s);
    const helm = sph(r.head, M(0x4a4a58, { m: .8, r: .45 }), .23 * s, 0, .06 * s, 0, .17 * s, .23 * s);
    for (const sx of [-1, 1]) { const sp = cone(helm, M(0xaaaaaa, { m: .9 }), .04, .5); sp.position.set(sx * .8, .5, 0); sp.rotation.z = -sx * .7; }
    r.weapon = weapon.axe(r.handR, s, M(0xb8b8c4, { m: .95, r: .22 }));
    box(r.body, M(0x2a1212, { r: .85, ds: 1 }), .6 * s, .9 * s, .04, 0, 1.3 * s, -.28 * s);
    return h;
  },
  jinx(d) {
    const h = humanoid({ armor: 0x2fb7d9, cloth: 0x2a2a4a, accent: 0xff4fa3, s: .95, metal: .1, skin: 0xe8d4e0 }); const { rig: r } = h, s = r.s;
    hair(r, 0x3fc7ea, 'braids');
    box(r.torso, M(0xff4fa3, { m: .3 }), .5 * s, .12 * s, .38 * s, 0, .55 * s, 0);
    const gun = grp(r.handR); gun.rotation.x = Math.PI / 2 - .2;
    box(gun, M(0xff4fa3, { m: .5, r: .4 }), .2 * s, .9 * s, .2 * s, 0, .3 * s, 0); const sh = sph(gun, M(0xffd24a, { m: .6 }), .12 * s, 0, .8 * s, 0); sh.scale.set(.18 * s, .22 * s, .18 * s);
    cyl(gun, M(0x333333, { m: .8 }), .09 * s, .5 * s, 0, 1.0 * s, 0); box(gun, M(0xffd24a), .26 * s, .12 * s, .26 * s, 0, .55 * s, 0); r.weapon = gun;
    return h;
  },
  leona(d) {
    const h = humanoid({ armor: 0xe0a43a, cloth: 0x7a3a12, accent: 0xfff0b0, s: 1.1, metal: .9, rough: .22, skin: 0xb8865a }); const { rig: r, mats } = h, s = r.s;
    sph(r.armL, mats.armor, .24 * s, 0, .05 * s, 0, .2 * s, .24 * s); sph(r.armR, mats.armor, .24 * s, 0, .05 * s, 0, .2 * s, .24 * s);
    hair(r, 0x5a2e10, 'pony');
    const crown = M(0xf2b630, { m: .95, r: .2, e: .4, ec: 0xf2b630 }); for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI - Math.PI / 2; const sp = cone(r.head, crown, .035 * s, .22 * s, Math.sin(a) * .22 * s, .26 * s + Math.cos(a) * .0, Math.cos(a) * .12 * s); sp.rotation.z = -Math.sin(a) * .5; }
    const shield = grp(r.handL, 0, 0, .1 * s); const sh = cyl(shield, M(0xf2b630, { m: .95, r: .22 }), .55 * s, .06 * s, 0, 0, 0); sh.rotation.x = Math.PI / 2; cyl(shield, glow(0xfff0b0, 2.5), .26 * s, .09 * s, 0, 0, 0).rotation.x = Math.PI / 2;
    shield.position.z = .35 * s; r.shield = shield;
    const sword = weapon.sword(r.handR, s, M(0xf4d58a, { m: .95, r: .2 }), 1.0); r.weapon = sword;
    return h;
  },
  teemo(d) {
    const h = humanoid({ armor: 0x6a4a2a, cloth: 0x6aa843, accent: 0xd8742f, s: .58, metal: .1, skin: 0xe8b46a }); const { rig: r } = h, s = r.s;
    r.head.scale.setScalar(1.7); r.head.position.y -= .1;
    const hat = cone(r.head, M(0xd8742f, { r: .7 }), .3 * s, .35 * s, 0, .18 * s, 0); box(r.head, M(0x333333), .5 * s, .02, .5 * s, 0, .1 * s, 0);
    const gl = M(0xffe36a, { e: .8, ec: 0xffe36a, m: .6 }); for (const sx of [-1, 1]) sph(r.head, gl, .09 * s, sx * .09 * s, .06 * s, .17 * s);
    cyl(r.handR, M(0x8a5a2a), .04 * s, .9 * s, 0, .1 * s, 0).rotation.x = 1.2; r.weapon = r.handR;
    return h;
  },
  yasuo(d) {
    const h = humanoid({ armor: 0xe8f4ff, cloth: 0x2f6a8a, accent: 0x4b9fa8, s: 1.05, metal: .3, skin: 0xe6c19a }); const { rig: r } = h, s = r.s;
    hair(r, 0x1a1a22, 'pony'); box(r.torso, M(0x4b9fa8, { ds: 1 }), .15 * s, 1 * s, .04, .32 * s, .2 * s, -.2 * s).rotation.z = .25;
    const wind = new THREE.Mesh(new THREE.TorusGeometry(.5 * s, .02 * s, 6, 24), M(0xcfefff, { e: 1, ec: 0xcfefff, t: .5 })); wind.rotation.x = Math.PI / 2; wind.position.y = .9 * s; h.g.add(wind); r.wind = wind;
    const kat = weapon.sword(r.handR, s, M(0xeef4ff, { m: 1, r: .1 }), 1.1); r.weapon = kat;
    return h;
  },
  ezreal(d) {
    const h = humanoid({ armor: 0xe4c284, cloth: 0x2c4a7a, accent: 0x4fd4ff, s: .96, metal: .4, skin: 0xf0cfae }); const { rig: r } = h, s = r.s;
    hair(r, 0xf2d27a, 'short'); box(r.torso, M(0x2c4a7a), .6 * s, .16 * s, .4 * s, 0, .75 * s, 0);
    const gaunt = grp(r.handR); box(gaunt, M(0x3a64a8, { m: .6 }), .22 * s, .42 * s, .26 * s, 0, .08 * s, .1 * s); sph(gaunt, glow(0x4fd4ff, 3), .09 * s, 0, .08 * s, .3 * s); gaunt.rotation.x = Math.PI / 2.4; r.weapon = gaunt;
    const pl = new THREE.PointLight(0x4fd4ff, 1.1, 4.5); pl.position.set(0, .1, .3); gaunt.add(pl);
    return h;
  },
};

// ───────── criaturas ─────────
const WING = (() => { const sh = new THREE.Shape(); sh.moveTo(0, .1); sh.lineTo(.35, .55); sh.lineTo(.7, .62); sh.lineTo(1, .5); sh.lineTo(.82, .15); sh.lineTo(.92, -.15); sh.lineTo(.6, -.05); sh.lineTo(.62, -.4); sh.lineTo(.3, -.2); sh.lineTo(.12, -.45); sh.lineTo(0, -.1); const g = new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI / 2); return g; })();
function eyes(p, c, r, x, y, z, sep) { for (const sx of [-1, 1]) sph(p, glow(c, 3), r, sx * sep + x, y, z); }
function minion(caster, tint) {
  const g = new THREE.Group(), body = grp(g); const col = tint, m = M(col, { r: .5, m: .3 }), tan = M(0xe8d9b0, { r: .7 });
  const legL = grp(body, -.14, .4, 0), legR = grp(body, .14, .4, 0); for (const l of [legL, legR]) cyl(l, m, .08, .4, 0, -.2, 0);
  const torso = grp(body, 0, .4, 0); mesh(G.cap, m, .22, .22, .18, 0, .3, 0, torso); box(torso, M(0x222222, { m: .7 }), .46, .07, .36, 0, .05, 0);
  const head = grp(body, 0, 1.0, 0); sph(head, tan, .2, 0, 0, 0); eyes(head, 0xffffff, .045, 0, .02, .17, .08); box(head, m, .42, .12, .4, 0, .17, 0);
  const armL = grp(body, -.3, .78, 0), armR = grp(body, .3, .78, 0); for (const a of [armL, armR]) { cyl(a, m, .06, .4, 0, -.2, 0); sph(a, tan, .07, 0, -.42, 0); }
  if (caster) { cone(head, M(col, { r: .6 }), .26, .5, 0, .35, 0); const orb = sph(armR, glow(0xc59bff, 2.5), .1, 0, -.5, .1); armR.rotation.x = -.5; } else { box(armR, M(0xc0c0c8, { m: .9 }), .06, .5, .05, 0, -.55, .1); }
  return { g, rig: { body, legL, legR, armL, armR, head, torso, s: 1 }, s: 1 };
}
function quadruped(col, o = {}) {
  const g = new THREE.Group(), body = grp(g), m = M(col, { r: .85 }), dark = M(o.dark ?? 0x222222, { r: .9 });
  const torso = grp(body, 0, .55, 0); sph(torso, m, .4, 0, 0, 0, .3, .62);
  const head = grp(body, 0, .75, .6); sph(head, m, .22, 0, 0, 0, .2, .3); cone(head, dark, .08, .3, 0, -.04, .3).rotation.x = Math.PI / 2; eyes(head, o.eye ?? 0xffd24a, .035, 0, .06, .2, .1);
  for (const sx of [-1, 1]) cone(head, m, .07, .22, sx * .12, .24, -.05);
  const legs = []; for (const [x, z] of [[-.2, .35], [.2, .35], [-.2, -.35], [.2, -.35]]) { const l = grp(body, x, .5, z); cyl(l, m, .07, .5, 0, -.25, 0); legs.push(l); }
  const tail = cone(torso, m, .08, .6, 0, .1, -.7); tail.rotation.x = -1.9;
  return { g, rig: { body, head, torso, legs, legL: legs[0], legR: legs[3], s: 1, quad: true }, s: 1 };
}
function golem(col, eye, o = {}) {
  const g = new THREE.Group(), body = grp(g), s = 1; const rock = M(col, { r: .92 }), dark = M(o.dark ?? 0x2a2d34, { r: .95 });
  const legL = grp(body, -.3, .5, 0), legR = grp(body, .3, .5, 0); for (const l of [legL, legR]) box(l, rock, .3, .5, .35, 0, -.25, 0);
  const torso = grp(body, 0, .5, 0); sph(torso, rock, .65, 0, .55, 0, .6, .5); sph(torso, dark, .4, 0, .65, .25, .35, .25);
  const head = grp(body, 0, 1.4, .1); sph(head, rock, .3, 0, 0, 0, .25, .3); eyes(head, eye, .06, 0, .04, .26, .12);
  const armL = grp(body, -.7, 1.1, 0), armR = grp(body, .7, 1.1, 0); for (const a of [armL, armR]) { cyl(a, rock, .17, .8, 0, -.4, 0); sph(a, dark, .24, 0, -.85, 0); }
  for (let i = 0; i < 5; i++) { const c = cone(torso, glow(eye, 2), .07, .3 + (i % 2) * .15, (i - 2) * .22, 1.0, -.3); c.rotation.x = -.5; }
  if (o.leaves) for (let i = 0; i < 6; i++) { const l = cone(torso, M(0x2a7a3a), .12, .5, Math.cos(i) * .5, .8 + Math.sin(i * 2) * .2, Math.sin(i) * .4); l.rotation.set(Math.sin(i), 0, Math.cos(i)); }
  return { g, rig: { body, legL, legR, armL, armR, head, torso, s: 1 }, s: 1 };
}
function drake(col, belly, flame, o = {}) {
  const g = new THREE.Group(), body = grp(g), m = M(col, { r: .55, m: .2 }), bm = M(belly, { r: .7 });
  const torso = grp(body, 0, .9, 0); sph(torso, m, .55, 0, 0, 0, .5, .95); sph(torso, bm, .45, 0, -.18, .08, .35, .85);
  const neck = grp(torso, 0, .2, .8); neck.rotation.x = -.5; cyl(neck, m, .22, .9, 0, .35, 0, .16);
  const head = grp(body, 0, 1.75, 1.15); sph(head, m, .3, 0, 0, 0, .24, .38); cone(head, m, .15, .5, 0, -.03, .45).rotation.x = Math.PI / 2; eyes(head, flame, .05, 0, .1, .26, .15);
  for (const sx of [-1, 1]) { const hn = cone(head, M(0xe8e0c8), .05, .45, sx * .18, .22, -.2); hn.rotation.x = -.8; hn.rotation.z = -sx * .3; }
  const wings = []; for (const sx of [-1, 1]) { const w = grp(torso, sx * .4, .3, 0); const wm = M(new THREE.Color(col).multiplyScalar(.6).getHex(), { r: .7, ds: 1, e: (o.wingE ?? 0) * .3, ec: flame }); const wp = new THREE.Mesh(WING, wm); wp.scale.set(sx * 1.5, 1.0, 1); wp.position.set(sx * .1, .3, -.1); w.add(wp); cyl(w, m, .04, 1.9, sx * .9, .1, 0).rotation.z = Math.PI / 2; wings.push(w); }
  const tail = cone(torso, m, .3, 1.6, 0, -.1, -1.35); tail.rotation.x = -Math.PI / 2 - .1;
  for (const [x, z] of [[-.35, .35], [.35, .35], [-.35, -.35], [.35, -.35]]) cyl(body, m, .13, .55, x, .3, z * 1.1);
  for (let i = 0; i < 6; i++) cone(torso, M(0xe8e0c8), .06, .26, 0, .52 - i * .03, .7 - i * .3);
  const rig = { body, torso, head, wings, s: 1, flyer: true }; return { g, rig, s: 1 };
}
function grub(col) {
  const g = new THREE.Group(), body = grp(g), m = M(col, { r: .6, m: .1 }), segs = [];
  for (let i = 0; i < 5; i++) { const s = sph(body, i === 0 ? M(0x2a0f3a) : m, .26 - i * .025, 0, .26, -i * .3); segs.push(s); }
  eyes(segs[0], 0xff4fd6, .12, 0, .3, .8, .5); const stripe = M(0xc77bff, { e: 1.5, ec: 0xc77bff });
  for (let i = 1; i < 5; i++) sph(body, stripe, .08, 0, .5 - i * .02, -i * .3);
  return { g, rig: { body, segs, s: 1, worm: true }, s: 1 };
}
function crab(col, big) {
  const g = new THREE.Group(), body = grp(g), m = M(col, { r: .5, m: .3 });
  const torso = grp(body, 0, .35, 0); sph(torso, m, .5, 0, 0, 0, .3, .42);
  const claws = []; for (const sx of [-1, 1]) { const c = grp(body, sx * .5, .35, .3); sph(c, m, .2, 0, 0, .2, .15, .3); cone(c, M(0xeedd99), .06, .2, 0, 0, .5).rotation.x = Math.PI / 2; claws.push(c); }
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) { const l = cyl(body, M(0x222a33), .03, .4, sx * .45, .2, -.2 + i * .2); l.rotation.z = sx * 1.1; }
  for (const sx of [-1, 1]) cyl(torso, M(0x222a33), .02, .3, sx * .15, .35, .3);
  for (const sx of [-1, 1]) sph(torso, glow(0x6af0d8, 2.5), .06, sx * .15, .5, .32);
  return { g, rig: { body, armL: claws[0], armR: claws[1], s: 1, crab: true }, s: 1 };
}
function herald() {
  const g = new THREE.Group(), body = grp(g), m = M(0x5a3a8a, { r: .5, m: .3 }), shell = M(0xb99cff, { r: .3, m: .6 });
  const torso = grp(body, 0, 1.0, 0); sph(torso, m, .75, 0, 0, 0, .55, .8); const eye = sph(torso, M(0xffffff, { r: .2 }), .38, 0, .05, .6); sph(torso, glow(0x8fe8ff, 3), .18, 0, .05, .92); sph(torso, M(0x111), .08, 0, .05, 1.0);
  const claws = []; for (const sx of [-1, 1]) { const c = grp(body, sx * .85, 1.0, .4); box(c, m, .4, .3, .8, 0, 0, .3); const p = cone(c, shell, .2, .7, 0, 0, .9); p.rotation.x = Math.PI / 2; claws.push(c); }
  for (let i = 0; i < 7; i++) { const sp = cone(torso, shell, .1, .5, (i - 3) * .22, .5, -.2); sp.rotation.x = -.4; }
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) { const l = cyl(body, m, .06, .8, sx * .55, .4, -.4 + i * .35); l.rotation.z = sx * .5; }
  return { g, rig: { body, armL: claws[0], armR: claws[1], torso, s: 1, crab: true }, s: 1 };
}
function baron() {
  const g = new THREE.Group(), body = grp(g), m = M(0x6a2f9a, { r: .45, m: .25 }), bl = M(0xc77bff, { e: 1.5, ec: 0xc77bff });
  const segs = []; for (let i = 0; i < 7; i++) { const s = sph(body, m, .75 - i * .07, 0, .75, -i * .75, .75 - i * .07, .8); segs.push(s); sph(body, bl, .15, 0, 1.3 - i * .1, -i * .75); }
  const head = grp(body, 0, 1.3, 1.1); sph(head, m, .8, 0, 0, 0, .65, .85); const jaw = grp(head, 0, -.25, .35); box(jaw, M(0x2a0f3a), .9, .15, .9, 0, 0, .3);
  for (let i = -3; i <= 3; i++) { cone(head, M(0xf2ead0), .07, .3, i * .12, -.12, .88).rotation.x = Math.PI; }
  eyes(head, 0xff3ad6, .13, 0, .3, .62, .35);
  for (const sx of [-1, 1]) { const hn = cone(head, M(0xf2ead0), .09, .8, sx * .6, .5, -.1); hn.rotation.z = -sx * .6; }
  const tents = []; for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; const t = grp(body, Math.cos(a) * 1.0, .5, -2 + Math.sin(a) * .8); cyl(t, m, .12, 1.3, 0, .5, 0, .05).rotation.z = Math.cos(a) * .7; tents.push(t); }
  return { g, rig: { body, head, segs, tents, s: 1, boss: true }, s: 1 };
}
function chogath() {
  const g = new THREE.Group(), body = grp(g), m = M(0x7a3aa0, { r: .6, m: .15 }), bone = M(0xe8e0c8, { r: .4 });
  const legL = grp(body, -.4, .8, 0), legR = grp(body, .4, .8, 0); for (const l of [legL, legR]) cyl(l, m, .25, .8, 0, -.4, 0);
  const torso = grp(body, 0, .8, 0); sph(torso, m, .9, 0, .7, 0, .85, .65); for (let i = 0; i < 8; i++) { const sp = cone(torso, bone, .12, .55, Math.cos(i * .8) * .6, .8 + Math.sin(i * 1.3) * .4, -.45); sp.rotation.set(-.7, 0, Math.cos(i * .8) * .5); }
  const head = grp(body, 0, 1.9, .2); sph(head, m, .55, 0, 0, 0, .45, .5); const jaw = grp(head, 0, -.15, .2); box(jaw, M(0x1a0828), .7, .16, .5, 0, -.05, .1); for (let i = -3; i <= 3; i++) cone(head, bone, .05, .22, i * .09, -.18, .42).rotation.x = Math.PI;
  eyes(head, 0xff4fd6, .08, 0, .12, .4, .2);
  const armL = grp(body, -1.0, 1.7, 0), armR = grp(body, 1.0, 1.7, 0); for (const a of [armL, armR]) { cyl(a, m, .22, 1.1, 0, -.5, 0); const cl = cone(a, bone, .2, .6, 0, -1.2, .1); cl.rotation.x = Math.PI; }
  return { g, rig: { body, legL, legR, armL, armR, head, torso, s: 1 }, s: 1 };
}
function voidhunter() {
  const g = new THREE.Group(), body = grp(g), m = M(0x4a2a7a, { r: .4, m: .5 }), bl = glow(0xc77bff, 2.5);
  const legL = grp(body, -.2, .8, 0), legR = grp(body, .2, .8, 0); for (const l of [legL, legR]) { cyl(l, m, .09, .8, 0, -.4, 0).rotation.x = .2; }
  const torso = grp(body, 0, .8, 0); mesh(G.cap, m, .22, .4, .18, 0, .5, 0, torso); const hd = grp(body, 0, 1.65, .1); sph(hd, m, .2, 0, 0, 0, .25, .3); eyes(hd, 0xff4fd6, .045, 0, .05, .24, .08);
  const armL = grp(body, -.35, 1.4, 0), armR = grp(body, .35, 1.4, 0); for (const a of [armL, armR]) { cyl(a, m, .06, .6, 0, -.3, 0); for (let i = -1; i <= 1; i++) cone(a, bl, .035, .55, i * .06, -.8, .1).rotation.x = Math.PI - .3; }
  for (let i = 0; i < 4; i++) cone(torso, bl, .05, .4, (i - 1.5) * .12, .9, -.2).rotation.x = -.8;
  return { g, rig: { body, legL, legR, armL, armR, head: hd, torso, s: 1 }, s: 1 };
}
function superminion(tint) {
  const g = new THREE.Group(), body = grp(g), m = M(tint, { r: .3, m: .75 }), dm = M(0x222a33, { m: .8, r: .3 });
  const legL = grp(body, -.25, .6, 0), legR = grp(body, .25, .6, 0); for (const l of [legL, legR]) box(l, dm, .25, .6, .3, 0, -.3, 0);
  const torso = grp(body, 0, .6, 0); box(torso, m, .9, .8, .55, 0, .5, 0); box(torso, glow(0x6af0ff, 2), .3, .2, .06, 0, .6, .3);
  const head = grp(body, 0, 1.55, 0); box(head, m, .45, .35, .4, 0, 0, 0); box(head, glow(0xff4a4a, 3), .34, .06, .02, 0, 0, .21);
  const armL = grp(body, -.6, 1.15, 0), armR = grp(body, .6, 1.15, 0); for (const a of [armL, armR]) { box(a, m, .22, .8, .24, 0, -.4, 0); sph(a, dm, .2, 0, -.9, 0); }
  return { g, rig: { body, legL, legR, armL, armR, head, torso, s: 1 }, s: 1 };
}
function cannonMinion(tint) {
  const g = new THREE.Group(), body = grp(g), m = M(tint, { r: .4, m: .5 }), dm = M(0x333a44, { m: .85, r: .3 });
  const legs = [-1, 1].map(sx => { const l = grp(body, sx * .3, .45, 0); box(l, dm, .22, .45, .26, 0, -.22, 0); return l; });
  const torso = grp(body, 0, .45, 0); box(torso, m, .85, .65, .6, 0, .4, 0); const can = cyl(torso, dm, .22, 1.0, 0, .75, .3); can.rotation.x = Math.PI / 2 - .25; sph(torso, glow(0xff8a3d, 2), .16, 0, .84, .78);
  const head = grp(body, 0, 1.3, -.05); sph(head, M(0xe8d9b0), .18, 0, 0, 0); box(head, m, .4, .1, .38, 0, .15, 0); eyes(head, 0xffffff, .04, 0, .02, .16, .07);
  return { g, rig: { body, legL: legs[0], legR: legs[1], torso, head, s: 1 }, s: 1 };
}
function raptor() {
  const g = new THREE.Group(), body = grp(g), m = M(0xd8742f, { r: .7 }), acc = M(0x3a2a1a);
  const legL = grp(body, -.14, .55, 0), legR = grp(body, .14, .55, 0); for (const l of [legL, legR]) { cyl(l, acc, .05, .55, 0, -.27, 0); }
  const torso = grp(body, 0, .6, 0); sph(torso, m, .28, 0, 0, 0, .3, .4); const nk = cyl(body, m, .08, .5, 0, .95, .22); nk.rotation.x = .4;
  const head = grp(body, 0, 1.2, .38); sph(head, m, .14, 0, 0, 0); cone(head, M(0xf2c94c), .05, .25, 0, -.02, .2).rotation.x = Math.PI / 2; eyes(head, 0x111111, .025, 0, .04, .1, .07);
  const tail = cone(torso, m, .1, .6, 0, .1, -.4); tail.rotation.x = -1.9;
  for (const sx of [-1, 1]) { const w = box(torso, m, .04, .2, .35, sx * .26, .0, -.05); w.rotation.z = sx * -.4; }
  return { g, rig: { body, legL, legR, head, torso, s: 1, quad: false }, s: 1 };
}
function gromp() {
  const g = new THREE.Group(), body = grp(g), m = M(0x5a9a3a, { r: .8 }), sp = M(0xc9e86a);
  const torso = grp(body, 0, .55, 0); sph(torso, m, .7, 0, 0, 0, .55, .7); for (let i = 0; i < 6; i++) sph(torso, sp, .1, Math.cos(i * 1.1) * .45, .3 + Math.sin(i) * .2, Math.sin(i * 1.7) * .4 - .1);
  const head = grp(body, 0, .75, .55); sph(head, m, .35, 0, 0, 0, .28, .3); eyes(head, 0xffe36a, .09, 0, .22, .1, .2);
  const legs = []; for (const [x, z] of [[-.45, .3], [.45, .3], [-.45, -.3], [.45, -.3]]) { const l = grp(body, x, .3, z); sph(l, m, .2, 0, -.1, 0, .25, .2); legs.push(l); }
  for (let i = 0; i < 4; i++) cone(torso, M(0x2a4a1a), .08, .3, (i - 1.5) * .3, .5, -.2);
  return { g, rig: { body, torso, head, legs, legL: legs[0], legR: legs[3], s: 1, quad: true, hop: true }, s: 1 };
}
function krug() {
  const g = new THREE.Group(), body = grp(g), m = M(0x8a7a6a, { r: .95 }), mm = M(0x5a4e44, { r: .95 }), mo = glow(0xffb84a, 1.5);
  const legL = grp(body, -.3, .4, 0), legR = grp(body, .3, .4, 0); for (const l of [legL, legR]) box(l, mm, .3, .4, .3, 0, -.2, 0);
  const torso = grp(body, 0, .4, 0); box(torso, m, 1.0, .9, .75, 0, .45, 0); box(torso, mm, .7, .5, .3, 0, .7, .3); sph(torso, mo, .1, 0, .6, .45);
  const head = grp(body, 0, 1.45, .1); box(head, m, .45, .35, .4, 0, 0, 0); eyes(head, 0xffb84a, .06, 0, .02, .21, .12);
  const armL = grp(body, -.75, 1.0, 0), armR = grp(body, .75, 1.0, 0); for (const a of [armL, armR]) { box(a, m, .3, .7, .3, 0, -.3, 0); box(a, mm, .42, .4, .42, 0, -.75, 0); }
  for (let i = 0; i < 4; i++) box(torso, mm, .2, .3, .2, (i - 1.5) * .28, .98 + (i % 2) * .08, -.2);
  return { g, rig: { body, legL, legR, armL, armR, head, torso, s: 1 }, s: 1 };
}

const TEAM = { blue: 0x3a7ee0, red: 0xd9433a };
export function buildModel(kind, tint = 'red') {
  const T = TEAM[tint] ?? TEAM.red; let r;
  if (CHAMPS[kind]) r = CHAMPS[kind]();
  else switch (kind) {
    case 'minion': r = minion(false, T); break; case 'minion_c': r = minion(true, T); break;
    case 'gromp': r = gromp(); break; case 'wolf': r = quadruped(0x4a4a5a, { eye: 0xffd24a }); break;
    case 'raptor': r = raptor(); break; case 'krug': r = krug(); break;
    case 'cannon': r = cannonMinion(T); break;
    case 'buff_blue': r = golem(0x3a5a9a, 0x5ad8ff, { dark: 0x1a2a4a }); break;
    case 'buff_red': r = golem(0x8a3a2a, 0xff6a2a, { dark: 0x3a1a12, leaves: 1 }); break;
    case 'herald': r = herald(); break; case 'grub': r = grub(0x6a3a9a); break;
    case 'super': r = superminion(T); break;
    case 'drake_c': r = drake(0x9fd0e8, 0xe8f6ff, 0xbfe9ff, { wingE: .3 }); break;
    case 'drake_i': r = drake(0xa83a1a, 0xf2a14a, 0xff5a1f, { wingE: .5 }); break;
    case 'drake_m': r = drake(0x8a6a3a, 0xc9a26a, 0xffd24a); break;
    case 'drake_o': r = drake(0x2a7ac8, 0x8fd0ff, 0x4fb8ff, { wingE: .3 }); break;
    case 'elder': r = drake(0x4a2a7a, 0xe8d8ff, 0xc77bff, { wingE: 1.2 }); break;
    case 'baron': r = baron(); break; case 'chogath': r = chogath(); break;
    case 'voidhunter': r = voidhunter(); break; case 'scuttle': r = crab(0x2a7a6a); break;
    default: r = golem(0x888888, 0xffffff);
  }
  r.g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; } });
  r.kind = kind; return r;
}

// ───────── animación procedural ─────────
export function animate(model, st, t, dt) {
  const r = model.rig, k = st.moving ? 1 : 0; model._k = (model._k ?? 0) + (k - (model._k ?? 0)) * Math.min(1, dt * 10); const w = model._k;
  const ph = t * (st.speed || 8) + model.phase;
  const atk = st.atk, cast = st.cast;
  const sw = Math.sin(ph) * .9 * w;
  if (r.legL && !r.quad) { r.legL.rotation.x = sw; r.legR.rotation.x = -sw; }
  if (r.quad && r.legs) r.legs.forEach((l, i) => l.rotation.x = Math.sin(ph + (i % 2 ? Math.PI : 0) + (i > 1 ? 1.2 : 0)) * .8 * w);
  if (r.body) {
    const bob = r.hop ? Math.abs(Math.sin(ph * .5)) * .3 * w : Math.abs(Math.sin(ph)) * .08 * w * (r.s || 1);
    const idle = Math.sin(t * 2 + model.phase * 3) * .015;
    r.body.position.y = bob + (r.flyer ? .25 + Math.sin(t * 3 + model.phase) * .12 : 0) + idle;
    r.body.rotation.z = r.flyer ? Math.sin(t * 1.5 + model.phase) * .04 : 0;
    r.body.position.z = atk >= 0 ? Math.sin(Math.min(1, atk) * Math.PI) * .35 : 0;
  }
  if (r.armL && r.armR && !r.crab) {
    let l = -sw * .8, rr = sw * .8;
    if (atk >= 0) { const a = Math.min(1, atk); rr = -2.6 + Math.sin(a * Math.PI) * 2.4 * (a < .5 ? 1 : 1) + (a > .5 ? (a - .5) * 3.4 : 0); }
    if (cast > 0) { l = -2.6; rr = -2.6; }
    r.armL.rotation.x = l; r.armR.rotation.x = rr;
  } else if (r.armL && r.crab) { const a = atk >= 0 ? Math.sin(Math.min(1, atk) * Math.PI) * .9 : 0; r.armL.rotation.y = a; r.armR.rotation.y = -a; r.armL.position.z = .3 + (r.s) * 0; }
  if (r.wings) { const f = Math.sin(t * 5 + model.phase) * .5; r.wings[0].rotation.z = f; r.wings[1].rotation.z = -f; }
  if (r.segs) r.segs.forEach((s, i) => { s.position.x = Math.sin(t * 6 - i * .8 + model.phase) * .12 * (w + .3); });
  if (r.tents) r.tents.forEach((tn, i) => { tn.rotation.x = Math.sin(t * 2 + i) * .3; tn.rotation.z = Math.cos(t * 1.7 + i) * .3; });
  if (r.cape) r.cape.rotation.x = .1 + Math.sin(t * 3 + model.phase) * .06 + w * .3;
  if (r.wind) r.wind.rotation.z += dt * 4;
  if (r.tibbers) r.tibbers.position.y = Math.abs(Math.sin(t * 2)) * .05;
  if (r.head && st.hurt > 0) r.head.rotation.x = -st.hurt * 1.5; else if (r.head) r.head.rotation.x = 0;
}
