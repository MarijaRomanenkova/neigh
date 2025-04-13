/**
 * Client Task Assignments Page Component
 * @module Pages
 * @group Dashboard/Client
 * 
 * This page displays all task assignments created by the current user in their client role.
 * It shows task assignments with contractor details and status information.
 */

import Link from 'next/link';
import {getAllTaskAssignmentsByClientId, deleteTaskAssignment } from '@/lib/actions/task-assignment.actions';
import { formatId } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Pagination from '@/components/shared/pagination';
import DeleteDialog from '@/components/shared/delete-dialog';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { TaskAssignment } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Clock } from "lucide-react";
import { Metadata } from 'next';

interface PageProps {
  params: Promise<{ [key: string]: string | string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const ClientTaskAssignmentsPage = async ({ params, searchParams }: PageProps) => {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const page = Number(resolvedSearchParams?.page) || 1;

  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const tasksAssignments = await getAllTaskAssignmentsByClientId(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="h2-bold">Task Assignments</h1>
      </div>

      <div className="grid gap-6">
        {tasksAssignments.data.length > 0 ? (
          tasksAssignments.data.map((assignment) => {
            const isCompleted = assignment.status.name === "COMPLETED";
            
            return (
              <Card key={assignment.id} className="overflow-hidden">
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-between">
                    <CardTitle className="line-clamp-1">
                      {assignment.task.name}
                    </CardTitle>
                    <Badge 
                      style={{
                        backgroundColor: assignment.status.color || "gray",
                      }}
                    >
                      {assignment.status.name}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Contractor</p>
                    <p className="text-sm text-muted-foreground">
                      {assignment.contractor.name}
                    </p>
                  </div>
                  {assignment.task.price && (
                    <div>
                      <p className="text-sm font-medium">Price</p>
                      <p className="text-sm text-muted-foreground">
                        ${Number(assignment.task.price).toFixed(2)}
                      </p>
                    </div>
                  )}
                  {isCompleted && (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">
                        Marked as completed by contractor
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <p className="text-muted-foreground">No task assignments found.</p>
        )}
      </div>
    </div>
  );
};

export default ClientTaskAssignmentsPage;
