// GUÍAS · NOTAS DEL PARCHE · AJUSTES
import { ctx, h, click, toast, iconTile } from '../ui.js';
import { getSettings, saveSettings, DEFAULT_SETTINGS } from '../store.js';
import { DMG, ARM, MATRIX, CFG, MERCS, esc, fmt } from '../data.js';
import { UI, glyph } from '../icons.js';

export function matrixHTML() {
  const d = Object.keys(DMG), a = Object.keys(ARM);
  return `<table class="m-matrix"><tr><th class="row" style="color:var(--dim)">Daño \\ Armadura</th>${a.map(k => `<th style="--c:${ARM[k].color}"><span class="t">${ARM[k].icon}</span>${ARM[k].name}</th>`).join('')}</tr>
    ${d.map(k => `<tr><th class="row" style="--c:${DMG[k].color}"><span class="t" style="display:inline;margin-right:8px">${DMG[k].icon}</span>${DMG[k].name}</th>${a.map(x => { const v = MATRIX[k]?.[x] ?? 1; return `<td class="${v > 1.001 ? 'hi' : v < .999 ? 'lo' : 'mid'}">${Math.round(v * 100)}%</td>`; }).join('')}</tr>`).join('')}</table>`;
}

export const PAGES = [
  { t: 'Lo básico', ic: 'play', body: () => `
    <p class="m-p">En <b>Rift Legion TD</b> cada jugador defiende su carril de la Grieta. Durante la <b>fase de construcción</b> (${CFG.buildTime || 30} s) colocas campeones de tu legión en tu cuadrícula; después llega una <b>oleada</b> de monstruos que avanza hacia tu <b>Nexo</b>. Tus campeones luchan solos: tu trabajo es elegir bien qué construir.</p>
    <div class="m-cards3">
      <div class="m-icard">${iconTile(glyph('castle'), '#c8aa6e', 'ic')}<b>Construye</b><p>Coloca campeones en la cuadrícula. Cada uno tiene un coste en oro, un rol y tipos de daño y armadura.</p></div>
      <div class="m-icard">${iconTile(UI.wave.replace('class="ico"', 'class="gly"'), '#46f0e0', 'ic')}<b>Resiste</b><p>${CFG.totalWaves || 20} oleadas con jefes: el Heraldo, el Dragón Ancestral y, al final, el Barón Nashor.</p></div>
      <div class="m-icard">${iconTile(UI.heart.replace('class="ico"', 'class="gly"'), '#ff6a5a', 'ic')}<b>Protege el Nexo</b><p>Los enemigos que atraviesan tu defensa golpean el Nexo. Si cae a 0, tu equipo pierde.</p></div>
    </div>
    <div class="m-tip"><b>Consejo:</b>&nbsp;los campeones vuelven a su posición inicial tras cada oleada. La colocación importa: tanques delante, tiradores y magos detrás.</div>` },
  { t: 'Economía', ic: 'greed', body: () => `
    <p class="m-p">Hay dos recursos en partida. Gestionarlos bien es lo que separa a un Hierro de un Retador.</p>
    <div class="m-cards3">
      <div class="m-icard">${iconTile(glyph('greed'), '#f0c75e', 'ic')}<b>Oro</b><p>Empiezas con ${CFG.startGold || 500}. Al final de cada oleada recibes tus <b>ingresos</b> (base ${CFG.baseIncome || 110}). Sirve para campeones, mejoras y poros.</p></div>
      <div class="m-icard">${iconTile(glyph('clarity'), '#4fd4ff', 'ic')}<b>Esencia Hextech</b><p>La generan tus <b>poros</b> de forma continua. Se gasta en mercenarios y en mejoras del Nexo.</p></div>
      <div class="m-icard">${iconTile(glyph('piggy'), '#ffb0c8', 'ic')}<b>Poros</b><p>Cada poro cuesta ${CFG.pcost || 50} de oro (+${CFG.pcostStep || 10} por cada uno que tengas). Más poros = más esencia, pero menos defensa hoy.</p></div>
    </div>
    <h3>El valor recomendado</h3><p class="m-p">El HUD muestra el <b>valor</b> de tu ejército frente al recomendado para la oleada. Si vas por debajo, es probable que se te escapen enemigos; si vas muy por encima, quizá deberías invertir en poros.</p>` },
  { t: 'Mercenarios', ic: 'swords', body: () => `
    <p class="m-p">Con esencia puedes enviar <b>mercenarios</b> al carril rival. Aparecen junto a la siguiente oleada y además <b>aumentan tus ingresos</b> de forma permanente.</p>
    <table class="m-table" style="margin:12px 0"><tr><th>Mercenario</th><th class="num">Coste</th><th class="num">Ingresos</th><th>Descripción</th></tr>
      ${MERCS.map(m => `<tr><td><b style="color:#fff">${esc(m.name)}</b></td><td class="num" style="color:#6fd8ff">${m.cost}</td><td class="num" style="color:#7fe06a">+${m.inc}</td><td>${esc(m.desc)}</td></tr>`).join('')}</table>
    <div class="m-tip"><b>Consejo:</b>&nbsp;envía mercenarios cuando sepas que el rival es débil contra su tipo de daño, o justo antes de un jefe.</div>` },
  { t: 'Mejoras y venta', ic: 'champion', body: () => `
    <p class="m-p">Como en Legion TD 2, los campeones se <b>transforman</b> al mejorarse: Garen se convierte en Garen Dios-Rey, Jinx en Jinx Guardiana Estelar… La mejora cuesta oro y multiplica vida y daño, y a menudo potencia su habilidad.</p>
    <div class="m-cards3">
      <div class="m-icard">${iconTile(glyph('champion'), '#f2c94c', 'ic')}<b>Mejorar (U)</b><p>Selecciona un campeón y pulsa U. Solo durante la construcción.</p></div>
      <div class="m-icard">${iconTile(glyph('scrap'), '#c4cad4', 'ic')}<b>Vender (X)</b><p>Recuperas el 100% si lo vendes en la misma fase y el 50% del valor después.</p></div>
      <div class="m-icard">${iconTile(UI.shield.replace('class="ico"', 'class="gly"'), '#46f0e0', 'ic')}<b>Mejoras del Nexo</b><p>Vida, Ataque y Regeneración. Se pagan con esencia y las comparte todo el equipo.</p></div>
    </div>
    <h3>Hechizos de invocador</h3><p class="m-p">Al empezar la oleada 7 eliges 1 de 3 hechizos (Prender, Barrera, Destello…). Consulta todos en el <b>Códice</b>.</p>` },
  { t: 'Tipos de daño', ic: 'cleanse', body: () => `
    <p class="m-p">Cada unidad tiene un <b>tipo de daño</b> y un <b>tipo de armadura</b>. El multiplicador de la tabla se aplica a cada golpe, además de la armadura numérica (100 / (100 + armadura)).</p>
    ${matrixHTML()}
    <div class="m-tip"><b>Lectura rápida:</b>&nbsp;Perforante destroza Ligera y Arcana; Mágico funde Natural; Asedio rompe Fortificada y Arcana. El daño Puro siempre es 100%.</div>` },
  { t: 'Consejos', ic: 'flash', body: () => `
    <h3>Para tus primeras partidas</h3>
    <div class="m-tip"><b>1.</b>&nbsp;No gastes todo tu oro en la oleada 1: un poro temprano se paga solo antes de la oleada 6.</div>
    <div class="m-tip"><b>2.</b>&nbsp;Mira la próxima oleada (panel izquierdo del HUD) y su tipo de armadura antes de construir.</div>
    <div class="m-tip"><b>3.</b>&nbsp;Los jefes (oleadas 10, 17 y 20) tienen muchísima vida: guarda oro para mejorar a tus campeones clave.</div>
    <div class="m-tip"><b>4.</b>&nbsp;En 2v2 comunicaos: si tu aliado va fuerte en daño mágico, tú puedes cubrir el perforante.</div>
    <div class="m-tip"><b>5.</b>&nbsp;La legión Invocador (Mente maestra) es más difícil: tu tirada cambia y tu estrategia define la partida.</div>
    <div style="margin-top:22px"><button class="m-btn teal" data-go="codex">${UI.book} Abrir el Códice</button></div>` },
];

