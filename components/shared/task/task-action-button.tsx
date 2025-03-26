'use client';

import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import TaskContactButton from './task-contact-button';
import { Pencil } from 'lucide-react';

interface TaskActionButtonProps {
  taskId: string;
  taskOwnerId: string;
  className?: string;
}

const TaskActionButton = ({ 
  taskId, 
  taskOwnerId,
  className = ''
}: TaskActionButtonProps) => {
  const { data: session } = useSession();
  const router = useRouter();
  
  // Check if current user is the task creator
  const isOwner = session?.user?.id === taskOwnerId;
  
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
