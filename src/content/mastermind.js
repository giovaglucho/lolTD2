// Legión "Invocador" (equivalente a Mente Maestra de LTD2): campeones aleatorios de todas las regiones
// más una estrategia elegida al empezar la partida.
export const MASTERMIND = { id: 'invocador', name: 'Invocador', title: 'Mente Maestra de la Grieta', color: 0xc8aa6e, accent: 0x0ac8b9,
  desc: 'No sirves a ninguna región: recibes una tirada de 8 campeones aleatorios de todas las legiones y eliges una estrategia.',
  rollSize: 8 };
export const STRATEGIES = [
  { id: 'greed', name: 'Avaricia', icon: '🪙', desc: '+25 de ingresos.', fx: { income: 25 } },
  { id: 'piggy', name: 'Alijo', icon: '🐷', desc: 'Empiezas con una hucha de 40 de oro; cada oleada genera 12% de interés. Rómpela (botón) para cobrarla.', fx: { piggy: { start: 40, rate: .12 } } },
  { id: 'castle', name: 'Castillo', icon: '🏰', desc: '+15 de ingresos. Tras la oleada 10, +100 de ingresos.', fx: { income: 15, incomeAfter: { wave: 10, amt: 100 } } },
  { id: 'scrap', name: 'Chatarrero', icon: '⚙', desc: '+10 de ingresos. Vender devuelve el 90% (en vez del 50%).', fx: { income: 10, sellRate: .9 } },
  { id: 'chaos', name: 'Caos', icon: '🎲', desc: '+15 de ingresos. Nueva tirada de campeones cada oleada.', fx: { income: 15, rerollEachWave: true } },
  { id: 'cartel', name: 'Cártel', icon: '💰', desc: '+45 de ingresos, pero −100 tras la oleada 10.', fx: { income: 45, incomeAfter: { wave: 10, amt: -100 } } },
  { id: 'champion', name: 'Campeón', icon: '🏆', desc: '+10 de ingresos. Tu primer campeón mejorado gana +25% de vida, daño y velocidad de ataque.', fx: { income: 10, championBuff: 1.25 } },
  { id: 'reroll', name: 'Cambio de jugada', icon: '🔄', desc: '+10 de ingresos. Tiradas extra: 3 reroll gratis por partida.', fx: { income: 10, rerolls: 3 } },
];
export const STRAT_BY = Object.fromEntries(STRATEGIES.map(s => [s.id, s]));
