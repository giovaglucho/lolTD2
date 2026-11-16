// Simulación pura (sin three.js): se ejecuta igual en el navegador, en el servidor y en Node para equilibrar.
import { GRID, LANE, CFG, CREEPS, WAVES, MERCS, FIGHTERS as LEGACY_FIGHTERS, UPGRADES as LEGACY_UP, waveScale, mercScale } from './data.js';
import { CHAMPIONS, LEGIONS, dmgMul } from './content/index.js';
import { SPELLS, SPELL_BY, SPELL_WAVE } from './content/spells.js';
import { STRAT_BY, STRATEGIES, MASTERMIND } from './content/mastermind.js';

// ─── catálogo de campeones (contenido de legiones + respaldo del MVP) ───
const ROLE_DMG = { Tanque: 'asedio', Luchador: 'asedio', Bruiser: 'asedio', Duelista: 'perforante', Asesino: 'perforante', Tirador: 'perforante', Mago: 'magico', Apoyo: 'magico', Barato: 'perforante' };
const ROLE_ARM = { Tanque: 'fortificada', Luchador: 'fortificada', Bruiser: 'fortificada', Duelista: 'ligera', Asesino: 'ligera', Tirador: 'ligera', Mago: 'arcana', Apoyo: 'arcana', Barato: 'ligera' };
function normDef(d, legion) {
  const o = { ...d, legion: d.legion || legion };
  o.model = o.model || o.id; o.dmgType = o.dmgType || ROLE_DMG[o.role] || 'asedio'; o.armorType = o.armorType || ROLE_ARM[o.role] || 'fortificada';
  o.armor = o.armor ?? 0; o.tier = o.tier || Math.max(1, Math.min(6, Math.round(o.cost / 40)));
  if (o.melee === undefined) o.melee = (o.range || 2) <= 2.6;
  if (!o.upgrades || !o.upgrades.length) o.upgrades = [{ id: o.id + '_up', name: LEGACY_UP[o.id] || (o.name + ' Prestigio'), cost: Math.round(o.cost * CFG.upMul), hp: CFG.upStat, dmg: CFG.upStat, armor: 12, aspd: 1.1, desc: 'Versión de prestigio: mucha más vida y daño.' }];
  if (o.ability && !o.ability.name) o.ability.name = 'Habilidad';
  if (!o.desc) o.desc = (o.ability && o.ability.desc) || '';
  return o;
}
const LEGACY_DEFS = LEGACY_FIGHTERS.map(f => normDef(f, 'legacy'));
export const ALL_FIGHTERS = (() => { const m = new Map(); for (const f of LEGACY_DEFS) m.set(f.id, f); for (const c of CHAMPIONS) m.set(c.id, normDef(c, c.legion)); return [...m.values()]; })();
export const FBY = Object.fromEntries(ALL_FIGHTERS.map(f => [f.id, f]));
export const MBY = Object.fromEntries(MERCS.map(m => [m.id, m]));
const PLAYABLE = LEGIONS.filter(l => l.champions && l.champions.length >= 4);
export const playableLegions = () => PLAYABLE.map(l => l.id);
export function legionRoster(legion) {
  const ids = CHAMPIONS.filter(c => c.legion === legion).map(c => c.id);
  return (ids.length ? ids : LEGACY_DEFS.map(f => f.id)).sort((a, b) => FBY[a].cost - FBY[b].cost);
}
function rollRandom(n) { const pool = (CHAMPIONS.length >= n ? CHAMPIONS.map(c => c.id) : ALL_FIGHTERS.map(f => f.id)); const a = [...pool]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n).sort((x, y) => FBY[x].cost - FBY[y].cost); }

export const cellPos = (c, r) => ({ x: (c - (GRID.cols - 1) / 2) * GRID.cell, z: GRID.z0 + (r + .5) * GRID.cell });
let LANES = [-36, 36];
// Distribución de carriles: 2 (1v1) o 4 (2v2). Carriles 0,1 = equipo azul en 2v2; 2,3 = equipo rojo.
export function setLayout(n) { LANES = n === 4 ? [-114, -38, 38, 114] : [-36, 36]; }
export const laneX = i => LANES[i];
export const laneCount = () => LANES.length;
export const teamOfLane = (i, n = LANES.length) => (n === 4 ? (i < 2 ? 0 : 1) : i);
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const P_ = (e, type) => { if (!e.passives) return null; for (const p of e.passives) if (p.type === type) return p; return null; };

export class Sim {
  // opts: { lanes: 2|4, players: [{ name, bot, diff, legion ('random'|'invocador'|id), strategy }] }
  constructor(opts = {}) {
    const n = opts.lanes === 4 ? 4 : 2; this.n = n;
    this.t = 0; this.wave = 0; this.phase = 'build'; this.timer = CFG.buildTime;
    this.ents = []; this.projs = []; this.delayed = []; this.ev = []; this.nid = 1; this.over = null; this.combatT = 0;
    const nexMax = n === 4 ? CFG.nexusHp2v2 : CFG.nexusHp;
    this.teams = [0, 1].map(t => ({ t, hp: nexMax, max: nexMax, upg: { hp: 0, atk: 0, regen: 0 } }));
    const legs = playableLegions();
    this.players = [...Array(n).keys()].map(side => {
      const po = (opts.players || [])[side] || {};
      let legion = po.legion || 'random';
      if (legion === 'random') legion = legs.length ? legs[Math.floor(Math.random() * legs.length)] : 'legacy';
      if (legion !== 'invocador' && legion !== 'legacy' && !legs.includes(legion)) legion = legs[0] || 'legacy';
      const p = { side, team: teamOfLane(side, n), name: po.name || ('Jugador ' + (side + 1)), bot: !!po.bot, diff: po.diff || 'normal', legion,
        gold: CFG.startGold, myth: CFG.startMyth, income: CFG.baseIncome, workers: CFG.startWorkers, mythMul: 1,
        grid: new Array(GRID.cols * GRID.rows).fill(null), queue: [], ready: false, nexusCd: 0, kills: 0, leaks: 0, sent: 0, dealt: 0,
        roll: [], strategy: null, sellRate: .5, rerolls: 0, piggy: 0, piggyRate: 0, incomeAfter: null, spell: null, spellOffer: null, incomeOnce: 0,
        nexus: { isNexus: true, x: 0, z: LANE.nexusZ, r: 2.4, lane: side } };
      if (legion === 'invocador') {
        const st = STRAT_BY[po.strategy] || STRATEGIES[Math.floor(Math.random() * STRATEGIES.length)]; p.strategy = st.id; const f = st.fx;
        p.income += f.income || 0; if (f.sellRate) p.sellRate = f.sellRate; if (f.piggy) { p.piggy = f.piggy.start; p.piggyRate = f.piggy.rate; }
        if (f.incomeAfter) p.incomeAfter = { ...f.incomeAfter, done: false }; p.rerolls = f.rerolls || 0; p.rerollEachWave = !!f.rerollEachWave; p.championBuff = f.championBuff || 0;
        p.roll = rollRandom(MASTERMIND.rollSize);
      } else p.roll = legionRoster(legion);
      return p;
    });
  }
  target(side) { return (side + this.n / 2) % this.n; } // carril que recibe los mercenarios de `side`
  T(side) { return this.teams[this.players[side].team]; }
  workerCost(side) { return CFG.pcost + this.P(side).workers * CFG.pcostStep; }
  value(side) { return this.P(side).grid.reduce((a, e) => a + (e ? e.value : 0), 0); }
  recValue(w = this.wave) { return Math.round(CFG.recBase * Math.pow(1.16, w)); }
  emit(type, d = {}) { d.type = type; this.ev.push(d); }
  P(side) { return this.players[side]; }

