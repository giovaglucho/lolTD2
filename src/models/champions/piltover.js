import { THREE, M, glow, gld, cloth, metal, hairM, EYE, TAU, PI, U, cg, limb, lathe, tube, taper, spindle, ext, X, XAB, merged, capeGeo, grp, P, humanoid, hairCap, bangs, brows, pauldron, cape, skirt, bladeGeo, sword, staffUpright, f3, kf, S, SP } from '../kit.js';
// Modelos 3D de la legión Piltover y Zaun. Cada función: (Up: bool mejorado, opts) => { g, rig, s }
// Convenciones del kit: pies en y=0, mirando a +Z, ≈2 de alto. Claves de geometría con prefijo 'pz'.

// ——— utilidades locales ———
const k0 = (a, fr) => kf(a, 0, fr);
// perfil lateral extruido (forma dibujada en XY → x pasa a +Z, y arriba, grosor en X)
const prof = (key, draw, depth, bevel = .01) => ext('pz' + key, draw, depth, bevel, 0);
const SIDE = [0, -PI / 2, 0];
// nuevo ataque (detecta el reinicio de st.atk) → alterna lados
function newAtk(m, st) { const a = st.atk; const n = a >= 0 && (m._la === undefined || m._la < 0 || a < m._la - .2); m._la = a; if (n) m._side = !m._side; return n; }
function puffs(key, list, hs = 1) { return merged('pz' + key, () => list.map(([x, y, z, s, sy, sz]) => X(U.sph, [x * hs, y * hs, z * hs], [0, 0, 0], [s * hs, (sy ?? s) * hs, (sz ?? s) * hs]))); }

// Torreta H-28G (también usada por la invocación de Heimerdinger). Up = torreta-dragón.
function turret(parent, Up) {
  const brass = M(0xc8923a, { m: .8, r: .34 }), dark = M(0x3a3430, { m: .7, r: .45 }), cop = M(0xb0603a, { m: .75, r: .38 });
  const t = grp(parent);
  P(t, merged('pzTurLegs', () => [0, 1, 2].map(i => { const a = i / 3 * TAU + PI / 6; return XAB(U.tcyl, [Math.sin(a) * .34, 0, Math.cos(a) * .34], [0, .36, 0], .035); })), dark);
  P(t, merged('pzTurFeet', () => [0, 1, 2].map(i => { const a = i / 3 * TAU + PI / 6; return X(U.sph, [Math.sin(a) * .34, .02, Math.cos(a) * .34], [0, 0, 0], [.06, .03, .06]); })), brass);
  P(t, lathe('pzTurPost', [[.0, .3], [.13, .3], [.1, .38], [.07, .5], [.09, .56], [.0, .58]]), brass);
  const hd = grp(t, 0, .6, 0);
  if (!Up) {
    P(hd, U.sph, brass, [0, .1, -.02], [.2, .17, .22]);
    P(hd, U.cyl, cop, [0, .1, -.02], [.21, .07, .23]);
    P(hd, merged('pzTurBarrels', () => [-1, 1].map(sx => X(U.cyl, [sx * .08, .08, .26], [PI / 2, 0, 0], [.035, .32, .035]))), dark);
    P(hd, merged('pzTurMuz', () => [-1, 1].map(sx => X(U.cyl, [sx * .08, .08, .42], [PI / 2, 0, 0], [.048, .05, .048]))), brass);
    P(hd, U.sph, glow(0x6fd8ff, 3), [0, .17, .17], [.06, .06, .04]);
    P(hd, merged('pzTurAnt', () => [X(U.cyl, [.1, .32, -.1], [0, 0, -.2], [.012, .22, .012]), X(U.sph, [.125, .43, -.1], [0, 0, 0], .025)]), dark);
  } else {
    // dragoncito: cabeza de dragón con cuernos y fauces de fuego
    const sc = M(0xd8682a, { r: .55 }), bel = M(0xf2c070, { r: .6 }), horn = M(0xf4ead0, { r: .4 });
    P(hd, U.sph, sc, [0, .12, 0], [.2, .18, .22]);
    P(hd, U.sph, sc, [0, .08, .2], [.12, .09, .14]);
    P(hd, U.sph, bel, [0, .02, .2], [.1, .05, .13]);
    P(hd, merged('pzDrHorn', () => [-1, 1].flatMap(sx => [X(U.cone, [sx * .1, .3, -.08], [-.7, 0, -sx * .3], [.035, .2, .035]), X(U.cone, [sx * .19, .18, -.02], [0, 0, -sx * 1.2], [.025, .1, .025])])), horn);
    P(hd, merged('pzDrWing', () => [-1, 1].map(sx => X(U.pyr, [sx * .26, .2, -.12], [.3, 0, -sx * 1.1], [.03, .22, .14]))), M(0xb04a1c, { r: .6, ds: 1 }));
    P(hd, merged('pzDrEye', () => [-1, 1].map(sx => X(U.sph, [sx * .1, .17, .14], [0, 0, 0], .035))), glow(0xffe060, 3));
    P(hd, U.sph, glow(0xff8a2a, 3), [0, .06, .33], .05);
  }
  return { t, hd };
}

