# 🚀 IMPLEMENTATION PLAN: Tegukki
*Rencana Eksekusi Coding Bertahap (Phase-by-Phase)*

---

## 📌 Ringkasan Tech Stack & Arsitektur

- **Framework**: Next.js 14+ (App Router) + TypeScript
- **Styling**: Tailwind CSS + Design Tokens tema "Amber Hearth" (`07-DESIGN.md`)
- **Database**: PostgreSQL via Neon (serverless)
- **ORM**: Drizzle ORM
- **Auth**: JWT custom (httpOnly cookie) — tanpa service pihak ketiga
- **Realtime**: Pusher (sync stok antar device kasir)
- **File Storage**: Vercel Blob (foto produk per varian, wajib)
- **Validasi**: Zod (frontend & backend)
- **Export**: SheetJS (xlsx)
- **Hosting**: Vercel
- **Error Tracking**: Sentry

Referensi dokumen wajib dibaca ulang tiap memulai fase baru: `05-PRD.md` (business rules & acceptance criteria), `07-DESIGN.md` (design tokens), `11-API-DESIGN.md` (kontrak API), `13-FOLDER-STRUCTURE.md` (lokasi file), `14-RULES.md` (aturan coding agent).

---

## 🏗️ Breakdown Fase Implementasi (Urutan Eksekusi)

### 🔹 Phase 0: Inisialisasi Project & Konfigurasi Dasar

**Tujuan**: Fondasi environment, package, font, dan token CSS aktif — project bisa `npm run dev` tanpa error.

**Daftar File yang Dibuat/Dikonfigurasi**:
- `package.json` — install dependencies inti: `next`, `react`, `typescript`, `drizzle-orm`, `@neondatabase/serverless`, `pusher`, `pusher-js`, `@vercel/blob`, `jsonwebtoken`, `bcryptjs`, `zod`, `xlsx`, `tailwindcss`, `lucide-react`
- `tsconfig.json` — strict mode aktif (`"strict": true`)
- `.env.example` — semua key sesuai `16-DEPLOYMENT.md` (`DATABASE_URL`, `JWT_SECRET`, `PUSHER_*`, `BLOB_READ_WRITE_TOKEN`, `NEXT_PUBLIC_SENTRY_DSN`)
- `.gitignore` — pastikan `.env.local` masuk
- `tailwind.config.ts` — mapping token warna & font dari `07-DESIGN.md` (primary `#d87943`, secondary `#527575`, radius `0.75rem`, font `Outfit`/`Merriweather`/`JetBrains Mono`)
- `app/globals.css` — CSS variables lengkap (Light & Dark mode) disalin persis dari tema Amber Hearth di `07-DESIGN.md`
- `app/layout.tsx` — root layout, import font (Outfit, Merriweather, JetBrains Mono via `next/font/google`), set metadata dasar (judul tab "Tegukki", favicon)
- Setup skeleton direktori kosong sesuai `13-FOLDER-STRUCTURE.md`: `app/api/`, `features/`, `components/ui/`, `lib/`

**Acceptance Criteria**:
- [ ] `npm run dev` berjalan tanpa error
- [ ] Halaman root menampilkan font & warna sesuai tema Amber Hearth (bisa dicek dengan halaman placeholder sederhana)
- [ ] Judul tab browser menampilkan "Tegukki", bukan default "Next.js App"

---

### 🔹 Phase 1: Database Setup, ORM Schema & Auth Foundation

**Tujuan**: Skema data aktif di Neon, autentikasi JWT berfungsi end-to-end.

**Daftar File yang Dibuat**:
- `lib/db/schema.ts` — seluruh tabel dari `09-ERD.md`: `users`, `categories`, `products`, `product_variants`, `discounts`, `transactions`, `transaction_items`, `transaction_discounts` (termasuk kolom snapshot & `deleted_at` untuk soft-delete)
- `lib/db/client.ts` — koneksi Drizzle ke Neon
- `drizzle.config.ts` — konfigurasi Drizzle Kit
- Migration pertama: `npx drizzle-kit generate` → `npx drizzle-kit push`
- `lib/auth.ts` — fungsi `generateToken()`, `verifyToken()`, `getCurrentUser()`, `requireRole(req, role)` (helper wajib dipakai di semua endpoint admin-only sesuai BR-1)
- `app/middleware.ts` — cek JWT dari httpOnly cookie di setiap request terlindungi, redirect ke `/login` jika tidak valid
- `app/api/auth/login/route.ts`, `logout/route.ts`, `me/route.ts` — sesuai kontrak di `11-API-DESIGN.md`
- `app/(auth)/login/page.tsx` — halaman login (form sederhana, styling sesuai token)
- Seed script sederhana (`lib/db/seed.ts`) — buat 1 akun admin awal manual untuk testing

