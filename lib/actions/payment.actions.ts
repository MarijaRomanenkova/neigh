'use server';

/**
 * Payment management functions for creating, processing, and retrieving payment information
 * @module PaymentActions
 * @group API
 */

import { isRedirectError } from 'next/dist/client/components/redirect';
import { convertToPlainObject, formatError } from '../utils';
import { auth } from '@/auth';
import { getMyCart } from './cart.actions';
import { getUserById } from './user.actions';
import { insertInvoiceSchema, insertPaymentSchema } from '../validators';
import { prisma } from '@/db/prisma';
import { Invoice, PaymentResult, Payment} from '@/types';
import { paypal } from '../paypal';
import { revalidatePath } from 'next/cache';
import { PAGE_SIZE } from '../constants';
import { Prisma } from '@prisma/client';
import { sendPurchaseReceipt } from '@/email';

/**
 * Type definition for an invoice with associated client details
 */
type InvoiceWithClient = Prisma.InvoiceGetPayload<{
  include: { client: true }
}>;

/**
 * Creates a new payment based on the user's cart items
 * 
 * @returns Object containing success status, message, and optional redirect URL
 * @throws Will redirect errors if they occur during the payment process
 * 
 * @example
 * // In a checkout component
 * async function handleCheckout() {
 *   const result = await createPayment();
 *   
 *   if (result.success) {
 *     router.push(result.redirectTo);
 *   } else {
 *     setError(result.message);
 *     if (result.redirectTo) {
 *       router.push(result.redirectTo);
 *     }
 *   }
 * }
 */
export async function createPayment() {
  try {
    const session = await auth();
    if (!session) throw new Error('User is not authenticated');

    const cart = await getMyCart();
    const userId = session?.user?.id;
    if (!userId) throw new Error('User not found');

    const user = await getUserById(userId);

    if (!cart || cart.invoices.length === 0) {
      return {
        success: false,
        message: 'Your cart is empty',
        redirectTo: '/cart',
      };
    }

    if (!user.paymentMethod) {
      return {
        success: false,
        message: 'No payment method',
        redirectTo: '/payment-method',
      };
    }

    // Create order object
    const payment = insertPaymentSchema.parse({
      userId: user.id,
      paymentMethod: user.paymentMethod,
      invoiceIds: cart.invoices.map(invoice => invoice.id),
      totalPrice: cart.totalPrice,
    });

    // Create a transaction to create payment a
    const insertedPaymentId = await prisma.$transaction(async (tx) => {
      // Create payment
      const insertedPayment = await tx.payment.create({ 
        data: {
          ...payment,
          user: {
            connect: {
              id: userId
            }
          },
          paymentResult: {
            id: '',
            status: 'PENDING',
            email_address: '',
            amount: 0
          }
        } 
      });
      // Create order items from the cart items
      for (const invoice of cart.invoices as InvoiceWithClient[]) {
        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            paymentId: insertedPayment.id
          }
        });
      }
      // Clear cart
      await tx.cart.update({
        where: { id: cart.id },
        data: {
          invoices: {
            set: []  // Clear all invoice connections
          },
          totalPrice: 0,
        }
      });

      return insertedPayment.id;
    });

    if (!insertedPaymentId) throw new Error('Payment not created');

    return {
      success: true,
      message: 'Payment created',
      redirectTo: `/payment/${insertedPaymentId}`,
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, message: formatError(error) };
  }
}

/**
 * Retrieves payment information by ID with associated user and invoice data
 * 
 * @param paymentId - The unique identifier of the payment
 * @returns The payment object with user and invoice data, or null if not found
 * 
 * @example
 * // In a payment details component
 * const payment = await getPaymentById('payment-123');
 * 
 * if (payment) {
 *   return (
 *     <div>
 *       <h2>Payment #{payment.id}</h2>
 *       <p>Total: ${payment.amount}</p>
 *       <p>Status: {payment.isPaid ? 'Paid' : 'Pending'}</p>
 *       <InvoiceList invoices={payment.invoices} />
 *     </div>
 *   );
 * }
 */
export async function getPaymentById(paymentId: string) {
  const data = await prisma.payment.findFirst({
    where: { id: paymentId },
    include: {
      user: true,
      invoices: true,
    },
  });

  return convertToPlainObject(data);
}

