/**
 * Contractor Invoice Detail Page Component
 * @module Pages
 * @group Dashboard/Contractor
 * 
 * This page displays detailed information about a specific invoice for the contractor.
 * It shows invoice details, line items, client information, and payment status.
 */

import { getInvoiceByNumber } from '@/lib/actions/invoice.actions';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import Invoice from '@/components/shared/invoice/invoice';

/**
 * Properties for the ContractorInvoicePage component
 * @interface Props
 * @property {Promise<{invoiceNumber: string}>} params - Route parameters containing the invoice number
 */
interface Props {
  params: Promise<{
    invoiceNumber: string;
  }>;
}

/**
 * Generates metadata for the invoice page
 * Sets the page title based on the invoice number
 * 
 * @param {Props} props - Component properties containing route parameters
 * @returns {Promise<Metadata>} Metadata for the page with appropriate title
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { invoiceNumber } = await params;
  return {
    title: `Invoice ${invoiceNumber}`,
  };
}

/**
 * Contractor Invoice Detail Page Component
 * 
 * Fetches and displays detailed information about a specific invoice, including:
 * - Invoice number, date, and status
 * - Client information
 * - Line items and services
 * - Amount and payment details
 * 
 * Includes authentication and authorization checks to ensure the contractor
 * has permission to view the invoice.
 * 
 * @param {Props} props - Component properties containing route parameters
 * @returns {Promise<JSX.Element | null>} The rendered invoice detail page or notFound
 */
async function ContractorInvoicePage({ params }: Props) {
  const session = await auth();
  if (!session) return notFound();

  const { invoiceNumber } = await params;
  const invoice = await getInvoiceByNumber(invoiceNumber);
  
  if (!invoice || invoice.contractorId !== session.user.id) {
    return notFound();
  }

  return (
    <div className="container max-w-4xl py-8">
      <Invoice invoice={invoice} />
    </div>
  );
}

export default ContractorInvoicePage;
