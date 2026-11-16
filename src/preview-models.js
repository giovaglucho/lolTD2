// Vista previa de modelos (solo desarrollo): /preview-models.html?set=champs&up=1&anim=idle&t=0.4&yaw=-0.5
import * as THREE from 'three';
import { buildModel, animate } from './models.js';

const q = new URLSearchParams(location.search);
const SETS = {
  champs: ['garen', 'ashe', 'annie', 'lux', 'malphite', 'soraka', 'darius', 'jinx', 'leona', 'teemo', 'yasuo', 'ezreal'],
  minions: ['minion', 'minion_c', 'cannon', 'super', 'minion', 'minion_c', 'cannon', 'super'],
  jungle: ['gromp', 'wolf', 'raptor', 'krug', 'buff_blue', 'buff_red', 'scuttle', 'grub'],
  void: ['herald', 'grub', 'voidhunter', 'chogath', 'baron'],
  drakes: ['drake_c', 'drake_i', 'drake_m', 'drake_o', 'elder', 'baron'],
};
const kinds = q.get('k') ? q.get('k').split(',') : SETS[q.get('set') || 'champs'];
const up = q.get('up') === '1', anim = q.get('anim') || 'idle', T = +(q.get('t') ?? .4), yaw = +(q.get('yaw') ?? -.45), pitch = +(q.get("pitch") ?? .5);
const W = innerWidth, H = innerHeight, n = kinds.length;
const cols = +(q.get('cols') || Math.ceil(Math.sqrt(n * W / H))), rows = Math.ceil(n / cols);
const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(W, H); renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.setScissorTest(true);
document.body.appendChild(renderer.domElement);
const cells = kinds.map((kind, i) => {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x6a717c);
  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x4a4036, 1.3));
  const d = new THREE.DirectionalLight(0xfff1dc, 2.8); d.position.set(-4, 8, 6); d.castShadow = true; d.shadow.mapSize.set(1024, 1024); const sc = d.shadow.camera; sc.left = sc.bottom = -6; sc.right = sc.top = 6; sc.far = 40; scene.add(d);
  const rim = new THREE.DirectionalLight(0x9fb8ff, 1.2); rim.position.set(3, 4, -6); scene.add(rim);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(8, 48), new THREE.MeshStandardMaterial({ color: 0x7c838d, roughness: .95 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const tint = q.get('tint') || (i % 2 ? 'red' : 'blue');
  const m = buildModel(kind, tint, { upgraded: up }); m.phase = 0; scene.add(m.g); m.g.rotation.y = yaw;
  const st = { moving: anim === 'walk', atk: anim === 'atk' ? T : -1, cast: anim === 'cast' ? 1 : 0, speed: 9, hurt: 0 };
  for (let k = 0; k < 30; k++) animate(m, st, anim === 'walk' ? T + k * 0 : T, 1 / 30);
  const box = new THREE.Box3().setFromObject(m.g), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  const cam = new THREE.PerspectiveCamera(30, (W / cols) / (H / rows), .1, 200);
  const span = Math.max(size.y, size.x / cam.aspect, size.z / cam.aspect * .8) * 1.08;
  const dist = span / (2 * Math.tan(cam.fov * Math.PI / 360)) + Math.max(size.x, size.z) * .5;
  cam.position.set(c.x, c.y + Math.sin(pitch) * dist, c.z + Math.cos(pitch) * dist); cam.lookAt(c);
  const meshes = []; m.g.traverse(o => o.isMesh && meshes.push(o));
  const lbl = document.createElement('div'); lbl.className = 'lbl'; lbl.textContent = `${kind}${up ? ' ★' : ''} · ${meshes.length} mallas · h=${size.y.toFixed(2)}`;
  lbl.style.left = (i % cols) * W / cols + 6 + 'px'; lbl.style.top = Math.floor(i / cols) * H / rows + 4 + 'px'; document.body.appendChild(lbl);
  return { scene, cam };
});
cells.forEach(({ scene, cam }, i) => {
  const cw = W / cols, ch = H / rows, x = (i % cols) * cw, y = H - (Math.floor(i / cols) + 1) * ch;
  renderer.setViewport(x, y, cw, ch); renderer.setScissor(x, y, cw, ch); renderer.render(scene, cam);
});
window.__done = true;
