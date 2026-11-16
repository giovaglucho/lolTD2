import { base } from '../balance.js';
// Legión Piltover y Zaun. Ver src/content/SCHEMA.md.
// B(): presupuesto del nivel con ajuste de personalidad (multiplicadores de vida y daño, ±20%).
const B = (tier, role, aspd, hpM = 1, dmgM = 1, extra = {}) => { const b = base(tier, role, aspd); return { ...b, hp: Math.round(b.hp * hpM), dmg: Math.round(b.dmg * dmgM), ...extra }; };

export default {
  id: 'piltover', name: 'Piltover y Zaun', title: 'Ciudades del Progreso y la Química', color: 0xd9a441, accent: 0x3fe0a0,
  desc: 'Inventores, agentes de la ley y monstruos químicos: la tecnología hextech de la Ciudad del Progreso y la quimtecnología de las Entrañas combaten codo con codo.',
  lore: 'Piltover brilla sobre los acantilados del Mar Bendito, una ciudad de academias, gremios mercantiles y puertas hextech que convierten la magia en ingeniería. Bajo sus puentes se hunde Zaun, una urbe de humo verde, tuberías y química, donde el ingenio se paga caro y se sobrevive a golpe de ingenio. Ambas ciudades se odian y se necesitan: cuando marchan juntas, sus engranajes, rifles y cohetes no conocen rival.',
  champions: [
    // ───────── NIVEL 1 ─────────
    {
      id: 'ezreal', name: 'Ezreal', title: 'El Explorador Pródigo', tier: 1, role: 'Tirador',
      ...B(1, 'Tirador', 1.15, 1.05, 1), dmgType: 'magico', armorType: 'ligera', armor: 4,
      proj: { color: 0x7fe6ff, speed: 26, size: .16, shape: 'bolt' },
      passive: { name: 'Potencia Ascendente', desc: 'Cada ataque acelera su guantelete: +6% de velocidad de ataque por golpe, hasta +30%.', type: 'rampup', per: .06, max: .3 },
      ability: { name: 'Disparo Místico', desc: 'Dispara un rayo de energía arcana que atraviesa a todos los enemigos en línea recta.', type: 'beam', cd: 5, dmg: 70, len: 9, w: .9, fx: 'arcane', color: 0x7fe6ff },
      upgrades: [
        { id: 'ezreal_pulsefire', name: 'Ezreal Pulsefire', cost: 60, hp: 1.85, dmg: 1.95, aspd: 1.05, armor: 4,
          desc: 'Viajero del tiempo con armadura de pulsos: su definitiva se vuelve Descarga Certera, un haz que cruza todo el carril.',
          ability: { name: 'Descarga Certera', desc: 'Una enorme onda de energía que impacta al enemigo con más vida de todo el carril y daña a los que lo rodean.', type: 'global', cd: 9, dmg: 190, r: 2.2, fx: 'arcane', color: 0x5ff0ff } },
      ],
      quote: '"¿Hay algo que no pueda hacer?"',
      lore: 'Aventurero brillante y algo engreído, Ezreal encontró en unas ruinas de Shurima un guantelete arcano que lo eligió como portador. Recorre Runaterra en busca de reliquias perdidas, confiando en su talento natural para salir de cualquier aprieto.',
      model: 'ezreal',
    },
    {
      id: 'heimerdinger', name: 'Heimerdinger', title: 'El Inventor Idolatrado', tier: 1, role: 'Mago',
      ...B(1, 'Mago', .8, 1, .9), range: 6.5, dmgType: 'magico', armorType: 'arcana', armor: 2,
      proj: { color: 0xffd24a, speed: 18, size: .14, shape: 'bolt' },
      passive: { name: 'Afinidad Hextech', desc: 'Sus inventos zumban a su alrededor: los aliados cercanos ganan +8% de velocidad de ataque.', type: 'aura', stat: 'aspd', amt: .08, r: 3 },
      ability: { name: 'Torreta H-28G Evolutiva', desc: 'Despliega una torreta automática que dispara rayos a los enemigos durante 12 s.', type: 'summon', cd: 12, n: 1, fx: 'lightning', color: 0xffd24a,
        unit: { name: 'Torreta H-28G', hp: 120, dmg: 12, aspd: 1.2, range: 6, melee: false, model: 'heimer_turret', dur: 12, s: .9 } },
      upgrades: [
        { id: 'heimer_dragon', name: 'Heimerdinger Entrenador de Dragones', cost: 60, hp: 1.9, dmg: 1.9, aspd: 1, armor: 4,
          desc: 'Domador de dragoncitos: invoca dos torretas-dragón que escupen fuego en lugar de una torreta.',
          ability: { name: 'Torretas Dracónicas', desc: 'Despliega dos dragoncitos-torreta que escupen fuego durante 12 s.', type: 'summon', cd: 12, n: 2, fx: 'fire', color: 0xff7a2a,
            unit: { name: 'Dragoncito', hp: 160, dmg: 18, aspd: 1.2, range: 5.5, melee: false, model: 'heimer_turret_up', dur: 12, s: .9 } } },
      ],
      quote: '"¡Ah, la ciencia! ¡Toda una revolución!"',
      lore: 'El profesor Cecil B. Heimerdinger es uno de los inventores más brillantes y excéntricos de Piltover. Este yordle de mente inquieta ha dedicado siglos a la ciencia, y sus torretas autónomas son famosas en toda la Academia.',
      model: 'heimerdinger',
    },
    // ───────── NIVEL 2 ─────────
    {
      id: 'caitlyn', name: 'Caitlyn', title: 'La Sheriff de Piltover', tier: 2, role: 'Tirador',
      ...B(2, 'Tirador', .8, .95, 1.05), range: 10, dmgType: 'perforante', armorType: 'ligera', armor: 4,
      proj: { color: 0xffe9a0, speed: 34, size: .12, shape: 'bullet' },
      passive: { name: 'Disparo a la Cabeza', desc: 'Cada 4.º disparo es un tiro a la cabeza que inflige ×2,2 de daño.', type: 'nth', n: 4, mul: 2.2 },
      ability: { name: 'Pacificador de Piltover', desc: 'Carga el rifle y dispara una bala perforante que atraviesa a todos los enemigos en línea.', type: 'beam', cd: 6, dmg: 120, len: 11, w: .7, fx: 'beam', color: 0xffe28a },
      upgrades: [
        { id: 'caitlyn_officer', name: 'Caitlyn Oficial', cost: 90, hp: 1.85, dmg: 1.95, aspd: 1.05, armor: 4,
          desc: 'La placa de la ley: su habilidad pasa a ser As en la Manga, un disparo letal contra el enemigo más fuerte.',
          ability: { name: 'As en la Manga', desc: 'Apunta con calma y dispara al enemigo con más vida del carril; daño enorme.', type: 'global', cd: 9, dmg: 330, r: 0, fx: 'beam', color: 0xffe28a },
          passive: { name: 'Disparo a la Cabeza', desc: 'Cada 3.er disparo es un tiro a la cabeza (×2,2).', type: 'nth', n: 3, mul: 2.2 } },
      ],
      quote: '"Hora de ponerse serios."',
      lore: 'Hija de una familia acomodada de Piltover, Caitlyn es la mejor tiradora y detective de la ciudad. Junto a Vi persigue a los criminales de Zaun, y su obsesión por resolver cada caso solo es comparable a su puntería.',
      model: 'caitlyn',
    },
    {
      id: 'vi', name: 'Vi', title: 'La Agente de Piltover', tier: 2, role: 'Luchador',
      ...B(2, 'Luchador', .95, 1.1, 1), dmgType: 'asedio', armorType: 'natural', armor: 10,
      passive: { name: 'Golpes Demoledores', desc: 'Cada 3.er puñetazo destroza la armadura: ×1,9 de daño.', type: 'nth', n: 3, mul: 1.9 },
      ability: { name: 'Asalto y Agresión', desc: 'Fija un objetivo lejano, carga a través de las filas enemigas y lo derriba, aturdiéndolo 1,2 s.', type: 'dash', cd: 8, dmg: 95, range: 9, stun: 1.2, r: 1.4, fx: 'quake', color: 0xff5aa8 },
      upgrades: [
        { id: 'vi_neon', name: 'Vi Golpe de Neón', cost: 90, hp: 1.95, dmg: 1.85, aspd: 1.05, armor: 6,
          desc: 'Guanteletes de neón: la carga golpea un área mayor y aturde más tiempo.',
          ability: { name: 'Asalto y Agresión', desc: 'Carga hacia el objetivo más lejano; la onda de neón aturde 1,6 s en área.', type: 'dash', cd: 7, dmg: 120, range: 10, stun: 1.6, r: 2, fx: 'lightning', color: 0x3fe8ff } },
      ],
      quote: '"Primero pego y luego pregunto."',
      lore: 'Criada en las calles de Zaun, Vi resuelve los problemas a puñetazos con sus enormes guanteletes hextech. Tras años de pandillera, ahora trabaja con Caitlyn para mantener el orden en Piltover... a su manera.',
      model: 'vi',
    },
    // ───────── NIVEL 3 ─────────
    {
      id: 'ekko', name: 'Ekko', title: 'El Chico que Fragmentó el Tiempo', tier: 3, role: 'Asesino',
      ...B(3, 'Asesino', 1.1, .95, 1), dmgType: 'magico', armorType: 'ligera', armor: 6,
      passive: { name: 'Cronorruptura', desc: 'Al morir, el Z-Drive rebobina el tiempo: revive una vez por oleada con el 50% de la vida.', type: 'revive', pct: .5 },
      ability: { name: 'Convergencia Paralela', desc: 'Lanza una esfera temporal que, tras un instante, estalla y aturde 1,4 s a los enemigos en área.', type: 'nova', cd: 8, dmg: 90, r: 2.2, stun: 1.4, delay: .8, fx: 'arcane', color: 0x3ff0d0 },
      upgrades: [
        { id: 'ekko_truedamage', name: 'Ekko True Damage', cost: 120, hp: 1.85, dmg: 1.95, aspd: 1.05, armor: 4,
          desc: 'La estrella de True Damage marca el compás: la Convergencia Paralela estalla más grande y aturde más.',
          ability: { name: 'Convergencia Paralela', desc: 'Una esfera dorada que estalla en un área amplia y aturde 1,8 s.', type: 'nova', cd: 7, dmg: 150, r: 2.8, stun: 1.8, delay: .7, fx: 'arcane', color: 0xffd36a } },
      ],
      quote: '"No es cuánto tiempo tienes, sino cómo lo usas."',
      lore: 'Prodigio de las calles de Zaun, Ekko construyó el Z-Drive, un dispositivo capaz de rebobinar el tiempo unos segundos. Con él protege a los suyos y lucha por un futuro mejor para las Entrañas.',
      model: 'ekko',
    },
    {
      id: 'blitzcrank', name: 'Blitzcrank', title: 'El Gran Gólem de Vapor', tier: 3, role: 'Tanque',
      ...B(3, 'Tanque', .75, 1.1, .95), dmgType: 'asedio', armorType: 'fortificada', armor: 22,
      passive: { name: 'Puño Propulsor', desc: 'Sus puñetazos tienen un 18% de probabilidad de lanzar al enemigo por los aires (aturde 0,8 s).', type: 'onhit_stun', chance: .18, t: .8 },
      ability: { name: 'Agarre Biónico', desc: 'Dispara su mano propulsada, atrae al enemigo más lejano hasta él y lo aturde 1 s.', type: 'pull', cd: 8, dmg: 80, stun: 1, range: 10, fx: 'lightning', color: 0xffd24a },
      upgrades: [
        { id: 'blitz_iblitz', name: 'iBlitzcrank', cost: 120, hp: 1.95, dmg: 1.8, aspd: 1, armor: 8,
          desc: 'Diseño minimalista y blanco impoluto: más armadura y un agarre que aturde más tiempo.',
          ability: { name: 'Agarre Biónico', desc: 'Atrae al enemigo más lejano y lo aturde 1,5 s.', type: 'pull', cd: 7, dmg: 120, stun: 1.5, range: 11, fx: 'lightning', color: 0x7fd8ff } },
      ],
      quote: '"Iniciando: protocolo de agarre."',
      lore: 'Construido en Zaun para limpiar residuos tóxicos, Blitzcrank despertó a la consciencia gracias a un accidente químico. Hoy este gólem de vapor ayuda a los zaunitas y protege a sus amigos con sus enormes puños propulsados.',
      model: 'blitzcrank',
    },
    // ───────── NIVEL 4 ─────────
    {
      id: 'jayce', name: 'Jayce', title: 'El Defensor del Mañana', tier: 4, role: 'Luchador',
      ...B(4, 'Luchador', .9, 1, 1.05), dmgType: 'asedio', armorType: 'arcana', armor: 12,
      passive: { name: 'Martillo de Mercurio', desc: 'Sus martillazos golpean en área: 40% del daño a los enemigos cercanos.', type: 'cleave', pct: .4, r: 1.6 },
      ability: { name: 'Explosión de Choque', desc: 'Cambia al Cañón de Mercurio y dispara una esfera eléctrica al enemigo más lejano que explota en área.', type: 'nova', cd: 7, dmg: 150, r: 2.3, tgtFar: true, fx: 'lightning', color: 0x5fd0ff },
      upgrades: [
        { id: 'jayce_debonair', name: 'Jayce Distinguido', cost: 155, hp: 1.9, dmg: 1.9, aspd: 1.05, armor: 6,
          desc: 'Traje de gala y martillo dorado: la Explosión de Choque cruza una Puerta de Aceleración y ralentiza.',
          ability: { name: 'Explosión Acelerada', desc: 'La esfera atraviesa una Puerta de Aceleración: más daño, más radio y ralentiza un 40% durante 2 s.', type: 'nova', cd: 6, dmg: 210, r: 2.8, slow: .4, slowT: 2, tgtFar: true, fx: 'lightning', color: 0x7fe0ff } },
      ],
      quote: '"¡Por un Piltover mejor!"',
      lore: 'Jayce Talis es el brillante inventor que, junto a Viktor, descubrió la tecnología hextech. Armado con su Martillo de Mercurio, capaz de transformarse en cañón, defiende Piltover y el ideal de progreso que juró proteger.',
      model: 'jayce',
    },
    {
      id: 'warwick', name: 'Warwick', title: 'La Ira Desencadenada de Zaun', tier: 4, role: 'Luchador',
      ...B(4, 'Luchador', 1.15, 1.1, .95), dmgType: 'perforante', armorType: 'natural', armor: 12,
      passive: { name: 'Hambre Eterna', desc: 'Sus zarpazos le devuelven el 22% del daño infligido como vida.', type: 'lifesteal', pct: .22 },
      ability: { name: 'Coacción Infinita', desc: 'Salta sobre el enemigo más lejano, lo inmoviliza 1,5 s y lo desgarra.', type: 'dash', cd: 8, dmg: 140, range: 10, stun: 1.5, fx: 'blood', color: 0x7fff5a },
      upgrades: [
        { id: 'warwick_arcane', name: 'Warwick Arcane', cost: 155, hp: 1.9, dmg: 1.9, aspd: 1.05, armor: 6,
          desc: 'El brillo púrpura de Vander: más robo de vida y una sed de sangre imparable.',
          passive: { name: 'Hambre Eterna', desc: 'Roba el 30% del daño infligido.', type: 'lifesteal', pct: .3 } },
      ],
      quote: '"¡Alimenta a la bestia!"',
      lore: 'Convertido en un monstruo por los experimentos quimtecnológicos del doctor Singed, Warwick acecha los callejones de Zaun. Huele la sangre a kilómetros y caza a los criminales con una furia que ningún tubo de química puede saciar.',
      model: 'warwick',
    },
    // ───────── NIVEL 5 ─────────
    {
      id: 'jinx', name: 'Jinx', title: 'La Bala Perdida', tier: 5, role: 'Tirador',
      ...B(5, 'Tirador', 1, .95, 1.05), dmgType: 'perforante', armorType: 'ligera', armor: 4,
      proj: { color: 0xff4fa3, speed: 26, size: .15, shape: 'bullet' },
      passive: { name: '¡Ametralladora!', desc: 'Pow-Pow se calienta: +12% de velocidad de ataque por disparo, hasta +84%.', type: 'rampup', per: .12, max: .84 },
      ability: { name: '¡Súper Mega Cohete de la Muerte!', desc: 'Dispara un cohete gigante que cruza el mapa e impacta al enemigo con más vida, dañando en área.', type: 'global', cd: 10, dmg: 300, r: 2.6, fx: 'rocket', color: 0xff4fa3 },
      upgrades: [
        { id: 'jinx_starguardian', name: 'Jinx Guardiana Estelar', cost: 195, hp: 1.9, dmg: 1.95, aspd: 1.05, armor: 4,
          desc: 'Brillos, estrellas y explosiones: el cohete se convierte en un Mega Cohete Estelar que también aturde.',
          ability: { name: '¡Súper Mega Cohete Estelar!', desc: 'Un cohete repleto de estrellas que impacta al enemigo con más vida y aturde 1 s en área.', type: 'global', cd: 10, dmg: 380, r: 3, stun: 1, fx: 'star', color: 0xff7ad8 } },
      ],
      quote: '"¡Las reglas están para romperlas!"',
      lore: 'Criminal maniaca e impulsiva de Zaun, Jinx vive para sembrar el caos sin preocuparse por las consecuencias. Con su ametralladora Pow-Pow y su lanzacohetes Huesos de Pez convierte cada calle de Piltover en una fiesta de explosiones.',
      model: 'jinx',
    },
    // ───────── NIVEL 6 ─────────
    {
      id: 'viktor', name: 'Viktor', title: 'El Heraldo de las Máquinas', tier: 6, role: 'Mago',
      ...B(6, 'Mago', .75, 1.05, 1), dmgType: 'magico', armorType: 'arcana', armor: 10,
      proj: { color: 0xffa64a, speed: 20, size: .18, shape: 'orb' },
      passive: { name: 'Evolución Gloriosa', desc: 'Viktor "mejora" a quienes le rodean: los aliados cercanos infligen +15% de daño.', type: 'aura', stat: 'dmg', amt: .15, r: 3.2 },
      ability: { name: 'Rayo de la Muerte', desc: 'Traza con su brazo hextech un rayo devastador que calcina a todos los enemigos en línea.', type: 'beam', cd: 6, dmg: 330, len: 10, w: 1.1, fx: 'beam', color: 0xffa64a },
      upgrades: [
        { id: 'viktor_arcane', name: 'Viktor Arcane: El Heraldo', cost: 250, hp: 1.9, dmg: 1.9, aspd: 1.05, armor: 8,
          desc: 'Fundido con el Arcano: el rayo deja una estela de energía que ralentiza y aturde brevemente.',
          ability: { name: 'Rayo de la Muerte: Evolución', desc: 'Un rayo arcano colosal que atraviesa la línea y aturde 0,8 s.', type: 'beam', cd: 6, dmg: 430, len: 12, w: 1.4, stun: .8, fx: 'arcane', color: 0x7fe8ff },
          passive: { name: 'Evolución Gloriosa', desc: 'Los aliados cercanos infligen +22% de daño.', type: 'aura', stat: 'dmg', amt: .22, r: 3.6 } },
      ],
      quote: '"Únete a la evolución gloriosa."',
      lore: 'Visionario de una nueva era tecnológica, Viktor ha reemplazado gran parte de su cuerpo por máquinas para superar la fragilidad humana. Co-creador del hextech junto a Jayce, sueña con liberar a la humanidad del dolor... aunque para ello deba eliminar su humanidad.',
      model: 'viktor',
    },
  ],
};
