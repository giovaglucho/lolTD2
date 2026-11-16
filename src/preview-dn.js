// Vista previa (solo desarrollo) de las legiones Demacia y Noxus.
//  /preview-dn.html                    → 20 campeones, normal + mejorado lado a lado
//  /preview-dn.html?leg=demacia        → solo una legión (celdas más grandes)
//  /preview-dn.html?anim=1&t=0.45      → todos a mitad de su animación de ataque
//  /preview-dn.html?focus=garen        → primer plano: frente, mejorado, espalda y ataque
//  /preview-dn.html?k=tibbers,annie    → modelos sueltos
import * as THREE from 'three';
import { buildModel, animate } from './models.js';
import demacia from './content/legions/demacia.js';
import noxus from './content/legions/noxus.js';

const q = new URLSearchParams(location.search);
const W = innerWidth, H = innerHeight;
const anim = q.get('anim') === '1', T = +(q.get('t') ?? .45), yaw0 = +(q.get('yaw') ?? -.4), pitch = +(q.get('pitch') ?? .32);
const legs = q.get('leg') ? [q.get('leg') === 'noxus' ? noxus : demacia] : [demacia, noxus];
let cells; // [{ items:[{kind, up, yaw, atk}], label }]
const focus = q.get('focus');
if (focus) {
  const c = [...demacia.champions, ...noxus.champions].find(x => x.id === focus || x.model === focus);
  const kind = c ? c.model : focus, nm = c ? c.name : focus;
  cells = [
    { items: [{ kind, up: false, yaw: -.35 }], label: nm + ' · frente' },
    { items: [{ kind, up: true, yaw: -.35 }], label: nm + ' ★ mejorado' },
    { items: [{ kind, up: false, yaw: 2.6 }], label: nm + ' · espalda' },
    { items: [{ kind, up: false, yaw: -1.2, atk: T }], label: nm + ' · ataque t=' + T },
  ];
} else if (q.get('k')) {
  cells = q.get('k').split(',').map(k => ({ items: [{ kind: k, up: q.get('up') === '1', yaw: yaw0, atk: anim ? T : -1 }], label: k }));
} else {
  const champs = legs.flatMap(l => l.champions);
  cells = champs.map(c => ({
    label: `${c.name} · T${c.tier}`,
    items: [{ kind: c.model, up: false, yaw: anim ? -.9 : yaw0, atk: anim ? T : -1, dx: -1 }, { kind: c.model, up: true, yaw: anim ? -.9 : yaw0, atk: anim ? T : -1, dx: 1 }],
  }));
}
const n = cells.length;
const cols = +(q.get('cols') || (focus ? 4 : n === 20 ? 5 : Math.ceil(Math.sqrt(n * W / H / 2)))), rows = Math.ceil(n / cols);
const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(W, H); renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.setScissorTest(true);
document.body.appendChild(renderer.domElement);

const stats = [];
const built = cells.map((cell, i) => {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x6a717c);
  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x4a4036, 1.3));
  const d = new THREE.DirectionalLight(0xfff1dc, 2.8); d.position.set(-4, 8, 6); d.castShadow = true; d.shadow.mapSize.set(1024, 1024);
  const sc = d.shadow.camera; sc.left = sc.bottom = -6; sc.right = sc.top = 6; sc.far = 40; scene.add(d);
  const rim = new THREE.DirectionalLight(0x9fb8ff, 1.2); rim.position.set(3, 4, -6); scene.add(rim);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(9, 48), new THREE.MeshStandardMaterial({ color: 0x7c838d, roughness: .95 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const box = new THREE.Box3(); let meshes = 0, hgt = 0;
  const gap = focus ? 0 : 1.25;
  for (const it of cell.items) {
    const m = buildModel(it.kind, 'red', { upgraded: it.up }); m.phase = 0;
    m.g.position.x = (it.dx ?? 0) * gap; m.g.rotation.y = it.yaw; scene.add(m.g);
    const st = { moving: false, atk: it.atk ?? -1, cast: 0, speed: 9, hurt: 0 };
    for (let k = 0; k < 30; k++) animate(m, st, 1.2 + k / 30, 1 / 30);
    m.g.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(m.g); box.union(b); hgt = Math.max(hgt, b.max.y);
    m.g.traverse(o => o.isMesh && meshes++);
  }
  stats.push(`${cell.label}: ${meshes} mallas, h=${hgt.toFixed(2)}`);
  const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  const cam = new THREE.PerspectiveCamera(28, (W / cols) / (H / rows), .1, 200);
  const span = Math.max(size.y, size.x / cam.aspect) * 1.1;
  const dist = span / (2 * Math.tan(cam.fov * Math.PI / 360)) + Math.max(size.x, size.z) * .5;
  cam.position.set(c.x, c.y + Math.sin(pitch) * dist, c.z + Math.cos(pitch) * dist); cam.lookAt(c);
  const lbl = document.createElement('div'); lbl.className = 'lbl'; lbl.textContent = `${cell.label} · ${meshes}m`;
  lbl.style.left = (i % cols) * W / cols + 6 + 'px'; lbl.style.top = Math.floor(i / cols) * H / rows + 4 + 'px'; document.body.appendChild(lbl);
  return { scene, cam };
});
built.forEach(({ scene, cam }, i) => {
  const cw = W / cols, ch = H / rows, x = (i % cols) * cw, y = H - (Math.floor(i / cols) + 1) * ch;
  renderer.setViewport(x, y, cw, ch); renderer.setScissor(x, y, cw, ch); renderer.render(scene, cam);
});
window.__stats = stats;
window.__done = true;