  // ─── acciones del jugador ───
  canPlace(side, c, r) { return this.phase === 'build' && c >= 0 && c < GRID.cols && r >= 0 && r < GRID.rows && !this.P(side).grid[r * GRID.cols + c]; }
  place(side, id, c, r) {
    const d = FBY[id], p = this.P(side);
    if (!d || !this.canPlace(side, c, r) || p.gold < d.cost || !p.roll.includes(id)) return null;
    p.gold -= d.cost;
    const e = this.mkEnt({ lane: side, team: 'def', def: d, kind: 'fighter', owner: side, pos: cellPos(c, r), cell: [c, r], radius: .75 });
    e.value = d.cost; e.fresh = d.cost;
    p.grid[r * GRID.cols + c] = e;
    this.emit('place', { e });
    return e;
  }
  upgradeCost(e, idx = 0) { const u = e.def.upgrades[idx]; return u ? u.cost : Infinity; }
  upgrade(side, c, r, idx = 0) {
    const p = this.P(side), e = p.grid[r * GRID.cols + c];
    if (!e || e.up || this.phase !== 'build') return false; const u = e.def.upgrades[idx]; if (!u || p.gold < u.cost) return false;
    p.gold -= u.cost; e.up = idx + 1; e.upDef = u; e.value += u.cost; e.fresh += u.cost;
    this.applyStats(e);
    if (p.championBuff && !p.championUsed) { p.championUsed = true; e.champBuff = p.championBuff; this.applyStats(e); }
    this.emit('upgrade', { e }); return true;
  }
  applyStats(e) { // recalcula estadísticas base según mejora/hechizo
    const d = e.def, u = e.upDef, cb = e.champBuff || 1;
    e.maxHp = e.hp = d.hp * (u ? u.hp ?? 1.9 : 1) * cb; e.dmg = d.dmg * (u ? u.dmg ?? 1.9 : 1) * cb; e.aspd = d.aspd * (u ? u.aspd ?? 1 : 1) * cb;
    e.armor = (d.armor || 0) + (u ? u.armor || 0 : 0); e.range = d.range + (u ? u.range || 0 : 0);
    e.ab = d.ability ? { ...d.ability, ...(u && u.ability ? u.ability : {}) } : null;
    e.proj = (u && u.proj) || d.proj;
    e.passives = [d.passive, u && u.passive, e.spellPassive].filter(Boolean);
    e.stat = e.spellStats || null;
  }
  sellValue(e) { const rate = this.P(e.owner).sellRate; return Math.round(e.fresh + (e.value - e.fresh) * rate); }
  sell(side, c, r) {
    const p = this.P(side), e = p.grid[r * GRID.cols + c];
    if (!e || this.phase !== 'build') return false;
    const v = this.sellValue(e); p.gold += v; p.grid[r * GRID.cols + c] = null;
    this.ents.splice(this.ents.indexOf(e), 1); this.emit('sell', { e, v });
    return true;
  }
  buyWorker(side) {
    const p = this.P(side), c = this.workerCost(side);
    if (p.workers >= CFG.maxP || p.gold < c) return false;
    p.gold -= c; p.workers++; this.emit('worker', { side }); return true;
  }
  buyMerc(side, id) {
    const m = MBY[id], p = this.P(side);
    if (!m || this.phase !== 'build' || p.myth < m.cost) return false;
    p.myth -= m.cost; p.income += m.inc; p.sent += m.cost; p.queue.push(m); this.emit('merc', { side, m }); return true;
  }
  nexusCost(side, kind) { return Math.round(CFG.nexUp[kind] * (this.T(side).upg[kind] + 1)); }
  upgradeNexus(side, kind) {
    const p = this.P(side), T = this.T(side); if (!(kind in T.upg) || T.upg[kind] >= 5) return false;
    const c = this.nexusCost(side, kind); if (p.myth < c) return false;
    p.myth -= c; T.upg[kind]++; if (kind === 'hp') { T.max += 500; T.hp += 500; }
    this.emit('nexusUp', { side, kind, lvl: T.upg[kind] }); return true;
  }
  reroll(side) { const p = this.P(side); if (p.legion !== 'invocador' || p.rerolls <= 0 || this.phase !== 'build') return false; p.rerolls--; p.roll = rollRandom(MASTERMIND.rollSize); this.emit('roll', { side }); return true; }
  breakPiggy(side) { const p = this.P(side); if (!p.piggy) return false; p.gold += Math.round(p.piggy); this.emit('piggy', { side, v: Math.round(p.piggy) }); p.piggy = 0; p.piggyRate = 0; return true; }
  chooseSpell(side, id, c, r) {
    const p = this.P(side), s = SPELL_BY[id]; if (!s || p.spell || !p.spellOffer || !p.spellOffer.includes(id)) return false;
    if (s.target === 'unit') {
      const e = p.grid[r * GRID.cols + c]; if (!e) return false;
      e.spell = id; e.spellPassive = s.fx.passive || null; e.spellStats = s.fx.stats || null; e.immune = !!s.fx.immune; if (s.fx.stats && s.fx.stats.cdr) e.cdr = s.fx.stats.cdr;
      this.applyStats(e); this.emit('spell', { side, id, e });
    } else { if (s.fx.team.mythMul) p.mythMul = s.fx.team.mythMul; if (s.fx.team.incomeOnce) p.incomeOnce = 1; this.emit('spell', { side, id }); }
    p.spell = id; p.spellOffer = null; return true;
  }
  setReady(side, v = true) { this.P(side).ready = v; }
  command(side, c) {
    switch (c.a) {
      case 'place': return !!this.place(side, c.id, c.c, c.r);
      case 'sell': return this.sell(side, c.c, c.r);
      case 'upgrade': return this.upgrade(side, c.c, c.r, c.i || 0);
      case 'worker': return this.buyWorker(side);
      case 'merc': return this.buyMerc(side, c.id);
      case 'nexus': return this.upgradeNexus(side, c.kind);
      case 'reroll': return this.reroll(side);
      case 'piggy': return this.breakPiggy(side);
      case 'spell': return this.chooseSpell(side, c.id, c.c, c.r);
      case 'ready': if (this.phase === 'build') this.setReady(side, !!c.v); return true;
    }
    return false;
  }

