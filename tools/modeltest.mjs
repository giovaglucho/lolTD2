// Construye y anima todos los modelos (normal + mejorado) y reporta errores, mallas y altura.
import * as THREE from 'three';
import { buildModel, animate } from '../src/models/index.js';
import { CHAMPIONS } from '../src/content/index.js';
const bad = [];
for (const c of CHAMPIONS) for (const up of [false, true]) {
  try {
    const m = buildModel(c.model, 'blue', { upgraded: up }); m.phase = 0;
    for (const st of [{ moving: true, atk: -1, cast: 0, speed: 8 }, { moving: false, atk: .5, cast: 0 }, { moving: false, atk: -1, cast: 1 }]) animate(m, st, 1.3, .016);
    let n = 0; m.g.traverse(o => o.isMesh && n++); const b = new THREE.Box3().setFromObject(m.g);
    if (!up) console.log(c.legion.padEnd(9), c.id.padEnd(13), 'mallas', String(n).padStart(3), 'alto', b.max.y.toFixed(2));
    if (n > 90) bad.push(`${c.id}: ${n} mallas`);
  } catch (e) { bad.push(`${c.id}${up ? ' (mejorado)' : ''}: ${e.message}`); }
}
console.log(bad.length ? 'ERRORES:\n' + bad.join('\n') : 'OK');
