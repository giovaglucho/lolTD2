// Prueba de extremo a extremo contra Cloudflare/PartyServer (dev o desplegado): HOST=127.0.0.1:1999 node tools/pktest.mjs ranked
import WebSocket from 'ws';
import { HttpsProxyAgent } from 'https-proxy-agent';
const agent = process.env.HTTPS_PROXY ? new HttpsProxyAgent(process.env.HTTPS_PROXY) : undefined; // dentro del contenedor de Claude
const NODEJS_CA = process.env.NODE_EXTRA_CA_CERTS;
const HOST = process.env.HOST || '127.0.0.1:1999', S = /^127|localhost/.test(HOST) ? 'ws' : 'wss', mode = process.argv[2] || 'ranked';
const names = ['Faker', 'Caps', 'Uzi', 'Rekkles'], legs = ['demacia', 'jonia', 'noxus', 'invocador'];
const out = []; let snaps = 0;
const one = (name, legion, i) => new Promise(res => {
  const lob = new WebSocket(`${S}://${HOST}/parties/lobby/global`, { agent });
  lob.on('open', () => { lob.send(JSON.stringify({ t: 'hello', name })); lob.send(JSON.stringify({ t: 'queue', mode, legion })); });
  lob.on('message', raw => { const d = JSON.parse(raw);
    if (d.t === 'found') { console.log(name, 'partida', d.id);
      const m = new WebSocket(`${S}://${HOST}/parties/match/${d.id}?name=${encodeURIComponent(name)}`, { agent });
      m.on('message', r2 => { const e = JSON.parse(r2);
        if (e.t === 'start') { console.log(name, 'slot', e.me, 'legiones', e.players.map(p => p.legion).join(',')); const p = e.players[e.me]; m.send(JSON.stringify({ t: 'cmd', c: { a: 'ready', v: true } })); if (i === 0) setTimeout(() => m.send(JSON.stringify({ t: 'surrender' })), 8000); }
        if (e.t === 's') { snaps++; if (snaps === 60 && i === 1) console.log('snap', e.s.ph, 'oleada', e.s.wv + 1, 'ents', e.s.e.length, 'bytes', r2.length, 'roll', e.s.pl[1].roll.length); }
        if (e.t === 'end') { out.push([name, e.winner, e.delta[name], e.profile && e.profile.mmr]); m.close(); lob.close(); res(); } });
      m.on('error', er => console.log('match err', er.message)); } });
  lob.on('error', er => console.log('lobby err', er.message));
});
await Promise.race([Promise.all(names.map((n, i) => one(n, legs[i], i))), new Promise(r => setTimeout(r, 40000))]);
console.log('resultado', JSON.stringify(out)); process.exit(0);
