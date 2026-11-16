// Publica dist/ en Vercel usando la API (sin CLI). Token: VERCEL_TOKEN o inyectado por el proxy.
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
const TOKEN = process.env.VERCEL_TOKEN || 'proxy-injected', NAME = process.env.VERCEL_PROJECT || 'rift-legion-td', DIST = path.resolve('dist');
const api = async (url, opt = {}) => { const r = await fetch('https://api.vercel.com' + url, { ...opt, headers: { Authorization: 'Bearer ' + TOKEN, ...(opt.headers || {}) } }); const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = { raw: t }; } if (!r.ok) throw new Error(`${r.status} ${url}: ${t.slice(0, 300)}`); return j; };
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const files = walk(DIST).map(f => { const buf = fs.readFileSync(f); return { file: path.relative(DIST, f).split(path.sep).join('/'), sha: crypto.createHash('sha1').update(buf).digest('hex'), size: buf.length, buf }; });
console.log(`Subiendo ${files.length} archivos (${(files.reduce((a, f) => a + f.size, 0) / 1e6).toFixed(1)} MB)…`);
for (const f of files) await api('/v2/files', { method: 'POST', headers: { 'Content-Type': 'application/octet-stream', 'x-vercel-digest': f.sha, 'Content-Length': String(f.size) }, body: f.buf });
const dep = await api('/v13/deployments?skipAutoDetectionConfirmation=1', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
  name: NAME, target: 'production', files: files.map(({ file, sha, size }) => ({ file, sha, size })),
  projectSettings: { framework: null, buildCommand: null, installCommand: null, outputDirectory: null },
}) });
console.log('Despliegue', dep.id, dep.url, '→ estado', dep.readyState);
for (let i = 0; i < 60; i++) { const d = await api('/v13/deployments/' + dep.id); if (d.readyState === 'READY' || d.readyState === 'ERROR') { console.log('Estado final:', d.readyState); console.log('URL:', 'https://' + d.url); console.log('Alias:', (d.alias || []).map(a => 'https://' + a).join(' ')); break; } await new Promise(r => setTimeout(r, 3000)); }
