import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Prisma } from '@prisma/client';
import TaskPrice from '@/components/shared/task/task-price';

type TaskAssignmentWithDetails = Prisma.TaskAssignmentGetPayload<{
  include: {
    task: {
      select: {
        name: true;
        price: true;
        images: true;
      };
    };
    status: {
      select: {
        name: true;
        color: true;
      };
    };
  };
}>;

type TaskAssignmentCardProps = {
  taskAssignment: TaskAssignmentWithDetails;
};

const TaskAssignmentCard = ({ taskAssignment }: TaskAssignmentCardProps) => {
  return (
    <Card className='w-full max-w-sm'>
      <CardHeader className='p-0 items-center'>
       Header
      </CardHeader>
      <CardContent className='p-4 grid gap-4'>
        <Link href={`/task/${taskAssignment.id}`}>
          <h2 className='text-sm font-medium'>{taskAssignment.taskId}</h2>
        </Link>
        {taskAssignment.task.price ? (
          <TaskPrice value={Number(taskAssignment.task.price)} />
        ) : (
          <p className="text-sm text-muted-foreground">For negotiation</p>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskAssignmentCard;
