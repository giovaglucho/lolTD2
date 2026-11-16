// IA de Rift Legion con 4 dificultades. Funciona igual en el navegador y en el servidor.
import { GRID, MERCS, DIFFS } from './data.js';
import { FBY } from './sim.js';
import { SPELL_BY } from './content/spells.js';

const FRONT = new Set(['Tanque', 'Bruiser', 'Duelista', 'Luchador']);
const isFront = f => FRONT.has(f.role);
function freeSlots(sim, side, front, mid) {
  const rows = mid ? [1, 2, 0, 3] : front ? [0, 1, 2] : [3, 4, 5, 2, 1];
  const cs = [...Array(GRID.cols).keys()].sort((a, b) => Math.abs(a - 4.5) - Math.abs(b - 4.5));
  const out = []; for (const r of rows) for (const c of cs) if (sim.canPlace(side, c, r)) out.push([c, r]); return out;
}
const pick = a => a[Math.floor(Math.random() * a.length)];

// Se llama una vez al empezar cada fase de construcción.
export function aiTurn(sim, side, diffKey = 'normal') {
  const D = DIFFS[diffKey] || DIFFS.normal, p = sim.P(side), w = sim.wave;
  const FIGHTERS = p.roll.map(id => FBY[id]).filter(Boolean);
  if (p.piggy && w >= 8) sim.breakPiggy(side);
  if (D.bonus) p.gold += D.bonus * (1 + w * .08); // "trampas" de las dificultades altas
  const budget = () => p.gold * D.spend - (p.gold * (1 - D.spend));
  // 1) trabajadores (economía) en las primeras oleadas
  const wantW = Math.min(14, Math.floor((2 + w * .9) * D.workers));
  let guard = 6; while (p.workers < wantW && guard-- > 0 && sim.value(side) >= sim.recValue() * .8 && p.gold - sim.workerCost(side) > 60) sim.buyWorker(side);
  // 2) luchadores hasta alcanzar el valor recomendado (+margen)
  const target = sim.recValue() * (D.spend >= 1 ? 1.25 : .95 * D.spend + .2);
  guard = 40;
  while (guard-- > 0 && budget() > 55) {
    const army = p.grid.filter(Boolean), nFront = army.filter(e => isFront(e.def)).length;
    // mejorar unidades existentes
    if (D.upg && army.length >= 4 && Math.random() < D.upg) {
      const cand = army.filter(e => !e.up && sim.upgradeCost(e, 0) <= budget()).sort((a, b) => b.def.cost - a.def.cost)[0];
      if (cand && sim.upgrade(side, cand.cell[0], cand.cell[1], Math.floor(Math.random() * cand.def.upgrades.length))) continue;
    }
    if (sim.value(side) >= target && Math.random() < .7) break;
    const wantFront = nFront < army.length * .42 + 1;
    let pool = FIGHTERS.filter(f => f.cost <= budget() && (isFront(f) === wantFront || f.role === 'Apoyo' && Math.random() < .2));
    if (!pool.length) pool = FIGHTERS.filter(f => f.cost <= budget());
    if (!pool.length) break;
    // las dificultades altas prefieren unidades caras y Soraka si hay muchos tanques
    if (D.spend >= 1) pool.sort((a, b) => b.cost - a.cost), pool = pool.slice(0, 4);
    const f = pick(pool), s = freeSlots(sim, side, isFront(f), f.role === 'Asesino'); if (!s.length) break;
    const slot = D.spend >= 1 ? s[0] : pick(s.slice(0, 6));
    sim.place(side, f.id, slot[0], slot[1]);
  }
  // 3) mercenarios con esencia
  if (w >= 1) {
    let g2 = 6; while (g2-- > 0 && Math.random() < D.merc + .4) {
      const opts = MERCS.filter(m => m.cost <= p.myth * (D.merc + .35)).sort((a, b) => b.cost - a.cost); if (!opts.length) break;
      sim.buyMerc(side, (D.spend >= 1 ? opts[0] : pick(opts.slice(0, 3))).id);
    }
  }
  // 4) mejoras del Nexo
  if (D.nex && Math.random() < D.nex) { const k = pick(['hp', 'atk', 'regen']); sim.upgradeNexus(side, k); }
  if (p.spellOffer) sim.autoSpell(side);
  p.aiReadyAt = D.ready;
}
// Llamado cada frame: la IA marca "listo" tras unos segundos.
export function aiTick(sim, side) { const p = sim.P(side); if (sim.phase === 'build' && !p.ready && sim.timer <= 30 - (p.aiReadyAt ?? 5)) p.ready = true; }
