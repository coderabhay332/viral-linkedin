'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Copy, Check, ChevronDown, ChevronUp, Linkedin } from 'lucide-react';

export interface Idea {
    id?: string;
    hook: string;
    angle: string;
    format: string;
    full_post?: string;       // new records
    story_direction?: string; // old records fallback
    cta?: string;             // old records fallback
}

interface IdeaCardProps {
    idea: Idea;
    onReframe: (idea: Idea) => void;
    canReframe: boolean;
}

const formatColors: Record<string, string> = {
    'Story': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'List': 'bg-green-500/20 text-green-300 border-green-500/30',
    'Numbered List': 'bg-green-500/20 text-green-300 border-green-500/30',
    'Contrarian Take': 'bg-red-500/20 text-red-300 border-red-500/30',
    'Lesson': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    'Data Point': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'Before & After': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
};

export function IdeaCard({ idea, onReframe, canReframe }: IdeaCardProps) {
    const [showFullPost, setShowFullPost] = useState(false);
    const [copiedHook, setCopiedHook] = useState(false);
    const [copiedPost, setCopiedPost] = useState(false);

    const badgeClass = formatColors[idea.format] || 'bg-slate-500/20 text-slate-300 border-slate-500/30';

    const handleCopyHook = () => {
        navigator.clipboard.writeText(idea.hook);
        setCopiedHook(true);
        setTimeout(() => setCopiedHook(false), 2000);
    };

    // Use full_post if available, fall back to old story_direction + cta for legacy records
    const postContent = (idea as any).full_post
        || [
            (idea as any).story_direction,
            (idea as any).cta ? `\n\n${(idea as any).cta}` : '',
        ].filter(Boolean).join('') || '';
    const hasContent = postContent.trim().length > 0;

    const handleCopyPost = () => {
        navigator.clipboard.writeText(postContent);
        setCopiedPost(true);
        setTimeout(() => setCopiedPost(false), 2000);
    };

    // Render the post body with proper paragraph breaks
    const renderPost = (text: string) =>
        (text || '').split('\n\n').map((para, i) => (
            <p key={i} className="text-slate-200 text-sm leading-relaxed">
                {para}
            </p>
        ));

    return (
        <div className="glass-card flex flex-col transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07]">
            {/* Card Header */}
            <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                    <Badge className={`text-xs font-medium px-2.5 py-0.5 border shrink-0 ${badgeClass}`}>
                        {idea.format}
                    </Badge>
                    <button
                        onClick={handleCopyHook}
                        className="text-slate-500 hover:text-slate-300 transition-colors p-1 shrink-0"
                        title="Copy hook"
                    >
                        {copiedHook
                            ? <Check className="w-3.5 h-3.5 text-green-400" />
                            : <Copy className="w-3.5 h-3.5" />}
                    </button>
                </div>

                {/* Hook */}
                <p className="text-white font-semibold text-base leading-snug">
                    &ldquo;{idea.hook}&rdquo;
                </p>

                {/* Angle */}
                <p className="text-slate-400 text-sm leading-relaxed">{idea.angle}</p>
            </div>

            {/* Toggle button — shown whenever readable content exists */}
            {hasContent && (
                <button
                    onClick={() => setShowFullPost(!showFullPost)}
                    className="mx-5 mb-4 flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition-all duration-200"
                >
                    <span>{showFullPost ? 'Hide full post' : 'View full post'}</span>
                    {showFullPost
                        ? <ChevronUp className="w-3.5 h-3.5 opacity-60" />
                        : <ChevronDown className="w-3.5 h-3.5 opacity-60" />}
                </button>
            )}

            {/* Full post expandable section */}
            {showFullPost && (
                <div className="mx-5 mb-4 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                    {/* Post content */}
                    <div className="p-4 space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        {renderPost(postContent)}
                    </div>

                    {/* Copy full post button */}
                    <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between gap-3">
                        <span className="text-xs text-slate-500">Ready to copy-paste into LinkedIn</span>
                        <Button
                            onClick={handleCopyPost}
                            size="sm"
                            className={`text-xs h-8 gap-1.5 transition-all duration-200 ${copiedPost
                                ? 'bg-green-600/20 border border-green-500/30 text-green-300'
                                : 'bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-300'
                                }`}
                        >
                            {copiedPost
                                ? <><Check className="w-3 h-3" /> Copied!</>
                                : <><Linkedin className="w-3 h-3" /> Copy Post</>}
                        </Button>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="px-5 pb-5 mt-auto">
                <Button
                    onClick={() => onReframe(idea)}
                    disabled={!canReframe}
                    size="sm"
                    variant="outline"
                    className="w-full bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white text-xs h-8 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <RefreshCw className="w-3 h-3 mr-1.5" /> Reframe in Different Tone
                </Button>
            </div>
        </div>
    );
}

// Skeleton version for loading state
export function IdeaCardSkeleton() {
    return (
        <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
                <div className="skeleton h-5 w-24 rounded-full" />
                <div className="skeleton h-5 w-5 rounded" />
            </div>
            <div className="space-y-2">
                <div className="skeleton h-5 w-full rounded" />
                <div className="skeleton h-5 w-4/5 rounded" />
            </div>
            <div className="space-y-1.5">
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-4 w-3/4 rounded" />
            </div>
            <div className="skeleton h-9 w-full rounded-lg" />
            <div className="skeleton h-8 w-full rounded-lg" />
        </div>
    );
}
