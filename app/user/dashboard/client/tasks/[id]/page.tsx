/**
 * Task Details Page
 * @module Pages
 * @group Client Dashboard
 */

import { getTaskById } from '@/lib/actions/task.actions';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TaskPrice from '@/components/shared/task/task-price';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Edit, ArrowLeft } from 'lucide-react';

interface Props {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Task Details Page Component
 * 
 * Displays detailed information about a specific task including:
 * - Task name and description
 * - Price information
 * - Author details
 * - Edit button (if user is the task creator)
 */
export default async function TaskDetailsPage({ params, searchParams }: Props) {
  // Await both params and searchParams
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  
  const task = await getTaskById(id);

  if (!task) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/user/dashboard/client/tasks">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tasks
            </Button>
          </Link>
        </div>
        <Link href={`/user/dashboard/client/tasks/${task.id}/edit`}>
          <Button size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit Task
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{task.name}</CardTitle>
          {task.price && (
            <TaskPrice value={Number(task.price)} className="text-xl" />
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Description</h3>
            <p className="text-muted-foreground">{task.description || 'No description provided'}</p>
          </div>

          <div>
            <h3 className="font-medium mb-2">Created By</h3>
            <p className="text-muted-foreground">{task.createdBy?.name || 'Anonymous'}</p>
          </div>

          {task.categoryId && (
            <div>
              <h3 className="font-medium mb-2">Category ID</h3>
              <p className="text-muted-foreground">{task.categoryId}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
