// Escena 3D en vivo detrás del menú (un único contexto WebGL) + visor de modelos del Códice (scissor en el mismo canvas).
import * as THREE from 'three';
import * as Models from '../models.js';
import { getSettings } from './store.js';

let renderer = null, canvas = null, raf = 0, running = false, last = 0, T = 0;
let bg = null, viewer = null, mode = 'main';
const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
export const stageCfg = { maxFps: 0 }; // 0 = sin límite (la vista previa lo limita para capturas con render por software)
let lastDraw = 0;

const spriteTex = (() => { let t; return () => { if (t) return t; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.75)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); t = new THREE.CanvasTexture(c); return t; }; })();
function rng(seed) { let s = seed >>> 0; return () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9 >>> 0) / 4294967296); }

// ───────── roca flotante (isla) ─────────
function island(r, R, opts = {}) {
  const geo = new THREE.IcosahedronGeometry(1, 3), p = geo.attributes.position, v = new THREE.Vector3();
  const f1 = 4 + r() * 3, f2 = 3 + r() * 3;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = 1 + (Math.sin(v.x * f1 + v.z * 2.1) * .5 + Math.sin(v.z * f2 + v.y * 3.1) * .5) * .13 + Math.sin(v.x * 17.3 + v.y * 11.1 + v.z * 13.7) * .05;
    if (v.y > .15) v.set(v.x * n * 1.08, .15 + (v.y - .15) * .18, v.z * n * 1.08); // parte superior plana
    else { const k = .45 + (v.y + 1) * .6; v.set(v.x * n * k, v.y * (1.7 + Math.sin(v.x * 9 + v.z * 7) * .5), v.z * n * k); } // raíz puntiaguda
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, opts.mat); m.scale.set(R, R * (opts.h || 1), R); return m;
}

