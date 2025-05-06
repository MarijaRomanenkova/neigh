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
import { updateTaskAssignment } from '@/lib/actions/task-assignment.actions';
import { getCompletedTaskAssignmentStatus } from '@/app/actions';

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
        const status = await getCompletedTaskAssignmentStatus();
        setCompletedStatusId(status.id);
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
    if (!completedStatusId) {
      toast({
        title: 'Error',
        description: 'Could not find completed status',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUpdating(true);
      const result = await updateTaskAssignment(taskAssignmentId, completedStatusId);
      if (result.success) {
        toast({
          title: 'Task completed',
          description: 'The task has been marked as completed.',
        });
        router.refresh();
        if (onCompleted) {
          onCompleted();
        }
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to complete task',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete task',
        variant: 'destructive',
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
