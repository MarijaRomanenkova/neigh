import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getAllPayments } from '@/lib/actions/payment.actions';
import { formatCurrency, formatDateTime, formatId } from '@/lib/utils';
import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Pagination from '@/components/shared/pagination';
import { requireAdmin } from '@/lib/auth-guard';

export const metadata: Metadata = {
  title: 'Admin   ',
};

const AdminPaymentsPage = async (props: {
  searchParams: Promise<{ page: string; query: string }>;
}) => {
  const { page = '1', query: searchText } = await props.searchParams;

  await requireAdmin();

  const payments = await getAllPayments({
    page: Number(page),
    query: searchText,
  });

  return (
    <div className='space-y-2'>
      <div className='flex items-center gap-3'>
        <h1 className='h2-bold'>Orders</h1>
        {searchText && (
          <div>
            Filtered by <i>&quot;{searchText}&quot;</i>{' '}
            <Link href='/admin/orders'>
              <Button variant='outline' size='sm'>
                Remove Filter
              </Button>
            </Link>
          </div>
        )}
      </div>
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>DATE</TableHead>
              <TableHead>BUYER</TableHead>
              <TableHead>TOTAL</TableHead>
              <TableHead>PAID</TableHead>
              <TableHead>DELIVERED</TableHead>
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
           
                
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {payments.totalPages > 1 && (
          <Pagination
            page={Number(page) || 1}
            totalPages={payments?.totalPages}
          />
        )}
      </div>
    </div>
  );
};

export default AdminPaymentsPage;
