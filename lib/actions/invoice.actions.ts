'use server';

/**
 * Invoice management functions for creating, retrieving, and updating invoices
 * @module InvoiceActions
 * @group API
 */

import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { convertToPlainObject, formatError, round2 } from '../utils';
import { revalidatePath } from 'next/cache';
import { insertInvoiceSchema, updateInvoiceSchema } from '../validators';
import { z } from 'zod';

/**
 * Calculates the subtotal, tax amount, and total for an invoice based on its items
 * 
 * @param items - Array of invoice items with price and quantity
 * @returns Object containing subtotal, tax amount, and total as formatted strings
 */
const calcTotal = (items: Array<{price: number, quantity?: number, qty?: number}>) => {
  // Handle both old schema (InvoiceItems with qty) and new schema (items with quantity)
  const subtotal = round2(
    items.reduce((acc, item) => {
      // Support both qty and quantity fields for backward compatibility
      const quantity = 'quantity' in item && item.quantity !== undefined ? item.quantity : (item.qty ?? 1);
      return acc + Number(item.price) * quantity;
    }, 0)
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

/**
 * Retrieves all invoices where the specified user is the client
 * 
 * @param userId - The unique identifier of the client user
 * @returns Array of invoices with client, contractor, and item details
 * 
 * @example
 * // In a client dashboard component
 * const incomingInvoices = await getAllIncomingInvoices(session.user.id);
 * 
 * return (
 *   <div>
 *     <h2>Your Invoices</h2>
 *     {incomingInvoices.map(invoice => (
 *       <InvoiceCard 
 *         key={invoice.id}
 *         number={invoice.invoiceNumber}
 *         contractor={invoice.contractor.name}
 *         amount={invoice.totalPrice}
 *         date={invoice.createdAt}
 *       />
 *     ))}
 *   </div>
 * );
 */
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

/**
 * Retrieves all invoices where the specified user is the contractor
 * 
 * @param contractorId - The unique identifier of the contractor user
 * @returns Array of invoices with client, contractor, and item details
 * 
 * @example
 * // In a contractor dashboard component
 * const outgoingInvoices = await getAllOutgoingInvoices(session.user.id);
 * 
 * return (
 *   <div>
 *     <h2>Invoices You've Sent</h2>
 *     {outgoingInvoices.map(invoice => (
 *       <InvoiceCard 
 *         key={invoice.id}
 *         number={invoice.invoiceNumber}
 *         client={invoice.client.name}
 *         amount={invoice.totalPrice}
 *         date={invoice.createdAt}
 *       />
 *     ))}
 *   </div>
 * );
 */
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

/**
 * Creates a new invoice with the specified client, contractor, and items
 * 
 * @param data - Invoice data validated against the insert invoice schema
 * @returns Object containing success status, message, and created invoice data
 * @throws Will return error object if user is not authenticated or if validation fails
 * 
 * @example
 * // In an invoice creation form
 * async function handleSubmit(formData) {
 *   const invoiceData = {
 *     clientId: selectedClient.id,
 *     contractorId: session.user.id,
 *     invoiceItem: [
 *       {
 *         taskId: selectedTask.id,
 *         name: selectedTask.name,
 *         qty: hoursWorked,
 *         price: selectedTask.price
 *       }
 *     ]
 *   };
 *   
 *   const { success, message, data } = await createInvoice(invoiceData);
 *   
 *   if (success) {
 *     router.push(`/invoice/${data.id}`);
 *     showNotification('Success', 'Invoice created successfully');
 *   } else {
 *     showNotification('Error', message);
 *   }
 * }
 */
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
    const { total } = calcTotal(invoice.items);
    
    // First, get a valid assignment ID (we need this for each invoice item)
    const assignment = await prisma.taskAssignment.findFirst({
      where: {
        taskId: invoice.items[0].taskId,
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
          create: invoice.items.map(item => ({
            taskId: item.taskId,
            name: "Service", // Default name
            qty: item.quantity || 1,
            price: item.price,
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

/**
 * Updates an existing invoice with new information
 * 
 * @param data - Updated invoice data validated against the update invoice schema
 * @returns Object containing success status, message, and updated invoice data
 * @throws Will return error object if user is not authenticated or if validation fails
 * 
 * @example
 * // In an invoice edit form
 * async function handleUpdate(formData) {
 *   const updatedData = {
 *     id: invoice.id,
 *     invoiceItem: invoice.items.map(item => ({
 *       ...item,
 *       qty: form.get(`qty-${item.id}`) || item.qty,
 *       price: form.get(`price-${item.id}`) || item.price
 *     }))
 *   };
 *   
 *   const { success, message } = await updateInvoice(updatedData);
 *   
 *   if (success) {
 *     router.refresh();
 *     showNotification('Success', message);
 *   } else {
 *     showNotification('Error', message);
 *   }
 * }
 */
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
    const { total } = calcTotal(invoice.items);

    // Update invoice total price only, items are updated separately
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
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

/**
 * Retrieves an invoice by its unique invoice number
 * 
 * @param invoiceNumber - The unique invoice number (e.g., INV-12345)
 * @returns The invoice object with client, contractor, and item details, or null if not found
 * 
 * @example
 * // In an invoice detail component
 * const invoice = await getInvoiceByNumber('INV-12345678');
 * 
 * if (invoice) {
 *   return (
 *     <div className="invoice-details">
 *       <h1>Invoice #{invoice.invoiceNumber}</h1>
 *       <div className="parties">
 *         <div className="from">
 *           <h3>From: {invoice.contractor.name}</h3>
 *           <p>{invoice.contractor.email}</p>
 *         </div>
 *         <div className="to">
 *           <h3>To: {invoice.client.name}</h3>
 *           <p>{invoice.client.email}</p>
 *         </div>
 *       </div>
 *       <InvoiceItemsList items={invoice.items} />
 *       <div className="total">
 *         <h3>Total: ${invoice.totalPrice}</h3>
 *       </div>
 *     </div>
 *   );
 * }
 */
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
