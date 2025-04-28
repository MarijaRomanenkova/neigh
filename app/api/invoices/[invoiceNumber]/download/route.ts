import { NextResponse } from 'next/server';
import { generateInvoicePDF } from '@/lib/services/invoice-pdf-service';
import { prisma } from '@/db/prisma';
import { auth } from '@/auth';
import { convertToPlainObject } from '@/lib/utils';

/**
 * GET handler for downloading an invoice as PDF
 * 
 * @param request - The incoming request
 * @returns PDF file response or error
 */
export async function GET(request: Request) {
  try {
    // Authenticate the user
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Extract invoiceNumber from URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const invoiceNumber = pathParts[pathParts.indexOf('invoices') + 1];

    console.log(`Fetching invoice ${invoiceNumber} for user ${userId}`);

    // Fetch the invoice with related data
    const invoice = await prisma.invoice.findUnique({
      where: { invoiceNumber },
      include: {
        items: true,
        client: {
          select: { name: true, email: true }
        },
        contractor: {
          select: { name: true, email: true }
        }
      }
    });

    if (!invoice) {
      console.log(`Invoice ${invoiceNumber} not found`);
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Check if user is authorized to access this invoice
    if (invoice.clientId !== userId && invoice.contractorId !== userId) {
      console.log(`User ${userId} not authorized to access invoice ${invoiceNumber}`);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log(`Serializing invoice data for ${invoiceNumber}`);
    // Generate PDF
    const serializedInvoice = convertToPlainObject(invoice);
    
    // Log invoice structure for debugging
    console.log('Invoice data structure:', JSON.stringify({
      invoiceNumber: serializedInvoice.invoiceNumber,
      hasItems: serializedInvoice.items?.length > 0,
      hasClient: !!serializedInvoice.client,
      hasContractor: !!serializedInvoice.contractor
    }, null, 2));
    
    console.log(`Generating PDF for invoice ${invoiceNumber}`);
    const pdfBuffer = generateInvoicePDF(serializedInvoice);

    console.log(`Successfully generated PDF for invoice ${invoiceNumber}`);
    // Return PDF with appropriate headers
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoiceNumber}.pdf"`
      }
    });
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    // Return a more detailed error response
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV !== 'production' && error instanceof Error ? error.stack : undefined
      }, 
      { status: 500 }
    );
  }
} 
