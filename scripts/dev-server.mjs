// Local test server for the site and its editor, no Vercel needed.
//   ADMIN_PASSWORD=... SESSION_SECRET=... node scripts/dev-server.mjs
// Then open http://localhost:3000/saturdaynightlive
// Saves write straight to the files in this folder (not to GitHub), so
// review them with `git diff` and commit yourself if you want to keep them.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, extname, join, normalize, sep } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
process.env.SNL_LOCAL_DIR = root;
const port = Number(process.env.PORT) || 3000;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml',
};
const ROUTES = new Set(['login', 'logout', 'session', 'content', 'save']);

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    const m = url.pathname.match(/^\/api\/([a-z]+)$/);
    if (m && ROUTES.has(m[1])) {
      const mod = await import(pathToFileURL(join(root, 'api', m[1] + '.js')).href + `?t=${Date.now()}`);
      return await mod.default(req, res);
    }
    let p = decodeURIComponent(url.pathname);
    if (p === '/saturdaynightlive') p = '/saturdaynightlive/index.html';
    if (p.endsWith('/')) p += 'index.html';
    const file = normalize(join(root, p));
    if (!file.startsWith(root + sep) || file.includes(`${sep}api${sep}`) || file.includes(`${sep}.git`)) throw Object.assign(new Error('nope'), { code: 'ENOENT' });
    await stat(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(await readFile(file));
  } catch (e) {
    if (e.code === 'ENOENT') { res.writeHead(404); res.end('Not found'); return; }
    console.error(e);
    if (!res.headersSent) res.writeHead(500);
    res.end('Server error');
  }
}).listen(port, '127.0.0.1', () => console.log(`Site:   http://localhost:${port}/\nEditor: http://localhost:${port}/saturdaynightlive`));