/**
 * Creates a PayPal payment for an existing payment record
 * 
 * @param paymentId - The unique identifier of the payment to process with PayPal
 * @returns Object containing success status, message, and PayPal payment ID
 * 
 * @example
 * // In a payment processor component
 * const { success, data, message } = await createPayPalPayment('payment-123');
 * 
 * if (success) {
 *   // Use the PayPal payment ID to initialize the PayPal button
 *   initPayPalButton(data);
 * } else {
 *   showError(message);
 * }
 */
export async function createPayPalPayment(paymentId: string) {
  try {
    // Get order from database
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
      },
    });

    if (payment) {
      // Create paypal payment
      const paypalPayment = await paypal.createPayment(Number(payment.amount));

      // Update payment with paypal payment id
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          paymentResult: {
            id: paypalPayment.id,
            email_address: '',
            status: '',
            amount: 0,
          },
        },
      });

      return {
        success: true,
        message: 'Item order created successfully',
        data: paypalPayment.id,
      };
    } else {
      throw new Error('Payment not found');
    }
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

/**
 * Approves a PayPal payment and updates the payment record to paid status
 * 
 * @param paymentId - The unique identifier of the payment to approve
 * @param data - Object containing the PayPal payment ID
 * @returns Object containing success status and message
 * 
 * @example
 * // In a PayPal callback handler
 * async function onApprove(data) {
 *   const { success, message } = await approvePayPalPayment('payment-123', { paymentId: data.paymentId });
 *   
 *   if (success) {
 *     router.push('/payment/success');
 *   } else {
 *     setError(message);
 *     router.push('/payment/error');
 *   }
 * }
 */
export async function approvePayPalPayment(
  paymentId: string,
  data: { paymentId: string }
) {
  try {
    // Get payment from database
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
      },
    });

    if (!payment) throw new Error('Payment not found');

    // Verify payment data
    const captureData = await paypal.capturePayment(data.paymentId);

    if (
      !captureData ||
      captureData.id !== (payment.paymentResult as PaymentResult)?.id ||
      captureData.status !== 'COMPLETED'
    ) {
      throw new Error('Error in PayPal payment');
    }

    // Update payment to paid
    await updatePaymentToPaid(paymentId, {
      id: captureData.id,
      status: captureData.status,
      email_address: captureData.payer.email_address,
      pricePaid: captureData.purchase_units[0]?.payments?.captures[0]?.amount?.value || '0',
      amount: captureData.purchase_units[0]?.payments?.captures[0]?.amount?.value,
      created_at: new Date().toISOString()
    });

    revalidatePath(`/payment/${paymentId}`);

    return {
      success: true,
      message: 'Your payment has been approved',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

/**
 * Updates a payment record to paid status and sends purchase receipt
 * 
 * @param paymentId - The unique identifier of the payment to mark as paid
 * @param paymentResult - Optional payment result details from payment provider
 * @returns void
 * @throws Will throw an error if payment not found or already paid
 * 
 * @example
 * // In a payment completion handler
 * try {
 *   await updatePaymentToPaid('payment-123', {
 *     id: 'provider-payment-id',
 *     status: 'COMPLETED',
 *     email_address: 'customer@example.com',
 *     amount: 199.99
 *   });
 *   showSuccess('Payment completed successfully');
 * } catch (error) {
 *   console.error('Failed to update payment:', error);
 * }
 */
export async function updatePaymentToPaid(
  paymentId: string,
  paymentResult?: PaymentResult
) {
  // Get payment from database
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
    },
    include: {
      invoices: true,
    },
  });

  if (!payment) throw new Error('Payment not found');

  if (payment.isPaid) throw new Error('Payment is already paid');

  // Transaction to update order and account for task stock
  await prisma.$transaction(async (tx) => {
    // Set the order to paid
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        isPaid: true,
        paidAt: new Date(),
        paymentResult,
      },
    });
  });

  // Get updated payment after transaction
  const updatedPayment = await prisma.payment.findFirst({
    where: { id: paymentId },
    include: {
      invoices: true,
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });

  if (!updatedPayment) throw new Error('Payment not found');

  sendPurchaseReceipt({
    payment: {
      ...updatedPayment,
      paymentResult: updatedPayment.paymentResult as PaymentResult,
      totalPrice: updatedPayment.amount.toString(),
      taxPrice: (Number(updatedPayment.amount) * 0.21).toString(),
      user: {
        name: updatedPayment.user.name,
        email: updatedPayment.user.email
      },
      invoices: updatedPayment.invoices.map(invoice => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        totalPrice: Number(invoice.totalPrice),
        client: {
          name: invoice.clientId
        }
      }))
    }
  });
}

