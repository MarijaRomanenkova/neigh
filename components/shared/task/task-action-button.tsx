'use client';

/**
 * @module TaskActionButton
 * @description A conditional button component that displays either an edit button for task owners
 * or a contact button for other users. The displayed action depends on whether the current user
 * is the owner of the task.
 */

import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import TaskContactButton from './task-contact-button';
import { Pencil } from 'lucide-react';

/**
 * @interface TaskActionButtonProps
 * @property {string} taskId - The unique identifier of the task
 * @property {string} taskOwnerId - The unique identifier of the task owner
 * @property {string} [className] - Optional CSS class names to apply to the button
 */
interface TaskActionButtonProps {
  taskId: string;
  taskOwnerId: string;
  className?: string;
}

/**
 * TaskActionButton component that conditionally renders different actions based on user ownership.
 * For task owners, it displays an edit button that navigates to the task edit page.
 * For other users, it displays a contact button to initiate conversation with the task owner.
 * 
 * @param {Object} props - Component props
 * @param {string} props.taskId - The ID of the task
 * @param {string} props.taskOwnerId - The ID of the task owner
 * @param {string} [props.className] - Optional class name for styling
 * @returns {JSX.Element} Either an Edit button or a TaskContactButton component
 */
const TaskActionButton = ({ 
  taskId, 
  taskOwnerId,
  className = ''
}: TaskActionButtonProps) => {
  const { data: session } = useSession();
  const router = useRouter();
  
  // Check if current user is the task creator
  const isOwner = session?.user?.id === taskOwnerId;
  
  /**
   * Handles the edit button click by navigating to the task edit page
   */
  const handleEdit = () => {
    router.push(`/user/dashboard/client/tasks/${taskId}/edit`);
  };
  
  if (isOwner) {
    return (
      <Button
        onClick={handleEdit}
        variant="outline"
        className={className}
      >
        <Pencil className="h-4 w-4 mr-2" />
        Edit Task
      </Button>
    );
  }
  
  return (
    <TaskContactButton
      taskId={taskId}
      taskOwnerId={taskOwnerId}
      className={className}
    />
  );
};

export default TaskActionButton; 
