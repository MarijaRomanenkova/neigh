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
 * Calculate invoice totals including tax
 * @param items - Array of invoice items with price and quantity
 * @returns Object containing subtotal, tax amount, and total as formatted strings
 */
export async function calcTotal(items: Array<{price: number, quantity?: number, qty?: number}>) {
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
}

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
    
    // Parse and validate input data
    const invoice = insertInvoiceSchema.parse(data);
    const { total } = await calcTotal(invoice.items);
    
    // Find a default task to use for items without a task ID
    const defaultTask = await prisma.task.findFirst({
      select: { id: true }
    });
    
    if (!defaultTask) {
      return {
        success: false,
        message: 'No tasks found in the system. Please create a task first.'
      };
    }
    
    // Find or create a default task assignment to use
    let defaultAssignmentId = null;
    
    const anyAssignment = await prisma.taskAssignment.findFirst({
      where: {
        clientId: invoice.clientId,
        contractorId: invoice.contractorId,
      },
      select: { id: true }
    });
    
    if (anyAssignment) {
      defaultAssignmentId = anyAssignment.id;
    } else {
      // We need to create a new assignment
      const taskStatus = await prisma.taskAssignmentStatus.findFirst({
        select: { id: true }
      });
      
      if (!taskStatus) {
        return {
          success: false,
          message: 'Task status not found in the system. Please contact support.'
        };
      }
      
      // Create a default assignment
      const newAssignment = await prisma.taskAssignment.create({
        data: {
          taskId: defaultTask.id,
          clientId: invoice.clientId,
          contractorId: invoice.contractorId,
          statusId: taskStatus.id
        }
      });
      
      defaultAssignmentId = newAssignment.id;
    }
    
    // Create the invoice
    const newInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${Date.now()}`,
        clientId: invoice.clientId,
        contractorId: invoice.contractorId,
        totalPrice: total
      }
    });
    
    // Create each invoice item individually
    const invoiceItems = [];
    
    for (const item of invoice.items) {
      // If task ID is missing or empty, use the default task
      const taskId = (item.taskId && item.taskId.trim() !== '') 
        ? item.taskId 
        : defaultTask.id;
      
      // Try to find a task-specific assignment first
      let assignmentId = defaultAssignmentId;
      
      if (taskId !== defaultTask.id) {
        const taskAssignment = await prisma.taskAssignment.findFirst({
          where: {
            taskId: taskId,
            clientId: invoice.clientId,
            contractorId: invoice.contractorId
          },
          select: { id: true }
        });
        
        if (taskAssignment) {
          assignmentId = taskAssignment.id;
        }
      }
      
      // Check if this task assignment has already been invoiced
      const existingInvoiceItem = await prisma.invoiceItem.findFirst({
        where: {
          assignmentId: assignmentId
        },
        include: {
          invoice: {
            select: {
              invoiceNumber: true
            }
          }
        }
      });
      
      // Instead of returning an error, just log a warning about duplicate invoices
      let invoiceItemName = "Service";
      if (existingInvoiceItem) {
        console.warn(`Creating additional invoice for task assignment that was already invoiced in Invoice #${existingInvoiceItem.invoice.invoiceNumber}`);
        invoiceItemName = "Service (Additional Invoice)";
      }
      
      // Create the invoice item
      const invoiceItem = await prisma.invoiceItem.create({
        data: {
          invoiceId: newInvoice.id,
          taskId: taskId,
          name: invoiceItemName,
          qty: item.quantity || 1,
          price: item.price,
          hours: 1,
          assignmentId: assignmentId
        }
      });
      
      invoiceItems.push(invoiceItem);
    }
    
    // Fetch the complete invoice data
    const completeInvoice = await prisma.invoice.findUnique({
      where: { id: newInvoice.id },
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
    
    if (!completeInvoice) {
      throw new Error('Failed to retrieve the created invoice');
    }
    
    try {
      // Move revalidation to a separate try/catch to avoid affecting the main flow
      revalidatePath('/user/dashboard/contractor/invoices');
    } catch (revalidateError) {
      console.error('Error revalidating paths:', revalidateError);
      // Continue even if revalidation fails
    }
    
    return {
      success: true,
      message: 'Invoice created successfully',
      data: convertToPlainObject(completeInvoice)
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
    const { total } = await calcTotal(invoice.items);

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
