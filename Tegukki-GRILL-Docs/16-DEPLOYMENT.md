# 16 - Deployment Guide

## 1. Prasyarat Sebelum Deploy

- [ ] Akun Vercel (gratis) sudah dibuat
- [ ] Akun Neon (gratis) sudah dibuat, database Postgres sudah di-provision
- [ ] Akun Pusher (gratis) sudah dibuat, app instance sudah dibuat
- [ ] Akun Sentry (gratis) sudah dibuat untuk error tracking
- [ ] Repository Git (GitHub/GitLab) sudah berisi kode project

---

## 2. Environment Variables

Buat file `.env.local` untuk development, dan set variable yang sama di dashboard Vercel untuk production.

### Template `.env.example`

```bash
# Database (Neon)
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# JWT Auth
JWT_SECRET="ganti-dengan-random-string-minimal-32-karakter"

# Pusher (Realtime)
PUSHER_APP_ID="xxxxx"
PUSHER_KEY="xxxxx"
PUSHER_SECRET="xxxxx"
PUSHER_CLUSTER="ap1"
NEXT_PUBLIC_PUSHER_KEY="xxxxx"
NEXT_PUBLIC_PUSHER_CLUSTER="ap1"

# Vercel Blob (Storage foto produk)
BLOB_READ_WRITE_TOKEN="xxxxx"

# Sentry (Error Tracking)
NEXT_PUBLIC_SENTRY_DSN="xxxxx"
SENTRY_AUTH_TOKEN="xxxxx"

# App
NODE_ENV="production"
```

### Standar Keamanan Secrets

- **Jangan pernah** commit file `.env.local` ke Git — pastikan sudah masuk `.gitignore`.
- `JWT_SECRET` harus random string yang kuat (generate dengan `openssl rand -base64 32` atau sejenisnya), berbeda antara development dan production.
- Semua variable dengan prefix `NEXT_PUBLIC_` akan terekspos ke browser — pastikan hanya isi dengan key yang memang aman untuk publik (misal Pusher public key), JANGAN taruh secret sensitif di sini.
- Set environment variables langsung di dashboard Vercel (Settings → Environment Variables), pisahkan value untuk **Production** dan **Preview/Development** jika perlu berbeda (misal database berbeda untuk testing).

---

## 3. Step-by-Step Deploy ke Production

1. **Push kode ke repository** (GitHub/GitLab) — pastikan branch `main` berisi kode yang sudah lolos QA Checklist (`15-QA-CHECKLIST.md`).
2. **Hubungkan repository ke Vercel**: Dashboard Vercel → "Add New Project" → pilih repository → Vercel otomatis deteksi Next.js.
3. **Set semua Environment Variables** (lihat daftar di atas) di halaman konfigurasi project sebelum deploy pertama.
4. **Jalankan migration database** sebelum deploy pertama kali:
   ```bash
   npx drizzle-kit push
   ```
   (Pastikan `DATABASE_URL` di local mengarah ke database Neon yang sama dengan production, atau jalankan migration terpisah untuk production).
5. **Klik Deploy** — Vercel akan build dan deploy otomatis. Tunggu sampai status "Ready".
6. **Cek domain** — untuk versi awal, gunakan subdomain default Vercel (`tegukki.vercel.app` atau nama project yang dipilih). Domain custom bisa ditambahkan nanti kapan saja lewat Vercel Dashboard → Domains, tanpa perlu redeploy ulang aplikasi.
7. **Setup Sentry**: install `@sentry/nextjs`, jalankan wizard setup (`npx @sentry/wizard@latest -i nextjs`), pastikan `NEXT_PUBLIC_SENTRY_DSN` sudah terisi di environment variables.
8. **Jalankan seluruh `15-QA-CHECKLIST.md` di environment production** (bukan cuma local) sebelum benar-benar dipakai toko sehari-hari.

---

## 4. Automated Preview Deployments

Vercel secara otomatis membuat **preview deployment** terpisah setiap ada push ke branch selain `main` (atau setiap pull request dibuka) — ini sudah aktif secara default tanpa konfigurasi tambahan. Manfaatnya: kamu bisa cek perubahan kode di URL preview terpisah sebelum merge ke `main` (production), tanpa risiko mengganggu sistem yang sedang dipakai toko.

**Rekomendasi workflow sederhana**:
1. Kerjakan perubahan di branch baru (misal `fix-diskon-stacking`)
2. Push ke Git — Vercel otomatis buat preview URL
3. Cek preview URL, jalankan checklist relevan dari `15-QA-CHECKLIST.md`
4. Kalau sudah OK, merge ke `main` — otomatis deploy ke production

---

## 5. Rollback Procedure

Jika setelah deploy production ternyata ada bug fatal (misal transaksi tidak bisa disubmit):

1. Buka **Vercel Dashboard → Deployments**
2. Cari deployment **sebelumnya** yang masih berjalan normal (biasanya yang berlabel "Production" sebelum perubahan terbaru)
3. Klik menu tiga titik pada deployment tersebut → **"Promote to Production"**
4. Vercel langsung mengalihkan traffic production ke versi sebelumnya — proses ini instan (tidak perlu build ulang)
5. Setelah rollback, investigasi bug di environment local/preview, perbaiki, baru deploy ulang setelah lolos QA Checklist

**Catatan penting**: Rollback kode TIDAK otomatis membatalkan perubahan skema database (kalau perubahan bug juga mengubah struktur tabel). Jika perubahan terbaru menyertakan migration database, rollback kode saja mungkin tidak cukup — pertimbangkan juga apakah migration perlu di-revert (jarang terjadi untuk perubahan kecil, tapi penting diperiksa).

---

## 6. Backup Database

Neon menyediakan **Point-in-Time Recovery (PITR)** otomatis di free tier — database bisa direstore ke kondisi beberapa hari ke belakang tanpa setup tambahan dari sisi kamu. Untuk skala toko 1 lokasi, ini dianggap cukup sebagai strategi backup (sesuai keputusan) — tidak perlu setup backup manual/eksternal tambahan di awal.

---

## 7. Error Tracking (Sentry)

Setelah setup awal (langkah 7 di atas), Sentry otomatis menangkap:
- Error yang terjadi di frontend (React component crash)
- Error yang terjadi di backend (API route yang throw exception)

**Rekomendasi**: cek dashboard Sentry secara berkala (terutama di minggu-minggu awal setelah go-live) untuk menangkap bug yang mungkin tidak dilaporkan langsung oleh kasir/pegawai di lapangan.
