"use client";
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection, addDoc, onSnapshot, query,
  deleteDoc, doc, updateDoc, serverTimestamp, where, getDoc
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';

// --- NOTIFICATION POPUP ---
const NotificationPopup = ({ notification, onClose }: any) => {
  if (!notification) return null;
  return (
    <div className="fixed top-20 right-4 left-4 md:left-auto md:w-96 z-[200] bg-white border border-green-200 shadow-xl rounded-2xl p-4 animate-slide-in">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 flex-shrink-0">✓</div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-gray-800">{notification.title}</h4>
          <p className="text-xs text-gray-600 truncate">{notification.body}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl flex-shrink-0">×</button>
      </div>
    </div>
  );
};

// --- PRODUCT FORM ---
const ProductForm = ({ editData, setEditData, categories, userId }: any) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<any>(null);

  useEffect(() => {
    if (editData) {
      setName(editData.name); setPrice(editData.price.toString());
      setStock(editData.stock?.toString() || '0'); setCategory(editData.category || '');
    } else { setName(''); setPrice(''); setStock(''); setCategory(''); }
  }, [editData]);

  useEffect(() => { if (notification) { const t = setTimeout(() => setNotification(null), 3000); return () => clearTimeout(t); } }, [notification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      let imageUrls = editData?.imageUrls || (editData?.imageURL ? [editData.imageURL] : []);
      let videoUrl = editData?.videoUrl || "";
      
      // Upload new images
      if (images.length > 0) {
        const uploadPromises = images.map(async (image) => {
          const formData = new FormData();
          formData.append("file", image);
          const res = await fetch("/api/upload", { method: "POST", body: formData });
          const uploadData = await res.json();
          return uploadData.url;
        });
        const newUrls = await Promise.all(uploadPromises);
        imageUrls = [...imageUrls, ...newUrls];
      }

      // Upload new video
      if (video) {
        const formData = new FormData();
        formData.append("file", video);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadData = await res.json();
        videoUrl = uploadData.url;
      }

      const finalCategory = newCategory.trim() !== '' ? newCategory.trim() : category;
      const productData = {
        name,
        price: parseInt(price),
        stock: parseInt(stock),
        category: finalCategory || "Umum",
        imageUrls,
        imageURL: imageUrls[0] || "", // Backward compatibility
        videoUrl,
        ownerId: userId,
        updatedAt: serverTimestamp()
      };
      
      if (editData) {
        await updateDoc(doc(db, "products", editData.id), productData);
        setNotification({ title: "Berhasil", body: "Produk diperbarui!" });
      } else {
        await addDoc(collection(db, "products"), { ...productData, createdAt: serverTimestamp() });
        setNotification({ title: "Berhasil", body: "Produk ditambahkan!" });
      }
      setEditData(null); setName(''); setPrice(''); setStock(''); setCategory(''); setNewCategory(''); setImages([]); setVideo(null);
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="relative">
      <NotificationPopup notification={notification} onClose={() => setNotification(null)} />
      <div className="bg-white p-4 rounded-2xl shadow-sm border">
        <h2 className="text-lg font-bold mb-4">{editData ? "📦 Edit Produk" : "✨ Produk Baru"}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="text" placeholder="Nama Produk" className="w-full p-3 bg-gray-50 rounded-xl outline-none text-gray-900" value={name} onChange={(e) => setName(e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="Harga" className="w-full p-3 bg-gray-50 rounded-xl outline-none text-gray-900" value={price} onChange={(e) => setPrice(e.target.value)} required />
            <input type="number" placeholder="Stok" className="w-full p-3 bg-gray-50 rounded-xl outline-none text-gray-900" value={stock} onChange={(e) => setStock(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select className="w-full p-3 bg-gray-50 rounded-xl outline-none text-gray-900" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Kategori</option>
              {categories?.map((cat: any) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <input type="text" placeholder="Kategori baru" className="w-full p-3 bg-blue-50 border border-blue-100 rounded-xl outline-none" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
          </div>
          
          {/* Multiple Images Upload */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Gambar (Maks 4)</label>
            <input type="file" accept="image/*" multiple className="w-full p-3 border-2 border-dashed rounded-xl text-sm" onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length > 4) {
                alert('Maksimal 4 gambar');
                return;
              }
              setImages(files);
            }} />
            {images.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {images.map((img, idx) => (
                  <img key={idx} src={URL.createObjectURL(img)} className="w-16 h-16 object-cover rounded" />
                ))}
              </div>
            )}
          </div>

          {/* Video Upload */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Video (Maks 1)</label>
            <input type="file" accept="video/*" className="w-full p-3 border-2 border-dashed rounded-xl text-sm" onChange={(e) => setVideo(e.target.files?.[0] || null)} />
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl disabled:bg-gray-300">{loading ? "Proses..." : "Simpan"}</button>
            {editData && <button type="button" onClick={() => setEditData(null)} className="px-4 bg-gray-100 rounded-xl font-bold">Batal</button>}
          </div>
        </form>
      </div>
    </div>
  );
};

// --- PRODUCT LIST ---
const ProductList = ({ onEdit, userId }: any) => {
  const [products, setProducts] = useState<any[]>([]);
  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, "products"), where("ownerId", "==", userId));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a: any, b: any) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setProducts(list);
    });
  }, [userId]);

  const handleDelete = async (id: string) => { if (confirm("Hapus produk?")) { try { await deleteDoc(doc(db, "products", id)); } catch (err: any) { alert(err.message); } } };

  return (
    <div className="grid grid-cols-1 gap-3">
      {products.map((p) => (
        <div key={p.id} className="bg-white p-3 rounded-2xl border flex gap-3 items-center">
          <img src={p.imageURL} className="w-16 h-16 object-cover rounded-xl bg-gray-50 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm truncate">{p.name}</h3>
            <p className="text-blue-600 font-bold text-xs">Rp {p.price.toLocaleString()}</p>
            <p className="text-[10px] text-gray-400">{p.category} • Stok: {p.stock}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => onEdit(p)} className="p-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">Edit</button>
            <button onClick={() => handleDelete(p.id)} className="p-2 bg-red-50 text-red-500 rounded-lg text-xs font-bold">Hapus</button>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- ORDERS ---
const OrdersManagement = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const q = query(collection(db, "orders"));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setOrders(list); setLoading(false);
    }, () => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: string) => { try { await updateDoc(doc(db, "orders", id), { status }); } catch (err: any) { alert(err.message); } };
  const deleteOrder = async (id: string) => { if (confirm("Hapus pesanan?")) { try { await deleteDoc(doc(db, "orders", id)); } catch (err: any) { alert(err.message); } } };
  const statusColor = (s: string) => s === 'Sudah Dibayar' ? 'bg-green-100 text-green-700' : s === 'Dikirim' ? 'bg-blue-100 text-blue-700' : s === 'Selesai' ? 'bg-purple-100 text-purple-700' : s === 'Dibatalkan' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700';

  if (loading) return <div className="text-center py-10 text-gray-500">Memuat...</div>;
  if (orders.length === 0) return <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed"><p className="text-gray-400">Belum ada pesanan</p></div>;

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div key={order.id} className="bg-white p-4 rounded-2xl border">
          <div className="flex justify-between items-start mb-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm truncate">{order.orderId}</h3>
              <p className="text-xs text-gray-500 truncate">{order.customerInfo?.name}</p>
            </div>
            <span className={`px-2 py-1 rounded-full text-[10px] font-bold flex-shrink-0 ml-2 ${statusColor(order.status)}`}>{order.status}</span>
          </div>
          <div className="bg-gray-50 p-3 rounded-xl mb-3">
            <div className="flex justify-between font-bold text-sm pt-2 border-t">
              <span>Total</span><span className="text-blue-600">Rp {order.totalAmount?.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)} className="flex-1 px-3 py-2 bg-gray-50 rounded-xl text-xs font-bold">
              <option value="Menunggu">Menunggu</option><option value="Sudah Dibayar">Sudah Dibayar</option><option value="Dikemas">Dikemas</option><option value="Dikirim">Dikirim</option><option value="Selesai">Selesai</option><option value="Dibatalkan">Dibatalkan</option>
            </select>
            <button onClick={() => deleteOrder(order.id)} className="px-3 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold">Hapus</button>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- BANNERS (Owner Only) ---
