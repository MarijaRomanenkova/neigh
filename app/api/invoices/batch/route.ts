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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get invoice IDs from request body
    const { ids } = await request.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid invoice IDs' },
        { status: 400 }
      );
    }
    
    // Fetch invoices - only those that aren't part of a payment yet
    const invoices = await prisma.invoice.findMany({
      where: {
        id: { in: ids },
        clientId: userId as string,
        paymentId: null, // Only invoices that haven't been paid yet
      },
      select: {
        id: true,
        invoiceNumber: true, 
        totalPrice: true,
        clientId: true,
        contractorId: true,
        createdAt: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        contractor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    // Convert Prisma objects to plain JS objects
    const plainInvoices = convertToPlainObject(invoices);
    
    return NextResponse.json({ invoices: plainInvoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
