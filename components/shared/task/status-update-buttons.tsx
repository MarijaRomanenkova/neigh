'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface StatusUpdateButtonsProps {
  taskId: string;
  currentStatus: string;
}

export default function StatusUpdateButtons({ taskId, currentStatus }: StatusUpdateButtonsProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  
  const updateStatus = async (newStatus: string) => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.status}`);
      }
      
      toast({
        title: 'Success',
        description: `Task status updated to ${newStatus}`,
      });
      
      // Refresh the page to show updated status
      router.refresh();
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update task status',
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <div className="flex gap-2">
      {currentStatus === 'PENDING' && (
        <Button 
          className="flex-1"
          onClick={() => updateStatus('IN_PROGRESS')}
          disabled={isUpdating}
        >
          Mark as In Progress
        </Button>
      )}
      
      {currentStatus !== 'COMPLETED' && (
        <Button 
          className="flex-1"
          onClick={() => updateStatus('COMPLETED')}
          disabled={isUpdating}
        >
          Mark as Completed
        </Button>
      )}
    </div>
  );
} 
