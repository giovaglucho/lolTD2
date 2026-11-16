import { chromium } from 'file:///opt/node22/lib/node_modules/playwright/index.mjs';
const [,, url, out, wait='4000', script=''] = process.argv;
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const errs = []; p.on('console', m => { if (['error','warning'].includes(m.type())) errs.push(m.type()+': '+m.text()); }); p.on('pageerror', e => errs.push('PAGEERR '+e.message));
await p.goto(url); await p.waitForTimeout(+wait);
if (script) { await p.evaluate(script); await p.waitForTimeout(3000); }
await p.screenshot({ path: out, timeout: 120000 });
console.log(errs.slice(0,12).join('\n') || 'no errors'); await b.close();
