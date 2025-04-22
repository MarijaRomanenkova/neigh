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

export default function StatusUpdateButtons({ taskId, currentStatus }: StatusUpdateButtonsProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  
  const updateStatus = async (newStatus: string) => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      setError(null);
      
      // Use the server action instead of fetch API call
      const result = await updateTaskAssignmentStatus(taskId, newStatus);
      
      if (!result) {
        throw new Error('Failed to update task status');
      }
      
      toast({
        title: 'Success',
        description: `Task status updated to ${newStatus}`,
      });
      
      // Refresh the page to show updated status
      router.refresh();
    } catch (error) {
      console.error('Error updating task status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update task status';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
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
            onClick={() => updateStatus('IN_PROGRESS')}
            disabled={isUpdating}
          >
            {isUpdating ? "Processing..." : "Start Task"}
          </Button>
        )}
        
        {currentStatus === 'IN_PROGRESS' && (
          <Button 
            variant="success-outline"
            size="sm"
            onClick={() => updateStatus('COMPLETED')}
            disabled={isUpdating}
          >
            {isUpdating ? "Processing..." : "Complete"}
          </Button>
        )}
      </div>
    </div>
  );
} 
