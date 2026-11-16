// Índice de contenido: legiones, campeones y utilidades.
import demacia from './legions/demacia.js';
import noxus from './legions/noxus.js';
import jonia from './legions/jonia.js';
import freljord from './legions/freljord.js';
import piltover from './legions/piltover.js';
import targon from './legions/targon.js';
export { DMG, ARM, MATRIX, dmgMul } from './types.js';
export { TIER_COST, ROLES } from './balance.js';

export const LEGIONS = [demacia, noxus, jonia, freljord, piltover, targon];
export const LEGION_BY = Object.fromEntries(LEGIONS.map(l => [l.id, l]));
// Ajuste fino de balance por legión (medido con tools/legions.mjs: torneo IA vs IA). hp/dmg = multiplicadores.
export const LEGION_TUNE = { noxus: { hp: .86, dmg: .9 }, jonia: { hp: 1.42, dmg: 1.24 }, freljord: { hp: .84, dmg: .93 }, demacia: { hp: 1.16, dmg: 1.1 }, piltover: { hp: 1.06, dmg: 1.04 } };
// Ajuste por campeón (tools/champstats.mjs: daño infligido/recibido por 100 de oro). ab/passive se fusionan sobre los originales.
export const CHAMP_TUNE = {
  volibear: { ab: { dmg: 200 }, passive: { pct: .25 } }, viktor: { ab: { dmg: 270 } }, jinx: { dmg: .92 },
  samira: { hp: 1.3, dmg: 1.35, range: 7, ab: { dmg: 24 } }, vayne: { hp: 1.25, dmg: 1.2 }, quinn: { hp: 1.3, dmg: 1.2 }, gnar: { hp: 1.3, dmg: 1.3 },
  ahri: { hp: 1.2, dmg: 1.2, ab: { len: 11 } }, jhin: { hp: 1.2, dmg: 1.1 }, cassiopeia: { dmg: 1.2, ab: { dps: 48 } }, heimerdinger: { hp: 1.2, dmg: 1.2 },
  zilean: { hp: 1.2, dmg: 1.25 }, annie: { dmg: 1.15 }, katarina: { hp: 1.15, dmg: 1.15 }, ezreal: { hp: 1.1 },
};
const tune = (c, l) => {
  const t = LEGION_TUNE[l] || {}, k = CHAMP_TUNE[c.id] || {};
  const o = { ...c, hp: Math.round(c.hp * (t.hp || 1) * (k.hp || 1)), dmg: Math.round(c.dmg * (t.dmg || 1) * (k.dmg || 1)) };
  if (k.range) o.range = k.range; if (k.ab && c.ability) o.ability = { ...c.ability, ...k.ab }; if (k.passive && c.passive) o.passive = { ...c.passive, ...k.passive };
  return o;
};
export const CHAMPIONS = LEGIONS.flatMap(l => l.champions.map(c => ({ ...tune(c, l.id), legion: l.id })));
export const CHAMP_BY = Object.fromEntries(CHAMPIONS.map(c => [c.id, c]));
export const rosterOf = legionId => CHAMPIONS.filter(c => c.legion === legionId).sort((a, b) => a.cost - b.cost);
