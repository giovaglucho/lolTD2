import { THREE, M, glow, gld, cloth, metal, hairM, EYE, TAU, PI, U, cg, limb, lathe, tube, taper, spindle, ext, norm, X, XAB, merged, capeGeo, grp, P, SEG, humanoid, hairCap, bangs, brows, pauldron, cape, skirt, bladeGeo, sword, staffUpright, f3 } from './kit.js';

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
  for (let i = 0; i < 4; i++) { const n = grp(par, 0, i === 0 ? .15 : .2, i === 0 ? .6 : 0); n.rotation.x = nrot[i]; P(n, U.sph, skin, [0, .1, 0], [.2 - i * .016, .17, .18 - i * .012]); P(n, U.cone, horn, [0, .16, -.16], [.035, .14, .035], [-1.3, 0, 0]); neck.push(n); par = n; }
  const head = grp(par, 0, .22, .02); head.rotation.x = .35;
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
  for (let i = 0; i < 6; i++) { const t = grp(par, 0, i === 0 ? -.02 : 0, i === 0 ? -.68 : -.25); t.rotation.x = trot[i]; const rr = .23 - i * .032; P(t, U.sph, skin, [0, 0, -.12], [rr, rr * .88, .2]); tail.push(t); par = t; }
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
    if (big) P(l, U.sph, skin, [0, -.12, 0], [.18, .28, .23]); else P(l, limb(.09, .07, .2), skin);
    const k = grp(l, 0, big ? -.32 : -.26, 0); k.rotation.x = big ? -.9 : -.5; P(k, limb(big ? .1 : .07, .06, big ? .26 : .18), skin);
    const ft = grp(k, 0, big ? -.32 : -.24, 0); ft.rotation.x = .5;
    P(ft, merged('drkClaw' + big, () => [-1, 0, 1].map(i => X(U.cone, [i * .05, -.02, .08], [PI / 2 + .3, i * .35, 0], [.022, big ? .16 : .12, .022]))), horn);
    l.userData.knee = k; legs.push(l);
  }
  // alas de dos segmentos con huesos y membrana
  const wings = [];
  for (const sx of [-1, 1]) {
    const wg = grp(torso, sx * .25, .3, .25); wg.scale.x = sx;
    const sh = grp(wg); sh.rotation.set(0, .3, .28);
    const L1 = .85;
    P(sh, XAB(U.tcyl, [0, 0, 0], [L1, .03, .02], .07, .07), skin);
    P(sh, wingInG(L1), memb);
    const el = grp(sh, L1, .03, .02); el.rotation.set(0, -.2, -.3); el.scale.setScalar(1.25);
    P(el, merged('wingBones', () => [XAB(U.tcyl, [0, 0, 0], [WTIPS[0][0], 0, WTIPS[0][1]], .04), ...WTIPS.slice(1).map(([x, z]) => XAB(U.tcyl, [0, 0, 0], [x, -Math.hypot(x, z) * .05, z], .025))]), skin);
    P(el, wingOutG(), memb);
    P(el, U.cone, horn, [0, .06, .02], [.03, .14, .03], [0, 0, 0]);
    wings.push({ sh, el });
  }
  if (o.elem === 'e') { P(torso, merged('elderGlow', () => [0, 1, 2, 3].map(i => X(U.box, [0, .3 - i * .02, .3 - i * .25], [-.2, 0, 0], [.04, .02, .18]))), glow(0xd9b3ff, 3)); }
  return { g, rig: { type: 'drake', root, body, torso, neck, head, jaw, tail, legs, wings, flyer: true }, s: 1 };
}

export { minion, superminion, cannonMinion, brute, krug, golemBuff, chogath, voidhunter, wolf, gromp, raptor, scuttle, grub, herald, baron, drake };
