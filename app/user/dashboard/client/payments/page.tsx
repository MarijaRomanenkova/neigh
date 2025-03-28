/**
 * Client Payments Page Component
 * @module Pages
 * @group Dashboard/Client
 * 
 * This page displays all payments made by the current user in their client role.
 * It shows payment history with details like date, amount, and payment status.
 */

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

/**
 * Metadata for the Payments page
 * Sets the page title for SEO purposes
 */
export const metadata: Metadata = {
  title: 'My Payments',
};

/**
 * Client Payments Page Component
 * 
 * Renders a table of all payments made by the user, showing:
 * - Payment ID
 * - Creation date
 * - Total amount
 * - Payment status (paid/unpaid)
 * - Link to payment details
 * 
 * Supports pagination for large payment histories.
 * 
 * @param {Object} props - Component properties
 * @param {Promise<{page: string}>} props.searchParams - URL search parameters for pagination
 * @returns {Promise<JSX.Element>} The rendered payments page with table
 */
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
                  {formatDateTime(payment.createdAt)}
                </TableCell>
                <TableCell>{formatCurrency(Number(payment.amount))}</TableCell>
                <TableCell>
                  {payment.isPaid && payment.paidAt
                    ? formatDateTime(payment.paidAt)
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
