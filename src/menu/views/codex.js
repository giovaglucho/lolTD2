// CÓDICE (como el de LTD2): Manual, Unidades (Luchadores / Oleadas / Mercenarios), Mente maestra, Nexo, Hechizos y Tipos.
import { ctx, h, click, pimg, hydrate, iconTile } from '../ui.js';
import { legionList, legionById, allChamps, champsOf, unitStats, waveUnits, creatureStats, creatureTypes, creatureFamily, tierOf, DMG, ARM, MATRIX, MASTERMIND, STRATEGIES, SPELLS, MERCS, CREEPS, CFG, hex, esc, fmt, ROLE_ICON } from '../data.js';
import { UI, emblem, glyph } from '../icons.js';
import { viewerSet, viewerClear, viewerAttack, viewerAuto, viewerDrag } from '../stage.js';
import { matrixHTML, PAGES } from './info.js';

const state = { tab: 'units', sub: 'champs', legion: 'all', tier: 'all', dmg: 'all', arm: 'all', view: 'grid', sort: 'cost', q: '', sel: null, up: -1, stab: 'stats', mm: null, sp: null };
const TABS = [['manual', 'Manual del juego'], ['units', 'Unidades'], ['mm', 'Mente maestra'], ['nexus', 'Nexo'], ['spells', 'Hechizos de invocador'], ['types', 'Tipos de daño']];
const CREATURE_COLOR = { void: 0xb05aff, jungle: 0x7fe06a, drake: 0xffa040, minion: 0x6fb8ff };

