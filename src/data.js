// ─────────────────────────────────────────────────────────────
//  Datos del juego: campeones (luchadores), monstruos, oleadas, mercenarios
// ─────────────────────────────────────────────────────────────
export const GRID = { cols: 10, rows: 6, cell: 2.4, z0: 4 };
export const LANE = { spawnZ: -34, nexusZ: 28, half: 14 };
export const CFG = { buildTime: 30, startGold: 500, startMyth: 0, startWorkers: 1, baseIncome: 110, pcost: 50, pcostStep: 10, maxP: 20, mythRate: 1.0,
  nexusHp: 3000, nexusHp2v2: 4200, totalWaves: 20, upMul: .9, upStat: 1.85, recBase: 300, regenPer: 6,
  nexUp: { hp: 120, atk: 140, regen: 90 } };
export const UPGRADES = { garen:'Garen Dios-Rey', ashe:'Ashe Reina de Freljord', annie:'Annie Reina Hextech', lux:'Lux Elementalista', malphite:'Malphite Monolito', soraka:'Soraka Guardiana Estelar',
  darius:'Darius Dios-Rey', jinx:'Jinx Star Guardian', leona:'Leona Eclipse Solar', teemo:'Teemo Omega', yasuo:'Yasuo Luna de Sangre', ezreal:'Ezreal Pulsefire' };
export const DIFFS = { facil: { name:'Fácil', spend:.6, bonus:0, merc:.12, workers:.6, upg:.0, nex:0, ready:20 },
  normal: { name:'Normal', spend:.85, bonus:0, merc:.25, workers:1, upg:.3, nex:.2, ready:10 },
  dificil: { name:'Difícil', spend:1, bonus:40, merc:.4, workers:1.2, upg:.6, nex:.5, ready:3 },
  locura: { name:'Locura', spend:1, bonus:110, merc:.5, workers:1.4, upg:.8, nex:.7, ready:1 } };

