import { auth } from '@/auth';
import InvoiceListTable from '@/components/shared/invoice/invoice-list-table';
import { redirect } from 'next/navigation';
import { getAllIncomingInvoices } from '@/lib/actions/invoice.actions';

export default async function ClientInvoicesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const invoices = await getAllIncomingInvoices(session.user.id);

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">My Invoices</h1>
      <InvoiceListTable invoices={invoices} userType="client" />
    </div>
  );
}

