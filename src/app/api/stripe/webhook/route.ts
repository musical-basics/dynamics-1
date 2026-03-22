import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/db/index';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;

      if (userId) {
        // Upgrade user to premium
        await db
          .update(users)
          .set({
            subscriptionTier: 'premium',
            stripeCustomerId: session.customer as string,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));

        console.log(`User ${userId} upgraded to premium`);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Downgrade user to free
      await db
        .update(users)
        .set({
          subscriptionTier: 'free',
          updatedAt: new Date(),
        })
        .where(eq(users.stripeCustomerId, customerId));

      console.log(`Customer ${customerId} downgraded to free`);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
