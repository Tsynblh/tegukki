# 14 - Rules for AI Coding Agent

## 1. Project Overview & Tech Stack

**Nama Produk**: Tegukki — Web POS + Inventory Management untuk toko tumbler.

**Stack**:
- Framework: Next.js 14+ (App Router) + TypeScript
- Database: PostgreSQL via Neon
- ORM: Drizzle ORM
- Auth: JWT custom (httpOnly cookie)
- Realtime: Pusher
- File Storage: Vercel Blob
- Validasi: Zod
- Styling: Tailwind CSS dengan CSS variables tema "Amber Hearth" (lihat `07-DESIGN.md`)
- Hosting: Vercel

**Referensi wajib dibaca sebelum coding**: `05-PRD.md`, `07-DESIGN.md`, `09-ERD.md`, `11-API-DESIGN.md`, `13-FOLDER-STRUCTURE.md`.

---

## 2. Core Rules for AI Agent

1. **Baca dulu, jangan asumsi.** Sebelum mengimplementasikan fitur apapun, cek dokumen PRD (`05-PRD.md`) dan API Design (`11-API-DESIGN.md`) terkait fitur tersebut. Jangan menebak business logic (misal aturan diskon, PPN) — semua sudah didefinisikan eksplisit.
2. **Ikuti struktur folder yang sudah ditentukan** (`13-FOLDER-STRUCTURE.md`). Jangan membuat pola folder baru sendiri (misal jangan buat `src/` baru, jangan pindahkan `route.ts` ke luar `app/api/`).
3. **Validasi role di backend, selalu.** Setiap endpoint yang seharusnya admin-only WAJIB dicek role-nya di dalam `route.ts` (pakai `requireRole()` dari `lib/auth.ts`), bukan hanya disembunyikan di UI. Ini non-negotiable — cek UI saja tidak cukup aman.
4. **Konsisten dengan PRD Business Rules** (BR-1 s/d BR-10 di `05-PRD.md`) — terutama soal stacking diskon, PPN wajib, snapshot harga di transaksi, dan validasi stok sebelum submit transaksi.
5. **Sebelum membuat komponen baru, cek `components/ui/` dulu.** Jangan duplikasi Button/Card/Input yang sudah ada.
6. **Satu halaman untuk shared role, jangan duplikasi.** Halaman seperti `products/page.tsx` dan `transactions/page.tsx` HARUS satu file, dengan logic kondisional berdasarkan `user.role` — bukan file terpisah untuk admin dan kasir.

---

## 3. Design System Enforcement (Wajib Rujuk `07-DESIGN.md`)

1. **Dilarang hardcode warna hex di komponen.** Semua warna WAJIB pakai CSS variable/token yang sudah didefinisikan (`--primary`, `--secondary`, `--destructive`, dll dari tema Amber Hearth). Contoh salah: `className="bg-[#d87943]"`. Contoh benar: `className="bg-primary"`.
2. **Font wajib sesuai token**: `Outfit` untuk UI umum, `JetBrains Mono` untuk **semua angka transaksi** (harga, subtotal, total, kembalian) — tidak terkecuali, `Merriweather` hanya untuk heading aksen terbatas.
3. **Border radius konsisten** — selalu `0.75rem` (token `--radius`), jangan bikin radius custom ad-hoc.
4. **Shadow selalu subtle** sesuai token (`blur: 4px, opacity: 0.05`) — dilarang shadow berat/dramatis.
5. **Anti-AI Rules wajib dipatuhi** (detail lengkap di `07-DESIGN.md` bagian 3):
   - Icon family konsisten (Lucide Icons saja)
   - Dilarang gradient ungu-biru generik
   - Dilarang card border tebal
   - Dilarang empty state generik ("No data") — wajib ada copy bertone hangat + ikon + CTA jika relevan
   - Dilarang layout grid simetris kosong tanpa konten bermakna

---

## 4. Frontend & Component Guidelines

1. **Server Components sebagai default.** Gunakan Server Component untuk fetch data (misal daftar produk, riwayat transaksi). Tambahkan `"use client"` HANYA jika komponen butuh interaktivitas (onClick, useState, dll).
2. **TanStack Query khusus untuk data yang perlu realtime sync** (grid produk kasir yang menerima update stok via Pusher). Jangan pakai TanStack Query untuk data statis yang cukup di-fetch di Server Component.
3. **State keranjang transaksi**: gunakan React Context + `localStorage`, BUKAN Zustand/Redux (sesuai keputusan arsitektur — tidak perlu state management library tambahan untuk kasus ini).
4. **Form handling wajib pakai Zod** untuk validasi — schema didefinisikan di `lib/validations/`, dipakai di frontend (validasi form) DAN backend (validasi payload API) supaya konsisten.
5. **Setiap halaman/komponen data-fetching wajib menangani 3 state**: Loading (skeleton, bukan spinner generik), Empty (pakai komponen `EmptyState` dari `components/ui/`), dan Error (tampilkan pesan yang jelas, bukan crash/blank page).
6. **Komponen kondisional per role**: gunakan pola `{user.role === 'admin' && <AdminOnlyButton />}` di dalam komponen shared, bukan duplikasi seluruh komponen.

