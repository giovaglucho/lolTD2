// Menú principal de Rift Legion TD (estilo Legion TD 2 con estética de League of Legends).
// API pública (ver contrato en el encargo):
//   mountMenu(api) · showMenu() · hideMenu() · showLoading(info) → Promise · showResult(res) → Promise · openView(name, opts) · store
import './menu.css';
import { ctx, h, click, hydrate, avatarHTML, guildTag, titleName, pimg, toast, modal } from './ui.js';
import { getProfile, levelFromXp, onStoreChange } from './store.js';
import { rankOf, esc, fmt } from './data.js';
import { UI } from './icons.js';
import { stageStart, stageStop, stageMode, viewerClear } from './stage.js';
import { viewMain } from './views/main.js';
import { viewSolo, viewMulti } from './views/play.js';
import { viewGuides, viewPatch, viewSettings } from './views/info.js';
import { viewProfile, viewRanking, viewShop, viewGuild } from './views/social.js';
import { viewCodex } from './views/codex.js';
import { runLoading, runResult } from './views/screens.js';
export { store } from './store.js';

const VIEWS = { main: viewMain, solo: viewSolo, multi: viewMulti, guides: viewGuides, profile: viewProfile, ranking: viewRanking, shop: viewShop, guild: viewGuild, patch: viewPatch, settings: viewSettings, codex: viewCodex };
let root = null, viewEl = null, current = 'main', cleanup = null;

function loadFonts() {
  if (document.getElementById('m-fonts')) return;
  const l = document.createElement('link'); l.id = 'm-fonts'; l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Cinzel:wght@600;700&family=Oswald:wght@400;500;600;700&display=swap';
  document.head.appendChild(l);
}

export function mountMenu(api = {}) {
  if (root) return root;
  loadFonts();
  ctx.api = api;
  root = h(`<div id="menu-root" class="hidden" data-mode="main"><div class="m-shade"></div><div class="m-view"></div>${sideHTML()}${barHTML()}</div>`);
  document.body.appendChild(root); ctx.root = root; viewEl = root.querySelector('.m-view');
  ctx.go = openView; ctx.refreshSide = refreshSide;
  bindBar(); bindSide();
  onStoreChange(() => refreshSide());
  root.addEventListener('pointerover', e => { const b = e.target.closest('.m-nav .it'); if (b && !b.contains(e.relatedTarget)) click('shoot'); });
  return root;
}

export function openView(name = 'main', opts = {}) {
  if (!root) mountMenu({});
  if (!VIEWS[name]) name = 'main';
  if (cleanup) { try { cleanup(); } catch {} cleanup = null; }
  viewerClear();
  current = name;
  const mode = name === 'main' ? 'main' : name === 'codex' ? 'codex' : 'sub';
  root.dataset.mode = mode; root.dataset.view = name; stageMode(mode === 'codex' ? 'codex' : mode === 'sub' ? 'sub' : 'main');
  viewEl.innerHTML = ''; viewEl.style.animation = 'none'; void viewEl.offsetWidth; viewEl.style.animation = '';
  const r = VIEWS[name](viewEl, opts) || null; cleanup = typeof r === 'function' ? r : null;
  if (name !== 'main' && name !== 'codex') {
    const back = h(`<button class="m-btn m-backbtn">Atrás</button>`); back.onclick = () => { click(); openView('main'); }; viewEl.appendChild(back);
  }
  hydrate(root);
  refreshSide();
}

export function showMenu(view = 'main') {
  if (!root) mountMenu({});
  root.classList.remove('hidden'); stageStart(root); openView(view);
}
export function hideMenu() {
  if (!root) return;
  if (cleanup) { try { cleanup(); } catch {} cleanup = null; }
  root.classList.add('hidden'); stageStop(); viewerClear();
}

export function showLoading(info = {}) {
  if (!root) mountMenu({});
  if (cleanup) { try { cleanup(); } catch {} cleanup = null; }
  root.classList.remove('hidden'); root.dataset.mode = 'loading'; stageStart(root); stageMode('loading');
  viewEl.innerHTML = '';
  return runLoading(viewEl, info).then(() => { hideMenu(); });
}
export function showResult(res = {}) {
  if (!root) mountMenu({});
  if (cleanup) { try { cleanup(); } catch {} cleanup = null; }
  stageStop(); root.classList.remove('hidden'); root.dataset.mode = 'result';
  viewEl.innerHTML = '';
  return runResult(viewEl, res);
}

