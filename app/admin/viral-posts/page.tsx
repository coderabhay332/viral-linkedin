'use client';

import { useState, useEffect } from 'react';
import { Loader2, Trash2, Plus, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ViralPost {
    id: string;
    content: string;
    category: string;
    tone: string;
    likes_count: number;
    created_at: string;
}

const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || '';

const CATEGORIES = ['General', 'Tech', 'Marketing', 'Finance', 'Healthcare', 'Coaching', 'SaaS', 'Other'];
const TONES = ['Bold', 'Inspirational', 'Analytical', 'Storytelling', 'Contrarian'];

export default function AdminViralPostsPage() {
    const [authed, setAuthed] = useState(false);
    const [keyInput, setKeyInput] = useState('');
    const [authError, setAuthError] = useState('');

    const [posts, setPosts] = useState<ViralPost[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    const [newPost, setNewPost] = useState({
        content: '',
        category: 'General',
        tone: 'Inspirational',
        likes_count: 0,
    });

    const login = () => {
        if (keyInput === ADMIN_KEY) {
            setAuthed(true);
            setAuthError('');
        } else {
            setAuthError('Invalid admin key');
        }
    };

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/viral-posts');
            const data = await res.json();
            setPosts(data.posts || []);
        } catch {
            console.error('Failed to fetch posts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authed) fetchPosts();
    }, [authed]);

    const addPost = async () => {
        if (!newPost.content.trim() || newPost.content.trim().length < 20) return;
        setSaving(true);
        try {
            const res = await fetch('/api/viral-posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': ADMIN_KEY,
                },
                body: JSON.stringify(newPost),
            });
            if (res.ok) {
                setNewPost({ content: '', category: 'General', tone: 'Inspirational', likes_count: 0 });
                await fetchPosts();
            }
        } finally {
            setSaving(false);
        }
    };

    const deletePost = async (id: string) => {
        setDeleting(id);
        try {
            await fetch(`/api/viral-posts?id=${id}`, {
                method: 'DELETE',
                headers: { 'x-admin-key': ADMIN_KEY },
            });
            setPosts(prev => prev.filter(p => p.id !== id));
        } finally {
            setDeleting(null);
        }
    };

    // ── Auth gate ──────────────────────────────────────────────
    if (!authed) {
        return (
            <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center p-4">
                <div className="w-full max-w-sm">
                    <div className="text-center mb-8">
                        <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <Shield className="w-6 h-6 text-blue-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Admin Access</h1>
                        <p className="text-slate-400 text-sm mt-1">Enter your admin key to continue</p>
                    </div>
                    <input
                        type="password"
                        value={keyInput}
                        onChange={e => setKeyInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && login()}
                        placeholder="Admin key"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 mb-3"
                    />
                    {authError && <p className="text-red-400 text-sm mb-3">{authError}</p>}
                    <Button onClick={login} className="w-full bg-blue-600 hover:bg-blue-500 text-white">
                        Enter
                    </Button>
                </div>
            </div>
        );
    }

    // ── Admin panel ────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#0A0F1E] p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Viral Post Library</h1>
                        <p className="text-slate-400 text-sm">Posts added here are used as style references by the AI</p>
                    </div>
                </div>

                {/* Add new post */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
                    <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-blue-400" /> Add New Viral Post
                    </h2>
                    <textarea
                        value={newPost.content}
                        onChange={e => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Paste the viral LinkedIn post content here..."
                        rows={6}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition resize-none mb-4"
                    />
                    <div className="flex flex-wrap gap-3 mb-4">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1.5">Category</label>
                            <select
                                value={newPost.category}
                                onChange={e => setNewPost(prev => ({ ...prev, category: e.target.value }))}
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                            >
                                {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0A0F1E]">{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1.5">Tone</label>
                            <select
                                value={newPost.tone}
                                onChange={e => setNewPost(prev => ({ ...prev, tone: e.target.value }))}
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                            >
                                {TONES.map(t => <option key={t} value={t} className="bg-[#0A0F1E]">{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1.5">Likes (approx)</label>
                            <input
                                type="number"
                                value={newPost.likes_count}
                                onChange={e => setNewPost(prev => ({ ...prev, likes_count: parseInt(e.target.value) || 0 }))}
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 w-28"
                                min={0}
                            />
                        </div>
                    </div>
                    <Button
                        onClick={addPost}
                        disabled={saving || newPost.content.trim().length < 20}
                        className="bg-blue-600 hover:bg-blue-500 text-white"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                        Add Post
                    </Button>
                </div>

                {/* Post list */}
                <div>
                    <h2 className="text-white font-semibold mb-4">
                        Reference Library <span className="text-slate-500 text-sm font-normal ml-1">({posts.length} posts)</span>
                    </h2>

                    {loading ? (
                        <div className="text-center py-12 text-slate-400">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                            Loading posts...
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
                            <p className="text-slate-500">No viral posts added yet.</p>
                            <p className="text-slate-600 text-sm mt-1">Add your first post above to start building the reference library.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {posts.map(post => (
                                <div key={post.id} className="bg-white/5 border border-white/10 rounded-xl p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-300 font-medium">{post.category}</span>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-600/20 text-purple-300 font-medium">{post.tone}</span>
                                                {post.likes_count > 0 && (
                                                    <span className="text-xs text-slate-500">👍 {post.likes_count.toLocaleString()}</span>
                                                )}
                                            </div>
                                            <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed line-clamp-4">{post.content}</p>
                                        </div>
                                        <button
                                            onClick={() => deletePost(post.id)}
                                            disabled={deleting === post.id}
                                            className="flex-shrink-0 p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition"
                                        >
                                            {deleting === post.id
                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                : <Trash2 className="w-4 h-4" />
                                            }
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
