// Script untuk Setup Categories di Firestore
// Jalankan script ini via Node.js atau browser console

// Cara pakai:
// 1. Install Firebase Admin: npm install firebase-admin
// 2. Download service account key dari Firebase Console
// 3. Jalankan: node setup-categories.js

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Ganti dengan path key Anda

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const categories = [
  { 
    id: 'elektronik', 
    name: 'Elektronik', 
    icon: '📱', 
    color: 'bg-blue-100', 
    order: 1, 
    active: true 
  },
  { 
    id: 'fashion', 
    name: 'Fashion', 
    icon: '👕', 
    color: 'bg-pink-100', 
    order: 2, 
    active: true 
  },
  { 
    id: 'makanan', 
    name: 'Makanan & Minuman', 
    icon: '🍔', 
    color: 'bg-orange-100', 
    order: 3, 
    active: true 
  },
  { 
    id: 'kesehatan', 
    name: 'Kesehatan & Kecantikan', 
    icon: '💊', 
    color: 'bg-green-100', 
    order: 4, 
    active: true 
  },
  { 
    id: 'olahraga', 
    name: 'Olahraga', 
    icon: '⚽', 
    color: 'bg-purple-100', 
    order: 5, 
    active: true 
  },
  { 
    id: 'otomotif', 
    name: 'Otomotif', 
    icon: '🚗', 
    color: 'bg-red-100', 
    order: 6, 
    active: true 
  },
  { 
    id: 'rumah', 
    name: 'Rumah Tangga', 
    icon: '🏠', 
    color: 'bg-yellow-100', 
    order: 7, 
    active: true 
  },
  { 
    id: 'buku', 
    name: 'Buku & Alat Tulis', 
    icon: '📚', 
    color: 'bg-indigo-100', 
    order: 8, 
    active: true 
  },
  { 
    id: 'musik', 
    name: 'Musik & Hiburan', 
    icon: '🎵', 
    color: 'bg-teal-100', 
    order: 9, 
    active: true 
  },
  { 
    id: 'gaming', 
    name: 'Gaming', 
    icon: '🎮', 
    color: 'bg-blue-100', 
    order: 10, 
    active: true 
  },
  { 
    id: 'tanaman', 
    name: 'Tanaman', 
    icon: '🌱', 
    color: 'bg-green-100', 
    order: 11, 
    active: true 
  },
  { 
    id: 'lainnya', 
    name: 'Lainnya', 
    icon: '📦', 
    color: 'bg-gray-100', 
    order: 12, 
    active: true 
  }
];

async function setupCategories() {
  console.log('🚀 Memulai setup categories...\n');

  for (const cat of categories) {
    try {
      await db.collection('categories').doc(cat.id).set({
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        order: cat.order, // Ini akan tersimpan sebagai NUMBER
        active: cat.active,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ ${cat.icon} ${cat.name} (order: ${cat.order})`);
    } catch (error) {
      console.error(`❌ Gagal tambah ${cat.name}:`, error.message);
    }
  }

  console.log('\n✨ Setup categories selesai!');
  process.exit(0);
}

setupCategories();
