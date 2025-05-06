'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { updateTaskAssignmentStatus } from '@/lib/actions/task-assignment-status.actions';

interface StatusUpdateButtonsProps {
  taskId: string;
  currentStatus: string;
}

interface StatusUpdateResult {
  success: boolean;
  message?: string;
}

export default function StatusUpdateButtons({ taskId, currentStatus }: StatusUpdateButtonsProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  
  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setIsUpdating(true);
      const result = await updateTaskAssignmentStatus(taskId, newStatus) as StatusUpdateResult;
      
      if (result.success) {
        toast({
          title: 'Status updated',
          description: 'Task status has been updated successfully.',
        });
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to update task status',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update task status',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <div className="flex flex-col gap-2">
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      <div className="flex gap-2 justify-end">
        {currentStatus === 'NEW' && (
          <Button 
            variant="outline"
            size="sm"
            onClick={() => handleStatusUpdate('IN_PROGRESS')}
            disabled={isUpdating}
          >
            {isUpdating ? "Processing..." : "Start Task"}
          </Button>
        )}
        
        {currentStatus === 'IN_PROGRESS' && (
          <Button 
            variant="success-outline"
            size="sm"
            onClick={() => handleStatusUpdate('COMPLETED')}
            disabled={isUpdating}
          >
            {isUpdating ? "Processing..." : "Complete"}
          </Button>
        )}
      </div>
    </div>
  );
} 
