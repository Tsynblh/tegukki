# 13 - Folder Structure

## 1. Pohon Direktori Lengkap

```
project-root/
├── app/                                  # WAJIB nama ini (konvensi Next.js App Router)
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx                  # Halaman login
│   │
│   ├── dashboard/
│   │   └── page.tsx                      # Ringkasan omzet & transaksi hari ini (admin only)
│   │
│   ├── transaksi/
│   │   └── page.tsx                      # Layar kasir — SHARED (admin & kasir bisa transaksi)
│   │
│   ├── products/
│   │   └── page.tsx                      # SHARED — kasir read-only, admin full CRUD
│   │
│   ├── discounts/
│   │   └── page.tsx                      # Manajemen diskon (admin only)
│   │
│   ├── users/
│   │   └── page.tsx                      # Manajemen akun kasir (admin only)
│   │
│   ├── transactions/
│   │   └── page.tsx                      # Riwayat transaksi — SHARED (kasir view-only, admin edit/hapus)
│   │
│   ├── api/                              # SEMUA backend endpoint (route handlers)
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   └── me/route.ts
│   │   ├── categories/route.ts
│   │   ├── products/
│   │   │   ├── route.ts                  # GET (list), POST (create)
│   │   │   └── [id]/
│   │   │       ├── route.ts              # PUT, DELETE produk
│   │   │       └── variants/
│   │   │           ├── route.ts          # POST varian baru
│   │   │           └── [variantId]/route.ts
│   │   ├── discounts/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── transactions/
│   │   │   ├── route.ts                  # GET (list), POST (submit transaksi)
│   │   │   ├── [id]/route.ts             # GET detail, PUT edit, DELETE void
│   │   │   └── export/route.ts
│   │   └── users/
│   │       ├── route.ts
│   │       └── [id]/route.ts
│   │
│   ├── layout.tsx                        # Root layout (font, theme provider)
│   ├── globals.css                       # CSS variables dari 07-DESIGN.md (Amber Hearth tokens)
│   └── middleware.ts                     # Cek JWT dari cookie + validasi role per route
│
├── features/                             # Kode spesifik per fitur (UI, hooks, types)
│   ├── products/
│   │   ├── components/
│   │   │   ├── ProductGrid.tsx           # Grid produk untuk kasir
│   │   │   ├── ProductManagementTable.tsx # Tabel CRUD untuk admin
│   │   │   └── VariantForm.tsx           # Form tambah/edit varian (termasuk upload foto)
│   │   ├── hooks/
│   │   │   └── useProducts.ts            # TanStack Query hook untuk fetch + realtime sync
│   │   └── types.ts
│   │
│   ├── transactions/
│   │   ├── components/
│   │   │   ├── CartSidebar.tsx           # Keranjang + ringkasan (kanan layar kasir)
│   │   │   ├── TransactionTable.tsx      # Tabel riwayat transaksi
│   │   │   └── TransactionDetailModal.tsx
│   │   ├── hooks/
│   │   │   └── useCart.ts                # Logic keranjang + local storage draft
│   │   └── types.ts
│   │
│   ├── discounts/
│   │   ├── components/
│   │   │   ├── DiscountForm.tsx
│   │   │   └── DiscountTable.tsx
│   │   └── types.ts
│   │
│   └── users/
│       ├── components/
│       │   └── UserManagementTable.tsx
│       └── types.ts
│
├── components/
│   └── ui/                               # Komponen reusable lintas fitur
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── badge.tsx
│       ├── dialog.tsx
│       ├── empty-state.tsx               # Wajib dipakai untuk semua kondisi data kosong
│       └── skeleton.tsx                  # Loading state
│
├── lib/                                  # Infrastruktur & helper, dipakai FE & BE
│   ├── db/
│   │   ├── schema.ts                     # Drizzle schema (sesuai 09-ERD.md)
│   │   └── client.ts                     # Koneksi Neon
│   ├── validations/                      # Zod schemas
│   │   ├── product.ts
│   │   ├── transaction.ts
│   │   ├── discount.ts
│   │   └── user.ts
│   ├── auth.ts                           # generate/verify JWT, requireRole()
│   ├── pusher.ts                         # Setup client & server Pusher
│   └── utils.ts                          # formatCurrency, formatDate, calculateTotal, dll
│
├── drizzle/                              # Migration files (auto-generated Drizzle Kit)
├── drizzle.config.ts
├── .env.local                            # DATABASE_URL, JWT_SECRET, PUSHER_KEY, dll
├── next.config.ts
├── tailwind.config.ts                    # Terhubung ke CSS variables Amber Hearth
├── tsconfig.json
└── package.json
```

---

## 2. Penjelasan Fungsi Tiap Folder

| Folder | Fungsi |
|---|---|
| `app/` | Routing halaman (frontend) & endpoint (backend) — struktur folder = struktur URL, wajib mengikuti konvensi Next.js. |
| `app/api/` | Semua backend logic yang diakses lewat HTTP request (dari halaman web, dan nanti bisa dari mobile app). |
| `features/` | Kode UI & client-side logic yang spesifik untuk 1 domain bisnis (products, transactions, discounts, users) — supaya kode terkait tetap berkumpul, mudah ditemukan. |
| `components/ui/` | Komponen generik yang dipakai lintas fitur (Button, Card, dll) — **wajib dicek dulu di sini sebelum bikin komponen baru** yang mirip. |
| `lib/` | Kode infrastruktur/shared yang dipakai baik oleh frontend maupun backend — koneksi DB, auth helper, validasi schema, util function. |
| `drizzle/` | File migration database yang di-generate otomatis oleh Drizzle Kit — jangan diedit manual. |

---

## 3. Prinsip Penempatan File

- **Halaman baru?** → `app/[nama-route]/page.tsx`
- **Endpoint API baru?** → `app/api/[nama-resource]/route.ts`
- **Komponen spesifik 1 fitur?** → `features/[nama-fitur]/components/`
- **Komponen generik dipakai di banyak tempat?** → `components/ui/`
- **Logic yang dipakai FE & BE (helper, koneksi DB)?** → `lib/`
- **Skema validasi input?** → `lib/validations/[nama].ts` (Zod)
