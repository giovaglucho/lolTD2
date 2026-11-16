// PERFIL · CLASIFICACIÓN · TIENDA · GREMIO
import { ctx, h, click, toast, modal, pimg, hydrate, avatarHTML, avatarKey, guildTag, titleName, crest, BORDERS, TITLES } from '../ui.js';
import { getProfile, saveProfile, levelFromXp } from '../store.js';
import { legionList, legionById, allChamps, CREEPS, RANKS, rankOf, esc, fmt, hex, winrate, tierOf } from '../data.js';
import { UI, emblem } from '../icons.js';

const legName = id => id === 'invocador' ? 'Invocador' : id === 'random' ? 'Aleatoria' : (legionById(id)?.name || id || '—');
const legColor = id => hex(legionById(id)?.accent ?? 0xc8aa6e);
const MODE = { '1v1': '1 contra 1', '2v2': '2 contra 2', classic: 'Clásico 2v2', ranked: 'Ranked 2v2' };
const CREATURE_AV = [['c_gromp', 0, 'Común'], ['c_scuttle', 0, 'Común'], ['c_wolf', 0, 'Común'], ['c_raptor', 300, 'Raro'], ['c_krug', 300, 'Raro'], ['c_blue', 600, 'Épico'], ['c_red', 600, 'Épico'], ['c_herald', 900, 'Épico'], ['c_chogath', 1000, 'Épico'], ['c_elder', 1200, 'Legendario'], ['c_baron', 1500, 'Legendario']];
const TIER_PRICE = { 1: 0, 2: 250, 3: 350, 4: 450, 5: 600, 6: 800 };
const RAR_C = { Común: '#9fb0c8', Raro: '#4fb8ff', Épico: '#c77bff', Legendario: '#ffb43a' };
function avatarCatalog() {
  const champs = allChamps().map(c => { const t = tierOf(c); return { key: c.id, name: c.name, price: TIER_PRICE[t] ?? 300, rar: t <= 1 ? 'Común' : t <= 3 ? 'Raro' : t <= 5 ? 'Épico' : 'Legendario', legion: c.legion }; });
  const cr = CREATURE_AV.filter(([k]) => CREEPS[k.slice(2)]).map(([k, price, rar]) => ({ key: k, name: CREEPS[k.slice(2)].name, price, rar }));
  return [...champs, ...cr];
}
const ownsAvatar = (p, it) => it.price === 0 || p.owned.avatars.includes(it.key);

