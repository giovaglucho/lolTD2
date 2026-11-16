// Persistencia local del menú (perfil + ajustes). Todo con try/catch: si localStorage falla, se trabaja en memoria.
const KP = 'rl_profile_v1', KS = 'rl_settings_v1';
const mem = {};
const read = k => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return mem[k] ? JSON.parse(mem[k]) : null; } };
const write = (k, v) => { const s = JSON.stringify(v); mem[k] = s; try { localStorage.setItem(k, s); } catch {} };

export const DEFAULT_SETTINGS = { quality: 'high', volume: 0.7, sfx: true, music: true, dmgNumbers: true, camSpeed: 1, serverUrl: '', showFps: false, edgePan: true };
const DEFAULT_PROFILE = () => ({
  name: 'Invocador', avatar: '', level: 1, xp: 0, essence: 600, mmr: 1200,
  stats: { games: 0, wins: 0, losses: 0, kills: 0, bestWave: 0, byLegion: {} },
  history: [], owned: { avatars: [], borders: ['default'], titles: ['novato'] },
  border: 'default', title: 'novato', guild: null, missions: {}, created: Date.now(),
});

// Curva de nivel: nivel n → n+1 cuesta 200 + 60·(n−1) XP
export const xpForLevel = n => 200 + 60 * (n - 1);
export function levelFromXp(xp) {
  let level = 1, rest = Math.max(0, xp | 0);
  while (rest >= xpForLevel(level) && level < 500) { rest -= xpForLevel(level); level++; }
  const need = xpForLevel(level);
  return { level, cur: rest, need, pct: rest / need };
}

let profileCache = null;
export function getProfile() {
  if (profileCache) return profileCache;
  const d = DEFAULT_PROFILE(), p = read(KP) || {};
  const out = { ...d, ...p, stats: { ...d.stats, ...(p.stats || {}) }, owned: { ...d.owned, ...(p.owned || {}) } };
  if (!Array.isArray(out.history)) out.history = [];
  out.level = levelFromXp(out.xp).level;
  return (profileCache = out);
}
export function saveProfile(p) { profileCache = p; p.level = levelFromXp(p.xp).level; write(KP, p); emit(); return p; }
export function getSettings() { return { ...DEFAULT_SETTINGS, ...(read(KS) || {}) }; }
export function saveSettings(s) { const v = { ...DEFAULT_SETTINGS, ...s }; write(KS, v); emit(); return v; }

// Recompensas por defecto si la partida no las trae
export function defaultRewards(res) {
  const w = res.wave | 0, win = !!res.win;
  return { xp: Math.round((win ? 160 : 70) + w * 12 + (res.ranked ? 40 : 0)), essence: Math.round((win ? 70 : 25) + w * 3) };
}

// Registra una partida: suma XP/esencia/estadísticas e historial. Devuelve las recompensas aplicadas.
export function recordMatch(res = {}) {
  const p = getProfile(), r = { ...defaultRewards(res), ...(res.rewards || {}) };
  const before = levelFromXp(p.xp);
  p.xp += r.xp | 0; p.essence += r.essence | 0;
  const after = levelFromXp(p.xp);
  const levelBonus = (after.level - before.level) * 100; // +100 de esencia por nivel subido
  p.essence += levelBonus;
  const s = p.stats; s.games++; if (res.win) s.wins++; else s.losses++;
  s.kills += res.kills | 0; s.bestWave = Math.max(s.bestWave, res.wave | 0);
  if (res.legion) { const b = s.byLegion[res.legion] || (s.byLegion[res.legion] = { games: 0, wins: 0, bestWave: 0 }); b.games++; if (res.win) b.wins++; b.bestWave = Math.max(b.bestWave || 0, res.wave | 0); }
  const md = typeof res.mmrDelta === 'number' ? res.mmrDelta : (res.ranked ? (res.win ? 18 : -14) : 0);
  p.mmr = Math.max(0, (p.mmr || 1200) + md);
  p.history.unshift({ t: Date.now(), win: !!res.win, wave: res.wave | 0, mode: res.mode || '1v1', legion: res.legion || '', kills: res.kills | 0, value: res.value | 0, mmrDelta: md, diff: res.diff || '' });
  p.history = p.history.slice(0, 20);
  // misiones
  const m = p.missions || (p.missions = {});
  m.wins = (m.wins | 0) + (res.win ? 1 : 0); m.games = (m.games | 0) + 1;
  saveProfile(p);
  return { ...r, levelBonus, mmrDelta: md, before, after, leveledUp: after.level > before.level };
}

// Suscripción a cambios (para refrescar el panel lateral)
const subs = new Set();
export const onStoreChange = fn => (subs.add(fn), () => subs.delete(fn));
function emit() { subs.forEach(f => { try { f(); } catch (e) { console.error(e); } }); }

export const store = { getProfile, saveProfile, getSettings, saveSettings, recordMatch, levelFromXp, xpForLevel, onStoreChange, defaultRewards };