// fx: nombre de efecto visual que el render sabe pintar
export const FIGHTERS = [
  { id:'garen', name:'Garen', title:'El Poder de Demacia', cost:100, hp:560, dmg:40, aspd:.9, range:1.8, speed:3.6, armor:18, melee:true, role:'Tanque',
    color:0x3a6fd8, accent:0xf0c75e, ability:{ type:'spin', name:'Juicio', cd:6, dmg:75, r:3.3, fx:'spin' },
    desc:'Gira su espada y daña a todos los enemigos cercanos.' },
  { id:'ashe', name:'Ashe', title:'La Arquera de Hielo', cost:90, hp:270, dmg:32, aspd:1.25, range:9, speed:3.2, armor:6, melee:false, role:'Tirador',
    color:0x7fd0ff, accent:0xffffff, proj:{ color:0x9fe4ff, speed:22, size:.16 },
    ability:{ type:'volley', name:'Tormenta de Flechas', cd:6, dmg:34, n:6, slow:.45, slowT:2.5, fx:'frost' },
    desc:'Dispara una lluvia de flechas que ralentiza a sus objetivos.' },
  { id:'annie', name:'Annie', title:'La Hija de la Oscuridad', cost:110, hp:310, dmg:46, aspd:.8, range:7, speed:3.2, armor:5, melee:false, role:'Mago',
    color:0xd2336f, accent:0xff9a3d, proj:{ color:0xff6a2a, speed:17, size:.26 },
    ability:{ type:'nova', name:'Incinerar', cd:7, dmg:115, r:3.1, stun:.9, fx:'fire' },
    desc:'Calcina un área frente a ella y aturde brevemente.' },
  { id:'lux', name:'Lux', title:'La Dama Luminosa', cost:130, hp:290, dmg:54, aspd:.72, range:8.5, speed:3.1, armor:5, melee:false, role:'Mago',
    color:0xf2e8a0, accent:0x6bb8ff, proj:{ color:0xfff3b0, speed:20, size:.22 },
    ability:{ type:'beam', name:'Chispa Final', cd:8.5, dmg:170, len:15, w:1.5, fx:'beam' },
    desc:'Un rayo de luz que atraviesa a todos los enemigos en línea.' },
  { id:'malphite', name:'Malphite', title:'Fragmento del Monolito', cost:130, hp:880, dmg:34, aspd:.7, range:1.9, speed:3, armor:34, melee:true, role:'Tanque',
    color:0x7b7f8a, accent:0x58e0a3,
    ability:{ type:'nova', name:'Fuerza Imparable', cd:9, dmg:65, r:3.4, stun:1.6, fx:'quake', self:true },
    desc:'Una onda sísmica aturde a todos los enemigos cercanos.' },
  { id:'soraka', name:'Soraka', title:'La Hija de las Estrellas', cost:120, hp:290, dmg:22, aspd:.85, range:7, speed:3.2, armor:6, melee:false, role:'Apoyo',
    color:0xcfd8ff, accent:0x9a6bff, proj:{ color:0xb9a0ff, speed:18, size:.18 },
    ability:{ type:'heal', name:'Deseo', cd:3.2, heal:110, range:11, fx:'heal' },
    desc:'Cura al aliado más herido de la línea.' },
  { id:'darius', name:'Darius', title:'La Mano de Noxus', cost:150, hp:640, dmg:82, aspd:.72, range:2.1, speed:3.6, armor:20, melee:true, role:'Bruiser',
    color:0x8a1f1f, accent:0xd9d9d9,
    ability:{ type:'strike', name:'Guillotina Noxiana', cd:5, dmg:150, exec:.4, execMul:1.9, fx:'slash' },
    desc:'Ejecuta a los enemigos con poca vida.' },
  { id:'jinx', name:'Jinx', title:'El Gatillo Alegre', cost:160, hp:310, dmg:40, aspd:1.7, range:8, speed:3.3, armor:5, melee:false, role:'Tirador',
    color:0x3fc7ea, accent:0xff4fa3, proj:{ color:0xffd24a, speed:26, size:.12 },
    ability:{ type:'nova', name:'¡Súper Mega Cohete de la Muerte!', cd:6.5, dmg:105, r:2.7, fx:'rocket', tgtFar:true },
    desc:'Cohete explosivo que daña en área.' },
  { id:'leona', name:'Leona', title:'El Amanecer Radiante', cost:140, hp:760, dmg:36, aspd:.8, range:2, speed:3.5, armor:30, melee:true, role:'Tanque',
    color:0xe0a43a, accent:0xfff0b0,
    ability:{ type:'stun', name:'Eclipse Solar', cd:7, dmg:55, stun:1.7, fx:'sun' },
    desc:'Aturde a un objetivo con la luz del sol.' },
  { id:'teemo', name:'Teemo', title:'El Explorador Veloz', cost:60, hp:170, dmg:18, aspd:1.1, range:6.5, speed:3.8, armor:3, melee:false, role:'Barato',
    color:0x6aa843, accent:0xd8742f, proj:{ color:0x8aff5a, speed:20, size:.1 },
    ability:{ type:'poison', name:'Dardo Tóxico', cd:4, dps:16, t:5, fx:'poison' },
    desc:'Envenena a sus enemigos. ¡Barato y molesto!' },
  { id:'yasuo', name:'Yasuo', title:'El Imperdonable', cost:170, hp:470, dmg:72, aspd:1.15, range:2, speed:4.2, armor:12, melee:true, role:'Duelista',
    color:0x4b9fa8, accent:0xe8f4ff,
    ability:{ type:'dash', name:'Último Aliento', cd:5, dmg:140, fx:'wind' },
    desc:'Se lanza sobre el objetivo más lejano y lo hiere.' },
  { id:'ezreal', name:'Ezreal', title:'El Explorador Pródigo', cost:120, hp:280, dmg:48, aspd:1.0, range:9, speed:3.4, armor:6, melee:false, role:'Tirador',
    color:0xe4c284, accent:0x4fd4ff, proj:{ color:0x4fd4ff, speed:24, size:.16 },
    ability:{ type:'beam', name:'Disparo Místico', cd:6, dmg:115, len:14, w:1.0, fx:'arcane' },
    desc:'Un disparo arcano que perfora enemigos.' },
];

