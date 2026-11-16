// Cliente de red: conexión WebSocket + espejo de la simulación (NetSim)
import { Sim, FBY, MBY } from './sim.js';
import { CREEPS, GRID, CFG } from './data.js';

export class Conn {
  constructor() { this.ws = null; this.handlers = {}; this.open = false; }
  url() { const q = new URLSearchParams(location.search).get('server'); if (q) return q; return (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws'; }
  connect() {
    if (this.ws && this.open) return Promise.resolve();
    return new Promise((res, rej) => {
      const ws = new WebSocket(this.url()); this.ws = ws;
      ws.onopen = () => { this.open = true; res(); };
      ws.onerror = () => { this.open = false; rej(new Error('No se pudo conectar al servidor')); };
      ws.onclose = () => { this.open = false; this.emit('close', {}); };
      ws.onmessage = m => { let d; try { d = JSON.parse(m.data); } catch { return; } this.emit(d.t, d); };
    });
  }
  on(t, fn) { this.handlers[t] = fn; }
  emit(t, d) { const h = this.handlers[t]; if (h) h(d); }
  send(o) { if (this.ws && this.open) this.ws.send(JSON.stringify(o)); }
}

// Espejo local del estado autoritativo del servidor; expone la misma API que Sim.
export class NetSim {
  constructor(conn, info) {
    this.conn = conn; this.net = true; this.n = info.n; this.me = info.me; this.ranked = info.ranked;
    this.ents = []; this.map = new Map(); this.projs = []; this.ev = []; this.players = []; this.teams = [];
    this.phase = 'build'; this.timer = CFG.buildTime; this.wave = 0; this.over = null; this.ready = false;
    // estado inicial hasta recibir la primera instantánea
    this.teams = [0, 1].map(t => ({ t, hp: 1, max: 1, upg: { hp: 0, atk: 0, regen: 0 } }));
    this.players = info.players.map((p, i) => ({ side: i, team: p.team, name: p.name, bot: p.bot, gold: 0, myth: 0, income: 0, workers: 0, ready: false, kills: 0, queue: [], grid: new Array(GRID.cols * GRID.rows).fill(null), nexus: { isNexus: true, x: 0, z: 28, lane: i } }));
  }
  apply(s, evs) {
    this.n = s.n; this.phase = s.ph; this.timer = s.tm; this.wave = s.wv; this.over = s.ov; this.teams = s.teams;
    this.players = s.pl.map((p, i) => ({ side: i, team: p.team, name: p.name, bot: p.bot, gold: p.g, myth: p.my, income: p.inc, workers: p.wk, ready: p.rd, kills: p.k, sent: p.sent,
      queue: p.q.map(id => MBY[id]), grid: new Array(GRID.cols * GRID.rows).fill(null), nexus: { isNexus: true, x: 0, z: 28, lane: i } }));
    const seen = new Set();
    for (const a of s.e) {
      const [id, lane, tm, key, x, z, face, hp, maxHp, fl, atkT, aspd, castT, deathT, speed, c, r, owner, radius, value, fresh] = a;
      seen.add(id); let e = this.map.get(id);
      if (!e) { e = { id, def: tm === 0 ? FBY[key] : CREEPS[key], ck: tm === 0 ? null : key, flash: 0 }; this.map.set(id, e); this.ents.push(e); }
      if (hp < e.hp) e.flash = .12;
      Object.assign(e, { lane, team: tm === 0 ? 'def' : 'att', kind: tm === 0 ? 'fighter' : (fl & 128 ? 'merc' : 'creep'), x, z, face, hp, maxHp, atkT, aspd, castT, deathT, speed, radius, value, fresh,
        dead: !!(fl & 1), moving: !!(fl & 2), stun: fl & 4 ? 1 : 0, slow: fl & 8 ? 1 : 0, dot: fl & 16 ? 1 : 0, boss: !!(fl & 32), up: fl & 64 ? 1 : 0, owner: owner < 0 ? 'wave' : owner, cell: c >= 0 ? [c, r] : null });
      if (e.cell && e.team === 'def') this.players[lane].grid[r * GRID.cols + c] = e;
    }
    if (seen.size !== this.map.size) { this.ents = this.ents.filter(e => seen.has(e.id)); for (const k of [...this.map.keys()]) if (!seen.has(k)) this.map.delete(k); }
    this.projs = s.p.map(([id, lane, x, z, color, size]) => ({ id, src: { lane }, x, z, y: 1.2, color, size }));
    for (const ev of evs || []) this.ev.push(ev);
  }
  update(dt) { if (this.phase === 'build') this.timer = Math.max(0, this.timer - dt); for (const e of this.ents) if (e.flash > 0) e.flash -= dt; }
  P(i) { return this.players[i]; }
  cmd(c) { this.conn.send({ t: 'cmd', c }); }
  canPlace(side, c, r) { const p = this.P(side); return !!p && this.phase === 'build' && c >= 0 && c < GRID.cols && r >= 0 && r < GRID.rows && !p.grid[r * GRID.cols + c]; }
  place(side, id, c, r) { if (!this.canPlace(side, c, r) || this.P(side).gold < FBY[id].cost) return null; this.cmd({ a: 'place', id, c, r }); this.P(side).gold -= FBY[id].cost; return true; }
  sell(side, c, r) { if (this.phase !== 'build') return false; this.cmd({ a: 'sell', c, r }); return true; }
  upgrade(side, c, r) { const e = this.P(side).grid[r * GRID.cols + c]; if (!e || e.up || this.P(side).gold < this.upgradeCost(e)) return false; this.cmd({ a: 'upgrade', c, r }); return true; }
  buyWorker(side) { if (this.P(side).gold < this.workerCost(side)) return false; this.cmd({ a: 'worker' }); return true; }
  buyMerc(side, id) { if (this.phase !== 'build' || this.P(side).myth < MBY[id].cost) return false; this.cmd({ a: 'merc', id }); this.P(side).myth -= MBY[id].cost; return true; }
  upgradeNexus(side, kind) { if (this.P(side).myth < this.nexusCost(side, kind)) return false; this.cmd({ a: 'nexus', kind }); return true; }
  setReady(side, v) { this.cmd({ a: 'ready', v }); this.P(side).ready = v; }
}
// reutilizar fórmulas puras de Sim
for (const k of ['T', 'target', 'workerCost', 'value', 'recValue', 'upgradeCost', 'sellValue', 'nexusCost']) NetSim.prototype[k] = Sim.prototype[k];
