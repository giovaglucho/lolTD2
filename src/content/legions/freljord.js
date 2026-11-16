import { base } from '../balance.js';
// Legión Freljord. Ver src/content/SCHEMA.md.
// st(): parte del presupuesto base(tier, rol, aspd) y aplica ajustes (hp/dmg = multiplicadores, resto = valor absoluto).
const st = (tier, role, aspd, mod = {}) => { const b = base(tier, role, aspd); for (const k in mod) b[k] = (k === 'hp' || k === 'dmg') ? Math.round(b[k] * mod[k]) : mod[k]; return b; };

export default {
  id: 'freljord', name: 'Freljord', title: 'Las Tierras Heladas', color: 0x7fc8f0, accent: 0xe8f4ff,
  desc: 'Guerreros curtidos por la ventisca, semidioses antiguos y magia de Hielo Verdadero: aguante brutal, ralentizaciones y aturdimientos.',
  lore: 'El Freljord es una tierra implacable de hielo y tormentas donde solo sobreviven los fuertes. Sus tribus —la Avarosa de Ashe, la Garra Invernal de Sejuani y los Vigilantes de Hielo de Lissandra— se disputan el futuro del norte mientras los semidioses Anivia, Volibear y Ornn despiertan de nuevo. Bajo el hielo duerme algo antiguo, y el Freljord se prepara para la guerra.',
  champions: [
    // ───────── NIVEL 1 ─────────
    {
      id: 'gnar', name: 'Gnar', title: 'El Eslabón Perdido', tier: 1, role: 'Tirador',
      ...st(1, 'Tirador', 1.1, { hp: 1.1, range: 7 }),
      dmgType: 'perforante', armorType: 'natural', armor: 6,
      proj: { color: 0xf0e2c0, speed: 20, size: .2, shape: 'blade' },
      passive: { name: 'Hiper', desc: 'Cuanto más pelea, más rabia acumula: +5% de velocidad de ataque por ataque (máx. +40%).', type: 'rampup', per: .05, max: .4 },
      ability: { name: 'Lanzamiento de Bumerán', desc: 'Lanza su bumerán en línea recta: atraviesa a todos los enemigos a la ida y a la vuelta.', type: 'beam', cd: 6, dmg: 46, len: 8, w: .9, fx: 'slash', color: 0xf0e2c0 },
      upgrades: [
        { id: 'gnar_mega', name: 'Mega Gnar', cost: 60, hp: 2.6, dmg: 1.7, aspd: .85, armor: 16,
          desc: '¡GNAR! La rabia lo transforma en una bestia colosal que lanza rocas y aplasta a todo lo que tiene alrededor.',
          ability: { name: '¡GNAR!', desc: 'Golpea el suelo y lanza a los enemigos cercanos contra la pared: daño en área y aturdimiento de 1,3 s.', type: 'nova', cd: 9, dmg: 110, r: 2.4, stun: 1.3, self: true, fx: 'quake', color: 0xd9a441 } },
      ],
      quote: '"¡Gnar!"',
      lore: 'Gnar es un yordle primigenio que quedó congelado en el hielo durante miles de años. Despertó en un mundo nuevo y extraño que le parece fascinante... y peligroso. Cuando se enfada, este pequeño bribón se transforma en Mega Gnar, una mole capaz de destruirlo todo.',
      model: 'gnar',
    },
    {
      id: 'nunu', name: 'Nunu y Willump', title: 'El Niño y su Yeti', tier: 1, role: 'Tanque',
      ...st(1, 'Tanque', .8, { hp: 1.08 }),
      dmgType: 'magico', armorType: 'natural', armor: 12,
      passive: { name: 'Llamada del Freljord', desc: 'La alegría de Nunu contagia: aliados cercanos +12% de velocidad de ataque.', type: 'aura', stat: 'aspd', amt: .12, r: 3 },
      ability: { name: 'Bola de Nieve Gigante', desc: 'Willump rueda una bola de nieve enorme contra el enemigo: daño en área y aturdimiento de 1 s.', type: 'nova', cd: 10, dmg: 52, r: 1.7, stun: 1.0, fx: 'frost', color: 0xdff6ff },
      upgrades: [
        { id: 'nunu_spacegroove', name: 'Nunu y Willump Groove Espacial', cost: 60, hp: 1.95, dmg: 1.8, aspd: 1.0, armor: 8,
          desc: '¡A bailar por la galaxia! Willump desata el Cero Absoluto alrededor de sí mismo.',
          ability: { name: 'Cero Absoluto', desc: 'Concentra una ventisca a su alrededor y la hace estallar: gran daño en área y ralentización del 60%.', type: 'nova', cd: 12, dmg: 130, r: 3, self: true, slow: .6, slowT: 2.5, delay: .8, fx: 'frost', color: 0xa86bff } },
      ],
      quote: '"¡Willump, a por ellos!"',
      lore: 'Nunu es un niño que soñaba con aventuras, y Willump es un yeti que había olvidado que era un héroe. Juntos recorren el Freljord buscando a la madre de Nunu, haciendo amigos, lanzando bolas de nieve gigantes y demostrando que la imaginación es la magia más poderosa.',
      model: 'nunu',
    },
    // ───────── NIVEL 2 ─────────
    {
      id: 'ashe', name: 'Ashe', title: 'La Arquera de Hielo', tier: 2, role: 'Tirador',
      ...st(2, 'Tirador', .95, { hp: 1.0, range: 9 }),
      dmgType: 'perforante', armorType: 'ligera', armor: 4,
      proj: { color: 0xbff3ff, speed: 26, size: .15, shape: 'arrow' },
      passive: { name: 'Disparo Glacial', desc: 'Sus flechas de Hielo Verdadero ralentizan un 25% durante 1,5 s.', type: 'onhit_slow', amt: .25, t: 1.5 },
      ability: { name: 'Descarga', desc: 'Dispara un abanico de flechas heladas contra 4 enemigos a la vez, ralentizándolos.', type: 'volley', cd: 7, dmg: 50, n: 4, slow: .3, slowT: 2, fx: 'frost', color: 0x9fe4ff },
      upgrades: [
        { id: 'ashe_queen', name: 'Ashe Reina', cost: 90, hp: 1.85, dmg: 1.95, aspd: 1.05, armor: 6,
          desc: 'La reina de la Avarosa empuña el arco de Avarosa: dispara la Flecha de Cristal Encantada a través de todo el carril.',
          ability: { name: 'Flecha de Cristal Encantada', desc: 'Una flecha de hielo que cruza todo el carril, impacta al enemigo más resistente y aturde a los cercanos 2 s.', type: 'global', cd: 12, dmg: 170, r: 2, stun: 2, fx: 'frost', color: 0x7fd8ff } },
      ],
      quote: '"¡El Freljord, unido!"',
      lore: 'Descendiente de la legendaria Avarosa, Ashe es la reina de la tribu más numerosa del Freljord. Con su arco de Hielo Verdadero lucha para unir a las tribus del norte en una sola nación, convencida de que el futuro del Freljord pasa por la paz y no por las viejas guerras.',
      model: 'ashe',
    },
    {
      id: 'olaf', name: 'Olaf', title: 'El Berserker', tier: 2, role: 'Luchador',
      ...st(2, 'Luchador', 1.0, { hp: 1.05 }),
      dmgType: 'asedio', armorType: 'natural', armor: 10,
      passive: { name: 'Ira del Berserker', desc: 'Cuanto más herido está, más rápido golpea: por debajo del 50% de vida, +60% de velocidad de ataque.', type: 'rage', below: .5, aspd: .6 },
      ability: { name: 'Resaca', desc: 'Lanza un hacha que se clava junto al enemigo: daño en área y ralentización del 40%.', type: 'nova', cd: 7, dmg: 62, r: 1.4, slow: .4, slowT: 2, fx: 'slash', color: 0xbfe6ff },
      upgrades: [
        { id: 'olaf_pentakill', name: 'Olaf Pentakill', cost: 90, hp: 1.9, dmg: 1.9, aspd: 1.05, armor: 6,
          desc: '¡El vocalista de Pentakill sale al escenario! Desata Ragnarok y contagia su furia a la banda.',
          ability: { name: 'Ragnarok', desc: 'Grito de guerra: él y sus aliados cercanos ganan +40% de daño durante 6 s.', type: 'buff', cd: 12, stat: 'dmg', amt: .4, r: 2.6, dur: 6, fx: 'blood', color: 0xff5a2a } },
      ],
      quote: '"¡Que vengan con todo!"',
      lore: 'Olaf es un berserker imparable que solo teme una cosa: morir de viejo en la cama. Tras recibir una profecía según la cual moriría en paz, se lanza a las batallas más brutales buscando una muerte gloriosa que nunca termina de llegar.',
      model: 'olaf',
    },
    // ───────── NIVEL 3 ─────────
    {
      id: 'braum', name: 'Braum', title: 'El Corazón del Freljord', tier: 3, role: 'Tanque',
      ...st(3, 'Tanque', .85, { hp: 1.08 }),
      dmgType: 'asedio', armorType: 'fortificada', armor: 24,
      passive: { name: 'Golpes Contundentes', desc: 'Sus puñetazos pueden aturdir: 15% de probabilidad de aturdir 0,8 s.', type: 'onhit_stun', chance: .15, t: .8 },
      ability: { name: 'Inquebrantable', desc: 'Planta su escudo-puerta: provoca a los enemigos cercanos 3 s y gana mucha armadura.', type: 'taunt', cd: 9, r: 3.2, dur: 3, armor: 28, fx: 'frost', color: 0xbfe6ff },
      upgrades: [
        { id: 'braum_dragonslayer', name: 'Braum Cazadragones', cost: 120, hp: 1.95, dmg: 1.7, aspd: 1.0, armor: 12,
          desc: 'Con su escudo de escamas de dragón, nada ni nadie atraviesa su guardia.',
          ability: { name: 'Inquebrantable (Cazadragones)', desc: 'Provoca en un radio mayor durante 4 s y gana una armadura enorme.', type: 'taunt', cd: 8, r: 4, dur: 4, armor: 42, fx: 'fire', color: 0xffa040 } },
      ],
      quote: '"¡Quédate detrás de Braum!"',
      lore: 'Dotado de unos bíceps enormes y un corazón aún más grande, Braum es un héroe querido por todo el Freljord. Su escudo es la puerta de una cámara mágica que él mismo arrancó de la montaña para salvar a un niño, y desde entonces protege a cualquiera que lo necesite con una sonrisa bajo el bigote.',
      model: 'braum',
    },
    {
      id: 'tryndamere', name: 'Tryndamere', title: 'El Rey Bárbaro', tier: 3, role: 'Luchador',
      ...st(3, 'Luchador', 1.0, { hp: 1.0, dmg: 1.05 }),
      dmgType: 'asedio', armorType: 'natural', armor: 10,
      passive: { name: 'Furia Inmortal', desc: 'Se niega a morir: al recibir un golpe mortal sigue luchando 4 s más.', type: 'undying', dur: 4 },
      ability: { name: 'Corte Giratorio', desc: 'Gira con su espada y se lanza contra el enemigo más lejano, cortando a todos a su paso.', type: 'dash', cd: 7, dmg: 92, range: 8, r: 1.6, fx: 'slash', color: 0xff4a3a },
      upgrades: [
        { id: 'tryndamere_demonblade', name: 'Tryndamere Espada Demoníaca', cost: 120, hp: 1.9, dmg: 2.0, aspd: 1.05, armor: 6,
          desc: 'Una espada demoníaca alimenta su ira: su Furia Inmortal dura más y el corte arde.',
          passive: { name: 'Furia Inmortal (Demoníaca)', desc: 'Al recibir un golpe mortal sigue luchando 5,5 s más.', type: 'undying', dur: 5.5 },
          ability: { name: 'Corte Giratorio Demoníaco', desc: 'Corte giratorio envuelto en llamas infernales.', type: 'dash', cd: 6, dmg: 175, range: 9, r: 1.9, fx: 'fire', color: 0xff3010 } },
      ],
      quote: '"¡Mi furia no conoce límites!"',
      lore: 'Último superviviente de su clan, masacrado por una criatura monstruosa, Tryndamere vive alimentado por una ira inextinguible que le impide incluso morir. Casado con Ashe, el Rey Bárbaro lucha a su lado para unir el Freljord, aunque su rabia siga buscando venganza.',
      model: 'tryndamere',
    },
    // ───────── NIVEL 4 ─────────
    {
      id: 'sejuani', name: 'Sejuani', title: 'La Furia del Norte', tier: 4, role: 'Tanque',
      ...st(4, 'Tanque', .8, { hp: 1.05 }),
      dmgType: 'asedio', armorType: 'fortificada', armor: 24,
      passive: { name: 'Escarcha Permanente', desc: 'Los golpes de su mangual congelan: ralentizan un 30% durante 2 s.', type: 'onhit_slow', amt: .3, t: 2 },
      ability: { name: 'Prisión Glacial', desc: 'Lanza su boleadora de Hielo Verdadero: estalla en una tormenta que aturde 1,5 s a los enemigos cercanos.', type: 'nova', cd: 11, dmg: 125, r: 2.6, stun: 1.5, fx: 'frost', color: 0x9fe4ff },
      upgrades: [
        { id: 'sejuani_pororider', name: 'Sejuani Jinete de Poros', cost: 155, hp: 1.95, dmg: 1.75, aspd: 1.0, armor: 10,
          desc: 'Bristle descansa: ¡Sejuani carga a lomos de un poro gigante! La prisión glacial es más amplia y duradera.',
          ability: { name: 'Prisión Glacial (Poro)', desc: 'Una tormenta glacial enorme que aturde 2 s.', type: 'nova', cd: 10, dmg: 210, r: 3.2, stun: 2, fx: 'frost', color: 0xcff4ff } },
      ],
      quote: '"¡El débil cae y el fuerte sobrevive!"',
      lore: 'Brutal e implacable, Sejuani es la jefa de la Garra Invernal, una de las tribus más temidas del Freljord. Montada en su jabalí Bristle y armada con un mangual de Hielo Verdadero, cree que solo la guerra mantiene fuerte al norte, y quiere unir las tribus por la fuerza.',
      model: 'sejuani',
    },
    {
      id: 'lissandra', name: 'Lissandra', title: 'La Bruja de Hielo', tier: 4, role: 'Mago',
      ...st(4, 'Mago', .8, { hp: 1.0, range: 7.5 }),
      dmgType: 'magico', armorType: 'arcana', armor: 8,
      proj: { color: 0x8fe0ff, speed: 22, size: .2, shape: 'blade' },
      passive: { name: 'Fragmento Glacial', desc: 'Sus fragmentos de hielo estallan al impactar: 50% del daño en un radio de 1,5.', type: 'splash', pct: .5, r: 1.5 },
      ability: { name: 'Tumba de Hielo', desc: 'Encierra al objetivo en hielo eterno: daño en área y aturdimiento de 1,8 s.', type: 'nova', cd: 11, dmg: 150, r: 2.4, stun: 1.8, slow: .4, slowT: 2, fx: 'frost', color: 0x6ab8ff },
      upgrades: [
        { id: 'lissandra_porcelain', name: 'Lissandra Porcelana', cost: 155, hp: 1.85, dmg: 1.95, aspd: 1.0, armor: 6,
          desc: 'Una diosa de porcelana con grietas de oro: su tumba de hielo es enorme.',
          ability: { name: 'Tumba de Porcelana', desc: 'Tumba de hielo gigante: gran daño en área y aturdimiento de 2,2 s.', type: 'nova', cd: 10, dmg: 265, r: 3, stun: 2.2, slow: .5, slowT: 2.5, fx: 'frost', color: 0x8fd0ff } },
      ],
      quote: '"El hielo lo cubrirá todo."',
      lore: 'Una de las tres hermanas que gobernaron el Freljord en la antigüedad, Lissandra traicionó a sus hermanas Avarosa y Serylda pactando con los Vigilantes, seres primigenios a los que aún sirve desde las sombras. Su magia de Hielo Verdadero ha sepultado civilizaciones enteras, y conspira desde las sombras para que el mundo vuelva a quedar sumido en el hielo eterno.',
      model: 'lissandra',
    },
    // ───────── NIVEL 5 ─────────
    {
      id: 'anivia', name: 'Anivia', title: 'La Criofénix', tier: 5, role: 'Mago',
      ...st(5, 'Mago', .75, { hp: .95, range: 8 }),
      dmgType: 'magico', armorType: 'inmaterial', armor: 6,
      proj: { color: 0xbff3ff, speed: 16, size: .26, shape: 'star' },
      passive: { name: 'Renacimiento', desc: 'Al morir se convierte en un huevo de hielo y renace con el 60% de su vida (una vez por oleada).', type: 'revive', pct: .6 },
      ability: { name: 'Tormenta Glacial', desc: 'Invoca una ventisca de granizo sobre el objetivo: daño en área y ralentización del 50%.', type: 'nova', cd: 9, dmg: 170, r: 2.8, slow: .5, slowT: 3, fx: 'frost', color: 0x9fe4ff },
      upgrades: [
        { id: 'anivia_blackfrost', name: 'Anivia Escarcha Negra', cost: 195, hp: 1.85, dmg: 1.95, aspd: 1.0, armor: 6,
          desc: 'Hielo negro y llamas violetas: renace con más fuerza y su tormenta congela por completo.',
          passive: { name: 'Renacimiento Negro', desc: 'Renace del huevo con el 90% de su vida (una vez por oleada).', type: 'revive', pct: .9 },
          ability: { name: 'Tormenta Glacial Negra', desc: 'Ventisca de escarcha negra: gran daño en área, ralentización del 60% y aturdimiento de 0,8 s.', type: 'nova', cd: 9, dmg: 290, r: 3.2, stun: .8, slow: .6, slowT: 3, fx: 'frost', color: 0x9a6bff } },
      ],
      quote: '"Mis alas son el viento del norte."',
      lore: 'Anivia es un espíritu alado benévolo, una semidiosa del Freljord que soporta interminables ciclos de vida, muerte y renacimiento para proteger el norte. Nacida del hielo y los vientos cortantes, empuña los poderes de los elementos para frustrar a quien ose dañar su tierra.',
      model: 'anivia',
    },
    // ───────── NIVEL 6 ─────────
    {
      id: 'volibear', name: 'Volibear', title: 'La Tormenta Implacable', tier: 6, role: 'Luchador',
      ...st(6, 'Luchador', .9, { hp: 1.05 }),
      dmgType: 'asedio', armorType: 'natural', armor: 20,
      passive: { name: 'La Tormenta Implacable', desc: 'Sus zarpazos desatan relámpagos que saltan a los enemigos cercanos: 40% del daño en un radio de 2.', type: 'cleave', pct: .4, r: 2 },
      ability: { name: 'Rompecielos', desc: 'Invoca un rayo sobre el objetivo: gran daño en área, ralentización y aturdimiento de 1 s.', type: 'nova', cd: 9, dmg: 280, r: 2.8, stun: 1, slow: .4, slowT: 2, fx: 'lightning', color: 0x9fd8ff },
      upgrades: [
        { id: 'volibear_thunderlord', name: 'Volibear Señor del Trueno', cost: 250, hp: 1.85, dmg: 1.9, aspd: 1.05, armor: 10,
          desc: 'El trueno ancestral ruge en su pecho: desata al Portador de la Tormenta.',
          ability: { name: 'Portador de la Tormenta', desc: 'Salta sobre el enemigo más lejano y lo aplasta con la tormenta: daño enorme en área y aturdimiento de 1,4 s.', type: 'dash', cd: 9, dmg: 480, range: 12, r: 3.2, stun: 1.4, fx: 'lightning', color: 0xbfe0ff } },
      ],
      quote: '"¡El Freljord pertenece a la tormenta!"',
      lore: 'Para quienes aún lo veneran, Volibear es la tormenta encarnada. Destructivo, salvaje y obstinado, existía antes de que los mortales pisaran la tundra del Freljord y defiende con fiereza las tierras que él y sus hermanos semidioses crearon. Desprecia la civilización y la debilidad que, según él, ha traído consigo.',
      model: 'volibear',
    },
  ],
};
