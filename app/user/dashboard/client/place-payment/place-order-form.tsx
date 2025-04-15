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
import { useState } from 'react';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Client-side handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await createPayment();
      if (res.redirectTo) {
        router.push(res.redirectTo);
      } else if (res.success) {
        // Handle success without redirect if needed
        console.log('Payment created successfully');
      } else {
        // Handle error
        console.error('Payment creation failed:', res.message);
      }
    } catch (error) {
      console.error('Error creating payment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='w-full'>
      <Button type="submit" disabled={isSubmitting} className='w-full'>
        {isSubmitting ? (
          <Loader className='w-4 h-4 animate-spin' />
        ) : (
          <Check className='w-4 h-4' />
        )}{' '}
        Place Order
      </Button>
    </form>
  );
};

export default PlaceOrderForm;
