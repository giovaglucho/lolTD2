// SOLO Y COOPERATIVO + MULTIJUGADOR
import { ctx, h, click, toast, pimg, hydrate, crest, iconTile } from '../ui.js';
import { getProfile, getSettings } from '../store.js';
import { legionList, champsOf, allChamps, hex, esc, MASTERMIND, STRATEGIES, DIFF_LIST, rankOf } from '../data.js';
import { emblem, glyph, UI } from '../icons.js';

const LS = 'rl_lastsolo';
const loadSel = () => { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch { return {}; } };
const saveSel = s => { try { localStorage.setItem(LS, JSON.stringify(s)); } catch {} };
const DIFF_INFO = { facil: ['#7fd35a', 'La IA gasta poco y no mejora.'], normal: ['#4fb8ff', 'Una partida equilibrada.'], dificil: ['#f0a03a', 'La IA juega fuerte y envía mercenarios.'], locura: ['#ff4a4a', 'Bonificación de oro y presión constante.'] };
const pick = a => a[Math.floor(Math.random() * a.length)];

export function viewSolo(el, opts = {}) {
  const sel = { mode: '1v1', diff: 'normal', legion: '', strategy: STRATEGIES[0]?.id || '', ...loadSel() };
  if (opts.preset === 'challenge') { sel.diff = 'locura'; sel.mode = '1v1'; }
  const legs = legionList();
  if (!sel.legion) sel.legion = legs[0]?.id || 'random';
  el.appendChild(h(`<div class="m-page">
    <div class="m-ptitle"><h1>Solo y <em>cooperativo</em></h1><span class="sub">Defiende tu Nexo contra la IA durante 20 oleadas.</span></div>
    <div class="m-solo">
      <div class="m-panel m-scroll">
        <h3>${UI.swords} Modo de juego</h3>
        <div class="m-modecard" data-mode="1v1"><div class="mk"><i></i><span>VS</span><i class="r"></i></div><div><h4>1 contra 1</h4><p>Tú contra una IA. Cada uno defiende su carril y envía mercenarios al rival.</p></div></div>
        <div class="m-modecard" data-mode="2v2"><div class="mk"><i></i><i></i><span>VS</span><i class="r"></i><i class="r"></i></div><div><h4>2 contra 2 cooperativo</h4><p>Tú y una IA aliada contra dos IA. El Nexo y sus mejoras se comparten.</p></div></div>
        <h3 style="margin-top:6px">${UI.shield} Dificultad</h3>
        <div class="m-diffs" style="padding-top:12px">${DIFF_LIST.map(([id, n]) => `<button class="m-diff" data-diff="${id}" style="--c:${DIFF_INFO[id][0]}"><b>${n}</b><small>${DIFF_INFO[id][1]}</small></button>`).join('')}</div>
        ${opts.preset === 'challenge' ? `<div class="m-tip" style="margin:0 14px 14px"><b>Desafío semanal:</b>&nbsp;sobrevive a las 20 oleadas en Locura con cualquier legión. Recompensa: 400 de Esencia Azul.</div>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;min-height:0">
        <div class="m-panel m-scroll" style="flex:1">
          <h3>${UI.shield} Elige tu legión <span style="margin-left:auto;color:var(--dim2);letter-spacing:.05em;font-weight:500;text-transform:none;font-family:var(--ui);font-size:13px">Cada región tiene 10 campeones distintos</span></h3>
          <div class="m-legs"></div>
          <div class="m-stratwrap"></div>
        </div>
        <div class="m-playbar"><div class="m-summary"></div><button class="m-btn play">${'Jugar'}</button></div>
      </div>
    </div></div>`));
  const legsEl = el.querySelector('.m-legs');
  const card = (id, name, title, desc, color, accent, champs, embId) => {
    const shown = champs.slice(0, 6);
    return `<button class="m-leg" data-leg="${id}" style="--lc:${hex(color)};--la:${hex(accent)}">${emblem(embId, hex(accent))}
      <div class="lh">${emblem(embId, hex(accent))}<h4>${esc(name)}</h4><div class="lt">${esc(title || '')}</div></div>
      <div class="ld">${esc(desc || '')}</div>
      <div class="lp">${shown.length ? shown.map(c => pimg(c.id || c, `title="${esc(c.name || '')}"`)).join('') + (champs.length > shown.length ? `<span class="more">+${champs.length - shown.length}</span>` : '') : `<span class="more" style="margin:0">Campeones en camino…</span>`}</div>
      <span class="chk">${UI.check}</span></button>`;
  };
  const all = allChamps();
  legsEl.innerHTML = legs.map(l => card(l.id, l.name, l.title, l.desc || (l.lore || '').slice(0, 120), l.color, l.accent, champsOf(l.id), l.id)).join('')
    + card('invocador', MASTERMIND.name, MASTERMIND.title, MASTERMIND.desc, MASTERMIND.color, MASTERMIND.accent, all.filter((_, i) => i % 7 === 3).slice(0, 6), 'invocador')
    + card('random', 'Aleatoria', 'Que decida la Grieta', 'Se te asignará una región al azar al empezar la partida. Ideal para aprender todas las legiones.', 0x3a3f52, 0xb8c4d8, [], 'random');
  const stratEl = el.querySelector('.m-stratwrap');
  const renderStrats = () => {
    stratEl.innerHTML = sel.legion !== 'invocador' ? '' : `<h3 style="border-top:1px solid var(--line)">${UI.book} Estrategia de Mente maestra</h3><div class="m-strats" style="padding-top:12px">${STRATEGIES.map(s => `<button class="m-strat ${s.id === sel.strategy ? 'on' : ''}" data-strat="${s.id}">${iconTile(glyph(s.id, s.icon), '#46f0e0', 'si')}<div><b>${esc(s.name)}</b><small>${esc(s.desc)}</small></div></button>`).join('')}</div>`;
  };
  const sum = el.querySelector('.m-summary');
  const refresh = () => {
    el.querySelectorAll('.m-modecard').forEach(b => b.classList.toggle('on', b.dataset.mode === sel.mode));
    el.querySelectorAll('.m-diff').forEach(b => b.classList.toggle('on', b.dataset.diff === sel.diff));
    el.querySelectorAll('.m-leg').forEach(b => b.classList.toggle('on', b.dataset.leg === sel.legion));
    renderStrats();
    const ln = sel.legion === 'invocador' ? MASTERMIND.name : sel.legion === 'random' ? 'Aleatoria' : (legs.find(l => l.id === sel.legion)?.name || '—');
    const st = sel.legion === 'invocador' ? STRATEGIES.find(s => s.id === sel.strategy) : null;
    sum.innerHTML = `<div><small>Modo</small><b>${sel.mode === '2v2' ? '2 contra 2' : '1 contra 1'}</b></div><div><small>Dificultad</small><b style="color:${DIFF_INFO[sel.diff][0]}">${DIFF_LIST.find(d => d[0] === sel.diff)[1]}</b></div><div><small>Legión</small><b>${esc(ln)}</b></div>${st ? `<div><small>Estrategia</small><b style="color:var(--teal2)">${esc(st.name)}</b></div>` : ''}<div><small>Rivales</small><b>${sel.mode === '2v2' ? '2 IA aleatorias' : '1 IA aleatoria'}</b></div>`;
    saveSel(sel);
  };
  el.addEventListener('click', e => {
    const t = e.target.closest('[data-mode],[data-diff],[data-leg],[data-strat]'); if (!t) return; click();
    if (t.dataset.mode) sel.mode = t.dataset.mode; if (t.dataset.diff) sel.diff = t.dataset.diff; if (t.dataset.leg) sel.legion = t.dataset.leg; if (t.dataset.strat) sel.strategy = t.dataset.strat;
    refresh(); hydrate(el);
  });
  el.querySelector('.m-btn.play').onclick = () => {
    click('horn');
    const ids = legs.map(l => l.id), others = id => ids.filter(x => x !== id);
    const mine = sel.legion;
    const allyLegion = sel.mode === '2v2' ? pick(ids.length ? ids : ['random']) : undefined;
    const pool = ids.length ? ids : ['random'];
    const enemyLegions = sel.mode === '2v2' ? [pick(pool), pick(pool)] : [pick(mine && ids.includes(mine) && pool.length > 1 ? others(mine) : pool)];
    const cfg = { lanes: sel.mode === '2v2' ? 4 : 2, diff: sel.diff, legion: mine || 'random', allyLegion, enemyLegions, strategy: mine === 'invocador' ? sel.strategy : undefined };
    try { ctx.api.startLocal ? ctx.api.startLocal(cfg) : toast('El juego no está conectado.'); } catch (err) { console.error(err); toast('No se pudo iniciar la partida.'); }
  };
  refresh();
}

export function viewMulti(el) {
  const p = getProfile(), rk = rankOf(p.mmr || 1200), online = !!(ctx.api.onlineAvailable && ctx.api.onlineAvailable());
  const srv = getSettings().serverUrl;
  el.appendChild(h(`<div class="m-page">
    <div class="m-ptitle"><h1>Multi<em>jugador</em></h1><span class="sub">Partidas 2 contra 2 con otros invocadores.</span></div>
    <div class="m-queues">
      <div class="m-panel m-queue">${emblem('demacia', '#c8aa6e').replace('class="emb"', 'class="emb bgemb"')}
        <div class="m-kicker">Partida normal</div><h2>Clásico 2v2</h2>
        <ul><li>Sin puntuación: ideal para probar legiones y estrategias.</li><li>Si faltan jugadores, la partida se completa con bots tras la espera.</li><li>Tu aliado comparte el Nexo y las mejoras de Nexo.</li><li>Recompensas completas de XP y Esencia Azul.</li></ul>
        <div class="q-foot"><button class="m-btn teal" data-q="classic" ${online ? '' : 'disabled'}>Buscar partida</button><span style="color:var(--dim);font-size:14px">Tiempo estimado: ~1 min</span></div>
      </div>
      <div class="m-panel m-queue">${emblem('noxus', '#e2574c').replace('class="emb"', 'class="emb bgemb"')}
        <div class="m-kicker" style="color:#ff8a7a">Clasificatoria</div><h2>Ranked 2v2</h2>
        <ul><li>4 jugadores reales: sin bots.</li><li>Ganas o pierdes Puntos de Liga (PL) según el resultado.</li><li>Asciende de Hierro a Retador. La temporada 1 termina en 8 semanas.</li></ul>
        <div class="m-rankbadge" style="margin-bottom:18px">${crest(rk)}<div><div class="m-kicker" style="color:var(--dim)">Tu rango</div><div style="font:600 28px var(--cond);color:${rk.c2};text-transform:uppercase">${rk.label}</div><div style="color:var(--dim)">${p.mmr} PL · ${p.stats.wins}V ${p.stats.losses}D</div></div></div>
        <div class="q-foot"><button class="m-btn" data-q="ranked" ${online ? '' : 'disabled'} style="border-color:#c8463a">Buscar clasificatoria</button><span style="color:var(--dim);font-size:14px">Requiere nivel 5</span></div>
      </div>
    </div>
    ${online ? `<div class="m-offline" style="border-color:rgba(95,211,90,.4);background:linear-gradient(90deg,rgba(95,211,90,.12),transparent)"><div class="pulse" style="background:#5fd35a"></div><div><h4>Servidores en línea</h4><p>Conectado${srv ? ' a ' + esc(srv) : ''}. ¡Buena suerte en la Grieta!</p></div></div>`
      : `<div class="m-offline"><div class="pulse"></div><div style="flex:1"><h4>Servidores en línea próximamente</h4><p>Estamos preparando la infraestructura de emparejamiento. Mientras tanto, juega <b style="color:var(--gold2)">Solo y cooperativo</b> contra la IA, o conecta tu propio servidor (npm start) en Ajustes.</p></div><button class="m-btn sm" data-go="settings">Servidor propio</button><button class="m-btn sm teal" data-go="solo">Jugar contra la IA</button></div>`}
  </div>`));
  el.addEventListener('click', e => {
    const q = e.target.closest('[data-q]'), g = e.target.closest('[data-go]');
    if (q && !q.disabled) { click('horn'); try { ctx.api.startOnline(q.dataset.q); } catch (err) { console.error(err); toast('No se pudo conectar.'); } }
    if (g) { click(); ctx.go(g.dataset.go); }
  });
}
