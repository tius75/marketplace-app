# Sistem Role & Fitur Lengkap Marketplace

## 1. SISTEM ROLE: Customer vs Mitra (Seller)

### Konsep
Setiap user yang login bisa berperan sebagai:
- **Customer**: Pengguna yang belanja
- **Mitra (Seller)**: Pengguna yang membuka lapak dan jualan

### Cara Membedakan

**Opsi 1: Collection `userRoles` di Firestore** (RECOMMENDED)
```
Firestore Structure:
userRoles (collection)
  └─ {uid} (document ID = UID user)
      ├─ role: "customer" | "mitra" | "both"
      ├─ createdAt: timestamp
      └─ updatedAt: timestamp
```

**Setup:**
1. Saat user pertama kali login → default role: `"customer"`
2. Saat user membuat produk pertama → upgrade ke: `"mitra"`
3. User bisa punya 2 role sekaligus: `"both"`

**Cara Setup Role Manual:**
```
Firebase Console → Firestore
1. Buat collection: userRoles
2. Document ID = UID user
3. Fields:
   - role (string): "mitra" atau "customer"
   - createdAt (timestamp): Auto
```

**Firestore Rules:**
```
match /userRoles/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && request.auth.uid == userId;
}
```

### UI Berdasarkan Role

**Customer Only:**
- Bisa belanja
- Tidak bisa akses /admin
- Menu: Home, Transaksi, Chat, Profile

**Mitra Only:**
- Bisa akses /admin
- Bisa tambah produk
- Bisa lihat pesanan untuk produk mereka
- Menu: Home, Admin, Chat, Profile

**Both:**
- Bisa belanja DAN jualan
- Akses penuh semua fitur

---

## 2. TRACKING PESANAN SETELAH PEMBAYARAN

### Halaman Tracking (`/orders/{orderId}`)

**Fitur:**
- Timeline status pesanan
- Update real-time
- Chat dengan seller
- Detail produk dan ongkir
- Tombol konfirmasi terima
- Tombol komplain

**Status Flow:**
```
Menunggu Pembayaran
    ↓ (setelah bayar)
Sudah Dibayar
    ↓
Dikemas oleh Seller
    ↓
Dikirim (ada nomor resi)
    ↓
Dalam Perjalanan
    ↓
Sampai di Tujuan
    ↓
Diterima Customer
```

**Notifikasi Otomatis:**
- Setiap status berubah → notif popup
- Email ke customer
- Email ke seller (jika ada aksi dari customer)

---

## 3. NOTIFIKASI & EMAIL OTOMATIS

### Sistem Notifikasi

**Di Aplikasi (Real-time):**
```javascript
// Listener di homepage & admin
useEffect(() => {
  const q = query(collection(db, 'orders'), where('customerId', '==', user.uid));
  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'modified') {
        const order = change.doc.data();
        showNotification(`Pesanan ${order.orderId}: ${order.status}`);
      }
    });
  });
}, []);
```

**Via Email (Perlu Setup):**

**Opsi 1: Firebase Extensions - Trigger Email**
1. Firebase Console → Extensions
2. Install "Trigger Email" extension
3. Setup dengan Gmail atau SendGrid
4. Setiap ada perubahan order → kirim email otomatis

**Opsi 2: Cloud Function**
```javascript
// functions/index.js
exports.onOrderStatusChange = functions.firestore
  .document('orders/{orderId}')
  .onUpdate((change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    if (before.status !== after.status) {
      return sendEmail({
        to: after.customerInfo.email,
        subject: `Pesanan ${after.orderId} - ${after.status}`,
        html: `<p>Status pesanan Anda berubah menjadi: <strong>${after.status}</strong></p>`
      });
    }
  });
```

**Opsi 3: Via Backend Sendiri**
- Buat API endpoint `/api/send-email`
- Gunakan Nodemailer atau SendGrid API
- Panggil saat status order berubah

---

## 4. FITUR CHAT DI ADMIN & SUPERADMIN

### Admin Page
- Tambah tab "💬 Chat" di bottom navigation
- Link ke halaman `/chat`
- Tampilkan badge jika ada pesan baru

### SuperAdmin Page  
- Tambah tab "💬 Chat" di bottom navigation
- Bisa chat dengan customer manapun
- Lihat semua conversation

---

## 5. ICON CHAT → LINK LANGSUNG KE /CHAT

### Homepage
```tsx
<Link href="/chat" className="relative p-2 hover:bg-gray-100 rounded-xl transition">
  <svg className="w-6 h-6 text-gray-600" ... />
  {unreadCount > 0 && (
    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
      {unreadCount}
    </span>
  )}
</Link>
```

---

## 6. CARA UBAH ICON CATEGORY

### Sistem Dinamis

**Firestore Structure:**
```
categories (collection)
  └─ elektronik (document ID = category slug)
      ├─ name: "Elektronik"
      ├─ icon: "📱"
      ├─ color: "bg-blue-100"
      └─ order: 1
```

**Admin Panel untuk Category:**
- Tambah/edit/hapus category
- Pilih icon emoji
- Set warna background
- Set urutan tampilan

**Code Implementation:**
```tsx
// Fetch categories dari Firestore
const [categories, setCategories] = useState([]);
useEffect(() => {
  const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
  onSnapshot(q, (snap) => {
    setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}, []);

// Render
{categories.map(cat => (
  <button key={cat.id} onClick={() => setSearchQuery(cat.id)}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${cat.color}`}>
      {cat.icon}
    </div>
    <span className="text-xs">{cat.name}</span>
  </button>
))}
```

### Cara Manual (Tanpa Firestore)

Edit array categories di homepage:
```tsx
// src/app/page.tsx
const categoryIcons = [
  { id: 'elektronik', name: 'Elektronik', icon: '📱', color: 'bg-blue-100' },
  { id: 'fashion', name: 'Fashion', icon: '👕', color: 'bg-pink-100' },
  // ... tambahkan/ubah sesuai kebutuhan
];
```

**Daftar Emoji yang Bisa Dipakai:**
- 📱 Elektronik
- 👕 Fashion  
- 👗 Fashion Wanita
- 👟 Sepatu
- 🍔 Makanan
- 🥤 Minuman
- 💊 Kesehatan
- 💄 Kecantikan
- ⚽ Olahraga
- 📚 Buku
- 🎮 Gaming
- 🏠 Rumah Tangga
- 🚗 Otomotif
- 🎵 Musik
- 📦 Lainnya

---

## IMPLEMENTASI

### Langkah 1: Setup User Roles
1. Buka Firebase Console → Firestore
2. Buat collection: `userRoles`
3. Untuk setiap user, buat document dengan UID mereka
4. Set field `role: "customer"` atau `role: "mitra"`

### Langkah 2: Setup Email Notifications
1. Install Firebase Email Extension
2. Atau buat Cloud Function untuk kirim email
3. Hook ke perubahan status order

### Langkah 3: Update Homepage Chat Icon
- Pastikan icon chat sudah link ke `/chat`
- Tambah badge unread messages

### Langkah 4: Update Category Icons
- Edit array di homepage (manual)
- Atau buat collection `categories` di Firestore (dinamis)

---

## CHECKLIST FITUR

- [ ] Collection `userRoles` dibuat di Firestore
- [ ] Logic role check di halaman login
- [ ] Halaman tracking pesanan dibuat
- [ ] Notifikasi real-time aktif
- [ ] Email notification setup
- [ ] Tab chat di admin
- [ ] Tab chat di superadmin
- [ ] Icon chat link ke `/chat`
- [ ] Category icons bisa diubah
