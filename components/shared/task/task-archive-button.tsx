'use client';

/**
 * @module TaskArchiveButton
 * @description A button component that allows task owners to archive their tasks.
 * Includes a confirmation dialog to prevent accidental archiving.
 */

import { useState } from 'react';
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
import { Archive } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { archiveTask } from '@/lib/actions/task.actions';

interface TaskArchiveButtonProps {
  taskId: string;
  className?: string;
  onArchived?: () => void;
}

export default function TaskArchiveButton({
  taskId,
  className = '',
  onArchived
}: TaskArchiveButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleArchive = async () => {
    if (isArchiving) return;
    
    try {
      setIsArchiving(true);
      
      const result = await archiveTask(taskId);

      if (!result.success) {
        throw new Error(result.message);
      }

      toast({
        title: 'Success',
        description: 'Task archived successfully!',
      });
      
      setIsOpen(false);
      router.refresh();
      
      // Redirect to task list
      router.push('/user/dashboard/client/tasks');
      
      if (onArchived) {
        onArchived();
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to archive task',
      });
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          className={className}
        >
          <Archive className="h-4 w-4 mr-2" />
          Archive Task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archive Task</DialogTitle>
          <DialogDescription>
            This will archive the task and make it inactive. Archived tasks can still be viewed but cannot be modified or assigned.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p>Are you sure you want to archive this task?</p>
          <p className="text-sm text-muted-foreground mt-2">
            This action can be undone by contacting support.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleArchive} 
            disabled={isArchiving}
            variant="destructive"
          >
            {isArchiving ? 'Archiving...' : 'Archive Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
