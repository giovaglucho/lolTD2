// Una partida 2v2 autoritativa (PartyServer / Durable Object "Match"). Ruta: /parties/match/<id>?name=<jugador>
// Usa la misma simulación que el cliente (src/sim.js) y la IA (src/ai.js).
import { Server, getServerByName } from 'partyserver';
import { Sim, snapshot, netEvents } from '../src/sim.js';
import { aiTurn, aiTick } from '../src/ai.js';

const DT = .05;
export class Match extends Server {
  sim = null; slots = []; conns = new Map(); evbuf = []; tick = 0; last = -1; ended = false; idle = 0;
  async onRequest(req) { // la crea el lobby
    if (req.method !== 'POST' || this.sim) return new Response('no', { status: 400 });
    const { mode, ranked, slots } = await req.json();
    this.mode = mode; this.ranked = ranked; this.slots = slots.map(s => ({ ...s, conn: null }));
    this.sim = new Sim({ lanes: 4, players: this.slots.map(s => ({ name: s.name, bot: s.bot, diff: s.diff, legion: s.legion })) });
    this.sim.players.forEach((p, i) => { if (!this.slots[i].bot) p.bot = true; }); // hasta que se conecte, juega un bot
    this.timer = setInterval(() => this.loop(), DT * 1000);
    return new Response('ok');
  }
  onConnect(conn, ctx) {
    const name = new URL(ctx.request.url).searchParams.get('name') || '';
    const i = this.slots.findIndex(s => !s.bot && s.name === name);
    if (!this.sim || i < 0) { conn.close(4000, 'no-match'); return; }
    const s = this.slots[i]; if (s.conn && s.conn !== conn) { try { s.conn.close(4001, 'replaced'); } catch {} }
    s.conn = conn; this.conns.set(conn.id, i); this.sim.P(i).bot = false;
    const info = this.slots.map((q, k) => ({ name: q.name, bot: q.bot, team: this.sim.P(k).team, legion: this.sim.P(k).legion, mmr: q.mmr, tier: q.tier }));
    conn.send(JSON.stringify({ t: 'start', id: this.name, me: i, n: 4, ranked: this.ranked, mode: this.mode, players: info }));
  }
  onMessage(conn, raw) {
    const i = this.conns.get(conn.id); if (i === undefined || !this.sim || this.ended) return;
    let d; try { d = JSON.parse(raw); } catch { return; }
    if (d.t === 'cmd' && d.c && typeof d.c.a === 'string') this.sim.command(i, d.c);
    else if (d.t === 'surrender') this.sim.finish(1 - this.sim.P(i).team, 'surrender');
  }
  onClose(conn) { const i = this.conns.get(conn.id); this.conns.delete(conn.id); if (i === undefined) return; const s = this.slots[i]; if (s.conn === conn) { s.conn = null; if (this.sim && !this.ended) this.sim.P(i).bot = true; } }
  loop() {
    const sim = this.sim; if (!sim || this.ended) return;
    try {
      if (sim.phase === 'build' && sim.wave !== this.last) { this.last = sim.wave; sim.players.forEach((p, i) => { if (p.bot) aiTurn(sim, i, this.slots[i].diff || 'normal'); }); }
      sim.players.forEach((p, i) => { if (p.bot) aiTick(sim, i); });
      sim.update(DT); this.evbuf.push(...netEvents(sim.ev)); sim.ev.length = 0; this.tick++;
      if (this.tick % 2 === 0 || sim.over) { const msg = JSON.stringify({ t: 's', s: snapshot(sim), ev: this.evbuf }); this.evbuf = []; this.broadcast(msg); }
      if (sim.over) this.finishMatch();
    } catch (e) { console.error('match error', e); }
    // sin jugadores humanos conectados durante 60 s → cerrar la partida
    if (!this.ended && this.slots.every(s => s.bot || !s.conn)) { this.idle += DT; if (this.idle > 60) { this.ended = true; clearInterval(this.timer); } } else this.idle = 0;
  }
  async finishMatch() {
    this.ended = true; clearInterval(this.timer);
    let res = { delta: {}, profiles: {} };
    try {
      const lobby = await getServerByName(this.env.Lobby, 'global');
      const r = await lobby.fetch(new Request('https://lobby.internal/result', { method: 'POST', body: JSON.stringify({ ranked: this.ranked, winner: this.sim.over.winner, players: this.slots.map((s, i) => ({ name: s.name, bot: s.bot, team: this.sim.P(i).team })) }) }));
      res = await r.json();
    } catch (e) { console.error('result error', e); }
    for (const s of this.slots) if (s.conn) { try { s.conn.send(JSON.stringify({ t: 'end', winner: this.sim.over.winner, delta: res.delta, profile: res.profiles[s.name] })); } catch {} }
  }
}
