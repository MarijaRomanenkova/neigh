'use server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { convertToPlainObject, formatError, round2 } from '../utils';
import { revalidatePath } from 'next/cache';
import { insertInvoiceSchema, updateInvoiceSchema } from '../validators';
import { z } from 'zod';
import { InvoiceItems } from '@/types';

// Calculate invoice total
const calcTotal = (items: InvoiceItems[]) => {
  const subtotal = round2(
    items.reduce((acc, item) => acc + Number(item.price) * (item.qty ?? 1), 0)
  );
  const taxRate = 0.21; // 21% tax rate
  const taxAmount = round2(subtotal * taxRate);
  const total = round2(subtotal + taxAmount);

  return {
    subtotal: subtotal.toFixed(2),
    taxAmount: taxAmount.toFixed(2),
    total: total.toFixed(2),
  };
};

export async function getAllIncomingInvoices(userId: string) {
  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        clientId: userId
      },
      include: {
        client: true,
        contractor: true,
        items: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return convertToPlainObject(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }
}

export async function getAllOutgoingInvoices(contractorId: string) {
  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        contractorId
      },
      include: {
        client: true,
        contractor: true,
        items: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return convertToPlainObject(invoices);
  } catch (error) {
    console.error('Error fetching outgoing invoices:', error);
    return [];
  }
}

export async function createInvoice(data: z.infer<typeof insertInvoiceSchema>) {
  try {
    // Get session and user ID
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      return {
        success: false,
        message: 'You must be logged in to create an invoice'
      };
    }
    
    const invoice = insertInvoiceSchema.parse(data);
    const { total } = calcTotal(invoice.invoiceItem as InvoiceItems[]);
    
    // First, get a valid assignment ID (we need this for each invoice item)
    const assignment = await prisma.taskAssignment.findFirst({
      where: {
        taskId: invoice.invoiceItem[0].taskId,
        clientId: invoice.clientId,
        contractorId: invoice.contractorId,
      },
    });

    if (!assignment) {
      return {
        success: false,
        message: 'No task assignment found for the provided task, client, and contractor'
      };
    }

    // Create the invoice and its items in a transaction
    const newInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${Date.now()}`,
        clientId: invoice.clientId,
        contractorId: invoice.contractorId,
        totalPrice: total,
        items: {
          create: invoice.invoiceItem.map(item => ({
            taskId: item.taskId,
            name: item.name,
            qty: item.qty || 1,
            price: parseFloat(item.price),
            hours: 1, // Default value for hours
            assignmentId: assignment.id
          }))
        }
      },
      include: {
        items: true,
        client: {
          select: {
            name: true,
            email: true
          }
        },
        contractor: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    revalidatePath('/invoices');
    revalidatePath(`/invoice/${newInvoice.id}`);
    return {
      success: true,
      message: 'Invoice created successfully',
      data: convertToPlainObject(newInvoice)
    };
  } catch (error) {
    console.error('Invoice creation error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create invoice'
    };
  }
}

export async function updateInvoice(data: z.infer<typeof updateInvoiceSchema>) {
  try {
    // Get session and user ID
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      return {
        success: false,
        message: 'You must be logged in to update an invoice'
      };
    }
    
    const invoice = updateInvoiceSchema.parse(data);
    const { total } = calcTotal(invoice.invoiceItem as InvoiceItems[]);

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        ...invoice,
        totalPrice: total,
      },
    });
    revalidatePath('/invoices');
    revalidatePath(`/invoice/${updatedInvoice.id}`);
    return {
      success: true,
      message: 'Invoice updated successfully',
      data: convertToPlainObject(updatedInvoice)
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update invoice'
    };
  }
}

export async function getInvoiceByNumber(invoiceNumber: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { invoiceNumber },
      include: {
        client: {
          select: {
            name: true,
            email: true,
          },
        },
        contractor: {
          select: {
            name: true,
            email: true,
          },
        },
        items: true,
      },
    });

    return invoice ? convertToPlainObject(invoice) : null;
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return null;
  }
}
