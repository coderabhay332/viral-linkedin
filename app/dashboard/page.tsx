'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { IdeaCard, IdeaCardSkeleton, Idea } from '@/components/IdeaCard';
import { ReframeModal } from '@/components/ReframeModal';
import { UsageBar } from '@/components/UsageBar';
import { Plan } from '@/lib/plans';
import {
    Zap, LogOut, Sparkles, Clock, LayoutDashboard, ChevronLeft, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

interface UsageStats {
    plan: Plan;
    generate: { used: number; limit: number };
    reframe: { used: number; limit: number };
    expand: { used: number; limit: number };
}


export default function DashboardPage() {
    const router = useRouter();
    const { toast } = useToast();
    const supabase = createBrowserSupabaseClient();

    const [profile, setProfile] = useState<Record<string, string> | null>(null);
    const [usage, setUsage] = useState<UsageStats | null>(null);
    const [newIdeas, setNewIdeas] = useState<Idea[]>([]);
    const [historyIdeas, setHistoryIdeas] = useState<Idea[]>([]);
    const [generating, setGenerating] = useState(false);
    const [loadingPage, setLoadingPage] = useState(true);

    const [reframeOpen, setReframeOpen] = useState(false);
    const [activeIdea, setActiveIdea] = useState<Idea | null>(null);
    const [historyPage, setHistoryPage] = useState(0);
    const [historyTotal, setHistoryTotal] = useState(0);
    const [historyLoading, setHistoryLoading] = useState(false);
    const HISTORY_PAGE_SIZE = 9;

    const canReframe = usage ? (usage.reframe.limit === -1 || usage.reframe.used < usage.reframe.limit) : true;
    const atLimit = usage ? (usage.generate.limit !== -1 && usage.generate.used >= usage.generate.limit) : false;

    useEffect(() => {
        loadPage();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadPage = async () => {
        setLoadingPage(true);
        try {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) { router.push('/login'); return; }

            const { data: prof } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', currentUser.id)
                .single();

            if (!prof || !prof.onboarding_complete) { router.push('/onboarding'); return; }
            setProfile(prof);

            await Promise.all([fetchUsage(), fetchHistory(currentUser.id, 0)]);
        } catch {
            toast({ title: 'Failed to load dashboard', variant: 'destructive' });
        } finally {
            setLoadingPage(false);
        }
    };

    const fetchUsage = async () => {
        try {
            const res = await fetch('/api/usage');
            if (res.ok) {
                const data = await res.json();
                setUsage(data);
            }
        } catch { }
    };

    const fetchHistory = useCallback(async (userId: string, page: number) => {
        setHistoryLoading(true);
        const from = page * HISTORY_PAGE_SIZE;
        const to = from + HISTORY_PAGE_SIZE - 1;

        const { data, count } = await supabase
            .from('generated_ideas')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(from, to);

        setHistoryIdeas(data || []);
        setHistoryTotal(count || 0);
        setHistoryLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const generate = async () => {
        setGenerating(true);
        setNewIdeas([]);
        try {
            const res = await fetch('/api/generate-ideas', { method: 'POST' });
            const data = await res.json();

            if (!res.ok) {
                toast({ title: data.error || 'Generation failed', description: data.message, variant: 'destructive' });
                return;
            }

            setNewIdeas(data.ideas);
            await fetchUsage();
            toast({ title: '🎉 5 fresh posts generated!', description: 'Expand any card to see the full post.' });

            // Refresh history with current user
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setHistoryPage(0);
                await fetchHistory(user.id, 0);
            }
        } catch {
            toast({ title: 'Network error', description: 'Check your connection and try again.', variant: 'destructive' });
        } finally {
            setGenerating(false);
        }
    };

    const openReframe = (idea: Idea) => {
        setActiveIdea(idea);
        setReframeOpen(true);
    };

    const handleReframed = (newIdea: Idea) => {
        if (!activeIdea) return;
        setNewIdeas((prev) => prev.map((i) => (i.hook === activeIdea.hook ? newIdea : i)));
        setHistoryIdeas((prev) => prev.map((i) => (i.hook === activeIdea.hook ? { ...i, ...newIdea } : i)));
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (loadingPage) {
        return (
            <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center animate-pulse">
                        <Zap className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-slate-400 text-sm">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0F1E]">
            {/* Background glow */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/6 rounded-full blur-3xl" />
            </div>

            {/* Nav */}
            <header className="sticky top-0 z-50 border-b border-white/8 backdrop-blur-md bg-[#0A0F1E]/80">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Zap className="w-4.5 h-4.5 text-white" />
                        </div>
                        <span className="font-bold text-white text-lg">IdeaLinked</span>
                    </div>

                    <nav className="hidden sm:flex items-center gap-1">
                        <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white text-sm font-medium">
                            <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </Link>
                        <Link href="/pricing" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 text-sm transition">
                            <Zap className="w-4 h-4" /> Pricing
                        </Link>
                    </nav>

                    <div className="flex items-center gap-2">
                        {usage && (
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${usage.plan === 'free' ? 'bg-slate-600/40 text-slate-300' :
                                usage.plan === 'pro' ? 'bg-blue-600/30 text-blue-300' :
                                    'bg-purple-600/30 text-purple-300'
                                }`}>
                                {usage.plan.toUpperCase()}
                            </span>
                        )}
                        <button onClick={signOut} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition" title="Sign out">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 relative z-10">

                {/* Welcome */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white">
                        Good to see you, <span className="gradient-text">{profile?.role || 'Creator'}</span> 👋
                    </h1>
                    <p className="text-slate-400 mt-1.5">
                        {profile?.industry} · {profile?.content_goal} · Tone: {profile?.tone_preference}
                    </p>
                </div>

                {/* Usage Bar */}
                {usage && (
                    <div className="mb-6">
                        <UsageBar used={usage.generate.used} plan={usage.plan} />
                    </div>
                )}

                {/* Generate CTA */}
                <div className="mb-10">
                    <Button
                        onClick={generate}
                        disabled={generating || atLimit}
                        className={`relative h-14 px-8 text-base font-bold rounded-xl transition-all duration-200 ${atLimit
                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg hover:shadow-blue-500/25 animate-glow'
                            }`}
                    >
                        <Sparkles className={`w-5 h-5 mr-2 ${generating ? 'animate-spin' : ''}`} />
                        {atLimit ? 'Daily limit reached — Upgrade for more' : generating ? 'Generating ideas...' : "Generate Today's Ideas"}
                    </Button>
                    {atLimit && (
                        <p className="text-sm text-slate-400 mt-2">
                            <Link href="/pricing" className="text-blue-400 hover:underline">Upgrade your plan</Link> to generate more ideas today.
                        </p>
                    )}
                </div>

                {/* New Ideas */}
                {generating && (
                    <section className="mb-10">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" /> Generating fresh ideas...
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <IdeaCardSkeleton />
                            <IdeaCardSkeleton />
                            <IdeaCardSkeleton />
                        </div>
                    </section>
                )}

                {newIdeas.length > 0 && !generating && (
                    <section className="mb-10">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-blue-400" /> Fresh Ideas
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {newIdeas.map((idea, i) => (
                                <IdeaCard
                                    key={i}
                                    idea={idea}
                                    onReframe={openReframe}
                                    canReframe={canReframe}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Empty state */}
                {newIdeas.length === 0 && !generating && historyIdeas.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="w-8 h-8 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">No ideas yet</h3>
                        <p className="text-slate-400 max-w-sm mx-auto mb-6">
                            Click &ldquo;Generate Today&apos;s Ideas&rdquo; and your personalized LinkedIn content ideas will appear here, ready to write.
                        </p>
                    </div>
                )}

                {/* History */}
                {(historyIdeas.length > 0 || historyTotal > 0) && (
                    <section>
                        {/* Section header */}
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-400" /> All Posts
                                {historyTotal > 0 && (
                                    <span className="text-sm font-normal text-slate-500">({historyTotal} total)</span>
                                )}
                            </h2>

                            {/* Pagination controls */}
                            {historyTotal > HISTORY_PAGE_SIZE && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500">
                                        Page {historyPage + 1} of {Math.ceil(historyTotal / HISTORY_PAGE_SIZE)}
                                    </span>
                                    <button
                                        disabled={historyPage === 0 || historyLoading}
                                        onClick={async () => {
                                            const { data: { user } } = await supabase.auth.getUser();
                                            if (!user) return;
                                            const newPage = historyPage - 1;
                                            setHistoryPage(newPage);
                                            await fetchHistory(user.id, newPage);
                                        }}
                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        title="Previous page"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        disabled={historyPage >= Math.ceil(historyTotal / HISTORY_PAGE_SIZE) - 1 || historyLoading}
                                        onClick={async () => {
                                            const { data: { user } } = await supabase.auth.getUser();
                                            if (!user) return;
                                            const newPage = historyPage + 1;
                                            setHistoryPage(newPage);
                                            await fetchHistory(user.id, newPage);
                                        }}
                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        title="Next page"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Grid */}
                        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity duration-200 ${historyLoading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                            {historyIdeas.map((idea, i) => (
                                <IdeaCard
                                    key={idea.id || i}
                                    idea={idea}
                                    onReframe={openReframe}
                                    canReframe={canReframe}
                                />
                            ))}
                        </div>

                        {/* Bottom pagination (repeated for convenience on long pages) */}
                        {historyTotal > HISTORY_PAGE_SIZE && (
                            <div className="flex items-center justify-center gap-3 mt-6">
                                <button
                                    disabled={historyPage === 0 || historyLoading}
                                    onClick={async () => {
                                        const { data: { user } } = await supabase.auth.getUser();
                                        if (!user) return;
                                        const newPage = historyPage - 1;
                                        setHistoryPage(newPage);
                                        await fetchHistory(user.id, newPage);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" /> Previous
                                </button>
                                <span className="text-sm text-slate-500">
                                    {historyPage + 1} / {Math.ceil(historyTotal / HISTORY_PAGE_SIZE)}
                                </span>
                                <button
                                    disabled={historyPage >= Math.ceil(historyTotal / HISTORY_PAGE_SIZE) - 1 || historyLoading}
                                    onClick={async () => {
                                        const { data: { user } } = await supabase.auth.getUser();
                                        if (!user) return;
                                        const newPage = historyPage + 1;
                                        setHistoryPage(newPage);
                                        await fetchHistory(user.id, newPage);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    Next <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                    </section>
                )}
            </main>

            {/* Modals */}
            <ReframeModal
                idea={activeIdea}
                open={reframeOpen}
                onClose={() => setReframeOpen(false)}
                onReframed={handleReframed}
            />
        </div>
    );
}

