import Link from 'next/link';
import { deleteTask, getAllTasksByClientId } from '@/lib/actions/task.actions';
import { formatCurrency, formatId } from '@/lib/utils';
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
import TaskList from '@/components/shared/task/task-list';

export default async function ClientTasksPage() {
  const session = await auth();
  console.log('Current user session:', session?.user);

  if (!session?.user?.id) redirect('/login');

  const tasks = await getAllTasksByClientId(session.user.id);
  console.log('Tasks received:', JSON.stringify(tasks, null, 2));

  const tasksWithNumberPrice = tasks.data.map(task => ({
    ...task,
    price: Number(task.price)
  }));
  console.log('Processed tasks:', tasksWithNumberPrice);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <Button asChild>
          <Link href="/user/dashboard/client/tasks/create">Create New Task</Link>
        </Button>
      </div>
      
      <TaskList 
        data={tasksWithNumberPrice} 
        emptyMessage="You haven't created any tasks yet" 
      />
    </div>
  );
}
