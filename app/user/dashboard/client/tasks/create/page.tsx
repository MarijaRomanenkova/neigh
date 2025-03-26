import { Metadata } from 'next';
import { getCategories } from '@/lib/actions/category.actions';
import TaskForm from '@/components/shared/task/task-form';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Create task',
};

export default async function CreateTaskPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  
  const categories = await getCategories();
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create New Task</h1>
      <TaskForm 
        type="Create" 
        task={null}
        categories={categories}
        userId={session.user.id}
      />
    </div>
  );
}
