import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createServerClient as _createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://build-placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'build-placeholder-anon-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'build-placeholder-service-key';

// Lazy-initialized admin client — created on first use, not at import time
let _adminClient: SupabaseClient | null = null;
export function getSupabaseAdmin(): SupabaseClient {
    if (!_adminClient) {
        _adminClient = createClient(supabaseUrl, supabaseServiceKey);
    }
    return _adminClient;
}
// Convenience alias — same lazy behavior via Proxy
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
    get(_target, prop) {
        return getSupabaseAdmin()[prop as keyof SupabaseClient];
    },
});

// For use in Server Components / Route Handlers
export function createServerSupabaseClient() {
    const cookieStore = cookies();
    return _createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            get(name: string) { return cookieStore.get(name)?.value; },
        },
    });
}
