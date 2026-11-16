// Vista principal (como la portada de LTD2).
import { ctx, h, click } from '../ui.js';
import { getProfile } from '../store.js';
import { UI } from '../icons.js';

export function viewMain(el) {
  const p = getProfile(), m = p.missions || {}, goal = 3, prog = Math.min(goal, (m.wins | 0) % goal);
  el.appendChild(h(`<div>
    <div class="m-logo"><div class="l1"><small>Defensores de la Grieta</small>RIFT LEGION</div><div class="td"><b>TD</b></div></div>
    <div class="m-ver">Versión <b>1.0.0</b> · Parche «Coloso de la Grieta»</div>
    <nav class="m-nav">
      <div class="row"><button class="it big" data-go="multi" style="animation-delay:.02s">Multijugador</button>
        <div class="m-mission" title="Misión diaria"><div class="mi">${UI.swords}</div><div style="flex:1"><div class="mt">Nueva misión</div><div class="md">Gana ${goal} partidas (cualquier modo)</div><div class="mb"><i style="width:${prog / goal * 100}%"></i></div></div><div class="mr">${prog}/${goal}<br>+150 ✦</div></div></div>
      <div class="row"><button class="it big" data-go="solo" style="animation-delay:.07s">Solo y cooperativo</button><span class="m-newtag" data-go="solo" data-opt="challenge" style="cursor:pointer">${UI.bolt}¡Nuevo desafío!</span></div>
      <button class="it" data-go="guides" style="animation-delay:.12s">Guías</button>
      <button class="it" data-go="codex" style="animation-delay:.15s">Códice</button>
      <button class="it" data-go="profile" style="animation-delay:.18s">Perfil</button>
      <button class="it" data-go="ranking" style="animation-delay:.21s">Clasificación</button>
      <button class="it" data-go="shop" style="animation-delay:.24s">Tienda</button>
      <button class="it" data-go="guild" style="animation-delay:.27s">Gremio</button>
      <button class="it" data-go="patch" style="animation-delay:.30s">Notas del parche</button>
    </nav>
    <div class="m-tourney" data-go="multi">
      <div class="ti">${UI.trophy}</div>
      <div class="tt"><div class="tk">Torneo · Temporada 1</div><h4>Copa de la Grieta</h4><p>2v2 · Sábado 20:00 CET · Premio: <b>5.000 Esencia Azul</b> y el borde <b>Retador</b>. Inscripciones abiertas.</p></div>
    </div>
  </div>`));
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-go]'); if (!b) return; click();
    ctx.go(b.dataset.go, b.dataset.opt ? { preset: b.dataset.opt } : {});
  });
}
