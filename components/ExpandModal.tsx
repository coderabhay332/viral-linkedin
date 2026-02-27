'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Idea } from './IdeaCard';

interface ExpandModalProps {
    idea: Idea | null;
    open: boolean;
    onClose: () => void;
}

export function ExpandModal({ idea, open, onClose }: ExpandModalProps) {
    const { toast } = useToast();
    const [post, setPost] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (open && idea) {
            generatePost();
        } else {
            setPost('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, idea]);

    const generatePost = async () => {
        if (!idea) return;
        setLoading(true);
        setPost('');
        try {
            const res = await fetch('/api/expand-idea', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hook: idea.hook,
                    angle: idea.angle,
                    story_direction: idea.story_direction,
                    cta: idea.cta,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast({ title: data.error || 'Expansion failed', description: data.message, variant: 'destructive' });
                onClose();
                return;
            }

            setPost(data.post);
        } catch {
            toast({ title: 'Network error', description: 'Please try again.', variant: 'destructive' });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const copy = () => {
        navigator.clipboard.writeText(post);
        setCopied(true);
        toast({ title: '✅ Copied to clipboard!', description: 'Your post is ready to paste into LinkedIn.' });
        setTimeout(() => setCopied(false), 3000);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-[#111827] border-white/10 text-white max-w-xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Full LinkedIn Post</DialogTitle>
                    <p className="text-slate-400 text-sm">Ready to copy and paste into LinkedIn.</p>
                </DialogHeader>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                        </div>
                        <p className="text-slate-400 text-sm">Writing your post...</p>
                    </div>
                ) : post ? (
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 whitespace-pre-wrap text-slate-200 text-sm leading-relaxed min-h-[200px]">
                            {post}
                        </div>
                        <div className="flex gap-3">
                            <Button onClick={onClose} variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white">
                                Close
                            </Button>
                            <Button onClick={generatePost} variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-slate-300">
                                <Loader2 className="w-4 h-4 mr-1.5" /> Regenerate
                            </Button>
                            <Button onClick={copy} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold">
                                {copied ? (
                                    <><Check className="w-4 h-4 mr-2" /> Copied!</>
                                ) : (
                                    <><Copy className="w-4 h-4 mr-2" /> Copy to Clipboard</>
                                )}
                            </Button>
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
