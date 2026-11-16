// Hechizos de invocador (equivalente a los "Hechizos de legión" de LTD2).
// Se elige 1 de 3 al empezar la oleada 7 y se aplica a un campeón (target:'unit') o a toda la legión (target:'team').
export const SPELL_WAVE = 6; // índice de oleada (0-based) en el que se ofrecen
export const SPELLS = [
  { id: 'ignite', name: 'Prender', icon: '🔥', color: 0xff6a2a, target: 'unit', desc: 'Los ataques del campeón queman: 3% de su vida máx. del objetivo por segundo durante 3 s.', fx: { passive: { type: 'onhit_dot', pctMax: .03, t: 3 } } },
  { id: 'heal', name: 'Curar', icon: '✚', color: 0x7dffb0, target: 'unit', desc: 'Una vez por oleada, al bajar del 35% de vida, el campeón y sus aliados cercanos se curan un 40%.', fx: { passive: { type: 'emergencyHeal', below: .35, pct: .4, r: 5 } } },
  { id: 'barrier', name: 'Barrera', icon: '⛉', color: 0xffe08a, target: 'unit', desc: 'Al empezar cada oleada, el campeón recibe un escudo igual al 60% de su vida máxima.', fx: { passive: { type: 'shieldStart', pct: .6 } } },
  { id: 'exhaust', name: 'Extenuación', icon: '☁', color: 0xc9a0ff, target: 'unit', desc: 'Los enemigos a 4 m del campeón infligen un 30% menos de daño y se mueven más lento.', fx: { passive: { type: 'exhaustAura', r: 4, dmg: .3, slow: .25 } } },
  { id: 'smite', name: 'Aplastar', icon: '⚡', color: 0xffd24a, target: 'unit', desc: 'El campeón inflige +60% de daño a jefes y monstruos grandes, y cada jefe que mata da 40 de oro.', fx: { passive: { type: 'bossbane', mul: 1.6, gold: 40 } } },
  { id: 'ghost', name: 'Fantasmal', icon: '👻', color: 0x9fe4ff, target: 'unit', desc: 'El campeón gana +35% de velocidad de ataque y de movimiento.', fx: { stats: { aspd: 1.35, speed: 1.35 } } },
  { id: 'cleanse', name: 'Limpiar', icon: '✧', color: 0xffffff, target: 'unit', desc: 'El campeón es inmune a aturdimientos y ralentizaciones y gana +25 de armadura.', fx: { stats: { armor: 25 }, immune: true } },
  { id: 'flash', name: 'Destello', icon: '✴', color: 0xfff3b0, target: 'unit', desc: 'El campeón gana +40% de daño y su habilidad se recarga un 30% más rápido.', fx: { stats: { dmg: 1.4, cdr: .7 } } },
  { id: 'teleport', name: 'Teleportar', icon: '⌖', color: 0xb05aff, target: 'team', desc: 'Una vez por partida: duplica tus ingresos de esta oleada.', fx: { team: { incomeOnce: 1 } } },
  { id: 'clarity', name: 'Claridad', icon: '✺', color: 0x4fd4ff, target: 'team', desc: 'Tus poros generan un 50% más de esencia.', fx: { team: { mythMul: 1.5 } } },
];
export const SPELL_BY = Object.fromEntries(SPELLS.map(s => [s.id, s]));
