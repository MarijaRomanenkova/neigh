/**
 * Task Assignment Card Component
 * @module Components
 * @group Shared/TaskAssignment
 * 
 * This component renders a card displaying task assignment information,
 * linking a task to a contractor with status information.
 */

'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Check, Clock, Receipt, MessageSquare, Calendar } from "lucide-react";
import TaskCompleteButton from "./task-complete-button";
import AddInvoiceDialog from "./add-invoice-dialog";
import AcceptTaskButton from "./accept-task-button";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { updateTaskAssignmentStatus } from "@/lib/actions/task-assignment-status.actions";
import ReviewTaskDialog from "./review-task-dialog";
import ReviewClientDialog from "./review-client-dialog";

// Simple function to format dates in DD-MM-YYYY format
const formatDateAsDDMMYYYY = (date: string | Date | number | object | undefined): string => {
  try {
    // If it's a date string with ISO format (2023-01-15T...)
    if (typeof date === 'string' && date.includes('-')) {
      const parts = date.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    
    // If it's a Date object
    if (date instanceof Date) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    }
    
    // For any other case, try new Date() with type checking
    if (date !== undefined) {
      const jsDate = new Date(date as string | number | Date);
      if (!isNaN(jsDate.getTime())) {
        const day = String(jsDate.getDate()).padStart(2, '0');
        const month = String(jsDate.getMonth() + 1).padStart(2, '0');
        const year = jsDate.getFullYear();
        return `${day}-${month}-${year}`;
      }
    }
    
    return "Today";
  } catch (error) {
    return "Today";
  }
};

// Type for a minimal task assignment that both client and contractor views can use
interface TaskAssignmentCardProps {
  id: string;
  taskId: string;
  taskName: string;
  taskDescription?: string | null;
  categoryName?: string | null;
  price: number;
  status: {
    name: string;
    color: string;
  };
  // For contractor view
  clientId?: string;
  clientName?: string;
  // For client view
  contractorId?: string;
  contractorName?: string;
  // For invoice info
  hasInvoice?: boolean;
  isPaid?: boolean;
  invoiceId?: string;
  // For task acceptance status
  hasContractorAccepted?: boolean;
  // What type of user is viewing this card
  viewType: 'client' | 'contractor';
  // Assignment creation date
  createdAt?: string | Date;
  // Review statuses
  reviewedByClient?: boolean;
  reviewedByContractor?: boolean;
}

/**
 * ContactButton Component for task assignments
 * 
 * A button that handles navigation to the appropriate conversation
 * for a specific task assignment between a client and contractor.
 */
function ContactButton({ 
  taskId, 
  clientId, 
  contractorId, 
  viewType 
}: { 
  taskId: string; 
  clientId?: string; 
  contractorId?: string; 
  viewType: 'client' | 'contractor' 
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Ensure we have the required IDs
  if (!clientId || !contractorId) {
    return null;
  }

  const handleContact = async () => {
    try {
      setIsLoading(true);
      
      // First, check if a conversation already exists for this task
      const response = await fetch(`/api/conversations?taskId=${taskId}`);
      
      if (!response.ok) {
        throw new Error('Failed to check for existing conversations');
      }
      
      const conversations = await response.json();
      
      if (conversations && conversations.length > 0) {
        // Conversation exists, navigate to it
        router.push(`/user/dashboard/messages/${conversations[0].id}`);
      } else {
        // No existing conversation, create a new one
        const createResponse = await fetch('/api/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            taskId,
            participantIds: [viewType === 'contractor' ? clientId : contractorId]
          }),
        });
        
        if (!createResponse.ok) {
          throw new Error('Failed to create conversation');
        }
        
        const newConversation = await createResponse.json();
        router.push(`/user/dashboard/messages/${newConversation.id}`);
      }
    } catch (error) {
      console.error('Error navigating to conversation:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to open conversation. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="success"
      onClick={handleContact}
      disabled={isLoading}
    >
      {isLoading ? "Connecting..." : (
        <>
          <MessageSquare className="mr-1 h-4 w-4" />
          Contact
        </>
      )}
    </Button>
  );
}

// Define a type for the badge variants
type StatusBadgeVariant = 
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'success'
  | 'warning'
  | 'paid'
  | 'unpaid'
  | 'pending'
  | 'inProgress'
  | 'completed'
  | 'cancelled'
  | 'archived';

// Function to determine which badge variant to use based on status name
const getStatusVariant = (statusName: string): StatusBadgeVariant => {
  const normalizedStatus = statusName.toLowerCase().replace(/\s+/g, '');
  
  switch (normalizedStatus) {
    case 'pending':
      return 'pending';
    case 'inprogress':
    case 'in-progress':
    case 'in_progress':
      return 'inProgress';
    case 'completed':
    case 'complete':
      return 'completed';
    case 'cancelled':
    case 'canceled':
      return 'cancelled';
    case 'archived':
      return 'archived';
    default:
      return 'secondary';
  }
};

