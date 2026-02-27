export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { callPerplexity, safeParseJSON } from '@/lib/perplexity';
import { buildReframePrompt } from '@/lib/context-engine';
import { checkUsageLimit, logUsage } from '@/lib/usage';

export async function POST(req: NextRequest) {
    try {
        const supabase = createServerSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userId = session.user.id;
        const usageCheck = await checkUsageLimit(userId, 'reframe');
        if (!usageCheck.allowed) {
            return NextResponse.json(
                {
                    error: 'Daily reframe limit reached',
                    message: `You've used all ${usageCheck.limit} reframes for today.`,
                    used: usageCheck.used, limit: usageCheck.limit, plan: usageCheck.plan,
                },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { idea, newTone } = body;
        if (!idea?.hook || !idea?.full_post || !newTone) {
            return NextResponse.json({ error: 'Missing required fields: idea (with hook and full_post), newTone' }, { status: 400 });
        }

        const prompt = buildReframePrompt(idea, newTone);
        const { content, tokensUsed } = await callPerplexity(prompt, 4000, 0.9);
        const parsed = safeParseJSON<any>(content);
        if (!parsed || !parsed.full_post) {
            return NextResponse.json({ error: 'Failed to parse reframe response.' }, { status: 500 });
        }

        await logUsage(userId, 'reframe', tokensUsed);
        return NextResponse.json({ idea: parsed });
    } catch (error) {
        console.error('Reframe error:', error);
        return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
    }
}
