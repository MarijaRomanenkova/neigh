'use server';

import { cookies } from 'next/headers';
import { Invoice } from '@/types';
import { convertToPlainObject, formatError} from '../utils';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { insertInvoiceSchema, insertCartSchema } from '../validators';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

function calcPrice(invoices: Invoice[]) {
  const totalPrice = invoices.reduce((sum, invoice) => sum + Number(invoice.totalPrice), 0);
  return { totalPrice };
}

export async function addInvoiceToCart(invoiceId: string) {
  try {
    // Check for cart cookie
    const sessionCartId = (await cookies()).get('sessionCartId')?.value;
    if (!sessionCartId) throw new Error('Cart session not found');

    // Get session and user ID
    const session = await auth();
    const userId = session?.user?.id ? (session.user.id as string) : undefined;

    // Get cart
    const cart = await getMyCart();

    // Find invoice in database
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId },
    });

    if (!invoice) throw new Error('Invoice not found');

    // Check if invoice is already in the cart
    if (cart && cart.invoices.some(item => item.id === invoiceId)) {
      return {
        success: false,
        message: `Invoice #${invoice.invoiceNumber} is already in your cart`,
      };
    }

    let updatedCart;
    
    if (!cart) {
      // Create new cart object
      updatedCart = await prisma.cart.create({
        data: {
          userId,
          sessionCartId,
          invoices: {
            connect: [{ id: invoice.id }]
          },
          totalPrice: invoice.totalPrice,
        },
        include: {
          invoices: {
            include: {
              client: true
            }
          }
        }
      });
    } else {
      // Calculate new total price
      const newTotalPrice = Number(cart.totalPrice) + Number(invoice.totalPrice);
      
      // Update existing cart
      updatedCart = await prisma.cart.update({
        where: { id: cart.id },
        data: {
          invoices: {
            connect: [{ id: invoice.id }]
          },
          totalPrice: newTotalPrice,
        },
        include: {
          invoices: {
            include: {
              client: true
            }
          }
        }
      });
    }

    revalidatePath(`/invoice/${invoice.id}`);
    revalidatePath('/user/dashboard/client/cart');

    return {
      success: true,
      message: `Invoice #${invoice.invoiceNumber} added to cart`,
      cart: convertToPlainObject(updatedCart)
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

type CartWithInvoices = Prisma.CartGetPayload<{
  include: {
    invoices: {
      include: {
        client: true
      }
    }
  }
}>;

export async function getMyCart(): Promise<CartWithInvoices | null> {
  try {
    const sessionCartId = (await cookies()).get('sessionCartId')?.value;
    if (!sessionCartId) return null;

    const cart = await prisma.cart.findFirst({
      where: { sessionCartId },
      include: {
        invoices: {
          include: {
            client: true
          }
        }
      }
    });

    // Convert Decimal values to plain JavaScript objects
    return cart ? convertToPlainObject(cart) : null;
  } catch (error) {
    console.error('Error getting cart:', error);
    return null;
  }
}

export async function removeInvoiceFromCart(invoiceId: string) {
  try {
    // Check for cart cookie
    const sessionCartId = (await cookies()).get('sessionCartId')?.value;
    if (!sessionCartId) throw new Error('Cart session not found');

    // Get invoice
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId },
    });
    if (!invoice) throw new Error('Invoice not found');

    // Get user cart
    const cart = await getMyCart();
    if (!cart) throw new Error('Cart not found');

    // Check if the invoice is in the cart
    if (!cart.invoices.some(item => item.id === invoiceId)) {
      return {
        success: false,
        message: `Invoice #${invoice.invoiceNumber} is not in your cart`,
      };
    }

    // Calculate new total price
    const newTotalPrice = Math.max(0, Number(cart.totalPrice) - Number(invoice.totalPrice));

    // Update cart in database
    const updatedCart = await prisma.cart.update({
      where: { id: cart.id },
      data: {
        invoices: {
          disconnect: [{ id: invoiceId }]
        },
        totalPrice: newTotalPrice,
      },
      include: {
        invoices: {
          include: {
            client: true
          }
        }
      }
    });

    revalidatePath(`/invoice/${invoice.id}`);
    revalidatePath('/user/dashboard/client/cart');

    return {
      success: true,
      message: `Invoice #${invoice.invoiceNumber} was removed from cart`,
      cart: convertToPlainObject(updatedCart)
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}


