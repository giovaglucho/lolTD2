// Torneo todos contra todos entre legiones (IA vs IA) para equilibrar.
import { Sim } from '../src/sim.js';
import { aiTurn, aiTick } from '../src/ai.js';
const L = ['demacia', 'noxus', 'jonia', 'freljord', 'piltover', 'targon', 'invocador'], runs = +process.argv[2] || 2;
const W = Object.fromEntries(L.map(l => [l, 0])), G = Object.fromEntries(L.map(l => [l, 0])), wav = [];
for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) for (let k = 0; k < runs; k++) {
  const sim = new Sim({ lanes: 2, players: [{ legion: L[i], bot: true }, { legion: L[j], bot: true }] }); let last = -1;
  for (let s = 0; s < 400000 && !sim.over; s++) {
    if (sim.phase === 'build' && sim.wave !== last) { last = sim.wave; sim.players.forEach(p => aiTurn(sim, p.side, 'normal')); }
    sim.players.forEach(p => aiTick(sim, p.side)); sim.update(1 / 20); sim.ev.length = 0;
  }
  G[L[i]]++; G[L[j]]++; W[sim.over.winner ? L[j] : L[i]]++; wav.push(sim.wave + 1);
}
console.log(L.map(l => `${l} ${Math.round(W[l] / G[l] * 100)}%`).join(' | '));
console.log('oleada final media', (wav.reduce((a, b) => a + b) / wav.length).toFixed(1), 'min', Math.min(...wav), 'max', Math.max(...wav));
