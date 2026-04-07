"use client";
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';

export default function FeedPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = [
    { id: 'promo', name: 'Promo', emoji: '🎉' },
    { id: 'tips', name: 'Tips', emoji: '💡' },
    { id: 'review', name: 'Review', emoji: '⭐' },
    { id: 'news', name: 'Berita', emoji: '📰' },
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

  const handleSubmitPost = async () => {
    if (!newPost.trim() || !user) return;
    try {
      await addDoc(collection(db, 'feed'), {
        content: newPost,
        category: selectedCategory,
        authorName: user.displayName || 'User',
        authorUid: user.uid,
        createdAt: serverTimestamp(),
        likes: 0
      });
      setNewPost('');
      setSelectedCategory('');
    } catch (err: any) {
      alert(err.message);
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
            <h1 className="font-bold text-lg">Feed</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4 mt-4">
        {/* Create Post */}
        {user && (
          <div className="bg-white p-4 rounded-2xl shadow-sm border">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Apa yang ingin Anda bagikan?"
              className="w-full p-3 bg-gray-50 rounded-xl outline-none text-gray-900 resize-none mb-3"
              rows={3}
            />
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
              disabled={!newPost.trim()}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl disabled:bg-gray-300"
            >
              Posting
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
          posts.map((post) => (
            <div key={post.id} className="bg-white p-4 rounded-2xl shadow-sm border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {post.authorName?.charAt(0) || 'U'}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm text-gray-900">{post.authorName}</h3>
                  <p className="text-xs text-gray-500">{post.createdAt?.toDate?.().toLocaleString('id-ID') || 'Baru saja'}</p>
                </div>
                {post.category && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                    {categories.find(c => c.id === post.category)?.emoji} {categories.find(c => c.id === post.category)?.name}
                  </span>
                )}
              </div>
              <p className="text-gray-800 text-sm leading-relaxed">{post.content}</p>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
