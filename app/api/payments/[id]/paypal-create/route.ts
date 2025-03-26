import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { paypal } from '@/lib/paypal';

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
    const paymentId = pathParts[pathParts.length - 2]; // Gets the ID from /api/payments/[id]/paypal-create
    
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
    
    // Create a PayPal payment
    const paypalPayment = await paypal.createPayment(Number(payment.amount));
    
    // Update the payment record with PayPal ID
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        paymentResult: {
          id: paypalPayment.id,
          status: 'PENDING',
          email_address: '',
          amount: 0,
        },
      },
    });
    
    return NextResponse.json({
      id: paypalPayment.id,
    });
  } catch (error) {
    console.error('Error creating PayPal payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
