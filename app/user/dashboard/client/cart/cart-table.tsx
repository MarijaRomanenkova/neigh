'use client';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useTransition } from 'react';
import { removeInvoiceFromCart } from '@/lib/actions/cart.actions';
import { ArrowRight, Loader, Minus } from 'lucide-react';
import { Cart } from '@/types';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

// Define simplified types for the cart data after conversion to plain objects
interface ClientInfo {
  name: string;
  email: string;
}

interface InvoiceWithClient {
  id: string;
  invoiceNumber: string;
  totalPrice: number;
  client: ClientInfo;
}

interface CartWithInvoices {
  id: string;
  totalPrice: number;
  invoices: InvoiceWithClient[];
}

function RemoveButton({ invoice }: { invoice: InvoiceWithClient }) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  return (
    <Button
      disabled={isPending}
      variant='outline'
      type='button'
      onClick={() =>
        startTransition(async () => {
          const res = await removeInvoiceFromCart(invoice.id);

          if (!res.success) {
            toast({
              variant: 'destructive',
              description: res.message,
            });
          } else {
            toast({
              description: res.message,
            });
            // Refresh the page to update the cart
            router.refresh();
          }
        })
      }
    >
      {isPending ? (
        <Loader className='w-4 h-4 animate-spin' />
      ) : (
        <Minus className='w-4 h-4' />
      )}
    </Button>
  );
}

const CartTable = ({ cart }: { cart: CartWithInvoices | null }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <h1 className='py-4 h2-bold'>Payment Cart</h1>
      {!cart || cart.invoices.length === 0 ? (
        <div>
          Cart is empty. <Link href='/invoices'>View Invoices</Link>
        </div>
      ) : (
        <div className='grid md:grid-cols-4 md:gap-5'>
          <div className='overflow-x-auto md:col-span-3'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className='text-right'>Amount</TableHead>
                  <TableHead className='text-center'>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>#{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.client.name}</TableCell>
                    <TableCell className='text-right'>
                      {formatCurrency(invoice.totalPrice)}
                    </TableCell>
                    <TableCell className='text-center'>
                      <RemoveButton invoice={invoice} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Card>
            <CardContent className='p-4 gap-4'>
              <div className='pb-3 text-xl'>
                Total Amount:
                <span className='font-bold'>
                  {formatCurrency(cart.totalPrice)}
                </span>
              </div>
              <Button
                className='w-full'
                disabled={isPending}
                onClick={() =>
                  startTransition(() => router.push('/payment'))
                }
              >
                {isPending ? (
                  <Loader className='w-4 h-4 animate-spin' />
                ) : (
                  <ArrowRight className='w-4 h-4' />
                )}
                {' '}Proceed to Payment
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default CartTable;
