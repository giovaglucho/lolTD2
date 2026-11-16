// Utilidades de datos para el menú y el Códice. Tolera legiones vacías y campos ausentes.
import { LEGIONS, DMG, ARM, MATRIX } from '../content/index.js';
import { MASTERMIND, STRATEGIES } from '../content/mastermind.js';
import { SPELLS } from '../content/spells.js';
import * as D from '../data.js';
const CREEPS = D.CREEPS || {}, WAVES = D.WAVES || [], MERCS = D.MERCS || [], CFG = D.CFG || {}, DIFFS = D.DIFFS || {}, FIGHTERS = D.FIGHTERS || [], waveScale = D.waveScale || (w => Math.pow(1.11, w - 1));

export { LEGIONS, DMG, ARM, MATRIX, MASTERMIND, STRATEGIES, SPELLS, CREEPS, WAVES, MERCS, CFG, DIFFS };
export const hex = (c, a) => { if (typeof c === 'string') return c; const n = (c ?? 0x888888) >>> 0; if (a == null) return '#' + n.toString(16).padStart(6, '0'); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };
export const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export const fmt = n => (n == null || isNaN(n)) ? '—' : (Math.abs(n) >= 1000 ? Math.round(n).toLocaleString('es-ES') : (Math.round(n * 10) / 10).toString().replace('.', ','));
export const TIER_COST = { 1: 60, 2: 90, 3: 120, 4: 155, 5: 195, 6: 250 };

// Legiones: siempre leídas en vivo (los autores las rellenan en caliente)
export const legionList = () => LEGIONS.filter(Boolean);
export const legionById = id => id === 'invocador' ? MASTERMIND : legionList().find(l => l.id === id);
export function champsOf(lid) { const l = legionById(lid); return l && Array.isArray(l.champions) ? l.champions.filter(Boolean).map(c => ({ ...c, legion: lid })).sort((a, b) => (a.cost ?? 0) - (b.cost ?? 0)) : []; }
export const allChamps = () => legionList().flatMap(l => champsOf(l.id));
export function champById(id) {
  for (const l of legionList()) { const c = (l.champions || []).find(c => c && (c.id === id || c.model === id)); if (c) return { ...c, legion: l.id }; }
  const f = FIGHTERS && FIGHTERS.find(f => f.id === id); return f ? { ...f, legion: '' } : null;
}
export const tierOf = c => c.tier ?? (c.cost ? (Object.entries(TIER_COST).reduce((b, [t, v]) => Math.abs(v - c.cost) < Math.abs(TIER_COST[b] - c.cost) ? +t : b, 1)) : 1);

// Tipo de daño/armadura de criaturas (si data.js no los define, se infieren)
const VOID = new Set(['herald', 'voidling', 'hunter', 'baron', 'chogath', 'elder']);
const JUNGLE = new Set(['gromp', 'wolf', 'raptor', 'krug', 'blue', 'red', 'scuttle']);
export function creatureTypes(id, c) {
  const dmgType = c.dmgType || (c.boss ? 'puro' : !c.melee ? (VOID.has(id) || /drake|cloud|inferno|ocean|mountain/.test(id) ? 'magico' : 'perforante') : (c.armor >= 14 ? 'asedio' : 'perforante'));
  const armorType = c.armorType || (VOID.has(id) ? (c.boss ? 'arcana' : 'inmaterial') : JUNGLE.has(id) ? 'natural' : ['cloud', 'inferno', 'mountain', 'ocean'].includes(id) ? 'arcana' : (c.armor >= 20 ? 'fortificada' : 'ligera'));
  return { dmgType, armorType };
}
export const creatureFamily = id => VOID.has(id) ? 'void' : JUNGLE.has(id) ? 'jungle' : ['cloud', 'inferno', 'mountain', 'ocean'].includes(id) ? 'drake' : 'minion';

