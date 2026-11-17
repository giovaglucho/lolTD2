import './style.css';
import { Game } from './game.js';
import { UI } from './ui.js';
import { getPortrait } from './portraits.js';
import { initAudio, setMuted } from './sfx.js';
import { Conn, serverTarget, PARTYKIT_HOST } from './net.js';
import { mountMenu, showMenu, hideMenu, showLoading, showResult, store, setQueueStatus } from './menu/index.js';
import { LEGION_BY } from './content/index.js';

const params = new URLSearchParams(location.search);
const $ = id => document.getElementById(id);
let game, ui, conn = null, online = false, lastMatch = null;

// ¿hay servidor multijugador? PartyKit (host configurado) o servidor Node propio (`npm start`, /health).
let target = { kind: 'node' };
async function probeServer() {
  target = serverTarget(store.getSettings().serverUrl);
  if (target.kind === 'partykit') { online = true; return; }
  try { const r = await fetch('/health', { cache: 'no-store' }); online = r.ok && (await r.text()).trim() === 'ok'; } catch { online = false; }
}
function applySettings(s = store.getSettings()) {
  setMuted(!s.sfx || s.volume <= 0);
  if (game) { game.dmgNumbers = s.dmgNumbers !== false; game.camSpeed = s.camSpeed || 1; }
  const want = s.quality === 'low' ? 'low' : 'high', cur = params.get('q') === 'low' ? 'low' : 'high';
  if (want !== cur && game && !game.started) { params.set('q', want); location.search = params.toString(); }
}
const profileName = () => (store.getProfile().name || 'Invocador');

async function startLocal(opts) {
  initAudio(); const lanes = opts.lanes === 4 ? 4 : 2, me = profileName();
  const names = lanes === 4 ? [me, 'Aliado IA', 'IA Roja 1', 'IA Roja 2'] : [me, 'IA Roja'];
  const legs = [opts.legion || 'random', ...(lanes === 4 ? [opts.allyLegion || 'random'] : []), ...(opts.enemyLegions || [])];
  lastMatch = { mode: lanes === 4 ? '2v2' : '1v1', ranked: false, local: true, opts };
  hideMenu();
  game.start({ ...opts, lanes, names });
  const sim = game.sim;
  await showLoading({ mode: lastMatch.mode, ranked: false, players: sim.players.map((p, i) => ({ name: names[i] || p.name, legion: p.legion, team: p.team, bot: p.bot, diff: p.diff, me: i === 0 })) });
}

function startOnline(mode, legion) {
  initAudio(); target = serverTarget(store.getSettings().serverUrl);
  const name = profileName(), leg = legion || store.getSettings().legion || 'random';
  const begin = async (matchConn, d) => { lastMatch = { mode: '2v2', ranked: d.ranked, local: false }; hideMenu(); game.start({ net: { conn: matchConn, info: d } }); await showLoading({ mode: '2v2', ranked: d.ranked, players: d.players.map((p, i) => ({ ...p, me: i === d.me })) }); };
  const wireMatch = c => {
    c.on('start', d => begin(c, d));
    c.on('s', d => { if (game.sim && game.sim.net) game.sim.apply(d.s, d.ev); });
    c.on('end', d => { lastMatch.mmrDelta = d.delta && d.delta[name]; });
    c.on('close', () => { if (matchConn === c) matchConn = null; });
  };
  if (target.kind === 'node') { // servidor propio: una sola conexión
    conn ??= (() => { const c = new Conn(target); wireMatch(c); c.on('close', () => { conn = null; }); return c; })();
    return conn.connect().then(() => { conn.send({ t: 'hello', name }); conn.send({ t: 'queue', mode, legion: leg }); matchConn = conn; return true; });
  }
  // PartyKit: lobby (cola) + sala de partida
  conn ??= (() => {
    const c = new Conn(target, '/party/global');
    c.on('profile', d => { const p = store.getProfile(); if (d.p && d.p.mmr) { p.mmr = d.p.mmr; store.saveProfile(p); } });
    c.on('queue', d => setQueueStatus(`En cola ${d.mode === 'ranked' ? 'clasificatoria' : 'clásica'}: <b>${d.n}/4</b> jugadores · ${d.wait}s${d.fill != null ? ` · bots en ${d.fill}s` : ''}`));
    c.on('found', d => { setQueueStatus('¡Partida encontrada!'); const m = new Conn(target, `/parties/match/${d.id}?name=${encodeURIComponent(name)}`); wireMatch(m); matchConn = m; m.connect().catch(() => { toastErr('No se pudo entrar a la partida.'); }); });
    c.on('close', () => { conn = null; });
    return c;
  })();
  return conn.connect().then(() => { conn.send({ t: 'hello', name }); conn.send({ t: 'queue', mode, legion: leg }); return true; });
}
const toastErr = m => console.warn(m);
let matchConn = null;

async function onGameOver(win, sim) {
  const p = sim.P(game.me);
  const res = { win, wave: Math.min(sim.wave + 1, 20), mode: lastMatch ? lastMatch.mode : '1v1', legion: p.legion, kills: p.kills, value: sim.value(game.me), mmrDelta: lastMatch && lastMatch.mmrDelta, ranked: lastMatch && lastMatch.ranked };
  res.rewards = store.recordMatch(res);
  await new Promise(r => setTimeout(r, 1800)); // ver la explosión del Nexo
  await showResult(res);
  backToMenu();
}
function backToMenu() { game.stop(); $('hud').classList.add('hidden'); $('end').classList.add('hidden'); showMenu(); }

async function boot() {
  ui = new UI(getPortrait); game = new Game($('c'), ui); ui.bind(game); window.__game = game;
  game.onGameOver = onGameOver;
  ui.onQuit = fromEnd => { if (game.sim && !game.over && !fromEnd) { if (!confirm(game.local ? '¿Abandonar la partida?' : '¿Rendirse y salir de la partida?')) return; if (!game.local) (matchConn || conn)?.send({ t: 'surrender' }); } backToMenu(); };
  await probeServer();
  mountMenu({ startLocal, startOnline, cancelQueue: () => { conn && conn.send({ t: 'leave' }); }, onlineAvailable: () => online, applySettings: s => applySettings(s) });
  applySettings();
  $('boot').remove();
  if (params.get('auto')) startLocal({ lanes: +params.get('lanes') || 2, diff: params.get('diff') || 'normal', legion: params.get('legion') || 'random' });
  else showMenu();
  let last = performance.now();
  const menuOpen = () => { const m = document.getElementById('menu-root'); return m && !m.classList.contains('hidden'); };
  const loop = now => { const dt = (now - last) / 1000; last = now; if (game.started || !menuOpen()) game.frame(dt); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}
setTimeout(boot, 30);
