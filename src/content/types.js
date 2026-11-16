// Tipos de daño y armadura (sistema de Legion TD 2 adaptado a la Grieta).
export const DMG = {
  asedio:     { name: 'Asedio', icon: '⚒', color: '#d9a441', desc: 'Golpes contundentes: espadas pesadas, hachas, martillos, puños de piedra.' },
  perforante: { name: 'Perforante', icon: '➶', color: '#e2574c', desc: 'Flechas, balas, dagas y estocadas precisas.' },
  magico:     { name: 'Mágico', icon: '✦', color: '#4fa8ff', desc: 'Hechizos, energía arcana, celestial o del Vacío.' },
  puro:       { name: 'Puro', icon: '◆', color: '#c77bff', desc: 'Daño verdadero: ignora los tipos de armadura.' },
};
export const ARM = {
  ligera:      { name: 'Ligera', icon: '🜁', color: '#7fd35a', desc: 'Asesinos, tiradores y criaturas ágiles.' },
  natural:     { name: 'Natural', icon: '❦', color: '#b98b4a', desc: 'Bestias, monstruos de la jungla, seres vivos sin armadura.' },
  fortificada: { name: 'Fortificada', icon: '⛨', color: '#c8aa6e', desc: 'Placas de acero, piedra y estructuras.' },
  arcana:      { name: 'Arcana', icon: '✧', color: '#4fd4ff', desc: 'Magos y seres imbuidos de magia.' },
  inmaterial:  { name: 'Inmaterial', icon: '☁', color: '#c9b6ff', desc: 'Espíritus, sombras y seres etéreos.' },
};
// multiplicador de daño [tipoDaño][tipoArmadura] (valores de LTD2)
export const MATRIX = {
  asedio:     { ligera: .80, natural: .90, fortificada: 1.15, arcana: 1.15, inmaterial: 1 },
  perforante: { ligera: 1.20, natural: .85, fortificada: .80, arcana: 1.15, inmaterial: 1 },
  magico:     { ligera: 1, natural: 1.25, fortificada: 1.05, arcana: .75, inmaterial: 1 },
  puro:       { ligera: 1, natural: 1, fortificada: 1, arcana: 1, inmaterial: 1 },
};
export const dmgMul = (d, a) => (MATRIX[d] && MATRIX[d][a]) ?? 1;