export function viewGuides(el, opts = {}) {
  let i = opts.page | 0;
  el.appendChild(h(`<div class="m-page"><div class="m-ptitle"><h1>Guías</h1><span class="sub">Aprende a defender la Grieta en 5 minutos.</span><button class="m-btn sm teal" data-go="codex" style="margin-left:auto">${UI.book} Códice</button></div>
    <div class="m-guide"><div class="m-panel m-gnav">${PAGES.map((p, k) => `<button data-p="${k}"><i>${k + 1}</i>${p.t}</button>`).join('')}</div><div class="m-panel m-scroll m-gpage"></div></div></div>`));
  const page = el.querySelector('.m-gpage');
  const render = () => {
    el.querySelectorAll('.m-gnav button').forEach((b, k) => b.classList.toggle('on', k === i));
    page.innerHTML = `<div class="m-kicker">Guía para principiantes · ${i + 1} de ${PAGES.length}</div><h2>${PAGES[i].t}</h2>${PAGES[i].body()}
      <div class="m-gfoot"><button class="m-btn sm" data-d="-1" ${i ? '' : 'disabled'}>Anterior</button><div class="m-dots">${PAGES.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div><button class="m-btn sm teal" data-d="1" ${i < PAGES.length - 1 ? '' : 'disabled'}>Siguiente</button></div>`;
    page.scrollTop = 0;
  };
  el.addEventListener('click', e => {
    const p = e.target.closest('[data-p]'), d = e.target.closest('[data-d]'), g = e.target.closest('[data-go]');
    if (p) { click(); i = +p.dataset.p; render(); } if (d && !d.disabled) { click(); i = Math.max(0, Math.min(PAGES.length - 1, i + +d.dataset.d)); render(); } if (g) { click(); ctx.go(g.dataset.go); }
  });
  render();
}

