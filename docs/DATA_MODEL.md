# Data Model PocketPulse

## Representasi dan penyimpanan

- **Uang.** Simpan nominal sebagai bilangan bulat Rupiah. Gunakan `Number.isSafeInteger` untuk validasi input dan hasil penjumlahan. Nominal transaksi harus positif. Limit boleh nol. Saldo awal dan hasil saldo akun boleh negatif. Format `Rp` hanya untuk tampilan.
- **Tanggal.** Simpan tanggal pembukuan sebagai tanggal kalender `YYYY-MM-DD`, tanpa jam. Gunakan Asia/Jakarta untuk menentukan tanggal default hari ini. Perhitungan periode memakai tanggal yang tersimpan agar tetap sama saat perangkat berpindah zona waktu.
- **ID.** Gunakan UUID untuk akun, kategori, dan transaksi. Simpan relasi dengan ID agar nama akun dan kategori bisa diubah sambil mempertahankan riwayat.

## Entitas

```text
Account
  id, name, type: bank | digital_bank | cash
  openingBalanceIdr, openingDate, isSavings, iconKey, colorKey

Category
  id, name, type: income | expense, iconKey, colorKey

Transaction
  id, type, date, amountIdr, note?
  income | expense: accountId, categoryId
  transfer: fromAccountId, toAccountId

MonthlyBudget
  periodStart: YYYY-MM-DD, categoryId, limitIdr
  unique: [periodStart, categoryId]

WeeklyBudget
  weekStart: YYYY-MM-DD, segment, categoryId, limitIdr
  segment: weekdays | saturday | sunday
  unique: [weekStart, segment, categoryId]
```

Frontend menyimpan satu snapshot di store `ledger` IndexedDB, dengan koleksi `accounts`, `categories`, `transactions`, `monthlyBudgets`, dan `weeklyBudgets`. Validasi menerapkan keunikan ID dan kunci gabungan sesuai skema. Setiap perubahan membaca dan menyimpan snapshot dalam satu transaksi IndexedDB. Backup JSON memakai `schemaVersion` dan menyertakan kelima koleksi.

`iconKey` dan `colorKey` merujuk pilihan bawaan yang tersedia offline. Form mengisi pilihan awal sesuai jenis sumber dana atau kategori. Simpan kedua pilihan pada akun atau kategori dan sertakan di backup. Riwayat dan budget membaca tampilannya dari ID yang sudah dirujuk, sehingga perubahan ikon atau warna mengikuti nama dan tampilan terbaru.

## Validasi

- Akun dan kategori yang dirujuk harus tersedia. Jenis kategori harus cocok dengan jenis pemasukan atau pengeluaran. Budget hanya menerima kategori pengeluaran. Transfer memerlukan dua akun berbeda.
- Ikon dan warna harus memakai kunci yang tersedia di katalog. Pertahankan kunci yang sudah digunakan saat katalog diperbarui agar data dan backup lama tetap bisa dibuka.
- `openingBalanceIdr` adalah saldo sebelum transaksi pertama pada `openingDate`. Tanggal transaksi minimum adalah `openingDate` setiap akun yang terlibat. Catat saldo awal dan pilih tanggal mulai yang cocok dengan riwayat yang ingin dimasukkan.
- Tanggal harus valid pada kalender. `weekStart` harus hari Senin dan `periodStart` harus tanggal 25. Pembatasan referensi juga berlaku saat pemulihan backup. Tolak penghapusan akun atau kategori dengan transaksi atau budget terkait agar riwayat tetap utuh.
- Untuk pemulihan, validasi versi, kunci unik, nilai, dan semua relasi sebelum mengganti data. Ganti seluruh isi dalam satu transaksi IndexedDB sehingga kegagalan tidak menghasilkan data yang pulih sebagian.

## Perhitungan

- Saldo akun dihitung dari saldo awal ditambah pemasukan dan transfer masuk, lalu dikurangi pengeluaran dan transfer keluar. Satu transfer disimpan sebagai satu record. Perubahan tanggal, tipe, nominal, atau akun diterapkan ke record itu dalam satu operasi.
- Total saldo adalah jumlah saldo seluruh akun. Total tabungan adalah jumlah saldo akun dengan `isSavings = true`.
- Periode bulanan berawal dari tanggal 25 pada bulan transaksi jika tanggalnya 25 atau lebih. Jika tanggalnya 1–24, gunakan tanggal 25 bulan sebelumnya. Batas waktu kueri adalah `periodStart <= date < nextPeriodStart`. Untuk tampilan dan CSV, gunakan rentang tanggal 25 sampai tanggal 24 sebagai tanggal terakhir yang termasuk.
- Angka terpakai bulanan adalah jumlah transaksi `expense` dengan kategori dan `periodStart` yang sama. Angka terpakai mingguan mencocokkan kategori, Senin awal minggu, dan bagian hari. `sisa = limitIdr - terpakai` untuk tiap limit.
- Hitung peringkat kategori pengeluaran dari transaksi `expense` pada periode gajian yang dipilih. Limit kosong berarti belum dianggarkan, sementara Rp0 adalah limit yang sah. Peringkat dan total pengeluaran berasal dari transaksi yang sama.
- Turunkan periode dan bagian minggu dari tanggal transaksi. Hitung saldo dan rekap dari catatan yang tersimpan setiap kali datanya berubah.
