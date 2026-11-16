// Pantalla de carga (estilo LTD2) y pantalla de resultado.
import { h, click, pimg, hydrate, avatarKey, crest } from '../ui.js';
import { getProfile, recordMatch, levelFromXp } from '../store.js';
import { legionById, champsOf, rankOf, esc, fmt, hex, DIFFS } from '../data.js';
import { emblem, UI } from '../icons.js';
import { preloadPortraits } from '../../portraits.js';

const TIPS = [
  'Los poros generan Esencia Hextech de forma continua: cuanto antes los compres, más rinden.',
  'El daño Perforante inflige un 120% a la armadura Ligera, pero solo un 80% a la Fortificada.',
  'Mejorar a un campeón lo transforma: más vida, más daño y, a menudo, una habilidad potenciada.',
  'Los mercenarios no solo presionan al rival: también aumentan tus ingresos para siempre.',
  'Las mejoras del Nexo se comparten con tu aliado en 2 contra 2.',
  'En la oleada 7 podrás elegir un hechizo de invocador. ¡Destello en tu mejor tirador es devastador!',
  'Coloca a los tanques delante: los enemigos atacan a la unidad más cercana.',
  'El Barón Nashor llega en la oleada 20. Guarda oro para las últimas mejoras.',
  'Con la legión Invocador, la estrategia Avaricia te da +25 de ingresos desde el principio.',
  'Puedes consultar las estadísticas de todas las oleadas en el Códice.',
];
const legName = id => id === 'random' ? 'Aleatoria' : (legionById(id)?.name || 'Invocador');
const legAcc = id => hex(legionById(id)?.accent ?? 0xc8aa6e);
const legCol = id => hex(legionById(id)?.color ?? 0x3a3f52);

function playerKey(p) {
  if (p.me) return avatarKey(getProfile());
  const r = champsOf(p.legion); if (r.length) return r[Math.min(r.length - 1, (p.name || '').length % r.length)].id;
  return ['c_krug', 'c_wolf', 'c_raptor', 'c_gromp'][(p.name || '').length % 4];
}