  mkEnt(o) {
    const d = o.def;
    const e = {
      id: this.nid++, lane: o.lane, team: o.team, kind: o.kind, owner: o.owner, def: d, cell: o.cell || null,
      x: o.pos.x, z: o.pos.z, hx: o.pos.x, hz: o.pos.z, face: o.team === 'def' ? Math.PI : 0,
      maxHp: d.hp * (o.hpMul || 1), hp: d.hp * (o.hpMul || 1), dmg: d.dmg * (o.dmgMul || 1), aspd: d.aspd, range: d.range, speed: d.speed, armor: d.armor || 0,
      dmgType: d.dmgType || 'asedio', armorType: d.armorType || 'fortificada',
      radius: o.radius, ck: o.ck || null, up: 0, ab: d.ability || null, abCd: d.ability ? Math.random() * 2 + 1 : 0, cd: Math.random() * .5, atkT: -1, hit: false, castT: 0,
      stun: 0, slow: 0, slowAmt: 0, dot: 0, dotDps: 0, dotT: 0, tgt: null, moving: false, dead: false, deathT: 0, rt: 0, proj: d.proj, boss: !!d.boss, s: d.s || 1,
      shield: 0, shieldT: 0, buffs: [], atkN: 0, ramp: 0, stealthT: 0, stealthMul: 0, tauntT: 0, undyingT: 0, used: {}, passives: d.passive ? [d.passive] : [], mod: { aspd: 1, dmg: 1, armor: 0, speed: 1 },
    };
    if (o.kind === 'fighter') this.applyStats(e);
    this.ents.push(e); return e;
  }
  spawnCreep(lane, cid, o) {
    const d = CREEPS[cid];
    return this.mkEnt({ lane, team: 'att', def: d, kind: o.owner === 'wave' ? 'creep' : 'merc', owner: o.owner, pos: o.pos, hpMul: o.mul, dmgMul: Math.pow(o.mul, .8), radius: Math.min(1.5, .45 * d.s + .15), ck: cid });
  }

  startCombat() {
    this.phase = 'combat'; this.combatT = 0;
    const w = WAVES[this.wave], sc = waveScale(this.wave + 1), ms = mercScale(this.wave + 1);
    for (let lane = 0; lane < this.n; lane++) {
      let idx = 0;
      for (const g of w.g) for (let i = 0; i < g.n; i++, idx++) {
        const per = 9, col = idx % per, row = Math.floor(idx / per);
        this.spawnCreep(lane, g.c, { owner: 'wave', mul: sc, pos: { x: (col - (per - 1) / 2) * 2.0 + (row % 2) * .9, z: LANE.spawnZ - row * 2.2 } });
      }
      let mi = 0;
      const src = this.players.find(q => this.target(q.side) === lane).side;
      for (const m of this.P(src).queue) for (let i = 0; i < m.n; i++, mi++) {
        const col = mi % 8, row = Math.floor(mi / 8);
        this.spawnCreep(lane, m.c, { owner: src, mul: ms, pos: { x: (col - 3.5) * 2.0, z: LANE.spawnZ - 9 - row * 2.2 } });
      }
    }
    for (const p of this.players) p.queue = [];
    for (const e of this.ents) if (e.team === 'def') { const sp = P_(e, 'shieldStart'); if (sp) { e.shield = e.maxHp * sp.pct; e.shieldT = 999; } }
    this.emit('combat', { wave: this.wave });
  }

  endCombat() {
    this.phase = 'build';
    const w = this.wave; this.wave++;
    for (const p of this.players) {
      let inc = p.income;
      if (p.incomeAfter && !p.incomeAfter.done && this.wave >= p.incomeAfter.wave) { p.income += p.incomeAfter.amt; p.incomeAfter.done = true; inc = p.income; }
      if (p.incomeOnce === 1) { inc *= 2; p.incomeOnce = 2; }
      p.gold += Math.max(0, inc) + 60 + w * 28; p.ready = false;
      if (p.piggyRate) p.piggy *= 1 + p.piggyRate;
      for (const e of p.grid) if (e) e.fresh = 0;
      if (p.rerollEachWave && p.legion === 'invocador') p.roll = rollRandom(MASTERMIND.rollSize);
      if (this.wave === SPELL_WAVE && !p.spell) { const a = [...SPELLS].sort(() => Math.random() - .5); p.spellOffer = a.slice(0, 3).map(s => s.id); this.emit('spellOffer', { side: p.side }); }
    }
    for (const e of this.ents) if (e.team === 'def' && e.kind === 'fighter') {
      const was = e.dead; e.dead = false; e.hp = e.maxHp; e.x = e.hx; e.z = e.hz; e.stun = e.slow = e.dot = 0; e.tgt = null; e.atkT = -1; e.abCd = Math.min(e.abCd, 1.5); e.face = Math.PI;
      e.shield = 0; e.buffs = []; e.ramp = 0; e.stealthT = 0; e.tauntT = 0; e.undyingT = 0; e.used = {}; e.atkN = 0;
      if (was) this.emit('revive', { e });
    }
    this.ents = this.ents.filter(e => e.team === 'def' && e.kind === 'fighter');
    this.projs.length = 0; this.delayed.length = 0;
    this.timer = CFG.buildTime;
    this.emit('wave_end', { wave: w });
    if (this.wave >= CFG.totalWaves) this.finish(this.teams[0].hp / this.teams[0].max >= this.teams[1].hp / this.teams[1].max ? 0 : 1, 'waves');
  }
  finish(winner, why) { if (this.over) return; this.over = { winner, why }; this.phase = 'over'; this.emit('over', { winner, why }); }

