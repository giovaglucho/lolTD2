import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { GRID, LANE } from './data.js';
import { laneX, cellPos } from './sim.js';

// ───────── texturas procedurales ─────────
let seed = 1337; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
function noiseField(n) { const f = new Float32Array(n * n); for (let i = 0; i < f.length; i++) f[i] = rnd(); return f; }
function vnoise(f, n, x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const g = (a, b) => f[((b % n + n) % n) * n + ((a % n + n) % n)]; const sm = t => t * t * (3 - 2 * t); const u = sm(xf), v = sm(yf); return (g(xi, yi) * (1 - u) + g(xi + 1, yi) * u) * (1 - v) + (g(xi, yi + 1) * (1 - u) + g(xi + 1, yi + 1) * u) * v; }
function fbm(f, n, x, y, oct = 5) { let a = .5, s = 0, fr = 1; for (let i = 0; i < oct; i++) { s += a * vnoise(f, n, x * fr, y * fr); fr *= 2; a *= .5; } return s; }
function canvasTex(size, draw, repeat, srgb = true) { const c = document.createElement('canvas'); c.width = c.height = size; const ctx = c.getContext('2d'); draw(ctx, size); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (repeat) t.repeat.set(repeat, repeat); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
function pixelTex(size, fn, repeat, srgb = true) { return canvasTex(size, (ctx, s) => { const im = ctx.createImageData(s, s); for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) { const [r, g, b] = fn(x / s, y / s, x, y); const i = (y * s + x) * 4; im.data[i] = r; im.data[i + 1] = g; im.data[i + 2] = b; im.data[i + 3] = 255; } ctx.putImageData(im, 0, 0); }, repeat, srgb); }

export function makeTextures() {
  const N = 64, nf = noiseField(N), nf2 = noiseField(N);
  const wrapfbm = (f, u, v, fr, oct = 5) => { let a = .5, s = 0; for (let i = 0; i < oct; i++) { s += a * vnoise(f, N, u * fr * (1 << i) % (N), v * fr * (1 << i) % N); a *= .5; } return s; };
  const grass = pixelTex(512, (u, v) => {
    const n = wrapfbm(nf, u, v, 4, 5), n2 = wrapfbm(nf2, u, v, 16, 3), blade = wrapfbm(nf2, u * 3 % 1, v * 40 % 1, 8, 2);
    const k = .45 + n * .6 + (n2 - .5) * .25 + (blade - .5) * .12;
    return [(58 + 60 * k) | 0, (92 + 92 * k) | 0, (34 + 40 * k) | 0];
  }, 28);
  const grassBump = pixelTex(256, (u, v) => { const n = wrapfbm(nf2, u, v, 24, 3); const c = (n * 255) | 0; return [c, c, c]; }, 28, false);
  const stone = pixelTex(512, (u, v, x, y) => {
    const tiles = 4, cx = Math.floor(u * tiles), cy = Math.floor(v * tiles), fu = (u * tiles) % 1, fv = (v * tiles) % 1; const edge = Math.min(fu, 1 - fu, fv, 1 - fv);
    const n = wrapfbm(nf, u, v, 6, 4), n2 = wrapfbm(nf2, u, v, 28, 2), tint = (Math.sin(cx * 12.9 + cy * 78.2) * 43758.5 % 1 + 1) % 1;
    let k = .55 + n * .45 + (n2 - .5) * .18 + (tint - .5) * .12; if (edge < .03) k *= .55 + edge * 10 * .45; if (edge < .008) k *= .5;
    return [(120 * k + 18) | 0, (126 * k + 18) | 0, (140 * k + 22) | 0];
  }, 7);
  const stoneBump = pixelTex(256, (u, v) => { const tiles = 4, fu = (u * tiles) % 1, fv = (v * tiles) % 1; const e = Math.min(fu, 1 - fu, fv, 1 - fv); const c = Math.min(255, (e * 40 + wrapfbm(nf, u, v, 12, 3) * 200) | 0); return [c, c, c]; }, 7, false);
  const dirt = pixelTex(256, (u, v) => { const n = wrapfbm(nf, u, v, 8, 5), s = wrapfbm(nf2, u, v, 30, 2); const k = .5 + n * .55 + (s - .5) * .2; return [(120 * k + 20) | 0, (92 * k + 14) | 0, (62 * k + 8) | 0]; }, 12);
  const tile = canvasTex(256, (ctx, s) => {
    ctx.fillStyle = '#10182a'; ctx.fillRect(0, 0, s, s); const g = ctx.createLinearGradient(0, 0, s, s); g.addColorStop(0, '#223a63'); g.addColorStop(1, '#16294a'); ctx.fillStyle = g; ctx.fillRect(10, 10, s - 20, s - 20);
    ctx.strokeStyle = '#c8aa6e'; ctx.lineWidth = 6; ctx.strokeRect(10, 10, s - 20, s - 20); ctx.strokeStyle = 'rgba(240,230,210,.5)'; ctx.lineWidth = 2; ctx.strokeRect(22, 22, s - 44, s - 44);
    ctx.strokeStyle = 'rgba(90,200,250,.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(s / 2, s / 2, 46, 0, 7); ctx.stroke(); ctx.beginPath(); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; ctx.moveTo(s / 2 + Math.cos(a) * 46, s / 2 + Math.sin(a) * 46); ctx.lineTo(s / 2 + Math.cos(a) * 66, s / 2 + Math.sin(a) * 66); } ctx.stroke();
  });
  const glowT = canvasTex(128, (ctx, s) => { const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, s, s); }, 0, false);
  const ring = canvasTex(256, (ctx, s) => { const g = ctx.createRadialGradient(s / 2, s / 2, s * .3, s / 2, s / 2, s / 2); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.75, 'rgba(255,255,255,.9)'); g.addColorStop(.85, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, s, s); }, 0, false);
  const water = pixelTex(256, (u, v) => { const n = wrapfbm(nf, u, v, 6, 5), n2 = wrapfbm(nf2, u, v, 12, 4); const k = Math.pow(n * .6 + n2 * .6, 2); return [(30 + 120 * k) | 0, (90 + 140 * k) | 0, (150 + 100 * k) | 0]; }, 6);
  return { grass, grassBump, stone, stoneBump, dirt, tile, glow: glowT, ring, water };
}

