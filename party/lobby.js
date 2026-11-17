// Sala "lobby" de PartyKit (una sola: /party/global): cola de emparejamiento, perfiles, MMR Elo y clasificación.
const TIERS = [[900, 'Hierro'], [1050, 'Bronce'], [1200, 'Plata'], [1350, 'Oro'], [1500, 'Platino'], [1650, 'Esmeralda'], [1800, 'Diamante'], [1950, 'Maestro'], [2100, 'Gran Maestro'], [1e9, 'Retador']];
const tierOf = m => TIERS.find(([lim]) => m < lim)[1];
const FILL_MS = 15000;
const clean = n => String(n || '').replace(/[^\p{L}\p{N} _-]/gu, '').slice(0, 16) || 'Invocador' + Math.floor(Math.random() * 999);
const BOTS = ['Poro', 'Teemo', 'Rammus', 'Blitz'];

export default class Lobby {
  constructor(room) { this.room = room; this.ratings = {}; this.queues = { classic: [], ranked: [] }; this.users = new Map(); }
  async onStart() {
    this.ratings = (await this.room.storage.get('ratings')) || {};
    this.timer = setInterval(() => this.tick(), 1000);
  }
  save() { return this.room.storage.put('ratings', this.ratings); }
  prof(name) { const k = name.toLowerCase(); const r = (this.ratings[k] ||= { name, mmr: 1000, w: 0, l: 0, cw: 0, cl: 0 }); return { ...r, tier: tierOf(r.mmr) }; }
  send(conn, o) { try { conn.send(JSON.stringify(o)); } catch {} }
  onMessage(raw, conn) {
    let d; try { d = JSON.parse(raw); } catch { return; }
    if (d.t === 'hello') { const name = clean(d.name); this.users.set(conn.id, { conn, name, legion: 'random' }); this.send(conn, { t: 'profile', p: this.prof(name) }); this.save(); return; }
    const u = this.users.get(conn.id); if (!u) return;
    if (d.t === 'queue' && this.queues[d.mode]) {
      this.leave(u); u.legion = typeof d.legion === 'string' ? d.legion.slice(0, 20) : 'random'; u.qt = Date.now(); u.mode = d.mode; this.queues[d.mode].push(u); this.info(d.mode);
    } else if (d.t === 'leave') this.leave(u);
    else if (d.t === 'lb') this.send(conn, { t: 'lb', list: Object.values(this.ratings).sort((a, b) => b.mmr - a.mmr).slice(0, 10).map(r => ({ name: r.name, mmr: r.mmr, tier: tierOf(r.mmr), w: r.w, l: r.l })) });
  }
  onClose(conn) { const u = this.users.get(conn.id); if (u) this.leave(u); this.users.delete(conn.id); }
  leave(u) { for (const m of Object.keys(this.queues)) { const i = this.queues[m].indexOf(u); if (i >= 0) { this.queues[m].splice(i, 1); this.info(m); } } }
  info(mode) { const q = this.queues[mode]; for (const u of q) this.send(u.conn, { t: 'queue', mode, n: q.length, need: 4, wait: Math.round((Date.now() - u.qt) / 1000), fill: mode === 'classic' ? Math.max(0, Math.round((FILL_MS - (Date.now() - q[0].qt)) / 1000)) : null }); }
  tick() {
    for (const mode of ['classic', 'ranked']) {
      const q = this.queues[mode];
      while (q.length >= 4) this.startMatch(mode, q.splice(0, 4));
      if (q.length && mode === 'classic' && Date.now() - q[0].qt > FILL_MS) this.startMatch(mode, q.splice(0, 4));
      if (q.length) this.info(mode);
    }
  }
  async startMatch(mode, humans) {
    const ranked = mode === 'ranked';
    const hs = humans.map(u => ({ u, mmr: this.prof(u.name).mmr })).sort((a, b) => b.mmr - a.mmr);
    const order = hs.length === 4 ? [hs[0], hs[3], hs[1], hs[2]] : hs; // equilibrar equipos: mejor + peor
    const slots = [0, 1, 2, 3].map(i => order[i] ? { name: order[i].u.name, bot: false, legion: order[i].u.legion, mmr: order[i].mmr, tier: tierOf(order[i].mmr) } : { name: 'Bot ' + BOTS[i], bot: true, legion: 'random', diff: 'normal' });
    const id = Math.random().toString(36).slice(2, 10);
    const room = this.room.context.parties.match.get(id);
    await room.fetch({ method: 'POST', body: JSON.stringify({ mode, ranked, slots }) });
    for (const o of order) this.send(o.u.conn, { t: 'found', id, mode, ranked });
  }
  // el match avisa del resultado → Elo
  async onRequest(req) {
    if (req.method !== 'POST') return new Response('ok');
    const { ranked, winner, players } = await req.json(); const delta = {};
    const humans = players.filter(p => !p.bot);
    for (const p of humans) this.prof(p.name);
    if (ranked) {
      const avg = t => { const h = players.filter(p => p.team === t); return h.reduce((a, p) => a + (p.bot ? 1000 : this.ratings[p.name.toLowerCase()].mmr), 0) / h.length; };
      const ea = 1 / (1 + Math.pow(10, (avg(1) - avg(0)) / 400));
      for (const p of humans) { const r = this.ratings[p.name.toLowerCase()], exp = p.team === 0 ? ea : 1 - ea, sc = p.team === winner ? 1 : 0, d = Math.round(32 * (sc - exp)); r.mmr = Math.max(0, r.mmr + d); sc ? r.w++ : r.l++; delta[p.name] = d; }
    } else for (const p of humans) { const r = this.ratings[p.name.toLowerCase()]; p.team === winner ? r.cw++ : r.cl++; }
    await this.save();
    const profiles = Object.fromEntries(humans.map(p => [p.name, this.prof(p.name)]));
    return new Response(JSON.stringify({ delta, profiles }), { headers: { 'content-type': 'application/json' } });
  }
}
