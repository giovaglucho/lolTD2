// Simulación headless: dificultad A (equipo azul) vs dificultad B (equipo rojo).
import { Sim } from '../src/sim.js';
import { aiTurn, aiTick } from '../src/ai.js';
const [, , A = 'normal', B = 'normal', lanes = '2', runs = '6'] = process.argv;
const res = { 0: 0, 1: 0 }, waves = [];
for (let k = 0; k < +runs; k++) {
  const n = +lanes, sim = new Sim({ lanes: n }); let last = -1;
  for (let i = 0; i < 600000 && !sim.over; i++) {
    if (sim.phase === 'build' && sim.wave !== last) { last = sim.wave; sim.players.forEach(p => aiTurn(sim, p.side, p.team === 0 ? A : B)); }
    sim.players.forEach(p => aiTick(sim, p.side)); sim.update(1 / 20); sim.ev.length = 0;
  }
  res[sim.over.winner]++; waves.push(sim.wave + 1);
}
console.log(`${A} vs ${B} (${lanes} carriles): azul ${res[0]} – rojo ${res[1]} | oleada final media ${(waves.reduce((a, b) => a + b) / waves.length).toFixed(1)} [${waves}]`);
