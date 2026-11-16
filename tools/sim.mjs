import { Sim } from '../src/sim.js';
import { aiTurn } from '../src/ai.js';
import { CFG } from '../src/data.js';
const sim = new Sim(); let lastWave = -1;
for (let i = 0; i < 400000 && !sim.over; i++) {
  if (sim.phase === 'build' && sim.wave !== lastWave) {
    lastWave = sim.wave; aiTurn(sim, 0); aiTurn(sim, 1);
    const [a, b] = sim.players; console.log(`W${sim.wave + 1} units ${a.grid.filter(Boolean).length}/${b.grid.filter(Boolean).length} nexus ${a.nexusHp | 0}/${b.nexusHp | 0} gold ${a.gold | 0} inc ${a.income}`);
  }
  sim.update(1 / 20); sim.ev.length = 0;
}
console.log('RESULT', sim.over, 'wave', sim.wave);
