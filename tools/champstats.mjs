// Rendimiento por campeón: daño infligido y recibido por 100 de oro invertido, en partidas IA vs IA.
import { Sim } from '../src/sim.js';
import { aiTurn, aiTick } from '../src/ai.js';
const L = ['demacia', 'noxus', 'jonia', 'freljord', 'piltover', 'targon'], st = {};
const S = id => st[id] ??= { dealt: 0, taken: 0, gold: 0 };
for (let g = 0; g < +(process.argv[2] || 12); g++) {
  const a = L[g % 6], b = L[(g + 1 + Math.floor(g / 6)) % 6];
  const sim = new Sim({ lanes: 2, players: [{ legion: a, bot: true }, { legion: b === a ? L[(g + 3) % 6] : b, bot: true }] });
  const oh = sim.hurt.bind(sim); sim.hurt = (s, t, amt, o = {}) => { const r = oh(s, t, amt, o) || 0; if (s && s.kind === 'fighter') S(s.def.id).dealt += r; else if (s && s.kind === 'summon') { const m = sim.ents.find(x => x.id === s.summoner); if (m) S(m.def.id).dealt += r; } if (t && t.kind === 'fighter') S(t.def.id).taken += r; return r; };
  let last = -1;
  for (let i = 0; i < 400000 && !sim.over; i++) {
    if (sim.phase === 'build' && sim.wave !== last) { last = sim.wave; sim.players.forEach(p => aiTurn(sim, p.side, 'normal')); }
    if (sim.phase === 'combat' && sim.combatT < .06) for (const e of sim.ents) if (e.kind === 'fighter') S(e.def.id).gold += e.value;
    sim.players.forEach(p => aiTick(sim, p.side)); sim.update(1 / 20); sim.ev.length = 0;
  }
}
const { FBY } = await import('../src/sim.js');
const rows = Object.entries(st).filter(([, v]) => v.gold > 0).map(([id, v]) => ({ id, leg: FBY[id].legion, role: FBY[id].role, d: v.dealt / v.gold * 100, t: v.taken / v.gold * 100 })).sort((x, y) => x.leg.localeCompare(y.leg) || y.d - x.d);
for (const r of rows) console.log(r.leg.padEnd(9), r.id.padEnd(13), r.role.padEnd(9), 'daño/100oro', r.d.toFixed(0).padStart(5), ' recibido/100oro', r.t.toFixed(0).padStart(5));
const by = {}; for (const r of rows) { (by[r.leg] ??= []).push(r); }
console.log(Object.entries(by).map(([l, a]) => `${l}: ${(a.reduce((s, r) => s + r.d + r.t, 0) / a.length).toFixed(0)}`).join(' | '));
