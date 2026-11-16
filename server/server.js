// Servidor autoritativo de Rift Legion: estáticos + WebSocket, matchmaking 2v2 Clásico/Ranked, MMR Elo.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { Sim, snapshot, netEvents } from '../src/sim.js';
import { aiTurn, aiTick } from '../src/ai.js';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const PORT = +process.env.PORT || 8787, DIST = path.join(__dir, '..', 'dist'), DATA = process.env.DATA_DIR || path.join(__dir, 'data'), RFILE = path.join(DATA, 'ratings.json');
const FILL_MS = +process.env.BOT_FILL_MS || 15000; // Clásico: rellena con bots tras 15 s
const RANKED_FILL = process.env.RANKED_BOTS === '1'; // solo para pruebas
fs.mkdirSync(DATA, { recursive: true });
let ratings = {}; try { ratings = JSON.parse(fs.readFileSync(RFILE, 'utf8')); } catch {}
const saveRatings = () => fs.writeFile(RFILE, JSON.stringify(ratings, null, 1), () => {});

export const TIERS = [[900, 'Hierro'], [1050, 'Bronce'], [1200, 'Plata'], [1350, 'Oro'], [1500, 'Platino'], [1650, 'Esmeralda'], [1800, 'Diamante'], [1950, 'Maestro'], [2100, 'Gran Maestro'], [1e9, 'Retador']];
const tierOf = m => TIERS.find(([lim]) => m < lim)[1];
const prof = name => { const r = ratings[name.toLowerCase()] ||= { name, mmr: 1000, w: 0, l: 0, cw: 0, cl: 0 }; return { ...r, tier: tierOf(r.mmr) }; };

// ─── HTTP estático ───
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent((req.url || '/').split('?')[0]);
  if (u === '/health') { res.end('ok'); return; }
  let f = path.normalize(path.join(DIST, u === '/' ? 'index.html' : u));
  if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(DIST, 'index.html');
  fs.readFile(f, (err, buf) => { if (err) { res.writeHead(404); res.end('Ejecuta npm run build primero'); return; } res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); res.end(buf); });
});
const wss = new WebSocketServer({ server, path: '/ws', perMessageDeflate: { threshold: 1024 } });

// ─── matchmaking ───
const queues = { classic: [], ranked: [] }; const matches = new Set(); let mid = 1;
const send = (c, o) => { if (c.ws.readyState === 1) c.ws.send(JSON.stringify(o)); };
function queueInfo(mode) { const q = queues[mode]; for (const c of q) send(c, { t: 'queue', mode, n: q.length, need: 4, wait: Math.round((Date.now() - c.qt) / 1000), fill: mode === 'classic' || RANKED_FILL ? Math.max(0, Math.round((FILL_MS - (Date.now() - q[0].qt)) / 1000)) : null }); }
function leaveQueue(c) { for (const m of Object.keys(queues)) { const i = queues[m].indexOf(c); if (i >= 0) { queues[m].splice(i, 1); queueInfo(m); } } }
setInterval(() => {
  for (const mode of ['classic', 'ranked']) {
    const q = queues[mode];
    while (q.length >= 4) startMatch(mode, q.splice(0, 4));
    if (q.length && (mode === 'classic' || RANKED_FILL) && Date.now() - q[0].qt > FILL_MS) startMatch(mode, q.splice(0, 4));
    if (q.length) queueInfo(mode);
  }
}, 1000);

function startMatch(mode, humans) {
  const ranked = mode === 'ranked';
  // equilibrar equipos por MMR: mejor + peor juntos
  const hs = humans.map(c => ({ c, mmr: prof(c.name).mmr })).sort((a, b) => b.mmr - a.mmr);
  const order = hs.length === 4 ? [hs[0], hs[3], hs[1], hs[2]] : hs;
  const slots = [0, 1, 2, 3].map(i => order[i] ? { c: order[i].c, name: order[i].c.name, bot: false } : { c: null, name: 'Bot ' + ['Poro', 'Teemo', 'Rammus', 'Blitz'][i], bot: true, diff: 'normal' });
  const sim = new Sim({ lanes: 4, players: slots.map(s => ({ name: s.name, bot: s.bot, diff: s.diff })) });
  const m = { id: mid++, mode, ranked, sim, slots, last: -1, tick: 0, evbuf: [], over: false };
  slots.forEach((s, i) => { if (s.c) { s.c.match = m; s.c.side = i; } });
  matches.add(m);
  const info = slots.map((s, i) => ({ name: s.name, bot: s.bot, team: sim.P(i).team, ...(s.bot ? {} : { mmr: prof(s.name).mmr, tier: prof(s.name).tier }) }));
  slots.forEach((s, i) => s.c && send(s.c, { t: 'start', id: m.id, me: i, n: 4, ranked, mode, players: info }));
  console.log(`[match ${m.id}] ${mode} ${slots.map(s => s.name).join(', ')}`);
}

