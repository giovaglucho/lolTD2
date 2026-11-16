// Valida los datos de las legiones contra el catálogo del motor.
import { LEGIONS } from '../src/content/index.js';
import { DMG, ARM } from '../src/content/types.js';
const AB = 'spin nova volley beam chain heal shield buff strike stun poison dash pull taunt summon global stealth'.split(' ');
const PA = 'crit lifesteal cleave splash thorns nth rampup onhit_dot onhit_slow onhit_stun aura regen execute revive bossbane rage undying multishot'.split(' ');
const FX = 'spin frost fire beam quake heal slash rocket poison sun wind arcane void shadow blood holy lightning nature water star'.split(' ');
let bad = 0; const warn = m => { bad++; console.log('  ⚠', m); };
for (const L of LEGIONS) {
  console.log(`${L.name}: ${L.champions.length} campeones, tiers ${L.champions.map(c => c.tier).sort().join('')}`);
  for (const c of L.champions) {
    for (const k of ['id', 'name', 'title', 'tier', 'cost', 'role', 'hp', 'dmg', 'aspd', 'range', 'dmgType', 'armorType', 'ability', 'upgrades', 'model']) if (c[k] === undefined) warn(`${c.id}: falta ${k}`);
    if (!DMG[c.dmgType]) warn(`${c.id}: dmgType ${c.dmgType}`); if (!ARM[c.armorType]) warn(`${c.id}: armorType ${c.armorType}`);
    const chk = (a, where) => { if (!a) return; if (a.type && !AB.includes(a.type) && where.includes('ability')) warn(`${c.id} ${where}: tipo ${a.type}`); if (a.fx && !FX.includes(a.fx)) warn(`${c.id} ${where}: fx ${a.fx}`); };
    chk(c.ability, 'ability'); if (c.passive && !PA.includes(c.passive.type)) warn(`${c.id}: pasiva ${c.passive.type}`);
    for (const u of c.upgrades || []) { chk(u.ability, 'upgrade.ability'); if (u.passive && u.passive.type && !PA.includes(u.passive.type)) warn(`${c.id} upgrade: pasiva ${u.passive.type}`); if (!u.cost) warn(`${c.id} upgrade sin coste`); }
    if (!c.melee && !c.proj) warn(`${c.id}: a distancia sin proj`);
  }
}
console.log(bad ? `${bad} avisos` : 'OK sin avisos');
