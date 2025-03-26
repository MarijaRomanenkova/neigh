import TaskForm from '@/components/shared/task/task-form';
import { getTaskById } from '@/lib/actions/task.actions';
import { getAllCategories } from '@/lib/actions/task.actions';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-guard';
import { UserIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { auth } from '@/auth';

export const metadata: Metadata = {
  title: 'Update task',
};

const AdmintaskUpdatePage = async (props: {
  params: Promise<{
    id: string;
  }>;
}) => {
  await requireAdmin();
  const session = await auth();
  
  // Make sure we have a session
  if (!session?.user?.id) {
    return notFound();
  }

  const { id } = await props.params;

  // Fetch task and categories
  const [task, categories] = await Promise.all([
    getTaskById(id),
    getAllCategories()
  ]);

  if (!task) return notFound();

  // Convert Prisma Decimal to number for the form
  const taskForForm = {
    ...task,
    price: Number(task.price)
  };

  return (
    <div className='space-y-8 max-w-5xl mx-auto'>
      <div className="flex flex-col gap-2">
        <h1 className='h2-bold'>Update task</h1>
        
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <UserIcon className="h-4 w-4" />
              <span className="font-medium">Author:</span>
              <span>{task.createdBy?.name || 'Anonymous'}</span>
              {task.createdBy?.email && (
                <span className="text-muted-foreground text-sm">({task.createdBy.email})</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <TaskForm 
        type='Update' 
        task={taskForForm} 
        taskId={task.id} 
        categories={categories}
        userId={session.user.id}
      />
    </div>
  );
};

export default AdmintaskUpdatePage;
