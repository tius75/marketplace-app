import { create } from 'zustand';

// Definisikan tipe data Notification agar lebih rapi
interface Notification {
  title: string;
  body: string;
}

interface GlobalState {
  user: any | null; // Anda bisa mengganti 'any' dengan tipe User dari Firebase jika perlu
  setUser: (user: any) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  notification: Notification | null; // Untuk pesan popup tunggal
  setNotification: (notif: Notification | null) => void;
  clearNotification: () => void;
}

export const useStore = create<GlobalState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  
  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  notification: null,
  setNotification: (notif) => set({ notification: notif }),
  clearNotification: () => set({ notification: null }),
}));