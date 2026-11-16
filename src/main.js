import './style.css';
import { Game } from './game.js';
import { UI } from './ui.js';
import { makePortraits } from './portraits.js';
import { initAudio } from './sfx.js';
import { Conn } from './net.js';

const params = new URLSearchParams(location.search);
const $ = id => document.getElementById(id);
let game, ui, conn = null, profile = null, queued = null;
const sel = { lanes: 2, diff: 'normal' };

function seg(id, key) { document.querySelectorAll(`#${id} button`).forEach(b => b.onclick = () => { document.querySelectorAll(`#${id} button`).forEach(x => x.classList.toggle('on', x === b)); sel[key] = isNaN(+b.dataset.v) ? b.dataset.v : +b.dataset.v; }); }
const name = () => { const n = ($('pname').value || '').trim(); try { localStorage.setItem('rl_name', n); } catch {} return n || 'Invocador'; };
function showMenu() { game.stop(); $('hud').classList.add('hidden'); $('end').classList.add('hidden'); $('title').classList.remove('hidden'); if (conn && conn.open) conn.send({ t: 'lb' }); }
function renderProfile() { $('profile').innerHTML = profile ? `<b>${profile.tier}</b> · ${profile.mmr} MMR<br>Ranked ${profile.w}V/${profile.l}D · Clásico ${profile.cw}V/${profile.cl}D` : ''; }

async function online(mode) {
  initAudio(); $('qstatus').textContent = 'Conectando…';
  try {
    if (!conn) {
      conn = new Conn();
      conn.on('profile', d => { profile = d.p; renderProfile(); });
      conn.on('queue', d => { $('qstatus').innerHTML = `En cola ${d.mode === 'ranked' ? 'RANKED' : 'CLÁSICA'}: ${d.n}/4 jugadores · ${d.wait}s${d.fill != null ? ` · bots en ${d.fill}s` : ''} <button id="bLeave">Cancelar</button>`; $('bLeave').onclick = () => { conn.send({ t: 'leave' }); queued = null; $('qstatus').textContent = ''; }; });
      conn.on('start', d => { queued = null; $('qstatus').textContent = ''; game.start({ net: { conn, info: d } }); });
      conn.on('s', d => { if (game.sim && game.sim.net) game.sim.apply(d.s, d.ev); });
      conn.on('end', d => { profile = d.profile; renderProfile(); const me = game.netInfo && game.netInfo.players[game.me]; const dl = d.delta[me ? me.name : ''] ; if (dl !== undefined) setTimeout(() => ui.setEndExtra(`<div class="delta ${dl >= 0 ? 'pos' : 'neg'}">${dl >= 0 ? '+' : ''}${dl} MMR</div>${profile.tier} · ${profile.mmr} MMR`), 50); });
      conn.on('lb', d => { $('lb').innerHTML = d.list.length ? `<b style="color:#c8aa6e">CLASIFICACIÓN RANKED</b><table>${d.list.map((r, i) => `<tr><td>${i + 1}. ${r.name}</td><td>${r.tier}</td><td>${r.mmr}</td><td>${r.w}V ${r.l}D</td></tr>`).join('')}</table>` : ''; });
      conn.on('close', () => { $('qstatus').textContent = 'Desconectado del servidor.'; if (game.sim && game.sim.net && !game.over) { ui.log('Conexión perdida.'); } conn = null; });
    }
    await conn.connect(); conn.send({ t: 'hello', name: name() }); conn.send({ t: 'queue', mode }); conn.send({ t: 'lb' }); queued = mode;
  } catch (e) { $('qstatus').textContent = 'No hay servidor en línea disponible (ejecuta npm start). ' ; conn = null; }
}

function boot() {
  const portraits = makePortraits();
  ui = new UI(portraits); game = new Game($('c'), ui); ui.bind(game); window.__game = game;
  ui.onQuit = (fromEnd) => { if (game.sim && game.sim.net && !game.over && !fromEnd) { if (!confirm('¿Rendirse y salir de la partida?')) return; conn && conn.send({ t: 'surrender' }); } showMenu(); };
  try { $('pname').value = localStorage.getItem('rl_name') || ''; } catch {}
  seg('segLanes', 'lanes'); seg('segDiff', 'diff');
  $('title').classList.add('ready');
  $('bLocal').onclick = () => { initAudio(); name(); game.start({ lanes: sel.lanes, diff: sel.diff }); };
  $('bClassic').onclick = () => online('classic');
  $('bRanked').onclick = () => online('ranked');
  if (params.get('auto')) game.start({ lanes: +params.get('lanes') || 2, diff: params.get('diff') || 'normal', legion: params.get('legion') || 'random' });
  let last = performance.now();
  const loop = now => { const dt = (now - last) / 1000; last = now; game.frame(dt); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}
setTimeout(boot, 30);