const DT = .05, SPEED = +process.env.SIM_SPEED || 1;
setInterval(() => {
  for (const m of matches) try { for (let k = 0; k < SPEED && !m.over; k++) {
    const sim = m.sim;
    if (sim.phase === 'build' && sim.wave !== m.last) { m.last = sim.wave; sim.players.forEach((p, i) => { if (m.slots[i].bot) aiTurn(sim, i, m.slots[i].diff || 'normal'); }); }
    sim.players.forEach((p, i) => { if (m.slots[i].bot) aiTick(sim, i); });
    sim.update(DT); m.evbuf.push(...netEvents(sim.ev)); sim.ev.length = 0; m.tick++;
    if (m.tick % 2 === 0 || sim.over) {
      const msg = JSON.stringify({ t: 's', s: snapshot(sim), ev: m.evbuf }); m.evbuf = [];
      for (const s of m.slots) if (s.c && s.c.ws.readyState === 1) s.c.ws.send(msg);
    }
    if (sim.over && !m.over) endMatch(m);
  } } catch (err) { console.error(`[match ${m.id}] error`, err); }
}, DT * 1000);

function endMatch(m) {
  m.over = true; const win = m.sim.over.winner; const delta = {};
  if (m.ranked) {
    const team = t => m.slots.filter((s, i) => m.sim.P(i).team === t);
    const avg = t => { const h = team(t); return h.reduce((a, s) => a + (s.bot ? 1000 : prof(s.name).mmr), 0) / h.length; };
    const ea = 1 / (1 + Math.pow(10, (avg(1) - avg(0)) / 400));
    for (const [i, s] of m.slots.entries()) { if (s.bot) continue; const t = m.sim.P(i).team, exp = t === 0 ? ea : 1 - ea, sc = t === win ? 1 : 0, d = Math.round(32 * (sc - exp)); const r = ratings[s.name.toLowerCase()]; r.mmr = Math.max(0, r.mmr + d); sc ? r.w++ : r.l++; delta[s.name] = d; }
  } else for (const [i, s] of m.slots.entries()) { if (s.bot) continue; const r = ratings[s.name.toLowerCase()]; m.sim.P(i).team === win ? r.cw++ : r.cl++; }
  saveRatings();
  for (const s of m.slots) if (s.c) send(s.c, { t: 'end', winner: win, delta, profile: prof(s.name) });
  setTimeout(() => { matches.delete(m); for (const s of m.slots) if (s.c && s.c.match === m) s.c.match = null; }, 3000);
  console.log(`[match ${m.id}] fin, gana equipo ${win}`, delta);
}

wss.on('connection', ws => {
  const c = { ws, name: null, match: null, side: -1, qt: 0 };
  ws.on('message', raw => {
    let d; try { d = JSON.parse(raw); } catch { return; }
    if (d.t === 'hello') { c.name = String(d.name || '').replace(/[^\p{L}\p{N} _-]/gu, '').slice(0, 16) || 'Invocador' + Math.floor(Math.random() * 999); send(c, { t: 'profile', p: prof(c.name) }); saveRatings(); }
    else if (!c.name) return;
    else if (d.t === 'queue' && !c.match && queues[d.mode]) { leaveQueue(c); c.qt = Date.now(); queues[d.mode].push(c); queueInfo(d.mode); }
    else if (d.t === 'leave') leaveQueue(c);
    else if (d.t === 'cmd' && c.match && !c.match.over && d.c && typeof d.c.a === 'string') c.match.sim.command(c.side, d.c);
    else if (d.t === 'lb') send(c, { t: 'lb', list: Object.values(ratings).sort((a, b) => b.mmr - a.mmr).slice(0, 10).map(r => ({ name: r.name, mmr: r.mmr, tier: tierOf(r.mmr), w: r.w, l: r.l })) });
    else if (d.t === 'surrender' && c.match && !c.match.over) { const t = c.match.sim.P(c.side).team; c.match.sim.finish(1 - t, 'surrender'); }
  });
  ws.on('close', () => { leaveQueue(c); if (c.match && !c.match.over) { const s = c.match.slots[c.side]; s.bot = true; s.diff = 'normal'; s.c = null; c.match.sim.P(c.side).bot = true; } });
});
server.listen(PORT, () => console.log(`Rift Legion server en http://localhost:${PORT}  (ws en /ws)`));
