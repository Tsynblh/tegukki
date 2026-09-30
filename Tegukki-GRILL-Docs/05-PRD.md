# 05 - Product Requirement Document (PRD)

## 1. Overview

Web application POS (Point of Sale) + Inventory Management untuk toko tumbler dengan struktur produk multi-kategori dan varian (botol minum, tutup botol, sedotan, ukuran, case, keychain). Sistem memiliki 2 role: **Admin (Owner)** dan **User (Kasir)**.

Referensi: `01-PROBLEM-IDEA.md`, `02-PERSONA.md`, `03-COMPETITOR.md`, `04-MVP.md`

---

## 2. User Roles & Hak Akses

| Role | Deskripsi | Akses |
|---|---|---|
| **Admin** | Owner toko, pengelola penuh sistem | Manajemen Produk, Manajemen Stok, Manajemen Diskon, Manajemen User, Riwayat Transaksi (full access + edit/hapus) |
| **User (Kasir)** | Pegawai yang menangani transaksi penjualan | Transaksi Kasir, Lihat Stok (read-only), Riwayat Transaksi (view-only, semua transaksi) |

---

## 3. User Stories & Acceptance Criteria

### Epic A: Manajemen Produk & Stok (Admin)

**US-A1**: Sebagai Admin, saya ingin menambahkan produk induk beserta variannya, agar stok setiap varian bisa dikelola secara terpisah.

*Acceptance Criteria:*
- [ ] Admin dapat membuat produk induk dengan atribut: nama, kategori, harga dasar
- [ ] Admin dapat menambahkan satu atau lebih varian (kombinasi ukuran × warna) di bawah produk induk
- [ ] Setiap varian memiliki stok independen
- [ ] **Setiap varian wajib memiliki foto produk** — sistem menolak penyimpanan varian baru jika foto tidak disertakan
- [ ] Sistem menolak penyimpanan jika nama produk/varian kosong
- [ ] Produk yang baru dibuat langsung muncul di grid kasir (User) sesuai kategorinya

**US-A2**: Sebagai Admin, saya ingin mengedit atau menghapus produk/varian, agar data tetap akurat saat ada perubahan.

*Acceptance Criteria:*
- [ ] Admin dapat mengubah nama, kategori, harga, dan stok produk/varian yang sudah ada
- [ ] Admin dapat menghapus produk/varian
- [ ] Jika produk/varian dihapus namun pernah muncul di transaksi historis, data transaksi lama **tidak berubah** (histori tetap menyimpan nama produk saat transaksi terjadi)

**US-A3**: Sebagai User (Kasir), saya ingin melihat stok produk secara read-only, agar saya tahu ketersediaan barang tanpa bisa mengubahnya.

*Acceptance Criteria:*
- [ ] User dapat melihat daftar produk & stok masing-masing varian
- [ ] Tidak ada tombol/aksi edit atau hapus yang terlihat/dapat diakses oleh User
- [ ] Percobaan akses langsung ke endpoint edit stok oleh User ditolak sistem (validasi role di backend, bukan hanya UI)

---

### Epic B: Manajemen Diskon (Admin)

**US-B1**: Sebagai Admin, saya ingin membuat diskon otomatis berdasarkan hari, agar promo tertentu berlaku tanpa aksi manual kasir.

*Acceptance Criteria:*
- [ ] Admin dapat membuat diskon dengan tipe "Otomatis" dan menentukan hari berlaku (misal: Jumat)
- [ ] Diskon otomatis dengan status Aktif akan langsung terpasang di keranjang kasir tanpa perlu dipilih User, jika hari transaksi sesuai kondisi
- [ ] Admin dapat mengatur status diskon menjadi Nonaktif untuk menghentikan promo tanpa menghapus datanya

**US-B2**: Sebagai Admin, saya ingin membuat diskon manual (dropdown) berdasarkan metode pembayaran, agar kasir bisa menerapkannya sesuai kondisi pelanggan.

*Acceptance Criteria:*
- [ ] Admin dapat membuat diskon dengan tipe "Manual/Dropdown"
- [ ] Diskon dengan status Aktif muncul sebagai opsi di dropdown pada layar kasir
- [ ] Diskon dengan status Nonaktif tidak muncul di dropdown kasir

**US-B3**: Sebagai User (Kasir), saya ingin diskon otomatis dan diskon manual bisa digabung, agar pelanggan mendapat total diskon yang sesuai kondisi.

*Acceptance Criteria:*
- [ ] Jika diskon otomatis aktif (misal hari Jumat 10%) dan kasir memilih diskon manual (misal BSI 15%), kedua diskon diterapkan sekaligus (stacking, total 25% dari subtotal)
- [ ] Perhitungan akhir: `Subtotal - (Subtotal x Total% Diskon) + PPN`

---

### Epic C: Transaksi Kasir (User)

**US-C1**: Sebagai Kasir, saya ingin memilih produk dari grid yang dikelompokkan per kategori, agar saya bisa cepat menemukan produk di antara banyak varian.

