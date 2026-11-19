import WebSocket from 'ws';
import { HttpsProxyAgent } from 'https-proxy-agent';
const agent = process.env.HTTPS_PROXY ? new HttpsProxyAgent(process.env.HTTPS_PROXY) : undefined; // dentro del contenedor de Claude
const NODEJS_CA = process.env.NODE_EXTRA_CA_CERTS;
const HOST = process.env.HOST || '127.0.0.1:1999'; let n = 0;
const lob = new WebSocket(`wss://${HOST}/parties/lobby/global`, { agent });
lob.on('open', () => { lob.send(JSON.stringify({ t: 'hello', name: 'Solo' })); lob.send(JSON.stringify({ t: 'queue', mode: 'classic', legion: 'targon' })); lob.send(JSON.stringify({ t: 'lb' })); });
lob.on('message', raw => { const d = JSON.parse(raw); if (d.t === 'queue') console.log('cola', d.n, 'bots en', d.fill);
  if (d.t === 'found') { const m = new WebSocket(`wss://${HOST}/parties/match/${d.id}?name=Solo`, { agent });
    m.on('message', r => { const e = JSON.parse(r); if (e.t === 'start') { console.log('start', e.players.map(p => p.name + '/' + p.legion).join(' ')); m.send(JSON.stringify({ t: 'cmd', c: { a: 'ready', v: true } })); }
      if (e.t === 's' && ++n % 100 === 0) console.log('oleada', e.s.wv + 1, e.s.ph, 'nexos', e.s.teams.map(t => Math.round(t.hp)).join('/')); if (n > 250) { console.log('OK 400 snapshots'); process.exit(0); } }); } });
setTimeout(() => { console.log('timeout'); process.exit(1); }, 60000);