// ───────── panel lateral ─────────
const FRIENDS = [
  ['PoroFeroz', 'c_scuttle', 'game', 'En partida · Oleada 14'], ['LaSombraDeZed', 'c_wolf', 'on', 'En línea'], ['Baronesa', 'c_baron', 'game', 'En el Códice'],
  ['KrugLord', 'c_krug', 'on', 'En línea'], ['TeemoMain99', 'c_gromp', 'off', 'Hace 2 h'], ['YordleFurioso', 'c_raptor', 'off', 'Hace 1 día'], ['HeraldoDelAlba', 'c_herald', 'off', 'Hace 3 días'],
];
function sideHTML() {
  return `<aside class="m-side">
    <div class="m-me" data-go="profile"></div>
    <div class="m-cur"></div>
    <div class="m-sec">Amigos <span class="fcount"></span></div>
    <div class="m-friends">${FRIENDS.map(([n, a, s, t]) => `<div class="m-fr ${s}"><div class="m-av sm">${pimg(a)}</div><div><div class="fn">${n}</div><div class="fs">${t}</div></div></div>`).join('')}</div>
    <div class="m-party"><div class="m-sec" style="padding:10px 4px 4px">Grupo <span>1/2</span></div><div class="m-slots"><div class="m-slot me"></div><div class="m-slot inv">${UI.plus}<br>Invitar</div></div></div>
  </aside>`;
}
function refreshSide() {
  if (!root) return;
  const p = getProfile(), lv = levelFromXp(p.xp), rk = rankOf(p.mmr || 1200);
  const me = root.querySelector('.m-me');
  me.style.cssText = `--rk1:${rk.c1};--rk2:${rk.c2}`;
  me.innerHTML = `${avatarHTML(p)}<div style="flex:1;min-width:0"><div class="nm">${guildTag(p)}${esc(p.name)}</div><div class="tl">${esc(titleName(p))}</div><div class="rk">${rk.label} · ${p.mmr} PL</div><div class="m-xp"><i style="width:${lv.pct * 100}%"></i></div><div class="m-xpt">NIVEL ${lv.level} · ${fmt(lv.cur)} / ${fmt(lv.need)} XP</div></div>`;
  root.querySelector('.m-cur').innerHTML = `<div class="c" title="Esencia Azul: moneda de la tienda">${UI.essence.replace('class="ico"', 'class="ico" style="color:#4fb8ff"')}${fmt(p.essence)}<small>Esencia</small></div><div class="c" title="Victorias totales">${UI.trophy.replace('class="ico"', 'class="ico" style="color:#f0c75e"')}${p.stats.wins}<small>Victorias</small></div>`;
  root.querySelector('.m-slot.me').innerHTML = `${pimg(avatarKeySafe(p))}${esc(p.name)}`;
  root.querySelector('.fcount').textContent = `${FRIENDS.filter(f => f[2] !== 'off').length}/${FRIENDS.length}`;
  hydrate(root.querySelector('.m-side'));
}
const avatarKeySafe = p => { const m = /src="([^"]+)"/.exec(avatarHTML(p)); return null || (p.avatar || ''); };
function bindSide() {
  root.querySelector('.m-me').onclick = () => { click(); openView('profile'); };
  root.querySelector('.m-slot.inv').onclick = () => { click(); toast('Las invitaciones de grupo llegarán con los servidores en línea.'); };
  root.querySelector('.m-friends').onclick = e => { const f = e.target.closest('.m-fr'); if (f) toast(`${f.querySelector('.fn').textContent}: ${f.querySelector('.fs').textContent}`); };
}

// ───────── barra inferior ─────────
function barHTML() {
  const b = (id, ico, tip, dot) => `<button class="ib" data-b="${id}" data-tip="${tip}">${UI[ico]}${dot ? '<i class="dot"></i>' : ''}</button>`;
  return `<nav class="m-bar">${b('quit', 'power', 'Salir')}${b('settings', 'gear', 'Ajustes')}${b('profile', 'user', 'Perfil')}${b('codex', 'book', 'Códice')}<span class="sep"></span>${b('discord', 'chat', 'Comunidad')}${b('mail', 'mail', 'Correo', true)}${b('stream', 'stream', 'Retransmisiones')}${b('forum', 'forum', 'Foro')}${b('patch', 'news', 'Novedades', true)}
    <div class="m-chat"><label>Chat global</label><input maxlength="120" placeholder="Pulsa Intro para escribir…"><div class="m-chatlog"><div class="sys">Bienvenido al canal #grieta-es. Sé amable, invocador.</div><div><b>PoroFeroz:</b> ¿alguien para un 2v2 en Locura?</div><div><b>Baronesa:</b> Jonia + Targon es una locura en la oleada 10</div></div></div></nav>`;
}
function bindBar() {
  const bar = root.querySelector('.m-bar');
  bar.addEventListener('click', async e => {
    const b = e.target.closest('.ib'); if (!b) return; click();
    const id = b.dataset.b; b.querySelector('.dot')?.remove();
    if (id === 'quit') { const r = await modal('¿Salir de Rift Legion?', 'Tu perfil se guarda automáticamente en este navegador.', [['Cancelar', ''], ['Salir', 'danger']]); if (r === 1) { try { window.close(); } catch {} toast('Puedes cerrar la pestaña cuando quieras. ¡Hasta pronto, invocador!'); } }
    else if (['settings', 'profile', 'codex', 'patch'].includes(id)) openView(id);
    else if (id === 'mail') modal('Correo', '<b style="color:#f0e6d2">Equipo de Rift Legion:</b> ¡Gracias por jugar la versión 1.0! Como regalo de bienvenida tienes 600 de Esencia Azul para la tienda.', [['Cerrar', 'teal']]);
    else toast('Enlaces de comunidad disponibles próximamente.');
  });
  const inp = bar.querySelector('.m-chat input'), log = bar.querySelector('.m-chatlog');
  inp.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key !== 'Enter' || !inp.value.trim()) return;
    const p = getProfile(); log.insertAdjacentHTML('beforeend', `<div><b>${esc(p.name)}:</b> ${esc(inp.value.trim())}</div>`); inp.value = ''; log.scrollTop = 1e9;
    const replies = ['¡gg!', 'jajaja', 'yo voy Freljord siempre', 'el Barón de la 20 es imposible en Locura', '¿alguien probó Invocador con Avaricia?', '+1'];
    setTimeout(() => { const f = FRIENDS[Math.floor(Math.random() * 4)]; log.insertAdjacentHTML('beforeend', `<div><b>${f[0]}:</b> ${replies[Math.floor(Math.random() * replies.length)]}</div>`); log.scrollTop = 1e9; }, 1400);
  });
}
