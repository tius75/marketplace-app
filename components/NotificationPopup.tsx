"use client";
import { useState, useEffect } from 'react';
import { useNotifications, requestNotificationPermission } from '@/lib/useNotifications';
import Link from 'next/link';

export default function NotificationPopup() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  if (unreadCount === 0 && notifications.length === 0) return null;

  return (
    <div className="relative">
      {/* Notification Bell Icon */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 hover:bg-gray-100 rounded-xl transition"
      >
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border z-50">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="font-bold text-sm">Notifikasi</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                Tandai Semua
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <p className="text-4xl mb-2">🔔</p>
                <p className="text-sm">Belum ada notifikasi</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 border-b hover:bg-gray-50 transition ${
                    !notif.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    markAsRead(notif.id);
                    if (notif.link) {
                      window.location.href = notif.link;
                    }
                  }}
                >
                  <div className="flex items-start gap-2">
                    <div className="text-xl">
                      {notif.type === 'order' && '🛒'}
                      {notif.type === 'chat' && '💬'}
                      {notif.type === 'product' && '📦'}
                      {notif.type === 'system' && '⚙️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-900">{notif.title}</p>
                      <p className="text-xs text-gray-600">{notif.body}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {notif.createdAt?.toDate?.().toLocaleString('id-ID')}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {notifications.length > 10 && (
            <div className="p-2 text-center border-t">
              <button className="text-xs text-blue-600 font-bold hover:underline">
                Lihat Semua ({notifications.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