  // ─── daño ───
  hurt(src, t, amt, o = {}) {
    if (t.dead || this.over) return 0;
    if (src && src.mod && !o.noMod) amt *= src.mod.dmg;
    if (!o.raw) {
      if (src && src.dmgType && !t.isNexus) amt *= dmgMul(src.dmgType, t.armorType);
      amt *= 100 / (100 + Math.max(-50, (t.armor || 0) + (t.mod ? t.mod.armor : 0)));
    }
    if (src && src.passives) { const bb = P_(src, 'bossbane'); if (bb && (t.boss || (t.def && t.def.s >= 1.5))) amt *= bb.mul; }
    if (t.isNexus) {
      amt *= .45; // las estructuras reciben menos daño
      const p = this.P(t.lane), T = this.T(t.lane); T.hp = Math.max(0, T.hp - amt); p.leaks++;
      this.emit('hit', { t, amt, nexus: true });
      if (T.hp <= 0) this.finish(1 - p.team, 'nexus');
      return amt;
    }
    if (t.shield > 0) { const ab = Math.min(t.shield, amt); t.shield -= ab; amt -= ab; if (ab > 0 && amt <= 0) { this.emit('hit', { t, amt: 0, src, shield: ab }); return 0; } }
    t.hp -= amt; t.flash = .12;
    if (src && src.owner !== undefined && src.team === 'def' && typeof src.owner === 'number') this.P(src.owner).dealt += amt;
    this.emit('hit', { t, amt, src, big: o.big, crit: o.crit });
    // espinas
    if (o.basic && src && src.def && src.def.melee && t.passives) { const th = P_(t, 'thorns'); if (th) this.hurt(t, src, amt * th.pct, { raw: true, noMod: true }); }
    if (o.basic && src && src.passives) { const ls = P_(src, 'lifesteal'); if (ls && !src.dead) src.hp = Math.min(src.maxHp, src.hp + amt * ls.pct); }
    // curación de emergencia (hechizo Curar)
    if (t.hp > 0 && t.passives) { const eh = P_(t, 'emergencyHeal'); if (eh && !t.used.eh && t.hp < t.maxHp * eh.below) { t.used.eh = 1; for (const a of this.alliesIn(t, t.x, t.z, eh.r)) a.hp = Math.min(a.maxHp, a.hp + a.maxHp * eh.pct); this.emit('heal', { e: t, t, amt: t.maxHp * eh.pct, fx: 'heal' }); } }
    if (t.hp <= 0) {
      if (t.undyingT > 0) { t.hp = 1; return amt; }
      const ud = t.passives && P_(t, 'undying'); if (ud && !t.used.undying) { t.used.undying = 1; t.hp = 1; t.undyingT = ud.dur || 4; this.emit('undying', { e: t }); return amt; }
      const rv = t.passives && P_(t, 'revive'); if (rv && !t.used.revive) { t.used.revive = 1; t.hp = t.maxHp * (rv.pct || .5); t.stun = 1.5; this.emit('reborn', { e: t }); return amt; }
      this.die(t, src);
    }
    return amt;
  }
  die(t, src) {
    t.dead = true; t.deathT = 0; t.hp = 0; this.emit('death', { e: t });
    if (t.team === 'att' && t.owner === 'wave') { const p = this.P(t.lane); p.gold += Math.round(t.def.bounty * Math.pow(waveScale(this.wave + 1), .5)); p.kills++; }
    if (t.boss && src && src.passives) { const bb = P_(src, 'bossbane'); if (bb && bb.gold && typeof src.owner === 'number') this.P(src.owner).gold += bb.gold; }
  }
  foesOf(e) { return this.ents.filter(o => !o.dead && o.lane === e.lane && o.team !== e.team && !(o.stealthT > 0)); }
  inCircle(e, x, z, r) { return this.ents.filter(o => !o.dead && o.lane === e.lane && o.team !== e.team && Math.hypot(o.x - x, o.z - z) <= r + o.radius * .6); }
  alliesIn(e, x, z, r) { return this.ents.filter(o => !o.dead && o.lane === e.lane && o.team === e.team && Math.hypot(o.x - x, o.z - z) <= r); }
  applyDot(t, dps, dur, src) { if (t.dead) return; if (dps * dur >= t.dotDps * t.dot) { t.dotDps = dps; t.dot = dur; t.dotSrc = src; } }
  applySlow(t, amt, dur) { if (t.immune) return; t.slow = Math.max(t.slow, dur); t.slowAmt = Math.max(t.slow > 0 ? t.slowAmt : 0, amt); }
  applyStun(t, dur) { if (t.immune || t.isNexus) return; t.stun = Math.max(t.stun, dur); }

