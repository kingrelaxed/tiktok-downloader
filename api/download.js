const { fetchInfo, fetchBuffer, sendJson, getQuery } = require('../lib/tikwm');
function looksLikeMp4(buf) { return buf.length > 12 && buf.slice(4, 8).toString('ascii') === 'ftyp'; }
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { ok: false, error: 'Method tidak didukung.' });
  const { params } = getQuery(req);
  const url = params.get('url');
  const quality = (params.get('quality') || 'hd').toLowerCase();
  if (!url) return sendJson(res, 400, { ok: false, error: 'Parameter url wajib diisi.' });
  let info;
  try { info = await fetchInfo(url); }
  catch (e) { return sendJson(res, 502, { ok: false, error: `Server pengambil video belum merespons: ${e.message}` }); }
  if (info.isPhoto) {
    return sendJson(res, 400, { ok: false, error: 'Postingan ini mode foto, bukan video. Gunakan Video Slideshow (/api/slideshow) atau Foto Asli.', isPhoto: true });
  }
  const fileUrl = quality === 'sd' ? (info.sdplay || info.play) : (info.hdplay || info.play);
  if (!fileUrl) return sendJson(res, 502, { ok: false, error: 'File video belum tersedia dari API. Coba lagi sebentar lagi.' });
  let file;
  try { file = await fetchBuffer(fileUrl, 120000); }
  catch (e) { return sendJson(res, 502, { ok: false, error: `Gagal mengambil file video: ${e.message}` }); }
  if (/^audio\//i.test(file.contentType) || !looksLikeMp4(file.buf)) {
    return sendJson(res, 502, { ok: false, error: 'File yang dikembalikan server ternyata audio, bukan video. Download dibatalkan supaya tidak tersimpan lagu sebagai video.' });
  }
  const suffix = quality === 'sd' ? 'sd' : 'hd';
  const filename = `tiktok-${info.id || 'video'}-${suffix}.mp4`;
  res.statusCode = 200;
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Length', String(file.buf.length));
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(file.buf);
};
