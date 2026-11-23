const TIKWM_API = 'https://www.tikwm.com/api/';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
async function fetchJson(url, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: ctrl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally { clearTimeout(t); }
}
async function fetchInfo(tiktokUrl) {
  if (!tiktokUrl || typeof tiktokUrl !== 'string') throw new Error('Parameter url wajib diisi.');
  const apiUrl = `${TIKWM_API}?url=${encodeURIComponent(tiktokUrl)}&hd=1`;
  const json = await fetchJson(apiUrl, 20000);
  if (json.code !== 0 || !json.data) throw new Error(`TikWM tidak mengembalikan data (code ${json.code}).`);
  const d = json.data;
  const images = Array.isArray(d.images) ? d.images : [];
  const musicInfo = d.music_info || {};
  const musicUrl = musicInfo.play || d.music || '';
  const isPhoto = images.length > 0 && (!d.duration || d.duration === 0);
  const play = isPhoto ? '' : (d.hdplay || d.play || '');
  return {
    id: String(d.id || ''), title: d.title || '',
    author: (d.author && d.author.nickname) || d.author || '',
    authorId: (d.author && d.author.unique_id) || '',
    cover: d.cover || (images[0] || ''), duration: d.duration || 0,
    size: d.size || 0, hdSize: d.hd_size || 0, isPhoto, images, musicUrl,
    musicTitle: musicInfo.title || '', musicAuthor: musicInfo.author || '',
    musicDuration: musicInfo.duration || d.duration || 0, play,
    hdplay: isPhoto ? '' : (d.hdplay || ''), sdplay: isPhoto ? '' : (d.play || ''),
    wmplay: isPhoto ? '' : (d.wmplay || ''),
  };
}
async function fetchBuffer(url, timeoutMs = 60000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Referer: 'https://www.tiktok.com/' }, signal: ctrl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status} saat mengambil ${url.slice(0, 80)}`);
    const buf = Buffer.from(await r.arrayBuffer());
    return { buf, contentType: r.headers.get('content-type') || '' };
  } finally { clearTimeout(t); }
}
function sendJson(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(JSON.stringify(obj));
}
function getQuery(req) {
  const u = new URL(req.url, 'http://localhost');
  return { url: u, params: u.searchParams };
}
module.exports = { fetchInfo, fetchBuffer, sendJson, getQuery, TIKWM_API };
