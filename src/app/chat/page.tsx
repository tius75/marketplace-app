"use client";
import { useEffect, useState, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, doc, updateDoc, setDoc, where, getDoc } from 'firebase/firestore';
import Link from 'next/link';

export default function ChatPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [activeChatName, setActiveChatName] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [chatError, setChatError] = useState('');
  const [searchUser, setSearchUser] = useState('');

  // Fitur Baru
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // Emoji List
  const emojis = ['😀', '😂', '😍', '🥰', '😎', '🤔', '👍', '👋', '🔥', '❤️', '🎉', '💯', '🙏', '✨', '✅', '💬', '📦', '🛒', '💰', '📷', '😊', '🤣', '😘', '😜', '🤗', '😇', '🙌', '💪', '👏', '🎊', '🌟', '💫', '⚡', '💥', '🎯', '🏆', '💎', '🌈'];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Load all users
  useEffect(() => {
    if (!user) return;

    const loadUsers = async () => {
      try {
        console.log('Loading users from Firestore...');
        const usersSnap = await getDocs(collection(db, 'users'));
        console.log(`Found ${usersSnap.size} users`);
        
        const usersList = usersSnap.docs.map(d => ({ uid: d.id, id: d.id, ...d.data() }));
        setAllUsers(usersList);

        const simpleConversations = usersList
          .filter((u: any) => u.uid !== user.uid)
          .map((u: any) => ({
            id: u.uid, name: u.displayName || u.name || 'User',
            avatar: u.photoURL || '👤', lastMessage: 'Klik untuk mulai chat',
            email: u.email || '', uid: u.uid
          }));

        setConversations(simpleConversations);
        console.log('Users loaded successfully');
      } catch (error: any) {
        console.error('Error loading users:', error);
        setAllUsers([]);
        setConversations([]);
        setChatError(error.code === 'permission-denied' 
          ? '⚠️ Akses ditolak. Silakan deploy Firestore rules.\n\nLihat: FIRESTORE_RULES_LENGKAP.md' 
          : '💡 Belum ada user untuk di-chat.');
      }
    };

    loadUsers();
    const retry1 = setTimeout(loadUsers, 2000);
    const retry2 = setTimeout(loadUsers, 5000);
    return () => { clearTimeout(retry1); clearTimeout(retry2); };
  }, [user]);

  // Hitung pesan belum dibaca untuk setiap conversation
  useEffect(() => {
    if (!user || !user.uid || conversations.length === 0) return;

    const unsubscribes = conversations.map(convo => {
      if (!convo.uid) return () => {};
      
      const chatId = getChatId(user.uid, convo.uid);
      const q = query(
        collection(db, 'chats', chatId, 'messages'),
        where('receiverId', '==', user.uid),
        where('read', '==', false)
      );

      return onSnapshot(q, (snap) => {
        setUnreadCounts(prev => ({ ...prev, [convo.uid]: snap.size }));
      }, (err) => {
        // Ignore permission errors silently
        if (err.code !== 'permission-denied') {
          console.error('Error counting unread:', err);
        }
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [user, conversations]);

  // Load messages
  useEffect(() => {
    if (!user || !activeChat) return;
    setChatError('');
    const chatId = getChatId(user.uid, activeChat);

    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setChatError('');
    }, (error: any) => {
      console.error('Error loading messages:', error);
      setChatError(error.code === 'permission-denied' ? '⚠️ FIRESTORE RULES BELUM DI-DEPLOY!' : 'Error: ' + error.message);
      setMessages([]);
    });

    return () => unsub();
  }, [user, activeChat]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const getChatId = (uid1: string, uid2: string) => [uid1, uid2].sort().join('_');

  const openChat = async (uid: string, name: string) => {
    setActiveChat(uid);
    setActiveChatName(name);

    // Tandai pesan sebagai dibaca
    const chatId = getChatId(user.uid, uid);
    const q = query(collection(db, 'chats', chatId, 'messages'), where('receiverId', '==', user.uid), where('read', '==', false));
    
    try {
      const snap = await getDocs(q);
      const updates = snap.docs.map(d => updateDoc(doc(db, 'chats', chatId, 'messages', d.id), { read: true }));
      if (updates.length > 0) await Promise.all(updates);
      setUnreadCounts(prev => ({ ...prev, [uid]: 0 }));
    } catch (err) { console.error('Error marking as read:', err); }
  };

  const handleSendMessage = async (text?: string, fileData?: { url: string, type: string }) => {
    const finalText = text || newMessage;
    if ((!finalText.trim() && !fileData) || !user || !activeChat) return;

    const chatId = getChatId(user.uid, activeChat);
    
    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: fileData ? (finalText.trim() || `Mengirim ${fileData.type}`) : finalText,
        fileUrl: fileData?.url || null,
        fileType: fileData?.type || null,
        senderId: user.uid,
        senderName: user.displayName || 'User',
        receiverId: activeChat,
        read: false,
        createdAt: serverTimestamp()
      });

      await setDoc(doc(db, 'chats', chatId), {
        participants: [user.uid, activeChat],
        lastMessage: fileData ? (finalText.trim() ? finalText : '📄 Mengirim file') : finalText,
        lastMessageTime: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      setNewMessage('');
      setShowEmojiPicker(false);
      setChatError('');
    } catch (err: any) {
      console.error('Error sending message:', err);
      setChatError('Gagal mengirim pesan.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file melebihi 10MB!');
      return;
    }

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.url) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        const type = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '') ? 'image' : 'file';
        await handleSendMessage(null, { url: data.url, type });
      }
    } catch (error: any) {
      alert('Gagal upload: ' + error.message);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const filteredUsers = conversations.filter(c => 
    c.name.toLowerCase().includes(searchUser.toLowerCase()) || (c.email && c.email.toLowerCase().includes(searchUser.toLowerCase()))
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center"><p className="text-6xl mb-4">🔒</p><p className="text-gray-500 font-bold">Silakan login terlebih dahulu</p><Link href="/login" className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-xl font-bold">Login</Link></div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40 safe-area-top">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          {!activeChat 
            ? <h1 className="font-bold text-lg text-gray-900">💬 Pesan</h1>
            : (
              <div className="flex items-center gap-3">
                <button onClick={() => { setActiveChat(null); setActiveChatName(''); }} className="p-2 hover:bg-gray-100 rounded-xl">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">{conversations.find(c => c.id === activeChat)?.avatar || '👤'}</div>
                  <div><h2 className="font-bold text-sm text-gray-900">{activeChatName}</h2><p className="text-[10px] text-green-600">Online</p></div>
                </div>
              </div>
            )
          }
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {!activeChat ? (
          <div className="p-4">
            {/* Search Bar */}
            <div className="mb-4">
              <input type="text" placeholder="🔍 Cari pengguna..." value={searchUser} onChange={(e) => setSearchUser(e.target.value)} className="w-full p-3 bg-white border rounded-xl outline-none text-gray-900" />
            </div>

            {/* User List */}
            {filteredUsers.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border-2 border-dashed">
                <p className="text-6xl mb-4">👥</p>
                <p className="text-gray-500 font-bold mb-2">{searchUser ? 'Tidak ditemukan' : 'Belum ada pengguna lain'}</p>
                <p className="text-gray-400 text-sm">{searchUser ? 'Coba kata kunci lain' : 'Invite teman untuk mulai chat'}</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                {filteredUsers.map((convo, index) => {
                  const count = unreadCounts[convo.uid] || 0;
                  return (
                    <button key={`${convo.uid}-${index}`} onClick={() => openChat(convo.uid, convo.name)} className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition border-b last:border-b-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-xl flex-shrink-0">
                        {convo.avatar === '👤' ? '👤' : <img src={convo.avatar} className="w-full h-full rounded-full" />}
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                          {convo.name}
                          {/* Badge WhatsApp Style */}
                          {count > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                              {count}
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-gray-500">{convo.email || convo.lastMessage}</p>
                      </div>
                      <span className="text-xs text-blue-600 font-bold">Chat →</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Info Card */}
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mt-4">
              <h3 className="font-bold text-sm text-blue-900 mb-2">💡 Cara Pakai Chat</h3>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>1. Pilih pengguna di atas</li>
                <li>2. Ketik pesan & tekan Enter atau tombol kirim</li>
                <li>3. Bisa kirim emoji 😀 dan file 📎 (maks 10MB)</li>
                <li>4. Badge merah = pesan belum dibaca</li>
              </ul>
              {chatError && <div className="mt-3 p-3 bg-red-50 rounded-xl text-xs text-red-800 whitespace-pre-line">{chatError}</div>}
            </div>
          </div>
        ) : (
          // CHAT WINDOW
          <div className="flex flex-col h-[calc(100vh-160px)] md:h-[calc(100vh-120px)]">
            {chatError && <div className="bg-red-50 border-b border-red-200 p-3"><p className="text-xs text-red-700 whitespace-pre-line">{chatError}</p></div>}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.length === 0 && !chatError ? (
                <div className="text-center py-20"><p className="text-6xl mb-4">👋</p><p className="text-gray-500 font-bold mb-2">Mulai Percakapan</p><p className="text-gray-400 text-sm">Ketik pesan di bawah untuk mulai chat</p></div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === user.uid;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] p-3 rounded-2xl ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-900 border rounded-bl-none'}`}>
                        {!isMe && <p className="text-[10px] text-gray-500 mb-1">{msg.senderName}</p>}
                        
                        {/* Tampilkan File/Image */}
                        {msg.fileUrl && (
                          <div className="mb-2">
                            {msg.fileType === 'image' ? (
                              <img src={msg.fileUrl} alt="Lampiran" className="rounded-lg max-h-60 w-auto object-contain" />
                            ) : (
                              <a href={msg.fileUrl} target="_blank" rel="noreferrer" className={`text-xs underline block mb-2 p-2 bg-white/20 rounded ${isMe ? 'text-blue-200' : 'text-blue-600'}`}>📄 Download File</a>
                            )}
                          </div>
                        )}

                        <p className="text-sm">{msg.text}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                          {msg.createdAt?.toDate?.().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) || 'Baru saja'}
                          {isMe && msg.read && <span className="ml-1">✓✓</span>}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t p-3 safe-area-bottom relative">
              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="absolute bottom-20 left-2 right-2 bg-white border rounded-xl shadow-xl p-3 grid grid-cols-8 gap-1 max-h-48 overflow-y-auto z-50">
                  {emojis.map((emoji) => (
                    <button key={emoji} onClick={() => { setNewMessage(prev => prev + emoji); setShowEmojiPicker(false); }} className="text-2xl hover:bg-gray-100 p-2 rounded transition">{emoji}</button>
                  ))}
                </div>
              )}

              <div className="flex gap-2 items-end">
                {/* Emoji Button */}
                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-3 text-gray-500 hover:bg-gray-100 rounded-xl text-xl">😀</button>

                {/* File Upload Button */}
                <label className={`p-3 text-gray-500 hover:bg-gray-100 rounded-xl cursor-pointer text-xl ${uploadingFile ? 'animate-pulse' : ''}`}>
                  <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploadingFile} />
                  📎
                </label>

                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={uploadingFile ? "Sedang upload..." : "Ketik pesan..."}
                  rows={1}
                  className="flex-1 p-3 bg-gray-50 rounded-xl outline-none text-gray-900 resize-none max-h-32"
                />
                
                <button onClick={() => handleSendMessage()} disabled={!newMessage.trim() && !uploadingFile} className="px-4 py-3 bg-blue-600 text-white rounded-xl font-bold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
