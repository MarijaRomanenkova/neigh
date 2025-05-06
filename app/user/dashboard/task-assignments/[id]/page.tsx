import { getTaskAssignmentById } from '@/lib/actions/task-assignment.actions';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import TaskAssignmentDetails from '@/components/shared/task-assignment/task-assignment-details';
import { Card, CardContent } from '@/components/ui/card';
import DashboardHeader from '@/components/shared/dashboard-header';
import GoBackButton from '@/components/shared/go-back-button';
import { TaskAssignment } from '@/types';
import { prisma } from '@/db/prisma';
import { formatDateTime } from '@/lib/utils';

/**
 * Helper function to deeply clone and clean objects for client component consumption
 * Removes any non-JSON-serializable values like functions, etc.
 */
function sanitizeForClient<T>(data: T): T {
  // First, check if the data is null or undefined
  if (data === null || data === undefined) {
    return data;
  }
  
  // Handle primitive types directly
  if (
    typeof data !== 'object' || 
    data instanceof Date || 
    data instanceof RegExp ||
    data instanceof String ||
    data instanceof Number ||
    data instanceof Boolean
  ) {
    return data;
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForClient(item)) as unknown as T;
  }
  
  // Handle objects
  const result = {} as Record<string, unknown>;
  for (const key in data) {
    // Skip functions or other non-serializable types
    const value = (data as Record<string, unknown>)[key];
    if (typeof value !== 'function' && key !== 'symbol') {
      result[key] = sanitizeForClient(value);
    }
  }
  
  return result as T;
}

/**
 * Unified Task Assignment Details Page
 * This page can be accessed by both clients and contractors
 * and will show relevant information based on the user's role
 */
export default async function UnifiedTaskAssignmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/sign-in');
  }
  
  // Get the task assignment ID from params
  const { id: assignmentId } = await params;
  
  // First, we'll make a direct database query to determine the user's role
  // This is more reliable than depending on the data from getTaskAssignmentById
  const taskAssignment = await prisma.taskAssignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      clientId: true,
      contractorId: true
    }
  });
  
  if (!taskAssignment) {
    return (
      <div className="container mx-auto py-10">
        <DashboardHeader
          heading="Task Assignment"
          text="Task assignment not found"
        />
        <Card>
          <CardContent className="pt-6">
            <p>The requested task assignment could not be found or you don&apos;t have permission to view it.</p>
            <div className="mt-4">
              <GoBackButton />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Determine user role directly from database IDs
  let userRole: 'client' | 'contractor' | null = null;
  
  if (taskAssignment.clientId === session.user.id) {
    userRole = 'client';
  } else if (taskAssignment.contractorId === session.user.id) {
    userRole = 'contractor';
  }
  
  // Redirect if user is neither client nor contractor
  if (!userRole) {
    redirect('/user/dashboard');
  }
  
  // Now fetch the complete task assignment details
  const result = await getTaskAssignmentById(assignmentId);
  
  if (!result.success) {
    return (
      <div className="container mx-auto py-10">
        <DashboardHeader
          heading="Task Assignment"
          text="Task assignment not found"
        />
        <Card>
          <CardContent className="pt-6">
            <p>The requested task assignment could not be found or you don&apos;t have permission to view it.</p>
            <div className="mt-4">
              <GoBackButton />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // First stringify and then parse to remove any functions and ensure clean data
  const jsonString = JSON.stringify(result.data);
  // Then, use our custom sanitizer as a second defense
  const sanitizedAssignment = sanitizeForClient(JSON.parse(jsonString)) as TaskAssignment;
  
  return <TaskAssignmentDetails assignment={sanitizedAssignment} userRole={userRole} />;
} 
