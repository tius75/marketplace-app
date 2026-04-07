# 📋 DOKUMENTASI LENGKAP FIRESTORE RULES & SETUP

## 🔥 FIRESTORE RULES LENGKAP

File rules sudah diupdate di: `firestore.rules`

### Cara Deploy Rules ke Firebase

**Opsi 1: Via Firebase Console (Paling Mudah)**
1. Buka: https://console.firebase.google.com/project/belanja-mudah-ae88a/firestore/rules
2. Buka file `firestore.rules` di project Anda
3. Copy SEMUA isi file
4. Paste ke editor di Firebase Console
5. Klik **"Publish"** (tunggu sampai selesai)

**Opsi 2: Via Firebase CLI**
```bash
cd "/Users/tius/Documents/Data Tius/marketplace-app"
firebase deploy --only firestore:rules
```

---

## 📊 COLLECTION YANG PERLU DIBUAT

### 1. userRoles (Untuk Role Customer/Mitra)

**Structure:**
```
userRoles (collection)
  └─ {uid} (Document ID = UID User)
      ├─ role: "customer" | "mitra" | "both"
      ├─ createdAt: timestamp
      └─ updatedAt: timestamp
```

**Setup Manual:**
1. Firebase Console → Firestore
2. Buat collection: `userRoles`
3. Document ID = UID user (dari Authentication)
4. Fields:
   - `role` (string): "customer" atau "mitra" atau "both"
   - `createdAt` (timestamp): Auto
   - `updatedAt` (timestamp): Auto

**Cara Setup:**
- User baru login → default: `"customer"`
- User buat produk pertama → update ke: `"mitra"` atau `"both"`

---

### 2. superadmins (Untuk Super Admin)

**Structure:**
```
superadmins (collection)
  └─ {uid} (Document ID = UID SuperAdmin)
      ├─ email: "admin@example.com"
      ├─ role: "super_admin"
      └─ createdAt: timestamp
```

**Setup:**
1. Buat collection: `superadmins`
2. Document ID = UID user yang mau jadi superadmin
3. Fields:
   - `email` (string): email user
   - `role` (string): "super_admin"
   - `createdAt` (timestamp): Auto

---

### 3. admins (Untuk Owner/ Mitra Utama)

**Structure:**
```
admins (collection)
  └─ {uid} (Document ID = UID Admin)
      ├─ email: "owner@example.com"
      ├─ role: "admin"
      └─ createdAt: timestamp
```

**Setup:**
Sama seperti superadmins, tapi collection: `admins`

---

### 4. categories (Untuk Kategori Produk Dinamis)

**Structure:**
```
categories (collection)
  ├─ elektronik
  │   ├─ name: "Elektronik"
  │   ├─ icon: "📱"
  │   ├─ color: "bg-blue-100"
  │   ├─ order: 1
  │   ├─ active: true
  │   └─ createdAt: timestamp
  ├─ fashion
  │   ├─ name: "Fashion"
  │   ├─ icon: "👕"
  │   └─ ... (sama seperti di atas)
  └─ ... (kategori lainnya)
```

**Setup Lengkap:**
Lihat file: `CATEGORIES_SETUP.md`

---

## 🔐 PENJELASAN RULES

### Products
```
✅ Read: Semua orang (bahkan yang belum login)
✅ Create: User login dengan ownerId = uid mereka
✅ Update/Delete: Hanya pemilik produk
✅ SuperAdmin: Bisa CRUD semua produk
```

### Users
```
✅ Read/Write: Hanya user sendiri
✅ SuperAdmin: Bisa baca semua user
```

### UserRoles
```
✅ Read: User bisa baca role sendiri
✅ Write: HANYA SuperAdmin
```

### Orders
```
✅ Create: User login
✅ Read: Customer yang order ATAU seller yang jual
✅ Update: Customer atau seller terkait
✅ Delete: HANYA SuperAdmin
```

### Banners
```
✅ Read: Semua orang
✅ Write: HANYA SuperAdmin
```

### Promos
```
✅ Read: Semua orang
✅ Create: User login dengan ownerId = uid mereka
✅ Update/Delete: Pembuat promo atau SuperAdmin
```

### Categories
```
✅ Read: Semua orang
✅ Write: User login
```

