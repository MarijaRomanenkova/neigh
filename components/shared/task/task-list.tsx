/**
 * @module TaskList
 * @description A component that renders a grid of task cards with configurable title,
 * limit, and empty state message. This component is used to display task collections
 * across the application.
 */

import TaskCard from './task-card';
import { Task } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

/**
 * @interface TaskListProps
 * @property {Task[]} data - Array of task objects to display
 * @property {string} [title] - Optional heading to display above the task list
 * @property {number} [limit] - Optional maximum number of tasks to display
 * @property {string} [emptyMessage="No tasks found"] - Message to display when there are no tasks
 */
interface TaskListProps {
  data: Task[];
  title?: string;
  limit?: number;
  emptyMessage?: string;
}

/**
 * TaskList component for displaying a grid of task cards with optional title and limits.
 * Handles empty states with a configurable message.
 * 
 * @param {Object} props - Component props
 * @param {Task[]} props.data - Array of task objects to display
 * @param {string} [props.title] - Optional heading to display above the task list
 * @param {number} [props.limit] - Optional maximum number of tasks to display
 * @param {string} [props.emptyMessage="No tasks found"] - Message to display when there are no tasks
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
