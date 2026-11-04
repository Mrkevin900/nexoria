// Petit serveur web du bot : c'est lui que le site GitHub Pages interroge.
//   GET /api/live  → stats Discord, statut des serveurs de jeu, actus/boss/avancement
//   GET /health    → "ok" (pour l'hébergeur et pour un service de ping type UptimeRobot)
import http from 'node:http';

export function startApi({ port, siteUrl, getPayload }) {
  let allowed = '*';
  try { if (siteUrl) allowed = new URL(siteUrl).origin; } catch {}

  const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin;
    // Autorise le site officiel + les tests en local.
    const ok = allowed === '*' || origin === allowed || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');
    res.setHeader('Access-Control-Allow-Origin', ok && origin ? origin : allowed);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') { res.writeHead(204).end(); return; }
    const path = (req.url || '/').split('?')[0];

    if (path === '/' || path === '/health') {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }).end('ok');
      return;
    }
    if (path === '/api/live' && req.method === 'GET') {
      try {
        const body = JSON.stringify(await getPayload());
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=30' }).end(body);
      } catch (e) {
        console.error('[api]', e);
        res.writeHead(500, { 'Content-Type': 'application/json' }).end('{"ok":false}');
      }
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('not found');
  });

  server.listen(port, () => console.log(`[api] en écoute sur le port ${port}`));
  return server;
}
