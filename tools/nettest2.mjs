import WebSocket from 'ws';
const ws = new WebSocket('ws://localhost:8790/ws'); let n = 0, maxB = 0, t0 = Date.now();
ws.on('open', () => { ws.send(JSON.stringify({ t: 'hello', name: 'Solo<script>' })); ws.send(JSON.stringify({ t: 'queue', mode: 'classic', legion: 'jonia' })); });
ws.on('message', raw => { const d = JSON.parse(raw);
  if (d.t === 'profile') console.log('profile', d.p.name, d.p.tier);
  if (d.t === 'queue') console.log('queue', d.n, 'fill in', d.fill);
  if (d.t === 'start') { console.log('start me', d.me, d.players.map(p => p.name).join(',')); for (const [id, c, r] of [['shen', 4, 0], ['leesin', 5, 0], ['akali', 4, 3], ['ahri', 5, 3]]) ws.send(JSON.stringify({ t: 'cmd', c: { a: 'place', id, c, r } })); ws.send(JSON.stringify({ t: 'cmd', c: { a: 'ready', v: true } })); }
  if (d.t === 's') { n++; maxB = Math.max(maxB, raw.length); if (n % 600 === 0) console.log(`t=${((Date.now() - t0) / 1000) | 0}s wave ${d.s.wv + 1} ${d.s.ph} ents ${d.s.e.length} teamHP ${d.s.teams.map(t => t.hp | 0)} maxBytes ${maxB}`); }
  if (d.t === 'end') { console.log('END winner', d.winner, d.profile); process.exit(0); }
});
setTimeout(() => { console.log('timeout; snaps', n, 'maxBytes', maxB); process.exit(0); }, 110000);
