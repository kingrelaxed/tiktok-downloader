// Local dev server — mirrors the Vercel routing so the same handlers can be tested with `npm start` before deploying. Serves public/ statically and mounts api/*.js under /api/*.
const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const handlers = {
  '/api/info': require('./api/info'),
  '/api/download': require('./api/download'),
  '/api/photos': require('./api/photos'),
  '/api/music': require('./api/music'),
  '/api/slideshow': require('./api/slideshow'),
};
const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://localhost');
    const h = handlers[u.pathname];
    if (h) return await h(req, res);
    let file = u.pathname === '/' ? '/index.html' : u.pathname;
    const fp = path.join(PUBLIC, decodeURIComponent(file));
    if (!fp.startsWith(PUBLIC) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
      res.statusCode = 404; res.end('Not found'); return;
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', MIME[path.extname(fp)] || 'application/octet-stream');
    fs.createReadStream(fp).pipe(res);
  } catch (e) {
    res.statusCode = 500; res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: e.message }));
  }
});
server.listen(PORT, () => console.log(`TikTok Downloader server jalan di http://localhost:${PORT}`));
