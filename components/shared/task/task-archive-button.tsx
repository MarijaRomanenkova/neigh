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
import { cn } from '@/lib/utils';

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
    <div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className={cn("text-red-500 border-red-300 hover:bg-red-50 hover:text-red-600", className)}
      >
        <Archive className="h-4 w-4 mr-2" />
        Archive
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive</DialogTitle>
            <DialogDescription>
              Are you sure you want to archive this task? This will hide it from the public listings.
              You can still view it in your archived tasks.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              disabled={isArchiving}
              onClick={handleArchive}
            >
              {isArchiving ? 'Archiving...' : 'Archive'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
