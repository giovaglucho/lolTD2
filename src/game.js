import * as THREE from 'three';
import { createWorld } from './world.js';
import { buildModel, animate } from './models.js';
import { Sim, laneX, cellPos, FBY, MBY } from './sim.js';
import { aiTurn } from './ai.js';
import { FX, FXCOL } from './fx.js';
import { sfx, initAudio } from './sfx.js';
import { GRID, LANE, CFG, WAVES, CREEPS, FIGHTERS, MERCS } from './data.js';

const Y0 = .17;
export class Game {
  constructor(canvas, ui) {
    this.ui = ui; this.world = createWorld(canvas); this.sim = null; this.views = new Map(); this.pviews = new Map(); this.time = 0;
    this.fx = new FX(this.world.scene, this.world.tx, this.world.camera);
    this.cam = { x: laneX(0), z: 12, dist: 42, tx: laneX(0), tz: 12, tdist: 42, yaw: 0, pitch: .93, view: 0 };
    this.keys = {}; this.sel = null; this.hover = null; this.selEnt = null; this.speed = 1; this.paused = false; this.ghost = null; this.ghostId = null; this.started = false;
    this.ray = new THREE.Raycaster(); this.mouse = new THREE.Vector2(); this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -Y0);
    this.cellMark = this.makeCellMark(); this.hpGeo = new THREE.PlaneGeometry(1, 1);
    this.hpBg = new THREE.MeshBasicMaterial({ color: 0x0a0e18, depthTest: false, transparent: true, opacity: .85 });
    this.hpM = { 0: new THREE.MeshBasicMaterial({ color: 0x3ac8ff, depthTest: false }), 1: new THREE.MeshBasicMaterial({ color: 0xff4a3a, depthTest: false }), g: new THREE.MeshBasicMaterial({ color: 0xb04aff, depthTest: false }) };
    this.ringTex = this.world.tx.ring;
    this.bindInput(canvas);
    this.params = new URLSearchParams(location.search); this.autoTest = this.params.get('auto') === '1';
    this.world.scene.add(this.cellMark);
    this.ring = null;
  }
  makeCellMark() { const m = new THREE.Mesh(new THREE.PlaneGeometry(GRID.cell, GRID.cell), new THREE.MeshBasicMaterial({ color: 0x4aff8a, transparent: true, opacity: .45, depthWrite: false, blending: THREE.AdditiveBlending })); m.rotation.x = -Math.PI / 2; m.visible = false; return m; }

  start(opts = {}) {
    for (const v of this.views.values()) this.world.scene.remove(v.group); this.views.clear(); for (const p of this.pviews.values()) this.world.scene.remove(p.mesh); this.pviews.clear();
    this.sim = new Sim(); this.aiDone = -1; this.started = true; this.sel = null; this.selEnt = null; this.over = false; this.hardness = opts.hard ?? 1;
    this.sim.players[1].gold += Math.round((this.hardness - 1) * 150);
    this.cam.view = 0; this.cam.tx = laneX(0); this.cam.tz = 12;
    this.ui.onStart(this); this.nextBuild(true);
  }
  nextBuild(first) { // turno de la IA al empezar cada fase de construcción
    this.aiDone = this.sim.wave; aiTurn(this.sim, 1, 1); this.sim.P(1).ready = true; // la IA siempre está lista
    if (this.autoTest) { aiTurn(this.sim, 0, 1); }
    this.ui.refresh(); if (!first) sfx.horn();
  }

  // ───── entidades ─────
  makeView(e) {
    const d = e.def, kind = e.kind === 'fighter' ? d.id : d.k, tint = e.owner === 0 ? 'blue' : e.owner === 1 ? 'red' : 'red';
    const model = buildModel(kind, tint); model.phase = Math.random() * 6.28; const group = new THREE.Group(); group.add(model.g);
    const sc = e.kind === 'fighter' ? 1.3 : d.s; model.g.scale.setScalar(sc);
    const box = new THREE.Box3().setFromObject(model.g); const h = box.max.y;
    const side = e.kind === 'fighter' ? e.lane : (e.owner === 'wave' ? 'g' : e.owner);
    const col = side === 0 ? 0x4aa8ff : side === 1 ? 0xff5a4a : 0xb04aff;
    const ring = new THREE.Mesh(this.hpGeo, new THREE.MeshBasicMaterial({ map: this.ringTex, color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: e.kind === 'fighter' ? .85 : .6 }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = .03; ring.scale.setScalar(Math.max(1.6, e.radius * 3.4)); group.add(ring);
    const bar = new THREE.Group(); const w = Math.max(1.3, Math.min(3.4, h * .9)); const bg = new THREE.Mesh(this.hpGeo, this.hpBg), fg = new THREE.Mesh(this.hpGeo, this.hpM[side]);
    bg.scale.set(w + .08, .17, 1); fg.scale.set(w, .12, 1); bg.renderOrder = 10; fg.renderOrder = 11; bar.add(bg, fg); bar.position.y = h + .6; group.add(bar);
    this.world.scene.add(group);
    return { e, model, group, ring, bar, fg, w, h, dead: false, atkP: -1, hurt: 0, castT: 0, mats: null, appear: 0 };
  }
  syncEnts(dt) {
    const sim = this.sim, alive = new Set();
    for (const e of sim.ents) {
      alive.add(e.id); let v = this.views.get(e.id); if (!v) { v = this.makeView(e); this.views.set(e.id, v); v.appear = e.team === 'att' ? 0 : 1; }
      const g = v.group; g.position.set(laneX(e.lane) + e.x, Y0, e.z);
      let rot = e.face; g.rotation.y += (Math.atan2(Math.sin(rot - g.rotation.y), Math.cos(rot - g.rotation.y))) * Math.min(1, dt * 14);
      v.appear = Math.min(1, v.appear + dt * 3);
      const dying = e.dead;
      if (dying) {
        const k = Math.min(1, e.deathT / .45); v.model.g.rotation.x = -k * 1.45 * (v.model.rig.flyer ? .5 : 1); g.position.y = Y0 - Math.max(0, e.deathT - 1.2) * .8 - (v.model.rig.flyer ? (1 - k) * -.0 : 0);
        v.bar.visible = false; v.ring.visible = false; if (e.deathT > (e.team === 'def' ? 1.5 : 1.9)) g.visible = false; v.model.g.scale.setScalar((e.kind === 'fighter' ? 1.3 : e.def.s) * (e.deathT > 1.2 ? Math.max(.01, 1 - (e.deathT - 1.2) * 1.4) : 1));
      } else {
        g.visible = true; v.model.g.rotation.x = 0; v.model.g.scale.setScalar((e.kind === 'fighter' ? 1.3 : e.def.s) * (.4 + .6 * v.appear)); v.bar.visible = e.hp < e.maxHp || e.kind === 'fighter' && false ? true : e.hp < e.maxHp; v.ring.visible = true;
        const r = Math.max(.001, e.hp / e.maxHp); v.fg.scale.x = v.w * r; v.fg.position.x = -(v.w * (1 - r)) / 2; v.bar.quaternion.copy(this.world.camera.quaternion);
        if (e.stun > 0) { v.model.g.rotation.z = Math.sin(this.time * 30) * .06; if (Math.random() < dt * 8) this.fx.burst(g.position.x, v.h + 1.1, g.position.z, { n: 1, color: 0xffee66, speed: .8, up: .4, life: .5, size: .35, g: 0 }); } else v.model.g.rotation.z = 0;
        if (e.slow > 0 && Math.random() < dt * 6) this.fx.burst(g.position.x, 1, g.position.z, { n: 1, color: 0x9fe4ff, speed: .5, up: .5, life: .6, size: .3, g: 0 });
        if (e.dot > 0 && Math.random() < dt * 8) this.fx.burst(g.position.x, v.h * .8, g.position.z, { n: 1, color: 0x8aff5a, speed: .5, up: 1.2, life: .6, size: .3, g: -2 });
      }
      const st = { moving: e.moving && !dying, atk: e.atkT >= 0 ? e.atkT / Math.min(.55, .7 / e.aspd) : -1, cast: e.castT > 0 ? 1 : 0, speed: 5 + e.speed * 1.6 * (e.slow > 0 ? .6 : 1), hurt: e.flash > 0 ? e.flash / .12 : 0 };
      if (!dying) animate(v.model, st, this.time, dt);
      // flash al recibir daño
      if (e.flash > 0 && !v.flashed) { v.flashed = true; v.model.g.traverse(o => { if (o.isMesh && o.material.emissive) { o.userData.oe = o.material.emissiveIntensity; } }); }
      v.selected = this.selEnt === e;
      v.ring.material.opacity = (e.kind === 'fighter' ? .85 : .55) * (v.selected ? 1 : .8) + (v.selected ? Math.sin(this.time * 8) * .15 : 0);
    }
    for (const [id, v] of this.views) if (!alive.has(id)) { this.world.scene.remove(v.group); this.views.delete(id); }
  }
  syncProjs() {
    const alive = new Set();
    for (const p of this.sim.projs) {
      if (p.delay > 0) continue; alive.add(p.id); let pv = this.pviews.get(p.id);
      if (!pv) { const mesh = new THREE.Group(); const core = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshBasicMaterial({ color: p.color })); core.scale.setScalar(p.size); const halo = new THREE.Sprite(this.fx.colMat(p.color)); halo.scale.setScalar(p.size * 6); mesh.add(core, halo); this.world.scene.add(mesh); pv = { mesh, p, trail: 0 }; this.pviews.set(p.id, pv); sfx.shoot(); }
      const lx = laneX(p.src.lane); pv.mesh.position.set(lx + p.x, p.y ?? 1.2, p.z);
      pv.trail -= 1; if (pv.trail <= 0) { pv.trail = 1; this.fx.burst(lx + p.x, p.y ?? 1.2, p.z, { n: 1, color: p.color, speed: .2, up: .1, life: .3, size: p.size * 3, g: 0 }); }
    }
    for (const [id, pv] of this.pviews) if (!alive.has(id)) { this.world.scene.remove(pv.mesh); this.pviews.delete(id); }
  }
  pos3(lane, x, z, y = 1) { return new THREE.Vector3(laneX(lane) + x, y, z); }

  handleEvents() {
    const fx = this.fx, sim = this.sim;
    for (const ev of sim.ev) {
      switch (ev.type) {
        case 'hit': {
          const t = ev.t, lane = t.lane; const p = t.isNexus ? this.pos3(lane, t.x, t.z, 5) : this.pos3(lane, t.x, t.z, 2.2);
          if (ev.amt >= 1) { const cls = t.isNexus ? 'nex' : t.team === 'def' ? 'dmgd' : (ev.big ? 'big' : ''); fx.text(p.x, p.y, p.z, Math.round(ev.amt), cls); }
          if (t.isNexus) { fx.burst(p.x, 4, p.z + 1, { n: 10, color: 0xffa060, speed: 5, up: 4, life: .5, size: .7 }); fx.shake = .5; this.world.grade.uniforms.flash.value = lane === this.cam.view ? .12 : 0; sfx.nexus(); }
          else { fx.burst(p.x, 1.2, p.z, { n: ev.big ? 8 : 4, color: t.team === 'def' ? 0xff6a5a : 0xffe0a0, speed: 3, up: 2, life: .3, size: .35 }); sfx.hit(); }
          break;
        }
        case 'melee': { const e = ev.e, a = this.pos3(e.lane, e.x, e.z, 1.2), b = this.pos3(ev.t.lane, ev.t.x, ev.t.z, 1.2); this.fx.burst((a.x + b.x) / 2, 1.3, (a.z + b.z) / 2, { n: 6, color: 0xffffff, speed: 4, up: 1, life: .22, size: .35 }); break; }
        case 'impact': fx.impact(laneX(ev.lane ?? this.view0lane(ev)) + ev.x, ev.z, ev.color, ev.size); break;
        case 'death': {
          const e = ev.e, p = this.pos3(e.lane, e.x, e.z, 1); sfx.death();
          fx.burst(p.x, 1, p.z, { n: e.boss ? 40 : 12, color: e.team === 'def' ? 0xffffff : 0xffd870, colors: e.team === 'def' ? [0x4aa8ff, 0xffffff] : [0xffd870, 0xffa030, 0xffffff], speed: e.boss ? 9 : 4, up: 4, life: .8, size: e.boss ? 1.2 : .6 });
          if (e.team === 'att' && e.owner === 'wave') { const b = Math.round(e.def.bounty * Math.pow(Math.pow(1.13, sim.wave), .5)); if (b > 0 && e.lane === 0) fx.text(p.x, 2.8, p.z, '+' + b, 'gold'); }
          if (e.boss) { fx.shake = 1.0; fx.ring(p.x, p.z, 8, 0xffd060); }
          break;
        }
        case 'aoe': {
          const c = FXCOL[ev.fx] ?? 0xffffff, lane = ev.e.lane, p = this.pos3(lane, ev.x, ev.z, .3);
          fx.ring(p.x, p.z, ev.r, c); fx.ring(p.x, p.z, ev.r * .6, 0xffffff, { dur: .35, op: .6 });
          fx.burst(p.x, .6, p.z, { n: 22, color: c, speed: ev.r * 1.8, up: 5, life: .6, size: .9, spread: ev.r * .5 });
          if (ev.fx === 'quake' || ev.fx === 'void') { fx.shake = Math.max(fx.shake, .6); sfx.boom(); } else sfx.magic();
          if (ev.fx === 'fire' || ev.fx === 'rocket') sfx.boom();
          break;
        }
        case 'lob': {
          const c = FXCOL[ev.fx] ?? 0xffffff, lane = ev.e.lane, a = this.pos3(lane, ev.x0, ev.z0, 2), b = this.pos3(lane, ev.x1, ev.z1, .5);
          for (let i = 0; i < 12; i++) fx.burst(a.x + (b.x - a.x) * i / 12, 1.5 + Math.sin(i / 12 * Math.PI) * 2.5, a.z + (b.z - a.z) * i / 12, { n: 2, color: c, speed: .4, up: .3, life: .45, size: .8, g: 0 });
          fx.ring(b.x, b.z, ev.e.ab ? Math.max(1, ev.e.ab.r || 2) : 2, c, { dur: .35, op: .35 }); sfx.magic(); break;
        }
        case 'beam': { const c = FXCOL[ev.fx] ?? 0xffffff, p = this.pos3(ev.e.lane, ev.x, ev.z, 0); fx.beam(p.x, p.z, ev.ux, ev.uz, ev.len, ev.w * .9, c, .5); sfx.magic(); break; }
        case 'heal': { const p = this.pos3(ev.t.lane, ev.t.x, ev.t.z, 0.4); fx.ring(p.x, p.z, 1.6, 0x7dffb0); fx.burst(p.x, 0.6, p.z, { n: 14, color: 0x7dffb0, speed: 1.2, up: 4, life: .9, size: .5, g: -1 }); fx.text(p.x, 2.4, p.z, '+' + Math.round(ev.amt), 'heal'); sfx.heal(); break; }
        case 'poison': { const p = this.pos3(ev.t.lane, ev.t.x, ev.t.z, 1.5); fx.burst(p.x, 1.4, p.z, { n: 12, color: FXCOL[ev.fx] ?? 0x8aff5a, speed: 2, up: 2, life: .6, size: .6 }); break; }
        case 'dash': { const a = this.pos3(ev.e.lane, ev.x0, ev.z0, 1), b = this.pos3(ev.e.lane, ev.x1, ev.z1, 1); fx.bolt(a, b, 0xcfefff, .3, .25); fx.ring(b.x, b.z, 2, 0xcfefff); sfx.magic(); break; }
        case 'cast': { const e = ev.e, p = this.pos3(e.lane, e.x, e.z, 0); if (!['heal'].includes(ev.a.type)) fx.ring(p.x, p.z, 1.3, FXCOL[ev.a.fx] ?? 0xffffff, { dur: .4, op: .6 }); if (e.lane === this.cam.view && e.kind === 'fighter') fx.text(p.x, 3.4, p.z, ev.a.name || '', 'skill'); break; }
        case 'nexusShot': { const nx = this.pos3(ev.side, 0, LANE.nexusZ, 6.5), t = this.pos3(ev.side, ev.t.x, ev.t.z, 1.5); fx.bolt(nx, t, ev.side ? 0xff7a5a : 0x7ad0ff, .22, .22); sfx.nexus(); break; }
        case 'place': { const e = ev.e, p = this.pos3(e.lane, e.x, e.z, .3); fx.ring(p.x, p.z, 1.6, 0xffe08a); fx.burst(p.x, .4, p.z, { n: 18, color: 0xffe08a, speed: 3, up: 4, life: .7, size: .6 }); const v = this.views.get(e.id); if (v) v.appear = 0; break; }
        case 'sell': { const e = ev.e, p = this.pos3(e.lane, e.x, e.z, 1); fx.burst(p.x, 1, p.z, { n: 14, color: 0xffd060, speed: 3, up: 4, life: .7, size: .5 }); fx.text(p.x, 2.5, p.z, '+' + e.def.cost, 'gold'); break; }
        case 'revive': { const e = ev.e, p = this.pos3(e.lane, e.x, e.z, .3); fx.ring(p.x, p.z, 1.4, 0xffffff, { dur: .8 }); const v = this.views.get(e.id); if (v) { v.group.visible = true; v.appear = 0; } break; }
        case 'combat': this.ui.banner(`Oleada ${ev.wave + 1}`, WAVES[ev.wave].name, WAVES[ev.wave].boss); sfx.horn(); break;
        case 'wave_end': this.ui.log(`Oleada ${ev.wave + 1} superada. ¡Ingresos recibidos!`); this.nextBuild(); break;
        case 'over': this.onOver(ev); break;
      }
    }
    sim.ev.length = 0;
  }
  view0lane() { return this.cam.view; }
  onOver(ev) { const win = ev.winner === 0; ev.win = win; this.ui.gameOver(win, this.sim); win ? sfx.victory() : sfx.defeat(); }

  // ───── entrada ─────
  bindInput(canvas) {
    addEventListener('keydown', e => { if (!this.started) return; this.keys[e.code] = true; if (e.repeat) return;
      if (e.code === 'Space') { e.preventDefault(); this.toggleReady(); }
      if (e.code === 'Tab') { e.preventDefault(); this.setView(1 - this.cam.view); }
      if (e.code === 'Escape') this.select(null);
      if (e.code === 'KeyP') this.paused = !this.paused;
      if (e.code === 'KeyF') this.speed = this.speed === 1 ? 2 : this.speed === 2 ? 3 : 1, this.ui.refresh();
      if (e.code === 'KeyX' && this.selEnt) this.sellEnt(this.selEnt);
      const km = 'Digit1 Digit2 Digit3 Digit4 Digit5 Digit6 Digit7 Digit8 Digit9 Digit0 Minus Equal'.split(' '); const i = km.indexOf(e.code); if (i >= 0 && FIGHTERS[i]) this.select(FIGHTERS[i].id);
      if (e.code === 'KeyB') this.buyWorker();
    });
    addEventListener('keyup', e => this.keys[e.code] = false);
    canvas.addEventListener('wheel', e => { e.preventDefault(); this.cam.tdist = Math.max(22, Math.min(95, this.cam.tdist * (1 + Math.sign(e.deltaY) * .08))); }, { passive: false });
    canvas.addEventListener('mousemove', e => { this.mouse.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); this.mx = e.clientX; this.my = e.clientY; if (this.drag) { this.cam.tx -= (e.movementX) * this.cam.dist * .0016; this.cam.tz -= e.movementY * this.cam.dist * .0022; } });
    canvas.addEventListener('mousedown', e => { initAudio(); if (e.button === 1) { this.drag = true; e.preventDefault(); } });
    addEventListener('mouseup', e => { if (e.button === 1) this.drag = false; });
    canvas.addEventListener('contextmenu', e => { e.preventDefault(); if (!this.started) return; if (this.hover) { const en = this.sim.P(0).grid[this.hover[1] * GRID.cols + this.hover[0]]; if (en) this.sellEnt(en); else this.select(null); } else this.select(null); });
    canvas.addEventListener('click', e => { initAudio(); if (!this.started || this.over) return; this.clickGrid(); });
  }
  select(id) { this.sel = id === this.sel ? null : id; this.selEnt = null; sfx.click(); this.updateGhost(); this.ui.refresh(); }
  setView(v) { this.cam.view = v; this.cam.tx = laneX(v); this.cam.tz = 12; this.updateGhost(); this.ui.refresh(); }
  toggleReady() { const p = this.sim.P(0); if (this.sim.phase !== 'build') return; p.ready = !p.ready; sfx.click(); this.ui.refresh(); }
  buyWorker() { if (this.sim.buyWorker(0)) sfx.place(); else sfx.deny(); this.ui.refresh(); }
  buyMerc(id) { if (this.sim.buyMerc(0, id)) { sfx.place(); const m = MBY[id]; this.ui.log(`Enviado: ${m.name} (+${m.inc} ingresos)`); } else sfx.deny(); this.ui.refresh(); }
  sellEnt(en) { const [c, r] = en.cell; if (this.sim.sell(0, c, r)) { sfx.sell(); if (this.selEnt === en) this.selEnt = null; this.ui.refresh(); } }
  clickGrid() {
    if (!this.hover || this.cam.view !== 0) return; const [c, r] = this.hover; const sim = this.sim, ex = sim.P(0).grid[r * GRID.cols + c];
    if (ex) { this.selEnt = this.selEnt === ex ? null : ex; this.sel = null; this.updateGhost(); sfx.click(); this.ui.refresh(); return; }
    if (this.sel && sim.phase === 'build') { const e = sim.place(0, this.sel, c, r); if (e) { sfx.place(); if (sim.P(0).gold < FBY[this.sel].cost) { /* mantener selección */ } } else sfx.deny(); this.ui.refresh(); }
  }
  updateGhost() {
    if (this.ghost) { this.world.scene.remove(this.ghost); this.ghost = null; this.ghostId = null; }
    if (!this.sel || this.cam.view !== 0) return; const m = buildModel(this.sel, 'blue'); const mat = new THREE.MeshBasicMaterial({ color: 0x4aff8a, transparent: true, opacity: .5, depthWrite: false }); m.g.traverse(o => { if (o.isMesh) { o.material = mat; o.castShadow = false; } }); this.ghostMat = mat; const g = new THREE.Group(); g.add(m.g); g.visible = false; this.ghost = g; this.ghostId = this.sel; this.ghostModel = m; this.world.scene.add(g);
  }
  pickCell() {
    this.hover = null; if (!this.started || !this.mx || this.cam.view !== this.cam.view) return;
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
      const steps = this.speed * (this.autoTest ? (+this.params.get('speed') || 1) : 1);
      for (let i = 0; i < steps; i++) { this.sim.update(dt); this.handleEvents(); }
    }
    // cámara
    const sp = cam.dist * .9 * dt; if (this.keys.KeyW || this.keys.ArrowUp) cam.tz -= sp; if (this.keys.KeyS || this.keys.ArrowDown) cam.tz += sp; if (this.keys.KeyA || this.keys.ArrowLeft) cam.tx -= sp; if (this.keys.KeyD || this.keys.ArrowRight) cam.tx += sp;
    if (this.keys.KeyQ) cam.yaw -= dt; if (this.keys.KeyE) cam.yaw += dt;
    const lx = laneX(cam.view); cam.tx = Math.max(lx - 20, Math.min(lx + 20, cam.tx)); cam.tz = Math.max(-30, Math.min(30, cam.tz));
    const k = Math.min(1, dt * 6); cam.x += (cam.tx - cam.x) * k; cam.z += (cam.tz - cam.z) * k; cam.dist += (cam.tdist - cam.dist) * k;
    const sh = this.fx.shake, sx = (Math.random() - .5) * sh * .6, sz = (Math.random() - .5) * sh * .6;
    cm.position.set(cam.x + Math.sin(cam.yaw) * Math.cos(cam.pitch) * cam.dist + sx, Math.sin(cam.pitch) * cam.dist, cam.z + Math.cos(cam.yaw) * Math.cos(cam.pitch) * cam.dist + sz); cm.lookAt(cam.x, 0, cam.z);
    cm.updateMatrixWorld();
    if (this.started && this.sim) {
      this.syncEnts(dt); this.syncProjs(); this.pickCell();
      // marcador de celda + fantasma
      const ok = this.hover && this.sim.canPlace(0, this.hover[0], this.hover[1]) && (!this.sel || this.sim.P(0).gold >= FBY[this.sel].cost);
      this.cellMark.visible = !!this.hover && this.cam.view === 0 && (this.sel || this.selEnt || this.hover);
      if (this.hover) { const p = cellPos(this.hover[0], this.hover[1]); this.cellMark.position.set(laneX(this.cam.view) + p.x, .2, p.z); const occupied = this.sim.P(0).grid[this.hover[1] * GRID.cols + this.hover[0]]; this.cellMark.material.color.setHex(this.sel ? (ok ? 0x4aff8a : 0xff4a4a) : occupied ? 0xffe08a : 0x5ab4ff); this.cellMark.material.opacity = .35 + Math.sin(this.time * 6) * .1;
        if (this.ghost) { this.ghost.visible = !!this.sel; this.ghost.position.set(laneX(0) + p.x, Y0, p.z); this.ghost.rotation.y = Math.PI; this.ghostMat.color.setHex(ok ? 0x4aff8a : 0xff4a4a); animate(this.ghostModel, { moving: false, atk: -1, cast: 0, speed: 8 }, this.time, dt); } }
      else if (this.ghost) this.ghost.visible = false;
      this.ui.tick(dt);
    }
    this.world.grade.uniforms.flash.value *= .9;
    this.fx.update(dt); this.world.update(this.time, dt, { x: cam.x, z: cam.z });
    this.world.composer.render();
  }
}
