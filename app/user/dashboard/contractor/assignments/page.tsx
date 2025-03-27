/**
 * Contractor Task Assignments Page Component
 * @module Pages
 * @group Dashboard/Contractor
 * 
 * This page displays all task assignments for the logged-in contractor.
 * It shows task assignments with client details, invoice status, and payment information.
 */

import Link from 'next/link';
import { getAllTaskAssignmentsByContractorId } from '@/lib/actions/task-assignment.actions';
import { formatCurrency, formatId } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import Pagination from '@/components/shared/pagination';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Receipt, Check, Clock } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';

/**
 * Contractor Task Assignments Page Component
 * 
 * Renders a grid of cards showing all task assignments assigned to the contractor, with:
 * - Task name and description
 * - Client information
 * - Task status with color coding
 * - Invoice and payment status
 * - Pricing information
 * - Option to issue invoice for completed tasks
 * 
 * Includes authentication protection and redirects unauthenticated users.
 * Supports filtering and pagination for large numbers of assignments.
 * 
 * @param {Object} props - Component properties
 * @param {Promise<{page: string, query: string, category: string}>} props.searchParams - URL search parameters
 * @returns {Promise<JSX.Element>} The rendered task assignments page with card grid
 */
const ContractorTaskAssignmentsPage = async (props: {
  searchParams: Promise<{
    page: string;
    query: string;
    category: string;
  }>;
}) => {
  const searchParams = await props.searchParams;

  const page = Number(searchParams.page) || 1;
  const searchText = searchParams.query || '';
  const category = searchParams.category || '';

  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const tasksAssignments = await getAllTaskAssignmentsByContractorId(session.user.id);

  return (
    <div className='space-y-6'>
      <div className='flex-between'>
        <div className='flex items-center gap-3'>
          <h1 className='h2-bold'>Task Assignments</h1>
          {searchText && (
            <div>
              Filtered by <i>&quot;{searchText}&quot;</i>{' '}
              <Link href='/user/dashboard/contractor/assignments'>
                <Button variant='outline' size='sm'>
                  Remove Filter
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        {tasksAssignments.data.length > 0 ? (
          tasksAssignments.data.map((assignment) => {
            // Check if there's an invoice for this task assignment
            const hasInvoice = assignment.invoiceItems && assignment.invoiceItems.length > 0;
            const invoice = hasInvoice ? assignment.invoiceItems[0].invoice : null;
            const isPaid = invoice?.payment?.isPaid || false;
            
            return (
              <Card key={assignment.id} className='overflow-hidden'>
                <CardHeader className='space-y-1'>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='line-clamp-1'>
                      {assignment.task.name}
                    </CardTitle>
                    <div className='flex items-center gap-2'>
                      {hasInvoice && (
                        <Badge 
                          variant={isPaid ? 'default' : 'secondary'}
                          className={`ml-2 ${isPaid ? 'bg-green-500' : ''}`}
                        >
                          {isPaid ? (
                            <><Check className="mr-1 h-3 w-3" /> Paid</>
                          ) : (
                            <><Clock className="mr-1 h-3 w-3" /> Invoice Sent</>
                          )}
                        </Badge>
                      )}
                      <Badge 
                        style={{
                          backgroundColor: assignment.status.color || 'gray',
                        }}
                      >
                        {assignment.status.name}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className='flex items-center'>
                    Client: {assignment.client.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-2'>
                  {assignment.task.description ? (
                    <p className='text-sm line-clamp-2'>{assignment.task.description}</p>
                  ) : (
                    <p className='text-sm text-muted-foreground'>No description available</p>
                  )}
                  <div className='flex items-center justify-between'>
                    <p className='text-sm font-medium'>
                      Category: <span className='text-muted-foreground'>{assignment.task.category?.name || 'Uncategorized'}</span>
                    </p>
                    <p className='text-sm font-medium'>
                      Price: <span className='text-primary'>{formatCurrency(Number(assignment.task.price))}</span>
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  {hasInvoice ? (
                    <Button 
                      className='w-full' 
                      variant='outline' 
                      disabled
                    >
                      <Receipt className="mr-2 h-4 w-4" />
                      {isPaid ? 'Invoice Paid' : 'Invoice Issued'}
                    </Button>
                  ) : (
                    <Button asChild className='w-full'>
                      <Link 
                        href={{
                          pathname: '/user/dashboard/contractor/invoices/create',
                          query: { 
                            clientId: assignment.client.id,
                            taskId: assignment.task.id
                          }
                        }}
                      >
                        <Receipt className="mr-2 h-4 w-4" />
                        Issue Invoice
                      </Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })
        ) : (
          <div className='col-span-2 text-center p-6 border rounded-lg'>
            <p className='text-muted-foreground'>No task assignments found.</p>
          </div>
        )}
      </div>

      {tasksAssignments.totalPages > 1 && (
        <Pagination page={page} totalPages={tasksAssignments.totalPages} />
      )}
    </div>
  );
};

export default ContractorTaskAssignmentsPage;