---

## 5. Backend & Database Guidelines

1. **Semua query database lewat Drizzle ORM** — dilarang raw SQL string kecuali untuk kasus yang benar-benar tidak bisa diwakili Drizzle (harus didiskusikan dulu).
2. **Snapshot data wajib** untuk `TransactionItem` (nama produk & harga saat transaksi) dan `TransactionDiscount` (nama & persentase diskon saat dipakai) — sesuai `09-ERD.md`. JANGAN query ulang ke tabel master saat menampilkan histori transaksi lama.
3. **Validasi stok di backend sebelum submit transaksi**, bukan hanya di frontend — untuk mencegah race condition (dua transaksi bersamaan menjual stok yang sama).
4. **Void transaksi = soft delete** (`deleted_at`), bukan hard delete dari database. Saat void, stok terkait WAJIB dikembalikan otomatis.
5. **Response API harus konsisten** sesuai format yang didefinisikan di `11-API-DESIGN.md` — termasuk struktur error `{ "error": { "code", "message" } }` dan status code yang tepat (jangan asal return 200 untuk semua kondisi).
6. **Broadcast event Pusher** setiap kali stok berubah (`stock-updated`) atau status diskon di-toggle (`discount-changed`) — jangan lupakan ini saat menambah/mengubah logic yang berkaitan.

---

## 6. Code Quality & Accessibility

1. **TypeScript strict mode aktif** — dilarang menggunakan `any` kecuali dalam kasus yang benar-benar tidak terhindarkan (harus disertai komentar alasan). Gunakan `unknown` + type narrowing sebagai gantinya jika perlu.
2. **Prefer `type` untuk object shapes sederhana, `interface` untuk yang akan di-extend.**
3. **Naming conventions**:
   - File komponen: `PascalCase.tsx` (misal `ProductGrid.tsx`)
   - File non-komponen (hooks, utils, config): `kebab-case.ts` (misal `use-cart.ts`, `format-currency.ts`)
   - Folder: `kebab-case` (misal `features/products`)
   - Function & variable: `camelCase`
   - Component: `PascalCase`
   - Konstanta global: `UPPER_SNAKE_CASE`
4. **Accessibility minimum**:
   - Kontras warna teks-background wajib memenuhi WCAG AA (rasio minimal 4.5:1) — cek terutama untuk teks di atas warna `primary`/`secondary`.
   - Semua elemen interaktif (tombol produk di grid kasir, dll) harus bisa diakses via keyboard (tab + enter), bukan hanya mouse click.
   - Semua `<img>` (termasuk foto produk) wajib punya atribut `alt` yang deskriptif.

---

## 7. Strict Do's & Don'ts

### ✅ Do's
- Selalu validasi input dengan Zod, baik di frontend maupun backend.
- Selalu cek role user di backend sebelum eksekusi aksi admin-only.
- Selalu gunakan token warna/font dari Design System, jangan nilai hardcode.
- Selalu tangani 3 state (loading/empty/error) di setiap komponen data-fetching.
- Selalu snapshot data (harga, nama, diskon) di tabel transaksi.

### ❌ Don'ts — Larangan Keras
1. **Dilarang instalasi package/library baru tanpa konfirmasi eksplisit** dari user — termasuk dependency kecil seperti date-formatting library tambahan. Selalu tanya dulu jika ada kebutuhan package baru yang belum ada di `10-TECH-STACK.md`.
2. **Dilarang melakukan refactor besar di luar scope prompt yang diberikan.** Jika menemukan kode yang menurut agent "kurang baik" di luar tugas yang diminta, laporkan sebagai catatan/saran — jangan langsung diubah tanpa persetujuan.
3. **Dilarang membuat placeholder/dummy data yang tidak kontekstual** (misal "Lorem ipsum", "Product 1", "asdasd"). Semua contoh data harus relevan dengan konteks toko tumbler (misal nama produk realistis: "Botol Jenis A", bukan "Sample Product").
4. **Dilarang mengubah skema database (`lib/db/schema.ts`) tanpa memastikan migration Drizzle Kit dijalankan** dan tidak merusak data existing.
5. **Dilarang bypass validasi role dengan alasan "sementara untuk testing"** — kode yang sampai ke production/review harus selalu punya validasi role aktif.
6. **Dilarang mengubah struktur folder yang sudah ditentukan** (`13-FOLDER-STRUCTURE.md`) tanpa diskusi — termasuk memindahkan lokasi `route.ts`, mengganti nama folder `app/`, atau membuat pola folder paralel yang baru.
7. **Dilarang menghapus data transaksi secara permanen (hard delete)** — void transaksi harus selalu soft-delete.
8. **Dilarang skip validasi stok sebelum submit transaksi**, bahkan untuk kasus yang "sepertinya tidak mungkin race condition" — validasi backend wajib selalu ada.
