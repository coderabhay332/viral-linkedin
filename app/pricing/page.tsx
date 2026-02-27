'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Zap, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';

const PLANS = [
    {
        key: 'free',
        name: 'Free',
        price: 0,
        billing: null,
        description: 'Perfect for getting started',
        features: [
            '1 idea generation per day',
            '2 reframes per day',
            'Basic idea cards',
            'Idea history (7 days)',
        ],
        unavailable: ['Expand to full posts', 'Team features'],
        cta: 'Get Started Free',
        href: '/signup',
        highlight: false,
    },
    {
        key: 'pro',
        name: 'Pro',
        price: 19,
        billing: '/month',
        description: 'For consistent content creators',
        features: [
            '5 idea generations per day',
            'Unlimited reframes',
            '✨ Expand ideas to full posts',
            'Idea history (30 days)',
            'Priority support',
        ],
        unavailable: ['Team features'],
        cta: 'Start Pro',
        href: null,
        highlight: true,
    },
    {
        key: 'agency',
        name: 'Agency',
        price: 49,
        billing: '/month',
        description: 'For agencies and power users',
        features: [
            '15 idea generations per day',
            'Unlimited reframes',
            '✨ Expand ideas to full posts',
            'Idea history (90 days)',
            'Team features (coming soon)',
            'Priority support',
        ],
        unavailable: [],
        cta: 'Start Agency',
        href: null,
        highlight: false,
    },
];

export default function PricingPage() {
    const { toast } = useToast();
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const supabase = createBrowserSupabaseClient();

    const checkout = async (planKey: string) => {
        setLoadingPlan(planKey);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast({ title: 'Please log in first', description: 'You need an account to subscribe.', variant: 'destructive' });
                return;
            }

            const res = await fetch('/api/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: planKey }),
            });

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                toast({ title: 'Checkout failed', description: data.error, variant: 'destructive' });
            }
        } catch {
            toast({ title: 'Network error', variant: 'destructive' });
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0F1E]">
            {/* Glow */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 rounded-full blur-3xl" />
            </div>

            {/* Nav */}
            <header className="border-b border-white/8 sticky top-0 z-50 backdrop-blur-md bg-[#0A0F1E]/80">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-white">IdeaLinked</span>
                    </Link>
                    <Link href="/dashboard">
                        <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm">
                            Back to Dashboard
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Hero */}
            <section className="text-center py-16 relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/15 border border-blue-500/20 text-blue-300 text-sm font-medium mb-6">
                    <Zap className="w-3.5 h-3.5" /> Simple, transparent pricing
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                    Choose your <span className="gradient-text">content plan</span>
                </h1>
                <p className="text-slate-400 text-lg max-w-xl mx-auto">
                    Generate personalized LinkedIn post ideas every day. Cancel anytime.
                </p>
            </section>

            {/* Plans */}
            <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-24 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.key}
                            className={`rounded-2xl p-8 border flex flex-col relative transition-all ${plan.highlight
                                    ? 'bg-blue-600/10 border-blue-500/50 shadow-lg shadow-blue-500/10'
                                    : 'bg-white/5 border-white/10 hover:border-white/20'
                                }`}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                                    <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                                        MOST POPULAR
                                    </span>
                                </div>
                            )}

                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-white mb-1">{plan.name}</h2>
                                <p className="text-slate-400 text-sm">{plan.description}</p>
                            </div>

                            <div className="mb-6">
                                <span className="text-4xl font-bold text-white">${plan.price}</span>
                                {plan.billing && <span className="text-slate-400 ml-1">{plan.billing}</span>}
                            </div>

                            <ul className="space-y-3 mb-8 flex-1">
                                {plan.features.map((f) => (
                                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                                        <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                                        {f}
                                    </li>
                                ))}
                                {plan.unavailable.map((f) => (
                                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600 line-through">
                                        <div className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            {plan.href ? (
                                <Link href={plan.href}>
                                    <Button className="w-full h-12 bg-white/10 hover:bg-white/15 text-white border border-white/10 font-semibold">
                                        {plan.cta}
                                    </Button>
                                </Link>
                            ) : (
                                <Button
                                    onClick={() => checkout(plan.key)}
                                    disabled={loadingPlan === plan.key}
                                    className={`w-full h-12 font-semibold ${plan.highlight
                                            ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                            : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                                        }`}
                                >
                                    {loadingPlan === plan.key ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        plan.cta
                                    )}
                                </Button>
                            )}
                        </div>
                    ))}
                </div>

                {/* FAQ */}
                <div className="mt-16 text-center">
                    <p className="text-slate-400 text-sm">
                        All plans include a 7-day money-back guarantee.
                        Questions? <a href="mailto:support@idealinked.com" className="text-blue-400 hover:underline">Contact us</a>
                    </p>
                </div>
            </section>
        </div>
    );
}

