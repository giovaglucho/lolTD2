// Registro de modelos de campeones: cada legión exporta MODELS = { idModelo: (upgraded, opts) => ({ g, rig, s }) }.
import { CHAMPS as LEGACY } from './legacy.js';
import { MODELS as demacia } from './demacia.js';
import { MODELS as noxus } from './noxus.js';
import { MODELS as jonia } from './jonia.js';
import { MODELS as freljord } from './freljord.js';
import { MODELS as piltover } from './piltover.js';
import { MODELS as targon } from './targon.js';
export const REGISTRY = { ...LEGACY, ...demacia, ...noxus, ...jonia, ...freljord, ...piltover, ...targon };
