// Simulación pura (sin three.js): se puede ejecutar en Node para equilibrar.
import { GRID, LANE, CFG, FIGHTERS, CREEPS, WAVES, MERCS, waveScale, mercScale } from './data.js';

export const FBY = Object.fromEntries(FIGHTERS.map(f => [f.id, f]));
export const MBY = Object.fromEntries(MERCS.map(m => [m.id, m]));
export const cellPos = (c, r) => ({ x: (c - (GRID.cols - 1) / 2) * GRID.cell, z: GRID.z0 + (r + .5) * GRID.cell });
let LANES = [-36, 36];
// Distribución de carriles: 2 (1v1) o 4 (2v2). Carriles 0,1 = equipo azul en 2v2; 2,3 = equipo rojo.
export function setLayout(n) { LANES = n === 4 ? [-114, -38, 38, 114] : [-36, 36]; }
export const laneX = i => LANES[i];
export const laneCount = () => LANES.length;
export const teamOfLane = (i, n = LANES.length) => (n === 4 ? (i < 2 ? 0 : 1) : i);
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

export class Sim {
  // opts: { lanes: 2|4, players: [{ name, bot, diff }] }
  constructor(opts = {}) {
    const n = opts.lanes === 4 ? 4 : 2; this.n = n;
    this.t = 0; this.wave = 0; this.phase = 'build'; this.timer = CFG.buildTime;
    this.ents = []; this.projs = []; this.delayed = []; this.ev = []; this.nid = 1; this.over = null; this.combatT = 0;
    const nexMax = n === 4 ? CFG.nexusHp2v2 : CFG.nexusHp;
    this.teams = [0, 1].map(t => ({ t, hp: nexMax, max: nexMax, upg: { hp: 0, atk: 0, regen: 0 } }));
    this.players = [...Array(n).keys()].map(side => {
      const po = (opts.players || [])[side] || {};
      return { side, team: teamOfLane(side, n), name: po.name || ('Jugador ' + (side + 1)), bot: !!po.bot, diff: po.diff || 'normal',
        gold: CFG.startGold, myth: CFG.startMyth, income: CFG.baseIncome, workers: CFG.startWorkers,
        grid: new Array(GRID.cols * GRID.rows).fill(null), queue: [], ready: false, nexusCd: 0, kills: 0, leaks: 0, sent: 0,
        nexus: { isNexus: true, x: 0, z: LANE.nexusZ, r: 2.4, lane: side } };
    });
  }
  target(side) { return (side + this.n / 2) % this.n; } // carril que recibe los mercenarios de `side`
  T(side) { return this.teams[this.players[side].team]; }
  workerCost(side) { return CFG.pcost + this.P(side).workers * CFG.pcostStep; }
  value(side) { return this.P(side).grid.reduce((a, e) => a + (e ? e.value : 0), 0); }
  recValue(w = this.wave) { return Math.round(CFG.recBase * Math.pow(1.16, w)); }
  nexusUpCost(kind) { const l = this.teams[0].upg[kind]; return 0; }
  emit(type, d = {}) { d.type = type; this.ev.push(d); }
  P(side) { return this.players[side]; }

