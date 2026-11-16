import * as THREE from 'three';

export const FXCOL = { spin: 0x6fa8ff, frost: 0x9fe4ff, fire: 0xff7a2a, beam: 0xfff3b0, quake: 0xc9a77a, heal: 0x7dffb0, slash: 0xff4a4a, rocket: 0xffd24a, poison: 0x8aff5a, sun: 0xffe08a, wind: 0xcfefff, arcane: 0x4fd4ff, void: 0xc77bff,
  shadow: 0x8a4aff, blood: 0xff2a3a, holy: 0xfff0b0, lightning: 0x9fd8ff, nature: 0x7aef6a, water: 0x4fb8ff, star: 0xffe9a8 };

export class FX {
  constructor(scene, tx, camera) {
    this.scene = scene; this.tx = tx; this.camera = camera; this.parts = []; this.free = []; this.rings = []; this.beams = []; this.texts = []; this.bolts = []; this.shake = 0;
    this.mat = c => new THREE.SpriteMaterial({ map: tx.glow, color: c, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
    this.matCache = new Map();
    this.layer = document.getElementById('floaters');
    for (let i = 0; i < 700; i++) { const s = new THREE.Sprite(this.mat(0xffffff)); s.visible = false; scene.add(s); this.free.push({ s, v: new THREE.Vector3(), life: 0, max: 1, size: 1, g: 0, grow: 0 }); }
    this.ringGeo = new THREE.PlaneGeometry(1, 1);
    this.boltGeo = new THREE.BoxGeometry(1, 1, 1);
  }
  colMat(c) { let m = this.matCache.get(c); if (!m) { m = this.mat(c); this.matCache.set(c, m); } return m; }
  burst(x, y, z, o = {}) {
    const n = o.n ?? 12, c = o.color ?? 0xffffff;
    for (let i = 0; i < n; i++) {
      const p = this.free.pop(); if (!p) return; const a = Math.random() * 6.283, sp = (o.speed ?? 4) * (.3 + Math.random() * .7), up = (o.up ?? 2) * (Math.random() * .8 + .2);
      p.s.material = this.colMat(o.colors ? o.colors[(Math.random() * o.colors.length) | 0] : c); p.s.position.set(x + (Math.random() - .5) * (o.spread ?? .2), y, z + (Math.random() - .5) * (o.spread ?? .2));
      p.v.set(Math.cos(a) * sp, up, Math.sin(a) * sp); p.max = p.life = (o.life ?? .6) * (.6 + Math.random() * .6); p.size = (o.size ?? .5) * (.6 + Math.random() * .8); p.g = o.g ?? 6; p.grow = o.grow ?? -.5; p.s.visible = true; p.s.scale.setScalar(p.size); p.s.material.opacity = 1; this.parts.push(p);
    }
  }
  ring(x, z, r, color, o = {}) { const m = new THREE.Mesh(this.ringGeo, new THREE.MeshBasicMaterial({ map: this.tx.ring, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: o.op ?? .9 })); m.rotation.x = -Math.PI / 2; m.position.set(x, .22 + (o.y ?? 0), z); m.scale.setScalar(.1); this.scene.add(m); this.rings.push({ m, t: 0, dur: o.dur ?? .55, r: r * 2.2 }); }
  beam(x, z, ux, uz, len, w, color, dur = .45) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(len, w * 2), new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 1, side: THREE.DoubleSide, map: this.tx.glow }));
    m.rotation.x = -Math.PI / 2; m.rotation.z = Math.atan2(uz, ux); m.rotation.order = 'YXZ'; m.rotation.set(-Math.PI / 2, 0, 0); m.rotation.y = 0;
    m.position.set(x + ux * len / 2, 1.3, z + uz * len / 2); m.rotation.set(0, 0, 0); m.quaternion.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)); const q2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.atan2(uz, ux)); m.quaternion.premultiply(q2);
    this.scene.add(m); this.beams.push({ m, t: 0, dur });
    for (let i = 0; i < 18; i++) this.burst(x + ux * len * Math.random(), 1.3, z + uz * len * Math.random(), { n: 1, color, speed: 1.5, up: 1, life: .5, size: .6, g: 0 });
  }
  bolt(from, to, color = 0xffffff, dur = .18, w = .12) {
    const d = new THREE.Vector3().subVectors(to, from), L = d.length();
    const m = new THREE.Mesh(this.boltGeo, new THREE.MeshBasicMaterial({ color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); m.scale.set(w, w, L);
    m.position.copy(from).addScaledVector(d, .5); m.lookAt(to); this.scene.add(m); this.bolts.push({ m, t: 0, dur });
  }
  text(x, y, z, str, cls) {
    if (this.texts.length > 40) return; const el = document.createElement('div'); el.className = 'ft ' + (cls || ''); el.textContent = str; this.layer.appendChild(el);
    this.texts.push({ el, p: new THREE.Vector3(x + (Math.random() - .5) * .8, y, z), t: 0, dur: 1 });
  }
  impact(x, z, color, size = .2, y = 1.2) { this.burst(x, y, z, { n: 7, color, speed: 3, up: 2, life: .35, size: .35 + size, g: 4 }); }
  update(dt) {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i]; p.life -= dt; if (p.life <= 0) { p.s.visible = false; this.free.push(p); this.parts.splice(i, 1); continue; }
      p.v.y -= p.g * dt; p.s.position.addScaledVector(p.v, dt); const k = p.life / p.max; p.s.scale.setScalar(Math.max(.01, p.size * (k * (1 + p.grow) + (1 - k) * 0 + (p.grow > 0 ? (1 - k) * p.grow * 2 : 0)))); p.s.material = p.s.material; 
    }
    for (let i = this.rings.length - 1; i >= 0; i--) { const r = this.rings[i]; r.t += dt; const k = r.t / r.dur; if (k >= 1) { this.scene.remove(r.m); r.m.material.dispose(); this.rings.splice(i, 1); continue; } r.m.scale.setScalar(.1 + r.r * (1 - Math.pow(1 - k, 3))); r.m.material.opacity = (1 - k) * .9; }
    for (let i = this.beams.length - 1; i >= 0; i--) { const b = this.beams[i]; b.t += dt; const k = b.t / b.dur; if (k >= 1) { this.scene.remove(b.m); b.m.geometry.dispose(); b.m.material.dispose(); this.beams.splice(i, 1); continue; } b.m.material.opacity = Math.min(1, (1 - k) * 1.6); b.m.scale.y = 1 - k * .6; }
    for (let i = this.bolts.length - 1; i >= 0; i--) { const b = this.bolts[i]; b.t += dt; const k = b.t / b.dur; if (k >= 1) { this.scene.remove(b.m); b.m.material.dispose(); this.bolts.splice(i, 1); continue; } b.m.material.opacity = 1 - k; }
    const v = new THREE.Vector3(), W = innerWidth, H = innerHeight;
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i]; t.t += dt; if (t.t >= t.dur) { t.el.remove(); this.texts.splice(i, 1); continue; }
      v.copy(t.p); v.y += t.t * 1.6; v.project(this.camera); const behind = v.z > 1; t.el.style.opacity = behind ? 0 : Math.min(1, (1 - t.t / t.dur) * 2);
      t.el.style.transform = `translate(${(v.x * .5 + .5) * W}px,${(-v.y * .5 + .5) * H}px) translate(-50%,-50%) scale(${1 + Math.max(0, .3 - t.t * 1.5)})`;
    }
    this.shake = Math.max(0, this.shake - dt * 3);
  }
}
