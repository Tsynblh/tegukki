# 12 - System Architecture

## 1. High-Level Architecture Diagram

```mermaid
flowchart TB
    subgraph Client["Client Devices (Toko)"]
        A1[Device Kasir - Browser]
        A2[Device Admin - Browser]
    end

    subgraph Vercel["Vercel Platform"]
        B1[Next.js Frontend - React SSR/CSR]
        B2[Next.js API Routes]
        B3[Vercel Blob - Foto Produk]
    end

    subgraph External["External Services"]
        C1[(Neon PostgreSQL)]
        C2[Pusher - Realtime Pub/Sub]
    end

    A1 -->|HTTPS| B1
    A2 -->|HTTPS| B1
    B1 -->|Server Actions/Fetch| B2
    B2 -->|Drizzle ORM Query| C1
    B2 -->|Upload/Fetch Foto| B3
    B2 -->|Trigger Event| C2
    C2 -->|WebSocket Push| A1
    C2 -->|WebSocket Push| A2
    A1 -->|Print via window.print| D[Printer Thermal - Local]
```

---

## 2. Komponen Arsitektur

### Frontend (Next.js — React)
- Rendering: kombinasi Server Components (untuk halaman data-heavy seperti riwayat transaksi) dan Client Components (untuk interaktivitas seperti keranjang kasir, real-time update stok).
- State keranjang transaksi disimpan di **local storage browser** (draft, sesuai BR-9) sebelum submit ke server.

### Backend (Next.js API Routes)
- Menjalankan semua business logic: validasi stok, kalkulasi diskon+PPN, snapshot data transaksi, role-based access control.
- Middleware auth memvalidasi JWT dari httpOnly cookie di setiap request yang butuh autentikasi.

### Database (Neon PostgreSQL)
- Diakses lewat Drizzle ORM dari API Routes.
- Koneksi serverless-friendly (Neon dirancang untuk pola koneksi singkat khas serverless function).

### File Storage (Vercel Blob)
- Menyimpan foto produk per varian (wajib upload saat admin menambah varian baru).
- URL foto disimpan di kolom `photo_url` pada tabel `PRODUCT_VARIANTS`.

### Realtime (Pusher)
- Server (API Routes) trigger event ke Pusher setiap kali stok berubah (transaksi submit/void) atau status diskon di-toggle.
- Client (browser kasir & admin) subscribe ke channel `store-updates` untuk menerima update tanpa refresh manual.

---

## 3. Auth Flow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant API as Next.js API Route
    participant DB as Neon PostgreSQL

    U->>API: POST /api/auth/login {username, password}
    API->>DB: Query user by username
    DB-->>API: User record (password_hash)
    API->>API: Verify password (bcrypt compare)
    alt Kredensial valid
        API->>API: Generate JWT (include user_id, role)
        API-->>U: Set httpOnly cookie + 200 {user}
    else Kredensial invalid
        API-->>U: 401 Unauthorized
    end
    U->>API: Request selanjutnya (cookie otomatis terkirim)
    API->>API: Middleware verify JWT dari cookie
    API->>API: Cek role sesuai endpoint (misal Admin-only)
    alt Role sesuai
        API-->>U: Response data
    else Role tidak sesuai
        API-->>U: 403 Forbidden
    end
```

---

## 4. Realtime Stock Sync Flow

```mermaid
sequenceDiagram
    participant K1 as Kasir A (Device 1)
    participant K2 as Kasir B (Device 2)
    participant API as Next.js API Route
    participant DB as Neon PostgreSQL
    participant P as Pusher

    K1->>API: POST /api/transactions (submit transaksi)
    API->>DB: Validasi & kurangi stok
    DB-->>API: Stok berhasil diupdate
    API->>P: Trigger event 'stock-updated'
    API-->>K1: 201 Created (transaksi berhasil)
    P-->>K2: Push event 'stock-updated' via WebSocket
    K2->>K2: Update tampilan grid produk (misal jadi 'Habis')
```

---

## 5. Third-Party Services Summary

| Service | Fungsi | Tier |
|---|---|---|
| **Vercel** | Hosting frontend + backend (API Routes) | Free (Hobby) |
| **Neon** | Database PostgreSQL serverless | Free |
| **Pusher** | Realtime pub/sub untuk sync stok & diskon | Free (200k msg/hari) |
| **Vercel Blob** | Storage foto produk per varian | Free tier |

Tidak ada payment gateway diperlukan (QRIS ditampilkan di display kasir fisik terpisah, bukan diproses di web app — sesuai keputusan Tahap 2). Tidak ada service email/SMS/WA (reset password dilakukan manual oleh admin).

---

## 6. Deployment Flow (Ringkas)

1. Kode di push ke repository Git (GitHub/GitLab).
2. Vercel otomatis build & deploy (CI/CD bawaan Vercel — tidak perlu setup pipeline terpisah).
3. Environment variables (Neon connection string, Pusher keys, JWT secret) dikonfigurasi di dashboard Vercel.
4. Database migration dijalankan via Drizzle Kit sebelum/sesudah deploy.

---

## 7. Kesiapan Multi-Tenant (Catatan untuk Masa Depan)

Sesuai keputusan Tahap 4: **versi ini didesain single-tenant** (1 toko = 1 database). Jika nanti Tegukki dikembangkan ke toko lain, pendekatan yang disepakati adalah **1 database terpisah per toko/cabang**, baru diintegrasikan/digabung jika diperlukan oleh pemilik di level lebih tinggi. Arsitektur saat ini tidak memerlukan kolom `tenant_id` di skema database, menyederhanakan development MVP secara signifikan.
