const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { fetchInfo, fetchBuffer, sendJson, getQuery } = require('../lib/tikwm');
function ffmpegPath() {
  try { return require('ffmpeg-static'); } catch (_) { return 'ffmpeg'; }
}
function run(cmd, args, timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr ? String(stderr).slice(-500) : err.message));
      else resolve(stdout);
    });
  });
}
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { ok: false, error: 'Method tidak didukung.' });
  const { params } = getQuery(req);
  const url = params.get('url');
  if (!url) return sendJson(res, 400, { ok: false, error: 'Parameter url wajib diisi.' });
  let info;
  try { info = await fetchInfo(url); }
  catch (e) { return sendJson(res, 502, { ok: false, error: `Server pengambil video belum merespons: ${e.message}` }); }
  if (!info.isPhoto || info.images.length === 0) return sendJson(res, 400, { ok: false, error: 'Postingan ini bukan mode foto, tidak ada slideshow yang dibuat.' });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tt-slide-'));
  try {
    const imageFiles = [];
    for (let i = 0; i < info.images.length; i++) {
      const f = await fetchBuffer(info.images[i], 60000);
      const p = path.join(tmp, `img${i}.jpg`);
      fs.writeFileSync(p, f.buf);
      imageFiles.push(p);
    }
    let musicFile = null;
    if (info.musicUrl) {
      const m = await fetchBuffer(info.musicUrl, 60000);
      musicFile = path.join(tmp, 'music.m4a');
      fs.writeFileSync(musicFile, m.buf);
    }
    const total = Math.max(5, info.musicDuration || 30);
    const per = total / imageFiles.length;
    const listFile = path.join(tmp, 'list.txt');
    fs.writeFileSync(listFile, imageFiles.map((p) => `file '${p}'\nduration ${per.toFixed(3)}`).join('\n') + `\nfile '${imageFiles[imageFiles.length - 1]}'`);
    const out = path.join(tmp, 'slideshow.mp4');
    const args = [
      '-y', '-f', 'concat', '-safe', '0', '-i', listFile,
      ...(musicFile ? ['-i', musicFile] : []),
      '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,format=yuv420p',
      '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23',
      ...(musicFile ? ['-c:a', 'aac', '-shortest'] : ['-an']),
      '-t', String(total),
      '-movflags', '+faststart', out,
    ];
    await run(ffmpegPath(), args, 120000);
    const buf = fs.readFileSync(out);
    if (buf.length < 1000 || buf.slice(4, 8).toString('ascii') !== 'ftyp') throw new Error('Hasil render bukan file MP4 yang valid.');
    res.statusCode = 200;
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', String(buf.length));
    res.setHeader('Content-Disposition', `attachment; filename="tiktok-${info.id}-slideshow.mp4"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(buf);
  } catch (e) {
    return sendJson(res, 503, { ok: false, error: `Slideshow tidak bisa dibuat di server ini (${e.message}). Gunakan Foto Asli + lagu aslinya.`, fallback: 'photos' });
  } finally {
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
  }
};
