# Changelog PocketPulse

Riwayat pengembangan PocketPulse, dari ide awal sampai fitur di Vercel Preview. Versi di `package.json` saat ini **0.1.0**. Bagian **Unreleased** mencatat perubahan di `dev` yang belum diberi tag rilis. **0.2.0** adalah usulan nomor versi untuk pembaruan fitur ini.

## Unreleased — Dev Preview, calon 0.2.0

### 27 November 2026 — Layout mobile Ringkasan, Insight, dan Catat transaksi

- Ringkasan menonjolkan total pengeluaran dan progres budget. Insight menampilkan grafik dan rincian per kategori untuk minggu ini, satu periode gajian, tiga periode, atau dua belas periode. Form transaksi menampilkan nominal besar dan kisi kategori. Tombol tambah ada di tengah navigasi bawah.
- Verifikasi lokal mencakup build, 15 tes, navigasi dan periode Insight, pencatatan pengeluaran contoh, tautan grafik ke Riwayat, serta akses form pemasukan dan transfer. Perubahan ini bisa dipasang lewat Vercel Preview tanpa migrasi Supabase.

### 27 November 2026 — Form, budget, dan sinkronisasi

- **Form transaksi.** Pemilih kategori dan sumber dana menampilkan ikon berwarna. Pemilih ikon di Pengaturan memakai kisi, dengan pilihan warna tambahan. Nominal memakai pemisah ribuan saat diketik dan tombol `000`. Quick fill favorit mengisi kategori dan sumber dana. [Commit `8872a58`](https://github.com/RaphChristophr/PocketPulse/commit/8872a58)
- **Subkategori.** Pengeluaran seperti KRL dan GoRide bisa dikelompokkan di bawah Transportasi. Nominalnya dihitung ke jatah kategori induk satu kali. [Commit `8872a58`](https://github.com/RaphChristophr/PocketPulse/commit/8872a58)
- **Tithe.** Centang **Sisihkan Tithe (10%)** saat mencatat pemasukan untuk membuat alokasi. Budget menampilkan riwayat, jumlah yang sudah dibayar, dan status belum dibayar, dibayar sebagian, atau lunas. [Commit `37efadf`](https://github.com/RaphChristophr/PocketPulse/commit/37efadf)
- **Ringkasan.** Tambah grafik pengeluaran harian dan tampilan sisa jatah hari ini serta sisa periode gajian. [Commit `37efadf`](https://github.com/RaphChristophr/PocketPulse/commit/37efadf)
- **Auto-sync.** Perubahan tersimpan lokal terlebih dahulu dan disinkronkan saat aplikasi aktif dan online. Pengaturan menampilkan status sinkronisasi dan konflik antarperangkat. [Commit `f205118`](https://github.com/RaphChristophr/PocketPulse/commit/f205118)
- **Bahasa.** Tambah pilihan Bahasa Indonesia dan English di Pengaturan. Format angka dan tanggal mengikuti bahasa pilihan. [Commit `2b82eaf`](https://github.com/RaphChristophr/PocketPulse/commit/2b82eaf)
- **Pengingat pukul 20.00 WIB.** Antarmuka, service worker, kode fungsi pengiriman, dan tabel langganan sudah dibuat. Pada pemeriksaan terakhir, fungsi pengiriman dan jadwal Supabase Cron masih menunggu aktivasi, sehingga notifikasi HP belum aktif. [Commit `2b82eaf`](https://github.com/RaphChristophr/PocketPulse/commit/2b82eaf)
- **Dokumentasi dev.** Tambah checklist GitHub, Supabase, dan Vercel untuk setiap pembaruan. [Commit `c9d6bda`](https://github.com/RaphChristophr/PocketPulse/commit/c9d6bda)
- **Panduan chat baru.** Tambah `AGENTS.md` agar Codex membaca konteks dari repo, mencatat ide di backlog, dan memperbarui changelog setelah tahap dev selesai. [Panduan Codex](AGENTS.md)

### 26 November 2026 — Supabase, Vercel, dan instalasi PWA

- Tambah login Supabase, penyimpanan cloud dengan akses per akun, dan sinkronisasi manual. Siapkan proyek Supabase dev serta Vercel Preview dan verifikasi halaman login Preview. [Commit `f78a501`](https://github.com/RaphChristophr/PocketPulse/commit/f78a501)
- Perbaiki instalasi PWA pada Preview yang diproteksi Vercel. Browser menyertakan kredensial saat mengambil manifest, dan service worker disiapkan sebelum login PocketPulse. [Commit `bbdbe73`](https://github.com/RaphChristophr/PocketPulse/commit/bbdbe73)
- Simpan rencana fitur di backlog dan tetapkan alur commit serta push ke `dev` setelah perubahan siap. [Commit `cf7de25`](https://github.com/RaphChristophr/PocketPulse/commit/cf7de25)

## 0.1.0 — MVP awal, 26 November 2026

- Rancang pengganti Notes untuk mencatat transaksi dari HP. Bandingkan proyek open-source, lalu pilih membangun PocketPulse sendiri agar aturan budget mengikuti pola pribadi. Dokumentasikan PRD, scope MVP, wireframe, model data, dan tahap implementasi beserta testing.
- Buat PWA mobile-first dengan pencatatan pemasukan, pengeluaran, dan transfer antar sumber dana. Sediakan saldo, tabungan, riwayat, pengelolaan kategori, ekspor CSV, dan backup JSON.
- Tetapkan budget mingguan **Senin–Jumat, Sabtu, dan Minggu** serta periode gajian bulanan **tanggal 25–24**. Simpan data di IndexedDB agar pencatatan bisa berjalan offline setelah PWA siap.
- Inisialisasi repositori GitHub dan push MVP dengan versi paket `0.1.0`. [Commit `b654e04`](https://github.com/RaphChristophr/PocketPulse/commit/b654e04)

## Cara mencatat perubahan berikutnya

Tambahkan perubahan yang terlihat pengguna atau memengaruhi operasi ke **Unreleased**. Catat tanggal WIB, ringkasan, tautan commit, dan status jika perlu aktivasi di layanan lain. Saat nomor versi dan tag rilis sudah ditetapkan, pindahkan entri yang masuk rilis ke bagian versi tersebut. Gunakan [Backlog](docs/BACKLOG.md) untuk usulan dan [Checklist dev](docs/DEV_RELEASE_CHECKLIST.md) untuk memverifikasi perubahan setelah push.
