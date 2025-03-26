import { getCategories } from '@/lib/actions/category.actions';
import { getTaskById } from '@/lib/actions/task.actions';
import TaskForm from '@/components/shared/task/task-form';
import { notFound, redirect } from 'next/navigation';
import { Task } from '@/types';
import { auth } from '@/auth';

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  // Await the params to get the id
  const { id } = await params;

  const [task, categories] = await Promise.all([
    getTaskById(id),
    getCategories()
  ]);

  if (!task) {
    notFound();
  }

  const taskWithNumberPrice = {
    ...task,
    price: Number(task.price)
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Task</h1>
      <TaskForm 
        type="Update" 
        task={taskWithNumberPrice as Task}
        taskId={id}
        categories={categories}
        userId={session.user.id}
      />
    </div>
  );
} 
