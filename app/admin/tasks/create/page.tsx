import { Metadata } from 'next';
import TaskForm from '@/components/shared/task/task-form';
import { requireAdmin } from '@/lib/auth-guard';
import { getCategories } from '@/lib/actions/category.actions';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Create task',
};

const CreateTaskPage = async () => {
  await requireAdmin();
  
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');
  
  const categories = await getCategories();
  
  return (
    <>
      <h2 className='h2-bold'>Create task</h2>
      <div className='my-8'>
        <TaskForm 
          type='Create' 
          task={null}
          categories={categories}
          userId={session.user.id}
        />
      </div>
    </>
  );
};

export default CreateTaskPage;
