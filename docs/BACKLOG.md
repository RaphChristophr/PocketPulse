# Backlog PocketPulse

## Pengingat mencatat transaksi setiap malam

**Status** — Direncanakan.

- Sediakan opsi aktif dan nonaktifkan pengingat di Pengaturan. Saat aktif, kirim satu notifikasi setiap malam pukul **20.00 WIB (Asia/Jakarta)**.
- Gunakan teks seperti “Sudah catat transaksi hari ini?” dan buka form **Catat transaksi** ketika notifikasi diketuk.
- Saat diimplementasikan, uji pengiriman saat PWA ditutup, cara aplikasi menangani izin yang ditolak, dan pencegahan notifikasi ganda.

## Pemilih ikon visual

**Status** — Direncanakan.

- Ganti dropdown nama ikon dengan kisi ikon yang bisa diketuk di form tambah dan edit **kategori** serta **sumber dana**.
- Tampilkan ikon yang sedang dipilih dengan penanda yang terlihat. Pilihan warna tetap terpisah dan pratinjau langsung mengikuti kedua pilihan. Beri setiap ikon nama aksesibel untuk pembaca layar.
- Saat diimplementasikan, uji pemilihan di HP dan pastikan ikon yang tersimpan tetap terpilih saat form dibuka kembali.

## Pilihan warna tambahan untuk ikon

**Status** — Direncanakan.

- Perluas palet warna ikon untuk **kategori** dan **sumber dana**. Tambahkan pilihan yang mudah dibedakan dari enam warna saat ini, misalnya merah, kuning, toska, dan cokelat. Pilihan akhir mengikuti keterbacaan warna ikon pada latar terang.
- Tampilkan palet sebagai swatch berlabel dengan tanda centang pada warna terpilih. Pratinjau memperlihatkan ikon dengan warna pilihan sebelum disimpan.
- Pertahankan pilihan warna lama. Uji warna tambahan di form, Riwayat, Ringkasan, dan Budget, termasuk setelah aplikasi dibuka ulang, dari backup, dan setelah sinkronisasi ke perangkat lain.

## Grafik pengeluaran di Ringkasan

**Status** — Direncanakan.

- Tambahkan grafik batang pengeluaran per hari agar terlihat kapan belanja paling besar. Sediakan pilihan **Minggu ini (Senin–Minggu)** dan **Periode gajian (25–24)**.
- Tampilkan nominal saat batang dipilih dan sediakan akses ke transaksi pada hari itu. Pertahankan daftar **Pengeluaran terbesar** untuk melihat kategori yang paling banyak terpakai.
- Hitung grafik hanya dari pengeluaran. Saat diimplementasikan, uji bahwa transfer antar sumber dana tidak menambah total, transaksi yang dikoreksi langsung memperbarui grafik, dan transaksi tanggal 24 serta 25 masuk ke periode gajian yang sesuai.

## Pilihan bahasa Indonesia dan English

**Status** — Direncanakan.

- Tambahkan pemilih bahasa di **Pengaturan** dengan pilihan **Bahasa Indonesia** dan **English**. Gunakan Bahasa Indonesia untuk pengguna baru. Terapkan perubahan segera dan ingat pilihan saat PWA dibuka kembali, termasuk saat offline.
- Terjemahkan navigasi, form, status, pesan kesalahan, dan petunjuk pemasangan. Gunakan format tanggal sesuai bahasa pilihan dan pertahankan Rupiah sebagai mata uang.
- Nama sumber dana, kategori, dan catatan transaksi yang ditulis pengguna tampil sesuai isian pengguna. Saat diimplementasikan, uji perpindahan kedua arah dan cocokkan saldo serta budget sebelum dan sesudah berpindah bahasa.

## Status sinkronisasi dan sinkronisasi otomatis

**Status** — Direncanakan. Prioritaskan status sinkronisasi sebelum mengaktifkan sinkronisasi otomatis.

- Tampilkan status **Belum tersinkron**, **Sedang menyinkronkan**, atau waktu **Terakhir berhasil sinkron**. Jelaskan hasilnya, misalnya “1 transaksi ditarik dari cloud”. Simpan keterangan kegagalan di Pengaturan agar bisa dibaca lagi setelah pemberitahuan hilang.
- Simpan perubahan ke perangkat terlebih dahulu. Jalankan sinkronisasi otomatis saat aplikasi dibuka kembali, setelah perubahan tersimpan ketika online, dan saat koneksi kembali selama aplikasi terbuka. Pertahankan tombol **Sinkronkan** untuk percobaan manual.
- Jika catatan di dua perangkat sama-sama berubah sejak sinkronisasi terakhir, tampilkan konflik dan hentikan sinkronisasi untuk data itu sampai pengguna menentukannya. Uji perubahan dan penghapusan transaksi, koneksi yang putus lalu kembali, serta konflik lintas perangkat.

## Pintasan transaksi favorit

**Status** — Direncanakan.

- Pengguna bisa menyimpan kombinasi kategori dan sumber dana yang sering dipakai. Misalnya pilih **Ojek → Bank Digital 1**, lalu PocketPulse mengisi kedua kolom pada form transaksi.
- Nominal tetap diisi pada setiap transaksi. Uji bahwa pintasan membuka form dengan nilai yang benar dan pengguna bisa menggantinya sebelum menyimpan.

## Sisa jatah yang berlaku hari ini

**Status** — Direncanakan.

- Di Ringkasan, tonjolkan sisa jatah per kategori untuk bagian minggu yang berlaku hari ini serta sisa jatah pada periode gajian 25–24.
- Tampilkan kedua nominal secara terpisah. Contohnya pada Sabtu, tampilkan **Sisa Makan Sabtu** dan **Sisa Makan periode gajian**. Uji perpindahan Jumat ke Sabtu, Minggu ke Senin, dan tanggal 24 ke 25.