// Estadísticas de un campeón (opcionalmente mejorado con upgrades[i])
export function unitStats(c, up = -1) {
  const u = up >= 0 && c.upgrades ? c.upgrades[up] : null;
  const hp = (c.hp ?? 0) * (u?.hp ?? 1), dmg = (c.dmg ?? 0) * (u?.dmg ?? 1), aspd = (c.aspd ?? 1) * (u?.aspd ?? 1);
  const armor = (c.armor ?? 0) + (u?.armor ?? 0);
  return { hp: Math.round(hp), dmg: Math.round(dmg), aspd, dps: dmg * aspd, range: c.range ?? (c.melee ? 2 : 7), speed: c.speed ?? 3.2, armor, cost: c.cost ?? 0, value: (c.cost ?? 0) + (u ? (u.cost ?? c.cost ?? 0) : 0), ehp: hp * (100 + armor) / 100, melee: c.melee ?? (c.range ?? 2) < 3 };
}
// Criaturas de oleada: estadísticas escaladas a la oleada
export function waveUnits() {
  const out = [];
  WAVES.forEach((w, i) => (w.g || []).forEach(g => { const c = CREEPS[g.c]; if (!c) return; out.push({ id: g.c, key: 'c_' + g.c, wave: i + 1, n: g.n, waveName: w.name, boss: !!(w.boss && c.boss), c }); }));
  return out;
}
export function creatureStats(c, wave = 1) { const k = waveScale ? waveScale(wave) : 1; const hp = c.hp * k, dmg = c.dmg * k; return { hp: Math.round(hp), dmg: Math.round(dmg), aspd: c.aspd, dps: dmg * c.aspd, range: c.range, speed: c.speed, armor: c.armor, bounty: c.bounty, ehp: hp * (100 + c.armor) / 100 }; }

// Rangos
export const RANKS = [
  { id: 'hierro', name: 'Hierro', mmr: 0, c1: '#5a5450', c2: '#8d8279' },
  { id: 'bronce', name: 'Bronce', mmr: 900, c1: '#6b4126', c2: '#c0815a' },
  { id: 'plata', name: 'Plata', mmr: 1100, c1: '#6d7a86', c2: '#cfdbe4' },
  { id: 'oro', name: 'Oro', mmr: 1300, c1: '#8c6a1e', c2: '#f0cf6a' },
  { id: 'platino', name: 'Platino', mmr: 1500, c1: '#1f6f72', c2: '#6fe0d5' },
  { id: 'esmeralda', name: 'Esmeralda', mmr: 1700, c1: '#11603e', c2: '#45e08c' },
  { id: 'diamante', name: 'Diamante', mmr: 1900, c1: '#3a4fae', c2: '#a8c4ff' },
  { id: 'maestro', name: 'Maestro', mmr: 2150, c1: '#6a2a8e', c2: '#e09aff' },
  { id: 'granmaestro', name: 'Gran Maestro', mmr: 2400, c1: '#8e1f2a', c2: '#ff8a7a' },
  { id: 'retador', name: 'Retador', mmr: 2650, c1: '#2a6ea8', c2: '#ffe08a' },
];
export const rankOf = mmr => { let r = RANKS[0]; for (const x of RANKS) if (mmr >= x.mmr) r = x; const i = RANKS.indexOf(r), nx = RANKS[i + 1]; const div = nx && i < 7 ? 4 - Math.min(3, Math.floor((mmr - r.mmr) / ((nx.mmr - r.mmr) / 4))) : 0; return { ...r, idx: i, div, label: r.name + (div ? ' ' + ['', 'I', 'II', 'III', 'IV'][div] : '') }; };

export function winrate(w, g) { return g ? Math.round(w / g * 100) + '%' : '—'; }
export const ROLE_ICON = { Tanque: '⛨', Luchador: '⚔', Asesino: '🗡', Tirador: '➶', Mago: '✦', Apoyo: '✚' };
export const DIFF_LIST = [['facil', 'Fácil'], ['normal', 'Normal'], ['dificil', 'Difícil'], ['locura', 'Locura']];
