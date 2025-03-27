/**
 * Stripe Payment Success Page Component
 * @module Pages
 * @group Dashboard/Client
 * 
 * This page is displayed after a successful Stripe payment.
 * It verifies the payment and displays a confirmation message.
 */

import { Button } from '@/components/ui/button';
import { getPaymentById } from '@/lib/actions/payment.actions';
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
  const { id } = await props.params;
  const { payment_intent: paymentIntentId } = await props.searchParams;

  // Fetch payment
  const payment = await getPaymentById(id);
  if (!payment) notFound();

  // Retrieve payment intent
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  // Check if payment intent is valid
  if (
    paymentIntent.metadata.paymentId == null ||
    paymentIntent.metadata.paymentId !== payment.id.toString()
  ) {
    return notFound();
  }

  // Check if payment is successful
  const isSuccess = paymentIntent.status === 'succeeded';

  if (!isSuccess) return redirect(`/payment/${id}`);

  return (
    <div className='max-w-4xl w-full mx-auto space-y-8'>
      <div className='flex flex-col gap-6 items-center'>
        <h1 className='h1-bold'>Thanks for your payment</h1>
        <div>We are processing your payment.</div>
        <Button asChild>
          <Link href={`/user/dashboard/client/payment/${id}`}>View Payment</Link>
        </Button>
      </div>
    </div>
  );
};

export default SuccessPage;
