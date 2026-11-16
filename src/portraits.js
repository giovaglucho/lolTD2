import * as THREE from 'three';
import { buildModel } from './models.js';
import { FIGHTERS, CREEPS } from './data.js';

export function makePortraits() {
  const S = 160, canvas = document.createElement('canvas'); canvas.width = canvas.height = S;
  const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true }); r.setSize(S, S, false); r.setPixelRatio(1); r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene(); scene.add(new THREE.HemisphereLight(0xdde8ff, 0x445533, 1.6)); const d = new THREE.DirectionalLight(0xfff0d0, 3.2); d.position.set(-3, 5, 6); scene.add(d); const d2 = new THREE.DirectionalLight(0x88aaff, 1.2); d2.position.set(4, 2, -3); scene.add(d2);
  const cam = new THREE.PerspectiveCamera(30, 1, .1, 100); const out = {};
  const shot = (key, kind, sc, face) => {
    const m = buildModel(kind, 'red'); m.g.scale.setScalar(sc); const g = new THREE.Group(); g.add(m.g); g.rotation.y = face ?? -.5; scene.add(g);
    const box = new THREE.Box3().setFromObject(g), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    const span = Math.max(size.y * (face === 0 ? 1 : 1.0), size.x * 1.1); const dist = span / (2 * Math.tan(cam.fov * Math.PI / 360)) * 1.15 + size.z * .5;
    cam.position.set(c.x, c.y + size.y * .08, c.z + dist); cam.lookAt(c.x, c.y + size.y * .02, c.z);
    r.render(scene, cam); out[key] = canvas.toDataURL('image/png'); scene.remove(g);
  };
  for (const f of FIGHTERS) shot(f.id, f.id, 1, -.45);
  const done = new Set(); for (const [id, c] of Object.entries(CREEPS)) { shot('c_' + id, c.k, c.s, -.45); }
  r.dispose(); return out;
}
