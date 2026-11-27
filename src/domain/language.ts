import type { Language } from './amount.ts'

const preferenceKey = 'pocketpulse.language'
function savedLanguage(): Language {
  try { return typeof localStorage !== 'undefined' && localStorage.getItem(preferenceKey) === 'en' ? 'en' : 'id' }
  catch { return 'id' }
}
let language = savedLanguage()
const listeners = new Set<() => void>()

export const getLanguage = () => language
export const getLocale = () => getLanguage() === 'en' ? 'en-GB' : 'id-ID'
export function setLanguage(next: Language) {
  if (next === language) return
  language = next
  try { localStorage.setItem(preferenceKey, next) } catch { /* Continue for this session. */ }
  listeners.forEach(listener => listener())
}
export function subscribeLanguage(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

const english = new Map(`
Data masih dimuat.|The ledger is still loading.
Buka menu browser untuk memasang PocketPulse.|Open your browser menu to install PocketPulse.
Navigasi utama|Main navigation
Ruang contoh|Demo workspace
Data demo|Demo data
Ruang pribadi|Personal workspace
Perangkat ini|This device
Keuangan pribadi|Personal finance
Siap offline|Ready offline
Data contoh|Sample data
Versi baru tersedia.|A new version is ready.
Muat ulang|Reload
Penyimpanan perangkat gagal dibuka.|Unable to open device storage.
Memuat catatan keuangan…|Loading your ledger…
Coba lagi|Try again
Catat transaksi|Record transaction
Tutup pemberitahuan|Close notification
Login gagal. Periksa email, kata sandi, dan koneksi.|Sign-in failed. Check your email, password, and connection.
Konfigurasi belum lengkap|Configuration incomplete
Isi URL Supabase dan publishable key untuk mengaktifkan login.|Enter the Supabase URL and publishable key to enable sign-in.
Memuat sesi…|Loading session…
Masuk ke PocketPulse|Sign in to PocketPulse
Kata sandi|Password
Sedang masuk…|Signing in…
Masuk|Sign in
Pasang PocketPulse|Install PocketPulse
Tidak ada catatan cloud untuk diunduh.|There is no cloud ledger to download.
Cadangan cloud gagal diunduh.|Unable to download the cloud backup.
Gagal keluar. Coba lagi saat koneksi tersedia.|Unable to sign out. Try again when you are online.
Sinkronisasi Supabase|Supabase sync
Perubahan disimpan di perangkat dahulu dan disinkronkan saat online.|Changes are saved on this device first and synced when online.
Sedang menyinkronkan|Syncing
Perubahan belum tersinkron|Unsynced changes
Tersinkron|Synced
Siap menyinkronkan|Ready to sync
Terakhir berhasil sinkron|Last successful sync
Data perangkat dan cloud sama.|Your device and cloud are up to date.
Versi perangkat dan cloud berbeda. Unduh kedua backup sebelum memilih versi yang ingin dipulihkan.|Device and cloud versions conflict. Download both backups before choosing a version to restore.
Sinkronkan|Sync now
Unduh versi cloud|Download cloud version
Keluar|Sign out
Belum diatur|Not set
Ringkasan|Overview
Saldo, pengeluaran, dan sisa budget kamu.|Your balances, spending, and remaining budgets.
Periode sebelumnya|Previous period
Periode berikutnya|Next period
Periode gajian|Pay period
Total saldo|Total balance
Saldo tersedia|Available balance
Tabungan & dana darurat|Savings & emergency funds
Disisihkan|Set aside
Pemasukan|Income
Pengeluaran|Expenses
Sumber dana|Funding account
Saldo di setiap akun|Balance by account
Kelola|Manage
Tabungan|Savings
Belum ada sumber dana. Tambahkan akun dari Pengaturan.|No funding accounts yet. Add one from Settings.
Sisa budget|Remaining budget
Jatah yang sudah kamu atur|Your planned limits
Lihat budget|View budget
Minggu ini|This week
Sisa jatah hari ini|Available today
Pengeluaran terbesar|Top expenses
Per kategori di periode ini|By category for this period
Belum ada pengeluaran di periode ini.|No expenses in this period.
Transaksi terbaru|Recent transactions
Riwayat pencatatan terakhir|Your latest entries
Lihat riwayat|View history
Belum ada transaksi. Tambahkan transaksi pertamamu.|No transactions yet. Record your first one.
terpakai dari|spent of
Edit transaksi|Edit transaction
Edit sumber dana|Edit funding account
Tambah sumber dana|Add funding account
Edit kategori|Edit category
Tambah kategori|Add category
Atur limit budget|Set budget limit
Data gagal disimpan.|Unable to save the data.
Tanggal transaksi maksimal hari ini.|Transaction date cannot be in the future.
Transaksi tersimpan|Transaction saved
Perubahan tersimpan|Changes saved
Hapus limit ini?|Delete this limit?
Hapus transaksi ini?|Delete this transaction?
Catatan dihapus|Entry deleted
Hapus|Delete
Tutup|Close
Menyimpan…|Saving…
Simpan|Save
Pilih sumber dana|Choose a funding account
Pembayaran Tithe|Tithe payment
Favorit transaksi|Transaction favorites
Akun asal|From account
Akun tujuan|To account
Nominal|Amount
Alokasi Tithe yang dipilih|Selected tithe allocation
Pilih kategori|Choose a category
Simpan sebagai favorit|Save as a favorite
Sisihkan Tithe (10%)|Set aside tithe (10%)
Catatan (opsional)|Note (optional)
Contoh: makan siang|Example: lunch
Ikon|Icon
Warna|Color
Pratinjau ikon|Icon preview
Kereta|Train
Mobil|Car
Taksi|Taxi
Pesawat|Plane
Kapal|Ship
Bahan bakar|Fuel
Parkir|Parking
Belanja bahan pokok|Groceries
Kesehatan|Health
Pendidikan|Education
Hewan peliharaan|Pets
Pakaian|Clothing
Olahraga|Fitness
Nama sumber dana|Funding account name
Jenis|Type
Saldo awal (Rp)|Opening balance (Rp)
Tanggal saldo awal|Opening balance date
Khusus tabungan atau dana darurat|Savings or emergency fund account
Saldo akun ini disisihkan dari Saldo tersedia.|This account's balance is excluded from available balance.
Nama kategori|Category name
Kategori induk|Parent category
Kategori utama|Top-level category
Riwayat|History
Periksa dan koreksi setiap transaksi.|Review and correct your transactions.
Dari|From
Sampai|To
Semua akun|All accounts
Kategori|Category
Semua kategori|All categories
Hapus filter bagian|Remove day-group filter
Tidak ada transaksi untuk filter ini.|No transactions match these filters.
Minggu ini sudah punya limit.|This week already has limits.
Minggu sebelumnya belum punya limit.|The previous week has no limits.
Limit minggu sebelumnya tersalin|Previous week's limits copied
Limit gagal disalin.|Unable to copy the limits.
Atur jatah dan lihat pemakaian per kategori.|Set limits and see spending by category.
Mingguan|Weekly
Bulanan|Monthly
Salin limit minggu lalu|Copy last week's limits
Jatah per kategori|Limits by category
Atur limit|Set limit
Jatah|Limit
Terpakai|Spent
Sisa|Remaining
Belum ada limit atau pengeluaran di bagian ini.|This section has no limits or expenses yet.
Tambahkan kategori pengeluaran di Pengaturan.|Add an expense category in Settings.
Atur|Set
Tanggal|Date
Nominal IDR|Amount IDR
Tujuan transfer|Transfer destination
Bagian minggu|Day group
Awal minggu|Week start
Akhir minggu|Week end
Jatah IDR|Limit IDR
Terpakai IDR|Spent IDR
Sisa IDR|Remaining IDR
Awal periode|Period start
Akhir periode|Period end
Catatan|Note
Ganti catatan yang ada dengan isi backup ini?|Replace the current ledger with this backup?
Backup berhasil dipulihkan|Backup restored
Backup tidak dapat dibaca.|Unable to read the backup.
Ganti data contoh dengan ruang pencatatan kosong?|Replace the sample data with an empty workspace?
Ruang pribadi siap. Tambahkan sumber dana pertamamu.|Your workspace is ready. Add your first funding account.
Ruang pribadi gagal dibuat.|Unable to create a personal workspace.
Pengaturan|Settings
Kelola tampilan akun, kategori, dan data PocketPulse.|Manage accounts, categories, and PocketPulse data.
Coba alur PocketPulse atau mulai dengan catatan kosong.|Try PocketPulse or start with an empty ledger.
Mulai ruang pribadi|Start a personal workspace
Bank, bank digital, dan tunai|Banks, digital banks, and cash
Tambah|Add
Belum ada sumber dana.|No funding accounts yet.
Pengelompokan transaksi|Transaction categories
Belum ada kategori.|No categories yet.
Nama kategori baru|New category name
Misalnya Gaji|For example, Salary
Misalnya Makan|For example, Food
Isi nama kategori.|Enter a category name.
Data dan backup|Data and backups
Data tersimpan di perangkat ini.|Data is stored on this device.
CSV transaksi|Transaction CSV
CSV mingguan|Weekly CSV
CSV bulanan|Monthly CSV
Unduh backup|Download backup
Pulihkan backup|Restore backup
Akses dari HP|Mobile access
PocketPulse berjalan sebagai aplikasi terpasang.|PocketPulse is running as an installed app.
Buka langsung dari layar utama.|Open directly from your home screen.
Di Chrome Android, pilih Tambahkan ke Layar Utama lalu Pasang aplikasi. Di Safari iPhone, gunakan Bagikan → Tambahkan ke Layar Utama, lalu aktifkan Buka sebagai App Web.|In Chrome for Android, choose Add to Home screen, then Install app. In Safari for iPhone, choose Share → Add to Home Screen and turn on Open as Web App.
Pengeluaran per hari|Daily expenses
Ketuk batang untuk melihat nominal|Select a bar to see the amount
Grafik pengeluaran per hari|Daily expense chart
Lihat pengeluaran|View expenses
Dialokasikan periode ini|Allocated this period
Sudah dibayar dari alokasi periode ini|Paid from this period's allocations
Belum dibayar (semua periode)|Unpaid across all periods
Tithe / Persepuluhan|Tithe
Alokasi dari pemasukan dan riwayat pembayaran|Income allocations and payment history
Ringkas riwayat|Show recent history
Semua riwayat|All history
Catat pembayaran|Record payment
Lunas|Paid
Dibayar sebagian|Partially paid
Belum dibayar|Unpaid
alokasi ·|allocated ·
belum dibayar|unpaid
Centang Sisihkan Tithe (10%) saat mencatat pemasukan untuk membuat alokasi.|Select Set aside tithe (10%) when recording income to create an allocation.
Tambah tiga nol|Add three zeros
Perangkat sedang offline. Catatan tersimpan di perangkat ini.|This device is offline. Your ledger is saved on this device.
Gunakan catatan pribadi sebelum menyinkronkan data.|Switch to a personal ledger before syncing.
Catatan lokal baru berubah. Jalankan sinkronisasi lagi.|Local records just changed. Try syncing again.
Sinkronisasi gagal.|Sync failed.
Bank digital|Digital bank
Tunai|Cash
Hijau|Green
Jingga|Orange
Biru|Blue
Ungu|Purple
Merah muda|Pink
Abu-abu|Gray
Merah|Red
Kuning|Yellow
Toska|Teal
Cokelat|Brown
Dompet|Wallet
Kartu|Card
Makan|Food
Transportasi|Transport
Belanja|Shopping
Kopi|Coffee
Rumah|Home
Pekerjaan|Work
Tagihan|Bills
Hadiah|Gift
Senin–Jumat|Monday–Friday
Sabtu|Saturday
Minggu|Sunday
Masukkan nominal dalam Rupiah utuh.|Enter an amount in whole Rupiah.
Nominal di luar batas yang diperbolehkan.|The amount is out of range.
Format backup PocketPulse tidak dikenali.|Unknown PocketPulse backup format.
Isi catatan tidak lengkap.|The ledger is incomplete.
Terdapat ID catatan ganda.|The ledger contains duplicate IDs.
Sumber dana tidak valid.|Invalid funding account.
Kategori tidak valid.|Invalid category.
Pilih kategori induk pengeluaran yang valid.|Choose a valid parent expense category.
Favorit transaksi tidak valid.|Invalid transaction favorite.
Terdapat favorit ganda.|The ledger contains duplicate favorites.
Tanggal atau nominal transaksi tidak valid.|Invalid transaction date or amount.
Akun asal dan tujuan harus berbeda.|The source and destination accounts must be different.
Pilih dua sumber dana dan tanggal setelah atau pada tanggal saldo awal.|Choose two accounts and a date on or after their opening balance dates.
Pilih kategori yang sesuai jenis transaksi.|Choose a category that matches the transaction type.
Pilih sumber dana dan tanggal setelah atau pada tanggal saldo awal.|Choose an account and a date on or after its opening balance date.
Pilihan Tithe tidak valid.|Invalid tithe option.
Pemasukan terlalu kecil untuk alokasi Tithe.|The income is too small for a tithe allocation.
Pembayaran Tithe harus merujuk alokasi dan tanggal pemasukan yang valid.|Tithe payments must reference a valid allocation and income date.
Pembayaran Tithe melebihi alokasi.|Tithe payments exceed the allocation.
Awal periode harus tanggal 25.|The pay period must start on the 25th.
Periode budget mingguan tidak valid.|Invalid weekly budget period.
Limit budget atau kategori tidak valid.|Invalid budget limit or category.
Terdapat limit ganda.|The ledger contains duplicate limits.
Total nominal melebihi batas perhitungan yang aman.|Total amounts exceed safe calculation limits.
Koneksi Supabase belum dikonfigurasi.|Supabase is not configured.
Data Supabase gagal dibaca. Coba lagi saat koneksi tersedia.|Unable to read data from Supabase. Try again when online.
Data Supabase gagal disimpan. Perubahan masih ada di perangkat ini.|Unable to save to Supabase. Changes are still on this device.
Versi cloud berubah. Jalankan sinkronisasi lagi.|The cloud version changed. Sync again.
Status sinkronisasi gagal disimpan.|Unable to save sync status.
{count} perubahan transaksi ditarik dari cloud|Downloaded transaction changes: {count}
{count} perubahan transaksi diunggah ke cloud|Uploaded transaction changes: {count}
Sisa {amount}|{amount} left
Lewat {amount}|{amount} over budget
Tithe {amount} sudah dibayar. Perubahan akan menghitung ulang alokasi. Lanjutkan?|{amount} of tithe is already paid. This change will recalculate the allocation. Continue?
Bahasa|Language
Pengingat harian|Daily reminder
Catat pengeluaranmu setiap malam pukul 20.00 WIB.|Record your expenses every evening at 8:00 PM Jakarta time.
Izin notifikasi belum diberikan. Periksa pengaturan browser atau perangkat.|Notification permission is not granted. Check your browser or device settings.
PocketPulse sedang menyiapkan PWA. Muat ulang dan coba lagi.|PocketPulse is setting up the PWA. Reload and try again.
Pengingat gagal dinonaktifkan. Coba lagi saat online.|Unable to disable the reminder. Try again when online.
Langganan notifikasi tidak valid.|Invalid notification subscription.
Langganan notifikasi gagal dibaca.|Unable to read the notification subscription.
Perangkat ini mungkin terhubung ke pengingat akun lain. Nonaktifkan pengingat dari akun tersebut dulu.|This device may already be subscribed under another account. Turn off reminders in that account first.
Pengingat gagal diaktifkan. Coba lagi saat online.|Unable to enable the reminder. Try again when online.
Pengaturan pengingat gagal diperbarui.|Unable to update the reminder settings.
Buka PocketPulse sebagai PWA di perangkat yang mendukung notifikasi.|Open PocketPulse as a PWA on a device that supports notifications.
Memeriksa pengingat…|Checking reminder availability…
Pengingat belum tersedia. Buka kembali PocketPulse saat online.|Reminders are unavailable. Reopen PocketPulse when online.
Nonaktifkan pengingat|Turn off reminders
Aktifkan pengingat|Turn on reminders
Pengeluaran periode ini|Spent this period
{percent} dari budget {amount}|{percent} of {amount} budget
Budget belum diatur|No budget set
Sisa {count} hari|{count} days left
Rata-rata harian|Daily average
Terbesar|Largest expense
Tren pengeluaran|Spending trend
Lihat semua|View all
dari {amount}|of {amount}
3 periode|3 periods
12 periode|12 periods
Tren pengeluaran dan budget|Spending trends and budgets
Periode pengeluaran|Spending period
Dibanding periode sebelumnya|Compared with the previous period
vs sebelumnya|vs previous
Rincian kategori|Category breakdown
Target budget|Budget goals
Grafik pengeluaran|Spending chart
`.trim().split('\n').map(line => line.split('|') as [string, string]))

export function t(source: string, params?: Record<string, string | number>, selected = getLanguage()) {
  const message = selected === 'en' ? english.get(source) ?? source : source
  return message.replace(/\{(\w+)\}/g, (token, key: string) => String(params?.[key] ?? token))
}
