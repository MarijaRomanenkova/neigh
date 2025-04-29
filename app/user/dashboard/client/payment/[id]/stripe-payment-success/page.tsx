/**
 * Stripe Payment Success Page Component
 * @module Pages
 * @group Dashboard/Client
 * 
 * This page is displayed after a successful Stripe payment.
 * It verifies the payment and displays a confirmation message.
 */

import { Button } from '@/components/ui/button';
import { getPaymentById, updatePaymentToPaid } from '@/lib/actions/payment.actions';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

/**
 * Stripe Payment Success Page Component
 * 
 * Handles the callback from Stripe after payment completion.
 * Verifies the payment with the Stripe API and checks that it matches our records.
 * Displays a success message if everything is valid.
 * 
 * Security:
 * - Validates the payment intent ID from the query parameters
 * - Ensures the payment intent's metadata matches our payment record
 * - Checks that the payment status is "succeeded"
 * 
 * @param {Object} props - Component properties
 * @param {Promise<{id: string}>} props.params - Route parameters containing the payment ID
 * @param {Promise<{payment_intent: string}>} props.searchParams - URL search parameters containing the payment intent ID
 * @returns {Promise<JSX.Element>} The rendered success page
 */
const SuccessPage = async (props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment_intent: string }>;
}) => {
  console.log('Stripe Payment Success: Processing page load');
  
  try {
    const { id } = await props.params;
    const { payment_intent: paymentIntentId } = await props.searchParams;
    
    console.log('Payment ID:', id);
    console.log('Payment Intent ID:', paymentIntentId);

    // Fetch payment
    const payment = await getPaymentById(id);
    if (!payment) {
      console.error('Payment not found:', id);
      return notFound();
    }
    
    console.log('Payment found:', {
      id: payment.id,
      isPaid: payment.isPaid,
      amount: payment.amount,
      invoices: payment.invoices.length
    });

    // Retrieve payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log('Payment Intent retrieved:', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      metadata: paymentIntent.metadata,
      amount: paymentIntent.amount
    });

    // Check if payment intent is valid
    if (paymentIntent.metadata.paymentId == null) {
      console.error('Payment intent does not have paymentId in metadata');
      return notFound();
    }
    
    if (paymentIntent.metadata.paymentId !== payment.id.toString()) {
      console.error('Payment intent paymentId does not match payment ID', {
        intentPaymentId: paymentIntent.metadata.paymentId,
        paymentId: payment.id.toString()
      });
      return notFound();
    }

    // Check if payment is successful
    const isSuccess = paymentIntent.status === 'succeeded';
    console.log('Payment success status:', isSuccess);

    if (!isSuccess) {
      console.log('Payment not successful, redirecting back to payment page');
      return redirect(`/payment/${id}`);
    }
    
    // If payment is not yet marked as paid in our system, update it
    if (!payment.isPaid) {
      console.log('Payment not marked as paid yet, updating payment status...');
      try {
        await updatePaymentToPaid(payment.id, {
          id: paymentIntent.id,
          status: 'COMPLETED',
          email_address: paymentIntent.receipt_email || '',
          pricePaid: (paymentIntent.amount / 100).toFixed(),
          amount: (paymentIntent.amount / 100).toFixed(),
          created_at: new Date().toISOString(),
        });
        console.log('Payment successfully marked as paid');
      } catch (error) {
        console.error('Error updating payment status:', error);
      }
    } else {
      console.log('Payment is already marked as paid');
    }

    return (
      <div className='max-w-4xl w-full mx-auto space-y-8'>
        <div className='flex flex-col gap-6 items-center'>
          <h1 className='h1-bold'>Thanks for your payment</h1>
          <div>We have successfully processed your payment.</div>
          <Button asChild>
            <Link href={`/user/dashboard/client/payment/${id}`}>View Payment</Link>
          </Button>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error processing payment success page:', error);
    return (
      <div className='max-w-4xl w-full mx-auto space-y-8'>
        <div className='flex flex-col gap-6 items-center'>
          <h1 className='h1-bold'>Payment Processing Error</h1>
          <div>We encountered an error while processing your payment. Our team has been notified.</div>
          <Button asChild>
            <Link href="/user/dashboard/client/invoices">Return to Invoices</Link>
          </Button>
        </div>
      </div>
    );
  }
};

export default SuccessPage;
