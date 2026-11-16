import { Sim } from '../src/sim.js';
import { aiTurn, aiTick } from '../src/ai.js';
const D=process.argv[2]||'normal', nomerc=process.argv[3]==='nomerc';
const sim = new Sim({ lanes: 2 }); let last = -1;
for (let i = 0; i < 600000 && !sim.over; i++) {
  if (sim.phase === 'build' && sim.wave !== last) { last = sim.wave; sim.players.forEach(p => aiTurn(sim, p.side, D)); if(nomerc) sim.players.forEach(p=>{p.queue=[]});
    const p=sim.P(0); console.log(`W${sim.wave+1} val ${sim.value(0)} rec ${sim.recValue()} gold ${p.gold|0} myth ${p.myth|0} wk ${p.workers} inc ${p.income} nex ${sim.teams.map(t=>t.hp|0)}`); }
  sim.players.forEach(p => aiTick(sim, p.side)); sim.update(1 / 20); sim.ev.length = 0;
}
console.log(sim.over);
