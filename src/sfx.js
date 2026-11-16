let ctx = null, master = null, muted = false;
export function initAudio() { if (ctx) return; try { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = .35; master.connect(ctx.destination); } catch (e) {} }
export const setMuted = m => { muted = m; if (master) master.gain.value = m ? 0 : .35; };
function tone(f0, f1, dur, type = 'sine', vol = .3, delay = 0) { if (!ctx || muted) return; const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .02); }
function noise(dur, vol = .3, f = 1200, delay = 0) { if (!ctx || muted) return; const t = ctx.currentTime + delay, n = ctx.sampleRate * dur, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n); const s = ctx.createBufferSource(); s.buffer = b; const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = f; const g = ctx.createGain(); g.gain.value = vol; s.connect(fl); fl.connect(g); g.connect(master); s.start(t); }
let last = {}; const gate = (k, ms) => { const n = performance.now(); if (last[k] && n - last[k] < ms) return false; last[k] = n; return true; };
export const sfx = {
  click() { tone(660, 880, .08, 'triangle', .18); },
  place() { tone(180, 90, .18, 'sine', .4); noise(.12, .25, 900); tone(520, 780, .12, 'triangle', .15, .05); },
  sell() { tone(700, 300, .2, 'square', .12); },
  deny() { tone(160, 120, .18, 'sawtooth', .15); },
  hit() { if (gate('hit', 45)) { noise(.07, .18, 2200); tone(220, 110, .06, 'square', .08); } },
  boom() { if (gate('boom', 90)) { noise(.4, .4, 600); tone(110, 40, .4, 'sine', .35); } },
  magic() { if (gate('magic', 90)) { tone(500, 1400, .3, 'sine', .15); tone(750, 1800, .25, 'triangle', .07, .03); } },
  shoot() { if (gate('shoot', 60)) tone(900, 400, .09, 'triangle', .07); },
  death() { if (gate('death', 60)) { noise(.2, .15, 800); tone(300, 80, .22, 'sawtooth', .07); } },
  heal() { if (gate('heal', 120)) { tone(660, 990, .25, 'sine', .12); tone(990, 1320, .25, 'sine', .08, .08); } },
  horn() { tone(196, 196, .9, 'sawtooth', .22); tone(294, 294, .9, 'sawtooth', .16); tone(392, 392, 1.1, 'sawtooth', .12, .35); },
  victory() { [523, 659, 784, 1047].forEach((f, i) => tone(f, f, .5, 'triangle', .2, i * .18)); },
  defeat() { [330, 262, 196, 131].forEach((f, i) => tone(f, f * .9, .6, 'sawtooth', .16, i * .25)); },
  nexus() { if (gate('nexus', 150)) { tone(1200, 300, .15, 'sawtooth', .1); } },
};
