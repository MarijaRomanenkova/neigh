'use client';

import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt, Check, Clock } from 'lucide-react';
import TaskCompleteButton from './task-complete-button';
import AddInvoiceDialog from './add-invoice-dialog';
import AcceptTaskButton from './accept-task-button';
import TaskAssignmentCard from './task-assignment-card';
import Pagination from '@/components/shared/pagination';

// Define a more specific type for task assignments
interface SerializedTaskAssignment {
  id: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  completedAt?: string | Date | null;
  wasReviewed?: boolean;
  wasClientReviewed?: boolean;
  task: {
    id: string;
    name: string;
    description: string | null;
    price: number; // Price as a number, not Decimal
    category?: {
      name?: string | null;
    } | null;
  };
  status: {
    name: string;
    color: string;
  };
  contractor?: {
    id: string;
    name?: string;
  } | null;
  client?: {
    id?: string;
    name?: string;
    email: string;
  } | null;
  invoiceItems?: Array<{
    invoice: {
      id: string;
      invoiceNumber: string;
      paymentId: string | null;
      payment?: {
        isPaid: boolean;
      };
    };
  }> | null;
}

interface TaskAssignmentListProps {
  assignments: SerializedTaskAssignment[];
  totalPages: number;
  currentPage: number;
  viewType: 'client' | 'contractor';
}

export default function TaskAssignmentList({
  assignments,
  totalPages,
  currentPage,
  viewType,
}: TaskAssignmentListProps) {
  const isClient = viewType === 'client';
  const isContractor = viewType === 'contractor';

  if (!assignments || assignments.length === 0) {
    return (
      <div className="col-span-2 text-center p-6 border rounded-lg">
        <p className="text-muted-foreground">No task assignments found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {assignments.map((assignment) => {
          // Extract common properties
          const id = assignment.id;
          const taskId = assignment.task.id;
          const taskName = assignment.task.name;
          const taskDescription = assignment.task.description;
          const price = assignment.task.price; // Already a number
          const status = {
            name: assignment.status.name,
            color: assignment.status.color,
          };
          const categoryName = assignment.task.category?.name;
          
          // Always extract both client and contractor IDs/names regardless of view type
          const contractorId = assignment.contractor?.id;
          const contractorName = assignment.contractor?.name;
          const clientId = assignment.client?.id;
          const clientName = assignment.client?.name;
          
          // Extract invoice properties
          const hasInvoice = Boolean(assignment.invoiceItems && assignment.invoiceItems.length > 0);
          let invoiceId: string | undefined = undefined;
          let isPaid = false;
          
          if (hasInvoice && assignment.invoiceItems && assignment.invoiceItems.length > 0) {
            const invoice = assignment.invoiceItems[0].invoice;
            invoiceId = invoice.id;
            // Explicitly convert to boolean with Boolean()
            isPaid = Boolean(invoice.payment?.isPaid);
          }
          
          // Task status
          const isCompleted = status.name === "COMPLETED";
          const hasContractorAccepted = true; // Assume accepted unless a specific field says otherwise
          
          // Create the task assignment card
          return (
            <TaskAssignmentCard
              key={id}
              id={id}
              taskId={taskId}
              taskName={taskName}
              taskDescription={taskDescription}
              categoryName={categoryName}
              price={price}
              status={status}
              clientId={clientId}
              clientName={clientName}
              contractorId={contractorId}
              contractorName={contractorName}
              hasInvoice={hasInvoice}
              isPaid={isPaid}
              invoiceId={invoiceId}
              hasContractorAccepted={true}
              viewType={viewType}
              createdAt={assignment.createdAt}
              reviewedByClient={assignment.wasReviewed}
              reviewedByContractor={assignment.wasClientReviewed}
            />
          );
        })}
      </div>

      {totalPages > 1 && (
        <Pagination page={currentPage} totalPages={totalPages} />
      )}
    </div>
  );
} 
