import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updateOrderToPaid } from '@/lib/actions/order.actions';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature') as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      await req.text(),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Check for successful payment
  if (event.type === 'charge.succeeded') {
    const charge = event.data.object as Stripe.Charge;

    // Update order status
    await updateOrderToPaid({
      orderId: charge.metadata.orderId,
      paymentResult: {
        id: charge.id,
        status: 'COMPLETED',
        email_address: charge.billing_details.email!,
        pricePaid: (charge.amount / 100).toFixed(),
      },
    });

    return NextResponse.json({
      message: 'updateOrderToPaid was successful',
    });
  }

  return NextResponse.json({
    message: 'event is not charge.succeeded',
  });
}
