import './style.css';
import { Game } from './game.js';
import { UI } from './ui.js';
import { makePortraits } from './portraits.js';
import { initAudio } from './sfx.js';

const params = new URLSearchParams(location.search);
const canvas = document.getElementById('c');
let game, ui;
function boot() {
  const portraits = makePortraits();
  ui = new UI(portraits); game = new Game(canvas, ui); ui.bind(game); window.__game = game;
  document.getElementById('title').classList.add('ready');
  document.querySelectorAll('#title .go').forEach(b => b.onclick = () => { initAudio(); game.start({ hard: parseFloat(b.dataset.h) }); });
  if (params.get('auto')) game.start({ hard: 1 });
  let last = performance.now();
  const loop = now => { const dt = (now - last) / 1000; last = now; game.frame(dt); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}
setTimeout(boot, 30);
