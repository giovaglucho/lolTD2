import * as THREE from 'three';
import { createWorld } from './world.js';
import { buildModel, animate } from './models.js';
import { Sim, laneX, cellPos, FBY, MBY, setLayout, laneCount } from './sim.js';
import { aiTurn, aiTick } from './ai.js';
import { NetSim } from './net.js';
import { FX, FXCOL } from './fx.js';
import { sfx, initAudio } from './sfx.js';
import { GRID, LANE, CFG, WAVES, CREEPS, MERCS, waveScale } from './data.js';
import { SPELL_BY } from './content/spells.js';

const Y0 = .17;
export class Game {
  constructor(canvas, ui) {
    this.ui = ui; this.canvas = canvas; this.sim = null; this.views = new Map(); this.pviews = new Map(); this.time = 0; this.me = 0;
    this.makeWorld(2);
    this.cam = { x: laneX(0), z: 12, dist: 42, tx: laneX(0), tz: 12, tdist: 42, yaw: 0, pitch: .93, view: 0 };
    this.keys = {}; this.sel = null; this.hover = null; this.selEnt = null; this.speed = 1; this.paused = false; this.ghost = null; this.ghostId = null; this.started = false;
    this.ray = new THREE.Raycaster(); this.mouse = new THREE.Vector2(); this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -Y0);
    this.cellMark = this.makeCellMark(); this.world.scene.add(this.cellMark); this.hpGeo = new THREE.PlaneGeometry(1, 1);
    this.hpBg = new THREE.MeshBasicMaterial({ color: 0x0a0e18, depthTest: false, transparent: true, opacity: .85 });
    this.hpM = { 0: new THREE.MeshBasicMaterial({ color: 0x3ac8ff, depthTest: false }), 1: new THREE.MeshBasicMaterial({ color: 0xff4a3a, depthTest: false }), g: new THREE.MeshBasicMaterial({ color: 0xb04aff, depthTest: false }) };
    this.bindInput();
    this.params = new URLSearchParams(location.search); this.autoTest = this.params.get('auto') === '1';
    this.ring = null;
  }
  makeWorld(n) {
    if (this.world && this.world.n === n) return;
    if (this.world) { // liberar el contexto anterior y reemplazar el canvas
      this.world.renderer.dispose(); this.world.renderer.forceContextLoss(); for (const t of this.fx.texts) t.el.remove();
      const c2 = this.canvas.cloneNode(false); this.canvas.replaceWith(c2); this.canvas = c2;
    }
    setLayout(n); this.world = createWorld(this.canvas, n); this.world.n = n;
    this.fx = new FX(this.world.scene, this.world.tx, this.world.camera);
    if (this.cellMark) this.world.scene.add(this.cellMark);
    this.views.clear(); this.pviews.clear(); this.ghost = null;
  }
  makeCellMark() { const m = new THREE.Mesh(new THREE.PlaneGeometry(GRID.cell, GRID.cell), new THREE.MeshBasicMaterial({ color: 0x4aff8a, transparent: true, opacity: .45, depthWrite: false, blending: THREE.AdditiveBlending })); m.rotation.x = -Math.PI / 2; m.visible = false; return m; }

  // opts: { lanes, diff, allyDiff } (local)  |  { net: { conn, info } } (en línea)
  start(opts = {}) {
    for (const v of this.views.values()) this.world.scene.remove(v.group); this.views.clear(); for (const p of this.pviews.values()) this.world.scene.remove(p.mesh); this.pviews.clear();
    if (opts.net) {
      const info = opts.net.info; this.makeWorld(info.n); this.sim = new NetSim(opts.net.conn, info); this.me = info.me; this.netInfo = info;
      this.local = false;
    } else {
      const n = opts.lanes === 4 ? 4 : 2; this.makeWorld(n); this.me = 0; this.netInfo = null; this.local = true;
      const diff = opts.diff || 'normal', names = n === 4 ? ['Tú', 'Aliado IA', 'IA Roja 1', 'IA Roja 2'] : ['Tú', 'IA Roja'];
      this.sim = new Sim({ lanes: n, players: names.map((nm, i) => ({ name: nm, bot: i !== 0, diff: n === 4 && i === 1 ? (opts.allyDiff || diff) : diff })) });
      this.aiLast = -1;
    }
    this.mode = opts; this.started = true; this.sel = null; this.selEnt = null; this.over = false;
    this.speed = 1; this.paused = false;
    this.cam.view = this.me; this.cam.tx = this.cam.x = laneX(this.me); this.cam.tz = 12;
    this.updateGhost(); this.ui.onStart(this); this.nextBuild(true);
  }
  stop() { this.started = false; this.sim = null; for (const v of this.views.values()) this.world.scene.remove(v.group); this.views.clear(); for (const p of this.pviews.values()) this.world.scene.remove(p.mesh); this.pviews.clear(); if (this.ghost) this.world.scene.remove(this.ghost); this.ghost = null; this.cellMark.visible = false; }
  nextBuild(first) { // turno de la IA local al empezar cada fase de construcción
    if (this.local && this.sim.wave !== this.aiLast) { this.aiLast = this.sim.wave; for (const p of this.sim.players) if (p.bot) aiTurn(this.sim, p.side, p.diff); if (this.autoTest) aiTurn(this.sim, 0, 'normal'); }
    this.ui.refresh(); if (!first) sfx.horn();
  }

  // ───── entidades ─────
  makeView(e) {
    const d = e.def, kind = e.kind === 'fighter' ? (d.model || d.id) : e.kind === 'summon' ? (d.model || 'summon') : d.k, ot = e.owner === 'wave' ? -1 : this.sim.P(e.owner).team, tint = ot === 0 ? 'blue' : 'red';
    const model = buildModel(kind, tint, { upgraded: !!e.up }); model.up = !!e.up; model.phase = Math.random() * 6.28; const vr = e.kind === 'fighter' ? 0 : (Math.random() - .5) * .2;  const group = new THREE.Group(); group.add(model.g);
    const sc = (e.kind === 'fighter' ? 1.3 : e.kind === 'summon' ? 1.3 * (d.s || 1) : d.s) * (1 + vr); model.g.scale.setScalar(sc);
    const box = new THREE.Box3().setFromObject(model.g); const h = box.max.y;
    const side = e.kind === 'fighter' ? this.sim.P(e.lane).team : (e.owner === 'wave' ? 'g' : ot);
    const col = side === 0 ? 0x4aa8ff : side === 1 ? 0xff5a4a : 0xb04aff;
    const ring = new THREE.Mesh(this.hpGeo, new THREE.MeshBasicMaterial({ map: this.world.tx.ring, color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: e.kind === 'fighter' ? .6 : .35 }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = .03; ring.scale.setScalar(Math.max(1.6, e.radius * 3.4)); group.add(ring);
    const bar = new THREE.Group(); const w = Math.max(1.3, Math.min(3.4, h * .9)); const bg = new THREE.Mesh(this.hpGeo, this.hpBg), fg = new THREE.Mesh(this.hpGeo, this.hpM[side]);
    bg.scale.set(w + .08, .17, 1); fg.scale.set(w, .12, 1); bg.renderOrder = 10; fg.renderOrder = 11; bar.add(bg, fg); bar.position.y = h + .6; group.add(bar);
    this.world.scene.add(group);
    return { e, model, group, ring, bar, fg, w, h, vr: 1 + vr, dead: false, atkP: -1, hurt: 0, castT: 0, mats: null, appear: 0 };
  }
  syncEnts(dt) {
    const sim = this.sim, alive = new Set();
    for (const e of sim.ents) {
      alive.add(e.id); let v = this.views.get(e.id);
      if (v && !!e.up !== v.model.up) { this.world.scene.remove(v.group); this.views.delete(e.id); v = null; }
      let fresh = false; if (!v) { v = this.makeView(e); this.views.set(e.id, v); v.appear = e.team === 'att' ? 0 : 1; fresh = true; }
      const g = v.group, tx = laneX(e.lane) + e.x;
      if (sim.net && !fresh && !e.dead) { const k = Math.min(1, dt * 12); g.position.x += (tx - g.position.x) * k; g.position.z += (e.z - g.position.z) * k; g.position.y = Y0; } else g.position.set(tx, Y0, e.z);
      let rot = e.face; g.rotation.y += (Math.atan2(Math.sin(rot - g.rotation.y), Math.cos(rot - g.rotation.y))) * Math.min(1, dt * 14);
      v.appear = Math.min(1, v.appear + dt * 3);
      const dying = e.dead;
      if (dying) {
        const k = Math.min(1, e.deathT / .45); v.model.g.rotation.x = -k * 1.45 * (v.model.rig.flyer ? .5 : 1); g.position.y = Y0 - Math.max(0, e.deathT - 1.2) * .8 - (v.model.rig.flyer ? (1 - k) * -.0 : 0);
        v.bar.visible = false; v.ring.visible = false; if (e.deathT > (e.team === 'def' ? 1.5 : 1.9)) g.visible = false; v.model.g.scale.setScalar((e.kind === 'fighter' ? 1.3 : e.kind === 'summon' ? 1.3 * (e.def.s || 1) : e.def.s) * (v.vr || 1) * (e.deathT > 1.2 ? Math.max(.01, 1 - (e.deathT - 1.2) * 1.4) : 1));
      } else {
        g.visible = true; v.model.g.rotation.x = 0; v.model.g.scale.setScalar((e.kind === 'fighter' ? 1.3 : e.kind === 'summon' ? 1.3 * (e.def.s || 1) : e.def.s) * (v.vr || 1) * (.4 + .6 * v.appear)); v.bar.visible = e.hp < e.maxHp || e.kind === 'fighter' && false ? true : e.hp < e.maxHp; v.ring.visible = true;
        const r = Math.max(.001, e.hp / e.maxHp); v.fg.scale.x = v.w * r; v.fg.position.x = -(v.w * (1 - r)) / 2; v.bar.quaternion.copy(this.world.camera.quaternion);
        if (e.stun > 0) { v.model.g.rotation.z = Math.sin(this.time * 30) * .06; if (Math.random() < dt * 8) this.fx.burst(g.position.x, v.h + 1.1, g.position.z, { n: 1, color: 0xffee66, speed: .8, up: .4, life: .5, size: .35, g: 0 }); } else v.model.g.rotation.z = 0;
        if (e.shield > 0) { if (!v.bubble) { v.bubble = new THREE.Mesh(this._bubbleGeo ??= new THREE.SphereGeometry(1, 20, 14), this._bubbleMat ??= new THREE.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: .22, depthWrite: false, blending: THREE.AdditiveBlending })); v.group.add(v.bubble); } v.bubble.visible = true; v.bubble.scale.set(v.w * .55 + .4, v.h * .6 + .3, v.w * .55 + .4); v.bubble.position.y = v.h * .5; } else if (v.bubble) v.bubble.visible = false;
        v.model.g.visible = !(e.stealthT > 0) || Math.sin(this.time * 30) > .7;
        if (e.slow > 0 && Math.random() < dt * 6) this.fx.burst(g.position.x, 1, g.position.z, { n: 1, color: 0x9fe4ff, speed: .5, up: .5, life: .6, size: .3, g: 0 });
        if (e.dot > 0 && Math.random() < dt * 8) this.fx.burst(g.position.x, v.h * .8, g.position.z, { n: 1, color: 0x8aff5a, speed: .5, up: 1.2, life: .6, size: .3, g: -2 });
      }
      const st = { moving: e.moving && !dying, atk: e.atkT >= 0 ? e.atkT / Math.min(.55, .7 / e.aspd) : -1, cast: e.castT > 0 ? 1 : 0, speed: 5 + e.speed * 1.6 * (e.slow > 0 ? .6 : 1), hurt: e.flash > 0 ? e.flash / .12 : 0 };
      if (!dying) animate(v.model, st, this.time, dt);
      // flash al recibir daño
      if (e.flash > 0 && !v.flashed) { v.flashed = true; v.model.g.traverse(o => { if (o.isMesh && o.material.emissive) { o.userData.oe = o.material.emissiveIntensity; } }); }
      v.selected = this.selEnt === e;
      v.ring.material.opacity = (e.kind === 'fighter' ? .6 : .35) * (v.selected ? 1.6 : 1) + (v.selected ? Math.sin(this.time * 8) * .15 : 0);
    }
    for (const [id, v] of this.views) if (!alive.has(id)) { this.world.scene.remove(v.group); this.views.delete(id); }
  }
  syncProjs() {
    const alive = new Set();
    for (const p of this.sim.projs) {
      if (p.delay > 0) continue; alive.add(p.id); let pv = this.pviews.get(p.id);
      if (!pv) { const mesh = this.makeProj(p); this.world.scene.add(mesh); pv = { mesh, p, trail: 0 }; this.pviews.set(p.id, pv); sfx.shoot(); }
      if (p.dir !== undefined) pv.mesh.rotation.y = p.dir;
      const lx = laneX(p.src.lane); pv.mesh.position.set(lx + p.x, p.y ?? 1.2, p.z);
      for (const ch of pv.mesh.children) if (ch.userData.spin) ch.rotation.y += .5;
      pv.trail -= 1; if (pv.trail <= 0) { pv.trail = 1; this.fx.burst(lx + p.x, p.y ?? 1.2, p.z, { n: 1, color: p.color, speed: .2, up: .1, life: .3, size: p.size * 3, g: 0 }); }
    }
    for (const [id, pv] of this.pviews) if (!alive.has(id)) { this.world.scene.remove(pv.mesh); this.pviews.delete(id); }
  }
  makeProj(p) { // forma del proyectil según el campeón
    const g = new THREE.Group(), c = p.color, sz = p.size || .15, basic = c => new THREE.MeshBasicMaterial({ color: c });
    this._pg ??= { sph: new THREE.SphereGeometry(1, 10, 8), cyl: new THREE.CylinderGeometry(1, 1, 1, 6), cone: new THREE.ConeGeometry(1, 1, 6), oct: new THREE.OctahedronGeometry(1), box: new THREE.BoxGeometry(1, 1, 1) };
    const G = this._pg, add = (geo, mat, sc, pos, rot) => { const m = new THREE.Mesh(geo, mat); m.scale.set(...sc); if (pos) m.position.set(...pos); if (rot) m.rotation.set(...rot); g.add(m); return m; };
    switch (p.shape) {
      case 'arrow': add(G.cyl, basic(0xf4f0e0), [.025, .9, .025], [0, 0, 0], [Math.PI / 2, 0, 0]); add(G.cone, basic(c), [.07, .2, .07], [0, 0, .5], [Math.PI / 2, 0, 0]); break;
      case 'bullet': add(G.cyl, basic(c), [sz * .5, sz * 4, sz * .5], [0, 0, 0], [Math.PI / 2, 0, 0]); break;
      case 'bolt': add(G.oct, basic(c), [sz * .6, sz * .6, sz * 3]); break;
      case 'blade': { const b = add(G.box, basic(c), [sz * 2.4, .03, sz * .8]); b.userData.spin = 1; break; }
      case 'rocket': add(G.cyl, basic(0xe8e0d0), [sz * .7, sz * 3.5, sz * .7], [0, 0, 0], [Math.PI / 2, 0, 0]); add(G.cone, basic(c), [sz * .7, sz * 1.4, sz * .7], [0, 0, sz * 2.4], [Math.PI / 2, 0, 0]); break;
      case 'star': { const s1 = add(G.oct, basic(c), [sz * 1.4, sz * 1.4, sz * .5]); s1.userData.spin = 1; break; }
      default: add(G.sph, basic(c), [sz, sz, sz]);
    }
    const halo = new THREE.Sprite(this.fx.colMat(c)); halo.scale.setScalar(sz * 6); g.add(halo);
    return g;
  }
  pos3(lane, x, z, y = 1) { return new THREE.Vector3(laneX(lane) + x, y, z); }

  handleEvents() {
    const fx = this.fx, sim = this.sim;
    for (const ev of sim.ev) {
      switch (ev.type) {
        case 'hit': {
          const t = ev.t, lane = t.lane; const p = t.isNexus ? this.pos3(lane, t.x, t.z, 5) : this.pos3(lane, t.x, t.z, 2.2);
          if (ev.amt >= 1 && (this.dmgNumbers ?? true)) { const cls = t.isNexus ? 'nex' : t.team === 'def' ? 'dmgd' : ev.crit ? 'crit' : (ev.big ? 'big' : ''); fx.text(p.x, p.y, p.z, Math.round(ev.amt) + (ev.crit ? '!' : ''), cls); }
          if (t.isNexus) { fx.burst(p.x, 4, p.z + 1, { n: 10, color: 0xffa060, speed: 5, up: 4, life: .5, size: .7 }); if (lane === this.cam.view) fx.shake = .5; this.world.grade.uniforms.flash.value = lane === this.cam.view ? .12 : 0; sfx.nexus(); }
          else { fx.burst(p.x, 1.2, p.z, { n: ev.big ? 8 : 4, color: t.team === 'def' ? 0xff6a5a : 0xffe0a0, speed: 3, up: 2, life: .3, size: .35 }); sfx.hit(); }
          break;
        }
        case 'melee': { const e = ev.e, a = this.pos3(e.lane, e.x, e.z, 1.2), b = this.pos3(ev.t.lane, ev.t.x, ev.t.z, 1.2); this.fx.burst((a.x + b.x) / 2, 1.3, (a.z + b.z) / 2, { n: 6, color: 0xffffff, speed: 4, up: 1, life: .22, size: .35 }); break; }
        case 'impact': fx.impact(laneX(ev.lane ?? this.me) + ev.x, ev.z, ev.color, ev.size); break;
        case 'death': {
          const e = ev.e, p = this.pos3(e.lane, e.x, e.z, 1); sfx.death();
          fx.burst(p.x, 1, p.z, { n: e.boss ? 40 : 12, color: e.team === 'def' ? 0xffffff : 0xffd870, colors: e.team === 'def' ? [0x4aa8ff, 0xffffff] : [0xffd870, 0xffa030, 0xffffff], speed: e.boss ? 9 : 4, up: 4, life: .8, size: e.boss ? 1.2 : .6 });
          if (e.team === 'att' && e.owner === 'wave') { const b = Math.round(e.def.bounty * Math.pow(waveScale(sim.wave + 1), .5)); if (b > 0 && e.lane === this.me) fx.text(p.x, 2.8, p.z, '+' + b, 'gold'); }
          if (e.boss) { fx.shake = 1.0; fx.ring(p.x, p.z, 8, 0xffd060); }
          break;
        }
        case 'aoe': {
          const c = ev.color ?? FXCOL[ev.fx] ?? 0xffffff, lane = ev.e.lane, p = this.pos3(lane, ev.x, ev.z, .3);
          if (ev.small) { fx.ring(p.x, p.z, ev.r * .8, c, { dur: .3, op: .5 }); fx.burst(p.x, .6, p.z, { n: 6, color: c, speed: ev.r * 1.5, up: 2, life: .35, size: .6, spread: ev.r * .5 }); break; }
          if (ev.buff || ev.taunt) { fx.ring(p.x, p.z, ev.r, c, { dur: .7, op: .7 }); fx.burst(p.x, .3, p.z, { n: 24, color: c, speed: 1, up: 4, life: 1, size: .5, spread: ev.r, g: -1 }); sfx.magic(); break; }
          fx.ring(p.x, p.z, ev.r, c); fx.ring(p.x, p.z, ev.r * .6, 0xffffff, { dur: .35, op: .6 });
          fx.burst(p.x, .6, p.z, { n: 22, color: c, speed: ev.r * 1.8, up: 5, life: .6, size: .9, spread: ev.r * .5 });
          if (ev.fx === 'quake' || ev.fx === 'void') { fx.shake = Math.max(fx.shake, .6); sfx.boom(); } else sfx.magic();
          if (ev.fx === 'fire' || ev.fx === 'rocket') sfx.boom();
          break;
        }
        case 'lob': {
          const c = ev.color ?? FXCOL[ev.fx] ?? 0xffffff, lane = ev.e.lane, a = this.pos3(lane, ev.x0, ev.z0, 2), b = this.pos3(lane, ev.x1, ev.z1, .5);
          for (let i = 0; i < 12; i++) fx.burst(a.x + (b.x - a.x) * i / 12, 1.5 + Math.sin(i / 12 * Math.PI) * 2.5, a.z + (b.z - a.z) * i / 12, { n: 2, color: c, speed: .4, up: .3, life: .45, size: .8, g: 0 });
          fx.ring(b.x, b.z, Math.max(1, ev.r || (ev.e.ab && ev.e.ab.r) || 2), c, { dur: .35 + (ev.t || 0), op: .35 }); sfx.magic(); break;
        }
        case 'beam': { const c = ev.color ?? FXCOL[ev.fx] ?? 0xffffff, p = this.pos3(ev.e.lane, ev.x, ev.z, 0); fx.beam(p.x, p.z, ev.ux, ev.uz, ev.len, ev.w * .9, c, .5); sfx.magic(); break; }
        case 'heal': { const p = this.pos3(ev.t.lane, ev.t.x, ev.t.z, 0.4); fx.ring(p.x, p.z, 1.6, 0x7dffb0); fx.burst(p.x, 0.6, p.z, { n: 14, color: 0x7dffb0, speed: 1.2, up: 4, life: .9, size: .5, g: -1 }); fx.text(p.x, 2.4, p.z, '+' + Math.round(ev.amt), 'heal'); sfx.heal(); break; }
        case 'poison': { const p = this.pos3(ev.t.lane, ev.t.x, ev.t.z, 1.5); fx.burst(p.x, 1.4, p.z, { n: 12, color: ev.color ?? FXCOL[ev.fx] ?? 0x8aff5a, speed: 2, up: 2, life: .6, size: .6 }); break; }
        case 'dash': { const c = ev.color ?? FXCOL[ev.fx] ?? 0xcfefff, a = this.pos3(ev.e.lane, ev.x0, ev.z0, 1), b = this.pos3(ev.e.lane, ev.x1, ev.z1, 1); fx.bolt(a, b, c, .3, .25); fx.ring(b.x, b.z, 2, c); for (let i = 0; i < 10; i++) fx.burst(a.x + (b.x - a.x) * i / 10, 1, a.z + (b.z - a.z) * i / 10, { n: 1, color: c, speed: .5, up: .5, life: .4, size: .6, g: 0 }); sfx.magic(); break; }
        case 'chain': { const c = ev.color ?? FXCOL[ev.fx] ?? 0x9fd8ff, L = ev.e.lane; for (let i = 0; i < ev.pts.length - 1; i++) { const a = this.pos3(L, ev.pts[i].x, ev.pts[i].z, 1.3), b = this.pos3(L, ev.pts[i + 1].x, ev.pts[i + 1].z, 1.3); setTimeout(() => { fx.bolt(a, b, c, .22, .13); fx.impact(b.x, b.z, c, .3, 1.3); }, i * 80); } sfx.magic(); break; }
        case 'shield': { const p = this.pos3(ev.t.lane, ev.t.x, ev.t.z, .3), c = ev.color ?? FXCOL[ev.fx] ?? 0xffe08a; fx.ring(p.x, p.z, 1.5, c, { dur: .6 }); fx.burst(p.x, 1, p.z, { n: 12, color: c, speed: 1.5, up: 2, life: .6, size: .5, g: 0 }); sfx.heal(); break; }
        case 'pull': { const c = ev.color ?? FXCOL[ev.fx] ?? 0xffd24a, a = this.pos3(ev.e.lane, ev.x0, ev.z0, 1.2), b = this.pos3(ev.e.lane, ev.e.x, ev.e.z, 1.2); fx.bolt(b, a, c, .35, .1); fx.ring(a.x, a.z, 1.2, c); sfx.magic(); break; }
        case 'summon': { const s2 = ev.s, p = this.pos3(s2.lane, s2.x, s2.z, .3), c = ev.color ?? FXCOL[ev.fx] ?? 0xffa040; fx.ring(p.x, p.z, 1.8, c, { dur: .7 }); fx.burst(p.x, .5, p.z, { n: 22, color: c, speed: 3, up: 5, life: .8, size: .7 }); sfx.boom(); break; }
        case 'stealth': { const p = this.pos3(ev.e.lane, ev.e.x, ev.e.z, 1), c = ev.color ?? FXCOL[ev.fx] ?? 0x8a4aff; fx.burst(p.x, 1, p.z, { n: 20, color: c, speed: 2, up: 2, life: .6, size: .7, g: 0 }); break; }
        case 'undying': case 'reborn': { const p = this.pos3(ev.e.lane, ev.e.x, ev.e.z, .3), c = ev.type === 'reborn' ? 0x9fe4ff : 0xff3a2a; fx.ring(p.x, p.z, 2, c, { dur: .9 }); fx.burst(p.x, 1, p.z, { n: 26, color: c, speed: 2, up: 5, life: 1, size: .7 }); if (ev.e.lane === this.cam.view) fx.text(p.x, 3, p.z, ev.type === 'reborn' ? '¡RENACE!' : '¡INMORTAL!', 'skill'); sfx.magic(); break; }
        case 'spell': { if (ev.side === this.me) { this.ui.log(`Hechizo de invocador: ${SPELL_BY[ev.id].name}`); if (ev.e) { const p = this.pos3(ev.e.lane, ev.e.x, ev.e.z, .3); fx.ring(p.x, p.z, 2.2, SPELL_BY[ev.id].color, { dur: 1 }); fx.burst(p.x, .5, p.z, { n: 30, color: SPELL_BY[ev.id].color, speed: 3, up: 6, life: 1, size: .6 }); } sfx.magic(); } break; }
        case 'spellOffer': { if (ev.side === this.me) { this.ui.log('¡Elige un hechizo de invocador!'); this.ui.refresh(); } break; }
        case 'piggy': { if (ev.side === this.me) this.ui.log(`¡Hucha rota! +${ev.v} de oro`); break; }
        case 'roll': { if (ev.side === this.me) { this.ui.rebuildShop(); this.ui.log('Nueva tirada de campeones'); } break; }
        case 'cast': { const e = ev.e, p = this.pos3(e.lane, e.x, e.z, 0); if (!['heal'].includes(ev.a.type)) fx.ring(p.x, p.z, 1.3, FXCOL[ev.a.fx] ?? 0xffffff, { dur: .4, op: .6 });  break; }
        case 'nexusShot': { const nx = this.pos3(ev.side, 0, LANE.nexusZ, 6.5), t = this.pos3(ev.side, ev.t.x, ev.t.z, 1.5); fx.bolt(nx, t, this.sim.P(ev.side).team ? 0xff7a5a : 0x7ad0ff, .22, .22); sfx.nexus(); break; }
        case 'place': { const e = ev.e, p = this.pos3(e.lane, e.x, e.z, .3); fx.ring(p.x, p.z, 1.6, 0xffe08a); fx.burst(p.x, .4, p.z, { n: 18, color: 0xffe08a, speed: 3, up: 4, life: .7, size: .6 }); const v = this.views.get(e.id); if (v) v.appear = 0; break; }
        case 'sell': { const e = ev.e, p = this.pos3(e.lane, e.x, e.z, 1); fx.burst(p.x, 1, p.z, { n: 14, color: 0xffd060, speed: 3, up: 4, life: .7, size: .5 }); fx.text(p.x, 2.5, p.z, '+' + (ev.v ?? e.def.cost), 'gold'); break; }
        case 'upgrade': { const e = ev.e, p = this.pos3(e.lane, e.x, e.z, .3); fx.ring(p.x, p.z, 2.4, 0xffd060); fx.ring(p.x, p.z, 1.4, 0xffffff, { dur: .8 }); fx.burst(p.x, .5, p.z, { n: 40, colors: [0xffd060, 0xffffff, 0xffa030], speed: 4, up: 7, life: 1, size: .7 }); if (e.lane === this.me) { this.ui.log(`¡${e.upDef ? e.upDef.name : 'Mejorado'}!`); sfx.magic(); } break; }
        case 'nexusUp': { if (this.sim.P(ev.side).team === this.sim.P(this.me).team) { this.ui.log(`Nexo mejorado: ${ {hp:'Vida', atk:'Ataque', regen:'Regeneración'}[ev.kind] } nv.${ev.lvl}`); sfx.magic(); } break; }
        case 'merc': { if (ev.side !== this.me && this.sim.target(ev.side) === this.me) this.ui.log(`⚠ ${this.sim.P(ev.side).name} te envía: ${ev.m.name}`); break; }
        case 'revive': { const e = ev.e, p = this.pos3(e.lane, e.x, e.z, .3); fx.ring(p.x, p.z, 1.4, 0xffffff, { dur: .8 }); const v = this.views.get(e.id); if (v) { v.group.visible = true; v.appear = 0; } break; }
        case 'combat': this.ui.banner(`Oleada ${ev.wave + 1}`, WAVES[ev.wave].name, WAVES[ev.wave].boss); sfx.horn(); break;
        case 'wave_end': this.ui.log(`Oleada ${ev.wave + 1} superada. ¡Ingresos recibidos!`); this.nextBuild(); break;
        case 'over': this.onOver(ev); break;
      }
    }
    sim.ev.length = 0;
  }
  onOver(ev) { if (this.over) return; this.over = true; const win = ev.winner === this.sim.P(this.me).team; ev.win = win; if (!this.sim.over) this.sim.over = { winner: ev.winner, why: ev.why }; this.ui.gameOver(win, this.sim); win ? sfx.victory() : sfx.defeat(); }

  // ───── entrada ─────
  bindInput() {
    const onCanvas = e => e.target && e.target.tagName === 'CANVAS';
    addEventListener('keydown', e => { if (!this.started || e.target.tagName === 'INPUT') return; this.keys[e.code] = true; if (e.repeat) return;
      if (e.code === 'Space') { e.preventDefault(); this.toggleReady(); }
      if (e.code === 'Tab') { e.preventDefault(); this.setView((this.cam.view + (e.shiftKey ? this.sim.n - 1 : 1)) % this.sim.n); }
      if (e.code === 'Escape') { this.spellPick = null; this.select(null); this.selEnt = null; this.ui.refresh(); }
      if (e.code === 'KeyP' && this.local) this.paused = !this.paused;
      if (e.code === 'KeyF' && this.local) { this.speed = this.speed === 1 ? 2 : this.speed === 2 ? 3 : 1; this.ui.refresh(); }
      if (e.code === 'KeyX' && this.selEnt) this.sellEnt(this.selEnt);
      if (e.code === 'KeyU' && this.selEnt) this.upgradeEnt(this.selEnt, 0);
      if (e.code === 'KeyI' && this.selEnt) this.upgradeEnt(this.selEnt, 1);
      if (e.code === 'KeyC') this.setView(this.me);
      const km = 'Digit1 Digit2 Digit3 Digit4 Digit5 Digit6 Digit7 Digit8 Digit9 Digit0 Minus Equal'.split(' '); const i = km.indexOf(e.code); const roll = this.sim.P(this.me).roll; if (i >= 0 && roll[i]) this.select(roll[i]);
      if (e.code === 'KeyB') this.buyWorker();
    });
    addEventListener('keyup', e => this.keys[e.code] = false);
    addEventListener('wheel', e => { if (!onCanvas(e)) return; e.preventDefault(); this.cam.tdist = Math.max(18, Math.min(95, this.cam.tdist * (1 + Math.sign(e.deltaY) * .08))); }, { passive: false });
    addEventListener('mousemove', e => { if (!onCanvas(e) && !this.drag) { this.mx = 0; return; } this.mouse.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); this.mx = e.clientX; this.my = e.clientY; if (this.drag) { this.cam.tx -= (e.movementX) * this.cam.dist * .0016; this.cam.tz -= e.movementY * this.cam.dist * .0022; } });
    addEventListener('mousedown', e => { if (!onCanvas(e)) return; initAudio(); if (e.button === 1) { this.drag = true; e.preventDefault(); } });
    addEventListener('mouseup', e => { if (e.button === 1) this.drag = false; });
    addEventListener('contextmenu', e => { if (!onCanvas(e)) return; e.preventDefault(); if (!this.started) return; if (this.hover && this.cam.view === this.me) { const en = this.sim.P(this.me).grid[this.hover[1] * GRID.cols + this.hover[0]]; if (en) this.sellEnt(en); else this.select(null); } else this.select(null); });
    addEventListener('click', e => { if (!onCanvas(e)) return; initAudio(); if (!this.started || this.over) return; this.clickGrid(); });
  }
  select(id) { this.sel = id === this.sel ? null : id; this.selEnt = null; sfx.click(); this.updateGhost(); this.ui.refresh(); }
  setView(v) { this.cam.view = v; this.cam.tx = laneX(v); this.cam.tz = 12; if (this.selEnt && this.selEnt.lane !== v) this.selEnt = null; this.updateGhost(); this.ui.refresh(); }
  toggleReady() { const p = this.sim.P(this.me); if (this.sim.phase !== 'build') return; this.sim.setReady(this.me, !p.ready); sfx.click(); this.ui.refresh(); }
  reroll() { if (this.sim.reroll(this.me)) { sfx.place(); this.ui.rebuildShop(); } else sfx.deny(); this.ui.refresh(); }
  breakPiggy() { if (this.sim.breakPiggy(this.me)) sfx.place(); this.ui.refresh(); }
  chooseSpell(id, en) { const c = en ? en.cell : [0, 0]; if (this.sim.chooseSpell(this.me, id, c[0], c[1])) { sfx.place(); this.spellPick = null; } else sfx.deny(); this.ui.refresh(); }
  buyWorker() { if (this.sim.buyWorker(this.me)) sfx.place(); else sfx.deny(); this.ui.refresh(); }
  buyMerc(id) { if (this.sim.buyMerc(this.me, id)) { sfx.place(); const m = MBY[id]; this.ui.log(`Enviado a ${this.sim.P(this.sim.target(this.me)).name}: ${m.name} (+${m.inc} ingresos)`); } else sfx.deny(); this.ui.refresh(); }
  upgradeEnt(en, idx = 0) { if (!en || en.lane !== this.me) return; const [c, r] = en.cell; if (this.sim.upgrade(this.me, c, r, idx)) { sfx.place(); this.ui.refresh(); } else sfx.deny(); }
  upgradeNexus(k) { if (this.sim.upgradeNexus(this.me, k)) sfx.place(); else sfx.deny(); this.ui.refresh(); }
  sellEnt(en) { if (!en || en.lane !== this.me) return; const [c, r] = en.cell; if (this.sim.sell(this.me, c, r)) { sfx.sell(); if (this.selEnt === en) this.selEnt = null; this.ui.refresh(); } }
  clickGrid() {
    if (!this.hover) return; const [c, r] = this.hover; const sim = this.sim, ex = sim.P(this.cam.view).grid[r * GRID.cols + c];
    if (ex && this.spellPick && this.cam.view === this.me) { this.chooseSpell(this.spellPick, ex); return; }
    if (ex) { this.selEnt = this.selEnt === ex ? null : ex; this.sel = null; this.updateGhost(); sfx.click(); this.ui.refresh(); return; }
    if (this.cam.view !== this.me) return;
    if (this.sel && sim.phase === 'build') { const e = sim.place(this.me, this.sel, c, r); if (e) sfx.place(); else sfx.deny(); this.ui.refresh(); }
  }
  updateGhost() {
    if (this.ghost) { this.world.scene.remove(this.ghost); this.ghost = null; this.ghostId = null; }
    if (!this.sel || !this.sim || this.cam.view !== this.me) return; const m = buildModel(this.sel, 'blue'); const mat = new THREE.MeshBasicMaterial({ color: 0x4aff8a, transparent: true, opacity: .5, depthWrite: false }); m.g.traverse(o => { if (o.isMesh) { o.material = mat; o.castShadow = false; } }); this.ghostMat = mat; const g = new THREE.Group(); g.add(m.g); g.visible = false; this.ghost = g; this.ghostId = this.sel; this.ghostModel = m; this.world.scene.add(g);
  }
  pickCell() {
    this.hover = null; if (!this.started || !this.mx) return;
    this.ray.setFromCamera(this.mouse, this.world.camera); const pt = new THREE.Vector3(); if (!this.ray.ray.intersectPlane(this.plane, pt)) return;
    const lx = pt.x - laneX(this.cam.view), lz = pt.z; const c = Math.floor(lx / GRID.cell + GRID.cols / 2), r = Math.floor((lz - GRID.z0) / GRID.cell);
    if (c >= 0 && c < GRID.cols && r >= 0 && r < GRID.rows) this.hover = [c, r];
  }
  inspect() { // hover sobre enemigos para ver info
    return null;
  }

  // ───── bucle ─────
  frame(dtRaw) {
    const dt = Math.min(dtRaw, .05); this.time += dt; const w = this.world, cam = this.cam, cm = w.camera;
    if (this.started && this.sim && !this.paused) {
      if (this.local) {
        const steps = this.speed * (this.autoTest ? (+this.params.get('speed') || 1) : 1);
        for (let i = 0; i < steps; i++) { for (const p of this.sim.players) if (p.bot) aiTick(this.sim, p.side); this.sim.update(dt); this.handleEvents(); }
      } else { this.sim.update(dt); this.handleEvents(); }
    }
    // cámara
    const sp = cam.dist * .9 * dt; if (this.keys.KeyW || this.keys.ArrowUp) cam.tz -= sp; if (this.keys.KeyS || this.keys.ArrowDown) cam.tz += sp; if (this.keys.KeyA || this.keys.ArrowLeft) cam.tx -= sp; if (this.keys.KeyD || this.keys.ArrowRight) cam.tx += sp;
    if (this.keys.KeyQ) cam.yaw -= dt; if (this.keys.KeyE) cam.yaw += dt;
    const lx = laneX(cam.view) ?? 0; cam.tx = Math.max(lx - 22, Math.min(lx + 22, cam.tx)); cam.tz = Math.max(-30, Math.min(30, cam.tz));
    const k = Math.min(1, dt * 6); cam.x += (cam.tx - cam.x) * k; cam.z += (cam.tz - cam.z) * k; cam.dist += (cam.tdist - cam.dist) * k;
    const sh = this.fx.shake, sx = (Math.random() - .5) * sh * .6, sz = (Math.random() - .5) * sh * .6;
    cm.position.set(cam.x + Math.sin(cam.yaw) * Math.cos(cam.pitch) * cam.dist + sx, Math.sin(cam.pitch) * cam.dist, cam.z + Math.cos(cam.yaw) * Math.cos(cam.pitch) * cam.dist + sz); cm.lookAt(cam.x, 0, cam.z);
    cm.updateMatrixWorld();
    if (this.started && this.sim) {
      this.syncEnts(dt); this.syncProjs(); this.pickCell();
      // marcador de celda + fantasma
      const mine = this.cam.view === this.me, ok = mine && this.hover && this.sim.canPlace(this.me, this.hover[0], this.hover[1]) && (!this.sel || this.sim.P(this.me).gold >= FBY[this.sel].cost);
      this.cellMark.visible = !!this.hover;
      if (this.hover) { const p = cellPos(this.hover[0], this.hover[1]); this.cellMark.position.set(laneX(this.cam.view) + p.x, .2, p.z); const occupied = this.sim.P(this.cam.view).grid[this.hover[1] * GRID.cols + this.hover[0]]; this.cellMark.material.color.setHex(this.sel && mine ? (ok ? 0x4aff8a : 0xff4a4a) : occupied ? 0xffe08a : 0x5ab4ff); this.cellMark.material.opacity = .35 + Math.sin(this.time * 6) * .1;
        if (this.ghost) { this.ghost.visible = !!this.sel && mine; this.ghost.position.set(laneX(this.me) + p.x, Y0, p.z); this.ghost.rotation.y = Math.PI; this.ghostMat.color.setHex(ok ? 0x4aff8a : 0xff4a4a); animate(this.ghostModel, { moving: false, atk: -1, cast: 0, speed: 8 }, this.time, dt); } }
      else if (this.ghost) this.ghost.visible = false;
      this.ui.tick(dt);
    }
    if (this.started && this.sim && this.world.setNexusHp) for (let i = 0; i < this.sim.n; i++) { const T = this.sim.T(i); if (T) this.world.setNexusHp(i, T.hp / T.max); }
    this.world.grade.uniforms.flash.value *= .9;
    this.fx.update(dt); this.world.update(this.time, dt, { x: cam.x, z: cam.z });
    this.world.composer.render();
  }
}
