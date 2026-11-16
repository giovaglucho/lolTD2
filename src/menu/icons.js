// Iconos SVG propios (sin marcas reales): UI, emblemas de legión, hechizos y estrategias.
const svg = (body, vb = '0 0 24 24', extra = '') => `<svg viewBox="${vb}" class="ico" ${extra} aria-hidden="true">${body}</svg>`;
const S = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';

export const UI = {
  power: svg(`<path ${S} d="M12 3v8M6.3 6.6a8 8 0 1 0 11.4 0"/>`),
  gear: svg(`<path ${S} d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"/><path ${S} d="M19.4 13.5l1.6 1.2-2 3.4-1.9-.7a7.6 7.6 0 0 1-2.1 1.2L14.6 21h-4l-.4-2.4a7.6 7.6 0 0 1-2.1-1.2l-1.9.7-2-3.4 1.6-1.2a7.7 7.7 0 0 1 0-2.4L3.3 9.9l2-3.4 1.9.7a7.6 7.6 0 0 1 2.1-1.2L9.6 3h4l.4 2.4a7.6 7.6 0 0 1 2.1 1.2l1.9-.7 2 3.4-1.6 1.2a7.7 7.7 0 0 1 0 2.4z"/>`),
  user: svg(`<circle ${S} cx="12" cy="8" r="4"/><path ${S} d="M4 21c1.2-4 4.2-6 8-6s6.8 2 8 6"/>`),
  book: svg(`<path ${S} d="M4 5.5C6.5 4 9.5 4 12 6c2.5-2 5.5-2 8-.5V19c-2.5-1.5-5.5-1.5-8 .5-2.5-2-5.5-2-8-.5z"/><path ${S} d="M12 6v13.5"/>`),
  chat: svg(`<path ${S} d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-6l-4 3.5V17H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/><circle cx="9" cy="11" r="1.2" fill="currentColor"/><circle cx="15" cy="11" r="1.2" fill="currentColor"/>`),
  mail: svg(`<rect ${S} x="3" y="5.5" width="18" height="13" rx="2"/><path ${S} d="M3.5 7l8.5 6 8.5-6"/>`),
  stream: svg(`<path ${S} d="M5 3h15v11l-4 4h-4l-3 3v-3H5z"/><path ${S} d="M11 7.5v4M15.5 7.5v4"/>`),
  forum: svg(`<circle ${S} cx="12" cy="13.5" r="6.5"/><circle cx="9.5" cy="13" r="1.1" fill="currentColor"/><circle cx="14.5" cy="13" r="1.1" fill="currentColor"/><path ${S} d="M9.5 16.2c1.5 1 3.5 1 5 0M12 7l1.2-4 3.3.8"/><circle ${S} cx="17.6" cy="4.2" r="1.3"/>`),
  news: svg(`<path ${S} d="M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2h-1"/><path ${S} d="M7 9h7M7 12.5h7M7 16h4"/>`),
  back: svg(`<path ${S} d="M15 5l-7 7 7 7"/>`),
  next: svg(`<path ${S} d="M9 5l7 7-7 7"/>`),
  search: svg(`<circle ${S} cx="10.5" cy="10.5" r="6"/><path ${S} d="M15 15l5 5"/>`),
  grid: svg(`<rect ${S} x="4" y="4" width="6.5" height="6.5"/><rect ${S} x="13.5" y="4" width="6.5" height="6.5"/><rect ${S} x="4" y="13.5" width="6.5" height="6.5"/><rect ${S} x="13.5" y="13.5" width="6.5" height="6.5"/>`),
  list: svg(`<path ${S} d="M8 6h12M8 12h12M8 18h12"/><circle cx="4.5" cy="6" r="1.2" fill="currentColor"/><circle cx="4.5" cy="12" r="1.2" fill="currentColor"/><circle cx="4.5" cy="18" r="1.2" fill="currentColor"/>`),
  rotate: svg(`<path ${S} d="M20 12a8 8 0 1 1-2.4-5.7M20 4v4.5h-4.5"/>`),
  swords: svg(`<path ${S} d="M4 4l9 9M4 4h4M4 4v4M20 4l-9 9M20 4h-4M20 4v4M7 17l-3 3M17 17l3 3M6 14l4 4M18 14l-4 4"/>`),
  wave: svg(`<path ${S} d="M3 15c3 0 3-4 6-4s3 4 6 4 3-4 6-4"/><path ${S} d="M3 19c3 0 3-4 6-4s3 4 6 4 3-4 6-4" opacity=".5"/><path ${S} d="M12 3l2 4-2 2-2-2z"/>`),
  coin: svg(`<circle ${S} cx="12" cy="12" r="8"/><path ${S} d="M12 7.5v9M9.5 10a2.5 2 0 0 1 2.5-1.5c1.5 0 2.5.7 2.5 1.6 0 2.3-5 1.2-5 3.6 0 1 1 1.8 2.5 1.8a2.6 2 0 0 0 2.5-1.5"/>`),
  plus: svg(`<path ${S} d="M12 5v14M5 12h14"/>`),
  lock: svg(`<rect ${S} x="5" y="11" width="14" height="9" rx="2"/><path ${S} d="M8 11V8a4 4 0 0 1 8 0v3"/>`),
  check: svg(`<path ${S} d="M5 12.5l4.5 4.5L19 7.5"/>`),
  trophy: svg(`<path ${S} d="M7 4h10v4a5 5 0 0 1-10 0zM7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5M12 13v4M8.5 20h7M9.5 17h5v3h-5z"/>`),
  shield: svg(`<path ${S} d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z"/>`),
  star: svg(`<path d="M12 2.8l2.6 6 6.4.6-4.9 4.3 1.5 6.4L12 16.8 6.4 20.1l1.5-6.4L3 9.4l6.4-.6z" fill="currentColor"/>`),
  essence: svg(`<path d="M12 2.5l5.5 7.5L12 21.5 6.5 10z" fill="currentColor" opacity=".9"/><path d="M12 2.5l2 7.5-2 11.5-2-11.5z" fill="#fff" opacity=".45"/>`),
  friends: svg(`<circle ${S} cx="9" cy="8" r="3.5"/><path ${S} d="M2.5 20c.8-3.5 3.3-5.5 6.5-5.5s5.7 2 6.5 5.5"/><circle ${S} cx="17" cy="9" r="2.7"/><path ${S} d="M16.5 14.5c2.6 0 4.4 1.6 5 4.5"/>`),
  play: svg(`<path d="M8 5l11 7-11 7z" fill="currentColor"/>`),
  dice: svg(`<rect ${S} x="4" y="4" width="16" height="16" rx="3"/><circle cx="8.5" cy="8.5" r="1.4" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.4" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.4" fill="currentColor"/>`),
  globe: svg(`<circle ${S} cx="12" cy="12" r="8.5"/><path ${S} d="M3.5 12h17M12 3.5c2.5 2.5 3.5 5.5 3.5 8.5s-1 6-3.5 8.5c-2.5-2.5-3.5-5.5-3.5-8.5s1-6 3.5-8.5z"/>`),
  bolt: svg(`<path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H12z" fill="currentColor"/>`),
  heart: svg(`<path d="M12 20.5S3.5 15 3.5 9A4.5 4.5 0 0 1 12 6.5 4.5 4.5 0 0 1 20.5 9c0 6-8.5 11.5-8.5 11.5z" fill="currentColor"/>`),
  timer: svg(`<circle ${S} cx="12" cy="13" r="7.5"/><path ${S} d="M12 9v4.5l3 2M9.5 2.5h5"/>`),
};