**Acceptance Criteria**:
- [ ] Migration berhasil dijalankan ke Neon tanpa error
- [ ] Login dengan akun seed berhasil, cookie JWT ter-set (cek DevTools: httpOnly aktif)
- [ ] Akses halaman terlindungi tanpa login → redirect ke `/login`
- [ ] `getCurrentUser()` mengembalikan data user yang benar sesuai token

---

### 🔹 Phase 2: Design System & Reusable Base Components

**Tujuan**: Komponen UI dasar 100% patuh `07-DESIGN.md` & Anti-AI Rules, siap dipakai semua fitur berikutnya.

**Daftar File yang Dibuat**:
- `components/ui/button.tsx` — variant primary/secondary/destructive, radius `0.75rem`, tanpa border tebal
- `components/ui/input.tsx` — termasuk varian angka dengan font `JetBrains Mono` untuk field nominal/harga
- `components/ui/card.tsx` — shadow subtle sesuai token (`blur:4px, opacity:0.05`)
- `components/ui/badge.tsx` — untuk status "Habis" (destructive) dan "Aktif" (secondary)
- `components/ui/dialog.tsx` — untuk konfirmasi aksi destructive (void transaksi, hapus produk, hapus user)
- `components/ui/skeleton.tsx` — loading state, dipakai di semua halaman data-fetching
- `components/ui/empty-state.tsx` — wajib punya ikon Lucide + copy hangat + CTA (sesuai Anti-AI Rules di `07-DESIGN.md`)
- `components/ui/image-upload.tsx` — komponen upload foto dengan preview (dashed border → thumbnail setelah upload), dipakai khusus form varian produk
- Layout global: Navbar/Sidebar (beda tampilan menu sesuai role — logic kondisional `user.role === 'admin'`)

**Acceptance Criteria**:
- [ ] Semua komponen di atas ter-render di halaman contoh/storybook sederhana tanpa hardcode hex color
- [ ] Kontras warna teks-background memenuhi WCAG AA minimum (dicek manual untuk primary & secondary)
- [ ] Semua elemen interaktif bisa diakses via keyboard (tab + enter)

---

### 🔹 Phase 3: Core Feature Slice 1 — Manajemen Produk, Kategori & Varian

**Tujuan**: Fondasi data produk aktif — tanpa ini, fitur transaksi (Phase 4) tidak bisa diuji. Ini alur fungsional pertama yang harus selesai dari awal sampai akhir.

**Daftar File yang Dibuat**:
- `lib/validations/product.ts` — Zod schema untuk produk induk & varian (termasuk validasi foto wajib)
- `app/api/categories/route.ts` — GET & POST kategori
- `app/api/products/route.ts` — GET (list produk+varian), POST (Admin only, `requireRole`)
- `app/api/products/[id]/route.ts` — PUT, DELETE (Admin only)
- `app/api/products/[id]/variants/route.ts` — POST varian baru, upload foto ke Vercel Blob (multipart), tolak jika foto tidak disertakan (BR-11)
- `app/api/products/[id]/variants/[variantId]/route.ts` — PUT, DELETE varian
- `features/products/types.ts` — tipe `Product`, `ProductVariant`
- `features/products/components/ProductGrid.tsx` — grid produk per kategori untuk kasir (read-only mode)
- `features/products/components/ProductManagementTable.tsx` — tabel CRUD untuk admin
- `features/products/components/VariantForm.tsx` — form tambah/edit varian (pakai `ImageUpload` dari Phase 2), size × color, stok
- `features/products/hooks/useProducts.ts` — fetch data (akan diperluas untuk realtime di Phase 5)
- `app/products/page.tsx` — 1 halaman shared, kondisional render `ProductGrid` (kasir) vs `ProductManagementTable` (admin) sesuai `user.role`

**Acceptance Criteria**:
- [ ] Admin bisa tambah produk induk + minimal 1 varian dengan foto — tersimpan ke database & Vercel Blob
- [ ] Submit varian tanpa foto ditolak dengan pesan error jelas (US-A1)
- [ ] Kasir mengakses `/products` melihat versi read-only (tanpa tombol edit/hapus)
- [ ] Admin mengakses `/products` melihat versi dengan CRUD lengkap
- [ ] Produk baru langsung muncul di grid, dikelompokkan per kategori

