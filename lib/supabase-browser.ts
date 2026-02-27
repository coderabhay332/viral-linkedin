import { createBrowserClient } from '@supabase/ssr';

// For use in Client Components (browser-side)
// Uses @supabase/ssr which stores session in cookies (readable by middleware)
export function createBrowserSupabaseClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}
