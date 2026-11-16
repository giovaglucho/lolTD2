import { Sim } from '../src/sim.js';
import { aiTurn } from '../src/ai.js';
import { MERCS } from '../src/data.js';
const noMerc = process.argv[2]==='nomerc';
const sim = new Sim(); let last=-1;
for (let i=0;i<400000&&!sim.over;i++){
  if(sim.phase==='build'&&sim.wave!==last){last=sim.wave;aiTurn(sim,0);aiTurn(sim,1);
   if(noMerc) sim.players.forEach(p=>p.queue=[]);
   const a=sim.players[0];console.log('W'+(sim.wave+1),'units',a.grid.filter(Boolean).length,'nexus',a.nexusHp|0,'gold',a.gold|0,'inc',a.income);}
  sim.update(1/20);sim.ev.length=0;}
console.log(sim.over,sim.wave);
