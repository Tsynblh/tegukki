# 04 - MVP Scope

## 1. Target Rilis

**Secepatnya** — tidak ada deadline ketat, prioritas pada kecepatan development dengan scope yang sudah dipangkas seminimal mungkin (anti-bloat).

---

## 2. Must-Have Features (MVP)

### A. Manajemen Produk & Inventori (Admin Only)
- Tambah/edit/hapus **produk induk** (misal: "Botol Jenis A")
- Tambah/edit/hapus **varian** per produk induk (kombinasi ukuran × warna) dengan **stok terpisah per varian**
- **Foto produk wajib diupload per varian** (bukan per produk induk) — setiap kombinasi ukuran/warna punya foto sendiri
- Kategori produk (Botol Minum, Tutup Botol, Sedotan, Case, Keychain, dll)
- **Hanya Admin** yang bisa input/edit stok — User (kasir) hanya bisa lihat (read-only)

### B. Manajemen Diskon (Admin Only)
- Input diskon: nama, value (%), tipe (**Otomatis** by hari / **Manual—Dropdown** by metode bayar), status (Aktif/Nonaktif)
- Tabel daftar diskon dengan aksi edit/hapus
- **Stacking**: diskon otomatis + diskon manual bisa digabung dalam satu transaksi

### C. Transaksi Kasir (User/Kasir)
- Layar 2 kolom: grid produk per kategori (kiri) | keranjang & ringkasan (kanan)
- Tambah produk ke keranjang, ubah qty (+/-), hapus item dari keranjang
- Produk dengan stok 0 → **disabled + label "Habis"**
- Diskon otomatis (by hari) terpasang otomatis; diskon manual dipilih dari dropdown (hanya yang status Aktif)
- **PPN wajib** dihitung di setiap transaksi (tanpa pembulatan)
- Input nominal cash → hitung kembalian otomatis
- Cetak struk ke printer thermal (via print dialog browser)
- **Draft transaksi tersimpan di browser** — persist walau pindah halaman, hilang hanya saat submit atau reset manual
- Stok otomatis berkurang setelah transaksi selesai

### D. Manajemen User (Admin Only)
- Tambah/hapus akun kasir (username & password)
- Setiap kasir punya akun individu dengan role "Kasir" untuk keperluan audit

### E. Riwayat Transaksi (Admin & User)
- Tabel transaksi: No. unik transaksi, tanggal/waktu, produk dibeli, diskon dipakai, subtotal, PPN, total, metode pembayaran, **nama/username kasir**
- **Admin**: bisa lihat semua transaksi + aksi Edit/Hapus (void)
- **User**: bisa lihat semua transaksi (transparan antar kasir), **tidak ada** aksi edit/hapus
- Total omzet harian
- **Export ke Excel** dengan filter: per hari, per bulan, custom rentang tanggal

---

## 3. Nice-to-Have / Post-MVP (Ditunda)

| Fitur | Alasan Ditunda |
|---|---|
| Grafik tren penjualan | Butuh data historis cukup banyak dulu agar bermakna; tidak berguna di hari-hari awal pakai |
| Analisis produk terlaris | Sama seperti di atas — baru relevan setelah ada volume transaksi memadai |
| Laporan dashboard visual (chart-based) | Nice-to-have, bukan blocker untuk masalah inti (data manual → digital) |
| Avatar/foto profil kasir | Fungsi audit trail sudah terpenuhi dengan username; foto hanya kosmetik |
| Multi-tenant / multi-toko | Di luar scope versi pertama (fokus 1 toko dulu); dipertimbangkan setelah validasi produk di toko pertama |
| Integrasi pembayaran QRIS langsung di web | QRIS ditampilkan di display kasir fisik terpisah, bukan diproses di web app |

---

## 4. Success Metrics (KPI)

MVP dianggap berhasil jika memenuhi kombinasi:

1. **Adopsi**: 100% transaksi harian tercatat di sistem — tidak ada lagi transaksi yang balik ke pencatatan manual/nota kertas.
2. **Akurasi**: Selisih antara stok fisik (saat stok opname) vs stok tercatat di sistem mendekati 0%.
3. **Kecepatan**: Waktu rata-rata penyelesaian satu transaksi lebih cepat dibanding proses manual sebelumnya.

---

## 5. User Roles Summary

| Role | Akses |
|---|---|
| **Admin (Owner)** | Manajemen Produk & Stok, Manajemen Diskon, Manajemen User, Riwayat Transaksi (lihat semua + edit/hapus), **juga bisa melakukan Transaksi Kasir** (misal saat toko sepi pegawai) |
| **User (Kasir)** | Transaksi Kasir, Lihat Stok (read-only), Riwayat Transaksi (lihat semua, tanpa edit/hapus) |
