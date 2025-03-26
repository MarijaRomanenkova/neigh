import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPaymentSummary } from '@/lib/actions/payment.actions';
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/utils';
import { BadgeDollarSign, Barcode, CreditCard, Users } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';
import Charts from './charts';
import { requireAdmin } from '@/lib/auth-guard';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
};

const AdminOverviewPage = async () => {
  await requireAdmin();

  const summary = await getPaymentSummary();

  return (
    <div className='space-y-2'>
      <h1 className='h2-bold'>Dashboard</h1>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Revenue</CardTitle>
            <BadgeDollarSign />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatCurrency(
                summary.totalSales._sum.amount?.toString() || 0
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Sales</CardTitle>
            <CreditCard />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatNumber(summary.paymentsCount)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Customers</CardTitle>
            <Users />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatNumber(summary.usersCount)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>tasks</CardTitle>
            <Barcode />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatNumber(summary.tasksCount)}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
        <Card className='col-span-4'>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <Charts
              data={{
                salesData: summary.salesData,
              }}
            />
          </CardContent>
        </Card>
        <Card className='col-span-3'>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>BUYER</TableHead>
                  <TableHead>DATE</TableHead>
                  <TableHead>TOTAL</TableHead>
                  <TableHead>ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.latestSales.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {formatDateTime(payment.createdAt).dateOnly}
                    </TableCell>
                    <TableCell>{formatCurrency(payment.amount.toString())}</TableCell>
                    <TableCell>
                      <Link href={`/payment/${payment.id}`}>
                        <span className='px-2'>Details</span>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverviewPage;
