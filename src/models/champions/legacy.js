import { THREE, M, glow, gld, cloth, metal, hairM, EYE, TAU, PI, U, cg, limb, lathe, tube, taper, spindle, ext, norm, X, XAB, merged, capeGeo, grp, P, SEG, humanoid, hairCap, bangs, brows, pauldron, cape, skirt, bladeGeo, sword, staffUpright, f3 } from '../kit.js';

// Campeones originales del MVP (los subagentes de cada legión los reemplazan).
// ═════════════════════════ CAMPEONES ═════════════════════════
export const CHAMPS = {
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
    const iron = metal(0x596070, .38), red = cloth(0x9a1e1e, 1), steel = metal(0x9aa0ab, .3), gold = gld(Up), leather = M(0x2a1a14, { r: .7 });
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
    P(ax, bladeG, metal(0x8a919e, .3));
    P(ax, ext('darEdge', s => { s.moveTo(.58, .52); s.quadraticCurveTo(.85, 1.2, .62, 1.85); s.quadraticCurveTo(.8, 1.2, .66, .53); }, .06, .006), Up ? glow(0xff3a2a, 2.5) : metal(0xd8dde6, .18));
    P(ax, ext('darBack', s => { s.moveTo(0, 1.05); s.lineTo(-.4, 1.2); s.lineTo(0, 1.42); }, .06, .015), metal(0x8a919e, .3));
    P(ax, U.cone, steel, [0, 0, 1.68], [.05, .25, .05], [PI / 2, 0, 0]);
    r.weapon = ax; r.armR.rotation.set(-.15, 0, .3); r.foreR.rotation.x = -1.0; ax.rotation.set(-.42, 0, 0); ax.scale.setScalar(.8); ax.position.z = -.12;
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
    const braidPts = sx => [[sx * .19, .33, -.1], [sx * .34, .2, -.16], [sx * .42, -.15, -.22], [sx * .44, -.6, -.28], [sx * .4, -1.0, -.38], [sx * .32, -1.28, -.6], [sx * .24, -1.38, -.9]];
    r.braids = [-1, 1].map(sx => { const bg = grp(r.head, 0, 0, 0); P(bg, tube('jinxbraid' + sx, braidPts(sx), taper(.085, .03, .3, 46), 46, 7), blueH); P(bg, U.sph, pink, [sx * .24, -1.38, -.9], .04); return bg; });
    // Fishbones
    const lz = grp(r.torso, .42, .17, .06); r.launcher = lz;
    const fbM = M(0x5d7d9c, { m: .45, r: .45 }), teeth = M(0xf4f0e6, { r: .4 }), maw = M(0x3a0a18, { r: .8 });
    P(lz, lathe('fishbody', [[.02, -.72], [.11, -.6], [.18, -.3], [.21, 0], [.2, .22], [.15, .36]]), fbM, [0, 0, 0], 1, [PI / 2, 0, 0]);
    P(lz, U.sph, fbM, [0, .07, .4], [.19, .11, .2]);
    P(lz, U.sph, fbM, [0, -.11, .38], [.16, .06, .18]);
    P(lz, U.sph, maw, [0, -.02, .42], [.15, .08, .15]);
    P(lz, merged('fishTeeth2', () => { const o = []; for (let i = 0; i < 9; i++) { const a = (i / 8 - .5) * 2.4; o.push(X(U.cone, [Math.sin(a) * .16, .0, .42 + Math.cos(a) * .14], [PI, 0, 0], [.022, .08, .022])); o.push(X(U.cone, [Math.sin(a) * .13, -.07, .41 + Math.cos(a) * .12], [0, 0, 0], [.02, .065, .02])); } return o; }), teeth);
    P(lz, merged('fishFins', () => [X(U.pyr, [0, .24, -.1], [-.6, 0, 0], [.03, .3, .16]), X(U.pyr, [.18, -.12, -.45], [0, 0, -2.2], [.02, .22, .1]), X(U.pyr, [-.18, -.12, -.45], [0, 0, 2.2], [.02, .22, .1]), X(U.pyr, [0, .14, -.72], [-1.1, 0, 0], [.025, .26, .14]), X(U.pyr, [0, -.1, -.72], [-2.0, 0, 0], [.025, .2, .12])]), fbM);
    P(lz, merged('fishEyes', () => [-1, 1].map(sx => X(U.sph, [sx * .17, .1, .3], [0, 0, 0], .042))), glow(0xff3a6a, 3));
    P(lz, merged('fishPaint', () => [X(U.ring, [0, 0, .05], [0, 0, 0], [.212, .212, 1.4]), X(U.ring, [0, 0, -.15], [0, 0, 0], [.2, .2, 1.4]), X(U.pyr, [0, .2, .15], [0, 0, 0], [.04, .12, .04])]), pink);
    if (Up) P(lz, U.sph, M(0xff4fa3, { e: 2, ec: 0xff4fa3, t: .4, add: 1 }), [0, 0, .45], .16);
    r.weapon = lz;
    r.armR.rotation.set(-.3, 0, .35); r.foreR.rotation.x = -1.0; r.armL.rotation.set(-.6, -.5, .1); r.foreL.rotation.x = -1.2;
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

