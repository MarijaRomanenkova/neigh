"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, FileText, MessageSquare, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DashboardHeader from '@/components/shared/dashboard-header';
import { getTaskAssignmentById } from '@/lib/actions/task-assignment.actions';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import GoBackButton from '@/components/shared/go-back-button';
import StatusUpdateButtons from '@/components/shared/task-assignment/status-update-buttons';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { TaskAssignment, TaskAssignmentInvoice } from '@/types';

export default function TaskAssignmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const [assignment, setAssignment] = useState<TaskAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setId(resolvedParams.id);
    };
    
    resolveParams();
  }, [params]);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user) {
        router.push('/sign-in');
        return;
      }
      
      if (id) {
        const result = await getTaskAssignmentById(id);
        
        if (!result.success) {
          toast({
            title: 'Task Assignment Not Found',
            description: 'The requested task assignment could not be found or you don\'t have permission to view it.',
            variant: 'destructive',
          });
          router.push('/user/dashboard/contractor/assignments');
          return;
        }
        
        setAssignment(result.data as TaskAssignment);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [session, id, router, toast]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!assignment) {
    return null;
  }
  
  const latestInvoice = assignment.invoices && assignment.invoices.length > 0 
    ? [...assignment.invoices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] as TaskAssignmentInvoice
    : null;
    
  const canCreateInvoice = 
    assignment.status.name === 'COMPLETED' && 
    !assignment.invoices?.some((invoice: TaskAssignmentInvoice) => ['PENDING', 'PAID'].includes(invoice.status));

  return (
    <div className="container mx-auto py-10">
      <DashboardHeader
        heading="Task Assignment Details"
        text={`Details for task: ${assignment.task.name}`}
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
              Task assigned on {format(new Date(assignment.createdAt), 'PPP')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{assignment.task.name}</h3>
              <p className="text-muted-foreground mt-2">{assignment.task.description}</p>
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Due: {format(new Date(assignment.task.dueDate || new Date()), 'PPP')}</span>
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Last updated: {formatDistanceToNow(new Date(assignment.updatedAt), { addSuffix: true })}</span>
            </div>
          </CardContent>
        </Card>

        {/* Client Information */}
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

        {/* Invoice Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Invoice Status</CardTitle>
                <CardDescription>Information about payment for this task</CardDescription>
              </div>
              {canCreateInvoice && (
                <Link href={`/user/dashboard/contractor/invoices/new?taskAssignmentId=${assignment.id}`} className="inline-block">
                  <button className="bg-primary text-primary-foreground inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium shadow-sm hover:bg-primary/90">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Invoice
                  </button>
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
                <p>Amount: ${latestInvoice.amount.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">
                  Created: {format(new Date(latestInvoice.createdAt), 'PPP')}
                </p>
                <Link href={`/user/dashboard/contractor/invoices/${latestInvoice.id}`} className="w-full mt-2 inline-block">
                  <button className="w-full bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2 rounded-md">
                    View Invoice
                  </button>
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
            <CardDescription>Message your client about this task</CardDescription>
          </CardHeader>
          <CardContent>
            {assignment.conversation ? (
              <Link href={`/user/dashboard/messages/${assignment.conversation.id}`} className="w-full inline-block">
                <button className="w-full bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2 rounded-md flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Open Messages
                </button>
              </Link>
            ) : (
              <p>No conversation has been created for this task yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Task Status Update */}
        {assignment.status.name !== 'COMPLETED' && (
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

        <CardFooter className="flex justify-between pt-6">
          <GoBackButton />
        </CardFooter>
      </div>
    </div>
  );
} 
