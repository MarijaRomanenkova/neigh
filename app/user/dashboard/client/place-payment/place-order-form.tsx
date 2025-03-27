'use client';

/**
 * Place Order Form Component
 * @module Components
 * @group Payments
 * 
 * This client-side component renders a form with a submit button to finalize payment.
 * It handles the creation of a payment record and redirects the user to the appropriate payment flow.
 */

import { useRouter } from 'next/navigation';
import { Check, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFormStatus } from 'react-dom';
import { createPayment } from '@/lib/actions/payment.actions';

/**
 * Place Order Form Component
 * 
 * Renders a form with a submit button that creates a payment when clicked.
 * Handles form submission and redirects to the appropriate page based on the server response.
 * 
 * @returns {JSX.Element} The rendered place order form
 */
const PlaceOrderForm = () => {
  const router = useRouter();

  /**
   * Handles form submission
   * Prevents default form behavior, creates a payment, and handles redirection
   * 
   * @param {React.FormEvent} event - The form submission event
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const res = await createPayment();

    if (res.redirectTo) {
      router.push(res.redirectTo);
    }
  };

  /**
   * Place Order Button Component
   * 
   * Renders a submit button with loading state
   * Uses React's useFormStatus hook to track form submission state
   * 
   * @returns {JSX.Element} The rendered button with appropriate loading state
   */
  const PlaceOrderButton = () => {
    const { pending } = useFormStatus();
    return (
      <Button disabled={pending} className='w-full'>
        {pending ? (
          <Loader className='w-4 h-4 animate-spin' />
        ) : (
          <Check className='w-4 h-4' />
        )}{' '}
        Place Order
      </Button>
    );
  };

  return (
    <form onSubmit={handleSubmit} className='w-full'>
      <PlaceOrderButton />
    </form>
  );
};

export default PlaceOrderForm;
