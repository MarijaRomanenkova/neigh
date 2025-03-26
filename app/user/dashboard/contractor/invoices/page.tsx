import { auth } from '@/auth';
import InvoiceListTable from '@/components/shared/invoice/invoice-list-table';
import { redirect } from 'next/navigation';
import { getAllOutgoingInvoices } from '@/lib/actions/invoice.actions';

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