  // ─── acciones del jugador ───
  canPlace(side, c, r) { return this.phase === 'build' && c >= 0 && c < GRID.cols && r >= 0 && r < GRID.rows && !this.P(side).grid[r * GRID.cols + c]; }
  place(side, id, c, r) {
    const d = FBY[id], p = this.P(side);
    if (!d || !this.canPlace(side, c, r) || p.gold < d.cost) return null;
    p.gold -= d.cost;
    const e = this.mkEnt({ lane: side, team: 'def', def: d, kind: 'fighter', owner: side, pos: cellPos(c, r), cell: [c, r], radius: .75, ab: d.ability, proj: d.proj });
    e.value = d.cost; e.fresh = d.cost; e.up = 0;
    p.grid[r * GRID.cols + c] = e;
    this.emit('place', { e });
    return e;
  }
  upgradeCost(e) { return Math.round(e.def.cost * CFG.upMul); }
  upgrade(side, c, r) {
    const p = this.P(side), e = p.grid[r * GRID.cols + c];
    if (!e || e.up || this.phase !== 'build') return false; const cost = this.upgradeCost(e); if (p.gold < cost) return false;
    p.gold -= cost; e.up = 1; e.value += cost; e.fresh += cost;
    e.maxHp = e.hp = e.def.hp * CFG.upStat; e.dmg = e.def.dmg * CFG.upStat; e.armor = e.def.armor + 12; e.aspd = e.def.aspd * 1.1;
    this.emit('upgrade', { e }); return true;
  }
  sellValue(e) { return Math.round(e.fresh + (e.value - e.fresh) * .5); }
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
  setReady(side, v = true) { this.P(side).ready = v; }
  // aplica un comando (desde la red o la UI)
  command(side, c) {
    switch (c.a) {
      case 'place': return !!this.place(side, c.id, c.c, c.r);
      case 'sell': return this.sell(side, c.c, c.r);
      case 'upgrade': return this.upgrade(side, c.c, c.r);
      case 'worker': return this.buyWorker(side);
      case 'merc': return this.buyMerc(side, c.id);
      case 'nexus': return this.upgradeNexus(side, c.kind);
      case 'ready': if (this.phase === 'build') this.setReady(side, !!c.v); return true;
    }
    return false;
  }

  mkEnt(o) {
    const d = o.def, sc = o.scale || 1;
    const e = {
      id: this.nid++, lane: o.lane, team: o.team, kind: o.kind, owner: o.owner, def: d, cell: o.cell || null,
      x: o.pos.x, z: o.pos.z, hx: o.pos.x, hz: o.pos.z, face: o.team === 'def' ? Math.PI : 0,
      maxHp: d.hp * (o.hpMul || 1), hp: d.hp * (o.hpMul || 1), dmg: d.dmg * (o.dmgMul || 1), aspd: d.aspd, range: d.range, speed: d.speed, armor: d.armor,
      radius: o.radius, ck: o.ck || null, up: 0, ab: o.ab || null, abCd: o.ab ? Math.random() * 2 + 1 : 0, cd: Math.random() * .5, atkT: -1, hit: false, castT: 0,
      stun: 0, slow: 0, slowAmt: 0, dot: 0, dotDps: 0, dotT: 0, tgt: null, moving: false, dead: false, deathT: 0, rt: 0, proj: o.proj || d.proj, boss: !!d.boss, s: d.s || 1,
    };
    this.ents.push(e); return e;
  }

