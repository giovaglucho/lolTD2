import { FIGHTERS, MERCS, CREEPS, WAVES, CFG, GRID, waveScale } from './data.js';
import { FBY } from './sim.js';
import { sfx, setMuted } from './sfx.js';

const $ = id => document.getElementById(id);
const ROLEC = { Tanque: '#4aa8ff', Bruiser: '#ff6a4a', Duelista: '#ff9a3a', Mago: '#b06aff', Tirador: '#ffd24a', Apoyo: '#6affb0', Barato: '#9aa8b8' };
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='];

export class UI {
  constructor(portraits) { this.pt = portraits; this.game = null; this.muted = false; }
  bind(game) {
    this.game = game;
    $('bView').onclick = () => game.setView(1 - game.cam.view);
    $('bSpeed').onclick = () => { game.speed = game.speed === 1 ? 2 : game.speed === 2 ? 3 : 1; this.refresh(); };
    $('bMute').onclick = () => { this.muted = !this.muted; setMuted(this.muted); $('bMute').textContent = this.muted ? 'Sonido: OFF' : 'Sonido'; };
    $('bReady').onclick = () => game.toggleReady();
    $('bPoro').onclick = () => game.buyWorker();
    $('eAgain').onclick = () => { $('end').classList.add('hidden'); game.start({ hard: game.hardness }); };
    this.buildShop(); this.buildMercs();
  }
  img(id) { return `style="background-image:url(${this.pt['c_' + id] || this.pt[id] || ''})"`; }
  buildShop() {
    const shop = $('shop'); shop.innerHTML = '';
    FIGHTERS.forEach((f, i) => {
      const d = document.createElement('div'); d.className = 'uc'; d.dataset.id = f.id;
      d.innerHTML = `<div class="hk">${KEYS[i]}</div><div class="role" style="background:${ROLEC[f.role]}"></div><div class="pt" style="background-image:url(${this.pt[f.id]})"></div><div class="nm">${f.name}</div><div class="cost">${f.cost}</div>`;
      d.onclick = () => this.game.select(f.id);
      d.onmouseenter = () => this.showTip(f); d.onmouseleave = () => $('tip').classList.add('hidden');
      shop.appendChild(d);
    });
  }
  buildMercs() {
    const box = $('mercs'); box.innerHTML = '';
    MERCS.forEach(m => {
      const d = document.createElement('div'); d.className = 'mc'; d.dataset.id = m.id;
      d.innerHTML = `<div class="pt" ${this.img(m.c)}></div><div><div class="nm">${m.name}</div><div class="sub">+${m.inc} ingreso · ×${m.n}</div></div><div class="cost">${m.cost}</div><div class="q"></div>`;
      d.title = m.desc; d.onclick = () => this.game.buyMerc(m.id); box.appendChild(d);
    });
  }
  showTip(f) {
    const t = $('tip'), a = f.ability, dps = (f.dmg * f.aspd).toFixed(0);
    t.innerHTML = `<h4>${f.name}</h4><div class="tt">${f.title} · <span style="color:${ROLEC[f.role]}">${f.role}</span> · ${f.melee ? 'Cuerpo a cuerpo' : 'A distancia'}</div>
    <div class="st"><div><span>Vida</span><b>${f.hp}</b></div><div><span>Daño</span><b>${f.dmg}</b></div><div><span>DPS</span><b>${dps}</b></div><div><span>Armadura</span><b>${f.armor}</b></div><div><span>Alcance</span><b>${f.range}</b></div><div><span>Coste</span><b style="color:#ffd25a">${f.cost}</b></div></div>
    <div class="ab"><b>${a.name}</b> (${a.cd}s) — ${f.desc}</div>`;
    t.classList.remove('hidden');
  }
  onStart(game) { $('title').classList.add('hidden'); $('hud').classList.remove('hidden'); $('end').classList.add('hidden'); $('log').innerHTML = ''; this.log('¡Bienvenido a la Grieta! Coloca campeones en tu plataforma.'); }
  log(msg) { const d = document.createElement('div'); d.textContent = msg; $('log').prepend(d); setTimeout(() => d.remove(), 7000); while ($('log').children.length > 5) $('log').lastChild.remove(); }
  banner(a, b, boss) { const el = $('banner'); el.querySelector('.b1').textContent = a; el.querySelector('.b2').textContent = b; el.classList.toggle('boss', !!boss); el.classList.add('show'); clearTimeout(this._bt); this._bt = setTimeout(() => el.classList.remove('show'), 2400); }
  gameOver(win, sim) {
    const p = sim.P(0), q = sim.P(1);
    $('end').classList.remove('hidden'); $('end').firstElementChild.className = 'ebox ' + (win ? 'win' : 'lose');
    $('eTitle').textContent = win ? 'VICTORIA' : 'DERROTA';
    $('eSub').textContent = win ? '¡La Grieta es tuya, Invocador!' : 'Tu Nexo ha sido destruido…';
    $('eStats').innerHTML = `Oleada alcanzada: <b>${Math.min(sim.wave + 1, 20)}</b> / 20<br>Monstruos eliminados: <b>${p.kills}</b><br>Vida del Nexo: <b>${Math.round(p.nexusHp)}</b> vs <b>${Math.round(q.nexusHp)}</b>`;
  }
  refresh() { this.dirty = true; this.tick(0, true); }
  tick(dt, force) {
    this._acc = (this._acc || 0) + dt; if (!force && this._acc < .1) return; this._acc = 0;
    const g = this.game, sim = g.sim; if (!sim) return; const p = sim.P(0), q = sim.P(1);
    $('gold').textContent = Math.floor(p.gold); $('income').textContent = '+' + p.income; $('workers').textContent = p.workers; $('army').textContent = p.grid.filter(Boolean).length;
    for (const [i, pl] of [[0, p], [1, q]]) { const r = Math.max(0, pl.nexusHp / pl.nexusMax); $('hp' + i).style.width = r * 100 + '%'; $('hp' + i + 't').textContent = Math.round(pl.nexusHp) + ' / ' + pl.nexusMax; }
    const wv = WAVES[Math.min(sim.wave, WAVES.length - 1)], build = sim.phase === 'build';
    $('waveName').textContent = `Oleada ${Math.min(sim.wave + 1, 20)}/20`; $('phaseLbl').textContent = build ? 'FASE DE CONSTRUCCIÓN' : sim.phase === 'combat' ? '¡COMBATE!' : 'FIN';
    $('timer').textContent = build ? Math.max(0, Math.ceil(sim.timer)) : sim.ents.filter(e => e.team === 'att' && !e.dead && e.lane === g.cam.view).length;
    const rb = $('bReady'); rb.classList.toggle('off', !build); rb.classList.toggle('on', p.ready && build); rb.firstElementChild.textContent = p.ready && build ? 'CANCELAR' : '¡LISTO!';
    $('bSpeed').firstChild.textContent = `Velocidad ×${g.speed} `; $('bView').firstChild.textContent = g.cam.view === 0 ? 'Ver línea rival ' : 'Volver a mi línea ';
    document.querySelectorAll('.uc').forEach(el => { const f = FBY[el.dataset.id]; el.classList.toggle('sel', g.sel === f.id); el.classList.toggle('dis', p.gold < f.cost || !build); });
    document.querySelectorAll('.mc').forEach(el => { const m = MERCS.find(x => x.id === el.dataset.id); el.classList.toggle('dis', p.gold < m.cost || !build); const n = p.queue.filter(x => x.id === m.id).length; const qq = el.querySelector('.q'); qq.textContent = n ? '×' + n : ''; qq.style.display = n ? 'block' : 'none'; });
    const pc = CFG.pcost; $('bPoro').innerHTML = `Contratar Poro — ${pc}◆<small>+${CFG.pinc} ingresos · ${p.workers}/${CFG.maxP}</small>`; $('bPoro').classList.toggle('dis', p.gold < pc || p.workers >= CFG.maxP);
    // próxima oleada
    const nxt = WAVES[Math.min(sim.wave, WAVES.length - 1)], key = sim.wave + sim.phase;
    if (this._nk !== key) { this._nk = key; const sc = waveScale(sim.wave + 1); $('next').innerHTML = `<h4>${build ? 'Próxima oleada' : 'En curso'}</h4><div class="wn ${nxt.boss ? 'boss' : ''}">${nxt.name}</div><div class="wv">${nxt.g.map(x => `<div class="ci" title="${CREEPS[x.c].name}" ${this.img(x.c)}><i>×${x.n}</i></div>`).join('')}</div>`; }
    // info de unidad seleccionada
    const e = g.selEnt, info = $('info');
    if (e && !e.dead || e) { const d = e.def; const k = `${e.id}`; if (this._ik !== k) { this._ik = k; info.innerHTML = `<h4>Seleccionado</h4><div class="hd"><div class="pt" style="background-image:url(${this.pt[d.id]})"></div><div><div class="nm">${d.name}</div><div class="tt">${d.title}</div></div></div>
      <div class="st"><div><span>Vida</span><b>${d.hp}</b></div><div><span>Daño</span><b>${d.dmg}</b></div><div><span>Vel. ataque</span><b>${d.aspd}</b></div><div><span>Armadura</span><b>${d.armor}</b></div><div><span>Alcance</span><b>${d.range}</b></div><div><span>Valor</span><b>${d.cost}</b></div></div>
      <div class="ab"><b>${d.ability.name}</b> — ${d.desc}</div><button id="bSell">Vender (+${d.cost}) <kbd>X</kbd></button>`; info.querySelector('#bSell').onclick = () => g.sellEnt(e); }
      info.classList.toggle('hidden', false); } else { info.classList.add('hidden'); this._ik = null; }
    $('bSell') && ($('bSell').style.display = build ? '' : 'none');
  }
}
