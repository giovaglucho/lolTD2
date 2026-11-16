// Utilidades compartidas por las vistas del menú.
import * as Sfx from '../sfx.js';
import { getPortrait, hasPortrait } from '../portraits.js';
import { getSettings, getProfile } from './store.js';
import { allChamps, rankOf, esc } from './data.js';

export const ctx = { root: null, api: {}, go: () => {}, refreshSide: () => {} };

export function h(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
export const $ = (sel, el = ctx.root) => el.querySelector(sel);
export const $$ = (sel, el = ctx.root) => [...el.querySelectorAll(sel)];

let audioOn = false;
export function click(kind = 'click') {
  try { if (!audioOn) { Sfx.initAudio && Sfx.initAudio(); audioOn = true; } const s = getSettings(); if (!s.sfx) return; Sfx.sfx && Sfx.sfx[kind] && Sfx.sfx[kind](); } catch {}
}

// ───── retratos perezosos ─────
const PH = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><defs><radialGradient id="g" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#2a3346"/><stop offset="1" stop-color="#0c111b"/></radialGradient></defs><rect width="10" height="10" fill="url(#g)"/></svg>');
export function pimg(key, attrs = '') {
  if (!key) return `<img src="${PH}" ${attrs} alt="">`;
  return hasPortrait(key) ? `<img src="${getPortrait(key)}" ${attrs} alt="">` : `<img src="${PH}" data-pk="${esc(key)}" ${attrs} alt="">`;
}
let queue = [], busy = false;
export function hydrate(el = ctx.root) {
  const imgs = [...el.querySelectorAll('img[data-pk]')];
  // prioriza las visibles
  imgs.sort((a, b) => (b.getBoundingClientRect().top < innerHeight ? 1 : 0) - (a.getBoundingClientRect().top < innerHeight ? 1 : 0));
  queue.push(...imgs); if (!busy) pump();
}
function pump() {
  busy = true;
  const t0 = performance.now();
  while (queue.length && performance.now() - t0 < 24) {
    const img = queue.shift(); if (!img.isConnected || !img.dataset.pk) continue;
    const k = img.dataset.pk; const url = getPortrait(k); img.removeAttribute('data-pk'); if (url) img.src = url;
    // aplica a duplicados en cola
    for (const o of queue) if (o.dataset.pk === k && hasPortrait(k)) { o.src = url; o.removeAttribute('data-pk'); }
  }
  if (queue.length) setTimeout(pump, 0); else busy = false;
}

// ───── avisos ─────
export function toast(msg, ms = 2600) {
  const t = h(`<div class="m-toast">${msg}</div>`); ctx.root.appendChild(t); setTimeout(() => t.remove(), ms);
}
export function modal(title, text, buttons = [['Aceptar', 'teal']]) {
  return new Promise(res => {
    const m = h(`<div class="m-modal"><div class="box"><h3>${title}</h3><p>${text}</p><div class="btns">${buttons.map(([l, c], i) => `<button class="m-btn ${c || ''}" data-i="${i}">${l}</button>`).join('')}</div></div></div>`);
    m.addEventListener('click', e => { const b = e.target.closest('button[data-i]'); if (b) { click(); m.remove(); res(+b.dataset.i); } });
    ctx.root.appendChild(m);
  });
}

// ───── perfil ─────
export function avatarKey(p = getProfile()) {
  if (p.avatar) return p.avatar;
  const c = allChamps(); return c.length ? c[0].id : 'c_gromp';
}
export const BORDERS = {
  default: { name: 'Rango', desc: 'Muestra los colores de tu rango.', price: 0 },
  hextech: { name: 'Hextech', c1: '#0a5c63', c2: '#46f0e0', price: 400, rar: 'Raro' },
  infernal: { name: 'Infernal', c1: '#7a1a08', c2: '#ffae4a', price: 600, rar: 'Épico' },
  escarcha: { name: 'Escarcha', c1: '#2a4a7a', c2: '#cfeaff', price: 600, rar: 'Épico' },
  vacio: { name: 'Vacío', c1: '#2a0a4a', c2: '#d07bff', price: 900, rar: 'Épico' },
  demaciano: { name: 'Demaciano', c1: '#1f3d8a', c2: '#f0d79a', price: 450, rar: 'Raro' },
  noxiano: { name: 'Noxiano', c1: '#3a0a0a', c2: '#ff5a4a', price: 450, rar: 'Raro' },
  retador: { name: 'Retador', c1: '#1c4a8a', c2: '#ffe08a', price: 2500, rar: 'Legendario' },
};
export const TITLES = {
  novato: { name: 'Novato de la Grieta', price: 0 },
  invocador: { name: 'Invocador', price: 150 },
  estratega: { name: 'Estratega', price: 300, rar: 'Raro' },
  poros: { name: 'Señor de los Poros', price: 400, rar: 'Raro' },
  mercenario: { name: 'Rey de los Mercenarios', price: 600, rar: 'Épico' },
  baron: { name: 'Azote del Barón', price: 900, rar: 'Épico' },
  codice: { name: 'Erudito del Códice', price: 500, rar: 'Raro' },
  leyenda: { name: 'Leyenda de la Grieta', price: 2000, rar: 'Legendario' },
};
export function avatarHTML(p = getProfile(), cls = '', withLevel = true) {
  const rk = rankOf(p.mmr || 1200), b = BORDERS[p.border] && p.border !== 'default' ? BORDERS[p.border] : null;
  const st = `--rk1:${b ? b.c1 : rk.c1};--rk2:${b ? b.c2 : rk.c2}`;
  return `<div class="m-av ${cls}" style="${st}">${pimg(avatarKey(p))}${withLevel ? `<span class="lv">${p.level}</span>` : ''}</div>`;
}
export function guildTag(p = getProfile()) { return p.guild && p.guild.tag ? `<span class="m-gtag" style="--gc:${p.guild.color || '#c8aa6e'}">[${esc(p.guild.tag)}]</span>` : ''; }
export function titleName(p = getProfile()) { return (TITLES[p.title] || TITLES.novato).name; }

// insignia de rango (SVG)
export function crest(rk, cls = 'm-crest') {
  const tiers = Math.min(rk.idx, 9), wings = tiers >= 3, crown = tiers >= 7;
  return `<svg viewBox="0 0 100 100" class="${cls}" aria-hidden="true"><defs><linearGradient id="cg${rk.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${rk.c2}"/><stop offset="1" stop-color="${rk.c1}"/></linearGradient></defs>
    ${wings ? `<path d="M50 22 L14 30 L22 46 L8 52 L26 62 L50 56 L74 62 L92 52 L78 46 L86 30z" fill="${rk.c1}" opacity=".85"/>` : ''}
    ${crown ? `<path d="M34 18 L40 6 L46 16 L50 4 L54 16 L60 6 L66 18z" fill="url(#cg${rk.id})"/>` : ''}
    <path d="M50 14 L76 28 L76 62 L50 86 L24 62 L24 28z" fill="url(#cg${rk.id})" stroke="#0b0f18" stroke-width="2"/>
    <path d="M50 24 L67 33 L67 59 L50 75 L33 59 L33 33z" fill="#0b0f18" opacity=".55"/>
    <path d="M50 30 L60 50 L50 68 L40 50z" fill="${rk.c2}"/>
  </svg>`;
}
export function iconTile(inner, color, cls = '') { return `<div class="m-ico-tile ${cls}" style="--c:${color}">${inner}</div>`; }
