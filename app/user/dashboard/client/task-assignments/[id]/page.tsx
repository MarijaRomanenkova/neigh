import Link from 'next/link';
import {getAllTaskAssignmentsByClientId } from '@/lib/actions/task-assignment.actions';
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
import { TaskAssignment } from '@prisma/client';


const ClientTaskAssignmentPage = async (props: {
  searchParams: Promise<{
    page: string;
    query: string;
    category: string;
  }>;
}) => {


  const searchParams = await props.searchParams;

  const page = Number(searchParams.page) || 1;
  const searchText = searchParams.query || '';
  const category = searchParams.category || '';

  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const tasksAssignments = await getAllTaskAssignmentsByClientId(session.user.id);

  return (
    <div className='space-y-2'>
      <div className='flex-between'>
        <div className='flex items-center gap-3'>
          <h1 className='h2-bold'>Tasks Assignments</h1>
          {searchText && (
            <div>
              Filtered by <i>&quot;{searchText}&quot;</i>{' '}
              <Link href='/user/dashboard/client/task-assignments'>
                <Button variant='outline' size='sm'>
                  Remove Filter
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>NAME</TableHead>
            <TableHead className='text-right'>PRICE</TableHead>
            <TableHead>CATEGORY</TableHead>
            <TableHead className='w-[100px]'>ACTIONS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasksAssignments.data.map((taskAssignment: TaskAssignment) => (
            <TableRow key={taskAssignment.id}>
              <TableCell>{formatId(taskAssignment.id)}</TableCell>
              <TableCell>{taskAssignment.statusId}</TableCell>
             
              <TableCell className='flex gap-1'>
                <Button asChild variant='outline' size='sm'>
                  <Link href={`/user/dashboard/client/task-assignments/${taskAssignment.id}`}>Edit</Link>
                </Button>
             
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {tasksAssignments.totalPages > 1 && (
        <Pagination page={page} totalPages={tasksAssignments.totalPages} />
      )}
    </div>
  );
};

export default ClientTaskAssignmentPage;
