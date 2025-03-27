/**
 * Payment Method Selection Page Component
 * @module Pages
 * @group Dashboard/Client
 * 
 * This page allows users to select their preferred payment method for future payments.
 * It is part of the checkout flow and shows the payment method selection step.
 */

import { Metadata } from 'next';
import { auth } from '@/auth';
import { getUserById } from '@/lib/actions/user.actions';
import PaymentMethodForm from  './payment-method-form'
import CheckoutSteps from '@/components/shared/checkout-steps';

/**
 * Metadata for the Payment Method page
 * Sets the page title for SEO purposes
 */
export const metadata: Metadata = {
  title: 'Select Payment Method',
};

/**
 * Payment Method Selection Page Component
 * 
 * Displays a form for users to select their preferred payment method (Stripe/PayPal).
 * Retrieves the user's current payment method preference and passes it to the form.
 * Shows the checkout steps progress indicator with the current step highlighted.
 * 
 * @returns {Promise<JSX.Element>} The rendered payment method selection page
 */
const PaymentMethodPage = async () => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) throw new Error('User not found');

  const user = await getUserById(userId);

  return (
    <>
      <CheckoutSteps current={2} />
      <PaymentMethodForm preferredPaymentMethod={user.paymentMethod} />
    </>
  );
};

export default PaymentMethodPage;
