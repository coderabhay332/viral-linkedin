import { createServerSupabaseClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code) {
        const supabase = createServerSupabaseClient();
        await supabase.auth.exchangeCodeForSession(code);
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
            const userId = session.user.id;

            const { data: profile } = await supabaseAdmin
                .from('user_profiles').select('id').eq('user_id', userId).single();

            const { data: subscription } = await supabaseAdmin
                .from('subscriptions').select('id').eq('user_id', userId).single();

            if (!subscription) {
                await supabaseAdmin.from('subscriptions').insert({
                    user_id: userId, plan: 'free', status: 'active',
                    created_at: new Date().toISOString(),
                });
            }

            if (!profile) {
                return NextResponse.redirect(new URL('/onboarding', requestUrl.origin));
            }
            return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
        }
    }

    return NextResponse.redirect(new URL('/login', requestUrl.origin));
}
