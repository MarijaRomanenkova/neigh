'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, FileText, MessageSquare, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DashboardHeader from '@/components/shared/dashboard-header';
import GoBackButton from '@/components/shared/go-back-button';
import StatusUpdateButtons from './status-update-buttons';
import AcceptTaskButton from './accept-task-button';
import ReviewTaskDialog from './review-task-dialog';
import ReviewClientDialog from './review-client-dialog';
import ReviewNeighbourDialog from './review-neighbour-dialog';
import { StarRatingDisplay } from '@/components/ui/star-rating-display';
import { TaskAssignment, TaskAssignmentInvoice } from '@/types';
import { Button } from '@/components/ui/button';

// Config flag for enabling neighbour reviews
// This should be set to true since we're implementing it now
const ENABLE_NEIGHBOUR_REVIEWS = true;

interface TaskAssignmentDetailsProps {
  assignment: TaskAssignment;
  userRole: 'client' | 'contractor';
}

export default function TaskAssignmentDetails({ assignment, userRole }: TaskAssignmentDetailsProps) {
  const isClient = userRole === 'client';
  const isContractor = userRole === 'contractor';
  
  const latestInvoice = assignment.invoices && assignment.invoices.length > 0 
    ? [...assignment.invoices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] as TaskAssignmentInvoice
    : null;
  
  // Client-specific conditions
  const canReviewTask = isClient && 
    assignment.status.name === 'COMPLETED' && 
    !assignment.wasReviewed;
    
  const canAcceptTask = isClient && assignment.status.name === 'COMPLETED';
  
  // Contractor-specific conditions
  const canCreateInvoice = isContractor && 
    assignment.status.name === 'COMPLETED' && 
    !assignment.invoices?.some((invoice: TaskAssignmentInvoice) => ['PENDING', 'PAID'].includes(invoice.status));

  // Helper function to safely format dates with fallback
  const safeFormatDate = (dateString: string | Date | null | undefined, formatStr: string) => {
    if (!dateString) return 'Not specified';
    try {
      // Handle various date formats
      let date: Date;
      
      if (dateString instanceof Date) {
        date = dateString;
      } else if (typeof dateString === 'string') {
        // Try parsing the date string
        if (dateString.match(/^\d{4}-\d{2}-\d{2}T/)) {
          // ISO format
          date = new Date(dateString);
        } else if (dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
          // YYYY-MM-DD format
          date = new Date(dateString);
        } else {
          // Try converting timestamp to number if it's a numeric string
          const timestamp = Number(dateString);
          if (!isNaN(timestamp)) {
            date = new Date(timestamp);
          } else {
            console.error('Unrecognized date format:', dateString);
            return 'Invalid date format';
          }
        }
      } else {
        console.error('Unsupported date type:', typeof dateString);
        return 'Invalid date type';
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return 'Invalid date';
      }
      
      return format(date, formatStr);
    } catch (error) {
      console.error('Date formatting error:', error, 'for date:', dateString);
      return 'Date error';
    }
  };

  // Helper function for safe distance formatting
  const safeFormatDistance = (dateString: string | Date | null | undefined) => {
    if (!dateString) return 'Unknown time';
    try {
      // Handle various date formats
      let date: Date;
      
      if (dateString instanceof Date) {
        date = dateString;
      } else if (typeof dateString === 'string') {
        // Try parsing the date string
        if (dateString.match(/^\d{4}-\d{2}-\d{2}T/)) {
          // ISO format
          date = new Date(dateString);
        } else if (dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
          // YYYY-MM-DD format
          date = new Date(dateString);
        } else {
          // Try converting timestamp to number if it's a numeric string
          const timestamp = Number(dateString);
          if (!isNaN(timestamp)) {
            date = new Date(timestamp);
          } else {
            console.error('Unrecognized date format:', dateString);
            return 'Invalid date format';
          }
        }
      } else {
        console.error('Unsupported date type:', typeof dateString);
        return 'Invalid date type';
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return 'Invalid date';
      }
      
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Distance formatting error:', error, 'for date:', dateString);
      return 'Date error';
    }
  };

  return (
    <div className="container mx-auto py-10">
      <DashboardHeader
        heading="Task Assignment Details"
        text={`Details for task assignment: ${assignment.task.name}`}
      />

      <div className="grid gap-6">
        {/* Task Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Task Information</CardTitle>
              <Badge variant={
                assignment.status.name === 'COMPLETED' ? 'success' :
                assignment.status.name === 'IN_PROGRESS' ? 'warning' : 'default'
              }>
                {assignment.status.name}
              </Badge>
            </div>
            <CardDescription>
              Task assigned on {safeFormatDate(assignment.createdAt, 'PPP')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{assignment.task.name}</h3>
              <p className="text-muted-foreground mt-2">{assignment.task.description}</p>
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Due: {safeFormatDate(assignment.task.dueDate, 'PPP')}</span>
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Last updated: {safeFormatDistance(assignment.updatedAt)}</span>
            </div>
            
            {canAcceptTask && (
              <div className="mt-4">
                <AcceptTaskButton taskAssignmentId={assignment.id} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client/Contractor Information */}
        {isClient ? (
          <Card>
            <CardHeader>
              <CardTitle>Neighbour</CardTitle>
              <CardDescription>The neighbour assigned to this task</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={assignment.contractor?.image || ''} alt={assignment.contractor?.name || 'Neighbour'} />
                  <AvatarFallback>{assignment.contractor?.name?.charAt(0) || 'N'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{assignment.contractor?.name || 'Unnamed Neighbour'}</p>
                  <p className="text-sm text-muted-foreground">{assignment.contractor?.email || 'No email provided'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Client</CardTitle>
              <CardDescription>The client who requested this task</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={assignment.client.image || ''} alt={assignment.client.name} />
                  <AvatarFallback>{assignment.client.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{assignment.client.name}</p>
                  <p className="text-sm text-muted-foreground">{assignment.client.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invoice Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Invoice Status</CardTitle>
                <CardDescription>Information about payment for this task</CardDescription>
              </div>
              {canCreateInvoice && (
                <Link 
                  href={`/user/dashboard/contractor/invoices/create?taskAssignmentId=${assignment.id}${
                    assignment.client && 'id' in assignment.client ? `&clientId=${assignment.client.id}` : ''
                  }&taskId=${assignment.task.id}`} 
                  className="inline-block"
                >
                  <Button className="flex items-center gap-1.5">
                    <PlusCircle className="h-4 w-4" />
                    Create Invoice
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {latestInvoice ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Invoice #{latestInvoice.id.substring(0, 8)}</span>
                  </div>
                  <Badge variant={
                    latestInvoice.status === 'PAID' ? 'success' :
                    latestInvoice.status === 'PENDING' ? 'warning' : 'default'
                  }>
                    {latestInvoice.status}
                  </Badge>
                </div>
                <p>Amount: ${typeof latestInvoice.amount === 'number' ? latestInvoice.amount.toFixed(2) : 'N/A'}</p>
                <p className="text-sm text-muted-foreground">
                  Created: {safeFormatDate(latestInvoice.createdAt, 'PPP')}
                </p>
                <Link 
                  href={isClient 
                    ? `/user/dashboard/client/invoices/${latestInvoice.id}` 
                    : `/user/dashboard/contractor/invoices/${latestInvoice.id}`
                  } 
                  className="w-full mt-2 inline-block"
                >
                  <Button className="w-full">View Invoice</Button>
                </Link>
              </div>
            ) : (
              <p>No invoices have been issued for this task yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Communication */}
        <Card>
          <CardHeader>
            <CardTitle>Communication</CardTitle>
            <CardDescription>Message about this task</CardDescription>
          </CardHeader>
          <CardContent>
            {assignment.conversation ? (
              <Link href={`/user/dashboard/messages/${assignment.conversation.id}`} className="w-full inline-block">
                <Button className="w-full flex items-center justify-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Open Messages
                </Button>
              </Link>
            ) : (
              <p>No conversation has been created for this task yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Role-specific sections */}
        {isClient && canReviewTask && (
          <Card>
            <CardHeader>
              <CardTitle>Review Task</CardTitle>
              <CardDescription>Leave a review for the neighbour</CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewNeighbourDialog 
                taskAssignmentId={assignment.id}
                neighbourName={assignment.contractor?.name || 'Neighbour'} 
              />
            </CardContent>
          </Card>
        )}

        {isClient && assignment.reviewRating && (
          <Card>
            <CardHeader>
              <CardTitle>Your Review</CardTitle>
              <CardDescription>Your review for this neighbour</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <StarRatingDisplay value={assignment.reviewRating} />
              {assignment.reviewFeedback && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">{assignment.reviewFeedback}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {isContractor && assignment.status.name !== 'COMPLETED' && (
          <Card>
            <CardHeader>
              <CardTitle>Task Status</CardTitle>
              <CardDescription>Update the status of this task</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Current status: {assignment.status.name}</p>
              <StatusUpdateButtons 
                taskId={assignment.task.id} 
                currentStatus={assignment.status.name} 
              />
            </CardContent>
          </Card>
        )}

        {isContractor && assignment.status.name === 'ACCEPTED' && !assignment.wasClientReviewed && (
          <Card>
            <CardHeader>
              <CardTitle>Review Client</CardTitle>
              <CardDescription>Leave a review for the client</CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewClientDialog 
                taskAssignmentId={assignment.id}
                clientName={assignment.client.name} 
              />
            </CardContent>
          </Card>
        )}

        {isContractor && assignment.wasClientReviewed && (
          <Card>
            <CardHeader>
              <CardTitle>Your Review of Client</CardTitle>
              <CardDescription>Your review for this client</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <StarRatingDisplay value={assignment.clientReviewRating || 0} />
              {assignment.clientReviewFeedback && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">{assignment.clientReviewFeedback}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <CardFooter className="flex justify-between pt-6">
          <GoBackButton />
        </CardFooter>
      </div>
    </div>
  );
} 
