/**
 * Task List Component
 * @module Components
 * @group Shared/Tasks
 * 
 * A component that renders a grid of task cards with configurable title,
 * limit, and empty state message. Features include:
 * - Responsive grid layout
 * - Optional title display
 * - Configurable task limit
 * - Customizable empty state message
 * - Consistent card styling
 * 
 * @example
 * ```tsx
 * <TaskList
 *   data={[
 *     {
 *       id: "task1",
 *       name: "Garden Maintenance",
 *       price: 100
 *     },
 *     {
 *       id: "task2",
 *       name: "House Cleaning",
 *       price: 150
 *     }
 *   ]}
 *   title="Available Tasks"
 *   limit={4}
 *   emptyMessage="No tasks available at the moment"
 * />
 * ```
 */

import TaskCard from './task-card';
import { Task } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

/**
 * Props for the TaskList component
 * @interface TaskListProps
 */
interface TaskListProps {
  /** Array of task objects to display */
  data: Task[];
  /** Optional heading to display above the task list */
  title?: string;
  /** Optional maximum number of tasks to display */
  limit?: number;
  /** Message to display when there are no tasks */
  emptyMessage?: string;
}

/**
 * TaskList component for displaying a grid of task cards with optional title and limits.
 * Handles empty states with a configurable message.
 * 
 * @param {TaskListProps} props - Component properties
 * @returns {JSX.Element} A grid of task cards or an empty state message
 */
const TaskList = ({
  data,
  title,
  limit,
  emptyMessage = "No tasks found"
}: TaskListProps) => {
  // Apply limit if provided, otherwise show all tasks
  const limitedData = limit ? data.slice(0, limit) : data;

  return (
    <div className='my-10'>
      
      
      {limitedData.length > 0 ? (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {limitedData.map((task: Task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
};

export default TaskList;
