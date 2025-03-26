import { getInvoiceByNumber } from '@/lib/actions/invoice.actions';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import InvoiceDetails from '@/components/shared/invoice/invoice';
import AddToCartButton from '@/components/shared/invoice/add-to-cart-button';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Invoice } from '@/types';

interface Props {
  params: Promise<{
    invoiceNumber: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { invoiceNumber } = await params;
  return {
    title: `Invoice ${invoiceNumber}`,
  };
}

async function ClientInvoicePage({ params }: Props) {
  // Await the params object to get the invoiceNumber
  const { invoiceNumber } = await params;

  const session = await auth();
  if (!session) return notFound();

  const invoiceData = await getInvoiceByNumber(invoiceNumber);
  
  if (!invoiceData || invoiceData.clientId !== session.user.id) {
    return notFound();
  }
  
  // Cast to proper Invoice type
  const invoice = invoiceData as Invoice;

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/user/dashboard/client/invoices">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Link>
        </Button>
        
        {!invoice.isPaid && (
          <AddToCartButton invoice={invoice} />
        )}
      </div>
      
      <InvoiceDetails invoice={invoice} />
    </div>
  );
}

export default ClientInvoicePage;
