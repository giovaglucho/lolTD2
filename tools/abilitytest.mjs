// Prueba de humo: cada habilidad/pasiva del catálogo en combate real.
import { Sim, FBY } from '../src/sim.js';
const A = { spin:{type:'spin',cd:3,dmg:60,r:3,hits:3,dur:1}, nova:{type:'nova',cd:3,dmg:80,r:3,stun:1,slow:.3}, volley:{type:'volley',cd:3,dmg:30,n:4,slow:.3,slowT:2},
 beam:{type:'beam',cd:3,dmg:90,len:14,w:1.2,stun:.5}, chain:{type:'chain',cd:3,dmg:70,n:4}, heal:{type:'heal',cd:2,heal:90,range:10,n:2}, shield:{type:'shield',cd:3,amt:150,range:9},
 buff:{type:'buff',cd:4,stat:'aspd',amt:.3,r:6,dur:3}, strike:{type:'strike',cd:3,dmg:120,exec:.4,execMul:2,stun:.5}, stun:{type:'stun',cd:3,dmg:40,stun:1.2}, poison:{type:'poison',cd:3,dps:15,t:4},
 dash:{type:'dash',cd:3,dmg:80,r:2,stun:.4}, pull:{type:'pull',cd:4,dmg:50,stun:1}, taunt:{type:'taunt',cd:5,r:4,dur:2}, summon:{type:'summon',cd:8,n:2,unit:{name:'Torreta',hp:200,dmg:20,range:6,melee:false,model:'heimer_turret',dur:8,proj:{color:0xffaa00,speed:20,size:.12}}},
 global:{type:'global',cd:5,dmg:200,r:3}, stealth:{type:'stealth',cd:5,dur:2,mul:2.5} };
const PS = [{type:'crit',chance:.3,mul:2},{type:'lifesteal',pct:.2},{type:'cleave',pct:.4,r:2},{type:'splash',pct:.4,r:2},{type:'thorns',pct:.3},{type:'nth',n:3,mul:2.5},{type:'rampup',per:.1,max:1},
 {type:'onhit_dot',dps:10,t:3},{type:'onhit_slow',amt:.3,t:1},{type:'onhit_stun',chance:.2,t:.5},{type:'aura',stat:'dmg',amt:.2,r:5},{type:'regen',hps:10},{type:'execute',below:.3,mul:2},
 {type:'revive',pct:.5},{type:'bossbane',mul:1.5},{type:'rage',below:.5,aspd:.5},{type:'undying',dur:3},{type:'multishot',n:2,pct:.5}];
const ids = [];
Object.entries(A).forEach(([k, ab], i) => { const melee = i % 2 === 0, p = PS[i % PS.length];
  const id = 't_' + k; FBY[id] = { id, name: k, cost: 50, hp: 500, dmg: 40, aspd: 1, range: melee ? 2 : 7, speed: 3.5, armor: 10, melee, role: melee ? 'Luchador' : 'Mago', dmgType: 'magico', armorType: 'ligera', ability: { name: k, ...ab }, passive: p, upgrades: [{ cost: 50, hp: 2, dmg: 2, ability: { dmg: (ab.dmg||0) * 1.5 }, passive: PS[(i + 3) % PS.length] }], proj: melee ? null : { color: 0xffffff, speed: 20, size: .15 } };
  ids.push(id); });
let errs = 0, evs = {};
for (const lanes of [2, 4]) {
  const sim = new Sim({ lanes }); sim.players.forEach(p => { p.roll = ids; p.gold = 99999; });
  sim.players.forEach(p => ids.forEach((id, i) => { sim.place(p.side, id, i % 10, Math.floor(i / 10) * 3); }));
  sim.players.forEach(p => p.grid.filter(Boolean).forEach((e, i) => i % 2 && sim.upgrade(p.side, e.cell[0], e.cell[1], 0)));
  for (let w = 0; w < 14 && !sim.over; w++) {
    sim.wave = w; sim.players.forEach(p => p.ready = true);
    for (let i = 0; i < 20 * 150 && !sim.over; i++) { try { sim.update(.05); } catch (e) { errs++; if (errs < 4) console.error('ERR', e.stack.split('\n').slice(0, 4).join('\n')); } for (const ev of sim.ev) evs[ev.type] = (evs[ev.type] || 0) + 1; sim.ev.length = 0; if (sim.phase === 'build') break; }
    if (sim.spellWave) {}
  }
  console.log(`lanes ${lanes}: wave ${sim.wave} over ${JSON.stringify(sim.over)} errs ${errs}`);
}
console.log(Object.entries(evs).map(([k, v]) => k + ':' + v).join(' '));
