'use client';

/**
 * @module TaskCompleteButton
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TaskCompleteButtonProps {
  taskAssignmentId: string;
  className?: string;
  onCompleted?: () => void;
}

export default function TaskCompleteButton({
  taskAssignmentId,
  className = '',
  onCompleted
}: TaskCompleteButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [completedStatusId, setCompletedStatusId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // Fetch the completed status ID when the component mounts
    async function fetchCompletedStatusId() {
      try {
        const response = await fetch('/api/task-statuses?name=COMPLETED');
        if (!response.ok) {
          throw new Error('Failed to fetch completed status');
        }
        const data = await response.json();
        setCompletedStatusId(data.id);
      } catch (error) {
        console.error('Error fetching completed status:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to fetch task status',
        });
      }
    }
    fetchCompletedStatusId();
  }, [toast]);

  const handleComplete = async () => {
    if (isUpdating || !completedStatusId) return;
    
    try {
      setIsUpdating(true);
      
      const response = await fetch(`/api/task-assignments/${taskAssignmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          statusId: completedStatusId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to complete task');
      }

      toast({
        title: 'Success',
        description: 'Task marked as completed!',
      });
      
      setIsOpen(false);
      router.refresh();
      
      if (onCompleted) {
        onCompleted();
      }
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to complete task',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!completedStatusId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className={`bg-green-600 hover:bg-green-700 text-white ${className}`}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Mark as Completed
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Task</DialogTitle>
          <DialogDescription>
            This will mark the task as completed. The client will be notified and can review the completion.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p>Are you sure you want to mark this task as completed?</p>
          <p className="text-sm text-muted-foreground mt-2">
            Make sure you have completed all requirements before proceeding.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleComplete} 
            disabled={isUpdating}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isUpdating ? 'Updating...' : 'Confirm Completion'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
