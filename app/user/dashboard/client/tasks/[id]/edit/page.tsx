/**
 * Edit Page Component
 * @module Pages
 * @group Dashboard/Tasks
 * 
 * This page allows users to edit their existing tasks.
 */

import { getTaskById } from '@/lib/actions/task.actions';
import { getAllCategories } from '@/lib/actions/task.actions';
import TaskForm from '@/components/shared/task/task-form';
import { redirect, notFound } from 'next/navigation';
import { Category, Task } from '@/types';
import { auth } from '@/auth';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

/**
 * Edit Page Component
 * 
 * Provides a form for users to edit task details such as name, price, 
 * description, category, and images. Only accessible to the task owner.
 * 
 * @returns {JSX.Element} The edit task page component
 */
export default async function EditTaskPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  // Await the params to get the id
  const { id } = await params;

  const [task, categories] = await Promise.all([
    getTaskById(id),
    getAllCategories()
  ]);

  if (!task) {
    notFound();
  }

  const taskWithNumberPrice = {
    ...task,
    price: Number(task.price)
  };

  return (
    <div className="container max-w-4xl py-6">
      <Link
        href={`/user/dashboard/client/tasks/${params.id}`}
        className="flex items-center text-sm text-muted-foreground mb-4 hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to task details
      </Link>
      
      <h1 className="text-2xl font-bold mb-4">Edit</h1>
      
      <div className="bg-card rounded-lg shadow-sm p-6">
        <TaskForm 
          type="Update" 
          task={taskWithNumberPrice as Task}
          taskId={id}
          categories={categories}
          userId={session.user.id}
        />
      </div>
    </div>
  );
} 
