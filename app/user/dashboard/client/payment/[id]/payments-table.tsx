'use client';

/**
 * Payment Details Table Component
 * @module Components
 * @group Payments
 * 
 * This client-side component renders a payment's details in a structured format.
 * It shows payment information, invoices, and payment method options if applicable.
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime, formatId } from '@/lib/utils';
import { Payment } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useTransition } from 'react';
import {
  PayPalButtons,
  PayPalScriptProvider,
  usePayPalScriptReducer,
} from '@paypal/react-paypal-js';
import {
  createPayPalPayment,
  approvePayPalPayment,
} from '@/lib/actions/payment.actions';
import StripePayment from './stripe-payment';

/**
 * Props for the PaymentsTable component
 * @interface PaymentTableProps
 * @property {Object} payment - Payment information with method and tax details
 * @property {string} paypalClientId - PayPal client ID for the SDK
 * @property {boolean} isAdmin - Whether the current user has admin privileges
 * @property {string | null} stripeClientSecret - Stripe client secret for payment processing
 */
type PaymentTableProps = {
  payment: Omit<Payment, "paymentResult"> & {
    paymentMethod: string;
    taxPrice: string;
  };
  paypalClientId: string;
  isAdmin: boolean;
  stripeClientSecret: string | null;
};

/**
 * PayPal Payment Buttons Component
 * 
 * Renders PayPal payment buttons that handle the PayPal payment flow.
 * Creates a PayPal order and processes approval from the PayPal interface.
 * 
 * @param {Object} props - Component properties
 * @param {Omit<Payment, 'paymentResult'>} props.payment - Payment information
 * @param {Function} props.onSuccess - Callback function to run after successful payment
 * @returns {JSX.Element} The rendered PayPal buttons
 */
const PayPalPaymentButtons = ({ payment, onSuccess }: { 
  payment: Omit<Payment, 'paymentResult'>,
  onSuccess: () => void 
}) => {
  const [{ isPending }] = usePayPalScriptReducer();
  const { toast } = useToast();

  if (isPending) return <div>Loading PayPal...</div>;

  return (
    <PayPalButtons 
      createOrder={async () => {
        const response = await createPayPalPayment(payment.id);
        if (!response.success) {
          toast({
            variant: 'destructive',
            description: response.message,
          });
          throw new Error(response.message);
        }
        return response.data;
      }}
      onApprove={async (data) => {
        await approvePayPalPayment(payment.id, {
          paymentId: data.orderID
        });
        toast({
          description: 'Payment completed successfully!',
        });
      }}
    />
  );
};

/**
 * Payments Table Component
 * 
 * Renders a comprehensive view of a payment with:
 * - Payment status and details
 * - List of invoices included in the payment
 * - Payment summary with totals
 * - Payment method options (Stripe/PayPal) if payment is not completed
 * - Admin actions if applicable
 * 
 * Adapts its display based on payment method and payment status.
 * 
 * @param {PaymentTableProps} props - Component properties
 * @returns {JSX.Element} The rendered payment details table
 */
const PaymentsTable = ({
  payment,
  paypalClientId,
  isAdmin,
  stripeClientSecret,
}: PaymentTableProps) => {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  return (
    <>
      <h1 className='text-2xl font-bold mb-6'>Payment {formatId(payment.id)}</h1>
      
      <div className='grid md:grid-cols-3 gap-6'>
        {/* Payment Details */}
        <div className='md:col-span-2'>
          <Card>
            <CardContent className='p-6 space-y-4'>
              <div className='flex justify-between items-center'>
                <h2 className='text-xl font-semibold'>Payment Details</h2>
                <Badge variant={payment.isPaid ? 'paid' : 'unpaid'}>
                  {payment.isPaid 
                    ? `Paid at ${formatDateTime(payment.paidAt!)}`
                    : 'Not paid'}
                </Badge>
              </div>

              <div className='space-y-2'>
                <p><span className='font-medium'>Created:</span> {formatDateTime(payment.createdAt)}</p>
                <p><span className='font-medium'>Payment Method:</span> {payment.paymentMethod}</p>
                <p><span className='font-medium'>User:</span> {payment.user.name}</p>
              </div>

              {/* Invoices Table */}
              <div className='mt-6'>
                <h3 className='text-lg font-semibold mb-3'>Invoices</h3>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b'>
                      <th className='text-left py-2'>Invoice #</th>
                      <th className='text-left py-2'>Client</th>
                      <th className='text-right py-2'>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payment.invoices.map((invoice) => (
                      <tr key={invoice.id} className='border-b'>
                        <td className='py-2'>{invoice.invoiceNumber}</td>
                        <td className='py-2'>{invoice.client.name}</td>
                        <td className='py-2 text-right'>{formatCurrency(invoice.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Summary */}
        <div>
          <Card>
            <CardContent className='p-6 space-y-4'>
              <h2 className='text-xl font-semibold'>Payment Summary</h2>
              
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <span>Subtotal</span>
                  <span>{formatCurrency(Number(payment.totalPrice))}</span>
                </div>
                {Number(payment.taxPrice) > 0 && (
                  <div className='flex justify-between'>
                    <span>Tax (21%)</span>
                    <span>{formatCurrency(Number(payment.taxPrice))}</span>
                  </div>
                )}
                <div className='flex justify-between font-bold border-t pt-2'>
                  <span>Total</span>
                  <span>{formatCurrency(Number(payment.totalPrice) + Number(payment.taxPrice))}</span>
                </div>
              </div>

              {!payment.isPaid && (
                <div className='space-y-4 mt-6'>
                  {payment.paymentMethod === 'Stripe' && stripeClientSecret && (
                    <StripePayment 
                      clientSecret={stripeClientSecret}
                      paymentId={payment.id}
                      priceInCents={Math.round((Number(payment.totalPrice) + Number(payment.taxPrice)) * 100)}
                    />
                  )}
                  
                  {payment.paymentMethod === 'PayPal' && (
                    <PayPalScriptProvider options={{ 
                      clientId: paypalClientId,
                      components: "buttons",
                      currency: "USD"
                    }}>
                      <PayPalPaymentButtons 
                        payment={payment} 
                        onSuccess={() => {
                          toast({
                            description: 'Payment completed successfully!',
                          });
                        }}
                      />
                    </PayPalScriptProvider>
                  )}

                  {isAdmin && (
                    <Button 
                      className='w-full'
                      disabled={isPending}
                      onClick={() => {
                        startTransition(async () => {
                          // Add your mark as paid function here
                          toast({
                            description: 'Payment marked as paid',
                          });
                        });
                      }}
                    >
                      Mark as Paid
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default PaymentsTable;
