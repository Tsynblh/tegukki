# 11 - API Design

## 1. Konvensi Umum

- Base path: `/api`
- Format: JSON (`Content-Type: application/json`)
- Auth: JWT dikirim via httpOnly cookie, divalidasi di middleware setiap request (kecuali `/api/auth/login`)
- Role-based access dicek di setiap endpoint yang butuh Admin (validasi backend, bukan hanya UI — sesuai BR-1 di PRD)
- Response error konsisten: `{ "error": { "code": "...", "message": "..." } }`

---

## 2. Auth

### POST `/api/auth/login`
Login admin/kasir.

**Request:**
```json
{ "username": "string", "password": "string" }
```
**Response 200:**
```json
{ "user": { "id": "uuid", "username": "string", "role": "admin | kasir" } }
```
**Response 401:** Kredensial salah.

### POST `/api/auth/logout`
Menghapus session/cookie JWT. **Response 200.**

### GET `/api/auth/me`
Mengambil data user yang sedang login (untuk cek role di frontend). **Response 200 / 401.**

---

## 3. Categories (Admin only untuk write)

### GET `/api/categories`
List semua kategori. **Response 200:** `[{ id, name }]`

### POST `/api/categories` *(Admin)*
**Request:** `{ "name": "string" }` **Response 201.**

---

## 4. Products & Variants

### GET `/api/products`
List semua produk beserta varian & stok (dipakai di grid kasir & manajemen produk).

**Response 200:**
```json
[{
  "id": "uuid", "name": "string", "category_id": "uuid", "base_price": 0,
  "variants": [{
    "id": "uuid", "size": "string|null", "color": "string|null",
    "photo_url": "string", "price_override": "number|null", "stock": 0
  }]
}]
```

### POST `/api/products` *(Admin)*
Membuat produk induk baru.
**Request:** `{ "name": "string", "category_id": "uuid", "base_price": 0 }` **Response 201.**

### PUT `/api/products/:id` *(Admin)*
Update produk induk. **Response 200 / 404.**

### DELETE `/api/products/:id` *(Admin)*
Hapus produk (histori transaksi lama tidak terpengaruh, lihat US-A2). **Response 204.**

### POST `/api/products/:id/variants` *(Admin)*
Tambah varian baru ke produk. Foto **wajib** diupload (multipart/form-data ke Vercel Blob, `photo_url` hasil upload disertakan).

**Request (multipart):** `size, color, price_override?, stock, photo (file)`
**Response 201:** Data varian termasuk `photo_url`.
**Response 400:** Jika `photo` tidak disertakan — validasi wajib foto.

### PUT `/api/products/:productId/variants/:variantId` *(Admin)*
Update varian (termasuk ganti foto, stok, harga). **Response 200.**

### DELETE `/api/products/:productId/variants/:variantId` *(Admin)*
Hapus varian. **Response 204.**

---

## 5. Discounts (Admin only untuk write)

### GET `/api/discounts`
List semua diskon. Dipakai admin (tabel manajemen) dan kasir (filter status `is_active` untuk dropdown & cek diskon otomatis hari ini).

### POST `/api/discounts` *(Admin)*
**Request:**
```json
{ "name": "string", "percentage": 10, "type": "auto_by_day | manual_dropdown", "day_condition": "friday|null", "is_active": true }
```
**Response 201.**

### PUT `/api/discounts/:id` *(Admin)*
Update diskon (termasuk toggle `is_active`). **Response 200.**

### DELETE `/api/discounts/:id` *(Admin)*
**Response 204.**

---

## 6. Transactions

### POST `/api/transactions`
Submit transaksi baru (dipanggil kasir saat checkout).

**Request:**
```json
{
  "items": [{ "product_variant_id": "uuid", "quantity": 2 }],
  "discount_ids": ["uuid"],
  "payment_method": "cash | qris | other",
  "cash_received": 50000
}
```

**Business Logic di Backend:**
1. Validasi stok tiap `product_variant_id` mencukupi (mencegah race condition 2 kasir)
2. Hitung subtotal dari harga saat ini (snapshot), terapkan diskon (stacking sesuai BR-3), tambahkan PPN (BR-4)
3. Jika `payment_method = cash`, validasi `cash_received >= total_amount` (BR-10), hitung `change_amount`
4. Kurangi stok tiap varian sesuai quantity
5. Simpan `TransactionItem` dengan snapshot nama & harga
6. Broadcast event Pusher (`stock-updated`) ke semua kasir untuk sync real-time

**Response 201:** Data transaksi lengkap + `transaction_code`.
**Response 400:** Stok tidak cukup / nominal cash kurang / validasi lain gagal.

### GET `/api/transactions`
List riwayat transaksi (Admin & Kasir bisa akses, semua transaksi transparan sesuai US-E1).

**Query params:** `?from=YYYY-MM-DD&to=YYYY-MM-DD&page=1`
**Response 200:** List transaksi + total omzet periode tersebut.

### GET `/api/transactions/:id`
Detail satu transaksi (termasuk items & diskon yang dipakai).

### PUT `/api/transactions/:id` *(Admin)*
Edit transaksi (misal ubah qty item). Stok disesuaikan otomatis sesuai selisih (US-E2). **Response 200.**

### DELETE `/api/transactions/:id` *(Admin)*
Void transaksi (soft-delete, set `deleted_at`). Stok item terkait **dikembalikan** otomatis (US-E2). **Response 204.**

### GET `/api/transactions/export`
Export ke Excel.

**Query params:** `?from=YYYY-MM-DD&to=YYYY-MM-DD` (mendukung harian/bulanan/custom range)
**Response 200:** File `.xlsx` (Content-Disposition: attachment)

---

## 7. Users (Admin only)

### GET `/api/users` *(Admin)*
List semua akun kasir.

### POST `/api/users` *(Admin)*
**Request:** `{ "username": "string", "password": "string" }`
**Response 201 / 409** (jika username sudah terdaftar — US-D1)

### DELETE `/api/users/:id` *(Admin)*
Hapus akun kasir. **Response 204.**

---

## 8. Realtime Events (via Pusher)

| Channel | Event | Payload | Trigger |
|---|---|---|---|
| `store-updates` | `stock-updated` | `{ product_variant_id, new_stock }` | Setiap kali transaksi submit/void mengubah stok |
| `store-updates` | `discount-changed` | `{ discount_id, is_active }` | Admin toggle status diskon (agar dropdown kasir langsung update) |

---

## 9. Status Code Summary

| Code | Kegunaan |
|---|---|
| 200 | Sukses (GET, PUT) |
| 201 | Resource berhasil dibuat (POST) |
| 204 | Berhasil hapus, tanpa response body |
| 400 | Validasi gagal (stok kurang, nominal cash kurang, dll) |
| 401 | Tidak terautentikasi |
| 403 | Terautentikasi tapi tidak punya akses (misal Kasir coba akses endpoint Admin) |
| 404 | Resource tidak ditemukan |
| 409 | Konflik (misal username sudah terdaftar) |