---

### 🔹 Phase 4: Core Feature Slice 2 — Transaksi Kasir (Fitur Kritis Utama)

**Tujuan**: Alur bisnis paling penting produk ini — kasir bisa transaksi lengkap dari pilih produk sampai cetak struk, dengan kalkulasi diskon+PPN yang benar.

**Daftar File yang Dibuat**:
- `lib/validations/transaction.ts` — Zod schema payload transaksi
- `lib/validations/discount.ts` — Zod schema diskon (dibutuhkan di sini karena kalkulasi transaksi butuh data diskon)
- `app/api/discounts/route.ts`, `[id]/route.ts` — CRUD diskon (Admin only untuk write; GET diakses semua role untuk kebutuhan dropdown kasir)
- `app/api/transactions/route.ts` — **POST** (business logic inti: validasi stok, hitung subtotal-diskon-PPN sesuai BR-2/BR-3/BR-4, validasi cash sesuai BR-10, kurangi stok, snapshot data ke `transaction_items`)
- `features/transactions/hooks/useCart.ts` — logic keranjang: tambah/kurang qty, hapus item, **persist ke `localStorage`** (draft, sesuai BR-9), reset saat submit berhasil
- `features/transactions/components/CartSidebar.tsx` — kolom kanan layar kasir: list item, +/- qty, hapus, dropdown diskon manual, input cash, tombol submit
- `features/products/components/ProductGrid.tsx` — **update** dari Phase 3: tambahkan handler klik produk → masuk ke cart, disable produk stok 0 dengan label "Habis"
- `features/transactions/components/ReceiptPrint.tsx` — komponen struk untuk `window.print()`, format sesuai US-C5
- `app/transaksi/page.tsx` — halaman shared (admin & kasir, sesuai keputusan Tahap 5), gabungkan `ProductGrid` + `CartSidebar`

**Acceptance Criteria**:
- [ ] Kasir bisa pilih produk → masuk keranjang → ubah qty → hapus item, semuanya tervalidasi terhadap stok tersedia
- [ ] Diskon otomatis (by hari) terpasang tanpa aksi kasir; diskon manual bisa dipilih dari dropdown; keduanya bisa stacking
- [ ] PPN selalu terhitung, hasil akhir tidak dibulatkan (BR-5)
- [ ] Input cash kurang dari total → transaksi ditolak; cash cukup → kembalian terhitung benar
- [ ] Submit transaksi berhasil → stok berkurang, draft di localStorage terhapus, struk bisa dicetak
- [ ] Refresh halaman di tengah transaksi (belum submit) → draft tetap ada saat kembali (BR-9)
- [ ] Admin bisa mengakses `/transaksi` dan bertransaksi dengan alur yang identik (BR-12)

---

### 🔹 Phase 5: Integrasi Realtime (Pusher) & Admin Panel Pendukung

**Tujuan**: Sync stok real-time antar device + halaman admin pendukung (Dashboard, Manajemen Diskon UI, Manajemen User).

**Daftar File yang Dibuat**:
- `lib/pusher.ts` — setup client (`pusher-js`) & server (`pusher`) instance
- Update `app/api/transactions/route.ts` — tambahkan `pusher.trigger('store-updates', 'stock-updated', {...})` setiap transaksi submit berhasil
- Update `app/api/discounts/[id]/route.ts` — trigger `discount-changed` saat admin toggle status
- Update `features/products/hooks/useProducts.ts` — subscribe ke channel `store-updates`, update state lokal saat event `stock-updated` diterima (tanpa refresh manual)
- Update `features/transactions/components/CartSidebar.tsx` — dropdown diskon subscribe ke event `discount-changed`
- `app/dashboard/page.tsx` — ringkasan omzet hari ini & jumlah transaksi (Admin only), query agregat dari tabel `transactions`
- `features/discounts/components/DiscountForm.tsx`, `DiscountTable.tsx` — UI CRUD diskon (tipe otomatis/manual, toggle status)
- `app/discounts/page.tsx` — halaman admin-only
- `lib/validations/user.ts` — Zod schema user
- `app/api/users/route.ts`, `[id]/route.ts` — CRUD user (Admin only, cek username unik — BR/US-D1)
- `features/users/components/UserManagementTable.tsx`
- `app/users/page.tsx` — halaman admin-only

