# Deploy manual PocketPulse ke Supabase dan Vercel

Panduan ini memakai branch `dev`, proyek Supabase dev `pyhhusupwlynslfgessy`, dan Vercel **Preview**. Jalankan perintah dari folder utama repo PocketPulse.

- [Supabase dev](https://supabase.com/dashboard/project/pyhhusupwlynslfgessy)
- [Vercel Deployments](https://vercel.com/raphchristophr/pocketpulse/deployments)
- [PocketPulse Preview untuk branch dev](https://pocketpulse-git-dev-raphchristophr.vercel.app/)

## 1. Tentukan apa yang perlu deploy

- **Tampilan atau frontend saja**, seperti layout dan palet hijau. Lanjut langsung ke Vercel.
- **Database**, seperti tabel baru, perubahan kolom, atau kebijakan RLS. Terapkan migrasi Supabase dulu, kemudian deploy frontend jika frontend ikut berubah.
- **Edge Function atau pengingat harian.** Terapkan migrasi terkait, deploy fungsi yang berubah, lalu cek secrets dan jadwal Cron. Kalau perubahan hanya di backend, deploy Supabase saja cukup.

Commit palet hijau `8b9388e` sudah berstatus sukses di Vercel Preview dan tidak perlu migrasi Supabase. Kalau kamu ingin membangun ulang commit itu, ikuti langkah *Redeploy* di bawah. [Status deployment palet hijau](https://vercel.com/raphchristophr/pocketpulse/32cixzFUi9VWJRXioXBYojXfV6V9)

## 2. Supabase dev

### Kalau ada migrasi database

Pasang Supabase CLI versi 3 atau lebih baru agar perintah di bawah memakai opsi `--remote`. Login, tautkan repo ke proyek dev, dan periksa riwayat migrasi. [Panduan Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)

```sh
supabase --version
supabase login
supabase link --project-ref pyhhusupwlynslfgessy
supabase migration list --remote
```

Dua migrasi awal PocketPulse pernah dijalankan lewat SQL Editor. Kalau nomor versi muncul di kolom lokal saja, buka proyek dev dan cocokkan **tabel, kolom, constraint, hak akses, dan kebijakan RLS** dengan file SQL terkait.

- `20261126000100` membuat tabel `public.pocketpulse_ledgers` untuk sinkronisasi. [File migrasi ledger](../supabase/migrations/20261126000100_create_ledgers.sql)
- `20261127000100` membuat tabel `public.pocketpulse_reminders` untuk langganan notifikasi. [File migrasi pengingat](../supabase/migrations/20261127000100_add_reminder_subscriptions.sql)

Kalau semua perubahan dari satu file sudah ada dan versinya belum tercatat remote, jalankan baris `repair` untuk versi itu saja. Perintah ini mencatat riwayat migrasi tanpa menjalankan SQL dari file tersebut. Kalau tabel dan perubahan SQL memang belum ada, biarkan migrasi diterapkan lewat `db push`. Jika skema hanya cocok sebagian, selesaikan perbedaannya sebelum melanjutkan. [Panduan migrasi Supabase](https://supabase.com/docs/guides/deployment/database-migrations), [Referensi migration repair](https://supabase.com/docs/reference/cli/supabase-migration-repair)

```sh
supabase migration repair 20261126000100 --status applied --remote
supabase migration repair 20261127000100 --status applied --remote
```

Jalankan dry run. Lanjutkan ke `db push` hanya jika daftar migrasinya sesuai dengan yang ingin kamu terapkan. Buat backup dulu kalau migrasi menyentuh data yang sudah ada. Setelah push, pastikan nomor versi baru terlihat di kolom remote dan cek tabel serta kebijakannya di Dashboard. [Perintah lokal dan remote Supabase](https://supabase.com/docs/guides/local-development/local-and-hosted-projects)

```sh
supabase db push --dry-run --remote
supabase db push --remote
supabase migration list --remote
```

### Kalau mau mengaktifkan atau memperbarui pengingat pukul 20.00 WIB

1. Pastikan tabel `pocketpulse_reminders` sudah ada setelah langkah migrasi di atas.
2. Di **Edge Functions → Secrets**, pastikan `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, dan `POCKETPULSE_CRON_SECRET` tersedia. Kalau belum punya pasangan VAPID, buat dengan `npx web-push generate-vapid-keys` dan simpan hasilnya di tempat aman. Pakai pasangan yang sama saat redeploy supaya langganan perangkat tetap bisa digunakan. Kalau secret Cron belum ada, buat nilai acak dengan `openssl rand -hex 32`. [Pengaturan secrets Edge Functions](https://supabase.com/docs/guides/functions/secrets), [CLI web-push](https://github.com/web-push-libs/web-push#command-line)
3. Deploy fungsi dari repo. Konfigurasi `verify_jwt = false` sudah disetel khusus untuk fungsi ini. Kode fungsi menyediakan kunci VAPID publik lewat GET dan memeriksa secret Cron untuk POST. [Konfigurasi repo](../supabase/config.toml), [Panduan deploy Edge Functions](https://supabase.com/docs/guides/functions/deploy)

```sh
supabase functions deploy nightly-reminders --project-ref pyhhusupwlynslfgessy
curl -fsS https://pyhhusupwlynslfgessy.supabase.co/functions/v1/nightly-reminders
```

GET seharusnya mengembalikan JSON dengan `publicKey` yang terisi. Langkah itu memeriksa bahwa perangkat bisa mengambil kunci untuk berlangganan.

4. Simpan **nilai yang sama** dengan `POCKETPULSE_CRON_SECRET` di **Vault** dengan nama `pocketpulse_cron_secret`. Aktifkan integrasi **Cron** dan ekstensi `pg_net` jika belum tersedia. Di **Integrations → Cron → Jobs**, cek apakah sudah ada job yang memanggil `nightly-reminders`. Kalau ada, edit job itu supaya hanya satu yang berjalan. Pakai jadwal `0 13 * * *` pada scheduler UTC, setara pukul 20.00 WIB. Buat job jenis **SQL snippet** dan isi dengan SQL ini agar nilai secret dibaca dari Vault saat job berjalan. [Panduan Supabase Cron](https://supabase.com/docs/guides/cron/quickstart), [Edge Functions terjadwal dan Vault](https://supabase.com/docs/guides/functions/schedule-functions)

```sql
select net.http_post(
  url := 'https://pyhhusupwlynslfgessy.supabase.co/functions/v1/nightly-reminders',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'pocketpulse_cron_secret'
    )
  ),
  body := '{}'::jsonb
) as request_id;
```

5. Di PWA pada perangkat uji, buka **Pengaturan → Pengingat harian**, beri izin, dan aktifkan pengingat. Setelah jadwal berjalan, cek riwayat Cron, respons di log **Edge Functions**, dan notifikasi yang diterima perangkat. Status sukses Cron menunjukkan permintaan sudah masuk antrean. Respons fungsi dan notifikasi di perangkat yang memastikan pengiriman berhasil.

## 3. Vercel Preview

Di proyek PocketPulse, periksa **Settings → Environment Variables**. Untuk lingkungan **Preview** branch `dev`, isi `VITE_SUPABASE_URL` dari Supabase dev dan `VITE_SUPABASE_PUBLISHABLE_KEY` dari menu **API Keys** di proyek yang sama. Variabel dengan awalan `VITE_` ikut masuk ke build browser. Simpan kunci layanan Supabase, kunci VAPID privat, dan secret Cron di backend. Preset proyek ini **Vite**, Build Command `npm run build`, dan Output Directory `dist`. [Environment Variables di Vercel](https://vercel.com/docs/environment-variables), [Vite di Vercel](https://vercel.com/docs/frameworks/frontend/vite)

### Kalau ada commit baru

Pastikan kamu di branch `dev`. Jalankan verifikasi, lalu push commit yang ingin dipasang. Kalau perubahan masih terlihat sebagai file yang belum di-commit, stage file yang relevan dan commit dulu.

```sh
git status -sb
npm ci
npm test
npm run build
git log -1 --oneline
git push origin dev
```

Vercel biasanya membuat Preview otomatis setelah push. Kalau perlu memulai build sendiri, pilih **Deployments → Create Deployment**, lalu masukkan branch `dev` atau SHA spesifik yang sudah ada di GitHub. Pilih konfigurasi branch `dev` jika Vercel meminta pilihan branch. [Deploy dari referensi Git di Vercel](https://vercel.com/docs/git#creating-a-deployment-from-a-git-reference)

### Kalau mau deploy ulang commit yang sama

Di **Deployments**, temukan deployment dari branch `dev` dengan commit yang ingin dibangun ulang. Buka menu **⋯ → Redeploy**, lalu cek target **Preview** sebelum konfirmasi. Ini juga cara menerapkan perubahan variabel Preview ke build baru. [Mengelola deployment Vercel](https://vercel.com/docs/deployments/managing-deployments)

### Cek hasil

- Di Vercel, cocokkan SHA commit dan pastikan status **Ready** dengan lingkungan **Preview**.
- Buka URL Preview branch `dev` di HP, lalu masuk dengan akun uji Supabase dev. Kalau PWA menampilkan **Versi baru tersedia**, selesaikan form yang sedang terbuka lalu tekan **Muat ulang**.
- Kalau deploy ikut mengubah sinkronisasi, simpan transaksi dummy, lalu cek bahwa transaksi yang sama bisa ditarik dari profil browser kedua dengan akun uji yang sama.
- Untuk rilis **Production**, siapkan konfigurasi Supabase dan variabel **Production** secara terpisah, lalu rilis melalui branch produksi proyek sesuai alur repo. Langkah di atas untuk `dev` dan **Preview**.
