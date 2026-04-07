# Cara Menambahkan User sebagai Admin

## Langkah 1: Dapatkan UID User

1. Login ke aplikasi sebagai user yang mau dijadikan admin
2. Buka Firebase Console: https://console.firebase.google.com/project/belanja-mudah-ae88a/auth/users
3. Cari user tersebut, copy **UID** nya (contoh: `abc123xyz456`)

## Langkah 2: Buat Document Admin di Firestore

1. Buka: https://console.firebase.google.com/project/belanja-mudah-ae88a/firestore/data
2. Klik **"Start collection"** atau **"Add collection"** jika belum ada collection `admins`
3. Collection ID: `admins`
4. Document ID: **Paste UID user** (dari Langkah 1)
5. Tambah field:
   - Field: `email` | Type: `string` | Value: email user tersebut
   - Field: `role` | Type: `string` | Value: `super_admin`
   - Field: `createdAt` | Type: `timestamp` | Value: klik "Auto" 
6. Klik **"Save"**

## Langkah 3: Test

1. Logout dan login ulang sebagai user tersebut
2. Coba akses tab "Banner" atau "Promo" di admin
3. Jika berhasil → user sekarang punya akses penuh
4. Jika gagal (permission denied) → cek apakah UID sudah benar

## Contoh Struktur Firestore

```
admins (collection)
  └─ abc123xyz456 (document ID = UID user)
      ├─ email: "admin@example.com" (string)
      ├─ role: "super_admin" (string)
      └─ createdAt: April 6, 2026 at 3:00:00 PM UTC+7 (timestamp)
```

## ⚠️ Penting

- **HANYA** user yang ada di collection `admins` yang bisa:
  - Tambah/edit/hapus Banner
  - Tambah/edit/hapus Promo/Diskon
  - Tambah/edit/hapus Gratis Ongkir
  
- User biasa (tidak ada di `admins`) **TETAP BISA**:
  - Tambah/edit/hapus Produk mereka sendiri
  - Lihat pesanan
  - Update status pesanan

- Collection `admins` hanya bisa dibaca oleh admin (tidak bisa di-edit langsung via app)

## Jika Ingin Multiple Admin

Ulangi Langkah 2 untuk setiap user yang ingin dijadikan admin. Setiap admin punya document sendiri di collection `admins` dengan UID mereka masing-masing.

## Jika Ingin Hapus Admin

1. Buka Firestore → collection `admins`
2. Delete document dengan UID user yang mau dihapus
3. User tersebut langsung kehilangan hak admin
