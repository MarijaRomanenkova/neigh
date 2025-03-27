/**
 * Stripe Payment Intent API Route
 * @module API
 * @group Payments
 * 
 * This API endpoint handles the creation of a Stripe Payment Intent.
 * It's used when a user selects Stripe as their payment method for invoices.
 * It creates a payment intent with the Stripe API and returns the client secret,
 * which the frontend uses to complete the payment process.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import Stripe from 'stripe';

/**
 * POST handler for Stripe payment intent creation
 * 
 * Creates a Stripe payment intent for an existing payment record.
 * This intent is used by the Stripe.js library on the client-side
 * to securely collect payment details and process the payment.
 * 
 * Security:
 * - Requires authentication
 * - Validates that the payment belongs to the authenticated user
 * - Verifies the payment is in an unpaid state
 * 
 * @param {Request} request - The incoming request
 * @param {Object} params - URL parameters containing the payment ID
 * @returns {Promise<NextResponse>} JSON response with Stripe client secret or error details
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      console.log("Authentication failed: No user ID in session");
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const paymentId = params.id;
    console.log(`Creating Stripe payment intent for payment ID: ${paymentId}`);
    
    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: "2025-02-24.acacia",
    });
    
    // Get payment from database
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });
    
    if (!payment) {
      console.log(`Payment not found with ID: ${paymentId}`);
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }
    
    // Verify the payment belongs to the authenticated user
    if (payment.userId !== userId) {
      console.log(`Unauthorized: User ${userId} attempted to access payment ${paymentId}`);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Check if payment is already paid
    if (payment.isPaid) {
      console.log(`Payment ${paymentId} is already paid`);
      return NextResponse.json(
        { error: 'Payment is already processed' },
        { status: 400 }
      );
    }
    
    // Create a payment intent with Stripe
    const intentAmount = Math.round(Number(payment.amount) * 100); // Convert to cents
    const paymentIntent = await stripe.paymentIntents.create({
      amount: intentAmount,
      currency: 'usd',
      metadata: {
        paymentId: payment.id,
        userId: payment.userId,
      },
    });
    
    console.log(`Stripe payment intent created: ${paymentIntent.id}`);
    
    // Update payment with Stripe payment intent ID
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        paymentResult: {
          id: paymentIntent.id,
          status: paymentIntent.status,
        },
      },
    });
    
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating Stripe payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create Stripe payment intent', details: String(error) },
      { status: 500 }
    );
  }
} 
