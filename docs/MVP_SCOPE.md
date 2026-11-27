# Scope MVP PocketPulse

## Rilis pertama

- **PWA.** Pasang PocketPulse di layar utama HP. Setelah pemuatan online pertama selesai dan aplikasi siap offline, buka ulang, catat atau koreksi transaksi, serta lihat saldo dan kelola budget tanpa koneksi.
- **Akun dan kategori.** Buat sumber dana berupa bank, bank digital, atau tunai dengan saldo awal. Ubah nama akun, tandai akun khusus tabungan atau dana darurat, dan buat kategori pemasukan atau pengeluaran. Pilih dan edit ikon serta warna untuk setiap sumber dana dan kategori.
- **Transaksi.** Tambah, edit, dan hapus pemasukan, pengeluaran, serta transfer. Sediakan riwayat dengan filter tanggal, kategori, dan akun. Filter akun menampilkan transfer pada kedua akun terkait.
- **Budget.** Atur limit mingguan per bagian dan kategori, serta limit bulanan per kategori untuk tanggal 25–24. Lihat jatah, terpakai, dan sisa. Salin rencana minggu sebelumnya ke minggu yang belum diisi.
- **Ringkasan.** Lihat saldo tersedia, total saldo, jumlah yang disisihkan untuk tabungan atau dana darurat, dan rincian tiap akun. Lihat kategori pengeluaran tertinggi di periode gajian yang dipilih, serta sisa limit mingguan dan bulanan setelah mencatat pengeluaran.
- **Portabilitas data.** Sediakan backup JSON dan pemulihan sejak tahap pencatatan pertama. Ekspor CSV transaksi, rekap mingguan, dan rekap bulanan untuk dibuka di Excel atau Google Sheets.

## Setelah MVP

- Tombol perbarui Google Sheets dengan sinkronisasi satu arah dari PocketPulse, bila CSV mulai merepotkan.
- Impor mutasi bank atau e-wallet, transaksi berulang, pencadangan tabungan dalam rekening campuran, dan sinkronisasi lintas perangkat.
- Aplikasi native, banyak pengguna, dan multi-mata uang.

## Kriteria siap pakai

1. Lima akun bisa dibuat dan total saldonya benar. Rekening yang ditandai khusus tabungan atau dana darurat tetap masuk total saldo dan dikecualikan dari saldo tersedia.
2. Pengeluaran umum bisa dicatat dari HP dalam target awal sekitar 15 detik setelah pengaturan awal. Pengukuran dilakukan saat uji pakai pribadi.
3. Pengeluaran Selasa, Sabtu, dan Minggu memakai bagian mingguan yang tepat. Transaksi tanggal 24 dan 25 masuk ke dua periode bulanan berbeda meskipun berada di minggu yang sama. Ringkasan dan ekspor menampilkan rentang periode yang digunakan.
4. Transfer mengubah dua saldo dengan nominal yang sama. Hapus atau edit transfer memperbarui kedua saldo, dan ringkasan belanja tetap konsisten.
5. Edit kategori, tanggal, atau nominal transaksi memperbarui saldo dan ringkasan terkait. Pergantian minggu atau bulan memulai perhitungan untuk periode yang baru.
6. CSV terbaca di spreadsheet dan memuat transfer dengan tipe tersendiri. Backup dari profil browser awal bisa dipulihkan ke profil bersih dengan hasil saldo, transaksi, dan limit yang sama.
7. PWA bisa dipasang melalui Chrome di Android dan Safari di iPhone. Setelah siap offline, tutup dan buka kembali dari layar utama dalam mode pesawat. Transaksi dan perubahan limit yang disimpan tetap ada setelah aplikasi dibuka ulang dan diperbarui.
8. Ikon dan warna sumber dana serta kategori tampil bersama namanya, bertahan setelah dibuka ulang, dan ikut pulih dari backup. Ubah tampilan salah satu sumber dana atau kategori yang sudah dipakai dan cocokkan kembali transaksi, saldo, serta budget terkait.
