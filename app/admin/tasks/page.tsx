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

const AdminTasksPage = async (props: {
  searchParams: Promise<{
    page: string;
    query: string;
    category: string;
  }>;
}) => {
  await requireAdmin();

  const searchParams = await props.searchParams;

  const page = Number(searchParams.page) || 1;
  const searchText = searchParams.query || '';
  const category = searchParams.category || '';

  const tasks = await getAllTasks({
    query: searchText,
    page,
    category,
  });

  return (
    <div className='space-y-2'>
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
      {tasks.totalPages > 1 && (
        <Pagination page={page} totalPages={tasks.totalPages} />
      )}
    </div>
  );
};

export default AdminTasksPage;
