"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import NotificationPopup from '@/components/NotificationPopup';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useCartStore } from '@/store/useCartStore';

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  gradientFrom: string;
  gradientTo: string;
  emoji: string;
  active: boolean;
  startDate: any;
  endDate: any;
  priority: number;
}

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeBanner, setActiveBanner] = useState<Banner | null>(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [homeIcons, setHomeIcons] = useState<any[]>([]);

  const cart = useCartStore((state: any) => state.cart);
  const totalItems = cart.reduce((total: number, item: any) => total + item.qty, 0);
  const [carouselProducts, setCarouselProducts] = useState<any[]>([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Auth & Real-time Chat Notifications
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      
      if (u) {
        // Set user status to ONLINE
        setDoc(doc(db, 'users', u.uid), { 
          online: true, 
          lastSeen: serverTimestamp(),
          email: u.email,
          displayName: u.displayName 
        }, { merge: true });
        
        // Request notification permission
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
        
        // Listen for logout
        window.addEventListener('beforeunload', () => {
          setDoc(doc(db, 'users', u.uid), { online: false, lastSeen: serverTimestamp() }, { merge: true });
        });
        
        const q = query(collection(db, 'chats'));
        const unsubChats = onSnapshot(q, (snap) => {
          let totalUnread = 0;
          
          snap.docs.forEach(docSnap => {
            const chatData = docSnap.data();
            if (chatData.participants?.includes(u.uid)) {
              const msgQ = query(
                collection(db, 'chats', docSnap.id, 'messages')
              );
              
              onSnapshot(msgQ, (msgSnap) => {
                const unread = msgSnap.docs.filter(d => {
                  const msg = d.data();
                  return msg.receiverId === u.uid && msg.read !== true;
                }).length;
                
                totalUnread += unread;
                setUnreadChatCount(totalUnread);
                
                if (unread > 0) {
                  playNotificationSound();
                  
                  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                    new Notification('💬 Pesan Baru', {
                      body: `Anda punya ${unread} pesan belum dibaca`,
                      icon: '/logo.png',
                      badge: '/logo.png',
                      tag: 'new-message'
                    });
                  }
                }
              });
            }
          });
        });
        
        return () => {
          unsubChats();
          setDoc(doc(db, 'users', u.uid), { online: false, lastSeen: serverTimestamp() }, { merge: true });
        };
      } else {
        setUnreadChatCount(0);
      }
    });
    return () => unsub();
  }, []);

  // Fungsi untuk memainkan suara notifikasi
  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 880;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.5;
      
      oscillator.start(audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      oscillator.stop(audioContext.currentTime + 0.5);
      
      // Second tone
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 1100;
        osc2.type = 'sine';
        gain2.gain.value = 0.5;
        osc2.start(audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        osc2.stop(audioContext.currentTime + 0.3);
      }, 200);
    } catch (error) {
      console.log('Notification sound error:', error);
    }
  };

  // Home Icons dari Firestore
  useEffect(() => {
    const q = query(collection(db, "homeIcons"), where("active", "==", true));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (a.order || 999) - (b.order || 999));
      setHomeIcons(data);
    }, () => {
      // Fallback: tidak ada icon jika Firestore kosong/error
      setHomeIcons([]);
    });
    return () => unsub();
  }, []);

  // Banners
  useEffect(() => {
    const q = query(collection(db, "banners"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Banner[];
      const now = new Date();
      const valid = data.filter(b => b.active && now >= (b.startDate?.toDate?.() || new Date(0)) && now <= (b.endDate?.toDate?.() || new Date(9999, 0)));
      valid.sort((a, b) => (a.priority || 999) - (b.priority || 999));
      setBanners(valid);
      if (valid.length > 0) setActiveBanner(valid[0]);
    }, () => setBanners([]));
    return () => unsub();
  }, []);

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => {
        const next = (prev + 1) % banners.length;
        setActiveBanner(banners[next]);
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);

  // Products
  useEffect(() => {
    const q = query(collection(db, "products"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setProducts(data);
      
      // Set random carousel products once
      if (data.length > 0) {
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setCarouselProducts(shuffled.slice(0, 20));
      }
      
      setLoading(false);
    }, (err) => {
      console.error('Products listener error:', err);
      setProducts([]);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Filter products by search
  const filteredProducts = searchQuery
    ? products.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.category?.toLowerCase().includes(searchQuery.toLowerCase()))
    : products;

  return (
    <main className="min-h-screen bg-gray-50 pb-24 md:pb-10">
      {/* TOP HEADER - Fixed, safe area for notch */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm safe-area-top">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Logo - Font Menarik */}
            <Link href="/" className="text-xl md:text-3xl flex-shrink-0" style={{ fontFamily: 'cursive, Comic Sans MS, Chalkboard SE, sans-serif' }}>
              <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent font-black drop-shadow-sm">
                Belanja
              </span>
              <span className="text-blue-600 font-black ml-1">Mudah</span>
              <span className="text-2xl ml-0.5">🛍️</span>
            </Link>
            
            {/* Search Bar */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearch(true)}
                onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                suppressHydrationWarning
                className="w-full px-4 py-2.5 text-sm rounded-xl outline-none transition border-2 border-gray-200 bg-white"
                style={{
                  color: '#000000',
                  fontWeight: '600',
                  WebkitTextFillColor: '#000000'
                }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">×</button>
              )}
            </div>

            {/* Icons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Notifications */}
              {user && <NotificationPopup />}

              {/* Chat/Messages */}
              <Link href="/chat" className="relative p-2 hover:bg-gray-100 rounded-xl transition">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {unreadChatCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                    {unreadChatCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link href="/cart" className="relative p-2 hover:bg-gray-100 rounded-xl transition">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* User/Login */}
              {user ? (
                <div className="relative">
                  <button 
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold ring-2 ring-white shadow-lg"
                  >
                    {user.displayName?.charAt(0) || 'U'}
                  </button>
                  {/* Dropdown */}
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border z-50">
                      <div className="p-3 border-b">
                        <p className="font-bold text-sm truncate">{user.displayName || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <Link href="/profile" onClick={() => setShowProfileMenu(false)} className="block px-3 py-2 text-sm hover:bg-gray-50">👤 Profil</Link>
                      <Link href="/cart" onClick={() => setShowProfileMenu(false)} className="block px-3 py-2 text-sm hover:bg-gray-50">🛒 Pesanan Saya</Link>
                      <button 
                        onClick={() => { signOut(auth); setShowProfileMenu(false); }} 
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        🚪 Keluar
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition">
                  Masuk
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT WITH TOP SPACING */}
      <div className="pt-20 md:pt-24">
        {/* PRODUCT CAROUSEL - Max 20 Random Products */}
        {!loading && carouselProducts.length > 0 && (
          <div className="max-w-6xl mx-auto px-4 mt-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-bold text-gray-800">✨ Produk Pilihan</h2>
                <p className="text-xs text-gray-400">{carouselProducts.length} produk</p>
              </div>
              <div className="relative">
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {carouselProducts.map((product) => (
                    <div key={product.id} className="flex-shrink-0 w-40">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
                {/* Scroll Indicators */}
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* BANNER */}
        {activeBanner && (
          <div className="max-w-6xl mx-auto px-4 mt-4">
            <div className={`bg-gradient-to-r ${activeBanner.gradientFrom || 'from-blue-600'} ${activeBanner.gradientTo || 'to-blue-500'} rounded-2xl md:rounded-3xl p-6 md:p-12 text-white shadow-lg relative overflow-hidden`}>
              <div className="relative z-10">
                <h2 className="text-2xl md:text-4xl font-black mb-2">{activeBanner.emoji} {activeBanner.title}</h2>
                <p className="text-white/80 text-sm md:text-base max-w-md">{activeBanner.subtitle}</p>
              </div>
              <div className="absolute right-0 bottom-0 opacity-10 text-[100px] md:text-[150px] font-black italic select-none">{activeBanner.emoji}</div>
            </div>
            {banners.length > 1 && (
              <div className="flex justify-center gap-2 mt-3">
                {banners.map((_, i) => (
                  <button key={i} onClick={() => { setCurrentBannerIndex(i); setActiveBanner(banners[i]); }}
                    className={`h-2 rounded-full transition-all ${i === currentBannerIndex ? 'bg-blue-600 w-6' : 'bg-gray-300 w-2'}`} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* CATEGORIES / QUICK LINKS - Hanya muncul jika ada icon dari Firestore */}
        {homeIcons.length > 0 && (
          <div className="max-w-6xl mx-auto px-4 mt-6">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                {homeIcons.map((cat, i) => (
                  <button key={cat.id || i} onClick={() => setSearchQuery(cat.name.toLowerCase())} className="flex flex-col items-center gap-2 p-3 hover:bg-gray-50 rounded-xl transition">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${cat.color || 'bg-gray-100'}`}>
                      {cat.emoji || '📦'}
                    </div>
                    <span className="text-[10px] md:text-xs font-medium text-gray-700">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS */}
        <div className="max-w-6xl mx-auto px-4 mt-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-800">
                {searchQuery ? `Hasil Pencarian "${searchQuery}"` : 'Rekomendasi'}
              </h2>
              <p className="text-xs text-gray-400">{filteredProducts.length} produk</p>
            </div>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-blue-600 text-sm font-bold">Reset</button>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-400 text-sm">Memuat produk...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed">
              <p className="text-6xl mb-4">🔍</p>
              <p className="text-gray-400 font-bold">{searchQuery ? 'Produk tidak ditemukan' : 'Belum ada produk'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FIXED BOTTOM NAVIGATION - Mobile App Style */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 safe-area-bottom md:hidden">
        <div className="flex justify-around items-center py-2">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex flex-col items-center justify-center px-3 py-1 text-blue-600">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
            <span className="text-[10px] font-medium mt-0.5">Home</span>
          </button>
          
          <Link href="/cart" className="flex flex-col items-center justify-center px-3 py-1 text-gray-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            <span className="text-[10px] font-medium mt-0.5">Transaksi</span>
          </Link>
          
          <Link href="/feed" className="flex flex-col items-center justify-center px-3 py-1 text-gray-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
            <span className="text-[10px] font-medium mt-0.5">Feed</span>
          </Link>
          
          <Link href="/profile" className="flex flex-col items-center justify-center px-3 py-1 text-gray-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="text-[10px] font-medium mt-0.5">Profile</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
