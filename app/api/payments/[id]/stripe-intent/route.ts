import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(request: Request) {
  try {
    // Authenticate user
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Extract payment ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const paymentId = pathParts[pathParts.length - 2]; // Gets the ID from /api/payments/[id]/stripe-intent
    
    // Get payment from database
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId: userId as string,
        isPaid: false,
      },
    });
    
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found or already paid' },
        { status: 404 }
      );
    }
    
    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(payment.amount) * 100), // Stripe expects amount in cents
      currency: 'usd',
      metadata: {
        paymentId: payment.id,
      },
    });
    
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating Stripe payment intent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
