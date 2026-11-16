import { THREE, M, glow, gld, cloth, metal, hairM, EYE, TAU, PI, U, cg, limb, lathe, tube, taper, spindle, ext, X, XAB, merged, capeGeo, grp, P, humanoid, hairCap, bangs, brows, pauldron, cape, skirt, bladeGeo, sword, staffUpright, f3, kf, S, SP, B } from '../kit.js';
// Modelos 3D de la legión Noxus. Cada función: (Up: bool mejorado, opts) => { g, rig, s }
// Convenciones del kit: pies en y=0, mirando a +Z, ≈2 de alto. Claves de geometría con prefijo "nx".

// ───────── utilidades locales ─────────
const GOLD = M(0xe2b24c, { m: .65, r: .3 });
const IRON = M(0x4c525e, { m: .7, r: .4 }), IRONL = M(0x8c939e, { m: .6, r: .32 });
const face = (r, skin, o = {}) => {
  const hs = r.hs;
  P(r.head, U.sph, skin, [0, .15 * hs, .245 * hs], [.03 * hs, .035 * hs, .03 * hs]);
  if (!o.noMouth) P(r.head, U.rbox, o.mouth ?? M(0x7a3a34, { r: .6 }), [0, .085 * hs, .228 * hs], [.07 * hs * (o.mw ?? 1), .014 * hs, .02 * hs]);
};
function coat(r, mat, o) { // faldones abiertos por delante
  const c = grp(r.hips, 0, o.y ?? .05, o.z ?? 0), rB = o.rB ?? .34, arc = o.arc ?? 3.8;
  P(c, capeGeo(o.rT ?? .2, rB, o.l, arc), mat);
  if (o.trim) P(c, capeGeo(rB * 1.01, rB * 1.025, .05, arc), o.trim, [0, -o.l + .05, 0]);
  r.coat = c; return c;
}
// emblema noxiano (punta de flecha/hacha triple) para merged()
const noxEmblem = (p, s = 1) => [X(U.pyr, [p[0], p[1] + .02 * s, p[2]], [0, PI / 4, 0], [.05 * s, .1 * s, .02 * s]), ...[-1, 1].map(sx => X(U.pyr, [p[0] + sx * .06 * s, p[1] - .015 * s, p[2]], [0, PI / 4, sx * 2.3], [.03 * s, .08 * s, .015 * s]))];
// daga curva (hoja a lo largo de +Z de la mano)
const daggerGeo = (key, len, w) => ext(key, s => { s.moveTo(-w / 2, 0); s.quadraticCurveTo(-w * .9, len * .5, w * .3, len); s.quadraticCurveTo(w * .1, len * .45, w / 2, 0); s.lineTo(-w / 2, 0); }, .02, .006);
function dagger(hand, o) {
  const g = grp(hand, 0, -.04, .01);
  P(g, U.cyl, o.grip, [0, 0, -.04], [.022, .14, .022], [PI / 2, 0, 0]);
  P(g, U.rbox, o.guard, [0, 0, .04], [.12, .03, .04]);
  P(g, daggerGeo('nxDag' + f3(o.len), o.len, o.w ?? .08), o.blade, [0, 0, .05]);
  return g;
}
// hacha giratoria de Draven: buje + 3 hojas curvas en el plano YZ de la mano
const spinAxeGeo = () => merged('nxSpinAxe', () => {
  const blade = ext('nxSpinBlade', s => { s.moveTo(.05, -.03); s.quadraticCurveTo(.28, -.12, .42, .05); s.quadraticCurveTo(.36, .02, .3, .08); s.quadraticCurveTo(.2, .02, .05, .05); s.lineTo(.05, -.03); }, .025, .008, 0);
  return [0, 1, 2].map(i => X(blade, [0, 0, 0], [0, 0, i * TAU / 3]).rotateY(PI / 2));
});

// Tibbers (oso) construido como humanoide para que el kit lo anime
function bear(Up, small) {
  const fur = Up ? M(0x2e3a52, { m: .6, r: .4 }) : M(0x4e2f1f, { r: .95 }), tan = Up ? M(0xd4a640, { m: .8, r: .3 }) : M(0x9a6a44, { r: .9 });
  const claw = Up ? glow(0x5fe0ff, 2) : M(0xf2e6cf, { r: .4 }), teye = glow(Up ? 0x5fe0ff : 0xff7a1a, 3.2);
  const h = humanoid({ bulk: 2.0, head: 1.45, leg: .62, topM: fur, sleeveM: fur, foreM: fur, handM: tan, thighM: fur, shinM: fur, bootM: tan, beltM: Up ? GOLD : fur, hipM: fur, skin: Up ? 0x2e3a52 : 0x4e2f1f, faceM: fur, noEyes: true, noBelt: !Up, style: 'slam' });
  const r = h.rig, hs = r.hs; r.heavy = true;
  r.root.scale.setScalar(small ? .5 : 1.25);
  P(r.torso, U.sph, tan, [0, .18, .1], [.27, .27, .1]);                                      // barriga
  P(r.torso, merged('nxTibStitch', () => [0, 1, 2, 3].map(i => X(U.box, [-.06 + (i % 2) * .12, .1 + i * .08, .27], [0, 0, (i % 2 ? .6 : -.6)], [.014, .07, .012]))), M(0x1a0e08));
  P(r.head, U.sph, tan, [0, .12 * hs, .2 * hs], [.13 * hs, .1 * hs, .1 * hs]);              // hocico
  P(r.head, U.sph, M(0x1a0e08, { r: .4 }), [0, .17 * hs, .3 * hs], [.045 * hs, .03 * hs, .03 * hs]);
  P(r.head, merged('nxTibEars', () => [-1, 1].map(sx => X(U.sph, [sx * .2, .42, -.02], [0, 0, 0], [.09, .09, .05]))), fur, [0, 0, 0], hs);
  P(r.head, merged('nxTibEarIn', () => [-1, 1].map(sx => X(U.sph, [sx * .2, .42, .02], [0, 0, 0], [.055, .055, .03]))), tan, [0, 0, 0], hs);
  P(r.head, merged('nxTibEyes', () => [-1, 1].map(sx => X(U.sph, [sx * .095, .25, .21], [0, 0, 0], [.04, .045, .03]))), teye, [0, 0, 0], hs);
  P(r.head, U.box, M(0x1a0e08), [0, .08 * hs, .25 * hs], [.1 * hs, .015, .02]);
  for (const hd of [r.handL, r.handR]) P(hd, merged('nxTibClaw', () => [-1, 0, 1].map(i => X(U.cone, [i * .05, -.1, .07], [PI - .4, 0, 0], [.022, .1, .022]))), claw);
  if (Up) { // Tibbers hextech: placas y núcleo de cristal
    P(r.torso, U.oct, glow(0x5fe0ff, 3), [0, .3, .27], [.08, .1, .05]);
    P(r.torso, U.ring, GOLD, [0, .3, .26], [.13, .13, .5]);
    for (const [a, sx] of [[r.armL, -1], [r.armR, 1]]) pauldron(a, sx, GOLD, glow(0x5fe0ff, 2), .2, .13, { tilt: .4 });
    P(r.head, U.ring, GOLD, [0, .3 * hs, 0], [.25 * hs, .25 * hs, .5], [PI / 2 - .3, 0, 0]);
  } else if (!small) {
    const fl = P(r.torso, merged('nxTibFlame', () => { const o = []; for (let i = 0; i < 7; i++) { const a = (i / 6 - .5) * 2.6; o.push(X(U.cone, [Math.sin(a) * .3, .5 + Math.cos(a) * .05, -.12 - Math.cos(a) * .08], [-.5, 0, -a * .5], [.08, .32 - Math.abs(a) * .06, .08])); } return o; }), M(0xff7a1a, { e: 2.4, ec: 0xff5a0a, t: .8, add: 1 }));
    r.pulse = [fl];
  }
  r.theme = Up ? 0x5fe0ff : 0xff6a1a;
  return h;
}

