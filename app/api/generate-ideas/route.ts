export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { callPerplexity, safeParseJSON } from '@/lib/perplexity';
import { buildIdeaPrompt } from '@/lib/context-engine';
import { checkUsageLimit, logUsage } from '@/lib/usage';
import { supabaseAdmin } from '@/lib/supabase';

interface GeneratedIdea {
    hook: string;
    angle: string;
    format: string;
    full_post: string;
}

export async function POST(req: NextRequest) {
    try {
        const supabase = createServerSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userId = session.user.id;

        const usageCheck = await checkUsageLimit(userId, 'generate');
        if (!usageCheck.allowed) {
            return NextResponse.json(
                {
                    error: 'Daily limit reached',
                    message: `You've used all ${usageCheck.limit} idea generations for today. Upgrade your plan for more.`,
                    used: usageCheck.used, limit: usageCheck.limit, plan: usageCheck.plan,
                },
                { status: 403 }
            );
        }

        // Fetch user profile
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('user_profiles').select('*').eq('user_id', userId).single();

        if (profileError || !profile) {
            return NextResponse.json({ error: 'Profile not found. Please complete onboarding first.' }, { status: 400 });
        }

        // Fetch viral post examples matching user tone (fallback to any)
        let viralPostExamples: string[] = [];
        try {
            const { data: viralPosts } = await supabaseAdmin
                .from('viral_posts')
                .select('content')
                .eq('tone', profile.tone_preference)
                .order('likes_count', { ascending: false })
                .limit(3);

            if (viralPosts && viralPosts.length > 0) {
                viralPostExamples = viralPosts.map((p: { content: string }) => p.content);
            } else {
                const { data: anyPosts } = await supabaseAdmin
                    .from('viral_posts')
                    .select('content')
                    .order('likes_count', { ascending: false })
                    .limit(3);
                viralPostExamples = (anyPosts || []).map((p: { content: string }) => p.content);
            }
        } catch { /* non-fatal */ }

        const prompt = buildIdeaPrompt(profile, viralPostExamples);
        const { content, tokensUsed } = await callPerplexity(prompt, 8192, 0.8);

        const parsed = safeParseJSON<{ ideas: GeneratedIdea[] }>(content);
        if (!parsed || !parsed.ideas || !Array.isArray(parsed.ideas)) {
            return NextResponse.json({ error: 'Failed to parse AI response. Please try again.' }, { status: 500 });
        }

        const ideas = parsed.ideas;
        await logUsage(userId, 'generate', tokensUsed);

        const ideaInserts = ideas.map((idea) => ({
            user_id: userId,
            hook: idea.hook,
            angle: idea.angle,
            full_post: idea.full_post,
            format: idea.format,
            tone_used: profile.tone_preference,
            industry_context: profile.industry,
            created_at: new Date().toISOString(),
        }));

        const { error: insertError } = await supabaseAdmin.from('generated_ideas').insert(ideaInserts);
        if (insertError) {
            console.error('Failed to save ideas:', insertError);
            // Still return ideas to the UI — but include the DB error for debugging
            return NextResponse.json({
                ideas,
                usage: { used: usageCheck.used + 1, limit: usageCheck.limit, plan: usageCheck.plan },
                _db_error: insertError.message,
            });
        }

        return NextResponse.json({
            ideas,
            usage: { used: usageCheck.used + 1, limit: usageCheck.limit, plan: usageCheck.plan },
        });
    } catch (error) {
        console.error('Generate ideas error:', error);
        return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 });
    }
}