export function viewCodex(el, opts = {}) {
  if (opts.tab) state.tab = opts.tab;
  const back = opts.back || 'main';
  el.appendChild(h(`<div class="cx"><div class="cx-top"><h1>Códice</h1><div class="cx-tabs">${TABS.map(([id, n]) => `<button data-tab="${id}">${n}</button>`).join('')}</div></div><div class="cx-content" style="flex:1;min-height:0;display:flex;flex-direction:column"></div></div>`));
  const bk = h(`<button class="m-btn m-backbtn">Atrás</button>`); bk.onclick = () => { click(); ctx.go(back); }; el.appendChild(bk);
  const content = el.querySelector('.cx-content');
  const renderTab = () => {
    el.querySelectorAll('.cx-tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === state.tab));
    viewerClear(); content.innerHTML = '';
    ({ manual: tabManual, units: tabUnits, mm: tabMM, nexus: tabNexus, spells: tabSpells, types: tabTypes })[state.tab](content);
    hydrate(content);
  };
  el.querySelector('.cx-tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) { click(); state.tab = b.dataset.tab; renderTab(); } });
  el.addEventListener('keydown', e => e.stopPropagation());
  renderTab();
  return () => viewerClear();
}

// ───────── Unidades ─────────
function unitList() {
  const q = state.q.trim().toLowerCase();
  const match = (name, extra = '') => !q || (name + ' ' + extra).toLowerCase().includes(q);
  if (state.sub === 'champs') {
    let l = allChamps().filter(c => (state.legion === 'all' || c.legion === state.legion) && (state.tier === 'all' || tierOf(c) === +state.tier) && (state.dmg === 'all' || c.dmgType === state.dmg) && (state.arm === 'all' || c.armorType === state.arm) && match(c.name || '', c.title || ''));
    const s = c => unitStats(c);
    const by = { cost: (a, b) => (a.cost ?? 0) - (b.cost ?? 0), name: (a, b) => (a.name || '').localeCompare(b.name || ''), hp: (a, b) => s(b).hp - s(a).hp, dps: (a, b) => s(b).dps - s(a).dps, range: (a, b) => s(b).range - s(a).range }[state.sort];
    l.sort(by);
    return l.map(c => ({ kind: 'champ', id: c.id, key: c.id, name: c.name || c.id, sub: c.title || '', c, grp: c.legion, tag: 'T' + tierOf(c), cost: c.cost, st: s(c) }));
  }
  if (state.sub === 'waves') {
    return waveUnits().filter(w => { const t = creatureTypes(w.id, w.c); return (state.dmg === 'all' || t.dmgType === state.dmg) && (state.arm === 'all' || t.armorType === state.arm) && match(w.c.name, w.waveName); })
      .map(w => ({ kind: 'creep', id: w.id + '@' + w.wave, key: w.key, name: w.c.name, sub: `Oleada ${w.wave} · ×${w.n}`, w, grp: 'w' + w.wave, tag: 'O' + w.wave, st: creatureStats(w.c, w.wave) }));
  }
  return MERCS.filter(m => match(m.name, m.desc)).map(m => ({ kind: 'merc', id: m.id, key: 'c_' + m.c, name: m.name, sub: m.desc, m, grp: 'merc', tag: '✦' + m.cost, st: CREEPS[m.c] ? creatureStats(CREEPS[m.c], 1) : null }));
}

function tabUnits(root) {
  const legs = legionList();
  root.appendChild(h(`<div class="cx-body"><div class="cx-left">
    <div class="cx-legs"><button class="all" data-leg="all">TODAS</button>${legs.map(l => `<button data-leg="${l.id}" title="${esc(l.name)}">${emblem(l.id, hex(l.accent))}</button>`).join('')}</div>
    <div class="cx-filters">
      <label>Grado<select data-f="tier"><option value="all">Todos</option>${[1, 2, 3, 4, 5, 6].map(t => `<option value="${t}">T${t}</option>`).join('')}</select></label>
      <label>Daño<select data-f="dmg"><option value="all">Todos</option>${Object.entries(DMG).map(([k, d]) => `<option value="${k}">${d.name}</option>`).join('')}</select></label>
      <label>Defensa<select data-f="arm"><option value="all">Todas</option>${Object.entries(ARM).map(([k, d]) => `<option value="${k}">${d.name}</option>`).join('')}</select></label>
      <label>Ver<div class="vw"><button data-vw="grid" title="Cuadrícula">${UI.grid}</button><button data-vw="list" title="Lista">${UI.list}</button></div></label>
      <label>Ordenar<select data-f="sort"><option value="cost">Coste</option><option value="name">Nombre</option><option value="hp">Vida</option><option value="dps">DPS</option><option value="range">Alcance</option></select></label>
      <label class="search-l">Buscar<input data-f="q" placeholder="Nombre…" autocomplete="off"></label>
    </div>
    <div class="cx-sub"><button data-sub="champs">${UI.swords} Luchadores</button><button data-sub="waves">${UI.wave} Oleadas</button><button data-sub="mercs">${UI.coin} Mercenarios</button></div>
    <div class="cx-grid"></div></div>
    <div class="cx-main"><div class="cx-detail"></div><div class="cx-view"><div class="vt">Vista 3D · arrastra para girar</div><div class="vctl"><button data-v="auto" class="on">${UI.rotate} Rotar</button><button data-v="atk">${UI.swords} Atacar</button><button data-v="up" class="vup">★ Mejorado</button></div></div></div></div>`));
  const grid = root.querySelector('.cx-grid'), det = root.querySelector('.cx-detail'), view = root.querySelector('.cx-view');
  viewerDrag(view);
  const syncFilters = () => {
    root.querySelectorAll('[data-leg]').forEach(b => b.classList.toggle('on', b.dataset.leg === state.legion));
    root.querySelectorAll('[data-sub]').forEach(b => b.classList.toggle('on', b.dataset.sub === state.sub));
    root.querySelectorAll('[data-vw]').forEach(b => b.classList.toggle('on', b.dataset.vw === state.view));
    root.querySelectorAll('[data-f]').forEach(i => { if (document.activeElement !== i) i.value = state[i.dataset.f]; });
    const champs = state.sub === 'champs';
    root.querySelector('.cx-legs').style.display = champs ? '' : 'none';
    root.querySelector('[data-f="tier"]').disabled = !champs;
  };
  let items = [];
  const renderGrid = () => {
    items = unitList();
    grid.className = 'cx-grid' + (state.view === 'list' ? ' list' : '');
    if (!items.length) { grid.innerHTML = `<div class="cx-empty" style="grid-column:1/-1"><div><b>${state.sub === 'champs' && !allChamps().length ? 'Legiones en preparación' : 'Sin resultados'}</b>${state.sub === 'champs' && !allChamps().length ? 'Los campeones de las regiones aún se están forjando.' : 'Prueba a cambiar los filtros.'}</div></div>`; return; }
    let html = '', lastG = null;
    const groupOn = state.view === 'grid' && (state.sub !== 'champs' || (state.legion === 'all' && state.sort === 'cost'));
    const champGroups = state.sub === 'champs' && groupOn;
    const list = champGroups ? legionList().flatMap(l => items.filter(i => i.grp === l.id)) : items;
    for (const it of list) {
      if (groupOn && it.grp !== lastG) {
        lastG = it.grp;
        if (state.sub === 'champs') { const l = legionById(it.grp); html += `<div class="grp">${emblem(it.grp, hex(l?.accent))}${esc(l?.name || it.grp)}</div>`; }
        else if (state.sub === 'waves') html += `<div class="grp">${UI.wave} Oleada ${it.w.wave} · ${esc(it.w.waveName)}</div>`;
      }
      const on = state.sel && state.sel.kind === it.kind && state.sel.id === it.id ? 'on' : '';
      html += state.view === 'grid'
        ? `<button class="cx-cell ${on}" data-id="${esc(it.id)}" title="${esc(it.name)}">${pimg(it.key)}<span class="tg">${it.tag}</span>${it.cost ? `<span class="cs">${it.cost}</span>` : ''}</button>`
        : `<button class="cx-row ${on}" data-id="${esc(it.id)}">${pimg(it.key)}<div><b>${esc(it.name)}</b><small>${esc(it.sub)}</small></div><span style="color:#ffd76a">${it.cost ?? (it.m ? it.m.cost : '')}</span><span style="color:#7fe06a">${it.st ? fmt(it.st.hp) : ''}</span><span style="color:#ff9a7a">${it.st ? fmt(it.st.dps) : ''}</span></button>`;
    }
    grid.innerHTML = html; hydrate(grid);
  };
  const select = it => { state.sel = it ? { kind: it.kind, id: it.id } : null; state.up = -1; renderDetail(); grid.querySelectorAll('[data-id]').forEach(b => b.classList.toggle('on', it && b.dataset.id === it.id)); };
  const current = () => state.sel && (items.find(i => i.kind === state.sel.kind && i.id === state.sel.id) || unitListAll().find(i => i.kind === state.sel.kind && i.id === state.sel.id));
  const renderDetail = () => {
    const it = current();
    if (!it) { det.innerHTML = `<div class="cx-empty" style="height:100%"><div><b>Selecciona una unidad</b>Elige un icono de la izquierda para ver sus estadísticas, habilidades y su modelo 3D.</div></div>`; viewerClear(); return; }
    det.innerHTML = it.kind === 'champ' ? champDetail(it.c) : it.kind === 'creep' ? creepDetail(it.w) : mercDetail(it.m);
    hydrate(det);
    // visor
    const upB = view.querySelector('.vup');
    if (it.kind === 'champ') {
      const l = legionById(it.c.legion); upB.style.display = it.c.upgrades && it.c.upgrades.length ? '' : 'none'; upB.classList.toggle('on', state.up >= 0);
      viewerSet(view, it.c.model || it.c.id, { upgraded: state.up >= 0, color: l?.accent ?? 0x0ac8b9 });
    } else {
      upB.style.display = 'none'; const id = it.kind === 'creep' ? it.w.id : it.m.c, c = CREEPS[id];
      viewerSet(view, c ? c.k : id, { color: CREATURE_COLOR[creatureFamily(id)] });
    }
  };
  root.addEventListener('click', e => {
    const t = e.target;
    const leg = t.closest('[data-leg]'); if (leg) { click(); state.legion = leg.dataset.leg; syncFilters(); renderGrid(); return; }
    const sub = t.closest('[data-sub]'); if (sub) { click(); state.sub = sub.dataset.sub; state.sel = null; syncFilters(); renderGrid(); autoSelect(); return; }
    const vw = t.closest('[data-vw]'); if (vw) { click(); state.view = vw.dataset.vw; syncFilters(); renderGrid(); return; }
    const cell = t.closest('[data-id]'); if (cell) { click(); select(items.find(i => i.id === cell.dataset.id)); return; }
    const upg = t.closest('[data-up]'); if (upg) { click(); state.up = +upg.dataset.up; renderDetail(); return; }
    const stb = t.closest('[data-stab]'); if (stb) { click(); state.stab = stb.dataset.stab; renderDetail(); return; }
    const v = t.closest('[data-v]');
    if (v) { click(); if (v.dataset.v === 'auto') v.classList.toggle('on', viewerAuto()); if (v.dataset.v === 'atk') viewerAttack(); if (v.dataset.v === 'up') { const it = current(); if (it?.c?.upgrades?.length) { state.up = state.up >= 0 ? -1 : 0; renderDetail(); } } }
  });
  root.addEventListener('input', e => { const f = e.target.dataset.f; if (!f) return; state[f] = e.target.value; renderGrid(); });
  const autoSelect = () => { if (!current() && items.length) select(items[0]); else renderDetail(); };
  syncFilters(); renderGrid(); autoSelect();
}
function unitListAll() { const s = { ...state }; const out = []; for (const sub of ['champs', 'waves', 'mercs']) { state.sub = sub; state.legion = 'all'; state.tier = 'all'; state.dmg = 'all'; state.arm = 'all'; state.q = ''; out.push(...unitList()); } Object.assign(state, s); return out; }

const statRow = (k, v, up) => `<div><span>${k}</span><b class="${up ? 'up' : ''}">${v}</b></div>`;
function typesHTML(dmgType, armorType) {
  const d = DMG[dmgType], a = ARM[armorType];
  const vsArm = d ? Object.keys(ARM).map(x => { const v = MATRIX[dmgType]?.[x] ?? 1; return v !== 1 ? `<span class="${v > 1 ? 'hi' : 'lo'}">${ARM[x].name} ${Math.round(v * 100)}%</span>` : ''; }).join('') : '';
  const vsDmg = a ? Object.keys(DMG).map(x => { const v = MATRIX[x]?.[armorType] ?? 1; return v !== 1 ? `<span class="${v < 1 ? 'hi' : 'lo'}">${DMG[x].name} ${Math.round(v * 100)}%</span>` : ''; }).join('') : '';
  return `<div class="cx-types">
    <div class="cx-type" style="--c:${d?.color || '#888'}"><div class="t">${d?.icon || '?'}</div><div><small>Tipo de daño</small><b>${d?.name || '—'}</b><div class="mm">${vsArm || '<span style="color:#9fb0c4">100% contra todo</span>'}</div></div></div>
    <div class="cx-type" style="--c:${a?.color || '#888'}"><div class="t">${a?.icon || '?'}</div><div><small>Tipo de armadura</small><b>${a?.name || '—'}</b><div class="mm">${vsDmg || '<span style="color:#9fb0c4">Sin debilidades</span>'}</div></div></div></div>`;
}
const FX_COLOR = { spin: '#8fd0ff', frost: '#9fe4ff', fire: '#ff7a3a', beam: '#fff3b0', quake: '#c9a26a', heal: '#7dffb0', slash: '#ff5a4a', rocket: '#ffd24a', poison: '#8aff5a', sun: '#ffd27a', wind: '#bfefff', arcane: '#4fd4ff', void: '#c77bff', shadow: '#9a7aff', blood: '#ff3a4a', holy: '#ffe9a0', lightning: '#a0c8ff', nature: '#7fe06a', water: '#4fb8ff', star: '#d0b8ff' };
const ABIL_G = { spin: 'scrap', nova: 'flash', volley: 'reroll', beam: 'clarity', chain: 'smite', heal: 'heal', shield: 'barrier', buff: 'champion', strike: 'ignite', stun: 'smite', poison: 'exhaust', dash: 'ghost', pull: 'teleport', taunt: 'barrier', summon: 'piggy', global: 'flash', stealth: 'ghost' };
function abilityText(a) {
  if (!a) return '';
  if (a.desc) return a.desc;
  const p = []; if (a.dmg) p.push(`${a.dmg} de daño`); if (a.r) p.push(`en un radio de ${a.r} m`); if (a.stun) p.push(`aturde ${a.stun} s`); if (a.heal) p.push(`cura ${a.heal}`); if (a.n) p.push(`${a.n} objetivos`); if (a.dps) p.push(`${a.dps} de daño/s durante ${a.t} s`);
  return p.join(', ') + '.';
}
function abilHTML(a, kind, color) {
  if (!a) return '';
  const c = a.color ? hex(a.color) : FX_COLOR[a.fx] || color || '#46f0e0';
  const params = []; if (a.cd) params.push(`${a.cd} s`);
  return `<div class="cx-abil">${iconTile(glyph(ABIL_G[a.type] || (kind === 'Pasiva' ? 'cleanse' : 'flash')), c, 'ai')}<div style="flex:1"><span class="cd">${params.join(' · ')}</span><div class="k">${kind}</div><b>${esc(a.name || (kind === 'Pasiva' ? 'Pasiva' : 'Habilidad'))}</b><p>${esc(abilityText(a))}</p></div></div>`;
}
function champDetail(c) {
  const l = legionById(c.legion), up = state.up >= 0 && c.upgrades ? c.upgrades[state.up] : null;
  const s = unitStats(c, state.up), b = unitStats(c);
  const t = tierOf(c), name = up ? up.name : c.name;
  const ability = up && up.ability ? { ...c.ability, ...up.ability } : c.ability, passive = up && up.passive ? { ...(c.passive || {}), ...up.passive } : c.passive;
  const desc = up ? (up.desc || '') : (c.desc || (c.lore ? c.lore.split(/(?<=\.)\s/)[0] : ''));
  const st = state.stab;
  const tabs = `<div class="cx-stabs"><button data-stab="stats" class="${st === 'stats' ? 'on' : ''}">Estadísticas</button><button data-stab="lore" class="${st === 'lore' ? 'on' : ''}">Historia</button><button data-stab="patch" class="${st === 'patch' ? 'on' : ''}">Historial de parches</button></div>`;
  let body = '';
  if (st === 'stats') body = `<div class="cx-stats">
      ${statRow('Vida', fmt(s.hp), up)}${statRow('Daño', fmt(s.dmg), up)}
      ${statRow('Ataques por segundo', fmt(s.aspd), up && s.aspd !== b.aspd)}${statRow('Intervalo de ataque', (1 / (s.aspd || 1)).toFixed(2).replace('.', ',') + ' s', up && s.aspd !== b.aspd)}
      ${statRow('DPS', fmt(s.dps), up)}${statRow('Alcance', s.melee ? 'Cuerpo a cuerpo' : fmt(s.range), false)}
      ${statRow('Armadura', `${s.armor} <small style="color:#9fb0c4;font-weight:400">(−${Math.round(100 - 10000 / (100 + s.armor))}%)</small>`, up && s.armor !== b.armor)}${statRow('Vida efectiva', fmt(s.ehp), up)}
      ${statRow('Velocidad de movimiento', fmt(s.speed), false)}${statRow('Coste', `<span style="color:#ffd76a">${up ? (up.cost ?? c.cost) : c.cost ?? '—'}</span>`, false)}
      ${statRow('Valor total', `<span style="color:#ffd76a">${s.value}</span>`, up)}${statRow('DPS / 100 de oro', fmt(s.dps / Math.max(1, s.value) * 100), false)}
    </div>
    ${typesHTML(c.dmgType, c.armorType)}
    ${abilHTML(ability, 'Habilidad', hex(l?.accent))}${abilHTML(passive, 'Pasiva', hex(l?.accent))}`;
  else if (st === 'lore') body = `${c.quote ? `<div class="cx-quote">${esc(c.quote)}</div>` : ''}<p class="cx-lore">${esc(c.lore || 'La historia de este campeón aún está por escribirse.')}</p>${l ? `<h3 class="m-h3" style="padding-left:0;border:0">${emblem(l.id, hex(l.accent))} ${esc(l.name)} · ${esc(l.title || '')}</h3><p class="cx-lore" style="font-style:normal">${esc(l.lore || l.desc || '')}</p>` : ''}`;
  else body = `<div class="cx-hist"><b>v1.0.0</b> · Añadido a la legión ${esc(l?.name || '')} con ${c.upgrades?.length || 0} mejora(s).<br><b>v1.0.0</b> · Tipos asignados: ${DMG[c.dmgType]?.name || '—'} / ${ARM[c.armorType]?.name || '—'}.</div>`;
  return `<div class="cx-head">${pimg((up ? 'u_' : '') + c.id)}<div><h2>${esc(name)}</h2><div class="tt">${esc(c.title || '')}</div>
      <div class="meta"><span class="gold">◆ ${up ? (up.cost ?? c.cost) : c.cost ?? '—'}</span>${l ? `<span>${emblem(l.id, hex(l.accent))} ${esc(l.name)}</span>` : ''}<span class="cx-pill" style="--c:#f2c94c">T${t}</span>${c.role ? `<span class="cx-pill" style="--c:#46f0e0">${ROLE_ICON[c.role] || ''} ${esc(c.role)}</span>` : ''}${up ? '<span class="cx-pill" style="--c:#ffd76a">★ Mejorado</span>' : ''}</div></div></div>
    ${desc ? `<div class="cx-desc">${esc(desc)}</div>` : ''}
    ${c.upgrades && c.upgrades.length ? `<div class="cx-upg">${up ? `<button data-up="-1">${pimg(c.id)} ${esc(c.name)}</button><span>◂ Base</span>` : `Mejora a ${c.upgrades.map((u, i) => `<button data-up="${i}">${pimg('u_' + c.id)} ${esc(u.name)} <span style="color:#ffd76a">◆${u.cost ?? ''}</span></button>`).join('')}`}</div>` : ''}
    ${tabs}${body}`;
}
function creepDetail(w) {
  const c = w.c, s = creatureStats(c, w.wave), t = creatureTypes(w.id, c);
  return `<div class="cx-head">${pimg(w.key)}<div><h2>${esc(c.name)}</h2><div class="tt">Oleada ${w.wave} · ${esc(w.waveName)}</div><div class="meta"><span>×${w.n} unidades</span><span class="cx-pill" style="--c:${c.boss ? '#ff5a4a' : '#9fb0c4'}">${c.boss ? 'Jefe' : creatureFamily(w.id) === 'void' ? 'Vacío' : creatureFamily(w.id) === 'jungle' ? 'Jungla' : creatureFamily(w.id) === 'drake' ? 'Dragón' : 'Súbdito'}</span><span class="gold">Recompensa ◆${c.bounty ?? 0}</span></div></div></div>
    <div class="cx-desc">Estadísticas escaladas a la oleada ${w.wave} (×${(s.hp / c.hp).toFixed(2).replace('.', ',')}). ${c.boss ? 'Un jefe con muchísima vida: prepara daño concentrado.' : ''}</div>
    <div class="cx-stabs"><button class="on">Estadísticas</button></div>
    <div class="cx-stats">${statRow('Vida', fmt(s.hp))}${statRow('Daño', fmt(s.dmg))}${statRow('Ataques por segundo', fmt(s.aspd))}${statRow('DPS', fmt(s.dps))}${statRow('Alcance', c.melee ? 'Cuerpo a cuerpo' : fmt(s.range))}${statRow('Armadura', s.armor)}${statRow('Velocidad de movimiento', fmt(s.speed))}${statRow('Vida efectiva', fmt(s.ehp))}${statRow('Vida total de la oleada', fmt(s.hp * w.n))}${statRow('Oro por baja', c.bounty ?? 0)}</div>
    ${typesHTML(t.dmgType, t.armorType)}${abilHTML(c.ability && { name: c.ability.name || 'Habilidad de jefe', ...c.ability }, 'Habilidad', '#c77bff')}`;
}
function mercDetail(m) {
  const c = CREEPS[m.c] || {}, s = c.hp ? creatureStats(c, 1) : null, t = creatureTypes(m.c, c);
  return `<div class="cx-head">${pimg('c_' + m.c)}<div><h2>${esc(m.name)}</h2><div class="tt">${esc(m.desc)}</div><div class="meta"><span style="color:#6fd8ff;font-weight:600">✦ ${m.cost} de esencia</span><span style="color:#7fe06a;font-weight:600">+${m.inc} ingresos</span><span>×${m.n} unidades</span></div></div></div>
    <div class="cx-desc">Se envía al carril rival y aparece junto a la siguiente oleada. Sus estadísticas crecen un 12% por oleada. Además, aumenta tus ingresos de oro de forma permanente.</div>
    <div class="cx-stabs"><button class="on">Estadísticas (oleada 1)</button></div>
    ${s ? `<div class="cx-stats">${statRow('Vida', fmt(s.hp))}${statRow('Daño', fmt(s.dmg))}${statRow('Ataques por segundo', fmt(s.aspd))}${statRow('DPS', fmt(s.dps))}${statRow('Alcance', c.melee ? 'Cuerpo a cuerpo' : fmt(s.range))}${statRow('Armadura', s.armor)}${statRow('Velocidad de movimiento', fmt(s.speed))}${statRow('Ingresos por esencia', ((m.inc / m.cost) * 100).toFixed(1).replace('.', ',') + '%')}</div>` : ''}
    ${typesHTML(t.dmgType, t.armorType)}${abilHTML(c.ability && { name: c.ability.name || 'Habilidad', ...c.ability }, 'Habilidad', '#c77bff')}`;
}

// ───────── Mente maestra ─────────
function fxLines(fx = {}) {
  const L = [];
  if (fx.income) L.push(['Ingresos', `${fx.income > 0 ? '+' : ''}${fx.income}`]);
  if (fx.incomeAfter) L.push([`Ingresos tras la oleada ${fx.incomeAfter.wave}`, `${fx.incomeAfter.amt > 0 ? '+' : ''}${fx.incomeAfter.amt}`, fx.incomeAfter.amt < 0]);
  if (fx.piggy) L.push(['Hucha inicial', `${fx.piggy.start} de oro`], ['Interés por oleada', `${Math.round(fx.piggy.rate * 100)}%`]);
  if (fx.sellRate) L.push(['Devolución al vender', `${Math.round(fx.sellRate * 100)}%`]);
  if (fx.rerollEachWave) L.push(['Tirada de campeones', 'Cada oleada']);
  if (fx.championBuff) L.push(['Primer campeón mejorado', `+${Math.round((fx.championBuff - 1) * 100)}% estadísticas`]);
  if (fx.rerolls) L.push(['Tiradas gratis', fx.rerolls]);
  return L;
}
function listDetail(root, items, keyName, color, detailFn) {
  root.appendChild(h(`<div class="cx-full"><div class="cx-mm"></div><div class="cx-detail cx-big"></div></div>`));
  const list = root.querySelector('.cx-mm'), det = root.querySelector('.cx-big');
  const render = () => {
    const cur = items.find(i => i.id === state[keyName]) || items[0]; state[keyName] = cur?.id;
    list.innerHTML = items.map(i => `<button class="cx-mmi ${i.id === cur?.id ? 'on' : ''}" data-i="${i.id}">${iconTile(glyph(i.id, i.icon), i.color != null ? hex(i.color) : color)}<div><b>${esc(i.name)}</b><small>${esc(i.desc)}</small></div></button>`).join('');
    det.innerHTML = cur ? detailFn(cur) : '';
  };
  list.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) { click(); state[keyName] = b.dataset.i; render(); } });
  render();
}
function tabMM(root) {
  root.appendChild(h(`<div class="m-tip" style="margin:0 0 12px;max-width:none">${emblem('invocador', '#c8aa6e', '34px')}<div><b>${esc(MASTERMIND.name)} · ${esc(MASTERMIND.title)}.</b>&nbsp;${esc(MASTERMIND.desc)}</div></div>`));
  listDetail(root, STRATEGIES, 'mm', '#46f0e0', s => `${iconTile(glyph(s.id, s.icon), '#46f0e0')}<h2>${esc(s.name)}</h2><div class="cx-desc" style="text-align:center">${esc(s.desc)}</div><div class="cx-fx">${fxLines(s.fx).map(([k, v, neg]) => `<div><span>${k}</span><b class="${neg ? 'neg' : ''}">${v}</b></div>`).join('')}</div><div class="m-tip"><b>Mente maestra:</b>&nbsp;recibes ${MASTERMIND.rollSize || 8} campeones aleatorios de todas las regiones.</div>`);
}
function tabSpells(root) {
  root.appendChild(h(`<div class="m-tip" style="margin:0 0 12px">${UI.bolt}<div>Al empezar la <b>oleada 7</b> se te ofrecen 3 hechizos al azar. Los de tipo <b>campeón</b> se aplican a una unidad; los de tipo <b>legión</b>, a todo tu ejército o economía.</div></div>`));
  listDetail(root, SPELLS, 'sp', '#c8aa6e', s => `${iconTile(glyph(s.id, s.icon), hex(s.color))}<h2>${esc(s.name)}</h2><div style="text-align:center;margin-bottom:10px"><span class="cx-pill" style="--c:${s.target === 'team' ? '#46f0e0' : '#f2c94c'}">${s.target === 'team' ? 'Legión' : 'Campeón'}</span></div><div class="cx-desc" style="text-align:center">${esc(s.desc)}</div>`);
}

