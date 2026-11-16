// Vista previa de las legiones Piltover y Zaun + Targon (solo desarrollo).
// /preview-pt.html?set=all|pt|tg&up=0|1|both&anim=1&t=0.45&yaw=-0.45&pitch=0.35&focus=<id>&walk=1
import * as THREE from 'three';
import { buildModel, animate } from './models.js';
import piltover from './content/legions/piltover.js';
import targon from './content/legions/targon.js';

const q = new URLSearchParams(location.search);
const byTier = l => [...l.champions].sort((a, b) => a.tier - b.tier);
const PT = byTier(piltover), TG = byTier(targon);
const set = q.get('set') || 'all';
const TUR = [{ id: 'heimer_turret', name: 'Torreta', model: 'heimer_turret', tier: 0 }, { id: 'heimer_turret_up', name: 'Dragoncito', model: 'heimer_turret_up', tier: 0 }];
let champs = set === 'pt' ? PT : set === 'tg' ? TG : [...PT, ...TG, ...TUR];
const focus = q.get('focus');
const anim = q.get('anim') === '1', walk = q.get('walk') === '1', T = +(q.get('t') ?? .45);
const yaw0 = +(q.get('yaw') ?? -.4), pitch = +(q.get('pitch') ?? .32);
const upQ = q.get('up') || 'both';
let cellsDef = [];
if (focus) {
  const ids = focus.split(',');
  for (const id of ids) {
    const c = [...PT, ...TG, ...TUR].find(x => x.id === id || x.model === id) || { id, name: id, model: id, tier: 0 };
    const yaws = q.get('yaws') ? q.get('yaws').split(',').map(Number) : [yaw0, yaw0 + 1.9];
    for (const up of [false, true]) for (const y of yaws) cellsDef.push({ c, up, yaw: y });
  }
} else {
  for (const c of champs) {
    if (upQ === 'both') { cellsDef.push({ c, up: false, yaw: yaw0 }); cellsDef.push({ c, up: true, yaw: yaw0 }); }
    else cellsDef.push({ c, up: upQ === '1', yaw: yaw0 });
  }
}
const W = innerWidth, H = innerHeight, n = cellsDef.length;
const cols = +(q.get('cols') || Math.ceil(Math.sqrt(n * W / H * .8))), rows = Math.ceil(n / cols);
const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(W, H); renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.setScissorTest(true);
document.body.appendChild(renderer.domElement);
const fixedH = +(q.get('h') || 0);
const cells = cellsDef.map(({ c, up, yaw }, i) => {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x6a717c);
  scene.add(new THREE.HemisphereLight(0xe6ecff, 0x4a4036, 1.25));
  const d = new THREE.DirectionalLight(0xfff1dc, 2.7); d.position.set(-4, 8, 6); d.castShadow = true; d.shadow.mapSize.set(1024, 1024); const sc = d.shadow.camera; sc.left = sc.bottom = -4; sc.right = sc.top = 4; sc.far = 30; d.shadow.bias = -.0005; scene.add(d);
  const rim = new THREE.DirectionalLight(0x9fb8ff, 1.1); rim.position.set(3, 4, -6); scene.add(rim);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(6, 40), new THREE.MeshStandardMaterial({ color: 0x7c838d, roughness: .95 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  let m, err = null;
  try { m = buildModel(c.model, 'blue', { upgraded: up }); } catch (e) { err = e; console.error(c.model, e); m = buildModel('nope', 'blue'); }
  m.phase = 0; scene.add(m.g); m.g.rotation.y = yaw;
  const st = { moving: walk, atk: anim ? T : -1, cast: 0, speed: 9, hurt: 0 };
  for (let k = 0; k < 30; k++) animate(m, st, (walk ? T : 1.0) + k / 30, 1 / 30);
  m.g.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(m.g), size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
  const cam = new THREE.PerspectiveCamera(30, (W / cols) / (H / rows), .1, 200);
  let span, c2;
  if (focus || !fixedH) { span = Math.max(size.y, size.x / cam.aspect, size.z / cam.aspect * .8) * 1.1; c2 = ctr; }
  else { span = fixedH; c2 = new THREE.Vector3(0, fixedH * .45, 0); }
  const dist = span / (2 * Math.tan(cam.fov * Math.PI / 360)) + Math.max(size.x, size.z) * .5;
  cam.position.set(c2.x, c2.y + Math.sin(pitch) * dist, c2.z + Math.cos(pitch) * dist); cam.lookAt(c2);
  let meshes = 0; m.g.traverse(o => o.isMesh && meshes++);
  const lbl = document.createElement('div'); lbl.className = 'lbl';
  lbl.innerHTML = `<b>${c.name}${up ? ' ★' : ''}</b> T${c.tier} ${c.role ?? ''}<br>${meshes} mallas · h=${size.y.toFixed(2)}${err ? ' · ERROR ' + err.message : ''}`;
  lbl.style.left = (i % cols) * W / cols + 6 + 'px'; lbl.style.top = Math.floor(i / cols) * H / rows + 4 + 'px'; document.body.appendChild(lbl);
  return { scene, cam };
});
cells.forEach(({ scene, cam }, i) => {
  const cw = W / cols, ch = H / rows, x = (i % cols) * cw, y = H - (Math.floor(i / cols) + 1) * ch;
  renderer.setViewport(x, y, cw, ch); renderer.setScissor(x, y, cw, ch); renderer.render(scene, cam);
});
window.__done = true;
