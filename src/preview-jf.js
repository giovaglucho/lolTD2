// Vista previa de Jonia + Freljord (solo desarrollo).
//  /preview-jf.html?set=jonia|freljord|all&up=0|1|2(ambos)&anim=1&t=0.45&yaw=-0.45&focus=<id>
import * as THREE from 'three';
import { buildModel, animate } from './models.js';
import jonia from './content/legions/jonia.js';
import freljord from './content/legions/freljord.js';

const q = new URLSearchParams(location.search);
const J = jonia.champions.map(c => c.model), F = freljord.champions.map(c => c.model);
const set = q.get('set') || 'all';
let ids = q.get('focus') ? q.get('focus').split(',') : set === 'jonia' ? J : set === 'freljord' ? F : [...J, ...F];
const upMode = q.get('up') ?? (q.get('focus') ? '2' : '0');
const anim = q.get('anim') === '1', T = +(q.get('t') ?? .45), yaw = +(q.get('yaw') ?? -.45), pitch = +(q.get('pitch') ?? .35);
const cellsDef = [];
for (const id of ids) { if (upMode === '2') { cellsDef.push([id, false]); cellsDef.push([id, true]); } else cellsDef.push([id, upMode === '1']); }
const W = innerWidth, H = innerHeight, n = cellsDef.length;
const cols = +(q.get('cols') || Math.ceil(Math.sqrt(n * W / H * .7))), rows = Math.ceil(n / cols);
const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(W, H); renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.setScissorTest(true);
document.body.appendChild(renderer.domElement);
const cells = cellsDef.map(([kind, up], i) => {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(up ? 0x646a78 : 0x6a717c);
  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x4a4036, 1.3));
  const d = new THREE.DirectionalLight(0xfff1dc, 2.8); d.position.set(-4, 8, 6); d.castShadow = true; d.shadow.mapSize.set(1024, 1024); const sc = d.shadow.camera; sc.left = sc.bottom = -6; sc.right = sc.top = 6; sc.far = 40; scene.add(d);
  const rim = new THREE.DirectionalLight(0x9fb8ff, 1.2); rim.position.set(3, 4, -6); scene.add(rim);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(8, 48), new THREE.MeshStandardMaterial({ color: 0x7c838d, roughness: .95 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  let m, err = '';
  try { m = buildModel(kind, 'blue', { upgraded: up }); } catch (e) { err = ' ERROR ' + e.message; console.error(e); m = buildModel('zz_missing', 'blue'); }
  m.phase = 0; scene.add(m.g); m.g.rotation.y = yaw;
  const st = { moving: false, atk: anim ? T : -1, cast: 0, speed: 9, hurt: 0 };
  for (let k = 0; k < 30; k++) animate(m, st, anim ? 1 + k / 30 : 1 + k / 30, 1 / 30);
  const box = new THREE.Box3().setFromObject(m.g), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  const cam = new THREE.PerspectiveCamera(30, (W / cols) / (H / rows), .1, 200);
  const span = Math.max(size.y, size.x / cam.aspect, size.z / cam.aspect * .8) * 1.08;
  const dist = span / (2 * Math.tan(cam.fov * Math.PI / 360)) + Math.max(size.x, size.z) * .5;
  cam.position.set(c.x, c.y + Math.sin(pitch) * dist, c.z + Math.cos(pitch) * dist); cam.lookAt(c);
  const meshes = []; m.g.traverse(o => o.isMesh && meshes.push(o));
  const lbl = document.createElement('div'); lbl.className = 'lbl'; lbl.textContent = `${kind}${up ? ' ★' : ''} · ${meshes.length} mallas · h=${size.y.toFixed(2)}${err}`;
  lbl.style.left = (i % cols) * W / cols + 6 + 'px'; lbl.style.top = Math.floor(i / cols) * H / rows + 4 + 'px'; document.body.appendChild(lbl);
  return { scene, cam };
});
cells.forEach(({ scene, cam }, i) => {
  const cw = W / cols, ch = H / rows, x = (i % cols) * cw, y = H - (Math.floor(i / cols) + 1) * ch;
  renderer.setViewport(x, y, cw, ch); renderer.setScissor(x, y, cw, ch); renderer.render(scene, cam);
});
window.__done = true;
