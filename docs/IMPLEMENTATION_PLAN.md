# Implementation Plan PocketPulse

Tahapan mengikuti [PRD](PRD.md) dan [Scope MVP](MVP_SCOPE.md). Penyimpanan lokal dipakai dari tahap pertama agar data contoh dan pengujian berjalan melalui alur yang sama dengan pemakaian harian.

## Cara menjalankan testing

- Tulis unit test untuk perhitungan dan validasi. Gunakan tes integrasi untuk penyimpanan, ekspor, dan pemulihan. Pakai tes browser untuk alur utama dan uji langsung di HP untuk kenyamanan input.
- Gunakan data contoh yang sama di tiap tahap. Mulai dengan lima akun dan ambil satu minggu contoh dari Notes yang mencakup Weekdays, Sabtu, Minggu, dan transfer. Tentukan saldo awal dan hasil yang diharapkan secara manual sebelum menguji aplikasi.
- Sebelum menutup tahap, jalankan kembali tes otomatis dari tahap sebelumnya. Catat hasil uji manual beserta perangkat dan browser yang dipakai.

## Tahap 1 — PWA, akun, dan pencatatan

- Siapkan aplikasi React dan TypeScript dengan Vite, navigasi mobile, dan penyimpanan IndexedDB versi pertama.
- Tambahkan manifest, ikon, mode `standalone`, dan service worker. Siapkan build pratinjau melalui HTTPS untuk menguji instalasi dan pembukaan ulang secara offline di HP.
- Tambahkan tipe data uang IDR, tanggal lokal, akun, kategori, dan transaksi. Buat aturan validasi dan perhitungan saldo sesuai [Data Model](DATA_MODEL.md).
- Buat halaman pengaturan akun dan kategori dengan pilihan ikon, palet warna, dan pratinjau. Sediakan ikon bawaan yang tersedia offline. Buat form pemasukan, pengeluaran, dan transfer serta riwayat dengan edit, hapus, dan filter.
- Buat backup JSON berversi dan pemulihan dasar sebelum mulai memakai data sungguhan. Validasi isi sebelum menulis dan minta konfirmasi untuk mengganti data yang sudah ada. Siapkan koleksi budget sejak awal agar backup tahap ini bisa dibuka saat fitur budget tersedia.

### Testing tahap 1

