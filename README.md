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

## Penyimpanan dan Supabase

Versi ini menyimpan data dalam IndexedDB di perangkat dan menyediakan CSV serta backup JSON. Logika uang dan periode ada di `src/domain`. Pembacaan dan penulisan data berada di `src/storage`.

Build tanpa variabel Supabase berjalan dengan penyimpanan lokal dan data contoh. Untuk menguji Supabase di lingkungan dev:

1. Terapkan [migrasi database](supabase/migrations/20261126000100_create_ledgers.sql) pada proyek dev. RLS membatasi akses snapshot ke akun pemilik.
2. Buat akun uji di Supabase Auth. Form PocketPulse memakai email dan kata sandi. Aplikasi tidak menampilkan alur daftar pengguna.
3. Salin `.env.example` ke `.env.local`, lalu isi URL proyek dan publishable key. Kredensial database dan service role disimpan di sisi pengelolaan Supabase.
4. Masuk ke PocketPulse. Sinkronisasi berjalan saat aplikasi dibuka atau kembali online dan setelah perubahan lokal disimpan. Tombol **Sinkronkan** tersedia di Pengaturan untuk percobaan manual. Perangkat baru dengan catatan kosong dapat menarik versi cloud. Jika kedua sisi berubah, ekspor kedua versi sebelum menentukan data yang dipulihkan.

Catatan lokal untuk mode Supabase dipisahkan berdasarkan akun. Jika ingin memindahkan catatan dari mode lokal ke mode Supabase, unduh backup dari mode lokal lalu pulihkan dengan akun yang sesuai. Gunakan data dummy bagi pengujian.

## Vercel Preview untuk pengembangan

Gunakan preset **Vite**, perintah `npm run build`, dan folder hasil `dist`. Tambahkan dua variabel `VITE_SUPABASE_*` ke lingkungan **Preview**. Gunakan tautan preview dari branch dev untuk tes instalasi dan offline di HP. Saat data yang dipakai harus bertahan antarpembaruan, buka URL preview yang sama atau pulihkan backup pada URL baru. Build production bisa memakai proyek Supabase lain dan variabel **Production** tersendiri.

## Pengingat pukul 20.00 WIB

Terapkan migrasi langganan, lalu deploy `nightly-reminders` ke Supabase dev. Simpan pasangan kunci VAPID (`VAPID_PUBLIC_KEY` dan `VAPID_PRIVATE_KEY`) serta `POCKETPULSE_CRON_SECRET` di pengaturan Edge Functions. Kunci privat tetap di server. Fungsi mengembalikan kunci publik dengan GET dan menerima POST pengiriman hanya dengan secret cron.

Jadwalkan panggilan POST harian pukul **13.00 UTC** menggunakan Supabase Cron. Simpan secret yang sama di Vault dan pakai header `Authorization: Bearer <secret>`. Jalankan tes dari PWA melalui **Pengaturan → Pengingat harian** dan izinkan notifikasi. Aktifkan untuk perangkat yang memang ingin menerima pengingat.

- [Dokumentasi produk dan rencana testing](docs/README.md)
- [Checklist setelah perubahan dev](docs/DEV_RELEASE_CHECKLIST.md)
- [Changelog PocketPulse](CHANGELOG.md)
- [Vercel untuk Vite](https://vercel.com/docs/frameworks/frontend/vite)
- [Supabase Auth untuk React](https://supabase.com/docs/guides/auth/quickstarts/react)