*Acceptance Criteria:*
- [ ] Grid produk ditampilkan dikelompokkan berdasarkan kategori (Botol Minum, Tutup Botol, Sedotan, Case, Keychain, dll)
- [ ] Klik produk akan menambahkannya ke keranjang di kolom kanan
- [ ] Produk dengan stok 0 ditampilkan **disabled** dengan label **"Habis"**, tidak bisa diklik

**US-C2**: Sebagai Kasir, saya ingin mengubah jumlah atau menghapus item di keranjang, agar saya bisa memperbaiki kesalahan input sebelum transaksi selesai.

*Acceptance Criteria:*
- [ ] Setiap item di keranjang memiliki tombol `-` dan `+` untuk mengubah quantity
- [ ] Quantity tidak bisa kurang dari 1 (jika ditekan `-` pada qty 1, munculkan opsi hapus item, bukan qty 0)
- [ ] Setiap item memiliki ikon aksi hapus untuk menghapus item dari keranjang sepenuhnya
- [ ] Perubahan qty tidak boleh melebihi stok yang tersedia untuk varian tersebut

**US-C3**: Sebagai Kasir, saya ingin transaksi tersimpan sebagai draft di browser, agar data tidak hilang jika saya salah pindah halaman.

*Acceptance Criteria:*
- [ ] Draft keranjang tersimpan otomatis di local storage browser setiap ada perubahan (tambah/kurang/hapus item)
- [ ] Saat kasir kembali ke halaman transaksi, draft sebelumnya otomatis dimuat kembali
- [ ] Draft dihapus hanya jika: (a) transaksi berhasil disubmit, atau (b) kasir menekan tombol reset secara manual
- [ ] Draft bersifat lokal per browser/device (tidak disinkronkan ke server sebelum submit)

**US-C4**: Sebagai Kasir, saya ingin sistem menghitung PPN, diskon, dan kembalian secara otomatis, agar tidak ada kesalahan hitung manual.

*Acceptance Criteria:*
- [ ] PPN dihitung dan ditampilkan di setiap transaksi, tanpa terkecuali (sesuai rate PPN produk)
- [ ] Hasil akhir **tidak dibulatkan** (ditampilkan sesuai hasil hitung apa adanya)
- [ ] Kasir menginput nominal uang cash yang diterima dari pelanggan
- [ ] Sistem menghitung dan menampilkan kembalian = nominal diterima - total transaksi
- [ ] Jika nominal diterima kurang dari total transaksi, sistem menampilkan validasi/warning dan **tidak mengizinkan** transaksi disubmit

**US-C5**: Sebagai Kasir, saya ingin mencetak struk setelah transaksi selesai, agar pelanggan mendapat bukti pembelian fisik.

*Acceptance Criteria:*
- [ ] Setelah transaksi disubmit, tombol "Cetak Struk" memicu print dialog browser yang terhubung ke printer thermal
- [ ] Struk berisi minimal: no. transaksi, tanggal/waktu, daftar produk & qty, subtotal, diskon, PPN, total, metode bayar, kembalian (jika cash)
- [ ] Setelah transaksi submit, stok varian terkait otomatis berkurang sesuai qty yang terjual

---

### Epic D: Manajemen User (Admin)

**US-D1**: Sebagai Admin, saya ingin menambah dan menghapus akun kasir, agar saya bisa mengatur siapa yang berhak mengakses sistem.

*Acceptance Criteria:*
- [ ] Admin dapat membuat akun baru dengan username & password, role otomatis "Kasir"
- [ ] Admin dapat menghapus akun kasir yang sudah tidak aktif
- [ ] Setiap akun kasir bersifat individual (tidak ada akun bersama) untuk keperluan audit trail
- [ ] Sistem menolak pembuatan akun dengan username yang sudah terdaftar

---

### Epic E: Riwayat Transaksi (Admin & User)

**US-E1**: Sebagai Admin/Kasir, saya ingin melihat riwayat semua transaksi, agar saya bisa memantau aktivitas penjualan.

*Acceptance Criteria:*
- [ ] Tabel riwayat transaksi menampilkan kolom: No. unik transaksi, tanggal/waktu, produk dibeli (qty), diskon dipakai, subtotal, PPN, total, metode pembayaran, **username kasir**
- [ ] Baik Admin maupun User dapat melihat seluruh transaksi (transparan, tidak difilter per user)
- [ ] Tombol aksi Edit/Hapus **hanya muncul untuk role Admin**; tidak tersedia sama sekali di tampilan User

**US-E2**: Sebagai Admin, saya ingin mengedit atau menghapus (void) transaksi, agar saya bisa mengoreksi kesalahan input kasir.

*Acceptance Criteria:*
- [ ] Admin dapat membuka detail transaksi tertentu dan memilih aksi Edit atau Hapus
- [ ] Jika transaksi dihapus, stok terkait **dikembalikan** (restock otomatis sesuai item yang ada di transaksi tersebut)
- [ ] Jika transaksi diedit (misal ubah qty), stok disesuaikan otomatis mengikuti selisih perubahan