**Acceptance Criteria**:
- [ ] Buka 2 browser/device berbeda (login kasir berbeda) — transaksi di device A langsung mengubah tampilan stok di device B tanpa refresh
- [ ] Admin toggle status diskon — dropdown kasir yang sedang terbuka langsung update
- [ ] Dashboard admin menampilkan angka omzet & jumlah transaksi hari ini yang akurat
- [ ] Admin bisa tambah/hapus user; username duplikat ditolak dengan error jelas
- [ ] Kasir tidak bisa mengakses `/dashboard`, `/discounts`, `/users` (redirect/403)

---

### 🔹 Phase 6: Riwayat Transaksi, Void/Edit & Export Excel

**Tujuan**: Menyelesaikan Epic E dari PRD — visibilitas & kontrol penuh atas histori transaksi.

**Daftar File yang Dibuat**:
- `app/api/transactions/route.ts` — **update**: tambahkan **GET** dengan query filter tanggal (`?from=&to=`) + hitung total omzet periode
- `app/api/transactions/[id]/route.ts` — GET detail, **PUT** (edit, sesuaikan stok berdasar selisih qty — US-E2), **DELETE** (soft-delete/void, kembalikan stok — US-E2)
- `app/api/transactions/export/route.ts` — generate file `.xlsx` dengan SheetJS, filter harian/bulanan/custom range
- `features/transactions/components/TransactionTable.tsx` — tabel riwayat, kolom sesuai US-E1 (no. transaksi, tanggal, produk, diskon, subtotal, PPN, total, metode bayar, **username kasir**), tombol Edit/Hapus **hanya render jika `user.role === 'admin'`**
- `features/transactions/components/TransactionDetailModal.tsx` — detail transaksi + form edit (admin) / view-only (kasir)
- `app/transactions/page.tsx` — halaman shared, filter tanggal, tombol export (admin only)

**Acceptance Criteria**:
- [ ] Kasir & admin sama-sama bisa lihat semua transaksi (transparan, US-E1)
- [ ] Tombol Edit/Hapus hanya muncul untuk admin di UI **dan** endpoint menolak request dari kasir (403) — validasi ganda sesuai `14-RULES.md`
- [ ] Void transaksi mengembalikan stok terkait secara otomatis
- [ ] Edit qty transaksi menyesuaikan stok sesuai selisih
- [ ] Export Excel menghasilkan file dengan data yang sesuai filter tanggal yang dipilih

---

### 🔹 Phase 7: Edge Cases, Error Handling, Sentry & QA Polish

**Tujuan**: Ketahanan aplikasi sesuai `15-QA-CHECKLIST.md`, siap deploy production.

**Daftar File yang Dibuat**:
- `app/error.tsx`, `app/not-found.tsx` — error boundary global dengan tone Tegukki (bukan pesan error generik)
- Setup Sentry: `npx @sentry/wizard@latest -i nextjs`, file konfigurasi otomatis (`sentry.client.config.ts`, `sentry.server.config.ts`)
- Review ulang **semua endpoint** untuk memastikan validasi stok race-condition aktif (dua request bersamaan pada stok terbatas — edge case dari `05-PRD.md` bagian 5)
- Review ulang **semua form** memastikan Zod validation error message jelas, bukan generic
- `public/favicon.ico` — pastikan bukan default Next.js
- Fine-tuning responsive: cek layar tablet landscape untuk `/transaksi`, cek scroll horizontal tabel di layar sempit untuk `/transactions`, `/products`

**Acceptance Criteria**:
- [ ] Seluruh item di `15-QA-CHECKLIST.md` dijalankan manual dan lolos (termasuk security dasar: akses admin dari akun kasir ditolak di UI & API)
- [ ] Error di frontend/backend tertangkap di dashboard Sentry saat disimulasikan
- [ ] Tidak ada halaman blank/crash saat data kosong — semua pakai `EmptyState`
- [ ] Aplikasi siap deploy mengikuti langkah di `16-DEPLOYMENT.md`

---

## 📋 Catatan Eksekusi

1. **Urutan fase bersifat wajib**, bukan opsional — Phase 4 (Transaksi) tidak bisa diuji tanpa Phase 3 (Produk) selesai terlebih dahulu, dan seterusnya.
2. **Setiap fase harus lolos acceptance criteria-nya sendiri** sebelum lanjut ke fase berikutnya — jangan lompat fase meski tergoda mengerjakan fitur yang "kelihatan lebih menarik" dulu.
3. **Rujuk `14-RULES.md` di setiap fase** — terutama larangan hardcode warna, larangan skip validasi role di backend, dan larangan install package baru tanpa konfirmasi.
4. Setelah Phase 7 selesai dan lolos QA, lanjut ke `16-DEPLOYMENT.md` untuk proses go-live.
