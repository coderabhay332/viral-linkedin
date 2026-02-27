export type Plan = 'free' | 'pro' | 'agency';

export interface PlanLimits {
    ideaGenerations: number;
    reframes: number;
    expansions: number; // -1 = unlimited
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
    free: {
        ideaGenerations: -1, // unlimited
        reframes: 2,
        expansions: 0,
    },
    pro: {
        ideaGenerations: -1, // unlimited
        reframes: -1, // unlimited
        expansions: -1, // unlimited
    },
    agency: {
        ideaGenerations: -1, // unlimited
        reframes: -1, // unlimited
        expansions: -1, // unlimited
    },
};

export const PLAN_PRICES = {
    free: {
        name: 'Free',
        price: 0,
        description: 'Get started with daily idea generation',
        features: [
            'Unlimited idea generations',
            '2 reframes per day',
            'Basic idea cards',
            'Idea history (7 days)',
        ],
        cta: 'Get Started Free',
        priceId: null,
    },
    pro: {
        name: 'Pro',
        price: 19,
        description: 'For serious content creators',
        features: [
            'Unlimited idea generations',
            'Unlimited reframes',
            'Expand ideas to full posts',
            'Idea history (30 days)',
            'Priority support',
        ],
        cta: 'Start Pro',
        priceId: process.env.STRIPE_PRO_PRICE_ID,
    },
    agency: {
        name: 'Agency',
        price: 49,
        description: 'For agencies and power users',
        features: [
            'Unlimited idea generations',
            'Unlimited reframes',
            'Unlimited expansions',
            'Idea history (90 days)',
            'Team features (coming soon)',
            'Priority support',
        ],
        cta: 'Start Agency',
        priceId: process.env.STRIPE_AGENCY_PRICE_ID,
    },
};
