import { D1PublicPlayerDirectory, createPublicPlayerDirectoryHandler } from '../vendor/idle-game-kit/cloudflare.js';

function withCors(response) {
  const headers = new Headers(response.headers);
  headers.set('access-control-allow-origin', '*');
  headers.set('access-control-allow-methods', 'GET, OPTIONS');
  headers.set('access-control-allow-headers', 'content-type');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return withCors(new Response(null, { status: 204 }));
    const directory = new D1PublicPlayerDirectory(env.PUBLIC_PLAYER_DB);
    const handleDirectory = createPublicPlayerDirectoryHandler(directory, { cacheControl: 'no-store' });
    try {
      const response = await handleDirectory(request);
      if (response !== null) return withCors(response);
      return withCors(Response.json({ error: 'not-found' }, { status: 404 }));
    } catch (error) {
      console.error(error);
      return withCors(Response.json({ error: 'internal-error' }, { status: 500 }));
    }
  },
};