export const MODELS = {
  // ═════════════════════ DARIUS ═════════════════════
  darius(Up) {
    const iron = Up ? M(0xd8a43a, { m: .8, r: .3, e: .08, ec: 0xff8a20 }) : M(0x535a68, { m: .7, r: .38 }), steel = Up ? M(0x2a2228, { m: .6, r: .35 }) : IRONL;
    const red = cloth(Up ? 0x6a0e14 : 0x9a1e1e, 1), gold = Up ? gld(true) : GOLD, leather = M(0x2a1a14, { r: .7 }), skinC = 0xd2a07c, skin = M(skinC, { r: .62 });
    const h = humanoid({ bulk: 1.34, head: .98, skin: skinC, topM: iron, sleeveM: cloth(Up ? 0x2a1014 : 0x5a1212), foreM: iron, handM: leather, thighM: cloth(0x221418), shinM: iron, bootM: iron, beltM: Up ? gold : M(0x6a5a3a, { m: .7, r: .35 }), hipM: cloth(0x221418) });
    const r = h.rig, hs = r.hs;
    P(r.torso, U.sph, steel, [0, .32, .055], [.26, .2, .135]);
    P(r.torso, merged('nxDarChest', () => [X(U.ring, [0, .45, 0], [PI / 2, 0, 0], [.19, .16, 1.6]), ...noxEmblem([0, .33, .2], 1.4)]), Up ? gold : iron);
    for (const [a, sx] of [[r.armL, -1], [r.armR, 1]]) {
      const pg = pauldron(a, sx, iron, steel, .35, .23, { layer: Up ? steel : M(0x6a1515, { m: .5, r: .45 }), tilt: .3 });
      P(pg, merged('nxDarSpk', () => [X(U.cone, [0, .2, -.08], [-.3, 0, 0], [.06, .4, .06]), X(U.cone, [.13, .13, .08], [.3, 0, -.6], [.05, .3, .05]), X(U.cone, [-.12, .13, .08], [.3, 0, .6], [.045, .26, .045]), X(U.cone, [.2, .02, -.05], [0, 0, -1.2], [.04, .22, .04])]), Up ? gold : steel, [0, 0, 0], [sx, 1, 1]);
    }
    P(r.hips, U.rbox, red, [0, -.24, .15], [.25, .46, .03]); P(r.hips, U.rbox, red, [0, -.24, -.15], [.25, .46, .03]);
    P(r.hips, merged('nxDarFauld', () => [-1, 1].map(sx => X(U.rbox, [sx * .17, -.1, .02], [0, 0, sx * .3], [.14, .22, .26]))), iron);
    const hm = hairM(Up ? 0xd8d8e0 : 0x2a1d18); hairCap(r, hm, { tilt: -.7, h: .78 });
    P(r.head, merged('nxDarBeard', () => [X(U.sph, [0, .07, .12], [0, 0, 0], [.17, .1, .12]), X(U.cone, [0, .0, .19], [PI + .35, 0, 0], [.05, .1, .04])]), hm);
    brows(r, hm, .42); face(r, skin, { mouth: M(0x5a2a24, { r: .6 }) });
    P(r.head, U.box, M(0xa86a5a, { r: .6 }), [-.1 * hs, .23 * hs, .24 * hs], [.012, .09, .01], [0, 0, .3]);  // cicatriz
    if (Up) P(r.head, merged('nxDarCrown', () => { const o = [X(U.ring, [0, .37, -.01], [PI / 2 + .3, 0, 0], [.25, .25, .6])]; for (let i = 0; i < 7; i++) { const a = (i / 6 - .5) * 2.4; o.push(X(U.cone, [Math.sin(a) * .24, .46 - Math.abs(a) * .03, Math.cos(a) * .15 - .06], [-.35 * Math.cos(a), 0, -a * .4], [.03, .28 - Math.abs(a) * .06, .03])); } return o; }), gold);
    cape(r, red, { rT: .34, rM: .39, rB: .5, l1: .55, l2: .78, arc: 2.6, trim: Up ? gold : null });
    // hacha noxiana
    const ax = grp(r.handR, 0, -.03, 0);
    P(ax, U.cyl, leather, [0, 0, .35], [.042, 1.75, .042], [PI / 2, 0, 0]);
    P(ax, merged('nxDarWrap', () => [0, 1, 2].map(i => X(U.cyl, [0, 0, -.15 + i * .28], [PI / 2, 0, 0], [.052, .06, .052]))), red);
    P(ax, U.cone, steel, [0, 0, -.6], [.05, .14, .05], [-PI / 2, 0, 0]);
    P(ax, ext('nxDarBlade', s => { s.moveTo(-.02, .95); s.lineTo(.18, .9); s.quadraticCurveTo(.45, .78, .68, .5); s.quadraticCurveTo(.92, 1.2, .7, 1.92); s.quadraticCurveTo(.45, 1.62, .18, 1.55); s.lineTo(-.02, 1.5); s.lineTo(-.02, .95); }, .055, .02), Up ? M(0xe0ae44, { m: .65, r: .3 }) : M(0xa2a9b4, { m: .45, r: .32 }));
    P(ax, ext('nxDarEdge', s => { s.moveTo(.58, .52); s.quadraticCurveTo(.87, 1.2, .62, 1.87); s.quadraticCurveTo(.8, 1.2, .66, .53); }, .065, .006), Up ? glow(0xff3a2a, 2.5) : M(0xe0e4ea, { m: .5, r: .2 }));
    P(ax, ext('nxDarBack', s => { s.moveTo(0, 1.05); s.lineTo(-.42, 1.18); s.lineTo(-.3, 1.26); s.lineTo(0, 1.42); }, .06, .015), Up ? gold : IRONL);
    P(ax, U.cone, steel, [0, 0, 1.68], [.05, .25, .05], [PI / 2, 0, 0]);
    r.weapon = ax; r.armR.rotation.set(-.15, 0, .3); r.foreR.rotation.x = -1.0; ax.rotation.set(-.35, .45, .9); ax.scale.setScalar(.82); ax.position.z = -.12;
    r.style = 'swing'; r.holdR = true; r.theme = Up ? 0xffc040 : 0xff3a2a;
    return h;
  },

  // ═════════════════════ DRAVEN ═════════════════════
  draven(Up) {
    const skinC = Up ? 0xd99a6e : 0xd2a07c, skin = M(skinC, { r: .58 });
    const leather = M(Up ? 0xff7a2a : 0x6a1414, { r: .55, m: .1 }), dark = M(0x2a1a1a, { r: .7 }), steel = IRONL;
    const h = humanoid({ bulk: 1.18, skin: skinC, topM: Up ? skin : leather, sleeveM: skin, foreM: Up ? skin : dark, handM: Up ? skin : M(0x8a1a1a, { r: .6 }), thighM: Up ? M(0xff7a2a, { r: .7 }) : dark, shinM: Up ? skin : dark, bootM: Up ? M(0x3fb8d0, { r: .6 }) : M(0x2a1a14, { r: .6 }), beltM: Up ? M(0x3fb8d0, { r: .5 }) : steel, hipM: Up ? M(0xff7a2a, { r: .7 }) : dark });
    const r = h.rig, hs = r.hs;
    if (!Up) {
      P(r.torso, merged('nxDraHarness', () => [X(U.ring, [0, .3, 0], [PI / 2, 0, .6], [.255, .18, 1.6]), X(U.ring, [0, .3, 0], [PI / 2, 0, -.6], [.255, .18, 1.6]), X(U.ring, [0, .45, 0], [PI / 2, 0, 0], [.18, .15, 1.6])]), dark);
      P(r.torso, merged('nxDraBuckle', () => [X(U.oct, [0, .3, .175], [0, 0, 0], [.05, .06, .03]), ...noxEmblem([0, .16, .15], .8)]), steel);
      const pg = pauldron(r.armL, -1, steel, M(0x6a1414, { r: .5 }), .26, .18, { tilt: .4, layer: dark });
      P(pg, merged('nxDraSpk', () => [0, 1, 2].map(i => X(U.cone, [-.05 - i * .06, .18 - i * .05, 0], [0, 0, .35 + i * .3], [.035, .2, .035]))), steel);
      for (const f of [r.foreL, r.foreR]) P(f, U.cyl, M(0x8a1a1a, { r: .6 }), [0, -.12, 0], [.075, .14, .075]);
      coat(r, cloth(0x5a1010, 1), { l: .45, rT: .2, rB: .3, arc: 2.6 });
    } else {
      P(r.torso, U.sph, skin, [0, .3, .05], [.24, .2, .14]);
      P(r.torso, U.ring, M(0xffd23a, { r: .4 }), [0, -.02, 0], [.36, .36, 2.6], [PI / 2, 0, 0]);       // flotador
      P(r.torso, U.ring, M(0xff4fa3, { r: .4 }), [0, -.02, 0], [.36, .36, 2.65], [PI / 2, 0, .4]);
    }
    // pelo engominado hacia atrás con cola y mostacho enorme
    const hk = hairM(0x1a1214); hairCap(r, hk, { tilt: -.75, h: .9, w: 1.03 }); brows(r, hk, .38);
    P(r.head, merged('nxDraHair', () => [X(tube('nxDraSweep', [[0, .44, .1], [0, .52, -.08], [0, .46, -.28], [0, .3, -.4], [0, .1, -.42]], taper(.13, .03), 16, 8), [0, 0, 0]), ...[-1, 1].map(sx => X(U.cone, [sx * .14, .38, -.05], [-1.3, 0, -sx * .4], [.05, .3, .04]))]), hk);
    P(r.head, merged('nxDraStache', () => [-1, 1].map(sx => X(tube('nxDraM' + sx, [[0, .1, .24], [sx * .08, .09, .245], [sx * .17, .04, .22], [sx * .22, -.06, .17], [sx * .2, -.12, .14]], taper(.035, .012), 14, 6), [0, 0, 0]))), hk);
    face(r, skin, { noMouth: true });
    if (Up) P(r.head, merged('nxDraShades', () => [...[-1, 1].map(sx => X(U.rbox, [sx * .085, .2, .25], [0, 0, 0], [.1, .055, .02])), X(U.box, [0, .21, .255], [0, 0, 0], [.08, .015, .01])]), M(0x101820, { m: .6, r: .1 }));
    // hachas giratorias en ambas manos
    const axM = Up ? M(0x3fb8ff, { r: .3, m: .1 }) : M(0xb8c0cc, { m: .55, r: .25 }), hubM = Up ? M(0xffd23a, { r: .4 }) : M(0x8a1a1a, { m: .4, r: .45 });
    r.axes = [r.handL, r.handR].map((hd, i) => {
      const g = grp(hd, 0, -.05, .05); const sp = grp(g); sp.scale.setScalar(1.15);
      P(sp, spinAxeGeo(), axM);
      P(sp, U.cyl, hubM, [0, 0, 0], [.08, .06, .08], [0, 0, PI / 2]);
      P(sp, U.ring, Up ? M(0xff4fa3, { r: .4 }) : GOLD, [0, 0, 0], [.1, .1, 1.2], [0, PI / 2, 0]);
      return sp;
    });
    r.armL.rotation.set(-.3, 0, -.25); r.foreL.rotation.x = -.9; r.armR.rotation.set(-.3, 0, .25); r.foreR.rotation.x = -.9;
    r.style = 'swing'; r.holdR = true; r.holdL = true; r.theme = Up ? 0x3fb8ff : 0xff3a2a;
    r.anim = (m, rr, st, t) => { const a = st.atk >= 0 ? Math.min(1, st.atk) : -1, k = a >= 0 ? 22 : 9; rr.axes.forEach((x, i) => { x.rotation.x = (t * k + i * 1.3) * (i ? -1 : 1); }); if (rr.axes[1]) rr.axes[1].visible = !(a > .5 && a < .8); };
    return h;
  },

  // ═════════════════════ KATARINA ═════════════════════
  katarina(Up) {
    const top = Up ? M(0xf4f0ea, { m: .3, r: .4 }) : M(0x1a1418, { r: .55 }), red = Up ? M(0xe8467a, { r: .5 }) : M(0xa01020, { r: .5 }), gold = Up ? gld(true) : M(0x9aa0aa, { m: .6, r: .3 });
    const skinC = 0xf2d0b8, skin = M(skinC, { r: .62 }), legs = Up ? M(0xe6e2dc, { r: .5 }) : M(0x1e181c, { r: .55 });
    const h = humanoid({ bulk: .84, head: 1.04, leg: 1.06, skin: skinC, topM: top, sleeveM: skin, foreM: top, handM: top, thighM: legs, shinM: Up ? gold : top, bootM: Up ? gold : top, beltM: red, hipM: legs, absM: skin, eyeM: M(0x2a6a3a, { r: .3 }) });
    const r = h.rig, hs = r.hs;
    P(r.torso, U.sph, top, [0, .31, .02], [.235, .16, .165]);                               // top corto (ombligo al aire)
    P(r.torso, merged('nxKatTrim', () => [X(U.ring, [0, .2, 0], [PI / 2, 0, 0], [.22, .155, 1.2]), X(U.ring, [0, .44, 0], [PI / 2, 0, 0], [.17, .14, 1.4]), ...noxEmblem([0, .33, .17], .8)]), red);
    pauldron(r.armL, -1, top, red, .17, .11, { tilt: .4 }); pauldron(r.armR, 1, Up ? gold : top, red, .17, .11, { tilt: .4 });
    coat(r, M(Up ? 0xe8467a : 0x1a1418, { r: .55, ds: 1 }), { l: .55, rT: .2, rB: .33, arc: 3.2, trim: red });
    P(r.hips, merged('nxKatSheath', () => [-1, 1].map(sx => X(U.rbox, [sx * .2, -.18, .02], [0, 0, sx * .15], [.05, .2, .05]))), M(0x3a2420, { r: .6 }));
    // melena roja muy larga
    const hr = hairM(0xc81e1a); hairCap(r, hr, { tilt: -.42, w: 1.07 }); bangs(r, hr, 6, { len: .16, spread: 1.05 });
    r.tails = [P(r.head, tube('nxKatHair', [[0, .36, -.12], [0, .18, -.32], [0, -.15, -.38], [0, -.55, -.38], [0, -.9, -.45], [0, -1.1, -.55]], taper(.17, .035, .1, 22), 24, 9), hr)];
    P(r.head, merged('nxKatLocks', () => [-1, 1].map(sx => X(tube('nxKatLock' + sx, [[0, 0, 0], [sx * .03, -.2, .02], [sx * .05, -.45, .0], [sx * .03, -.65, -.04]], taper(.07, .025), 12, 6), [sx * .22, .22, .05]))), hr);
    P(r.head, U.box, M(0xb04a4a, { r: .6 }), [-.09 * hs, .2 * hs, .238 * hs], [.01, .13, .01], [0, 0, .1]);   // cicatriz del ojo
    face(r, skin, { mw: .65, mouth: M(0xa8404a, { r: .5 }) });
    if (Up) P(r.head, merged('nxKatCrown', () => { const o = [X(U.ring, [0, .33, .01], [PI / 2 - .45, 0, 0], [.27, .26, .55])]; for (let i = 0; i < 5; i++) { const a = (i / 4 - .5) * 1.4; o.push(X(U.pyr, [Math.sin(a) * .22, .42, Math.cos(a) * .17], [-.3, 0, -a * .5], [.025, .13 - Math.abs(a) * .03, .012])); } return o; }), gold);
    const bl = Up ? M(0xffe2a8, { m: .7, r: .2, e: .4, ec: 0xff6aa0 }) : M(0xd8dde6, { m: .55, r: .2 });
    r.daggers = [r.handL, r.handR].map(hd => dagger(hd, { len: .42, w: .09, blade: bl, guard: Up ? gold : red, grip: M(0x2a1a1a, { r: .6 }) }));
    r.daggers.forEach(d => d.rotation.x = 2.7);                                             // agarre invertido
    r.armL.rotation.set(-.1, 0, -.35); r.foreL.rotation.x = -.6; r.armR.rotation.set(-.1, 0, .35); r.foreR.rotation.x = -.6;
    r.style = 'swing'; r.holdR = true; r.holdL = true; r.theme = Up ? 0xffd36a : 0xff3a4a;
    r.anim = (m, rr, st) => { // Loto de la Muerte: giro completo con los brazos abiertos
      const a = st.atk >= 0 ? Math.min(1, st.atk) : -1;
      if (a >= 0) { const sp = kf(a, 0, [[0, 0], [.2, 0], [.75, TAU], [1, TAU]]); rr.root.rotation.y = sp; const o = kf(a, 0, [[0, 0], [.2, 1], [.75, 1], [1, 0]]);
        rr.armL.rotation.set(-1.4 * o + B(rr.armL, 0) * (1 - o), 0, -1.2 * o + B(rr.armL, 2) * (1 - o)); rr.armR.rotation.set(-1.4 * o + B(rr.armR, 0) * (1 - o), 0, 1.2 * o + B(rr.armR, 2) * (1 - o));
        rr.foreL.rotation.x = rr.foreR.rotation.x = -.2 * o + B(rr.foreR, 0) * (1 - o); rr.body.position.y += .06 * o; }
      else rr.root.rotation.y = 0;
    };
    return h;
  },

  // ═════════════════════ SWAIN + BEATRICE ═════════════════════
  swain(Up) {
    const coatC = Up ? 0x1e4a2a : 0x2a1418, coatM = M(coatC, { r: .6 }), coatDS = M(coatC, { r: .6, ds: 1 }), trim = Up ? GOLD : M(0x8a1a1a, { r: .5 });
    const feath = M(Up ? 0x2a5a2a : 0x14101a, { r: .6, ds: 1 }), demon = M(Up ? 0x1a3a1a : 0x2a0e14, { r: .45, m: .2 }), red = glow(Up ? 0x7fff5a : 0xff1a2a, 4);
    const skinC = 0xe2c0a4, skin = M(skinC, { r: .62 });
    const h = humanoid({ bulk: 1.05, leg: 1.08, skin: skinC, topM: coatM, sleeveM: coatM, foreM: coatM, handM: M(0x2a2024, { r: .6 }), thighM: M(0x1a1418, { r: .7 }), shinM: M(0x2a2024, { r: .6 }), bootM: M(0x2a2024, { r: .6 }), beltM: trim, hipM: coatM, style: 'cast', eyeM: M(0x3a2a2a, { r: .3 }) });
    const r = h.rig, hs = r.hs; r.castSide = 'L';
    P(r.torso, merged('nxSwaVest', () => [X(U.ring, [0, .44, 0], [PI / 2, 0, 0], [.18, .15, 1.4]), ...[-1, 1].map(sx => X(U.box, [sx * .08, .25, .16], [0, 0, sx * .2], [.025, .34, .02])), ...noxEmblem([0, .35, .17], .8)]), trim);
    coat(r, coatDS, { l: .82, rT: .21, rB: .38, arc: 4.0, trim });
    // manto de plumas de cuervo
    P(r.torso, merged('nxSwaMantle', () => { const o = []; for (let row = 0; row < 2; row++) for (let i = 0; i < 11; i++) { const a = (i / 10 - .5) * (PI * 1.5) + PI; o.push(X(U.cone, [Math.sin(a) * (.3 + row * .04), .48 - row * .1, Math.cos(a) * (.22 + row * .04)], [PI - .6 * Math.cos(a), 0, -.6 * Math.sin(a)], [.06, .3 + row * .06, .03])); } return o; }), feath);
    P(r.torso, U.sph, feath, [0, .46, -.02], [.3, .1, .22]);
    // brazo demoníaco (izquierdo)
    for (const p of [r.armL]) { p.scale.setScalar(1.3); }
    P(r.foreL, U.sph, demon, [0, -.12, 0], [.1, .16, .1]);
    P(r.handL, U.sph, demon, [0, -.04, .01], [.1, .1, .1]);
    P(r.handL, merged('nxSwaClaw', () => [-1, 0, 1, 2].map(i => X(U.cone, [i * .04 - .02, -.15, .06 - Math.abs(i) * .01], [PI - .4, 0, i * .15], [.022, .16, .022]))), M(0x1a0a0e, { r: .3 }));
    const palm = P(r.handL, U.sph, red, [0, -.06, .09], [.04, .05, .02]);
    P(r.foreL, merged('nxSwaVeins', () => [0, 1, 2].map(i => X(U.box, [Math.cos(i * 2.1) * .09, -.12 + i * .03, Math.sin(i * 2.1) * .09], [0, -i * 2.1, .3], [.012, .14, .012]))), red);
    // pelo blanco engominado y barba
    const hw = hairM(Up ? 0xd8d0c0 : 0xd8d8dc); hairCap(r, hw, { tilt: -.7, h: .92 }); brows(r, hw, .36);
    P(r.head, merged('nxSwaBeard', () => [X(U.sph, [0, .07, .14], [0, 0, 0], [.14, .09, .1]), X(U.cone, [0, -.02, .18], [PI + .25, 0, 0], [.06, .14, .04])]), hw);
    P(r.head, tube('nxSwaSweep', [[0, .44, .08], [0, .5, -.1], [0, .42, -.28], [0, .26, -.34]], taper(.12, .05), 12, 8), hw);
    face(r, skin, { noMouth: true });
    // Beatrice, su cuervo
    const bt = grp(r.torso, .3, .56, -.02), btb = grp(bt);
    const bk = M(0x0e0c14, { r: .55 });
    P(btb, U.sph, bk, [0, .08, 0], [.07, .07, .12]); P(btb, U.sph, bk, [0, .16, .08], .055);
    P(btb, U.cone, M(0x2a2a30, { r: .4 }), [0, .15, .15], [.018, .07, .018], [PI / 2, 0, 0]);
    P(btb, merged('nxBeaEye', () => [-1, 1].map(sx => X(U.sph, [sx * .035, .18, .11], [0, 0, 0], .012))), red);
    P(btb, merged('nxBeaWT', () => [X(U.pyr, [0, .07, -.15], [-1.3, 0, 0], [.04, .14, .02]), ...[-1, 1].map(sx => X(U.sph, [sx * .06, .08, -.02], [0, 0, 0], [.025, .06, .11]))]), bk);
    r.raven = btb;
    if (Up) { // alas de dragón
      const wg = merged('nxSwaDragW', () => [-1, 1].flatMap(sx => [X(tube('nxSwaWB' + sx, [[0, 0, 0], [sx * .3, .25, -.1], [sx * .6, .45, -.15]], taper(.03, .012), 10, 5), [sx * .1, .4, -.15]), X(ext('nxSwaWM' + sx, s => { s.moveTo(0, 0); s.lineTo(sx * .6, .45); s.lineTo(sx * .55, .1); s.lineTo(sx * .4, -.15); s.lineTo(sx * .2, -.2); s.lineTo(0, 0); }, .01, .003, 0), [sx * .1, .4, -.17])]));
      P(r.torso, wg, M(0x163a1e, { r: .55, ds: 1, e: .08, ec: 0x2aff5a }));
    }
    r.armR.rotation.set(.05, 0, .12); r.foreR.rotation.x = -.35;
    r.armL.rotation.set(-.35, 0, -.25); r.foreL.rotation.x = -.9;
    r.pulse = [palm]; r.theme = Up ? 0x7fff5a : 0xff2a4a;
    r.anim = (m, rr, st, t) => { rr.raven.rotation.y = Math.sin(t * .9 + m.phase) * .5; rr.raven.position.y = Math.max(0, Math.sin(t * 3.1)) * .015; };
    return h;
  },

  // ═════════════════════ LEBLANC ═════════════════════
  leblanc(Up) {
    const purple = Up ? M(0x1a1018, { r: .5 }) : M(0x5a2a8a, { r: .55 }), purpleDS = Up ? M(0x2a0e14, { r: .55, ds: 1 }) : M(0x4a1e78, { r: .6, ds: 1 });
    const gold = Up ? M(0xc8ccd8, { m: .75, r: .25 }) : GOLD, gem = glow(Up ? 0xff2a4a : 0xd06aff, 2.6), skinC = 0xf4e0d4, skin = M(skinC, { r: .6 });
    const h = humanoid({ bulk: .84, head: 1.04, leg: 1.04, skin: skinC, topM: purple, sleeveM: purple, foreM: gold, handM: purple, thighM: purple, shinM: purple, bootM: gold, beltM: gold, hipM: purple, style: 'cast', eyeM: M(Up ? 0xff2a4a : 0x8a3ad0, { r: .3, e: .6, ec: Up ? 0xff2a4a : 0xa04aff }) });
    const r = h.rig, hs = r.hs;
    skirt(r, purpleDS, 'nxLeb' + (Up ? 'U' : ''), [[.42, -.7], [.32, -.42], [.23, -.06], [.18, .1]], gold);
    P(r.hips, lathe('nxLebPanel', [[.34, -.52], [.27, -.26], [.2, .05]]), M(Up ? 0x8a1020 : 0xd4b05a, { r: .5, m: .3, ds: 1 }), [0, 0, .02], [.7, 1, 1.15]);
    P(r.torso, merged('nxLebTrim', () => [X(U.ring, [0, .44, 0], [PI / 2, 0, 0], [.17, .14, 1.4]), X(lathe('nxLebCol', [[.15, 0], [.2, .1], [.27, .22]]), [0, .42, -.03]), ...[-1, 1].map(sx => X(U.box, [sx * .07, .27, .16], [0, 0, sx * .3], [.02, .28, .02]))]), gold);
    P(r.torso, U.oct, gem, [0, .31, .18], [.04, .06, .02]);
    pauldron(r.armL, -1, gold, null, .17, .12, { tilt: .45, layer: purple }); pauldron(r.armR, 1, gold, null, .17, .12, { tilt: .45, layer: purple });
    cape(r, purpleDS, { rT: .24, rM: .3, rB: .4, l1: .5, l2: .72, arc: 2.6, trim: gold });
    // pelo negro + gran tocado dorado con cuernos
    const hk = hairM(0x1a1020); hairCap(r, hk, { tilt: -.5 }); bangs(r, hk, 6, { len: .14 });
    P(r.head, tube('nxLebHair', [[0, .3, -.16], [0, .1, -.3], [0, -.2, -.32], [0, -.5, -.3]], taper(.18, .08, .06, 12), 18, 9), hk);
    P(r.head, merged('nxLebCrown', () => { const o = [X(U.ring, [0, .33, .01], [PI / 2 - .4, 0, 0], [.27, .27, 1.2]), X(U.pyr, [0, .44, .2], [-.3, 0, 0], [.04, .14, .02])];
      for (const sx of [-1, 1]) { o.push(X(tube('nxLebHorn' + sx, [[sx * .22, .32, .05], [sx * .36, .45, .02], [sx * .42, .7, -.04], [sx * .36, .95, -.06], [sx * .24, 1.1, -.04]], taper(.07, .012), 20, 7), [0, 0, 0])); o.push(X(tube('nxLebHornS' + sx, [[sx * .25, .3, 0], [sx * .38, .32, -.05], [sx * .48, .42, -.08]], taper(.04, .008), 10, 5), [0, 0, 0])); }
      return o; }), gold);
    P(r.head, U.oct, gem, [0, .4 * hs, .24 * hs], [.03, .05, .015]);
    face(r, skin, { mw: .6, mouth: M(Up ? 0x8a1020 : 0x6a2a7a, { r: .4 }) });
    // cetro
    const st = grp(r.handR, 0, -.03, 0);
    P(st, U.cyl, gold, [0, .25, 0], [.022, 1.3, .022]);
    P(st, merged('nxLebScep', () => [X(cg('nxLebMoon', () => new THREE.TorusGeometry(.13, .02, 6, 18, 4.2)), [0, 1.0, 0], [0, 0, -2.1 + PI]), X(U.sph, [0, .9, 0], [0, 0, 0], .04), X(U.cone, [0, -.42, 0], [PI, 0, 0], [.03, .08, .03])]), gold);
    const orb = P(st, U.oct, gem, [0, 1.02, 0], [.05, .08, .05]); r.pulse = [orb];
    r.weapon = st; r.armR.rotation.set(-.2, 0, .5); r.foreR.rotation.x = -.7; staffUpright(r, st); st.rotation.z = -.42;
    r.theme = Up ? 0xff3a5a : 0xc86aff;
    return h;
  },

  // ═════════════════════ SION ═════════════════════
  sion(Up) {
    const flesh = Up ? M(0x4a3c3a, { r: .7, e: .07, ec: 0xff3a0a }) : M(0x8c9a8c, { r: .75 }), fleshD = Up ? M(0x2a2224, { r: .8 }) : M(0x6a5a52, { r: .8 });
    const iron = Up ? M(0x2e2624, { m: .55, r: .4, e: .05, ec: 0xff3a0a }) : M(0x5a5048, { m: .6, r: .5 }), rust = Up ? glow(0xff6a1a, 1.8) : M(0x7a4a2a, { m: .4, r: .6 }), red = cloth(Up ? 0x3a0a0a : 0x6a1414, 1);
    const eye = glow(Up ? 0xffa030 : 0xff2a1a, 3.5);
    const h = humanoid({ bulk: 1.6, head: .88, leg: .95, skin: Up ? 0x4a3c3a : 0x8c9a8c, topM: fleshD, sleeveM: flesh, foreM: iron, handM: flesh, thighM: M(0x2a2220, { r: .8 }), shinM: iron, bootM: iron, beltM: iron, hipM: M(0x2a2220, { r: .8 }), faceM: flesh, noEyes: true, style: 'slam' });
    const r = h.rig, hs = r.hs; r.root.scale.setScalar(1.36); r.heavy = true;
    r.torso.rotation.x = .28; r.head.rotation.x = -.2;
    P(r.torso, U.sph, iron, [0, .33, .06], [.27, .2, .14]);
    P(r.torso, merged('nxSioRibs', () => [0, 1, 2].map(i => X(U.box, [-.08, .14 + i * .05, .16], [0, 0, .1], [.12, .018, .02]))), M(0xd8d0b8, { r: .5 }));
    P(r.torso, merged('nxSioRust', () => [X(U.ring, [0, .45, 0], [PI / 2, 0, 0], [.2, .17, 2]), ...noxEmblem([0, .36, .2], 1.4)]), rust);
    for (const [a, sx] of [[r.armL, -1], [r.armR, 1]]) {
      const pg = pauldron(a, sx, iron, rust, .36, .26, { tilt: .3, layer: iron });
      P(pg, merged('nxSioSpk', () => [X(U.cone, [0, .26, -.04], [-.2, 0, 0], [.07, .42, .07]), X(U.cone, [.16, .16, .06], [.2, 0, -.7], [.055, .32, .055]), X(U.cone, [-.1, .18, .1], [.4, 0, .5], [.05, .26, .05])]), iron, [0, 0, 0], [sx, 1, 1]);
    }
    P(r.hips, U.rbox, red, [0, -.26, .17], [.26, .5, .03]); P(r.hips, U.rbox, red, [0, -.22, -.17], [.3, .42, .03]);
    // cabeza: yelmo abierto, mandíbula de hierro y un ojo brillante
    P(r.head, U.hemi, iron, [0, .22 * hs, -.02], [.28, .26, .28], [-.25, 0, 0]);
    P(r.head, merged('nxSioJaw', () => [X(U.rbox, [0, .07, .12], [0, 0, 0], [.26, .12, .2]), ...[-2, -1, 0, 1, 2].map(i => X(U.cone, [i * .045, .14, .22], [0, 0, 0], [.018, .06, .018]))]), M(0x8a8478, { m: .7, r: .35 }));
    P(r.head, U.sph, eye, [-.08 * hs, .22 * hs, .2 * hs], [.045, .03, .03]);
    P(r.head, U.sph, M(0x0a0808), [.08 * hs, .22 * hs, .2 * hs], [.04, .03, .03]);
    P(r.head, merged('nxSioHelmSpk', () => [-1, 1].map(sx => X(U.cone, [sx * .2, .42, -.05], [-.3, 0, -sx * .5], [.04, .2, .04]))), iron, [0, 0, 0], hs);
    // gran hacha de dos manos
    const ax = grp(r.handR, 0, -.03, 0);
    P(ax, U.cyl, M(0x3a2418, { r: .7 }), [0, 0, .3], [.05, 1.6, .05], [PI / 2, 0, 0]);
    P(ax, ext('nxSioBlade', s => { s.moveTo(0, .78); s.lineTo(.3, .68); s.lineTo(.55, .55); s.lineTo(.62, .75); s.lineTo(.58, .9); s.lineTo(.66, 1.05); s.lineTo(.6, 1.3); s.lineTo(.62, 1.5); s.lineTo(.35, 1.4); s.lineTo(0, 1.32); s.lineTo(0, .78); }, .07, .02), Up ? M(0x3a3234, { m: .5, r: .4 }) : M(0x8a8680, { m: .5, r: .4 }));
    P(ax, ext('nxSioEdge', s => { s.moveTo(.55, .56); s.lineTo(.62, .75); s.lineTo(.58, .9); s.lineTo(.66, 1.05); s.lineTo(.6, 1.3); s.lineTo(.62, 1.5); s.lineTo(.57, 1.46); s.lineTo(.55, 1.3); s.lineTo(.6, 1.05); s.lineTo(.52, .9); s.lineTo(.56, .75); s.lineTo(.5, .58); }, .075, .004), Up ? glow(0xff7a1a, 2.5) : M(0xb8b4ac, { m: .6, r: .3 }));
    P(ax, U.cone, iron, [0, 0, 1.18], [.06, .2, .06], [PI / 2, 0, 0]);
    r.weapon = ax; r.armR.rotation.set(-.2, 0, .3); r.foreR.rotation.x = -.9; ax.rotation.set(-.5, 0, 0); ax.position.z = -.1;
    r.holdR = true; r.theme = Up ? 0xff7a1a : 0xff2a1a;
    if (Up) P(r.torso, merged('nxSioLava', () => [X(U.box, [.12, .25, .175], [0, 0, .7], [.015, .18, .01]), X(U.box, [-.15, .4, .15], [0, 0, -.4], [.015, .14, .01]), X(U.box, [.02, .05, .17], [0, 0, 1.3], [.015, .12, .01])]), glow(0xff6a1a, 2.4));
    return h;
  },

  // ═════════════════════ TALON ═════════════════════
  talon(Up) {
    const hood = Up ? M(0x8a1414, { r: .65, ds: 1 }) : M(0x2a2a4a, { r: .7, ds: 1 }), suit = M(Up ? 0x2a1014 : 0x1e1e30, { r: .6 }), leather = M(Up ? 0x4a1a14 : 0x3a2a24, { r: .6 });
    const steel = Up ? gld(true) : M(0xc8d0dc, { m: .55, r: .2 }), skinC = 0xd8b090, skin = M(skinC, { r: .62 });
    const h = humanoid({ bulk: .95, leg: 1.04, skin: skinC, topM: suit, sleeveM: suit, foreM: leather, handM: leather, thighM: suit, shinM: leather, bootM: leather, beltM: Up ? GOLD : leather, hipM: suit, eyeM: M(0xd8c060, { r: .3, e: .9, ec: 0xffd040 }) });
    const r = h.rig, hs = r.hs;
    P(r.torso, merged('nxTalStraps', () => [X(U.ring, [0, .3, 0], [PI / 2, 0, .6], [.25, .17, 1.4]), X(U.ring, [0, .3, 0], [PI / 2, 0, -.6], [.25, .17, 1.4])]), leather);
    P(r.torso, merged('nxTalKnives', () => [0, 1, 2].map(i => X(U.pyr, [-.1 + i * .1, .3 + Math.abs(i - 1) * .03, .18], [.2, PI / 4, 0], [.02, .07, .01]))), steel);
    pauldron(r.armL, -1, leather, null, .17, .11, { tilt: .4 }); pauldron(r.armR, 1, leather, null, .17, .11, { tilt: .4 });
    // capucha y bufanda-máscara
    P(r.head, U.hemi, hood, [0, .19 * hs, -.01], [.34, .42, .35], [-.32, 0, 0]);
    P(r.head, U.ring, hood, [0, .2 * hs, .1], [.27, .3, 1.8], [-.2, 0, 0]);
    P(r.head, merged('nxTalHoodTip', () => [X(U.cone, [0, .5, .06], [.35, 0, 0], [.08, .14, .06]), X(U.box, [0, .3, .22], [-.2, 0, 0], [.22, .03, .05])]), hood);
    P(r.head, U.sph, M(Up ? 0x5a0e0e : 0x3a3a5a, { r: .7 }), [0, .1 * hs, .07], [.24, .12, .21]);
    brows(r, M(0x2a1a14, { r: .7 }), .4);
    // capa con cuchillas en el borde
    cape(r, hood, { rT: .27, rM: .33, rB: .42, l1: .5, l2: .7, arc: 2.6 });
    P(r.cape[1], merged('nxTalCapeBl', () => { const o = []; for (let i = 0; i < 7; i++) { const a = PI - 1.25 + i / 6 * 2.5; o.push(X(U.pyr, [Math.sin(a) * .43, -.73, Math.cos(a) * .43], [PI, -a, 0], [.025, .12, .008])); } return o; }), steel);
    // hojas de muñeca
    const bl = Up ? M(0xffd06a, { m: .8, r: .2, e: .5, ec: 0xff5a1a }) : M(0xd8dde6, { m: .55, r: .2 });
    r.blades = [r.foreL, r.foreR].map((f, i) => { const g = grp(f, 0, -.2, .06); g.scale.setScalar(1.45); P(g, ext('nxTalBlade', s => { s.moveTo(-.03, 0); s.lineTo(-.04, .3); s.lineTo(0, .48); s.lineTo(.05, .28); s.lineTo(.03, 0); s.lineTo(-.03, 0); }, .015, .005, 0), bl, [0, 0, 0], 1, [PI, 0, 0]); P(g, U.rbox, leather, [0, .02, -.02], [.08, .12, .06]); return g; });
    r.armL.rotation.set(-.2, 0, -.3); r.foreL.rotation.x = -.7; r.armR.rotation.set(-.2, 0, .3); r.foreR.rotation.x = -.7;
    r.style = 'swing'; r.theme = Up ? 0xff5a2a : 0x8a6aff;
    return h;
  },

  // ═════════════════════ ANNIE (+ osito Tibbers) ═════════════════════
  annie(Up) {
    const pink = Up ? M(0xf2f2f6, { m: .3, r: .4 }) : cloth(0xd8406e), white = Up ? M(0x2e3a52, { m: .5, r: .4 }) : M(0xf6eef0, { r: .8 }), gold = Up ? gld(true) : GOLD;
    const h = humanoid({ bulk: .82, head: 1.32, leg: .72, skin: 0xf4d0b4, topM: pink, sleeveM: pink, thighM: M(0xf4d0b4, { r: .62 }), shinM: white, bootM: cloth(Up ? 0x2e3a52 : 0x5a2a2a), beltM: Up ? gold : white, style: 'cast', eyeM: M(0x3a6a3a, { r: .3 }) });
    const r = h.rig, hs = r.hs; r.root.scale.setScalar(.85);
    skirt(r, Up ? M(0xf2f2f6, { r: .5, ds: 1 }) : M(0xd8406e, { r: .85, ds: 1 }), 'nxAnnie', [[.36, -.34], [.31, -.2], [.22, -.02], [.17, .1]], Up ? gold : white);
    P(r.torso, U.sph, white, [0, .45, .02], [.17, .06, .14]);
    if (Up) P(r.torso, U.oct, glow(0x5fe0ff, 2.6), [0, .3, .17], [.04, .06, .02]);
    const hr = hairM(0xc8341c); hairCap(r, hr, { tilt: -.5, w: 1.05, d: 1.05 }); bangs(r, hr, 5, { len: .13 });
    P(r.head, merged('nxAnnPig', () => [-1, 1].flatMap(sx => [X(U.sph, [sx * .27, .2, -.08], [0, 0, 0], [.1, .12, .1]), X(tube('nxAnnTail' + sx, [[sx * .3, .18, -.08], [sx * .38, .08, -.1], [sx * .4, -.08, -.08]], taper(.06, .03), 10, 6), [0, 0, 0])])), hr, [0, 0, 0], hs);
    P(r.head, merged('nxAnnBows', () => [-1, 1].map(sx => X(U.oct, [sx * .3, .27, -.06], [0, 0, PI / 2], [.04, .07, .03]))), Up ? glow(0x5fe0ff, 1.5) : M(0x7a3fa0, { r: .8 }), [0, 0, 0], hs);
    face(r, M(0xf4d0b4, { r: .62 }), { mw: .5, mouth: M(0xc05060, { r: .5 }) });
    const fb = P(r.handR, U.ico, glow(Up ? 0x5fe0ff : 0xff6a1a, 2.4), [0, -.1, .06], .07); P(r.handR, U.sph, M(Up ? 0x5fe0ff : 0xff5a1a, { e: 1, ec: Up ? 0x5fe0ff : 0xff3a0a, t: .25, add: 1 }), [0, -.11, .06], .11); r.pulse = [fb];
    // osito Tibbers en la mano izquierda
    const fur = Up ? M(0x2e3a52, { m: .5, r: .4 }) : M(0x4e2f1f, { r: .95 }), tan = Up ? GOLD : M(0x9a6a44, { r: .9 });
    const tb = grp(r.handL, 0, -.06, .1); tb.rotation.set(1.4, 0, .15); tb.scale.setScalar(1.9);
    P(tb, U.sph, fur, [0, -.05, 0], [.1, .12, .09]); P(tb, U.sph, tan, [0, -.05, .06], [.06, .07, .04]);
    P(tb, U.sph, fur, [0, .1, .01], [.09, .08, .08]); P(tb, U.sph, tan, [0, .08, .07], [.04, .03, .03]);
    P(tb, merged('nxTedEars', () => [-1, 1].flatMap(sx => [X(U.sph, [sx * .07, .17, 0], [0, 0, 0], .035), X(U.sph, [sx * .1, -.04, .01], [0, 0, 0], [.035, .06, .035]), X(U.sph, [sx * .05, -.17, .02], [0, 0, 0], [.04, .05, .04])])), fur);
    P(tb, merged('nxTedEyes', () => [-1, 1].map(sx => X(U.sph, [sx * .035, .12, .075], [0, 0, 0], .014))), Up ? glow(0x5fe0ff, 2) : M(0x101010));
    r.armL.rotation.set(-.35, 0, -.15); r.foreL.rotation.x = -1.0;
    r.holdL = true; r.theme = Up ? 0x5fe0ff : 0xff7a2a;
    return h;
  },
  tibbers(Up) { return bear(false, false); },
  tibbers_hex(Up) { return bear(true, false); },

  // ═════════════════════ CASSIOPEIA ═════════════════════
  cassiopeia(Up) {
    const scaleC = Up ? 0xd89ad8 : 0x3f8a3a, scaleM = M(scaleC, { r: .45, m: .15 }), belly = M(Up ? 0xf4eaf4 : 0xd8c070, { r: .5 }), gold = Up ? M(0xbfe8ff, { m: .6, r: .25, e: .3, ec: 0x7fd0ff }) : GOLD;
    const top = Up ? M(0xf4f0f8, { r: .5 }) : M(0x2a6a30, { r: .45, m: .2 }), skinC = Up ? 0xf4e0e6 : 0xe8d8c0, skin = M(skinC, { r: .58 });
    const h = humanoid({ bulk: .88, head: 1.05, skin: skinC, topM: top, sleeveM: skin, foreM: scaleM, handM: skin, thighM: scaleM, shinM: scaleM, bootM: scaleM, beltM: gold, hipM: scaleM, style: 'cast', eyeM: M(Up ? 0xff6ad0 : 0x9aff3a, { r: .3, e: .9, ec: Up ? 0xff4ad0 : 0x6aff2a }) });
    const r = h.rig, hs = r.hs;
    r.legL.visible = r.legR.visible = false;
    // cola de serpiente: tramo vertical + espiral en el suelo
    P(r.hips, tube('nxCasTail1', [[0, .05, 0], [0, -.25, .02], [0, -.55, -.02], [0, -.72, -.12], [0, -.78, -.35]], taper(.2, .16), 16, 12), scaleM);
    P(r.hips, U.sph, scaleM, [0, .02, 0], [.21, .16, .17]);
    P(r.hips, merged('nxCasBelly', () => [0, 1, 2, 3, 4].map(i => X(U.cyl, [0, -.1 - i * .13, .12 + (i > 3 ? -.04 : 0)], [PI / 2 - .1, 0, 0], [.13, .03, .05]))), belly);
    const coil = grp(r.hips, 0, -.78, -.35);
    P(coil, tube('nxCasTail2', [[0, 0, 0], [.2, 0, -.25], [.5, -.02, -.3], [.7, -.02, -.05], [.6, -.02, .3], [.25, -.02, .45], [-.15, -.02, .38], [-.45, .02, .1], [-.55, .1, -.2], [-.45, .25, -.4]], taper(.16, .02), 40, 10), scaleM);
    P(coil, merged('nxCasFin', () => [X(U.pyr, [-.45, .32, -.42], [-.6, 0, .3], [.05, .14, .015])]), gold);
    r.coil = coil;
    // corpiño, cuello, hombreras
    P(r.torso, merged('nxCasGold', () => [X(U.ring, [0, .44, 0], [PI / 2, 0, 0], [.17, .14, 1.4]), X(U.ring, [0, .16, 0], [PI / 2, 0, 0], [.2, .15, 1.2]), X(U.oct, [0, .31, .17], [0, 0, 0], [.05, .08, .03]), ...[-1, 1].map(sx => X(U.pyr, [sx * .11, .23, .14], [0, 0, sx * .5], [.03, .12, .02]))]), gold);
    pauldron(r.armL, -1, gold, null, .16, .1, { tilt: .5, layer: scaleM }); pauldron(r.armR, 1, gold, null, .16, .1, { tilt: .5, layer: scaleM });
    // pelo y corona de serpiente con aletas
    const hk = hairM(Up ? 0x2a2a5a : 0x1e2a1a); hairCap(r, hk, { tilt: -.5 }); bangs(r, hk, 6, { len: .14 });
    r.tails = [P(r.head, tube('nxCasHair', [[0, .3, -.16], [0, .1, -.3], [0, -.2, -.32], [0, -.55, -.3], [0, -.75, -.34]], taper(.19, .07, .06, 12), 20, 9), hk)];
    P(r.head, merged('nxCasCrown', () => { const o = [X(U.ring, [0, .31, .01], [PI / 2 - .45, 0, 0], [.275, .265, .9]), X(U.pyr, [0, .46, .18], [-.2, 0, 0], [.05, .16, .02])];
      for (const sx of [-1, 1]) { o.push(X(ext('nxCasFinS' + sx, s => { s.moveTo(0, 0); s.lineTo(sx * .22, .12); s.lineTo(sx * .3, .3); s.lineTo(sx * .14, .2); s.lineTo(sx * .2, .4); s.lineTo(0, .18); s.lineTo(0, 0); }, .015, .005, 0), [sx * .22, .28, -.02], [0, -sx * .5, 0])); }
      return o; }), gold);
    P(r.head, U.oct, glow(Up ? 0xff6ad0 : 0x9aff3a, 2.2), [0, .43 * hs, .22 * hs], [.03, .045, .015]);
    face(r, skin, { mw: .6, mouth: M(Up ? 0xd06a9a : 0x4a6a2a, { r: .4 }) });
    const orb = P(r.handR, U.sph, glow(Up ? 0xff9ad8 : 0x7fff3a, 2.6), [0, -.1, .06], .06); P(r.handR, U.sph, M(Up ? 0xff9ad8 : 0x7fff3a, { e: 1.4, ec: Up ? 0xff6ad0 : 0x5aff1a, t: .3, add: 1 }), [0, -.1, .06], .12);
    r.pulse = [orb]; r.skirt = true;
    r.anim = (m, rr, st, t) => { rr.coil.rotation.y = Math.sin(t * 1.4 + m.phase) * .12; rr.coil.rotation.z = Math.sin(t * 2.1 + m.phase) * .03; rr.legL.rotation.set(0, 0, 0); rr.legR.rotation.set(0, 0, 0); rr.body.position.y = Math.sin(t * 2 + m.phase) * .02; };
    r.theme = Up ? 0xff9fd8 : 0x7fff3a;
    return h;
  },

  // ═════════════════════ SAMIRA ═════════════════════
  samira(Up) {
    const coatC = Up ? 0x2a1a14 : 0x6a1418, coatM = M(coatC, { r: .6 }), coatDS = M(coatC, { r: .6, ds: 1 }), gold = Up ? M(0xc89a5a, { m: .7, r: .35 }) : GOLD;
    const black = M(0x1a1416, { r: .55 }), skinC = 0x8a5a3a, skin = M(skinC, { r: .55 }), leather = M(Up ? 0x5a3a24 : 0x3a2418, { r: .6 });
    const h = humanoid({ bulk: .9, leg: 1.05, skin: skinC, topM: black, sleeveM: coatM, foreM: leather, handM: leather, thighM: M(Up ? 0x4a3a2a : 0x3a2a24, { r: .7 }), shinM: leather, bootM: leather, beltM: gold, hipM: black, eyeM: M(Up ? 0xff6a1a : 0x2a1a10, { r: .3, e: Up ? 1.5 : 0, ec: 0xff4a0a }) });
    const r = h.rig, hs = r.hs;
    P(r.torso, merged('nxSamCorset', () => [X(U.ring, [0, .2, 0], [PI / 2, 0, 0], [.2, .15, 1.2]), X(U.ring, [0, .44, 0], [PI / 2, 0, 0], [.17, .14, 1.4]), ...[-1, 1].map(sx => X(U.box, [sx * .08, .28, .16], [0, 0, sx * .15], [.02, .3, .02]))]), gold);
    const pg = pauldron(r.armR, 1, gold, coatM, .22, .14, { tilt: .4, layer: gold });
    coat(r, coatDS, { l: .75, rT: .21, rB: .36, arc: 3.6, trim: gold });
    P(r.torso, U.sph, coatM, [0, .44, -.06], [.26, .08, .16]);
    // trenzas largas recogidas
    const hk = hairM(0x1a1210); hairCap(r, hk, { tilt: -.6, h: .95 });
    const brG = merged('nxSamBraids', () => [-.08, 0, .08].map((dx, i) => X(tube('nxSamBraid' + i, [[dx, .46, -.12], [dx * 1.5, .5, -.3], [dx * 1.8, .3, -.42], [dx * 2, 0, -.44], [dx * 2.2, -.35, -.42], [dx * 2.4, -.6, -.48]], taper(.06, .025, .3, 40), 26, 6), [0, 0, 0])));
    r.tails = [P(r.head, brG, hk)];
    P(r.head, U.sph, gold, [0, .48 * hs, -.18 * hs], [.07, .04, .06]);
    brows(r, hk, .28); face(r, skin, { mw: .65, mouth: M(0x5a2a24, { r: .5 }) });
    if (Up) { P(r.head, lathe('nxSamHat', [[0, 0], [.42, -.01], [.44, .02], [.24, .03], [.22, .14], [.2, .22], [0, .23]]), M(0x3a2418, { r: .7, ds: 1 }), [0, .36 * hs, -.02], 1, [-.18, 0, .08]); P(r.head, U.cyl, M(0x8a1a1a, { r: .6 }), [0, .41 * hs, -.03], [.225, .04, .225], [-.18, 0, .08]); }
    // espada curva (derecha) y revólver (izquierda)
    r.weapon = sword(r.handR, { len: .85, w: .1, tip: .2, blade: M(0xd8dde6, { m: .55, r: .2 }), guard: gold, grip: leather, glow: Up ? 0xff6a1a : 0 });
    r.armR.rotation.set(-.2, 0, .3); r.foreR.rotation.x = -.7; r.weapon.rotation.x = .5;
    const gun = grp(r.handL, 0, -.05, .02);
    P(gun, U.rbox, M(0x2a2a30, { m: .6, r: .35 }), [0, 0, .12], [.06, .07, .22]);
    P(gun, U.cyl, M(0x3a3a42, { m: .7, r: .3 }), [0, .02, .3], [.022, .2, .022], [PI / 2, 0, 0]);
    P(gun, U.cyl, gold, [0, .0, .14], [.045, .07, .045], [PI / 2, 0, 0]);
    P(gun, U.rbox, M(0x5a3a24, { r: .6 }), [0, -.07, .02], [.05, .14, .06], [-.4, 0, 0]);
    r.gun = gun; r.armL.rotation.set(-.5, 0, -.2); r.foreL.rotation.x = -.6; gun.rotation.x = 1.0;
    r.style = 'swing'; r.holdR = true; r.holdL = true; r.theme = Up ? 0xff4a1a : 0xffa040;
    r.anim = (m, rr, st) => { const a = st.atk >= 0 ? Math.min(1, st.atk) : -1; if (a >= 0) { rr.armL.rotation.x = kf(a, B(rr.armL, 0), [[0, null], [.3, -1.5], [.75, -1.5], [1, null]]); rr.foreL.rotation.x = kf(a, B(rr.foreL, 0), [[0, null], [.3, -.05], [.62, -.4], [.75, -.05], [1, null]]); rr.gun.rotation.x = kf(a, 1.0, [[0, null], [.3, 1.55], [.75, 1.55], [1, null]]); } };
    return h;
  },
};
