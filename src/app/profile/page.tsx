"use client";
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';

const daftarKota = [
  { id: "jakarta", nama: "Jakarta" }, { id: "bekasi", nama: "Bekasi" },
  { id: "surabaya", nama: "Surabaya" }, { id: "bandung", nama: "Bandung" },
];

export default function ProfilePage() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            // Jika document user belum ada, buat default
            setUserData({
              name: user.displayName || 'User',
              email: user.email || '',
              phone: '',
              cityId: '',
              address: ''
            });
          }
        } catch (error: any) {
          console.error('Error loading profile:', error);
          // Fallback: gunakan data dari Firebase Auth
          setUserData({
            name: user.displayName || 'User',
            email: user.email || '',
            phone: '',
            cityId: '',
            address: ''
          });
        }
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const user = auth.currentUser;
    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), userData);
        alert("Profil Berhasil Diperbarui!");
      } catch (error) {
        alert("Gagal update profil");
      }
    }
    setSaving(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const user = auth.currentUser;
    if (!user) return;
    
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (data.url) {
        // Update Firestore
        await updateDoc(doc(db, "users", user.uid), { photoURL: data.url });
        
        // Update local state
        setUserData((prev: any) => ({ ...prev, photoURL: data.url }));
        
        // Force refresh user data
        const updatedSnap = await getDoc(doc(db, "users", user.uid));
        if (updatedSnap.exists()) {
          setUserData(updatedSnap.data());
        }
        
        alert("Foto profil berhasil diperbarui! Refresh halaman untuk melihat perubahan.");
        
        // Auto refresh
        window.location.reload();
      }
    } catch (error: any) {
      alert("Gagal upload foto: " + error.message);
    } finally {
      setUploadingFile(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40 safe-area-top">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-xl">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="font-bold text-lg">Profil Saya</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4 mt-4">
        {/* Avatar */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border text-center">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-4xl font-bold mx-auto mb-3 overflow-hidden">
              {userData?.photoURL ? (
                <img src={userData.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                userData?.name?.charAt(0) || 'U'
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-blue-700 transition shadow-lg">
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              📷
            </label>
          </div>
          <h2 className="font-bold text-lg text-gray-900">{userData?.name || 'User'}</h2>
          <p className="text-sm text-gray-500">{userData?.email}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleUpdate} className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="p-4 space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nama Lengkap</label>
              <input 
                type="text" 
                value={userData?.name || ''} 
                className="w-full p-3 bg-gray-50 rounded-xl outline-none text-gray-900 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" 
                onChange={e => setUserData({...userData, name: e.target.value})} 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nomor WhatsApp</label>
              <input 
                type="tel" 
                value={userData?.phone || ''} 
                className="w-full p-3 bg-gray-50 rounded-xl outline-none text-gray-900 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" 
                onChange={e => setUserData({...userData, phone: e.target.value})} 
                placeholder="08xxxxxxxxxx"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Kota Pengiriman</label>
              <select 
                className="w-full p-3 bg-gray-50 rounded-xl outline-none text-gray-900 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" 
                value={userData?.cityId || ''} 
                onChange={e => setUserData({...userData, cityId: e.target.value})}
              >
                <option value="">Pilih Kota</option>
                {daftarKota.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Alamat Lengkap</label>
              <textarea 
                value={userData?.address || ''} 
                className="w-full p-3 bg-gray-50 rounded-xl outline-none text-gray-900 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition resize-none" 
                onChange={e => setUserData({...userData, address: e.target.value})} 
                rows={3}
                placeholder="Jl. ..., No. ..., RT/RW ..."
              />
            </div>
          </div>
          <div className="p-4 border-t">
            <button 
              type="submit" 
              disabled={saving}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl disabled:bg-gray-300 transition"
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
