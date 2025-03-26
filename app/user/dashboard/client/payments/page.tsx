import { Metadata } from 'next';
import { getMyPayments } from '@/lib/actions/payment.actions';
import { formatCurrency, formatDateTime, formatId } from '@/lib/utils';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Pagination from '@/components/shared/pagination';

export const metadata: Metadata = {
  title: 'My Payments',
};

const PaymentsPage = async (props: {
  searchParams: Promise<{ page: string }>;
}) => {
  const { page } = await props.searchParams;

  const payments = await getMyPayments({
    page: Number(page) || 1,
  });

  return (
    <div className='space-y-2'>
      <h2 className='h2-bold'>Payments</h2>
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>DATE</TableHead>
              <TableHead>TOTAL</TableHead>
              <TableHead>PAID</TableHead>
              <TableHead>ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.data.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{formatId(payment.id)}</TableCell>
                <TableCell>
                  {formatDateTime(payment.createdAt).dateTime}
                </TableCell>
                <TableCell>{formatCurrency(payment.amount.toString())}</TableCell>
                <TableCell>
                  {payment.isPaid && payment.paidAt
                    ? formatDateTime(payment.paidAt).dateTime
                    : 'Not Paid'}
                </TableCell>
                <TableCell>
                  <Link href={`/payment/${payment.id}`}>
                    <span className='px-2'>Details</span>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {payments.totalPages > 1 && (
          <Pagination
            page={Number(page) || 1}
            totalPages={payments.totalPages}
          />
        )}
      </div>
    </div>
  );
};

export default PaymentsPage;