// ───────── emblemas de legión (viewBox 0 0 64 64, rellenos) ─────────
const E = {
  demacia: `<path d="M32 6l16 6v16c0 13-8 22-16 28-8-6-16-15-16-28V12z" fill="currentColor" opacity=".22"/><path d="M32 6l16 6v16c0 13-8 22-16 28-8-6-16-15-16-28V12z" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M32 14v34M25 22h14" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/><path d="M14 20C7 22 4 28 4 34c5-3 8-3 11-1M50 20c7 2 10 8 10 14-5-3-8-3-11-1" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>`,
  noxus: `<path d="M32 4l7 14 15-4-8 13 12 9-15 2 2 16-13-10-13 10 2-16-15-2 12-9-8-13 15 4z" fill="currentColor" opacity=".25"/><path d="M32 4l7 14 15-4-8 13 12 9-15 2 2 16-13-10-13 10 2-16-15-2 12-9-8-13 15 4z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M24 24l8 22 8-22-8 6z" fill="currentColor"/>`,
  jonia: `<path d="M32 8c6 8 8 16 0 30-8-14-6-22 0-30z" fill="currentColor"/><path d="M32 38C26 28 16 24 8 26c4 9 13 14 24 12zM32 38c6-10 16-14 24-12-4 9-13 14-24 12z" fill="currentColor" opacity=".7"/><path d="M14 46c10 6 26 6 36 0" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="M20 53c8 3 16 3 24 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".7"/>`,
  freljord: `<g stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M32 5v54M8.6 18.5l46.8 27M8.6 45.5l46.8-27"/><path d="M26 10l6 6 6-6M26 54l6-6 6 6M10 26l8 2-2 8M54 38l-8-2 2-8M10 38l8-2-2-8M54 26l-8 2 2 8"/></g><circle cx="32" cy="32" r="6" fill="currentColor"/>`,
  piltover: `<path d="M32 6l4 6 7-2 1 7 7 1-2 7 6 4-6 4 2 7-7 1-1 7-7-2-4 6-4-6-7 2-1-7-7-1 2-7-6-4 6-4-2-7 7-1 1-7 7 2z" fill="currentColor" opacity=".25" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M32 20l10.4 6v12L32 44l-10.4-6V26z" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="32" cy="32" r="4" fill="currentColor"/>`,
  targon: `<path d="M4 56l18-28 8 10 10-26 20 44z" fill="currentColor" opacity=".3" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M40 4l2.5 6.5L49 13l-6.5 2.5L40 22l-2.5-6.5L31 13l6.5-2.5z" fill="currentColor"/><circle cx="18" cy="12" r="2.5" fill="currentColor"/><circle cx="54" cy="24" r="1.8" fill="currentColor"/>`,
  invocador: `<path d="M32 4l24 14v28L32 60 8 46V18z" fill="currentColor" opacity=".18" stroke="currentColor" stroke-width="2.4"/><path d="M14 32c6-9 12-12 18-12s12 3 18 12c-6 9-12 12-18 12s-12-3-18-12z" fill="none" stroke="currentColor" stroke-width="2.6"/><circle cx="32" cy="32" r="6.5" fill="currentColor"/><circle cx="32" cy="32" r="2.5" fill="#0a0e18"/>`,
  random: `<path d="M32 4l24 14v28L32 60 8 46V18z" fill="currentColor" opacity=".18" stroke="currentColor" stroke-width="2.4"/><path d="M24 24c0-5 4-8 8.5-8 5 0 8.5 3 8.5 7.5 0 6-8 6.5-8 12.5" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="33" cy="45" r="3" fill="currentColor"/>`,
};
export function emblem(id, color = 'currentColor', size = '') {
  const body = E[id] || `<path d="M32 4l24 14v28L32 60 8 46V18z" fill="currentColor" opacity=".25" stroke="currentColor" stroke-width="2.4"/><text x="32" y="41" text-anchor="middle" font-size="24" font-weight="700" fill="currentColor" font-family="Oswald, sans-serif">${String(id || '?').slice(0, 1).toUpperCase()}</text>`;
  return `<svg viewBox="0 0 64 64" class="emb" style="color:${color}${size ? `;width:${size};height:${size}` : ''}" aria-hidden="true">${body}</svg>`;
}

