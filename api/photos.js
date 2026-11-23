const { fetchInfo, fetchBuffer, sendJson, getQuery } = require('../lib/tikwm');
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { ok: false, error: 'Method tidak didukung.' });
  const { params } = getQuery(req);
  const url = params.get('url');
  const i = parseInt(params.get('i') || '0', 10);
  if (!url) return sendJson(res, 400, { ok: false, error: 'Parameter url wajib diisi.' });
  let info;
  try { info = await fetchInfo(url); }
  catch (e) { return sendJson(res, 502, { ok: false, error: `Server pengambil video belum merespons: ${e.message}` }); }
  if (!info.isPhoto || !info.images[i]) return sendJson(res, 400, { ok: false, error: 'Foto tidak ditemukan untuk postingan ini.' });
  try {
    const file = await fetchBuffer(info.images[i], 60000);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Length', String(file.buf.length));
    res.setHeader('Content-Disposition', `attachment; filename="tiktok-${info.id}-foto-${i + 1}.jpg"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(file.buf);
  } catch (e) { return sendJson(res, 502, { ok: false, error: `Gagal mengambil foto: ${e.message}` }); }
};
