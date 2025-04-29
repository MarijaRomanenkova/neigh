/**
 * Payment Details Page Component
 * @module Pages
 * @group Dashboard/Client
 * 
 * This page displays detailed information about a specific payment.
 * It shows payment status, invoice details, and payment options if not yet paid.
 */

import { Metadata } from 'next';
import { getPaymentById } from '@/lib/actions/payment.actions';
import { notFound, redirect } from 'next/navigation';
import PaymentsTable from './payments-table';
import { auth } from '@/auth';
import Stripe from 'stripe';

/**
 * Metadata for the Payment Details page
 * Sets the page title for SEO purposes
 */
export const metadata: Metadata = {
  title: 'Order Details',
};

/**
 * Payment Details Page Component
 * 
 * Fetches and displays detailed information about a specific payment including:
 * - Payment status and timestamp
 * - Payment method (Stripe/PayPal)
 * - Related invoices
 * - Payment options if not yet paid
 * 
 * Includes authentication and authorization checks to ensure the user 
 * has permission to view the payment details.
 * For Stripe payments, creates a payment intent if the payment is not yet processed.
 * 
 * @param {Object} props - Component properties
 * @param {Promise<{id: string}>} props.params - Route parameters containing the payment ID
 * @returns {Promise<JSX.Element>} The rendered payment details page
 */
const PaymentDetailsPage = async (props: {
  params: Promise<{
    id: string;
  }>;
}) => {
  const { id } = await props.params;

  const payment = await getPaymentById(id);
  if (!payment) notFound();

  const session = await auth();

  // Redirect the user if they don't own the payment
  if (payment.userId !== session?.user.id && session?.user.role !== 'admin') {
    return redirect('/unauthorized');
  }

  let client_secret = null;

  // Check if is not paid and using stripe
  if (payment.paymentMethod === 'Stripe' && !payment.isPaid) {
    // Init stripe instance
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(payment.amount) * 100),
      currency: 'USD',
      metadata: { paymentId: payment.id },
    });
    client_secret = paymentIntent.client_secret;
  }

  return (
    <PaymentsTable
      payment={{
        ...payment,
        totalPrice: payment.amount.toString(),
        taxPrice: "0", // Set tax to zero instead of calculating 21%
        invoices: payment.invoices.map(item => ({
          id: item.id,
          invoiceNumber: item.invoiceNumber,
          totalPrice: Number(item.totalPrice),
          client: {
            name: item.clientId,
          },
        })),
      }}
      stripeClientSecret={client_secret}
      paypalClientId={process.env.PAYPAL_CLIENT_ID || 'sb'}
      isAdmin={session?.user?.role === 'admin' || false}
    />
  );
};

export default PaymentDetailsPage;