// ───────── hechizos de invocador y estrategias de Mente maestra ─────────
const G = {
  ignite: `<path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-4-1-6 1-9z" fill="currentColor"/>`,
  heal: `<path d="M9.5 3h5v6.5H21v5h-6.5V21h-5v-6.5H3v-5h6.5z" fill="currentColor"/>`,
  barrier: `<path d="M12 2.5l8 3.5v6c0 5-3.7 8.6-8 9.5-4.3-.9-8-4.5-8-9.5V6z" fill="currentColor" opacity=".35"/><path d="M12 2.5l8 3.5v6c0 5-3.7 8.6-8 9.5-4.3-.9-8-4.5-8-9.5V6z" fill="none" stroke="currentColor" stroke-width="2"/>`,
  exhaust: `<path d="M5 15a4 4 0 0 1 1-7.9A5.5 5.5 0 0 1 16.6 6 4.5 4.5 0 0 1 19 15z" fill="currentColor"/><path d="M7 18.5l-1 2.5M12 18.5l-1 2.5M17 18.5l-1 2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  smite: UI.bolt.replace(/<\/?svg[^>]*>/g, ''),
  ghost: `<path d="M12 3a7 7 0 0 0-7 7v11l2.5-2 2.3 2 2.2-2 2.2 2 2.3-2 2.5 2V10a7 7 0 0 0-7-7z" fill="currentColor"/><circle cx="9.5" cy="10" r="1.5" fill="#0a0e18"/><circle cx="14.5" cy="10" r="1.5" fill="#0a0e18"/>`,
  cleanse: `<path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" fill="currentColor"/>`,
  flash: `<circle cx="12" cy="12" r="5" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></g>`,
  teleport: `<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="4 2.5"/><circle cx="12" cy="12" r="4.5" fill="currentColor"/>`,
  clarity: `<path d="M12 3l6 8-6 10-6-10z" fill="currentColor" opacity=".9"/><path d="M12 3l2 8-2 10-2-10z" fill="#fff" opacity=".4"/>`,
  // estrategias
  greed: `<ellipse cx="12" cy="17" rx="7" ry="2.6" fill="currentColor" opacity=".6"/><ellipse cx="12" cy="13" rx="7" ry="2.6" fill="currentColor" opacity=".8"/><ellipse cx="12" cy="9" rx="7" ry="2.6" fill="currentColor"/>`,
  piggy: `<path d="M4 12c0-4 4-6.5 8.5-6.5 2 0 3.7.4 5 1.2L20 5v4c.8.8 1.3 1.8 1.4 3H22v3h-1.2c-.6 1.3-1.6 2.3-2.8 3V21h-3v-2.3a12 12 0 0 1-4 0V21H8v-3c-2.4-1.3-4-3.4-4-6z" fill="currentColor"/><circle cx="16.5" cy="10.5" r="1" fill="#0a0e18"/>`,
  castle: `<path d="M3 21V9h3v2h2V9h3v2h2V9h3v2h2V9h3v12h-7v-4a2 2 0 0 0-4 0v4z" fill="currentColor"/><path d="M11 3h4l-1.3 1.5L15 6h-4z" fill="currentColor"/><path d="M11 3v6" stroke="currentColor" stroke-width="1.5"/>`,
  scrap: `<path d="M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zm0 2.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" fill="currentColor"/><g stroke="currentColor" stroke-width="3"><path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/></g>`,
  chaos: UI.dice.replace(/<\/?svg[^>]*>/g, ''),
  cartel: `<path d="M8 3h8l-2 3.5c3.5 1.5 6 5.3 6 9 0 3.5-3.5 5.5-8 5.5s-8-2-8-5.5c0-3.7 2.5-7.5 6-9z" fill="currentColor"/><text x="12" y="17.5" text-anchor="middle" font-size="8" font-weight="800" fill="#0a0e18">$</text>`,
  champion: UI.trophy.replace(/<\/?svg[^>]*>/g, ''),
  reroll: `<path d="M19 8a8 8 0 0 0-14 2M5 16a8 8 0 0 0 14-2" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M20 3v6h-6M4 21v-6h6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
};
export function glyph(id, fallback = '◆') {
  return G[id] ? `<svg viewBox="0 0 24 24" class="gly" aria-hidden="true">${G[id]}</svg>` : `<span class="gly-t">${fallback}</span>`;
}
