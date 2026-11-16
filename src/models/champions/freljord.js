import { THREE, M, glow, gld, cloth, metal, hairM, EYE, TAU, PI, U, cg, limb, lathe, tube, taper, spindle, ext, X, XAB, merged, capeGeo, grp, P, humanoid, hairCap, bangs, brows, pauldron, cape, skirt, bladeGeo, sword, staffUpright, prestige, f3, kf, S, SP } from '../kit.js';
// Modelos 3D de la legión Freljord. Cada función: (Up: bool mejorado, opts) => { g, rig, s }
// Convenciones del kit: pies en y=0, mirando a +Z, ≈2 de alto (monturas y semidioses, más grandes).

const mir = f => [-1, 1].map(f);
const add = (c, e = 2, t = .4) => M(c, { e, ec: c, t, add: 1 });
const B0 = (j, i) => j.userData.b[i];
const iceM = (c = 0xa8ecff, e = .7, ec = 0x48b4ff) => M(c, { m: .1, r: .12, e, ec });
// mechones/púas: lista [x,y,z, rx,rz, ancho,largo]
const spikes = (key, list, g = U.cone) => merged(key, () => list.map(([x, y, z, rx, rz, w, l]) => X(g, [x, y, z], [rx, 0, rz], [w, l, w * .7])));
// mechones de pelaje (icosaedros aplastados) para criaturas
const tufts = (key, list) => merged(key, () => list.map(([x, y, z, s, sy]) => X(U.ico, [x, y, z], [x * 3, y * 2, z], [s, s * (sy ?? 1), s])));
// prestigio sobre una montura: el halo va sobre la cabeza del jinete
function prestigeOn(h, head, hs = 1) { const fake = { rig: { root: h.rig.root, theme: h.rig.theme, head, hs } }; prestige(fake); Object.assign(h.rig, { sigil: fake.rig.sigil, motes: fake.rig.motes, upgraded: true }); }
// pierna de cuadrúpedo con rodilla (pivote en la cadera)
function qLeg(p, x, y, z, mat, hoof, o = {}) {
  const l = grp(p, x, y, z); P(l, limb(o.r1 ?? .16, o.r2 ?? .11, o.l1 ?? .32), mat);
  const k = grp(l, 0, -(o.l1 ?? .32) - .04, 0); P(k, limb(o.r2 ?? .11, o.r3 ?? .08, o.l2 ?? .3), mat);
  P(k, U.cyl, hoof, [0, -(o.l2 ?? .3) - .02, .02], [(o.r3 ?? .08) * 1.25, .08, (o.r3 ?? .08) * 1.4]);
  l.userData.knee = k; return l;
}

