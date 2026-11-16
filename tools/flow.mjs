// Prueba de flujo completo en navegador: menú → solo → carga → partida → resultado → menú.
import { chromium } from 'file:///opt/node22/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } }); const errs = [];
p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => m.type() === 'error' && errs.push('ERR ' + m.text()));
const shot = async n => { await p.screenshot({ path: `/tmp/claude-0/shots/flow_${n}.png`, timeout: 120000 }); console.log('shot', n, errs.length ? errs.splice(0).join(' | ') : 'ok'); };
await p.goto((process.env.URL || 'http://localhost:5199/') + '?q=low'); await p.waitForTimeout(9000); await shot('1menu');
await p.evaluate(() => window.__startLocalTest = true);
// usar la api del menú directamente (la misma que llaman los botones de "Solo")
await p.evaluate(() => document.querySelector('#menu-root') && (window.__api = 1));
await p.evaluate(() => document.querySelector('[data-go=solo]').click()); await p.waitForTimeout(3000); await shot('2solo');
const ok = await p.evaluate(() => { const b = [...document.querySelectorAll('#menu-root button')].find(x => /^\s*jugar\s*$/i.test(x.textContent)); if (b) b.click(); return !!b; }); if (!ok) console.log('no hay botón JUGAR');
await p.waitForTimeout(1500); await shot('3loading'); await p.waitForTimeout(6000);
await p.evaluate(() => { const g = window.__game, s = g.sim, me = s.P(g.me); me.gold = 3000; me.roll.forEach((id, i) => s.place(g.me, id, i % 10, i < 5 ? 0 : 3)); g.cam.tdist = 30; g.ui.refresh(); });
await p.waitForTimeout(2500); await shot('4game');
await p.evaluate(() => { const g = window.__game, s = g.sim; s.setReady(g.me, true); for (let i = 0; i < 300; i++) { s.update(.05); g.handleEvents(); } });
await p.waitForTimeout(2500); await shot('5combat');
await p.evaluate(() => { const g = window.__game; g.sim.finish(g.sim.P(g.me).team, 'test'); g.handleEvents(); });
await p.waitForTimeout(5000); await shot('6result');
await p.evaluate(() => { const b = [...document.querySelectorAll('#menu-root button')].find(x => /continuar/i.test(x.textContent)); if (b) b.click(); }); await p.waitForTimeout(4000); await shot('7back');
await b.close();
