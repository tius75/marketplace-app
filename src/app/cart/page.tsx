"use client";

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, addDoc, collection, serverTimestamp, getDocs } from 'firebase/firestore';
import { useCartStore } from '@/store/useCartStore';
import Link from 'next/link';
import Image from 'next/image';

export default function CartPage() {
  const cart = useCartStore((state: any) => state.cart);
  const clearCart = useCartStore((state: any) => state.clearCart);
  const removeFromCart = useCartStore((state: any) => state.removeFromCart);

  const [userData, setUserData] = useState<any>(null);
  const [shippingCost, setShippingCost] = useState(0);
  const [originalShippingCost, setOriginalShippingCost] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingOngkir, setLoadingOngkir] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [courierServices, setCourierServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedCourier, setSelectedCourier] = useState('jne');
  const [useFreeShipping, setUseFreeShipping] = useState(false);
  const [availableFreeShipping, setAvailableFreeShipping] = useState<any[]>([]);
  const [selectedFreeShippingVoucher, setSelectedFreeShippingVoucher] = useState<any>(null);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [availableCouriers] = useState([
    { id: 'jne', name: 'JNE' },
    { id: 'pos', name: 'POS Indonesia' },
    { id: 'tiki', name: 'TIKI' },
    { id: 'wahana', name: 'Wahana' },
    { id: 'jnt', name: 'J&T Express' }
  ]);

  const totalPrice = cart.reduce((total: number, item: any) => total + (item.price * item.qty), 0);
  const subtotalAfterDiscount = totalPrice - discountAmount;
  const finalShippingCost = useFreeShipping ? 0 : shippingCost;
  const grandTotal = subtotalAfterDiscount + finalShippingCost;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            if (data.cityId && data.cityId !== "Belum diatur") {
              handleCheckOngkir(data.cityId, 'jne');
            }
          }
        } catch (error) {
          console.error("Gagal mengambil data user:", error);
        } finally {
          setLoading(false);
        }
      } else {
        window.location.href = "/login";
      }
    });
    return () => unsub();
  }, []);

  // Load available free shipping vouchers
  useEffect(() => {
    loadFreeShippingVouchers();
  }, []);

  const loadFreeShippingVouchers = async () => {
    try {
      const snapshot = await getDocs(collection(db, "promos"));
      const now = new Date();
      const vouchers = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((p: any) => {
          if (p.type !== 'free_shipping' || p.active !== true) return false;
          const startDate = p.startDate?.toDate?.() || new Date(0);
          const endDate = p.endDate?.toDate?.() || new Date(9999, 0);
          if (now < startDate || now > endDate) return false;
          if (p.minPurchase && totalPrice < p.minPurchase) return false;
          return true;
        });
      setAvailableFreeShipping(vouchers);
    } catch (error) {
      console.error("Error loading vouchers:", error);
    }
  };

  const handleCheckOngkir = async (cityName: string, courier: string = 'jne') => {
    setLoadingOngkir(true);
    try {
      const res = await fetch('/api/ongkir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinationCode: cityName.toLowerCase(), courier })
      });
      const data = await res.json();

      if (data && data.length > 0) {
        setCourierServices(data);
        setSelectedService(data[0]);
        const baseCost = parseInt(data[0].price);
        setOriginalShippingCost(baseCost);
        setShippingCost(baseCost);
      } else {
        setCourierServices([]);
        setShippingCost(0);
        setOriginalShippingCost(0);
      }
    } catch (e) {
      console.error("Gagal ongkir:", e);
      setCourierServices([]);
      setShippingCost(0);
      setOriginalShippingCost(0);
    } finally {
      setLoadingOngkir(false);
    }
  };

  const handleCourierChange = (courier: string) => {
    setSelectedCourier(courier);
    if (userData?.cityId) {
      handleCheckOngkir(userData.cityId, courier);
    }
  };

  const handleServiceSelect = (service: any) => {
    setSelectedService(service);
    const cost = parseInt(service.price);
    setOriginalShippingCost(cost);
    setShippingCost(cost);
  };

  const handleSelectFreeShipping = (voucher: any) => {
    if (selectedFreeShippingVoucher?.id === voucher.id) {
      // Unselect
      setSelectedFreeShippingVoucher(null);
      setUseFreeShipping(false);
    } else {
      setSelectedFreeShippingVoucher(voucher);
      setUseFreeShipping(true);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    
    try {
      const snapshot = await getDocs(collection(db, "promos"));
      const now = new Date();
      const promoFound = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .find((p: any) => {
          if (p.code !== promoCode.toUpperCase() || p.active !== true) return false;
          if (p.type === 'free_shipping') return true; // Handle separately
          const startDate = p.startDate?.toDate?.() || new Date(0);
          const endDate = p.endDate?.toDate?.() || new Date(9999, 0);
          if (now < startDate || now > endDate) return false;
          if (p.minPurchase && totalPrice < p.minPurchase) return false;
          return true;
        });

      if (!promoFound) {
        alert("Kode promo tidak valid atau sudah kedaluwarsa.");
        return;
      }

      if (promoFound.type === 'free_shipping') {
        setUseFreeShipping(true);
        setSelectedFreeShippingVoucher(promoFound);
        alert(`Voucher "${promoFound.name}" berhasil diterapkan!`);
        return;
      }

      let discount = 0;
      if (promoFound.type === 'discount') {
        discount = (promoFound.discountPercent / 100) * totalPrice;
        if (promoFound.maxDiscount) {
          discount = Math.min(discount, promoFound.maxDiscount);
        }
      }

      setAppliedPromo(promoFound);
      setDiscountAmount(discount);
      alert(`Promo "${promoFound.name}" berhasil diterapkan!`);
    } catch (error) {
      console.error("Error applying promo:", error);
      alert("Gagal menerapkan promo.");
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Keranjang Anda kosong!");
    if (!selectedService && !useFreeShipping) return alert("Pilih layanan pengiriman terlebih dahulu.");

    setIsSubmitting(true);
    const orderId = "BM-" + Date.now();

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          grossAmount: grandTotal,
          customerDetails: {
            name: userData.name,
            phone: userData.phone || "08xxx",
            address: userData.address
          }
        })
      });

      const result = await res.json();
      if (!result.token) throw new Error("Gagal mendapatkan token pembayaran");

      (window as any).snap.pay(result.token, {
        onSuccess: async () => {
          await addDoc(collection(db, "orders"), {
            orderId,
            items: cart,
            subtotal: totalPrice,
            discount: discountAmount,
            shippingCost: finalShippingCost,
            shippingService: selectedService ? `${selectedCourier}/${selectedService.service}` : 'Gratis Ongkir',
            totalAmount: grandTotal,
            status: "Sudah Dibayar",
            createdAt: serverTimestamp(),
            customerInfo: userData,
            appliedPromo: appliedPromo?.code || selectedFreeShippingVoucher?.code || null,
            usedFreeShipping: useFreeShipping
          });
          clearCart();
          alert("Pembayaran Berhasil!");
          window.location.href = "/";
        },
        onPending: () => alert("Menunggu pembayaran Anda."),
        onError: () => alert("Pembayaran gagal, silakan coba lagi."),
        onClose: () => alert("Anda menutup jendela pembayaran.")
      });
    } catch (e) {
      console.error(e);
      alert("Checkout Gagal. Periksa koneksi atau data profil Anda.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* NAVBAR BACK */}
      <nav className="bg-white shadow-sm p-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Kembali
          </Link>
          <h1 className="font-bold text-gray-800">Checkout</h1>
          <div className="w-10"></div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6 mt-8 px-4">

        {/* LIST BARANG */}
        <div className="flex-1 space-y-4">
          <h2 className="text-xl font-bold text-gray-800">Barang Belanjaan</h2>
          {cart.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl text-center border-2 border-dashed border-gray-200">
              <p className="text-gray-400">Keranjang Anda kosong</p>
            </div>
          ) : (
            cart.map((item: any) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl flex gap-4 border shadow-sm items-center">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
                  <Image src={item.imageURL} alt={item.name} fill className="object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">{item.name}</h3>
                  <p className="text-blue-600 font-bold text-sm">Rp {item.price.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-1">Jumlah: {item.qty}</p>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* RINGKASAN & DATA PENGIRIMAN */}
        <div className="w-full md:w-80 space-y-4">
          <div className="bg-white p-6 rounded-2xl border shadow-md sticky top-24">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              Alamat Pengiriman
            </h3>

            <div className="text-sm space-y-1 mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="font-bold text-gray-800">{userData?.name || "User"}</p>
              <p className="text-gray-600 text-xs leading-relaxed">{userData?.address || "Alamat belum diatur"}</p>
              <p className="text-[10px] font-black text-blue-700 uppercase mt-2 tracking-wider">
                📍 {userData?.cityId || "KOTA TIDAK DIKETAHUI"}
              </p>
            </div>

            {/* VOUCHER GRATIS ONGKIR */}
            {availableFreeShipping.length > 0 && (
              <div className="mb-4">
                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">🎫 Voucher Gratis Ongkir</label>
                <div className="space-y-2">
                  {availableFreeShipping.map((voucher: any) => (
                    <div
                      key={voucher.id}
                      onClick={() => handleSelectFreeShipping(voucher)}
                      className={`p-3 rounded-xl border cursor-pointer transition ${
                        selectedFreeShippingVoucher?.id === voucher.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-bold text-sm text-gray-700">🚚 {voucher.name}</span>
                          <p className="text-[10px] text-gray-500">Kode: {voucher.code}</p>
                        </div>
                        <span className={`text-xs font-bold ${selectedFreeShippingVoucher?.id === voucher.id ? 'text-green-600' : 'text-gray-400'}`}>
                          {selectedFreeShippingVoucher?.id === voucher.id ? '✓ Dipilih' : 'Pilih'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PILIH EKSPEDISI (disabled jika pakai gratis ongkir) */}
            <div className={`border-t border-dashed pt-4 mb-4 ${useFreeShipping ? 'opacity-50' : ''}`}>
              <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Pilih Ekspedisi</label>
              <select 
                value={selectedCourier} 
                onChange={(e) => handleCourierChange(e.target.value)}
                className="w-full p-2 bg-gray-50 rounded-xl text-sm mb-2 disabled:bg-gray-100"
                disabled={useFreeShipping}
              >
                {availableCouriers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              
              {courierServices.length > 0 && !useFreeShipping && (
                <div className="space-y-2 mt-2">
                  {courierServices.map((s: any) => (
                    <div
                      key={s.service}
                      onClick={() => handleServiceSelect(s)}
                      className={`p-2 rounded-lg border cursor-pointer transition text-xs ${
                        selectedService?.service === s.service 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-bold text-gray-700">{s.service}</span>
                          <span className="text-gray-400 ml-1">({s.description})</span>
                        </div>
                        <span className="text-blue-600 font-bold">Rp {parseInt(s.price).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3 text-sm border-t pt-4">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>Rp {totalPrice.toLocaleString()}</span>
              </div>
              
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Diskon ({appliedPromo?.code})</span>
                  <span>- Rp {discountAmount.toLocaleString()}</span>
                </div>
              )}
              
              <div className="flex justify-between text-gray-500">
                <span>Ongkir {useFreeShipping ? '(GRATIS)' : selectedService ? `(${selectedService.service})` : ''}</span>
                <span>
                  {useFreeShipping ? (
                    <>
                      <span className="line-through text-gray-400 text-xs">Rp {shippingCost.toLocaleString()}</span>
                      <span className="text-green-600 font-bold ml-1">GRATIS</span>
                    </>
                  ) : (
                    loadingOngkir ? "..." : `Rp ${shippingCost.toLocaleString()}`
                  )}
                </span>
              </div>
              
              <div className="flex justify-between font-black text-xl pt-3 text-gray-900 border-t border-dashed mt-2">
                <span>Total</span>
                <span className="text-blue-600">Rp {grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Promo Code */}
            <div className="mt-4 pt-4 border-t">
              <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Kode Promo</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Masukkan kode"
                  className="flex-1 p-2 bg-gray-50 rounded-xl text-sm uppercase outline-none border border-gray-200 focus:border-blue-500"
                />
                <button 
                  onClick={handleApplyPromo}
                  className="px-4 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700"
                >
                  Pakai
                </button>
              </div>
              {appliedPromo && (
                <p className="text-xs text-green-600 mt-2 font-medium">✓ {appliedPromo.name} aktif</p>
              )}
              {selectedFreeShippingVoucher && (
                <p className="text-xs text-green-600 mt-2 font-medium">✓ {selectedFreeShippingVoucher.name} aktif</p>
              )}
            </div>

            <button
              onClick={handleCheckout}
              disabled={isSubmitting || cart.length === 0 || (!selectedService && !useFreeShipping)}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl mt-6 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:bg-gray-200 disabled:shadow-none uppercase tracking-widest text-xs"
            >
              {isSubmitting ? "Sedang Memproses..." : "Bayar Sekarang"}
            </button>

            <p className="text-[10px] text-gray-400 text-center mt-4">
              Pembayaran aman melalui <span className="font-bold">Midtrans</span>
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}