// monstruos de la grieta (oleadas) + mercenarios
// k = modelo, s = escala del modelo
export const CREEPS = {
  melee:   { name:'Súbdito Cuerpo a Cuerpo', k:'minion', hp:110, dmg:11, aspd:1, range:1.6, speed:3.2, armor:0, melee:true, s:1, bounty:3 },
  caster:  { name:'Súbdito Mago', k:'minion_c', hp:80, dmg:14, aspd:.9, range:5.5, speed:3.1, armor:0, melee:false, s:1, bounty:3, proj:{color:0xc59bff,speed:14,size:.14} },
  gromp:   { name:'Gromp', k:'gromp', hp:260, dmg:18, aspd:.8, range:2, speed:2.6, armor:5, melee:true, s:1.15, bounty:5, ability:{type:'poison',cd:5,dps:10,t:4,fx:'poison'} },
  wolf:    { name:'Lobo Sombrío', k:'wolf', hp:95, dmg:15, aspd:1.3, range:1.7, speed:5.2, armor:0, melee:true, s:1, bounty:3 },
  raptor:  { name:'Raptor', k:'raptor', hp:90, dmg:16, aspd:1.2, range:2.6, speed:5, armor:0, melee:true, s:1, bounty:3 },
  krug:    { name:'Krug', k:'krug', hp:420, dmg:24, aspd:.7, range:2, speed:2.2, armor:14, melee:true, s:1.25, bounty:6 },
  cannon:  { name:'Súbdito de Asedio', k:'cannon', hp:240, dmg:34, aspd:.55, range:6.5, speed:2.6, armor:8, melee:false, s:1.2, bounty:6, proj:{color:0xff8a3d,speed:12,size:.25} },
  blue:    { name:'Centinela Azul', k:'buff_blue', hp:620, dmg:30, aspd:.8, range:2.2, speed:2.8, armor:14, melee:true, s:1.5, bounty:9, ability:{type:'nova',cd:6,dmg:45,r:3,stun:.8,self:true,fx:'frost'} },
  red:     { name:'Brambleback Rojo', k:'buff_red', hp:640, dmg:34, aspd:.8, range:2.2, speed:2.8, armor:14, melee:true, s:1.5, bounty:9, ability:{type:'poison',cd:4,dps:18,t:4,fx:'fire'} },
  herald:  { name:'Heraldo de la Grieta', k:'herald', hp:2600, dmg:70, aspd:.6, range:2.6, speed:2.8, armor:25, melee:true, s:2.1, bounty:40, boss:true, ability:{type:'nova',cd:6,dmg:90,r:3.6,stun:1.2,self:true,fx:'void'} },
  voidling:{ name:'Larva del Vacío', k:'grub', hp:140, dmg:14, aspd:1, range:1.5, speed:3.4, armor:0, melee:true, s:.9, bounty:2 },
  super:   { name:'Súbdito Superior', k:'super', hp:900, dmg:48, aspd:.8, range:2, speed:3, armor:30, melee:true, s:1.6, bounty:10 },
  cloud:   { name:'Dragón de las Nubes', k:'drake_c', hp:1500, dmg:70, aspd:.65, range:7, speed:3, armor:18, melee:false, s:1.9, bounty:22, proj:{color:0xbfe9ff,speed:16,size:.3}, ability:{type:'nova',cd:6,dmg:80,r:3,fx:'frost'} },
  inferno: { name:'Dragón Infernal', k:'drake_i', hp:1700, dmg:80, aspd:.65, range:7, speed:3, armor:18, melee:false, s:1.9, bounty:24, proj:{color:0xff5a1f,speed:16,size:.32}, ability:{type:'nova',cd:5.5,dmg:100,r:3.2,fx:'fire'} },
  mountain:{ name:'Dragón de la Montaña', k:'drake_m', hp:2600, dmg:75, aspd:.55, range:6, speed:2.6, armor:40, melee:false, s:2, bounty:26, proj:{color:0xc9a26a,speed:14,size:.32}, ability:{type:'nova',cd:6,dmg:90,r:3.2,stun:1,fx:'quake'} },
  ocean:   { name:'Dragón del Océano', k:'drake_o', hp:2000, dmg:65, aspd:.7, range:7, speed:3, armor:20, melee:false, s:1.9, bounty:24, proj:{color:0x4fb8ff,speed:16,size:.3}, ability:{type:'heal',heal:220,range:8,cd:4,fx:'heal'} },
  hunter:  { name:'Acechador del Vacío', k:'voidhunter', hp:1100, dmg:85, aspd:.9, range:2.2, speed:4.3, armor:15, melee:true, s:1.5, bounty:14 },
  elder:   { name:'Dragón Ancestral', k:'elder', hp:6200, dmg:120, aspd:.6, range:7.5, speed:2.8, armor:50, melee:false, s:2.8, bounty:80, boss:true, proj:{color:0xc77bff,speed:18,size:.45}, ability:{type:'nova',cd:5,dmg:170,r:4,stun:1,fx:'void'} },
  baron:   { name:'Barón Nashor', k:'baron', hp:13000, dmg:170, aspd:.55, range:7.5, speed:2.4, armor:60, melee:false, s:3.4, bounty:150, boss:true, proj:{color:0xa14dff,speed:15,size:.5}, ability:{type:'nova',cd:4.5,dmg:230,r:4.6,stun:1.1,fx:'void'} },
};

