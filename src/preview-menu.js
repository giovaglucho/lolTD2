// Vista previa del menú (solo desarrollo): /preview-menu.html?view=main|solo|multi|guides|profile|ranking|shop|guild|patch|settings|codex|codex-mm|loading|result
import * as MenuAPI from './menu/index.js';
import { mountMenu, showMenu, showLoading, showResult, openView, store } from './menu/index.js';
import { LEGIONS } from './content/index.js';
import { stageCfg } from './menu/stage.js';
import { FIGHTERS } from './data.js';

const q = new URLSearchParams(location.search);
if (q.get('fps')) stageCfg.maxFps = +q.get('fps');
// Si las legiones aún están vacías, se rellenan con campeones de ejemplo SOLO en la vista previa.
if (q.get('mock') !== '0' && LEGIONS.every(l => !l.champions || !l.champions.length) && FIGHTERS) {
  const DT = ['asedio', 'perforante', 'magico', 'puro'], AT = ['ligera', 'natural', 'fortificada', 'arcana', 'inmaterial'];
  const ROLE = { Bruiser: 'Luchador', Duelista: 'Asesino', Barato: 'Tirador' };
  FIGHTERS.forEach((f, i) => {
    const l = LEGIONS[i % LEGIONS.length]; const tier = Math.max(1, Math.min(6, Math.round((f.cost - 30) / 25)));
    l.champions.push({ ...f, tier, role: ROLE[f.role] || f.role, dmgType: f.melee ? (f.armor > 20 ? 'asedio' : 'perforante') : (f.role === 'Mago' || f.role === 'Apoyo' ? 'magico' : 'perforante'), armorType: f.armor > 25 ? 'fortificada' : f.melee ? 'natural' : f.role === 'Mago' ? 'arcana' : 'ligera',
      passive: { name: 'Pasiva de ejemplo', desc: 'Cada tercer ataque inflige un 50% de daño adicional.', type: 'nth', n: 3, mul: 1.5 },
      ability: { ...f.ability, desc: f.desc }, upgrades: [{ id: f.id + '_up', name: f.name + ' Prestigio', cost: Math.round(f.cost * .9), hp: 1.85, dmg: 1.85, aspd: 1.1, armor: 10, desc: 'Versión de prestigio: mucha más vida y daño.' }],
      quote: '"¡Por la Grieta!"', lore: f.desc + ' Un campeón legendario de Runaterra que ahora defiende el Nexo.', model: f.id });
    if (!l.desc) l.desc = 'Legión de ejemplo para la vista previa del menú.';
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const api = {
  startLocal: cfg => { console.log('startLocal', cfg); showLoading({ mode: cfg.lanes === 4 ? '2v2' : '1v1', players: [{ name: store.getProfile().name, legion: cfg.legion, team: 0, me: true }, ...(cfg.allyLegion ? [{ name: 'Aliado IA', legion: cfg.allyLegion, team: 0, bot: true, diff: cfg.diff }] : []), ...cfg.enemyLegions.map((l, i) => ({ name: 'IA ' + (i + 1), legion: l, team: 1, bot: true, diff: cfg.diff }))] }).then(() => showMenu()); },
  onlineAvailable: () => q.get('online') === '1',
  startOnline: m => console.log('startOnline', m),
  applySettings: s => console.log('applySettings', s),
};
window.__menu = { ...MenuAPI, showMenu, showLoading, showResult, openView, store };
mountMenu(api);
const v = q.get('view') || 'main';
if (q.get('seed')) { const p = store.getProfile(); p.name = 'Kayn de Zaun'; p.xp = 2350; p.essence = 1840; p.mmr = 1420; p.guild = { name: 'Guardianes del Alba', tag: 'ALBA', color: '#0ac8b9', emblem: 'targon' }; p.title = 'estratega'; p.owned.titles.push('estratega'); p.stats = { games: 14, wins: 9, losses: 5, kills: 4210, bestWave: 20, byLegion: { demacia: { games: 6, wins: 4, bestWave: 20 }, jonia: { games: 4, wins: 3, bestWave: 18 }, noxus: { games: 4, wins: 2, bestWave: 15 } } }; p.history = [...Array(8)].map((_, i) => ({ t: Date.now() - i * 86400000, win: i % 3 !== 1, wave: 12 + (i * 3) % 9, mode: i % 2 ? '2v2' : '1v1', legion: ['demacia', 'jonia', 'noxus'][i % 3], kills: 300 + i * 41, value: 2400 + i * 300, mmrDelta: i % 4 === 0 ? (i % 3 !== 1 ? 18 : -14) : 0 })); store.saveProfile(p); }
(async () => {
  if (v === 'loading') { showMenu(); await sleep(50); showLoading({ mode: '2v2', hold: q.get('hold') ? 600000 : 0, players: [{ name: store.getProfile().name, legion: 'demacia', team: 0, me: true }, { name: 'Aliado IA', legion: 'jonia', team: 0, bot: true, diff: 'normal' }, { name: 'IA Noxiana', legion: 'noxus', team: 1, bot: true, diff: 'dificil' }, { name: 'IA Piltover', legion: 'piltover', team: 1, bot: true, diff: 'dificil' }] }); if (q.get('hold')) { /* deja la carga visible */ } }
  else if (v === 'result') { showResult({ win: q.get('lose') ? false : true, wave: 20, mode: '1v1', legion: 'demacia', kills: 642, value: 5230, rewards: { xp: 420, essence: 130 }, mmrDelta: q.get('lose') ? -14 : 18 }); }
  else if (v === 'codex-mm') { showMenu('codex'); openView('codex', { tab: 'mm' }); }
  else if (v.startsWith('codex-')) { showMenu('codex'); openView('codex', { tab: v.slice(6) }); }
  else showMenu(v);
})();
window.__done = true;
