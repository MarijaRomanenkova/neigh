import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { convertToPlainObject } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    // Authenticate user
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      console.log('Authentication failed: No user ID in session');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get invoice IDs and payment method from request body
    const { invoiceIds, paymentMethod } = await request.json();
    
    console.log('Request received:', { invoiceIds, paymentMethod, userId });
    
    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      console.log('Invalid invoice IDs:', invoiceIds);
      return NextResponse.json(
        { error: 'Invalid invoice IDs' },
        { status: 400 }
      );
    }

    if (!paymentMethod || !['Stripe', 'PayPal'].includes(paymentMethod)) {
      console.log('Invalid payment method:', paymentMethod);
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }
    
    // Calculate total amount from invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        id: { in: invoiceIds },
        clientId: userId as string,
        paymentId: null, // Only unpaid invoices
      },
    });
    
    console.log(`Found ${invoices.length} valid invoices of ${invoiceIds.length} requested`);
    
    if (invoices.length === 0) {
      return NextResponse.json(
        { error: 'No valid invoices found' },
        { status: 400 }
      );
    }
    
    // Log invoices that were not found or already have a paymentId
    if (invoices.length < invoiceIds.length) {
      const foundIds = invoices.map(inv => inv.id);
      const missingIds = invoiceIds.filter(id => !foundIds.includes(id));
      
      console.log('Some invoices were not found or already paid:', { missingIds });
      
      // Check if they exist but have a payment ID
      const paidInvoices = await prisma.invoice.findMany({
        where: {
          id: { in: missingIds },
          clientId: userId as string,
          NOT: { paymentId: null },
        },
        select: { id: true, paymentId: true }
      });
      
      if (paidInvoices.length > 0) {
        console.log('Already paid invoices:', paidInvoices);
      }
    }
    
    // Sum the total prices
    const totalAmount = invoices.reduce(
      (sum, invoice) => sum + Number(invoice.totalPrice),
      0
    );
    
    console.log('Creating payment record with total amount:', totalAmount);
    
    // Create a payment record
    const payment = await prisma.payment.create({
      data: {
        userId: userId as string,
        amount: totalAmount,
        paymentMethod,
        paymentResult: {
          id: '',
          status: 'PENDING',
          email_address: '',
          amount: 0
        },
        invoices: {
          connect: invoiceIds.map((id: string) => ({ id }))
        }
      }
    });
    
    console.log('Payment record created successfully:', payment.id);
    
    // Double-check that the invoices were properly connected
    const updatedInvoices = await prisma.invoice.findMany({
      where: {
        id: { in: invoiceIds },
        paymentId: payment.id
      },
      select: { id: true }
    });
    
    console.log(`Verified ${updatedInvoices.length} invoices updated with payment ID`);
    
    return NextResponse.json({ 
      success: true,
      paymentId: payment.id 
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    
    // Provide more detailed error information
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for Prisma-specific errors
      if (error.name === 'PrismaClientKnownRequestError') {
        const prismaError = error as any;
        if (prismaError.code === 'P2025') {
          statusCode = 404;
          errorMessage = 'Record not found';
        } else if (prismaError.code === 'P2002') {
          statusCode = 409;
          errorMessage = 'Conflict with existing data';
        }
      }
    }
    
    // Check if it's a Prisma foreign key constraint error
    if (error instanceof Error && 
        error.name === 'PrismaClientKnownRequestError' && 
        (error as any).code === 'P2025') {
      
      // This could be because one or more invoices don't exist
      console.log('Foreign key constraint error. Some invoices likely do not exist or are already paid');
      
      return NextResponse.json(
        { error: 'One or more invoices not found or already paid' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error instanceof Error ? error.message : String(error) },
      { status: statusCode }
    );
  }
} 
