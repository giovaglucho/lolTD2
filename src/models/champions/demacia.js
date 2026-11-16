import { THREE, M, glow, gld, cloth, metal, hairM, EYE, TAU, PI, U, cg, limb, lathe, tube, taper, spindle, ext, X, XAB, merged, capeGeo, grp, P, humanoid, hairCap, bangs, brows, pauldron, cape, skirt, bladeGeo, sword, staffUpright, f3, kf, S, SP, B } from '../kit.js';
import { drake } from '../creatures.js';
// Modelos 3D de la legión Demacia. Cada función: (Up: bool mejorado, opts) => { g, rig, s }
// Convenciones del kit: pies en y=0, mirando a +Z, ≈2 de alto. Claves de geometría con prefijo "dm".

// ───────── utilidades locales ─────────
// emblema demaciano (rombo central + alas) — piezas para merged()
const emblem = (p, s = 1, rz = 0) => [
  X(U.oct, p, [0, 0, rz], [.045 * s, .085 * s, .02 * s]),
  ...[-1, 1].flatMap(sx => [X(U.pyr, [p[0] + sx * .07 * s, p[1] + .025 * s, p[2]], [0, 0, sx * 1.15], [.022 * s, .085 * s, .012 * s]), X(U.pyr, [p[0] + sx * .06 * s, p[1] - .02 * s, p[2]], [0, 0, sx * 1.6], [.018 * s, .065 * s, .012 * s])]),
];
const face = (r, skin, o = {}) => { // nariz + boca para primeros planos
  const hs = r.hs;
  P(r.head, U.sph, skin, [0, .15 * hs, .245 * hs], [.03 * hs, .035 * hs, .03 * hs]);
  if (!o.noMouth) P(r.head, U.rbox, o.mouth ?? M(0x7a3a34, { r: .6 }), [0, .085 * hs, .228 * hs], [.07 * hs * (o.mw ?? 1), .014 * hs, .02 * hs]);
};
// orienta un arma de asta (eje +Y del grupo) con un cabeceo mundial dado, compensando brazo+antebrazo
const hold = (r, side, obj, pitch, roll = 0) => { obj.rotation.x = pitch - (r['arm' + side].rotation.x + r['fore' + side].rotation.x); obj.rotation.z = roll; };
// estocada con el brazo derecho (lanzas, estoques)
function thrust(r, a, k = 1) {
  r.armR.rotation.x = kf(a, B(r.armR, 0), [[0, null], [.28, B(r.armR, 0) + .45], [.46, -1.5 * k], [.7, -1.35 * k], [1, null]]);
  r.foreR.rotation.x = kf(a, B(r.foreR, 0), [[0, null], [.28, -1.9], [.46, -.12], [.7, -.25], [1, null]]);
  r.armR.rotation.z = kf(a, B(r.armR, 2), [[0, null], [.28, .5], [.46, .05], [1, null]]);
  r.torso.rotation.y += kf(a, 0, [[0, 0], [.28, .45], [.46, -.4], [.75, -.2], [1, 0]]);
  r.body.position.z += kf(a, 0, [[0, 0], [.28, -.08], [.46, .28], [.8, .1], [1, 0]]);
}
const lunge = a => kf(a, 0, [[0, 0], [.28, 0], [.46, 1], [.75, .8], [1, 0]]);

// faldones de abrigo abiertos por delante (pivote en la cadera)
function coat(r, mat, o) {
  const c = grp(r.hips, 0, o.y ?? .05, o.z ?? 0), rB = o.rB ?? .34, arc = o.arc ?? 3.8;
  P(c, capeGeo(o.rT ?? .2, rB, o.l, arc), mat);
  if (o.trim) P(c, capeGeo(rB * 1.01, rB * 1.025, .05, arc), o.trim, [0, -o.l + .05, 0]);
  r.coat = c; return c;
}
const GOLD = M(0xe2b24c, { m: .65, r: .3 }), GOLDD = M(0xb8862e, { m: .6, r: .35 });
// lanza/asta genérica a lo largo de +Y (agarre en y=0)
function polearm(hand, o) {
  const g = grp(hand, 0, -.03, .02);
  P(g, U.cyl, o.shaft, [0, (o.top - o.bot) / 2, 0], [o.r ?? .028, o.top + o.bot, o.r ?? .028]);
  return g;
}