export const MODELS = {
  // ═══════════════════════ JINX ═══════════════════════
  jinx(Up) {
    const skinC = 0xf6e2e6, skin = M(skinC, { r: .6 });
    const C = Up ? { top: 0xfff0fa, acc: 0xff5fb8, sh: 0xff9ad6, sock: 0xfff0fa, boot: 0xfff4fb, glove: 0xffe6f6, eye: 0x8a6aff, hair: 0xff86cf, hair2: 0x9a7aff }
      : { top: 0x2b2340, acc: 0xff4fa3, sh: 0x4a2b66, sock: 0x2a2236, boot: 0x2e2238, glove: 0x2a2a38, eye: 0xff4fa3, hair: 0x2cb4ee, hair2: 0x1a78b8 };
    const top = M(C.top, { r: .6 }), acc = M(C.acc, { r: .45 }), gold = gld(Up), hair = hairM(C.hair), hair2 = hairM(C.hair2);
    const h = humanoid({ bulk: .8, head: 1.14, leg: 1.07, skin: skinC, topM: skin, sleeveM: skin, foreM: skin, handM: M(C.glove, { r: .7 }), thighM: M(C.sock, { r: .75 }), shinM: M(C.boot, { r: .6 }), bootM: M(C.boot, { r: .6 }), beltM: M(0x3a2618, { r: .6 }), hipM: M(C.sh, { r: .7 }), style: 'gun', eyeM: M(C.eye, { r: .3, e: .9, ec: C.eye }) });
    const r = h.rig, hs = r.hs;
    // top y cinturones de munición cruzados
    P(r.torso, U.sph, top, [0, .31, .03], [.225, .118, .162]);
    P(r.torso, merged('pzJxStraps', () => [X(U.ring, [0, .2, 0], [PI / 2, 0, .62], [.215, .16, 1.3]), X(U.ring, [0, .2, 0], [PI / 2, 0, -.62], [.215, .16, 1.3])]), M(0x3a2618, { r: .55 }));
    P(r.torso, merged('pzJxBul', () => { const o = []; for (let i = 0; i < 7; i++) { const u = (i / 6 - .5) * 1.7; o.push(X(U.cyl, [Math.sin(u) * .2, .2 + Math.sin(u) * .13, Math.cos(u) * .165], [PI / 2 - .3, u, .62], [.016, .055, .016])); } return o; }), gold);
    // shorts + cinturón de balas
    P(r.hips, lathe('pzJxShorts', [[.2, -.13], [.215, -.04], [.2, .07], [.16, .12]]), M(C.sh, { r: .7, ds: 1 }));
    P(r.hips, merged('pzJxAmmo', () => [-3, -2, -1, 0, 1, 2, 3].map(i => X(U.cyl, [Math.sin(i * .32) * .215, .1, Math.cos(i * .32) * .165], [PI / 2, i * .32, 0], [.018, .06, .018]))), gold);
    // medias desparejadas: rayas en el muslo izquierdo, rayas en la bota derecha
    P(r.legL, merged('pzJxStripe', () => [0, 1, 2, 3].map(i => X(U.cyl, [0, -.06 - i * .07, 0], [0, 0, 0], [.088, .028, .088]))), acc);
    P(r.kneeR, merged('pzJxStripe2', () => [0, 1, 2].map(i => X(U.cyl, [0, -.04 - i * .08, 0], [0, 0, 0], [.074, .025, .074]))), acc);
    // tatuaje de nubes en el brazo izquierdo
    P(r.armL, puffs('JxTat', [[-.06, -.1, .03, .03], [-.065, -.14, .0, .035], [-.06, -.18, .03, .028], [-.055, -.06, -.02, .025]]), M(Up ? 0x8a6aff : 0xff4fa3, { r: .5, e: .3, ec: C.acc }));
    // pelo: flequillo, coletas larguísimas
    hairCap(r, hair, { tilt: -.5 }); bangs(r, hair, 7, { len: .17, spread: 1.08 });
    const braidPts = sx => [[sx * .19, .33, -.1], [sx * .34, .2, -.16], [sx * .42, -.15, -.22], [sx * .44, -.6, -.28], [sx * .4, -1.0, -.38], [sx * .32, -1.25, -.6], [sx * .24, -1.32, -.9]];
    r.braids = [-1, 1].map(sx => {
      const bg = grp(r.head, 0, 0, 0);
      P(bg, tube('pzJxBraid' + sx, braidPts(sx), taper(.09, .032, .33, 46), 48, 7), hair);
      P(bg, merged('pzJxTie' + sx, () => [X(U.cyl, [sx * .3, .25, -.14], [0, 0, sx * .9], [.06, .05, .06]), X(U.sph, [sx * .24, -1.32, -.9], [0, 0, 0], .045)]), Up ? gold : acc);
      return bg;
    });
    P(r.head, merged('pzJxTips', () => [-1, 1].map(sx => X(tube('pzJxTipT' + sx, [[sx * .32, -1.25, -.6], [sx * .24, -1.32, -.9]], taper(.05, .035), 6, 6), [0, 0, 0]))), hair2);
    if (Up) P(r.head, merged('pzJxStars', () => [[-.2, .4, .1], [.22, .38, .12], [0, .5, .05]].map(([x, y, z], i) => X(U.oct, [x * hs, y * hs, z * hs], [0, 0, i], [.05, .07, .02]))), gold);
    // Huesos de Pez (lanzacohetes tiburón) al hombro derecho
    const fb = Up ? M(0xffb6e0, { m: .2, r: .4 }) : M(0x5d7d9c, { m: .45, r: .42 }), fbD = Up ? M(0xff5fb8, { r: .45 }) : M(0x3e5770, { m: .5, r: .45 });
    const lz = grp(r.torso, .4, .55, -.08); lz.scale.setScalar(.92); r.launcher = lz;
    P(lz, lathe('pzFbBody', [[.02, -.78], [.12, -.64], [.19, -.32], [.215, 0], [.2, .2], [.16, .32]]), fb, [0, 0, 0], 1, [PI / 2, 0, 0]);
    P(lz, U.sph, fb, [0, .07, .38], [.19, .11, .21]);
    P(lz, U.sph, fbD, [0, -.11, .36], [.16, .06, .18]);
    P(lz, U.sph, M(0x3a0a18, { r: .8 }), [0, -.02, .41], [.15, .075, .15]);
    P(lz, merged('pzFbTeeth', () => { const o = []; for (let i = 0; i < 9; i++) { const a = (i / 8 - .5) * 2.4; o.push(X(U.cone, [Math.sin(a) * .16, .0, .42 + Math.cos(a) * .14], [PI, 0, 0], [.022, .08, .022])); o.push(X(U.cone, [Math.sin(a) * .13, -.07, .41 + Math.cos(a) * .12], [0, 0, 0], [.02, .065, .02])); } return o; }), M(0xf4f0e6, { r: .4 }));
    P(lz, merged('pzFbFins', () => [X(U.pyr, [0, .24, -.1], [-.6, 0, 0], [.03, .3, .16]), X(U.pyr, [.18, -.12, -.45], [0, 0, -2.2], [.02, .22, .1]), X(U.pyr, [-.18, -.12, -.45], [0, 0, 2.2], [.02, .22, .1]), X(U.pyr, [0, .16, -.76], [-1.1, 0, 0], [.025, .28, .15]), X(U.pyr, [0, -.12, -.76], [-2.0, 0, 0], [.025, .22, .12]), X(U.cyl, [0, -.2, .05], [.2, 0, 0], [.035, .2, .035])]), fbD);
    P(lz, merged('pzFbEyes', () => [-1, 1].map(sx => X(U.sph, [sx * .17, .1, .3], [0, 0, 0], .045))), glow(Up ? 0x7fe8ff : 0xff3a6a, 3));
    P(lz, merged('pzFbPaint', () => [X(U.ring, [0, 0, .05], [0, 0, 0], [.214, .214, 1.4]), X(U.ring, [0, 0, -.18], [0, 0, 0], [.205, .205, 1.4]), X(U.pyr, [0, .2, .15], [0, 0, 0], [.04, .12, .04]), X(U.cyl, [0, .2, -.32], [0, 0, 0], [.03, .06, .03])]), Up ? gold : acc);
    if (Up) P(lz, U.oct, glow(0xffe680, 2.6), [0, .26, -.34], [.07, .1, .03]);
    // Pow-Pow (minigun) en la cadera izquierda
    const pw = grp(r.torso, -.27, .0, .22); r.pow = pw;
    const pwM = Up ? M(0xfff4fb, { m: .3, r: .35 }) : M(0x5b6478, { m: .6, r: .4 });
    const bar = grp(pw, 0, 0, 0); r.powBar = bar;
    P(bar, merged('pzPowBar', () => [0, 1, 2, 3, 4, 5].map(i => X(U.cyl, [Math.cos(i * PI / 3) * .045, Math.sin(i * PI / 3) * .045, .32], [PI / 2, 0, 0], [.017, .48, .017]))), M(0x2a2a32, { m: .8, r: .3 }));
    P(pw, merged('pzPowRing', () => [X(U.cyl, [0, 0, .5], [PI / 2, 0, 0], [.08, .04, .08]), X(U.cyl, [0, 0, .16], [PI / 2, 0, 0], [.085, .05, .085])]), Up ? gold : acc);
    P(pw, merged('pzPowBody', () => [X(U.rbox, [0, 0, -.04], [0, 0, 0], [.17, .17, .26]), X(U.rbox, [0, -.13, -.08], [.3, 0, 0], [.05, .14, .06]), X(U.cyl, [-.13, 0, -.04], [0, 0, PI / 2], [.1, .07, .1])]), pwM);
    P(pw, U.sph, Up ? M(0xff86cf, { r: .4 }) : M(0x2cb4ee, { r: .45 }), [-.17, 0, -.04], [.04, .08, .08]);
    r.armR.rotation.set(-1.05, 0, .55); r.foreR.rotation.x = -1.25; r.armL.rotation.set(-.55, .1, -.05); r.foreL.rotation.x = -.75;
    r.holdR = r.holdL = true; r.theme = Up ? 0xff86cf : 0xff4fa3;
    r.anim = (m, r, st, t, dt) => { r.powBar.rotation.z += dt * (st.atk >= 0 ? 30 : 1.5); };
    return h;
  },

  // ═══════════════════════ VI ═══════════════════════
  vi(Up) {
    const skinC = 0xf0c7a6;
    const jacket = Up ? M(0x1b1b26, { r: .4, m: .3 }) : cloth(0x8e2a33), pants = Up ? M(0x22222e, { r: .5 }) : cloth(0x2e3648), boots = M(Up ? 0x15151c : 0x3a2a22, { r: .6 });
    const h = humanoid({ bulk: 1.05, skin: skinC, topM: jacket, sleeveM: jacket, foreM: M(skinC, { r: .62 }), thighM: pants, shinM: boots, bootM: boots, beltM: M(0x2a1e18, { r: .6 }), hipM: pants, style: 'blow', eyeM: M(0x3a5a9a, { r: .3 }) });
    const r = h.rig, hs = r.hs;
    const hair = hairM(Up ? 0xff3fb0 : 0xf2508e);
    // corte asimétrico: rapado a un lado y mechón barrido al otro
    P(r.head, U.hemi, hair, [.025, .2, -.02], [.27, .3, .275], [-.42, 0, -.22]);
    P(r.head, U.hemi, M(Up ? 0xa02a7a : 0xa83a5e, { r: .8 }), [-.01, .19, -.02], [.262, .27, .265], [-.6, 0, .25]);
    P(r.head, tube('pzViSwoop', [[-.12, .44, .12], [.05, .44, .2], [.18, .36, .2], [.25, .2, .16], [.26, .08, .1]], taper(.07, .03), 14, 7), hair);
    bangs(r, hair, 4, { len: .13, spread: .55 });
    brows(r, M(0x8a2a4a, { r: .7 }), .22);
    // tatuaje "VI" en la mejilla
    P(r.head, merged('pzViTat', () => [X(U.box, [-.115, .12, .225], [0, -.4, .3], [.008, .05, .006]), X(U.box, [-.095, .12, .23], [0, -.4, -.3], [.008, .05, .006]), X(U.box, [-.068, .12, .236], [0, -.3, 0], [.008, .05, .006])]), M(0xc0306a, { r: .5 }));
    // chaqueta: cuello alto, hombrera
    P(r.torso, U.cyl, jacket, [0, .45, -.01], [.17, .08, .14]);
    P(r.torso, merged('pzViZip', () => [X(U.box, [0, .25, .165], [0, 0, 0], [.012, .3, .01]), X(U.box, [-.12, .3, .15], [0, 0, .3], [.03, .2, .01])]), Up ? glow(0xff3fb0, 2.2) : M(0xd8b070, { m: .8, r: .3 }));
    if (Up) P(r.torso, merged('pzViNeon', () => [-1, 1].map(sx => X(U.box, [sx * .2, .2, .12], [0, sx * .5, 0], [.01, .26, .01]))), glow(0x3fe8ff, 2.4));
    // guanteletes hextech gigantes
    const gm = Up ? M(0x22222c, { m: .7, r: .3 }) : M(0x8a8c94, { m: .8, r: .33 }), gb = Up ? M(0x101016, { m: .6, r: .35 }) : M(0xd8a43a, { m: .85, r: .3 });
    const core = glow(Up ? 0x3fe8ff : 0x6fd0ff, Up ? 3.2 : 2.4), pinkG = glow(0xff3fb0, 2.6);
    r.gaunt = [];
    for (const [f, sx] of [[r.foreL, -1], [r.foreR, 1]]) {
      const gt = grp(f, 0, 0, 0);
      P(gt, lathe('pzViCuff', [[.09, .06], [.13, .02], [.15, -.12], [.16, -.24], [.12, -.26]]), gb);
      P(gt, merged('pzViPist' + sx, () => [X(U.cyl, [sx * .15, -.12, -.04], [0, 0, 0], [.03, .26, .03]), X(U.cyl, [sx * .13, -.12, .06], [0, 0, 0], [.025, .24, .025]), X(U.box, [0, -.3, 0], [0, 0, 0], [.2, .06, .2])]), gm);
      P(gt, U.rbox, gm, [0, -.43, .02], [.34, .3, .34]);
      P(gt, merged('pzViKnk', () => [0, 1, 2, 3].map(i => X(U.rbox, [(-.12 + i * .08), -.56, .1], [0, 0, 0], [.075, .09, .15]))), gb);
      P(gt, merged('pzViCore', () => [X(U.cyl, [0, -.42, .175], [PI / 2, 0, 0], [.07, .02, .07]), X(U.box, [0, -.2, .155], [0, 0, 0], [.025, .16, .01])]), core);
      if (Up) P(gt, U.box, pinkG, [sx * .175, -.43, .02], [.01, .22, .26]);
      r.gaunt.push(gt);
    }
    r.armL.rotation.set(-.35, 0, -.28); r.foreL.rotation.x = -1.0; r.armR.rotation.set(-.25, 0, .3); r.foreR.rotation.x = -.85;
    r.holdL = r.holdR = true; r.theme = Up ? 0x3fe8ff : 0xff5aa8;
    // puñetazo alterno
    r.anim = (m, r, st, t) => {
      newAtk(m, st); const a = st.atk; if (a < 0) return;
      const side = m._side ? 'L' : 'R', sx = side === 'R' ? 1 : -1, A = r['arm' + side], F = r['fore' + side], b = A.userData.b;
      A.rotation.set(kf(a, b[0], [[0, null], [.3, -.5], [.45, -1.6], [.7, -1.5], [1, null]]), b[1], kf(a, b[2], [[0, null], [.3, sx * .5], [.45, sx * .05], [1, null]]));
      F.rotation.x = kf(a, F.userData.b[0], [[0, null], [.3, -1.9], [.45, -.1], [.7, -.2], [1, null]]);
      S(r.torso, .12, sx * k0(a, [[0, 0], [.3, .5], [.45, -.45], [.7, -.35], [1, 0]]), 0);
      SP(r.body, 0, 0, k0(a, [[0, 0], [.3, -.06], [.45, .22], [.75, .15], [1, 0]]));
    };
    return h;
  },

  // ═══════════════════════ CAITLYN ═══════════════════════
  caitlyn(Up) {
    const skinC = 0xf4d4bc;
    const coatC = Up ? 0x1e2f5a : 0x5a2f8c, coat = cloth(coatC, 1), coatM = M(coatC, { r: .7 }), white = M(0xf2eee6, { r: .75 });
    const gold = gld(Up), tights = M(Up ? 0x1a1e2a : 0x2a2030, { r: .6 }), boot = M(Up ? 0x111218 : 0x4a2c1c, { r: .55 });
    const h = humanoid({ bulk: .86, head: 1.02, leg: 1.1, skin: skinC, topM: coatM, sleeveM: Up ? coatM : white, foreM: Up ? coatM : white, handM: M(Up ? 0x111218 : 0x3a2418, { r: .6 }), thighM: tights, shinM: boot, bootM: boot, beltM: Up ? M(0x111218, { r: .5 }) : M(0x3a2418, { r: .6 }), hipM: coatM, style: 'gun', eyeM: M(0x3a4aa0, { r: .3 }) });
    const r = h.rig, hs = r.hs;
    // corsé/chaleco con botones y cuello blanco
    P(r.torso, U.sph, white, [0, .4, .1], [.1, .1, .07]);
    P(r.torso, merged('pzCtBtn', () => [0, 1, 2, 3].map(i => X(U.sph, [0, .36 - i * .09, .158 + (i > 1 ? -.01 : 0)], [0, 0, 0], .018))), gold);
    P(r.torso, merged('pzCtLapel', () => [-1, 1].map(sx => X(U.box, [sx * .08, .34, .15], [0, 0, sx * .35], [.035, .22, .02]))), Up ? M(0x2e4a8a, { r: .6 }) : M(0x3a1c60, { r: .6 }));
    if (Up) P(r.torso, U.oct, gold, [-.12, .33, .16], [.04, .05, .015]);
    // faldón del abrigo (atrás) y falda corta
    cape(r, coat, { y: .02, z: -.03, rT: .22, rM: .27, rB: .34, l1: .32, l2: .42, arc: 2.6, trim: gold });
    P(r.hips, lathe('pzCtSkirt', [[.24, -.16], [.22, -.06], [.19, .06]]), M(coatC, { r: .7, ds: 1 }));
    // pelo largo azul-negro
    const hair = hairM(0x1f2234); hairCap(r, hair, { tilt: -.42, w: 1.03 }); bangs(r, hair, 5, { len: .16, spread: .9 });
    r.tails = [P(r.head, tube('pzCtHair', [[0, .32, -.12], [0, .1, -.28], [0, -.25, -.3], [0, -.6, -.3], [0, -.8, -.36]], taper(.2, .12, .03, 12), 18, 10), hair, [0, 0, 0], [1.25, 1, .7])];
    P(r.head, merged('pzCtLocks', () => [-1, 1].map(sx => X(tube('pzCtLock', [[0, 0, 0], [.02, -.18, .02], [.0, -.4, .0]], taper(.055, .03), 10, 6), [sx * .23, .22, .04]))), hair);
    if (!Up) {
      // sombrero de copa con gafas
      const hat = grp(r.head, .02, .4 * hs, -.03); hat.rotation.set(-.12, 0, .1);
      P(hat, lathe('pzCtHat', [[0, 0], [.36, 0], [.38, .02], [.34, .035], [.2, .04], [.19, .07], [.205, .34], [.22, .36], [0, .36]], 28), cloth(0x4a2378));
      P(hat, U.cyl, M(0x2a1440, { r: .6 }), [0, .09, 0], [.198, .06, .198]);
      P(hat, merged('pzCtGog', () => [-1, 1].map(sx => X(U.cyl, [sx * .065, .1, .19], [PI / 2, 0, 0], [.05, .05, .05]))), gold);
      P(hat, merged('pzCtLens', () => [-1, 1].map(sx => X(U.sph, [sx * .065, .1, .215], [0, 0, 0], [.04, .04, .015]))), M(0x9fdcff, { r: .1, e: .7, ec: 0x5fc0ff }));
    } else {
      // gorra de policía + gafas de aviador
      const cap = grp(r.head, 0, .38 * hs, 0); cap.rotation.x = -.1;
      P(cap, lathe('pzCtCap', [[0, 0], [.25, 0], [.27, .06], [.31, .14], [.3, .17], [0, .19]], 24), M(0x1a2648, { r: .6 }));
      P(cap, U.sph, M(0x0e0e14, { m: .3, r: .2 }), [0, .01, .2], [.2, .03, .16]);
      P(cap, U.oct, gold, [0, .08, .27], [.045, .055, .015]);
      P(r.head, merged('pzCtShades', () => [-1, 1].map(sx => X(U.sph, [sx * .085, .19, .235], [0, 0, 0], [.07, .045, .02]))), M(0x111111, { m: .9, r: .1 }));
    }
    // rifle de francotirador hextech
    const rf = grp(r.torso, .14, .38, .1); r.rifle = rf;
    const wood = M(Up ? 0x1a1a22 : 0x5a3018, { r: .55 }), gunM = metal(0x2e2e38, .32), purp = Up ? M(0x2a3a6a, { m: .5, r: .4 }) : M(0x5a2f8c, { m: .4, r: .4 });
    P(rf, merged('pzCtStock', () => [X(prof('CtStk', s => { s.moveTo(-.45, -.12); s.lineTo(-.45, .05); s.lineTo(-.15, .05); s.lineTo(-.02, .03); s.lineTo(-.02, -.06); s.lineTo(-.12, -.07); s.lineTo(-.22, -.18); s.lineTo(-.3, -.16); s.lineTo(-.26, -.08); s.lineTo(-.45, -.12); }, .06), [0, 0, 0], SIDE)]), wood);
    P(rf, merged('pzCtGold', () => [X(U.rbox, [0, 0, .14], [0, 0, 0], [.085, .11, .32]), X(U.cyl, [0, .005, 1.32], [PI / 2, 0, 0], [.04, .1, .04]), X(U.cyl, [0, .11, .02], [PI / 2, 0, 0], [.04, .03, .04]), X(U.cyl, [0, .11, .26], [PI / 2, 0, 0], [.04, .03, .04]), X(U.cyl, [0, .005, .62], [PI / 2, 0, 0], [.045, .04, .045])]), gold);
    P(rf, merged('pzCtBarrel', () => [X(U.cyl, [0, .005, .82], [PI / 2, 0, 0], [.024, 1.0, .024]), X(U.cyl, [0, .11, .14], [PI / 2, 0, 0], [.03, .34, .03]), X(U.box, [0, -.08, .06], [.2, 0, 0], [.03, .08, .05])]), gunM);
    P(rf, U.cyl, purp, [0, .005, .45], [.04, .3, .04], [PI / 2, 0, 0]);
    P(rf, merged('pzCtGlow', () => [X(U.sph, [0, .11, .32], [0, 0, 0], [.025, .025, .01]), X(U.oct, [.05, .0, .14], [0, 0, PI / 2], [.025, .04, .02])]), glow(Up ? 0x5fb0ff : 0xd08aff, 3));
    r.armR.rotation.set(-1.0, .15, .25); r.foreR.rotation.x = -.75; r.armL.rotation.set(-1.45, -.35, -.05); r.foreL.rotation.x = -.25;
    r.holdR = r.holdL = true; r.theme = Up ? 0x5fb0ff : 0xd08aff;
    r.anim = (m, r, st) => { const a = st.atk; const k = a >= 0 ? k0(a, [[0, 0], [.32, 0], [.38, 1], [1, 0]]) : 0; SP(r.rifle, 0, k * .03, -k * .12); S(r.rifle, -k * .18); };
    return h;
  },

  // ═══════════════════════ EZREAL ═══════════════════════
  ezreal(Up) {
    const skinC = 0xf2cfae;
    const jackC = Up ? 0xe8edf4 : 0x2d5ba8, jack = Up ? M(jackC, { m: .35, r: .35 }) : cloth(jackC), pants = Up ? M(0x2a3448, { m: .4, r: .4 }) : cloth(0x6a4a2e);
    const gold = gld(Up), boot = M(Up ? 0x3a4a68 : 0x4a3020, { r: .6 }), pg = glow(0x5ff0ff, 2.6);
    const h = humanoid({ bulk: .95, head: 1.06, skin: skinC, topM: jack, sleeveM: jack, foreM: jack, handM: M(Up ? 0x2a3448 : 0x5a3a22, { r: .6 }), thighM: pants, shinM: boot, bootM: boot, beltM: M(0x3a2a1c, { r: .6 }), style: 'cast', eyeM: M(0x2a5aa8, { r: .3 }) });
    const r = h.rig, hs = r.hs; r.castSide = 'L';
    P(r.torso, U.sph, Up ? M(0x2a3448, { m: .4, r: .4 }) : M(0xe8e4dc, { r: .8 }), [0, .3, .09], [.12, .17, .09]);
    P(r.hips, lathe('pzEzCoat', [[.27, -.32], [.23, -.12], [.2, .06]]), M(jackC, { r: .7, ds: 1, m: Up ? .3 : 0 }));
    P(r.torso, merged('pzEzTrim', () => [-1, 1].map(sx => X(U.box, [sx * .1, .28, .155], [0, 0, sx * .12], [.025, .36, .02]))), Up ? pg : gold);
    if (Up) {
      P(r.torso, merged('pzEzPfLines', () => [X(U.box, [0, .12, .14], [0, 0, 0], [.3, .015, .02]), ...[-1, 1].map(sx => X(U.box, [sx * .2, .3, .1], [0, 0, sx * .5], [.012, .2, .012]))]), pg);
      pauldron(r.armL, -1, M(0xe8edf4, { m: .4, r: .3 }), pg, .17, .12, { tilt: .5 }); pauldron(r.armR, 1, M(0xe8edf4, { m: .4, r: .3 }), pg, .17, .12, { tilt: .5 });
    } else {
      const scarf = cloth(0xc0622a, 1);
      P(r.torso, U.ring, scarf, [0, .46, 0], [.16, .14, 2.2], [PI / 2, 0, 0]);
      r.tails = [P(r.torso, tube('pzEzScarf', [[.08, .46, -.12], [.14, .35, -.22], [.18, .15, -.28], [.2, -.05, -.34]], taper(.06, .04), 12, 6), scarf)];
      P(r.hips, U.rbox, M(0x5a3a22, { r: .6 }), [-.2, -.02, .08], [.1, .12, .08]);
    }
    const hb = hairM(0xf0cd6a); hairCap(r, hb, { tilt: -.42 });
    P(r.head, merged('pzEzSpikes', () => { const o = []; for (let i = 0; i < 7; i++) { const a = (i / 6 - .5) * 2.4; o.push(X(U.cone, [Math.sin(a) * .15, .42, Math.cos(a) * .05 - .02], [-.6 + Math.cos(a) * .9, 0, -a * .5], [.08, .26, .06])); } o.push(X(U.cone, [.1, .36, .18], [1.9, 0, -.6], [.07, .2, .05]), X(U.cone, [-.06, .38, .19], [1.9, 0, .4], [.07, .22, .05])); return o; }), hb);
    if (Up) P(r.head, merged('pzEzVisor', () => [X(U.sph, [0, .2, .2], [0, 0, 0], [.22, .06, .07])]), M(0x5ff0ff, { r: .1, e: 1.4, ec: 0x2fd8ff, t: .85 }));
    else {
      P(r.head, merged('pzEzGog', () => [...[-1, 1].map(sx => X(U.cyl, [sx * .09, .37, .2], [PI / 2 - .8, 0, 0], [.06, .05, .06])), X(U.ring, [0, .34, 0], [PI / 2 - .5, 0, 0], [.26, .25, .5])]), M(0x6a4a2a, { m: .5, r: .45 }));
      P(r.head, merged('pzEzLens', () => [-1, 1].map(sx => X(U.sph, [sx * .09, .39, .22], [PI / 2 - .8, 0, 0], [.045, .02, .045]))), M(0x7fe6ff, { r: .1, e: .6, ec: 0x4fd4ff }));
    }
    // guantelete shurimano
    const gt = grp(r.foreL, 0, -.12, 0); gt.scale.setScalar(1.4);
    P(gt, lathe('pzEzGaunt', [[.06, -.2], [.1, -.15], [.11, .0], [.09, .1]]), Up ? M(0xe8edf4, { m: .5, r: .3 }) : metal(0xc9a24a, .3));
    P(gt, merged('pzEzFins', () => [0, 1, 2].map(i => X(U.pyr, [Math.cos(i * 2.1) * .1, -.05, Math.sin(i * 2.1) * .1], [0, -i * 2.1, 0], [.03, .2, .05]))), Up ? M(0x2a3448, { m: .5, r: .35 }) : metal(0x2d5ba8, .35));
    const gem = P(gt, U.oct, glow(0x5fe0ff, Up ? 4 : 3), [0, -.05, .11], [.05, .07, .04]);
    const palm = P(r.handL, U.sph, M(0x5fe0ff, { e: 2.5, ec: 0x5fe0ff, t: .45, add: 1 }), [0, -.05, .04], .1);
    r.pulse = [gem, palm]; r.weapon = gt; r.theme = 0x4fd4ff;
    return h;
  },

  // ═══════════════════════ HEIMERDINGER ═══════════════════════
  heimerdinger(Up) {
    const skinC = 0xf0cda2;
    const coatC = Up ? 0xb84a22 : 0x2f6f86, coat = M(coatC, { r: .75 }), gold = gld(Up), brown = M(0x5a3a22, { r: .65 });
    const h = humanoid({ bulk: 1.05, head: 1.72, leg: .58, skin: skinC, topM: coat, sleeveM: coat, foreM: coat, handM: M(skinC, { r: .6 }), thighM: M(Up ? 0x6a3a1a : 0x4a4a5a, { r: .7 }), shinM: brown, bootM: brown, beltM: brown, style: 'cast', eyeM: M(0x2a2a3a, { r: .25 }) });
    const r = h.rig, hs = r.hs; r.root.scale.setScalar(.66);
    // melena blanca disparada hacia atrás
    const hw = hairM(0xf6f0de);
    P(r.head, puffs('HmHair', [[0, .44, -.06, .2], [0, .56, -.2, .21], [0, .58, -.36, .17, .15], [.14, .48, -.14, .15], [-.14, .48, -.14, .15], [.22, .32, -.12, .12], [-.22, .32, -.12, .12], [.1, .62, -.3, .13], [-.1, .62, -.3, .13], [0, .38, -.22, .2]], hs), hw);
    // bigote enorme y cejas pobladas
    P(r.head, merged('pzHmStache', () => [-1, 1].map(sx => X(tube('pzHmSt' + sx, [[sx * .02, .12, .25], [sx * .12, .1, .24], [sx * .22, .04, .18], [sx * .28, -.06, .12]], taper(.05, .015), 12, 6), [0, 0, 0], [0, 0, 0], hs))), hw);
    P(r.head, merged('pzHmBrow', () => [-1, 1].map(sx => X(U.sph, [sx * .1 * hs, .29 * hs, .2 * hs], [0, 0, sx * .3], [.075 * hs, .03 * hs, .04 * hs]))), hw);
    P(r.head, U.sph, M(0xeab08a, { r: .5 }), [0, .16 * hs, .245 * hs], [.04 * hs, .035 * hs, .035 * hs]);
    // orejas largas de yordle
    P(r.head, merged('pzHmEars', () => [-1, 1].map(sx => X(U.cone, [sx * .3 * hs, .22 * hs, -.04], [0, sx * .3, -sx * 1.45], [.05 * hs, .26 * hs, .03 * hs]))), M(skinC, { r: .6 }));
    // gafas redondas
    P(r.head, merged('pzHmSpec', () => [-1, 1].map(sx => X(U.ring, [sx * .088 * hs, .2 * hs, .235 * hs], [0, 0, 0], [.055 * hs, .055 * hs, .5]))), gold);
    P(r.head, merged('pzHmLens', () => [-1, 1].map(sx => X(U.disc, [sx * .088 * hs, .2 * hs, .238 * hs], [0, 0, 0], .05 * hs))), M(0xbfe8ff, { r: .05, t: .35 }));
    // abrigo con cuello y cinturón de herramientas
    P(r.torso, U.ring, coat, [0, .44, 0], [.2, .17, 2.4], [PI / 2, 0, 0]);
    P(r.torso, merged('pzHmBtn', () => [0, 1, 2].map(i => X(U.sph, [0, .36 - i * .1, .16], [0, 0, 0], .02))), gold);
    P(r.hips, lathe('pzHmCoat', [[.25, -.2], [.22, -.08], [.2, .06]]), M(coatC, { r: .75, ds: 1 }));
    if (Up) { // casco con cuernos de entrenador de dragones
      P(r.head, U.hemi, M(0x9a5a2a, { r: .5 }), [0, .38 * hs, -.02], [.22 * hs, .12 * hs, .22 * hs]);
      P(r.head, merged('pzHmHorn', () => [-1, 1].map(sx => X(U.cone, [sx * .17 * hs, .5 * hs, 0], [0, 0, -sx * .7], [.04 * hs, .16 * hs, .04 * hs]))), M(0xf2e6c8, { r: .4 }));
    }
    // llave inglesa gigante
    const wr = grp(r.handR, 0, -.03, 0);
    P(wr, merged('pzHmWrench', () => [X(U.cyl, [0, 0, .25], [PI / 2, 0, 0], [.03, .55, .03]), X(prof('HmWh', s => { s.moveTo(-.09, -.06); s.lineTo(.12, -.06); s.lineTo(.12, .06); s.lineTo(.04, .06); s.lineTo(.04, -.01); s.lineTo(-.03, -.01); s.lineTo(-.03, .06); s.lineTo(-.09, .06); s.lineTo(-.09, -.06); }, .04), [0, 0, .55], [0, -PI / 2, PI / 2])]), metal(0xb8bcc6, .3));
    r.weapon = wr; r.armR.rotation.set(-.3, 0, .25); r.foreR.rotation.x = -.9; wr.rotation.x = .9;
    // torreta compañera
    const tu = turret(r.root, Up); tu.t.position.set(.95, 0, .35); tu.t.scale.setScalar(.85); tu.t.rotation.y = -.25; r.tur = tu.hd;
    r.holdR = true; r.theme = Up ? 0xff8a2a : 0xffd24a;
    r.anim = (m, r, st, t) => { S(r.tur, 0, Math.sin(t * .9 + m.phase) * .5 + (st.atk >= 0 ? -.2 : 0), 0); };
    return h;
  },
  heimer_turret(Up) {
    const g = new THREE.Group(), root = grp(g); const tu = turret(root, false);
    const rig = { type: 'turret', root, head: tu.hd, theme: 0xffd24a, upgraded: true };
    rig.anim = (m, r, st, t) => { const a = st.atk; r.head.rotation.y = Math.sin(t * 1.2 + m.phase) * .6 * (a >= 0 ? .1 : 1); r.head.position.z = a >= 0 ? -k0(a, [[0, 0], [.3, 0], [.36, .08], [1, 0]]) : 0; };
    return { g, rig, s: 1 };
  },
  heimer_turret_up(Up) {
    const g = new THREE.Group(), root = grp(g); const tu = turret(root, true);
    const rig = { type: 'turret', root, head: tu.hd, theme: 0xff8a2a, upgraded: true };
    rig.anim = (m, r, st, t) => { const a = st.atk; r.head.rotation.y = Math.sin(t * 1.2 + m.phase) * .6 * (a >= 0 ? .1 : 1); r.head.rotation.x = a >= 0 ? -k0(a, [[0, 0], [.3, .3], [.45, -.1], [1, 0]]) : Math.sin(t * 2) * .05; };
    return { g, rig, s: 1 };
  },

  // ═══════════════════════ EKKO ═══════════════════════
  ekko(Up) {
    const skinC = 0x7a4e36;
    const jackC = Up ? 0xf2efe8 : 0x34404e, jack = M(jackC, { r: .75 }), pants = M(Up ? 0x1a1a22 : 0x262c36, { r: .75 });
    const hood = cloth(Up ? 0x1a1a22 : 0xc89a2a, 1), shoe = M(0xeeeeee, { r: .55 }), tg = glow(Up ? 0xb47aff : 0x3ff0d0, 2.8), gold = gld(Up);
    const h = humanoid({ bulk: .9, head: 1.06, skin: skinC, topM: jack, sleeveM: jack, foreM: jack, handM: M(0x1a1a20, { r: .6 }), thighM: pants, shinM: pants, bootM: shoe, beltM: Up ? gold : M(0x1a1a20, { r: .6 }), style: 'swing', eyeM: M(0x2a1a14, { r: .3 }) });
    const r = h.rig, hs = r.hs;
    // pelo blanco en cresta, laterales rapados
    P(r.head, U.hemi, M(0x2a2228, { r: .9 }), [0, .2, -.01], [.258, .27, .258], [-.35, 0, 0]);
    P(r.head, merged('pzEkHair', () => { const o = []; for (let i = 0; i < 7; i++) { const u = i / 6; o.push(X(U.cone, [0, .44 - u * .1, .14 - u * .4], [-1.1 - u * .9 + .5, 0, 0], [.07 - u * .02, .22, .09 - u * .02])); } o.push(X(U.cone, [.06, .45, .1], [.1, 0, -.4], [.05, .18, .05]), X(U.cone, [-.06, .45, .08], [.1, 0, .4], [.05, .17, .05])); return o; }), hairM(0xf4f4f8));
    // marcas faciales blancas
    P(r.head, merged('pzEkMark', () => [-1, 1].map(sx => X(U.box, [sx * .13, .14, .2], [0, sx * .5, sx * -.3], [.06, .012, .01]))), M(0xf6f6f6, { r: .5 }));
    // capucha en la nuca y bufanda
    P(r.torso, U.sph, hood, [0, .48, -.12], [.2, .12, .13]);
    P(r.torso, U.ring, hood, [0, .45, 0], [.17, .15, 2.2], [PI / 2, 0, 0]);
    // Z-Drive: correa y reloj en el pecho / espalda
    P(r.torso, merged('pzEkStrap', () => [X(U.ring, [0, .25, 0], [PI / 2, 0, .7], [.23, .17, .9])]), M(0x1a1a20, { r: .55 }));
    P(r.torso, merged('pzEkZ', () => [X(U.cyl, [.06, .28, .16], [PI / 2, 0, 0], [.065, .03, .065]), X(U.cyl, [0, .3, -.17], [PI / 2, 0, 0], [.1, .05, .1])]), Up ? gold : metal(0x8a96a6, .35));
    const zd = P(r.torso, merged('pzEkZg', () => [X(U.ring, [.06, .28, .178], [0, 0, 0], [.05, .05, 1.2]), X(U.ring, [0, .3, -.2], [0, 0, 0], [.08, .08, 1.2]), X(U.box, [0, .3, -.2], [0, 0, .5], [.012, .1, .01]), X(U.box, [.06, .28, .18], [0, 0, -.6], [.01, .07, .01])]), tg);
    // bate temporal
    const bat = grp(r.handR, 0, -.03, 0);
    P(bat, merged('pzEkBat', () => [X(U.cyl, [0, 0, .1], [PI / 2, 0, 0], [.03, .5, .03]), X(lathe('pzEkBatH', [[.0, 0], [.045, .02], [.06, .3], [.075, .55], [.06, .62], [0, .64]]), [0, 0, .32], [PI / 2, 0, 0])]), Up ? M(0x1a1a22, { m: .6, r: .3 }) : M(0x3a3f4a, { m: .6, r: .35 }));
    P(bat, merged('pzEkBatG', () => [0, 1, 2].map(i => X(U.cyl, [0, 0, .5 + i * .14], [PI / 2, 0, 0], [.072, .025, .072]))), tg);
    P(bat, U.cyl, Up ? gold : hood, [0, 0, -.16], [.04, .06, .04], [PI / 2, 0, 0]);
    r.weapon = bat; r.armR.rotation.set(-.35, 0, .3); r.foreR.rotation.x = -1.5; bat.rotation.set(.35, 0, 0);
    if (Up) P(r.torso, merged('pzEkChain', () => [X(U.ring, [0, .33, .03], [PI / 2 - .25, 0, 0], [.17, .16, .6])]), gold);
    r.pulse = [zd];
    r.holdR = true; r.theme = Up ? 0xb47aff : 0x3ff0d0;
    return h;
  },

  // ═══════════════════════ JAYCE ═══════════════════════
  jayce(Up) {
    const skinC = 0xe9c4a2;
    const coatC = Up ? 0x16161c : 0x2a4a7a, coat = cloth(coatC, 1), coatM = M(coatC, { r: Up ? .45 : .7 }), vest = M(Up ? 0x0f0f14 : 0x3a5f92, { r: .6 }), shirt = M(0xf2efe8, { r: .75 });
    const gold = gld(Up), boot = M(Up ? 0x111114 : 0x5a3a22, { r: .55 }), pants = M(Up ? 0x16161c : 0x3a3a48, { r: .7 });
    const h = humanoid({ bulk: 1.12, head: .98, leg: 1.06, skin: skinC, topM: vest, sleeveM: coatM, foreM: coatM, handM: M(Up ? 0xf2efe8 : 0x6a4a2a, { r: .6 }), thighM: pants, shinM: boot, bootM: boot, beltM: Up ? M(0x111114, { r: .5 }) : M(0x4a2e1a, { r: .55 }), hipM: pants, style: 'slam', eyeM: M(0x5a3a22, { r: .3 }) });
    const r = h.rig, hs = r.hs;
    P(r.torso, U.sph, shirt, [0, .38, .1], [.1, .12, .08]);
    P(r.torso, U.box, Up ? M(0xa01a2a, { r: .5 }) : M(0x1a2a48, { r: .5 }), [0, .32, .17], [.035, .13, .02]);
    P(r.torso, merged('pzJyLapel', () => [-1, 1].map(sx => X(U.box, [sx * .1, .3, .15], [0, 0, sx * .28], [.05, .3, .025]))), coatM);
    P(r.torso, merged('pzJyBtn', () => [0, 1, 2].map(i => X(U.sph, [.05, .22 - i * .08, .155], [0, 0, 0], .016))), gold);
    // abrigo largo hasta la rodilla
    cape(r, coat, { y: .44, z: -.02, rT: .3, rM: .33, rB: .4, l1: .55, l2: .5, arc: 3.2, trim: gold });
    // hombrera dorada (lado del martillo)
    pauldron(r.armR, 1, M(Up ? 0x16161c : 0xd8b05a, { m: .85, r: .3 }), gold, .2, .13, { tilt: .45 });
    // pelo castaño peinado hacia atrás
    const hb = hairM(Up ? 0x1e140e : 0x4a2c1a); hairCap(r, hb, { tilt: -.55, w: 1.03 });
    P(r.head, merged('pzJyQuiff', () => [X(U.sph, [0, .4, .1], [-.3, 0, 0], [.2, .1, .14]), X(U.sph, [.05, .44, .0], [-.3, 0, -.2], [.16, .09, .14])]), hb);
    brows(r, hb, .18);
    P(r.head, merged('pzJyJaw', () => [-1, 1].map(sx => X(U.box, [sx * .22, .12, .06], [0, 0, 0], [.025, .1, .05]))), hb);
    // Martillo de Mercurio
    const hm = grp(r.handR, 0, -.03, 0), hd = grp(hm, 0, 0, 1.0);
    P(hm, merged('pzJyHandle', () => [X(U.cyl, [0, 0, .32], [PI / 2, 0, 0], [.034, 1.25, .034])]), Up ? metal(0x1a1a1e, .3) : metal(0x4a505c, .35));
    P(hm, merged('pzJyRings', () => [X(U.cyl, [0, 0, -.3], [PI / 2, 0, 0], [.05, .06, .05]), X(U.cyl, [0, 0, .1], [PI / 2, 0, 0], [.045, .04, .045]), X(U.cyl, [0, 0, .72], [PI / 2, 0, 0], [.05, .1, .05])]), gold);
    const headM = Up ? M(0xe8c060, { m: .9, r: .25 }) : M(0xe8ecf2, { m: .6, r: .3 });
    P(hd, merged('pzJyHead', () => [X(U.rbox, [0, 0, 0], [0, 0, 0], [.62, .36, .36]), X(U.rbox, [0, .2, 0], [0, 0, 0], [.4, .08, .3])]), headM);
    P(hd, merged('pzJyCaps', () => [-1, 1].flatMap(sx => [X(U.cyl, [sx * .33, 0, 0], [0, 0, PI / 2], [.2, .08, .2]), X(U.cyl, [sx * .39, 0, 0], [0, 0, PI / 2], [.15, .06, .15])])), Up ? M(0x2a1a3a, { m: .7, r: .3 }) : M(0xc8a040, { m: .9, r: .28 }));
    const coreC = Up ? 0xd06aff : 0x5fd0ff;
    P(hd, merged('pzJyCore', () => [X(U.cyl, [0, 0, .185], [PI / 2, 0, 0], [.09, .02, .09]), X(U.cyl, [0, 0, -.185], [PI / 2, 0, 0], [.09, .02, .09]), ...[-1, 1].map(sx => X(U.box, [sx * .2, 0, .182], [0, 0, 0], [.1, .025, .01]))]), glow(coreC, 3));
    hd.rotation.y = 0;
    r.weapon = hm; r.armR.rotation.set(-.35, 0, .3); r.foreR.rotation.x = -1.7; hm.rotation.set(-.15, 0, 0);
    r.holdR = true; r.theme = coreC;
    return h;
  },

  // ═══════════════════════ VIKTOR ═══════════════════════
  viktor(Up) {
    const robeC = Up ? 0xd8dce6 : 0x3a2a4e, robe = M(robeC, { r: .78, ds: 1 }), robeM = M(robeC, { r: .75 }), dark = M(Up ? 0x8a94a8 : 0x231a30, { r: .7 });
    const steel = Up ? M(0xeef2f8, { m: .7, r: .25 }) : metal(0x6a6e78, .35), gold = Up ? M(0x9fe8ff, { m: .8, r: .25, e: .5, ec: 0x3fc8ff }) : M(0xc89a40, { m: .9, r: .3 });
    const eyeC = Up ? 0x7fe8ff : 0xffa64a, eg = glow(eyeC, 3.2);
    const h = humanoid({ bulk: 1.0, head: 1.0, leg: 1.04, skin: 0xb8aca4, faceM: steel, topM: robeM, sleeveM: robeM, foreM: steel, handM: steel, thighM: dark, shinM: steel, bootM: steel, beltM: gold, hipM: dark, style: 'cast', noEyes: true });
    const r = h.rig, hs = r.hs; r.castSide = 'L';
    // máscara: visor brillante y rejilla
    P(r.head, merged('pzVkVisor', () => [X(U.box, [0, .21, .225], [0, 0, 0], [.2, .035, .04]), X(U.sph, [-.07, .21, .235], [0, 0, 0], .028), X(U.sph, [.07, .21, .235], [0, 0, 0], .028)]), eg);
    P(r.head, merged('pzVkGrill', () => [0, 1, 2, 3].map(i => X(U.box, [-.06 + i * .04, .09, .22], [0, 0, 0], [.012, .07, .02]))), dark);
    // capucha
    P(r.head, lathe('pzVkHood', [[.0, .5], [.16, .47], [.28, .35], [.31, .18], [.29, .02], [.24, -.08]], 22), robe, [0, 0, -.04], [1, 1, 1.05]);
    P(r.head, U.ring, gold, [0, .2, .02], [.27, .27, .8], [-.15, 0, 0]);
    // túnica larga
    skirt(r, robe, 'pzVk', [[.42, -.8], [.34, -.45], [.25, -.08], [.2, .1]], gold);
    P(r.torso, merged('pzVkPlate', () => [X(U.sph, [0, .3, .06], [0, 0, 0], [.22, .17, .13]), X(U.cyl, [0, .44, 0], [0, 0, 0], [.2, .06, .16])]), steel);
    P(r.torso, U.oct, eg, [0, .3, .2], [.045, .07, .03]);
    pauldron(r.armL, -1, steel, gold, .18, .13, { tilt: .4 }); pauldron(r.armR, 1, steel, gold, .18, .13, { tilt: .4 });
    // brazo hextech (tercer brazo) desde la espalda con el Núcleo Hex
    const ba = grp(r.torso, .12, .42, -.18); r.backArm = ba;
    P(ba, merged('pzVkArmS', () => [XAB(U.cyl, [0, 0, 0], [.18, .32, -.08], .045), XAB(U.cyl, [.18, .32, -.08], [.34, .42, .26], .04), X(U.sph, [0, 0, 0], [0, 0, 0], .08), X(U.sph, [.18, .32, -.08], [0, 0, 0], .065)]), steel);
    P(ba, merged('pzVkArmG', () => [XAB(U.cyl, [.05, .09, -.02], [.13, .23, -.06], .055), XAB(U.cyl, [.22, .35, .0], [.3, .4, .17], .05)]), gold);
    const claw = grp(ba, .34, .42, .26); r.claw = claw;
    P(claw, merged('pzVkClaw', () => [0, 1, 2].map(i => { const a = i / 3 * TAU; return X(U.cone, [Math.cos(a) * .07, Math.sin(a) * .07, .1], [PI / 2 - Math.sin(a) * .5, Math.cos(a) * .5, 0], [.025, .18, .025]); })), steel);
    const orb = P(claw, U.sph, glow(eyeC, 3.5), [0, 0, .14], .075); P(claw, U.sph, M(eyeC, { e: 2, ec: eyeC, t: .3, add: 1 }), [0, 0, .14], .13);
    // bastón
    const st = grp(r.handR, 0, -.03, 0);
    P(st, U.cyl, dark, [0, .3, 0], [.025, 1.5, .025]);
    P(st, merged('pzVkStaffT', () => [X(U.oct, [0, 1.1, 0], [0, 0, 0], [.07, .12, .07]), X(U.ring, [0, 1.1, 0], [0, 0, 0], [.1, .1, .8]), X(U.cyl, [0, -.42, 0], [0, 0, 0], [.04, .06, .04])]), gold);
    P(st, U.sph, eg, [0, 1.1, 0], .045);
    r.weapon = st; r.armR.rotation.set(-.3, 0, .2); r.foreR.rotation.x = -.75; staffUpright(r, st);
    r.pulse = [orb]; r.theme = eyeC;
    r.anim = (m, r, st, t) => {
      const a = st.atk, ph = t * 1.4 + m.phase;
      S(r.backArm, Math.sin(ph) * .06 + (a >= 0 ? k0(a, [[0, 0], [.3, .35], [.5, -.25], [.8, -.2], [1, 0]]) : 0), Math.sin(ph * .7) * .1, 0);
      S(r.claw, 0, 0, t * (a >= 0 ? 6 : 1));
    };
    return h;
  },

  // ═══════════════════════ BLITZCRANK ═══════════════════════
  blitzcrank(Up) {
    const g = new THREE.Group(), root = grp(g), body = grp(root); root.scale.setScalar(1.12);
    const brass = Up ? M(0xf4f6f8, { m: .1, r: .2 }) : M(0xd9a83a, { m: .78, r: .34 }), brassD = Up ? M(0xc9ced6, { m: .3, r: .28 }) : M(0x9a6a24, { m: .75, r: .4 });
    const iron = Up ? M(0x22262e, { m: .5, r: .25 }) : M(0x3e3a38, { m: .7, r: .45 }), rust = Up ? M(0x9aa2ae, { m: .5, r: .3 }) : M(0x7a4a2a, { m: .6, r: .5 });
    const eyeC = Up ? 0x5fd8ff : 0x9ff0ff, eg = glow(eyeC, 3.2);
    const hips = grp(body, 0, .52, 0); P(hips, U.sph, iron, [0, 0, 0], [.3, .16, .24]);
    const leg = [], knee = [];
    for (const sx of [-1, 1]) {
      const l = grp(hips, sx * .21, -.02, 0); P(l, limb(.1, .09, .22), iron);
      const k = grp(l, 0, -.26, 0); P(k, lathe('pzBcShin', [[.09, .02], [.13, -.06], [.14, -.16], [.11, -.2]]), brass);
      P(k, U.rbox, brassD, [0, -.2, .07], [.24, .11, .34]);
      leg.push(l); knee.push(k);
    }
    const torso = grp(body, 0, .6, 0); torso.rotation.x = .2;
    P(torso, U.cyl, brassD, [0, .12, 0], [.36, .16, .3]);
    const chest = P(torso, U.sph, brass, [0, .5, 0], [.58, .5, .46]);
    P(torso, merged('pzBcBand', () => [X(U.cyl, [0, .28, 0], [0, 0, 0], [.54, .07, .42]), X(U.cyl, [0, .74, 0], [0, 0, 0], [.5, .05, .4])]), brassD);
    P(torso, merged('pzBcVent', () => [0, 1, 2, 3, 4].map(i => X(U.rbox, [-.2 + i * .1, .5, .44], [-.15, 0, 0], [.05, .2, .04]))), iron);
    P(torso, merged('pzBcRiv', () => { const o = []; for (let i = 0; i < 12; i++) { const a = (i / 11 - .5) * 2.6; o.push(X(U.sph, [Math.sin(a) * .54, .28, Math.cos(a) * .42], [0, 0, 0], .025)); } return o; }), rust);
    // chimeneas de vapor
    P(torso, merged('pzBcStack', () => [-1, 1].flatMap(sx => [X(U.cyl, [sx * .22, .95, -.3], [-.3, 0, sx * .12], [.08, .5, .08]), X(U.cyl, [sx * .245, 1.18, -.38], [-.3, 0, sx * .12], [.11, .08, .11])])), iron);
    // cabeza: cúpula con ojos
    const head = grp(torso, 0, .9, .22);
    P(head, U.sph, brass, [0, .06, 0], [.22, .19, .2]);
    P(head, U.sph, iron, [0, .03, .1], [.18, .13, .13]);
    P(head, merged('pzBcEyeR', () => [-1, 1].map(sx => X(U.cyl, [sx * .085, .08, .2], [PI / 2, 0, 0], [.065, .04, .065]))), brassD);
    P(head, merged('pzBcEye', () => [-1, 1].map(sx => X(U.sph, [sx * .085, .08, .22], [0, 0, 0], [.05, .05, .025]))), eg);
    P(head, merged('pzBcMouth', () => [0, 1, 2, 3].map(i => X(U.box, [-.06 + i * .04, -.03, .21], [0, 0, 0], [.018, .05, .02]))), Up ? M(0x5fd8ff, { e: 1, ec: 0x5fd8ff }) : brassD);
    // brazos largos con manos de garra
    const arm = [], fore = [], hand = [];
    for (const sx of [-1, 1]) {
      const a = grp(torso, sx * .6, .62, 0); a.rotation.z = sx * .15;
      P(a, U.sph, brassD, [0, 0, 0], .18);
      P(a, limb(.07, .06, .36), iron);
      const f = grp(a, 0, -.42, 0); f.rotation.x = -.3;
      P(f, U.sph, iron, [0, 0, 0], .09);
      P(f, lathe('pzBcFore', [[.08, -.02], [.13, -.1], [.19, -.35], [.2, -.45], [.15, -.5]]), brass);
      P(f, merged('pzBcForeR' + sx, () => [X(U.cyl, [0, -.18, 0], [0, 0, 0], [.17, .04, .17]), X(U.cyl, [0, -.4, 0], [0, 0, 0], [.205, .04, .205])]), rust);
      const hd = grp(f, 0, -.52, 0);
      P(hd, U.sph, brassD, [0, -.04, 0], [.16, .12, .16]);
      P(hd, merged('pzBcClaw', () => [0, 1, 2].map(i => { const ang = i / 3 * TAU + PI / 2; return X(limb(.06, .035, .2), [Math.cos(ang) * .1, -.08, Math.sin(ang) * .1], [Math.sin(ang) * .35, 0, -Math.cos(ang) * .35]); })), iron);
      arm.push(a); fore.push(f); hand.push(hd);
    }
    // cable del agarre (oculto hasta que dispara el puño)
    const cable = P(fore[1], U.cyl, M(0x2a2a2a, { m: .6, r: .4 }), [0, -.52, 0], [.025, .001, .025]);
    const rig = { type: 'hum', root, body, hips, torso, chest, head, legL: leg[0], legR: leg[1], kneeL: knee[0], kneeR: knee[1], armL: arm[0], armR: arm[1], foreL: fore[0], foreR: fore[1], handL: hand[0], handR: hand[1], style: 'slam', hs: 1, b: 1.6, heavy: true, theme: eyeC, cable };
    rig.anim = (m, r, st, t) => {
      const a = st.atk; let e = 0;
      if (a >= 0) {
        const b = r.armR.userData.b; r.armR.rotation.set(kf(a, b[0], [[0, null], [.25, -1.1], [.4, -1.55], [.8, -1.55], [1, null]]), b[1], b[2]);
        r.foreR.rotation.x = kf(a, r.foreR.userData.b[0], [[0, null], [.25, -.6], [.4, 0], [.8, 0], [1, null]]);
        e = k0(a, [[0, 0], [.35, 0], [.5, 1.1], [.7, 1.1], [.9, 0], [1, 0]]);
      }
      SP(r.handR, 0, -e, 0); r.cable.visible = e > .02; r.cable.scale.y = Math.max(.001, e); r.cable.position.y = -.52 - e / 2;
    };
    return { g, rig, s: 1 };
  },

  // ═══════════════════════ WARWICK ═══════════════════════
  warwick(Up) {
    const furC = Up ? 0x3c3650 : 0x707a88, fur = M(furC, { r: .92 }), furL = M(Up ? 0x5a4a6e : 0x9aa2ac, { r: .95 }), furD = M(Up ? 0x221e30 : 0x4a525e, { r: .9 });
    const iron = M(0x4a4440, { m: .7, r: .45 }), leather = M(0x3a2a20, { r: .7 }), pants = M(Up ? 0x2a2230 : 0x4a3a2a, { r: .85 });
    const chemC = Up ? 0xd86aff : 0x7fff5a, chem = glow(chemC, 2.6);
    const h = humanoid({ bulk: 1.38, head: 1.0, leg: 1.0, skin: furC, faceM: fur, topM: fur, absM: furL, sleeveM: fur, foreM: fur, handM: furD, thighM: pants, shinM: fur, bootM: furD, beltM: leather, hipM: pants, style: 'swing', noEyes: true, noBelt: false });
    const r = h.rig, hs = r.hs; r.digi = true;
    r.torso.rotation.x = .42; r.head.rotation.x = -.35; r.head.position.z = .05;
    // cabeza de lobo
    const hd = r.head;
    P(hd, U.sph, fur, [0, .14, .24], [.14, .11, .22]);
    P(hd, U.sph, furD, [0, .19, .45], [.05, .04, .04]);
    P(hd, merged('pzWwBrow', () => [-1, 1].map(sx => X(U.sph, [sx * .1, .27, .18], [0, 0, sx * .4], [.1, .04, .08]))), furD);
    P(hd, merged('pzWwEye', () => [-1, 1].map(sx => X(U.box, [sx * .1, .22, .225], [0, 0, sx * -.35], [.07, .02, .02]))), glow(Up ? 0xff7aff : 0xffd23a, 3.2));
    P(hd, merged('pzWwEars', () => [-1, 1].map(sx => X(U.cone, [sx * .17, .43, -.06], [-.35, 0, -sx * .3], [.07, .22, .05]))), fur);
    P(hd, merged('pzWwFangU', () => [-1, 1].flatMap(sx => [X(U.cone, [sx * .07, .05, .4], [PI, 0, 0], [.018, .07, .018]), X(U.cone, [sx * .1, .06, .32], [PI, 0, 0], [.014, .05, .014])])), M(0xf2ead8, { r: .4 }));
    const jaw = grp(hd, 0, .08, .1); r.jaw = jaw;
    P(jaw, U.sph, furD, [0, -.04, .16], [.11, .05, .18]);
    P(jaw, merged('pzWwFangL', () => [-1, 1].map(sx => X(U.cone, [sx * .06, .0, .28], [0, 0, 0], [.016, .06, .016]))), M(0xf2ead8, { r: .4 }));
    // melena erizada por el lomo
    P(r.torso, merged('pzWwMane', () => { const o = []; for (let i = 0; i < 9; i++) { const u = i / 8, a = (i % 3 - 1) * .5; o.push(X(U.cone, [Math.sin(a) * .15, .62 - u * .45, -.1 - Math.cos(u * 2) * .12], [-1.9 + u * .5, 0, a * .6], [.08, .3 - u * .1, .06])); } return o; }), furL);
    P(hd, merged('pzWwMane2', () => [-1, 0, 1].map(i => X(U.cone, [i * .12, .3, -.18], [-2.0, 0, i * .4], [.08, .26, .06]))), furL);
    // tanque químico a la espalda con tubos
    const tk = grp(r.torso, 0, .36, -.32); tk.rotation.x = -.3;
    P(tk, U.cyl, iron, [0, .2, 0], [.13, .06, .13]); P(tk, U.cyl, iron, [0, -.2, 0], [.13, .06, .13]);
    P(tk, U.cyl, M(0xcfe8d0, { r: .05, t: .3 }), [0, 0, 0], [.12, .36, .12]);
    const liq = P(tk, U.cyl, chem, [0, -.03, 0], [.09, .3, .09]);
    P(r.torso, merged('pzWwTubes', () => [-1, 1].map(sx => X(tube('pzWwTube' + sx, [[sx * .06, .54, -.32], [sx * .16, .62, -.22], [sx * .24, .55, -.05], [sx * .27, .42, .02]], () => .028, 12, 6), [0, 0, 0]))), M(chemC, { e: 1.2, ec: chemC, r: .3 }));
    P(r.torso, merged('pzWwStraps', () => [X(U.ring, [0, .3, 0], [PI / 2, 0, .5], [.26, .2, .9]), X(U.ring, [0, .3, 0], [PI / 2, 0, -.5], [.26, .2, .9])]), leather);
    pauldron(r.armL, -1, iron, leather, .2, .13, { tilt: .4 });
    // garras metálicas
    for (const [hn, sx] of [[r.handL, -1], [r.handR, 1]]) {
      P(hn, merged('pzWwClaw', () => [-1, 0, 1].map(i => X(U.cone, [i * .05, -.17, .06], [PI - .35, 0, i * .12], [.022, .2, .016]))), metal(0xc8ccd2, .25));
    }
    P(r.foreR, U.cyl, iron, [0, -.14, 0], [.085, .18, .085]);
    P(r.foreL, U.cyl, iron, [0, -.14, 0], [.085, .18, .085]);
    for (const kn of [r.kneeL, r.kneeR]) P(kn, merged('pzWwToe', () => [-1, 0, 1].map(i => X(U.cone, [i * .04, -.36, .2], [PI / 2, 0, 0], [.018, .07, .018]))), M(0xe8dcc8, { r: .4 }));
    r.armL.rotation.set(-.4, 0, -.35); r.foreL.rotation.x = -.6; r.armR.rotation.set(-.4, 0, .35); r.foreR.rotation.x = -.6;
    r.pulse = [liq]; r.theme = chemC;
    r.anim = (m, r, st, t) => { const a = st.atk; S(r.jaw, (a >= 0 ? k0(a, [[0, 0], [.3, .55], [.5, .1], [1, 0]]) : Math.max(0, Math.sin(t * 1.3 + m.phase)) * .15)); };
    return h;
  },
};
