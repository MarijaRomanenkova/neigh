/**
 * Client Invoice Detail Page Component
 * @module Pages
 * @group Dashboard/Client
 * 
 * This page displays detailed information about a specific invoice received by the client.
 * It includes invoice items, totals, and payment options if the invoice is unpaid.
 */

import { getInvoiceByNumber } from '@/lib/actions/invoice.actions';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import InvoiceDetails from '@/components/shared/invoice/invoice';
import AddToCartButton from '@/components/shared/invoice/add-to-cart-button';
import DownloadInvoiceButton from '@/components/shared/invoice/download-invoice-button';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Invoice } from '@/types';

/**
 * Props for the ClientInvoicePage component
 * @interface Props
 * @property {Promise<{invoiceNumber: string}>} params - Route parameters containing the invoice number
 */
interface Props {
  params: Promise<{
    invoiceNumber: string;
  }>;
}

/**
 * Generate metadata for the invoice detail page
 * 
 * @param {Props} props - Component properties
 * @returns {Promise<Metadata>} Page metadata with invoice number in title
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { invoiceNumber } = await params;
  return {
    title: `Invoice ${invoiceNumber}`,
  };
}

/**
 * Client Invoice Detail Page Component
 * 
 * Renders detailed information for a specific invoice including:
 * - Invoice header with number, date, and status
 * - Contractor and client details
 * - Line items with descriptions and costs
 * - Total amounts and taxes
 * - Payment options for unpaid invoices
 * 
 * Includes authentication and authorization checks to ensure the 
 * invoice belongs to the current user.
 * 
 * @param {Props} props - Component properties
 * @returns {Promise<JSX.Element>} The rendered invoice detail page
 */
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
        
        <div className="flex items-center gap-3">
          <DownloadInvoiceButton invoiceNumber={invoice.invoiceNumber} />
          
          {!invoice.isPaid && (
            <AddToCartButton invoice={invoice} />
          )}
        </div>
      </div>
      
      <InvoiceDetails invoice={invoice} />
    </div>
  );
}

export default ClientInvoicePage;
