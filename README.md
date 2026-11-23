# TikTok Downloader Tanpa Watermark — versi server (Vercel)

Download video TikTok tanpa watermark HD 1080p. Tempel link, lewati iklan 15 detik, lalu simpan. Untuk postingan mode foto, tersedia Video Slideshow dan Foto Asli.

Server mengambil video dari TikTok lewat API TikWM lalu mengirim file-nya ke pengunjung, jadi download tidak bergantung pada koneksi browser pengunjung ke TikTok.

## Endpoint

- `GET /api/info?url=<link TikTok>` — info video/foto, judul, penulis, cover, durasi, ukuran, daftar foto, dan lagu.
- `GET /api/download?url=<link>&quality=hd|sd` — unduh video MP4 tanpa watermark (Full HD 1080p atau HD 720p).
- `GET /api/photos?url=<link>&i=<nomor foto>` — unduh Foto Asli (JPG) dari postingan mode foto.
- `GET /api/music?url=<link>` — unduh Lagu Asli (M4A).
- `GET /api/slideshow?url=<link>` — buat Video Slideshow MP4 dari foto + lagu asli (memakai ffmpeg).

## Uji lokal

```bash
npm start
```

Lalu buka http://localhost:3000

## Deploy ke Vercel

1. Di Vercel, pilih **Add New Project**.
2. Import repo GitHub ini.
3. Framework Preset: **Other**.
4. Output Directory: **public**.
5. Deploy.

## Google

Setelah deploy dan URL publik `.vercel.app` didapat, daftarkan URL tersebut ke Google Search Console.
