import { supabaseAdmin } from './supabase';
import { PLAN_LIMITS, Plan } from './plans';

export type ActionType = 'generate' | 'reframe' | 'expand';

const TOKEN_COST_PER_1K = 0.001; // $0.001 per 1k tokens (approximate)

export async function getUserPlan(userId: string): Promise<Plan> {
    try {
        const { data, error } = await supabaseAdmin
            .from('subscriptions')
            .select('plan, status')
            .eq('user_id', userId)
            .eq('status', 'active')
            .single();

        if (error || !data) {
            return 'free';
        }

        return (data.plan as Plan) || 'free';
    } catch {
        return 'free';
    }
}

export async function getDailyUsage(
    userId: string,
    actionType: ActionType
): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { count, error } = await supabaseAdmin
        .from('usage_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('action_type', actionType)
        .gte('created_at', startOfDay.toISOString());

    if (error) return 0;
    return count || 0;
}

export async function checkUsageLimit(
    userId: string,
    actionType: ActionType
): Promise<{ allowed: boolean; used: number; limit: number; plan: Plan }> {
    const plan = await getUserPlan(userId);
    const limits = PLAN_LIMITS[plan];
    const used = await getDailyUsage(userId, actionType);

    let limit: number;
    if (actionType === 'generate') {
        limit = limits.ideaGenerations;
    } else if (actionType === 'reframe') {
        limit = limits.reframes;
    } else {
        limit = limits.expansions;
    }

    // -1 means unlimited
    if (limit === -1) {
        return { allowed: true, used, limit: -1, plan };
    }

    return {
        allowed: used < limit,
        used,
        limit,
        plan,
    };
}

export async function logUsage(
    userId: string,
    actionType: ActionType,
    tokensUsed: number
): Promise<void> {
    const estimatedCost = (tokensUsed / 1000) * TOKEN_COST_PER_1K;

    await supabaseAdmin.from('usage_logs').insert({
        user_id: userId,
        action_type: actionType,
        tokens_used: tokensUsed,
        estimated_cost_usd: estimatedCost,
        created_at: new Date().toISOString(),
    });
}

export async function getTodayStats(
    userId: string
): Promise<{ generateUsed: number; reframeUsed: number; expandUsed: number; plan: Plan }> {
    const plan = await getUserPlan(userId);
    const [generateUsed, reframeUsed, expandUsed] = await Promise.all([
        getDailyUsage(userId, 'generate'),
        getDailyUsage(userId, 'reframe'),
        getDailyUsage(userId, 'expand'),
    ]);

    return { generateUsed, reframeUsed, expandUsed, plan };
}
