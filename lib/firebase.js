import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAUDkSFWfC6fZJo1tSy7gt99iKPcPWICGo",
  authDomain: "belanja-mudah-ae88a.firebaseapp.com",
  projectId: "belanja-mudah-ae88a",
  storageBucket: "belanja-mudah-ae88a.firebasestorage.app",
  messagingSenderId: "934294728680",
  appId: "1:934294728680:web:9e7f56a5d458cba482be5d"
};

// Mencegah inisialisasi ulang saat hot-reload di Next.js
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// --- KONFIGURASI MESSAGING (FCM) ---
// Messaging diinisialisasi secara LAZY untuk menghindari error
export let messaging = null;

// Cek apakah browser mendukung FCM
const isBrowser = typeof window !== "undefined";
const isMessagingSupported = isBrowser && 
  "Notification" in window &&
  "serviceWorker" in navigator &&
  "PushManager" in window;

export const requestForToken = async () => {
  if (!isMessagingSupported) {
    console.log("FCM tidak didukung di browser ini");
    return null;
  }

  try {
    // Dynamic import untuk menghindari error saat module load
    const { getMessaging, getToken } = await import("firebase/messaging");
    
    // Init messaging hanya saat fungsi dipanggil
    if (!messaging) {
      messaging = getMessaging(app);
    }
    
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      const currentToken = await getToken(messaging, {
        vapidKey: 'BOtb8DAuXgj3U302t_ZiNDfzYsv8Hwv3RAkhztnkCMamDFMsXXD4dqxBwrLLgo5aOWdd_LdwBg9hCdA2TzcjUCw'
      });

      if (currentToken) {
        console.log("FCM Token:", currentToken);
        return currentToken;
      }
    }
  } catch (err) {
    console.warn("FCM tidak tersedia:", err);
  }
  
  return null;
};

export const onMessageListener = async () => {
  if (!isMessagingSupported) return null;
  
  try {
    const { getMessaging, onMessage } = await import("firebase/messaging");
    
    if (!messaging) {
      messaging = getMessaging(app);
    }

    return new Promise((resolve) => {
      onMessage(messaging, (payload) => {
        resolve(payload);
      });
    });
  } catch (err) {
    console.warn("FCM listener tidak tersedia:", err);
    return null;
  }
};
