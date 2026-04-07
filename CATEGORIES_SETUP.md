# Panduan Setup Collection Categories di Firestore

## 📁 Struktur Collection

### Firestore Structure:
```
categories (collection)
  ├─ elektronik (document ID)
  │   ├─ name: "Elektronik"
  │   ├─ icon: "📱"
  │   ├─ color: "bg-blue-100"
  │   ├─ order: 1
  │   ├─ active: true
  │   └─ createdAt: timestamp
  │
  ├─ fashion (document ID)
  │   ├─ name: "Fashion"
  │   ├─ icon: "👕"
  │   ├─ color: "bg-pink-100"
  │   ├─ order: 2
  │   ├─ active: true
  │   └─ createdAt: timestamp
  │
  ├─ makanan (document ID)
  │   ├─ name: "Makanan & Minuman"
  │   ├─ icon: "🍔"
  │   ├─ color: "bg-orange-100"
  │   ├─ order: 3
  │   ├─ active: true
  │   └─ createdAt: timestamp
  │
  └─ ... (kategori lainnya)
```

---

## 🔧 Cara Setup Manual via Firebase Console

### Langkah 1: Buat Collection

1. Buka: https://console.firebase.google.com/project/belanja-mudah-ae88a/firestore/data
2. Klik **"Start collection"** atau **"Add collection"**
3. Collection ID: `categories`
4. Klik **Next**

### Langkah 2: Tambah Document Pertama

**Document ID:** `elektronik` (harus lowercase, tanpa spasi)

**Fields:**
| Field | Type | Value |
|-------|------|-------|
| name | string | Elektronik |
| icon | string | 📱 |
| color | string | bg-blue-100 |
| order | number | 1 |
| active | boolean | true |
| createdAt | timestamp | Klik "Auto" |

Klik **Save**

### Langkah 3: Ulangi untuk Kategori Lainnya

**Document 2:**
- Document ID: `fashion`
- name: `Fashion`
- icon: `👕`
- color: `bg-pink-100`
- order: `2`
- active: `true`
- createdAt: `Auto`

**Document 3:**
- Document ID: `makanan`
- name: `Makanan & Minuman`
- icon: `🍔`
- color: `bg-orange-100`
- order: `3`
- active: `true`
- createdAt: `Auto`

**Document 4:**
- Document ID: `kesehatan`
- name: `Kesehatan`
- icon: `💊`
- color: `bg-green-100`
- order: `4`
- active: `true`
- createdAt: `Auto`

**Document 5:**
- Document ID: `olahraga`
- name: `Olahraga`
- icon: `⚽`
- color: `bg-purple-100`
- order: `5`
- active: `true`
- createdAt: `Auto`

**Document 6:**
- Document ID: `otomatis`
- name: `Lainnya`
- icon: `📦`
- color: `bg-gray-100`
- order: `6`
- active: `true`
- createdAt: `Auto`

---

## 🎨 Daftar Emoji Icon yang Bisa Dipakai

### Elektronik & Gadget
- 📱 Smartphone
- 💻 Laptop
- 🖥️ Komputer
- 📷 Kamera
- 🎧 Headphone
- ⌚ Smartwatch
- 🎮 Gaming

### Fashion
- 👕 Kaos
- 👗 Dress
- 👔 Kemeja
- 👟 Sepatu
- 👠 High Heels
- 👜 Tas
- 🧢 Topi
- 👓 Kacamata

### Makanan & Minuman
- 🍔 Burger
- 🍕 Pizza
- 🍜 Mie
- ☕ Kopi
- 🧃 Jus
- 🍰 Kue
- 🍉 Buah

### Kesehatan & Kecantikan
- 💊 Obat
- 💄 Makeup
- 🧴 Skincare
- 💅 Nail Care
- 🪮 Hair Care

### Olahraga & Outdoor
- ⚽ Bola
- 🏀 Basket
- 🎾 Tenis
- 🚴 Sepeda
- 🏊 Renang
- 🏕️ Camping

### Rumah & Lifestyle
- 🏠 Rumah
- 🛋️ Furniture
- 🍳 Dapur
- 🛁 Kamar Mandi
- 📚 Buku
- 🎵 Musik
- 🚗 Otomotif
- 📦 Lainnya

