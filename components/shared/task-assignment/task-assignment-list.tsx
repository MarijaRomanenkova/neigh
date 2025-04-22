'use client';

import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt, Check, Clock } from 'lucide-react';
import TaskCompleteButton from './task-complete-button';
import AddInvoiceDialog from './add-invoice-dialog';
import AcceptTaskButton from '../task/accept-task-button';
import TaskAssignmentCard from './task-assignment-card';
import Pagination from '@/components/shared/pagination';

// Define a more specific type for task assignments
interface SerializedTaskAssignment {
  id: string;
  createdAt?: string | Date;
  task: {
    id: string;
    name: string;
    description?: string | null;
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
  } | null;
  invoiceItems?: Array<{
    invoice: {
      id: string;
      payment?: {
        isPaid?: boolean;
      } | null;
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
          
          // Extract client-specific properties
          const contractorId = isClient && assignment.contractor ? assignment.contractor.id : undefined;
          const contractorName = isClient && assignment.contractor ? assignment.contractor.name : undefined;
          
          // Extract contractor-specific properties
          const clientId = isContractor && assignment.client ? assignment.client.id : undefined;
          const clientName = isContractor && assignment.client ? assignment.client.name : undefined;
          
          // Extract invoice properties
          const hasInvoice = Boolean(assignment.invoiceItems && assignment.invoiceItems.length > 0);
          let invoiceId: string | undefined = undefined;
          let isPaid = false; // Default to false
          
          if (hasInvoice && assignment.invoiceItems && assignment.invoiceItems.length > 0) {
            const invoice = assignment.invoiceItems[0].invoice;
            invoiceId = invoice.id;
            // Explicitly convert to boolean with Boolean()
            isPaid = Boolean(invoice.payment?.isPaid);
          }
          
          // Task status
          const isCompleted = status.name === "COMPLETED";
          const hasContractorAccepted = true; // Assume accepted unless a specific field says otherwise
          
          // Use the TaskAssignmentCard component to display each assignment
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
              isPaid={false}
              invoiceId={invoiceId}
              hasContractorAccepted={hasContractorAccepted}
              viewType={viewType}
              createdAt={assignment.createdAt}
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
