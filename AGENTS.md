# Panduan Codex untuk PocketPulse

## Saat memulai chat baru

- Gunakan repo ini sebagai sumber konteks. Cek branch dan status worktree, lalu baca [indeks dokumentasi](docs/README.md), [backlog](docs/BACKLOG.md), dan entri terbaru di [changelog](CHANGELOG.md). Buka PRD, scope, atau arsitektur yang relevan sebelum mengubah perilaku produk.
- Jika pengguna menyampaikan ide atau meminta catat dulu, tambahkan atau perbarui item di `docs/BACKLOG.md` dengan perilaku yang diinginkan dan statusnya. Lanjutkan ke kode jika pengguna meminta implementasi.
- Jika pengguna menetapkan atau mengoreksi aturan produk, perbarui dokumen di `docs/` yang terdampak. Contohnya, perubahan aturan budget perlu tercermin di PRD dan contoh testing terkait. Perbarui item backlog yang sudah ada agar tidak ada catatan ganda.

## Saat pengembangan berlanjut

- Setelah satu tahap dev selesai, perbarui status item di backlog dan catat perubahan di bagian **Unreleased** pada `CHANGELOG.md`. Cantumkan tanggal WIB, ringkasan, hasil verifikasi yang relevan, dan aktivasi backend atau deployment yang masih tertunda. Gunakan nomor versi atau tag setelah rilisnya ditetapkan.
- Ikuti [checklist setelah perubahan dev](docs/DEV_RELEASE_CHECKLIST.md). Jalankan pengecekan yang relevan, commit perubahan siap pakai, push ke `origin/dev`, lalu laporkan hash commit. Gunakan `main` atau deploy Production hanya saat diminta secara eksplisit.
