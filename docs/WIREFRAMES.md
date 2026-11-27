# Wireframe PocketPulse

Contoh tampilan HP dengan angka ilustrasi. Navigasi HP mengambang di bawah layar dan berisi Ringkasan, Cashflow, Insight, Budget, dan Pengaturan. Menu aktif disorot. Tombol **+** di samping navigasi membuka form Catat transaksi. Riwayat dibuka dari Ringkasan atau tautan rincian.

Desain untuk mode PWA `standalone` dengan ruang aman di atas dan di bawah layar. Tampilkan petunjuk “Pasang PocketPulse” di Pengaturan saat dibuka dari browser yang mendukung. Saat offline, tampilkan status singkat “Offline · tersimpan di perangkat” sambil mempertahankan akses ke form dan ringkasan.

## Ringkasan

```text
PocketPulse

Saldo tersedia                      Rp3.000.000
Total saldo                         Rp4.000.000
Tabungan & dana darurat               Rp1.000.000

Tren pengeluaran                   25 Nov–24 Des ▾

Saldo akun
  Bank 1                            Rp2.500.000
  Bank 2 · Disisihkan                Rp1.000.000
  Bank digital 1                      Rp300.000
  Bank digital 2                      Rp150.000
  Tunai                                Rp50.000

Sisa budget minggu ini              Lihat semua >
  Weekdays · Ojek                      Rp80.000
  Weekdays · Makan                    Rp120.000

Sisa budget 25 Nov–24 Des            Lihat semua >
  Ojek                                Rp380.000
  Makan                               Rp650.000

Pengeluaran terbesar · 25 Nov–24 Des
  Makan                               Rp350.000  >
  Ojek                                 Rp20.000  >

[ Ringkasan   Cashflow   Insight   Budget   Pengaturan ]    [ + ]
```

Saldo menampilkan kondisi saat ini. Pemilih periode gajian mengubah rekap pengeluaran dan budget bulanan. Pintasan budget mingguan membuka minggu berjalan. Ketuk satu kategori untuk membuka Riwayat dengan periode dan kategori yang sesuai.

## Catat transaksi

```text
Kembali                           Catat transaksi

[ Pengeluaran ]      Pemasukan       Transfer

Nominal                         Rp [ 20.000 ]
Kategori                              [ Ojek ▾ ]
Akun                                [ Bank 1 ▾ ]
Tanggal                          [ 1 Des 2026 ▾ ]
Catatan                               [         ]

[ Simpan transaksi ]
```

Saat memilih Transfer, dua pemilih akun asal dan tujuan menggantikan pemilih akun tunggal dan kategori. Layar edit memakai form yang sama.

Setelah menyimpan Ojek Rp20.000, tampilkan konfirmasi “Transaksi tersimpan” dengan **Sisa Ojek Weekdays Rp80.000** dan **Sisa Ojek 25 Nov–24 Des Rp380.000**. Masing-masing menunjukkan sisa limit untuk periode tersebut.

## Riwayat

```text
Riwayat
[ 1–6 Des ▾ ]    [ Semua akun ▾ ]   [ Semua kategori ▾ ]

1 Desember
  Ojek           Bank 1                   −Rp20.000  >
  Tarik tunai    Bank 1 → Tunai           Rp300.000  >
                 Transfer

[ Ringkasan   Cashflow   Insight   Budget   Pengaturan ]    [ + ]
```

Ketuk transaksi untuk edit atau hapus. Transfer tampil sebagai satu entri, termasuk ketika riwayat difilter dengan akun tujuan.

## Budget

```text
Budget
[ Mingguan ]                 Bulanan

‹        30 Nov–6 Des 2026         ›
[ Salin limit minggu lalu ]

Weekdays · Senin–Jumat
  Ojek                            Sisa Rp80.000
  Jatah Rp100.000 · Terpakai Rp20.000      [ Edit ]
  Makan                          Sisa Rp120.000
  Jatah Rp250.000 · Terpakai Rp130.000     [ Edit ]
  [ + Atur limit kategori ]

Sabtu
  Makan                           Sisa Rp60.000
  Jatah Rp60.000 · Terpakai Rp0           [ Edit ]
  [ + Atur limit kategori ]

Minggu
  Makan                           Sisa Rp50.000
  Jatah Rp50.000 · Terpakai Rp0           [ Edit ]
  [ + Atur limit kategori ]

Ringkasan      Riwayat      Budget      Pengaturan
```

Tab Bulanan menampilkan pemilih periode gajian dengan rentang lengkap, misalnya **25 Nov–24 Des 2026**, dan satu daftar kategori. Ojek pada periode itu punya jatah Rp400.000, terpakai Rp20.000, dan sisa Rp380.000. Status “Lewat Rp…” muncul saat terpakai melebihi limit.

## Pengaturan

```text
Pengaturan

Akun
  Bank 1                                      >
  Bank 2 · Tabungan                           >
  Bank digital 1                              >
  Bank digital 2                              >
  Tunai                                       >
  [ + Tambah akun ]

  Kelola kategori                             >
  Ekspor CSV                                  >
  Unduh backup                                >
  Pulihkan dari backup                        >

Ringkasan      Riwayat      Budget      Pengaturan
```

### Form ikon dan warna

Saat tambah atau edit kategori maupun sumber dana, tampilkan pemilih ikon dan palet warna dengan pratinjau.

```text
Edit kategori                       Pengeluaran
Nama                                  [ Makan ]
Ikon                             [ Alat makan ▾ ]
Warna                                 [ Oranye ▾ ]
Pratinjau                    [ikon oranye] Makan
[ Simpan ]
```

Form sumber dana menempatkan pemilih yang sama di bawah nama dan jenis sumber dana. Tampilkan ikon berwarna di sebelah nama saat memilih akun atau kategori, melihat riwayat, dan membaca saldo atau budget. Nama tetap terlihat pada setiap pilihan warna.
