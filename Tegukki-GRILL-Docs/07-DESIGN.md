# 07 - Design System: Tegukki

## 1. Overview & Vibe

Tegukki adalah sistem POS + Inventory internal untuk toko tumbler, dengan personality **warm, approachable, presisi tanpa kaku**. Design system ini menggunakan tema **Amber Hearth** — palet terracotta/amber hangat dipadu teal muted sebagai penyeimbang, dengan tipografi yang friendly namun tetap presisi untuk data transaksi.

Mode default: **Light Mode** (mempertimbangkan konteks pemakaian di toko dengan pencahayaan terang siang hari), dengan Dark Mode tersedia sebagai alternatif (Adaptive).

---

## 2. Inspirasi & Benchmark Website

| Referensi | Elemen yang Diadopsi |
|---|---|
| **Notion** (notion.so) | Kehangatan lewat warna & nuansa manusiawi; tone komunikasi yang tidak kaku/teknikal |
| **Retool** (retool.com) | Bukti bahwa dashboard/tools internal bisa tetap engaging secara visual, tidak harus terasa seperti spreadsheet |
| **Dashlane** (dashlane.com) | Card dengan shadow lembut (bukan border tebal), penyajian angka/statistik besar dan jelas untuk ringkasan dashboard admin (misal: total omzet, jumlah transaksi) |

---

## 3. Anti-AI Rules (Larangan Eksplisit)

Untuk menghindari kesan "template AI generik/AI slop":

1. ❌ Dilarang menggunakan icon set campuran tanpa konsistensi — wajib satu icon family saja (rekomendasi: **Lucide Icons**, senada dengan estetika rounded & modern dari tema Amber Hearth).
2. ❌ Dilarang gradient ungu-biru generik ala template AI SaaS.
3. ❌ Dilarang card dengan border tebal + shadow berat/dramatis — gunakan shadow subtle sesuai token (`blur: 4px, opacity: 0.05`).
4. ❌ Dilarang layout grid simetris kosong tanpa konten nyata (misal 3-card kosong tanpa isi bermakna) — semua elemen harus punya fungsi jelas.
5. ❌ Dilarang copy generik seperti "Welcome to your dashboard" tanpa personality — gunakan tone hangat khas Tegukki (misal: "Selamat datang kembali!" atau sapaan yang terasa personal).
6. ❌ Dilarang warna aksen di luar token yang sudah ditentukan (tidak ada penambahan warna "ad-hoc" di luar sistem).
7. ❌ Dilarang font default browser (Arial/Times New Roman) atau font generik AI (Inter tanpa styling) — wajib pakai `Outfit`, `Merriweather`, `JetBrains Mono` sesuai token.
8. ❌ Dilarang empty state kosong tanpa ilustrasi/copy — setiap kondisi kosong (misal belum ada transaksi hari ini) harus punya pesan yang jelas dan terasa dirancang, bukan sekadar "No data".

---

## 4. Color Palette

### Light Mode (Default)

| Token | Hex | Kegunaan |
|---|---|---|
| `background` | `#ffffff` | Latar utama |
| `foreground` | `#111827` | Teks utama |
| `card` | `#ffffff` | Latar card |
| `card-foreground` | `#111827` | Teks di dalam card |
| `primary` | `#d87943` | Aksi utama (tombol, aksen) — terracotta/amber |
| `primary-foreground` | `#ffffff` | Teks di atas primary |
| `secondary` | `#527575` | Aksi sekunder — teal muted |
| `secondary-foreground` | `#ffffff` | Teks di atas secondary |
| `muted` | `#f3f4f6` | Latar elemen non-aktif |
| `muted-foreground` | `#6b7280` | Teks sekunder/caption |
| `accent` | `#eeeeee` | Highlight ringan |
| `border` | `#e5e7eb` | Garis pembatas |
| `input` | `#e5e7eb` | Border input form |
| `ring` | `#d87943` | Focus ring |
| `destructive` | `#ef4444` | Aksi hapus/error (misal: hapus item, void transaksi) |
| `destructive-foreground` | `#fafafa` | Teks di atas destructive |
| `sidebar` | `#f3f4f6` | Latar sidebar navigasi |

### Dark Mode

| Token | Hex | Kegunaan |
|---|---|---|
| `background` | `#121113` | Latar utama |
| `foreground` | `#c1c1c1` | Teks utama |
| `card` | `#121212` | Latar card |
| `primary` | `#e78a53` | Aksi utama (versi lebih terang untuk kontras dark mode) |
| `secondary` | `#5f8787` | Aksi sekunder |
| `muted` | `#222222` | Latar elemen non-aktif |
| `border` | `#222222` | Garis pembatas |
| `destructive` | `#5f8787` | Aksi hapus/error |

### Chart Colors (untuk laporan/export data)

`#5f8787` (chart-1), `#e78a53` (chart-2), `#fbcb97` (chart-3), `#888888` (chart-4), `#999999` (chart-5)

---

## 5. Typography

| Font | Kegunaan |
|---|---|
| **Outfit** (sans-serif) | Font utama — UI, body text, tombol, navigasi. Geometris dengan sudut lembut, terasa friendly. |
| **Merriweather** (serif) | Aksen editorial — dipakai terbatas untuk heading besar/branding (misal halaman login, judul utama) agar terasa hangat, bukan untuk seluruh body text. |
| **JetBrains Mono** (monospace) | **Wajib untuk semua angka transaksi** (harga, subtotal, PPN, total, kembalian) — memastikan angka presisi dan mudah dibaca, tidak ambigu. |

### Hierarchy Scale (indikatif)

