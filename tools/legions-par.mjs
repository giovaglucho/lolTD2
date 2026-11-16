// Torneo paralelo entre legiones: node tools/legions-par.mjs <partidas por pareja> <procesos>
import { fork } from 'node:child_process';
const L = ['demacia', 'noxus', 'jonia', 'freljord', 'piltover', 'targon', 'invocador'];
if (process.argv[2] === 'child') {
  const { Sim } = await import('../src/sim.js'); const { aiTurn, aiTick } = await import('../src/ai.js');
  process.on('message', ([a, b]) => {
    const sim = new Sim({ lanes: 2, players: [{ legion: a, bot: true }, { legion: b, bot: true }] }); let last = -1;
    for (let s = 0; s < 400000 && !sim.over; s++) { if (sim.phase === 'build' && sim.wave !== last) { last = sim.wave; sim.players.forEach(p => aiTurn(sim, p.side, 'normal')); } sim.players.forEach(p => aiTick(sim, p.side)); sim.update(1 / 20); sim.ev.length = 0; }
    process.send([a, b, sim.over.winner, sim.wave + 1]);
  });
} else {
  const runs = +process.argv[2] || 10, P = +process.argv[3] || 4, jobs = [];
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) for (let k = 0; k < runs; k++) jobs.push(k % 2 ? [L[j], L[i]] : [L[i], L[j]]);
  const W = Object.fromEntries(L.map(l => [l, 0])), G = { ...W }, wav = []; let done = 0;
  await Promise.all([...Array(P)].map(() => new Promise(res => { const c = fork(process.argv[1], ['child']); const next = () => { const j = jobs.pop(); if (!j) { c.kill(); return res(); } c.send(j); }; c.on('message', ([a, b, w, wv]) => { G[a]++; G[b]++; W[w ? b : a]++; wav.push(wv); done++; next(); }); next(); })));
  console.log(L.map(l => `${l} ${Math.round(W[l] / G[l] * 100)}%`).join(' | '), `(${done} partidas)`);
  console.log('oleada final media', (wav.reduce((a, b) => a + b) / wav.length).toFixed(1));
}
