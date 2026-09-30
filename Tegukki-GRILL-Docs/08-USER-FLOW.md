# 08 - User Flow

## 1. Overview

Dokumen ini menjabarkan alur pengguna utama untuk 2 role: **Admin (Owner)** dan **User (Kasir)**, berdasarkan fitur di `05-PRD.md`.

---

## 2. Flow: Login (Semua Role)

```mermaid
flowchart TD
    A[Buka Tegukki] --> B[Halaman Login]
    B --> C[Input Username & Password]
    C --> D{Kredensial Valid?}
    D -->|Tidak| E[Tampilkan pesan error]
    E --> C
    D -->|Ya, Role Admin| F[Redirect ke Dashboard Admin]
    D -->|Ya, Role Kasir| G[Redirect ke Halaman Kasir]
    F -.->|Admin bisa navigasi ke Halaman Transaksi kapan saja| G
```

---

## 3. Flow: Transaksi Kasir (Happy Path & Edge Case)

> **Catatan**: Halaman Transaksi/Kasir bersifat **shared** — dapat diakses oleh Admin maupun User (Kasir). Admin biasanya berperan sebagai pengelola, tapi dapat masuk ke halaman ini untuk bertransaksi langsung (misal saat toko sepi pegawai). Alur di bawah berlaku sama untuk kedua role.

```mermaid
flowchart TD
    A[Admin/Kasir masuk ke Halaman Transaksi] --> B{Ada draft tersimpan?}
    B -->|Ya| C[Muat ulang draft keranjang]
    B -->|Tidak| D[Keranjang kosong]
    C --> E[Tampilkan Grid Produk per Kategori]
    D --> E
    E --> F[Kasir klik produk]
    F --> G{Stok tersedia?}
    G -->|Tidak, stok 0| H[Tombol disabled + label 'Habis']
    H --> E
    G -->|Ya| I[Produk masuk ke Keranjang]
    I --> J[Draft otomatis tersimpan di browser]
    J --> K{Kasir ubah qty / hapus item?}
    K -->|Ubah qty +/-| L[Validasi tidak melebihi stok]
    L --> J
    K -->|Hapus item| M[Item dihapus dari keranjang]
    M --> J
    K -->|Lanjut checkout| N[Diskon otomatis by hari terpasang jika berlaku]
    N --> O[Kasir pilih diskon manual dari dropdown jika ada]
    O --> P[Sistem hitung: Subtotal - Diskon + PPN = Total]
    P --> Q[Kasir pilih metode pembayaran]
    Q --> R{Metode = Cash?}
    R -->|Ya| S[Input nominal diterima]
    S --> T{Nominal cukup?}
    T -->|Tidak| U[Tampilkan validasi, transaksi ditolak]
    U --> S
    T -->|Ya| V[Hitung kembalian otomatis]
    R -->|Tidak, QRIS/lain| W[Lanjut tanpa input nominal]
    V --> X[Submit Transaksi]
    W --> X
    X --> Y[Stok otomatis berkurang]
    Y --> Z[Draft dihapus dari browser]
    Z --> AA[Cetak Struk ke printer thermal]
    AA --> AB[Kembali ke Keranjang Kosong]
```

---

## 4. Flow: Manajemen Produk & Stok (Admin)

```mermaid
flowchart TD
    A[Admin masuk ke Manajemen Produk] --> B[Lihat daftar produk induk + varian]
    B --> C{Aksi apa?}
    C -->|Tambah Produk| D[Isi nama, kategori, harga produk induk]
    D --> E[Tambah 1 atau lebih varian + stok masing-masing]
    E --> F[Simpan]
    F --> G[Produk langsung muncul di Grid Kasir]
    C -->|Edit Produk/Stok| H[Pilih produk, ubah data]
    H --> I[Simpan perubahan]
    I --> G
    C -->|Hapus Produk| J[Konfirmasi hapus]
    J --> K[Produk dihapus, histori transaksi lama tidak berubah]
```

---

## 5. Flow: Manajemen Diskon (Admin)

```mermaid
flowchart TD
    A[Admin masuk ke Manajemen Diskon] --> B[Lihat tabel diskon existing]
    B --> C{Aksi apa?}
    C -->|Tambah Diskon| D[Isi nama, value %, pilih tipe]
    D --> E{Tipe?}
    E -->|Otomatis| F[Tentukan hari berlaku]
    E -->|Manual/Dropdown| G[Diskon akan muncul di dropdown kasir]
    F --> H[Set status Aktif/Nonaktif]
    G --> H
    H --> I[Simpan]
    I --> B
    C -->|Toggle Status| J[Aktifkan/Nonaktifkan diskon]
    J --> B
```

---

## 6. Flow: Riwayat Transaksi & Void (Admin) / View (Kasir)

```mermaid
flowchart TD
    A[Masuk ke Riwayat Transaksi] --> B[Lihat tabel semua transaksi]
    B --> C{Role?}
    C -->|Kasir| D[Hanya bisa lihat detail, tanpa aksi edit/hapus]
    C -->|Admin| E[Bisa buka detail transaksi]
    E --> F{Aksi?}
    F -->|Edit| G[Ubah data transaksi, misal qty]
    G --> H[Stok disesuaikan otomatis sesuai selisih]
    F -->|Hapus/Void| I[Konfirmasi hapus]
    I --> J[Stok item dikembalikan/restock otomatis]
    B --> K[Admin bisa export ke Excel]
    K --> L[Pilih filter: harian / bulanan / custom range]
    L --> M[File Excel ter-download]
```

---

## 7. Flow: Manajemen User (Admin)

```mermaid
flowchart TD
    A[Admin masuk ke Manajemen User] --> B[Lihat daftar akun kasir]
    B --> C{Aksi?}
    C -->|Tambah User| D[Isi username & password]
    D --> E{Username sudah terdaftar?}
    E -->|Ya| F[Tolak, tampilkan error]
    F --> D
    E -->|Tidak| G[Akun baru dibuat, role otomatis Kasir]
    G --> B
    C -->|Hapus User| H[Konfirmasi hapus]
    H --> I[Akun dihapus]
    I --> B
```

---

## 8. Ringkasan Titik Kritis (Edge Cases)

| Titik Kritis | Penanganan |
|---|---|
| Stok produk 0 saat kasir memilih | Tombol disabled + label "Habis", tidak bisa diklik |
| Koneksi terputus saat transaksi berjalan | Draft tersimpan lokal di browser, otomatis dimuat ulang saat kembali ke halaman |
| Nominal cash kurang dari total | Transaksi ditolak, validasi ditampilkan, kasir harus input ulang |
| Dua kasir transaksi produk stok terbatas bersamaan | Validasi stok di backend saat submit — transaksi kedua ditolak jika stok sudah habis |
| Admin void transaksi | Stok otomatis dikembalikan (restock) |
| Admin hapus produk yang ada di histori transaksi lama | Histori transaksi tidak berubah/rusak |
