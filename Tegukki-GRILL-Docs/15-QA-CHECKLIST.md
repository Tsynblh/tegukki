# 15 - QA Checklist

## 1. Cara Pakai Dokumen Ini

Checklist ini dijalankan **manual** sebelum setiap rilis ke production. Owner toko (kamu sendiri) berperan sebagai UAT — jalankan seluruh checklist ini sebagai admin DAN sebagai kasir (bisa pakai 2 akun berbeda) sebelum sistem dipakai toko sehari-hari.

---

## 2. Fungsional — Role Admin

- [ ] Login sebagai admin berhasil, redirect ke Dashboard
- [ ] Dashboard menampilkan total omzet hari ini & jumlah transaksi dengan benar
- [ ] Tambah produk induk baru (nama, kategori, harga) — berhasil tersimpan
- [ ] Tambah varian baru dengan foto — **wajib foto**, coba submit tanpa foto harus ditolak
- [ ] Edit produk/varian existing — perubahan tersimpan dan langsung muncul di grid kasir
- [ ] Hapus produk — produk hilang dari grid kasir, tapi transaksi lama yang memuat produk tersebut tetap tampil normal (snapshot data)
- [ ] Tambah diskon tipe "Otomatis" (by hari) — muncul di tabel dengan status Aktif
- [ ] Tambah diskon tipe "Manual/Dropdown" — muncul sebagai opsi di dropdown kasir
- [ ] Toggle status diskon (Aktif ↔ Nonaktif) — dropdown kasir langsung update tanpa refresh (cek realtime Pusher)
- [ ] Tambah akun kasir baru — berhasil, bisa langsung login dengan akun tersebut
- [ ] Coba tambah akun dengan username yang sudah ada — ditolak dengan pesan error jelas
- [ ] Hapus akun kasir — akun tidak bisa login lagi
- [ ] Buka Riwayat Transaksi — semua transaksi (dari semua kasir) terlihat
- [ ] Edit transaksi (ubah qty item) — stok terkait ikut terkoreksi otomatis
- [ ] Void/hapus transaksi — stok item yang di-void otomatis dikembalikan (restock)
- [ ] Export riwayat transaksi ke Excel — filter harian, bulanan, dan custom range semua berfungsi dan file terbuka dengan benar
- [ ] Admin bisa akses halaman Transaksi/Kasir (transaksi manual jika diperlukan)

## 3. Fungsional — Role Kasir

- [ ] Login sebagai kasir berhasil, redirect ke halaman Transaksi
- [ ] Grid produk tampil dikelompokkan per kategori dengan benar
- [ ] Klik produk stok tersedia → masuk ke keranjang
- [ ] Klik produk stok 0 → tombol disabled, label "Habis" tampil, tidak ada aksi terjadi
- [ ] Tombol +/- pada item keranjang berfungsi, tidak bisa melebihi stok tersedia
- [ ] Ikon hapus item di keranjang berfungsi, item hilang dari keranjang
- [ ] Diskon otomatis (misal hari Jumat) otomatis terpasang tanpa aksi kasir
- [ ] Pilih diskon manual dari dropdown — hanya diskon status Aktif yang muncul sebagai opsi
- [ ] Diskon otomatis + manual bisa digabung (stacking) — cek total akhir sesuai kalkulasi
- [ ] PPN selalu muncul dan terhitung di setiap transaksi
- [ ] Input nominal cash lebih kecil dari total — transaksi ditolak, muncul validasi
- [ ] Input nominal cash cukup — kembalian terhitung otomatis dengan benar
- [ ] Submit transaksi berhasil — stok berkurang sesuai qty terjual
- [ ] Cetak struk — print dialog browser muncul, struk berisi data lengkap (no. transaksi, item, diskon, PPN, total, kembalian)
- [ ] Kasir TIDAK bisa akses Manajemen Produk (tidak ada tombol tambah/edit/hapus stok)
- [ ] Kasir bisa lihat Riwayat Transaksi (semua transaksi), TAPI tidak ada tombol Edit/Hapus
- [ ] Refresh/pindah halaman di tengah transaksi (belum submit) → draft keranjang tetap ada saat kembali
- [ ] Tekan tombol reset di keranjang → keranjang kembali kosong

## 4. Realtime Sync

- [ ] Buka 2 device (atau 2 tab browser berbeda, login sebagai kasir berbeda) — transaksi di device A mengurangi stok, device B langsung update tampilan (jadi "Habis" jika stok jadi 0) tanpa refresh manual

## 5. Responsive Layout

- [ ] Halaman kasir tampil baik di tablet landscape (device utama yang dipakai di meja kasir)
- [ ] Halaman admin (produk, diskon, user, riwayat) responsive di layar desktop & tablet
- [ ] Tabel riwayat transaksi bisa di-scroll horizontal di layar sempit tanpa merusak layout

## 6. Form Validation

- [ ] Semua form (tambah produk, tambah varian, tambah diskon, tambah user) menolak input kosong pada field wajib
- [ ] Pesan error validasi jelas dan spesifik (bukan generic "Error" tanpa konteks)

## 7. Loading & Empty States

- [ ] Saat data sedang dimuat (produk, riwayat transaksi), muncul skeleton loading — bukan halaman blank/putih
- [ ] Kondisi belum ada transaksi hari ini — muncul empty state dengan pesan bertone hangat, bukan tabel kosong tanpa keterangan
- [ ] Kondisi belum ada produk sama sekali (toko baru setup) — empty state dengan CTA "Tambah produk pertama"

## 8. Security Dasar

- [ ] Coba akses langsung URL admin (misal `/discounts`) dengan akun kasir yang sudah login — harus ditolak/redirect, bukan menampilkan halaman
- [ ] Coba akses endpoint API admin-only (misal `POST /api/products`) langsung tanpa lewat UI, memakai akun kasir — harus dapat response 403
- [ ] Coba akses halaman manapun tanpa login — redirect ke halaman login
- [ ] Password disimpan di database dalam bentuk hash, bukan plaintext (cek langsung ke database)
- [ ] Cookie JWT bersifat httpOnly (tidak bisa diakses via JavaScript di browser — cek DevTools)

## 9. Meta & Branding Dasar

- [ ] Judul tab browser menampilkan nama "Tegukki", bukan default "Next.js App" atau kosong
- [ ] Favicon sudah diset (tidak default Next.js)
