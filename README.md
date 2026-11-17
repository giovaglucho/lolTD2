# Rift Legion TD

MVP de un **Legion TD 2** ambientado en **League of Legends**, hecho con Three.js + Vite + Node (WebSocket).

## Modos
- **Contra la IA**: 1 vs 1 o 2 vs 2 (con un aliado IA), dificultades *Fácil, Normal, Difícil, Locura*.
- **En línea 2 vs 2** (servidor autoritativo):
  - **Clásico**: sin puntuación; si en 15 s no hay 4 jugadores, se completa con bots.
  - **Ranked**: 4 jugadores reales, MMR Elo por equipo y ligas Hierro → Retador. Clasificación top 10.
  - Si alguien se desconecta, un bot toma su línea. Botón *Salir* = rendición.

## Mecánicas (adaptadas de Legion TD 2)
| Legion TD 2 | Rift Legion |
|---|---|
| Luchadores en tu cuadrícula | 12 campeones (Garen, Ashe, Annie, Lux, Malphite, Soraka, Darius, Jinx, Leona, Teemo, Yasuo, Ezreal) con habilidades |
| Mejorar unidad | Skin de prestigio (Garen Dios-Rey, Jinx Star Guardian…): ×1.85 vida y daño |
| Trabajadores → mythium | **Poros** → **Esencia Hextech** |
| Mercenarios (mythium, +ingresos) | Cangrejo, Larvas del Vacío, Raptores, Asedio, Heraldo, Cho'Gath, Dragón Ancestral |
| Rey compartido + mejoras | **Nexo** del equipo: Vida / Ataque / Regeneración |
| 20 oleadas | Súbditos, campamentos de jungla, dragones, Heraldo, Dragón Ancestral, Barón Nashor |
| Venta 100 % en la misma ronda | Reembolso completo si vendes en la ronda de compra, 50 % después |
| Valor recomendado | Indicador ⚔ valor vs. recomendado |

## Ejecutar
```bash
npm install
npm start            # compila y levanta el servidor en http://localhost:8787 (juego + multijugador)
npm run dev          # desarrollo (Vite :5173, con proxy /ws → :8787; arranca también `npm run server`)
npm run sim -- normal dificil 2 6   # simulación headless de equilibrado: IA A vs IA B, carriles, partidas
```
`?q=low` reduce la calidad gráfica. Variables del servidor: `PORT`, `BOT_FILL_MS`, `DATA_DIR`, `SIM_SPEED` (pruebas).

Controles: clic colocar/seleccionar · U mejorar · X / clic der. vender · 1-9,0,-,= campeones · Espacio listo · Tab/C cambiar de línea · WASD/rueda cámara · F velocidad y P pausa (solo vs IA).

## Arquitectura
- `src/sim.js` simulación determinista sin three.js (la usan el navegador y el servidor) + serialización.
- `src/ai.js` IA por dificultad. `server/server.js` estáticos + WebSocket, matchmaking, MMR (`server/data/ratings.json`).
- `src/net.js` conexión y `NetSim` (espejo del estado del servidor con la misma API que `Sim`).
- `src/models.js` modelos procedurales, `src/world.js` escenario, `src/fx.js` efectos, `src/game.js` render/entrada, `src/ui.js` HUD y menús.

Limitaciones del MVP: identidad por nombre (sin cuentas), un único servidor en memoria, sin reconexión a la misma partida, una sola "legión" de campeones (sin elegir facción).

## Multijugador en línea (Cloudflare + PartyServer, para Vercel)
Vercel solo sirve la web; el 2v2 en línea corre en un **Worker de Cloudflare con Durable Objects** usando [PartyServer](https://github.com/cloudflare/partykit/tree/main/packages/partyserver) (el sucesor de PartyKit, cuya plataforma alojada cerró el 23-oct-2026). El plan gratis de Workers lo incluye.
- `cloudflare/lobby.js` — cola Clásico/Ranked, perfiles, MMR Elo y clasificación (`/parties/lobby/global`).
- `cloudflare/match.js` — una partida autoritativa por sala (`/parties/match/<id>`), con la misma simulación `src/sim.js`.
- `wrangler.jsonc` — configuración.

```bash
npm run cf:dev                          # servidor local en 127.0.0.1:1999
# en otra terminal: npm run dev, y en Ajustes → "URL de servidor propio" escribe 127.0.0.1:1999
npx wrangler login && npm run cf:deploy # publica → rift-legion.<subdominio>.workers.dev
VITE_SERVER_HOST=rift-legion.<subdominio>.workers.dev npm run build   # la web ya apunta a ese servidor
HOST=rift-legion.<subdominio>.workers.dev node tools/cftest.mjs ranked  # prueba con 4 clientes simulados
```
Sin `VITE_SERVER_HOST` el menú muestra "Servidores próximamente" (o usa la URL de Ajustes / `npm start`).