  spawnCreep(lane, cid, o) {
    const d = CREEPS[cid];
    return this.mkEnt({ lane, team: 'att', def: d, kind: o.owner === 'wave' ? 'creep' : 'merc', owner: o.owner, pos: o.pos, hpMul: o.mul, dmgMul: Math.pow(o.mul, .8), radius: Math.min(1.5, .45 * d.s + .15), ab: d.ability, proj: d.proj, ck: cid });
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
      // mercenarios enviados por el rival
      let mi = 0;
      const src = this.players.find(q => this.target(q.side) === lane).side;
      for (const m of this.P(src).queue) for (let i = 0; i < m.n; i++, mi++) {
        const col = mi % 8, row = Math.floor(mi / 8);
        this.spawnCreep(lane, m.c, { owner: src, mul: ms, pos: { x: (col - 3.5) * 2.0, z: LANE.spawnZ - 9 - row * 2.2 } });
      }
    }
    for (const p of this.players) p.queue = [];
    this.emit('combat', { wave: this.wave });
  }

  endCombat() {
    this.phase = 'build';
    const w = this.wave; this.wave++;
    for (const p of this.players) {
      p.gold += p.income + 40 + w * 10; p.ready = false;
    }
    for (const e of this.ents) if (e.team === 'def') { // revivir luchadores
      const was = e.dead; e.dead = false; e.hp = e.maxHp; e.x = e.hx; e.z = e.hz; e.stun = e.slow = e.dot = 0; e.tgt = null; e.atkT = -1; e.abCd = Math.min(e.abCd, 1.5); e.face = Math.PI;
      if (was) this.emit('revive', { e });
    }
    this.ents = this.ents.filter(e => e.team === 'def');
    this.projs.length = 0; this.delayed.length = 0;
    this.timer = CFG.buildTime;
    this.emit('wave_end', { wave: w });
    if (this.wave >= CFG.totalWaves) this.finish(this.teams[0].hp / this.teams[0].max >= this.teams[1].hp / this.teams[1].max ? 0 : 1, 'waves');
  }
  finish(winner, why) { if (this.over) return; this.over = { winner, why }; this.phase = 'over'; this.emit('over', { winner, why }); }

  // ─── daño ───
  hurt(src, t, amt, o = {}) {
    if (t.dead || this.over) return;
    if (!o.raw) amt *= 100 / (100 + (t.armor || 0));
    if (t.isNexus) {
      amt *= .45; // las estructuras reciben menos daño
      const p = this.P(t.lane), T = this.T(t.lane); T.hp = Math.max(0, T.hp - amt); p.leaks++;
      this.emit('hit', { t, amt, nexus: true });
      if (T.hp <= 0) this.finish(1 - p.team, 'nexus');
      return;
    }
    t.hp -= amt; t.flash = .12;
    this.emit('hit', { t, amt, src, big: o.big });
    if (t.hp <= 0) this.die(t, src);
  }
  die(t, src) {
    t.dead = true; t.deathT = 0; t.hp = 0; this.emit('death', { e: t });
    if (t.team === 'att' && t.owner === 'wave') { const p = this.P(t.lane); p.gold += Math.round(t.def.bounty * Math.pow(waveScale(this.wave + 1), .5)); p.kills++; }
  }
  foesOf(e) { return this.ents.filter(o => !o.dead && o.lane === e.lane && o.team !== e.team); }
  inCircle(e, x, z, r) { return this.ents.filter(o => !o.dead && o.lane === e.lane && o.team !== e.team && Math.hypot(o.x - x, o.z - z) <= r + o.radius * .6); }

  // ─── habilidades ───
  tryAbility(e, tgt) {
    const a = e.ab; if (!a || e.abCd > 0) return false;
    let ok = false;
    switch (a.type) {
      case 'spin': { const fs = this.inCircle(e, e.x, e.z, a.r); if (!fs.length) break; fs.forEach(f => this.hurt(e, f, a.dmg * e.dmg / e.def.dmg, { big: 1 })); this.emit('aoe', { x: e.x, z: e.z, r: a.r, fx: a.fx, e }); ok = true; break; }
      case 'nova': {
        if (!tgt) break;
        const cx = a.self ? e.x : tgt.x, cz = a.self ? e.z : tgt.z, mul = e.dmg / e.def.dmg;
        if (a.self && !this.inCircle(e, cx, cz, a.r).length) break;
        if (!a.self) this.emit('lob', { x0: e.x, z0: e.z, x1: cx, z1: cz, t: .35, fx: a.fx, e });
        this.delayed.push({ t: a.self ? .15 : .35, fn: () => {
          this.inCircle(e, cx, cz, a.r).forEach(f => { this.hurt(e, f, a.dmg * mul, { big: 1 }); if (a.stun) f.stun = Math.max(f.stun, a.stun); });
          this.emit('aoe', { x: cx, z: cz, r: a.r, fx: a.fx, e });
        } });
        ok = true; break;
      }
      case 'volley': {
        if (!tgt) break;
        const fs = this.foesOf(e).filter(f => dist(e, f) <= e.range + 1).sort((p, q) => dist(e, p) - dist(e, q)).slice(0, a.n);
        const mul = e.dmg / e.def.dmg;
        fs.forEach((f, i) => this.projs.push({ id: this.nid++, x: e.x, z: e.z, y: 1.2, tgt: f, speed: 20 + i, dmg: a.dmg * mul, color: 0xbff0ff, size: .15, src: e, slow: a.slow, slowT: a.slowT, delay: i * .06, ab: true }));
        if (fs.length) { this.emit('cast', { e, a }); ok = true; } break;
      }
      case 'beam': {
        if (!tgt) break;
        const dx = tgt.x - e.x, dz = tgt.z - e.z, L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L, mul = e.dmg / e.def.dmg;
        this.emit('beam', { x: e.x, z: e.z, ux, uz, len: a.len, w: a.w, fx: a.fx, e });
        this.delayed.push({ t: .25, fn: () => { for (const f of this.foesOf(e)) { const px = f.x - e.x, pz = f.z - e.z, al = px * ux + pz * uz, pe = Math.abs(px * uz - pz * ux); if (al > 0 && al < a.len && pe < a.w + f.radius * .5) this.hurt(e, f, a.dmg * mul, { big: 1 }); } } });
        ok = true; break;
      }
      case 'heal': {
        const al = this.ents.filter(o => !o.dead && o.lane === e.lane && o.team === e.team && o.hp < o.maxHp * .88 && dist(e, o) <= a.range).sort((p, q) => p.hp / p.maxHp - q.hp / q.maxHp)[0];
        if (!al) break; al.hp = Math.min(al.maxHp, al.hp + a.heal); this.emit('heal', { e, t: al, amt: a.heal, fx: a.fx }); ok = true; break;
      }
      case 'strike': {
        if (!tgt) break; const mul = e.dmg / e.def.dmg; let d = a.dmg * mul; if (tgt.hp < tgt.maxHp * a.exec) d *= a.execMul;
        this.hurt(e, tgt, d, { big: 1 }); this.emit('aoe', { x: tgt.x, z: tgt.z, r: 1.6, fx: a.fx, e }); ok = true; break;
      }
      case 'stun': {
        if (!tgt) break; this.hurt(e, tgt, a.dmg * e.dmg / e.def.dmg, { big: 1 }); tgt.stun = Math.max(tgt.stun, a.stun); this.emit('aoe', { x: tgt.x, z: tgt.z, r: 1.8, fx: a.fx, e }); ok = true; break;
      }
      case 'poison': {
        if (!tgt) break; tgt.dotDps = a.dps * e.dmg / e.def.dmg; tgt.dot = a.t; this.emit('poison', { e, t: tgt, fx: a.fx }); ok = true; break;
      }
      case 'dash': {
        const far = this.foesOf(e).filter(f => dist(e, f) < 11).sort((p, q) => dist(e, q) - dist(e, p))[0]; if (!far) break;
        const dx = far.x - e.x, dz = far.z - e.z, L = Math.hypot(dx, dz) || 1, fromx = e.x, fromz = e.z;
        e.x = far.x - dx / L * 1.2; e.z = far.z - dz / L * 1.2; e.face = Math.atan2(dx, dz);
        this.emit('dash', { e, x0: fromx, z0: fromz, x1: e.x, z1: e.z, fx: a.fx });
        this.hurt(e, far, a.dmg * e.dmg / e.def.dmg, { big: 1 }); ok = true; break;
      }
    }
    if (ok) { e.abCd = a.cd; e.castT = .45; if (a.type !== 'heal') this.emit('cast', { e, a }); }
    return ok;
  }

  // ─── bucle ───
  update(dt) {
    if (this.over) { this.t += dt; return; }
    this.t += dt;
    for (let i = this.delayed.length - 1; i >= 0; i--) { const d = this.delayed[i]; d.t -= dt; if (d.t <= 0) { this.delayed.splice(i, 1); d.fn(); } }
    for (const e of this.ents) { if (e.flash > 0) e.flash -= dt; }
    for (const p of this.players) p.myth += p.workers * CFG.mythRate * dt;
    if (this.phase === 'build') {
      for (const T of this.teams) T.hp = Math.min(T.max, T.hp + T.upg.regen * CFG.regenPer * dt);
      this.timer -= dt;
      if (this.timer <= 0 || this.players.every(p => p.ready)) this.startCombat();
      return;
    }
    this.combatT += dt;
    for (const e of this.ents) this.stepEnt(e, dt);
    this.separate(dt);
    this.stepProjs(dt);
    for (const p of this.players) this.stepNexus(p, dt);
    // limpiar cadáveres de atacantes
    this.ents = this.ents.filter(e => !(e.dead && e.team === 'att' && e.deathT > 2));
    if (!this.over && !this.ents.some(e => e.team === 'att' && !e.dead) && this.combatT > 1) this.endCombat();
    else if (this.combatT > 150) { for (const e of this.ents) if (e.team === 'att' && !e.dead) { e.speed *= 1.0005; e.dmg *= 1.0004; } }
  }

  stepNexus(p, dt) {
    p.nexusCd -= dt; if (p.nexusCd > 0 || this.T(p.side).hp <= 0) return;
    let best = null, bd = 11;
    for (const e of this.ents) if (!e.dead && e.lane === p.side && e.team === 'att') { const d = Math.hypot(e.x - p.nexus.x, e.z - p.nexus.z); if (d < bd) { bd = d; best = e; } }
    if (best) { p.nexusCd = .9; const dmg = 150 * (1 + .4 * this.wave) * (1 + .35 * this.T(p.side).upg.atk); this.emit('nexusShot', { side: p.side, t: best }); this.hurt({ nexus: true }, best, dmg, { raw: false }); }
  }

  stepEnt(e, dt) {
    if (e.dead) { e.deathT += dt; return; }
    if (e.dot > 0) { e.dot -= dt; e.dotT -= dt; if (e.dotT <= 0) { e.dotT = .5; this.hurt(e.dotSrc, e, e.dotDps * .5, { raw: true }); if (e.dead) return; } }
    e.abCd -= dt; e.cd -= dt; e.castT -= dt; e.rt -= dt;
    if (e.slow > 0) e.slow -= dt;
    if (e.stun > 0) { e.stun -= dt; e.moving = false; return; }
    const lane = e.lane, P = this.P(lane), def = e.team === 'def';
    const slowF = e.slow > 0 ? 1 - e.slowAmt : 1;
    // curar sin objetivo
    if (e.ab && e.ab.type === 'heal') this.tryAbility(e, null);
    // retargeting
    if (!e.tgt || e.tgt.dead || e.rt <= 0) {
      e.rt = .35;
      let best = null, bd = def ? Math.max(e.range + 2.5, 8) : 11;
      for (const o of this.ents) if (!o.dead && o.lane === lane && o.team !== e.team) { const d = dist(e, o); if (d < bd) { bd = d; best = o; } }
      if (!best && !def) best = P.nexus;
      if (def && best && Math.hypot(best.x - e.hx, best.z - e.hz) > 14) best = null;
      e.tgt = best;
    }
    // ataque en curso
    if (e.atkT >= 0) {
      e.atkT += dt; const dur = Math.min(.55, .7 / e.aspd);
      if (!e.hit && e.atkT >= dur * .5) { e.hit = true; this.doHit(e); }
      if (e.atkT >= dur) e.atkT = -1;
      e.moving = false; return;
    }
    const t = e.tgt;
    if (t) {
      const dx = t.x - e.x, dz = t.z - e.z, d = Math.hypot(dx, dz) - e.radius - (t.radius || 0);
      if (e.ab && e.ab.type === 'dash' && e.abCd <= 0 && this.tryAbility(e, t)) return;
      if (d <= e.range) {
        e.face = Math.atan2(dx, dz); e.moving = false;
        if (e.ab && e.abCd <= 0 && e.ab.type !== 'heal' && e.ab.type !== 'dash' && this.tryAbility(e, t)) return;
        if (e.cd <= 0) { e.cd = 1 / e.aspd; e.atkT = 0; e.hit = false; }
        return;
      }
      const L = Math.hypot(dx, dz) || 1, sp = e.speed * slowF * dt;
      e.x += dx / L * sp; e.z += dz / L * sp; e.face = Math.atan2(dx, dz); e.moving = true; return;
    }
    // sin objetivo
    if (def) {
      const dx = e.hx - e.x, dz = e.hz - e.z, L = Math.hypot(dx, dz);
      if (L > .12) { const sp = Math.min(L, e.speed * slowF * dt); e.x += dx / L * sp; e.z += dz / L * sp; e.face = Math.atan2(dx, dz); e.moving = true; }
      else { e.moving = false; e.face += (Math.PI - e.face) * Math.min(1, dt * 6); }
    } else { e.z += e.speed * slowF * dt; e.moving = true; e.face = 0; }
  }

  doHit(e) {
    const t = e.tgt; if (!t || t.dead) return;
    if (e.def.melee) { this.hurt(e, t, e.dmg); this.emit('melee', { e, t }); }
    else this.projs.push({ id: this.nid++, x: e.x, z: e.z, y: 1.3, tgt: t, speed: (e.proj && e.proj.speed) || 18, dmg: e.dmg, color: e.proj ? e.proj.color : 0xffffff, size: e.proj ? e.proj.size : .15, src: e });
  }

  stepProjs(dt) {
    for (let i = this.projs.length - 1; i >= 0; i--) {
      const p = this.projs[i];
      if (p.delay > 0) { p.delay -= dt; continue; }
      const t = p.tgt; if (t.dead && !t.isNexus) { this.projs.splice(i, 1); continue; }
      const dx = t.x - p.x, dz = t.z - p.z, d = Math.hypot(dx, dz), step = p.speed * dt;
      if (d <= step + (t.radius || .5) * .6) {
        this.hurt(p.src, t, p.dmg, { big: p.ab });
        if (p.slow) { t.slow = p.slowT; t.slowAmt = p.slow; }
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
    def: { id: e.def.id, cost: e.def.cost, bounty: e.def.bounty }, ab: e.ab ? { r: e.ab.r } : null });
export function netEvents(evs) { return evs.map(ev => { const o = { ...ev }; for (const k of ['e', 't', 'src']) if (o[k]) o[k] = slim(o[k]); return o; }); }
const r2 = v => Math.round(v * 100) / 100;
export function snapshot(sim) {
  return {
    n: sim.n, ph: sim.phase, tm: r2(sim.timer), wv: sim.wave, ov: sim.over, teams: sim.teams,
    pl: sim.players.map(p => ({ name: p.name, bot: p.bot, team: p.team, g: Math.floor(p.gold), my: Math.floor(p.myth), inc: p.income, wk: p.workers, rd: p.ready, k: p.kills, q: p.queue.map(m => m.id), sent: p.sent })),
    e: sim.ents.map(e => [e.id, e.lane, e.team === 'def' ? 0 : 1, e.kind === 'fighter' ? (e.def.id) : e.ck, r2(e.x), r2(e.z), r2(e.face), Math.round(e.hp), Math.round(e.maxHp),
      (e.dead ? 1 : 0) | (e.moving ? 2 : 0) | (e.stun > 0 ? 4 : 0) | (e.slow > 0 ? 8 : 0) | (e.dot > 0 ? 16 : 0) | (e.boss ? 32 : 0) | (e.up ? 64 : 0) | (e.kind === 'merc' ? 128 : 0),
      r2(e.atkT), r2(e.aspd), r2(e.castT), r2(e.deathT), r2(e.speed), e.cell ? e.cell[0] : -1, e.cell ? e.cell[1] : -1, e.owner === 'wave' ? -1 : e.owner, r2(e.radius), Math.round(e.value || 0), Math.round(e.fresh || 0)]),
    p: sim.projs.filter(p => !(p.delay > 0)).map(p => [p.id, p.src.lane, r2(p.x), r2(p.z), p.color, p.size]),
  };
}
