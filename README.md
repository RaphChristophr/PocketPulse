# PocketPulse

PWA keuangan pribadi untuk mencatat pengeluaran, pemasukan, dan transfer dari HP. Budget mingguan dipisah menjadi Senin–Jumat, Sabtu, dan Minggu. Budget bulanan mengikuti tanggal 25–24.

## Menjalankan aplikasi

Gunakan Node.js 24 LTS.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

Build produksi menghasilkan aplikasi dan service worker di `dist/`. Gunakan preview produksi untuk menguji mode offline. PocketPulse dibuka dengan data contoh. Buka Pengaturan dan pilih **Mulai ruang pribadi** untuk menggantinya dengan catatan kosong.

## Penyimpanan, Supabase, dan Vercel

Versi ini menyimpan data dalam IndexedDB di perangkat dan menyediakan CSV serta backup JSON. Logika uang dan periode ada di `src/domain`. Pembacaan dan penulisan data berada di `src/storage`.

Vercel dapat menyajikan build ini memakai preset **Vite**, perintah `npm run build`, dan folder hasil `dist`. Rute aplikasi memakai hash sehingga navigasi tidak bergantung pada aturan rewrite. Gunakan domain HTTPS yang stabil supaya pemasangan PWA dan data lokal menggunakan origin yang sama.

Supabase direncanakan untuk login serta penyimpanan lintas perangkat. Tahap tersebut perlu Supabase Auth, tabel dengan Row Level Security berdasarkan pemilik, dan strategi sinkronisasi yang menjaga perubahan offline, termasuk penghapusan dan konflik. Integrasi browser akan memakai URL proyek dan publishable key. Kunci secret atau service role hanya boleh dipakai di server. Versi ini berjalan tanpa konfigurasi Supabase.

- [Dokumentasi produk dan rencana testing](docs/README.md)
- [Vercel untuk Vite](https://vercel.com/docs/frameworks/frontend/vite)
- [Supabase Auth untuk React](https://supabase.com/docs/guides/auth/quickstarts/react)