// ───────── Nexo ─────────
function tabNexus(root) {
  const up = CFG.nexUp || { hp: 120, atk: 140, regen: 90 };
  const nx = [
    ['hp', 'Vida', UI.heart, '#7fe06a', `+500 de vida máxima y cura 500 al instante.`],
    ['atk', 'Ataque', UI.bolt, '#ff8a4a', `+35% de daño de los disparos del Nexo.`],
    ['regen', 'Regeneración', glyph('heal'), '#46f0e0', `Aumenta la regeneración de vida del Nexo entre oleadas.`],
  ];
  root.appendChild(h(`<div class="cx-full" style="grid-template-columns:1fr 420px"><div class="cx-detail" style="padding:26px">
    <div class="m-kicker">El equivalente al Rey de Legion TD 2</div><h2 style="margin:4px 0 8px;font:600 40px var(--cond);color:#fff;text-transform:uppercase">El Nexo</h2>
    <p class="cx-desc">El Nexo es el corazón de tu equipo. Dispara a los enemigos que llegan a él y, si su vida llega a 0, la partida termina. Sus mejoras se pagan con <b style="color:#6fd8ff">esencia</b>, se comparten con tu aliado y su coste aumenta con cada nivel.</p>
    <div class="cx-nexus" style="margin:18px 0">${nx.map(([k, n, ic, c, d]) => `<div class="cx-nx">${iconTile(ic.replace('class="ico"', 'class="gly"'), c)}<b>${n}</b><div class="cost">${UI.essence} ${up[k]} × nivel</div><p>${d}</p></div>`).join('')}</div>
    <table class="m-table"><tr><th>Nivel</th>${nx.map(n => `<th class="num">${n[1]}</th>`).join('')}</tr>${[1, 2, 3, 4, 5].map(l => `<tr><td>Nivel ${l}</td>${nx.map(n => `<td class="num" style="color:#6fd8ff">${up[n[0]] * l}</td>`).join('')}</tr>`).join('')}</table>
  </div><div class="cx-detail" style="padding:22px"><h3 class="m-h3" style="padding:0 0 10px">${UI.shield} Estadísticas del Nexo</h3><div class="cx-stats" style="grid-template-columns:1fr">
    ${statRow('Vida (1v1)', fmt(CFG.nexusHp || 3000))}${statRow('Vida (2v2)', fmt(CFG.nexusHp2v2 || 4200))}${statRow('Daño por disparo', '150 × (1 + 0,4 × oleada)')}${statRow('Intervalo de disparo', '0,9 s')}${statRow('Bonificación por Ataque', '+35% por nivel')}${statRow('Vida por mejora', '+500')}${statRow('Oleadas', CFG.totalWaves || 20)}</div>
    <div class="m-tip" style="margin-top:18px"><b>Consejo:</b>&nbsp;mejorar el Ataque del Nexo antes de una oleada de jefe puede salvar la partida si se te escapan unidades.</div></div></div>`));
}

