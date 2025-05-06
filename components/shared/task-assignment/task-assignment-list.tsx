/**
 * Task Assignment List Component
 * @module Components
 * @group Shared/TaskAssignment
 * 
 * A component that renders a list of task assignment cards with pagination support.
 * Handles both client and contractor views, displaying relevant information and actions
 * based on the user type.
 * 
 * @example
 * ```tsx
 * <TaskAssignmentList
 *   assignments={assignments}
 *   totalPages={5}
 *   currentPage={1}
 *   viewType="client"
 * />
 * ```
 */

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

/**
 * Type definition for a serialized task assignment
 * @interface SerializedTaskAssignment
 */
interface SerializedTaskAssignment {
  /** Unique identifier for the task assignment */
  id: string;
  /** Creation date of the task assignment */
  createdAt?: string | Date;
  /** Last update date of the task assignment */
  updatedAt?: string | Date;
  /** Completion date of the task assignment */
  completedAt?: string | Date | null;
  /** Whether the task has been reviewed by the client */
  wasReviewed?: boolean;
  /** Whether the client has been reviewed by the contractor */
  wasClientReviewed?: boolean;
  /** Associated task information */
  task: {
    /** Unique identifier for the task */
    id: string;
    /** Name of the task */
    name: string;
    /** Description of the task */
    description: string | null;
    /** Price of the task */
    price: number;
    /** Optional category information */
    category?: {
      /** Name of the category */
      name?: string | null;
    } | null;
  };
  /** Status information for the task assignment */
  status: {
    /** Current status name */
    name: string;
    /** Color theme for the status */
    color: string;
  };
  /** Optional contractor information */
  contractor?: {
    /** Unique identifier for the contractor */
    id: string;
    /** Name of the contractor */
    name?: string;
  } | null;
  /** Optional client information */
  client?: {
    /** Unique identifier for the client */
    id?: string;
    /** Name of the client */
    name?: string;
    /** Email of the client */
    email: string;
  } | null;
  /** Optional invoice items associated with the task */
  invoiceItems?: Array<{
    /** Invoice information */
    invoice: {
      /** Unique identifier for the invoice */
      id: string;
      /** Invoice number */
      invoiceNumber: string;
      /** Optional payment identifier */
      paymentId: string | null;
      /** Optional payment information */
      payment?: {
        /** Whether the invoice has been paid */
        isPaid: boolean;
      };
    };
  }> | null;
}

/**
 * Props for the TaskAssignmentList component
 * @interface TaskAssignmentListProps
 */
interface TaskAssignmentListProps {
  /** Array of task assignments to display */
  assignments: SerializedTaskAssignment[];
  /** Total number of pages for pagination */
  totalPages: number;
  /** Current page number */
  currentPage: number;
  /** Type of user viewing the list ("client" or "contractor") */
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
