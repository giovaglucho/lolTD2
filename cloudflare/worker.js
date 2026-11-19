// Worker de Cloudflare: enruta /parties/<servidor>/<sala> a los Durable Objects (Lobby, Match).
import { routePartykitRequest } from 'partyserver';
export { Lobby } from './lobby.js';
export { Match } from './match.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/health') return new Response('ok', { headers: { 'access-control-allow-origin': '*' } });
    return (await routePartykitRequest(request, env, { cors: true })) || new Response('Not Found', { status: 404 });
  },
};
