# Esquema de contenido de Rift Legion (para autores de legiones)

Cada legión es un archivo `src/content/legions/<id>.js` con `export default { ... }`:

```js
import { base } from '../balance.js';
export default {
  id: 'demacia', name: 'Demacia', title: 'El Reino de la Justicia',
  color: 0x3a6fd8, accent: 0xf0c75e,               // colores de la legión (UI, retratos, plataforma)
  desc: 'Texto de 1-2 frases para el Códice.',
  lore: 'Párrafo de ambientación (español).',
  champions: [ /* 10 campeones */ ],
};
```

## Campeón
```js
{
  id: 'garen', name: 'Garen', title: 'El Poder de Demacia',
  tier: 3,                                  // 1..6  (costes: 60, 90, 120, 155, 195, 250)
  role: 'Tanque',                           // Tanque | Luchador | Asesino | Tirador | Mago | Apoyo
  ...base(3, 'Tanque', 0.9),                // cost, hp, dmg, aspd, range, speed, melee  → luego ajusta a mano (±20%)
  dmgType: 'asedio',                        // asedio | perforante | magico | puro      (ver types.js)
  armorType: 'fortificada',                 // ligera | natural | fortificada | arcana | inmaterial
  armor: 18,                                // armadura numérica 0..40 (reduce daño: 100/(100+armor))
  proj: { color: 0x9fe4ff, speed: 22, size: .16, shape: 'arrow' }, // solo a distancia. shape: orb|arrow|bullet|bolt|blade|rocket|star
  passive: { name: 'Perseverancia', desc: '...', type: 'regen', hps: 8 },           // opcional (ver catálogo)
  ability: { name: 'Juicio', desc: '...', type: 'spin', cd: 6, dmg: 75, r: 3.3, fx: 'spin', color: 0x8fd0ff },
  upgrades: [                               // 1 o 2 mejoras (estilo LTD2: la unidad se transforma)
    { id: 'garen_godking', name: 'Garen Dios-Rey', cost: 120, hp: 1.9, dmg: 1.9, aspd: 1.0, armor: 10,   // hp/dmg/aspd = multiplicadores; armor = suma
      desc: 'Qué cambia.', ability: { /* opcional: reemplaza/mejora la habilidad */ }, passive: { /* opcional */ } },
  ],
  quote: '"¡Por Demacia!"',                 // frase icónica (español)
  lore: '2-3 frases de lore fiel a LoL (español).',
  model: 'garen',                           // id del modelo 3D (src/models/champions/<legion>.js)
}
```
Todos los textos en **español**. Los nombres de habilidades usan la traducción oficial de LoL (es-ES/es-MX).

## Catálogo de habilidades activas (`ability.type`)
Todas aceptan `cd` (s), `fx` (efecto visual) y `color` (opcional). `dmg` se escala con las mejoras de la unidad.
| type | parámetros | efecto |
|---|---|---|
| `spin` | dmg, r, [hits, dur] | daño en área alrededor de sí (hits>1 = giro continuo, p. ej. Katarina/Garen) |
| `nova` | dmg, r, [stun, slow, slowT, self, tgtFar, delay] | explosión en el objetivo (o en sí si `self`), con aturdimiento/ralentización opcional |
| `volley` | dmg, n, [slow, slowT] | dispara a n enemigos a la vez |
| `beam` | dmg, len, w, [stun] | línea recta que atraviesa enemigos |
| `chain` | dmg, n, [decay] | rebota entre n enemigos (decay = factor por salto, 0.8) |
| `heal` | heal, range, [n] | cura al aliado más herido (n = número de aliados) |
| `shield` | amt, range, [dur, n, self] | escudo temporal al aliado más herido (o a sí mismo) |
| `buff` | stat ('aspd'\|'dmg'\|'armor'\|'speed'), amt (0.3 = +30%), r, dur | potencia aliados en radio |
| `strike` | dmg, [exec, execMul, stun] | golpe fuerte al objetivo; `exec`: umbral de vida para multiplicar |
| `stun` | dmg, stun | aturde al objetivo |
| `poison` | dps, t | daño en el tiempo al objetivo |
| `dash` | dmg, [range, stun, r] | salta al enemigo más lejano en `range` (def. 11) y golpea (área si r) |
| `pull` | dmg, [stun, range] | atrae al enemigo más lejano hasta sí (Blitzcrank, Thresh) |
| `taunt` | r, dur, [armor] | provoca: los enemigos en radio le atacan; gana armadura temporal |
| `summon` | unit:{name, hp, dmg, aspd, range, melee, model, dur, s}, [n] | invoca aliados temporales (Tibbers, torreta de Heimer) |
| `global` | dmg, r, [stun] | ataque al enemigo con más vida en todo el carril (definitiva global, p. ej. Jinx/Ezreal) |
| `stealth` | dur, mul | se vuelve invisible (no es objetivo) y su siguiente golpe hace ×mul |

## Catálogo de pasivas (`passive.type`)
| type | parámetros | efecto |
|---|---|---|
| `crit` | chance, mul | probabilidad de crítico |
| `lifesteal` | pct | robo de vida |
| `cleave` | pct, r | los ataques cuerpo a cuerpo dañan en área (pct del daño) |
| `splash` | pct, r | los proyectiles explotan en área |
| `thorns` | pct | devuelve pct del daño cuerpo a cuerpo recibido |
| `nth` | n, mul | cada n-ésimo ataque hace ×mul (Jhin: n=4) |
| `rampup` | per, max | +per velocidad de ataque por ataque, hasta max (Jinx) |
| `onhit_dot` | dps, t | los ataques queman/envenenan |
| `onhit_slow` | amt, t | los ataques ralentizan |
| `onhit_stun` | chance, t | probabilidad de aturdir |
| `aura` | stat, amt, r | aliados en radio ganan stat (aspd/dmg/armor) mientras viva |
| `regen` | hps | regeneración por segundo |
| `execute` | below, mul | más daño a enemigos con poca vida |
| `revive` | pct | revive una vez por oleada con pct de vida (Anivia, Zilean) |
| `bossbane` | mul | más daño a jefes/unidades grandes |
| `rage` | below, aspd | por debajo de `below` de vida gana velocidad de ataque (Tryndamere/Olaf) |
| `undying` | dur | al morir, sigue luchando dur s (Tryndamere/Sion) |
| `multishot` | n, pct | cada ataque golpea a n objetivos extra al pct del daño |

## Efectos visuales (`fx`)
`spin frost fire beam quake heal slash rocket poison sun wind arcane void shadow blood holy lightning nature water star` — y `color` opcional para teñirlos.

## Modelo 3D
`model` apunta a una función en `src/models/champions/<legion>.js`:
```js
import { THREE, M, glow, gld, cloth, metal, hairM, U, P, grp, humanoid, hairCap, bangs, brows, pauldron, cape, skirt, sword, tube, taper, spindle, ext, merged, X, XAB, lathe, kf, S, SP } from '../kit.js';
export const MODELS = {
  garen(Up, opts) { const h = humanoid({...}); /* ... */ return h; },   // Up = versión mejorada
};
```
`rig.style`: 'swing' | 'cast' | 'bow' | 'gun' | 'slam' | 'blow' (animación de ataque genérica). Para animaciones propias define
`rig.anim = (model, rig, st, t, dt, w, ph) => { ... }` (st.atk 0..1 progreso de ataque, st.cast 0/1, st.moving, w = peso de caminar).
