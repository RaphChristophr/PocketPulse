# PRD PocketPulse

## Masalah dan pengguna

Pengguna awal adalah pemilik PocketPulse sendiri. Saat ini ia mencatat di Notes, lalu harus menjumlahkan pengeluaran dan menghitung sisa budget secara manual. Uang tersebar di dua rekening bank, dua rekening bank digital, dan tunai. Aplikasi harus menjawab tiga pertanyaan saat dibuka.

1. Berapa saldo yang bisa dipakai, total saldo, serta bagian yang disisihkan untuk tabungan dan dana darurat?
2. Berapa sisa jatah tiap kategori minggu ini dan bulan ini?
3. Kategori apa yang paling banyak menghabiskan uang bulan ini?

## Alur utama

1. Tambah lima akun dengan nama sendiri dan saldo awal. Tandai akun yang khusus untuk tabungan atau dana darurat.
2. Atur kategori seperti Makan, Ojek, dan Internet. Isi limit bulanan dan limit mingguan yang relevan.
3. Catat dari HP. Pengeluaran dan pemasukan memakai nominal, akun, kategori, dan tanggal. Tanggal default hari ini dan catatan opsional. Transfer memakai nominal, akun asal, akun tujuan, dan tanggal.
4. Buka Ringkasan untuk melihat saldo, sisa budget, dan pengeluaran terbesar. Dari tampilan Budget atau ringkasan kategori, buka daftar transaksi yang sesuai periode dan kategori. Setelah menyimpan pengeluaran, tampilkan sisa limit mingguan dan bulanan yang terkait.

Jika belum ada kategori yang bisa dipilih untuk jenis transaksi, isi nama kategori pertama langsung di form **Catat transaksi**. PocketPulse menyimpan kategori dan transaksi bersamaan.
5. Koreksi transaksi jika salah. Saldo, budget, dan ringkasan mengikuti hasil koreksi.

## Ikon dan warna

Saat membuat atau mengedit kategori atau sumber dana, pengguna bisa memilih ikon dan warna secara terpisah dari pilihan bawaan. Form menyediakan pilihan awal dan pratinjau sebelum disimpan. Tampilkan ikon berwarna bersama nama pada pemilih transaksi, Riwayat, Budget, dan Ringkasan sesuai konteks. Misalnya, Makan memakai ikon alat makan berwarna oranye dan Tunai memakai ikon dompet berwarna hijau.

## Cashflow

Cashflow menggabungkan ringkasan arus kas dan tren pengeluaran. Rekap dibuka pada periode gajian 25–24 agar selaras dengan Budget. Pilih **Minggu ini** (Senin–Minggu) untuk grafik harian, atau **Bulan kalender** untuk rekap tanggal 1 hingga akhir bulan. Pilihan periode berlaku pada pemasukan, pengeluaran, arus kas bersih, dan rincian kategori. Ketuk kategori untuk membuka transaksi pada periode tersebut. Pengaturan limit tetap tersedia di menu Budget.

**To payday** menampilkan progres, sisa hari, dan tanggal gajian berdasarkan hari ini di WIB. Jadwalnya tanggal 25 setiap bulan. Pada tanggal 25 tampilkan **Gajian hari ini**.

## Akses dari HP

PocketPulse bisa dipasang di layar utama HP sebagai PWA. Setelah aplikasi dibuka online dan siap dipakai offline, pengguna bisa membuka ulang aplikasi, mencatat atau mengoreksi transaksi, melihat saldo dan budget, serta mengubah limit tanpa koneksi. Perubahan tersimpan lokal dan langsung tercermin di ringkasan.

## Aturan budget

- **Mingguan.** Satu minggu berjalan Senin–Minggu. Weekdays adalah satu jatah bersama Senin–Jumat. Sabtu dan Minggu masing-masing punya jatah sendiri. Set limit per kategori di setiap bagian. Sediakan tindakan untuk menyalin limit minggu lalu ke minggu yang belum punya budget.
- **Bulanan.** Set satu limit per kategori per periode gajian. Periode mulai tanggal 25 dan berakhir tanggal 24 bulan berikutnya, keduanya termasuk dalam periode. Tanggal 25 bulan berikutnya membuka periode baru. Misalnya, gaji yang masuk 25 November tercatat di periode 25 November–24 Desember. Tampilkan rentang tanggal yang sama pada budget dan ringkasan pengeluaran bulanan.
- **Satu transaksi bisa memakai dua limit.** Pengeluaran Ojek Rp20.000 pada Selasa mengurangi sisa Ojek Weekdays di minggu tersebut dan Ojek di periode gajian tersebut. Ringkasan pengeluaran mencatat Rp20.000 satu kali. Tampilkan sisa kedua limit berdampingan dan hitung nominal kelebihan masing-masing.
- **Kategori dan periode fleksibel.** Internet bisa punya budget bulanan saja. Kategori tanpa limit tetap muncul di laporan pengeluaran dan diberi status “Belum diatur” bila ditampilkan di Budget. Limit Rp0 berarti target pengeluaran nol. Sisa budget selesai di akhir periode. Menyalin limit hanya menyalin rencana nominal.
- **Minggu lintas periode gajian.** Senin–Minggu tetap satu minggu yang sama. Misalnya, Selasa 24 dan Rabu 25 November 2026 memakai jatah Weekdays yang sama dan masuk ke dua budget bulanan berbeda. Sebaliknya, 30 November dan 1 Desember sama-sama masuk periode 25 November–24 Desember.

## Aturan saldo dan transfer

- Saldo setiap akun berawal dari saldo pembuka dan mengikuti transaksi yang tercatat. Angka utama di Ringkasan adalah jumlah saldo akun yang bisa dipakai. Akun yang ditandai khusus tabungan atau dana darurat tampil sebagai dana yang disisihkan dan tetap masuk total saldo. Pilihan periode hanya mengubah rekap pengeluaran dan budget.
- Tarik tunai Rp300.000 dari rekening sendiri dicatat sebagai satu transfer. Rekening turun Rp300.000 dan tunai naik Rp300.000. Total saldo, pemakaian budget, dan pengeluaran tetap sama.
- Jika ada biaya admin, catat sebagai pengeluaran dari akun yang dipotong. Transfer dari akun harian ke akun yang disisihkan mengurangi saldo tersedia dan menambah saldo yang disisihkan dengan nominal yang sama.

## Asumsi rilis pertama

Satu pengguna, Rupiah tanpa pecahan, dan tanggal lokal Indonesia dengan default Asia/Jakarta. Jatah mingguan diatur tersendiri dari jatah bulanan. Penanda tabungan atau dana darurat berlaku untuk seluruh saldo sebuah akun. Menyisihkan sebagian saldo dalam satu akun adalah kebutuhan lanjutan.