export const MODELS = {
  // ═════════════ ASHE · La Arquera de Hielo (Up: Ashe Reina) ═════════════
  ashe(Up) {
    const blueC = cloth(Up ? 0x2a3f8a : 0x3768b0), white = M(Up ? 0xf4f0e8 : 0xe9eef5, { r: .78 }), fur = M(0xf6f7fa, { r: .95 }), navy = cloth(Up ? 0x1a2350 : 0x1f2c4f), gold = gld(Up);
    const goldA = M(0xe0b050, { m: .9, r: .26, e: Up ? .3 : 0, ec: 0xffa020 }), ice = M(0xb8f0ff, { m: .1, r: .12, e: Up ? 1.5 : 1.0, ec: 0x48b4ff });
    const h = humanoid({ bulk: .88, head: 1.06, leg: 1.04, skin: 0xf3d6c2, topM: blueC, sleeveM: blueC, foreM: white, handM: white, thighM: navy, shinM: white, bootM: white, beltM: goldA, style: 'bow', eyeM: M(0x2a4a8a, { r: .3, e: .3, ec: 0x2a6aff }) });
    const r = h.rig, hs = r.hs;
    P(r.torso, merged('asheTop', () => [X(U.sph, [0, .3, .06], [0, 0, 0], [.23, .18, .12]), X(U.box, [0, .14, .14], [0, 0, 0], [.16, .05, .04])]), white);
    P(r.torso, U.oct, goldA, [0, .33, .18], [.04, .065, .02]);
    skirt(r, cloth(Up ? 0x2a3f8a : 0x3768b0, 1), 'asheSk', [[.3, -.3], [.26, -.16], [.2, .04]], fur);
    for (const f of [r.foreL, r.foreR]) P(f, U.cyl, fur, [0, -.03, 0], [.085, .06, .085]);
    for (const k of [r.kneeL, r.kneeR]) P(k, U.cyl, fur, [0, -.06, 0], [.1, .08, .1]);
    const hw = hairM(0xf2f4ff); bangs(r, hw, 5, { len: .13 }); hairCap(r, hw, { tilt: -.5 });
    const br = tube('ashebraid2', [[.17, .14, .02], [.23, -.02, .1], [.24, -.25, .15], [.2, -.55, .16]], taper(.065, .03, .3, 24), 18, 7); r.tails = [P(r.head, br, hw)];
    P(r.head, U.sph, M(0x5aa0ff, { e: .6, ec: 0x2a7aff }), [.2, -.57, .16], .035);
    if (Up) { // corona de la reina de la Avarosa
      P(r.head, merged('asheCrown', () => { const o = [X(U.ring, [0, .36, -.01], [PI / 2 - .4, 0, 0], [.25, .245, .6])]; for (let i = 0; i < 7; i++) { const an = (i / 6 - .5) * 2; o.push(X(U.pyr, [Math.sin(an) * .24, .44 + (i === 3 ? .04 : 0), Math.cos(an) * .12 - .02], [-.4 * Math.cos(an), 0, -an * .7], [.025, i === 3 ? .22 : .14, .012])); } return o; }), goldA);
      P(r.head, U.oct, glow(0x8fe0ff, 3), [0, .5 * hs, .14], [.03, .06, .02]);
    } else P(r.head, U.hemi, cloth(0x2f5ea6, 1), [0, .17 * hs, -.06], [.31 * hs, .36 * hs, .33 * hs], [-.85, 0, 0]); // capucha caída
    P(r.torso, U.sph, fur, [0, .44, -.01], Up ? [.34, .1, .24] : [.27, .08, .2]);
    cape(r, cloth(Up ? 0xf4f0e8 : 0x2f5ea6, 1), { rT: .27, rM: .33, rB: Up ? .5 : .42, l1: .55, l2: Up ? .82 : .7, arc: 2.6, trim: Up ? goldA : fur });
    // arco de Hielo Verdadero
    const bow = grp(r.handL, 0, -.03, 0);
    const pts = [[0, .3, -.78], [0, .12, -.46], [0, 0, 0], [0, .12, .46], [0, .3, .78]];
    P(bow, tube('ashebow2', pts, spindle(.055, .018), 26, 7), Up ? goldA : ice);
    if (Up) P(bow, tube('ashebowIn', [[0, .28, -.72], [0, .14, -.44], [0, .04, 0], [0, .14, .44], [0, .28, .72]], spindle(.03, .01), 26, 6), ice);
    P(bow, merged('asheTips2', () => [X(U.oct, [0, .34, -.83], [.5, 0, 0], [.055, .15, .055]), X(U.oct, [0, .34, .83], [-.5, 0, 0], [.055, .15, .055]), X(U.oct, [0, -.06, 0], [0, 0, 0], [.065, .1, .1]), X(U.oct, [0, .2, -.6], [.9, 0, 0], [.03, .1, .03]), X(U.oct, [0, .2, .6], [-.9, 0, 0], [.03, .1, .03])]), glow(0xbff3ff, Up ? 2.6 : 1.8));
    P(bow, XAB(U.cyl, [0, .3, -.78], [0, .3, .78], .006), M(0xffffff, { e: .8, ec: 0xbfefff }));
    r.weapon = bow;
    const arrow = grp(r.handR, 0, -.03, 0); P(arrow, U.cyl, glow(0xbff3ff, 2), [0, 0, .25], [.012, .7, .012], [PI / 2, 0, 0]); P(arrow, U.oct, glow(0x8fe0ff, 3), [0, 0, .62], [.03, .08, .03], [PI / 2, 0, 0]); arrow.visible = false; r.arrow = arrow;
    r.armL.rotation.set(-.5, 0, -.15); r.foreL.rotation.x = -.6;
    r.theme = 0x7fd8ff;
    return h;
  },

  // ═════════════ GNAR · El Eslabón Perdido (Up: Mega Gnar) ═════════════
  gnar(Up) {
    if (Up) return megaGnar();
    const furC = 0xd9853a, fur = M(furC, { r: .9 }), belly = M(0xf2dcb4, { r: .9 }), bone = M(0xeee2c6, { r: .55 }), brown = M(0x6a4024, { r: .8 });
    const h = humanoid({ bulk: 1.05, head: 1.55, leg: .62, skin: furC, topM: fur, sleeveM: fur, foreM: fur, handM: fur, thighM: fur, shinM: fur, bootM: fur, beltM: brown, hipM: fur, eyeM: M(0x2a1608, { r: .2 }), style: 'cast' });
    const r = h.rig, hs = r.hs; r.root.scale.setScalar(.68); r.castSide = 'R';
    P(r.torso, U.sph, belly, [0, .2, .09], [.17, .2, .1]);
    P(r.head, U.sph, belly, [0, .12 * hs, .1 * hs], [.17 * hs, .12 * hs, .15 * hs]); // hocico claro
    P(r.head, merged('gnarMouth', () => [X(U.box, [0, .08, .245], [0, 0, 0], [.1, .012, .01]), X(U.cone, [.04, .06, .25], [PI, 0, 0], [.018, .04, .015])]), M(0x3a1a10, { r: .5 }), [0, 0, 0], hs);
        // ojos enormes
    P(r.head, merged('gnarEyes', () => mir(sx => X(U.sph, [sx * .1, .21, .2], [0, 0, 0], [.065, .075, .05]))), M(0xffffff, { r: .3 }), [0, 0, 0], hs);
    P(r.head, merged('gnarPupil', () => mir(sx => X(U.sph, [sx * .1, .21, .245], [0, 0, 0], [.04, .05, .02]))), M(0x2a1608, { r: .2 }), [0, 0, 0], hs);
    // orejas y mejillas peludas
    P(r.head, merged('gnarEars', () => mir(sx => X(U.cone, [sx * .27, .26, -.02], [0, 0, -sx * 1.3], [.07, .2, .04]))), fur, [0, 0, 0], hs);
    P(r.head, tufts('gnarCheek', [[.22, .1, .08, .07, 1.3], [-.22, .1, .08, .07, 1.3], [0, .02, -.2, .08]]), fur, [0, 0, 0], hs);
    // casco de cráneo con colmillos y cuernos
    P(r.head, lathe('gnarSkull', [[.0, .5], [.14, .48], [.25, .4], [.29, .27], [.28, .2]]), bone, [0, .0, -.01], [hs * .98, hs, hs]);
    P(r.head, merged('gnarSkullD', () => [...[-1.5, -.5, .5, 1.5].map(i => X(U.cone, [i * .07, .33, .245 - Math.abs(i) * .02], [PI - .35, 0, 0], [.018, .05, .016])), ...mir(sx => X(U.cone, [sx * .2, .5, -.04], [-.4, 0, -sx * .75], [.045, .16, .045])), X(U.sph, [0, .47, .1], [0, 0, 0], [.14, .06, .14])]), bone, [0, 0, 0], hs);
    // cola
    r.tails = [P(r.hips, tube('gnarTail', [[0, 0, -.12], [0, -.05, -.3], [0, .05, -.45], [0, .2, -.5]], taper(.09, .03), 12, 6), fur)];
    // bumerán de hueso
    const bm = grp(r.handR, 0, -.06, .04);
    P(bm, ext('gnarBoom', s => { s.moveTo(0, 0); s.quadraticCurveTo(.25, .12, .55, .02); s.quadraticCurveTo(.62, -.04, .55, -.1); s.quadraticCurveTo(.25, -.02, .02, -.14); s.quadraticCurveTo(-.22, -.02, -.5, -.12); s.quadraticCurveTo(-.58, -.06, -.5, .0); s.quadraticCurveTo(-.25, .12, 0, 0); }, .05, .015, 0), bone, [0, 0, 0], .9, [0, 0, 0]);
    P(bm, U.cyl, brown, [0, .0, -.06], [.07, .08, .07]);
    r.weapon = bm; bm.rotation.set(0, .5, .3);
    r.armR.rotation.set(-.6, 0, .3); r.foreR.rotation.x = -.9;
    r.theme = 0xffb050;
    return h;
  },

  // ═════════════ NUNU Y WILLUMP · El Niño y su Yeti (Up: Groove Espacial) ═════════════
  nunu(Up) {
    const furC = Up ? 0xc8a8ff : 0xeef2f8, fur = M(furC, { r: .95 }), faceC = Up ? 0x4fd8e0 : 0x8fb0d4, face = M(faceC, { r: .7 }), horn = M(Up ? 0xff8ad8 : 0xe8dcc0, { r: .45 });
    const h = humanoid({ bulk: 1.9, head: 1.35, leg: .66, skin: faceC, topM: fur, sleeveM: fur, foreM: fur, handM: face, thighM: fur, shinM: fur, bootM: face, beltM: fur, hipM: fur, faceM: fur, noEyes: true, style: 'slam', noBelt: true });
    const r = h.rig, hs = r.hs; r.root.scale.setScalar(1.08);
    P(r.torso, U.sph, fur, [0, .2, .04], [.42, .36, .32]); // barriga peluda
    P(r.torso, tufts('wilChest', [[-.25, .45, .15, .12], [.25, .45, .15, .12], [0, .5, .2, .13], [-.35, .2, .05, .12], [.35, .2, .05, .12], [0, -.02, .25, .12]]), fur);
    // cara azul con boca enorme
    P(r.head, U.sph, face, [0, .17 * hs, .09 * hs], [.21 * hs, .2 * hs, .17 * hs]);
    P(r.head, U.sph, M(0x2a1a3a, { r: .6 }), [0, .09 * hs, .2 * hs], [.13 * hs, .07 * hs, .06 * hs]);
    P(r.head, merged('wilTeeth', () => [...[-2, -1, 0, 1, 2].map(i => X(U.box, [i * .045, .14, .255], [0, 0, 0], [.035, .035, .015])), ...mir(sx => X(U.cone, [sx * .1, .06, .25], [0, 0, 0], [.02, .05, .02]))]), M(0xffffff, { r: .4 }), [0, 0, 0], hs);
    P(r.head, merged('wilEyes', () => mir(sx => X(U.sph, [sx * .09, .28, .22], [0, 0, 0], [.035, .045, .025]))), M(0x101830, { r: .2 }), [0, 0, 0], hs);
    P(r.head, merged('wilEyeHi', () => mir(sx => X(U.sph, [sx * .085, .29, .245], [0, 0, 0], .012))), M(0xffffff, { e: .8, ec: 0xffffff }), [0, 0, 0], hs);
    P(r.head, merged('wilBrow', () => mir(sx => X(U.box, [sx * .09, .34, .23], [0, 0, sx * -.2], [.08, .02, .02]))), M(Up ? 0x7a5aff : 0x5a7aa8, { r: .7 }), [0, 0, 0], hs);
    P(r.head, merged('wilHorns', () => mir(sx => X(U.cone, [sx * .17, .44, .0], [-.2, 0, -sx * .5], [.05, .15, .05]))), horn, [0, 0, 0], hs);
    P(r.head, tufts('wilHeadFur', [[0, .46, -.05, .1], [.15, .4, -.12, .09], [-.15, .4, -.12, .09], [.25, .22, -.05, .08], [-.25, .22, -.05, .08]]), fur, [0, 0, 0], hs);
    // brazos largos y manazas
    for (const a of [r.armL, r.armR]) { a.scale.setScalar(1.25); P(a, tufts('wilArmFur', [[0, -.05, 0, .1], [.03, -.2, .02, .08]]), fur); }
    for (const hd of [r.handL, r.handR]) P(hd, merged('wilClaw', () => [-1, 0, 1].map(i => X(U.cone, [i * .04, -.09, .06], [PI - .4, 0, 0], [.02, .06, .02]))), horn);
    // NUNU sentado sobre la espalda
    const nu = grp(r.torso, .05, .8, -.2); nu.scale.setScalar(.55);
    const coat = cloth(Up ? 0xff6ab0 : 0x3a8ab0), hat = cloth(Up ? 0x2a2a3a : 0x2f6a8a), nskin = M(0xf2c8a8, { r: .6 }), scarf = cloth(Up ? 0x4fd8e0 : 0xc8342a, 1);
    P(nu, U.sph, coat, [0, .45, 0], [.24, .3, .2]);
    P(nu, U.ring, scarf, [0, .72, 0], [.17, .15, 1.8], [PI / 2, 0, 0]);
    const nh = grp(nu, 0, .95, .02);
    P(nh, U.sph, nskin, [0, 0, 0], [.27, .28, .26]);
    P(nh, merged('nunuEyes', () => mir(sx => X(U.sph, [sx * .09, .0, .23], [0, 0, 0], [.035, .05, .025]))), EYE);
    P(nh, U.hemi, hat, [0, .02, -.02], [.3, .32, .3], [-.3, 0, 0]);
    P(nh, merged('nunuFlaps', () => [...mir(sx => X(U.sph, [sx * .25, -.1, -.02], [0, 0, 0], [.07, .13, .1])), X(U.sph, [0, .32, -.06], [0, 0, 0], .08)]), Up ? M(0x4fd8e0, { r: .5, e: .6, ec: 0x4fd8e0 }) : fur);
    P(nh, merged('nunuHair', () => [0, 1, 2].map(i => X(U.cone, [(i - 1) * .1, .12, .22], [2.2, 0, (i - 1) * .3], [.05, .12, .03]))), hairM(0x6a3a1a));
    for (const sx of [-1, 1]) { P(nu, XAB(U.cyl, [sx * .2, .6, 0], [sx * .38, .45, .25], .07), coat); P(nu, XAB(U.cyl, [sx * .15, .25, .05], [sx * .4, .1, .3], .08), M(0x4a3020, { r: .8 })); P(nu, U.sph, M(0x6a4024, { r: .7 }), [sx * .42, .06, .34], [.09, .08, .12]); }
    r.nunu = nh;
    if (Up) { P(r.head, merged('wilShades', () => [...mir(sx => X(U.oct, [sx * .09, .28, .245], [0, 0, PI / 4], [.07, .07, .015])), X(U.box, [0, .29, .245], [0, 0, 0], [.08, .012, .01])]), M(0xff4fd8, { m: .5, r: .1, e: 1, ec: 0xff2ab0 })); }
    r.armR.rotation.set(-.3, 0, .35); r.armL.rotation.set(-.3, 0, -.35);
    r.heavy = true; r.theme = Up ? 0xc86bff : 0xbfe6ff;
    r.anim = (m, rr, st, t) => { S(rr.nunu, Math.sin(t * 3) * .05, Math.sin(t * 1.3) * .3, 0); };
    return h;
  },

  // ═════════════ OLAF · El Berserker (Up: Pentakill) ═════════════
  olaf(Up) {
    const skinC = 0xf0c8a8, skin = M(skinC, { r: .58 }), furC = M(Up ? 0x1a1a1e : 0x6a5640, { r: .95 }), leather = M(Up ? 0x15151a : 0x4a3020, { r: .65 }), steel = Up ? M(0xc8ccd6, { m: .7, r: .25 }) : metal(0x8a9098, .35);
    const pants = cloth(Up ? 0x1c1c22 : 0x2a3a5a), red = M(0xd9682a, { r: .75, ds: 1 }), tat = M(0x3a6ab0, { r: .7 });
    const h = humanoid({ bulk: 1.38, head: 1.0, skin: skinC, topM: skin, sleeveM: skin, foreM: leather, handM: leather, thighM: pants, shinM: furC, bootM: leather, beltM: leather, hipM: pants });
    const r = h.rig, hs = r.hs;
    P(r.torso, merged('olafPecs', () => [...mir(sx => X(U.sph, [sx * .11, .32, .1], [0, 0, 0], [.13, .1, .09])), X(U.sph, [0, .1, .08], [0, 0, 0], [.2, .16, .13])]), skin);
    P(r.torso, merged('olafStraps', () => [X(U.box, [0, .27, .0], [0, 0, .7], [.05, .62, .37]), X(U.cyl, [0, -.02, 0], [0, 0, 0], [.215, .08, .17])]), leather);
    P(r.torso, U.cyl, gld(Up), [0, -.02, .165], [.06, .07, .06], [PI / 2, 0, 0]);
    P(r.torso, U.sph, furC, [0, .45, -.04], [.36, .12, .26]); // manto de piel
    cape(r, furC, { rT: .32, rM: .36, rB: .44, l1: .4, l2: .5, arc: 2.4 });
    for (const a of [r.armL, r.armR]) P(a, merged('olafTat', () => [0, 1, 2].map(i => X(U.box, [0, -.06 - i * .05, .08], [0, 0, i % 2 ? .5 : -.5], [.08, .015, .01]))), tat);
    if (Up) for (const [a, sx] of [[r.armL, -1], [r.armR, 1]]) { const pg = pauldron(a, sx, leather, steel, .26, .17, { tilt: .4 }); P(pg, merged('olafStud', () => [0, 1, 2].map(i => X(U.cone, [(i - 1) * .1, .15, 0], [0, 0, (i - 1) * -.4], [.03, .12, .03]))), steel); }
    // barba trenzada y pelo naranja
    const hb = hairM(0xd9682a);
    P(r.head, U.sph, hb, [0, .08 * hs, .12 * hs], [.21 * hs, .15 * hs, .16 * hs]);
    r.braids = mir(sx => { const bg = grp(r.head); P(bg, tube('olafBeard' + sx, [[sx * .07, .02, .2], [sx * .08, -.15, .22], [sx * .07, -.32, .2], [sx * .06, -.45, .16]], taper(.06, .03, .3, 30), 16, 6), hb); P(bg, U.cyl, steel, [sx * .065, -.36, .19], [.04, .04, .04]); return bg; });
    P(r.head, merged('olafMust', () => mir(sx => X(U.sph, [sx * .07, .14, .23], [0, 0, sx * .5], [.08, .03, .04]))), hb);
    P(r.head, tube('olafMane', [[0, .3, -.15], [0, .1, -.28], [0, -.15, -.3], [0, -.4, -.26]], taper(.2, .12), 12, 9), hb);
    brows(r, hb, .4);
    // casco con cuernos
    P(r.head, lathe('olafHelm', [[.0, .5], [.15, .48], [.25, .4], [.285, .27], [.29, .2]]), steel, [0, 0, -.01], hs);
    P(r.head, U.ring, Up ? steel : gld(false), [0, .2 * hs, -.01], [.29 * hs, .285 * hs, .8], [PI / 2, 0, 0]);
    P(r.head, merged('olafHorns', () => mir(sx => norm2(tube('olafHorn' + sx, [[sx * .22, .36, 0], [sx * .38, .44, 0], [sx * .46, .62, -.02], [sx * .44, .8, -.06]], taper(.07, .008), 14, 7)))), M(Up ? 0x2a2a2e : 0xeee2c6, { r: .45 }));
    P(r.head, U.box, steel, [0, .26 * hs, .26 * hs], [.04, .12, .03]); // nasal
    // dos hachas
    const axeM = Up ? M(0xe0e4ea, { m: .7, r: .2 }) : M(0xc8ced8, { m: .6, r: .28 }), handle = M(Up ? 0x8a1420 : 0x6a4428, { r: .7 });
    const axeHead = Up ? ext('olafGuitar', s => { s.moveTo(0, .55); s.quadraticCurveTo(.3, .6, .32, .78); s.quadraticCurveTo(.4, 1.0, .22, 1.02); s.quadraticCurveTo(.1, .95, 0, 1.0); s.lineTo(0, .55); }, .05, .015) : ext('olafAxe', s => { s.moveTo(0, .58); s.lineTo(.12, .6); s.quadraticCurveTo(.3, .55, .38, .48); s.quadraticCurveTo(.44, .75, .38, 1.02); s.quadraticCurveTo(.3, .92, .12, .9); s.lineTo(0, .92); s.lineTo(0, .58); }, .04, .012);
    r.axes = [];
    for (const hd of [r.handL, r.handR]) {
      const ax = grp(hd, 0, -.03, 0);
      P(ax, U.cyl, handle, [0, 0, .3], [.032, .95, .032], [PI / 2, 0, 0]);
      P(ax, axeHead, Up ? M(0xc8102a, { m: .3, r: .25 }) : axeM, [0, 0, -.15], 1, [0, 0, PI / 2]);
      if (Up) { P(ax, ext('olafGEdge', s => { s.moveTo(.3, .62); s.quadraticCurveTo(.48, .8, .3, 1.0); s.lineTo(.28, .62); }, .06, .006), axeM, [0, 0, -.15], 1, [0, 0, PI / 2]); P(ax, merged('olafStr', () => [-1, 0, 1].map(i => X(U.box, [i * .03, .03, .55], [0, 0, 0], [.006, .006, .7]))), M(0xeeeeee, { m: .9, r: .2 })); }
      r.axes.push(ax);
    }
    r.weapon = r.axes[1];
    r.armR.rotation.set(-.2, 0, .35); r.foreR.rotation.x = -1.2; r.axes[1].rotation.x = .9;
    r.armL.rotation.set(-.2, 0, -.35); r.foreL.rotation.x = -1.2; r.axes[0].rotation.x = .9;
    r.style = 'swing'; r.holdR = r.holdL = true; r.theme = Up ? 0xff3a2a : 0xffa040;
    return h;
  },

  // ═════════════ BRAUM · El Corazón del Freljord (Up: Cazadragones) ═════════════
  braum(Up) {
    const skinC = 0xeab494, skin = M(skinC, { r: .58 }), shirt = cloth(Up ? 0x8a1a1a : 0x3a6a8a), pants = cloth(Up ? 0x3a2a24 : 0x5a3a28), fur = M(0xd8d0c4, { r: .95 }), leather = M(0x4a3020, { r: .65 });
    const steel = Up ? metal(0xb8c0cc, .3) : M(0x5a6a7a, { m: .65, r: .4 }), goldA = M(0xe0b050, { m: .9, r: .26, e: Up ? .3 : 0, ec: 0xffa020 });
    const h = humanoid({ bulk: 1.6, head: 1.02, leg: .88, skin: skinC, topM: shirt, sleeveM: skin, foreM: skin, handM: Up ? steel : leather, thighM: pants, shinM: fur, bootM: leather, beltM: leather, hipM: pants });
    const r = h.rig, hs = r.hs;
    for (const a of [r.armL, r.armR]) a.scale.set(1.15, 1.05, 1.15);
    P(r.torso, U.sph, skin, [0, .4, .1], [.15, .08, .07]);
    P(r.torso, merged('braumBelt', () => [X(U.cyl, [0, -.01, 0], [0, 0, 0], [.32, .1, .24])]), leather);
    P(r.torso, U.cyl, goldA, [0, -.01, .23], [.08, .04, .08], [PI / 2, 0, 0]);
    P(r.torso, U.sph, fur, [0, .46, -.02], [.4, .11, .26]);
    if (Up) { for (const [a, sx] of [[r.armL, -1], [r.armR, 1]]) pauldron(a, sx, steel, goldA, .3, .2, { tilt: .35, layer: steel }); cape(r, cloth(0x8a1a1a, 1), { rT: .38, rM: .42, rB: .5, l1: .5, l2: .6, arc: 2.4, trim: goldA }); P(r.torso, U.sph, steel, [0, .3, .06], [.4, .2, .2]); }
    for (const f of [r.foreL, r.foreR]) P(f, U.cyl, Up ? steel : leather, [0, -.15, 0], [.09, .14, .09]);
    // calvo, cejas pobladas y bigotazo
    const hb = hairM(0x7a4a2a);
    P(r.head, U.sph, hb, [0, .15 * hs, -.13 * hs], [.24 * hs, .17 * hs, .14 * hs]);
    P(r.head, merged('braumBrows', () => mir(sx => X(U.sph, [sx * .1, .29, .2], [0, 0, sx * -.25], [.08, .035, .04]))), hb);
    P(r.head, merged('braumStache', () => mir(sx => norm2(tube('braumMust' + sx, [[sx * .02, .14, .25], [sx * .1, .13, .25], [sx * .2, .1, .2], [sx * .27, .14, .14], [sx * .3, .22, .1]], spindle(.06, .02), 16, 7)))), hb);
    P(r.head, U.sph, skin, [0, .17 * hs, .25 * hs], [.06, .055, .05]); // nariz
    P(r.head, merged('braumCheek', () => mir(sx => X(U.sph, [sx * .13, .15, .2], [0, 0, 0], [.05, .04, .03]))), M(0xf09a8a, { r: .7 }));
    // escudo-puerta de la cámara
    const shp = grp(r.handL, 0, -.04, 0); shp.rotation.x = 1.5; const sh = grp(shp, -.06, .05, .14); sh.rotation.y = -.2;
    const doorM = Up ? M(0x8a2a1a, { m: .55, r: .35 }) : M(0x4a5866, { m: .6, r: .45 }), rim = Up ? goldA : M(0x8a98a6, { m: .75, r: .3 });
    P(sh, U.rbox, doorM, [0, .05, .06], [.95, 1.15, .1]);
    P(sh, merged('braumRim', () => [X(U.box, [0, .62, .06], [0, 0, 0], [.98, .07, .13]), X(U.box, [0, -.52, .06], [0, 0, 0], [.98, .07, .13]), ...mir(sx => X(U.box, [sx * .47, .05, .06], [0, 0, 0], [.07, 1.15, .13])), ...[-1, 1].flatMap(sx => [-1, 1].map(sy => X(U.sph, [sx * .4, .05 + sy * .5, .13], [0, 0, 0], .035)))]), rim);
    if (Up) { // cabeza de dragón en el escudo
      P(sh, merged('braumDragon', () => [X(U.sph, [0, .1, .16], [0, 0, 0], [.22, .26, .08]), X(U.cone, [0, -.18, .17], [PI, 0, 0], [.12, .22, .05]), ...mir(sx => X(U.cone, [sx * .2, .4, .14], [0, 0, -sx * .6], [.05, .3, .04]))]), goldA);
      P(sh, merged('braumDEyes', () => mir(sx => X(U.sph, [sx * .08, .15, .24], [0, 0, sx * .3], [.04, .02, .02]))), glow(0xffa020, 3));
    } else {
      P(sh, merged('braumDial', () => { const o = [X(U.ring, [0, .05, .14], [0, 0, 0], [.22, .22, 1.4]), X(U.cyl, [0, .05, .14], [PI / 2, 0, 0], [.07, .06, .07])]; for (let i = 0; i < 4; i++) o.push(X(U.box, [0, .05, .14], [0, 0, i * PI / 4], [.44, .03, .03])); return o; }), rim);
      P(sh, merged('braumFrost', () => [X(U.box, [-.3, .35, .115], [0, 0, .6], [.25, .015, .01]), X(U.box, [.28, -.3, .115], [0, 0, -.5], [.3, .015, .01]), X(U.box, [.25, .38, .115], [0, 0, -.9], [.18, .015, .01])]), glow(0xbfefff, 1.6));
    }
    r.shield = sh;
    // poro en el hombro
    if (!Up) {
      const po = grp(r.torso, .34, .6, -.02);
      P(po, U.sph, M(0xf6f4f0, { r: .95 }), [0, 0, 0], [.13, .12, .13]);
      P(po, merged('poroHorn', () => mir(sx => X(U.cone, [sx * .08, .1, -.02], [-.4, 0, -sx * .5], [.025, .08, .025]))), M(0xe8d8b0, { r: .5 }));
      P(po, merged('poroEye', () => mir(sx => X(U.sph, [sx * .05, .03, .11], [0, 0, 0], [.022, .028, .015]))), EYE);
      P(po, U.sph, M(0xff7a9a, { r: .5 }), [0, -.05, .12], [.035, .025, .03]);
    }
    r.armL.rotation.set(-.55, .2, -.25); r.foreL.rotation.x = -.95;
    r.armR.rotation.set(-.1, 0, .35); r.foreR.rotation.x = -.5;
    r.holdL = true; r.heavy = true; r.style = 'swing'; r.theme = Up ? 0xffa040 : 0xbfe6ff;
    return h;
  },

  // ═════════════ TRYNDAMERE · El Rey Bárbaro (Up: Espada Demoníaca) ═════════════
  tryndamere(Up) {
    const skinC = Up ? 0xb89a8a : 0xd8a07a, skin = M(skinC, { r: .55 }), pants = M(Up ? 0x1a1418 : 0x3a2a24, { r: .75 }), leather = M(Up ? 0x15121a : 0x5a3a22, { r: .65 });
    const fur = M(Up ? 0x2a2228 : 0x8a8478, { r: .95 }), red = cloth(Up ? 0xb01010 : 0x8a1e1e, 1), armor = Up ? M(0x1a161c, { m: .7, r: .3 }) : metal(0x8a929e, .35);
    const h = humanoid({ bulk: 1.34, skin: skinC, topM: skin, sleeveM: skin, foreM: leather, handM: leather, thighM: pants, shinM: fur, bootM: leather, beltM: leather, hipM: pants, eyeM: Up ? glow(0xff2010, 2.5) : EYE });
    const r = h.rig, hs = r.hs;
    P(r.torso, merged('tryPecs', () => [...mir(sx => X(U.sph, [sx * .11, .33, .1], [0, 0, 0], [.13, .1, .085])), ...[0, 1].flatMap(i => mir(sx => X(U.sph, [sx * .055, .17 - i * .075, .12], [0, 0, 0], [.055, .035, .03])))]), skin);
    P(r.torso, merged('tryStrap', () => [X(U.box, [0, .27, .0], [0, 0, -.7], [.05, .62, .36]), X(U.cyl, [0, -.01, 0], [0, 0, 0], [.2, .08, .16])]), leather);
    // piel de lobo en el hombro izquierdo + hombrera derecha
    const pf = pauldron(r.armL, -1, fur, null, .3, .2, { tilt: .4 });
    P(pf, tufts('tryWolf', [[-.05, .15, .1, .09], [.05, .12, -.12, .09], [-.15, .08, 0, .08]]), fur);
    const pr = pauldron(r.armR, 1, armor, leather, .25, .16, { tilt: .4, layer: armor });
    if (Up) P(pr, merged('tryHorn', () => [X(U.cone, [.05, .2, 0], [0, 0, -.5], [.05, .26, .05]), X(U.cone, [-.06, .18, -.05], [0, 0, .2], [.04, .2, .04])]), M(0x2a2228, { r: .4 }));
    P(r.hips, merged('tryKilt', () => [X(U.box, [0, -.22, .15], [-.06, 0, 0], [.2, .38, .02]), X(U.box, [0, -.24, -.15], [.06, 0, 0], [.26, .42, .02])]), red);
    // melena larga
    const hb = hairM(Up ? 0xe8e4ea : 0x7a2a18); hairCap(r, hb, { tilt: -.5, w: 1.06, d: 1.06 }); bangs(r, hb, 4, { len: .14, spread: 1.2 }); brows(r, hb, .35);
    r.tails = [P(r.head, tube('tryMane', [[0, .36, -.15], [0, .22, -.32], [0, -.05, -.38], [0, -.38, -.36], [0, -.7, -.42]], taper(.24, .1, .12, 14), 20, 10), hb)];
    P(r.head, spikes('tryManeTips', [[.18, .28, -.18, -.4, -1.0, .09, .28], [-.18, .28, -.18, -.4, 1.0, .09, .28], [.16, .05, -.25, .3, -.9, .07, .25], [-.16, .05, -.25, .3, .9, .07, .25]]), hb);
    P(r.head, U.sph, M(Up ? 0x8a8090 : 0x5a2a18, { r: .9 }), [0, .08 * hs, .1 * hs], [.17 * hs, .085 * hs, .14 * hs]); // barba corta
    // espadón con filo mellado
    const sw = grp(r.handR, 0, -.03, 0);
    P(sw, U.cyl, leather, [0, 0, -.08], [.035, .4, .035], [PI / 2, 0, 0]);
    P(sw, U.sph, armor, [0, 0, -.3], .05);
    P(sw, merged('tryGuard', () => [X(U.rbox, [0, 0, .13], [0, 0, 0], [.42, .08, .1]), ...mir(sx => X(U.cone, [sx * .24, 0, .17], [PI / 2, 0, sx * .5], [.04, .12, .04]))]), armor);
    P(sw, ext('tryBlade', s => { s.moveTo(-.13, 0); s.lineTo(-.15, .5); s.lineTo(-.11, .58); s.lineTo(-.15, .66); s.lineTo(-.14, 1.25); s.lineTo(0, 1.55); s.lineTo(.12, 1.3); s.lineTo(.1, 1.0); s.lineTo(.14, .92); s.lineTo(.13, .4); s.lineTo(.15, 0); s.lineTo(-.13, 0); }, .04, .015), Up ? M(0x2a1418, { m: .6, r: .3 }) : M(0xc8d0da, { m: .6, r: .25 }), [0, 0, .17], 1, [0, 0, PI / 2]);
    P(sw, U.box, Up ? glow(0xff2010, 2.5) : M(0x8a929e, { m: .7, r: .3 }), [0, 0, .85], [.05, .03, 1.05]);
    if (Up) { P(sw, merged('tryDemonEye', () => [X(U.sph, [0, .03, .3], [0, 0, 0], [.07, .03, .05])]), glow(0xff3010, 3)); P(sw, U.box, add(0xff3010, 2, .35), [0, 0, .85], [.02, .36, 1.4]); }
    r.weapon = sw; r.armR.rotation.set(-.1, 0, .38); r.foreR.rotation.x = -.5; sw.rotation.set(1.45, 0, -.15); sw.scale.setScalar(1.05);
    r.braids = mir(sx => { const bg = grp(r.head); P(bg, tube('tryLock' + sx, [[sx * .2, .3, .05], [sx * .27, .1, .02], [sx * .3, -.15, -.02], [sx * .3, -.4, -.04]], taper(.07, .03), 14, 6), hb); return bg; });
    r.style = 'swing'; r.holdR = true; r.theme = Up ? 0xff3010 : 0xff4a3a;
    return h;
  },

  // ═════════════ SEJUANI · La Furia del Norte, a lomos de Bristle (Up: Jinete de Poros) ═════════════
  sejuani(Up) {
    const g = new THREE.Group(), root = grp(g), body = grp(root); root.scale.setScalar(1.05);
    const armor = M(0x3a3e48, { m: .6, r: .4 }), red = cloth(0x8a1e22, 1), leather = M(0x3a2418, { r: .7 }), fur = M(0xd8cfc0, { r: .95 });
    // ——— montura ———
    const hide = Up ? M(0xf4f2ee, { r: .98 }) : M(0x4a3428, { r: .95 }), dark = Up ? M(0xe0dcd6, { r: .98 }) : M(0x2a1e18, { r: .95 }), tusk = Up ? M(0xe8d8b0, { r: .45 }) : M(0xeee2c6, { r: .4 });
    const torso = grp(body, 0, .95, 0);
    let head, jaw, tail; const legs = [];
    if (Up) { // poro gigante
      P(torso, U.sph, hide, [0, .05, 0], [.75, .7, .8]);
      P(torso, tufts('poroFluff', [[.5, .3, .3, .2], [-.5, .3, .3, .2], [.0, .55, -.3, .22], [.55, -.1, -.3, .2], [-.55, -.1, -.3, .2], [0, -.1, -.75, .2]]), hide);
      head = grp(torso, 0, .05, .62);
      P(head, merged('bigPoroEye', () => mir(sx => X(U.sph, [sx * .2, .15, .14], [0, 0, 0], [.13, .16, .08]))), M(0x0e0a14, { r: .15 }));
      P(head, merged('bigPoroHi', () => mir(sx => X(U.sph, [sx * .17, .2, .21], [0, 0, 0], .035))), M(0xffffff, { e: .8, ec: 0xffffff }));
      P(head, merged('bigPoroHorn', () => mir(sx => X(U.cone, [sx * .32, .45, -.15], [-.5, 0, -sx * .6], [.07, .26, .07]))), tusk);
      jaw = grp(head, 0, -.12, .12); P(jaw, U.sph, M(0x6a1a2a, { r: .6 }), [0, 0, 0], [.18, .1, .08]);
      P(jaw, U.sph, M(0xff7a9a, { r: .5 }), [0, -.12, .06], [.09, .16, .05], [.4, 0, 0]);
      for (const [x, z] of [[-.38, .35], [.38, .35], [-.38, -.35], [.38, -.35]]) { const l = grp(torso, x, -.45, z); P(l, U.sph, hide, [0, -.25, 0], [.16, .22, .16]); P(l, U.sph, M(0xc8b8a0, { r: .8 }), [0, -.45, .05], [.12, .06, .14]); legs.push(l); }
      tail = grp(torso, 0, .1, -.78); P(tail, U.sph, hide, [0, 0, 0], .14);
    } else { // Bristle, el jabalí de guerra
      P(torso, U.sph, hide, [0, .0, 0], [.55, .52, .95]);
      P(torso, U.sph, hide, [0, .08, .45], [.6, .55, .5]);
      P(torso, spikes('brisMane', [[0, .58, .55, -.6, 0, .09, .35], [0, .6, .3, -.9, 0, .1, .38], [0, .55, .05, -1.2, 0, .09, .34], [0, .48, -.25, -1.5, 0, .08, .3], [.15, .5, .4, -.7, -.4, .07, .28], [-.15, .5, .4, -.7, .4, .07, .28]]), dark);
      P(torso, U.cyl, armor, [0, .1, .6], [.62, .25, .45], [PI / 2, 0, 0]); // peto de la montura
      P(torso, U.sph, red, [0, .42, -.05], [.45, .12, .45]); // manta de silla
      P(torso, merged('brisPlates', () => mir(sx => X(U.sph, [sx * .5, .05, .15], [0, 0, sx * .2], [.1, .38, .5]))), armor);
      head = grp(torso, 0, .0, .95);
      P(head, U.sph, hide, [0, .0, .05], [.36, .34, .38]);
      P(head, U.cyl, dark, [0, -.08, .42], [.15, .12, .15], [PI / 2, 0, 0]);
      P(head, merged('brisEyes', () => mir(sx => X(U.sph, [sx * .2, .1, .3], [0, 0, 0], .045))), glow(0xff5a2a, 2));
      P(head, merged('brisEars', () => mir(sx => X(U.cone, [sx * .26, .3, -.05], [-.5, 0, -sx * .7], [.08, .2, .04]))), dark);
      P(head, merged('brisHelm', () => [X(U.sph, [0, .2, .12], [0, 0, 0], [.3, .14, .3]), X(U.cone, [0, .32, .2], [-.4, 0, 0], [.05, .2, .05])]), armor);
      jaw = grp(head, 0, -.22, .2); P(jaw, U.sph, dark, [0, 0, .1], [.22, .08, .24]);
      P(head, merged('brisTusks', () => mir(sx => norm2(tube('brisTusk' + sx, [[sx * .14, -.15, .35], [sx * .25, -.12, .5], [sx * .3, .05, .58], [sx * .26, .22, .55]], taper(.05, .008), 12, 6)))), tusk);
      for (const [x, z, f] of [[-.3, .55, 1], [.3, .55, 1], [-.3, -.55, 0], [.3, -.55, 0]]) legs.push(qLeg(torso, x, -.2, z, hide, M(0x1a1410, { r: .6 }), { r1: f ? .17 : .19, r2: .11, r3: .08, l1: .32, l2: .3 }));
      tail = grp(torso, 0, .15, -.92); P(tail, tube('brisTail', [[0, 0, 0], [0, -.1, -.15], [0, -.3, -.2]], taper(.05, .02), 8, 5), dark);
    }
    // ——— Sejuani (jinete) ———
    const rider = grp(torso, 0, Up ? .62 : .52, -.05); rider.scale.setScalar(.82);
    const h = humanoid({ bulk: 1.08, skin: 0xf0cdb4, topM: armor, sleeveM: cloth(Up ? 0x3a6aa8 : 0x5a1a1e), foreM: armor, handM: leather, thighM: cloth(0x2a2a30), shinM: armor, bootM: leather, beltM: leather, hipM: cloth(0x2a2a30), eyeM: M(0x2a4a7a, { r: .3 }) });
    const rr = h.rig; rider.add(h.g); h.g.position.y = -.82;
    rr.legL.rotation.set(-1.2, 0, -.55); rr.legR.rotation.set(-1.2, 0, .55); rr.kneeL.rotation.x = 1.3; rr.kneeR.rotation.x = 1.3;
    P(rr.torso, U.sph, fur, [0, .45, -.02], [.34, .1, .24]);
    for (const [a, sx] of [[rr.armL, -1], [rr.armR, 1]]) pauldron(a, sx, armor, Up ? fur : red, .28, .18, { tilt: .4, layer: fur });
    P(rr.torso, U.ring, red, [0, .0, 0], [.2, .155, 1.2], [PI / 2, 0, 0]);
    cape(rr, Up ? cloth(0x3a6aa8, 1) : red, { rT: .3, rM: .35, rB: .44, l1: .4, l2: .5, arc: 2.4, trim: fur });
    const hb = hairM(0xf2ecdc); hairCap(rr, hb, { tilt: -.45 }); bangs(rr, hb, 4, { len: .12 });
    rr.tails = [P(rr.head, tube('sejBraid', [[0, .25, -.2], [0, .05, -.32], [0, -.2, -.35], [0, -.45, -.4]], taper(.08, .04, .3, 24), 16, 6), hb)];
    P(rr.head, merged('sejHelm', () => [X(U.ring, [0, .37, -.03], [PI / 2 - .45, 0, 0], [.27, .26, .9]), X(U.box, [0, .36, .23], [-.4, 0, 0], [.05, .08, .03])]), armor);
    P(rr.head, merged('sejHorns', () => mir(sx => norm2(tube('sejHorn' + sx, [[sx * .2, .36, .02], [sx * .36, .48, -.05], [sx * .42, .7, -.18], [sx * .34, .9, -.34]], taper(.075, .01), 16, 7)))), M(0xe6dcc6, { r: .45 }));
    if (Up) P(rr.head, merged('sejPoroHat', () => [X(U.sph, [0, .44, -.04], [0, 0, 0], [.2, .1, .2])]), fur);
    // mangual de Hielo Verdadero
    const fl = grp(rr.handR, 0, -.03, 0);
    P(fl, U.cyl, leather, [0, 0, .1], [.035, .5, .035], [PI / 2, 0, 0]);
    P(fl, merged('sejChain', () => { const o = []; for (let i = 0; i < 6; i++) o.push(X(U.ring, [0, -.06 - i * .07, .36], [0, i % 2 ? PI / 2 : 0, 0], [.035, .035, .6])); return o; }), metal(0x9aa2ac, .35));
    const ball = grp(fl, 0, -.5, .36);
    P(ball, U.ico, iceM(0xa8ecff, 1.2), [0, 0, 0], .19);
    P(ball, spikes('sejBallSpk', [[0, .2, 0, 0, 0, .05, .16], [0, -.2, 0, PI, 0, .05, .16], [.2, 0, 0, 0, -PI / 2, .05, .16], [-.2, 0, 0, 0, PI / 2, .05, .16], [0, 0, .2, PI / 2, 0, .05, .16], [0, 0, -.2, -PI / 2, 0, .05, .16]], U.pyr), iceM(0xdff8ff, 1.4));
    P(ball, U.sph, add(0x8fe0ff, 1.2, .18), [0, 0, 0], .24);
    rr.armR.rotation.set(-.35, 0, .75); rr.foreR.rotation.x = -.5; rr.armL.rotation.set(-.6, 0, -.3); rr.foreL.rotation.x = -.6;
    const rig = { type: 'quad', root, body, torso, head, jaw, tail, legs, theme: Up ? 0xcff4ff : 0x9fe4ff, rider: rr, flail: fl, ball, armR: rr.armR, foreR: rr.foreR, rTorso: rr.torso, rCape: rr.cape };
    const res = { g, rig, s: 1 };
    rig.anim = (m, r, st, t) => {
      const a = st.atk >= 0 ? Math.min(1, st.atk) : -1;
      r.armR.rotation.x = a >= 0 ? kf(a, B0(r.armR, 0), [[0, null], [.3, -2.8], [.55, -.2], [1, null]]) : B0(r.armR, 0) + Math.sin(t * 2) * .05;
      r.flail.rotation.y = a >= 0 ? kf(a, 0, [[0, 0], [.3, -1.2], [.55, .5], [1, 0]]) : 0;
      r.ball.rotation.y = t * 2;
      S(r.rTorso, .1 + (a >= 0 ? kf(a, 0, [[0, 0], [.3, -.2], [.55, .3], [1, 0]]) : 0), a >= 0 ? kf(a, 0, [[0, 0], [.3, .4], [.55, -.4], [1, 0]]) : 0, 0);
      if (r.rCape) { S(r.rCape[0], .25 + Math.sin(t * 2.6) * .05); S(r.rCape[1], .1 + Math.sin(t * 3.3 + 1) * .07); }
    };
    // capturar las poses base del jinete (no forman parte del rig de cuadrúpedo)
    for (const j of [rr.armR, rr.foreR, rr.torso, ...(rr.cape || [])]) j.userData.b = [j.rotation.x, j.rotation.y, j.rotation.z];
    if (Up) prestigeOn(res, rr.head, 1);
    return res;
  },

  // ═════════════ LISSANDRA · La Bruja de Hielo (Up: Porcelana) ═════════════
  lissandra(Up) {
    const skinC = Up ? 0xf4f6fa : 0xbcd2ea, robe = M(Up ? 0xf2f2f6 : 0x1e1a46, { r: .6, ds: 1 }), robe2 = M(Up ? 0x2a4a9a : 0x2c2a6a, { r: .7, ds: 1 });
    const ice = Up ? M(0xffe6a0, { m: .9, r: .2, e: .6, ec: 0xffb020 }) : iceM(0xa8e4ff, 1.0, 0x4aa8ff), iceG = glow(Up ? 0x6aa8ff : 0x9fe8ff, 2), plate = Up ? M(0xffffff, { r: .25 }) : M(0x8fb8e0, { m: .4, r: .25 });
    const h = humanoid({ bulk: .9, head: 1.0, leg: 1.18, skin: skinC, topM: robe2, sleeveM: robe, foreM: M(skinC, { r: .5 }), handM: M(skinC, { r: .5 }), thighM: robe, shinM: robe, bootM: robe, beltM: plate, noEyes: true, style: 'cast' });
    const r = h.rig, hs = r.hs; r.castSide = 'R';
    skirt(r, robe, 'lisSk', [[.52, -.94], [.42, -.62], [.3, -.25], [.2, .06]]);
    P(r.hips, merged('lisHem', () => { const o = []; for (let i = 0; i < 12; i++) { const an = i / 12 * TAU; o.push(X(U.cone, [Math.sin(an) * .5, -.9, Math.cos(an) * .5], [PI + Math.cos(an) * .3, 0, -Math.sin(an) * .3], [.06, .18 + (i % 3) * .06, .04])); } return o; }), robe);
    P(r.hips, merged('lisPanel', () => [X(U.box, [0, -.45, .26], [-.2, 0, 0], [.18, .85, .02])]), robe2);
    P(r.torso, merged('lisChest', () => [X(U.sph, [0, .3, .06], [0, 0, 0], [.21, .17, .11]), X(U.oct, [0, .32, .17], [0, 0, 0], [.05, .1, .03]), X(U.ring, [0, .0, 0], [PI / 2, 0, 0], [.19, .14, 1])]), plate);
    // hombreras de cristal de hielo
    for (const [a, sx] of [[r.armL, -1], [r.armR, 1]]) { const pg = pauldron(a, sx, plate, null, .22, .14, { tilt: .5 }); P(pg, spikes('lisShSpk', [[0, .15, 0, 0, 0, .05, .4], [.08, .1, -.06, -.3, -.5, .04, .3], [-.08, .1, .05, .3, .5, .04, .26]], U.pyr), ice); }
    // manos con garras de hielo
    for (const hd of [r.handL, r.handR]) P(hd, merged('lisClaw', () => [-1, 0, 1].map(i => X(U.cone, [i * .03, -.1, .03], [PI - .2, 0, i * .15], [.015, .14, .015]))), ice);
    // máscara (ciega), pelo y corona de tres púas
    P(r.head, merged('lisMask', () => [X(U.sph, [0, .22, .08], [0, 0, 0], [.235, .1, .2]), X(U.cone, [0, .16, .24], [-PI / 2 - .3, 0, 0], [.03, .08, .02])]), Up ? M(0x2a4a9a, { r: .3 }) : M(0x2a2a5a, { m: .6, r: .3 }));
    const hk = hairM(Up ? 0xeef2ff : 0x1a1a38);
    P(r.head, lathe('lisHair', [[.02, .46], [.2, .42], [.28, .28], [.28, .1], [.25, -.2], [.2, -.55], [.02, -.6]], 16), hk, [0, .1, -.08], [1, 1, .75]);
    P(r.head, merged('lisCrown', () => [X(U.ring, [0, .36, -.02], [PI / 2 - .25, 0, 0], [.26, .25, .6]), X(U.pyr, [0, .72, -.02], [0, PI / 4, 0], [.07, .7, .05]), ...mir(sx => X(U.pyr, [sx * .2, .62, -.05], [0, PI / 4, -sx * .35], [.055, .5, .04])), ...mir(sx => X(U.pyr, [sx * .3, .44, -.06], [0, PI / 4, -sx * .9], [.04, .3, .03]))]), ice);
    P(r.head, U.oct, iceG, [0, .42, .18], [.04, .07, .02]);
    // fragmentos de hielo orbitando
    const sh = grp(r.root, 0, 1.0, 0);
    P(sh, merged('lisShards', () => { const o = []; for (let i = 0; i < 5; i++) { const an = i / 5 * TAU; o.push(X(U.oct, [Math.cos(an) * .75, Math.sin(i * 2.1) * .3, Math.sin(an) * .75], [i, 0, i * .7], [.05, .14, .05])); } return o; }), iceG);
    const ho = grp(r.handR, 0, -.16, .08); r.pulse = [P(ho, U.oct, iceG, [0, 0, 0], [.07, .12, .07])]; P(ho, U.sph, add(0x9fe8ff, 1.6, .3), [0, 0, 0], .16);
    if (Up) P(r.torso, merged('lisCracks', () => [X(U.box, [-.1, .3, .175], [0, 0, .6], [.15, .012, .01]), X(U.box, [.08, .2, .17], [0, 0, -.8], [.12, .012, .01]), X(U.box, [.12, .38, .16], [0, 0, .2], [.08, .012, .01])]), glow(0xffc040, 2));
    r.armR.rotation.set(-.5, 0, .3); r.foreR.rotation.x = -.8; r.armL.rotation.set(-.2, 0, -.4); r.foreL.rotation.x = -.6;
    r.shards = sh; r.theme = Up ? 0x8fd0ff : 0x6ab8ff;
    r.anim = (m, rr, st, t) => { rr.shards.rotation.y = t * .9; SP(rr.body, 0, .04 + Math.sin(t * 1.5) * .03, 0); };
    return h;
  },

  // ═════════════ ANIVIA · La Criofénix (Up: Escarcha Negra) ═════════════
  anivia(Up) {
    const g = new THREE.Group(), root = grp(g), body = grp(root, 0, 1.25, 0); body.scale.setScalar(1.3); root.scale.setScalar(.92);
    const iceC = Up ? 0x4a2a7a : 0x8fd4f4, ice = M(iceC, { m: .15, r: .2, fs: 1, e: Up ? .35 : .25, ec: Up ? 0x8a3aff : 0x3a9aff });
    const feat = M(Up ? 0x6a3aaa : 0xbfeaff, { m: .1, r: .15, fs: 1, e: Up ? .5 : .35, ec: Up ? 0xa050ff : 0x5ab8ff, t: .92 });
    const gl = glow(Up ? 0xc080ff : 0xdff6ff, 2.6), deep = M(Up ? 0x1a0e2a : 0x3a7ab0, { m: .2, r: .3, fs: 1 });
    const torso = grp(body);
    P(torso, U.ico, ice, [0, 0, 0], [.32, .36, .42]);
    P(torso, U.ico, M(Up ? 0x8a5aca : 0xe6f8ff, { r: .25, fs: 1, e: .3, ec: 0x8fd0ff }), [0, -.05, .16], [.24, .28, .26]);
    P(torso, spikes('aniBack', [[0, .3, -.1, -1.2, 0, .06, .3], [0, .25, -.3, -1.5, 0, .05, .26], [.12, .2, -.2, -1.3, -.3, .04, .2], [-.12, .2, -.2, -1.3, .3, .04, .2]], U.pyr), feat);
    // cuello y cabeza
    const neck = grp(torso, 0, .25, .25); neck.rotation.x = -.35;
    P(neck, U.cyl, ice, [0, .18, 0], [.11, .38, .11]);
    const head = grp(neck, 0, .42, .05); head.rotation.x = .35;
    P(head, U.ico, ice, [0, 0, .05], [.16, .15, .2]);
    P(head, U.cone, M(Up ? 0x2a1a3a : 0xe8f6ff, { r: .2 }), [0, -.03, .3], [.06, .22, .05], [PI / 2, 0, 0]);
    P(head, merged('aniEyes', () => mir(sx => X(U.oct, [sx * .1, .04, .15], [0, 0, sx * .3], [.04, .022, .02]))), gl);
    P(head, spikes('aniCrest', [[0, .12, -.05, -1.0, 0, .05, .45], [0, .08, -.12, -1.3, 0, .04, .4], [.08, .1, -.06, -1.0, -.4, .035, .32], [-.08, .1, -.06, -1.0, .4, .035, .32], [.12, .0, -.08, -1.4, -.8, .03, .25], [-.12, .0, -.08, -1.4, .8, .03, .25]], U.pyr), feat);
    // alas de cristal: abiertas hacia arriba, plumas como esquirlas de hielo
    const wings = [];
    for (const sx of [-1, 1]) {
      const sh = grp(torso, sx * .26, .18, -.08); sh.rotation.z = sx * .3; sh.scale.setScalar(.82); const el = grp(sh, sx * .78, 0, 0); el.rotation.z = sx * .4;
      P(sh, XAB(U.cyl, [0, 0, 0], [sx * .8, 0, 0], .07, .06), ice);
      P(el, XAB(U.cyl, [0, 0, 0], [sx * .85, 0, -.05], .055, .045), ice);
      const fth = (x, an, ln, w, z = -.05) => X(U.pyr, [x + sx * Math.sin(an) * ln / 2, -Math.cos(an) * ln / 2, z], [.12, 0, PI + sx * an], [w, ln, .03]);
      P(sh, merged('aniWingA' + sx, () => [0, 1, 2, 3, 4, 5].map(i => fth(sx * (.1 + i * .13), .05 + i * .07, .5 + i * .07, .075))), feat);
      P(el, merged('aniWingB' + sx, () => [0, 1, 2, 3, 4, 5, 6].map(i => fth(sx * (.04 + i * .13), .45 + i * .33, .72 + i * .09 - (i > 4 ? (i - 4) * .12 : 0), .085))), feat);
      P(sh, merged('aniWingUp' + sx, () => [0, 1, 2, 3].map(i => fth(sx * (.12 + i * .17), 2.75 - i * .12, .26 + i * .04, .05, .02))), M(Up ? 0x8a5aca : 0xe6f8ff, { r: .2, fs: 1, e: .3, ec: 0x8fd0ff }));
      P(el, merged('aniWingG' + sx, () => [0, 1, 2].map(i => X(U.oct, [sx * (.2 + i * .25), 0, .02], [0, 0, 0], [.035, .06, .035]))), gl);
      wings.push({ sh, el });
    }
    // cola de plumas largas
    const tail = grp(torso, 0, -.12, -.38);
    P(tail, merged('aniTail', () => [-2, -1, 0, 1, 2].map(i => X(U.pyr, [i * .07, -.35 - Math.abs(i) * .05, -.25], [-1.0 + Math.abs(i) * .08, PI / 4, i * .18], [.06, .85 - Math.abs(i) * .12, .02]))), feat);
    P(tail, tube('aniTailCurl', [[0, 0, 0], [0, -.3, -.4], [0, -.7, -.55], [0, -.95, -.35], [0, -.85, -.15]], taper(.04, .01), 16, 5), gl);
    // garras
    const legs = mir(sx => { const l = grp(torso, sx * .12, -.32, .05); P(l, XAB(U.cyl, [0, 0, 0], [0, -.25, .05], .03), deep); P(l, merged('aniTalon', () => [-1, 0, 1].map(i => X(U.cone, [i * .04, -.28, .1], [PI / 2 + .6, 0, i * .3], [.015, .1, .015]))), gl); return l; });
    // aura de escarcha en el suelo
    P(root, U.disc, M(Up ? 0x8a3aff : 0x8fd0ff, { e: 1, ec: Up ? 0x8a3aff : 0x8fd0ff, t: .25, add: 1, ds: 1 }), [0, .02, 0], .7, [-PI / 2, 0, 0]);
    const rig = { type: 'anivia', root, body, torso, neck, head, wings, tail, legs, theme: Up ? 0xa86bff : 0x9fe4ff, hs: 1.1, pulse: [] };
    rig.anim = (m, r, st, t, dt, w) => {
      const a = st.atk >= 0 ? Math.min(1, st.atk) : -1, f = t * 3.2 + m.phase, hurt = st.hurt || 0;
      SP(r.body, 0, Math.sin(f + PI / 2) * .08 + Math.sin(t * 1.1) * .04, a >= 0 ? kf(a, 0, [[0, 0], [.35, -.12], [.55, .2], [1, 0]]) : 0);
      S(r.body, .1 * w + (a >= 0 ? kf(a, 0, [[0, 0], [.35, -.15], [.55, .15], [1, 0]]) : 0) - hurt * .2);
      const flap = a >= 0 ? kf(a, 0, [[0, 0], [.35, .9], [.55, -.6], [1, 0]]) : Math.sin(f) * .35;
      r.wings.forEach(({ sh, el }, i) => { const sx = i ? 1 : -1; S(sh, 0, sx * (a >= 0 ? kf(a, 0, [[0, 0], [.35, .3], [.55, -.5], [1, 0]]) : 0), sx * flap); S(el, 0, 0, sx * Math.sin(f - .9) * .3); });
      S(r.neck, a >= 0 ? kf(a, 0, [[0, 0], [.35, -.25], [.55, .35], [1, 0]]) : Math.sin(t * 1.4) * .05);
      S(r.head, a >= 0 ? kf(a, 0, [[0, 0], [.35, -.2], [.55, .3], [1, 0]]) : Math.sin(t * 1.9) * .06, Math.sin(t * .7) * .2, 0);
      S(r.tail, Math.sin(t * 2) * .1, Math.sin(t * 1.5) * .15, 0);
    };
    return { g, rig, s: 1 };
  },

  // ═════════════ VOLIBEAR · La Tormenta Implacable (Up: Señor del Trueno) ═════════════
  volibear(Up) {
    const furC = Up ? 0x4a4c56 : 0xe4e8ee, fur = M(furC, { r: .95 }), fur2 = M(Up ? 0x2a2c34 : 0xb8c0cc, { r: .95 }), dark = M(Up ? 0x15161c : 0x3a3e48, { r: .6 });
    const bolt = glow(Up ? 0xffe680 : 0x9fd8ff, 2.8), boltA = add(Up ? 0xffe680 : 0x9fd8ff, 2, .45), goldA = M(0xe0b050, { m: .9, r: .26, e: .3, ec: 0xffa020 }), claw = M(0xf2ecdc, { r: .35 });
    const h = humanoid({ bulk: 1.95, head: 1.3, leg: .82, skin: furC, topM: fur, sleeveM: fur, foreM: fur, handM: dark, thighM: fur, shinM: fur2, bootM: dark, beltM: fur2, hipM: fur, faceM: fur, noEyes: true, style: 'slam', noBelt: true });
    const r = h.rig, hs = r.hs; r.root.scale.setScalar(1.32);
    r.torso.rotation.x = .36; r.head.rotation.x = -.32;
    P(r.torso, U.sph, fur2, [0, .58, -.12], [.5, .24, .34]); // joroba de pelaje oscuro
    P(r.torso, U.sph, fur, [0, .32, .02], [.55, .38, .36]); // lomo enorme
    P(r.torso, tufts('voliChest', [[0, .55, .2, .16], [-.3, .5, .15, .15], [.3, .5, .15, .15], [0, .3, .3, .14], [-.4, .2, .1, .14], [.4, .2, .1, .14], [0, .7, -.1, .2, .8]]), fur);
    P(r.torso, U.sph, fur2, [0, .15, .2], [.3, .25, .17]);
    // relámpagos por la espalda
    P(r.torso, merged('voliBolts', () => { const o = []; for (const sx of [-1, 0, 1]) { let x = sx * .25, y = .75, z = -.25; for (let i = 0; i < 4; i++) { const nx = x + (i % 2 ? .08 : -.08) * (sx || 1), ny = y - .17; o.push(XAB(U.box, [x, y, z], [nx, ny, z - .03], .035, .02)); x = nx; y = ny; } } return o; }), bolt);
    P(r.torso, spikes('voliSpine', [[0, .7, -.3, -1.0, 0, .08, .35], [0, .5, -.4, -1.3, 0, .08, .32], [0, .25, -.42, -1.6, 0, .07, .28]], U.pyr), Up ? goldA : fur2);
    // cadenas con trofeos
    P(r.torso, merged('voliChain', () => { const o = []; for (let i = 0; i < 9; i++) { const u = i / 8, x = -.45 + u * .9, y = .62 - Math.sin(u * PI) * .35; o.push(X(U.ring, [x, y, .3 + Math.sin(u * PI) * .08], [0, i % 2 ? PI / 2 : 0, .4], [.05, .05, .8])); } return o; }), M(0x8a8a90, { m: .7, r: .4 }));
    P(r.torso, merged('voliTrophy', () => [X(U.sph, [0, .28, .42], [0, 0, 0], [.09, .08, .07]), X(U.box, [-.2, .38, .4], [0, 0, .3], [.1, .14, .03]), X(U.box, [.22, .36, .4], [0, 0, -.3], [.1, .12, .03])]), Up ? goldA : M(0xd8ccb0, { r: .5 }));
    // cabeza de oso
    P(r.head, tufts('voliCheek', [[.24, .14, .05, .1, 1.2], [-.24, .14, .05, .1, 1.2], [0, .44, -.05, .12, .7]]), fur, [0, 0, 0], hs);
    P(r.head, U.sph, fur2, [0, .1 * hs, .24 * hs], [.15 * hs, .12 * hs, .17 * hs]);
    P(r.head, U.sph, dark, [0, .15 * hs, .39 * hs], [.065 * hs, .05 * hs, .045 * hs]);
    P(r.head, U.box, fur2, [0, .3 * hs, .2 * hs], [.32 * hs, .06 * hs, .08 * hs], [.3, 0, 0]);
    P(r.head, merged('voliEars', () => mir(sx => X(U.sph, [sx * .25, .38, -.05], [0, 0, 0], [.09, .09, .05]))), fur, [0, 0, 0], hs);
    P(r.head, merged('voliFangs', () => mir(sx => X(U.cone, [sx * .07, -.06, .3], [PI, 0, 0], [.025, .08, .025]))), claw, [0, 0, 0], hs);
    P(r.head, U.sph, M(0x2a0e14, { r: .6 }), [0, .02 * hs, .3 * hs], [.1 * hs, .04 * hs, .07 * hs]);
    // muchos ojos de tormenta
    P(r.head, merged('voliEyes', () => [...mir(sx => X(U.oct, [sx * .12, .22, .26], [0, 0, sx * .4], [.045, .025, .02])), ...mir(sx => X(U.oct, [sx * .2, .3, .2], [0, 0, sx * .5], [.035, .02, .02])), ...mir(sx => X(U.oct, [sx * .07, .33, .26], [0, 0, sx * .3], [.03, .018, .02]))]), bolt, [0, 0, 0], hs);
    P(r.head, merged('voliScar', () => [X(U.box, [.13, .25, .265], [0, 0, .9], [.2, .015, .01]), X(U.box, [.15, .23, .27], [0, 0, .7], [.16, .012, .01])]), bolt, [0, 0, 0], hs);
    if (Up) P(r.head, merged('voliCrown', () => [X(U.ring, [0, .38, -.02], [PI / 2 - .3, 0, 0], [.27, .25, .7]), ...[-1, 0, 1].map(i => X(U.pyr, [i * .13, .5 + (i ? 0 : .05), .1 - Math.abs(i) * .05], [-.3, 0, -i * .4], [.04, .18, .02]))]), goldA, [0, 0, 0], hs);
    // zarpas
    for (const hd of [r.handL, r.handR]) { hd.scale.setScalar(1.5); P(hd, merged('voliClaw', () => [-1, 0, 1].map(i => X(U.cone, [i * .035, -.1, .06], [PI - .5, 0, i * .2], [.018, .12, .018]))), claw); }
    for (const a of [r.armL, r.armR]) P(a, tufts('voliArmFur', [[0, -.02, 0, .12], [.04, -.15, -.04, .1]]), fur);
    if (Up) for (const [a, sx] of [[r.armL, -1], [r.armR, 1]]) pauldron(a, sx, goldA, dark, .2, .14, { tilt: .4 });
    // corona de rayos (aura)
    const st = grp(r.root, 0, 1.6, -.2);
    P(st, merged('voliArc', () => { const o = []; for (let k = 0; k < 3; k++) { const an0 = k / 3 * TAU; let px = Math.cos(an0) * .7, pz = Math.sin(an0) * .7, py = .3; for (let i = 0; i < 4; i++) { const an = an0 + (i + 1) * .35, nx = Math.cos(an) * (.7 + (i % 2 ? .1 : -.1)), nz = Math.sin(an) * (.7 + (i % 2 ? .1 : -.1)), ny = .3 - (i + 1) * .15 + (i % 2 ? .1 : 0); o.push(XAB(U.box, [px, py, pz], [nx, ny, nz], .02, .02)); px = nx; py = ny; pz = nz; } } return o; }), boltA);
    r.storm = st;
    r.armL.rotation.set(-.4, 0, -.35); r.foreL.rotation.x = -.5; r.armR.rotation.set(-.4, 0, .35); r.foreR.rotation.x = -.5;
    r.heavy = true; r.theme = Up ? 0xffe680 : 0x9fd8ff;
    r.anim = (m, rr, st2, t) => { rr.storm.rotation.y = t * 2.2; rr.storm.visible = Math.sin(t * 9) > -.6; };
    return h;
  },
};