  // ─── habilidades activas ───
  tryAbility(e, tgt) {
    const a = e.ab; if (!a || e.abCd > 0) return false;
    const mul = e.dmg / e.def.dmg, D = v => (v || 0) * mul;
    let ok = false;
    switch (a.type) {
      case 'spin': {
        const fs = this.inCircle(e, e.x, e.z, a.r); if (!fs.length) break;
        const hits = a.hits || 1, per = (a.dur || 1) / hits;
        for (let i = 0; i < hits; i++) this.delayed.push({ t: i * per + .01, fn: () => { if (e.dead) return; this.inCircle(e, e.x, e.z, a.r).forEach(f => { this.hurt(e, f, D(a.dmg) / (hits > 1 ? Math.sqrt(hits) : 1), { big: 1 }); if (a.slow) this.applySlow(f, a.slow, a.slowT || 1.5); if (a.stun) this.applyStun(f, a.stun); }); this.emit('aoe', { x: e.x, z: e.z, r: a.r, fx: a.fx, color: a.color, e, small: i > 0 }); } });
        if (hits > 1) e.channelT = a.dur || 1; ok = true; break;
      }
      case 'nova': {
        if (!tgt) break;
        let tt = tgt; if (a.tgtFar) tt = this.foesOf(e).filter(f => dist(e, f) <= e.range + 3).sort((p, q) => dist(e, q) - dist(e, p))[0] || tgt;
        const cx = a.self ? e.x : tt.x, cz = a.self ? e.z : tt.z;
        if (a.self && !this.inCircle(e, cx, cz, a.r).length) break;
        const dl = a.delay ?? (a.self ? .15 : .35);
        if (!a.self) this.emit('lob', { x0: e.x, z0: e.z, x1: cx, z1: cz, t: dl, fx: a.fx, color: a.color, e, r: a.r });
        this.delayed.push({ t: dl, fn: () => {
          this.inCircle(e, cx, cz, a.r).forEach(f => { this.hurt(e, f, D(a.dmg), { big: 1 }); if (a.stun) this.applyStun(f, a.stun); if (a.slow) this.applySlow(f, a.slow, a.slowT || 2); });
          this.emit('aoe', { x: cx, z: cz, r: a.r, fx: a.fx, color: a.color, e });
        } });
        ok = true; break;
      }
      case 'global': {
        const fs = this.foesOf(e); if (!fs.length) break; const tt = fs.sort((p, q) => q.hp - p.hp)[0], cx = tt.x, cz = tt.z;
        this.emit('lob', { x0: e.x, z0: e.z, x1: cx, z1: cz, t: .7, fx: a.fx || 'rocket', color: a.color, e, r: a.r || 3, big: 1 });
        this.delayed.push({ t: .7, fn: () => { this.inCircle(e, cx, cz, a.r || 3).forEach(f => { this.hurt(e, f, D(a.dmg), { big: 1 }); if (a.stun) this.applyStun(f, a.stun); }); this.emit('aoe', { x: cx, z: cz, r: a.r || 3, fx: a.fx || 'rocket', color: a.color, e, big: 1 }); } });
        ok = true; break;
      }
      case 'volley': {
        if (!tgt) break;
        const fs = this.foesOf(e).filter(f => dist(e, f) <= e.range + 1).sort((p, q) => dist(e, p) - dist(e, q)).slice(0, a.n || 5);
        fs.forEach((f, i) => this.projs.push({ id: this.nid++, x: e.x, z: e.z, y: 1.2, tgt: f, speed: 20 + i, dmg: D(a.dmg), color: a.color || (e.proj && e.proj.color) || 0xbff0ff, size: .15, shape: (e.proj && e.proj.shape) || 'arrow', src: e, slow: a.slow, slowT: a.slowT, delay: i * .06, ab: true }));
        if (fs.length) ok = true; break;
      }
      case 'beam': {
        if (!tgt) break;
        const dx = tgt.x - e.x, dz = tgt.z - e.z, L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L;
        this.emit('beam', { x: e.x, z: e.z, ux, uz, len: a.len || 14, w: a.w || 1.2, fx: a.fx, color: a.color, e });
        this.delayed.push({ t: .25, fn: () => { for (const f of this.foesOf(e)) { const px = f.x - e.x, pz = f.z - e.z, al = px * ux + pz * uz, pe = Math.abs(px * uz - pz * ux); if (al > 0 && al < (a.len || 14) && pe < (a.w || 1.2) + f.radius * .5) { this.hurt(e, f, D(a.dmg), { big: 1 }); if (a.stun) this.applyStun(f, a.stun); if (a.slow) this.applySlow(f, a.slow, a.slowT || 2); } } } });
        ok = true; break;
      }
      case 'chain': {
        if (!tgt) break;
        const hit = [tgt]; let cur = tgt; const n = a.n || 4;
        while (hit.length < n) { const nx = this.foesOf(e).filter(f => !hit.includes(f) && dist(cur, f) < 6).sort((p, q) => dist(cur, p) - dist(cur, q))[0]; if (!nx) break; hit.push(nx); cur = nx; }
        const pts = [{ x: e.x, z: e.z }, ...hit.map(h => ({ x: h.x, z: h.z }))];
        this.emit('chain', { e, pts, fx: a.fx, color: a.color });
        hit.forEach((h, i) => this.delayed.push({ t: .08 * i + .05, fn: () => { this.hurt(e, h, D(a.dmg) * Math.pow(a.decay ?? .85, i), { big: 1 }); if (a.stun) this.applyStun(h, a.stun); if (a.slow) this.applySlow(h, a.slow, a.slowT || 2); } }));
        ok = true; break;
      }
      case 'heal': {
        const al = this.ents.filter(o => !o.dead && o.lane === e.lane && o.team === e.team && o.hp < o.maxHp * .88 && dist(e, o) <= (a.range || 10)).sort((p, q) => p.hp / p.maxHp - q.hp / q.maxHp).slice(0, a.n || 1);
        if (!al.length) break; for (const x of al) { const h = (a.heal || 100) * mul; x.hp = Math.min(x.maxHp, x.hp + h); this.emit('heal', { e, t: x, amt: h, fx: a.fx || 'heal', color: a.color }); } ok = true; break;
      }
      case 'shield': {
        const al = a.self ? [e] : this.ents.filter(o => !o.dead && o.lane === e.lane && o.team === e.team && dist(e, o) <= (a.range || 9)).sort((p, q) => p.hp / p.maxHp - q.hp / q.maxHp).slice(0, a.n || 1);
        if (!al.length || (!a.self && !tgt && al[0].hp > al[0].maxHp * .9)) break;
        for (const x of al) { x.shield = Math.max(x.shield, (a.amt || 150) * mul); x.shieldT = a.dur || 4; this.emit('shield', { e, t: x, fx: a.fx || 'holy', color: a.color }); } ok = true; break;
      }
      case 'buff': {
        if (!tgt) break; const al = this.alliesIn(e, e.x, e.z, a.r || 6);
        for (const x of al) x.buffs.push({ stat: a.stat || 'aspd', amt: a.amt || .3, t: a.dur || 4 });
        this.emit('aoe', { x: e.x, z: e.z, r: a.r || 6, fx: a.fx || 'holy', color: a.color, e, buff: 1 }); ok = true; break;
      }
      case 'strike': {
        if (!tgt) break; let d = D(a.dmg); if (a.exec && tgt.hp < tgt.maxHp * a.exec) d *= a.execMul || 2;
        this.hurt(e, tgt, d, { big: 1 }); if (a.stun) this.applyStun(tgt, a.stun); this.emit('aoe', { x: tgt.x, z: tgt.z, r: 1.6, fx: a.fx, color: a.color, e }); ok = true; break;
      }
      case 'stun': {
        if (!tgt) break; this.hurt(e, tgt, D(a.dmg), { big: 1 }); this.applyStun(tgt, a.stun || 1.5); this.emit('aoe', { x: tgt.x, z: tgt.z, r: 1.8, fx: a.fx, color: a.color, e }); ok = true; break;
      }
      case 'poison': {
        if (!tgt) break; this.applyDot(tgt, (a.dps || 15) * mul, a.t || 4, e); if (a.dmg) this.hurt(e, tgt, D(a.dmg)); this.emit('poison', { e, t: tgt, fx: a.fx, color: a.color }); ok = true; break;
      }
      case 'dash': {
        const far = this.foesOf(e).filter(f => dist(e, f) < (a.range || 11)).sort((p, q) => dist(e, q) - dist(e, p))[0]; if (!far) break;
        const dx = far.x - e.x, dz = far.z - e.z, L = Math.hypot(dx, dz) || 1, x0 = e.x, z0 = e.z;
        e.x = far.x - dx / L * 1.2; e.z = far.z - dz / L * 1.2; e.face = Math.atan2(dx, dz); e.tgt = far;
        this.emit('dash', { e, x0, z0, x1: e.x, z1: e.z, fx: a.fx, color: a.color });
        const fs = a.r ? this.inCircle(e, far.x, far.z, a.r) : [far];
        fs.forEach(f => { this.hurt(e, f, D(a.dmg), { big: 1 }); if (a.stun) this.applyStun(f, a.stun); });
        if (a.r) this.emit('aoe', { x: far.x, z: far.z, r: a.r, fx: a.fx, color: a.color, e });
        ok = true; break;
      }
      case 'pull': {
        const far = this.foesOf(e).filter(f => dist(e, f) < (a.range || 9) && dist(e, f) > 2.5 && !f.boss).sort((p, q) => dist(e, q) - dist(e, p))[0]; if (!far) break;
        const x0 = far.x, z0 = far.z, dx = far.x - e.x, dz = far.z - e.z, L = Math.hypot(dx, dz) || 1;
        far.x = e.x + dx / L * 1.6; far.z = e.z + dz / L * 1.6; this.applyStun(far, a.stun || 1); this.hurt(e, far, D(a.dmg), { big: 1 }); e.tgt = far;
        this.emit('pull', { e, x0, z0, x1: far.x, z1: far.z, fx: a.fx, color: a.color }); ok = true; break;
      }
      case 'taunt': {
        const fs = this.inCircle(e, e.x, e.z, a.r || 4); if (!fs.length) break;
        for (const f of fs) { f.tgt = e; f.tauntT = a.dur || 2.5; }
        e.buffs.push({ stat: 'armor', amt: a.armor || 30, t: a.dur || 2.5 });
        this.emit('aoe', { x: e.x, z: e.z, r: a.r || 4, fx: a.fx || 'sun', color: a.color, e, taunt: 1 }); ok = true; break;
      }
      case 'summon': {
        if (!tgt) break; const u = a.unit || {}; const n = a.n || 1;
        for (let i = 0; i < n; i++) {
          const ang = (i / n) * Math.PI * 2, d = { id: u.model || 'summon', name: u.name || 'Invocación', hp: (u.hp || 300) * mul, dmg: (u.dmg || 30) * mul, aspd: u.aspd || 1, range: u.range || 2, speed: u.speed || 3.4, armor: u.armor || 10,
            melee: u.melee ?? true, model: u.model || 'summon', s: u.s || 1, dmgType: u.dmgType || e.dmgType, armorType: u.armorType || 'natural', proj: u.proj, k: u.model };
          const s = this.mkEnt({ lane: e.lane, team: 'def', def: d, kind: 'summon', owner: e.owner, pos: { x: e.x + Math.sin(ang) * 1.6, z: e.z - 1.4 + Math.cos(ang) * .8 }, radius: .6 * (u.s || 1) });
          s.lifeT = u.dur || 12; s.hx = s.x; s.hz = s.z; s.summoner = e.id; this.emit('summon', { e, s, fx: a.fx, color: a.color });
        }
        ok = true; break;
      }
      case 'stealth': {
        if (!tgt) break; e.stealthT = a.dur || 2.5; e.stealthMul = a.mul || 2; for (const o of this.ents) if (o.tgt === e) o.tgt = null; this.emit('stealth', { e, fx: a.fx, color: a.color }); ok = true; break;
      }
    }
    if (ok) { e.abCd = a.cd * (e.cdr || 1); e.castT = .45; if (a.type !== 'heal' && a.type !== 'shield') this.emit('cast', { e, a }); }
    return ok;
  }

