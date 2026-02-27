export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// ⚠️ AUTH REMOVED FOR TESTING — restore session check when done
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_ID = 'test-user-id';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_placeholder');

export async function POST(req: NextRequest) {
    try {
        const { plan } = await req.json();
        if (!plan || !['pro', 'agency'].includes(plan)) {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
        }

        const priceId = plan === 'pro' ? process.env.STRIPE_PRO_PRICE_ID : process.env.STRIPE_AGENCY_PRICE_ID;
        if (!priceId) return NextResponse.json({ error: 'Price ID not configured' }, { status: 500 });

        const checkoutSession = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
            customer_email: TEST_USER_EMAIL,
            metadata: { userId: TEST_USER_ID, plan },
        });

        return NextResponse.json({ url: checkoutSession.url });
    } catch (error) {
        console.error('Stripe checkout error:', error);
        return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }
}
