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
export const CHAMPIONS = LEGIONS.flatMap(l => l.champions.map(c => ({ ...c, legion: l.id })));
export const CHAMP_BY = Object.fromEntries(CHAMPIONS.map(c => [c.id, c]));
export const rosterOf = legionId => CHAMPIONS.filter(c => c.legion === legionId).sort((a, b) => a.cost - b.cost);