function buildBackground() {
  const scene = new THREE.Scene(), r = rng(7);
  scene.fog = new THREE.FogExp2(0x1b1233, .016);
  // cielo: degradado + nebulosa + estrellas en shader
  const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { t: { value: 0 } },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec3 vP; uniform float t;
      float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
      float fbm(vec2 p){ float s=0., a=.5; for(int i=0;i<5;i++){ s+=a*n(p); p*=2.03; a*=.5; } return s; }
      void main(){ float y = vP.y; float ang = atan(vP.z, vP.x); vec2 uv = vec2(ang*2., y*3.);
        vec3 top = vec3(.02,.018,.06), mid = vec3(.11,.055,.19), hor = vec3(.40,.12,.22);
        vec3 c = mix(hor, mid, smoothstep(-.05,.25,y)); c = mix(c, top, smoothstep(.2,.75,y));
        float neb = fbm(uv*1.3 + vec2(t*.01,0.)); float neb2 = fbm(uv*2.7 - vec2(0.,t*.006));
        c += vec3(.35,.12,.55) * pow(neb,3.) * .9 * smoothstep(-.1,.6,y);
        c += vec3(.1,.25,.55) * pow(neb2,4.) * .7;
        float glow = exp(-pow(length(vec2(ang+1.57, y*1.4 - .05))*1.6, 2.));
        c += vec3(1.,.42,.15) * glow * .55;
        vec2 sp = uv*60.; float st = step(.9965, h(floor(sp))) * smoothstep(.0,.3,y) * (.6+.4*sin(t*2.+h(floor(sp))*40.));
        c += vec3(st);
        gl_FragColor = vec4(c,1.); }`,
  }));
  scene.add(sky);
  // luces
  scene.add(new THREE.HemisphereLight(0x5a4a9a, 0x1a0c10, .9));
  const rim = new THREE.DirectionalLight(0x8a7aff, 3.2); rim.position.set(-6, 9, -10); scene.add(rim);
  const rim2 = new THREE.DirectionalLight(0x4fd4ff, 1.6); rim2.position.set(10, 4, -6); scene.add(rim2);
  const key = new THREE.DirectionalLight(0xffb27a, 1.2); key.position.set(-4, 3, 10); scene.add(key);
  const lava = new THREE.PointLight(0xff6a1a, 60, 26, 1.6); lava.position.set(3.4, .3, 1.8); scene.add(lava);
  const core = new THREE.PointLight(0xff8a2a, 30, 10, 1.8); scene.add(core);
  // materiales
  const rock = new THREE.MeshStandardMaterial({ color: 0x2c2638, roughness: .92, flatShading: true });
  const rockTop = new THREE.MeshStandardMaterial({ color: 0x3b3550, roughness: .85, flatShading: true });
  const crystal = new THREE.MeshStandardMaterial({ color: 0xff9a3a, emissive: 0xff5a10, emissiveIntensity: 2.4, roughness: .3, flatShading: true });
  const crystalV = new THREE.MeshStandardMaterial({ color: 0xc89aff, emissive: 0x8a3aff, emissiveIntensity: 2.0, roughness: .3, flatShading: true });
  // plataforma principal
  const main = island(r, 7.5, { mat: rock, h: .9 }); main.position.set(3.4, -1.15, 0); scene.add(main);
  const lavaMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { t: { value: 0 } },
    vertexShader: `varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec2 vU; uniform float t; float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
      void main(){ vec2 p = vU*2.-1.; float d = length(p); float k = n(p*6.+vec2(t*.3,t*.2)) + .5*n(p*13.-t*.4);
        float cr = smoothstep(.55,.95,k); vec3 c = mix(vec3(1.,.28,.04), vec3(1.,.85,.4), cr);
        float a = smoothstep(1.,.35,d) * (.55 + .45*cr); gl_FragColor = vec4(c*1.6, a); }` });
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1, 48), lavaMat); pool.rotation.x = -Math.PI / 2; pool.scale.set(4.2, 3.2, 1); pool.position.set(3.4, -.98, 1.6); scene.add(pool);
  // fragmentos brillantes en la plataforma
  for (let i = 0; i < 26; i++) { const a = r() * Math.PI * 2, d = 2.4 + r() * 4.5; const s = new THREE.Mesh(new THREE.OctahedronGeometry(.12 + r() * .25, 0), r() < .8 ? crystal : crystalV); s.position.set(3.4 + Math.cos(a) * d, -1 + r() * .3, Math.sin(a) * d * .8); s.scale.y = 2 + r() * 3; s.rotation.set(r() * .5, r() * 3, r() * .5); scene.add(s); }
  // islas flotantes
  const isles = [];
  const spots = [[-14, 6, -26, 5], [-6, 9.5, -40, 6], [18, 8, -34, 7], [26, 2, -22, 4], [-22, -2, -18, 4], [9, 13, -55, 9], [-30, 12, -60, 10], [34, 14, -60, 8], [-9, 2.5, -14, 1.8], [14, 4, -12, 1.4], [-3, 6, -22, 1.2], [21, -4, -8, 2.2], [-18, 16, -44, 3], [2, 18, -70, 12]];
  for (const [x, y, z, s] of spots) {
    const g = new THREE.Group(); const body = island(r, s, { mat: rock, h: .8 + r() * .5 }); g.add(body);
    const top = island(r, s * .92, { mat: rockTop, h: .12 }); top.position.y = s * .05; g.add(top);
    const nc = Math.floor(2 + r() * 4); for (let i = 0; i < nc; i++) { const cr = new THREE.Mesh(new THREE.OctahedronGeometry(s * (.06 + r() * .08), 0), r() < .5 ? crystal : crystalV); const a = r() * 6.28; cr.position.set(Math.cos(a) * s * .55, s * .15, Math.sin(a) * s * .55); cr.scale.y = 2.5; cr.rotation.z = (r() - .5) * .6; g.add(cr); }
    if (r() < .35) { const f = new THREE.Mesh(new THREE.CylinderGeometry(.04 * s, .15 * s, s * 3, 6, 1, true), new THREE.MeshBasicMaterial({ color: 0xff6a20, transparent: true, opacity: .3, blending: THREE.AdditiveBlending, depthWrite: false })); f.position.y = -s * 1.8; g.add(f); }
    g.position.set(x, y, z); g.rotation.y = r() * 6; g.userData = { y, ph: r() * 6.28, sp: .2 + r() * .3 }; scene.add(g); isles.push(g);
  }
  // halos
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: spriteTex(), color: 0xff6a3a, transparent: true, opacity: .35, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  halo.scale.set(26, 26, 1); halo.position.set(3.6, 5, -8); scene.add(halo);
  const halo2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: spriteTex(), color: 0x7a3aff, transparent: true, opacity: .3, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  halo2.scale.set(50, 30, 1); halo2.position.set(-10, 10, -40); scene.add(halo2);
  // el coloso (Malphite si existe; si no, un gólem de la jungla) re-teñido como roca con lava
  let hero = null; const heroWrap = new THREE.Group(); scene.add(heroWrap);
  try {
    const kind = Models.hasModel && Models.hasModel('malphite') ? 'malphite' : 'buff_red';
    hero = Models.buildModel(kind, 'red', {}); hero.phase = 0;
    const box = new THREE.Box3().setFromObject(hero.g), h = box.getSize(new THREE.Vector3()).y || 2;
    hero.g.scale.multiplyScalar(6.4 / h);
    hero.g.traverse(o => {
      if (!o.isMesh || !o.material || Array.isArray(o.material)) return;
      const m = o.material.clone(); o.material = m; if (!m.color) return; const hsl = {}; m.color.getHSL(hsl);
      const glowy = (m.emissiveIntensity ?? 0) > .3 || (hsl.s > .35 && hsl.l > .55) || (hsl.h > .4 && hsl.h < .55 && hsl.s > .2);
      if (glowy) { m.color.setHex(0xffa040); if (m.emissive) { m.emissive.setHex(0xff5a10); m.emissiveIntensity = 2.6; } }
      else { m.color.lerp(new THREE.Color(0x2e2840), .55); if (m.roughness !== undefined) m.roughness = Math.min(1, m.roughness + .1); }
    });
    heroWrap.add(hero.g);
  } catch (e) { console.warn('menú: sin modelo del coloso', e); }
  heroWrap.position.set(3.6, -.9, 0); heroWrap.rotation.y = -.42;
  // partículas: brasas y polvo del vacío
  const mkPts = (n, color, size, spread) => {
    const g = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), seed = new Float32Array(n);
    for (let i = 0; i < n; i++) { pos[i * 3] = (r() - .5) * spread[0] + spread[3]; pos[i * 3 + 1] = r() * spread[1] - 2; pos[i * 3 + 2] = (r() - .5) * spread[2] + spread[4]; seed[i] = r(); }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.userData = { seed, base: pos.slice(), h: spread[1] };
    const p = new THREE.Points(g, new THREE.PointsMaterial({ map: spriteTex(), color, size, sizeAttenuation: true, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(p); return p;
  };
  const embers = mkPts(420, 0xff8a3a, .22, [26, 16, 18, 3, -2]);
  const motes = mkPts(260, 0xa47aff, .35, [70, 34, 50, 0, -30]);
  const camera = new THREE.PerspectiveCamera(42, 1, .1, 900);
  return { scene, camera, sky, lavaMat, isles, embers, motes, hero, heroWrap, core, lava, st: { moving: false, atk: -1, cast: 0, speed: 8 }, nextAtk: 6 };
}

function updateBackground(b, dt) {
  b.sky.material.uniforms.t.value = T; b.lavaMat.uniforms.t.value = T;
  for (const g of b.isles) { g.position.y = g.userData.y + Math.sin(T * g.userData.sp + g.userData.ph) * .6; g.rotation.y += dt * .01; }
  const step = (p, up, swirl) => { const a = p.geometry.attributes.position, { seed, base, h } = p.geometry.userData; for (let i = 0; i < seed.length; i++) { const s = seed[i], y = ((base[i * 3 + 1] + 2 + T * up * (.5 + s)) % h) - 2; a.array[i * 3 + 1] = y; a.array[i * 3] = base[i * 3] + Math.sin(T * .6 + s * 40 + y * .3) * swirl; a.array[i * 3 + 2] = base[i * 3 + 2] + Math.cos(T * .5 + s * 30) * swirl; } a.needsUpdate = true; };
  step(b.embers, 1.4, .7); step(b.motes, .35, 1.5);
  b.lava.intensity = 55 + Math.sin(T * 3.1) * 8 + Math.sin(T * 7.3) * 4;
  if (b.hero) {
    b.nextAtk -= dt; if (b.nextAtk <= 0 && b.st.atk < 0) { b.st.atk = 0; b.nextAtk = 9; }
    if (b.st.atk >= 0) { b.st.atk += dt * .7; if (b.st.atk >= 1) b.st.atk = -1; }
    try { Models.animate(b.hero, b.st, T, dt); } catch {}
    b.heroWrap.getWorldPosition(b.core.position); b.core.position.y += 3.6; b.core.position.z += 1.2;
  }
  mouse.sx += (mouse.x - mouse.sx) * Math.min(1, dt * 2); mouse.sy += (mouse.y - mouse.sy) * Math.min(1, dt * 2);
  const c = b.camera, aspect = c.aspect;
  const shot = SHOTS[mode] || SHOTS.main;
  const wide = Math.max(0, 1.6 - aspect) * 4; // pantallas más estrechas → alejar
  c.position.set(shot.p[0] + Math.sin(T * .07) * .8 + mouse.sx * .9, shot.p[1] + Math.sin(T * .11) * .3 - mouse.sy * .4, shot.p[2] + wide);
  c.lookAt(shot.l[0], shot.l[1], shot.l[2]);
}
const SHOTS = {
  main: { p: [-2.2, 2.2, 15.5], l: [1.2, 3.6, 0] },
  sub: { p: [-6, 3.5, 17], l: [0, 4, -2] },
  loading: { p: [-1.5, 3.2, 17], l: [3.5, 3.2, -2] },
  codex: { p: [10, 6, 16], l: [0, 4, -8] },
};

// ───────── visor del Códice ─────────
function buildViewer() {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x2a2230, 1.4));
  const key = new THREE.DirectionalLight(0xfff0dc, 2.8); key.position.set(-3, 6, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x6fd8ff, 2.6); rim.position.set(4, 3, -5); scene.add(rim);
  const rim2 = new THREE.DirectionalLight(0xc8aa6e, 1.4); rim2.position.set(-5, 2, -3); scene.add(rim2);
  const ped = new THREE.Group(); scene.add(ped);
  const stone = new THREE.MeshStandardMaterial({ color: 0x1c2532, roughness: .7, metalness: .3 });
  const p1 = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.35, .32, 48), stone); p1.position.y = -.16; ped.add(p1);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x0ac8b9, transparent: true, opacity: .9 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.12, .025, 8, 96), ringMat); ring.rotation.x = Math.PI / 2; ring.position.y = .005; ped.add(ring);
  const glowMat = new THREE.MeshBasicMaterial({ map: spriteTex(), color: 0x0ac8b9, transparent: true, opacity: .45, blending: THREE.AdditiveBlending, depthWrite: false });
  const glowD = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), glowMat); glowD.rotation.x = -Math.PI / 2; glowD.position.y = .01; ped.add(glowD);
  const camera = new THREE.PerspectiveCamera(30, 1, .05, 200);
  const holder = new THREE.Group(); scene.add(holder);
  return { scene, camera, holder, ringMat, glowMat, model: null, yaw: -.5, auto: true, st: { moving: false, atk: -1, cast: 0, speed: 8 }, nextAtk: 2.5, fit: { y: 1, d: 3 }, el: null, key: '' };
}
export function viewerSet(el, kind, opts = {}) {
  if (!viewer) viewer = buildViewer();
  const v = viewer; v.el = el;
  const key = kind + '|' + !!opts.upgraded;
  if (v.key !== key) {
    v.key = key;
    if (v.model) { v.holder.remove(v.model.g); v.model.g.traverse(o => o.isMesh && o.geometry?.dispose?.()); v.model = null; }
    if (kind) try {
      const m = Models.buildModel(kind, opts.tint || 'red', { upgraded: !!opts.upgraded }); m.phase = 0; v.holder.add(m.g); v.model = m;
      const box = new THREE.Box3().setFromObject(m.g), size = box.getSize(new THREE.Vector3());
      const k = 2.6 / Math.max(size.y, size.x * .8, .5); m.g.scale.multiplyScalar(k);
      v.fit = { y: size.y * k * .5, d: Math.max(size.y * k, size.x * k * .9) };
    } catch (e) { console.warn('visor', e); }
  }
  const col = new THREE.Color(opts.color ?? 0x0ac8b9); v.ringMat.color.copy(col); v.glowMat.color.copy(col);
  v.st.atk = -1; v.nextAtk = 2.2;
}
export function viewerClear() { if (viewer) viewer.el = null; }
export function viewerAttack() { if (viewer) viewer.st.atk = 0; }
export function viewerAuto(on) { if (viewer) viewer.auto = on ?? !viewer.auto; return viewer ? viewer.auto : true; }
export function viewerDrag(el) {
  let down = false, lx = 0;
  el.addEventListener('pointerdown', e => { down = true; lx = e.clientX; try { el.setPointerCapture(e.pointerId); } catch {} if (viewer) viewer.auto = false; });
  el.addEventListener('pointermove', e => { if (!down || !viewer) return; viewer.yaw += (e.clientX - lx) * .012; lx = e.clientX; });
  el.addEventListener('pointerup', () => { down = false; });
  el.addEventListener('dblclick', () => viewerAttack());
}
function renderViewer(dt, W, H) {
  const v = viewer; if (!v || !v.el || !v.el.isConnected) return;
  const rc = v.el.getBoundingClientRect(); if (rc.width < 10 || rc.height < 10) return;
  if (v.auto) v.yaw += dt * .45;
  v.holder.rotation.y = v.yaw;
  if (v.model) {
    v.nextAtk -= dt; if (v.nextAtk <= 0 && v.st.atk < 0) { v.st.atk = 0; v.nextAtk = 3.2; }
    if (v.st.atk >= 0) { v.st.atk += dt * 1.1; if (v.st.atk >= 1) v.st.atk = -1; }
    try { Models.animate(v.model, v.st, T, dt); } catch {}
  }
  const c = v.camera; c.aspect = rc.width / rc.height; c.updateProjectionMatrix();
  const fitH = v.fit.d / (2 * Math.tan(c.fov * Math.PI / 360)), d = Math.max(fitH, fitH / c.aspect) * 1.25 + 1.2;
  c.position.set(0, v.fit.y + d * .3, d); c.lookAt(0, v.fit.y * .85, 0);
  const x = rc.left, y = H - rc.bottom;
  renderer.setScissorTest(true); renderer.setViewport(x, y, rc.width, rc.height); renderer.setScissor(x, y, rc.width, rc.height);
  renderer.autoClear = false; renderer.clearDepth(); renderer.render(v.scene, c); renderer.autoClear = true;
  renderer.setScissorTest(false);
}

function frame(now) {
  if (!running) return;
  raf = requestAnimationFrame(frame);
  if (stageCfg.maxFps && now - lastDraw < 1000 / stageCfg.maxFps) return;
  lastDraw = now;
  const dt = Math.min(.05, (now - last) / 1000 || 0); last = now; T += dt;
  const t0 = performance.now();
  const W = canvas.clientWidth || innerWidth, H = canvas.clientHeight || innerHeight;
  const pr = getSettings().quality === 'low' ? .7 : Math.min(devicePixelRatio || 1, 1.5);
  if (renderer.getPixelRatio() !== pr) renderer.setPixelRatio(pr);
  const sz = renderer.getSize(new THREE.Vector2()); if (sz.x !== W || sz.y !== H) renderer.setSize(W, H, false);
  if (!bg) bg = buildBackground();
  bg.camera.aspect = W / H; bg.camera.updateProjectionMatrix();
  updateBackground(bg, dt);
  renderer.setViewport(0, 0, W, H); renderer.render(bg.scene, bg.camera);
  if (mode === 'codex') renderViewer(dt, W, H);
  window.__stageMs = performance.now() - t0;
}

export function stageStart(host) {
  if (running) return;
  if (!renderer) {
    canvas = document.createElement('canvas'); canvas.className = 'm-stage'; host.prepend(canvas);
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
      renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
    } catch (e) { console.warn('menú: sin WebGL', e); canvas.remove(); canvas = null; renderer = null; return; }
    addEventListener('pointermove', onMouse);
  }
  running = true; last = performance.now(); raf = requestAnimationFrame(frame);
}
function onMouse(e) { mouse.x = e.clientX / innerWidth * 2 - 1; mouse.y = e.clientY / innerHeight * 2 - 1; }
export function stageStop() {
  running = false; cancelAnimationFrame(raf);
  if (renderer) { removeEventListener('pointermove', onMouse); try { renderer.dispose(); renderer.forceContextLoss(); } catch {} renderer = null; canvas && canvas.remove(); canvas = null; }
}
export function stageMode(m) { mode = m; }
export const stageRunning = () => running;
