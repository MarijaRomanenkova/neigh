/**
 * Task Action Button Component
 * @module Components
 * @group Shared/Tasks
 * 
 * A client-side component that conditionally renders either an edit button for task owners
 * or a contact button for other users. Features include:
 * - User role-based button rendering
 * - Session-based authentication check
 * - Consistent styling with shadcn/ui
 * - Seamless integration with task management
 * 
 * @example
 * ```tsx
 * <TaskActionButton
 *   taskId="task123"
 *   taskOwnerId="user456"
 *   className="custom-class"
 * />
 * ```
 */

'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import TaskContactButton from './task-contact-button';
import { Pencil } from 'lucide-react';
import { useSession } from 'next-auth/react';

/**
 * Props for the TaskActionButton component
 * @interface TaskActionButtonProps
 */
interface TaskActionButtonProps {
  /** The unique identifier of the task */
  taskId: string;
  /** The unique identifier of the task owner */
  taskOwnerId: string;
  /** Optional CSS class names */
  className?: string;
}

/**
 * TaskActionButton component that conditionally renders different actions based on user role.
 * Shows edit button for task owners and contact button for other users.
 * 
 * @param {TaskActionButtonProps} props - Component properties
 * @returns {JSX.Element} Either an edit button or a contact button based on user role
 */
const TaskActionButton = ({ taskId, taskOwnerId, className }: TaskActionButtonProps) => {
  const router = useRouter();
  const { data: session } = useSession();
  
  // Compare as strings for reliability
  const currentUserId = session?.user?.id ? String(session.user.id) : '';
  const ownerId = taskOwnerId ? String(taskOwnerId) : '';
  const isOwner = currentUserId && ownerId && currentUserId === ownerId;
  
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
        variant="success-outline"
        size="sm"
        className={`whitespace-nowrap flex items-center ${className}`}
      >
        <Pencil className="h-4 w-4 mr-2" />
        Edit
      </Button>
    );
  }
  
  return (
    <TaskContactButton
      taskId={taskId}
      taskOwnerId={taskOwnerId}
      size="sm"
      className={`whitespace-nowrap ${className}`}
    />
  );
};

export default TaskActionButton; 