### Warna Background (Tailwind)
- `bg-blue-100` → Biru muda
- `bg-pink-100` → Pink muda
- `bg-orange-100` → Oranye muda
- `bg-green-100` → Hijau muda
- `bg-purple-100` → Ungu muda
- `bg-red-100` → Merah muda
- `bg-yellow-100` → Kuning muda
- `bg-gray-100` → Abu-abu
- `bg-indigo-100` → Indigo muda
- `bg-teal-100` → Teal muda

---

## 📝 Contoh Lengkap 12 Kategori

| ID | Name | Icon | Color | Order |
|----|------|------|-------|-------|
| elektronik | Elektronik | 📱 | bg-blue-100 | 1 |
| fashion | Fashion | 👕 | bg-pink-100 | 2 |
| makanan | Makanan & Minuman | 🍔 | bg-orange-100 | 3 |
| kesehatan | Kesehatan & Kecantikan | 💊 | bg-green-100 | 4 |
| olahraga | Olahraga | ⚽ | bg-purple-100 | 5 |
| otomotif | Otomotif | 🚗 | bg-red-100 | 6 |
| rumah | Rumah Tangga | 🏠 | bg-yellow-100 | 7 |
| buku | Buku & Alat Tulis | 📚 | bg-indigo-100 | 8 |
| musik | Musik & Hiburan | 🎵 | bg-teal-100 | 9 |
| gaming | Gaming | 🎮 | bg-blue-100 | 10 |
| tanaman | Tanaman | 🌱 | bg-green-100 | 11 |
| lainnya | Lainnya | 📦 | bg-gray-100 | 12 |

---

## 🚀 Script Otomatis (Via Console Browser)

Jika ingin setup cepat, buka Firebase Console → Firestore, lalu buka **Console** browser (F12) dan jalankan script ini:

```javascript
// Paste di Console browser saat di halaman Firestore

const categories = [
  { id: 'elektronik', name: 'Elektronik', icon: '📱', color: 'bg-blue-100', order: 1 },
  { id: 'fashion', name: 'Fashion', icon: '👕', color: 'bg-pink-100', order: 2 },
  { id: 'makanan', name: 'Makanan & Minuman', icon: '🍔', color: 'bg-orange-100', order: 3 },
  { id: 'kesehatan', name: 'Kesehatan & Kecantikan', icon: '💊', color: 'bg-green-100', order: 4 },
  { id: 'olahraga', name: 'Olahraga', icon: '⚽', color: 'bg-purple-100', order: 5 },
  { id: 'otomotif', name: 'Otomotif', icon: '🚗', color: 'bg-red-100', order: 6 },
  { id: 'rumah', name: 'Rumah Tangga', icon: '🏠', color: 'bg-yellow-100', order: 7 },
  { id: 'buku', name: 'Buku & Alat Tulis', icon: '📚', color: 'bg-indigo-100', order: 8 },
  { id: 'musik', name: 'Musik & Hiburan', icon: '🎵', color: 'bg-teal-100', order: 9 },
  { id: 'gaming', name: 'Gaming', icon: '🎮', color: 'bg-blue-100', order: 10 },
  { id: 'tanaman', name: 'Tanaman', icon: '🌱', color: 'bg-green-100', order: 11 },
  { id: 'lainnya', name: 'Lainnya', icon: '📦', color: 'bg-gray-100', order: 12 },
];

console.log('Setup categories...');
categories.forEach(cat => {
  console.log(`✅ ${cat.icon} ${cat.name}`);
});
console.log('Done! Sekarang buat manual di Firestore.');
```

---

## 💡 Tips

1. **Document ID** harus:
   - Lowercase
   - Tanpa spasi (gunakan `-` atau `_`)
   - Unik

2. **Order** menentukan urutan tampilan di homepage

3. **Active** bisa di-set `false` untuk hide kategori tanpa hapus

4. **Icon** bisa emoji atau nama class icon (Font Awesome, dll)

5. **Color** harus class Tailwind yang valid

---

## 🔗 Firestore Rules

Tambahkan rules ini di Firestore:

```
match /categories/{categoryId} {
  allow read: if true; // Semua bisa baca
  allow create, update, delete: if request.auth != null; // User login bisa CRUD
}
```

---

## ✅ Checklist Setup

- [ ] Collection `categories` dibuat
- [ ] 12 kategori ditambahkan
- [ ] Setiap kategori punya: name, icon, color, order, active, createdAt
- [ ] Firestore Rules di-update
- [ ] Test di homepage - kategori muncul dengan icon yang benar
- [ ] Test klik kategori - filter produk berfungsi
