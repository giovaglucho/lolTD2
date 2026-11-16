import { THREE, M, glow, gld, cloth, metal, hairM, EYE, TAU, PI, U, cg, limb, lathe, tube, taper, spindle, ext, X, XAB, merged, capeGeo, grp, P, humanoid, hairCap, bangs, brows, pauldron, cape, skirt, bladeGeo, sword, staffUpright, f3, kf, S, SP } from '../kit.js';
// Modelos 3D de la legión Jonia. Cada función: (Up: bool mejorado, opts) => { g, rig, s }
// Convenciones del kit: pies en y=0, mirando a +Z, ≈2 de alto. Up = skin de la mejora.

const mir = f => [-1, 1].map(f);
const add = (c, e = 2, t = .4) => M(c, { e, ec: c, t, add: 1 });
const B0 = (j, i) => j.userData.b[i];
// mechones puntiagudos alrededor de la cabeza (pelo despeinado)
const spikes = (key, list) => merged(key, () => list.map(([x, y, z, rx, rz, w, l]) => X(U.cone, [x, y, z], [rx, 0, rz], [w, l, w * .7])));
// máscara de la mitad inferior de la cara (ninjas)
const lowMask = (r, mat, o = {}) => P(r.head, U.sph, mat, [0, (o.y ?? .085) * r.hs, .035 * r.hs], [.243 * r.hs, (o.h ?? .155) * r.hs, .228 * r.hs]);
// orbe brillante con halo aditivo
function orb(p, col, pos, s, inten = 3) { const o = P(p, U.sph, glow(col, inten), pos, s); P(p, U.sph, add(col, 2, .35), pos, s * 1.8); return o; }
// puñetazo/golpe directo con el brazo derecho (anula la animación genérica de brazos)
function punch(r, a, side = 'R', reach = 1) {
  const A = r['arm' + side], F = r['fore' + side], sx = side === 'R' ? 1 : -1;
  A.rotation.x = kf(a, B0(A, 0), [[0, null], [.3, -.2], [.45, -1.55 * reach], [.7, -1.4], [1, null]]);
  A.rotation.z = kf(a, B0(A, 2), [[0, null], [.3, sx * .5], [.45, sx * .05], [1, null]]);
  F.rotation.x = kf(a, B0(F, 0), [[0, null], [.3, -2.1], [.45, -.05], [.7, -.3], [1, null]]);
}

