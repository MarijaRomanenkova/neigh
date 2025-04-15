/**
 * Client Tasks Page Component
 * @module Pages
 * @group Dashboard/Client
 * 
 * This page displays all tasks created by the current user in their client role.
 * It shows a list of tasks with options to view details, edit, or delete each task.
 */

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

/**
 * Client Tasks Page Component
 * 
 * Fetches and displays all tasks created by the authenticated user.
 * Provides options to create new tasks and manage existing ones.
 * Includes authentication protection and redirects unauthenticated users.
 * 
 * @returns {Promise<JSX.Element>} The rendered client tasks page
 */
export default async function ClientTasksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const tasks = await getAllTasksByClientId(session.user.id);


  const tasksWithNumberPrice = tasks.data.map(task => ({
    ...task,
    price: Number(task.price)
  }));

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
