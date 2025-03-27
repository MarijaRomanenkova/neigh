/**
 * Contractor Invoices Page Component
 * @module Pages
 * @group Dashboard/Contractor
 * 
 * This page displays all invoices created by the contractor.
 * It shows invoice details, payment status, and client information.
 */

import { auth } from '@/auth';
import InvoiceListTable from '@/components/shared/invoice/invoice-list-table';
import { redirect } from 'next/navigation';
import { getAllOutgoingInvoices } from '@/lib/actions/invoice.actions';

/**
 * Contractor Invoices Page Component
 * 
 * Renders a table of all invoices created by the contractor, showing:
 * - Invoice number and date
 * - Client information
 * - Amount and payment status
 * 
 * Includes authentication protection and redirects unauthenticated users.
 * Uses the shared InvoiceListTable component to render the data.
 * 
 * @returns {Promise<JSX.Element>} The rendered invoices page with table
 */
export default async function ContractorInvoicesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const invoices = await getAllOutgoingInvoices(session.user.id);

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">My Invoices</h1>
      <InvoiceListTable invoices={invoices} userType="contractor" />
    </div>
  );
}