// oleadas: [{c: criatura, n: cantidad}] — escala = 1.19^(w-1)
export const WAVES = [
  { name:'Súbditos', g:[{c:'melee',n:8}] },
  { name:'Súbditos Magos', g:[{c:'melee',n:6},{c:'caster',n:4}] },
  { name:'Gromp', g:[{c:'gromp',n:6}] },
  { name:'Lobos Sombríos', g:[{c:'wolf',n:14}] },
  { name:'Raptores', g:[{c:'raptor',n:12}] },
  { name:'Krugs', g:[{c:'krug',n:7}] },
  { name:'Asedio', g:[{c:'cannon',n:6},{c:'melee',n:8}] },
  { name:'Centinelas Azules', g:[{c:'blue',n:5},{c:'caster',n:6}] },
  { name:'Brambleback Rojo', g:[{c:'red',n:6},{c:'wolf',n:8}] },
  { name:'Heraldo de la Grieta', boss:true, g:[{c:'herald',n:1},{c:'voidling',n:12}] },
  { name:'Plaga del Vacío', g:[{c:'voidling',n:26}] },
  { name:'Súbditos Superiores', g:[{c:'super',n:9},{c:'cannon',n:5}] },
  { name:'Dragones de las Nubes', g:[{c:'cloud',n:5}] },
  { name:'Dragones Infernales', g:[{c:'inferno',n:5},{c:'krug',n:6}] },
  { name:'Dragones de Montaña', g:[{c:'mountain',n:4},{c:'ocean',n:3}] },
  { name:'Acechadores del Vacío', g:[{c:'hunter',n:12},{c:'voidling',n:14}] },
  { name:'Dragón Ancestral', boss:true, g:[{c:'elder',n:1},{c:'inferno',n:4}] },
  { name:'Cría del Barón', g:[{c:'super',n:12},{c:'hunter',n:10}] },
  { name:'Heraldos y Dragones', g:[{c:'herald',n:3},{c:'mountain',n:4},{c:'ocean',n:3}] },
  { name:'¡BARÓN NASHOR!', boss:true, g:[{c:'baron',n:1},{c:'elder',n:2},{c:'hunter',n:8}] },
];

// mercenarios que se envían al rival: cost, income, n unidades
export const MERCS = [
  { id:'scuttle', name:'Cangrejo Escurridizo', cost:20, inc:2, n:6, c:'scuttle', desc:'6 cangrejos veloces.' },
  { id:'grub',    name:'Larvas del Vacío', cost:55, inc:6, n:6, c:'voidling', desc:'Enjambre de larvas.' },
  { id:'raptors', name:'Manada de Raptores', cost:100, inc:11, n:7, c:'raptor', desc:'Rápidos y letales.' },
  { id:'cannons', name:'Súbditos de Asedio', cost:160, inc:18, n:5, c:'cannon', desc:'Artillería a distancia.' },
  { id:'herald',  name:'Heraldo de la Grieta', cost:260, inc:30, n:1, c:'herald', desc:'Un coloso aturdidor.' },
  { id:'cho',     name:"Cho'Gath", cost:420, inc:48, n:1, c:'chogath', desc:'El terror del Vacío.' },
  { id:'elder',   name:'Dragón Ancestral', cost:700, inc:80, n:1, c:'elder', desc:'La amenaza definitiva.' },
];
CREEPS.scuttle = { name:'Cangrejo Escurridizo', k:'scuttle', hp:120, dmg:9, aspd:1.1, range:1.5, speed:5.4, armor:4, melee:true, s:.9, bounty:0 };
CREEPS.chogath = { name:"Cho'Gath", k:'chogath', hp:3800, dmg:120, aspd:.65, range:2.6, speed:3, armor:30, melee:true, s:2.3, bounty:0, ability:{type:'nova',cd:6,dmg:140,r:3.8,stun:1.1,self:true,fx:'void'} };

export const waveScale = w => Math.pow(1.11, w - 1);
export const mercScale = w => 1 + 0.12 * (w - 1);
