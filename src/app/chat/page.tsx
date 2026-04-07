"use client";
import { useEffect, useState, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, doc, updateDoc, setDoc, where, getDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import Link from 'next/link';

export default function ChatPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chats' | 'groups' | 'contacts'>('chats');
  
  // Chat State
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [activeChatName, setActiveChatName] = useState('');
  const [activeChatType, setActiveChatType] = useState<'private' | 'group'>('private');
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [chatError, setChatError] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // Group State
  const [groups, setGroups] = useState<any[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  // Contact State
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');

  // Quick Chat
  const [showQuickChat, setShowQuickChat] = useState(false);

  const emojis = ['😀', '😂', '😍', '🥰', '😎', '🤔', '👍', '👋', '🔥', '❤️', '🎉', '💯', '🙏', '✨', '✅', '💬', '📦', '🛒', '💰', '📷', '😊', '🤣', '😘', '😜', '🤗', '😇', '🙌', '💪', '👏', '🎊', '🌟', '💫', '⚡', '💥', '🎯', '🏆', '💎', '🌈'];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Load users
  useEffect(() => {
    if (!user) return;
    const loadUsers = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const usersList = usersSnap.docs.map(d => ({ uid: d.id, id: d.id, ...d.data() }));
        setAllUsers(usersList);
        
        // Only show online users or recently active
        const simpleConversations = usersList
          .filter((u: any) => u.uid !== user.uid)
          .map((u: any) => ({
            id: u.uid, name: u.displayName || u.name || 'User',
            avatar: u.photoURL || '👤', lastMessage: 'Klik untuk mulai chat',
            email: u.email || '', uid: u.uid, online: u.online || false
          }));
        setConversations(simpleConversations);
      } catch (error: any) {
        console.error('Error loading users:', error);
      }
    };
    loadUsers();
    
    // Real-time update user status
    const unsubStatus = onSnapshot(collection(db, 'users'), (snap) => {
      const updatedUsers = snap.docs.map(d => ({ uid: d.id, id: d.id, ...d.data() }));
      setAllUsers(updatedUsers);
      setConversations(prev => prev.map(c => {
        const updated = updatedUsers.find(u => u.uid === c.uid);
        return updated ? { ...c, online: updated.online || false, avatar: updated.photoURL || c.avatar } : c;
      }));
    });
    
    return () => unsubStatus();
  }, [user]);

  // Load groups
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'groups'), where('members', 'array-contains', user.uid));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setGroups(list);
    });
  }, [user]);

  // Load messages
  useEffect(() => {
    if (!user || !activeChat) return;
    setChatError('');
    const chatId = activeChatType === 'group' ? activeChat : getChatId(user.uid, activeChat);

    const q = query(collection(db, activeChatType === 'group' ? 'groups' : 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setChatError('');
    }, (error: any) => {
      setChatError('Error loading messages');
    });
    return () => unsub();
  }, [user, activeChat, activeChatType]);

  // Unread count
  useEffect(() => {
    if (!user || conversations.length === 0) return;
    const unsubscribes = conversations.map(convo => {
      if (!convo.uid) return () => {};
      const chatId = getChatId(user.uid, convo.uid);
      const q = query(collection(db, 'chats', chatId, 'messages'), where('receiverId', '==', user.uid), where('read', '==', false));
      return onSnapshot(q, (snap) => {
        setUnreadCounts(prev => ({ ...prev, [convo.uid]: snap.size }));
      }, () => {});
    });
    return () => unsubscribes.forEach(unsub => unsub());
  }, [user, conversations]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const getChatId = (uid1: string, uid2: string) => [uid1, uid2].sort().join('_');

  // Chat Functions
  const openChat = async (uid: string, name: string) => {
    setActiveChat(uid);
    setActiveChatName(name);
    setActiveChatType('private');
    
    const chatId = getChatId(user.uid, uid);
    const q = query(collection(db, 'chats', chatId, 'messages'), where('receiverId', '==', user.uid), where('read', '==', false));
    const snap = await getDocs(q);
    const updates = snap.docs.map(d => updateDoc(doc(db, 'chats', chatId, 'messages', d.id), { read: true }));
    if (updates.length > 0) {
      await Promise.all(updates);
      setUnreadCounts(prev => ({ ...prev, [uid]: 0 }));
    }
  };

  const openGroupChat = async (groupId: string, name: string) => {
    setActiveChat(groupId);
    setActiveChatName(name);
    setActiveChatType('group');
    setActiveGroupId(groupId);
  };

  const handleSendMessage = async (text?: string, fileData?: { url: string, type: string }) => {
    const finalText = text || newMessage;
    if ((!finalText.trim() && !fileData) || !user || !activeChat) return;

    const collectionName = activeChatType === 'group' ? 'groups' : 'chats';
    const chatId = activeChatType === 'group' ? activeChat : getChatId(user.uid, activeChat);
    
    try {
      await addDoc(collection(db, collectionName, chatId, 'messages'), {
        text: fileData ? (finalText.trim() || `Mengirim ${fileData.type}`) : finalText,
        fileUrl: fileData?.url || null,
        fileType: fileData?.type || null,
        senderId: user.uid,
        senderName: user.displayName || 'User',
        receiverId: activeChat,
        read: false,
        createdAt: serverTimestamp()
      });

      if (activeChatType === 'private') {
        await setDoc(doc(db, 'chats', chatId), {
          participants: [user.uid, activeChat],
          lastMessage: finalText,
          lastMessageTime: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      setNewMessage('');
      setShowEmojiPicker(false);
    } catch (err: any) {
      setChatError('Gagal mengirim pesan');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('Ukuran file melebihi 10MB!'); return; }

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
    } finally { setUploadingFile(false); }
  };

  const handleDeleteChat = async () => {
    if (!confirm('Hapus semua history chat ini?')) return;
    const chatId = activeChatType === 'group' ? activeChat : getChatId(user.uid, activeChat);
    const collectionName = activeChatType === 'group' ? 'groups' : 'chats';
    
    try {
      const messagesSnap = await getDocs(collection(db, collectionName, chatId, 'messages'));
      const deletes = messagesSnap.docs.map(d => deleteDoc(doc(db, collectionName, chatId, 'messages', d.id)));
      await Promise.all(deletes);
      setMessages([]);
      alert('History chat berhasil dihapus');
    } catch (err: any) {
      alert('Gagal hapus chat: ' + err.message);
    }
  };

  const handleExportChat = async () => {
    try {
      const chatText = messages.map(m => `[${m.senderName}] ${m.text}`).join('\n');
      const blob = new Blob([chatText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-export-${activeChatName}.txt`;
      a.click();
      
      // Juga kirim via email prompt
      const email = prompt('Masukkan email untuk kirim export:', user.email);
      if (email) {
        window.location.href = `mailto:${email}?subject=Export Chat - ${activeChatName}&body=${encodeURIComponent(chatText)}`;
      }
    } catch (err: any) {
      alert('Gagal export: ' + err.message);
    }
  };

  // Group Functions
  const handleCreateGroup = async () => {
    if (!groupName.trim() || !user) return;
    if (selectedMembers.length < 2) { alert('Pilih minimal 2 anggota'); return; }

    try {
      const members = [user.uid, ...selectedMembers];
      await addDoc(collection(db, 'groups'), {
        name: groupName,
        description: groupDesc,
        members,
        admins: [user.uid],
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        lastMessage: 'Group dibuat',
        lastMessageTime: serverTimestamp()
      });
      setGroupName('');
      setGroupDesc('');
      setSelectedMembers([]);
      setShowCreateGroup(false);
    } catch (err: any) {
      alert('Gagal buat group: ' + err.message);
    }
  };

  const handleAddMembers = async () => {
    if (!activeGroupId || selectedMembers.length === 0) return;
    try {
      await updateDoc(doc(db, 'groups', activeGroupId), {
        members: arrayUnion(...selectedMembers)
      });
      setSelectedMembers([]);
      setShowAddMembers(false);
    } catch (err: any) {
      alert('Gagal tambah anggota: ' + err.message);
    }
  };

  // Contact Functions
  const handleAddFriend = async () => {
    if (!friendEmail.trim()) return;
    try {
      const usersSnap = await getDocs(query(collection(db, 'users'), where('email', '==', friendEmail.toLowerCase())));
      if (usersSnap.empty) { alert('User tidak ditemukan'); return; }
      
      const friendData = usersSnap.docs[0].data();
      alert(`✅ ${friendData.displayName || friendData.name} berhasil ditambahkan!`);
      setShowAddFriend(false);
      setFriendEmail('');
    } catch (err: any) {
      alert('Gagal tambah teman: ' + err.message);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const filteredUsers = conversations.filter(c => 
    c.name.toLowerCase().includes(searchUser.toLowerCase()) || (c.email && c.email.toLowerCase().includes(searchUser.toLowerCase()))
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (!user) return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><p className="text-6xl mb-4">🔒</p><Link href="/login" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold">Login</Link></div></div>;

  return (
    <main className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40 safe-area-top">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          {!activeChat 
            ? (<div className="flex items-center gap-3 w-full">
                <Link href="/" className="p-2 hover:bg-gray-100 rounded-xl">←</Link>
                <h1 className="font-bold text-lg flex-1">💬 Chat</h1>
                <button onClick={() => setShowQuickChat(true)} className="p-2 hover:bg-gray-100 rounded-xl" title="Chat Pintasan">⚡</button>
              </div>)
            : (<div className="flex items-center gap-3">
                <button onClick={() => { setActiveChat(null); setActiveChatName(''); setActiveChatType('private'); }} className="p-2 hover:bg-gray-100 rounded-xl">←</button>
                <div className="flex-1">
                  <h2 className="font-bold text-sm">{activeChatName}</h2>
                  <p className="text-[10px] text-green-600">{activeChatType === 'group' ? `${groups.find(g => g.id === activeChat)?.members?.length || 0} anggota` : 'Online'}</p>
                </div>
                <button onClick={handleDeleteChat} className="p-2 text-red-500 hover:bg-red-50 rounded-xl" title="Hapus Chat">🗑️</button>
                <button onClick={handleExportChat} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl" title="Export Chat">📧</button>
                {activeChatType === 'group' && (
                  <button onClick={() => setShowAddMembers(true)} className="p-2 text-green-500 hover:bg-green-50 rounded-xl" title="Tambah Anggota">➕</button>
                )}
              </div>)
          }
        </div>
      </div>

      {!activeChat ? (
        <div className="max-w-4xl mx-auto p-4">
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-4 bg-white rounded-xl p-2">
            {[
              { id: 'chats', label: '💬 Chat', count: conversations.length },
              { id: 'groups', label: '👥 Group', count: groups.length },
              { id: 'contacts', label: '👤 Teman', count: allUsers.length - 1 }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {tab.label} {tab.count > 0 && <span className="ml-1 text-xs">({tab.count})</span>}
              </button>
            ))}
          </div>

          {/* Chats Tab */}
          {activeTab === 'chats' && (
            <div>
              <div className="mb-4">
                <input type="text" placeholder="🔍 Cari pengguna..." value={searchUser} onChange={(e) => setSearchUser(e.target.value)} className="w-full p-3 bg-white border rounded-xl outline-none text-gray-900" />
              </div>
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed">
                  <p className="text-6xl mb-4">👥</p>
                  <p className="text-gray-500 font-bold mb-2">Belum ada pengguna lain</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                  {filteredUsers.map((convo, index) => {
                    const count = unreadCounts[convo.uid] || 0;
                    return (
                      <button key={`${convo.uid}-${index}`} onClick={() => openChat(convo.uid, convo.name)} className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition border-b last:border-b-0">
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-xl">
                            {convo.avatar === '👤' ? '👤' : <img src={convo.avatar} className="w-full h-full rounded-full" />}
                          </div>
                          {/* Online/Offline Indicator */}
                          <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${convo.online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                            {convo.name}
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${convo.online ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {convo.online ? '🟢 Online' : '⚫ Offline'}
                            </span>
                            {count > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{count}</span>}
                          </h3>
                          <p className="text-xs text-gray-500">{convo.email || convo.lastMessage}</p>
                        </div>
                        <span className="text-xs text-blue-600 font-bold">Chat →</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Groups Tab */}
          {activeTab === 'groups' && (
            <div>
              <button onClick={() => setShowCreateGroup(true)} className="w-full mb-4 bg-blue-600 text-white font-bold py-3 rounded-xl">➕ Buat Group Baru</button>
              {groups.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed">
                  <p className="text-6xl mb-4">👥</p>
                  <p className="text-gray-500 font-bold">Belum ada group</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {groups.map(g => (
                    <button key={g.id} onClick={() => openGroupChat(g.id, g.name)} className="w-full bg-white p-4 rounded-2xl border flex items-center gap-3 hover:bg-gray-50">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl">👥</div>
                      <div className="flex-1 text-left">
                        <h3 className="font-bold text-sm">{g.name}</h3>
                        <p className="text-xs text-gray-500">{g.members?.length || 0} anggota • {g.lastMessage}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Contacts Tab */}
          {activeTab === 'contacts' && (
            <div>
              <button onClick={() => setShowAddFriend(true)} className="w-full mb-4 bg-green-600 text-white font-bold py-3 rounded-xl">➕ Tambah Teman via Email</button>
              <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                {allUsers.filter(u => u.uid !== user.uid).map((u: any) => (
                  <div key={u.uid} className="p-4 flex items-center gap-3 border-b last:border-b-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white">{u.photoURL ? <img src={u.photoURL} className="w-full h-full rounded-full" /> : '👤'}</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-sm">{u.displayName || u.name}</h3>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                    <button onClick={() => openChat(u.uid, u.displayName || u.name)} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold">Chat</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        // Chat Window
        <div className="flex flex-col h-[calc(100vh-160px)] md:h-[calc(100vh-120px)]">
          {chatError && <div className="bg-red-50 border-b border-red-200 p-3"><p className="text-xs text-red-700">{chatError}</p></div>}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center py-20"><p className="text-6xl mb-4">👋</p><p className="text-gray-500 font-bold">Mulai Percakapan</p></div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === user.uid;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-3 rounded-2xl ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-900 border rounded-bl-none'}`}>
                      {!isMe && activeChatType === 'group' && <p className="text-[10px] text-gray-500 mb-1">{msg.senderName}</p>}
                      {msg.fileUrl && (<div className="mb-2">{msg.fileType === 'image' ? <img src={msg.fileUrl} className="rounded-lg max-h-60 w-auto" /> : <a href={msg.fileUrl} target="_blank" className={`text-xs underline block mb-2 ${isMe ? 'text-blue-200' : 'text-blue-600'}`}>📄 Download File</a>}</div>)}
                      <p className="text-sm">{msg.text}</p>
                      <p className={`text-[10px] mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>{msg.createdAt?.toDate?.().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) || 'Baru saja'}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="bg-white border-t p-3 safe-area-bottom relative">
            {showEmojiPicker && (
              <div className="absolute bottom-20 left-2 right-2 bg-white border rounded-xl shadow-xl p-3 grid grid-cols-8 gap-1 max-h-48 overflow-y-auto z-50">
                {emojis.map((emoji) => (<button key={emoji} onClick={() => { setNewMessage(prev => prev + emoji); setShowEmojiPicker(false); }} className="text-2xl hover:bg-gray-100 p-2 rounded">{emoji}</button>))}
              </div>
            )}
            <div className="flex gap-2 items-end">
              <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-3 text-gray-500 hover:bg-gray-100 rounded-xl text-xl">😀</button>
              <label className={`p-3 text-gray-500 hover:bg-gray-100 rounded-xl cursor-pointer text-xl ${uploadingFile ? 'animate-pulse' : ''}`}>
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploadingFile} />📎
              </label>
              <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={handleKeyPress} placeholder={uploadingFile ? "Sedang upload..." : "Ketik pesan..."} rows={1} className="flex-1 p-3 bg-gray-50 rounded-xl outline-none text-gray-900 resize-none max-h-32" />
              <button onClick={() => handleSendMessage()} disabled={!newMessage.trim() && !uploadingFile} className="px-4 py-3 bg-blue-600 text-white rounded-xl font-bold disabled:bg-gray-300">➤</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="font-bold text-lg mb-4">👥 Buat Group Baru</h2>
            <input type="text" placeholder="Nama Group" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl mb-3 text-gray-900" />
            <input type="text" placeholder="Deskripsi (opsional)" value={groupDesc} onChange={(e) => setGroupDesc(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl mb-3 text-gray-900" />
            <p className="text-sm font-bold mb-2">Pilih Anggota:</p>
            <div className="max-h-48 overflow-y-auto mb-4">
              {allUsers.filter(u => u.uid !== user.uid).map((u: any) => (
                <label key={u.uid} className="flex items-center gap-2 p-2 hover:bg-gray-50">
                  <input type="checkbox" checked={selectedMembers.includes(u.uid)} onChange={(e) => setSelectedMembers(e.target.checked ? [...selectedMembers, u.uid] : selectedMembers.filter((id: string) => id !== u.uid))} />
                  <span>{u.displayName || u.name}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreateGroup} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl">Buat</button>
              <button onClick={() => setShowCreateGroup(false)} className="px-4 bg-gray-100 rounded-xl font-bold">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Members Modal */}
      {showAddMembers && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="font-bold text-lg mb-4">➕ Tambah Anggota</h2>
            <div className="max-h-64 overflow-y-auto mb-4">
              {allUsers.filter(u => u.uid !== user.uid && !groups.find(g => g.id === activeGroupId)?.members?.includes(u.uid)).map((u: any) => (
                <label key={u.uid} className="flex items-center gap-2 p-2 hover:bg-gray-50">
                  <input type="checkbox" checked={selectedMembers.includes(u.uid)} onChange={(e) => setSelectedMembers(e.target.checked ? [...selectedMembers, u.uid] : selectedMembers.filter((id: string) => id !== u.uid))} />
                  <span>{u.displayName || u.name}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddMembers} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl">Tambah</button>
              <button onClick={() => { setShowAddMembers(false); setSelectedMembers([]); }} className="px-4 bg-gray-100 rounded-xl font-bold">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Friend Modal */}
      {showAddFriend && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="font-bold text-lg mb-4">👤 Tambah Teman</h2>
            <input type="email" placeholder="Email teman" value={friendEmail} onChange={(e) => setFriendEmail(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl mb-4 text-gray-900" />
            <div className="flex gap-2">
              <button onClick={handleAddFriend} className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl">Tambah</button>
              <button onClick={() => setShowAddFriend(false)} className="px-4 bg-gray-100 rounded-xl font-bold">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Chat Modal */}
      {showQuickChat && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="font-bold text-lg mb-4">⚡ Chat Pintasan</h2>
            <p className="text-sm text-gray-500 mb-3">Pilih user untuk chat langsung</p>
            <div className="max-h-64 overflow-y-auto">
              {allUsers.filter(u => u.uid !== user.uid).map((u: any) => (
                <button key={u.uid} onClick={() => { openChat(u.uid, u.displayName || u.name); setShowQuickChat(false); }} className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 border-b">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white">{u.photoURL ? <img src={u.photoURL} className="w-full h-full rounded-full" /> : '👤'}</div>
                  <div className="text-left"><p className="font-bold text-sm">{u.displayName || u.name}</p><p className="text-xs text-gray-500">{u.email}</p></div>
                </button>
              ))}
            </div>
            <button onClick={() => setShowQuickChat(false)} className="w-full mt-4 bg-gray-100 font-bold py-3 rounded-xl">Tutup</button>
          </div>
        </div>
      )}
    </main>
  );
}