  // ─── bucle ───
  update(dt) {
    if (this.over) { this.t += dt; return; }
    this.t += dt;
    for (let i = this.delayed.length - 1; i >= 0; i--) { const d = this.delayed[i]; d.t -= dt; if (d.t <= 0) { this.delayed.splice(i, 1); d.fn(); } }
    for (const e of this.ents) { if (e.flash > 0) e.flash -= dt; }
    for (const p of this.players) p.myth += p.workers * CFG.mythRate * p.mythMul * dt;
    if (this.phase === 'build') {
      for (const T of this.teams) T.hp = Math.min(T.max, T.hp + T.upg.regen * CFG.regenPer * dt);
      this.timer -= dt;
      if (this.timer <= 0 || this.players.every(p => p.ready)) {
        for (const p of this.players) if (p.spellOffer) this.autoSpell(p.side); // si no eligió a tiempo, se elige solo
        this.startCombat();
      }
      return;
    }
    this.combatT += dt;
    this.computeMods(dt);
    for (const e of this.ents) this.stepEnt(e, dt);
    this.separate(dt);
    this.stepProjs(dt);
    for (const p of this.players) this.stepNexus(p, dt);
    this.ents = this.ents.filter(e => !(e.dead && e.team === 'att' && e.deathT > 2) && !(e.kind === 'summon' && e.dead && e.deathT > 1.5));
    if (!this.over && !this.ents.some(e => e.team === 'att' && !e.dead) && this.combatT > 1) this.endCombat();
    else if (this.combatT > 150) { for (const e of this.ents) if (e.team === 'att' && !e.dead) { e.speed *= 1.0005; e.dmg *= 1.0004; } }
  }
  autoSpell(side) {
    const p = this.P(side); if (!p.spellOffer) return;
    const best = p.grid.filter(Boolean).sort((a, b) => b.value - a.value)[0];
    const id = p.spellOffer.find(s => SPELL_BY[s].target === 'team') || p.spellOffer[0];
    if (SPELL_BY[id].target === 'unit' && !best) { p.spellOffer = null; return; }
    this.chooseSpell(side, id, best ? best.cell[0] : 0, best ? best.cell[1] : 0);
  }
  computeMods(dt) {
    const alive = this.ents.filter(e => !e.dead);
    for (const e of alive) {
      const m = e.mod; m.aspd = 1; m.dmg = 1; m.armor = 0; m.speed = 1;
      if (e.stat) { m.aspd *= e.stat.aspd || 1; m.dmg *= e.stat.dmg || 1; m.armor += e.stat.armor || 0; m.speed *= e.stat.speed || 1; }
      for (let i = e.buffs.length - 1; i >= 0; i--) { const b = e.buffs[i]; b.t -= dt; if (b.t <= 0) { e.buffs.splice(i, 1); continue; } if (b.stat === 'armor') m.armor += b.amt; else m[b.stat] *= 1 + b.amt; }
      if (e.ramp) m.aspd *= 1 + e.ramp;
      const rg = e.passives.length ? P_(e, 'rage') : null; if (rg && e.hp < e.maxHp * rg.below) m.aspd *= 1 + rg.aspd;
      if (e.shieldT > 0) { e.shieldT -= dt; if (e.shieldT <= 0) e.shield = 0; }
    }
    for (const e of alive) {
      if (!e.passives.length) continue;
      const au = P_(e, 'aura'); if (au) for (const a of alive) if (a.lane === e.lane && a.team === e.team && Math.hypot(a.x - e.x, a.z - e.z) <= au.r) { if (au.stat === 'armor') a.mod.armor += au.amt; else a.mod[au.stat] *= 1 + au.amt; }
      const ex = P_(e, 'exhaustAura'); if (ex) for (const a of alive) if (a.lane === e.lane && a.team !== e.team && Math.hypot(a.x - e.x, a.z - e.z) <= ex.r) { a.mod.dmg *= 1 - ex.dmg; a.mod.speed *= 1 - ex.slow; }
    }
  }

