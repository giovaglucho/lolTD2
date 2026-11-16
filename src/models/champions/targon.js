import { THREE, M, glow, gld, cloth, metal, hairM, EYE, TAU, PI, U, cg, limb, lathe, tube, taper, spindle, ext, X, XAB, merged, capeGeo, grp, P, humanoid, hairCap, bangs, brows, pauldron, cape, skirt, bladeGeo, sword, staffUpright, f3, kf, S, SP } from '../kit.js';
// Modelos 3D de la legión Targon. Cada función: (Up: bool mejorado, opts) => { g, rig, s }
// Convenciones del kit: pies en y=0, mirando a +Z, ≈2 de alto. Claves de geometría con prefijo 'tg'.

const k0 = (a, fr) => kf(a, 0, fr);
const prof = (key, draw, depth, bevel = .01) => ext('tg' + key, draw, depth, bevel, 0); // forma en XY, grosor en Z
// estrella de 4 puntas (aplanada)
const starGeo = cg('tgStar4', () => { const o = []; for (let i = 0; i < 4; i++) o.push(X(U.pyr, [Math.cos(i * PI / 2) * .5, Math.sin(i * PI / 2) * .5, 0], [0, 0, i * PI / 2 - PI / 2], [.22, 1, .12])); return (merged('tgStar4m', () => o)); });
// media luna (creciente) en el plano XY
// R = radio exterior, th = grosor máximo; la panza mira a +X
const crescent = (key, R, th, depth) => ext('tg' + key, s => { const d = (R * R - (R - th) ** 2) / (2 * (R - th)), ri = R - th + d, a = Math.atan2(R, d); s.absarc(0, 0, R, -PI / 2, PI / 2, false); s.absarc(-d, 0, ri, a, -a, true); }, depth, Math.min(.01, th * .2), 0);
// fotograma de estocada / golpe para brazo derecho
function thrust(r, a) {
  const b = r.armR.userData.b, f = r.foreR.userData.b;
  r.armR.rotation.set(kf(a, b[0], [[0, null], [.3, -.3], [.45, -1.45], [.7, -1.35], [1, null]]), b[1], kf(a, b[2], [[0, null], [.3, .5], [.45, .1], [1, null]]));
  r.foreR.rotation.x = kf(a, f[0], [[0, null], [.3, -1.6], [.45, -.15], [.7, -.25], [1, null]]);
  S(r.torso, .1, k0(a, [[0, 0], [.3, .45], [.45, -.35], [.7, -.25], [1, 0]]), 0);
  SP(r.body, 0, 0, k0(a, [[0, 0], [.3, -.08], [.45, .25], [.75, .15], [1, 0]]));
}

