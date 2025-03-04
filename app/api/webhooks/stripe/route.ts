import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with the secret API key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia'  // Add API version
});

// Define the POST handler function for the Stripe webhook
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    const event = await stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === 'charge.succeeded') {
      const charge = event.data.object as Stripe.Charge;

      await updateOrderToPaid({
        orderId: charge.metadata.orderId,
        paymentResult: {
          id: charge.id,
          status: 'COMPLETED',
          email_address: charge.billing_details.email || '',
          pricePaid: (charge.amount / 100).toString(), // Use toString instead of toFixed
        },
      });

      return NextResponse.json({ message: 'Order updated successfully' });
    }

    return NextResponse.json({ message: `Unhandled event: ${event.type}` });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}