- **Unit — saldo dan transfer.** Bank mulai Rp1.000.000 dan Tunai Rp100.000. Transfer Rp300.000 menghasilkan Bank Rp700.000 dan Tunai Rp400.000. Ubah transfer ke Rp250.000, lalu hapus. Cocokkan kedua saldo setelah tiap tindakan. Total kedua akun tetap Rp1.100.000.
- **Unit — aturan input.** Uji nominal nol, pecahan, angka di luar batas integer aman, dan tanggal kalender yang salah. Uji transfer ke akun asal, kategori yang jenisnya keliru, serta transaksi sebelum tanggal saldo awal salah satu akun. Input yang tidak valid ditolak dengan alasan yang jelas.
- **Integrasi — IndexedDB dan relasi.** Buat lima akun, simpan pemasukan, pengeluaran, dan transfer, lalu muat ulang. Cocokkan saldo dan riwayat yang tersimpan. Ubah nama akun atau kategori dan pastikan riwayatnya masih terhubung. Pastikan penghapusan akun atau kategori yang dirujuk ditolak.
- **Browser — alur harian.** Tambah, edit, dan hapus transaksi dari layout HP. Cek filter tanggal, kategori, dan akun. Filter Bank dan filter Tunai masing-masing menemukan transfer yang sama. Riwayat tanpa filter menampilkan transfer itu sekali.
- **Browser — ikon dan warna.** Buat kategori Makan dengan ikon alat makan dan warna oranye serta Tunai dengan ikon dompet dan warna hijau. Cek pratinjau, simpan, lalu muat ulang dan cek tampilan di pemilih dan Riwayat. Ubah warna dan ikon saat offline, lalu verifikasi label masih terbaca serta transaksi tetap terhubung ke ID yang sama.
- **Integrasi — pemulihan dasar.** Pulihkan backup di profil browser bersih, lalu cocokkan akun, kategori, ikon, warna, transaksi, dan saldo. File yang gagal validasi atau pemulihan yang dibatalkan harus menjaga data awal.
- **Browser dan HP — instalasi dan pencatatan offline.** Buka versi HTTPS sampai siap offline. Pasang dari Chrome Android dan Safari iPhone, aktifkan mode pesawat, lalu tutup dan buka lagi lewat ikon layar utama. Buat pengeluaran dan transfer, buka ulang aplikasi, lalu cocokkan saldo dan riwayat. [Instalasi PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable), [Panduan iPhone](https://support.apple.com/en-az/guide/iphone/iphea86e5236/26/ios/26)

**Lulus tahap 1** jika PWA bisa dipasang dan dipakai mencatat offline, saldo cocok dengan hitungan manual, dan data bisa dipulihkan dari backup.

## Tahap 2 — Budget dan ringkasan dari HP

- Buat fungsi periode bulanan tanggal 25–24 dan periode mingguan Senin–Minggu. Buat pemetaan Weekdays, Sabtu, dan Minggu berdasarkan tanggal transaksi.
- Buat layar Budget dengan input limit, pilihan periode, sisa, status kelebihan, dan salin limit minggu sebelumnya.
- Buat Ringkasan dengan saldo akun, tabungan, sisa budget di kedua periode, dan pengeluaran per kategori untuk periode gajian terpilih. Hubungkan kategori pada ringkasan ke riwayat yang terfilter. Tampilkan sisa dua limit yang berlaku setelah menyimpan pengeluaran.

### Testing tahap 2

- **Unit — batas periode gajian.** Tanggal 24 dan 25 November 2026 masuk ke minggu yang sama dan dua periode gajian berbeda. Gaji tanggal 25 November masuk periode 25 November–24 Desember. Tanggal 30 November dan 1 Desember masih satu periode. Uji pergantian tahun dan Februari, serta pastikan pengelompokan tetap sama saat zona waktu perangkat berubah.
- **Unit — bagian minggu dan dua limit.** Tanggal 4, 5, dan 6 Desember 2026 masuk ke Weekdays, Sabtu, dan Minggu masing-masing. Senin 7 Desember memulai minggu baru. Ojek Rp20.000 pada 1 Desember membuat sisa Ojek Weekdays Rp80.000 dari limit Rp100.000 dan sisa Ojek periode 25 November–24 Desember Rp380.000 dari limit Rp400.000. Ringkasan belanja menambahkan Rp20.000 sekali. Tambahkan kategori lain dengan nominal lebih besar untuk memeriksa urutan kategori.
- **Integrasi — koreksi dan transfer.** Ubah tanggal transaksi dari Selasa ke Sabtu. Pemakaian bergeser ke bagian Sabtu dan total bulanan tetap. Ubah kategori atau nominal, lalu hapus transaksi dan cocokkan seluruh rekap terkait. Transfer Rp300.000 menjaga total belanja dan budget. Admin Rp2.500 dicatat terpisah dan menambah pengeluaran sebesar Rp2.500.
- **Integrasi — limit dan penyalinan.** Limit kosong tampil sebagai “Belum diatur”, tetapi pengeluarannya tetap masuk rekap. Limit Rp0 menampilkan nominal kelebihan saat ada pengeluaran. Salin minggu lalu ke minggu kosong dan cek bahwa hanya nominal limit yang tersalin. Periksa perlindungan terhadap penimpaan minggu yang sudah diisi.
- **Browser — ringkasan dan navigasi.** Cocokkan kelima saldo, total saldo, dan bagian tabungan dengan data contoh. Buka kategori dari Ringkasan dan Budget lalu cocokkan filter Riwayat dengan kategori, tanggal, dan bagian minggu yang dipilih. Pastikan umpan balik setelah simpan menampilkan kedua sisa limit secara terpisah.
- **Browser — tampilan di Budget dan Ringkasan.** Ubah ikon dan warna kategori yang sudah memiliki limit serta sumber dana yang sudah memiliki transaksi. Cocokkan tampilan baru dengan nama yang sama. Nominal saldo, limit, pemakaian, dan sisa harus sama dengan sebelum perubahan.
- **Browser — budget offline.** Buka PWA dalam mode pesawat. Ubah limit, simpan pengeluaran, dan lihat dua sisa budget yang terpengaruh. Tutup dan buka ulang, lalu cocokkan limit, transaksi, dan ringkasan.

**Lulus tahap 2** jika saldo, sisa budget, dan ringkasan bisa dicocokkan dengan transaksi pada kedua periode, termasuk setelah koreksi dan pergantian minggu atau periode gajian.

## Tahap 3 — Ekspor, verifikasi backup, dan uji pakai

- Buat ekspor CSV transaksi serta rekap budget mingguan dan bulanan. Sertakan jenis transaksi, tanggal, kategori, nominal, akun terkait, dan bagian minggu yang berlaku. Tampilkan tanggal awal dan akhir pada rekap bulanan.
- Verifikasi backup dan pemulihan dengan data budget lengkap, termasuk pemulihan backup dari tahap pencatatan pertama yang belum punya entri budget.

### Testing tahap 3

- **Integrasi — CSV.** Cocokkan jumlah baris, nominal, kategori, periode, dan bagian minggu dengan data aplikasi. Uji transaksi tanggal 24 dan 25 serta rentang periode yang ditampilkan. Uji catatan berisi koma, tanda kutip, dan baris baru. Pastikan transfer muncul sekali sebagai Transfer dan rekap budget hanya menjumlahkan pengeluaran.
- **Integrasi — backup dan pemulihan.** Ekspor seluruh data lalu pulihkan di profil bersih. Hasil saldo, tabungan, transaksi, kategori, limit, dan sisa budget harus sama. Uji JSON rusak, versi yang tidak didukung, ID ganda, dan relasi putus. Pastikan membatalkan konfirmasi atau gagal di tengah penulisan mempertahankan data awal.
- **Manual — kompatibilitas spreadsheet.** Buka CSV di Excel dan Google Sheets. Periksa pemisahan kolom, tanggal, nominal, catatan, dan label bagian minggu. Cocokkan total dengan Ringkasan PocketPulse.
- **Browser — pembaruan PWA.** Pasang build A dan simpan data contoh. Sediakan build B di URL yang sama. Simpan form yang sedang dibuka sebelum menerima pembaruan. Setelah muat ulang, pastikan versi baru aktif, saldo dan budget sesuai, dan aplikasi masih bisa dibuka ulang secara offline. Uji juga saat unduhan build baru terputus agar versi yang terakhir siap offline tetap bisa dibuka.
- **Manual — uji pakai pribadi di HP.** Catat satu minggu penuh agar Weekdays, Sabtu, dan Minggu terpakai. Ukur dari menekan Tambah sampai transaksi tersimpan, dengan target awal sekitar 15 detik untuk pengeluaran biasa. Cocokkan saldo kelima akun dengan saldo aktual pada akhir minggu. Cek apakah sisa budget bisa dibaca tanpa perlu menghitung ulang di Notes.

**Lulus tahap 3** jika ekspor terbaca, pemulihan utuh, dan uji pakai seminggu selesai. Catat hambatan yang masih terasa saat input atau membaca ringkasan sebelum menetapkan MVP siap dipakai harian.

## Tahap lanjutan — Google Sheets

Mulai jika hasil uji pakai menunjukkan kebutuhan rekap rutin di Sheets. Gunakan hasil perhitungan yang sudah dipakai CSV untuk memperbarui tab transaksi, saldo, serta budget. Sinkronkan ke satu spreadsheet pilihan pengguna melalui tombol manual sebelum mempertimbangkan jadwal otomatis.

### Testing integrasi Google Sheets

- **Integrasi — konsistensi.** Jalankan pembaruan ke spreadsheet uji dua kali. Jumlah baris tetap. Edit dan hapus transaksi di aplikasi, lalu cek bahwa pembaruan berikutnya mencerminkan keduanya dan total di Sheets cocok dengan PocketPulse.
- **Integrasi — izin dan pemulihan.** Uji saat izin dicabut, spreadsheet kehilangan akses, atau koneksi putus. Pesan harus jelas dan transaksi lokal tetap tersedia. Jalankan ulang setelah akses pulih dan periksa hasilnya, termasuk baris yang sempat terkirim sebelum koneksi putus.

**Lulus tahap lanjutan** jika semua tab di spreadsheet tujuan cocok dengan data sumber setelah pembaruan berulang dan setelah percobaan ulang.
