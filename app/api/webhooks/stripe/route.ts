export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_placeholder');

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
        console.error('Stripe webhook signature verification failed:', err);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.userId;
                const plan = session.metadata?.plan as 'pro' | 'agency';

                if (!userId || !plan) break;

                await supabaseAdmin.from('subscriptions').upsert(
                    {
                        user_id: userId,
                        plan,
                        stripe_customer_id: session.customer as string,
                        stripe_subscription_id: session.subscription as string,
                        status: 'active',
                        current_period_end: null,
                        created_at: new Date().toISOString(),
                    },
                    { onConflict: 'user_id' }
                );
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                // Find user by customer id
                const { data: sub } = await supabaseAdmin
                    .from('subscriptions')
                    .select('user_id')
                    .eq('stripe_customer_id', customerId)
                    .single();

                if (sub) {
                    await supabaseAdmin
                        .from('subscriptions')
                        .update({
                            status: subscription.status,
                            current_period_end: (subscription as any).current_period_end
                                ? new Date((subscription as any).current_period_end * 1000).toISOString()
                                : null,
                        })
                        .eq('stripe_customer_id', customerId);
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                await supabaseAdmin
                    .from('subscriptions')
                    .update({ status: 'canceled', plan: 'free' })
                    .eq('stripe_customer_id', customerId);
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook handler error:', error);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }
}

