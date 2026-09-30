# 10 - Tech Stack

## 1. Ringkasan Stack

| Layer | Pilihan | Alasan |
|---|---|---|
| **Framework** | Next.js 14+ (App Router) + TypeScript | Frontend & backend dalam satu codebase/deployment — menyederhanakan operasional untuk tim kecil. Mendukung Server Components untuk performa, dan API Routes untuk backend logic. |
| **Database** | PostgreSQL (via **Neon**) | Relational database, cocok untuk data yang sangat berelasi (produk-varian-transaksi-user). Neon menyediakan Postgres serverless dengan free tier generous, tidak perlu kelola server database sendiri. |
| **ORM** | **Drizzle ORM** | Lebih ringan dari Prisma — tidak perlu generate client terpisah, overhead runtime minim, cold-start lebih cepat di lingkungan serverless (Vercel). Tetap type-safe penuh dengan TypeScript. |
| **Auth** | JWT custom (httpOnly cookie) | Kebutuhan auth sederhana (2 role, akun dibuat manual admin, tanpa self-register) tidak memerlukan service pihak ketiga berbayar. JWT disimpan di httpOnly cookie untuk keamanan dari XSS. |
| **Real-time Sync** | **Pusher** | Untuk update stok real-time antar device kasir. Dipilih karena kompatibel dengan arsitektur serverless Vercel (tidak butuh koneksi persisten seperti Socket.io yang tidak didukung baik di Vercel). Free tier: 200k pesan/hari, 100 koneksi bersamaan — lebih dari cukup untuk skala toko ini. |
| **File Storage** | **Vercel Blob** | Untuk foto produk per varian (wajib upload). Terintegrasi native dengan Vercel, tidak perlu setup service storage terpisah (S3/R2). |
| **Hosting** | **Vercel** | Satu platform untuk frontend, backend (API Routes), dan file storage — meminimalkan kompleksitas operasional dan biaya (free tier cukup untuk skala 1 toko). |
| **UI Library** | React + Tailwind CSS | Konsisten dengan Design System (`07-DESIGN.md`) yang menggunakan CSS variables/tokens — Tailwind memudahkan implementasi token-based theming (Amber Hearth theme). |
| **Export Excel** | **SheetJS (xlsx)** | Library standar untuk generate file Excel dari data transaksi, mendukung filter harian/bulanan/custom range sesuai kebutuhan PRD. |
| **Print Struk** | Browser `window.print()` API | Tidak perlu SDK/driver khusus — struk dicetak lewat print dialog browser standar ke printer thermal yang ter-pairing di OS device kasir (sesuai keputusan "masih fleksibel" soal printer). |

---

## 2. Alasan Tidak Memakai Beberapa Opsi Lain

| Opsi yang Dipertimbangkan | Alasan Tidak Dipakai |
|---|---|
| Prisma ORM | Terlalu berat untuk kebutuhan ini — generate client terpisah menambah build time dan cold-start di serverless. |
| Express + Node.js terpisah | Menambah kompleksitas deployment (butuh platform terpisah untuk backend long-running seperti Render/Railway) — tidak sejalan dengan prinsip "jangan over-engineer" untuk tim kecil. |
| Socket.io | Butuh koneksi persisten yang tidak didukung baik oleh Vercel (serverless). Pusher jadi alternatif yang lebih sesuai arsitektur ini. |
| Clerk / Supabase Auth | Biaya per MAU (monthly active user) tidak sepadan untuk kasus 4-5 akun user internal yang dibuat manual oleh admin — auth custom JWT lebih murah dan cukup. |
| MongoDB (NoSQL) | Data sangat relasional (produk↔varian↔transaksi↔user) dengan kebutuhan integritas data kuat (terutama stok) — PostgreSQL lebih tepat. |

---

## 3. Estimasi Skala & Kapasitas

Berdasarkan estimasi 3-10 produk per transaksi dan volume transaksi harian toko 1 lokasi:
- **Free tier Neon** (Postgres serverless): kapasitas storage & compute jauh melebihi kebutuhan skala ini.
- **Free tier Vercel**: bandwidth & function invocation limit lebih dari cukup untuk traffic internal 1 toko dengan 4 pegawai.
- **Free tier Pusher**: 100 koneksi bersamaan jauh melebihi kebutuhan (maksimal beberapa device kasir aktif bersamaan).

Kesimpulan: **seluruh stack bisa berjalan di free tier** untuk versi MVP toko pertama, dengan ruang tumbuh yang jelas jika nanti dikembangkan jadi produk multi-tenant (upgrade tier saat traffic bertambah, tanpa perlu migrasi stack).

---

## 4. Package Utama (Indikatif)

```json
{
  "dependencies": {
    "next": "^14.x",
    "react": "^18.x",
    "typescript": "^5.x",
    "drizzle-orm": "^0.x",
    "@neondatabase/serverless": "^0.x",
    "pusher": "^5.x",
    "pusher-js": "^8.x",
    "@vercel/blob": "^0.x",
    "jsonwebtoken": "^9.x",
    "bcryptjs": "^2.x",
    "xlsx": "^0.x",
    "tailwindcss": "^3.x",
    "lucide-react": "^0.x"
  }
}
```
