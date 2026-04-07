import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'order' | 'chat' | 'product' | 'system';
  read: boolean;
  createdAt: any;
  userId: string;
  link?: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Listen to notifications for this user
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
      setNotifications(notifs);
      
      // Count unread
      const unread = notifs.filter(n => !n.read).length;
      setUnreadCount(unread);

      // Show popup for new notifications
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added' && !change.doc.data().read) {
          const notif = { id: change.doc.id, ...change.doc.data() } as Notification;
          showBrowserNotification(notif.title, notif.body);
        }
      });
    });
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    const promises = unreadNotifications.map(n => markAsRead(n.id));
    await Promise.all(promises);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  };
}

// Browser notification helper
function showBrowserNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico'
    });
  }
}

// Request notification permission
export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}