// ═════════════ MEGA GNAR (mejora de Gnar) ═════════════
function megaGnar() {
  const furC = 0xb8642a, fur = M(furC, { r: .92 }), fur2 = M(0x8a4a20, { r: .95 }), belly = M(0xe0b88a, { r: .9 }), bone = M(0xeee2c6, { r: .5 }), rock = M(0x7a6a5a, { r: .9, fs: 1 });
  const h = humanoid({ bulk: 2.0, head: 1.0, leg: .7, skin: furC, topM: fur, sleeveM: fur, foreM: fur, handM: fur2, thighM: fur, shinM: fur2, bootM: fur2, beltM: fur2, hipM: fur, noEyes: true, style: 'slam', noBelt: true });
  const r = h.rig, hs = r.hs; r.root.scale.setScalar(1.22);
  r.torso.rotation.x = .38; r.head.rotation.x = -.35;
  P(r.torso, U.sph, fur, [0, .35, -.02], [.6, .42, .4]);
  P(r.torso, U.sph, belly, [0, .2, .2], [.36, .3, .2]);
  // placas de hueso en hombros y espalda
  P(r.torso, spikes('mgSpine', [[0, .78, -.22, -.8, 0, .1, .4], [-.25, .7, -.25, -.9, .4, .09, .36], [.25, .7, -.25, -.9, -.4, .09, .36], [0, .52, -.42, -1.3, 0, .09, .36], [-.3, .4, -.38, -1.3, .5, .08, .3], [.3, .4, -.38, -1.3, -.5, .08, .3]], U.cone), bone);
  for (const [a, sx] of [[r.armL, -1], [r.armR, 1]]) { a.scale.setScalar(1.35); const pg = pauldron(a, sx, bone, null, .3, .2, { tilt: .35 }); P(pg, spikes('mgShSpk', [[0, .18, 0, -.2, 0, .06, .26], [.12, .12, -.05, -.3, -.6, .05, .2]]), bone); }
  for (const hd of [r.handL, r.handR]) { hd.scale.setScalar(1.6); P(hd, merged('mgKnuck', () => [-1, 0, 1].map(i => X(U.sph, [i * .04, -.07, .05], [0, 0, 0], .035))), rock); }
  // cabeza bruta con casco de cráneo
  P(r.head, U.sph, fur, [0, .15, .02], [.27, .24, .26]);
  P(r.head, U.sph, belly, [0, .05, .18], [.18, .12, .12]);
  P(r.head, merged('mgFangs', () => [...mir(sx => X(U.cone, [sx * .1, .06, .27], [-.2, 0, 0], [.03, .1, .03])), ...[-1, 0, 1].map(i => X(U.cone, [i * .05, .1, .28], [PI, 0, 0], [.018, .04, .015]))]), M(0xffffff, { r: .35 }));
  P(r.head, merged('mgEyes', () => mir(sx => X(U.sph, [sx * .1, .22, .23], [0, 0, sx * -.3], [.04, .022, .02]))), glow(0xffd040, 2.4));
  P(r.head, lathe('mgSkull', [[.0, .44], [.16, .42], [.27, .34], [.3, .24], [.29, .18]]), bone, [0, 0, -.02], 1);
  P(r.head, merged('mgHorns', () => mir(sx => norm2(tube('mgHorn' + sx, [[sx * .2, .36, 0], [sx * .38, .45, -.05], [sx * .48, .62, -.12], [sx * .46, .78, -.22]], taper(.08, .01), 14, 7)))), bone);
  P(r.head, merged('mgBrowBone', () => [X(U.box, [0, .3, .22], [.2, 0, 0], [.34, .05, .06])]), bone);
  // roca para lanzar en la mano derecha
  P(r.handR, U.dod, rock, [0, -.12, .08], .14);
  r.armL.rotation.set(-.5, 0, -.4); r.foreL.rotation.x = -.4; r.armR.rotation.set(-.6, 0, .4); r.foreR.rotation.x = -.6;
  r.heavy = true; r.theme = 0xffb050;
  return h;
}
function norm2(g) { return X(g); }
