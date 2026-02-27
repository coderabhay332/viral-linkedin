'use client';

import { PLAN_LIMITS, Plan } from '@/lib/plans';
import { Zap } from 'lucide-react';
import Link from 'next/link';

interface UsageBarProps {
    used: number;
    plan: Plan;
}

export function UsageBar({ used, plan }: UsageBarProps) {
    const limit = PLAN_LIMITS[plan].ideaGenerations;
    const pct = limit === -1 ? 0 : Math.min((used / limit) * 100, 100);
    const atLimit = limit !== -1 && used >= limit;

    return (
        <div className="glass-card p-4 flex items-center gap-4">
            <div className="flex-1">
                <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm text-slate-300">Today&apos;s idea generations</span>
                    <span className={`text-sm font-semibold ${atLimit ? 'text-red-400' : 'text-white'}`}>
                        {limit === -1 ? `${used} / ∞` : `${used} / ${limit}`}
                    </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${atLimit ? 'bg-red-500' : 'bg-blue-500'}`}
                        style={{ width: limit === -1 ? '0%' : `${pct}%` }}
                    />
                </div>
            </div>
            {plan === 'free' && (
                <Link href="/pricing">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-semibold hover:bg-blue-600/30 transition whitespace-nowrap">
                        <Zap className="w-3 h-3" /> Upgrade
                    </button>
                </Link>
            )}
        </div>
    );
}
