# Panduan Akses dan Keamanan Aplikasi

## 📱 Akses Aplikasi dari HP via IP Local

### Masalah: Loading saat akses via IP 192.168.1.27

**Penyebab:** Next.js dev server hanya listen di `localhost` secara default.

### Solusi: Start Dev Server dengan Host 0.0.0.0

```bash
cd "/Users/tius/Documents/Data Tius/marketplace-app"
HOST=0.0.0.0 npm run dev
```

Atau edit `package.json`:
```json
"scripts": {
  "dev": "next dev --hostname 0.0.0.0",
  ...
}
```

Kemudian akses dari HP:
```
http://192.168.1.27:3000
```

### ⚠️ Penting untuk Firebase Auth

Jika menggunakan Google Sign-In, Anda harus mendaftarkan **SEMUA origin** di Firebase Console:

1. Buka: https://console.firebase.google.com/project/belanja-mudah-ae88a/auth/settings
2. Scroll ke **"Authorized domains"**
3. Tambahkan domain berikut:
   - `localhost` (sudah ada)
   - `192.168.1.27` (IP lokal Anda)
   - `192.168.1.x` (jika IP berubah)

---

## 🔒 Keamanan Banner - Masalah & Solusi

### Masalah: Setiap User Login Bisa Ubah Banner

Ini memang desain yang Anda berikan di Firebase Rules:
```
allow write: if request.auth != null;
```

Artinya **SIAPAPUN yang login** bisa tambah/edit/hapus banner.

### Solusi 1: Batasi Hanya Admin Tertentu (RECOMMENDED)

Tambahkan **custom claim** `admin: true` ke user tertentu via Firebase Admin SDK.

**Cara Setup:**

1. Install Firebase Admin di project terpisah atau Cloud Function:
```bash
npm install firebase-admin
```

2. Buat script untuk set admin claim:
```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Set user tertentu sebagai admin
const uid = "UID_USER_YANG_HARUS_JADI_ADMIN";
admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log("User berhasil dijadikan admin!");
  });
```

3. Update Firestore Rules:
```
match /banners/{bannerId} {
  allow read: if true;
  // Hanya user dengan claim admin yang bisa tulis
  allow write: if request.auth != null 
               && request.auth.token.admin == true;
}

match /promos/{promoId} {
  allow read: if true;
  allow write: if request.auth != null 
               && request.auth.token.admin == true;
}
```

### Solusi 2: Buat Collection "admins" (Lebih Mudah)

Buat collection khusus di Firestore untuk daftar admin:

**Firestore Structure:**
```
admins (collection)
  └─ {uid} (document)
      ├─ email: "admin@toko.com"
      ├─ role: "super_admin"
      └─ createdAt: timestamp
```

**Update Firestore Rules:**
```
// Helper function untuk cek admin
function isAdmin() {
  return exists(/databases/$(database)/documents/admins/$(request.auth.uid));
}

match /banners/{bannerId} {
  allow read: if true;
  allow write: if request.auth != null && isAdmin();
}

match /promos/{promoId} {
  allow read: if true;
  allow write: if request.auth != null && isAdmin();
}
```

**Cara Menambahkan Admin:**
1. Buka Firebase Console → Firestore
2. Buat collection `admins`
3. Buat document dengan ID = UID user yang mau jadi admin
4. Tambah field sesuai kebutuhan

---

## 🚀 Deploy Firestore Rules Baru

Setelah pilih solusi (1 atau 2), deploy rules:

**Via Firebase Console:**
1. Buka: https://console.firebase.google.com/project/belanja-mudah-ae88a/firestore/rules
2. Paste rules baru
3. Klik "Publish"

**Via Firebase CLI:**
```bash
firebase deploy --only firestore:rules
```

---

## 📋 Checklist Setelah Setup

- [ ] Dev server start dengan `HOST=0.0.0.0`
- [ ] IP lokal didaftarkan di Firebase Authorized Domains
- [ ] Pilih sistem keamanan banner (Solusi 1 atau 2)
- [ ] Firestore Rules sudah di-update dan di-deploy
- [ ] Test akses dari HP - produk muncul tanpa loading
- [ ] Test banner - hanya admin yang bisa edit
- [ ] Test gratis ongkir - voucher bisa dipilih
- [ ] Test notifikasi - popup muncul saat ada pesanan baru