export function runLoading(el, info = {}) {
  const players = info.players && info.players.length ? info.players : [{ name: getProfile().name, legion: 'random', team: 0, me: true }, { name: 'IA', legion: 'random', team: 1, bot: true, diff: 'normal' }];
  const myTeam = (players.find(p => p.me) || players[0]).team ?? 0;
  const L = players.filter(p => (p.team ?? 0) === myTeam), R = players.filter(p => (p.team ?? 0) !== myTeam);
  const prof = getProfile(), rk = rankOf(prof.mmr || 1200);
  const card = (p, i, side) => {
    const sub = p.bot ? `<span class="flag bot"></span><span>IA · ${esc(DIFFS[p.diff]?.name || p.diff || 'Normal')}</span>` : `<span class="flag"></span><span style="color:${p.me ? rk.c2 : 'inherit'}">${p.me ? rk.label : 'Invocador'}</span>`;
    return `<div class="ld-card" style="--lc:${legCol(p.legion)};--lc2:${legAcc(p.legion)};animation-delay:${.1 + i * .12}s"><div class="pt">${pimg(playerKey(p))}</div><div class="info"><div class="nm">${esc(p.name || 'Invocador')}${p.me ? ' <small style="font:500 12px var(--ui);color:var(--teal2)">(tú)</small>' : ''}</div><div class="sub">${emblem(p.legion, legAcc(p.legion))}<span class="lg">${esc(legName(p.legion))}</span>${sub}</div><div class="pb"><i></i></div><div class="pct">0%</div></div></div>`;
  };
  const mode = info.mode === '2v2' ? '2 contra 2' : '1 contra 1';
  el.appendChild(h(`<div class="ld"><div class="ld-title">Cargando…<small>La Grieta del Invocador</small></div>
    <div class="ld-mode">${info.ranked ? 'Clasificatoria' : players.some(p => p.bot) ? 'Contra la IA' : 'Clásico'}<b>${mode}</b></div>
    <div class="ld-team l" style="--tc:#3a8fff"><div class="lbl">Tu equipo</div>${L.map((p, i) => card(p, i)).join('')}</div>
    <div class="ld-team r" style="--tc:#e2574c"><div class="lbl">Rivales</div>${R.map((p, i) => card(p, i + L.length)).join('')}</div>
    <div class="ld-vs">VS</div>
    <div class="ld-tip"><b>CONSEJO:</b>${TIPS[Math.floor(Math.random() * TIPS.length)]}</div></div>`));
  hydrate(el);
  const bars = [...el.querySelectorAll('.ld-card')].map((c, i) => ({ i: c.querySelector('.pb i'), t: c.querySelector('.pct'), sp: .75 + ((i * 37) % 10) / 22 }));
  const keys = [...new Set(players.flatMap(p => champsOf(p.legion).map(c => c.id)))];
  let preDone = false; const pre = preloadPortraits(keys).catch(() => {}).then(() => { preDone = true; });
  return new Promise(res => {
    const t0 = performance.now(), DUR = 2500;
    const tick = () => {
      const t = performance.now() - t0, k = Math.min(1, t / DUR);
      bars.forEach(b => { const v = Math.min(1, Math.pow(k * b.sp * 1.15, .8)); const pct = Math.round((k >= 1 ? 1 : v) * 100); b.i.style.width = pct + '%'; b.t.textContent = pct >= 100 ? 'Listo' : pct + '%'; });
      if (k >= 1 && (preDone || t > 6000)) { setTimeout(res, 150); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

export function runResult(el, res = {}) {
  const win = !!res.win, prof = getProfile();
  const rw = res.noRecord ? { ...(res.rewards || {}), before: levelFromXp(prof.xp), after: levelFromXp(prof.xp), mmrDelta: res.mmrDelta || 0 } : recordMatch(res);
  const p = getProfile();
  const showMMR = res.ranked || typeof res.mmrDelta === 'number' || res.mode === 'ranked';
  const lvUp = rw.after && rw.before && rw.after.level > rw.before.level;
  el.appendChild(h(`<div class="rs"><div class="rs-rays ${win ? '' : 'lose'}"></div>
    <div class="rs-title ${win ? 'win' : 'lose'}">${win ? 'Victoria' : 'Derrota'}</div>
    <div class="rs-sub">${win ? 'El Nexo enemigo ha sido destruido' : 'Tu Nexo ha caído'} · ${res.mode === '2v2' || res.mode === 'classic' || res.mode === 'ranked' ? '2 contra 2' : '1 contra 1'}</div>
    <div class="rs-stats">
      <div><small>Oleada alcanzada</small><b>${res.wave ?? '—'}</b></div>
      <div><small>Legión</small><b>${emblem(res.legion, legAcc(res.legion))}${esc(legName(res.legion))}</b></div>
      <div><small>Bajas</small><b>${fmt(res.kills ?? 0)}</b></div>
      <div><small>Valor del ejército</small><b style="color:#ffd76a">${fmt(res.value ?? 0)}</b></div>
    </div>
    <div class="rs-rew"><div class="row"><div class="lvl">${rw.before ? rw.before.level : p.level}</div><div class="xpb"><div class="bar"><i></i></div><div class="t"><span>+${fmt(rw.xp || 0)} XP</span><span class="xt"></span></div></div></div>
      <div class="gains"><div class="gain">${UI.star.replace('class="ico"', 'class="ico" style="color:#46f0e0"')}<div><small>Experiencia</small>+${fmt(rw.xp || 0)}</div></div><div class="gain">${UI.essence.replace('class="ico"', 'class="ico" style="color:#4fb8ff"')}<div><small>Esencia Azul</small>+${fmt((rw.essence || 0) + (rw.levelBonus || 0))}</div></div>${showMMR ? `<div class="gain mmr ${rw.mmrDelta >= 0 ? 'pos' : 'neg'}">${crest(rankOf(p.mmr), 'ico')}<div><small>Puntos de Liga</small>${rw.mmrDelta >= 0 ? '+' : ''}${rw.mmrDelta}</div></div>` : ''}</div>
      ${lvUp ? `<div class="rs-lvup" style="display:none">¡Subes a nivel ${rw.after.level}! +${rw.levelBonus} de Esencia Azul</div>` : ''}</div>
    <button class="m-btn play">Continuar</button></div>`));
  click(win ? 'victory' : 'defeat');
  const bar = el.querySelector('.xpb .bar i'), xt = el.querySelector('.xt'), lvl = el.querySelector('.lvl');
  if (rw.before) {
    bar.style.transition = 'none'; bar.style.width = rw.before.pct * 100 + '%'; xt.textContent = `${fmt(rw.before.cur)} / ${fmt(rw.before.need)}`;
    setTimeout(() => {
      bar.style.transition = ''; bar.style.width = (lvUp ? 100 : rw.after.pct * 100) + '%'; xt.textContent = `${fmt(rw.after.cur)} / ${fmt(rw.after.need)}`;
      if (lvUp) setTimeout(() => { lvl.textContent = rw.after.level; bar.style.transition = 'none'; bar.style.width = '0'; void bar.offsetWidth; bar.style.transition = ''; bar.style.width = rw.after.pct * 100 + '%'; const u = el.querySelector('.rs-lvup'); if (u) u.style.display = ''; click('victory'); }, 1300);
    }, 1100);
  }
  return new Promise(resolve => { el.querySelector('.m-btn.play').onclick = () => { click(); resolve(rw); }; });
}