export default function TaskAssignmentCard({
  id,
  taskId,
  taskName,
  taskDescription,
  categoryName,
  price,
  status,
  clientId,
  clientName,
  contractorId,
  contractorName,
  hasInvoice,
  isPaid = false,
  invoiceId,
  hasContractorAccepted,
  viewType,
  createdAt,
  reviewedByClient,
  reviewedByContractor,
}: TaskAssignmentCardProps) {
  // Check for completed status in a case-insensitive way
  const isCompleted = status.name.toLowerCase() === "completed";
  // Check for accepted status directly from status name
  const isAccepted = status.name === "ACCEPTED";
  const isContractorView = viewType === 'contractor';
  const isClientView = viewType === 'client';
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Function to handle completing a task as client
  const completeTask = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      
      // Use the server action instead of fetch API call
      const result = await updateTaskAssignmentStatus(id, 'completed');
      
      if (!result) {
        throw new Error('Failed to complete task');
      }
      
      toast({
        title: "Task completed successfully",
        description: "The task has been marked as completed.",
        variant: "default",
      });
      
      router.refresh();
    } catch (error) {
      toast({
        title: "Error completing task",
        description: error instanceof Error ? error.message : "There was a problem completing this task. Please try again.",
        variant: "destructive",
      });
      console.error('Error completing task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-0.5 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="line-clamp-1">{taskName}</CardTitle>
          <div className="flex items-center gap-2">
            {hasInvoice && isContractorView && (
              <Badge
                variant={isPaid ? "paid" : "unpaid"}
              >
                {isPaid ? (
                  <>
                    <Check className="mr-1 h-3 w-3" /> Paid
                  </>
                ) : (
                  <>
                    <Clock className="mr-1 h-3 w-3" /> Invoice Sent
                  </>
                )}
              </Badge>
            )}
            <Badge
              variant={getStatusVariant(status.name)}
              className="px-2.5 py-1 rounded-md shadow-sm"
            >
              {status.name}
            </Badge>
          </div>
        </div>
        {createdAt && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Assigned on {formatDateAsDDMMYYYY(createdAt)}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-1 py-2">
        {taskDescription ? (
          <p className="text-sm line-clamp-2">{taskDescription}</p>
        ) : (
          <p className="text-sm text-muted-foreground">No description available</p>
        )}
        
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            Category: <span className="text-muted-foreground">{categoryName || "Uncategorized"}</span>
          </p>
        </div>
        
        {isClientView && isCompleted && (
          <div className="flex items-center gap-2 mt-1">
            <Check className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600">
              Marked as completed by contractor
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-2">
        <div className="flex items-center">
          {isContractorView && clientName && (
            <div className="flex items-center text-base">
              <span className="font-medium mr-1.5">Client:</span>
              <span className="text-muted-foreground">{clientName}</span>
            </div>
          )}
          {isClientView && contractorName && (
            <div className="flex items-center text-base">
              <span className="font-medium mr-1.5">Contractor:</span>
              <span className="text-muted-foreground">{contractorName}</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          {/* Invoice functionality - independent of status flow */}
          {isContractorView && (
            <>
              {hasInvoice ? (
                <AddInvoiceDialog
                  key={`invoice-dialog-${id}`}
                  taskId={taskId}
                  clientId={clientId || ''}
                  taskAssignmentId={id}
                >
                  <Button
                    variant="warning-outline"
                    size="sm"
                  >
                    <Receipt className="mr-1 h-4 w-4" />
                    Issue Invoice
                  </Button>
                </AddInvoiceDialog>
              ) : (
                <Button
                  asChild
                  variant="warning"
                  size="sm"
                >
                  <Link href={`/user/dashboard/contractor/invoices/create?taskAssignmentId=${id}&clientId=${clientId || ''}&taskId=${taskId}`}>
                    <Receipt className="mr-1 h-4 w-4" />
                    Issue Invoice
                  </Link>
                </Button>
              )}
            </>
          )}

          {/* Step 1: Contractor can mark task as complete if not already completed */}
          {isContractorView && !isCompleted && (
            <Button
              onClick={completeTask}
              variant="success"
              size="sm"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Complete"}
            </Button>
          )}
          
          {/* Step 2: Client can accept a completed task */}
          {isClientView && status.name.toLowerCase() === 'completed' && (
            <AcceptTaskButton 
              taskAssignmentId={id} 
              className="" 
            />
          )}

          {/* Step 3: After task is accepted, both parties can submit reviews */}
          {/* Review Button for clients */}
          {isClientView && status.name === "ACCEPTED" && (
            <ReviewTaskDialog 
              taskAssignmentId={id}
              taskName={taskName}
              isEditMode={reviewedByClient}
            >
              <Button
                variant="warning"
                size="sm"
              >
                <span className="mr-1">★</span>
                {reviewedByClient ? "Edit Review" : "Submit Review"}
              </Button>
            </ReviewTaskDialog>
          )}

          {/* Review Button for contractors */}
          {isContractorView && status.name === "ACCEPTED" && (
            <ReviewClientDialog 
              taskAssignmentId={id}
              clientName={clientName || 'Client'}
              isEditMode={reviewedByContractor}
            >
              <Button
                variant="warning"
                size="sm"
              >
                <span className="mr-1">★</span>
                {reviewedByContractor ? "Edit Review" : "Review Client"}
              </Button>
            </ReviewClientDialog>
          )}
          
          <Button asChild variant="success-outline" size="sm">
            <Link href={`/user/dashboard/task-assignments/${id}`}>View Details</Link>
          </Button>

          {clientId && contractorId && (
            <ContactButton
              taskId={taskId}
              clientId={clientId}
              contractorId={contractorId}
              viewType={viewType}
            />
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
