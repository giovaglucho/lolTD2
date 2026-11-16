import { base } from '../balance.js';
// Legión Targon. Ver src/content/SCHEMA.md.
// B(): presupuesto del nivel con ajuste de personalidad (multiplicadores de vida y daño, ±20%).
const B = (tier, role, aspd, hpM = 1, dmgM = 1, extra = {}) => { const b = base(tier, role, aspd); return { ...b, hp: Math.round(b.hp * hpM), dmg: Math.round(b.dmg * dmgM), ...extra }; };

export default {
  id: 'targon', name: 'Targon', title: 'La Montaña Celestial', color: 0x4a3fa8, accent: 0xffd27a,
  desc: 'Los Aspectos de las estrellas descienden de la cima: el Sol, la Luna, la Guerra, el Protector y el Crepúsculo luchan con el poder del firmamento.',
  lore: 'El monte Targon se alza tan alto que su cumbre roza los cielos. Solo unos pocos sobreviven al ascenso, y a algunos de ellos los eligen los Aspectos, entidades celestiales que habitan sus cuerpos. Los Solari veneran al Sol y los Lunari a la Luna, mientras dragones estelares y guardianes de la vida pasean entre las constelaciones. Cuando Targon baja a la Grieta, el cielo entero baja con él.',
  champions: [
    // ───────── NIVEL 1 ─────────
    {
      id: 'soraka', name: 'Soraka', title: 'La Hija de las Estrellas', tier: 1, role: 'Apoyo',
      ...B(1, 'Apoyo', .8, 1.05, 1), dmgType: 'magico', armorType: 'arcana', armor: 2,
      proj: { color: 0x9fffe0, speed: 16, size: .16, shape: 'star' },
      passive: { name: 'Lluvia de Estrellas', desc: 'Sus ataques invocan estrellas que ralentizan al objetivo un 20% durante 1,5 s.', type: 'onhit_slow', amt: .2, t: 1.5 },
      ability: { name: 'Infusión Astral', desc: 'Sacrifica parte de su energía vital para curar al aliado más herido.', type: 'heal', cd: 4, heal: 75, range: 7, fx: 'heal', color: 0x8affd8 },
      upgrades: [
        { id: 'soraka_starguardian', name: 'Soraka Guardiana Estelar', cost: 60, hp: 1.9, dmg: 1.8, aspd: 1, armor: 4,
          desc: 'Guardiana de la esperanza: su curación se convierte en Deseo y alcanza a varios aliados a la vez.',
          ability: { name: 'Deseo', desc: 'Llena de energía a los tres aliados más heridos, curándolos.', type: 'heal', cd: 5, heal: 110, range: 9, n: 3, fx: 'star', color: 0xffb0e0 } },
      ],
      quote: '"Cura a los vivos. Honra a los muertos."',
      lore: 'Celestial que renunció a su inmortalidad para proteger a las razas mortales, Soraka recorre Runaterra curando a quienes sufren. Su cuerno y su bastón de luna canalizan la energía de las estrellas.',
      model: 'soraka',
    },
    {
      id: 'zilean', name: 'Zilean', title: 'El Guardián del Tiempo', tier: 1, role: 'Apoyo',
      ...B(1, 'Apoyo', .75, 1, 1.1), dmgType: 'magico', armorType: 'arcana', armor: 2,
      proj: { color: 0xffd36a, speed: 15, size: .17, shape: 'orb' },
      passive: { name: 'Distorsión Temporal', desc: 'Acelera el tiempo de sus aliados cercanos: +12% de velocidad de ataque.', type: 'aura', stat: 'aspd', amt: .12, r: 3.4 },
      ability: { name: 'Bomba de Tiempo', desc: 'Lanza una bomba de relojería que, tras 1 s, estalla en área y aturde 1 s.', type: 'nova', cd: 6, dmg: 75, r: 2, stun: 1, delay: 1, fx: 'arcane', color: 0xffd36a },
      upgrades: [
        { id: 'zilean_timemachine', name: 'Zilean Máquina del Tiempo', cost: 60, hp: 1.85, dmg: 1.9, aspd: 1.05, armor: 4,
          desc: 'Engranajes y latón: gana Retroceso Cronológico y revive una vez por oleada.',
          passive: { name: 'Retroceso Cronológico', desc: 'Al morir, el tiempo retrocede: revive una vez por oleada con el 60% de la vida.', type: 'revive', pct: .6 } },
      ],
      quote: '"El tiempo lo es todo."',
      lore: 'Poderoso mago icathiano, Zilean quedó obsesionado con el paso del tiempo tras presenciar la destrucción de su tierra natal. Atrapado entre pasado, presente y futuro, manipula los relojes del mundo para proteger a sus aliados.',
      model: 'zilean',
    },
    // ───────── NIVEL 2 ─────────
    {
      id: 'pantheon', name: 'Pantheon', title: 'La Lanza Indestructible', tier: 2, role: 'Luchador',
      ...B(2, 'Luchador', 1, 1.05, 1.05), dmgType: 'perforante', armorType: 'fortificada', armor: 16,
      passive: { name: 'Voluntad Mortal', desc: 'Cada 4.º ataque está potenciado e inflige ×1,8 de daño.', type: 'nth', n: 4, mul: 1.8 },
      ability: { name: 'Asalto Escudado', desc: 'Salta con su escudo contra el objetivo, golpeándolo y aturdiéndolo 1 s.', type: 'strike', cd: 7, dmg: 90, stun: 1, fx: 'sun', color: 0xffb347 },
      upgrades: [
        { id: 'pantheon_dragonslayer', name: 'Pantheon Matadragones', cost: 90, hp: 1.9, dmg: 1.9, aspd: 1, armor: 6,
          desc: 'Armadura de escamas de dragón: su habilidad se convierte en Gran Caída Estelar.',
          ability: { name: 'Gran Caída Estelar', desc: 'Salta a los cielos y cae como un cometa sobre el enemigo más lejano, dañando y aturdiendo 1,2 s en área.', type: 'dash', cd: 9, dmg: 160, range: 11, stun: 1.2, r: 2.2, fx: 'fire', color: 0xff7a2a } },
      ],
      quote: '"¡Ningún dios me detendrá!"',
      lore: 'Atreus era un soldado del Ejército del Rakkor cuando el Aspecto de la Guerra lo eligió como portador. Tras la caída del Aspecto, Pantheon decidió seguir luchando como mortal, con la lanza y el escudo de un dios caído.',
      model: 'pantheon',
    },
    {
      id: 'taric', name: 'Taric', title: 'El Escudo de Valoran', tier: 2, role: 'Tanque',
      ...B(2, 'Tanque', .9, 1.05, 1), dmgType: 'magico', armorType: 'fortificada', armor: 20,
      passive: { name: 'Bastión', desc: 'Su presencia irradia protección: los aliados cercanos ganan +5 de armadura.', type: 'aura', stat: 'armor', amt: 5, r: 3 },
      ability: { name: 'Resplandor Cósmico', desc: 'Invoca la luz de las estrellas y protege con un escudo a los tres aliados más heridos.', type: 'shield', cd: 10, amt: 120, range: 6, dur: 4, n: 3, fx: 'holy', color: 0x7fd8ff },
      upgrades: [
        { id: 'taric_emerald', name: 'Taric Esmeralda', cost: 90, hp: 1.95, dmg: 1.8, aspd: 1, armor: 8,
          desc: 'Gemas de esmeralda pulidas: escudos más grandes y duraderos.',
          ability: { name: 'Resplandor Cósmico', desc: 'Escuda a los cuatro aliados más heridos durante 5 s.', type: 'shield', cd: 9, amt: 170, range: 7, dur: 5, n: 4, fx: 'holy', color: 0x6aff9a } },
      ],
      quote: '"Contempla la belleza."',
      lore: 'Taric es el Aspecto del Protector, guardián de la vida, el amor y la belleza de Runaterra. Antiguo caballero demaciano exiliado, escaló el monte Targon y encontró allí su redención y su propósito cósmico.',
      model: 'taric',
    },
    // ───────── NIVEL 3 ─────────
    {
      id: 'diana', name: 'Diana', title: 'El Desprecio de la Luna', tier: 3, role: 'Asesino',
      ...B(3, 'Asesino', 1.05, 1.05, 1), dmgType: 'magico', armorType: 'arcana', armor: 8,
      passive: { name: 'Filo Lunar Plateado', desc: 'Sus tajos de plata lunar golpean en área: 45% del daño a los cercanos.', type: 'cleave', pct: .45, r: 1.7 },
      ability: { name: 'Arremetida Lunar', desc: 'Se convierte en un destello de luna y se lanza sobre el enemigo más lejano, golpeando en área.', type: 'dash', cd: 6, dmg: 110, range: 10, r: 1.5, fx: 'water', color: 0xbfc8ff },
      upgrades: [
        { id: 'diana_lunargoddess', name: 'Diana Diosa Lunar', cost: 120, hp: 1.9, dmg: 1.9, aspd: 1.05, armor: 4,
          desc: 'La diosa de la luna llena: su habilidad pasa a ser Caída Lunar, un giro de plata que arrasa todo a su alrededor.',
          ability: { name: 'Caída Lunar', desc: 'Atrae la luz de la luna y desata un vendaval de plata que golpea varias veces en área.', type: 'spin', cd: 7, dmg: 70, r: 3, hits: 3, dur: 1.2, fx: 'spin', color: 0xdfe4ff } },
      ],
      quote: '"¡Soy la verdad de la Luna!"',
      lore: 'Guerrera Solari que descubrió los secretos prohibidos de los Lunari, Diana fue condenada por herejía... hasta que el Aspecto de la Luna la eligió. Ahora porta la luz plateada y su filo creciente para vengarse de quienes la repudiaron.',
      model: 'diana',
    },
    {
      id: 'kayle', name: 'Kayle', title: 'La Justiciera', tier: 3, role: 'Tirador',
      ...B(3, 'Tirador', 1, 1.05, 1), range: 6.5, dmgType: 'magico', armorType: 'arcana', armor: 8,
      proj: { color: 0xffb347, speed: 22, size: .2, shape: 'blade' },
      passive: { name: 'Celo Divino', desc: 'Cada ataque aviva su fuego sagrado: +8% de velocidad de ataque por golpe, hasta +40%.', type: 'rampup', per: .08, max: .4 },
      ability: { name: 'Espada Ígnea Estelar', desc: 'Envuelve su espada en llamas celestiales y castiga al objetivo; ×2 contra enemigos por debajo del 40% de vida.', type: 'strike', cd: 6, dmg: 120, exec: .4, execMul: 2, fx: 'fire', color: 0xffa040 },
      upgrades: [
        { id: 'kayle_transcended', name: 'Kayle Transcendida', cost: 120, hp: 1.85, dmg: 1.95, aspd: 1.05, armor: 4,
          desc: 'Asciende por completo: tres pares de alas de fuego y sus ondas de llamas estallan en área.',
          passive: { name: 'Aspiración Divina', desc: 'Sus ataques liberan ondas de fuego estelar que dañan en área (45%).', type: 'splash', pct: .45, r: 1.8 } },
      ],
      quote: '"Me levanto para traer justicia."',
      lore: 'Hija de una Aspecto de la Justicia, Kayle nació en los albores de la Guerra de las Runas con una chispa celestial. Su sentido inquebrantable de la justicia la llevó a desplegar sus alas de fuego para juzgar a los mortales... y a su propia hermana, Morgana.',
      model: 'kayle',
    },
    // ───────── NIVEL 4 ─────────
    {
      id: 'leona', name: 'Leona', title: 'La Aurora Radiante', tier: 4, role: 'Tanque',
      ...B(4, 'Tanque', .85, 1.05, 1), dmgType: 'asedio', armorType: 'fortificada', armor: 26,
      passive: { name: 'Luz del Sol', desc: 'Su luz señala a los enemigos: los aliados cercanos infligen +10% de daño.', type: 'aura', stat: 'dmg', amt: .1, r: 3 },
      ability: { name: 'Escudo del Alba', desc: 'Golpea con su escudo solar al objetivo, aturdiéndolo 1,6 s.', type: 'stun', cd: 6, dmg: 90, stun: 1.6, fx: 'sun', color: 0xffd24a },
      upgrades: [
        { id: 'leona_eclipse', name: 'Leona Eclipse', cost: 155, hp: 1.95, dmg: 1.8, aspd: 1, armor: 8,
          desc: 'Sol y luna en uno: su habilidad se convierte en Llamarada Solar, un rayo del cielo que aturde en área.',
          ability: { name: 'Llamarada Solar', desc: 'Invoca un rayo de sol abrasador sobre el objetivo: daña en área y aturde 1,6 s.', type: 'nova', cd: 8, dmg: 170, r: 2.6, stun: 1.6, fx: 'sun', color: 0xff6a3a } },
      ],
      quote: '"¡Que el Sol os ilumine!"',
      lore: 'Imbuida del fuego del Sol, Leona es una guerrera sagrada de los Solari y la elegida del Aspecto del Sol. Defiende el monte Targon con su Filo Cénit y su Escudo del Alba, irradiando una fe que ciega a sus enemigos.',
      model: 'leona',
    },
    {
      id: 'aphelios', name: 'Aphelios', title: 'El Arma de los Fieles', tier: 4, role: 'Tirador',
      ...B(4, 'Tirador', 1.05, .95, .95), dmgType: 'perforante', armorType: 'ligera', armor: 4,
      proj: { color: 0x9fd8ff, speed: 30, size: .15, shape: 'bullet' },
      passive: { name: 'El Asesino y la Vidente', desc: 'Las armas de los Lunari cambian sin cesar: cada ataque golpea a 2 enemigos extra con el 45% del daño.', type: 'multishot', n: 2, pct: .45 },
      ability: { name: 'Vigilia Lunar', desc: 'Dispara una luna llena de luz que estalla sobre hasta 5 enemigos, ralentizándolos (Gravitum) un 35%.', type: 'volley', cd: 8, dmg: 130, n: 5, slow: .35, slowT: 2, fx: 'water', color: 0xbfdcff },
      upgrades: [
        { id: 'aphelios_nightbringer', name: 'Aphelios Portador de la Noche', cost: 155, hp: 1.9, dmg: 1.9, aspd: 1.05, armor: 4,
          desc: 'Las armas de la noche eterna: Crescendum se multiplica y golpea a un enemigo extra.',
          passive: { name: 'Crescendum Nocturno', desc: 'Cada ataque golpea a 3 enemigos extra con el 50% del daño.', type: 'multishot', n: 3, pct: .5 } },
      ],
      quote: '"..." (Alune: "Hermano, estoy contigo.")',
      lore: 'Aphelios, guerrero de los Lunari, bebe una toxina que le impide hablar mientras su hermana gemela Alune, atrapada en un templo lunar, le forja armas de luz de luna. Juntos son el arma de los fieles contra los Solari.',
      model: 'aphelios',
    },
    // ───────── NIVEL 5 ─────────
    {
      id: 'zoe', name: 'Zoe', title: 'El Aspecto del Crepúsculo', tier: 5, role: 'Mago',
      ...B(5, 'Mago', .8, .95, 1.05), dmgType: 'magico', armorType: 'inmaterial', armor: 4,
      proj: { color: 0xffd36a, speed: 20, size: .2, shape: 'star' },
      passive: { name: '¡Más Destellos!', desc: 'Cada 3.er ataque lanza una chispa adicional que inflige ×1,8 de daño.', type: 'nth', n: 3, mul: 1.8 },
      ability: { name: 'Burbuja Somnífera', desc: 'Lanza una burbuja que hace caer dormidos (aturdidos) 2 s a los enemigos alcanzados, y estalla.', type: 'nova', cd: 8, dmg: 210, r: 2.2, stun: 2, fx: 'arcane', color: 0xd88aff },
      upgrades: [
        { id: 'zoe_starguardian', name: 'Zoe Guardiana Estelar', cost: 195, hp: 1.85, dmg: 1.95, aspd: 1.05, armor: 4,
          desc: 'La guardiana más traviesa: sus estrellas fugaces estallan en área al impactar.',
          passive: { name: 'Estrella Fugaz', desc: 'Sus ataques son estrellas que explotan en área (50%).', type: 'splash', pct: .5, r: 1.8 } },
      ],
      quote: '"¡Oh, qué divertido!"',
      lore: 'Zoe es la encarnación caprichosa del Aspecto del Crepúsculo: una niña eterna que juega entre portales y dimensiones. Mensajera de acontecimientos cósmicos, para ella el universo entero es un juguete.',
      model: 'zoe',
    },
    // ───────── NIVEL 6 ─────────
    {
      id: 'aurelionsol', name: 'Aurelion Sol', title: 'El Forjador de Estrellas', tier: 6, role: 'Mago',
      ...B(6, 'Mago', .7, 1.15, 1), range: 7, speed: 2.9, dmgType: 'magico', armorType: 'inmaterial', armor: 14,
      proj: { color: 0xffe9a0, speed: 18, size: .26, shape: 'star' },
      passive: { name: 'Cosmogénesis', desc: 'Las estrellas que lo orbitan estallan al impactar: sus ataques dañan en área (55%).', type: 'splash', pct: .55, r: 2 },
      ability: { name: 'Aliento de Luz', desc: 'Exhala un torrente de fuego estelar que calcina a todos los enemigos en línea recta.', type: 'beam', cd: 6, dmg: 340, len: 10, w: 1.6, fx: 'star', color: 0xffe28a },
      upgrades: [
        { id: 'aurelionsol_ashen', name: 'Aurelion Sol Señor de las Cenizas', cost: 250, hp: 1.9, dmg: 1.9, aspd: 1, armor: 8,
          desc: 'Brasas de un cosmos muerto: su habilidad se convierte en ¡Los Cielos Descienden!, una estrella gigante que cae y aturde.',
          ability: { name: '¡Los Cielos Descienden!', desc: 'Hace caer una estrella colosal sobre el objetivo: enorme daño en área y aturdimiento de 1,5 s.', type: 'nova', cd: 9, dmg: 480, r: 3.4, stun: 1.5, delay: .6, fx: 'fire', color: 0xff6a2a } },
      ],
      quote: '"Contemplad la creación... y su fin."',
      lore: 'Aurelion Sol fue antaño el creador de estrellas de un universo naciente, hasta que el Imperio Targoniano lo encadenó con una corona mágica. Liberado al fin, el dragón cósmico recorre el firmamento recordando a los mortales lo diminutos que son.',
      model: 'aurelionsol',
    },
  ],
};
