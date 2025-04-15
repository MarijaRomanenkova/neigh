'use client';

/**
 * Task Assignment Button Component
 * @module Components
 * @group Shared/Chat
 * 
 * This client-side component provides a button and confirmation dialog
 * for task owners to assign tasks to contractors.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import { UserCheck } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { archiveTask } from '@/lib/actions/task.actions';
import { createTaskAssignment } from '@/lib/actions/task-assignment.actions';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

/**
 * Props for the TaskAssignButton component
 * @interface TaskAssignButtonProps
 * @property {string} taskId - ID of the task to be assigned
 * @property {string} taskOwnerId - ID of the task owner (client)
 * @property {string} contractorId - ID of the contractor to assign the task to
 * @property {string} [className] - Optional CSS class names
 * @property {Function} [onAssigned] - Optional callback function after successful assignment
 */
interface TaskAssignButtonProps {
  taskId: string;
  taskOwnerId: string;
  contractorId: string;
  className?: string;
  onAssigned?: () => void;
}

/**
 * Task Assignment Button Component
 * 
 * Renders a button with confirmation dialog for task assignment with:
 * - Authorization check to ensure only task owners can assign tasks
 * - Confirmation dialog with details about assignment implications
 * - API integration to update task status and create assignment record
 * - Loading state during assignment process
 * - Success/error notifications via toast
 * 
 * @param {TaskAssignButtonProps} props - Component properties
 * @returns {JSX.Element|null} The rendered button or null if user is not authorized
 */
export default function TaskAssignButton({ 
  taskId, 
  taskOwnerId,
  contractorId,
  className = '',
  onAssigned
}: TaskAssignButtonProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [shouldArchive, setShouldArchive] = useState(false);

  // Only show if the current user is the task owner
  if (!session?.user?.id || session.user.id !== taskOwnerId) {
    return null;
  }

  /**
   * Handles the task assignment process
   * Fetches task status, creates assignment record, and manages UI states
   */
  const handleAssignTask = async () => {
    if (isAssigning) return;
    
    try {
      setIsAssigning(true);
      
      // Create task assignment using server action
      const result = await createTaskAssignment({
        taskId,
        clientId: taskOwnerId,
        contractorId,
        statusId: 'IN_PROGRESS' // The server action will fetch the correct status ID
      });

      if (!result.success) {
        throw new Error(result.message || 'Failed to assign task');
      }

      // Archive the task if checkbox is checked
      if (shouldArchive) {
        const archiveResult = await archiveTask(taskId);
        if (!archiveResult.success) {
          throw new Error(archiveResult.message || 'Failed to archive task');
        }
      }
      
      toast({
        title: 'Success',
        description: `Task ${shouldArchive ? 'assigned and archived' : 'assigned'} successfully!`,
      });
      
      setIsOpen(false);
      router.refresh();
      
      // Notify parent component of assignment
      if (onAssigned) {
        onAssigned();
      }
    } catch (error) {
      console.error('Error assigning task:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to assign task',
      });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="success"
          className={className}
        >
          <UserCheck className="h-4 w-4 mr-2" />
          Assign Task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Task</DialogTitle>
          <DialogDescription>
            This will assign the task to the contractor and change its status to &quot;In Progress&quot;.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <p>Are you sure you want to assign this task to this contractor?</p>
          <p className="text-sm text-muted-foreground">
            Once assigned, they will be responsible for completing this task and you will be able to create invoices.
          </p>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="archive"
              checked={shouldArchive}
              onCheckedChange={(checked) => setShouldArchive(checked as boolean)}
            />
            <Label htmlFor="archive">
              Archive this task after assignment
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssignTask} 
            disabled={isAssigning}
            variant="success"
          >
            {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
