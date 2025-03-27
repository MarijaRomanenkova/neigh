/**
 * Checkout Steps Component
 * @module Components
 * @group Shared/Checkout
 * 
 * This component renders a progress indicator for the checkout process.
 * It shows the sequential steps involved in completing an order.
 */

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Checkout Steps Component
 * 
 * Renders a horizontal stepper showing the stages of checkout:
 * - User Login
 * - Shipping Address
 * - Payment Method
 * - Place Order
 * 
 * Highlights the current step and shows connecting lines between steps.
 * Responsive design adapts to different screen sizes.
 * 
 * @param {Object} props - Component properties
 * @param {number} [props.current=0] - Zero-based index of current step
 * @returns {JSX.Element} The rendered checkout steps indicator
 */
const CheckoutSteps = ({ current = 0 }) => {
  return (
    <div className='flex-between flex-col md:flex-row space-x-2 space-y-2 mb-10'>
      {['User Login', 'Shipping Address', 'Payment Method', 'Place Order'].map(
        (step, index) => (
          <React.Fragment key={step}>
            <div
              className={cn(
                'p-2 w-56 rounded-full text-center text-sm',
                index === current ? 'bg-secondary' : ''
              )}
            >
              {step}
            </div>
            {step !== 'Place Order' && (
              <hr className='w-16 border-t border-gray-300 mx-2' />
            )}
          </React.Fragment>
        )
      )}
    </div>
  );
};

export default CheckoutSteps;
