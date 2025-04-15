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
import { Edit, ArrowLeft, Pencil } from 'lucide-react';
import { auth } from '@/auth';
import TaskContactButton from '@/components/shared/task/task-contact-button';
import TaskImageGallery from '@/components/shared/task/task-image-gallery';
import TaskArchiveButton from '@/components/shared/task/task-archive-button';

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
 * - Creator details
 * - Edit button (if user is the task creator)
 * - Contact button (if user is not the task creator)
 */
export default async function TaskDetailsPage({ params, searchParams }: Props) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const task = await getTaskById(id);
  const session = await auth();

  if (!task) {
    notFound();
  }

  const isCreator = session?.user?.id === task.author?.id;

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
        {isCreator ? (
          <div className="flex items-center justify-end space-x-2">
            <Link href={`/user/dashboard/client/tasks/${task.id}/edit`}>
              <Button
                size="sm"
                variant="success-outline"
                className="flex items-center whitespace-nowrap"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
            {!task.isArchived && (
              <TaskArchiveButton taskId={task.id} />
            )}
          </div>
        ) : (
          <div className="flex justify-end">
            <TaskContactButton 
              taskId={task.id} 
              taskOwnerId={task.author?.id || ''} 
              size="sm"
              className="whitespace-nowrap"
            />
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <Card className="flex-1">
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
              <p className="text-muted-foreground">{task.author?.name || 'Anonymous'}</p>
            </div>

            {task.category && (
              <div>
                <h3 className="font-medium mb-2">Category</h3>
                <p className="text-muted-foreground">{task.category.name}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {task.images && task.images.length > 0 && (
          <Card className="md:w-[400px]">
            <CardHeader className="pb-0">
              <CardTitle className="text-lg">Images</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <TaskImageGallery images={task.images} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 
