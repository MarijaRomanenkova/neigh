/**
 * Client Task Assignments Page Component
 * @module Pages
 * @group Dashboard/Client
 * 
 * This page displays all task assignments created by the current user in their client role.
 * It shows task assignments with contractor details and status information.
 */

import { getAllTaskAssignmentsByClientId } from '@/lib/actions/task-assignment.actions';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import TaskAssignmentCard from '@/components/shared/task-assignment/task-assignment-card';
import Pagination from '@/components/shared/pagination';

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
  contractor?: {
    id: string;
    name: string;
  };
  status: {
    name: string;
    color: string;
  };
  wasReviewed?: boolean;
  wasClientReviewed?: boolean;
}

const ClientTaskAssignmentsPage = async ({ params, searchParams }: PageProps) => {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const page = Number(resolvedSearchParams?.page) || 1;

  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const userId = session.user.id; // Store user ID for later use
  const tasksAssignments = await getAllTaskAssignmentsByClientId(userId);

  // Convert Decimal objects to regular numbers for client components
  const serializedAssignments = tasksAssignments.data.map(assignment => ({
    ...assignment,
    task: {
      ...assignment.task,
      id: assignment.task.id || '',
      price: Number(assignment.task.price)
    }
  })) as SerializedTaskAssignment[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="h2-bold">Task Assignments</h1>
      </div>

      <div className="grid gap-6">
        {serializedAssignments.length > 0 ? (
          serializedAssignments.map((assignment) => (
            <TaskAssignmentCard
              key={assignment.id}
              id={assignment.id}
              taskId={assignment.task.id}
              taskName={assignment.task.name}
              taskDescription={assignment.task.description}
              categoryName={assignment.task.category?.name}
              price={assignment.task.price}
              status={{
                name: assignment.status.name,
                color: assignment.status.color,
              }}
              clientId={userId}
              contractorId={assignment.contractor?.id}
              contractorName={assignment.contractor?.name}
              hasInvoice={false}
              isPaid={false}
              hasContractorAccepted={true}
              viewType="client"
              createdAt={assignment.createdAt}
              reviewedByClient={assignment.wasReviewed}
              reviewedByContractor={assignment.wasClientReviewed}
            />
          ))
        ) : (
          <div className="col-span-2 text-center p-6 border rounded-lg">
            <p className="text-muted-foreground">No task assignments found.</p>
          </div>
        )}
      </div>

      {tasksAssignments.totalPages > 1 && (
        <Pagination page={page} totalPages={tasksAssignments.totalPages} />
      )}
    </div>
  );
};

export default ClientTaskAssignmentsPage;
