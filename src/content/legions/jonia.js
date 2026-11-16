import { base } from '../balance.js';
// Legión Jonia. Ver src/content/SCHEMA.md.
// st(): parte del presupuesto base(tier, rol, aspd) y aplica ajustes (hp/dmg = multiplicadores, resto = valor absoluto).
const st = (tier, role, aspd, mod = {}) => { const b = base(tier, role, aspd); for (const k in mod) b[k] = (k === 'hp' || k === 'dmg') ? Math.round(b[k] * mod[k]) : mod[k]; return b; };

export default {
  id: 'jonia', name: 'Jonia', title: 'Las Tierras Primigenias', color: 0xd2577a, accent: 0x6ad6c0,
  desc: 'Maestros espirituales, danzarinas de cuchillas y asesinos de las sombras: golpes precisos, críticos y movilidad sin igual.',
  lore: 'Rodeada de mares traicioneros, Jonia es un archipiélago de islas donde la magia fluye por cada ser vivo. Durante siglos sus gentes vivieron en armonía con los espíritus, hasta que la invasión noxiana los obligó a empuñar las armas. Hoy los monasterios, las órdenes Kinkou y los rebeldes de Navori defienden el equilibrio de las Tierras Primigenias, aunque no siempre estén de acuerdo en cómo hacerlo.',
  champions: [
    // ───────── NIVEL 1 ─────────
    {
      id: 'leesin', name: 'Lee Sin', title: 'El Monje Ciego', tier: 1, role: 'Luchador',
      ...st(1, 'Luchador', 1.0, { hp: 1.05 }),
      dmgType: 'asedio', armorType: 'natural', armor: 10,
      passive: { name: 'Fluir', desc: 'Cada golpe encadena el siguiente: +6% de velocidad de ataque por ataque (máx. +36%).', type: 'rampup', per: .06, max: .36 },
      ability: { name: 'Furia del Dragón', desc: 'Una patada giratoria que aturde al objetivo 1,2 s.', type: 'strike', cd: 8, dmg: 62, stun: 1.2, fx: 'fire', color: 0xff9a2a },
      upgrades: [
        { id: 'leesin_godfist', name: 'Lee Sin Puño del Dios Dragón', cost: 60, hp: 1.9, dmg: 1.9, aspd: 1.05, armor: 6,
          desc: 'El espíritu del dragón arde en sus puños: la patada golpea más fuerte y aturde más tiempo.',
          ability: { name: 'Furia del Dragón Divino', desc: 'Patada envuelta en fuego de dragón: gran daño y aturdimiento de 1,6 s.', type: 'strike', cd: 7, dmg: 120, stun: 1.6, fx: 'fire', color: 0xffc040 } },
      ],
      quote: '"Los actos de un solo hombre pueden cambiar el mundo."',
      lore: 'Maestro de las antiguas artes marciales de Jonia, Lee Sin canaliza el espíritu del dragón. Ya en el monasterio de Shojin desató un fuego que no pudo controlar y, como penitencia, se arrebató la vista. Ahora lucha guiado solo por sus otros sentidos para proteger su tierra.',
      model: 'leesin',
    },
    {
      id: 'akali', name: 'Akali', title: 'La Asesina Renegada', tier: 1, role: 'Asesino',
      ...st(1, 'Asesino', 1.1, { hp: .95 }),
      dmgType: 'perforante', armorType: 'ligera', armor: 4,
      passive: { name: 'Marca de la Asesina', desc: 'Cada tercer golpe sale del anillo de energía e inflige ×1,7 de daño.', type: 'nth', n: 3, mul: 1.7 },
      ability: { name: 'Velo del Crepúsculo', desc: 'Lanza una bomba de humo y se vuelve invisible 2 s; su siguiente golpe hace ×2,2.', type: 'stealth', cd: 8, dur: 2, mul: 2.2, fx: 'shadow', color: 0x3fd6a0 },
      upgrades: [
        { id: 'akali_kda', name: 'Akali K/DA', cost: 60, hp: 1.85, dmg: 1.95, aspd: 1.05, armor: 4,
          desc: 'La rapera más letal de Runaterra: el humo dura más y el golpe que lo rompe es demoledor.',
          ability: { name: 'Velo del Crepúsculo (K/DA)', desc: 'Invisible 2,5 s; su siguiente golpe hace ×2,7.', type: 'stealth', cd: 7, dur: 2.5, mul: 2.7, fx: 'shadow', color: 0xc76bff } },
      ],
      quote: '"Si pareces débil, estarás muerto."',
      lore: 'Akali abandonó la Orden Kinkou y el título de Puño de la Sombra para defender Jonia a su manera: sin esperar a que los ancianos decidan. Armada con su kama y sus kunais, es una asesina solitaria que golpea a los enemigos de su pueblo desde el humo.',
      model: 'akali',
    },
    // ───────── NIVEL 2 ─────────
    {
      id: 'ahri', name: 'Ahri', title: 'La Vastaya de Nueve Colas', tier: 2, role: 'Mago',
      ...st(2, 'Mago', .85, { hp: 1.0, range: 7.5 }),
      dmgType: 'magico', armorType: 'arcana', armor: 6,
      proj: { color: 0x7fb8ff, speed: 18, size: .2, shape: 'orb' },
      passive: { name: 'Robo de Esencia', desc: 'Absorbe la esencia de sus víctimas: roba el 12% del daño como vida.', type: 'lifesteal', pct: .12 },
      ability: { name: 'Orbe del Engaño', desc: 'Lanza su orbe en línea recta: daña a todos los enemigos que atraviesa.', type: 'beam', cd: 6, dmg: 70, len: 8, w: 1.2, fx: 'arcane', color: 0x6ab8ff },
      upgrades: [
        { id: 'ahri_spiritblossom', name: 'Ahri Florecer Espiritual', cost: 90, hp: 1.85, dmg: 1.9, aspd: 1.0, armor: 4,
          desc: 'Envuelta en pétalos espirituales: el orbe se acompaña de Encanto y aturde a los enemigos.',
          ability: { name: 'Orbe del Engaño + Encanto', desc: 'Orbe más ancho que daña y encanta (aturde 0,8 s) a todos los enemigos de la línea.', type: 'beam', cd: 6, dmg: 125, len: 9, w: 1.5, stun: .8, fx: 'arcane', color: 0xff7ac8 } },
      ],
      quote: '"Muéstrame lo que tu corazón esconde."',
      lore: 'Conectada de forma innata con la magia de Runaterra, Ahri es una vastaya zorruna capaz de manipular las emociones de sus presas y devorar su esencia. Tras años alimentándose de recuerdos ajenos, busca ahora entender su propio pasado y el destino de su pueblo.',
      model: 'ahri',
    },
    {
      id: 'jhin', name: 'Jhin', title: 'El Virtuoso', tier: 2, role: 'Tirador',
      ...st(2, 'Tirador', .6, { hp: .95, range: 9.5 }),
      dmgType: 'perforante', armorType: 'ligera', armor: 3,
      proj: { color: 0xffd27a, speed: 34, size: .12, shape: 'bullet' },
      passive: { name: 'Susurro', desc: 'Su pistola solo tiene 4 balas: la cuarta siempre es un golpe crítico (×2,6).', type: 'nth', n: 4, mul: 2.6 },
      ability: { name: 'Floritura Mortal', desc: 'Un disparo larguísimo que atraviesa la línea y enraíza (aturde 1 s).', type: 'beam', cd: 9, dmg: 90, len: 14, w: .6, stun: 1.0, fx: 'beam', color: 0xe0405a },
      upgrades: [
        { id: 'jhin_darkcosmic', name: 'Jhin Cosmos Oscuro', cost: 90, hp: 1.8, dmg: 2.0, aspd: 1.0, armor: 3,
          desc: 'El artista se convierte en una deidad cósmica: desata su obra maestra, el Telón Final.',
          ability: { name: 'Telón Final', desc: 'Cuatro disparos cósmicos contra cuatro enemigos a la vez, que los ralentizan.', type: 'volley', cd: 9, dmg: 115, n: 4, slow: .4, slowT: 1.5, fx: 'star', color: 0xb070ff } },
      ],
      quote: '"Cada actuación es... ¡magnífica!"',
      lore: 'Jhin es un psicópata meticuloso que considera el asesinato una forma de arte. Encarcelado durante años en Jonia, fue liberado por miembros sombríos del consejo para servir como asesino a sueldo. Cada una de sus balas es una pincelada en su obra maestra.',
      model: 'jhin',
    },
    // ───────── NIVEL 3 ─────────
    {
      id: 'yasuo', name: 'Yasuo', title: 'El Imperdonable', tier: 3, role: 'Luchador',
      ...st(3, 'Luchador', 1.05, { hp: .92, dmg: 1.0 }),
      dmgType: 'perforante', armorType: 'ligera', armor: 8,
      passive: { name: 'Senda del Errante', desc: 'Su probabilidad de crítico se duplica: 35% de golpes críticos (×1,9).', type: 'crit', chance: .35, mul: 1.9 },
      ability: { name: 'Último Aliento', desc: 'Salta al enemigo más lejano, lo lanza por los aires con su viento y golpea en área (aturde 1 s).', type: 'dash', cd: 10, dmg: 110, range: 11, stun: 1.0, r: 2, fx: 'wind', color: 0x9ff0ff },
      upgrades: [
        { id: 'yasuo_bloodmoon', name: 'Yasuo Luna de Sangre', cost: 120, hp: 1.9, dmg: 1.95, aspd: 1.05, armor: 6,
          desc: 'Poseído por un demonio de la Luna de Sangre: su Último Aliento es más amplio, letal y tiñe el viento de rojo.',
          ability: { name: 'Último Aliento (Luna de Sangre)', desc: 'Salto demoníaco: gran daño en área y aturdimiento de 1,3 s.', type: 'dash', cd: 9, dmg: 200, range: 12, stun: 1.3, r: 2.6, fx: 'blood', color: 0xff3a4a } },
      ],
      quote: '"La muerte es como el viento: siempre está a mi lado."',
      lore: 'Espadachín jonio de voluntad férrea, Yasuo domina el viento como arma. Acusado injustamente del asesinato de su maestro, se convirtió en un fugitivo que vaga por Jonia buscando al verdadero culpable... mientras carga con la muerte de su propio hermano, Yone.',
      model: 'yasuo',
    },
    {
      id: 'irelia', name: 'Irelia', title: 'La Danzarina de las Cuchillas', tier: 3, role: 'Luchador',
      ...st(3, 'Luchador', .95, { hp: 1.0 }),
      dmgType: 'perforante', armorType: 'fortificada', armor: 14,
      passive: { name: 'Fervor Jonio', desc: 'Cada golpe aviva su danza: +7% de velocidad de ataque por ataque (máx. +42%).', type: 'rampup', per: .07, max: .42 },
      ability: { name: 'Embate de Cuchilla', desc: 'Se lanza contra el enemigo más lejano a su alcance cortando todo a su paso.', type: 'dash', cd: 5, dmg: 85, range: 9, r: 1.2, fx: 'slash', color: 0xf0c75e },
      upgrades: [
        { id: 'irelia_mythmaker', name: 'Irelia Forjadora de Mitos', cost: 120, hp: 1.9, dmg: 1.9, aspd: 1.05, armor: 8,
          desc: 'Sus cuchillas de jade y oro trazan leyendas: el embate desata la Vanguardia del Filo.',
          ability: { name: 'Vanguardia del Filo', desc: 'Embestida con un abanico de cuchillas: daño en área y aturdimiento de 0,7 s.', type: 'dash', cd: 5, dmg: 155, range: 11, r: 1.9, stun: .7, fx: 'slash', color: 0x7fffd0 } },
      ],
      quote: '"Mis cuchillas bailan al son de Jonia."',
      lore: 'Cuando Noxus invadió Jonia, la joven Irelia vio morir a su padre y descubrió que podía hacer danzar cuchillas con su magia. Hoy es la heroína de Navori, una líder reacia que defiende su tierra con un abanico de filos flotantes.',
      model: 'irelia',
    },
    // ───────── NIVEL 4 ─────────
    {
      id: 'shen', name: 'Shen', title: 'El Ojo del Crepúsculo', tier: 4, role: 'Tanque',
      ...st(4, 'Tanque', .9, { hp: 1.05 }),
      dmgType: 'magico', armorType: 'fortificada', armor: 22,
      passive: { name: 'Barrera de Ki', desc: 'Su equilibrio interior lo repara constantemente: regenera 14 de vida por segundo.', type: 'regen', hps: 14 },
      ability: { name: 'Embestida en las Sombras', desc: 'Irrumpe entre los enemigos y los provoca durante 2,5 s, ganando armadura.', type: 'taunt', cd: 9, r: 3.5, dur: 2.5, armor: 22, fx: 'shadow', color: 0x4fa8ff },
      upgrades: [
        { id: 'shen_pulsefire', name: 'Shen Pulso de Fuego', cost: 155, hp: 1.9, dmg: 1.8, aspd: 1.0, armor: 10,
          desc: 'Guardián temporal del futuro: protege a sus aliados con Unidos, apareciendo a su lado en un destello.',
          ability: { name: 'Unidos', desc: 'Escuda a los 2 aliados más heridos de todo el carril durante 5 s.', type: 'shield', cd: 10, amt: 420, range: 40, dur: 5, n: 2, fx: 'holy', color: 0x6ab8ff } },
      ],
      quote: '"El equilibrio es mi deber."',
      lore: 'Líder de la Orden Kinkou, Shen es un guerrero que busca mantener el equilibrio entre el reino material y el espiritual. Para cumplir su deber, renunció a sus emociones y a sus lazos: incluso a su amistad con Zed, quien asesinó a su padre.',
      model: 'shen',
    },
    {
      id: 'zed', name: 'Zed', title: 'El Maestro de las Sombras', tier: 4, role: 'Asesino',
      ...st(4, 'Asesino', 1.0, { hp: 1.0, dmg: .95 }),
      dmgType: 'perforante', armorType: 'inmaterial', armor: 6,
      passive: { name: 'Desprecio por los Débiles', desc: 'Golpea a los enemigos debilitados: +35% de daño a los que tienen menos del 50% de vida.', type: 'execute', below: .5, mul: 1.35 },
      ability: { name: 'Marca de la Muerte', desc: 'Se funde con su sombra y desaparece 1,5 s; su siguiente golpe hace ×2,5.', type: 'stealth', cd: 9, dur: 1.5, mul: 2.5, fx: 'shadow', color: 0xd8203a },
      upgrades: [
        { id: 'zed_project', name: 'PROYECTO: Zed', cost: 155, hp: 1.85, dmg: 1.95, aspd: 1.05, armor: 4,
          desc: 'Ciborg asesino con cuchillas de plasma: su marca es aún más letal.',
          ability: { name: 'Marca de la Muerte (PROYECTO)', desc: 'Invisible 2 s; su siguiente golpe hace ×3,2.', type: 'stealth', cd: 8, dur: 2, mul: 3.2, fx: 'shadow', color: 0xff3048 } },
      ],
      quote: '"Lo invisible vence a lo visible."',
      lore: 'Antiguo pupilo del maestro Kusho, Zed abrió una caja prohibida y descubrió las artes de la sombra. Rechazado por la Orden Kinkou, fundó la Orden de la Sombra y la convirtió en una fuerza implacable para defender Jonia de cualquier amenaza, a cualquier precio.',
      model: 'zed',
    },
    // ───────── NIVEL 5 ─────────
    {
      id: 'masteryi', name: 'Maestro Yi', title: 'El Espadachín Wuju', tier: 5, role: 'Asesino',
      ...st(5, 'Asesino', 1.2, { hp: 1.0 }),
      dmgType: 'puro', armorType: 'ligera', armor: 8,
      passive: { name: 'Golpe Doble', desc: 'Cada cuarto ataque golpea dos veces (×2).', type: 'nth', n: 4, mul: 2 },
      ability: { name: 'Golpe Alfa', desc: 'Se teletransporta entre los enemigos golpeando a todos en área.', type: 'dash', cd: 8, dmg: 210, range: 10, r: 2.5, fx: 'slash', color: 0xc6ff5a },
      upgrades: [
        { id: 'masteryi_headhunter', name: 'Maestro Yi Cazador de Cabezas', cost: 195, hp: 1.85, dmg: 1.95, aspd: 1.1, armor: 6,
          desc: 'El cazador de la jungla: su Golpe Alfa se vuelve una ráfaga imparable con críticos.',
          passive: { name: 'Estilo Wuju', desc: 'Su técnica perfecta: 40% de golpes críticos (×2).', type: 'crit', chance: .4, mul: 2 },
          ability: { name: 'Golpe Alfa (Cazador)', desc: 'Ráfaga de teletransportes: mucho daño en un área amplia.', type: 'dash', cd: 7, dmg: 360, range: 12, r: 3, fx: 'slash', color: 0x9dff3a } },
      ],
      quote: '"Mi espada... es tuya."',
      lore: 'Último superviviente de la aldea de Wuju, arrasada por las armas químicas noxianas, Maestro Yi ha dedicado su vida a perfeccionar el antiguo estilo de lucha. Con las gafas de visión múltiple de su tradición, sus golpes son tan rápidos que nadie puede seguirlos.',
      model: 'masteryi',
    },
    // ───────── NIVEL 6 ─────────
    {
      id: 'karma', name: 'Karma', title: 'La Iluminada', tier: 6, role: 'Apoyo',
      ...st(6, 'Apoyo', .85, { hp: 1.05, range: 7.5 }),
      dmgType: 'magico', armorType: 'arcana', armor: 12,
      proj: { color: 0xb98bff, speed: 17, size: .24, shape: 'orb' },
      passive: { name: 'Mantra', desc: 'Su presencia espiritual inspira a Jonia: aliados cercanos +15% de velocidad de ataque.', type: 'aura', stat: 'aspd', amt: .15, r: 4 },
      ability: { name: 'Inspirar', desc: 'Escuda a los 3 aliados más heridos cercanos durante 4 s.', type: 'shield', cd: 9, amt: 300, range: 8, dur: 4, n: 3, fx: 'arcane', color: 0xb98bff },
      upgrades: [
        { id: 'karma_lotus', name: 'Karma Orden del Loto', cost: 250, hp: 1.9, dmg: 1.85, aspd: 1.0, armor: 8,
          desc: 'Guía de la Orden del Loto: potencia su Inspirar con el Mantra y protege a todo el frente.',
          ability: { name: 'Desafío', desc: 'Inspirar potenciado por el Mantra: escudo enorme a 5 aliados durante 4 s.', type: 'shield', cd: 8, amt: 520, range: 9, dur: 4, n: 5, fx: 'holy', color: 0xffd36a } },
      ],
      quote: '"Mi espíritu es antiguo. Mi voluntad, inquebrantable."',
      lore: 'Karma es la encarnación del espíritu de Jonia: un alma antigua que ha renacido una y otra vez a lo largo de los siglos, guardando los recuerdos de todas sus vidas anteriores. Durante la invasión noxiana se alzó como la voz que unió a las provincias, dispuesta a usar su poder para proteger a su pueblo.',
      model: 'karma',
    },
  ],
};
