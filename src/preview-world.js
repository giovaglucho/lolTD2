// Vista previa aislada del entorno: ?lanes=2|4 &view=lane|nexus|portal|overview|side &hp=0..1 &lane=i &t=segundos
import { setLayout, laneX } from './sim.js';
import { createWorld } from './world.js';
const P = new URLSearchParams(location.search);
const nL = +P.get('lanes') === 4 ? 4 : 2; setLayout(nL);
const W = createWorld(document.getElementById('c'), nL);
const lane = +(P.get('lane') ?? 0), view = P.get('view') || 'lane', hp = P.get('hp');
if (hp != null) for (let i = 0; i < nL; i++) W.setNexusHp(i, i === lane ? +hp : 1);
const cx = laneX(lane), mid = (laneX(0) + laneX(nL - 1)) / 2;
const V = {
  lane: { x: cx, z: 12, dist: 42, pitch: .93, yaw: 0 },
  far: { x: cx, z: 2, dist: 90, pitch: .93, yaw: 0 },
  nexus: { x: cx, z: 27, dist: 24, pitch: .55, yaw: .35 },
  portal: { x: cx, z: -36, dist: 26, pitch: .5, yaw: -.25 },
  overview: { x: mid, z: -5, dist: nL === 4 ? 290 : 180, pitch: .55, yaw: .0 },
  horizon: { x: cx, z: -20, dist: 120, pitch: .2, yaw: .5 },
  statue: { x: cx + 10, z: 33, dist: 16, pitch: .35, yaw: -.6 },
  side: { x: cx, z: 0, dist: 70, pitch: .45, yaw: .9 },
}[view];
const cam = W.camera; let t = +(P.get('t') ?? 3), frames = 0;
function frame() {
  const dt = 1 / 30; t += dt;
  cam.position.set(V.x + Math.sin(V.yaw) * Math.cos(V.pitch) * V.dist, Math.sin(V.pitch) * V.dist, V.z + Math.cos(V.yaw) * Math.cos(V.pitch) * V.dist);
  cam.lookAt(V.x, 0, V.z); cam.updateMatrixWorld();
  W.update(t, dt, { x: V.x, z: V.z }); W.composer.render();
  if (++frames >= 3) window.__ready = true;
  if (!P.has('still') || frames < 3) requestAnimationFrame(frame);
}
frame();