const PATCHES = [
  { v: '1.0.0', name: 'Coloso de la Grieta', date: 'Noviembre 2026', body: `
    <h3>Novedades</h3><ul>
      <li><span class="new">NUEVO</span><b>Seis legiones regionales</b>: Demacia, Noxus, Jonia, Freljord, Piltover y Targon, cada una con 10 campeones, habilidades, pasivas y mejoras de transformación.</li>
      <li><span class="new">NUEVO</span><b>Legión Invocador</b> (Mente maestra): tirada de campeones de todas las regiones y 8 estrategias económicas.</li>
      <li><span class="new">NUEVO</span><b>Hechizos de invocador</b> en la oleada 7: Prender, Curar, Barrera, Extenuación, Aplastar, Fantasmal, Limpiar, Destello, Teleportar y Claridad.</li>
      <li><span class="new">NUEVO</span><b>Códice</b> con visor 3D, estadísticas completas, mejoras, oleadas, mercenarios y la tabla de tipos.</li>
      <li><span class="new">NUEVO</span><b>Tipos de daño y armadura</b> al estilo Legion TD 2.</li>
      <li><span class="new">NUEVO</span>Menú principal renovado: perfil con niveles, tienda de cosméticos con Esencia Azul, gremios, clasificación y guías.</li></ul>
    <h3>Oleadas</h3><ul><li>20 oleadas con criaturas de la Grieta: súbditos, campamentos de la jungla, dragones elementales, el Heraldo, el Dragón Ancestral y el <b>Barón Nashor</b>.</li><li>Los jefes ahora tienen habilidades de área con aturdimiento.</li></ul>
    <h3>Equilibrio</h3><ul><li>Costes por nivel: T1 60 · T2 90 · T3 120 · T4 155 · T5 195 · T6 250 de oro.</li><li>Las mejoras del Nexo (Vida, Ataque, Regeneración) se comparten en 2v2.</li></ul>
    <h3>Conocidos</h3><ul><li>Los servidores en línea estarán disponibles próximamente. Puedes alojar el tuyo con <b>npm start</b>.</li></ul>` },
  { v: '0.9.0', name: 'Beta abierta', date: 'Octubre 2026', body: `
    <h3>Cambios</h3><ul><li>Modo 2 contra 2 con IA aliada.</li><li>Dificultades Fácil, Normal, Difícil y Locura.</li><li>Clasificación local y MMR para partidas en línea.</li><li>Mercenarios: Cangrejo Escurridizo, Larvas del Vacío, Raptores, Súbditos de Asedio, Heraldo, Cho'Gath y Dragón Ancestral.</li></ul>
    <h3>Correcciones</h3><ul><li>Los proyectiles ya no persiguen a objetivos muertos.</li><li>Mejoras de rendimiento en oleadas con muchas unidades.</li></ul>` },
  { v: '0.5.0', name: 'Prototipo', date: 'Septiembre 2026', body: `<h3>Primera versión jugable</h3><ul><li>12 campeones clásicos (Garen, Ashe, Annie, Lux, Malphite, Soraka, Darius, Jinx, Leona, Teemo, Yasuo, Ezreal).</li><li>Construcción en cuadrícula, poros y esencia.</li><li>Modelos 3D procedurales.</li></ul>` },
];
export function viewPatch(el) {
  let i = 0;
  el.appendChild(h(`<div class="m-page"><div class="m-ptitle"><h1>Notas del <em>parche</em></h1></div><div class="m-patch"><div class="m-panel m-gnav">${PATCHES.map((p, k) => `<button data-p="${k}"><i>${UI.news.replace('class="ico"', 'class="ico" style="width:14px;height:14px"')}</i><span>v${p.v}<br><small style="font:400 12px var(--ui);color:var(--dim2);text-transform:none">${p.name}</small></span></button>`).join('')}</div><article class="m-panel m-scroll"></article></div></div>`));
  const art = el.querySelector('article');
  const render = () => { el.querySelectorAll('.m-gnav button').forEach((b, k) => b.classList.toggle('on', k === i)); const p = PATCHES[i]; art.innerHTML = `<div class="hero"><div class="m-kicker">${p.date} · v${p.v}</div><h2>${p.name}</h2></div>${p.body}`; art.scrollTop = 0; };
  el.addEventListener('click', e => { const p = e.target.closest('[data-p]'); if (p) { click(); i = +p.dataset.p; render(); } });
  render();
}

