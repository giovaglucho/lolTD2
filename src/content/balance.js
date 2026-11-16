// Presupuesto de estadísticas por nivel (T1–T6) y rol. Los datos de cada campeón parten de aquí
// y se ajustan ±20% para dar personalidad. Mantiene las legiones equilibradas entre sí.
export const TIER_COST = { 1: 60, 2: 90, 3: 120, 4: 155, 5: 195, 6: 250 };
// por cada 100 de oro: vida, DPS, alcance típico, velocidad
const ROLE = {
  Tanque:   { hp: 620, dps: 26, range: 1.9, speed: 3.2, melee: true },
  Luchador: { hp: 450, dps: 40, range: 2.0, speed: 3.6, melee: true },
  Asesino:  { hp: 300, dps: 56, range: 1.8, speed: 4.4, melee: true },
  Tirador:  { hp: 210, dps: 46, range: 8.5, speed: 3.3, melee: false },
  Mago:     { hp: 220, dps: 40, range: 7.5, speed: 3.1, melee: false },
  Apoyo:    { hp: 260, dps: 22, range: 7.0, speed: 3.2, melee: false },
};
export const ROLES = Object.keys(ROLE);
// base(tier, rol, aspd) → { cost, hp, dmg, aspd, range, speed, melee }
export function base(tier, role, aspd = 1) {
  const cost = TIER_COST[tier], R = ROLE[role], k = cost / 100 * (1 + (tier - 1) * .04); // los niveles altos rinden algo más por oro
  return { cost, hp: Math.round(R.hp * k), dmg: Math.round(R.dps * k / aspd), aspd, range: R.range, speed: R.speed, melee: R.melee };
}
// Mejora típica: cuesta ≈ el coste base y multiplica vida/daño ×1.9 (ajustable por campeón)
export const UPG = { costMul: 1.0, statMul: 1.9 };