/**
 * Retrieves the current user's payment history with pagination
 * 
 * @param options - Pagination options
 * @param options.limit - Number of records per page
 * @param options.page - Page number to retrieve
 * @returns Paginated list of payments and total pages
 * @throws Will throw an error if user is not authenticated
 * 
 * @example
 * // In a user dashboard component
 * async function PaymentHistory({ page = 1 }) {
 *   const { data, totalPages } = await getMyPayments({ page });
 *   
 *   return (
 *     <div>
 *       <h2>Your Payment History</h2>
 *       {data.map(payment => (
 *         <PaymentCard 
 *           key={payment.id}
 *           payment={payment}
 *         />
 *       ))}
 *       <Pagination currentPage={page} totalPages={totalPages} />
 *     </div>
 *   );
 * }
 */
export async function getMyPayments({
  limit = PAGE_SIZE,
  page,
}: {
  limit?: number;
  page: number;
}) {
  const session = await auth();
  if (!session) throw new Error('User is not authorized');

  const data = await prisma.payment.findMany({
    where: { id: session?.user?.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: (page - 1) * limit,
  });

  const dataCount = await prisma.payment.count({
    where: { id: session?.user?.id },
  });

  return {
    data,
    totalPages: Math.ceil(dataCount / limit),
  };
}

/**
 * Type definition for monthly sales data
 */
type SalesDataType = {
  /** Month in MM/YY format */
  month: string;
  /** Total sales amount for the month */
  totalSales: number;
}[];

/**
 * Retrieves overall payment and sales statistics
 * 
 * @returns Object containing counts, totals, and sales data
 * 
 * @example
 * // In an admin dashboard component
 * const stats = await getPaymentSummary();
 * 
 * return (
 *   <div>
 *     <StatCard title="Total Sales" value={`$${stats.totalSales._sum.amount}`} />
 *     <StatCard title="Orders" value={stats.paymentsCount} />
 *     <StatCard title="Products" value={stats.tasksCount} />
 *     <StatCard title="Customers" value={stats.usersCount} />
 *     <SalesChart data={stats.salesData} />
 *     <RecentSales sales={stats.latestSales} />
 *   </div>
 * );
 */
export async function getPaymentSummary() {
  // Get counts for each resource
  const paymentsCount = await prisma.payment.count();
  const tasksCount = await prisma.task.count();
  const usersCount = await prisma.user.count();

  // Calculate the total sales
  const totalSales = await prisma.payment.aggregate({
    _sum: { amount: true },
  });

  // Get monthly sales
  const salesDataRaw = await prisma.$queryRaw<
    Array<{ month: string; totalSales: Prisma.Decimal }>
  >`SELECT to_char("createdAt", 'MM/YY') as "month", sum("amount") as "totalSales" FROM "Payment" GROUP BY to_char("createdAt", 'MM/YY')`;

  const salesData: SalesDataType = salesDataRaw.map((entry) => ({
    month: entry.month,
    totalSales: Number(entry.totalSales),
  }));

  // Get latest sales
  const latestSales = await prisma.payment.findMany({
    orderBy: { createdAt: 'desc' },
    take: 6,
  });

  return {
    paymentsCount,
    tasksCount,
    usersCount,
    totalSales,
    latestSales,
    salesData,
  };
}

/**
 * Retrieves all payments with filtering and pagination
 * 
 * @param options - Pagination and filter options
 * @param options.limit - Number of records per page
 * @param options.page - Page number to retrieve
 * @param options.query - Search query for filtering payments
 * @returns Paginated list of payments and total pages
 * 
 * @example
 * // In an admin payments component
 * async function PaymentsList({ page = 1, searchQuery = 'all' }) {
 *   const { data, totalPages } = await getAllPayments({ 
 *     page, 
 *     query: searchQuery,
 *     limit: 20
 *   });
 *   
 *   return (
 *     <div>
 *       <SearchBar defaultValue={searchQuery} />
 *       <PaymentsTable payments={data} />
 *       <Pagination currentPage={page} totalPages={totalPages} />
 *     </div>
 *   );
 * }
 */
export async function getAllPayments({
  limit = PAGE_SIZE,
  page,
  query,
}: {
  limit?: number;
  page: number;
  query: string;
}) {
  const queryFilter: Prisma.PaymentWhereInput =
    query && query !== 'all'
      ? {
          id: {
            contains: query,
            mode: 'insensitive',
          } as Prisma.StringFilter,
        }
      : {};

  const data = await prisma.payment.findMany({
    where: {
      ...queryFilter,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: (page - 1) * limit,
  });

  const dataCount = await prisma.payment.count();

  return {
    data,
    totalPages: Math.ceil(dataCount / limit),
  };
}

/**
 * Updates a Cash On Delivery (COD) payment to paid status
 * 
 * @param paymentId - The unique identifier of the payment to mark as paid
 * @param paymentResult - Optional payment result details
 * @returns Object containing success status and message
 * 
 * @example
 * // In an admin order management component
 * async function markAsPaid(paymentId) {
 *   const result = await updateCODPaymentToPaid(paymentId, {
 *     id: 'manual-payment',
 *     status: 'COMPLETED',
 *     email_address: 'customer@example.com',
 *     amount: 199.99,
 *     created_at: new Date().toISOString()
 *   });
 *   
 *   if (result.success) {
 *     showNotification('Success', result.message);
 *     refreshPayments();
 *   } else {
 *     showNotification('Error', result.message);
 *   }
 * }
 */
export async function updateCODPaymentToPaid(
  paymentId: string,
  paymentResult?: PaymentResult
) {
  try {
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        isPaid: true,
        paidAt: new Date(),
        paymentResult,
      },
    });

    revalidatePath(`/payment/${paymentId}`);

    return { success: true, message: 'Payment marked as paid' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

/**
 * Summary of payment data with total amount, count, and monthly breakdown
 */
type PaymentSummary = {
  /** Total amount of all payments */
  totalAmount: number;
  /** Total number of payments */
  count: number;
  /** Monthly payment data */
  monthlyData: {
    /** Month in YYYY-MM format */
    month: string;
    /** Payment amount for that month */
    amount: number;
  }[];
};

/**
 * Retrieves payment summary data for a specific client
 * 
 * @param clientId - The unique identifier of the client
 * @returns Payment summary with totals and monthly data
 * 
 * @example
 * // In a client analytics component
 * const paymentData = await getPaymentSummaryByClientId('client-123');
 * 
 * return (
 *   <div>
 *     <h2>Payment Summary</h2>
 *     <p>Total Payments: {paymentData.count}</p>
 *     <p>Total Amount: ${paymentData.totalAmount.toFixed(2)}</p>
 *     <MonthlyChart data={paymentData.monthlyData} />
 *   </div>
 * );
 */
export async function getPaymentSummaryByClientId(
  clientId: string
): Promise<PaymentSummary> {
  const payments = await prisma.payment.findMany({
    where: {
      invoices: {
        some: {
          clientId: clientId
        }
      }
    },
    select: {
      amount: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  const monthlyData = payments.reduce((acc: { [key: string]: number }, payment) => {
    const month = payment.createdAt.toISOString().slice(0, 7); // YYYY-MM format
    acc[month] = (acc[month] || 0) + Number(payment.amount);
    return acc;
  }, {});

  return {
    totalAmount: payments.reduce((sum, payment) => sum + Number(payment.amount), 0),
    count: payments.length,
    monthlyData: Object.entries(monthlyData).map(([month, amount]) => ({
      month,
      amount
    }))
  };
}

/**
 * Retrieves payment summary data for a specific contractor
 * 
 * @param contractorId - The unique identifier of the contractor
 * @returns Payment summary with totals and monthly data
 * 
 * @example
 * // In a contractor dashboard component
 * const paymentData = await getPaymentSummaryByContractorId('contractor-123');
 * 
 * return (
 *   <div>
 *     <h2>Your Earnings</h2>
 *     <p>Total Payments: {paymentData.count}</p>
 *     <p>Total Earned: ${paymentData.totalAmount.toFixed(2)}</p>
 *     <EarningsChart data={paymentData.monthlyData} />
 *   </div>
 * );
 */
export async function getPaymentSummaryByContractorId(
  contractorId: string
): Promise<PaymentSummary> {
  const payments = await prisma.payment.findMany({
    where: {
      invoices: {
        some: {
          contractorId: contractorId
        }
      }
    },
    select: {
      amount: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  const monthlyData = payments.reduce((acc: { [key: string]: number }, payment) => {
    const month = payment.createdAt.toISOString().slice(0, 7);
    acc[month] = (acc[month] || 0) + Number(payment.amount);
    return acc;
  }, {});

  return {
    totalAmount: payments.reduce((sum, payment) => sum + Number(payment.amount), 0),
    count: payments.length,
    monthlyData: Object.entries(monthlyData).map(([month, amount]) => ({
      month,
      amount
    }))
  };
}

