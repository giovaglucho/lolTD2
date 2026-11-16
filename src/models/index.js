import { THREE, prestige, animate, M, glow, gld, cloth, metal, hairM, EYE, TAU, PI, U, cg, limb, lathe, tube, taper, spindle, ext, norm, X, XAB, merged, capeGeo, grp, P, SEG, humanoid, hairCap, bangs, brows, pauldron, cape, skirt, bladeGeo, sword, staffUpright, f3 } from './kit.js';
import * as C from './creatures.js';
import { REGISTRY } from './champions/index.js';
export { animate, M };

// ═════════════════════════ API ═════════════════════════
export const hasModel = id => !!REGISTRY[id];
function capture(o) { if (o && o.isObject3D) { o.userData.b = [o.rotation.x, o.rotation.y, o.rotation.z]; o.userData.p = o.position.clone(); o.userData.s = o.scale.clone(); if (o.userData.knee) capture(o.userData.knee); if (o.userData.low) capture(o.userData.low); } }
function captureRig(r) { for (const k in r) { const v = r[k]; if (Array.isArray(v)) v.forEach(x => { if (x && x.isObject3D) capture(x); else if (x && typeof x === 'object') Object.values(x).forEach(capture); }); else if (v && v.isObject3D) capture(v); else if (v && typeof v === 'object' && k === 'tib') Object.values(v).forEach(capture); } }
export function buildModel(kind, tint = 'red', opts = {}) {
  let r;
  if (REGISTRY[kind]) { r = REGISTRY[kind](!!opts.upgraded, opts); if (opts.upgraded && !r.rig.upgraded) prestige(r); }
  else switch (kind) {
    case 'minion': r = C.minion(false, tint); break; case 'minion_c': r = C.minion(true, tint); break;
    case 'super': r = C.superminion(tint); break; case 'cannon': r = C.cannonMinion(tint); break;
    case 'gromp': r = C.gromp(); break; case 'wolf': r = C.wolf(); break; case 'raptor': r = C.raptor(); break; case 'krug': r = C.krug(); break;
    case 'buff_blue': r = C.golemBuff(true); break; case 'buff_red': r = C.golemBuff(false); break;
    case 'herald': r = C.herald(); break; case 'grub': r = C.grub(); break; case 'scuttle': r = C.scuttle(); break;
    case 'drake_c': r = C.drake({ elem: 'c', body: 0xa9cde6, belly: 0xf2f8ff, wing: 0x8fbfe2, horn: 0xf4f8ff, glow: 0xdff6ff, wingE: .15, dark: 0x6a8aa8 }); break;
    case 'drake_i': r = C.drake({ elem: 'i', body: 0x9b2a14, belly: 0xff7a2a, bellyGlow: true, wing: 0x6a1a0c, horn: 0x2a1a14, glow: 0xffb03a, wingE: .35, dark: 0x2a0e08 }); break;
    case 'drake_m': r = C.drake({ elem: 'm', rocky: true, body: 0x7a6648, belly: 0xc2a46e, wing: 0x5e4c36, horn: 0xe2d6b8, glow: 0xffd24a, dark: 0x3a2e20 }); break;
    case 'drake_o': r = C.drake({ elem: 'o', body: 0x2a78b8, belly: 0x9fe0e8, wing: 0x2a9fb0, horn: 0xdff6ff, glow: 0x7ff0ff, wingE: .2, dark: 0x123a5a }); break;
    case 'elder': r = C.drake({ elem: 'e', scale: 1.25, extraHorns: true, body: 0x2c2440, belly: 0x9a88c0, wing: 0x3a2a5e, horn: 0xeee6ff, hornE: .5, glow: 0xd9b3ff, wingE: .6, dark: 0x120c1e }); break;
    case 'baron': r = C.baron(); break; case 'chogath': r = C.chogath(); break; case 'voidhunter': r = C.voidhunter(); break;
    default: r = C.brute({ skin: M(0x888888, { fs: 1 }), dark: M(0x555555, { fs: 1 }) });
  }
  r.g.traverse(o => {
    if (!o.isMesh) return;
    const m = o.material, sc = Math.max(o.scale.x, o.scale.y, o.scale.z);
    o.castShadow = !m.transparent && (m.emissiveIntensity ?? 0) < 1.5 && sc > .045; o.receiveShadow = false;
  });
  captureRig(r.rig);
  r.kind = kind; return r;
}
