# 01 - Problem & Idea

## 1. Problem Statement

Toko tumbler (produk: botol minum, tutup botol terpisah, sedotan terpisah, berbagai ukuran, case botol, keychain) saat ini masih mengelola transaksi kasir secara **manual (full manual — nota kertas/kalkulator)**.

Dampak dari kondisi ini:
1. **Rawan human error** — perhitungan kembalian, diskon, dan total transaksi dihitung manual.
2. **Tidak ada tracking stok real-time** — owner tidak tahu persis sisa stok tiap varian produk (botol, tutup, sedotan, ukuran, case, keychain) tanpa cek fisik.
3. **Tidak ada data historis yang rapi** — sulit melihat produk mana yang laku, kapan waktu ramai, atau melakukan rekap penjualan harian/bulanan.
4. **Kontrol terbatas** — owner tidak punya visibilitas siapa yang melakukan transaksi apa, karena semua tercatat di kertas.

## 2. Mengapa Solusinya Harus Berbentuk Web App

- **Akses lintas perangkat** — Owner (admin) dan pegawai (kasir) bisa mengakses sistem yang sama dari device berbeda tanpa instalasi aplikasi native.
- **Update terpusat** — Perubahan data stok oleh admin langsung terlihat oleh semua kasir secara real-time, tanpa perlu sinkronisasi manual.
- **Kemudahan maintenance & scaling** — Sebagai web app, sistem lebih mudah dikembangkan lebih lanjut untuk kebutuhan multi-toko/multi-tenant di masa depan (lihat model bisnis).
- **Rendah friksi untuk pegawai** — Tidak perlu download/install aplikasi, cukup buka browser di device kasir yang sudah tersedia di toko.

## 3. Jenis Web App

**Kategori**: SaaS Dashboard — spesifiknya **Sistem POS (Point of Sale) + Inventory Management** dengan 2 level akses:

| Role | Hak Akses |
|---|---|
| **Admin (Owner)** | Input & edit barang/stok, kelola kategori & varian produk, lihat laporan penjualan, kontrol penuh sistem |
| **User (Pegawai/Kasir)** | Lihat stok (read-only), melakukan transaksi penjualan, **tidak bisa** input/edit stok |

### Alur Transaksi (Kasir View)
Layar kasir dibagi 2 kolom:
- **Kiri**: Grid produk yang bisa diklik untuk ditambahkan ke keranjang (dikelompokkan per kategori: botol minum, tutup botol, sedotan, case, keychain, dst — mengingat variasi produk yang kompleks).
- **Kanan**: Ringkasan item yang dipilih, harga per item, diskon/promo, pajak, dan total.

Fitur transaksi:
- Cetak struk
- Hitung kembalian otomatis
- Diskon/promo per transaksi
- Pilihan metode pembayaran (cash, QRIS, dll.) — **catatan**: proses pembayaran non-tunai (QRIS) ditampilkan di display kasir fisik terpisah, bukan diproses langsung di dalam web app.
- Saat transaksi selesai, stok inventori otomatis berkurang sesuai item yang terjual.

## 4. Unique Value Proposition (UVP)

> **"POS ringan & terjangkau khusus untuk toko retail dengan produk bervariasi (banyak kategori & varian), dirancang agar kasir bisa transaksi cepat tanpa training lama, dan owner tetap punya kontrol penuh atas stok dan laporan — tanpa kompleksitas dan biaya tinggi seperti sistem enterprise/generik lainnya."**

**Dasar diferensiasi:**
- Struktur kategori & varian produk yang kompleks (botol, tutup terpisah, sedotan terpisah, ukuran, case, keychain) memerlukan UI kasir yang dikelompokkan per kategori — sesuatu yang sering tidak ditangani dengan baik oleh aplikasi kasir generik yang dirancang untuk SKU flat/sederhana.
- Fokus pada kesederhanaan penggunaan (langsung paham tanpa training) dibanding fitur berlebih yang jarang dipakai toko kecil.
- Role & kontrol akses yang jelas antara admin dan kasir sejak awal desain, bukan tambahan fitur di kemudian hari.

## 5. Visi Produk

**Jangka pendek (versi pertama — toko tumbler)**:
- Data penjualan & stok 100% tidak manual lagi.
- Pegawai bisa melakukan transaksi tanpa training lama (intuitif, step-by-step jika diperlukan).
- Transaksi terasa jauh lebih cepat dibanding pencatatan nota manual.
- Owner punya laporan dan visibilitas stok yang rapi tanpa hitung manual.

**Jangka menengah (3-6 bulan ke depan)**:
- Sistem stabil digunakan sehari-hari oleh toko tumbler (1 toko, 2 shift, 4 pegawai).
- Validasi produk cukup matang untuk dikembangkan menjadi produk yang bisa dijual/dilanggan ke toko-toko retail sejenis lain (arsitektur dirancang "multi-tenant ready" sejak awal).

## 6. Model Bisnis

- **Model**: Subscription (langganan) bulanan.
- **Harga**: >150rb/bulan (segmen menengah — di atas opsi mikro seperti Pawoon/Qasir, di bawah harga enterprise seperti Moka POS).
- **Rencana lanjutan**: Opsi langganan tahunan untuk retensi jangka panjang.
- **Target pasar lanjutan**: Toko retail lain dengan struktur produk bervariasi (kategori & varian kompleks), dijual sebagai template/produk SaaS.
