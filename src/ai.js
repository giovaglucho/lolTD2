import { FIGHTERS, GRID, CFG } from './data.js';
import { MERCS } from './data.js';

const front = new Set(['Tanque', 'Bruiser', 'Duelista']);
function slots(sim, side, frontRow) {
  const out = []; const rows = frontRow ? [0, 1, 2] : [3, 4, 5, 2];
  for (const r of rows) { const cs = [...Array(GRID.cols).keys()].sort((a, b) => Math.abs(a - 4.5) - Math.abs(b - 4.5)); for (const c of cs) if (sim.canPlace(side, c, r)) out.push([c, r]); }
  return out;
}
// IA sencilla: compra trabajadores, luchadores equilibrados y mercenarios.
export function aiTurn(sim, side, skill = 1) {
  const p = sim.P(side), w = sim.wave;
  if (w < 12 && p.workers < 3 + w * .8 && p.gold > 150) { let n = 0; while (p.gold > 130 && n++ < 2 && sim.buyWorker(side)); }
  const frontCount = p.grid.filter(e => e && front.has(e.def.role)).length, total = p.grid.filter(Boolean).length;
  let guard = 30;
  while (guard-- > 0) {
    const wantFront = frontCount + 0 < total * .4 + 2 && Math.random() < .55;
    const pool = FIGHTERS.filter(f => f.cost <= p.gold && (wantFront ? front.has(f.role) : !front.has(f.role) || Math.random() < .3));
    if (!pool.length) break;
    const f = pool[Math.floor(Math.random() * pool.length)];
    const s = slots(sim, side, front.has(f.role)); if (!s.length) break;
    sim.place(side, f.id, s[0][0], s[0][1]);
  }
  if (w >= 2 && skill > 0) {
    const budget = p.gold * .3;
    const opts = MERCS.filter(m => m.cost <= budget).sort((a, b) => b.cost - a.cost);
    if (opts[0] && Math.random() < .6) sim.buyMerc(side, opts[0].id);
  }
  p.ready = true;
}