### Feed
```
✅ Read: Semua orang
✅ Create: User login dengan authorUid = uid mereka
✅ Update/Delete: Author atau SuperAdmin
```

### Chats
```
✅ Read: User login
✅ Create: User login dengan senderId = uid mereka
✅ Update/Delete: Pengirim atau SuperAdmin
```

### Notifications
```
✅ Read: User yang punya notifikasi
✅ Create: Sistem atau SuperAdmin
✅ Update: User terkait
✅ Delete: User terkait atau SuperAdmin
```

### Reviews
```
✅ Read: Semua orang
✅ Create: User login dengan authorUid = uid mereka
✅ Update/Delete: Author
```

---

## 🚀 SETUP CHECKLIST

### Step 1: Deploy Firestore Rules
- [ ] Copy isi file `firestore.rules`
- [ ] Paste ke Firebase Console
- [ ] Klik Publish
- [ ] Tunggu sampai selesai

### Step 2: Buat Collection userRoles
- [ ] Buat collection: `userRoles`
- [ ] Tambah document untuk setiap user
- [ ] Set role: "customer", "mitra", atau "both"

### Step 3: Buat Collection superadmins
- [ ] Buat collection: `superadmins`
- [ ] Tambah document untuk superadmin utama
- [ ] UID = UID user yang jadi superadmin

### Step 4: Buat Collection admins (Optional)
- [ ] Buat collection: `admins`
- [ ] Tambah document untuk admin/owner
- [ ] UID = UID user yang jadi admin

### Step 5: Buat Collection categories
- [ ] Buat collection: `categories`
- [ ] Tambah 6-12 kategori (lihat `CATEGORIES_SETUP.md`)
- [ ] Set icon, color, order untuk setiap kategori

### Step 6: Test
- [ ] Login sebagai customer → tidak bisa akses /admin
- [ ] Login sebagai mitra → bisa akses /admin
- [ ] Login sebagai superadmin → bisa akses /superadmin
- [ ] Test chat → icon chat link ke /chat
- [ ] Test kategori → muncul di homepage

---

## 📱 STRUKTUR NAVIGASI

### Homepage (Customer)
```
Header: [Logo] [Search] [💬→/chat] [🛒] [👤]

Bottom Nav:
[🏠 Home] [📋 Transaksi] [📰 Feed] [👤 Profile]
```

### Admin (Mitra/Seller)
```
Header: [Admin Panel] [User] [🚪]

Bottom Nav:
[➕ Tambah] [📦 Katalog] [🛒 Pesanan] [💬→/chat] [🎫 Promo] [🚚 Ongkir] [🖼️ Banner*]

* Banner hanya untuk owner
```

### SuperAdmin
```
Header: [Super Admin] [🚪]

Bottom Nav:
[📊 Dashboard] [📦 Produk] [🛒 Pesanan] [💬→/chat] [🖼️ Banner] [🎫 Promo] [🚚 Ongkir]
```

---

## 🐛 TROUBLESHOOTING

### Permission Denied Error
**Solusi:**
1. Pastikan Firestore Rules sudah di-Publish
2. Logout dan login ulang
3. Clear cache browser
4. Cek UID user di collection yang benar

### Chat Icon Tidak Link ke /chat
**Solusi:**
1. Hard reload: `Cmd+Shift+R` atau `Ctrl+Shift+R`
2. Clear cache browser
3. Restart dev server

### Kategori Tidak Muncul
**Solusi:**
1. Pastikan collection `categories` sudah dibuat
2. Pastikan ada minimal 1 kategori dengan `active: true`
3. Refresh halaman

### User Tidak Bisa Akses Admin
**Solusi:**
1. Cek apakah user ada di collection `userRoles` dengan role "mitra" atau "both"
2. Atau cek apakah user ada di collection `admins`
3. Update role dan login ulang

---

## 📞 BANTUAN

Jika ada masalah, cek file dokumentasi:
- `ROLE_SYSTEM.md` - Sistem role lengkap
- `CATEGORIES_SETUP.md` - Setup categories
- `DOCS_LENGKAP.md` - Dokumentasi aplikasi
- `CHANGELOG.md` - Ringkasan perubahan