export const MODELS = {
  // ═════════════ YASUO · El Imperdonable (Up: Luna de Sangre) ═════════════
  yasuo(Up) {
    const skinC = 0xe3bc95, skin = M(skinC, { r: .62 });
    const tun = Up ? M(0x1e1a22, { m: .45, r: .38 }) : cloth(0x2a5f86), navy = M(Up ? 0x2a0c12 : 0x1b2840, { r: .85, ds: 1 });
    const sash = cloth(Up ? 0xc01a2a : 0x9a2b23, 1), wrap = M(Up ? 0x2e2228 : 0xd9d0bc, { r: .85 }), gold = gld(Up);
    const plate = Up ? M(0x24161c, { m: .6, r: .28 }) : metal(0x9fb2c8, .3), plate2 = Up ? M(0x8a1420, { m: .5, r: .35 }) : metal(0x6d819c, .35);
    const h = humanoid({ bulk: 1.05, skin: skinC, topM: tun, sleeveM: tun, foreM: wrap, handM: M(0x3a2a20, { r: .7 }), thighM: navy, shinM: wrap, bootM: M(0x2a2420, { r: .7 }), beltM: sash, hipM: navy });
    const r = h.rig, hs = r.hs;
    P(r.torso, U.sph, skin, [0, .33, .1], [.1, .15, .08]); // pecho abierto
    P(r.torso, merged('yasLapel', () => mir(sx => X(U.box, [sx * .085, .31, .15], [0, 0, sx * .45], [.035, .3, .03]))), Up ? plate2 : M(0xe6dcc6, { r: .8 }));
    skirt(r, navy, 'yasHak', [[.31, -.46], [.27, -.28], [.22, -.06], [.19, .06]]);
    // hombrera izquierda + cuerda roja + brazal
    const pg = pauldron(r.armL, -1, plate, gold, .28, .17, { tilt: .5, layer: plate2 });
    P(pg, U.ring, sash, [0, -.04, 0], [.3, .3, 1.6], [PI / 2, 0, 0]);
    P(r.foreL, U.cyl, plate, [0, -.13, 0], [.075, .14, .075]);
    // fajín con lazo y colas
    P(r.torso, merged('yasKnot', () => [X(U.sph, [-.13, -.02, .13], [0, 0, 0], [.06, .05, .04]), X(U.box, [-.16, -.16, .12], [0, 0, .25], [.05, .22, .015]), X(U.box, [-.1, -.17, .13], [0, 0, -.15], [.05, .2, .015])]), sash);
    // pelo: casquete, flequillo, mechones despeinados y coleta enorme
    const hk = hairM(Up ? 0xe8e4ea : 0x18171f); hairCap(r, hk, { tilt: -.5, w: 1.05 }); bangs(r, hk, 6, { len: .17, spread: 1.1 }); brows(r, hk, .32);
    P(r.head, spikes('yasSpk', [[.2, .36, -.05, -.4, -1.1, .07, .22], [-.2, .36, -.05, -.4, 1.1, .07, .22], [.12, .45, -.1, -.9, -.5, .07, .2], [-.12, .45, -.1, -.9, .5, .07, .2], [0, .47, -.14, -1.2, 0, .08, .22], [.23, .22, -.1, -.3, -1.5, .05, .16], [-.23, .22, -.1, -.3, 1.5, .05, .16]]), hk);
    r.tails = [P(r.head, tube('yasPony2', [[0, .42, -.12], [0, .52, -.32], [0, .38, -.52], [0, .08, -.62], [0, -.26, -.6], [0, -.52, -.68]], taper(.15, .03, .22, 18), 24, 8), hk)];
    P(r.head, U.cyl, sash, [0, .45, -.18], [.065, .05, .065], [-.9, 0, 0]);
    P(r.head, U.sph, M(0x3a2c26, { r: .9, t: .55 }), [0, .09 * hs, .12 * hs], [.17 * hs, .09 * hs, .13 * hs]); // barba de tres días
    if (Up) { // máscara oni de la Luna de Sangre
      const mk = M(0xf2ece6, { r: .35 });
      P(r.head, U.sph, mk, [0, .085 * hs, .04 * hs], [.245 * hs, .15 * hs, .228 * hs]);
      P(r.head, merged('yasOniFang', () => [...mir(sx => X(U.cone, [sx * .07, .02, .245], [PI, 0, 0], [.022, .07, .02])), X(U.box, [0, .06, .262], [0, 0, 0], [.16, .012, .01])]), M(0xc01a2a, { r: .4 }));
      P(r.head, merged('yasHorn', () => mir(sx => X(U.cone, [sx * .16, .44, .06], [-.3, 0, -sx * .5], [.03, .14, .03]))), M(0xc01a2a, { r: .4 }));
      P(r.head, merged('yasRedEye', () => mir(sx => X(U.box, [sx * .088, .2, .236], [0, 0, sx * -.25], [.07, .02, .02]))), glow(0xff2030, 3));
    }
    // katana + vaina en la cadera izquierda
    const kat = grp(r.handR, 0, -.03, 0);
    P(kat, U.cyl, M(0x2a1a1a, { r: .6 }), [0, 0, -.06], [.026, .34, .026], [PI / 2, 0, 0]);
    P(kat, merged('yasWrap', () => [0, 1, 2, 3].map(i => X(U.oct, [0, 0, -.18 + i * .08], [0, 0, 0], [.03, .03, .025]))), M(0xd9d0bc, { r: .8 }));
    P(kat, U.cyl, gold, [0, 0, .13], [.075, .02, .075], [PI / 2, 0, 0]);
    P(kat, ext('katBlade', s => { s.moveTo(-.03, 0); s.quadraticCurveTo(-.05, .6, -.0, 1.18); s.lineTo(.03, 1.08); s.quadraticCurveTo(.01, .55, .03, 0); s.lineTo(-.03, 0); }, .02, .006), Up ? M(0xffd6d6, { m: 1, r: .1, e: 1.2, ec: 0xff2030 }) : metal(0xeaf2fb, .12), [0, 0, .14]);
    if (Up) P(kat, U.box, add(0xff2a3a, 2.5, .5), [0, 0, .7], [.09, .004, 1.05]);
    P(r.hips, U.cyl, M(Up ? 0x8a1420 : 0x2a1a1a, { r: .5 }), [-.25, -.06, .02], [.032, .82, .032], [1.1, 0, .2]);
    // anillos de viento
    const windC = Up ? 0xff5a6a : 0xd8f6ff, wind = grp(r.root, 0, .9, 0);
    P(wind, cg('yasWind', () => new THREE.TorusGeometry(.62, .012, 5, 40, 2.6)), add(windC, 1.3, .4), [0, 0, 0], 1, [PI / 2, 0, 0]);
    P(wind, cg('yasWind2', () => new THREE.TorusGeometry(.5, .009, 5, 40, 2.2)), add(windC, 1.3, .32), [0, .35, 0], 1, [PI / 2 + .2, 0, 2]);
    P(wind, cg('yasWind3', () => new THREE.TorusGeometry(.42, .007, 5, 40, 1.8)), add(windC, 1.3, .28), [0, -.45, 0], 1, [PI / 2 - .25, 0, 4]);
    r.wind = wind; r.weapon = kat;
    r.armR.rotation.set(-.15, 0, .3); r.foreR.rotation.x = -.45; kat.rotation.x = 1.15;
    r.style = 'swing'; r.holdR = true; r.theme = Up ? 0xff3a4a : 0x9ff0ff;
    return h;
  },

  // ═════════════ AHRI · La Vastaya de Nueve Colas (Up: Florecer Espiritual) ═════════════
  ahri(Up) {
    const skinC = 0xf7dccb, skin = M(skinC, { r: .6 });
    const red = cloth(Up ? 0xf4eef2 : 0xb3182e), white = M(Up ? 0xd44a8a : 0xf3ece4, { r: .8, ds: 1 }), gold = gld(Up), dark = cloth(Up ? 0x7a2a6a : 0x5a0e1c);
    const h = humanoid({ bulk: .84, head: 1.12, leg: 1.06, skin: skinC, topM: red, sleeveM: skin, foreM: skin, handM: skin, thighM: skin, shinM: M(Up ? 0xf4eef2 : 0xf3ece4, { r: .7 }), bootM: M(Up ? 0xd44a8a : 0xb3182e, { r: .6 }), beltM: gold, style: 'cast', eyeM: M(0xd9a030, { r: .25, e: .5, ec: 0xc07010 }) });
    const r = h.rig, hs = r.hs; r.castSide = 'R';
    P(r.torso, U.sph, skin, [0, .4, .07], [.15, .07, .1]); // escote / hombros
    P(r.torso, U.ring, gold, [0, .3, 0], [.25, .17, 1.3], [PI / 2 + .1, 0, 0]);
    skirt(r, red, 'ahriSk', [[.33, -.3], [.27, -.16], [.2, .02], [.17, .1]], gold);
    P(r.hips, lathe('ahriSk2', [[.36, -.36], [.3, -.2], [.2, .0]]), dark);
    // mangas sueltas blancas/rosas
    for (const f of [r.foreL, r.foreR]) { P(f, lathe('ahriSleeve', [[.06, .02], [.09, -.1], [.15, -.25], [.17, -.3]]), white); P(f, U.ring, gold, [0, -.29, 0], [.17, .17, .6], [PI / 2, 0, 0]); }
    P(r.torso, merged('ahriBows', () => [X(U.sph, [-.07, .44, .13], [0, 0, .6], [.05, .03, .02]), X(U.sph, [.07, .44, .13], [0, 0, -.6], [.05, .03, .02]), X(U.sph, [0, .42, .14], [0, 0, 0], .025)]), gold);
    // pelo negro largo
    const hk = hairM(Up ? 0x2a1c3a : 0x1a1420); hairCap(r, hk, { tilt: -.42, w: 1.06, d: 1.05 }); bangs(r, hk, 7, { len: .19, spread: 1.15 });
    P(r.head, lathe('ahriHairBack', [[.27, .3], [.28, .15], [.25, -.1], [.22, -.4], [.16, -.62], [.02, -.68]], 16), hk, [0, .18 * hs, -.06], [hs, hs, .75 * hs]);
    r.braids = mir(sx => { const bg = grp(r.head); P(bg, tube('ahriLock' + sx, [[sx * .2, .3, .12], [sx * .25, .1, .14], [sx * .25, -.15, .12], [sx * .22, -.4, .08]], taper(.05, .025), 14, 6), hk); return bg; });
    // orejas de zorro
    P(r.head, merged('ahriEars', () => mir(sx => X(U.cone, [sx * .16, .52, -.04], [-.15, 0, -sx * .38], [.09, .24, .055]))), hk);
    P(r.head, merged('ahriEarsIn', () => mir(sx => X(U.cone, [sx * .16, .51, -.005], [-.15, 0, -sx * .38], [.055, .17, .03]))), M(0xf4a3b8, { r: .8 }));
    if (Up) P(r.head, merged('ahriFlower', () => { const o = []; for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; o.push(X(U.sph, [.2 + Math.cos(a) * .04, .38 + Math.sin(a) * .04, .1], [0, 0, a], [.04, .02, .015])); } return o; }), M(0xff8ac8, { r: .5, e: .4, ec: 0xff5aa0 }));
    else P(r.head, merged('ahriPins', () => [X(U.sph, [.21, .36, .1], [0, 0, 0], .03), X(U.cyl, [.24, .28, .1], [0, 0, .5], [.008, .12, .008])]), gold);
    // nueve colas en abanico (3 grupos para que ondeen)
    const tailM = M(Up ? 0xfdf6fb : 0xf7efe4, { r: .95 }), tipM = M(Up ? 0xff8ac8 : 0xffffff, { r: .9, e: Up ? .5 : 0, ec: 0xff5aa0 });
    const tg = grp(r.hips, 0, -.02, -.12); r.tails = [];
    for (let gi = 0; gi < 3; gi++) {
      const g = grp(tg);
      const geo = merged('ahriTail' + gi, () => { const o = []; for (let k = 0; k < 3; k++) { const i = gi * 3 + k, a = (i / 8 - .5) * 2.7, sa = Math.sin(a), ca = Math.cos(a); o.push(norm2(tube('ahriT' + i, [[0, 0, 0], [sa * .22, .1 + ca * .08, -.22], [sa * .55, .3 + ca * .35, -.42], [sa * .78, .62 + ca * .62, -.46], [sa * .86, .95 + ca * .78, -.36]], spindle(.15, .02), 18, 8))); } return o; });
      P(g, geo, tailM);
      P(g, merged('ahriTip' + gi, () => { const o = []; for (let k = 0; k < 3; k++) { const i = gi * 3 + k, a = (i / 8 - .5) * 2.7; o.push(X(U.cone, [Math.sin(a) * .86, .95 + Math.cos(a) * .78, -.36], [.3, 0, -a * .9], [.06, .2, .05])); } return o; }), tipM);
      r.tails.push(g);
    }
    // Orbe del Engaño
    const og = grp(r.handR, 0, -.16, .1); const oc = Up ? 0xff7ac8 : 0x6ab8ff;
    r.pulse = [orb(og, oc, [0, 0, 0], .11, 3)];
    P(og, cg('ahriSwirl', () => new THREE.TorusGeometry(.16, .012, 5, 30, 4.4)), add(Up ? 0xffd0f0 : 0xd8f0ff, 2, .6), [0, 0, 0], 1, [.6, .3, 0]);
    r.orb = og;
    if (Up) { const pe = grp(r.root, 0, 1.2, 0); P(pe, merged('ahriPetals', () => { const o = []; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; o.push(X(U.sph, [Math.cos(a) * .7, Math.sin(i * 2.3) * .3, Math.sin(a) * .7], [i, i * 2, 0], [.05, .015, .03])); } return o; }), M(0xff9ad0, { e: 1.2, ec: 0xff5aa0 })); r.petals = pe; }
    r.armR.rotation.set(-.4, 0, .25); r.foreR.rotation.x = -.9;
    r.armL.rotation.set(.05, 0, -.3); r.foreL.rotation.x = -.5;
    r.theme = Up ? 0xff7ac8 : 0x6ab8ff;
    r.anim = (m, rr, st, t) => { rr.orb.rotation.y = t * 3; rr.orb.rotation.x = t * 1.3; if (rr.petals) rr.petals.rotation.y = t * .8; };
    return h;
  },

  // ═════════════ IRELIA · La Danzarina de las Cuchillas (Up: Forjadora de Mitos) ═════════════
  irelia(Up) {
    const skinC = 0xe6c0a0;
    const red = cloth(Up ? 0xf2efe8 : 0x8e1f2c), dark = M(Up ? 0x1c4a48 : 0x1e1a22, { r: .75 }), gold = gld(Up), goldA = M(0xd8a640, { m: .88, r: .3 });
    const trim = M(Up ? 0x3fbfa0 : 0xe9dfc8, { r: .7, ds: 1 });
    const h = humanoid({ bulk: .9, head: 1.05, leg: 1.06, skin: skinC, topM: red, sleeveM: dark, foreM: goldA, handM: dark, thighM: dark, shinM: goldA, bootM: dark, beltM: gold, hipM: dark, style: 'cast', eyeM: M(0x3a2418, { r: .3 }) });
    const r = h.rig, hs = r.hs; r.castSide = 'R';
    P(r.torso, merged('ireCollar', () => [X(U.ring, [0, .44, 0], [PI / 2, 0, 0], [.19, .16, 2]), X(U.oct, [0, .3, .17], [0, 0, 0], [.05, .09, .025]), ...mir(sx => X(U.box, [sx * .11, .22, .155], [0, 0, sx * .3], [.025, .26, .02]))]), goldA);
    for (const [a, sx] of [[r.armL, -1], [r.armR, 1]]) pauldron(a, sx, goldA, trim, .2, .13, { tilt: .55, layer: red });
    // faldones delanteros/traseros
    P(r.hips, merged('ireFlaps', () => [X(U.box, [0, -.25, .15], [-.08, 0, 0], [.18, .42, .02]), X(U.box, [0, -.27, -.15], [.08, 0, 0], [.24, .46, .02]), ...mir(sx => X(U.box, [sx * .19, -.2, 0], [0, 0, sx * .12], [.02, .36, .2]))]), red);
    P(r.hips, merged('ireFlapT', () => [X(U.box, [0, -.46, .17], [-.08, 0, 0], [.19, .03, .025]), X(U.box, [0, -.5, -.17], [.08, 0, 0], [.25, .03, .025])]), trim);
    // pelo: coleta alta con aro dorado
    const hk = hairM(0x15121a); hairCap(r, hk, { tilt: -.5 }); bangs(r, hk, 6, { len: .15 }); brows(r, hk, .2);
    r.tails = [P(r.head, tube('irePony', [[0, .46, -.12], [0, .6, -.22], [0, .52, -.4], [0, .2, -.48], [0, -.2, -.45], [0, -.55, -.5]], taper(.1, .03, .1, 14), 22, 8), hk)];
    P(r.head, U.cyl, goldA, [0, .5, -.16], [.06, .06, .06], [-.6, 0, 0]);
    P(r.head, merged('ireTiara', () => [X(U.ring, [0, .33, .0], [PI / 2 - .35, 0, 0], [.265, .25, .5]), X(U.pyr, [0, .4, .22], [-.25, 0, 0], [.035, .16, .012]), ...mir(sx => X(U.pyr, [sx * .1, .37, .21], [-.25, 0, sx * .5], [.02, .1, .01]))]), goldA);
    // abanico de cuchillas flotantes
    const bladeM = Up ? M(0x7ff0d8, { m: .4, r: .15, e: .6, ec: 0x30c0a0 }) : M(0xe0b050, { m: .92, r: .22 }), inner = Up ? glow(0xbfffee, 2) : glow(0x7fe8ff, 1.4);
    const bGeo = ext('ireBlade', s => { s.moveTo(0, 0); s.quadraticCurveTo(.09, .18, .075, .45); s.lineTo(0, .78); s.lineTo(-.075, .45); s.quadraticCurveTo(-.09, .18, 0, 0); }, .02, .008, 0);
    const iGeo = ext('ireBladeIn', s => { s.moveTo(0, .1); s.lineTo(.018, .45); s.lineTo(0, .66); s.lineTo(-.018, .45); s.lineTo(0, .1); }, .03, 0, 0);
    const fan = grp(r.torso, 0, .32, -.34); r.blades = [];
    const angs = Up ? [-1.5, -.9, -.3, .3, .9, 1.5] : [-1.25, -.42, .42, 1.25];
    angs.forEach((an, i) => {
      const o = grp(fan); o.rotation.set(0, 0, an); const tw = grp(o, 0, .14, 0); tw.rotation.x = -.25;
      P(tw, bGeo, bladeM); P(tw, iGeo, inner);
      P(tw, U.ring, bladeM, [0, -.03, 0], [.045, .045, .5]);
      r.blades.push(o);
    });
    r.fan = fan;
    r.armR.rotation.set(-.2, 0, .3); r.foreR.rotation.x = -.6; r.armL.rotation.set(.0, 0, -.25); r.foreL.rotation.x = -.4;
    r.theme = Up ? 0x7fffd0 : 0xf0c75e;
    r.anim = (m, rr, st, t) => {
      const a = st.atk >= 0 ? Math.min(1, st.atk) : -1;
      rr.blades.forEach((b, i) => {
        const j = i % 2 ? 1 : -1, mid = Math.abs(angs[i]) < 1;
        if (a >= 0 && mid) { const k = kf(a, 0, [[0, 0], [.3, -.25], [.48, 1.0], [.75, .7], [1, 0]]); S(b, 1.45 * Math.max(0, k), 0, -angs[i] * Math.max(0, k) * .9); SP(b, 0, -.1 * k, .5 * Math.max(0, k)); }
        else { S(b, Math.sin(t * 2 + i) * .05, 0, Math.sin(t * 1.6 + i * 1.3) * .06 * j); SP(b, 0, Math.sin(t * 2.2 + i) * .03, 0); }
      });
    };
    return h;
  },

  // ═════════════ MAESTRO YI · El Espadachín Wuju (Up: Cazador de Cabezas) ═════════════
  masteryi(Up) {
    const skinC = 0xe0b48e;
    const robe = cloth(Up ? 0x2e3a2a : 0xc39232), brown = M(Up ? 0x1c1e1a : 0x5a3a20, { r: .8 }), sash = cloth(Up ? 0x7a1c14 : 0x3d7a3a, 1);
    const plate = Up ? M(0xd8ccb0, { r: .55 }) : M(0x9a6a2a, { m: .65, r: .35 }), gold = gld(Up), wrap = M(Up ? 0x3a3a30 : 0xd9ccb0, { r: .85 });
    const lens = Up ? glow(0x8aff3a, 2.6) : M(0x7cff6a, { m: .2, r: .1, e: 1.4, ec: 0x3fdc3a });
    const h = humanoid({ bulk: 1.02, skin: skinC, topM: robe, sleeveM: robe, foreM: wrap, handM: brown, thighM: brown, shinM: wrap, bootM: brown, beltM: sash, hipM: brown });
    const r = h.rig, hs = r.hs;
    skirt(r, M(Up ? 0x2e3a2a : 0xc39232, { r: .85, ds: 1 }), 'yiRobe', [[.34, -.56], [.29, -.32], [.22, -.04], [.19, .06]], sash);
    P(r.torso, merged('yiCross', () => [X(U.box, [0, .27, .155], [0, 0, .55], [.07, .44, .02]), X(U.box, [0, .27, -.155], [0, 0, -.55], [.07, .44, .02])]), brown);
    for (const [a, sx] of [[r.armL, -1], [r.armR, 1]]) pauldron(a, sx, plate, gold, sx < 0 ? .3 : .22, .17, { tilt: .4, layer: sx < 0 ? plate : null });
    P(r.foreL, U.cyl, plate, [0, -.13, 0], [.075, .15, .075]); P(r.foreR, U.cyl, plate, [0, -.13, 0], [.075, .15, .075]);
    // casco Wuju con gafas de visión múltiple
    const helm = Up ? M(0xd8ccb0, { r: .5 }) : M(0x7a5a2a, { m: .55, r: .4 });
    P(r.head, lathe('yiHelm', [[.0, .5], [.12, .48], [.22, .42], [.275, .3], [.285, .18], [.27, .12]]), helm, [0, .02 * hs, -.01], hs);
    P(r.head, U.ring, gold, [0, .15 * hs, -.01], [.28 * hs, .275 * hs, .8], [PI / 2, 0, 0]);
    P(r.head, capeGeo(.27, .3, .28, 3.6), M(Up ? 0x2a2a24 : 0x5a3a20, { r: .85, ds: 1 }), [0, .2 * hs, -.01], hs); // cubrenucas
    const gog = grp(r.head, 0, .23 * hs, .2 * hs);
    P(gog, merged('yiGogF', () => [X(U.cyl, [-.09, -.01, .03], [PI / 2, 0, 0], [.075, .07, .075]), X(U.cyl, [.09, -.01, .03], [PI / 2, 0, 0], [.075, .07, .075]), X(U.cyl, [.12, .11, .0], [PI / 2, 0, 0], [.045, .07, .045]), X(U.box, [0, 0, .01], [0, 0, 0], [.08, .04, .04])]), Up ? M(0x2a2a24, { m: .5, r: .4 }) : M(0x3a2a1a, { m: .6, r: .4 }));
    P(gog, merged('yiLens', () => [X(U.sph, [-.09, -.01, .068], [0, 0, 0], [.06, .06, .02]), X(U.sph, [.09, -.01, .068], [0, 0, 0], [.06, .06, .02]), X(U.sph, [.12, .11, .038], [0, 0, 0], [.035, .035, .015])]), lens);
    if (Up) { // máscara de cráneo con colmillos del Cazador
      P(r.head, U.sph, M(0xe6dcc4, { r: .45 }), [0, .08 * hs, .04 * hs], [.24 * hs, .15 * hs, .226 * hs]);
      P(r.head, merged('yiTusk', () => mir(sx => X(U.cone, [sx * .12, .02, .2], [-.6, 0, sx * .4], [.025, .16, .025]))), M(0xf6f0e0, { r: .4 }));
      P(r.head, merged('yiHorns', () => mir(sx => X(U.cone, [sx * .2, .46, -.08], [-.6, 0, -sx * .7], [.04, .26, .04]))), M(0xe6dcc4, { r: .45 }));
    } else P(r.head, U.sph, M(0x3a2a20, { r: .9 }), [0, .1 * hs, .1 * hs], [.17 * hs, .1 * hs, .14 * hs]);
    // espada Wuju larga
    const sw = sword(r.handR, { len: 1.32, w: .1, tip: .2, blade: Up ? M(0xd8ffc8, { m: 1, r: .1, e: .8, ec: 0x5aff2a }) : metal(0xeaf2fb, .14), guard: gold, grip: M(0x2a2018, { r: .7 }), glow: Up ? 0x8aff3a : 0, gripL: .3 });
    P(sw, ext('yiHook', s => { s.moveTo(0, 0); s.quadraticCurveTo(.12, .05, .14, .2); s.lineTo(.1, .19); s.quadraticCurveTo(.08, .08, 0, .06); }, .02, .005), gold, [.04, 0, .16]);
    r.weapon = sw; r.armR.rotation.set(-.3, 0, .28); r.foreR.rotation.x = -1.4; sw.rotation.x = .25;
    if (Up) P(r.root, U.ring, add(0x8aff3a, 1.5, .35), [0, .03, 0], [.6, .6, 1], [PI / 2, 0, 0]);
    r.style = 'swing'; r.holdR = true; r.theme = Up ? 0x9dff3a : 0xc6ff5a;
    return h;
  },

  // ═════════════ ZED · El Maestro de las Sombras (Up: PROYECTO) ═════════════
  zed(Up) {
    const armor = Up ? M(0xe4e8ee, { m: .75, r: .25 }) : M(0x2a2c34, { m: .7, r: .35 }), armor2 = Up ? M(0x8a929e, { m: .8, r: .3 }) : M(0x15161c, { m: .5, r: .45 });
    const red = Up ? glow(0xff2a3a, 2.2) : cloth(0xa0141e, 1), suit = cloth(Up ? 0x1a1c22 : 0x14141a), blade = Up ? M(0xffb0b8, { m: .3, r: .15, e: 1.6, ec: 0xff2030 }) : metal(0xc8ccd6, .2);
    const eyeG = glow(0xff2030, 3.2);
    const h = humanoid({ bulk: 1.02, skin: 0xd8b090, topM: armor, sleeveM: suit, foreM: armor, handM: armor2, thighM: suit, shinM: armor, bootM: armor2, beltM: armor2, hipM: suit, noEyes: true, faceM: armor });
    const r = h.rig, hs = r.hs;
    P(r.torso, merged('zedChest', () => [X(U.sph, [0, .32, .07], [0, 0, 0], [.24, .17, .12]), X(U.box, [0, .15, .14], [0, 0, 0], [.14, .08, .04]), X(U.box, [0, .06, .13], [0, 0, 0], [.12, .06, .04])]), armor2);
    P(r.torso, merged('zedRedLines', () => [X(U.box, [0, .34, .19], [0, 0, 0], [.012, .14, .012]), ...mir(sx => X(U.box, [sx * .1, .37, .175], [0, 0, sx * .9], [.012, .1, .012]))]), Up ? red : glow(0xc0203a, 1.2));
    // tabardo rojo y bufanda
    P(r.hips, merged('zedTab', () => [X(U.box, [0, -.26, .155], [-.06, 0, 0], [.13, .46, .015]), X(U.box, [.08, -.24, -.155], [.06, 0, .05], [.11, .42, .015])]), red);
    P(r.torso, U.ring, Up ? armor2 : cloth(0xa0141e), [0, .47, 0], [.17, .15, 2.4], [PI / 2, 0, 0]);
    r.tails = [P(r.torso, tube('zedScarf', [[-.1, .47, -.12], [-.16, .42, -.25], [-.2, .3, -.4], [-.24, .12, -.5]], taper(.05, .03), 12, 6), Up ? armor2 : cloth(0xa0141e, 1))];
    // hombreras con cuchillas curvas gigantes
    const shBlade = ext('zedShB', s => { s.moveTo(0, 0); s.quadraticCurveTo(.12, .3, .05, .62); s.quadraticCurveTo(.28, .32, .14, -.02); s.lineTo(0, 0); }, .025, .008, 0);
    for (const [a, sx] of [[r.armL, -1], [r.armR, 1]]) {
      const pg = pauldron(a, sx, armor, armor2, .27, .18, { tilt: .4, layer: armor2 });
      P(pg, shBlade, blade, [sx * .02, .08, -.04], [sx, 1, 1], [-.35, sx * .3, -sx * .35]);
    }
    // cuchillas de muñeca
    const wb = ext('zedWrist', s => { s.moveTo(0, 0); s.quadraticCurveTo(.07, -.25, .03, -.55); s.lineTo(-.01, -.5); s.quadraticCurveTo(.02, -.25, -.03, -.02); s.lineTo(0, 0); }, .02, .006, 0);
    for (const hd of [r.handL, r.handR]) { const g2 = grp(hd, 0, .05, .06); g2.rotation.y = PI / 2; P(g2, wb, blade); P(g2, wb, blade, [0, 0, .04], [.9, .9, 1], [0, 0, -.25]); }
    // máscara: casco con visor y cresta
    P(r.head, U.sph, armor, [0, .21 * hs, -.005], [.262 * hs, .272 * hs, .255 * hs]);
    P(r.head, U.box, eyeG, [0, .19 * hs, .235 * hs], [.2 * hs, .028 * hs, .03 * hs], [0, 0, 0]);
    P(r.head, merged('zedEyeV', () => mir(sx => X(U.box, [sx * .085, .2, .232], [0, 0, sx * .35], [.08, .03, .03]))), eyeG);
    P(r.head, merged('zedCrest', () => [X(U.cone, [0, .44, .0], [-1.35, 0, 0], [.035, .55, .1]), ...mir(sx => X(U.cone, [sx * .16, .36, -.1], [-1.1, sx * .35, -sx * .25], [.03, .5, .06])), X(U.box, [0, .13, .24], [.2, 0, 0], [.012, .12, .03])]), armor2);
    P(r.head, merged('zedFaceRed', () => mir(sx => X(U.box, [sx * .07, .08, .225], [0, 0, sx * .3], [.012, .1, .012]))), Up ? red : glow(0xc0203a, 1.2));
    // shuriken a la espalda
    P(r.torso, merged('zedShur', () => { const o = [X(U.cyl, [0, 0, 0], [PI / 2, 0, 0], [.07, .03, .07])]; for (let i = 0; i < 3; i++) { const an = i / 3 * TAU; o.push(X(U.pyr, [Math.cos(an) * .17, Math.sin(an) * .17, 0], [0, 0, an - PI / 2], [.06, .26, .012])); } return o; }), blade, [0, .32, -.2], 1, [0, 0, .3]);
    // sombra viviente
    const sh = grp(r.root, -.62, 0, -.45); sh.rotation.y = .4;
    const shM = M(Up ? 0x1a0a2a : 0x0e0a18, { t: .55, r: .9 }), shE = M(Up ? 0x3a1050 : 0x2a1440, { e: 1.2, ec: Up ? 0xff2a5a : 0x7a2ab0, t: .35, add: 1 });
    P(sh, merged('zedShadow', () => [X(U.sph, [0, 1.6, 0], [0, 0, 0], [.25, .27, .25]), X(U.sph, [0, 1.17, 0], [0, 0, 0], [.25, .25, .17]), X(U.sph, [0, .95, 0], [0, 0, 0], [.19, .15, .14]), ...mir(sx => XAB(U.cyl, [sx * .3, 1.3, 0], [sx * .38, .8, .15], .07)), ...mir(sx => XAB(U.cyl, [sx * .1, .85, 0], [sx * .14, .06, .03], .085)), X(U.cone, [0, 1.85, -.05], [-1.35, 0, 0], [.035, .5, .1]), ...mir(sx => X(U.cone, [sx * .38, 1.42, -.05], [-.3, 0, -sx * .4], [.05, .6, .015]))]), shM);
    P(sh, merged('zedShadowAura', () => [X(U.sph, [0, 1.1, 0], [0, 0, 0], [.45, .9, .35])]), shE);
    P(sh, U.box, glow(0xff2030, 3), [0, 1.6, .24], [.18, .025, .02]);
    r.shadow = sh;
    r.armR.rotation.set(-.25, 0, .3); r.foreR.rotation.x = -.7; r.armL.rotation.set(-.25, 0, -.3); r.foreL.rotation.x = -.7;
    r.style = 'swing'; r.theme = 0xff3048;
    r.anim = (m, rr, st, t) => {
      const a = st.atk >= 0 ? Math.min(1, st.atk) : -1;
      SP(rr.shadow, 0, Math.sin(t * 1.7) * .04, a >= 0 ? kf(a, 0, [[0, 0], [.4, .2], [.6, .5], [1, 0]]) : 0);
      if (a >= 0) { rr.armL.rotation.x = kf(a, B0(rr.armL, 0), [[0, null], [.35, -2.6], [.6, .3], [1, null]]); rr.foreL.rotation.x = kf(a, B0(rr.foreL, 0), [[0, null], [.35, -.6], [.6, -.2], [1, null]]); }
    };
    return h;
  },

  // ═════════════ SHEN · El Ojo del Crepúsculo (Up: Pulso de Fuego) ═════════════
  shen(Up) {
    const navy = cloth(Up ? 0xe8ecf2 : 0x1c2a52), navy2 = M(Up ? 0x2a3040 : 0x121a36, { r: .8 }), plate = Up ? M(0xf2f4f8, { m: .6, r: .25 }) : M(0x7d8fac, { m: .7, r: .35 });
    const gold = gld(Up), trim = Up ? glow(0x3fd0ff, 1.6) : M(0xc0a050, { m: .85, r: .3 }), spiritC = Up ? 0x3fd0ff : 0x6ab8ff;
    const h = humanoid({ bulk: 1.18, skin: 0xd9ab84, topM: navy, sleeveM: navy2, foreM: plate, handM: navy2, thighM: navy2, shinM: plate, bootM: navy2, beltM: trim, hipM: navy2, eyeM: Up ? glow(0x3fd0ff, 2) : EYE });
    const r = h.rig, hs = r.hs;
    P(r.torso, merged('shenChest', () => [X(U.sph, [0, .31, .06], [0, 0, 0], [.25, .19, .12]), X(U.box, [0, .14, .14], [0, 0, 0], [.2, .07, .04]), X(U.box, [0, .05, .135], [0, 0, 0], [.18, .06, .04])]), plate);
    P(r.torso, merged('shenTrim', () => [X(U.box, [0, .31, .185], [0, 0, 0], [.025, .3, .02]), X(U.ring, [0, .45, 0], [PI / 2, 0, 0], [.17, .15, 1.6])]), trim);
    pauldron(r.armL, -1, plate, trim, .33, .22, { tilt: .4, layer: plate });
    pauldron(r.armR, 1, plate, trim, .24, .15, { tilt: .4 });
    skirt(r, M(Up ? 0x2a3040 : 0x1c2a52, { r: .85, ds: 1 }), 'shenSk', [[.32, -.4], [.28, -.22], [.22, -.02], [.19, .06]], trim);
    P(r.hips, merged('shenTasset', () => mir(sx => X(U.box, [sx * .2, -.18, .06], [0, 0, sx * .15], [.12, .26, .2]))), plate);
    cape(r, cloth(Up ? 0x2a3040 : 0x1c2a52, 1), { rT: .3, rM: .34, rB: .42, l1: .45, l2: .6, arc: 2.2, trim });
    if (Up) { // casco de Pulso de Fuego
      P(r.head, U.sph, plate, [0, .21 * hs, -.01], [.265 * hs, .275 * hs, .258 * hs]);
      P(r.head, U.box, glow(0x3fd0ff, 3), [0, .2 * hs, .24 * hs], [.3 * hs, .05 * hs, .03 * hs]);
      P(r.head, merged('shenFin', () => [X(U.box, [0, .48, -.02], [-.3, 0, 0], [.03, .1, .3]), ...mir(sx => X(U.box, [sx * .26, .22, -.02], [0, 0, 0], [.03, .12, .14]))]), navy2);
    } else {
      lowMask(r, cloth(0x1c2a52));
      const hk = hairM(0x14121a); hairCap(r, hk, { tilt: -.6 }); brows(r, hk, .35);
      P(r.head, merged('shenKnot', () => [X(U.sph, [0, .5, -.1], [0, 0, 0], [.09, .08, .09]), X(U.cyl, [0, .45, -.1], [0, 0, 0], [.04, .05, .04])]), hk);
      P(r.head, U.ring, trim, [0, .3 * hs, -.01], [.27 * hs, .26 * hs, .5], [PI / 2 - .3, 0, 0]);
    }
    // katana en la mano y espada espiritual flotante
    const sw = sword(r.handR, { len: 1.05, w: .1, tip: .16, blade: Up ? M(0xbfeeff, { m: .6, r: .15, e: .9, ec: 0x3fd0ff }) : metal(0xd8e0ea, .15), guard: Up ? plate : gold, grip: navy2 });
    r.weapon = sw; r.armR.rotation.set(-.25, 0, .25); r.foreR.rotation.x = -1.2; sw.rotation.x = .4;
    const sp = grp(r.root, -.55, 1.2, -.05); sp.rotation.set(0, 0, .25);
    P(sp, bladeGeo(1.0, .14, .2, .02), M(spiritC, { e: 2, ec: spiritC, t: .55, add: 1 }), [0, 0, 0], 1, [-PI / 2, 0, 0]);
    P(sp, bladeGeo(.92, .06, .14, .03), glow(0xdff4ff, 2.4), [0, .03, 0], 1, [-PI / 2, 0, 0]);
    P(sp, merged('shenSpGuard', () => [X(U.rbox, [0, -.02, 0], [0, 0, 0], [.26, .05, .07]), X(U.cyl, [0, -.18, 0], [0, 0, 0], [.025, .3, .025])]), M(spiritC, { e: 1.6, ec: spiritC, t: .6, add: 1 }));
    r.spirit = sp;
    r.style = 'swing'; r.holdR = true; r.theme = spiritC;
    r.anim = (m, rr, st, t) => {
      const a = st.atk >= 0 ? Math.min(1, st.atk) : -1;
      SP(rr.spirit, 0, Math.sin(t * 1.8) * .06, 0);
      S(rr.spirit, a >= 0 ? kf(a, 0, [[0, 0], [.35, -.6], [.55, 1.2], [1, 0]]) : Math.sin(t * 1.3) * .05, Math.sin(t * .7) * .3, 0);
    };
    return h;
  },

  // ═════════════ KARMA · La Iluminada (Up: Orden del Loto) ═════════════
  karma(Up) {
    const skinC = 0xc9946a, skin = M(skinC, { r: .6 });
    const robe = cloth(Up ? 0xf1e8f6 : 0x4a2486), robe2 = M(Up ? 0x9a5ad0 : 0x2e1458, { r: .8, ds: 1 }), gold = gld(Up), goldA = M(0xe0b050, { m: .9, r: .26, e: Up ? .3 : .05, ec: 0xff9a20 });
    const fireC = Up ? 0xff8ad8 : 0x9a7aff, fire = M(fireC, { e: 2.4, ec: fireC, t: .75, add: 1 }), fireCore = glow(Up ? 0xffe0f4 : 0xd8ccff, 3);
    const h = humanoid({ bulk: .9, head: 1.05, leg: 1.08, skin: skinC, topM: robe, sleeveM: skin, foreM: skin, handM: skin, thighM: robe2, shinM: robe2, bootM: goldA, beltM: goldA, style: 'cast', eyeM: M(0x5a3a1a, { r: .3 }) });
    const r = h.rig, hs = r.hs; r.castSide = 'R';
    skirt(r, robe2, 'karmaSk', [[.46, -.8], [.36, -.5], [.25, -.1], [.19, .08]], goldA);
    P(r.hips, merged('karmaPanel', () => [X(U.box, [0, -.38, .2], [-.12, 0, 0], [.16, .7, .02]), X(U.box, [0, -.38, -.21], [.12, 0, 0], [.2, .74, .02])]), robe);
    P(r.torso, merged('karmaGold', () => [X(U.ring, [0, .44, .0], [PI / 2 + .15, 0, 0], [.22, .19, 2.2]), X(U.oct, [0, .32, .175], [0, 0, 0], [.06, .1, .03]), X(U.ring, [0, .24, 0], [PI / 2, 0, 0], [.24, .17, 1.4]), ...mir(sx => X(U.sph, [sx * .22, .42, 0], [0, 0, sx * .4], [.13, .06, .12]))]), goldA);
    for (const f of [r.foreL, r.foreR]) P(f, merged('karmaCuff', () => [X(U.cyl, [0, -.1, 0], [0, 0, 0], [.07, .06, .07]), X(U.cyl, [0, -.2, 0], [0, 0, 0], [.065, .04, .065])]), goldA);
    for (const a of [r.armL, r.armR]) P(a, U.cyl, goldA, [0, -.08, 0], [.083, .04, .083]);
    // marcas espirituales brillantes en los brazos
    for (const a of [r.armL, r.armR]) P(a, merged('karmaTat', () => [0, 1, 2].map(i => X(U.box, [0, -.13 - i * .04, .075], [0, 0, (i % 2 ? .4 : -.4)], [.045, .008, .006]))), M(fireC, { e: 1.5, ec: fireC }));
    // pelo largo con trenzas y tocado dorado
    const hk = hairM(0x1a1018); hairCap(r, hk, { tilt: -.45, w: 1.04, d: 1.04 }); bangs(r, hk, 2, { len: .12, spread: 1.4 });
    P(r.head, lathe('karmaHair', [[.25, .3], [.27, .1], [.26, -.2], [.22, -.55], [.15, -.85], [.02, -.9]], 16), hk, [0, .18 * hs, -.08], [hs, hs, .7 * hs]);
    r.braids = mir(sx => { const bg = grp(r.head); P(bg, tube('karmaBraid' + sx, [[sx * .22, .25, .08], [sx * .27, .0, .1], [sx * .26, -.3, .07], [sx * .22, -.6, .05]], taper(.045, .03, .35, 30), 20, 6), hk); P(bg, merged('karmaBRing' + sx, () => [-.05, -.32, -.58].map(y => X(U.cyl, [sx * (y < -.4 ? .22 : .265), y, .07], [0, 0, 0], [.045, .03, .045]))), goldA); return bg; });
    P(r.head, merged('karmaCrown', () => [X(U.ring, [0, .32, .0], [PI / 2 - .3, 0, 0], [.27, .26, .6]), X(U.oct, [0, .42, .22], [0, 0, 0], [.05, .1, .02]), ...mir(sx => X(U.pyr, [sx * .13, .4, .19], [-.3, 0, sx * .4], [.025, .12, .012])), ...mir(sx => X(U.cone, [sx * .25, .38, -.05], [0, 0, -sx * .9], [.03, .2, .02]))]), goldA);
    P(r.head, U.oct, glow(fireC, 2.4), [0, .3 * hs, .245 * hs], [.018, .03, .01]); // marca de la frente
    // llamas espirituales del Mantra: en la mano y orbitando
    const hf = grp(r.handR, 0, -.12, .06); r.pulse = [P(hf, U.sph, fireCore, [0, 0, 0], .07)];
    P(hf, merged('karmaFlame', () => [X(U.sph, [0, .05, 0], [0, 0, 0], [.12, .14, .12]), X(U.cone, [0, .2, 0], [0, 0, 0], [.09, .26, .09]), X(U.cone, [.05, .14, .03], [0, 0, -.4], [.04, .14, .04])]), fire);
    const wisps = grp(r.root, 0, 1.25, 0);
    P(wisps, merged('karmaWisps', () => { const o = []; for (let i = 0; i < 3; i++) { const an = i / 3 * TAU; const x = Math.cos(an) * .62, z = Math.sin(an) * .62, y = Math.sin(i * 2) * .1; o.push(X(U.sph, [x, y, z], [0, 0, 0], [.08, .09, .08]), X(U.cone, [x, y + .13, z], [0, 0, 0], [.06, .2, .06])); } return o; }), fire);
    P(wisps, merged('karmaWispC', () => { const o = []; for (let i = 0; i < 3; i++) { const an = i / 3 * TAU; o.push(X(U.sph, [Math.cos(an) * .62, Math.sin(i * 2) * .1, Math.sin(an) * .62], [0, 0, 0], .04)); } return o; }), fireCore);
    r.wisps = wisps;
    if (Up) { // halo de loto
      const lo = grp(r.torso, 0, .62, -.3);
      P(lo, merged('karmaLotus', () => { const o = []; for (let i = 0; i < 10; i++) { const an = i / 10 * TAU; o.push(X(U.sph, [Math.cos(an) * .32, Math.sin(an) * .32, 0], [0, 0, an + PI / 2], [.07, .2, .02])); } return o; }), M(0xff9ad0, { r: .5, e: .7, ec: 0xff5aa0, ds: 1 }));
      P(lo, U.ring, goldA, [0, 0, .01], [.4, .4, .6]);
    }
    r.armR.rotation.set(-.45, 0, .3); r.foreR.rotation.x = -.95; r.armL.rotation.set(-.1, 0, -.25); r.foreL.rotation.x = -.7;
    r.theme = fireC;
    r.anim = (m, rr, st, t) => { rr.wisps.rotation.y = t * 1.2; rr.wisps.position.y = 1.25 + Math.sin(t * 2) * .05; };
    return h;
  },

  // ═════════════ LEE SIN · El Monje Ciego (Up: Puño del Dios Dragón) ═════════════
  leesin(Up) {
    const skinC = Up ? 0xc98f62 : 0xd9a77a, skin = M(skinC, { r: .55 });
    const pants = cloth(Up ? 0x5a1a12 : 0xcbb48a), sash = cloth(Up ? 0xf0b030 : 0x8a2a1a, 1), wraps = M(Up ? 0xe0a030 : 0xe6dcc8, { r: .85 }), red = cloth(Up ? 0xffb020 : 0xc4161e, 1);
    const h = humanoid({ bulk: 1.15, skin: skinC, topM: skin, sleeveM: skin, foreM: wraps, handM: wraps, thighM: pants, shinM: wraps, bootM: skin, beltM: sash, hipM: pants, noEyes: true });
    const r = h.rig, hs = r.hs;
    // musculatura: pectorales y abdomen
    P(r.torso, merged('leePecs', () => [...mir(sx => X(U.sph, [sx * .1, .33, .1], [0, 0, 0], [.12, .09, .08])), ...[0, 1].flatMap(i => mir(sx => X(U.sph, [sx * .05, .17 - i * .07, .12], [0, 0, 0], [.05, .035, .03])))]), skin);
    // tatuaje del dragón (tinta) que recorre el pecho
    P(r.torso, tube('leeTat', [[.18, .42, .06], [.12, .38, .155], [.0, .3, .175], [-.1, .22, .16], [-.06, .12, .15], [.06, .06, .14]], taper(.012, .006), 20, 4), Up ? glow(0xffa020, 2) : M(0x2a2a3a, { r: .8 }));
    // pantalón ancho
    P(r.hips, lathe('leePants', [[.24, -.32], [.25, -.18], [.21, .04]]), M(Up ? 0x5a1a12 : 0xcbb48a, { r: .9, ds: 1 }));
    P(r.torso, merged('leeSashT', () => [X(U.box, [.12, -.15, .14], [0, 0, -.2], [.05, .22, .015]), X(U.box, [.17, -.14, .12], [0, 0, .1], [.04, .2, .015])]), sash);
    // collar de cuentas
    P(r.torso, merged('leeBeads', () => { const o = []; for (let i = 0; i < 14; i++) { const an = (i / 13 - .5) * 3.4; o.push(X(U.sphL, [Math.sin(an) * .17, .44 - Math.cos(an) * .1 + .02, Math.cos(an) * .13 + .02], [0, 0, 0], .03)); } return o; }), M(Up ? 0xffc040 : 0x5a3018, { r: .4, m: Up ? .8 : 0 }));
    // pelo corto y venda roja con colas
    const hk = hairM(0x15121a); hairCap(r, hk, { tilt: -.62, h: .85 });
    P(r.head, spikes('leeHair', [[0, .45, .05, -.4, 0, .06, .12], [.1, .44, .0, -.5, -.4, .06, .12], [-.1, .44, .0, -.5, .4, .06, .12], [0, .44, -.12, -1.1, 0, .06, .12]]), hk);
    P(r.head, U.ring, red, [0, .2 * hs, .01], [.258 * hs, .248 * hs, 1.3], [PI / 2, 0, 0]);
    P(r.head, U.box, red, [0, .2 * hs, .24 * hs], [.32 * hs, .065 * hs, .02], [0, 0, 0]);
    r.tails = [P(r.head, merged('leeBand', () => [norm2(tube('leeBand1', [[.04, .2, -.24], [.12, .15, -.42], [.18, .02, -.6], [.24, -.14, -.74]], taper(.04, .025), 12, 4)), norm2(tube('leeBand2', [[-.04, .2, -.24], [-.08, .1, -.4], [-.1, -.06, -.52], [-.08, -.24, -.6]], taper(.04, .025), 12, 4))]), red)];
    brows(r, hk, .35);
    if (Up) { // puños envueltos en fuego de dragón
      for (const hd of [r.handL, r.handR]) { P(hd, U.sph, add(0xff8a1a, 2.4, .6), [0, -.03, .02], .13); P(hd, merged('leeFlame', () => [X(U.cone, [0, .1, -.02], [-.3, 0, 0], [.07, .25, .07]), X(U.cone, [.05, .06, -.05], [-.6, 0, -.4], [.04, .18, .04])]), add(0xffc040, 2.2, .5)); }
      const dr = grp(r.root, 0, 1.0, -.35); P(dr, tube('leeDragon', [[-.5, -.4, 0], [-.3, .1, -.15], [.1, .3, -.1], [.4, .6, 0], [.2, 1.0, .05], [-.1, 1.1, .1]], spindle(.09, .02), 30, 6), add(0xffa020, 1.6, .35)); r.dragon = dr;
    }
    r.armL.rotation.set(-.6, 0, -.25); r.foreL.rotation.x = -1.7; r.armR.rotation.set(-.25, 0, .3); r.foreR.rotation.x = -1.5;
    r.style = 'gun'; r.holdL = r.holdR = true; r.theme = Up ? 0xffb030 : 0xff9a2a;
    r.anim = (m, rr, st, t) => {
      const a = st.atk >= 0 ? Math.min(1, st.atk) : -1;
      if (a >= 0) { if (a < (m._la ?? 2)) m._lp = !m._lp; m._la = a; punch(rr, a, m._lp ? 'L' : 'R', 1); S(rr.torso, .05, kf(a, 0, [[0, 0], [.3, m._lp ? -.4 : .4], [.45, m._lp ? .45 : -.45], [1, 0]]), 0); }
      else m._la = 2;
      if (rr.dragon) rr.dragon.rotation.y = Math.sin(t * .8) * .3;
    };
    return h;
  },

  // ═════════════ AKALI · La Asesina Renegada (Up: K/DA) ═════════════
  akali(Up) {
    const skinC = 0xe6bc98, skin = M(skinC, { r: .6 });
    const green = cloth(Up ? 0x2a1640 : 0x1d5246), dark = M(Up ? 0x111014 : 0x1a1c1e, { r: .75 }), teal = Up ? glow(0x4dffb0, 1.6) : M(0x3fbfa0, { r: .5 });
    const neon2 = Up ? glow(0xd05aff, 1.8) : M(0x8a6a3a, { m: .7, r: .35 }), metalB = Up ? M(0xd8b0ff, { m: .6, r: .2, e: 1.2, ec: 0xb050ff }) : metal(0xc8d0d8, .2);
    const h = humanoid({ bulk: .86, head: 1.06, leg: 1.05, skin: skinC, topM: dark, sleeveM: skin, foreM: green, handM: dark, thighM: green, shinM: dark, bootM: dark, beltM: Up ? M(0x2a1640, { r: .6 }) : M(0x5a3a22, { r: .6 }), hipM: green, eyeM: M(0x2a1a14, { r: .3 }) });
    const r = h.rig, hs = r.hs;
    P(r.torso, U.sph, skin, [0, .1, .02], [.165, .1, .13]); // abdomen al aire (top corto)
    // chaqueta corta con una manga
    P(r.torso, merged('akaliJacket', () => [X(U.sph, [-.04, .34, -.01], [0, 0, 0], [.26, .18, .175]), X(U.box, [.11, .3, .16], [0, 0, -.25], [.06, .3, .03])]), green);
    pauldron(r.armL, -1, green, teal, .21, .15, { tilt: .5 });
    P(r.armL, U.cyl, green, [0, -.12, 0], [.08, .22, .08]);
    for (const a of [r.armR]) P(a, merged('akaliTat', () => [0, 1, 2, 3].map(i => X(U.box, [0, -.06 - i * .045, .07], [0, 0, (i % 2 ? .5 : -.5)], [.06, .01, .006]))), M(Up ? 0x4dffb0 : 0x1d3a52, { r: .8, e: Up ? 1 : 0, ec: 0x4dffb0 }));
    // fajín, faldones y kunais en el cinturón
    P(r.hips, merged('akaliFlaps', () => [X(U.box, [-.12, -.22, .13], [-.08, 0, .12], [.1, .36, .015]), X(U.box, [.0, -.26, -.15], [.08, 0, 0], [.22, .44, .015])]), green);
    P(r.hips, merged('akaliKunaiB', () => [0, 1, 2].map(i => X(U.pyr, [.12 + i * .045, -.05, .14 - i * .03], [PI, 0, .2], [.018, .12, .01]))), metalB);
    P(r.hips, U.ring, teal, [0, .07, 0], [.2, .155, .9], [PI / 2, 0, 0]);
    // máscara, pelo y coleta alta
    lowMask(r, Up ? M(0x15121a, { r: .5 }) : M(0x2a2e30, { r: .6 }));
    if (Up) P(r.head, merged('akaliKdaMask', () => [X(U.box, [0, .09, .255], [0, 0, 0], [.14, .012, .01]), ...[-2, -1, 0, 1, 2].map(i => X(U.box, [i * .028, .09, .257], [0, 0, 0], [.006, .045, .008]))]), glow(0x4dffb0, 2.4));
    const hk = hairM(Up ? 0x1a1028 : 0x16141a); hairCap(r, hk, { tilt: -.48 }); bangs(r, hk, 6, { len: .17, spread: 1.05 }); brows(r, hk, .32);
    r.tails = [P(r.head, tube('akaliPony', [[0, .44, -.15], [0, .58, -.26], [0, .5, -.45], [0, .2, -.55], [0, -.2, -.58], [0, -.5, -.66]], taper(.11, .035, .2, 18), 22, 8), hk)];
    P(r.head, U.cyl, teal, [0, .48, -.2], [.06, .06, .06], [-.7, 0, 0]);
    if (Up) P(r.head, merged('akaliHairNeon', () => [X(U.cone, [.15, .3, .2], [2.7, 0, -.4], [.04, .14, .02]), X(U.cone, [-.17, .29, .18], [2.7, 0, .4], [.04, .13, .02])]), glow(0x4dc8ff, 1.6));
    // kama (mano derecha) y kunai (mano izquierda)
    const kama = grp(r.handR, 0, -.03, 0);
    P(kama, U.cyl, M(Up ? 0x2a1640 : 0x5a3a22, { r: .6 }), [0, 0, .08], [.022, .42, .022], [PI / 2, 0, 0]);
    P(kama, merged('kamaWrap', () => [0, 1, 2].map(i => X(U.cyl, [0, 0, -.06 + i * .1], [PI / 2, 0, 0], [.028, .03, .028]))), teal);
    P(kama, ext('kamaBlade', s => { s.moveTo(0, 0); s.quadraticCurveTo(.2, .08, .42, -.04); s.quadraticCurveTo(.25, -.0, .0, -.07); s.lineTo(0, 0); }, .018, .006, 0), metalB, [0, 0, .3], 1, [0, PI / 2, PI / 2]);
    P(kama, U.cyl, neon2, [0, 0, .3], [.035, .03, .035], [PI / 2, 0, 0]);
    const ku = grp(r.handL, 0, -.03, 0);
    P(ku, merged('kunai', () => [X(U.cyl, [0, 0, 0], [PI / 2, 0, 0], [.018, .14, .018]), X(U.ring, [0, 0, -.09], [0, 0, 0], [.03, .03, .5]), X(U.pyr, [0, 0, .17], [PI / 2, 0, 0], [.035, .2, .012])]), metalB);
    r.weapon = kama; r.armR.rotation.set(-.3, 0, .3); r.foreR.rotation.x = -1.2; kama.rotation.x = .9;
    r.armL.rotation.set(-.2, 0, -.3); r.foreL.rotation.x = -.8; ku.rotation.x = 2.6;
    // anillo de energía (Marca de la Asesina)
    P(r.root, U.ring, add(Up ? 0xc76bff : 0x3fd6a0, 1.6, .5), [0, .04, 0], [.75, .75, .8], [PI / 2, 0, 0]);
    r.style = 'swing'; r.holdR = true; r.holdL = true; r.theme = Up ? 0xc76bff : 0x3fd6a0;
    return h;
  },

  // ═════════════ JHIN · El Virtuoso (Up: Cosmos Oscuro) ═════════════
  jhin(Up) {
    const crim = cloth(Up ? 0x1a1430 : 0x7a1424), white = M(Up ? 0x2a2050 : 0xefe8dc, { r: .55 }), dark = M(Up ? 0x0e0a1c : 0x2a1a20, { r: .75 });
    const goldA = M(0xe0b050, { m: .92, r: .25, e: Up ? .35 : 0, ec: 0xffa020 }), maskM = M(Up ? 0x1a1424 : 0xf4efe6, { r: .3, m: Up ? .5 : 0 }), gem = glow(Up ? 0xb070ff : 0xe0203a, 2.2);
    const h = humanoid({ bulk: .96, leg: 1.08, skin: 0xe6c8b0, topM: white, sleeveM: crim, foreM: crim, handM: white, thighM: dark, shinM: goldA, bootM: dark, beltM: goldA, hipM: dark, noEyes: true, faceM: maskM, style: 'gun' });
    const r = h.rig, hs = r.hs;
    // levita carmesí abierta con faldones
    P(r.torso, merged('jhinCoat', () => mir(sx => X(U.sph, [sx * .13, .3, .0], [0, 0, 0], [.14, .24, .17]))), crim);
    P(r.hips, lathe('jhinTails', [[.34, -.55], [.29, -.32], [.22, -.06], [.2, .06]]), M(Up ? 0x1a1430 : 0x7a1424, { r: .85, ds: 1 }), [0, 0, -.03], [1, 1, 1], [0, 0, 0]);
    P(r.torso, merged('jhinGoldT', () => [...mir(sx => X(U.box, [sx * .085, .25, .165], [0, 0, sx * .1], [.02, .42, .02])), X(U.ring, [0, .0, 0], [PI / 2, 0, 0], [.2, .155, .9])]), goldA);
    // hombreras ornamentadas
    for (const [a, sx] of [[r.armL, -1], [r.armR, 1]]) { const pg = pauldron(a, sx, goldA, crim, .23, .14, { tilt: .45, layer: crim }); P(pg, merged('jhinShSpk', () => [0, 1, 2].map(i => X(U.cone, [(i - 1) * .1, .1, -.05], [-.5, 0, (i - 1) * -.5], [.025, .16, .015]))), goldA); }
    // cuello en abanico (flor dorada tras la cabeza)
    P(r.torso, merged('jhinFan', () => { const o = []; for (let i = 0; i < 9; i++) { const an = (i / 8 - .5) * 2.6; o.push(X(U.sph, [Math.sin(an) * .2, .62 + Math.cos(an) * .16, -.14], [-.25, 0, -an], [.055, .2, .015])); } return o; }), goldA);
    P(r.torso, U.cyl, crim, [0, .5, -.02], [.12, .1, .12]);
    // máscara con sonrisa
    P(r.head, merged('jhinMaskD', () => [X(U.ring, [0, .2, .0], [PI / 2, 0, 0], [.255, .245, .6]), X(U.cone, [0, .46, -.02], [-.25, 0, 0], [.05, .14, .03]), ...mir(sx => X(U.cone, [sx * .19, .4, -.03], [-.2, 0, -sx * .7], [.035, .14, .02]))]), goldA);
    P(r.head, tube('jhinSmile', [[-.13, .12, .2], [-.06, .07, .235], [0, .06, .245], [.06, .07, .235], [.13, .12, .2]], taper(.01, .01), 12, 4), Up ? glow(0xb070ff, 2) : M(0x3a1a1a, { r: .5 }));
    P(r.head, merged('jhinEyes', () => mir(sx => X(U.sph, [sx * .085, .2, .228], [0, 0, sx * .3], [.05, .022, .02]))), Up ? glow(0xffd070, 2.4) : M(0x120a10, { r: .3 }));
    P(r.head, U.oct, gem, [0, .32 * hs, .22 * hs], [.025, .04, .015]);
    P(r.head, lathe('jhinHood', [[.27, .34], [.29, .2], [.28, .02], [.24, -.1]], 16), crim, [0, .14 * hs, -.05], hs, [-.15, 0, 0]);
    // Susurro: rifle largo ornamentado
    const gun = grp(r.handR, 0, -.04, 0);
    P(gun, U.cyl, white, [0, .01, .55], [.03, .9, .03], [PI / 2, 0, 0]);
    P(gun, merged('jhinBands', () => [.25, .5, .78, 1.0].map(z => X(U.cyl, [0, .01, z], [PI / 2, 0, 0], [.04, .04, .04]))), goldA);
    P(gun, merged('jhinBody', () => [X(U.rbox, [0, .03, .1], [0, 0, 0], [.08, .1, .3]), X(U.rbox, [0, -.04, -.2], [-.3, 0, 0], [.06, .14, .28]), X(U.cone, [0, .01, 1.05], [PI / 2, 0, 0], [.045, .08, .045])]), Up ? M(0x2a2050, { m: .6, r: .3 }) : dark);
    P(gun, merged('jhinGunGold', () => [X(U.sph, [0, .09, .12], [0, 0, 0], [.045, .03, .1]), ...mir(sx => X(U.pyr, [sx * .05, .02, .72], [PI / 2, 0, sx * .6], [.02, .14, .01]))]), goldA);
    P(gun, U.oct, gem, [0, .07, .02], [.03, .05, .03]);
    r.weapon = gun; r.armR.rotation.set(-.5, 0, .2); r.foreR.rotation.x = -1.0; gun.rotation.x = .9;
    r.armL.rotation.set(-.95, -.55, .05); r.foreL.rotation.x = -.75;
    if (Up) { const sg = grp(r.root, 0, 1.2, 0); P(sg, merged('jhinStars', () => { const o = []; for (let i = 0; i < 7; i++) { const an = i / 7 * TAU; o.push(X(U.oct, [Math.cos(an) * .7, Math.sin(i * 1.9) * .4, Math.sin(an) * .7], [0, an, 0], [.03, .06, .03])); } return o; }), glow(0xd0a0ff, 3)); r.stars = sg; r.anim = (m, rr, st, t) => { rr.stars.rotation.y = -t * .6; }; }
    r.holdR = r.holdL = true; r.theme = Up ? 0xb070ff : 0xe0405a;
    return h;
  },
};
// copia limpia de una geometría (para fusionar tubos ya cacheados)
function norm2(g) { return X(g); }