  stepNexus(p, dt) {
    p.nexusCd -= dt; if (p.nexusCd > 0 || this.T(p.side).hp <= 0) return;
    let best = null, bd = 11;
    for (const e of this.ents) if (!e.dead && e.lane === p.side && e.team === 'att') { const d = Math.hypot(e.x - p.nexus.x, e.z - p.nexus.z); if (d < bd) { bd = d; best = e; } }
    if (best) { p.nexusCd = .9; const dmg = 150 * (1 + .4 * this.wave) * (1 + .35 * this.T(p.side).upg.atk); this.emit('nexusShot', { side: p.side, t: best }); this.hurt({ nexus: true }, best, dmg, { raw: false }); }
  }

  stepEnt(e, dt) {
    if (e.dead) { e.deathT += dt; return; }
    if (e.kind === 'summon') { e.lifeT -= dt; if (e.lifeT <= 0) { this.die(e, null); return; } }
    if (e.undyingT > 0) { e.undyingT -= dt; if (e.undyingT <= 0) { this.die(e, null); return; } }
    if (e.dot > 0) { e.dot -= dt; e.dotT -= dt; if (e.dotT <= 0) { e.dotT = .5; this.hurt(e.dotSrc, e, e.dotDps * .5, { raw: true, noMod: true }); if (e.dead) return; } }
    const rgn = e.passives.length ? P_(e, 'regen') : null; if (rgn) e.hp = Math.min(e.maxHp, e.hp + rgn.hps * dt);
    e.abCd -= dt; e.cd -= dt; e.castT -= dt; e.rt -= dt; if (e.stealthT > 0) e.stealthT -= dt; if (e.tauntT > 0) e.tauntT -= dt; if (e.channelT > 0) e.channelT -= dt;
    if (e.slow > 0) e.slow -= dt;
    if (e.stun > 0) { e.stun -= dt; e.moving = false; return; }
    const lane = e.lane, P = this.P(lane), def = e.team === 'def', m = e.mod;
    const slowF = (e.slow > 0 ? 1 - e.slowAmt : 1) * m.speed;
    if (e.ab && (e.ab.type === 'heal' || (e.ab.type === 'shield' && !e.ab.self))) this.tryAbility(e, null);
    if (e.channelT > 0) { e.moving = false; return; }
    // retargeting
    if (!e.tgt || e.tgt.dead || (e.tgt.stealthT > 0) || (e.rt <= 0 && !(e.tauntT > 0))) {
      e.rt = .35;
      let best = null, bd = def ? (e.def.melee ? Math.max(9, e.range + 3) : Math.max(e.range + 2.5, 8)) : 11;
      for (const o of this.ents) if (!o.dead && o.lane === lane && o.team !== e.team && !(o.stealthT > 0)) { const d = dist(e, o); if (d < bd) { bd = d; best = o; } }
      if (!best && !def) best = P.nexus;
      if (def && best && Math.hypot(best.x - e.hx, best.z - e.hz) > 14) best = null;
      e.tgt = best;
    }
    if (e.atkT >= 0) {
      e.atkT += dt; const dur = Math.min(.55, .7 / (e.aspd * m.aspd));
      if (!e.hit && e.atkT >= dur * .5) { e.hit = true; this.doHit(e); }
      if (e.atkT >= dur) e.atkT = -1;
      e.moving = false; return;
    }
    const t = e.tgt;
    if (t) {
      const dx = t.x - e.x, dz = t.z - e.z, d = Math.hypot(dx, dz) - e.radius - (t.radius || 0);
      if (e.ab && e.abCd <= 0 && (e.ab.type === 'dash' || e.ab.type === 'pull' || e.ab.type === 'global') && this.tryAbility(e, t)) return;
      if (d <= e.range) {
        e.face = Math.atan2(dx, dz); e.moving = false;
        if (e.ab && e.abCd <= 0 && !['heal', 'dash', 'pull', 'global'].includes(e.ab.type) && this.tryAbility(e, t)) return;
        if (e.cd <= 0) { e.cd = 1 / (e.aspd * m.aspd); e.atkT = 0; e.hit = false; }
        return;
      }
      const L = Math.hypot(dx, dz) || 1, sp = e.speed * slowF * dt;
      e.x += dx / L * sp; e.z += dz / L * sp; e.face = Math.atan2(dx, dz); e.moving = true; return;
    }
    if (def) {
      const dx = e.hx - e.x, dz = e.hz - e.z, L = Math.hypot(dx, dz);
      if (L > .12) { const sp = Math.min(L, e.speed * slowF * dt); e.x += dx / L * sp; e.z += dz / L * sp; e.face = Math.atan2(dx, dz); e.moving = true; }
      else { e.moving = false; e.face += (Math.PI - e.face) * Math.min(1, dt * 6); }
    } else { e.z += e.speed * slowF * dt; e.moving = true; e.face = 0; }
  }

  // golpe básico con pasivas
  doHit(e) {
    const t = e.tgt; if (!t || t.dead) return;
    let dmg = e.dmg, crit = false, big = false;
    if (e.passives.length) {
      const cr = P_(e, 'crit'); if (cr && Math.random() < cr.chance) { dmg *= cr.mul; crit = true; }
      const nt = P_(e, 'nth'); if (nt) { e.atkN++; if (e.atkN % nt.n === 0) { dmg *= nt.mul; big = true; } }
      const ru = P_(e, 'rampup'); if (ru) e.ramp = Math.min(ru.max, e.ramp + ru.per);
      const ex = P_(e, 'execute'); if (ex && t.hp < t.maxHp * ex.below) dmg *= ex.mul;
    }
    if (e.stealthMul) { dmg *= e.stealthMul; e.stealthMul = 0; e.stealthT = 0; big = true; }
    if (e.def.melee) {
      this.hurt(e, t, dmg, { basic: 1, crit, big }); this.onHit(e, t); this.emit('melee', { e, t, crit });
      const cl = P_(e, 'cleave'); if (cl) for (const f of this.inCircle(e, t.x, t.z, cl.r)) if (f !== t) this.hurt(e, f, dmg * cl.pct, { basic: 1 });
    } else {
      const pr = e.proj || {};
      this.projs.push({ id: this.nid++, x: e.x, z: e.z, y: 1.3, tgt: t, speed: pr.speed || 18, dmg, color: pr.color ?? 0xffffff, size: pr.size || .15, shape: pr.shape || 'orb', src: e, crit, big, basic: true });
      const ms = P_(e, 'multishot'); if (ms) this.foesOf(e).filter(f => f !== t && dist(e, f) <= e.range + 1).slice(0, ms.n).forEach(f => this.projs.push({ id: this.nid++, x: e.x, z: e.z, y: 1.3, tgt: f, speed: pr.speed || 18, dmg: dmg * ms.pct, color: pr.color ?? 0xffffff, size: (pr.size || .15) * .8, shape: pr.shape || 'orb', src: e, basic: true }));
    }
  }
  onHit(e, t) {
    if (!e.passives.length || t.dead) return;
    const dot = P_(e, 'onhit_dot'); if (dot) this.applyDot(t, dot.pctMax ? t.maxHp * dot.pctMax : dot.dps * (e.dmg / e.def.dmg), dot.t || 3, e);
    const sl = P_(e, 'onhit_slow'); if (sl) this.applySlow(t, sl.amt, sl.t || 1.5);
    const st = P_(e, 'onhit_stun'); if (st && Math.random() < st.chance) this.applyStun(t, st.t || .8);
  }

