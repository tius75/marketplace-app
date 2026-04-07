"use client";
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection, addDoc, onSnapshot, query,
  deleteDoc, doc, updateDoc, serverTimestamp, where, getDoc, getDocs, orderBy
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// --- SUPERADMIN PAGE ---
export default function SuperAdminPage() {
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) { router.push('/login'); }
      else {
        setUser(currentUser);
        getDoc(doc(db, "superadmins", currentUser.uid)).then(docSnap => {
          setIsSuperAdmin(docSnap.exists());
        });
        setLoadingAuth(false);
      }
    });
    return () => unsub();
  }, [router]);

  if (loadingAuth || !user) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div><p className="text-gray-500">Memverifikasi...</p></div></div>;

  if (!isSuperAdmin) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center bg-white p-8 rounded-2xl shadow-sm border max-w-md">
        <p className="text-6xl mb-4">🔒</p>
        <h2 className="font-bold text-xl text-gray-900 mb-2">Akses Ditolak</h2>
        <p className="text-gray-500 mb-4">Halaman ini hanya untuk Super Admin</p>
        <button onClick={() => router.push('/')} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold">Kembali ke Home</button>
      </div>
    </div>
  );

  return (
    <SuperAdminContent user={user} signOut={signOut} />
  );
}

// --- SUPERADMIN CONTENT ---
function SuperAdminContent({ user, signOut }: any) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notification, setNotification] = useState<any>(null);

  const notify = (title: string, body: string) => {
    setNotification({ title, body });
    setTimeout(() => setNotification(null), 3000);
  };

  const tabs = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'products', icon: '📦', label: 'Produk' },
    { id: 'categories', icon: '🏷️', label: 'Kategori' },
    { id: 'home-icons', icon: '🔍', label: 'Ikon Cari' },
    { id: 'orders', icon: '🛒', label: 'Pesanan' },
    { id: 'chat', icon: '💬', label: 'Chat', external: true },
    { id: 'banners', icon: '🖼️', label: 'Banner' },
    { id: 'promos', icon: '🎫', label: 'Promo' },
    { id: 'free-shipping', icon: '🚚', label: 'Ongkir' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {notification && (
        <div className="fixed top-4 right-4 left-4 md:left-auto md:w-96 z-[200] bg-white border border-green-200 shadow-xl rounded-2xl p-4 animate-slide-in">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 flex-shrink-0">✓</div>
            <div className="flex-1"><h4 className="font-bold text-sm text-gray-900">{notification.title}</h4><p className="text-xs text-gray-600">{notification.body}</p></div>
            <button onClick={() => setNotification(null)} className="text-gray-400 text-xl">×</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40 safe-area-top">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-600 hover:text-blue-600 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <div>
              <h1 className="font-bold text-lg text-blue-600">Super Admin</h1>
              <p className="text-xs text-gray-500">{user.displayName}</p>
            </div>
          </div>
          <button onClick={() => signOut(auth)} className="p-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold">🚪</button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-4xl mx-auto">
        {activeTab === 'dashboard' && <DashboardTab notify={notify} />}
        {activeTab === 'products' && <ProductsTab notify={notify} />}
        {activeTab === 'categories' && <CategoriesTab notify={notify} />}
        {activeTab === 'home-icons' && <HomeIconsTab notify={notify} />}
        {activeTab === 'orders' && <OrdersTab notify={notify} />}
        {activeTab === 'banners' && <BannersTab notify={notify} />}
        {activeTab === 'promos' && <PromosTab notify={notify} />}
        {activeTab === 'free-shipping' && <FreeShippingTab notify={notify} />}
      </div>

      {/* Fixed Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 safe-area-bottom">
        <div className="flex justify-around items-center py-2">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => {
              if (tab.external) {
                window.location.href = '/chat';
              } else {
                setActiveTab(tab.id);
              }
            }}
              className={`flex flex-col items-center justify-center px-2 py-1 rounded-lg transition relative min-w-[55px] ${activeTab === tab.id && !tab.external ? 'text-blue-600' : 'text-gray-400'}`}>
              <span className="text-lg mb-0.5">{tab.icon}</span>
              <span className="text-[9px] font-medium">{tab.label}</span>
              {!tab.external && activeTab === tab.id && <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-1 bg-blue-600 rounded-full"></div>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ========== DASHBOARD TAB ==========
function DashboardTab({ notify }: any) {
  const [stats, setStats] = useState({ products: 0, orders: 0, users: 0 });
  const [activeView, setActiveView] = useState<'stats' | 'products' | 'orders' | 'users'>('stats');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    Promise.all([
      getDocs(collection(db, 'products')).then(s => s.size),
      getDocs(collection(db, 'orders')).then(s => s.size),
      getDocs(collection(db, 'users')).then(s => s.size),
    ]).then(([p, o, u]) => setStats({ products: p, orders: o, users: u }));
  };

  useEffect(() => {
    loadStats();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'products'));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setProducts(list);
      setActiveView('products');
    } catch (err: any) {
      alert('Gagal memuat produk: ' + err.message);
    }
    setLoading(false);
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'orders'));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setOrders(list);
      setActiveView('orders');
    } catch (err: any) {
      alert('Gagal memuat pesanan: ' + err.message);
    }
    setLoading(false);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(list);
      setActiveView('users');
    } catch (err: any) {
      alert('Gagal memuat users: ' + err.message);
    }
    setLoading(false);
  };

  const goBack = () => {
    setActiveView('stats');
    setProducts([]);
    setOrders([]);
    setUsers([]);
  };

  // Tampilan Stats Cards
  if (activeView === 'stats') {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={loadProducts}
            className="bg-white p-4 rounded-2xl shadow-sm border text-center hover:border-blue-400 hover:shadow-md transition cursor-pointer group"
          >
            <p className="text-3xl font-black text-blue-600 group-hover:scale-110 transition">{stats.products}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">Produk</p>
            <p className="text-[10px] text-blue-500 mt-1">Klik untuk lihat →</p>
          </button>
          <button
            onClick={loadOrders}
            className="bg-white p-4 rounded-2xl shadow-sm border text-center hover:border-green-400 hover:shadow-md transition cursor-pointer group"
          >
            <p className="text-3xl font-black text-green-600 group-hover:scale-110 transition">{stats.orders}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">Pesanan</p>
            <p className="text-[10px] text-green-500 mt-1">Klik untuk lihat →</p>
          </button>
          <button
            onClick={loadUsers}
            className="bg-white p-4 rounded-2xl shadow-sm border text-center hover:border-purple-400 hover:shadow-md transition cursor-pointer group"
          >
            <p className="text-3xl font-black text-purple-600 group-hover:scale-110 transition">{stats.users}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">User Aktif</p>
            <p className="text-[10px] text-purple-500 mt-1">Klik untuk lihat →</p>
          </button>
        </div>
      </div>
    );
  }

  // Tampilan List Produk
  if (activeView === 'products') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-xl font-bold text-gray-900">Daftar Produk ({products.length})</h2>
        </div>

        {loading ? (
          <div className="text-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div></div>
        ) : (
          <div className="space-y-3">
            {products.map(p => (
              <div key={p.id} className="bg-white p-3 rounded-2xl border flex gap-3 items-center">
                <img src={p.imageUrls?.[0] || p.imageURL || '/placeholder.jpg'} className="w-16 h-16 object-cover rounded-xl bg-gray-50 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-gray-900 truncate">{p.name}</h3>
                  <p className="text-blue-600 font-bold text-xs">Rp {p.price?.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500">{p.category} • Stok: {p.stock}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Tampilan List Pesanan
  if (activeView === 'orders') {
    const statusColor = (s: string) => s === 'Sudah Dibayar' ? 'bg-green-100 text-green-700' : s === 'Dikirim' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700';
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-xl font-bold text-gray-900">Daftar Pesanan ({orders.length})</h2>
        </div>

        {loading ? (
          <div className="text-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div></div>
        ) : (
          <div className="space-y-3">
            {orders.map(o => (
              <div key={o.id} className="bg-white p-4 rounded-2xl border">
                <div className="flex justify-between items-start mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm text-gray-900 truncate">{o.orderId}</h3>
                    <p className="text-xs text-gray-500 truncate">{o.customerInfo?.name}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold flex-shrink-0 ml-2 ${statusColor(o.status)}`}>{o.status}</span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-2 border-t">
                  <span>Total</span><span className="text-blue-600">Rp {o.totalAmount?.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Tampilan List Users
  if (activeView === 'users') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-xl font-bold text-gray-900">User Aktif ({users.length})</h2>
        </div>

        {loading ? (
          <div className="text-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div></div>
        ) : (
          <div className="space-y-3">
            {users.map(u => (
              <div key={u.id} className="bg-white p-3 rounded-2xl border flex gap-3 items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg flex-shrink-0">
                  {u.name?.charAt(0) || u.email?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-gray-900 truncate">{u.name || 'User'}</h3>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  {u.phone && <p className="text-[10px] text-gray-400">📱 {u.phone}</p>}
                </div>
                <div className="flex-shrink-0">
                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">Aktif</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}

// ========== CATEGORIES TAB ==========
function CategoriesTab({ notify }: any) {
  const [categories, setCategories] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editCategory, setEditCategory] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [color, setColor] = useState('bg-gray-100');
  const [order, setOrder] = useState('1');
  const [active, setActive] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'categories'));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => (a.order || 999) - (b.order || 999));
      setCategories(list);
    });
  }, []);

  useEffect(() => {
    if (editCategory) {
      setName(editCategory.name || '');
      setIcon(editCategory.icon || '📦');
      setColor(editCategory.color || 'bg-gray-100');
      setOrder(editCategory.order?.toString() || '1');
      setActive(editCategory.active !== false);
      setShowForm(true);
    }
  }, [editCategory]);

  const resetForm = () => {
    setName(''); setIcon('📦'); setColor('bg-gray-100');
    setOrder('1'); setActive(true); setEditCategory(null);
    setShowForm(false); setShowEmojiPicker(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const data = { name, icon, color, order: parseInt(order), active, updatedAt: serverTimestamp() };
      if (editCategory) {
        await updateDoc(doc(db, 'categories', editCategory.id), data);
        notify('Berhasil', 'Kategori diperbarui!');
      } else {
        await addDoc(collection(db, 'categories'), { ...data, createdAt: serverTimestamp() });
        notify('Berhasil', 'Kategori ditambahkan!');
      }
      resetForm();
    } catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus kategori ini?')) {
      try { await deleteDoc(doc(db, 'categories', id)); notify('Berhasil', 'Kategori dihapus'); }
      catch (err: any) { alert(err.message); }
    }
  };

  const colorOptions = ['bg-blue-100', 'bg-pink-100', 'bg-orange-100', 'bg-green-100', 'bg-purple-100', 'bg-red-100', 'bg-yellow-100', 'bg-indigo-100', 'bg-teal-100', 'bg-gray-100'];
  const popularEmojis = ['📱', '💻', '🖥️', '⌨️', '👕', '👗', '👟', '👜', '🍔', '🍕', '🍜', '☕', '💊', '💄', '⚽', '🏀', '📚', '📖', '🎮', '🎲', '🏠', '🛋️', '🚗', '🏍️', '🎵', '🎸', '🌱', '🌻', '📦', '🎁', '❤️', '⭐', '🔥', '✨', '👍', '✅', '❌', '⚠️'];
  const filteredCategories = categories.filter(cat => cat.name?.toLowerCase().includes(searchQuery.toLowerCase()) || cat.icon?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Kategori</h2>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-bold">{showForm ? 'Batal' : '➕ Tambah'}</button>
      </div>

      <div className="relative">
        <input type="text" placeholder="🔍 Cari kategori..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full p-3 bg-white border rounded-xl outline-none text-gray-900" />
        {searchQuery && (<button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>)}
      </div>

      {showForm && (
        <div className="bg-white p-4 rounded-2xl border">
          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="text" placeholder="Nama Kategori" className="w-full p-3 bg-gray-50 rounded-xl outline-none text-gray-900" value={name} onChange={(e) => setName(e.target.value)} required />
            
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Pilih Icon Emoji</label>
              <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-dashed hover:border-blue-400 transition flex items-center justify-center gap-2">
                <span className="text-3xl">{icon}</span>
                <span className="text-sm text-gray-500">Klik untuk pilih emoji</span>
              </button>
              
              {showEmojiPicker && (
                <div className="mt-3 p-3 bg-white border rounded-xl">
                  <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto">
                    {popularEmojis.map((emoji) => (
                      <button key={emoji} type="button" onClick={() => { setIcon(emoji); setShowEmojiPicker(false); }} className={`text-2xl p-2 rounded hover:bg-gray-100 transition ${icon === emoji ? 'bg-blue-100 ring-2 ring-blue-400' : ''}`}>{emoji}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Urutan</label>
                <input type="number" placeholder="1" className="w-full p-3 bg-gray-50 rounded-xl outline-none text-gray-900" value={order} onChange={(e) => setOrder(e.target.value)} min="1" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Preview</label>
                <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-2">
                  <span className="text-2xl">{icon}</span>
                  <span className="text-sm">{name || 'Nama Kategori'}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-2 block">Warna Background</label>
              <div className="grid grid-cols-5 gap-2">
                {colorOptions.map((c) => (
                  <button key={c} type="button" onClick={() => setColor(c)} className={`h-10 rounded-xl ${c} border-2 ${color === c ? 'border-blue-600' : 'border-transparent'}`} />
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="w-4 h-4" />
              <span className="text-sm text-gray-900">Aktif</span>
            </label>

            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl disabled:bg-gray-300 text-sm">{loading ? 'Proses...' : editCategory ? 'Update' : 'Simpan'}</button>
              <button type="button" onClick={resetForm} className="px-4 bg-gray-100 rounded-xl font-bold text-sm">Batal</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed">
            <p className="text-6xl mb-4">🏷️</p>
            <p className="text-gray-500 font-bold mb-2">{searchQuery ? 'Tidak ditemukan' : 'Belum ada kategori'}</p>
            <p className="text-gray-400 text-sm">{searchQuery ? 'Coba kata kunci lain' : 'Klik "➕ Tambah" untuk membuat'}</p>
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <div key={cat.id} className="bg-white p-3 rounded-2xl border flex gap-3 items-center">
              <div className={`w-14 h-14 rounded-xl ${cat.color || 'bg-gray-100'} flex items-center justify-center text-2xl flex-shrink-0`}>{cat.icon || '📦'}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-gray-900 truncate">{cat.name}</h3>
                <p className="text-[10px] text-gray-500">Urutan: {cat.order || '-'} • {cat.active ? '✅ Aktif' : '❌ Nonaktif'}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => setEditCategory(cat)} className="p-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">✏️</button>
                <button onClick={() => handleDelete(cat.id)} className="p-2 bg-red-50 text-red-500 rounded-lg text-xs font-bold">🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ========== PRODUCTS TAB ==========
function ProductsTab({ notify }: any) {
  const [products, setProducts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    const q = query(collection(db, 'products'));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setProducts(list);
    });
  }, []);

  useEffect(() => {
    if (editData) {
      setName(editData.name); setPrice(editData.price.toString());
      setStock(editData.stock.toString()); setCategory(editData.category); setShowForm(true);
    }
  }, [editData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const data = { name, price: parseInt(price), stock: parseInt(stock), category, ownerId: user?.uid, updatedAt: serverTimestamp() };
      if (editData) {
        await updateDoc(doc(db, 'products', editData.id), data);
        notify('Berhasil', 'Produk diperbarui!');
      } else {
        await addDoc(collection(db, 'products'), { ...data, createdAt: serverTimestamp() });
        notify('Berhasil', 'Produk ditambahkan!');
      }
      resetForm();
    } catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };

  const resetForm = () => { setName(''); setPrice(''); setStock(''); setCategory(''); setEditData(null); setShowForm(false); };
  const handleDelete = async (id: string) => { if (confirm('Hapus produk?')) { await deleteDoc(doc(db, 'products', id)); notify('Berhasil', 'Produk dihapus'); } };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h2 className="text-xl font-bold text-gray-900">Produk</h2><button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-bold">{showForm ? 'Batal' : '➕ Tambah'}</button></div>

      {showForm && (
        <div className="bg-white p-4 rounded-2xl border">
          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="text" placeholder="Nama Produk" className="w-full p-3 bg-gray-50 rounded-xl outline-none text-gray-900" value={name} onChange={(e) => setName(e.target.value)} required />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder="Harga" className="w-full p-3 bg-gray-50 rounded-xl outline-none text-gray-900" value={price} onChange={(e) => setPrice(e.target.value)} required />
              <input type="number" placeholder="Stok" className="w-full p-3 bg-gray-50 rounded-xl outline-none text-gray-900" value={stock} onChange={(e) => setStock(e.target.value)} required />
            </div>
            <input type="text" placeholder="Kategori" className="w-full p-3 bg-gray-50 rounded-xl outline-none text-gray-900" value={category} onChange={(e) => setCategory(e.target.value)} />
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl disabled:bg-gray-300 text-sm">{loading ? 'Proses...' : 'Simpan'}</button>
              <button type="button" onClick={resetForm} className="px-4 bg-gray-100 rounded-xl font-bold text-sm">Batal</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {products.map(p => (
          <div key={p.id} className="bg-white p-3 rounded-2xl border flex gap-3 items-center">
            <img src={p.imageUrls?.[0] || p.imageURL || '/placeholder.jpg'} className="w-16 h-16 object-cover rounded-xl bg-gray-50 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-gray-900 truncate">{p.name}</h3>
              <p className="text-blue-600 font-bold text-xs">Rp {p.price.toLocaleString()}</p>
              <p className="text-[10px] text-gray-500">{p.category} • Stok: {p.stock}</p>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => setEditData(p)} className="p-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">Edit</button>
              <button onClick={() => handleDelete(p.id)} className="p-2 bg-red-50 text-red-500 rounded-lg text-xs font-bold">🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ========== ORDERS TAB ==========
function OrdersTab({ notify }: any) {
  const [orders, setOrders] = useState<any[]>([]);
  useEffect(() => {
    const q = query(collection(db, 'orders'));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setOrders(list);
    });
  }, []);

  const updateStatus = async (id: string, status: string) => { await updateDoc(doc(db, 'orders', id), { status }); notify('Berhasil', `Status diperbarui ke ${status}`); };
  const deleteOrder = async (id: string) => { if (confirm('Hapus pesanan?')) { await deleteDoc(doc(db, 'orders', id)); notify('Berhasil', 'Pesanan dihapus'); } };
  const statusColor = (s: string) => s === 'Sudah Dibayar' ? 'bg-green-100 text-green-700' : s === 'Dikirim' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700';

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Pesanan</h2>
      <div className="space-y-3">
        {orders.map(o => (
          <div key={o.id} className="bg-white p-4 rounded-2xl border">
            <div className="flex justify-between items-start mb-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-sm text-gray-900 truncate">{o.orderId}</h3>
                <p className="text-xs text-gray-500 truncate">{o.customerInfo?.name}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold flex-shrink-0 ml-2 ${statusColor(o.status)}`}>{o.status}</span>
            </div>
            <div className="flex justify-between font-bold text-sm pt-2 border-t">
              <span>Total</span><span className="text-blue-600">Rp {o.totalAmount?.toLocaleString()}</span>
            </div>
            <div className="flex gap-2 mt-3">
              <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} className="flex-1 px-3 py-2 bg-gray-50 rounded-xl text-xs font-bold text-gray-900">
                <option value="Menunggu">Menunggu</option><option value="Sudah Dibayar">Sudah Dibayar</option><option value="Dikemas">Dikemas</option><option value="Dikirim">Dikirim</option><option value="Selesai">Selesai</option><option value="Dibatalkan">Dibatalkan</option>
              </select>
              <button onClick={() => deleteOrder(o.id)} className="px-3 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold">Hapus</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ========== BANNERS TAB ==========
function BannersTab({ notify }: any) {
  const [banners, setBanners] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editBanner, setEditBanner] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(''); const [subtitle, setSubtitle] = useState('');
  const [emoji, setEmoji] = useState('🎉'); const [gradientFrom, setGradientFrom] = useState('from-blue-600');
  const [gradientTo, setGradientTo] = useState('to-blue-500'); const [priority, setPriority] = useState('1');
  const [startDate, setStartDate] = useState(''); const [endDate, setEndDate] = useState('');

  useEffect(() => { const q = query(collection(db, "banners")); return onSnapshot(q, (snap) => { const list = snap.docs.map(d => ({ id: d.id, ...d.data() })); list.sort((a: any, b: any) => (a.priority || 999) - (b.priority || 999)); setBanners(list); }, () => {}); }, []);

  const resetForm = () => { setTitle(''); setSubtitle(''); setEmoji('🎉'); setGradientFrom('from-blue-600'); setGradientTo('to-blue-500'); setPriority('1'); setStartDate(''); setEndDate(''); setEditBanner(null); setShowForm(false); };
  const handleEdit = (b: any) => { setEditBanner(b); setTitle(b.title); setSubtitle(b.subtitle); setEmoji(b.emoji || '🎉'); setGradientFrom(b.gradientFrom || 'from-blue-600'); setGradientTo(b.gradientTo || 'to-blue-500'); setPriority(b.priority?.toString() || '1'); setStartDate(b.startDate ? new Date(b.startDate.toDate()).toISOString().split('T')[0] : ''); setEndDate(b.endDate ? new Date(b.endDate.toDate()).toISOString().split('T')[0] : ''); setShowForm(true); };
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setLoading(true); try { const data = { title, subtitle, emoji, gradientFrom, gradientTo, priority: parseInt(priority), startDate: startDate ? new Date(startDate) : new Date(), endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), active: true, updatedAt: serverTimestamp() }; if (editBanner) { await updateDoc(doc(db, "banners", editBanner.id), data); notify('Berhasil', 'Banner diperbarui!'); } else { await addDoc(collection(db, "banners"), { ...data, createdAt: serverTimestamp() }); notify('Berhasil', 'Banner ditambahkan!'); } resetForm(); } catch (err: any) { alert(err.message); } finally { setLoading(false); } };
  const toggleActive = async (b: any) => { try { await updateDoc(doc(db, "banners", b.id), { active: !b.active }); } catch (err: any) { alert(err.message); } };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h2 className="text-xl font-bold text-gray-900">Banner</h2><button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-bold">{showForm ? 'Batal' : '➕ Tambah'}</button></div>
      {showForm && (
        <div className="bg-white p-4 rounded-2xl border">
          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="text" placeholder="Judul" className="w-full p-3 bg-gray-50 rounded-xl outline-none text-gray-900" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <input type="text" placeholder="Deskripsi" className="w-full p-3 bg-gray-50 rounded-xl outline-none text-gray-900" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} required />
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Emoji" className="w-full p-3 bg-gray-50 rounded-xl outline-none text-gray-900" value={emoji} onChange={(e) => setEmoji(e.target.value)} />
              <input type="number" placeholder="Prioritas" className="w-full p-3 bg-gray-50 rounded-xl outline-none text-gray-900" value={priority} onChange={(e) => setPriority(e.target.value)} min="1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] text-gray-500 mb-1 block">Mulai</label><input type="date" className="w-full p-2 bg-gray-50 rounded-xl outline-none text-xs text-gray-900" value={startDate} onChange={(e) => setStartDate(e.target.value)} required /></div>
              <div><label className="text-[10px] text-gray-500 mb-1 block">Selesai</label><input type="date" className="w-full p-2 bg-gray-50 rounded-xl outline-none text-xs text-gray-900" value={endDate} onChange={(e) => setEndDate(e.target.value)} required /></div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl disabled:bg-gray-300 text-sm">{loading ? "Proses..." : "Simpan"}</button>
              <button type="button" onClick={resetForm} className="px-4 bg-gray-100 rounded-xl font-bold text-sm">Batal</button>
            </div>
          </form>
        </div>
      )}
      <div className="space-y-3">
        {banners.map((b) => (
          <div key={b.id} className="bg-white p-3 rounded-2xl border flex gap-3 items-center">
            <div className={`w-20 h-14 rounded-xl bg-gradient-to-r ${b.gradientFrom || 'from-blue-600'} ${b.gradientTo || 'to-blue-500'} flex items-center justify-center text-white text-xs flex-shrink-0`}>{b.emoji}</div>
            <div className="flex-1 min-w-0"><h3 className="font-bold text-xs text-gray-900 truncate">{b.title}</h3><p className="text-[10px] text-gray-500">{b.active ? '✅ Aktif' : '❌ Nonaktif'}</p></div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => toggleActive(b)} className="p-2 bg-green-50 text-green-600 rounded-lg text-[10px] font-bold">{b.active ? 'Off' : 'On'}</button>
              <button onClick={() => handleEdit(b)} className="p-2 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold">Edit</button>
              <button onClick={() => confirm("Hapus?") && deleteDoc(doc(db, "banners", b.id))} className="p-2 bg-red-50 text-red-500 rounded-lg text-[10px] font-bold">🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ========== PROMOS TAB ==========
function PromosTab({ notify }: any) {
  const [promos, setPromos] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState(''); const [name, setName] = useState('');
  const [type, setType] = useState('discount'); const [discountPercent, setDiscountPercent] = useState('10');
  const [maxDiscount, setMaxDiscount] = useState(''); const [minPurchase, setMinPurchase] = useState('');
  const [startDate, setStartDate] = useState(''); const [endDate, setEndDate] = useState('');

  useEffect(() => { const q = query(collection(db, "promos")); return onSnapshot(q, (snap) => { const list = snap.docs.map(d => ({ id: d.id, ...d.data() })); list.sort((a: any, b: any) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)); setPromos(list); }, () => {}); }, []);

  const resetForm = () => { setCode(''); setName(''); setType('discount'); setDiscountPercent('10'); setMaxDiscount(''); setMinPurchase(''); setStartDate(''); setEndDate(''); setShowForm(false); };
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setLoading(true); try { await addDoc(collection(db, "promos"), { code: code.toUpperCase(), name, type, discountPercent: parseInt(discountPercent), maxDiscount: maxDiscount ? parseInt(maxDiscount) : null, minPurchase: minPurchase ? parseInt(minPurchase) : null, startDate: startDate ? new Date(startDate) : new Date(), endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), active: true, createdAt: serverTimestamp() }); notify('Berhasil', 'Promo ditambahkan!'); resetForm(); } catch (err: any) { alert(err.message); } finally { setLoading(false); } };
  const toggleActive = async (id: string, active: boolean) => { try { await updateDoc(doc(db, "promos", id), { active: !active }); notify('Berhasil', 'Status promo diperbarui'); } catch (err: any) { alert(err.message); } };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h2 className="text-xl font-bold text-gray-900">Promo</h2><button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-bold">{showForm ? 'Batal' : '➕ Tambah'}</button></div>
      {showForm && (
        <div className="bg-white p-4 rounded-2xl border">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Kode" className="w-full p-3 bg-gray-50 rounded-xl outline-none text-gray-900 uppercase" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required />
              <input type="text" placeholder="Nama" className="w-full p-3 bg-gray-50 rounded-xl outline-none text-gray-900" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <select className="w-full p-3 bg-gray-50 rounded-xl outline-none text-gray-900" value={type} onChange={(e) => setType(e.target.value)}><option value="discount">Diskon (%)</option><option value="free_shipping">Gratis Ongkir</option></select>
            {type === 'discount' && <input type="number" placeholder="Diskon (%)" className="w-full p-3 bg-gray-50 rounded-xl outline-none text-gray-900" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} min="1" max="100" />}
            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder="Maks Diskon" className="w-full p-3 bg-gray-50 rounded-xl outline-none text-gray-900" value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} />
              <input type="number" placeholder="Min Belanja" className="w-full p-3 bg-gray-50 rounded-xl outline-none text-gray-900" value={minPurchase} onChange={(e) => setMinPurchase(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] text-gray-500">Mulai</label><input type="date" className="w-full p-2 bg-gray-50 rounded-xl outline-none text-xs" value={startDate} onChange={(e) => setStartDate(e.target.value)} required /></div>
              <div><label className="text-[10px] text-gray-500">Selesai</label><input type="date" className="w-full p-2 bg-gray-50 rounded-xl outline-none text-xs" value={endDate} onChange={(e) => setEndDate(e.target.value)} required /></div>
            </div>
            <div className="flex gap-2"><button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl disabled:bg-gray-300 text-sm">{loading ? "Proses..." : "Simpan"}</button><button type="button" onClick={resetForm} className="px-4 bg-gray-100 rounded-xl font-bold text-sm">Batal</button></div>
          </form>
        </div>
      )}
      <div className="space-y-3">
        {promos.map((p) => (
          <div key={p.id} className="bg-white p-3 rounded-2xl border flex gap-3 items-center">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${p.active ? 'bg-green-50' : 'bg-gray-100'}`}>{p.type === 'free_shipping' ? '🚚' : '💰'}</div>
            <div className="flex-1 min-w-0"><h3 className="font-bold text-xs truncate">{p.name}</h3><p className="text-[10px] font-mono bg-gray-100 px-2 py-0.5 rounded inline-block mt-1">{p.code}</p></div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => toggleActive(p.id, p.active)} className="p-2 bg-green-50 text-green-600 rounded-lg text-[10px] font-bold">{p.active ? 'Off' : 'On'}</button>
              <button onClick={() => { if(confirm("Hapus?")) { deleteDoc(doc(db, "promos", p.id)); notify('Berhasil', 'Promo dihapus'); } }} className="p-2 bg-red-50 text-red-500 rounded-lg text-[10px] font-bold">🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ========== FREE SHIPPING TAB ==========
function FreeShippingTab({ notify }: any) {
  const [promos, setPromos] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('Gratis Ongkir');
  const [minPurchase, setMinPurchase] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const q = query(collection(db, "promos"), where("type", "==", "free_shipping"));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setPromos(list);
    }, () => {});
  }, []);

  const resetForm = () => { setCode(''); setName('Gratis Ongkir'); setMinPurchase(''); setMaxDiscount(''); setStartDate(''); setEndDate(''); setShowForm(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const promoCode = code.toUpperCase() || `FREEONGKIR${Math.floor(Math.random() * 1000)}`;
      await addDoc(collection(db, "promos"), { code: promoCode, name: name || 'Gratis Ongkir', type: 'free_shipping', discountPercent: 0, maxDiscount: maxDiscount ? parseInt(maxDiscount) : null, minPurchase: minPurchase ? parseInt(minPurchase) : null, startDate: startDate ? new Date(startDate) : new Date(), endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), active: true, createdAt: serverTimestamp() });
      notify('Berhasil', 'Promo gratis ongkir ditambahkan!'); resetForm();
    } catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };

  const toggleActive = async (id: string, active: boolean) => { try { await updateDoc(doc(db, "promos", id), { active: !active }); notify('Berhasil', 'Status diperbarui'); } catch (err: any) { alert(err.message); } };
  const deletePromo = async (id: string) => { if (confirm('Hapus promo ini?')) { await deleteDoc(doc(db, "promos", id)); notify('Berhasil', 'Promo dihapus'); } };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Gratis Ongkir</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-bold">{showForm ? 'Batal' : '➕ Tambah'}</button>
      </div>

      {showForm && (
        <div className="bg-white p-4 rounded-2xl border">
          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="text" placeholder="Nama Promo" className="w-full p-3 bg-gray-50 rounded-xl outline-none text-gray-900" value={name} onChange={(e) => setName(e.target.value)} />
            <input type="text" placeholder="Kode Promo (kosongkan untuk auto)" className="w-full p-3 bg-gray-50 rounded-xl outline-none text-gray-900 uppercase" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-500 mb-1 block">Min. Belanja</label><input type="number" placeholder="50000" className="w-full p-3 bg-gray-50 rounded-xl outline-none text-gray-900" value={minPurchase} onChange={(e) => setMinPurchase(e.target.value)} /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Maks. Diskon</label><input type="number" placeholder="20000" className="w-full p-3 bg-gray-50 rounded-xl outline-none text-gray-900" value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-500 mb-1 block">Mulai</label><input type="date" className="w-full p-2 bg-gray-50 rounded-xl outline-none text-xs" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Selesai</label><input type="date" className="w-full p-2 bg-gray-50 rounded-xl outline-none text-xs" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
            </div>
            <div className="flex gap-2"><button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl disabled:bg-gray-300 text-sm">{loading ? "Proses..." : "Simpan"}</button><button type="button" onClick={resetForm} className="px-4 bg-gray-100 rounded-xl font-bold text-sm">Batal</button></div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {promos.map((p) => (
          <div key={p.id} className="bg-white p-3 rounded-2xl border flex justify-between items-center">
            <div>
              <h4 className="font-bold text-sm">{p.name}</h4>
              <p className="text-xs text-gray-500">Kode: <span className="font-mono">{p.code}</span></p>
              <p className="text-[10px] text-gray-400 mt-1">{p.active ? '✅ Aktif' : '❌ Nonaktif'}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => toggleActive(p.id, p.active)} className={`px-3 py-2 rounded-xl text-xs font-bold ${p.active ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{p.active ? 'Off' : 'On'}</button>
              <button onClick={() => deletePromo(p.id)} className="p-2 bg-red-50 text-red-500 rounded-xl text-xs font-bold">🗑️</button>
            </div>
          </div>
        ))}
        {promos.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed">
            <p className="text-6xl mb-4">🚚</p>
            <p className="text-gray-500 font-bold mb-2">Belum ada promo gratis ongkir</p>
            <p className="text-gray-400 text-sm">Klik tombol "➕ Tambah" untuk membuat</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ========== HOME ICONS TAB (Untuk Homepage Search Icons) ==========
function HomeIconsTab({ notify }: any) {
  const [homeIcons, setHomeIcons] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editIcon, setEditIcon] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📱');
  const [color, setColor] = useState('bg-blue-100');
  const [order, setOrder] = useState('1');
  const [active, setActive] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'homeIcons'), orderBy('order', 'asc'));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => (a.order || 999) - (b.order || 999));
      setHomeIcons(list);
    });
  }, []);

  useEffect(() => {
    if (editIcon) {
      setName(editIcon.name || '');
      setEmoji(editIcon.emoji || '📱');
      setColor(editIcon.color || 'bg-blue-100');
      setOrder(editIcon.order?.toString() || '1');
      setActive(editIcon.active !== false);
      setShowForm(true);
    }
  }, [editIcon]);

  const resetForm = () => {
    setName(''); setEmoji('📱'); setColor('bg-blue-100');
    setOrder('1'); setActive(true); setEditIcon(null);
    setShowForm(false); setShowEmojiPicker(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const data = { name, emoji, color, order: parseInt(order), active, updatedAt: serverTimestamp() };
      if (editIcon) {
        await updateDoc(doc(db, 'homeIcons', editIcon.id), data);
        notify('Berhasil', 'Ikon pencarian diperbarui!');
      } else {
        await addDoc(collection(db, 'homeIcons'), { ...data, createdAt: serverTimestamp() });
        notify('Berhasil', 'Ikon pencarian ditambahkan!');
      }
      resetForm();
    } catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus ikon pencarian ini?')) {
      try { await deleteDoc(doc(db, 'homeIcons', id)); notify('Berhasil', 'Ikon dihapus'); }
      catch (err: any) { alert(err.message); }
    }
  };

  const colorOptions = ['bg-blue-100', 'bg-pink-100', 'bg-orange-100', 'bg-green-100', 'bg-purple-100', 'bg-red-100', 'bg-yellow-100', 'bg-indigo-100', 'bg-teal-100', 'bg-gray-100'];
  const popularEmojis = ['📱', '💻', '👕', '👗', '👟', '🍔', '🍕', '☕', '💊', '💄', '⚽', '🏀', '📚', '🎮', '🏠', '🚗', '🎵', '🌱', '📦', '🎁', '❤️', '⭐', '🔥', '✨', '👍', '✅', '❌', '⚠️', '🎯', '💼', '🎨', '🏋️'];
  const filteredIcons = homeIcons.filter(icon => icon.name?.toLowerCase().includes(searchQuery.toLowerCase()) || icon.emoji?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Ikon Pencarian Homepage</h2>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-bold">{showForm ? 'Batal' : '➕ Tambah'}</button>
      </div>

      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
        <h3 className="font-bold text-sm text-blue-900 mb-2">ℹ️ Info</h3>
        <p className="text-xs text-blue-800">Ikon ini akan muncul di halaman utama sebagai tombol pencarian cepat. Klik ikon akan memfilter produk berdasarkan nama kategori.</p>
      </div>

      <div className="relative">
        <input type="text" placeholder="🔍 Cari ikon..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full p-3 bg-white border rounded-xl outline-none text-gray-900" />
        {searchQuery && (<button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>)}
      </div>

      {showForm && (
        <div className="bg-white p-4 rounded-2xl border">
          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="text" placeholder="Nama Kategori (contoh: Elektronik)" className="w-full p-3 bg-gray-50 rounded-xl outline-none text-gray-900" value={name} onChange={(e) => setName(e.target.value)} required />
            
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Pilih Emoji</label>
              <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-dashed hover:border-blue-400 transition flex items-center justify-center gap-2">
                <span className="text-3xl">{emoji}</span>
                <span className="text-sm text-gray-500">Klik untuk pilih emoji</span>
              </button>
              
              {showEmojiPicker && (
                <div className="mt-3 p-3 bg-white border rounded-xl">
                  <div className="grid grid-cols-8 gap-2 max-h-40 overflow-y-auto">
                    {popularEmojis.map((em) => (
                      <button key={em} type="button" onClick={() => { setEmoji(em); setShowEmojiPicker(false); }} className={`text-2xl p-2 rounded hover:bg-gray-100 transition ${emoji === em ? 'bg-blue-100 ring-2 ring-blue-400' : ''}`}>{em}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Urutan</label>
                <input type="number" placeholder="1" className="w-full p-3 bg-gray-50 rounded-xl outline-none text-gray-900" value={order} onChange={(e) => setOrder(e.target.value)} min="1" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Preview</label>
                <div className={`p-3 ${color} rounded-xl flex items-center gap-2`}>
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-sm">{name || 'Nama Kategori'}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-2 block">Warna Background</label>
              <div className="grid grid-cols-5 gap-2">
                {colorOptions.map((c) => (
                  <button key={c} type="button" onClick={() => setColor(c)} className={`h-10 rounded-xl ${c} border-2 ${color === c ? 'border-blue-600' : 'border-transparent'}`} />
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="w-4 h-4" />
              <span className="text-sm text-gray-900">Aktif</span>
            </label>

            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl disabled:bg-gray-300 text-sm">{loading ? 'Proses...' : editIcon ? 'Update' : 'Simpan'}</button>
              <button type="button" onClick={resetForm} className="px-4 bg-gray-100 rounded-xl font-bold text-sm">Batal</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {filteredIcons.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed">
            <p className="text-6xl mb-4">🔍</p>
            <p className="text-gray-500 font-bold mb-2">{searchQuery ? 'Tidak ditemukan' : 'Belum ada ikon pencarian'}</p>
            <p className="text-gray-400 text-sm">{searchQuery ? 'Coba kata kunci lain' : 'Klik "➕ Tambah" untuk membuat'}</p>
          </div>
        ) : (
          filteredIcons.map((icon) => (
            <div key={icon.id} className="bg-white p-3 rounded-2xl border flex gap-3 items-center">
              <div className={`w-14 h-14 rounded-xl ${icon.color || 'bg-gray-100'} flex items-center justify-center text-2xl flex-shrink-0`}>{icon.emoji || '📱'}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-gray-900 truncate">{icon.name}</h3>
                <p className="text-[10px] text-gray-500">Urutan: {icon.order || '-'} • {icon.active ? '✅ Aktif' : '❌ Nonaktif'}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => setEditIcon(icon)} className="p-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">✏️</button>
                <button onClick={() => handleDelete(icon.id)} className="p-2 bg-red-50 text-red-500 rounded-lg text-xs font-bold">🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