const KEYS = [['Colocar / seleccionar campeón', ['Clic']], ['Campeones de la barra', ['1', '…', '0', '-', '=']], ['Mejorar campeón seleccionado', ['U']], ['Vender campeón seleccionado', ['X']], ['¡Listo! (terminar construcción)', ['Espacio']], ['Ver otro carril / el tuyo', ['Tab', 'C']], ['Mover cámara', ['W', 'A', 'S', 'D']], ['Zoom', ['Rueda']], ['Velocidad de juego', ['F']], ['Cancelar / deseleccionar', ['Esc']]];
export function viewSettings(el) {
  const s = getSettings();
  el.appendChild(h(`<div class="m-page"><div class="m-ptitle"><h1>Ajustes</h1></div><div class="m-set">
    <div style="display:flex;flex-direction:column;gap:18px;min-height:0" class="m-scroll">
      <div class="m-panel"><h3>${UI.gear} Gráficos</h3><div class="rows">
        <div class="m-srow"><span>Calidad gráfica</span><div class="m-seg" data-k="quality"><button data-v="high">Alta</button><button data-v="low">Baja</button></div><span></span></div>
        <div class="m-srow"><span>Números de daño</span><label class="m-check"><input type="checkbox" data-k="dmgNumbers"> Mostrar</label><span></span></div>
        <div class="m-srow"><span>Contador de FPS</span><label class="m-check"><input type="checkbox" data-k="showFps"> Mostrar</label><span></span></div></div></div>
      <div class="m-panel"><h3>${UI.bolt} Audio</h3><div class="rows">
        <div class="m-srow"><span>Volumen general</span><input class="m-range" type="range" min="0" max="1" step="0.05" data-k="volume"><output></output></div>
        <div class="m-srow"><span>Efectos de sonido</span><label class="m-check"><input type="checkbox" data-k="sfx"> Activados</label><span></span></div>
        <div class="m-srow"><span>Música</span><label class="m-check"><input type="checkbox" data-k="music"> Activada</label><span></span></div></div></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:18px;min-height:0"><div class="m-panel"><h3>${UI.globe} Juego y red</h3><div class="rows">
        <div class="m-srow"><span>Velocidad de cámara</span><input class="m-range" type="range" min="0.4" max="2" step="0.1" data-k="camSpeed"><output></output></div>
        <div class="m-srow"><span>Desplazar con el borde</span><label class="m-check"><input type="checkbox" data-k="edgePan"> Activado</label><span></span></div>
        <div class="m-field" style="margin:12px 0 4px"><label>URL de servidor propio</label><input class="m-in" data-k="serverUrl" placeholder="wss://mi-servidor.ejemplo:8787/ws"><small style="color:var(--dim2)">Déjalo vacío para usar los servidores oficiales (próximamente). Para alojar uno: <b style="color:var(--gold2)">npm start</b>.</small></div></div></div><div class="m-panel m-scroll" style="flex:1"><h3>${UI.grid} Controles</h3><div class="m-keys">${KEYS.map(([d, k]) => `<div>${d}</div><div style="text-align:right">${k.map(x => `<kbd>${x}</kbd>`).join('')}</div>`).join('')}</div></div>
      <div style="display:flex;gap:12px;justify-content:flex-end"><button class="m-btn" data-a="reset">Restablecer</button><button class="m-btn teal" data-a="save" style="min-width:180px">Guardar</button></div></div>
  </div></div>`));
  const cur = { ...s };
  const sync = () => {
    el.querySelectorAll('[data-k]').forEach(n => {
      const k = n.dataset.k, v = cur[k];
      if (n.classList.contains('m-seg')) n.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
      else if (n.type === 'checkbox') n.checked = !!v; else if (n.type === 'range') { n.value = v; n.nextElementSibling.textContent = k === 'volume' ? Math.round(v * 100) + '%' : '×' + (+v).toFixed(1); } else n.value = v ?? '';
    });
  };
  el.addEventListener('click', e => {
    const b = e.target.closest('.m-seg button'); if (b) { click(); cur[b.parentElement.dataset.k] = b.dataset.v; sync(); }
    const a = e.target.closest('[data-a]');
    if (a?.dataset.a === 'reset') { click(); Object.assign(cur, DEFAULT_SETTINGS); sync(); }
    if (a?.dataset.a === 'save') { click(); const v = saveSettings(cur); try { ctx.api.applySettings && ctx.api.applySettings(v); } catch (err) { console.error(err); } toast('Ajustes guardados.'); }
  });
  el.addEventListener('input', e => { const n = e.target; if (!n.dataset.k) return; cur[n.dataset.k] = n.type === 'checkbox' ? n.checked : n.type === 'range' ? +n.value : n.value; if (n.type === 'range') sync(); });
  el.addEventListener('keydown', e => e.stopPropagation());
  sync();
}
