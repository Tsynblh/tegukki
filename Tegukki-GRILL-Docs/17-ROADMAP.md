# 17 - Roadmap

## 1. Timeline Rilis MVP

Target rilis: **secepatnya**, tanpa deadline ketat (sesuai keputusan Tahap 2) — prioritas pada kualitas dan kelengkapan fitur must-have (`04-MVP.md`) sebelum go-live, bukan mengejar tanggal tertentu.

**Urutan kerja yang disarankan**:
1. Setup project (struktur folder, database schema, auth) sesuai `13-FOLDER-STRUCTURE.md`
2. Implementasi fitur inti sesuai urutan Epic di `05-PRD.md` (Produk & Stok → Diskon → Transaksi Kasir → Manajemen User → Riwayat Transaksi)
3. Jalankan `15-QA-CHECKLIST.md` secara menyeluruh
4. Deploy ke production sesuai `16-DEPLOYMENT.md`
5. UAT langsung oleh owner (kamu sendiri) di lingkungan production sebelum dipakai kasir sehari-hari
6. Go-live — mulai dipakai toko tumbler sehari-hari

---

## 2. Phase 2 (Pasca-MVP, Setelah Data Transaksi Cukup Terkumpul)

Fitur-fitur ini sengaja ditunda dari MVP karena baru bermakna setelah ada volume data transaksi yang cukup (biasanya beberapa minggu-bulan pemakaian):

| Fitur | Deskripsi |
|---|---|
| **Grafik tren penjualan** | Visualisasi tren omzet harian/mingguan/bulanan dalam bentuk chart |
| **Analisis produk terlaris** | Ranking produk/varian dengan penjualan tertinggi dalam periode tertentu |
| **Laporan dashboard visual** | Dashboard admin dengan chart-based summary (bukan hanya angka/tabel seperti di MVP) |

**Kriteria mulai Phase 2**: setelah minimal 4-8 minggu pemakaian aktif, cukup data historis untuk membuat analisis ini benar-benar bermakna (bukan sekadar fitur kosong tanpa insight).

---

## 3. Phase 3 (Ekspansi Bisnis — Jika Validasi Produk Berhasil)

Fitur ini relevan **hanya jika** produk sudah tervalidasi stabil di toko tumbler pertama, dan ada keputusan bisnis untuk menjual/dilanggan ke toko lain (sesuai visi di `01-PROBLEM-IDEA.md`):

| Fitur | Deskripsi |
|---|---|
| **Multi-tenant architecture** | Migrasi dari single-tenant (1 toko = 1 database) ke arsitektur yang mendukung banyak toko dalam satu sistem, atau tetap 1 database per toko dengan tooling deployment yang lebih terstandarisasi untuk onboarding toko baru lebih cepat |
| **Onboarding flow untuk toko baru** | Proses setup akun, kategori, dan produk awal yang lebih mudah untuk toko baru yang berlangganan |
| **Billing/subscription management** | Sistem untuk mengelola pembayaran langganan bulanan/tahunan dari toko-toko pelanggan |

**Kriteria mulai Phase 3**: keputusan bisnis eksplisit untuk melakukan ekspansi ke toko lain — bukan dikerjakan secara default tanpa validasi pasar terlebih dahulu.

---

## 4. Automated Testing (Dipertimbangkan Kembali di Masa Depan)

Sesuai diskusi Tahap 6: MVP ini menggunakan manual testing checklist (`15-QA-CHECKLIST.md`). Automated testing (unit test, E2E test) **belum diprioritaskan** untuk MVP, tapi layak dipertimbangkan kembali jika:
- Produk mulai dikembangkan untuk Phase 3 (multi-tenant) dengan kompleksitas yang meningkat
- Frekuensi perubahan kode meningkat dan manual testing mulai terasa memberatkan/rawan terlewat

---

## 5. Ringkasan Prioritas

```
MVP (sekarang) → Phase 2 (analytics, setelah data cukup) → Phase 3 (multi-tenant, jika validasi bisnis berhasil)
```

Tidak ada fitur lain yang tercatat di luar 3 fase ini berdasarkan seluruh sesi GRILL Tahap 1-6.
