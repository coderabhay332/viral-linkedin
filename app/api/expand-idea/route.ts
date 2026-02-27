export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { callPerplexity } from '@/lib/perplexity';
import { buildExpandPrompt } from '@/lib/context-engine';
import { checkUsageLimit, logUsage } from '@/lib/usage';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const supabase = createServerSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userId = session.user.id;
        const usageCheck = await checkUsageLimit(userId, 'expand');
        if (!usageCheck.allowed) {
            if (usageCheck.limit === 0) {
                return NextResponse.json(
                    { error: 'Feature not available on Free plan', message: 'Upgrade to Pro or Agency.', plan: usageCheck.plan },
                    { status: 403 }
                );
            }
            return NextResponse.json(
                { error: 'Daily expansion limit reached', used: usageCheck.used, limit: usageCheck.limit, plan: usageCheck.plan },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { hook, angle, story_direction, cta } = body;
        if (!hook || !angle || !story_direction || !cta) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data: profile } = await supabaseAdmin.from('user_profiles').select('tone_preference').eq('user_id', userId).single();
        const tone = profile?.tone_preference || 'Inspirational';

        const prompt = buildExpandPrompt({ hook, angle, story_direction, cta }, tone);
        const { content, tokensUsed } = await callPerplexity(prompt, 2048, 0.7);
        await logUsage(userId, 'expand', tokensUsed);

        return NextResponse.json({ post: content.trim() });
    } catch (error) {
        console.error('Expand idea error:', error);
        return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
    }
}
