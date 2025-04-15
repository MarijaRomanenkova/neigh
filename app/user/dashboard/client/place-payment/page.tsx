/**
 * Place Payment Page Component
 * @module Pages
 * @group Dashboard/Client
 * 
 * This page is the final step in the checkout process where users review and place their payment.
 * It displays payment method, invoice details, and total amount before final submission.
 */

import { auth } from '@/auth';
import { getMyCart } from '@/lib/actions/cart.actions';
import { getUserById } from '@/lib/actions/user.actions';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import CheckoutSteps from '@/components/shared/checkout-steps';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import PlaceOrderForm from './place-order-form';

// Force dynamic rendering since we use cookies
export const dynamic = 'force-dynamic';

/**
 * Metadata for the Place Payment page
 * Sets the page title for SEO purposes
 */
export const metadata: Metadata = {
  title: 'Place Order',
};

/**
 * Place Payment Page Component
 * 
 * Displays a summary of the payment about to be made, including:
 * - Selected payment method with option to edit
 * - List of invoices included in the payment
 * - Order summary with total amount
 * - Button to place the order and create the payment
 * 
 * Security:
 * - Validates that the user is authenticated
 * - Ensures the cart is not empty
 * - Verifies payment method is selected
 * 
 * @returns {Promise<JSX.Element>} The rendered place payment page
 */
const PlacePaymentPage = async () => {
  const cart = await getMyCart();
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) throw new Error('User not found');

  const user = await getUserById(userId);

  if (!cart || cart.invoices.length === 0) redirect('/cart');
  if (!user.paymentMethod) redirect('/payment-method');

  return (
    <>
      <CheckoutSteps current={3} />
      <h1 className='py-4 text-2xl'>Place Order</h1>
      <div className='grid md:grid-cols-3 md:gap-5'>
        <div className='md:col-span-2 overflow-x-auto space-y-4'>
          <Card>
            <CardContent className='p-4 gap-4'>
              <h2 className='text-xl pb-4'>Payment Method</h2>
              <p>{user.paymentMethod}</p>
              <div className='mt-3'>
                <Link href='/payment-method'>
                  <Button variant='outline'>Edit</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4 gap-4'>
              <h2 className='text-xl pb-4'>Invoices</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <Link
                          href={`/task/{invoice.invoiceNumber}`}
                          className='flex items-center'
                        >
                          <span className='px-2'>{invoice.contractorId}</span>
                        </Link>
                      </TableCell>
                      <TableCell className='text-right'>
                        ${invoice.totalPrice.toString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardContent className='p-4 gap-4 space-y-4'>
              <div className='flex justify-between'>
                <div>Invoices</div>
                <div>{formatCurrency(Number(cart.totalPrice))}</div>
              </div>
              <div className='flex justify-between'>
                <div>Total</div>
                <div>{formatCurrency(Number(cart.totalPrice))}</div>
              </div>
              <PlaceOrderForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default PlacePaymentPage;
