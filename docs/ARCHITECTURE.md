# Arsitektur dan keputusan build PocketPulse

## Keputusan awal

**Build PocketPulse sendiri.** Fitur yang paling menentukan adalah pencatatan dari HP dengan satu kategori pengeluaran yang bisa mengurangi limit periode gajian tanggal 25–24 sekaligus salah satu dari tiga limit mingguan. Kita bisa menulis model itu langsung dan membuat ringkasan mengikuti kebiasaan pemilik aplikasi.

Actual Budget tetap jadi referensi paling dekat untuk transaksi, transfer, dan budget bulanan dalam mode Tracking Budget. Template mingguan yang terdokumentasi menggunakan pengulangan atau rata-rata mingguan untuk menghitung alokasi bulanan. Untuk mengikuti pola PocketPulse, penggunaan Actual kemungkinan memerlukan logika periode, penyimpanan limit mingguan, antarmuka budget, dan perubahan ringkasan. Berdasarkan dokumentasi, manfaat memakai fondasi tersebut belum cukup untuk menjadikan fork sebagai pilihan awal. Perbandingan ini belum mencakup prototipe fork atau pengujian alur lengkap di HP. [Repo Actual Budget](https://github.com/actualbudget/actual), [Tracking Budget](https://actualbudget.org/docs/getting-started/tracking-budget/), [Budget Templates](https://actualbudget.org/docs/experimental/goal-templates/)

## Aplikasi MVP

- Aplikasi web mobile-first berbasis React dan TypeScript dengan Vite. Jalankan dari browser HP dan gunakan origin HTTPS yang stabil saat mulai memasukkan data harian.
- Simpan catatan di IndexedDB. Aplikasi dan data berjalan dalam profil browser perangkat yang dipakai. Browser lain atau perangkat lain punya penyimpanan sendiri. Sediakan backup dan pemulihan dari [Scope MVP](MVP_SCOPE.md) agar data bisa dipindah atau dipulihkan.
- **PWA frontend-only** untuk versi awal. Vercel direncanakan untuk menyajikan build Vite melalui HTTPS. Web app manifest menetapkan nama, ikon, URL awal, dan mode `standalone`. Service worker menyimpan berkas aplikasi untuk membuka ulang dan memakai alur inti secara offline setelah pemuatan awal berhasil. [Panduan PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable), [Vite di Vercel](https://vercel.com/docs/frameworks/frontend/vite)
- Cache service worker berisi aset aplikasi. Catatan keuangan disimpan melalui IndexedDB. Untuk versi baru, simpan aset versi baru sebelum mengganti versi yang aktif. Jika pembaruan menunggu, tawarkan muat ulang setelah pengguna menyimpan form. Pembaruan cache mempertahankan IndexedDB dan memerlukan pengujian migrasi jika schema berubah.

## Struktur frontend

```text
PocketPulse/
  docs/
  public/              Ikon instalasi
  src/
    App.tsx            Navigasi, registrasi PWA, dan koordinasi layar
    Dashboard.tsx      Saldo, tabungan, dan ringkasan
    Editors.tsx        Form transaksi, akun, kategori, dan limit
    Pages.tsx          Riwayat, Budget, Pengaturan, dan ekspor
    domain/            Model, validasi, periode, dan perhitungan
    storage/           Penyimpanan transaksi IndexedDB
  tests/               Pengujian perhitungan dan validasi
  vite.config.ts       Konfigurasi build, manifest, dan service worker
```

Letakkan fungsi perhitungan uang dan periode di `domain` agar layar, ekspor, dan pengujian memakai aturan yang sama. Letakkan akses IndexedDB di `storage` agar layar bisa memakai sumber data lain jika sinkronisasi perangkat dibutuhkan nanti.

## Supabase

Supabase direncanakan untuk autentikasi dan penyimpanan lintas perangkat. Saat integrasi dibuat, kaitkan setiap catatan dengan pemilik yang terautentikasi, pasang Row Level Security, dan gunakan publishable key dari frontend. Pertahankan IndexedDB agar alur offline tetap berjalan. Sebelum mengaktifkan sinkronisasi, tentukan cara mengirim perubahan dan penghapusan serta menyelesaikan edit dari beberapa perangkat. [Supabase Auth untuk React](https://supabase.com/docs/guides/auth/quickstarts/react), [Akses data dari frontend](https://supabase.com/kb/faqs/database/frontend-without-backend)

## Spreadsheet

CSV masuk MVP untuk riwayat transaksi dan rekap budget. Backup JSON lengkap dipakai untuk memulihkan aplikasi. Untuk integrasi langsung, mulai dengan tombol **Perbarui Google Sheets** yang membuat salinan satu arah dari data PocketPulse. Pakai spreadsheet pilihan pengguna. Pada setiap pembaruan, segarkan rentang data yang dikelola aplikasi agar koreksi dan penghapusan masuk tanpa menduplikasi baris. Google Sheets API menyediakan operasi baca dan tulis. Akses bisa dibatasi pada file yang digunakan aplikasi melalui scope `drive.file` dengan pemilihan file yang sesuai. Evaluasi autentikasi dan cara menjalankan integrasi ketika memasuki tahap tersebut. [Sheets API](https://developers.google.com/workspace/sheets/api/guides/values), [Cakupan akses Google Sheets](https://developers.google.com/workspace/sheets/api/scopes)