const BannerManagement = () => {
  const [banners, setBanners] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editBanner, setEditBanner] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(''); const [subtitle, setSubtitle] = useState('');
  const [emoji, setEmoji] = useState('🎉'); const [gradientFrom, setGradientFrom] = useState('from-blue-600');
  const [gradientTo, setGradientTo] = useState('to-blue-500'); const [priority, setPriority] = useState('1');
  const [startDate, setStartDate] = useState(''); const [endDate, setEndDate] = useState('');

  useEffect(() => { const q = query(collection(db, "banners")); return onSnapshot(q, (snap) => { const list = snap.docs.map(d => ({ id: d.id, ...d.data() })); list.sort((a, b) => (a.priority || 999) - (b.priority || 999)); setBanners(list); }, () => {}); }, []);

  const resetForm = () => { setTitle(''); setSubtitle(''); setEmoji('🎉'); setGradientFrom('from-blue-600'); setGradientTo('to-blue-500'); setPriority('1'); setStartDate(''); setEndDate(''); setEditBanner(null); setShowForm(false); };
  const handleEdit = (b: any) => { setEditBanner(b); setTitle(b.title); setSubtitle(b.subtitle); setEmoji(b.emoji || '🎉'); setGradientFrom(b.gradientFrom || 'from-blue-600'); setGradientTo(b.gradientTo || 'to-blue-500'); setPriority(b.priority?.toString() || '1'); setStartDate(b.startDate ? new Date(b.startDate.toDate()).toISOString().split('T')[0] : ''); setEndDate(b.endDate ? new Date(b.endDate.toDate()).toISOString().split('T')[0] : ''); setShowForm(true); };
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setLoading(true); try { const data = { title, subtitle, emoji, gradientFrom, gradientTo, priority: parseInt(priority), startDate: startDate ? new Date(startDate) : new Date(), endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), active: true, updatedAt: serverTimestamp() }; if (editBanner) { await updateDoc(doc(db, "banners", editBanner.id), data); alert("Banner diperbarui!"); } else { await addDoc(collection(db, "banners"), { ...data, createdAt: serverTimestamp() }); alert("Banner ditambahkan!"); } resetForm(); } catch (err: any) { alert(err.message); } finally { setLoading(false); } };
  const toggleActive = async (b: any) => { try { await updateDoc(doc(db, "banners", b.id), { active: !b.active }); } catch (err: any) { alert(err.message); } };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h3 className="font-bold">Banner Promo</h3><button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-bold">{showForm ? 'Batal' : '➕ Tambah'}</button></div>
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
              <div><label className="text-[10px] text-gray-500">Mulai</label><input type="date" className="w-full p-2 bg-gray-50 rounded-xl outline-none text-xs" value={startDate} onChange={(e) => setStartDate(e.target.value)} required /></div>
              <div><label className="text-[10px] text-gray-500">Selesai</label><input type="date" className="w-full p-2 bg-gray-50 rounded-xl outline-none text-xs" value={endDate} onChange={(e) => setEndDate(e.target.value)} required /></div>
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
            <div className="flex-1 min-w-0"><h3 className="font-bold text-xs truncate">{b.title}</h3><p className="text-[10px] text-gray-400">{b.active ? '✅' : '❌'}</p></div>
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
};

