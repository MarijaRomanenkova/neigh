import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { paypal } from '@/lib/paypal';
import { revalidatePath } from 'next/cache';
import { PaymentResult } from '@/types';

export async function POST(req: Request) {
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
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const paymentId = pathParts[pathParts.length - 2]; // Gets the ID from /api/payments/[id]/paypal-capture
    
    // Parse request body
    const { paymentId: paypalOrderId } = await req.json();
    
    if (!paypalOrderId) {
      return NextResponse.json(
        { error: 'PayPal order ID is required' },
        { status: 400 }
      );
    }
    
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
    
    // Verify that the paymentResult id matches the provided PayPal order ID
    const paymentResult = payment.paymentResult as PaymentResult;
    if (paymentResult?.id !== paypalOrderId) {
      return NextResponse.json(
        { error: 'PayPal order ID mismatch' },
        { status: 400 }
      );
    }
    
    // Capture the PayPal payment
    const captureData = await paypal.capturePayment(paypalOrderId);
    
    // Update payment to paid status
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        isPaid: true,
        paidAt: new Date(),
        paymentResult: {
          id: captureData.id,
          status: captureData.status,
          email_address: captureData.payer.email_address,
          amount: captureData.purchase_units[0]?.payments?.captures[0]?.amount?.value || 0,
          created_at: new Date().toISOString(),
        },
      },
    });
    
    // Revalidate payment page
    revalidatePath(`/user/dashboard/client/payment/${paymentId}`);
    
    return NextResponse.json({
      success: true,
      message: 'Payment captured successfully',
    });
  } catch (error) {
    console.error('Error capturing PayPal payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