// ───────── PERFIL ─────────
export function viewProfile(el) {
  const p = getProfile();
  let tab = 'stats';
  el.appendChild(h(`<div class="m-page"><div class="m-ptitle"><h1>Perfil</h1><span class="sub">Tu carrera como invocador.</span></div><div class="m-prof"><div class="m-panel m-pcard"></div><div class="m-panel" style="display:flex;flex-direction:column;min-height:0"><div class="m-tabs"><button data-t="stats">Estadísticas</button><button data-t="hist">Historial</button><button data-t="av">Avatar</button></div><div class="m-scroll pbody" style="flex:1"></div></div></div></div>`));
  const card = el.querySelector('.m-pcard'), body = el.querySelector('.pbody');
  const renderCard = () => {
    const lv = levelFromXp(p.xp), rk = rankOf(p.mmr || 1200);
    const titles = Object.entries(TITLES).filter(([k, t]) => t.price === 0 || p.owned.titles.includes(k));
    card.innerHTML = `${avatarHTML(p, 'lg')}<h2>${guildTag(p)}${esc(p.name)}</h2><div class="tl">${esc(titleName(p))}</div>
      <div class="rkline" style="--rk2:${rk.c2}">${crest(rk)}<div><b>${rk.label}</b><small>${p.mmr} Puntos de Liga</small></div></div>
      <div style="width:100%;text-align:left"><div class="m-xpt" style="display:flex;justify-content:space-between"><span>NIVEL ${lv.level}</span><span>${fmt(lv.cur)} / ${fmt(lv.need)} XP</span></div><div class="m-xp" style="height:8px"><i style="width:${lv.pct * 100}%"></i></div></div>
      <div style="width:100%;margin-top:22px;text-align:left"><div class="m-field"><label>Nombre de invocador</label><input class="m-in" maxlength="16" value="${esc(p.name)}" data-f="name"></div>
      <div class="m-field"><label>Título</label><select class="m-in" data-f="title">${titles.map(([k, t]) => `<option value="${k}" ${k === p.title ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select></div></div>`;
    hydrate(card);
  };
  const renderBody = () => {
    el.querySelectorAll('.m-tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
    const s = p.stats;
    if (tab === 'stats') {
      const legs = [...legionList().map(l => l.id), 'invocador'];
      const max = Math.max(1, ...legs.map(id => s.byLegion[id]?.games || 0));
      body.innerHTML = `<div class="m-stats4"><div class="m-stat"><small>Partidas</small><b>${s.games}</b></div><div class="m-stat"><small>Victorias</small><b style="color:#7fe06a">${s.wins}</b></div><div class="m-stat"><small>% de victorias</small><b>${winrate(s.wins, s.games)}</b></div><div class="m-stat"><small>Mejor oleada</small><b style="color:var(--gold3)">${s.bestWave || '—'}</b></div></div>
        <h3 class="m-h3">Estadísticas por legión</h3>
        <table class="m-table"><tr><th>Legión</th><th>Partidas</th><th class="num">Victorias</th><th class="num">% Vict.</th><th class="num">Mejor oleada</th></tr>
        ${legs.map(id => { const b = s.byLegion[id] || { games: 0, wins: 0 }; return `<tr><td><div class="m-legrow">${emblem(id, legColor(id))}<b style="color:#fff">${esc(legName(id))}</b></div></td><td><div class="m-bar2" style="--c:${legColor(id)}"><i style="width:${b.games / max * 100}%"></i></div></td><td class="num">${b.wins}</td><td class="num">${winrate(b.wins, b.games)}</td><td class="num">${b.bestWave || '—'}</td></tr>`; }).join('')}</table>`;
    } else if (tab === 'hist') {
      body.innerHTML = p.history.length ? `<table class="m-table"><tr><th>Resultado</th><th>Modo</th><th>Legión</th><th class="num">Oleada</th><th class="num">Bajas</th><th class="num">Valor</th><th class="num">PL</th><th>Fecha</th></tr>
        ${p.history.map(m => `<tr><td class="${m.win ? 'w' : 'l'}">${m.win ? 'VICTORIA' : 'DERROTA'}</td><td>${MODE[m.mode] || m.mode}</td><td><div class="m-legrow">${emblem(m.legion, legColor(m.legion))}${esc(legName(m.legion))}</div></td><td class="num">${m.wave}</td><td class="num">${m.kills}</td><td class="num">${fmt(m.value)}</td><td class="num" style="color:${m.mmrDelta > 0 ? '#7fe06a' : m.mmrDelta < 0 ? '#ff8a7a' : 'var(--dim2)'}">${m.mmrDelta ? (m.mmrDelta > 0 ? '+' : '') + m.mmrDelta : '—'}</td><td style="color:var(--dim)">${new Date(m.t).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</td></tr>`).join('')}</table>`
        : `<div class="m-empty"><b>Sin partidas todavía</b>Juega en Solo y cooperativo para empezar tu historial.<div style="margin-top:16px"><button class="m-btn teal" data-go="solo">Jugar ahora</button></div></div>`;
    } else {
      const cat = avatarCatalog();
      body.innerHTML = `<div style="padding:14px 14px 0;color:var(--dim);font-size:14px">Elige tu icono de invocador. Los bloqueados se consiguen en la <b style="color:var(--gold2);cursor:pointer" data-go="shop">Tienda</b>.</div><div class="m-avgrid">${cat.map(it => `<button class="m-avpick ${it.key === avatarKey(p) ? 'on' : ''} ${ownsAvatar(p, it) ? '' : 'lock'}" data-av="${it.key}" title="${esc(it.name)}">${pimg(it.key)}</button>`).join('')}</div>`;
    }
    hydrate(body);
  };
  el.addEventListener('click', e => {
    const t = e.target.closest('[data-t]'); if (t) { click(); tab = t.dataset.t; renderBody(); }
    const a = e.target.closest('[data-av]'); if (a) { click(); if (a.classList.contains('lock')) { toast('Avatar bloqueado: consíguelo en la Tienda.'); return; } p.avatar = a.dataset.av; saveProfile(p); renderCard(); renderBody(); }
    const g = e.target.closest('[data-go]'); if (g) { click(); ctx.go(g.dataset.go); }
  });
  el.addEventListener('change', e => { const f = e.target.dataset.f; if (!f) return; if (f === 'name') p.name = (e.target.value || '').trim().slice(0, 16) || 'Invocador'; if (f === 'title') p.title = e.target.value; saveProfile(p); renderCard(); });
  el.addEventListener('keydown', e => e.stopPropagation());
  renderCard(); renderBody();
}

// ───────── CLASIFICACIÓN ─────────
const NAMES = ['Faker del Sur', 'NashorSlayer', 'LaReinaDeHielo', 'PiltieBoss', 'ZaunLord', 'Hextech Hugo', 'Mente Targoniana', 'ElLotoAzul', 'GrietaPura', 'DemaciaOMuerte', 'NoxusNoPerdona', 'Poro Supremo', 'Kalista_ES', 'Thresh Rápido', 'Cangrejo Valiente', 'LuxEnLaOscuridad', 'Gromp Sabio', 'Ojo del Vacío', 'Escarcha Eterna', 'Sol de Targon', 'Lanza Solari', 'CuchillaDeJonia', 'BaronBuff', 'KrugAmigo', 'MaestroDelPoro', 'Brazo de Hierro', 'ElAncestral', 'RaptorVeloz', 'Heraldo Ciego', 'La Duquesa', 'Leyenda Gris', 'Invocadora Nova', 'Vientos de Jonia', 'HuchaDeOro', 'ElCártel', 'RerollKing', 'Castillo Firme', 'Gólem Azul', 'Mago de Zaun', 'Sargento Garen'];
const TAGS = ['GRT', 'NXS', 'DMC', '', 'PLT', '', 'TGN', 'JON', '', 'FRJ', 'ZAU', '', 'VOID', '', 'BRN'];
function ladder() {
  let s = 1337; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const legs = [...legionList().map(l => l.id), 'invocador'];
  return NAMES.map((n, i) => { const mmr = Math.round(2900 - i * 48 - r() * 40); const g = 60 + Math.floor(r() * 340), wr = .5 + (40 - i) / 200 + (r() - .5) * .06; return { name: n, tag: TAGS[i % TAGS.length], mmr, games: g, wins: Math.round(g * wr), legion: legs[Math.floor(r() * legs.length)] || 'invocador', av: ['c_baron', 'c_elder', 'c_herald', 'c_krug', 'c_wolf', 'c_gromp', 'c_raptor', 'c_chogath', 'c_blue', 'c_red', 'c_scuttle'][i % 11] }; });
}
export function viewRanking(el) {
  const p = getProfile(), rk = rankOf(p.mmr || 1200);
  const fav = Object.entries(p.stats.byLegion).sort((a, b) => b[1].games - a[1].games)[0]?.[0] || '';
  const rows = ladder(); const me = { name: p.name, tag: p.guild?.tag || '', mmr: p.mmr, games: p.stats.games, wins: p.stats.wins, legion: fav, av: avatarKey(p), me: true };
  rows.push(me); rows.sort((a, b) => b.mmr - a.mmr);
  const pos = rows.indexOf(me) + 1;
  el.appendChild(h(`<div class="m-page"><div class="m-ptitle"><h1>Clasificación</h1><span class="sub">Temporada 1 · Ranked 2v2 · Servidor local</span></div>
    <div style="display:flex;flex-direction:column;gap:16px;flex:1;min-height:0">
      <div class="m-panel"><div class="m-tiers">${RANKS.map(r => `<div class="m-tier ${r.id === rk.id ? 'on' : ''}" style="--c:${r.c2}">${crest({ ...r, idx: RANKS.indexOf(r) })}<b>${r.name}</b><small>${r.mmr}+ PL</small></div>`).join('')}</div></div>
      <div class="m-panel" style="flex:1;display:flex;flex-direction:column;min-height:0"><h3>${UI.trophy} Mejores invocadores <span style="margin-left:auto;font-family:var(--ui);letter-spacing:0;text-transform:none;color:var(--dim)">Tu posición: <b style="color:var(--teal2)">#${pos}</b> · ${rk.label} · ${p.mmr} PL</span></h3>
        <div class="m-scroll" style="flex:1"><table class="m-table"><tr><th style="width:60px">#</th><th>Invocador</th><th>Rango</th><th class="num">PL</th><th class="num">V / D</th><th class="num">% Vict.</th><th>Legión favorita</th></tr>
        ${rows.map((r, i) => { const k = rankOf(r.mmr); return `<tr class="${r.me ? 'me' : ''}"><td class="num" style="text-align:left;color:${i < 3 ? '#ffd76a' : 'inherit'}">${i + 1}</td><td><div class="m-legrow"><div class="m-av sm" style="--rk1:${k.c1};--rk2:${k.c2};width:34px;height:34px">${pimg(r.av)}</div>${r.tag ? `<span class="m-gtag">[${esc(r.tag)}]</span>` : ''}<b style="color:#fff">${esc(r.name)}</b></div></td><td style="color:${k.c2};font-family:var(--cond);font-weight:600;letter-spacing:.04em;text-transform:uppercase">${k.label}</td><td class="num">${r.mmr}</td><td class="num">${r.wins} / ${r.games - r.wins}</td><td class="num">${winrate(r.wins, r.games)}</td><td>${r.legion ? `<div class="m-legrow">${emblem(r.legion, legColor(r.legion))}${esc(legName(r.legion))}</div>` : '—'}</td></tr>`; }).join('')}
        </table></div></div></div></div>`));
  setTimeout(() => { const tr = el.querySelector('tr.me'); tr && tr.scrollIntoView({ block: 'center' }); hydrate(el); }, 50);
}

// ───────── TIENDA ─────────
export function viewShop(el) {
  const p = getProfile(); let tab = 'feat';
  el.appendChild(h(`<div class="m-page"><div class="m-ptitle"><h1>Tienda</h1><span class="sub">Cosméticos para tu perfil. Todo se consigue jugando.</span><div style="margin-left:auto;display:flex;align-items:center;gap:8px;font:600 26px var(--cond);color:#fff" class="ess"></div></div>
    <div class="m-panel" style="flex:1;display:flex;flex-direction:column;min-height:0"><div class="m-tabs"><button data-t="feat">Destacados</button><button data-t="av">Avatares</button><button data-t="border">Bordes</button><button data-t="title">Títulos</button></div><div class="m-scroll grid" style="flex:1"></div></div></div>`));
  const grid = el.querySelector('.grid'), ess = el.querySelector('.ess');
  const items = () => {
    const av = avatarCatalog().map(it => ({ kind: 'avatar', id: it.key, name: it.name, price: it.price, rar: it.rar, desc: 'Icono de invocador' }));
    const bo = Object.entries(BORDERS).map(([id, b]) => ({ kind: 'border', id, name: 'Borde ' + b.name, price: b.price, rar: b.rar || 'Común', desc: b.desc || 'Marco del avatar' }));
    const ti = Object.entries(TITLES).map(([id, t]) => ({ kind: 'title', id, name: t.name, price: t.price, rar: t.rar || 'Común', desc: 'Título bajo tu nombre' }));
    return { av, bo, ti };
  };
  const owned = it => it.price === 0 || (it.kind === 'avatar' ? p.owned.avatars : it.kind === 'border' ? p.owned.borders : p.owned.titles).includes(it.id);
  const equipped = it => it.kind === 'avatar' ? avatarKey(p) === it.id : it.kind === 'border' ? (p.border || 'default') === it.id : p.title === it.id;
  const cardHTML = it => {
    const pv = it.kind === 'avatar' ? pimg(it.id) : it.kind === 'border' ? avatarHTML({ ...p, border: it.id }, '', false) : `<div class="ttl">«${esc(it.name)}»</div>`;
    const o = owned(it), eq = equipped(it);
    return `<div class="m-item" style="--rc:${RAR_C[it.rar] || '#9fb0c8'}"><div class="pv">${pv}<span class="rar">${it.rar}</span></div><div class="nm">${esc(it.name)}</div><div class="ds">${esc(it.desc)}</div>
      ${eq ? `<button class="buy eq" disabled>${UI.check} Equipado</button>` : o ? `<button class="buy own" data-eq="${it.kind}:${it.id}">Equipar</button>` : `<button class="buy" data-buy="${it.kind}:${it.id}" ${p.essence < it.price ? 'disabled' : ''}>${UI.essence} ${fmt(it.price)}</button>`}</div>`;
  };
  const render = () => {
    el.querySelectorAll('.m-tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
    ess.innerHTML = `${UI.essence.replace('class="ico"', 'class="ico" style="width:26px;height:26px;color:#4fb8ff"')}${fmt(p.essence)} <small style="font:500 13px var(--ui);color:var(--dim)">Esencia Azul</small>`;
    const { av, bo, ti } = items();
    let list = tab === 'av' ? av : tab === 'border' ? bo : tab === 'title' ? ti : [...av.filter(i => i.rar === 'Legendario' || i.rar === 'Épico').slice(0, 6), ...bo.filter(b => b.price >= 600), ...ti.filter(t => t.price >= 600)];
    grid.innerHTML = `<div class="m-shopgrid">${list.map(cardHTML).join('') || '<div class="m-empty"><b>Nada por aquí</b>Vuelve pronto.</div>'}</div>`;
    hydrate(grid);
  };
  const find = (kind, id) => { const { av, bo, ti } = items(); return [...av, ...bo, ...ti].find(i => i.kind === kind && i.id === id); };
  el.addEventListener('click', async e => {
    const t = e.target.closest('[data-t]'); if (t) { click(); tab = t.dataset.t; render(); return; }
    const b = e.target.closest('[data-buy]'), q = e.target.closest('[data-eq]');
    if (b) {
      const [kind, id] = b.dataset.buy.split(':'), it = find(kind, id); if (!it) return; click();
      const ok = await modal('Confirmar compra', `¿Comprar <b style="color:#fff">${esc(it.name)}</b> por <b style="color:#6fd8ff">${fmt(it.price)} de Esencia Azul</b>?`, [['Cancelar', ''], ['Comprar', 'teal']]);
      if (ok !== 1) return; if (p.essence < it.price) { toast('No tienes suficiente Esencia Azul.'); return; }
      p.essence -= it.price; (kind === 'avatar' ? p.owned.avatars : kind === 'border' ? p.owned.borders : p.owned.titles).push(id);
      saveProfile(p); click('victory'); toast(`¡${esc(it.name)} desbloqueado!`); render();
    }
    if (q) { const [kind, id] = q.dataset.eq.split(':'); click(); if (kind === 'avatar') p.avatar = id; else if (kind === 'border') p.border = id; else p.title = id; saveProfile(p); render(); }
  });
  render();
}

// ───────── GREMIO ─────────
const GCOLORS = ['#c8aa6e', '#3a6fd8', '#c83a3a', '#2fa86a', '#8a4ad8', '#0ac8b9', '#e07a2a', '#d8d8e0', '#d84a8a', '#4a5a74'];
const GEMB = ['demacia', 'noxus', 'jonia', 'freljord', 'piltover', 'targon', 'invocador', 'random'];
export function viewGuild(el) {
  const p = getProfile();
  const g = { name: '', tag: '', color: GCOLORS[0], emblem: 'invocador', motto: '', ...(p.guild || {}) };
  el.appendChild(h(`<div class="m-page"><div class="m-ptitle"><h1>Gremio</h1><span class="sub">${p.guild ? 'Gestiona tu gremio.' : 'Funda un gremio y luce su etiqueta junto a tu nombre.'}</span></div>
    <div class="m-guildw"><div class="m-panel" style="display:flex;flex-direction:column;min-height:0"><div class="m-banner"><div class="pole"></div><div class="flag"></div><div class="tagbig"></div></div>
      <div style="text-align:center;padding:0 20px 18px"><div class="gname" style="font:600 34px var(--cond);color:#fff;text-transform:uppercase;letter-spacing:.04em"></div><div class="gmotto" style="color:var(--gold);font-style:italic;margin-top:2px"></div></div>
      <h3 style="border-top:1px solid var(--line)">${UI.friends} Miembros</h3><div class="m-scroll members" style="flex:1;padding:6px 8px"></div></div>
    <div class="m-panel m-scroll" style="padding:18px 20px"><div class="m-field"><label>Nombre del gremio</label><input class="m-in" maxlength="24" data-f="name" placeholder="p. ej. Guardianes del Alba"></div>
      <div class="m-field"><label>Etiqueta (2–5 caracteres)</label><input class="m-in" maxlength="5" data-f="tag" placeholder="ALBA" style="text-transform:uppercase"></div>
      <div class="m-field"><label>Lema</label><input class="m-in" maxlength="48" data-f="motto" placeholder="Por la Grieta"></div>
      <div class="m-field"><label>Color</label><div class="m-colors">${GCOLORS.map(c => `<button data-c="${c}" style="background:${c}"></button>`).join('')}</div></div>
      <div class="m-field"><label>Emblema</label><div class="m-embs">${GEMB.map(e => `<button data-e="${e}">${emblem(e)}</button>`).join('')}</div></div>
      <div style="display:flex;gap:10px;margin-top:8px"><button class="m-btn teal" data-a="save" style="flex:1">${p.guild ? 'Guardar cambios' : 'Fundar gremio'}</button>${p.guild ? '<button class="m-btn danger" data-a="leave">Abandonar</button>' : ''}</div></div></div></div>`));
  const render = () => {
    el.querySelector('.flag').innerHTML = emblem(g.emblem); el.querySelector('.m-banner').style.setProperty('--gc', g.color);
    el.querySelector('.tagbig').textContent = g.tag ? `[${g.tag.toUpperCase()}]` : '';
    el.querySelector('.gname').textContent = g.name || 'Tu gremio'; el.querySelector('.gmotto').textContent = g.motto ? `«${g.motto}»` : '';
    el.querySelectorAll('[data-c]').forEach(b => b.classList.toggle('on', b.dataset.c === g.color)); el.querySelectorAll('[data-e]').forEach(b => b.classList.toggle('on', b.dataset.e === g.emblem));
    el.querySelectorAll('[data-f]').forEach(i => { if (document.activeElement !== i) i.value = g[i.dataset.f] || ''; });
    const mem = p.guild ? [[p.name, avatarKey(p), 'Líder', 'on'], ['PoroFeroz', 'c_scuttle', 'Oficial', 'game'], ['KrugLord', 'c_krug', 'Miembro', 'on'], ['YordleFurioso', 'c_raptor', 'Miembro', 'off']] : [[p.name, avatarKey(p), 'Fundador', 'on']];
    el.querySelector('.members').innerHTML = mem.map(([n, a, r, s]) => `<div class="m-fr ${s}"><div class="m-av sm">${pimg(a)}</div><div style="flex:1"><div class="fn">${esc(n)}</div><div class="fs">${r}</div></div></div>`).join('') + (p.guild ? '' : `<div class="m-empty" style="padding:20px"><b>Aún no hay miembros</b>Funda tu gremio para invitar a tus amigos.</div>`);
    hydrate(el);
  };
  el.addEventListener('input', e => { const f = e.target.dataset.f; if (!f) return; g[f] = f === 'tag' ? e.target.value.toUpperCase().replace(/[^A-Z0-9ÑÁÉÍÓÚ]/g, '') : e.target.value; render(); });
  el.addEventListener('keydown', e => e.stopPropagation());
  el.addEventListener('click', async e => {
    const c = e.target.closest('[data-c]'), em = e.target.closest('[data-e]'), a = e.target.closest('[data-a]');
    if (c) { click(); g.color = c.dataset.c; render(); } if (em) { click(); g.emblem = em.dataset.e; render(); }
    if (a?.dataset.a === 'save') { click(); if ((g.name || '').trim().length < 3) return toast('El nombre debe tener al menos 3 caracteres.'); if ((g.tag || '').length < 2) return toast('La etiqueta debe tener entre 2 y 5 caracteres.'); const was = !!p.guild; p.guild = { name: g.name.trim(), tag: g.tag, color: g.color, emblem: g.emblem, motto: g.motto || '' }; saveProfile(p); toast(was ? 'Gremio actualizado.' : `¡Has fundado ${esc(g.name)}!`); ctx.go('guild'); }
    if (a?.dataset.a === 'leave') { click(); const r = await modal('¿Abandonar el gremio?', 'Como líder, el gremio se disolverá.', [['Cancelar', ''], ['Abandonar', 'danger']]); if (r === 1) { p.guild = null; saveProfile(p); ctx.go('guild'); } }
  });
  render();
}