// ───────── escena ─────────
export function createWorld(canvas) {
  const LOW = new URLSearchParams(location.search).get('q') === 'low';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene(); const SKY = 0x9fc7e8;
  scene.fog = new THREE.FogExp2(0xb4d0e4, .0085);
  const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 1, 600);
  const tx = makeTextures();

  // cielo
  const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { top: { value: new THREE.Color(0x3d7fc9) }, mid: { value: new THREE.Color(0xa9d3f0) }, bot: { value: new THREE.Color(0xf2e6c8) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'varying vec3 vP; uniform vec3 top,mid,bot; void main(){ float h=vP.y; vec3 c = mix(bot, mid, smoothstep(-.05,.25,h)); c = mix(c, top, smoothstep(.2,.8,h)); gl_FragColor=vec4(c,1.); }' });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(450, 24, 16), skyMat); scene.add(sky);

  // luces
  const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x4f6a3a, 1.05); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0d0, 3.0); sun.position.set(-45, 80, 35); sun.castShadow = true;
  sun.shadow.mapSize.set(LOW ? 1024 : 4096, LOW ? 1024 : 4096); const sc = sun.shadow.camera; sc.left = -50; sc.right = 50; sc.top = 50; sc.bottom = -50; sc.near = 10; sc.far = 220; sun.shadow.bias = -.0004; sun.shadow.normalBias = .04; sun.shadow.radius = 3;
  scene.add(sun); scene.add(sun.target);
  const rim = new THREE.DirectionalLight(0x8fb4ff, .6); rim.position.set(40, 30, -50); scene.add(rim);

  // terreno con colinas en el borde
  const TW = 340, TD = 260, seg = LOW ? 80 : 170; const geo = new THREE.PlaneGeometry(TW, TD, seg, Math.round(seg * TD / TW)); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, nf = noiseField(32);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const ax = Math.abs(x), edge = Math.max(0, (ax - 66) / 40) + Math.max(0, (Math.abs(z + 5) - 58) / 40);
    const nn = fbm(nf, 32, x * .05 + 9, z * .05 + 4, 4);
    let y = Math.pow(Math.min(edge, 1.8), 1.6) * (9 + nn * 18);
    const lane = Math.abs(Math.abs(x) - 36); // cerca de carriles: plano
    if (ax < 56 && Math.abs(z + 5) < 52) y = (nn - .5) * 0.5 * Math.min(1, Math.max(0, (lane - 16) / 8));
    // río central
    if (ax < 5) y -= (1 - ax / 5) * .35;
    pos.setY(i, y);
  }
  geo.computeVertexNormals();
  const terrM = new THREE.MeshStandardMaterial({ map: tx.grass, bumpMap: tx.grassBump, bumpScale: 2.2, roughness: .95, metalness: 0 });
  const terrain = new THREE.Mesh(geo, terrM); terrain.receiveShadow = true; scene.add(terrain);
  tx.grass.repeat.set(36, 28); tx.grassBump.repeat.set(36, 28);

  // río
  const wM = new THREE.MeshStandardMaterial({ map: tx.water, color: 0x66c8ff, emissive: 0x1a5a9a, emissiveIntensity: .45, roughness: .12, metalness: .3, transparent: true, opacity: .88 });
  const river = new THREE.Mesh(new THREE.PlaneGeometry(9, 130, 1, 1), wM); river.rotation.x = -Math.PI / 2; river.position.set(0, .02, -5); scene.add(river);
  river.receiveShadow = true;

  // carriles
  const laneMeshes = [];
  const stoneM = new THREE.MeshStandardMaterial({ map: tx.stone, bumpMap: tx.stoneBump, bumpScale: 3, roughness: .82, metalness: .04, color: 0xdfe4ee });
  const dirtM = new THREE.MeshStandardMaterial({ map: tx.dirt, roughness: 1 });
  for (const side of [0, 1]) {
    const cx = laneX(side), g = new THREE.Group(); g.position.set(cx, 0, 0); scene.add(g); laneMeshes.push(g);
    // sendero de tierra del spawn al nexus
    const path = new THREE.Mesh(new THREE.PlaneGeometry(22, 86), dirtM); path.rotation.x = -Math.PI / 2; path.position.set(0, .035, -5); path.receiveShadow = true; g.add(path);
    tx.dirt.repeat.set(5, 18);
    // plataforma de piedra de construcción
    const cols = GRID.cols * GRID.cell + 5, depth = GRID.rows * GRID.cell + 5, cz = GRID.z0 + GRID.rows * GRID.cell / 2;
    const plat = new THREE.Mesh(new THREE.BoxGeometry(cols + 3, .3, depth + 3), stoneM); plat.position.set(0, 0, cz); plat.receiveShadow = true; plat.castShadow = true; g.add(plat);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(cols + 4.2, .3, depth + 4.2), new THREE.MeshStandardMaterial({ color: 0xc8aa6e, metalness: .85, roughness: .3 })); trim.position.set(0, -.05, cz); g.add(trim);
    // casillas
    const cellGeo = new THREE.PlaneGeometry(GRID.cell * .94, GRID.cell * .94);
    const cellMat = new THREE.MeshStandardMaterial({ map: tx.tile, roughness: .55, metalness: .25, emissive: side ? 0x501010 : 0x102a55, emissiveIntensity: .45 });
    const inst = new THREE.InstancedMesh(cellGeo, cellMat, GRID.cols * GRID.rows); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
    for (let r = 0; r < GRID.rows; r++) for (let c = 0; c < GRID.cols; c++) { const p = cellPos(c, r); m4.compose(new THREE.Vector3(p.x, .17, p.z), q, new THREE.Vector3(1, 1, 1)); inst.setMatrixAt(r * GRID.cols + c, m4); }
    inst.receiveShadow = true; g.add(inst);
    // esquinas luminosas de la plataforma
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const pil = new THREE.Group(); pil.position.set(sx * (cols / 2 + 1.5), .15, cz + sz * (depth / 2 + 1.5));
      const b = new THREE.Mesh(new THREE.CylinderGeometry(.9, 1.15, 1.6, 6), stoneM); b.position.y = .8; b.castShadow = true; pil.add(b);
      const orb = new THREE.Mesh(new THREE.OctahedronGeometry(.55), new THREE.MeshStandardMaterial({ color: side ? 0xff6a5a : 0x5ab4ff, emissive: side ? 0xff3a2a : 0x2a8aff, emissiveIntensity: 2.8, roughness: .2 })); orb.position.y = 2.4; orb.userData.spin = true; pil.add(orb);
      const pl = new THREE.PointLight(side ? 0xff5a3a : 0x4aa4ff, 3, 12, 1.6); pl.position.y = 2.4; pil.add(pl); g.add(pil); (g.userData.orbs ??= []).push(orb);
    }
    // muros laterales del carril
    for (const sx of [-1, 1]) { const wall = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 82), stoneM); wall.position.set(sx * 16.2, 1.1, -3); wall.castShadow = true; wall.receiveShadow = true; g.add(wall); const cap = new THREE.Mesh(new THREE.BoxGeometry(2, .3, 82), new THREE.MeshStandardMaterial({ color: 0xc8aa6e, metalness: .8, roughness: .35 })); cap.position.set(sx * 16.2, 2.3, -3); g.add(cap); }
    // portal del vacío
    const portal = new THREE.Group(); portal.position.set(0, 0, LANE.spawnZ - 4); g.add(portal);
    const arc = new THREE.Mesh(new THREE.TorusGeometry(6, .7, 14, 40), new THREE.MeshStandardMaterial({ color: 0x3a2a5a, roughness: .4, metalness: .6, emissive: 0x6a2aaa, emissiveIntensity: .6 })); arc.position.y = 6.2; portal.add(arc);
    const swirl = new THREE.Mesh(new THREE.CircleGeometry(5.6, 40), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { t: { value: 0 } },
      vertexShader: 'varying vec2 v; void main(){ v=uv-.5; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'varying vec2 v; uniform float t; void main(){ float r=length(v)*2.; float a=atan(v.y,v.x); float s=sin(a*5.+r*9.-t*2.4)*.5+.5; float s2=sin(a*3.-r*14.+t*1.7)*.5+.5; vec3 c=mix(vec3(.25,.05,.5), vec3(.85,.4,1.), s*s2); c+=vec3(.5,.2,.8)*pow(1.-r,3.); float al=smoothstep(1.,.75,r)*(.55+.45*s); gl_FragColor=vec4(c,al); }' }));
    swirl.position.y = 6.2; portal.add(swirl); g.userData.swirl = swirl;
    const pl2 = new THREE.PointLight(0xb05aff, 6, 26, 1.5); pl2.position.set(0, 5, 3); portal.add(pl2);
    for (const sx of [-1, 1]) { const pil = new THREE.Mesh(new THREE.CylinderGeometry(.8, 1.1, 8, 6), stoneM); pil.position.set(sx * 6.6, 4, 0); pil.castShadow = true; portal.add(pil); }
    // Nexo
    const nx = new THREE.Group(); nx.position.set(0, 0, LANE.nexusZ); g.add(nx);
    const col = side ? 0xff4a3a : 0x3aa4ff;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 4.2, 1.2, 8), stoneM); base.position.y = .6; base.castShadow = base.receiveShadow = true; nx.add(base);
    const base2 = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3.1, 1.0, 8), new THREE.MeshStandardMaterial({ color: 0xc8aa6e, metalness: .9, roughness: .3 })); base2.position.y = 1.5; base2.castShadow = true; nx.add(base2);
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(2.1, 0), new THREE.MeshPhysicalMaterial({ color: col, emissive: col, emissiveIntensity: 1.4, roughness: .08, metalness: .1, transmission: .0, clearcoat: 1 })); crystal.scale.y = 1.6; crystal.position.y = 5.2; crystal.castShadow = true; nx.add(crystal);
    const inner = new THREE.Mesh(new THREE.OctahedronGeometry(1.1, 0), new THREE.MeshBasicMaterial({ color: 0xffffff })); inner.scale.y = 1.6; inner.position.y = 5.2; nx.add(inner);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx.glow, color: col, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .8 })); halo.scale.set(12, 12, 1); halo.position.y = 5.2; nx.add(halo);
    const rings = []; for (let i = 0; i < 3; i++) { const rg = new THREE.Mesh(new THREE.TorusGeometry(2.8 + i * .5, .07, 8, 48), new THREE.MeshStandardMaterial({ color: 0xc8aa6e, emissive: col, emissiveIntensity: .8, metalness: .9, roughness: .25 })); rg.position.y = 5.2; rg.rotation.set(Math.PI / 2.3 * (i + 1), i, 0); nx.add(rg); rings.push(rg); }
    const nl = new THREE.PointLight(col, 12, 28, 1.5); nl.position.y = 6; nx.add(nl);
    g.userData.nexus = { crystal, inner, halo, rings, light: nl, group: nx, base: col };
  }

  // decoración: árboles y arbustos instanciados
  const trunkG = new THREE.CylinderGeometry(.35, .55, 3.2, 7), leafG = new THREE.ConeGeometry(2.4, 5, 8), leafG2 = new THREE.IcosahedronGeometry(2.4, 1);
  const trunkM = new THREE.MeshStandardMaterial({ color: 0x5a3e28, roughness: 1 }), leafM = new THREE.MeshStandardMaterial({ color: 0x3f8a3a, roughness: .9, flatShading: true });
  const treePts = []; let tries = 0;
  const okTree = (x, z) => { for (const s of [0, 1]) if (Math.abs(x - laneX(s)) < 19 && z > -52 && z < 38) return false; if (Math.abs(x) < 7) return false; return true; };
  while (treePts.length < 420 && tries++ < 6000) { const x = (rnd() - .5) * 280, z = (rnd() - .5) * 200 - 5; if (!okTree(x, z)) continue; if (Math.abs(z + 5) > 60 && Math.abs(x) < 20) continue; treePts.push([x, z, .7 + rnd() * 1.1, rnd() * 6.28, rnd()]); }
  const trunks = new THREE.InstancedMesh(trunkG, trunkM, treePts.length), leaves = new THREE.InstancedMesh(leafG, leafM, treePts.length), blobs = new THREE.InstancedMesh(leafG2, leafM, treePts.length);
  const hy = (x, z) => { const raycast = null; return 0; };
  const mm = new THREE.Matrix4(), col = new THREE.Color();
  treePts.forEach(([x, z, s, ry, v], i) => {
    // altura del terreno en x,z
    let y = 0; { const ax = Math.abs(x), edge = Math.max(0, (ax - 66) / 40) + Math.max(0, (Math.abs(z + 5) - 58) / 40); y = Math.pow(Math.min(edge, 1.8), 1.6) * (9 + fbm(nf, 32, x * .05 + 9, z * .05 + 4, 4) * 18); if (ax < 56 && Math.abs(z + 5) < 52) y = (fbm(nf, 32, x * .05 + 9, z * .05 + 4, 4) - .5) * .5 * Math.min(1, Math.max(0, (Math.abs(ax - 36) - 16) / 8)); }
    mm.compose(new THREE.Vector3(x, y + 1.6 * s, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry), new THREE.Vector3(s, s, s)); trunks.setMatrixAt(i, mm);
    const useCone = v > .35; const t2 = new THREE.Vector3(x, y + (useCone ? 5.2 : 4.6) * s, z);
    mm.compose(t2, new THREE.Quaternion(), new THREE.Vector3(s * (useCone ? 1 : 1.1), s * (useCone ? 1 : .9), s * (useCone ? 1 : 1.1)));
    if (useCone) { leaves.setMatrixAt(i, mm); mm.makeScale(0, 0, 0); blobs.setMatrixAt(i, mm); } else { blobs.setMatrixAt(i, mm); mm.makeScale(0, 0, 0); leaves.setMatrixAt(i, mm); }
    col.setHSL(.27 + (rnd() - .5) * .06, .45 + rnd() * .2, .26 + rnd() * .12); leaves.setColorAt(i, col); blobs.setColorAt(i, col);
  });
  for (const m of [trunks, leaves, blobs]) { m.castShadow = true; m.receiveShadow = true; scene.add(m); }

  // rocas y arbustos
  const rockG = new THREE.DodecahedronGeometry(1, 0), rockM = new THREE.MeshStandardMaterial({ color: 0x8a8d96, roughness: .95, flatShading: true });
  const rockPts = []; for (let i = 0; i < 160; i++) { const x = (rnd() - .5) * 240, z = (rnd() - .5) * 170 - 5; if (!okTree(x, z)) continue; rockPts.push([x, z, .5 + rnd() * 1.6]); }
  const rocks = new THREE.InstancedMesh(rockG, rockM, rockPts.length); rockPts.forEach(([x, z, s], i) => { mm.compose(new THREE.Vector3(x, s * .35, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd() * 3, rnd() * 3, rnd() * 3)), new THREE.Vector3(s, s * .7, s)); rocks.setMatrixAt(i, mm); }); rocks.castShadow = rocks.receiveShadow = true; scene.add(rocks);

  // Pozo del Barón (centro)
  const pit = new THREE.Group(); pit.position.set(0, 0, -5); scene.add(pit);
  const pitM = new THREE.Mesh(new THREE.CircleGeometry(7, 36), new THREE.MeshStandardMaterial({ color: 0x1a1030, emissive: 0x4a1a8a, emissiveIntensity: .6, roughness: .5 })); pitM.rotation.x = -Math.PI / 2; pitM.position.y = .06; pit.add(pitM);
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; const sp = new THREE.Mesh(new THREE.ConeGeometry(.5, 2.8 + rnd() * 1.5, 6), new THREE.MeshStandardMaterial({ color: 0xe2d8c0, roughness: .5 })); sp.position.set(Math.cos(a) * 7.2, 1.2, Math.sin(a) * 7.2); sp.rotation.z = Math.cos(a) * .3; sp.rotation.x = -Math.sin(a) * .3; sp.castShadow = true; pit.add(sp); }
  const pitL = new THREE.PointLight(0x9a4aff, 8, 24, 1.5); pitL.position.y = 2; pit.add(pitL);
  // puentes sobre el río
  for (const z of [-30, 20]) { const br = new THREE.Mesh(new THREE.BoxGeometry(12, .4, 4), stoneM); br.position.set(0, .3, z); br.castShadow = br.receiveShadow = true; scene.add(br); }

  // motas de luz flotantes
  const N = 450, pp = new Float32Array(N * 3), pc = new Float32Array(N * 3); const ph = [];
  for (let i = 0; i < N; i++) { pp[i * 3] = (rnd() - .5) * 150; pp[i * 3 + 1] = rnd() * 14 + .5; pp[i * 3 + 2] = (rnd() - .5) * 110 - 5; ph.push(rnd() * 6.28); const c = new THREE.Color().setHSL(.12 + rnd() * .15, .8, .75); pc.set([c.r, c.g, c.b], i * 3); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); pg.setAttribute('color', new THREE.BufferAttribute(pc, 3));
  const motes = new THREE.Points(pg, new THREE.PointsMaterial({ size: .5, map: tx.glow, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .8 })); scene.add(motes);

  // post-procesado
  const rt = new THREE.WebGLRenderTarget(innerWidth * renderer.getPixelRatio(), innerHeight * renderer.getPixelRatio(), { type: THREE.HalfFloatType, samples: LOW ? 0 : 4 });
  const composer = new EffectComposer(renderer, rt); composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .5, .7, .88); composer.addPass(bloom);
  const grade = new ShaderPass({ uniforms: { tDiffuse: { value: null }, vig: { value: .28 }, sat: { value: 1.12 }, con: { value: 1.06 }, flash: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform sampler2D tDiffuse; uniform float vig,sat,con,flash; varying vec2 vUv; void main(){ vec4 c=texture2D(tDiffuse,vUv); float l=dot(c.rgb,vec3(.299,.587,.114)); c.rgb=mix(vec3(l),c.rgb,sat); c.rgb=(c.rgb-.5)*con+.5; c.rgb=max(c.rgb,0.); float d=distance(vUv,vec2(.5)); c.rgb*=1.-vig*smoothstep(.35,.95,d); c.rgb+=vec3(1.,.2,.2)*flash; gl_FragColor=c; }' });
  composer.addPass(grade); composer.addPass(new OutputPass());

  function resize() { renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
  addEventListener('resize', resize);

  function update(t, dt, focus) {
    for (const g of laneMeshes) {
      g.userData.swirl.material.uniforms.t.value = t;
      const n = g.userData.nexus; n.crystal.rotation.y = t * .6; n.inner.rotation.y = -t * .8; n.crystal.position.y = n.inner.position.y = 5.2 + Math.sin(t * 1.5) * .35; n.halo.position.y = n.crystal.position.y;
      n.rings.forEach((r, i) => { r.rotation.z = t * (.4 + i * .2); r.position.y = n.crystal.position.y; });
      for (const o of g.userData.orbs) { o.rotation.y = t; o.position.y = 2.4 + Math.sin(t * 2 + o.id) * .15; }
    }
    tx.water.offset.y = -t * .03; tx.water.offset.x = Math.sin(t * .2) * .02;
    const a = motes.geometry.attributes.position; for (let i = 0; i < N; i++) { a.array[i * 3 + 1] += Math.sin(t * .8 + ph[i]) * .004; a.array[i * 3] += Math.cos(t * .5 + ph[i]) * .004; } a.needsUpdate = true;
    // la sombra sigue al foco de cámara
    sun.target.position.set(focus.x, 0, focus.z); sun.position.set(focus.x - 45, 80, focus.z + 35);
  }
  return { renderer, scene, camera, composer, bloom, grade, tx, update, laneMeshes, sun };
}