  stepProjs(dt) {
    for (let i = this.projs.length - 1; i >= 0; i--) {
      const p = this.projs[i];
      if (p.delay > 0) { p.delay -= dt; continue; }
      const t = p.tgt; if (t.dead && !t.isNexus) { this.projs.splice(i, 1); continue; }
      const dx = t.x - p.x, dz = t.z - p.z, d = Math.hypot(dx, dz), step = p.speed * dt;
      if (d <= step + (t.radius || .5) * .6) {
        this.hurt(p.src, t, p.dmg, { big: p.ab || p.big, crit: p.crit, basic: p.basic });
        if (p.slow) this.applySlow(t, p.slow, p.slowT || 2);
        if (p.basic && !p.src.dead) {
          this.onHit(p.src, t);
          const sp = p.src.passives.length && P_(p.src, 'splash'); if (sp) for (const f of this.inCircle(p.src, t.x, t.z, sp.r)) if (f !== t) this.hurt(p.src, f, p.dmg * sp.pct);
          if (sp) this.emit('aoe', { x: t.x, z: t.z, r: sp.r, fx: 'fire', color: p.color, e: p.src, small: 1 });
        }
        this.emit('impact', { x: t.x, z: t.z, lane: t.lane, color: p.color, size: p.size });
        this.projs.splice(i, 1);
      } else { p.x += dx / d * step; p.z += dz / d * step; p.dir = Math.atan2(dx, dz); }
    }
  }

  separate(dt) {
    const es = this.ents.filter(e => !e.dead);
    for (let i = 0; i < es.length; i++) for (let j = i + 1; j < es.length; j++) {
      const a = es[i], b = es[j]; if (a.lane !== b.lane) continue;
      const dx = b.x - a.x, dz = b.z - a.z, m = a.radius + b.radius;
      if (Math.abs(dx) > m || Math.abs(dz) > m) continue;
      const d = Math.hypot(dx, dz) || .001; if (d >= m) continue;
      const push = (m - d) * .5, wa = this.weight(a), wb = this.weight(b), s = wa + wb || 1;
      const nx = dx / d, nz = dz / d;
      a.x -= nx * push * 2 * wa / s; a.z -= nz * push * 2 * wa / s; b.x += nx * push * 2 * wb / s; b.z += nz * push * 2 * wb / s;
    }
    for (const e of es) { e.x = Math.max(-LANE.half - 3, Math.min(LANE.half + 3, e.x)); e.z = Math.max(LANE.spawnZ - 14, Math.min(LANE.nexusZ + 1, e.z)); }
  }
  weight(e) { if (e.team === 'def' && !e.moving && e.atkT < 0 && Math.hypot(e.x - e.hx, e.z - e.hz) < .6) return .12; return e.boss ? .3 : 1; }
}

// ─── serialización para el modo en línea ───
const slim = e => !e || typeof e !== 'object' ? e : (e.isNexus ? { isNexus: true, lane: e.lane, x: e.x, z: e.z } : e.nexus || e.x === undefined || !e.def ? { nexus: true } :
  { id: e.id, lane: e.lane, x: +e.x.toFixed(2), z: +e.z.toFixed(2), team: e.team, kind: e.kind, owner: e.owner, boss: e.boss, up: e.up,
    def: { id: e.def.id, cost: e.def.cost, bounty: e.def.bounty, s: e.def.s }, ab: e.ab ? { r: e.ab.r, name: e.ab.name } : null });
export function netEvents(evs) { return evs.map(ev => { const o = { ...ev }; for (const k of ['e', 't', 'src', 's']) if (o[k] && typeof o[k] === 'object') o[k] = slim(o[k]); return o; }); }
const r2 = v => Math.round(v * 100) / 100;
export function snapshot(sim) {
  return {
    n: sim.n, ph: sim.phase, tm: r2(sim.timer), wv: sim.wave, ov: sim.over, teams: sim.teams,
    pl: sim.players.map(p => ({ name: p.name, bot: p.bot, team: p.team, legion: p.legion, roll: p.roll, g: Math.floor(p.gold), my: Math.floor(p.myth), inc: p.income, wk: p.workers, rd: p.ready, k: p.kills, q: p.queue.map(m => m.id), sent: p.sent, spell: p.spell, offer: p.spellOffer, sr: p.sellRate, pig: Math.round(p.piggy), rr: p.rerolls, st: p.strategy, dealt: Math.round(p.dealt) })),
    e: sim.ents.map(e => [e.id, e.lane, e.team === 'def' ? 0 : 1, e.kind === 'fighter' ? e.def.id : e.kind === 'summon' ? '@' + e.def.model : e.ck, r2(e.x), r2(e.z), r2(e.face), Math.round(e.hp), Math.round(e.maxHp),
      (e.dead ? 1 : 0) | (e.moving ? 2 : 0) | (e.stun > 0 ? 4 : 0) | (e.slow > 0 ? 8 : 0) | (e.dot > 0 ? 16 : 0) | (e.boss ? 32 : 0) | (e.up ? 64 : 0) | (e.kind === 'merc' ? 128 : 0) | (e.shield > 0 ? 256 : 0) | (e.stealthT > 0 ? 512 : 0),
      r2(e.atkT), r2(e.aspd), r2(e.castT), r2(e.deathT), r2(e.speed), e.cell ? e.cell[0] : -1, e.cell ? e.cell[1] : -1, e.owner === 'wave' ? -1 : e.owner, r2(e.radius), Math.round(e.value || 0), Math.round(e.fresh || 0), e.up || 0]),
    p: sim.projs.filter(p => !(p.delay > 0)).map(p => [p.id, p.src.lane, r2(p.x), r2(p.z), p.color, p.size, p.shape]),
  };
}
