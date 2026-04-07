"use client";
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, increment } from 'firebase/firestore';
import Link from 'next/link';

export default function FeedPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);

  const categories = [
    { id: 'promo', name: 'Promo', emoji: '🎉' },
    { id: 'tips', name: 'Tips', emoji: '💡' },
    { id: 'review', name: 'Review', emoji: '⭐' },
    { id: 'news', name: 'Berita', emoji: '📰' },
    { id: 'showcase', name: 'Showcase', emoji: '📸' },
  ];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'feed'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPosts(data);
    });
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitPost = async () => {
    if ((!newPost.trim() && !image) || !user) return;
    
    setUploading(true);
    try {
      let imageUrl = '';
      
      // Upload gambar jika ada
      if (image) {
        const formData = new FormData();
        formData.append('file', image);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        imageUrl = data.url;
      }

      await addDoc(collection(db, 'feed'), {
        content: newPost,
        imageUrl,
        category: selectedCategory,
        authorName: user.displayName || 'User',
        authorUid: user.uid,
        authorAvatar: user.photoURL || '',
        createdAt: serverTimestamp(),
        likes: 0,
        likedBy: []
      });
      
      setNewPost('');
      setSelectedCategory('');
      setImage(null);
      setImagePreview('');
    } catch (err: any) {
      alert('Gagal posting: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleLike = async (postId: string, likedBy: string[] = []) => {
    if (!user) return;
    
    const postRef = doc(db, 'feed', postId);
    const hasLiked = likedBy.includes(user.uid);
    
    if (hasLiked) {
      // Unlike
      await updateDoc(postRef, {
        likes: increment(-1),
        likedBy: likedBy.filter((uid: string) => uid !== user.uid)
      });
    } else {
      // Like
      await updateDoc(postRef, {
        likes: increment(1),
        likedBy: [...likedBy, user.uid]
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Hapus postingan ini?')) return;
    
    try {
      await deleteDoc(doc(db, 'feed', postId));
    } catch (err: any) {
      alert('Gagal hapus: ' + err.message);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40 safe-area-top">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 hover:bg-gray-100 rounded-xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </Link>
            <h1 className="font-bold text-lg">📱 Feed Komunitas</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4 mt-4">
        {/* Create Post */}
        {user && (
          <div className="bg-white p-4 rounded-2xl shadow-sm border">
            <h2 className="font-bold text-sm mb-3">✨ Buat Postingan Baru</h2>
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Apa yang ingin Anda bagikan?"
              className="w-full p-3 bg-gray-50 rounded-xl outline-none text-gray-900 resize-none mb-3"
              rows={3}
            />
            
            {/* Image Preview */}
            {imagePreview && (
              <div className="relative mb-3">
                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                <button
                  onClick={() => { setImage(null); setImagePreview(''); }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Image Upload */}
            <div className="mb-3">
              <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl cursor-pointer hover:bg-blue-100 transition text-sm font-bold">
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                📸 Upload Gambar
              </label>
            </div>

            {/* Categories */}
            <div className="flex gap-2 mb-3 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${selectedCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  {cat.emoji} {cat.name}
                </button>
              ))}
            </div>

            <button
              onClick={handleSubmitPost}
              disabled={(!newPost.trim() && !image) || uploading}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl disabled:bg-gray-300"
            >
              {uploading ? 'Uploading...' : 'Posting'}
            </button>
          </div>
        )}

        {/* Feed Posts */}
        {posts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed">
            <p className="text-6xl mb-4">📝</p>
            <p className="text-gray-400 font-bold">Belum ada postingan</p>
            <p className="text-gray-400 text-sm mt-2">Jadilah yang pertama posting!</p>
          </div>
        ) : (
          posts.map((post) => {
            const hasLiked = post.likedBy?.includes(user?.uid);
            
            return (
              <div key={post.id} className="bg-white p-4 rounded-2xl shadow-sm border">
                {/* Author Info */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {post.authorAvatar ? (
                      <img src={post.authorAvatar} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      post.authorName?.charAt(0) || 'U'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-gray-900 truncate">{post.authorName}</h3>
                    <p className="text-xs text-gray-500">{post.createdAt?.toDate?.().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) || 'Baru saja'}</p>
                  </div>
                  {post.category && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex-shrink-0">
                      {categories.find(c => c.id === post.category)?.emoji} {categories.find(c => c.id === post.category)?.name}
                    </span>
                  )}
                  {post.authorUid === user?.uid && (
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition"
                    >
                      🗑️
                    </button>
                  )}
                </div>

                {/* Content */}
                <p className="text-gray-800 text-sm leading-relaxed mb-3">{post.content}</p>

                {/* Image */}
                {post.imageUrl && (
                  <img src={post.imageUrl} alt="Post" className="w-full rounded-xl mb-3" />
                )}

                {/* Like Button */}
                {user && (
                  <div className="flex items-center gap-4 pt-3 border-t">
                    <button
                      onClick={() => handleLike(post.id, post.likedBy || [])}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full transition ${hasLiked ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-red-50'}`}
                    >
                      {hasLiked ? '❤️' : '🤍'} <span className="text-sm font-bold">{post.likes || 0}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