// --- PROMOS ---
const PromoManagement = ({ userId }: any) => {
  const [promos, setPromos] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState(''); const [name, setName] = useState('');
  const [type, setType] = useState('discount'); const [discountPercent, setDiscountPercent] = useState('10');
  const [maxDiscount, setMaxDiscount] = useState(''); const [minPurchase, setMinPurchase] = useState('');
  const [startDate, setStartDate] = useState(''); const [endDate, setEndDate] = useState('');

  useEffect(() => { const q = query(collection(db, "promos")); return onSnapshot(q, (snap) => { const list = snap.docs.map(d => ({ id: d.id, ...d.data() })); const userPromos = list.filter(p => p.ownerId === userId || !p.ownerId); userPromos.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)); setPromos(userPromos); }, () => {}); }, [userId]);

  const resetForm = () => { setCode(''); setName(''); setType('discount'); setDiscountPercent('10'); setMaxDiscount(''); setMinPurchase(''); setStartDate(''); setEndDate(''); setShowForm(false); };
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setLoading(true); try { await addDoc(collection(db, "promos"), { code: code.toUpperCase(), name, type, discountPercent: parseInt(discountPercent), maxDiscount: maxDiscount ? parseInt(maxDiscount) : null, minPurchase: minPurchase ? parseInt(minPurchase) : null, startDate: startDate ? new Date(startDate) : new Date(), endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), active: true, ownerId: userId, createdAt: serverTimestamp() }); alert("Promo ditambahkan!"); resetForm(); } catch (err: any) { alert(err.message); } finally { setLoading(false); } };
  const toggleActive = async (id: string, active: boolean) => { try { await updateDoc(doc(db, "promos", id), { active: !active }); } catch (err: any) { alert(err.message); } };
  const deletePromo = async (id: string) => { if (confirm("Hapus promo?")) { try { await deleteDoc(doc(db, "promos", id)); } catch (err: any) { alert(err.message); } } };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h3 className="font-bold">Promo & Diskon</h3><button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-bold">{showForm ? 'Batal' : '➕ Tambah'}</button></div>
      {showForm && (
        <div className="bg-white p-4 rounded-2xl border">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Kode" className="w-full p-3 bg-gray-50 rounded-xl outline-none uppercase" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required />
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
              <button onClick={() => deletePromo(p.id)} className="p-2 bg-red-50 text-red-500 rounded-lg text-[10px] font-bold">🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- FREE SHIPPING ---
const FreeShippingQuickToggle = ({ userId }: any) => {
  const [quickPromos, setQuickPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => { const q = query(collection(db, "promos")); return onSnapshot(q, (snap) => { const all = snap.docs.map(d => ({ id: d.id, ...d.data() })); const fs = all.filter(p => p.type === 'free_shipping' && (p.ownerId === userId || !p.ownerId)).sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)); setQuickPromos(fs); }, () => {}); }, [userId]);
  const createQuick = async () => { setLoading(true); try { await addDoc(collection(db, "promos"), { code: `FREEONGKIR${Math.floor(Math.random() * 1000)}`, name: "Gratis Ongkir", type: "free_shipping", discountPercent: 0, maxDiscount: null, minPurchase: null, startDate: new Date(), endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), active: true, ownerId: userId, createdAt: serverTimestamp() }); alert("Berhasil ditambahkan!"); } catch (err: any) { alert(err.message); } finally { setLoading(false); } };
  const toggle = async (id: string, active: boolean) => { try { await updateDoc(doc(db, "promos", id), { active: !active }); } catch (err: any) { alert(err.message); } };
  const deletePromo = async (id: string) => { if (confirm("Hapus?")) { try { await deleteDoc(doc(db, "promos", id)); } catch (err: any) { alert(err.message); } } };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h3 className="font-bold">Gratis Ongkir</h3><button onClick={createQuick} disabled={loading} className="bg-green-600 text-white px-3 py-2 rounded-xl text-xs font-bold disabled:bg-gray-300">{loading ? "Proses..." : "➕ Buat"}</button></div>
      <div className="space-y-3">{quickPromos.map((p) => (<div key={p.id} className="bg-white p-3 rounded-2xl border flex justify-between items-center"><div><h4 className="font-bold text-sm">{p.name}</h4><p className="text-xs text-gray-500">Kode: <span className="font-mono">{p.code}</span></p><p className="text-[10px] text-gray-400 mt-1">{p.active ? '✅' : '❌'}</p></div><div className="flex gap-1"><button onClick={() => toggle(p.id, p.active)} className={`px-3 py-2 rounded-xl text-xs font-bold ${p.active ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{p.active ? 'Nonaktifkan' : 'Aktifkan'}</button><button onClick={() => { if(confirm("Hapus?")) deleteDoc(doc(db, "promos", p.id)) }} className="p-2 bg-red-50 text-red-500 rounded-xl text-xs font-bold">🗑️</button></div></div>))}</div>
    </div>
  );
};

// --- ADMIN PAGE WITH FIXED FOOTER ---
export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('add');
  const [editData, setEditData] = useState(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [globalNotification, setGlobalNotification] = useState<any>(null);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) { router.push('/login'); }
      else {
        setUser(currentUser);
        // Cek owner (UID khusus)
        getDoc(doc(db, "admins", currentUser.uid)).then(docSnap => { setIsOwner(docSnap.exists()); });
        setLoadingAuth(false);
      }
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "orders"));
    let prevOrders: any[] = [];
    return onSnapshot(q, (snapshot) => {
      const current = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      if (prevOrders.length > 0) {
        const newO = current.filter(o => !prevOrders.some(p => p.id === o.id));
        if (newO.length > 0) {
          setNewOrderCount(n => n + newO.length);
          setGlobalNotification({ title: "🛒 Pesanan Baru!", body: `${newO[0].customerInfo?.name || 'Seseorang'} memesan` });
          setTimeout(() => setGlobalNotification(null), 5000);
        }
      }
      prevOrders = current;
    }, () => {});
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "products"), where("ownerId", "==", user.uid));
    return onSnapshot(q, (snapshot) => { const allCats = snapshot.docs.map(d => d.data().category).filter(c => c); setCategories(Array.from(new Set(allCats))); });
  }, [user]);

  if (loadingAuth || !user) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div><p className="text-gray-500">Memverifikasi...</p></div></div>;

  const tabs = [
    { id: 'add', icon: '➕', label: 'Tambah' },
    { id: 'list', icon: '📦', label: 'Katalog' },
    { id: 'orders', icon: '🛒', label: 'Pesanan', badge: newOrderCount },
    { id: 'chat', icon: '💬', label: 'Chat', external: true },
    { id: 'promos', icon: '🎫', label: 'Promo' },
    { id: 'free-shipping', icon: '🚚', label: 'Ongkir' },
    ...(isOwner ? [
      { id: 'banners', icon: '🖼️', label: 'Banner' },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <NotificationPopup notification={globalNotification} onClose={() => setGlobalNotification(null)} />

      {/* TOP HEADER */}
      <div className="bg-white border-b sticky top-0 z-40 px-4 py-3 flex justify-between items-center">
        <div>
          <h1 className="font-bold text-lg text-blue-600">Admin Panel</h1>
          <p className="text-xs text-gray-500">{user.displayName || 'Admin'} {isOwner && <span className="text-green-600 font-bold">✓ Owner</span>}</p>
        </div>
        <button onClick={() => signOut(auth)} className="p-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold">🚪 Keluar</button>
      </div>

      {/* CONTENT */}
      <div className="p-4 max-w-3xl mx-auto">
        <header className="mb-4"><h2 className="text-lg font-bold text-gray-800">{tabs.find(t => t.id === activeTab)?.label}</h2></header>
        {activeTab === 'add' && <ProductForm editData={editData} setEditData={setEditData} userId={user.uid} categories={categories} />}
        {activeTab === 'list' && <ProductList onEdit={(p: any) => { setEditData(p); setActiveTab('add'); }} userId={user.uid} />}
        {activeTab === 'orders' && <OrdersManagement />}
        {activeTab === 'banners' && isOwner && <BannerManagement />}
        {activeTab === 'promos' && <PromoManagement userId={user.uid} />}
        {activeTab === 'free-shipping' && <FreeShippingQuickToggle userId={user.uid} />}
        {!isOwner && activeTab === 'banners' && <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed"><p className="text-gray-400">🔒 Hanya owner yang bisa mengakses</p></div>}
      </div>

      {/* FIXED BOTTOM NAVIGATION */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 safe-area-bottom">
        <div className="flex justify-around items-center py-2 max-w-3xl mx-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => { 
              if (tab.external) {
                window.location.href = '/chat';
              } else {
                setActiveTab(tab.id); 
                setEditData(null); 
              }
            }}
              className={`flex flex-col items-center justify-center px-3 py-1 rounded-lg transition relative min-w-[60px] ${activeTab === tab.id && !tab.external ? 'text-blue-600' : 'text-gray-400'}`}>
              <span className="text-xl mb-0.5">{tab.icon}</span>
              <span className="text-[10px] font-medium">{tab.label}</span>
              {tab.badge && tab.badge > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{tab.badge}</span>}
              {!tab.external && activeTab === tab.id && <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-full"></div>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
