import { Metadata } from 'next';
import { getPaymentById } from '@/lib/actions/payment.actions';
import { notFound, redirect } from 'next/navigation';
import PaymentsTable from './payments-table';
import { auth } from '@/auth';
import Stripe from 'stripe';

export const metadata: Metadata = {
  title: 'Order Details',
};

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
        taxPrice: (Number(payment.amount) * 0.21).toString(),  // Add 21% tax
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
