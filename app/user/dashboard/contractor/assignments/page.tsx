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
import { Button } from '@/components/ui/button';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import TaskAssignmentList from '@/components/shared/task-assignment/task-assignment-list';

interface PageProps {
  params: Promise<{ [key: string]: string | string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Define the type for serialized task assignments
interface SerializedTaskAssignment {
  id: string;
  createdAt?: string | Date;
  task: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category?: {
      name: string;
    };
  };
  client?: {
    id: string;
    name: string;
    email: string;
  };
  status: {
    name: string;
    color: string;
  };
  invoiceItems?: Array<{
    invoice: {
      id: string;
      invoiceNumber: string;
      paymentId: string | null;
      payment?: {
        isPaid: boolean;
      };
    };
  }>;
  wasReviewed?: boolean;
  wasClientReviewed?: boolean;
}

const ContractorTaskAssignmentsPage = async ({ params, searchParams }: PageProps) => {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const page = Number(resolvedSearchParams?.page) || 1;
  const searchText = resolvedSearchParams?.query?.toString() || '';
  const category = resolvedSearchParams?.category?.toString() || '';

  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const tasksAssignments = await getAllTaskAssignmentsByContractorId(session.user.id);

  // Convert Decimal objects to regular numbers for client components
  const serializedAssignments = tasksAssignments.data.map(assignment => ({
    ...assignment,
    task: {
      ...assignment.task,
      price: Number(assignment.task.price)
    }
  })) as SerializedTaskAssignment[];

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

      <TaskAssignmentList 
        assignments={serializedAssignments}
        totalPages={tasksAssignments.totalPages}
        currentPage={page}
        viewType="contractor"
      />
    </div>
  );
};

export default ContractorTaskAssignmentsPage;
