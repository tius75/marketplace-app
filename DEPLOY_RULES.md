# 📋 CARA DEPLOY FIRESTORE RULES (WAJIB DILAKUKAN!)

## ⚠️ PENTING: Rules TIDAK otomatis update!
Anda HARUS deploy rules secara manual ke Firebase Console.

---

## 🚀 CARA 1: Deploy via Firebase CLI (RECOMMENDED)

### Langkah 1: Install Firebase CLI (jika belum ada)
```bash
npm install -g firebase-tools
```

### Langkah 2: Login ke Firebase
```bash
firebase login
```

### Langkah 3: Inisialisasi Project (jika belum)
```bash
firebase init firestore
```
- Pilih project Firebase Anda
- File rules: `firestore.rules` (tekan Enter)

### Langkah 4: Deploy Rules
```bash
firebase deploy --only firestore:rules
```

**Output yang diharapkan:**
```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/YOUR-PROJECT/overview
```

---

## 🌐 CARA 2: Deploy via Firebase Console (MANUAL)

### Langkah 1: Buka Firebase Console
1. Buka: https://console.firebase.google.com
2. Pilih project Anda
3. Klik **"Firestore Database"** di menu kiri
4. Klik tab **"Rules"** di bagian atas

### Langkah 2: Copy-Paste Rules
1. Buka file: `firestore.rules` di project Anda
2. **SELECT ALL** (Ctrl+A / Cmd+A) 
3. **COPY** (Ctrl+C / Cmd+C)
4. Paste ke editor Rules di Firebase Console
5. **REPLACE ALL** rules yang lama

### Langkah 3: Publish
1. Klik tombol **"Publish"** (pojok kanan atas)
2. Tunggu konfirmasi "Rules published successfully"
3. ✅ SELESAI!

---

## ✅ CARA TEST RULES SUDAH AKTIF

### Test 1: Chat
1. Login ke aplikasi
2. Buka halaman `/chat`
3. Coba mulai chat baru
4. **HARUS:** Tidak ada error "Missing or insufficient permissions"
5. **HARUS:** Chat berhasil dibuat dan terkirim

### Test 2: Tambah Kategori (Superadmin)
1. Login sebagai superadmin
2. Buka `/superadmin`
3. Klik tab "Kategori"
4. Klik "➕ Tambah"
5. Isi form dan klik "Simpan"
6. **HARUS:** Kategori berhasil ditambahkan

### Test 3: Tambah Produk (Admin)
1. Login sebagai admin
2. Buka `/admin`
3. Tambah produk baru dengan gambar
4. **HARUS:** Produk berhasil ditambahkan

---

## 🐛 TROUBLESHOOTING

### Error: "Missing or insufficient permissions" MASIH MUNCUL

**Penyebab 1: Rules belum ter-deploy**
- ✅ Solusi: Deploy ulang rules (lihat cara di atas)

**Penyebab 2: User belum login**
- ✅ Solusi: Pastikan sudah login dulu

**Penyebab 3: User bukan superadmin**
- ✅ Solusi: Tambah UID user ke collection `superadmins` di Firestore

**Penyebab 4: Cache browser**
- ✅ Solusi: Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
- Atau buka di Incognito/Private window

### Cara Tambah Superadmin Manual:
1. Buka Firebase Console → Firestore Database
2. Buat collection: `superadmins` (jika belum ada)
3. Buat document baru
4. **Document ID**: UID user Anda (dari Firebase Auth)
5. Fields: (opsional, bisa kosong)
6. Save

**Cara dapat UID user:**
1. Buka Firebase Console → Authentication → Users
2. Copy UID user yang mau jadi superadmin
3. Paste sebagai Document ID di collection `superadmins`

---

## 📝 STRUKTUR FIRESTORE YANG DIBUTUHKAN

### Collection yang Harus Ada:

```
Firestore Database
├─ superadmins (collection)
│  └─ {UID_USER_SUPERADMIN} (document)
│
├─ admins (collection)
│  └─ {UID_USER_ADMIN} (document)
│
├─ categories (collection)
│  └─ {categoryId} (document)
│     ├─ name: string
│     ├─ icon: string
│     ├─ color: string
│     ├─ order: number
│     └─ active: boolean
│
├─ products (collection)
│  └─ {productId} (document)
│     ├─ name: string
│     ├─ price: number
│     ├─ stock: number
│     ├─ category: string
│     ├─ imageUrls: array
│     ├─ videoUrl: string
│     └─ ownerId: string
│
├─ chats (collection)
│  └─ {chatId} (document)
│     ├─ participants: array [uid1, uid2]
│     ├─ lastMessage: string
│     └─ lastMessageTime: timestamp
│     └─ messages (subcollection)
│        └─ {messageId} (document)
│
└─ notifications (collection)
   └─ {notificationId} (document)
      ├─ userId: string
      ├─ title: string
      ├─ body: string
      ├─ type: string
      └─ read: boolean
```

---

## 🎯 CARA JALANKAN SETUP CATEGORIES

Setelah rules di-deploy, jalankan script setup categories:

```bash
node setup-categories.js
```

**Atau manual via Firebase Console:**
1. Buka Firestore Database
2. Buat collection: `categories`
3. Tambah document untuk setiap kategori
4. Isi fields: name, icon, color, order, active

**Contoh 3 kategori awal:**

**Document 1:**
- ID: `elektronik`
- name: `Elektronik`
- icon: `📱`
- color: `bg-blue-100`
- order: `1`
- active: `true`

**Document 2:**
- ID: `fashion`
- name: `Fashion`
- icon: `👕`
- color: `bg-pink-100`
- order: `2`
- active: `true`

**Document 3:**
- ID: `makanan`
- name: `Makanan & Minuman`
- icon: `🍔`
- color: `bg-orange-100`
- order: `3`
- active: `true`

---

## ✅ CHECKLIST AFTER DEPLOY

Setelah deploy rules, pastikan semua ini berfungsi:

- [ ] Rules sudah ter-publish di Firebase Console
- [ ] Chat bisa dibuka tanpa error
- [ ] Bisa kirim pesan di chat
- [ ] Superadmin bisa tambah kategori
- [ ] Superadmin bisa edit kategori
- [ ] Superadmin bisa hapus kategori
- [ ] Admin bisa tambah produk
- [ ] Superadmin bisa tambah produk
- [ ] Notifikasi muncul di header
- [ ] Image zoom berfungsi
- [ ] Video player berfungsi

---

## 🔐 SECURITY NOTES

Rules ini sudah mengizinkan:
- ✅ Semua user bisa baca products, categories, banners, promos
- ✅ User hanya bisa update data sendiri
- ✅ Superadmin punya akses penuh
- ✅ Chat hanya bisa dibaca oleh participants
- ✅ Notifikasi hanya bisa dibaca oleh user yang dituju

---

## 🆘 BUTUH BANTUAN?

Jika masih ada error setelah deploy rules:

1. **Screenshot error message** dari browser console
2. **Screenshot Rules** di Firebase Console
3. **Screenshot** struktur Firestore Anda
4. Share ke developer untuk dicek

---

**DEPLOY RULES SEKARANG SEBELUM TEST FITUR!** 🚀
