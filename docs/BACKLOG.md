# Backlog PocketPulse

## Layout mobile untuk Ringkasan, Insight, dan Catat transaksi

**Status** — Diimplementasikan. Tampilan HP dan pencatatan pengeluaran diuji di browser dengan data contoh.

- **Ringkasan.** Tonjolkan saldo tersedia di header hijau. Tampilkan total saldo dan saldo tabungan serta dana darurat secara terpisah. Pindahkan pilihan periode dan progres budget ke bagian grafik pengeluaran, diikuti kartu kategori dan transaksi terbaru. Sediakan akses ke Riwayat lengkap dari daftar transaksi terbaru.
- **Insight.** Sediakan layar untuk melihat tren pengeluaran berdasarkan periode, rincian pengeluaran per kategori, dan progres budget. Gunakan Rupiah dan pilihan periode PocketPulse, termasuk periode gajian tanggal 25–24.
- **Catat transaksi.** Letakkan input nominal berukuran besar di bagian atas. Tampilkan kategori pengeluaran sebagai kisi ikon, lalu letakkan tanggal, sumber dana, dan catatan di bawahnya. Buat tombol Simpan mudah dijangkau dan pastikan alur pemasukan serta transfer tetap bisa diakses dari form.
- **Navigasi mobile.** Susun Ringkasan, Insight, Budget, dan Pengaturan pada navigasi bawah dengan tombol **+** di tengah untuk membuka Catat transaksi. Uji pada layar HP sempit dan saat keyboard terbuka agar konten dan tombol Simpan tetap bisa dijangkau.

## Pengingat mencatat transaksi setiap malam

**Status** — Kode tersedia di `dev`. Pengiriman HP memerlukan konfigurasi Supabase dan izin notifikasi.

- Sediakan opsi aktif dan nonaktifkan pengingat di Pengaturan. Saat aktif, kirim satu notifikasi setiap malam pukul **20.00 WIB (Asia/Jakarta)**.
- Gunakan teks seperti “Sudah catat transaksi hari ini?” dan buka form **Catat transaksi** ketika notifikasi diketuk.
- Saat diimplementasikan, uji pengiriman saat PWA ditutup, cara aplikasi menangani izin yang ditolak, dan pencegahan notifikasi ganda.

## Pemilih ikon visual

**Status** — Diimplementasikan di branch `dev`.

- Ganti dropdown nama ikon dengan kisi ikon yang bisa diketuk di form tambah dan edit **kategori** serta **sumber dana**.
- Tampilkan ikon yang sedang dipilih dengan penanda yang terlihat. Pilihan warna tetap terpisah dan pratinjau langsung mengikuti kedua pilihan. Beri setiap ikon nama aksesibel untuk pembaca layar.
- Saat diimplementasikan, uji pemilihan di HP dan pastikan ikon yang tersimpan tetap terpilih saat form dibuka kembali.

## Pilihan warna tambahan untuk ikon

**Status** — Diimplementasikan di branch `dev`.

- Perluas palet warna ikon untuk **kategori** dan **sumber dana**. Tambahkan pilihan yang mudah dibedakan dari enam warna saat ini, misalnya merah, kuning, toska, dan cokelat. Pilihan akhir mengikuti keterbacaan warna ikon pada latar terang.
- Tampilkan palet sebagai swatch berlabel dengan tanda centang pada warna terpilih. Pratinjau memperlihatkan ikon dengan warna pilihan sebelum disimpan.
- Pertahankan pilihan warna lama. Uji warna tambahan di form, Riwayat, Ringkasan, dan Budget, termasuk setelah aplikasi dibuka ulang, dari backup, dan setelah sinkronisasi ke perangkat lain.

## Grafik pengeluaran di Ringkasan

**Status** — Diimplementasikan di branch `dev`.

- Tambahkan grafik batang pengeluaran per hari agar terlihat kapan belanja paling besar. Sediakan pilihan **Minggu ini (Senin–Minggu)** dan **Periode gajian (25–24)**.
- Tampilkan nominal saat batang dipilih dan sediakan akses ke transaksi pada hari itu. Pertahankan daftar **Pengeluaran terbesar** untuk melihat kategori yang paling banyak terpakai.
- Hitung grafik hanya dari pengeluaran. Saat diimplementasikan, uji bahwa transfer antar sumber dana tidak menambah total, transaksi yang dikoreksi langsung memperbarui grafik, dan transaksi tanggal 24 serta 25 masuk ke periode gajian yang sesuai.

## Pilihan bahasa Indonesia dan English

**Status** — Diimplementasikan di branch `dev`.

- Tambahkan pemilih bahasa di **Pengaturan** dengan pilihan **Bahasa Indonesia** dan **English**. Gunakan Bahasa Indonesia untuk pengguna baru. Terapkan perubahan segera dan ingat pilihan saat PWA dibuka kembali, termasuk saat offline.
- Terjemahkan navigasi, form, status, pesan kesalahan, dan petunjuk pemasangan. Gunakan format tanggal sesuai bahasa pilihan dan pertahankan Rupiah sebagai mata uang.
- Nama sumber dana, kategori, dan catatan transaksi yang ditulis pengguna tampil sesuai isian pengguna. Saat diimplementasikan, uji perpindahan kedua arah dan cocokkan saldo serta budget sebelum dan sesudah berpindah bahasa.

## Status sinkronisasi dan sinkronisasi otomatis

**Status** — Diimplementasikan di branch `dev`. Sinkronisasi otomatis aktif saat aplikasi terbuka dan online.

