/**
 * Task Assignment Card Component
 * @module Components
 * @group Shared/TaskAssignment
 * 
 * This component renders a card displaying task assignment information,
 * linking a task to a contractor with status information.
 */

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Prisma } from '@prisma/client';
import TaskPrice from '@/components/shared/task/task-price';

/**
 * Type definition for a task assignment with included related data
 * @typedef {Object} TaskAssignmentWithDetails
 * @property {Object} task - Associated task information
 * @property {string} task.name - Name of the task
 * @property {number|null} task.price - Price of the task
 * @property {string[]} task.images - Array of task image URLs
 * @property {Object} status - Assignment status information
 * @property {string} status.name - Name of the status
 * @property {string} status.color - Color code for the status
 */
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

/**
 * Props for the TaskAssignmentCard component
 * @interface TaskAssignmentCardProps
 * @property {TaskAssignmentWithDetails} taskAssignment - Task assignment data with related details
 */
type TaskAssignmentCardProps = {
  taskAssignment: TaskAssignmentWithDetails;
};

/**
 * Task Assignment Card Component
 * 
 * Renders a card displaying task assignment information including:
 * - Task ID with link to task detail page
 * - Task price (or "For negotiation" if no price)
 * 
 * Uses shadcn/ui Card components for consistent styling.
 * 
 * @param {TaskAssignmentCardProps} props - Component properties
 * @returns {JSX.Element} The rendered task assignment card
 */
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