export const MODELS = {
  // ═══════════════════════ LEONA ═══════════════════════
  leona(Up) {
    const goldA = Up ? M(0x1c1a22, { m: .85, r: .3 }) : M(0xe0a63a, { m: .88, r: .28 }), gold = Up ? M(0xffcf5a, { m: .95, r: .26, e: .35, ec: 0xff7a20 }) : gld(false);
    const red = cloth(Up ? 0x3a0e2a : 0x8a2a14, 1), white = M(Up ? 0x2a2230 : 0xf3ead6, { r: .6 }), under = cloth(Up ? 0x1a1420 : 0x6a2210);
    const sunC = Up ? 0xff5a3a : 0xfff0b0;
    const h = humanoid({ bulk: 1.1, skin: 0xc58d62, topM: goldA, sleeveM: under, foreM: goldA, handM: goldA, thighM: cloth(Up ? 0x1a1420 : 0x5a2010), shinM: goldA, bootM: goldA, beltM: gold, hipM: cloth(Up ? 0x1a1420 : 0x5a2010), eyeM: M(0x6a3a14, { r: .3 }) });
    const r = h.rig, hs = r.hs;
    skirt(r, red, 'tgLeo', [[.34, -.38], [.28, -.18], [.2, .04]], gold);
    P(r.hips, merged('tgLeoTass', () => [-1, 0, 1].map(i => X(U.rbox, [i * .14, -.22, .2 - Math.abs(i) * .05], [.1, i * .5, 0], [.12, .36, .025]))), goldA);
    P(r.torso, merged('tgLeoSun', () => { const o = [X(U.cyl, [0, .32, .17], [PI / 2, 0, 0], [.07, .02, .07])]; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; o.push(X(U.pyr, [Math.cos(a) * .1, .32 + Math.sin(a) * .1, .165], [0, 0, a - PI / 2], [.02, .07, .01])); } return o; }), glow(sunC, Up ? 2.5 : 1.4));
    pauldron(r.armL, -1, goldA, gold, .26, .18, { tilt: .4, layer: goldA }); pauldron(r.armR, 1, goldA, gold, .26, .18, { tilt: .4, layer: goldA });
    P(r.torso, U.cyl, gold, [0, .45, 0], [.18, .06, .15]);
    const hb = hairM(Up ? 0xf4f0f6 : 0x8a3a16); hairCap(r, hb, { tilt: -.5, w: 1.04 }); bangs(r, hb, 5, { len: .13 });
    r.tails = [P(r.head, tube('tgLeoHair', [[0, .32, -.16], [0, .05, -.32], [0, -.3, -.34], [0, -.7, -.36], [0, -.85, -.42]], taper(.2, .08, .05, 10), 18, 9), hb, [0, 0, 0], [1.3, 1, 1])];
    P(r.head, merged('tgLeoLocks', () => [-1, 1].map(sx => X(tube('tgLeoLock', [[0, 0, 0], [.02, -.2, .02], [.0, -.45, -.02]], taper(.06, .03), 10, 6), [sx * .23, .22, .03]))), hb);
    P(r.head, merged('tgLeoCrown', () => { const o = [X(U.ring, [0, .3, .02], [PI / 2 - .45, 0, 0], [.27, .26, .5])]; for (let i = 0; i < 9; i++) { const a = (i / 8 - .5) * 2.2; o.push(X(U.pyr, [Math.sin(a) * .25, .4 + Math.cos(a) * .07, Math.cos(a) * .15 - .02], [-.25 * Math.cos(a), 0, -a * .9], [.03, .24 - Math.abs(a) * .06, .015])); } return o; }), gold);
    // escudo del alba
    const sh = grp(r.handL, -.06, -.08, .05); sh.rotation.set(PI, 0, .45); sh.scale.setScalar(.85);
    P(sh, lathe('tgLeoShield', [[0, .1], [.25, .085], [.45, .045], [.56, 0], [.58, -.03], [.0, -.03]]), goldA);
    P(sh, merged('tgLeoRays', () => { const o = []; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; o.push(X(U.pyr, [Math.cos(a) * .66, 0, Math.sin(a) * .66], [PI / 2, 0, -a + PI / 2], [.065, i % 2 ? .16 : .24, .02], 1)); } return o; }), gold);
    P(sh, U.ring, Up ? glow(0xff5a3a, 2) : metal(0xfff0c0, .2), [0, .06, 0], [.4, .4, .8], [PI / 2, 0, 0]);
    const core = P(sh, U.sph, glow(sunC, Up ? 3.2 : 2.2), [0, .1, 0], [.16, .06, .16]);
    if (Up) P(sh, U.sph, M(0x0a0610, { r: .3 }), [0, .13, 0], [.12, .05, .12]);
    r.shield = sh; r.pulse = [core];
    r.weapon = sword(r.handR, { len: 1.0, w: .15, blade: Up ? M(0x2a2430, { m: .9, r: .2 }) : metal(0xf4dc95, .2), guard: gold, grip: M(0x5a2a10, { r: .7 }), glow: Up ? 0xff5a3a : 0xffe680 });
    r.armR.rotation.set(-.2, 0, .2); r.foreR.rotation.x = -.6; r.weapon.rotation.x = .3;
    r.armL.rotation.set(-.35, .2, -.3); r.foreL.rotation.x = -1.05;
    r.style = 'swing'; r.holdR = true; r.holdL = true; r.theme = Up ? 0xff5a3a : 0xffc040;
    return h;
  },

  // ═══════════════════════ SORAKA ═══════════════════════
  soraka(Up) {
    const skinC = Up ? 0xc9b4f4 : 0xb39ce8, skin = M(skinC, { r: .62 });
    const dressC = Up ? 0xfff0f8 : 0x2f9a86, dress = M(dressC, { r: .8, ds: 1 }), dressM = M(dressC, { r: .8 }), gold = gld(Up), white = M(Up ? 0xff9ad0 : 0xf2f0ea, { r: .7 });
    const hairC = Up ? 0xffc8ec : 0xf4f1ff, hw = hairM(hairC), hoof = M(0x3a2a40, { r: .5 });
    const h = humanoid({ bulk: .86, head: 1.06, leg: 1.04, skin: skinC, topM: dressM, sleeveM: white, foreM: skin, thighM: skin, shinM: skin, bootM: hoof, beltM: gold, hipM: dressM, style: 'cast', eyeM: M(Up ? 0x6a8aff : 0x2a8a6a, { r: .3, e: .5, ec: Up ? 0x6a8aff : 0x2fd0a0 }) });
    const r = h.rig, hs = r.hs; r.digi = true;
    skirt(r, dress, 'tgSor', [[.44, -.66], [.34, -.38], [.23, -.06], [.18, .1]], gold);
    P(r.hips, lathe('tgSorPanel', [[.36, -.5], [.29, -.25], [.21, .05]]), M(Up ? 0xff9ad0 : 0x1f6e60, { r: .8, ds: 1 }), [0, 0, .02], [.8, 1, 1.12]);
    P(r.torso, merged('tgSorCollar', () => [X(U.ring, [0, .43, 0], [PI / 2, 0, 0], [.2, .17, 1.4]), X(U.oct, [0, .33, .16], [0, 0, 0], [.05, .08, .03]), X(U.ring, [0, .16, 0], [PI / 2, 0, 0], [.2, .155, 1.2])]), gold);
    P(r.torso, U.sph, M(Up ? 0xff9ad0 : 0xe8e2d0, { r: .7 }), [0, .3, .02], [.235, .14, .16]);
    hairCap(r, hw, { tilt: -.5 }); bangs(r, hw, 6, { len: .15 });
    r.tails = [P(r.head, tube('tgSorHair', [[0, .3, -.15], [0, .1, -.3], [0, -.2, -.34], [0, -.55, -.32], [0, -.95, -.4]], taper(.21, .07, .06, 12), 20, 9), hw, [0, 0, 0], [1.25, 1, 1])];
    P(r.head, merged('tgSorEars', () => [-1, 1].map(sx => X(U.cone, [sx * .27, .22, -.02], [0, 0, -sx * 1.25], [.04, .2, .025]))), skin);
    P(r.head, tube('tgSorHorn', [[0, .3, .2], [0, .46, .3], [0, .64, .31], [0, .82, .24], [0, .9, .16]], taper(.075, .006, .12, 40), 22, 8), M(0xffe9b0, { r: .3, m: .3, e: Up ? 1.4 : .6, ec: 0xffc860 }));
    if (Up) P(r.head, merged('tgSorSG', () => [-1, 1].map(sx => X(starGeo, [sx * .2, .4, .05], [0, 0, 0], .1))), gold);
    // bastón de media luna
    const st = grp(r.handR, 0, -.03, 0);
    P(st, U.cyl, gold, [0, .3, 0], [.026, 1.5, .026]);
    P(st, cg('tgSorMoon', () => new THREE.TorusGeometry(.2, .035, 6, 22, 4.3)), gold, [0, 1.2, 0], 1, [0, 0, -2.15 + PI]);
    const star = P(st, Up ? starGeo : U.oct, glow(Up ? 0xffb0e0 : 0xbffff0, Up ? 3.5 : 2.6), [0, 1.2, 0], Up ? .16 : [.06, .1, .06]); P(st, U.sph, M(0x9fffe0, { e: 2, ec: Up ? 0xff8ad0 : 0x6fffd0, t: .3, add: 1 }), [0, 1.2, 0], .14);
    r.pulse = [star]; r.weapon = st;
    r.armR.rotation.set(-.3, 0, .2); r.foreR.rotation.x = -.75; staffUpright(r, st);
    r.theme = Up ? 0xffb0e0 : 0x8affd8;
    return h;
  },

  // ═══════════════════════ PANTHEON ═══════════════════════
  pantheon(Up) {
    const bronze = Up ? M(0x4a4e58, { m: .88, r: .3 }) : M(0xc08a3a, { m: .9, r: .3 }), bronzeD = Up ? M(0x24262e, { m: .85, r: .36 }) : M(0x7a5224, { m: .86, r: .38 });
    const redC = Up ? 0x7a0e0e : 0xa8231c, red = cloth(redC, 1), redM = M(redC, { r: .78 }), skinC = 0xc9946c;
    const h = humanoid({ bulk: 1.22, head: .96, skin: skinC, faceM: bronze, topM: bronze, absM: bronzeD, sleeveM: redM, foreM: M(skinC, { r: .6 }), handM: bronzeD, thighM: M(skinC, { r: .6 }), shinM: bronze, bootM: bronzeD, beltM: bronzeD, hipM: redM, style: 'swing', noEyes: true });
    const r = h.rig, hs = r.hs;
    // casco cerrado con visera en T, cresta y penacho
    P(r.head, merged('tgPanVisor', () => [X(U.box, [0, .19, .235], [0, 0, 0], [.22, .035, .04]), X(U.box, [0, .1, .24], [0, 0, 0], [.045, .16, .04])]), M(0x0c0806, { r: .9 }));
    P(r.head, merged('tgPanEyes', () => [-1, 1].map(sx => X(U.sph, [sx * .06, .19, .24], [0, 0, 0], [.03, .014, .01]))), glow(0xffa040, 3.5));
    P(r.head, merged('tgPanHelm', () => [X(U.ring, [0, .07, 0], [PI / 2, 0, 0], [.255, .245, 1.2]), X(U.sph, [0, .06, -.06], [0, 0, 0], [.27, .1, .26]), ...[-1, 1].map(sx => X(U.rbox, [sx * .2, .1, .14], [0, sx * .5, 0], [.06, .18, .12]))]), bronzeD);
    P(r.head, prof('PanCrest', s => { s.moveTo(-.32, .3); s.quadraticCurveTo(-.05, .62, .22, .5); s.lineTo(.26, .4); s.quadraticCurveTo(0, .48, -.28, .2); s.lineTo(-.32, .3); }, .035), Up ? bronzeD : M(0xe8c060, { m: .92, r: .25 }), [0, .02, .02], 1, [0, -PI / 2, 0]);
    P(r.head, tube('tgPanPlume', [[0, .54, .1], [0, .62, -.08], [0, .55, -.3], [0, .3, -.45], [0, -.05, -.5]], taper(.07, .03), 18, 7), red, [0, 0, 0], [1.6, 1, 1]);
    if (Up) P(r.head, merged('tgPanHorn', () => [-1, 1].map(sx => X(tube('tgPanHornT', [[0, 0, 0], [.08, .1, -.05], [.12, .25, -.15], [.1, .38, -.28]], taper(.045, .008), 10, 6), [sx * .2, .3, .02], [0, 0, 0], [sx, 1, 1]))), M(0xe8e0d0, { r: .4 }));
    // coraza, pteruges y capa
    P(r.torso, merged('tgPanCuir', () => [X(U.sph, [-.09, .32, .1], [0, 0, 0], [.12, .1, .08]), X(U.sph, [.09, .32, .1], [0, 0, 0], [.12, .1, .08]), X(U.cyl, [0, .45, 0], [0, 0, 0], [.2, .06, .16])]), bronze);
    P(r.torso, U.oct, Up ? glow(0xff3a2a, 2) : M(0xffe6a0, { m: .9, r: .2 }), [0, .2, .17], [.05, .07, .02]);
    P(r.hips, merged('tgPanPter', () => { const o = []; for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU; o.push(X(U.rbox, [Math.sin(a) * .21, -.2, Math.cos(a) * .17], [Math.cos(a) * .12, a, -Math.sin(a) * .12], [.08, .28, .02])); } return o; }), bronzeD);
    P(r.hips, lathe('tgPanSkirt', [[.27, -.3], [.24, -.15], [.2, .04]]), M(redC, { r: .78, ds: 1 }));
    pauldron(r.armL, -1, bronze, bronzeD, .3, .2, { tilt: .35, layer: red }); pauldron(r.armR, 1, bronze, bronzeD, .3, .2, { tilt: .35, layer: red });
    cape(r, red, { rT: .3, rM: .36, rB: .46, l1: .55, l2: .72, arc: 2.4, trim: Up ? M(0x1a1a1e, { m: .8, r: .4 }) : bronzeD });
    P(r.foreR, U.cyl, bronze, [0, -.12, 0], [.075, .16, .075]);
    // escudo redondo (Égida)
    const sh = grp(r.foreL, 0, -.16, .05); sh.rotation.set(PI / 2 + .25, 0, PI / 2); sh.scale.setScalar(.85);
    P(sh, lathe('tgPanShield', [[0, .12], [.28, .1], [.48, .05], [.56, 0], [.57, -.04], [0, -.04]], 28), bronze);
    P(sh, U.ring, bronzeD, [0, .02, 0], [.56, .56, 1.6], [PI / 2, 0, 0]);
    P(sh, merged('tgPanEmb', () => { const o = [X(U.cone, [0, .2, 0], [0, 0, 0], [.08, .14, .08])]; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; o.push(X(U.pyr, [Math.cos(a) * .24, .11, Math.sin(a) * .24], [PI / 2, 0, -a + PI / 2], [.04, .2, .02])); } return o; }), Up ? M(0xc8ccd6, { m: .9, r: .25 }) : M(0xffd36a, { m: .95, r: .25 }));
    P(sh, U.ring, red, [0, .1, 0], [.36, .36, .7], [PI / 2, 0, 0]);
    r.shield = sh;
    // lanza
    const sp = grp(r.handR, 0, -.03, 0);
    P(sp, merged('tgPanShaft', () => [X(U.cyl, [0, 0, .25], [PI / 2, 0, 0], [.028, 2.0, .028])]), Up ? M(0x1a1a20, { m: .6, r: .4 }) : M(0x4a2c18, { r: .6 }));
    P(sp, merged('tgPanTip', () => [X(bladeGeo(.42, .13, .2, .03), [0, 0, 1.2], [PI / 2, 0, 0]), X(U.cyl, [0, 0, 1.2], [PI / 2, 0, 0], [.045, .08, .045]), X(U.cone, [0, 0, -.8], [-PI / 2, 0, 0], [.04, .14, .04]), X(U.cyl, [0, 0, 0], [PI / 2, 0, 0], [.036, .22, .036])]), Up ? M(0xd8dde6, { m: .9, r: .2 }) : M(0xe8c060, { m: .92, r: .25 }));
    P(sp, tube('tgPanTassel', [[0, 0, 1.18], [0, -.1, 1.12], [0, -.25, 1.08]], taper(.04, .02), 6, 6), red);
    if (Up) P(sp, U.box, glow(0xff3a2a, 2.5), [0, 0, 1.38], [.012, .012, .3]);
    r.weapon = sp; r.armR.rotation.set(-.35, 0, .25); r.foreR.rotation.x = -1.2; sp.rotation.set(-.55, 0, 0);
    r.armL.rotation.set(-.45, .1, -.25); r.foreL.rotation.x = -1.2;
    r.holdR = r.holdL = true; r.theme = Up ? 0xff3a2a : 0xffb347;
    r.anim = (m, r, st) => { if (st.atk >= 0) thrust(r, st.atk); };
    return h;
  },

  // ═══════════════════════ DIANA ═══════════════════════
  diana(Up) {
    const skinC = Up ? 0xf4e2d8 : 0xe9e4f2;
    const suitC = Up ? 0xf2eee8 : 0x2a2a5c, suit = M(suitC, { r: .7 }), silver = Up ? M(0xe8b04a, { m: .85, r: .26 }) : M(0xcfd6e8, { m: .6, r: .24 });
    const accC = Up ? 0xb0202a : 0x4a3a9a, acc = cloth(accC, 1), moonC = Up ? 0xffd27a : 0xbfd8ff, moonG = glow(moonC, 2.6);
    const h = humanoid({ bulk: .9, head: 1.04, leg: 1.06, skin: skinC, topM: suit, sleeveM: suit, foreM: silver, handM: suit, thighM: suit, shinM: silver, bootM: silver, beltM: silver, hipM: suit, style: 'swing', eyeM: M(Up ? 0x3a1a14 : 0x6a7ad8, { r: .3, e: Up ? 0 : .4, ec: 0x6a7ad8 }) });
    const r = h.rig, hs = r.hs;
    const hw = hairM(Up ? 0x16121a : 0xeef0fa); hairCap(r, hw, { tilt: -.45, w: 1.03 }); bangs(r, hw, 6, { len: .16, spread: 1.05 });
    r.tails = [P(r.head, tube('tgDiHair', [[0, .32, -.14], [0, .08, -.3], [0, -.3, -.32], [0, -.7, -.3], [0, -1.05, -.38]], taper(.2, .06, .05, 10), 20, 9), hw, [0, 0, 0], [1.35, 1, 1])];
    P(r.head, merged('tgDiLocks', () => [-1, 1].map(sx => X(tube('tgDiLock', [[0, 0, 0], [.03, -.22, .03], [.01, -.5, .0]], taper(.06, .03), 10, 6), [sx * .23, .22, .05]))), hw);
    P(r.head, crescent('DiMark', .05, .02, .01), moonG, [0, .31 * hs, .235 * hs], 1, [0, 0, -PI / 2]);
    // armadura plateada con lunas
    P(r.torso, merged('tgDiPlate', () => [X(U.sph, [0, .32, .07], [0, 0, 0], [.2, .14, .11]), X(U.cyl, [0, .45, 0], [0, 0, 0], [.17, .06, .14])]), silver);
    P(r.torso, crescent('DiChest', .09, .03, .02), moonG, [0, .32, .18], 1, [0, 0, -PI / 2]);
    for (const [a, sx] of [[r.armL, -1], [r.armR, 1]]) { const pg = pauldron(a, sx, silver, null, .2, .14, { tilt: .5 }); P(pg, crescent('DiPaul', .2, .07, .03), silver, [sx * .05, .02, 0], 1, [PI / 2, 0, sx > 0 ? PI : 0]); }
    skirt(r, acc, 'tgDi', [[.3, -.44], [.25, -.2], [.19, .05]], silver);
    P(r.hips, merged('tgDiFlap', () => [X(U.rbox, [0, -.4, .19], [.15, 0, 0], [.16, .55, .02]), X(U.rbox, [0, -.4, -.18], [-.15, 0, 0], [.18, .55, .02])]), M(accC, { r: .8 }));
    cape(r, acc, { y: .44, rT: .22, rM: .27, rB: .34, l1: .45, l2: .55, arc: 2.0, trim: silver });
    // filo lunar (creciente)
    const bl = grp(r.handR, 0, -.03, 0);
    P(bl, U.cyl, M(0x1a1a2a, { r: .5 }), [0, 0, 0], [.03, .3, .03], [PI / 2, 0, 0]);
    const bg = grp(bl, 0, 0, .78); bg.rotation.set(0, PI / 2, 0);
    P(bg, crescent('DiBlade', .6, .17, .035), Up ? M(0xffe2a0, { m: .55, r: .25, e: .2, ec: 0xffa040 }) : M(0xe6ecff, { m: .45, r: .22, e: .25, ec: 0x8fa8ff }));
    P(bg, crescent('DiBladeE', .615, .035, .045), glow(moonC, 2.2));
    r.weapon = bl; r.armR.rotation.set(-.3, 0, .55); r.foreR.rotation.x = -1.1; bl.rotation.set(-.2, 0, 0); bl.scale.setScalar(.85);
    // tres esferas lunares orbitando (Cascada Pálida)
    const orb = grp(r.root, 0, 1.25, 0); orb.scale.setScalar(1.2); r.orbs = orb;
    P(orb, merged('tgDiOrbs', () => [0, 1, 2].map(i => X(U.sph, [Math.cos(i * TAU / 3) * .62, 0, Math.sin(i * TAU / 3) * .62], [0, 0, 0], .07))), glow(moonC, 3));
    P(orb, merged('tgDiOrbH', () => [0, 1, 2].map(i => X(U.sph, [Math.cos(i * TAU / 3) * .62, 0, Math.sin(i * TAU / 3) * .62], [0, 0, 0], .13))), M(moonC, { e: 1.5, ec: moonC, t: .3, add: 1 }));
    r.holdR = true; r.theme = moonC;
    r.anim = (m, r, st, t) => { r.orbs.rotation.y = t * 1.6 + m.phase; r.orbs.position.y = 1.25 + Math.sin(t * 2) * .05; };
    return h;
  },

  // ═══════════════════════ TARIC ═══════════════════════
  taric(Up) {
    const skinC = 0xe2b48c;
    const plate = Up ? M(0x2f7a4e, { m: .55, r: .3 }) : M(0xb4c8e4, { m: .55, r: .3 }), plateD = Up ? M(0x1a4a30, { m: .6, r: .35 }) : M(0x6a7ea8, { m: .6, r: .34 });
    const gold = gld(Up), gemC = Up ? 0x3aff8a : 0x5ad8ff, gem = M(gemC, { m: .1, r: .08, e: 1.4, ec: gemC }), gemP = M(Up ? 0x9aff6a : 0xd87aff, { m: .1, r: .08, e: 1.3, ec: Up ? 0x6aff3a : 0xb84aff });
    const capeC = Up ? 0x1e5a3a : 0x8a3a9a, capeM = cloth(capeC, 1);
    const h = humanoid({ bulk: 1.3, head: .96, skin: skinC, topM: plate, absM: plateD, sleeveM: M(capeC, { r: .75 }), foreM: plate, handM: plateD, thighM: M(0x2a2a3a, { r: .7 }), shinM: plate, bootM: plateD, beltM: gold, hipM: plateD, style: 'swing', eyeM: M(0x2a5a9a, { r: .3 }) });
    const r = h.rig, hs = r.hs;
    // melena platino ondulada
    const hw = hairM(0xf3e8cc); hairCap(r, hw, { tilt: -.55, w: 1.06, d: 1.05 }); bangs(r, hw, 4, { len: .1, spread: .8 });
    P(r.head, merged('tgTaHair', () => [-1, 0, 1].map(i => X(tube('tgTaLock', [[0, .3, -.1], [0, .1, -.26], [0, -.15, -.28], [0, -.32, -.2]], taper(.12, .05, .15, 14), 14, 7), [i * .13, 0, 0], [0, i * .3, 0]))), hw);
    brows(r, hw, .15);
    // armadura con gemas
    P(r.torso, merged('tgTaChest', () => [X(U.sph, [0, .31, .07], [0, 0, 0], [.25, .17, .13]), X(U.cyl, [0, .45, 0], [0, 0, 0], [.2, .07, .16])]), plate);
    P(r.torso, merged('tgTaFil', () => [X(U.ring, [0, .3, .14], [0, 0, 0], [.13, .13, .8]), X(U.box, [0, .15, .16], [0, 0, 0], [.04, .14, .02])]), gold);
    P(r.torso, merged('tgTaGem', () => [X(U.oct, [0, .3, .2], [0, 0, 0], [.1, .14, .06]), X(U.oct, [0, .02, .16], [0, 0, 0], [.04, .055, .03])]), gem);
    for (const [a, sx] of [[r.armL, -1], [r.armR, 1]]) {
      const pg = pauldron(a, sx, plate, gold, .36, .24, { tilt: .3, layer: plateD });
      P(pg, merged('tgTaPG', () => [X(U.oct, [0, .22, 0], [0, 0, .3], [.15, .28, .13]), X(U.oct, [.16, .12, .14], [.4, 0, -.6], [.1, .18, .08]), X(U.oct, [-.14, .14, -.14], [-.4, 0, .5], [.09, .17, .08]), X(U.oct, [.02, .1, .25], [.8, 0, 0], [.07, .12, .06])]), sx > 0 ? gem : gemP);
    }
    cape(r, capeM, { rT: .34, rM: .4, rB: .5, l1: .55, l2: .75, arc: 2.6, trim: gold });
    P(r.hips, merged('tgTaTass', () => [X(U.rbox, [0, -.22, .17], [.1, 0, 0], [.22, .38, .025]), X(U.rbox, [0, -.22, -.17], [-.1, 0, 0], [.22, .38, .025])]), M(capeC, { r: .75 }));
    // guanteletes enjoyados
    for (const [f, sx] of [[r.foreL, -1], [r.foreR, 1]]) {
      P(f, lathe('tgTaGaunt', [[.07, .02], [.1, -.04], [.12, -.18], [.1, -.26]]), plate);
      P(f, merged('tgTaGG', () => [X(U.oct, [0, -.12, .1], [0, 0, 0], [.05, .08, .04]), X(U.oct, [0, -.15, -.09], [0, 0, 0], [.04, .06, .03])]), sx > 0 ? gem : gemP);
    }
    // aura de gemas flotantes
    const fl = grp(r.root, 0, 1.25, 0); r.gems = fl;
    P(fl, merged('tgTaFloat', () => [0, 1, 2, 3].map(i => X(U.oct, [Math.cos(i * TAU / 4) * .7, Math.sin(i * 1.7) * .15, Math.sin(i * TAU / 4) * .7], [0, i, 0], [.06, .1, .06]))), gem);
    r.armL.rotation.set(-.15, 0, -.25); r.foreL.rotation.x = -.5; r.armR.rotation.set(-.15, 0, .25); r.foreR.rotation.x = -.5;
    r.theme = gemC;
    r.anim = (m, r, st, t) => { r.gems.rotation.y = -t * .9 + m.phase; r.gems.position.y = 1.25 + Math.sin(t * 1.7) * .06; };
    return h;
  },

  // ═══════════════════════ KAYLE ═══════════════════════
  kayle(Up) {
    const skinC = 0xf4d8c4;
    const goldA = Up ? M(0xfff0c8, { m: .9, r: .2, e: .2, ec: 0xffb040 }) : M(0xe8b048, { m: .92, r: .26 }), white = M(0xf8f4ea, { r: .6 }), whiteC = cloth(0xf8f4ea, 1);
    const fireC = Up ? 0xff9a2a : 0xffc860, fire = M(fireC, { e: 1.1, ec: Up ? 0xff6a10 : 0xffa020, t: .6, add: 1, ds: 1 });
    const h = humanoid({ bulk: .95, head: 1.0, leg: 1.1, skin: skinC, topM: goldA, absM: white, sleeveM: white, foreM: goldA, handM: goldA, thighM: white, shinM: goldA, bootM: goldA, beltM: goldA, hipM: white, style: 'swing', eyeM: M(0x3a6ad8, { r: .3, e: .5, ec: 0x5a8aff }) });
    const r = h.rig, hs = r.hs;
    const hb = hairM(0xf6d47a); hairCap(r, hb, { tilt: -.45, w: 1.03 }); bangs(r, hb, 5, { len: .15, spread: .9 });
    r.tails = [P(r.head, tube('tgKyHair', [[0, .32, -.14], [0, .06, -.3], [0, -.3, -.33], [0, -.75, -.32], [0, -1.0, -.38]], taper(.2, .08, .05, 10), 20, 9), hb, [0, 0, 0], [1.35, 1, 1])];
    P(r.head, merged('tgKyTiara', () => [X(U.ring, [0, .3, .02], [PI / 2 - .45, 0, 0], [.27, .26, .5]), ...[-1, 1].map(sx => X(U.pyr, [sx * .22, .4, .0], [0, 0, -sx * .9], [.03, .2, .06])), X(U.oct, [0, .37, .21], [0, 0, 0], [.035, .05, .02])]), goldA);
    P(r.torso, merged('tgKyChest', () => [X(U.sph, [0, .32, .07], [0, 0, 0], [.21, .14, .11]), X(U.cyl, [0, .45, 0], [0, 0, 0], [.17, .06, .14])]), goldA);
    P(r.torso, U.oct, glow(fireC, 2.5), [0, .32, .18], [.04, .07, .02]);
    pauldron(r.armL, -1, goldA, null, .2, .14, { tilt: .45 }); pauldron(r.armR, 1, goldA, null, .2, .14, { tilt: .45 });
    skirt(r, M(0xf8f4ea, { r: .7, ds: 1 }), 'tgKy', [[.36, -.66], [.3, -.36], [.22, -.05], [.18, .1]], goldA);
    P(r.hips, merged('tgKyFaul', () => [-1, 0, 1].map(i => X(U.rbox, [i * .13, -.12, .19 - Math.abs(i) * .04], [.1, i * .45, 0], [.11, .26, .02]))), goldA);
    // alas emplumadas (1 par; 3 pares de fuego si Transcendida)
    const feather = prof('KyFeather', s => { s.moveTo(0, 0); s.quadraticCurveTo(.09, .45, .015, 1); s.quadraticCurveTo(-.06, .5, 0, 0); }, .015, .006);
    const wingGeo = merged('tgKyWing', () => {
      const o = [];
      for (let i = 0; i < 9; i++) { const u = i / 8, bx = .08 + u * .82, by = u * .62 - u * u * .2, L = .34 + u * .62, th = -PI / 2 - .25 + u * .95; o.push(X(feather, [bx, by, -u * .03], [0, 0, th - PI / 2 + PI], [2.4, L, 1])); }
      for (let i = 0; i < 6; i++) { const u = i / 5, bx = .06 + u * .7, by = u * .5 - u * u * .15, th = -PI / 2 + u * .6; o.push(X(feather, [bx, by + .02, .02], [0, 0, th - PI / 2 + PI], [2.8, .3, 1])); }
      o.push(XAB(U.cyl, [0, 0, 0], [.92, .45, 0], .04));
      return o;
    });
    r.wings = [];
    const wingSets = Up ? [[0, .42, 1, whiteC], [.08, .28, .8, fire], [-.06, .58, .7, fire]] : [[0, .42, 1, white]];
    for (const [dz, y, sc, mat] of wingSets) for (const sx of [-1, 1]) {
      const w = grp(r.torso, sx * .1, y, -.17 + dz); w.rotation.set(0, sx * .5, sx * (sc < 1 ? (y > .5 ? .5 : -.6) : 0)); w.scale.set(sx * sc * 1.15, sc * 1.15, sc * 1.15);
      P(w, wingGeo, mat); r.wings.push(w);
    }
    if (!Up) P(r.torso, merged('tgKyWingG', () => [-1, 1].map(sx => X(U.sph, [sx * .12, .44, -.17], [0, 0, 0], .06))), goldA);
    // espada flamígera
    r.weapon = sword(r.handR, { len: 1.05, w: .14, blade: Up ? M(0xfff4d8, { m: .9, r: .15, e: .6, ec: 0xffa020 }) : M(0xffe6a0, { m: .9, r: .2 }), guard: goldA, grip: M(0x8a5a2a, { r: .6 }), glow: fireC });
    P(r.weapon, merged('tgKyFlame', () => [0, 1, 2, 3, 4].map(i => X(U.cone, [(i % 2 ? .05 : -.05), 0, .35 + i * .17], [PI / 2 + (i % 2 ? .3 : -.3), 0, 0], [.06, .22, .03]))), fire);
    r.armR.rotation.set(-.3, 0, .25); r.foreR.rotation.x = -.85; r.weapon.rotation.x = .5;
    r.holdR = true; r.theme = fireC;
    r.anim = (m, r, st, t) => {
      const a = st.atk, fl = Math.sin(t * 2.2 + m.phase) * .12 + (a >= 0 ? k0(a, [[0, 0], [.3, .35], [.5, -.25], [1, 0]]) : 0);
      r.wings.forEach((w, i) => { const sx = i % 2 ? 1 : -1, b = w.userData.b; w.rotation.set(b[0], b[1] - sx * fl, b[2] + sx * fl * .4); });
    };
    return h;
  },

  // ═══════════════════════ APHELIOS ═══════════════════════
  aphelios(Up) {
    const skinC = 0xeadfd8;
    const suitC = Up ? 0x15101a : 0x1e2238, suit = M(suitC, { r: .6 }), plate = Up ? M(0x3a2a40, { m: .6, r: .3 }) : M(0xc8d2e6, { m: .55, r: .25 });
    const accC = Up ? 0xff2a5a : 0x7fc8ff, accG = glow(accC, 2.6), scarfC = Up ? 0x3a0a18 : 0x2a3466, scarf = cloth(scarfC, 1);
    const h = humanoid({ bulk: .95, head: 1.0, leg: 1.1, skin: skinC, topM: suit, sleeveM: suit, foreM: plate, handM: suit, thighM: suit, shinM: plate, bootM: suit, beltM: plate, hipM: suit, style: 'gun', eyeM: M(Up ? 0xff2a5a : 0x5a6a8a, { r: .3, e: Up ? 1 : 0, ec: 0xff2a5a }) });
    const r = h.rig, hs = r.hs;
    const hb = hairM(Up ? 0x1a0e14 : 0x1a1e30); hairCap(r, hb, { tilt: -.45, w: 1.04 }); bangs(r, hb, 7, { len: .2, spread: 1.0 });
    r.tails = [P(r.head, tube('tgApHair', [[0, .32, -.14], [0, .1, -.3], [0, -.2, -.3], [0, -.5, -.28]], taper(.18, .07, .1, 14), 16, 9), hb, [0, 0, 0], [1.3, 1, 1])];
    // máscara que cubre la boca
    P(r.head, merged('tgApMask', () => [X(U.sph, [0, .1, .1], [0, 0, 0], [.235, .11, .17]), X(U.box, [0, .14, .23], [0, 0, 0], [.16, .02, .02])]), M(Up ? 0x0e0a10 : 0x141828, { r: .5 }));
    P(r.head, crescent('ApMk', .045, .018, .01), accG, [0, .08, .27], 1, [0, 0, -PI / 2]);
    // armadura lunar y bufanda
    P(r.torso, merged('tgApPlate', () => [X(U.sph, [0, .31, .07], [0, 0, 0], [.2, .13, .11]), X(U.ring, [0, .45, 0], [PI / 2, 0, 0], [.17, .14, 1.5])]), plate);
    P(r.torso, crescent('ApChest', .08, .03, .02), accG, [0, .31, .18], 1, [0, 0, -PI / 2]);
    pauldron(r.armL, -1, plate, accG, .2, .14, { tilt: .45 }); pauldron(r.armR, 1, plate, accG, .2, .14, { tilt: .45 });
    cape(r, scarf, { y: .46, rT: .2, rM: .26, rB: .34, l1: .5, l2: .65, arc: 1.6, trim: Up ? accG : plate });
    P(r.hips, merged('tgApFlap', () => [X(U.rbox, [0, -.3, .18], [.12, 0, 0], [.18, .42, .02])]), M(scarfC, { r: .8 }));
    // Calibrum: rifle lunar largo
    const rf = grp(r.torso, .16, .4, .08); r.rifle = rf;
    P(rf, merged('tgApRifle', () => [X(U.cyl, [0, 0, .55], [PI / 2, 0, 0], [.03, 1.05, .03]), X(U.rbox, [0, -.02, .02], [0, 0, 0], [.08, .13, .42]), X(U.rbox, [0, -.12, -.06], [.4, 0, 0], [.05, .14, .06])]), plate);
    P(rf, merged('tgApRifleD', () => [X(U.cyl, [0, .1, .1], [PI / 2, 0, 0], [.03, .3, .03]), X(U.rbox, [0, -.03, -.3], [0, 0, 0], [.06, .12, .26])]), suit);
    P(rf, merged('tgApRifleC', () => [X(crescent('ApRfC', .16, .05, .02), [0, .02, 1.0], [0, -PI / 2, 0]), X(U.box, [0, .04, .5], [0, 0, 0], [.01, .01, .6])]), accG);
    // armas flotantes: Crescendum (chakram) y Gravitum
    const fl = grp(r.root, 0, 1.3, 0); r.float = fl;
    P(fl, merged('tgApCresc', () => [X(crescent('ApCre', .22, .07, .025), [.75, 0, -.2], [0, 0, 0]), X(crescent('ApCre', .22, .07, .025), [.75, 0, -.2], [0, 0, PI])]), Up ? M(0x2a2030, { m: .9, r: .25 }) : M(0xe6ecff, { m: .9, r: .18 }));
    P(fl, merged('tgApGrav', () => [X(U.cyl, [-.75, -.05, -.2], [PI / 2, 0, 0], [.07, .4, .07]), X(U.ring, [-.75, -.05, 0], [0, 0, 0], [.1, .1, 1.2])]), M(Up ? 0x3a1a2a : 0x6a4ab0, { m: .7, r: .3 }));
    P(fl, merged('tgApFlG', () => [X(U.sph, [.75, 0, -.2], [0, 0, 0], .05), X(U.sph, [-.75, -.05, .03], [0, 0, 0], .06)]), accG);
    r.armR.rotation.set(-1.0, .15, .25); r.foreR.rotation.x = -.75; r.armL.rotation.set(-1.4, -.35, -.05); r.foreL.rotation.x = -.3;
    r.holdR = r.holdL = true; r.theme = accC;
    r.anim = (m, r, st, t) => {
      const a = st.atk; r.float.rotation.y = Math.sin(t * .6 + m.phase) * .5; r.float.position.y = 1.3 + Math.sin(t * 1.8) * .07; r.float.children[0].rotation.z = 0;
      const k = a >= 0 ? k0(a, [[0, 0], [.32, 0], [.38, 1], [1, 0]]) : 0; SP(r.rifle, 0, k * .03, -k * .12); S(r.rifle, -k * .18);
    };
    return h;
  },

  // ═══════════════════════ ZOE ═══════════════════════
  zoe(Up) {
    const skinC = 0xf2d2b4;
    const topC = Up ? 0xfff2fa : 0x3a2a6e, top = M(topC, { r: .55 }), acc = M(Up ? 0xff6fc0 : 0x2fc8c0, { r: .5 }), gold = gld(Up), legC = Up ? 0xffb6e0 : 0x6a3a9a;
    const h = humanoid({ bulk: .78, head: 1.3, leg: .9, skin: skinC, topM: top, sleeveM: M(Up ? 0xffb6e0 : 0xe8a03a, { r: .5 }), foreM: M(skinC, { r: .6 }), thighM: M(legC, { r: .6 }), shinM: M(Up ? 0xfff2fa : 0x2fc8c0, { r: .55 }), bootM: M(Up ? 0xffffff : 0xff7ab0, { r: .5 }), beltM: gold, hipM: M(legC, { r: .6 }), style: 'cast', eyeM: M(Up ? 0x8a5aff : 0x3a9ab8, { r: .25, e: .6, ec: Up ? 0x8a5aff : 0x3ad8e8 }) });
    const r = h.rig, hs = r.hs; r.root.scale.setScalar(.88);
    // melena kilométrica de colores
    const hG = hairM(Up ? 0xffc0e8 : 0xf6dc8a), hP = hairM(Up ? 0xb08aff : 0xff8ad0), hT = hairM(Up ? 0xfff0a0 : 0x7ae0f0);
    hairCap(r, hG, { tilt: -.45, w: 1.05, d: 1.05 }); bangs(r, hG, 7, { len: .18, spread: 1.1 });
    const lock = (key, pts, rf, mat) => P(r.head, tube(key, pts, rf, 34, 8), mat);
    r.tails = [
      lock('tgZoeH1', [[0, .38, -.12], [0, .3, -.4], [0, .0, -.58], [0, -.5, -.62], [0, -1.0, -.6], [0, -1.22, -.42]], taper(.17, .05, .03, 10), hG),
      lock('tgZoeH2', [[.18, .3, -.15], [.36, .1, -.35], [.44, -.3, -.42], [.44, -.8, -.36], [.36, -1.2, -.2]], taper(.09, .03, .05, 12), hP),
      lock('tgZoeH3', [[-.18, .3, -.15], [-.36, .1, -.35], [-.44, -.3, -.42], [-.44, -.8, -.36], [-.36, -1.2, -.2]], taper(.09, .03, .05, 12), hT),
    ];
    P(r.head, merged('tgZoeClips', () => [X(starGeo, [.2, .38, .14], [0, 0, .3], .1), X(starGeo, [-.22, .36, .1], [0, 0, -.2], .08)]), gold);
    // ropa: top con mangas abullonadas, falda cósmica
    P(r.torso, merged('tgZoePuff', () => [-1, 1].map(sx => X(U.sph, [sx * .26, .4, 0], [0, 0, 0], [.13, .12, .12]))), M(Up ? 0xffb6e0 : 0xe8a03a, { r: .5 }));
    P(r.torso, U.ring, acc, [0, .44, 0], [.16, .14, 2.2], [PI / 2, 0, 0]);
    skirt(r, M(Up ? 0xff9ad6 : 0x2a1a5a, { r: .5, ds: 1 }), 'tgZoe', [[.3, -.22], [.26, -.12], [.19, .04]], acc);
    P(r.hips, merged('tgZoeSkSt', () => [0, 1, 2, 3, 4, 5].map(i => { const a = i / 6 * TAU + .3; return X(U.oct, [Math.sin(a) * .25, -.12 - (i % 2) * .05, Math.cos(a) * .22], [0, a, 0], [.02, .03, .01]); })), glow(0xfff0b0, 2));
    // portal y estrellas (Estrella Fugaz)
    const fx = grp(r.root, 0, 1.0, 0); r.fx = fx;
    const portal = grp(fx, -.85, -.05, -.3); portal.rotation.y = .7; r.portal = portal;
    P(portal, U.ring, glow(Up ? 0xff7ad8 : 0xb47aff, 2.6), [0, 0, 0], [.55, .55, 1.4]);
    P(portal, U.disc, M(Up ? 0xff7ad8 : 0x6a3aff, { e: 1.2, ec: Up ? 0xff7ad8 : 0x6a3aff, t: .35, add: 1, ds: 1 }), [0, 0, -.01], .52);
    P(portal, merged('tgZoePS', () => [0, 1, 2, 3, 4, 5].map(i => X(U.oct, [Math.cos(i * TAU / 6) * .55, Math.sin(i * TAU / 6) * .55, 0], [0, 0, i], [.03, .05, .02]))), glow(0xfff0b0, 3));
    const orb = grp(fx, 0, 0, 0); r.orb = orb;
    P(orb, merged('tgZoeStars', () => [0, 1, 2].map(i => X(starGeo, [Math.cos(i * TAU / 3) * .5, Math.sin(i * 2) * .12, Math.sin(i * TAU / 3) * .5], [0, i, 0], .14))), glow(Up ? 0xffb0e0 : 0xffe28a, 3));
    // paleta/estrella en la mano
    P(r.handL, starGeo, glow(0xffe28a, 2.8), [0, -.12, .05], .16, [PI / 2, 0, 0]);
    r.castSide = 'L'; r.theme = Up ? 0xff7ad8 : 0xb47aff;
    r.anim = (m, r, st, t) => { r.orb.rotation.y = t * 1.8 + m.phase; S(r.portal, 0, 0, t * .8); SP(r.body, 0, .1 + Math.sin(t * 2.2 + m.phase) * .05, 0); };
    return h;
  },

  // ═══════════════════════ ZILEAN ═══════════════════════
  zilean(Up) {
    const skinC = 0xe8cdb2;
    const robeC = Up ? 0x6a4a2a : 0x2d4fa0, robe = M(robeC, { r: .8, ds: 1 }), robeM = M(robeC, { r: .8 }), robe2 = M(Up ? 0x3a2a1a : 0x1e3470, { r: .8 });
    const gold = Up ? M(0xc8923a, { m: .9, r: .3 }) : gld(false), beard = hairM(0xf6f4ee), sandC = Up ? 0xffb050 : 0xffd36a;
    const h = humanoid({ bulk: .92, head: 1.1, leg: .96, skin: skinC, topM: robeM, sleeveM: robeM, foreM: robe2, handM: M(skinC, { r: .6 }), thighM: robe2, shinM: robe2, bootM: M(0x3a2a1a, { r: .6 }), beltM: gold, hipM: robeM, style: 'cast', eyeM: M(0x2a3a5a, { r: .3 }) });
    const r = h.rig, hs = r.hs;
    r.torso.rotation.x = .12;
    // calvo, barba larguísima, bigote y cejas
    P(r.head, tube('tgZiBeard', [[0, .12, .2], [0, -.05, .26], [0, -.3, .24], [0, -.55, .2], [0, -.72, .22]], taper(.16, .03, .06, 16), 18, 9), beard, [0, 0, 0], [1.2, 1, .8]);
    P(r.head, merged('tgZiStache', () => [-1, 1].map(sx => X(tube('tgZiSt', [[0, .14, .25], [.08, .12, .25], [.16, .06, .2], [.2, -.06, .16]], taper(.04, .015), 10, 6), [0, 0, 0], [0, 0, 0], [sx, 1, 1]))), beard);
    P(r.head, merged('tgZiBrow', () => [-1, 1].map(sx => X(U.cone, [sx * .13, .28, .2], [0, 0, -sx * 1.8], [.035, .14, .03]))), beard);
    P(r.head, merged('tgZiSide', () => [-1, 1].map(sx => X(U.sph, [sx * .23, .15, -.05], [0, 0, 0], [.06, .1, .12]))), beard);
    P(r.head, U.sph, M(0xe2b89a, { r: .55 }), [0, .16, .25], [.04, .045, .04]);
    if (Up) { // gafas de aviador y casco de latón
      P(r.head, merged('tgZiGog', () => [-1, 1].map(sx => X(U.cyl, [sx * .09, .33, .17], [PI / 2 - .7, 0, 0], [.06, .05, .06]))), gold);
      P(r.head, U.ring, M(0x3a2a1a, { r: .6 }), [0, .32, 0], [.26, .25, .6], [PI / 2 - .55, 0, 0]);
    }
    // túnica con cuello alto
    skirt(r, robe, 'tgZi', [[.4, -.8], [.33, -.45], [.25, -.08], [.2, .1]], gold);
    P(r.torso, lathe('tgZiCollar', [[.16, .4], [.22, .5], [.28, .66], [.26, .7]]), robe);
    P(r.torso, merged('tgZiSash', () => [X(U.box, [0, .2, .16], [0, 0, 0], [.08, .5, .02]), X(U.ring, [0, .0, 0], [PI / 2, 0, 0], [.2, .155, 1.2])]), gold);
    pauldron(r.armL, -1, robe2, gold, .16, .12, { tilt: .4 }); pauldron(r.armR, 1, robe2, gold, .16, .12, { tilt: .4 });
    // bastón con reloj de arena
    const st = grp(r.handR, 0, -.03, 0);
    P(st, U.cyl, gold, [0, .25, 0], [.026, 1.45, .026]);
    P(st, merged('tgZiHg', () => [X(U.cyl, [0, .98, 0], [0, 0, 0], [.13, .03, .13]), X(U.cyl, [0, 1.34, 0], [0, 0, 0], [.13, .03, .13]), ...[0, 1, 2].map(i => X(U.cyl, [Math.cos(i * TAU / 3) * .11, 1.16, Math.sin(i * TAU / 3) * .11], [0, 0, 0], [.015, .36, .015]))]), gold);
    P(st, lathe('tgZiGlass', [[.0, .99], [.1, 1.04], [.09, 1.12], [.02, 1.16], [.09, 1.2], [.1, 1.28], [0, 1.33]]), M(0xdff4ff, { r: .05, t: .35 }));
    P(st, merged('tgZiSand', () => [X(U.cone, [0, 1.06, 0], [0, 0, 0], [.07, .08, .07]), X(U.cone, [0, 1.23, 0], [PI, 0, 0], [.04, .05, .04])]), glow(sandC, 1.8));
    r.weapon = st; r.armR.rotation.set(-.3, 0, .2); r.foreR.rotation.x = -.75; staffUpright(r, st);
    // gran reloj flotante a la espalda
    const ck = grp(r.torso, 0, .5, -.42); ck.rotation.x = -.12; r.clock = ck;
    P(ck, U.cyl, M(Up ? 0xe8d8b0 : 0xf2ead2, { r: .5 }), [0, 0, 0], [.42, .03, .42], [PI / 2, 0, 0]);
    P(ck, merged('tgZiRim', () => { const o = [X(U.ring, [0, 0, .02], [0, 0, 0], [.44, .44, 1.6])]; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; o.push(X(U.box, [Math.cos(a) * .35, Math.sin(a) * .35, .025], [0, 0, a], [i % 3 ? .04 : .08, .02, .01])); } if (Up) for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; o.push(X(U.box, [Math.cos(a) * .5, Math.sin(a) * .5, -.01], [0, 0, a], [.1, .06, .03])); } return o; }), gold);
    const hand1 = grp(ck, 0, 0, .04), hand2 = grp(ck, 0, 0, .05); r.ckh = [hand1, hand2];
    P(hand1, U.box, M(0x1a1a24, { m: .6, r: .3 }), [0, .14, 0], [.025, .28, .01]);
    P(hand2, U.box, M(0x1a1a24, { m: .6, r: .3 }), [0, .1, 0], [.035, .2, .01]);
    P(ck, U.sph, glow(sandC, 2.5), [0, 0, .05], .04);
    r.holdR = true; r.theme = sandC;
    r.anim = (m, r, st, t) => { const sp = st.atk >= 0 ? 8 : 1; r.ckh[0].rotation.z = -t * 1.2 * sp; r.ckh[1].rotation.z = -t * .1 * sp; r.clock.position.y = .5 + Math.sin(t * 1.6 + m.phase) * .03; };
    return h;
  },

  // ═══════════════════════ AURELION SOL ═══════════════════════
  aurelionsol(Up) {
    const g = new THREE.Group(), root = grp(g), body = grp(root, 0, .12, 0); root.scale.setScalar(1.15);
    const sc = Up ? M(0x1e1618, { r: .5, m: .25 }) : M(0x1e2c78, { r: .42, m: .3 }), belly = Up ? M(0x3a1208, { r: .5, e: .9, ec: 0xff4a10 }) : M(0x4a6ad0, { r: .45, m: .2 });
    const goldA = Up ? M(0x5a4a44, { m: .9, r: .35 }) : M(0xf2c454, { m: .93, r: .24 }), goldD = Up ? M(0x2e2624, { m: .85, r: .4 }) : M(0xb88a2a, { m: .9, r: .32 });
    const starC = Up ? 0xff8a3a : 0xfff2c8, starG = glow(starC, 3.2), nebC = Up ? 0xff4a1a : 0x8a6aff, neb = M(nebC, { e: .5, ec: nebC, t: .16, add: 1 }), neb2 = M(Up ? 0xffb020 : 0x4ad0ff, { e: .4, ec: Up ? 0xffb020 : 0x4ad0ff, t: .12, add: 1 });
    // cuerpo serpentino en 3 tramos encadenados (para ondular)
    const A = [[0, 1.78, .3], [0, 1.52, .12], [.06, 1.22, -.04], [.28, .95, -.16]];
    const Bp = [[.28, .95, -.16], [.48, .72, -.42], [.34, .56, -.8], [-.08, .52, -.9], [-.46, .62, -.62]];
    const Cp = [[-.46, .62, -.62], [-.62, .82, -.22], [-.52, 1.06, .14], [-.3, 1.18, .36], [-.06, 1.12, .52]];
    const rel = (pts, o) => pts.map(p => [p[0] - o[0], p[1] - o[1], p[2] - o[2]]);
    const segs = [];
    let parent = body, prev = [0, 0, 0];
    for (const [i, pts, r0, r1] of [[0, A, .2, .25], [1, Bp, .25, .17], [2, Cp, .17, .035]]) {
      const o = pts[0], sg = grp(parent, o[0] - prev[0], o[1] - prev[1], o[2] - prev[2]);
      P(sg, tube('tgAsB' + i, rel(pts, o), taper(r0, r1), 24, 10), sc);
      P(sg, tube('tgAsBl' + i, rel(pts, o).map(p => [p[0], p[1] - (r0 + r1) * .25, p[2] + .02]), taper(r0 * .75, r1 * .75), 24, 8), belly);
      // constelación sobre las escamas
      P(sg, merged('tgAsSt' + i, () => { const q = rel(pts, o), out = []; for (let k = 0; k < q.length; k++) { const p = q[k], rr = r0 + (r1 - r0) * k / (q.length - 1); for (const s of [-1, 1]) out.push(X(U.oct, [p[0] + s * rr * .7, p[1] + rr * .75, p[2]], [0, k, 0], .035 + (k % 2) * .015)); } return out; }), starG);
      segs.push(sg); parent = sg; prev = o;
    }
    // espinas doradas a lo largo del lomo
    P(segs[0], merged('tgAsSpine0', () => rel(A, A[0]).slice(1).map((p, k) => X(U.cone, [p[0], p[1] + .24, p[2] - .04], [-.5, 0, 0], [.05, .2 - k * .03, .05]))), goldA);
    P(segs[1], merged('tgAsSpine1', () => rel(Bp, Bp[0]).slice(1).map((p, k) => X(U.cone, [p[0], p[1] + .2, p[2]], [-.3, 0, 0], [.045, .16, .045]))), goldA);
    // estrella en la punta de la cola
    const tip = rel(Cp, Cp[0])[Cp.length - 1];
    P(segs[2], starGeo, starG, [tip[0], tip[1], tip[2] + .05], .28, [0, 0, 0]);
    P(segs[2], U.sph, M(starC, { e: 2, ec: starC, t: .35, add: 1 }), [tip[0], tip[1], tip[2] + .05], .16);
    // brazos pequeños con garras
    for (const sx of [-1, 1]) {
      const a = grp(segs[0], sx * .18, -.42, .05); a.rotation.set(-.6, 0, sx * .5);
      P(a, limb(.06, .045, .25), sc);
      P(a, merged('tgAsClaw', () => [-1, 0, 1].map(i => X(U.cone, [i * .03, -.33, .03], [PI - .3, 0, i * .2], [.018, .09, .018]))), goldA);
    }
    // cabeza con corona y cuernos dorados
    const head = grp(segs[0], 0, .12, .14); head.scale.setScalar(1.3);
    P(head, U.sph, sc, [0, .02, .02], [.24, .2, .27]);
    P(head, U.sph, sc, [0, -.02, .34], [.14, .1, .27]);
    P(head, merged('tgAsMask', () => [X(U.sph, [0, .06, .32], [-.12, 0, 0], [.15, .07, .28]), X(U.sph, [0, .13, .08], [0, 0, 0], [.2, .08, .2]), ...[-1, 1].map(sx => X(U.sph, [sx * .14, .08, .2], [0, 0, sx * .3], [.06, .04, .1]))]), goldA);
    P(head, merged('tgAsCrown', () => { const o = [X(U.ring, [0, .14, .02], [PI / 2 + .2, 0, 0], [.22, .24, .9])]; for (let i = 0; i < 7; i++) { const a = (i / 6 - .5) * 2.4; o.push(X(U.cone, [Math.sin(a) * .2, .26 + Math.cos(a) * .04, Math.cos(a) * .06 - .02], [-.35, 0, -a * .8], [.035, .22 - Math.abs(a) * .05, .035])); } return o; }), goldA);
    P(head, merged('tgAsHorns', () => [-1, 1].map(sx => X(tube('tgAsHorn', [[0, 0, 0], [.08, .06, -.12], [.18, .14, -.3], [.24, .3, -.5], [.22, .5, -.62]], taper(.06, .008), 18, 7), [sx * .14, .12, -.04], [0, 0, 0], [sx, 1, 1]))), goldA);
    P(head, merged('tgAsHorn2', () => [-1, 1].map(sx => X(tube('tgAsHornB', [[0, 0, 0], [.1, -.02, -.12], [.2, -.1, -.24], [.26, -.22, -.3]], taper(.04, .006), 12, 6), [sx * .16, -.02, -.06], [0, 0, 0], [sx, 1, 1]))), goldD);
    P(head, merged('tgAsEyes', () => [-1, 1].map(sx => X(U.sph, [sx * .13, .06, .22], [0, sx * .4, 0], [.045, .025, .03]))), glow(Up ? 0xffa040 : 0xbff6ff, 3.5));
    const jaw = grp(head, 0, -.08, .1); P(jaw, U.sph, belly, [0, -.02, .2], [.12, .05, .24]);
    P(jaw, merged('tgAsTeeth', () => [-1, 1].map(sx => X(U.cone, [sx * .07, .03, .32], [0, 0, 0], [.015, .05, .015]))), M(0xf2ead8, { r: .4 }));
    const mouthG = P(jaw, U.sph, M(starC, { e: 2.5, ec: starC, t: .6, add: 1 }), [0, .02, .36], .06);
    // melena nebulosa
    P(head, merged('tgAsNeb', () => [[0, .1, -.22, .26], [.16, -.05, -.3, .2], [-.16, -.05, -.3, .2], [0, -.12, -.4, .22], [0, .22, -.3, .18]].map(([x, y, z, s]) => X(U.sph, [x, y, z], [0, 0, 0], s))), neb);
    P(segs[0], merged('tgAsNeb2', () => [[0, -.2, -.15, .3], [.12, -.5, -.18, .26], [-.1, -.4, -.2, .24]].map(([x, y, z, s]) => X(U.sph, [x, y, z], [0, 0, 0], s))), neb2);
    // estrellas en órbita
    const orbit = grp(root, 0, 1.15, -.1);
    {
      for (let i = 0; i < 3; i++) { const a = i / 3 * TAU, s = grp(orbit, Math.cos(a) * 1.15, Math.sin(i * 2.3) * .2, Math.sin(a) * 1.15); P(s, U.ico, starG, [0, 0, 0], .1); P(s, U.sph, M(starC, { e: 2, ec: starC, t: .3, add: 1 }), [0, 0, 0], .2); }
    }
    if (Up) P(root, merged('tgAsEmbers', () => [0, 1, 2, 3, 4, 5].map(i => X(U.oct, [Math.cos(i) * .7, .4 + i * .3, Math.sin(i * 1.3) * .6], [i, i, 0], .04))), glow(0xff6a1a, 3));
    const rig = { type: 'sol', root, body, head, jaw, segs, orbit, flyer: true, hs: 1.4, theme: Up ? 0xff6a2a : 0xffe28a, mouthG };
    rig.anim = (m, r, st, t) => {
      const a = st.atk, ph = t * 1.3 + m.phase;
      SP(r.body, 0, Math.sin(ph) * .07, 0);
      r.segs.forEach((s, i) => S(s, Math.sin(ph * 1.1 - i * .9) * .05, Math.sin(ph * .8 - i * 1.1) * (.07 + i * .02), Math.sin(ph * .9 - i) * .03));
      const br = a >= 0 ? k0(a, [[0, 0], [.3, -.35], [.5, .3], [.8, .2], [1, 0]]) : Math.sin(ph * 1.3) * .05;
      S(r.head, br, Math.sin(t * .7 + m.phase) * .15, 0);
      S(r.jaw, a >= 0 ? k0(a, [[0, 0], [.3, .15], [.45, .6], [.8, .4], [1, 0]]) : .05 + Math.max(0, Math.sin(t * .9)) * .08);
      r.mouthG.scale.setScalar(.06 * (a >= 0 ? .5 + k0(a, [[0, 0], [.4, 2.5], [.8, 1.5], [1, 0]]) : .6));
      r.orbit.rotation.y = t * .9 + m.phase; r.orbit.children.forEach((c, i) => c.rotation.set(t * 2 + i, t * 1.5, 0));
    };
    return { g, rig, s: 1 };
  },
};
