import { getInvoiceByNumber } from '@/lib/actions/invoice.actions';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import Invoice from '@/components/shared/invoice/invoice';

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
