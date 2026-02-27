export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const ADMIN_KEY = process.env.ADMIN_KEY;

function isAdmin(req: NextRequest): boolean {
    const key = req.headers.get('x-admin-key') || req.nextUrl.searchParams.get('key');
    return key === ADMIN_KEY;
}

// GET — fetch all viral posts (used by AI + admin panel)
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl;
        const tone = searchParams.get('tone');
        const category = searchParams.get('category');
        const limit = parseInt(searchParams.get('limit') || '20');

        let query = supabaseAdmin
            .from('viral_posts')
            .select('*')
            .order('likes_count', { ascending: false })
            .limit(limit);

        if (tone) query = query.eq('tone', tone);
        if (category) query = query.eq('category', category);

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json({ posts: data || [] });
    } catch (error) {
        console.error('Viral posts GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch viral posts' }, { status: 500 });
    }
}

// POST — add a new viral post (admin only)
export async function POST(req: NextRequest) {
    if (!isAdmin(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { content, category, tone, likes_count } = await req.json();

        if (!content || content.trim().length < 20) {
            return NextResponse.json({ error: 'Post content is required (min 20 chars)' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin.from('viral_posts').insert({
            content: content.trim(),
            category: category || 'General',
            tone: tone || 'Inspirational',
            likes_count: likes_count || 0,
        }).select().single();

        if (error) throw error;

        return NextResponse.json({ post: data });
    } catch (error) {
        console.error('Viral posts POST error:', error);
        return NextResponse.json({ error: 'Failed to save viral post' }, { status: 500 });
    }
}

// DELETE — remove a viral post (admin only)
export async function DELETE(req: NextRequest) {
    if (!isAdmin(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const id = req.nextUrl.searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

        const { error } = await supabaseAdmin.from('viral_posts').delete().eq('id', id);
        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Viral posts DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete viral post' }, { status: 500 });
    }
}
