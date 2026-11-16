# Rift Legion TD

Un *Legion TD 2* ambientado en **League of Legends**, hecho con Three.js + Vite.

- Coloca campeones (Garen, Ashe, Annie, Lux, Malphite, Soraka, Darius, Jinx, Leona, Teemo, Yasuo, Ezreal) en tu plataforma.
- Contrata **Poros** (economía) y envía **mercenarios** (Cangrejos, Larvas del Vacío, Heraldo, Cho'Gath, Dragón Ancestral…) a la línea rival.
- Sobrevive 20 oleadas de monstruos de la Grieta (Gromp, Krugs, Dragones, Heraldo, Barón Nashor…) y protege tu Nexo.

```bash
npm install
npm run dev      # http://localhost:5173  (?q=low para equipos modestos)
npm run build
npm run sim      # simulación headless de equilibrado (sin render)
```

Controles: clic = colocar · clic der./X = vender · 1-9,0,-,= elegir campeón · Espacio = listo · Tab = ver línea rival · WASD/rueda = cámara · F = velocidad · P = pausa · B = comprar poro.

Arquitectura: `src/sim.js` (simulación pura, sin three), `src/models.js` (campeones/monstruos procedurales), `src/world.js` (escena, texturas procedurales, post-proceso), `src/fx.js` (partículas, rayos, texto), `src/game.js` (render + input), `src/ui.js` (HUD).
