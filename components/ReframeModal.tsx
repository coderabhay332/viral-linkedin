'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Idea } from './IdeaCard';

interface ReframeModalProps {
    idea: Idea | null;
    open: boolean;
    onClose: () => void;
    onReframed: (newIdea: Idea) => void;
}

const TONE_OPTIONS = [
    { label: 'More Bold', value: 'bold and direct', icon: '⚡' },
    { label: 'More Emotional', value: 'emotional and heartfelt', icon: '❤️' },
    { label: 'More Analytical', value: 'analytical and data-driven', icon: '📊' },
    { label: 'Simplified', value: 'simple and easy to understand', icon: '✨' },
    { label: 'Contrarian', value: 'contrarian and debate-sparking', icon: '🔥' },
    { label: 'Carousel Format', value: 'structured for a carousel post with clear steps', icon: '🎠' },
];

export function ReframeModal({ idea, open, onClose, onReframed }: ReframeModalProps) {
    const { toast } = useToast();
    const [selected, setSelected] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleReframe = async () => {
        if (!idea || !selected) return;
        setLoading(true);
        try {
            const res = await fetch('/api/reframe-idea', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idea, newTone: selected }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast({ title: data.error || 'Reframe failed', description: data.message, variant: 'destructive' });
                return;
            }

            onReframed({ ...idea, ...data.idea });
            toast({ title: '✨ Post reframed!', description: 'Your post has been rewritten in the new tone.' });
            onClose();
        } catch {
            toast({ title: 'Network error', description: 'Please check your connection and try again.', variant: 'destructive' });
        } finally {
            setLoading(false);
            setSelected(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-[#111827] border-white/10 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Reframe This Post</DialogTitle>
                    <p className="text-slate-400 text-sm">Choose a tone and get a fully rewritten version of this post.</p>
                </DialogHeader>

                {idea && (
                    <div className="my-2 p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-xs text-slate-400 mb-1">Current hook:</div>
                        <p className="text-sm text-slate-300 italic">&ldquo;{idea.hook}&rdquo;</p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-2 my-2">
                    {TONE_OPTIONS.map((tone) => (
                        <button
                            key={tone.value}
                            onClick={() => setSelected(tone.value)}
                            className={`p-3 rounded-lg border text-left transition-all ${selected === tone.value
                                ? 'bg-blue-600/20 border-blue-500 text-white'
                                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                                }`}
                        >
                            <span className="text-lg mr-2">{tone.icon}</span>
                            <span className="text-sm font-medium">{tone.label}</span>
                        </button>
                    ))}
                </div>

                <div className="flex gap-3 mt-2">
                    <Button onClick={onClose} variant="outline" className="flex-1 border-white/10 bg-white/5 hover:bg-white/10 text-white">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleReframe}
                        disabled={!selected || loading}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reframe ✨'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