**US-E3**: Sebagai Admin, saya ingin melihat total omzet harian dan mengekspor data transaksi, agar saya bisa melakukan pembukuan atau pelaporan pajak.

*Acceptance Criteria:*
- [ ] Total omzet harian ditampilkan otomatis di halaman riwayat transaksi
- [ ] Admin dapat mengekspor data transaksi ke format Excel (.xlsx)
- [ ] Export mendukung filter: per hari, per bulan, dan custom rentang tanggal
- [ ] File export berisi kolom yang sama seperti tabel riwayat transaksi di web

---

## 4. Business Rules

| No | Rule |
|---|---|
| BR-1 | Hanya Admin yang dapat menambah, mengedit, atau menghapus data produk dan stok. User tidak memiliki akses ini sama sekali (baik di UI maupun API/backend). |
| BR-2 | Diskon otomatis (by hari) diterapkan otomatis tanpa aksi kasir. Diskon manual (dropdown) hanya bisa dipilih dari daftar diskon dengan status Aktif. |
| BR-3 | Diskon otomatis dan diskon manual dapat digabung (stacking) dalam satu transaksi. |
| BR-4 | PPN wajib dihitung di setiap transaksi tanpa kecuali, sesuai rate PPN produk. Tidak ada transaksi tanpa PPN. |
| BR-5 | Hasil akhir transaksi (setelah diskon & PPN) tidak dibulatkan — ditampilkan sesuai nominal hasil hitung. |
| BR-6 | Setiap akun User bersifat individual (1 username = 1 orang) untuk keperluan audit trail — tidak ada akun bersama antar-shift. |
| BR-7 | Void/edit transaksi hanya dapat dilakukan oleh Admin. User tidak memiliki akses ke aksi ini. |
| BR-8 | Produk/varian dengan stok 0 tidak dapat ditransaksikan — tombol produk disabled dengan label "Habis". |
| BR-9 | Draft transaksi tersimpan secara lokal di browser dan hanya terhapus saat transaksi disubmit berhasil atau saat kasir menekan reset secara manual. |
| BR-10 | Nominal cash yang diinput kasir harus lebih besar atau sama dengan total transaksi; jika kurang, transaksi tidak dapat disubmit. |
| BR-11 | Setiap varian produk wajib memiliki foto — sistem menolak penyimpanan varian tanpa foto. Foto disimpan per varian, bukan per produk induk (karena tiap kombinasi ukuran/warna tampilan visualnya berbeda). |
| BR-12 | Admin memiliki akses ke halaman Transaksi/Kasir yang sama dengan User — dapat melakukan transaksi secara langsung jika diperlukan (misal saat toko sepi pegawai). |

---

## 5. Edge Cases & Failure Flows

| Skenario | Perilaku Sistem yang Diharapkan |
|---|---|
| Kasir klik produk dengan stok 0 | Tombol produk disabled, label "Habis" ditampilkan, tidak ada aksi yang terjadi saat diklik |
| Koneksi internet putus saat transaksi berjalan (belum submit) | Draft keranjang tetap tersimpan di browser lokal; begitu kasir kembali ke halaman (setelah koneksi kembali), draft dimuat ulang secara otomatis |
| Kasir salah tekan tombol +/- hingga qty melebihi stok tersedia | Sistem menolak penambahan qty lebih dari stok yang tersedia, menampilkan pesan validasi |
| Kasir input nominal cash lebih kecil dari total transaksi | Transaksi tidak dapat disubmit, sistem menampilkan validasi jumlah kurang |
| Admin menghapus (void) transaksi yang sudah tercatat | Stok item dalam transaksi tersebut dikembalikan (restock) secara otomatis |
| Admin menghapus produk yang sudah pernah ada di transaksi lama | Data historis transaksi tidak berubah/rusak; nama produk tetap tercatat sesuai kondisi saat transaksi terjadi |
| Dua kasir berbeda transaksi bersamaan pada produk dengan stok terbatas (misal stok tersisa 1, keduanya coba jual di waktu hampir sama) | Sistem harus memvalidasi stok di sisi backend saat submit (bukan hanya di UI), transaksi kedua yang submit akan gagal/ditolak jika stok sudah habis akibat transaksi pertama |
| Kasir menekan tombol reset di tengah transaksi | Draft keranjang dikosongkan sepenuhnya, kembali ke kondisi awal |

---

## 6. Out of Scope (Post-MVP)

Merujuk pada `04-MVP.md`, hal-hal berikut secara sengaja **tidak** termasuk dalam scope PRD ini:
- Grafik tren penjualan & analisis produk terlaris
- Laporan dashboard visual (chart-based)
- Avatar/foto profil kasir
- Multi-tenant / multi-toko
- Integrasi pembayaran QRIS langsung di dalam web app (QRIS ditampilkan di display kasir fisik terpisah)