- Tampilkan status **Belum tersinkron**, **Sedang menyinkronkan**, atau waktu **Terakhir berhasil sinkron**. Jelaskan hasilnya, misalnya “1 transaksi ditarik dari cloud”. Simpan keterangan kegagalan di Pengaturan agar bisa dibaca lagi setelah pemberitahuan hilang.
- Simpan perubahan ke perangkat terlebih dahulu. Jalankan sinkronisasi otomatis saat aplikasi dibuka kembali, setelah perubahan tersimpan ketika online, dan saat koneksi kembali selama aplikasi terbuka. Pertahankan tombol **Sinkronkan** untuk percobaan manual.
- Jika catatan di dua perangkat sama-sama berubah sejak sinkronisasi terakhir, tampilkan konflik dan hentikan sinkronisasi untuk data itu sampai pengguna menentukannya. Uji perubahan dan penghapusan transaksi, koneksi yang putus lalu kembali, serta konflik lintas perangkat.

## Quick fill transaksi favorit

**Status** — Diimplementasikan di branch `dev`.

- Pengguna bisa menyimpan kombinasi kategori dan sumber dana yang sering dipakai. Tampilkan favorit sebagai tombol quick fill di form **Catat transaksi**. Misalnya, ketuk **Ojek → Bank Digital 1** untuk langsung mengisi kedua kolom itu.
- Nominal tetap diisi pada setiap transaksi. Uji bahwa pintasan membuka form dengan nilai yang benar dan pengguna bisa menggantinya sebelum menyimpan.

## Sisa jatah yang berlaku hari ini

**Status** — Diimplementasikan di branch `dev`.

- Di Ringkasan, tonjolkan sisa jatah per kategori untuk bagian minggu yang berlaku hari ini serta sisa jatah pada periode gajian 25–24.
- Tampilkan kedua nominal secara terpisah. Contohnya pada Sabtu, tampilkan **Sisa Makan Sabtu** dan **Sisa Makan periode gajian**. Uji perpindahan Jumat ke Sabtu, Minggu ke Senin, dan tanggal 24 ke 25.

## Alokasi dan pembayaran Tithe

**Status** — Diimplementasikan di branch `dev`.

- Tambahkan checklist **Sisihkan Tithe (10%)** pada form pemasukan. Saat dicentang, tampilkan pratinjau nominal dan simpan alokasi yang terhubung ke pemasukan tersebut. Contoh, gaji Rp5.000.000 menambah alokasi Tithe Rp500.000 pada periode gajian 25–24 sesuai tanggal pemasukan.
- Tampilkan **Dialokasikan, Sudah dibayar, dan Belum dibayar** di Budget Tithe. Alokasi menandai uang yang disisihkan. Saldo sumber dana berkurang saat pembayaran Tithe benar-benar dicatat sebagai pengeluaran. Transfer antar sumber dana sendiri tetap tercatat sebagai transfer dan alokasinya tetap terbuka.
- Tampilkan riwayat per asal pemasukan dengan tanggal, nama atau catatan, nominal pemasukan, alokasi 10%, pembayaran terkait, dan status **Belum dibayar**, **Dibayar sebagian**, atau **Lunas**. Sisa yang belum dibayar tetap terlihat saat periode berganti.
- Saat mencatat pembayaran, pengguna memilih alokasi yang dilunasi. Kaitkan pembayaran dengan alokasi dan tanggal pembayaran agar Riwayat Tithe bisa ditelusuri. Perubahan pemasukan memperbarui alokasi yang masih belum dibayar. Jika sudah ada pembayaran, tampilkan dampak perubahan sebelum pengguna menyimpan koreksi.
- Uji bahwa pemasukan tanpa checklist tetap tercatat biasa, menyimpan ulang pemasukan tidak menggandakan alokasi, dan pembayaran maupun koreksinya memperbarui status serta saldo sesuai nominal yang benar.

## Dropdown kategori dan sumber dana

**Status** — Diimplementasikan di branch `dev`.

- Rapikan pemilih kategori dan sumber dana di form transaksi. Tampilkan ikon berwarna dan nama pada setiap opsi serta beri penanda pada pilihan yang aktif.
- Uji pemilihan di HP, termasuk opsi akun asal dan tujuan untuk transfer serta nama kategori yang panjang.

## Input nominal dengan pemisah ribuan dan tombol 000

**Status** — Diimplementasikan di branch `dev`.

- Format nominal secara otomatis saat diketik, dengan pemisah setiap tiga digit. Contoh `25000` tampil sebagai `25.000` dalam Bahasa Indonesia dan `25,000` jika English aktif. Simpan nilai sebagai 25000 Rupiah.
- Sediakan tombol **000** untuk menambahkan tiga nol dengan sekali ketuk. Contoh ketik `25` lalu tekan **000** untuk memasukkan Rp25.000.
- Uji pengetikan, hapus digit, edit di tengah nominal, dan tempel angka yang sudah berformat. Pastikan nilai yang disimpan tetap sesuai dengan tampilan.

## Subkategori pengeluaran

**Status** — Diimplementasikan di branch `dev`.

- Izinkan kategori induk seperti **Transportasi** punya subkategori, misalnya **GoRide, GoCar, GrabBike, KRL, dan MRT**. Pengguna bisa memilih subkategori saat mencatat transaksi dan melihat rinciannya di Riwayat.
- Usulan awalnya menggunakan satu jatah untuk kategori induk. Pengeluaran setiap subkategori mengurangi jatah Transportasi yang relevan pada periode mingguan dan bulanan. Di ringkasan, jumlahkan pengeluaran ke kategori induk satu kali, lalu sediakan rincian per subkategori.