| Level | Font | Size | Weight |
|---|---|---|---|
| H1 (judul halaman) | Outfit | 28-32px | 600 |
| H2 (section) | Outfit | 20-24px | 600 |
| Body | Outfit | 14-16px | 400 |
| Caption/label | Outfit | 12-13px | 400-500 |
| Angka transaksi/harga | JetBrains Mono | 16-20px (lebih besar untuk total) | 500-600 |
| Heading aksen (opsional) | Merriweather | 24-28px | 400 (italic opsional untuk tagline) |

Letter spacing: `0rem` (default, tidak ada tracking tambahan — sesuai token).

---

## 6. Spacing, Layout & Density

- **Base spacing unit**: `0.25rem` (4px) — semua spacing kelipatan dari unit ini.
- **Border radius**: `0.75rem` (soft rounded) — konsisten di semua komponen (card, button, input) untuk kesan approachable, bukan tajam/korporat.
- **Density**: Layout kasir (transaksi) perlu **cukup padat** karena grid produk banyak varian — prioritaskan efisiensi ruang tanpa terasa sesak (gunakan spacing konsisten antar card produk). Layout admin (manajemen produk, laporan) bisa lebih lapang karena tidak time-critical seperti layar kasir.
- **Shadow**: Subtle — `blur: 4px, spread: 0px, offset-y: 1px, opacity: 0.05`. Tidak ada shadow dramatis/berat.

---

## 7. Component Specs

### Buttons
- **Primary**: Background `primary` (#d87943), teks putih, radius 0.75rem, tanpa border.
- **Secondary**: Background `secondary` (#527575) atau outline dengan border `border` token, untuk aksi sekunder.
- **Destructive**: Background `destructive` (#ef4444), dipakai khusus untuk aksi hapus/void — harus selalu disertai konfirmasi (modal/dialog) sebelum eksekusi.
- Hover state: sedikit darken/opacity shift, transisi halus (lihat Motion).

### Inputs / Forms
- Border menggunakan token `input` (#e5e7eb), radius 0.75rem.
- Focus state: ring menggunakan token `ring` (#d87943) — terlihat jelas tapi tidak berlebihan.
- Untuk input nominal (cash, harga), gunakan font `JetBrains Mono` agar angka mudah dibaca saat diketik.

### Cards
- Background `card`, shadow subtle sesuai token, radius 0.75rem.
- Tidak ada border tebal — andalkan shadow lembut untuk pemisahan visual antar card.
- Card produk di layar kasir: harus menampilkan nama produk, harga (JetBrains Mono), dan status stok (badge "Habis" jika 0).

### Badges
- Status "Habis": background `destructive` dengan opacity rendah, teks `destructive`.
- Status "Aktif" (diskon): background `secondary` dengan opacity rendah, teks `secondary`.

### Navigation
- Sidebar menggunakan token `sidebar`/`sidebar-foreground`/`sidebar-border`, konsisten dengan tema utama.
- Item aktif di sidebar menggunakan `sidebar-primary` sebagai indikator.

### Image Upload / Preview (Foto Produk per Varian)
- Setiap form varian produk **wajib** menyertakan komponen upload foto — ditandai jelas sebagai field wajib (misal label "Foto Varian *" dengan indikator merah/asterisk).
- Area upload menggunakan dashed border dengan radius 0.75rem (konsisten dengan token), berisi ikon upload (Lucide) + teks instruksi singkat ("Klik atau tarik foto ke sini").
- Setelah foto dipilih, tampilkan **preview thumbnail** langsung (rounded, radius 0.75rem) menggantikan area upload, dengan tombol kecil "Ganti foto" untuk mengulang proses.
- Validasi: jika admin submit form tanpa foto, tampilkan pesan error jelas di bawah area upload (bukan hanya alert generik) — konsisten dengan gaya validasi form lain.
- Ukuran preview di form: persegi (aspect-ratio 1:1) agar konsisten dengan tampilan card produk di grid kasir.
- Di grid kasir & tabel manajemen produk, foto varian ditampilkan sebagai thumbnail kecil (rounded, radius 0.75rem) di bagian atas/kiri card — bukan foto besar yang mendominasi, karena fokus utama tetap nama produk & harga (JetBrains Mono).

### Empty States
- Tidak boleh kosong generik ("No data"). Setiap empty state harus punya: ikon (dari Lucide, konsisten), pesan singkat dengan tone hangat khas Tegukki, dan CTA jika relevan (misal: "Belum ada transaksi hari ini — yuk mulai transaksi pertama!").

### Loading States
- Skeleton loading (bukan spinner generik) untuk tabel/list data, menggunakan warna `muted` sebagai placeholder shimmer.

---

## 8. Motion & Micro-interactions

- Transisi halus dan cepat (150-200ms) untuk hover/focus state — tidak ada animasi berlebihan yang memperlambat alur kerja kasir (ingat: kecepatan transaksi adalah prioritas UX).
- Tombol produk di grid kasir: sedikit scale/opacity feedback saat diklik (memberi konfirmasi visual instan tanpa delay).
- Notifikasi sukses (misal transaksi berhasil): muncul singkat (toast), tidak mengganggu alur kerja berikutnya.

---

## 9. Responsive Rules

- **Prioritas utama**: Desktop/tablet landscape (device kasir di toko umumnya laptop/tablet dengan layar cukup lebar untuk layout 2 kolom kasir).
- Layout kasir (2 kolom: grid produk | ringkasan transaksi) tetap dipertahankan di tablet landscape; di layar sempit (mobile portrait), ringkasan transaksi bisa collapse menjadi drawer/bottom sheet yang bisa expand.
- Halaman admin (manajemen produk, laporan) responsive standar — tabel bisa scroll horizontal di layar sempit.
