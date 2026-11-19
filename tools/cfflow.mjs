// Un navegador real en cola Clásico contra Cloudflare/PartyServer local (rellena con bots) → partida → fin.
import { chromium } from 'file:///opt/node22/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } }); const errs = [];
p.on('pageerror', e => errs.push('PAGEERR ' + e.stack.split('\n').slice(0,4).join(' <- '))); p.on('console', m => m.type() === 'error' && errs.push('ERR ' + m.text()));
const shot = async n => { await p.screenshot({ path: `/tmp/claude-0/shots/pk_${n}.png`, timeout: 120000 }); console.log('shot', n, errs.length ? errs.splice(0).join(' | ') : 'ok'); };
await p.addInitScript(() => localStorage.setItem('rl_settings_v1', JSON.stringify({ serverUrl: '127.0.0.1:1999', quality: 'low', volume: .7, sfx: true, dmgNumbers: true, camSpeed: 1 })));
await p.goto('http://localhost:5199/?q=low'); await p.waitForTimeout(9000);
await p.evaluate(() => document.querySelector('[data-go=multi]').click()); await p.waitForTimeout(2500); await shot('1multi');
await p.evaluate(() => { document.querySelector('#mqLegion').value = 'freljord'; document.querySelector('#mqLegion').dispatchEvent(new Event('change')); document.querySelector('[data-q=classic]').click(); });
await p.waitForTimeout(4000); await shot('2cola');
await p.waitForFunction(() => window.__game && window.__game.started, null, { timeout: 60000 }); await p.waitForTimeout(8000); await shot('3partida');
await p.evaluate(() => { const g = window.__game, s = g.sim, me = s.P(g.me); console.log('legion', me.legion); me.roll.slice(0, 4).forEach((id, i) => s.place(g.me, id, 3 + i, 0)); g.ui.refresh(); });
await p.waitForTimeout(3000); await shot('4comandos');
console.log(await p.evaluate(() => { const g = window.__game, s = g.sim; return JSON.stringify({ me: g.me, legion: s.P(g.me).legion, fighters: s.ents.filter(e => e.kind === 'fighter' && e.lane === g.me).length, phase: s.phase, wave: s.wave + 1 }); }));
await b.close();
