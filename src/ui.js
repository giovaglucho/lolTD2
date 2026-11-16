import { MERCS, CREEPS, WAVES, CFG, GRID, DIFFS, waveScale } from './data.js';
import { FBY } from './sim.js';
import { DMG, ARM, LEGION_BY } from './content/index.js';
import { SPELL_BY } from './content/spells.js';
import { STRAT_BY } from './content/mastermind.js';
import { setMuted } from './sfx.js';

const $ = id => document.getElementById(id);
const ROLEC = { Luchador: '#ff8a4a', Asesino: '#ff4a8a', Tanque: '#4aa8ff', Bruiser: '#ff6a4a', Duelista: '#ff9a3a', Mago: '#b06aff', Tirador: '#ffd24a', Apoyo: '#6affb0', Barato: '#9aa8b8' };
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='];
const NEX = [{ k: 'hp', ic: '❤', nm: 'Vida del Nexo', sub: '+500 vida máx.' }, { k: 'atk', ic: '⚡', nm: 'Ataque del Nexo', sub: '+35% daño del Nexo' }, { k: 'regen', ic: '✚', nm: 'Regeneración', sub: '+6 vida/s en construcción' }];

export class UI {
  constructor(portraits) { this.pt = portraits; this.P = k => (typeof portraits === 'function' ? portraits(k) : portraits[k]) || ''; this.game = null; this.muted = false; this.onQuit = null; }
  bind(game) {
    this.game = game;
    $('bView').onclick = () => game.setView((game.cam.view + 1) % game.sim.n);
    $('bSpeed').onclick = () => { if (!game.local) return; game.speed = game.speed === 1 ? 2 : game.speed === 2 ? 3 : 1; this.refresh(); };
    $('bMute').onclick = () => { this.muted = !this.muted; setMuted(this.muted); $('bMute').textContent = this.muted ? 'Sonido: OFF' : 'Sonido'; };
    $('bReady').onclick = () => game.toggleReady();
    $('bPoro').onclick = () => game.buyWorker();
    $('bQuit').onclick = () => this.onQuit && this.onQuit(false);
    $('eAgain').onclick = () => this.onQuit && this.onQuit(true);
    document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => { document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b)); $('tabMercs').classList.toggle('hidden', b.dataset.tab !== 'mercs'); $('tabNexus').classList.toggle('hidden', b.dataset.tab !== 'nexus'); });
    this.buildMercs(); this.buildNexus();
  }
  img(id) { return `style="background-image:url(${this.P('c_' + id) || this.P(id)})"`; }
  rebuildShop() { this._rollKey = null; this.buildShop(); }
  buildShop() {
    const g = this.game, p = g.sim && g.sim.P(g.me); if (!p) return; const key = p.roll.join(); if (this._rollKey === key) return; this._rollKey = key;
    const shop = $('shop'); shop.innerHTML = '';
    p.roll.forEach((id, i) => {
      const f = FBY[id]; if (!f) return; const L = LEGION_BY[f.legion];
      const d = document.createElement('div'); d.className = 'uc t' + (f.tier || 1); d.dataset.id = f.id;
      d.innerHTML = `<div class="hk">${KEYS[i] || ''}</div><div class="tier">T${f.tier || 1}</div><div class="pt" style="background-image:url(${this.P(f.id)})${L ? `;box-shadow:inset 0 -18px 18px -10px #${L.color.toString(16).padStart(6, '0')}` : ''}"></div><div class="nm">${f.name}</div><div class="types"><span style="color:${DMG[f.dmgType].color}" title="${DMG[f.dmgType].name}">${DMG[f.dmgType].icon}</span><span style="color:${ARM[f.armorType].color}" title="${ARM[f.armorType].name}">${ARM[f.armorType].icon}</span></div><div class="cost">${f.cost}</div>`;
      d.onclick = () => g.select(f.id);
      d.onmouseenter = () => this.showTip(f); d.onmouseleave = () => $('tip').classList.add('hidden');
      shop.appendChild(d);
    });
    const ex = document.createElement('div'); ex.className = 'shopx'; ex.id = 'shopx'; shop.appendChild(ex);
  }
  buildMercs() {
    const box = $('mercs'); box.innerHTML = '';
    MERCS.forEach(m => {
      const d = document.createElement('div'); d.className = 'mc'; d.dataset.id = m.id;
      d.innerHTML = `<div class="pt" ${this.img(m.c)}></div><div><div class="nm">${m.name}</div><div class="sub">+${m.inc} ingreso · ×${m.n}</div></div><div class="cost">${m.cost}</div><div class="q"></div>`;
      d.title = m.desc; d.onclick = () => this.game.buyMerc(m.id); box.appendChild(d);
    });
  }
  buildNexus() {
    const box = $('nexusUps'); box.innerHTML = '';
    NEX.forEach(n => { const d = document.createElement('div'); d.className = 'nu'; d.dataset.k = n.k; d.innerHTML = `<div class="ic">${n.ic}</div><div><div class="nm">${n.nm} <span class="lv"></span></div><div class="sub">${n.sub}</div></div><div class="cost"></div>`; d.onclick = () => this.game.upgradeNexus(n.k); box.appendChild(d); });
  }
  abilityHtml(a) { if (!a) return ''; return `<b>${a.name}</b>${a.cd ? ` <small>(${a.cd}s)</small>` : ''} — ${a.desc || ''}`; }
  showTip(f) {
    const t = $('tip'), dps = (f.dmg * f.aspd).toFixed(0), L = LEGION_BY[f.legion];
    t.innerHTML = `<h4>${f.name} <small class="tierb">T${f.tier}</small></h4><div class="tt">${f.title || ''} · <span style="color:${ROLEC[f.role] || '#fff'}">${f.role}</span> · ${f.melee ? 'Cuerpo a cuerpo' : 'A distancia'}${L ? ' · ' + L.name : ''}</div>
    <div class="st"><div><span>Vida</span><b>${f.hp}</b></div><div><span>Daño</span><b>${f.dmg}</b></div><div><span>DPS</span><b>${dps}</b></div><div><span>Alcance</span><b>${f.range}</b></div>
    <div><span>Ataque</span><b style="color:${DMG[f.dmgType].color}">${DMG[f.dmgType].icon} ${DMG[f.dmgType].name}</b></div><div><span>Defensa</span><b style="color:${ARM[f.armorType].color}">${ARM[f.armorType].icon} ${ARM[f.armorType].name}</b></div></div>
    ${f.passive ? `<div class="ab"><i>Pasiva</i> ${this.abilityHtml(f.passive)}</div>` : ''}<div class="ab">${this.abilityHtml(f.ability)}</div>
    <div class="ab up">${f.upgrades.map(u => `<b style="color:#ffd25a">➜ ${u.name}</b> (${u.cost}◆) ${u.desc || ''}`).join('<br>')}</div>${f.quote ? `<div class="quote">${f.quote}</div>` : ''}`;
    t.classList.remove('hidden');
  }
  onStart(game) {
    $('title').classList.add('hidden'); $('hud').classList.remove('hidden'); $('end').classList.add('hidden'); $('log').innerHTML = ''; this._nk = null; this._ik = null; this._pk = null;
    const sim = game.sim; $('bSpeed').classList.toggle('hidden', !game.local); this._rollKey = null; this.buildShop();
    this.log(game.local ? '¡Bienvenido a la Grieta! Coloca campeones en tu plataforma.' : `Partida ${game.netInfo.ranked ? 'RANKED' : 'Clásica'} 2v2 — ¡suerte, invocador!`);
  }
  log(msg) { const d = document.createElement('div'); d.textContent = msg; $('log').prepend(d); setTimeout(() => d.remove(), 7000); while ($('log').children.length > 5) $('log').lastChild.remove(); }
  banner(a, b, boss) { const el = $('banner'); el.querySelector('.b1').textContent = a; el.querySelector('.b2').textContent = b; el.classList.toggle('boss', !!boss); el.classList.add('show'); clearTimeout(this._bt); this._bt = setTimeout(() => el.classList.remove('show'), 2400); }
  gameOver(win, sim, extra = {}) {
    const p = sim.P(this.game.me), mt = p.team;
    $('end').classList.remove('hidden'); $('end').firstElementChild.className = 'ebox ' + (win ? 'win' : 'lose');
    $('eTitle').textContent = win ? 'VICTORIA' : 'DERROTA';
    $('eSub').textContent = win ? '¡La Grieta es tuya, Invocador!' : (sim.over && sim.over.why === 'surrender' ? 'El equipo se ha rendido.' : 'Tu Nexo ha sido destruido…');
    const T = sim.teams;
    $('eStats').innerHTML = `Oleada alcanzada: <b>${Math.min(sim.wave + 1, 20)}</b> / 20<br>Monstruos eliminados: <b>${p.kills}</b><br>Nexo azul: <b>${Math.round(T[0].hp)}</b> · Nexo rojo: <b>${Math.round(T[1].hp)}</b>` + (extra.html || '');
  }
  setEndExtra(html) { $('eStats').insertAdjacentHTML('beforeend', html); }
  spellModal(p, build) {
    let m = $('spellModal'); const g = this.game;
    if (!p.spellOffer || !build) { if (m) m.remove(); return; }
    const k = p.spellOffer.join() + g.spellPick; if (m && m.dataset.k === k) return;
    if (!m) { m = document.createElement('div'); m.id = 'spellModal'; $('hud').appendChild(m); } m.dataset.k = k;
    m.innerHTML = `<h3>Hechizo de invocador</h3><p>${g.spellPick ? 'Haz clic en el campeón que recibirá <b>' + SPELL_BY[g.spellPick].name + '</b> (Esc para cancelar).' : 'Elige uno. Los de unidad se aplican a un campeón de tu plataforma.'}</p><div class="sp">${p.spellOffer.map(id => { const s = SPELL_BY[id]; return `<div class="spc ${g.spellPick === id ? 'on' : ''}" data-id="${id}"><div class="ic" style="color:#${s.color.toString(16).padStart(6, '0')}">${s.icon}</div><b>${s.name}</b><small>${s.target === 'unit' ? 'Campeón' : 'Legión'}</small><p>${s.desc}</p></div>`; }).join('')}</div>`;
    m.querySelectorAll('.spc').forEach(el => el.onclick = () => { const s = SPELL_BY[el.dataset.id]; if (s.target === 'team') g.chooseSpell(s.id, null); else { g.spellPick = s.id; if (g.selEnt && g.selEnt.lane === g.me) g.chooseSpell(s.id, g.selEnt); this.refresh(); } });
  }
  refresh() { this.tick(0, true); }
  tick(dt, force) {
    this._acc = (this._acc || 0) + dt; if (!force && this._acc < .1) return; this._acc = 0;
    const g = this.game, sim = g.sim; if (!sim || !sim.players.length) return; const me = g.me, p = sim.P(me);
    $('gold').textContent = Math.floor(p.gold); $('myth').textContent = Math.floor(p.myth); $('mythRate').textContent = `esencia (+${(p.workers * CFG.mythRate).toFixed(0)}/s)`; $('income').textContent = '+' + p.income;
    const val = sim.value(me), rec = sim.recValue(); $('value').textContent = val; $('rec').textContent = `/ ${rec} rec.`; const vp = $('value').parentElement; vp.classList.toggle('low', val < rec * .9); vp.classList.toggle('ok', val >= rec);
    const mt = p.team;
    for (const t of [0, 1]) { const T = sim.teams[t]; $('hp' + t).style.width = Math.max(0, T.hp / T.max) * 100 + '%'; $('hp' + t + 't').textContent = Math.round(T.hp) + ' / ' + T.max; $('nup' + t).textContent = T.upg ? `❤${T.upg.hp} ⚡${T.upg.atk} ✚${T.upg.regen}` : ''; }
    $('t0name').textContent = mt === 0 ? 'TU NEXO (AZUL)' : 'NEXO AZUL'; $('t1name').textContent = mt === 1 ? 'TU NEXO (ROJO)' : 'NEXO ROJO';
    const build = sim.phase === 'build';
    $('waveName').textContent = `Oleada ${Math.min(sim.wave + 1, 20)}/20`; $('phaseLbl').textContent = build ? 'FASE DE CONSTRUCCIÓN' : sim.phase === 'combat' ? '¡COMBATE!' : 'FIN';
    $('timer').textContent = build ? Math.max(0, Math.ceil(sim.timer)) : sim.ents.filter(e => e.team === 'att' && !e.dead && e.lane === g.cam.view).length;
    const rb = $('bReady'); rb.classList.toggle('off', !build); rb.classList.toggle('on', p.ready && build); rb.firstElementChild.textContent = p.ready && build ? 'CANCELAR' : '¡LISTO!';
    $('bSpeed').firstChild.textContent = `Velocidad ×${g.speed} `; $('bView').firstChild.textContent = g.cam.view === me ? 'Ver otra línea ' : `Viendo: ${sim.P(g.cam.view).name} `;
    // jugadores
    const pk = sim.players.map(q => q.name + q.ready + q.workers + sim.value(q.side) + q.bot).join() + g.cam.view;
    if (this._pk !== pk) { this._pk = pk; $('players').innerHTML = sim.players.map(q => `<div class="pc t${q.team} ${q.side === me ? 'me' : ''} ${q.side === g.cam.view ? 'view' : ''}"><b>${q.side === me ? '★ ' : ''}${q.name}${q.bot && !g.local ? ' 🤖' : ''}</b>⚔ ${sim.value(q.side)} · ☻ ${q.workers} · ${build ? (q.ready ? '<span class="rd">LISTO</span>' : '<span class="nr">construyendo</span>') : ''}</div>`).join(''); }
    this.buildShop(); document.querySelectorAll('.uc').forEach(el => { const f = FBY[el.dataset.id]; if (!f) return; el.classList.toggle('sel', g.sel === f.id); el.classList.toggle('dis', p.gold < f.cost || !build); });
    const sx = $('shopx'); if (sx) { const L = p.legion === 'invocador' ? { name: 'Invocador' + (p.strategy ? ' · ' + STRAT_BY[p.strategy].name : '') } : LEGION_BY[p.legion]; const k = [p.legion, p.rerolls, Math.round(p.piggy), build].join(); if (sx.dataset.k !== k) { sx.dataset.k = k; sx.innerHTML = `<div class="lgn">${L ? L.name : ''}</div>` + (p.legion === 'invocador' && p.rerolls > 0 ? `<button id="bReroll">🔄 Nueva tirada (${p.rerolls})</button>` : '') + (p.piggy ? `<button id="bPiggy">🐷 Romper hucha (${Math.round(p.piggy)})</button>` : ''); const br = $('bReroll'); if (br) br.onclick = () => g.reroll(); const bp = $('bPiggy'); if (bp) bp.onclick = () => g.breakPiggy(); } }
    this.spellModal(p, build);
    $('mercTarget').textContent = `Destino: línea de ${sim.P(sim.target(me)).name}`;
    document.querySelectorAll('.mc').forEach(el => { const m = MERCS.find(x => x.id === el.dataset.id); el.classList.toggle('dis', p.myth < m.cost || !build); const n = p.queue.filter(x => x && x.id === m.id).length; const qq = el.querySelector('.q'); qq.textContent = n ? '×' + n : ''; qq.style.display = n ? 'block' : 'none'; });
    document.querySelectorAll('.nu').forEach(el => { const k = el.dataset.k, T = sim.T(me), lv = T.upg ? T.upg[k] : 0, c = sim.nexusCost(me, k); el.querySelector('.lv').textContent = `nv.${lv}/5`; el.querySelector('.cost').textContent = lv >= 5 ? 'MÁX' : c; el.classList.toggle('dis', lv >= 5 || p.myth < c); });
    const wc = sim.workerCost(me); $('bPoro').innerHTML = `Contratar Poro — ${wc}◆<small>+${CFG.mythRate} esencia/s · ${p.workers}/${CFG.maxP}</small>`; $('bPoro').classList.toggle('dis', p.gold < wc || p.workers >= CFG.maxP);
    // próxima oleada
    const nxt = WAVES[Math.min(sim.wave, WAVES.length - 1)], key = sim.wave + sim.phase;
    if (this._nk !== key) { this._nk = key; $('next').innerHTML = `<h4>${build ? 'Próxima oleada' : 'En curso'}</h4><div class="wn ${nxt.boss ? 'boss' : ''}">${nxt.name}</div><div class="wv">${nxt.g.map(x => `<div class="ci" title="${CREEPS[x.c].name}" ${this.img(x.c)}><i>×${x.n}</i></div>`).join('')}</div>`; }
    // unidad seleccionada
    const e = g.selEnt, info = $('info');
    if (e && sim.ents.includes(e)) {
      const d = e.def, mine = e.lane === me, k = `${e.id}|${e.up}|${build}|${mine}|${Math.floor(p.gold / 10)}`;
      if (this._ik !== k) { this._ik = k; const up = e.up, sv = sim.sellValue ? sim.sellValue(e) : d.cost;
        info.innerHTML = `<h4>${mine ? 'Tu unidad' : 'Unidad de ' + sim.P(e.lane).name}</h4><div class="hd"><div class="pt" style="background-image:url(${this.P(d.id)})"></div><div><div class="nm">${up ? '★ ' + (e.upDef ? e.upDef.name : d.name) : d.name}</div><div class="tt">${d.title}</div></div></div>
        <div class="st"><div><span>Vida</span><b>${Math.round(e.maxHp)}</b></div><div><span>Daño</span><b>${Math.round(e.dmg ?? d.dmg)}</b></div><div><span>Vel. ataque</span><b>${(e.aspd ?? d.aspd).toFixed(2)}</b></div><div><span>Defensa</span><b style="color:${ARM[d.armorType].color}">${ARM[d.armorType].icon} ${e.armor ?? d.armor}</b></div><div><span>Alcance</span><b>${d.range}</b></div><div><span>Valor</span><b>${e.value ?? d.cost}</b></div></div>
        ${e.passives && e.passives.length ? e.passives.map(ps => `<div class="ab"><i>Pasiva</i> ${this.abilityHtml(ps)}</div>`).join('') : ''}<div class="ab">${this.abilityHtml(e.ab || d.ability)}</div>${e.spell ? `<div class="ab"><b style="color:#9fe4ff">${SPELL_BY[e.spell].icon} ${SPELL_BY[e.spell].name}</b></div>` : ''}` + (mine && build ? `<div class="btns">${up ? '' : d.upgrades.map((u, i) => `<button class="up" data-i="${i}" ${p.gold < u.cost ? 'disabled' : ''} title="${(u.desc || '').replace(/"/g, '&quot;')}">➜ ${u.name} ${u.cost}◆ <kbd>${i ? 'I' : 'U'}</kbd></button>`).join('')}<button id="bSell">Vender +${sv} <kbd>X</kbd></button></div>` : '');
        info.querySelectorAll('button.up').forEach(b => b.onclick = () => g.upgradeEnt(e, +b.dataset.i)); const bs = info.querySelector('#bSell'); if (bs) bs.onclick = () => g.sellEnt(e); }
      info.classList.remove('hidden');
    } else { info.classList.add('hidden'); this._ik = null; if (e) g.selEnt = null; }
  }
}
