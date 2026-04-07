"use client";
import { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

const daftarKota = [
  { id: "jakarta", nama: "Jakarta" }, { id: "bekasi", nama: "Bekasi" },
  { id: "surabaya", nama: "Surabaya" }, { id: "bandung", nama: "Bandung" },
];

export default function LoginPage() {
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [tempUser, setTempUser] = useState<any>(null);
  const [phone, setPhone] = useState('');
  const [cityId, setCityId] = useState('');
  const [address, setAddress] = useState('');
  const router = useRouter();

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (!userDoc.exists() || !userDoc.data().address || userDoc.data().address === "Belum diatur") {
        // Jika data alamat kosong, minta isi dulu
        setTempUser(user);
        setShowAddressForm(true);
      } else {
        router.push('/');
      }
    } catch (error: any) { alert(error.message); }
  };

  const saveCompleteData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUser) return;
    try {
      await setDoc(doc(db, "users", tempUser.uid), {
        name: tempUser.displayName,
        email: tempUser.email,
        phone, cityId, address,
        createdAt: new Date()
      });
      router.push('/');
    } catch (e) { alert("Gagal simpan data"); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-sm border max-w-md w-full">
        {!showAddressForm ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-blue-600 mb-6">Masuk Belanja</h1>
            <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 p-3 rounded-xl hover:bg-gray-50 font-medium">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" />
              Lanjut dengan Gmail
            </button>
          </div>
        ) : (
          <form onSubmit={saveCompleteData} className="space-y-4">
            <h2 className="font-bold text-lg text-gray-800">Lengkapi Alamat Kirim</h2>
            <p className="text-xs text-gray-500">Satu langkah lagi agar kami bisa menghitung ongkir otomatis.</p>
            <input type="tel" placeholder="Nomor WA" required className="w-full p-3 bg-gray-50 rounded-xl outline-none" onChange={e => setPhone(e.target.value)} />
            <select required className="w-full p-3 bg-gray-50 rounded-xl outline-none" onChange={e => setCityId(e.target.value)}>
              <option value="">Pilih Kota Tujuan</option>
              {daftarKota.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </select>
            <textarea placeholder="Alamat Lengkap (Nama Jalan, No Rumah)" required className="w-full p-3 bg-gray-50 rounded-xl outline-none" onChange={e => setAddress(e.target.value)} />
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl">Simpan & Mulai Belanja</button>
          </form>
        )}
      </div>
    </div>
  );
}