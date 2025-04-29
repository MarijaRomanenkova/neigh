/**
 * Stripe Payment Component
 * @module Components
 * @group Payments
 * 
 * This client-side component renders the Stripe payment form.
 * It handles the entire Stripe payment flow, from collecting payment details to processing.
 */

import { FormEvent, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  LinkAuthenticationElement,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { SERVER_URL } from '@/lib/constants';

/**
 * Stripe Payment Component
 * 
 * Renders the Stripe Elements form with theme support and payment processing.
 * Acts as a container that provides the Stripe context to the inner form.
 * 
 * @param {Object} props - Component properties
 * @param {number} props.priceInCents - Payment amount in cents
 * @param {string} props.paymentId - Payment ID from our system
 * @param {string} props.clientSecret - Stripe client secret for the payment intent
 * @returns {JSX.Element} The rendered Stripe payment form
 */
const StripePayment = ({
  priceInCents,
  paymentId,
  clientSecret,
}: {
  priceInCents: number;
  paymentId: string;
  clientSecret: string;
}) => {
  const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
  );

  const { theme, systemTheme } = useTheme();

  /**
   * Stripe Form Component
   * 
   * Inner component that renders the actual payment form elements.
   * Handles form submission and payment confirmation with Stripe.
   * Manages loading states and error messages during the payment process.
   * 
   * @returns {JSX.Element} The rendered Stripe form elements
   */
  const StripeForm = () => {
    const stripe = useStripe();
    const elements = useElements();

    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [email, setEmail] = useState('');

    const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();

      if (stripe == null || elements == null || email == null) return;

      setIsLoading(true);

      stripe
        .confirmPayment({
          elements,
          confirmParams: {
            return_url: `${SERVER_URL}/user/dashboard/client/payment/${paymentId}/stripe-payment-success`,
            receipt_email: email,
          },
        })
        .then(({ error }) => {
          if (
            error?.type === 'card_error' ||
            error?.type === 'validation_error'
          ) {
            setErrorMessage(error?.message ?? 'An unknown error occurred');
          } else if (error) {
            setErrorMessage('An unknown error occurred');
          }
        })
        .finally(() => setIsLoading(false));
    };

    return (
      <form className='space-y-4' onSubmit={handleSubmit}>
        <div className='text-xl'>Stripe Checkout</div>
        {errorMessage && <div className='text-destructive'>{errorMessage}</div>}
        <PaymentElement />
        <div>
          <LinkAuthenticationElement
            onChange={(e) => setEmail(e.value.email)}
          />
        </div>
        <Button
          className='w-full'
          size='lg'
          disabled={stripe == null || elements == null || isLoading}
        >
          {isLoading
            ? 'Purchasing...'
            : `Purchase ${formatCurrency(priceInCents / 100)}`}
        </Button>
      </form>
    );
  };

  return (
    <Elements
      options={{
        clientSecret,
        appearance: {
          theme:
            theme === 'dark'
              ? 'night'
              : theme === 'light'
              ? 'stripe'
              : systemTheme === 'light'
              ? 'stripe'
              : 'night',
        },
      }}
      stripe={stripePromise}
    >
      <StripeForm />
    </Elements>
  );
};

export default StripePayment;
