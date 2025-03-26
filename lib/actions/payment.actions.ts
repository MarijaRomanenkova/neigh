'use server';

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

type InvoiceWithClient = Prisma.InvoiceGetPayload<{
  include: { client: true }
}>;

// Create invoice and create the invoice items
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

// Get payment by id
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

// Create new paypal payment
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

// Approve paypal order and update order to paid
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

// Update payment to paid
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

// Get user's payments
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

type SalesDataType = {
  month: string;
  totalSales: number;
}[];

// Get sales data and payment summary
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

// Get all orders
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

// Update COD payment to paid
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

type PaymentSummary = {
  totalAmount: number;
  count: number;
  monthlyData: {
    month: string;
    amount: number;
  }[];
};

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