function tabTypes(root) {
  root.appendChild(h(`<div class="cx-full" style="grid-template-columns:auto 1fr"><div class="cx-detail" style="padding:26px"><div class="m-kicker">Daño infligido según la armadura del objetivo</div><h2 style="margin:4px 0 10px;font:600 36px var(--cond);color:#fff;text-transform:uppercase">Tipos de daño y armadura</h2>${matrixHTML()}<p class="cx-desc" style="max-width:640px">Además del tipo, la <b>armadura numérica</b> reduce el daño recibido: daño × 100 / (100 + armadura). El daño <b style="color:${DMG.puro?.color}">Puro</b> ignora el tipo de armadura, pero no la armadura numérica.</p></div>
    <div class="cx-detail" style="padding:22px"><h3 class="m-h3" style="padding:0 0 10px">Tipos de daño</h3>${Object.entries(DMG).map(([k, d]) => `<div class="cx-type" style="--c:${d.color};margin-bottom:8px"><div class="t">${d.icon}</div><div><b>${d.name}</b><div style="color:#c0c5ce;font-size:13.5px">${esc(d.desc)} <span style="color:#9fb0c4">· ${allChamps().filter(c => c.dmgType === k).length} campeones</span></div></div></div>`).join('')}
      <h3 class="m-h3" style="padding:14px 0 10px">Tipos de armadura</h3>${Object.entries(ARM).map(([k, d]) => `<div class="cx-type" style="--c:${d.color};margin-bottom:8px"><div class="t">${d.icon}</div><div><b>${d.name}</b><div style="color:#c0c5ce;font-size:13.5px">${esc(d.desc)} <span style="color:#9fb0c4">· ${allChamps().filter(c => c.armorType === k).length} campeones</span></div></div></div>`).join('')}</div></div>`));
}

function tabManual(root) {
  root.appendChild(h(`<div class="cx-full" style="grid-template-columns:1fr"><div class="cx-detail cx-manual m-gpage">${PAGES.map((p, i) => `<div class="m-kicker" style="margin-top:${i ? 34 : 0}px">Capítulo ${i + 1}</div><h2>${p.t}</h2>${p.body()}`).join('')}</div></div>`));
  root.addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g && g.dataset.go === 'codex') { click(); state.tab = 'units'; ctx.go('codex'); } });
}
