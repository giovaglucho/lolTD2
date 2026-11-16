// Prueba de extremo a extremo del servidor: 4 clientes en cola ranked.
import WebSocket from 'ws';
const URL = process.env.URL || 'ws://localhost:8790/ws', mode = process.argv[2] || 'ranked';
const names = ['Faker', 'Caps', 'Uzi', 'Rekkles'];
let started = 0, snaps = 0, ends = [];
const cl = names.map((n, i) => new Promise(res => {
  const ws = new WebSocket(URL); let me = -1;
  ws.on('open', () => { ws.send(JSON.stringify({ t: 'hello', name: n })); ws.send(JSON.stringify({ t: 'queue', mode })); });
  ws.on('message', raw => { const d = JSON.parse(raw);
    if (d.t === 'start') { started++; me = d.me; console.log(n, 'start: me', d.me, 'players', d.players.map(p => p.name + (p.bot ? '(bot)' : '')).join(',')); ws.send(JSON.stringify({ t: 'cmd', c: { a: 'place', id: 'garen', c: 4, r: 0 } })); ws.send(JSON.stringify({ t: 'cmd', c: { a: 'ready', v: true } })); if (i === 0) setTimeout(() => ws.send(JSON.stringify({ t: 'surrender' })), 4000); }
    if (d.t === 's') { snaps++; if (snaps === 40 && i === 1) { const s = d.s; console.log('snap: phase', s.ph, 'wave', s.wv, 'ents', s.e.length, 'gold', s.pl.map(p => p.g), 'fighters own', s.e.filter(e => e[2] === 0).length, 'bytes', raw.length); } }
    if (d.t === 'end') { ends.push([n, d.winner, d.delta[n], d.profile.mmr, d.profile.tier]); ws.close(); res(); }
  });
}));
await Promise.race([Promise.all(cl), new Promise(r => setTimeout(r, 20000))]);
console.log('started', started, 'ends', ends);
process.exit(0);
