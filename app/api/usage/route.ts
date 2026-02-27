export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getTodayStats } from '@/lib/usage';
import { PLAN_LIMITS } from '@/lib/plans';

export async function GET(req: NextRequest) {
    try {
        const supabase = createServerSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const stats = await getTodayStats(session.user.id);
        const limits = PLAN_LIMITS[stats.plan];

        return NextResponse.json({
            plan: stats.plan,
            generate: { used: stats.generateUsed, limit: limits.ideaGenerations },
            reframe: { used: stats.reframeUsed, limit: limits.reframes },
            expand: { used: stats.expandUsed, limit: limits.expansions },
        });
    } catch (error) {
        console.error('Usage stats error:', error);
        return NextResponse.json({ error: 'Failed to fetch usage stats' }, { status: 500 });
    }
}