export const MODELS = {
  // ═════════════════════ GAREN ═════════════════════
  garen(Up) {
    const plate = Up ? M(0xe8b443, { m: .92, r: .27, e: .1, ec: 0xff9a20 }) : metal(0xc9d3e4, .28);
    const plateD = Up ? M(0xa0721e, { m: .9, r: .32 }) : metal(0x75839b, .36);
    const trim = Up ? M(0xfff0c8, { m: .8, r: .22, e: .3, ec: 0xffd070 }) : GOLD;
    const blueM = Up ? M(0xf1f4fa, { m: .15, r: .5 }) : M(0x2a58b8, { m: .45, r: .42 });
    const cl = Up ? cloth(0xeef2fa, 1) : cloth(0x1d3a86, 1);
    const gem = glow(Up ? 0x6fe6ff : 0x8fc4ff, Up ? 2.8 : 1.4);
    const dark = M(0x262b36, { m: .5, r: .5 }), skinC = 0xe6b893, skin = M(skinC, { r: .62 });
    const h = humanoid({ bulk: 1.3, skin: skinC, topM: blueM, sleeveM: dark, foreM: plate, handM: plateD, thighM: M(0x232c45, { r: .8 }), shinM: plate, bootM: plateD, beltM: trim, hipM: dark });
    const r = h.rig, hs = r.hs;
    P(r.torso, U.sph, plate, [0, .31, .055], [.275, .21, .14]);                       // peto
    P(r.torso, merged('dmGarChest', () => [X(U.ring, [0, .45, 0], [PI / 2, 0, 0], [.19, .16, 1.6]), X(U.box, [0, .2, .17], [0, 0, 0], [.03, .2, .03]), ...emblem([0, .36, .2], 1.25)]), trim);
    P(r.torso, U.oct, gem, [0, .36, .215], [.025, .04, .015]);
    P(r.torso, U.cyl, plate, [0, .46, 0], [.18, .07, .15]);                            // gola
    for (const [a, sx] of [[r.armL, -1], [r.armR, 1]]) {                             // hombreras de 3 capas
      const pg = pauldron(a, sx, plate, trim, .35, .25, { layer: plateD, tilt: .3 });
      P(pg, U.hemi, blueM, [sx * .09, -.14, 0], [.3, .17, .31], [0, 0, -sx * .5]);
      P(pg, U.oct, gem, [sx * .02, .12, .2], [.03, .05, .015]);
    }
    P(r.hips, merged('dmGarFauld', () => [-1, 1].flatMap(sx => [X(U.rbox, [sx * .16, -.1, .06], [-.1, 0, sx * .25], [.15, .22, .2]), X(U.rbox, [sx * .17, -.1, -.08], [.1, 0, sx * .25], [.14, .2, .18])])), plate);
    P(r.hips, U.rbox, cl, [0, -.26, .15], [.22, .46, .03]); P(r.hips, merged('dmGarTab', () => emblem([0, -.16, .17], 1)), trim);
    P(r.hips, U.rbox, cl, [0, -.24, -.14], [.24, .42, .03]);
    for (const k of [r.kneeL, r.kneeR]) P(k, U.sph, trim, [0, .0, .07], [.07, .07, .05]);
    const hm = hairM(0x5a3a22); hairCap(r, hm, { tilt: -.55, h: .95 }); bangs(r, hm, 4, { len: .09 }); brows(r, hm, .3);
    P(r.head, U.sph, skin, [0, .1, .05], [.21, .15, .2]);                               // mandíbula cuadrada
    face(r, skin, { mw: 1.1 });
    if (Up) P(r.head, merged('dmGarCrown', () => { const o = [X(U.ring, [0, .36, 0], [PI / 2 + .35, 0, 0], [.26, .26, .55])]; for (let i = 0; i < 9; i++) { const a = (i / 8 - .5) * 2.6; o.push(X(U.pyr, [Math.sin(a) * .25, .41 + Math.cos(a) * .05, Math.cos(a) * .17 - .05], [-.4 * Math.cos(a), 0, -a * .55], [.025, .16 - Math.abs(a) * .03, .012])); } return o; }), trim);
    cape(r, cl, { rT: .34, rM: .4, rB: .5, l1: .55, l2: .8, arc: 2.5, trim });
    r.weapon = sword(r.handR, { len: 1.35, w: .24, blade: Up ? M(0xf4f8ff, { m: .9, r: .14, e: .35, ec: 0x8fd8ff }) : metal(0xe6edf7, .18), guard: trim, grip: M(0x3a2414, { r: .7 }), glow: Up ? 0x8fe8ff : 0 });
    P(r.weapon, merged('dmGarGuard', () => [-1, 1].map(sx => X(U.pyr, [sx * .2, 0, .14], [0, 0, sx * 1.2], [.04, .16, .03]))), trim);
    r.armR.rotation.set(-.35, 0, .3); r.foreR.rotation.x = -1.85; r.weapon.rotation.set(.25, .55, 0);
    r.style = 'swing'; r.holdR = true; r.theme = Up ? 0xffe08a : 0x7fc0ff;
    return h;
  },

  // ═════════════════════ LUX ═════════════════════
  lux(Up) {
    const white = M(Up ? 0xfffaf0 : 0xf5f3ee, { m: .2, r: .45 }), gold = Up ? gld(true) : GOLD, blue = cloth(Up ? 0xf3d9ff : 0x3b6fd0);
    const h = humanoid({ bulk: .86, head: 1.1, skin: 0xf7dcc6, topM: white, sleeveM: white, foreM: white, handM: white, thighM: white, shinM: white, bootM: gold, beltM: gold, style: 'cast', eyeM: M(Up ? 0xb070ff : 0x2d5aa8, { r: .3, e: Up ? .8 : 0, ec: 0xc080ff }) });
    const r = h.rig, hs = r.hs;
    skirt(r, M(Up ? 0xfffaf0 : 0xf5f3ee, { r: .6, ds: 1 }), 'dmLux', [[.42, -.7], [.33, -.42], [.23, -.06], [.18, .1]], gold);
    P(r.hips, lathe('dmLuxPanel', [[.34, -.52], [.27, -.26], [.2, .05]]), M(Up ? 0xe8c8ff : 0x3b6fd0, { r: .8, ds: 1 }), [0, 0, .02], [.88, 1, 1.15]);
    P(r.torso, U.sph, blue, [0, .3, .03], [.235, .2, .16]);                              // corpiño azul
    P(r.torso, merged('dmLuxTrim', () => [X(U.oct, [0, .32, .175], [0, 0, 0], [.06, .095, .03]), X(U.ring, [0, .44, 0], [PI / 2, 0, 0], [.17, .14, 1.4]), ...[-1, 1].map(sx => X(U.box, [sx * .09, .25, .155], [0, 0, sx * .3], [.022, .28, .02]))]), gold);
    pauldron(r.armL, -1, gold, null, .16, .11, { tilt: .5, layer: white }); pauldron(r.armR, 1, gold, null, .16, .11, { tilt: .5, layer: white });
    const hb = hairM(Up ? 0xfff4d8 : 0xf3d06a); hairCap(r, hb, { tilt: -.5, w: 1.04 }); bangs(r, hb, 6, { len: .16 });
    r.tails = [P(r.head, tube('dmLuxHair', [[0, .32, -.14], [0, .14, -.3], [0, -.15, -.34], [0, -.45, -.32], [0, -.72, -.36]], taper(.17, .07, .08, 14), 20, 9), hb)];
    P(r.head, merged('dmLuxSide', () => [-1, 1].map(sx => X(tube('dmLuxLock', [[0, 0, 0], [.03, -.15, .02], [.02, -.34, 0]], taper(.065, .025), 10, 6), [sx * .22, .2, .06]))), hb);
    P(r.head, merged('dmLuxTiara', () => [X(U.ring, [0, .3, .01], [PI / 2 - .45, 0, 0], [.27, .26, .6]), ...[-1, 1].map(sx => X(U.pyr, [sx * .2, .38, .1], [0, 0, -sx * .9], [.02, .09, .01]))]), gold);
    P(r.head, U.oct, glow(Up ? 0xff8af0 : 0x7fb8ff, 2.2), [0, .38 * hs, .2 * hs], [.035, .055, .02]);
    face(r, M(0xf7dcc6, { r: .62 }), { mw: .7, mouth: M(0xd0707a, { r: .5 }) });
    // bastón de luz: asta blanca, alas doradas y orbe
    const st = grp(r.handR, 0, -.03, 0);
    P(st, U.cyl, white, [0, .3, 0], [.028, 1.45, .028]);
    P(st, merged('dmLuxStaffG', () => [X(U.ring, [0, 1.12, 0], [0, 0, 0], [.15, .17, 1.2]), X(U.cone, [0, .97, 0], [PI, 0, 0], [.05, .12, .05]), X(U.cyl, [0, -.38, 0], [0, 0, 0], [.04, .08, .04]), ...[-1, 1].flatMap(sx => [X(U.pyr, [sx * .16, 1.02, 0], [0, 0, sx * .95], [.03, .28, .06]), X(U.pyr, [sx * .2, 1.14, 0], [0, 0, sx * .5], [.02, .2, .04])])]), gold);
    const orb = P(st, U.sph, glow(Up ? 0xe080ff : 0xffc030, Up ? 1.8 : 1.5), [0, 1.12, 0], .085); P(st, U.sph, M(Up ? 0xff9ff0 : 0xffd860, { e: 1.2, ec: Up ? 0xff80e0 : 0xffc040, t: .25, add: 1 }), [0, 1.12, 0], .14);
    r.pulse = [orb]; r.weapon = st;
    r.armR.rotation.set(-.2, 0, .5); r.foreR.rotation.x = -.7; staffUpright(r, st); st.rotation.z = -.42;
    if (Up) { // Elementalista: orbes de los elementos orbitando
      const el = grp(r.root, 0, 1.1, 0);
      const cols = [0xff5a1a, 0x3fb8ff, 0x7fe05a, 0xbfe8ff, 0x9a5aff, 0xffe066];
      cols.forEach((c, i) => { const a = i / cols.length * TAU; P(el, U.sph, glow(c, 3), [Math.cos(a) * .62, Math.sin(i * 2.3) * .25, Math.sin(a) * .62], .055); });
      r.elems = el;
    }
    r.anim = (m, rr, stt, t) => { if (rr.elems) { rr.elems.rotation.y = t * 1.2; rr.elems.position.y = 1.1 + Math.sin(t * 1.7) * .06; } };
    r.theme = Up ? 0xff9ff0 : 0xfff0a0;
    return h;
  },

  // ═════════════════════ JARVAN IV ═════════════════════
  jarvan(Up) {
    const gold = Up ? M(0xd8a23a, { m: .75, r: .28, e: .1, ec: 0xff8a20 }) : GOLD;
    const steel = Up ? metal(0x3a3438, .4) : metal(0xb9c3d4, .3);
    const navy = Up ? cloth(0x7a1414) : cloth(0x1f3270), clM = Up ? cloth(0x8a1a16, 1) : cloth(0x203a86, 1);
    const dark = M(0x23262e, { m: .5, r: .5 }), skinC = 0xdcae88, skin = M(skinC, { r: .62 });
    const h = humanoid({ bulk: 1.22, skin: skinC, topM: steel, sleeveM: navy, foreM: gold, handM: steel, thighM: navy, shinM: gold, bootM: steel, beltM: gold, hipM: dark });
    const r = h.rig, hs = r.hs;
    P(r.torso, U.sph, gold, [0, .31, .055], [.265, .21, .14]);
    P(r.torso, merged('dmJarChest', () => [X(U.ring, [0, .45, 0], [PI / 2, 0, 0], [.18, .15, 1.6]), ...emblem([0, .35, .2], 1.2), X(U.box, [0, .17, .17], [0, 0, 0], [.2, .03, .03])]), steel);
    for (const [a, sx] of [[r.armL, -1], [r.armR, 1]]) {
      const pg = pauldron(a, sx, gold, steel, .31, .22, { layer: steel, tilt: .35 });
      P(pg, merged('dmJarPSpk', () => [X(U.cone, [0, .2, 0], [0, 0, 0], [.04, .2, .06]), X(U.cone, [.1, .14, 0], [0, 0, -.7], [.03, .14, .05])]), gold, [0, 0, 0], [sx, 1, 1]);
    }
    skirt(r, clM, 'dmJar', [[.33, -.4], [.28, -.2], [.2, .04]], gold);
    // yelmo-corona dorado con crestas
    P(r.head, U.hemi, gold, [0, .2 * hs, -.01], [.28, .3, .28], [-.35, 0, 0]);
    P(r.head, merged('dmJarHelm', () => {
      const o = [X(U.ring, [0, .27, .02], [PI / 2 - .35, 0, 0], [.285, .285, .9])];
      for (let i = 0; i < 5; i++) { const a = (i / 4 - .5) * 1.3; o.push(X(U.pyr, [Math.sin(a) * .22, .5 - Math.abs(a) * .12, Math.cos(a) * .2 - .02], [-.25, 0, -a * .6], [.035, .3 - Math.abs(a) * .12, .02])); }
      for (const sx of [-1, 1]) { o.push(X(U.pyr, [sx * .29, .3, -.05], [0, 0, -sx * .55], [.03, .3, .09])); o.push(X(U.box, [sx * .2, .12, .14], [0, sx * .4, 0], [.04, .16, .1])); }
      o.push(X(U.box, [0, .2, .25], [0, 0, 0], [.035, .12, .02]));
      o.push(X(ext('dmJarCrest', sh => { sh.moveTo(-.09, 0); sh.lineTo(-.05, .3); sh.lineTo(0, .42); sh.lineTo(.05, .3); sh.lineTo(.09, 0); sh.lineTo(-.09, 0); }, .03, .01, 0), [0, .4, .14], [-.3, 0, 0]));
      return o;
    }), gold);
    P(r.head, U.oct, glow(Up ? 0xff6a2a : 0x8fc4ff, 2.2), [0, .48 * hs, .22 * hs], [.035, .06, .02]);
    brows(r, M(0x2a1a14, { r: .7 }), .25); face(r, skin);
    P(r.head, U.sph, M(0x3a2418, { r: .8 }), [0, .06, .17], [.08, .05, .07]);           // perilla
    cape(r, clM, { rT: .33, rM: .38, rB: .47, l1: .55, l2: .76, arc: 2.5, trim: gold });
    // Lanza del Dragón: asta + gran hoja con gancho
    const sp = polearm(r.handR, { shaft: Up ? M(0x3a2418, { r: .6 }) : M(0x8a94a8, { m: .5, r: .35 }), top: 1.25, bot: .65, r: .032 });
    P(sp, ext('dmJarBlade', s => { s.moveTo(-.07, 0); s.lineTo(-.09, .25); s.lineTo(0, .62); s.lineTo(.09, .25); s.lineTo(.07, 0); s.lineTo(.18, -.06); s.lineTo(.22, .12); s.lineTo(.12, .06); s.lineTo(0, .02); s.lineTo(-.07, 0); }, .03, .01, 0), Up ? metal(0x2a2a30, .3) : metal(0xe6edf7, .18), [0, 1.27, 0]);
    P(sp, merged('dmJarLanceG', () => [X(U.cyl, [0, 1.22, 0], [0, 0, 0], [.07, .08, .07]), X(U.sph, [0, 1.3, 0], [0, 0, 0], [.08, .05, .05]), X(U.cone, [0, -.7, 0], [PI, 0, 0], [.04, .1, .04]), ...[-1, 1].map(sx => X(U.pyr, [sx * .1, 1.16, 0], [0, 0, sx * 1.9], [.025, .14, .04]))]), gold);
    if (Up) P(sp, ext('dmJarEdge', s => { s.moveTo(-.075, .05); s.lineTo(-.085, .25); s.lineTo(0, .58); s.lineTo(-.03, .25); s.lineTo(-.04, .05); }, .035, .004, 0), glow(0xff5a2a, 2.5), [0, 1.27, 0]);
    r.weapon = sp;
    r.armR.rotation.set(-.25, 0, .25); r.foreR.rotation.x = -.85;
    r.style = 'thrust'; r.holdR = true; r.theme = Up ? 0xff6a3a : 0xffd36a;
    r.anim = (m, rr, st) => { const a = st.atk >= 0 ? Math.min(1, st.atk) : -1; if (a >= 0) thrust(rr, a); hold(rr, 'R', sp, a >= 0 ? .15 + 1.35 * lunge(a) : .12, a >= 0 ? 0 : -.05); };
    return h;
  },

  // ═════════════════════ FIORA ═════════════════════
  fiora(Up) {
    const suit = Up ? M(0xeef0f4, { m: .3, r: .35 }) : cloth(0x1d2a5a), gold = Up ? M(0x2a2c34, { m: .7, r: .3 }) : GOLD;
    const neon = glow(Up ? 0xff2a6a : 0x7fb8ff, Up ? 3 : 1.2), coatM = Up ? M(0x24262e, { m: .3, r: .5, ds: 1 }) : M(0x16224a, { r: .8, ds: 1 });
    const skinC = 0xf2d0b6, skin = M(skinC, { r: .62 });
    const h = humanoid({ bulk: .84, head: 1.04, leg: 1.06, skin: skinC, topM: suit, sleeveM: suit, foreM: gold, handM: suit, thighM: suit, shinM: gold, bootM: suit, beltM: gold, hipM: suit, eyeM: M(Up ? 0xff2a6a : 0x3a2a4a, { r: .3, e: Up ? 1.5 : 0, ec: 0xff2a6a }) });
    const r = h.rig, hs = r.hs;
    P(r.torso, U.sph, gold, [0, .32, .04], [.22, .17, .14]);                            // coraza
    P(r.torso, merged('dmFioCollar', () => [X(lathe('dmFioCol', [[.12, 0], [.15, .08], [.2, .16]]), [0, .42, -.02]), ...[-1, 1].map(sx => X(U.box, [sx * .075, .22, .15], [0, 0, sx * .25], [.02, .26, .02]))]), gold);
    if (Up) P(r.torso, merged('dmFioNeon', () => [X(U.box, [0, .28, .175], [0, 0, 0], [.012, .2, .01]), X(U.ring, [0, .2, 0], [PI / 2, 0, 0], [.2, .15, .6])]), neon);
    pauldron(r.armR, 1, gold, Up ? neon : null, .2, .14, { tilt: .45, layer: suit });
    coat(r, coatM, { l: .7, rT: .19, rB: .33, arc: 3.4, trim: gold });
    // pelo: melena corta negra con mechón largo sobre un ojo
    const hk = hairM(Up ? 0xf4f6ff : 0x1c1826); hairCap(r, hk, { tilt: -.5, w: 1.06, d: 1.05, h: 1.02 });
    P(r.head, merged('dmFioBob', () => [-1, 1].map(sx => X(U.sph, [sx * .2, .14, -.03], [0, 0, sx * .2], [.1, .17, .17]))), hk);
    P(r.head, tube('dmFioBang', [[-.05, .44, .16], [.08, .38, .25], [.16, .26, .26], [.2, .12, .22]], taper(.07, .03), 12, 6), hk);
    face(r, skin, { mw: .65, mouth: M(0xb05060, { r: .5 }) });
    if (Up) P(r.head, U.rbox, M(0x15151c, { m: .5, r: .2 }), [0, .19 * hs, .235 * hs], [.22, .05, .03]), P(r.head, U.box, neon, [0, .19 * hs, .25 * hs], [.2, .012, .01]);
    // estoque con cazoleta
    const rp = grp(r.handR, 0, -.03, .02);
    P(rp, U.cyl, M(0x2a1a1a, { r: .6 }), [0, -.05, 0], [.022, .14, .022]);
    P(rp, lathe('dmFioCup', [[.0, -.02], [.09, .0], [.1, .04], [.03, .06]]), gold, [0, .02, 0]);
    P(rp, U.ring, gold, [0, .04, 0], [.11, .11, 1.2], [0, 0, 0]);
    P(rp, U.cyl, Up ? neon : metal(0xeef3fa, .14), [0, .62, 0], [.012, 1.12, .012]);
    P(rp, U.cone, Up ? neon : metal(0xeef3fa, .14), [0, 1.22, 0], [.014, .08, .014]);
    r.weapon = rp;
    r.armR.rotation.set(-.55, 0, .25); r.foreR.rotation.x = -.7;
    r.armL.rotation.set(.25, 0, -.45); r.foreL.rotation.x = -1.6;                       // mano en la cadera
    r.style = 'thrust'; r.holdR = true; r.holdL = true; r.theme = Up ? 0xff3a6a : 0x9fb8ff;
    r.anim = (m, rr, st) => { const a = st.atk >= 0 ? Math.min(1, st.atk) : -1; if (a >= 0) thrust(rr, a, 1.02); hold(rr, 'R', rp, a >= 0 ? 2.3 - .75 * lunge(a) : 2.3, a >= 0 ? 0 : -.3); };
    return h;
  },

  // ═════════════════════ GALIO ═════════════════════
  galio(Up) {
    const stone = Up ? M(0x3a3236, { r: .82, m: .1, fs: 1 }) : M(0xaab6c4, { r: .8, m: .05, fs: 1 });
    const stoneD = Up ? M(0x221c20, { r: .85, fs: 1 }) : M(0x7c8a9c, { r: .85, fs: 1 });
    const gold = Up ? M(0xff8a2a, { e: 1.6, ec: 0xff5a10, r: .5 }) : GOLD;
    const eye = glow(Up ? 0xff7a1a : 0x7fe0ff, 3.4), cl = cloth(Up ? 0x5a1410 : 0x2a4a9a, 1);
    const h = humanoid({ bulk: 1.75, head: .95, leg: .95, skin: Up ? 0x3a3236 : 0xaab6c4, topM: stone, sleeveM: stone, foreM: stoneD, handM: stone, thighM: stone, shinM: stoneD, bootM: stoneD, beltM: gold, hipM: stoneD, faceM: stone, noEyes: true, style: 'slam' });
    const r = h.rig, hs = r.hs; r.root.scale.setScalar(1.28); r.heavy = true;
    r.torso.rotation.x = .1;
    P(r.torso, merged('dmGalPecs', () => [-1, 1].map(sx => X(U.dod, [sx * .17, .33, .1], [.2, sx * .3, 0], [.2, .17, .14]))), stone);
    P(r.torso, merged('dmGalAbs', () => [-1, 1].flatMap(sx => [0, 1].map(i => X(U.dod, [sx * .07, .06 + i * .09, .14], [0, 0, 0], [.07, .05, .04])))), stoneD);
    P(r.torso, merged('dmGalTrim', () => [X(U.ring, [0, .47, -.02], [PI / 2, 0, 0], [.2, .17, 2.2]), ...emblem([0, .2, .2], 1.4)]), gold);
    // hombros de roca con borde
    for (const [a, sx] of [[r.armL, -1], [r.armR, 1]]) {
      P(a, U.dod, stone, [sx * .06, .04, 0], [.27, .24, .26]);
      P(a, merged('dmGalSh' + sx, () => [X(U.pyr, [sx * .14, .2, -.02], [0, 0, -sx * .5], [.07, .18, .07]), X(U.pyr, [sx * .22, .1, .04], [0, 0, -sx * 1.0], [.05, .14, .05])]), stoneD);
    }
    for (const f of [r.foreL, r.foreR]) P(f, U.cyl, gold, [0, -.08, 0], [.105, .06, .105]);
    for (const hd of [r.handL, r.handR]) { P(hd, U.dod, stone, [0, -.07, .02], [.17, .17, .17]); if (Up) P(hd, U.dod, M(0xff6a1a, { e: 1.6, ec: 0xff4a0a, t: .5, add: 1 }), [0, -.07, .02], .2); }
    // cabeza: cara de león-gárgola, melena hacia atrás y cuernos
    P(r.head, U.dod, stoneD, [0, .12, .08], [.22, .14, .2]);
    P(r.head, merged('dmGalMane', () => { const o = []; for (let i = 0; i < 9; i++) { const a = (i / 8 - .5) * 2.6; o.push(X(U.cone, [Math.sin(a) * .2, .38 - Math.abs(a) * .06, -.04], [-1.0 - Math.abs(a) * .15, 0, -a * .6], [.075, .46 - Math.abs(a) * .08, .05])); } for (const sx of [-1, 1]) o.push(X(tube('dmGalHorn' + sx, [[0, 0, 0], [sx * .1, .12, -.05], [sx * .15, .3, -.15], [sx * .1, .45, -.3]], taper(.07, .01), 12, 6), [sx * .16, .3, 0])); return o; }), stone);
    P(r.head, merged('dmGalEyes', () => [-1, 1].map(sx => X(U.box, [sx * .085, .2, .22], [0, 0, sx * -.3], [.08, .025, .02]))), eye);
    P(r.head, U.box, stoneD, [0, .24, .21], [.24, .04, .06]);                              // ceño
    P(r.head, merged('dmGalSnout', () => [X(U.dod, [0, .1, .2], [0, 0, 0], [.12, .08, .1]), X(U.dod, [0, .02, .14], [0, 0, 0], [.15, .06, .12]), ...[-1, 1].map(sx => X(U.cone, [sx * .1, .0, .2], [PI, 0, 0], [.025, .07, .025]))]), stone);
    // alas de piedra plegadas (plumas)
    const wingG = merged('dmGalWing', () => { const o = []; for (let i = 0; i < 5; i++) { const a = .25 + i * .26, L = 1.25 - i * .14; o.push(X(U.rbox, [Math.sin(a) * L * .5, Math.cos(a) * L * .5, -i * .02], [0, 0, -a], [.17, L, .05])); } o.push(X(U.cyl, [.18, .55, .02], [0, 0, -.32], [.06, 1.1, .06])); return o; });
    r.wings = [-1, 1].map(sx => { const wg = grp(r.torso, sx * .17, .4, -.2); wg.scale.x = sx; wg.rotation.set(-.25, sx * .35, 0); P(wg, wingG, stone); P(wg, U.dod, stoneD, [.05, .05, 0], .12); return wg; });
    if (Up) P(r.torso, merged('dmGalLava', () => [X(U.box, [-.1, .3, .17], [0, 0, .5], [.015, .2, .01]), X(U.box, [.12, .36, .17], [0, 0, -.4], [.015, .18, .01]), X(U.box, [0, .08, .18], [0, 0, 1.2], [.012, .14, .01])]), gold);
    P(r.hips, U.rbox, cl, [0, -.25, .17], [.3, .44, .04]); P(r.hips, U.rbox, cl, [0, -.22, -.17], [.32, .4, .04]);
    P(r.hips, merged('dmGalBelt', () => emblem([0, -.05, .22], 1.1)), gold);
    r.anim = (m, rr, st, t) => { const a = st.atk >= 0 ? Math.min(1, st.atk) : -1, f = a >= 0 ? kf(a, 0, [[0, 0], [.38, .35], [.55, -.15], [1, 0]]) : Math.sin(t * 1.3 + m.phase) * .04; rr.wings.forEach((w, i) => { w.rotation.y = B(w, 1) + (i ? 1 : -1) * f; }); };
    r.theme = Up ? 0xff6a1a : 0x8fd0ff;
    return h;
  },

  // ═════════════════════ QUINN + VALOR ═════════════════════
  quinn(Up) {
    const armor = Up ? M(0xc8402a, { m: .6, r: .38 }) : M(0x2f4f86, { m: .55, r: .4 }), leather = M(Up ? 0x4a2418 : 0x5a3c26, { r: .75 });
    const gold = Up ? gld(true) : GOLD, dark = cloth(Up ? 0x2a1210 : 0x1c2440), skinC = 0xeec4a0, skin = M(skinC, { r: .62 });
    const h = humanoid({ bulk: .88, head: 1.06, skin: skinC, topM: armor, sleeveM: dark, foreM: leather, handM: leather, thighM: dark, shinM: leather, bootM: leather, beltM: leather, hipM: dark, style: 'gun', eyeM: M(0x3a5a3a, { r: .3 }) });
    const r = h.rig, hs = r.hs;
    P(r.torso, merged('dmQuiChest', () => [X(U.ring, [0, .44, 0], [PI / 2, 0, 0], [.17, .14, 1.4]), ...emblem([0, .33, .17], .9)]), gold);
    for (const [a, sx] of [[r.armL, -1], [r.armR, 1]]) {
      const pg = pauldron(a, sx, armor, gold, .19, .13, { tilt: .45 });
      P(pg, merged('dmQuiFeath', () => [0, 1, 2].map(i => X(U.pyr, [.06 + i * .04, -.04 - i * .03, 0], [0, 0, -1.9 - i * .25], [.03, .14, .05]))), armor, [0, 0, 0], [sx, 1, 1]);
    }
    P(r.hips, lathe('dmQuiSkirt', [[.27, -.24], [.24, -.12], [.2, .04]]), M(Up ? 0x4a2418 : 0x5a3c26, { r: .75, ds: 1 }));
    // capucha + pelo castaño recogido
    const hm = hairM(Up ? 0x3a1a10 : 0x4a2c1a); hairCap(r, hm, { tilt: -.48 }); bangs(r, hm, 5, { len: .12 });
    P(r.head, U.sph, hm, [0, .22 * hs, -.27 * hs], .09);
    P(r.head, U.hemi, cloth(Up ? 0x8a2410 : 0x24386a, 1), [0, .16 * hs, -.07], [.31 * hs, .37 * hs, .33 * hs], [-.95, 0, 0]);
    face(r, skin, { mw: .7, mouth: M(0xb06058, { r: .5 }) });
    cape(r, cloth(Up ? 0x8a2410 : 0x24386a, 1), { rT: .25, rM: .29, rB: .34, l1: .45, l2: .5, arc: 2.3, trim: gold });
    // ballesta de repetición en el antebrazo
    const cb = grp(r.foreR, 0, -.18, .02);
    P(cb, U.rbox, leather, [0, 0, .05], [.08, .26, .1]);
    P(cb, tube('dmQuiBow', [[-.24, -.12, .1], [-.12, -.2, .12], [0, -.22, .13], [.12, -.2, .12], [.24, -.12, .1]], spindle(.025, .012), 14, 6), Up ? M(0xffa040, { m: .6, r: .3, e: .6, ec: 0xff5a10 }) : metal(0xc8d2e4, .3));
    P(cb, merged('dmQuiBolt', () => [X(U.cyl, [0, -.12, .14], [0, 0, 0], [.012, .3, .012]), X(U.cone, [0, -.3, .14], [PI, 0, 0], [.022, .06, .022]), X(U.box, [0, -.26, .05], [0, 0, 0], [.05, .1, .04])]), gold);
    r.weapon = cb;
    r.armR.rotation.set(-.6, 0, .25); r.foreR.rotation.x = -.85;
    // Valor
    const vb = grp(r.root, -.55, 1.65, .15), vbody = grp(vb); vbody.scale.setScalar(1.35);
    const fW = M(Up ? 0xffb03a : 0x2f4a7a, { r: .7, e: Up ? .9 : 0, ec: 0xff6a10 }), fH = M(Up ? 0xffe28a : 0xf4f2ee, { r: .8, e: Up ? .6 : 0, ec: 0xffa020 }), beak = M(0xf2c23a, { r: .4 });
    P(vbody, U.sph, fW, [0, 0, 0], [.1, .09, .2]);
    P(vbody, U.sph, fH, [0, .06, .17], [.075, .075, .08]);
    P(vbody, U.cone, beak, [0, .04, .27], [.025, .07, .025], [PI / 2 + .4, 0, 0]);
    P(vbody, merged('dmValEyes', () => [-1, 1].map(sx => X(U.sph, [sx * .045, .08, .22], [0, 0, 0], .014))), EYE);
    P(vbody, ext('dmValTail', s => { s.moveTo(0, 0); s.lineTo(.08, -.22); s.lineTo(0, -.18); s.lineTo(-.08, -.22); s.lineTo(0, 0); }, .015, .004), fW, [0, -.01, -.16], 1, [PI / 2 + .25, 0, 0]);
    const wingG = ext('dmValWing', s => { s.moveTo(0, 0); s.lineTo(.42, .06); s.lineTo(.36, -.02); s.lineTo(.3, -.08); s.lineTo(.22, -.1); s.lineTo(.12, -.12); s.lineTo(0, -.1); s.lineTo(0, 0); }, .012, .004, 0);
    const vw = [-1, 1].map(sx => { const w = grp(vbody, sx * .06, .04, .02); w.scale.x = sx; w.rotation.x = -PI / 2; P(w, wingG, fW); return w; });
    if (Up) P(vbody, U.sph, M(0xff8a2a, { e: 1.2, ec: 0xff5a10, t: .22, add: 1 }), [0, 0, -.05], [.16, .1, .26]);
    r.valor = { g: vb, body: vbody, wings: vw };
    r.anim = (m, rr, st, t) => {
      const v = rr.valor, a = st.atk >= 0 ? Math.min(1, st.atk) : -1, dive = a >= 0 ? kf(a, 0, [[0, 0], [.3, .2], [.55, 1], [.8, .4], [1, 0]]) : 0;
      v.g.position.set(-.55 + Math.sin(t * 1.3 + m.phase) * .12, 1.65 + Math.sin(t * 2.1) * .08 - dive * .6, .15 + dive * 1.4);
      v.body.rotation.set(-.15 + dive * .6, Math.sin(t * 1.3) * .3, Math.sin(t * 1.3 + 1) * .2);
      const fl = Math.sin(t * 11 + m.phase) * .7; v.wings.forEach(w => { w.rotation.z = fl; });
      if (a >= 0) { rr.armR.rotation.x = kf(a, B(rr.armR, 0), [[0, null], [.25, -1.45], [.6, -1.45], [1, null]]); rr.foreR.rotation.x = kf(a, B(rr.foreR, 0), [[0, null], [.25, -.1], [.38, -.25], [.6, -.1], [1, null]]); }
    };
    r.theme = Up ? 0xff8a2a : 0x9fd0ff;
    return h;
  },

  // ═════════════════════ SHYVANA ═════════════════════
  shyvana(Up) {
    if (Up) { // Forma de dragón
      const d = drake({ elem: 'shy', scale: 1.25, body: 0x8a1e2a, belly: 0xff8a2a, bellyGlow: true, wing: 0x5a0e1a, horn: 0x2a1418, glow: 0xffa030, wingE: .25, dark: 0x2a0c10 });
      const r = d.rig;
      P(r.head, merged('dmShyCrest', () => { const o = []; for (let i = 0; i < 5; i++) o.push(X(U.cone, [0, .2 - i * .02, -.05 - i * .09], [-1.2, 0, 0], [.035, .2 - i * .025, .02])); return o; }), M(0xff6a1a, { e: 1.4, ec: 0xff4a0a, r: .5 }));
      P(r.head, U.sph, M(0xffb040, { e: 2.2, ec: 0xff7a1a, t: .45, add: 1 }), [0, -.02, .5], [.1, .08, .12]);
      P(r.torso, merged('dmShyPlates', () => [0, 1, 2].map(i => X(U.sph, [0, .36 - i * .03, .3 - i * .28], [0, 0, 0], [.2 - i * .02, .06, .14]))), M(0xd4a640, { m: .9, r: .3 }));
      r.theme = 0xff6a1a;
      return d;
    }
    const scale = M(0x7a1a2e, { m: .55, r: .38 }), scaleD = M(0x3a0e18, { m: .5, r: .45 }), gold = GOLD, skinC = 0xe8bc9c, skin = M(skinC, { r: .62 });
    const claw = M(0xf2e2c8, { r: .35 }), fire = glow(0xff8a2a, 2.4);
    const h = humanoid({ bulk: .98, head: 1.04, skin: skinC, topM: scale, sleeveM: skin, foreM: scaleD, handM: scaleD, thighM: scaleD, shinM: scale, bootM: scaleD, beltM: gold, hipM: scaleD, eyeM: M(0xffb030, { r: .3, e: 1.4, ec: 0xff8a10 }) });
    const r = h.rig, hs = r.hs;
    P(r.torso, merged('dmShyChest', () => [X(U.ring, [0, .44, 0], [PI / 2, 0, 0], [.18, .15, 1.4]), ...[0, 1, 2].map(i => X(U.pyr, [0, .2 + i * .07, .16], [0, PI / 4, 0], [.06 - i * .01, .05, .03]))]), gold);
    for (const [a, sx] of [[r.armL, -1], [r.armR, 1]]) { // hombreras de ala de dragón
      const pg = pauldron(a, sx, scale, gold, .22, .15, { tilt: .4 });
      P(pg, merged('dmShyPSpk', () => [0, 1, 2].map(i => X(U.cone, [.04 + i * .07, .1 - i * .05, -.04], [0, 0, -.6 - i * .35], [.035, .22 - i * .04, .035]))), scaleD, [0, 0, 0], [sx, 1, 1]);
    }
    for (const hd of [r.handL, r.handR]) P(hd, merged('dmShyClaw', () => [-1, 0, 1].map(i => X(U.cone, [i * .04, -.1, .06], [PI - .5, 0, i * .2], [.018, .14, .018]))), claw);
    P(r.hips, merged('dmShyTasset', () => [-1, 0, 1].map(i => X(U.rbox, [i * .15, -.16, .05 - Math.abs(i) * .1], [-.12, i * .5, i * .12], [.15, .28, .03]))), scale);
    coat(r, cloth(0x5a1424, 1), { l: .5, rT: .2, rB: .3, arc: 2.6, trim: gold });
    // melena roja larga y salvaje + cuernos
    const hr = hairM(0xd8341c); hairCap(r, hr, { tilt: -.42, w: 1.08, h: 1.05 }); bangs(r, hr, 6, { len: .16, spread: 1.1 });
    r.tails = [P(r.head, tube('dmShyHair', [[0, .36, -.12], [0, .2, -.32], [0, -.1, -.38], [0, -.42, -.4], [0, -.7, -.5]], taper(.22, .05, .25, 18), 22, 9), hr)];
    P(r.head, merged('dmShyHairS', () => [-1, 1].map(sx => X(tube('dmShyLock' + sx, [[0, 0, 0], [sx * .04, -.18, -.02], [sx * .06, -.4, -.06]], taper(.08, .02), 10, 6), [sx * .21, .22, .02]))), hr);
    P(r.head, merged('dmShyHorn', () => [-1, 1].map(sx => X(tube('dmShyHornT' + sx, [[0, 0, 0], [sx * .04, .08, -.06], [sx * .06, .14, -.16]], taper(.035, .006), 8, 5), [sx * .14, .4, .05]))), M(0x2a1418, { r: .4 }));
    face(r, skin, { mw: .7, mouth: M(0xa04040, { r: .5 }) });
    const f1 = P(r.handR, U.oct, glow(0xff7a1a, 2.6), [0, -.12, .06], [.045, .08, .045]); r.pulse = [f1];
    r.armR.rotation.set(-.2, 0, .3); r.foreR.rotation.x = -.6; r.armL.rotation.set(-.15, 0, -.3); r.foreL.rotation.x = -.6;
    r.style = 'swing'; r.theme = 0xff6a1a;
    return h;
  },

  // ═════════════════════ POPPY ═════════════════════
  poppy(Up) {
    const skinC = Up ? 0xf4d8e8 : 0xa9b8e6, skin = M(skinC, { r: .62 });
    const armor = Up ? M(0xffffff, { m: .3, r: .35 }) : metal(0x8fa2c8, .35), blue = Up ? cloth(0xff6aa8) : cloth(0x2a4c9a), gold = Up ? gld(true) : GOLD;
    const h = humanoid({ bulk: 1.0, head: 1.55, leg: .62, skin: skinC, topM: blue, sleeveM: blue, foreM: armor, handM: M(0x4a3020, { r: .7 }), thighM: blue, shinM: armor, bootM: M(0x4a3020, { r: .7 }), beltM: gold, style: 'slam', eyeM: M(Up ? 0xd04a9a : 0x3a4ab0, { r: .25 }) });
    const r = h.rig, hs = r.hs; r.root.scale.setScalar(.8);
    P(r.torso, U.sph, armor, [0, .31, .05], [.23, .19, .13]);
    P(r.torso, merged('dmPopChest', () => [X(U.ring, [0, .43, 0], [PI / 2, 0, 0], [.16, .13, 1.4]), ...emblem([0, .32, .17], .9)]), gold);
    pauldron(r.armL, -1, armor, gold, .17, .12, { tilt: .4 }); pauldron(r.armR, 1, armor, gold, .17, .12, { tilt: .4 });
    // orejas yordle + coletas trenzadas
    P(r.head, merged('dmPopEars', () => [-1, 1].map(sx => X(U.cone, [sx * .3 * hs, .23 * hs, -.02], [0, 0, -sx * 1.35], [.06 * hs, .26 * hs, .03 * hs]))), skin);
    const hb = hairM(Up ? 0xffe0ef : 0xf2e6c4); hairCap(r, hb, { tilt: -.5, w: 1.03 }); bangs(r, hb, 5, { len: .13 });
    const tailG = tube('dmPopTail', [[0, 0, 0], [.1, -.06, -.04], [.16, -.25, -.06], [.17, -.5, -.04], [.14, -.72, 0]], taper(.075, .045, .35, 34), 26, 7);
    r.braids = [-1, 1].map(sx => { const bg = grp(r.head, sx * .22 * hs, .3 * hs, -.08 * hs); bg.scale.x = sx; P(bg, tailG, hb); P(bg, U.sph, Up ? cloth(0xff6aa8) : cloth(0x3a5ac0), [.04, -.02, -.02], [.06, .05, .05]); return bg; });
    face(r, skin, { mw: .6, mouth: M(0x6a3a5a, { r: .6 }) });
    // martillo enorme
    const hm = grp(r.handR, 0, -.03, .02);
    P(hm, U.cyl, M(0x6a4428, { r: .65 }), [0, .2, 0], [.035, 1.05, .035]);
    P(hm, U.cyl, armor, [0, .82, 0], [.2, .48, .2], [0, 0, PI / 2]);
    P(hm, merged('dmPopHamG', () => [X(U.cyl, [.25, .82, 0], [0, 0, PI / 2], [.215, .05, .215]), X(U.cyl, [-.25, .82, 0], [0, 0, PI / 2], [.215, .05, .215]), X(U.cyl, [0, .82, 0], [0, 0, PI / 2], [.205, .08, .205]), X(U.sph, [0, -.32, 0], [0, 0, 0], .05), ...emblem([0, .82, .2], 1)]), gold);
    if (Up) P(hm, merged('dmPopStar', () => [0, 1, 2, 3, 4].map(i => { const a = i / 5 * TAU; return X(U.pyr, [-.27 - Math.abs(Math.cos(a)) * 0, .82 + Math.cos(a) * .17, Math.sin(a) * .17], [a, 0, PI / 2], [.06, .2, .03]); })), glow(0xffe36a, 2.5));
    r.weapon = hm;
    r.armR.rotation.set(-.2, 0, .3); r.foreR.rotation.x = -1.7; hm.rotation.set(-.4, 0, 0);
    r.holdR = true;
    // escudo (Embajadora de Hierro) a la espalda
    const sh = grp(r.torso, 0, .3, -.2); sh.rotation.x = PI / 2 + .15;
    P(sh, lathe('dmPopShield', [[0, .06], [.2, .045], [.3, .0], [.31, -.02], [0, -.02]]), armor, [0, 0, 0], 1, [PI, 0, 0]);
    P(sh, merged('dmPopShG', () => [X(U.ring, [0, -.03, 0], [PI / 2, 0, 0], [.3, .3, .8]), ...emblem([0, -.06, 0], 1.4, 0).map(g => g.rotateX(PI / 2))]), gold);
    r.theme = Up ? 0xff8fd0 : 0x8fb8ff;
    return h;
  },

  // ═════════════════════ XIN ZHAO ═════════════════════
  xinzhao(Up) {
    const gold = Up ? M(0x1c1a20, { m: .6, r: .3 }) : GOLD, trim = Up ? GOLD : M(0x8a1e1e, { m: .3, r: .5 });
    const red = cloth(Up ? 0xa01818 : 0x8a1a1a, 1), dark = cloth(0x2a1c1c), skinC = 0xd09a70, skin = M(skinC, { r: .62 });
    const h = humanoid({ bulk: 1.12, skin: skinC, topM: gold, sleeveM: red, foreM: gold, handM: M(0x3a2418, { r: .7 }), thighM: dark, shinM: gold, bootM: M(0x2a1c14, { r: .7 }), beltM: trim, hipM: dark });
    const r = h.rig, hs = r.hs;
    P(r.torso, merged('dmXinPlates', () => [0, 1, 2, 3].map(i => X(U.cyl, [0, .14 + i * .085, .02], [0, 0, 0], [.22 + i * .012, .045, .15 + i * .006]))), gold);
    P(r.torso, merged('dmXinTrim', () => [X(U.ring, [0, .44, 0], [PI / 2, 0, 0], [.18, .15, 1.6]), ...emblem([0, .36, .18], 1)]), trim);
    for (const [a, sx] of [[r.armL, -1], [r.armR, 1]]) { const pg = pauldron(a, sx, gold, trim, .26, .17, { tilt: .4, layer: gold }); P(pg, U.hemi, red, [sx * .1, -.12, 0], [.2, .1, .22], [0, 0, -sx * .7]); }
    skirt(r, red, 'dmXin', [[.32, -.3], [.28, -.15], [.21, .04]], trim);
    P(r.hips, U.rbox, gold, [0, -.18, .2], [.18, .3, .03]);
    // cabello negro con moño + barba
    const hk = hairM(0x15121a); hairCap(r, hk, { tilt: -.62, h: .95 }); brows(r, hk, .32);
    P(r.head, merged('dmXinBun', () => [X(U.sph, [0, .47, -.1], [0, 0, 0], [.08, .08, .08]), X(U.cyl, [0, .5, -.1], [0, 0, 0], [.03, .1, .03]), X(tube('dmXinPony', [[0, .48, -.14], [0, .4, -.3], [0, .2, -.36], [0, 0, -.34]], taper(.06, .02), 12, 6), [0, 0, 0])]), hk);
    P(r.head, merged('dmXinBeard', () => [X(U.sph, [0, .06, .17], [0, 0, 0], [.1, .08, .08]), X(U.cone, [0, -.02, .19], [PI + .3, 0, 0], [.05, .12, .04]), ...[-1, 1].map(sx => X(U.box, [sx * .06, .11, .225], [0, 0, sx * .5], [.06, .015, .015]))]), hk);
    face(r, skin, { noMouth: true });
    if (Up) { P(r.head, U.hemi, gold, [0, .22, -.01], [.28, .27, .28], [-.4, 0, 0]); P(r.head, tube('dmXinPlume', [[0, .45, -.05], [0, .62, -.15], [0, .7, -.35], [0, .6, -.55]], taper(.06, .02, .2, 20), 14, 6), cloth(0xd02020, 1)); }
    // lanza con borla roja
    const sp = polearm(r.handR, { shaft: M(0x2a1a14, { r: .6 }), top: 1.35, bot: .75 });
    P(sp, ext('dmXinBlade', s => { s.moveTo(-.05, 0); s.quadraticCurveTo(-.09, .2, 0, .5); s.quadraticCurveTo(.06, .22, .05, 0); s.lineTo(-.05, 0); }, .025, .008, 0), Up ? metal(0xd8dde6, .2) : metal(0xe6edf7, .18), [0, 1.36, 0]);
    P(sp, merged('dmXinSpG', () => [X(U.cyl, [0, 1.32, 0], [0, 0, 0], [.05, .1, .05]), X(U.cone, [0, -.8, 0], [PI, 0, 0], [.035, .1, .035]), X(U.ring, [0, 1.27, 0], [PI / 2, 0, 0], [.06, .06, 1.2])]), Up ? trim : gold);
    P(sp, merged('dmXinTassel', () => [0, 1, 2, 3, 4].map(i => X(U.cone, [Math.cos(i * 1.26) * .03, 1.17, Math.sin(i * 1.26) * .03], [PI, 0, Math.cos(i * 1.26) * .2], [.035, .2, .035]))), cloth(0xd02020, 1));
    r.weapon = sp;
    r.armR.rotation.set(-.25, 0, .25); r.foreR.rotation.x = -.85;
    r.style = 'thrust'; r.holdR = true; r.theme = Up ? 0xff5a3a : 0xffd36a;
    r.anim = (m, rr, st) => { const a = st.atk >= 0 ? Math.min(1, st.atk) : -1; if (a >= 0) thrust(rr, a); hold(rr, 'R', sp, a >= 0 ? .2 + 1.3 * lunge(a) : .18, a >= 0 ? 0 : -.08); };
    return h;
  },

  // ═════════════════════ VAYNE ═════════════════════
  vayne(Up) {
    const coatC = Up ? 0xe8edf4 : 0x1a1820, coatV = M(coatC, { r: Up ? .4 : .55, m: Up ? .4 : .2 }), red = Up ? glow(0x7fe8ff, 2) : M(0x8a1424, { r: .5 });
    const silver = metal(Up ? 0xf4f8ff : 0xb8c0cc, .25), leather = M(Up ? 0x8a9aae : 0x2a2028, { r: .6 }), skinC = 0xf2d2bc, skin = M(skinC, { r: .62 });
    const h = humanoid({ bulk: .86, head: 1.03, leg: 1.05, skin: skinC, topM: coatV, sleeveM: coatV, foreM: leather, handM: leather, thighM: M(Up ? 0x6a7a90 : 0x24202a, { r: .7 }), shinM: coatV, bootM: coatV, beltM: silver, hipM: leather, style: 'gun' });
    const r = h.rig, hs = r.hs;
    P(r.torso, merged('dmVayTrim', () => [X(U.ring, [0, .44, 0], [PI / 2, 0, 0], [.17, .14, 1.4]), ...[-1, 1].map(sx => X(U.box, [sx * .07, .26, .15], [0, 0, sx * .2], [.02, .3, .02])), X(U.oct, [0, .34, .16], [0, 0, 0], [.04, .06, .02])]), Up ? silver : red);
    P(r.torso, lathe('dmVayCollar', [[.13, 0], [.17, .1], [.2, .2]]), coatV, [0, .42, -.02]);
    pauldron(r.armL, -1, coatV, silver, .18, .12, { tilt: .4 }); pauldron(r.armR, 1, coatV, silver, .18, .12, { tilt: .4 });
    coat(r, M(coatC, { r: .55, ds: 1 }), { l: .78, rT: .2, rB: .36, arc: 3.6, trim: Up ? glow(0x7fe8ff, 1.5) : M(0x8a1424, { r: .5 }) });
    // pelo oscuro con coleta alta y gafas rojas
    const hk = hairM(Up ? 0xf2f6ff : 0x2a1c2a); hairCap(r, hk, { tilt: -.5 }); bangs(r, hk, 6, { len: .15 });
    r.tails = [P(r.head, tube('dmVayPony', [[0, .45, -.12], [0, .48, -.28], [0, .32, -.4], [0, .05, -.42], [0, -.3, -.4], [0, -.55, -.46]], taper(.1, .03, .15, 20), 22, 8), hk)];
    P(r.head, merged('dmVayGlass', () => [...[-1, 1].map(sx => X(U.cyl, [sx * .085, .2, .25], [PI / 2, 0, 0], [.055, .02, .045])), X(U.box, [0, .21, .255], [0, 0, 0], [.06, .012, .01])]), M(Up ? 0x7fe8ff : 0xd0202a, { m: .5, r: .1, e: Up ? 1.6 : .5, ec: Up ? 0x7fe8ff : 0xa01020 }));
    face(r, skin, { mw: .6, mouth: M(0x9a4050, { r: .5 }) });
    // ballesta de muñeca
    const cb = grp(r.foreR, 0, -.2, .03);
    P(cb, U.rbox, leather, [0, 0, .05], [.09, .3, .12]);
    P(cb, tube('dmVayBow', [[-.3, -.1, .12], [-.15, -.2, .15], [0, -.23, .16], [.15, -.2, .15], [.3, -.1, .12]], spindle(.03, .012), 14, 6), silver);
    P(cb, merged('dmVayBolt', () => [X(U.cyl, [0, -.14, .17], [0, 0, 0], [.014, .34, .014]), X(U.cone, [0, -.34, .17], [PI, 0, 0], [.026, .08, .026]), X(U.box, [0, -.06, .1], [0, 0, 0], [.06, .1, .06])]), Up ? glow(0x9ff0ff, 2) : silver);
    // carcaj de virotes de plata a la espalda
    P(r.torso, U.cyl, leather, [.08, .25, -.2], [.06, .38, .06], [0, 0, -.4]);
    P(r.torso, merged('dmVayQuiv', () => [0, 1, 2].map(i => X(U.cone, [.17 + i * .02, .47, -.2 + (i - 1) * .03], [0, 0, -.4], [.018, .1, .018]))), silver);
    r.weapon = cb;
    r.armR.rotation.set(-.55, 0, .25); r.foreR.rotation.x = -.9;
    r.anim = (m, rr, st) => { const a = st.atk >= 0 ? Math.min(1, st.atk) : -1; if (a >= 0) { rr.armR.rotation.x = kf(a, B(rr.armR, 0), [[0, null], [.25, -1.5], [.6, -1.5], [1, null]]); rr.foreR.rotation.x = kf(a, B(rr.foreR, 0), [[0, null], [.25, -.05], [.36, -.3], [.6, -.05], [1, null]]); } };
    r.theme = Up ? 0x7fe8ff : 0xc8d0ff;
    return h;
  },
};
