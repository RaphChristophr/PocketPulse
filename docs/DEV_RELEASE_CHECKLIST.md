# Checklist setelah perubahan dev PocketPulse

Jalankan langkah 1 setelah satu fase atau perubahan siap. Kumpulkan perbaikan sebagai commit lokal di branch `dev`. Saat pengguna meminta push, siapkan Supabase dev bila diperlukan, push kumpulan commit ke GitHub, lalu verifikasi Vercel Preview. Merge ke `main` atau deploy Production memerlukan permintaan rilis terpisah.

- [Branch dev di GitHub](https://github.com/RaphChristophr/PocketPulse/tree/dev)
- [Proyek Supabase dev](https://supabase.com/dashboard/project/pyhhusupwlynslfgessy)
- [Vercel Deployments](https://vercel.com/raphchristophr/pocketpulse/deployments)
- [URL PocketPulse Preview untuk branch dev](https://pocketpulse-git-dev-raphchristophr.vercel.app/)

## 1. Cek perubahan lokal dan commit

- [ ] Periksa branch aktif dengan `git status --short --branch`. Jika bekerja di branch fitur, bawa perubahan yang sudah siap ke `dev` lewat PR atau merge biasa.
- [ ] Jalankan `npm test` dan `npm run build` untuk perubahan aplikasi. Untuk perubahan dokumentasi saja, periksa tautan dan jalankan `git diff --check`.
- [ ] Coba alur yang diubah dengan akun uji dan data dummy. Untuk perubahan transaksi, budget, atau sync, cek saldo dan riwayat setelah buka ulang atau setelah kembali online.
- [ ] Catat perubahan fitur, perbaikan, atau aktivasi backend di bagian **Unreleased** pada [Changelog](../CHANGELOG.md). Saat nomor versi rilis sudah disepakati, pindahkan entri yang masuk rilis ke bagian versi itu.
- [ ] Stage file yang relevan, cek `git diff --cached --check`, lalu buat commit deskriptif. Simpan file `.env.local`, kredensial, dan backup pengguna di luar commit.

## 2. Supabase dev jika ada perubahan backend

- **Tampilan, terjemahan, atau dokumentasi.** Langsung ke langkah GitHub jika perubahan tidak bergantung pada database atau fungsi baru.
- **Skema, RLS, atau fungsi SQL.** Buat file baru di `supabase/migrations/`, uji dengan data contoh dan data dari versi sebelumnya, lalu terapkan ke proyek dev sebelum frontend yang membutuhkannya naik. Untuk migrasi yang memengaruhi data, buat backup yang sesuai dan uji pemulihan. Periksa bahwa pengguna cuma bisa membaca dan mengubah data miliknya. [Panduan migrasi Supabase](https://supabase.com/docs/guides/deployment/database-migrations)
- **Edge Function atau pengingat.** Deploy fungsi yang berubah ke Supabase dev. Periksa secrets di server, uji respons fungsi, lalu pastikan jadwal Cron benar dan tercatat di riwayat eksekusi. Untuk pengingat PocketPulse, **13.00 UTC = 20.00 WIB**. Uji notifikasi dengan perangkat uji yang sudah memberi izin. [Setup PocketPulse](../README.md#pengingat-pukul-2000-wib)

Untuk skema yang dikelola lewat CLI, pastikan project yang ditautkan adalah proyek dev dan cocokkan `supabase migration list --remote` dengan keadaan tabel serta kebijakan di dashboard. Dua migrasi awal PocketPulse pernah dijalankan dari SQL Editor. Jika versi itu belum tercatat di riwayat, cocokkan skemanya dengan file migrasi dahulu, lalu tandai hanya versi yang terverifikasi sebagai `applied` melalui `supabase migration repair`. Setelah riwayat selaras, jalankan `supabase db push --dry-run --remote`, tinjau daftar perubahan, lalu `supabase db push --remote`. [Riwayat dan perbaikan migrasi](https://supabase.com/docs/guides/deployment/database-migrations#diagnosing-and-fixing-sync-errors), [CLI dan dry run](https://supabase.com/docs/guides/local-development/local-and-hosted-projects)

## 3. Push GitHub dan verifikasi Vercel

- [ ] Jalankan `git push origin dev`. Cocokkan hash commit lokal dari `git log -1 --oneline` dengan commit terbaru di GitHub.
- [ ] Buka Vercel Deployments. Pastikan deployment untuk commit tersebut punya status **Ready** dan environment **Preview**. Kalau hanya konfigurasi Vercel yang berubah, buat deployment Preview baru agar build memakai konfigurasi terbaru. [Deploy dari Git](https://vercel.com/docs/git), [Environment Variables](https://vercel.com/docs/environment-variables)
- [ ] Untuk konfigurasi frontend, gunakan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` di environment Preview. Simpan private key dan service-role key hanya di layanan backend yang membutuhkannya.
- [ ] Buka URL branch `dev` dari HP. Jika PWA menampilkan **Versi baru tersedia**, selesaikan form yang terbuka lalu tekan **Muat ulang**. Verifikasi alur yang berubah. Untuk sync, pastikan transaksi uji bisa ditarik dari profil browser kedua. Untuk PWA, periksa instalasi dan buka ulang dalam mode pesawat jika bagian itu berubah.

## 4. Kalau ada masalah

- **Build gagal.** Baca build log untuk commit itu, perbaiki atau revert lewat commit baru ke `dev`, lalu tunggu Preview baru. Cara ini menjaga riwayat perubahan bisa ditelusuri.
- **Frontend gagal setelah migrasi.** Periksa kompatibilitas skema sebelum revert frontend. Perbaiki database lewat migrasi lanjutan yang menjaga catatan pengguna. Revert Git saja tidak mengembalikan database.
- **PWA tampil versi lama atau datanya tampak kosong.** Cek bahwa alamatnya URL branch `dev`, akunnya sama, dan status sinkronisasi sudah berhasil. Unduh backup lokal jika ada catatan yang belum tersinkron sebelum reset atau mengganti penyimpanan.

Catatan hasil cukup memuat **apa yang berubah, tes yang dijalankan, hash commit, status Preview, dan status migrasi atau fungsi jika ada**.
