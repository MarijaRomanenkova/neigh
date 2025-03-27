/**
 * Admin Tasks Management Page
 * @module Admin
 * @group Admin Pages
 * 
 * This page provides administrators with a comprehensive interface to manage tasks,
 * including listing, filtering, editing, and deleting tasks.
 * It requires admin privileges to access.
 */

import Link from 'next/link';
import { getAllTasks, deleteTask } from '@/lib/actions/task.actions';
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
import { requireAdmin } from '@/lib/auth-guard';
import { UserIcon } from 'lucide-react';

/**
 * Admin Tasks Page Component
 * 
 * This server component displays a management interface for tasks with:
 * - Task ID, name, author, price, and category
 * - Filtering capabilities by search text and category
 * - Pagination for large result sets
 * - Links to edit individual tasks
 * - Task deletion functionality
 * - Button to create new tasks
 * 
 * The page enforces admin-only access through the requireAdmin middleware.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Promise<{page: string, query: string, category: string}>} props.searchParams - URL search parameters
 * @returns {JSX.Element} Admin tasks management interface
 */
const AdminTasksPage = async (props: {
  searchParams: Promise<{
    page: string;
    query: string;
    category: string;
  }>;
}) => {
  // Verify admin access
  await requireAdmin();

  const searchParams = await props.searchParams;

  // Extract search parameters
  const page = Number(searchParams.page) || 1;
  const searchText = searchParams.query || '';
  const category = searchParams.category || '';

  // Fetch tasks with filtering and pagination
  const tasks = await getAllTasks({
    query: searchText,
    page,
    category,
  });

  return (
    <div className='space-y-2'>
      {/* Page header with search filter info and create button */}
      <div className='flex-between'>
        <div className='flex items-center gap-3'>
          <h1 className='h2-bold'>Tasks</h1>
          {searchText && (
            <div>
              Filtered by <i>&quot;{searchText}&quot;</i>{' '}
              <Link href='/admin/tasks'>
                <Button variant='outline' size='sm'>
                  Remove Filter
                </Button>
              </Link>
            </div>
          )}
        </div>
        <Button asChild variant='default'>
          <Link href='/admin/tasks/create'>Create Task</Link>
        </Button>
      </div>

      {/* Tasks table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>NAME</TableHead>
            <TableHead>AUTHOR</TableHead>
            <TableHead className='text-right'>PRICE</TableHead>
            <TableHead>CATEGORY</TableHead>
            <TableHead className='w-[100px]'>ACTIONS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.data.map((task) => (
            <TableRow key={task.id}>
              <TableCell>{formatId(task.id)}</TableCell>
              <TableCell>{task.name}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <UserIcon className="h-3 w-3" />
                  <span>{task.author?.name || 'Anonymous'}</span>
                </div>
              </TableCell>
              <TableCell className='text-right'>
                {formatCurrency(Number(task.price))}
              </TableCell>
              <TableCell>{task.categoryId}</TableCell>
              <TableCell className='flex gap-1'>
                <Button asChild variant='outline' size='sm'>
                  <Link href={`/admin/tasks/${task.id}`}>Edit</Link>
                </Button>
                <DeleteDialog id={task.id} action={deleteTask} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {/* Pagination controls */}
      {tasks.totalPages > 1 && (
        <Pagination page={page} totalPages={tasks.totalPages} />
      )}
    </div>
  );
};

export default AdminTasksPage;
