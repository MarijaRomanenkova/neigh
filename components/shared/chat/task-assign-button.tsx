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
  const [isOpen, setIsOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

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
      
      // Get the IN_PROGRESS status ID
      const statusResponse = await fetch('/api/task-statuses?name=IN_PROGRESS');
      if (!statusResponse.ok) {
        throw new Error('Failed to get task status');
      }
      
      const { id: statusId } = await statusResponse.json();
      
      // Create task assignment
      const response = await fetch('/api/task-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          clientId: taskOwnerId,
          contractorId,
          statusId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to assign task');
      }

      const result = await response.json();
      
      toast({
        title: 'Success',
        description: 'Task assigned successfully!',
      });
      
      setIsOpen(false);
      
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
          className={`bg-green-600 hover:bg-green-700 text-white ${className}`}
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
        <div className="py-4">
          <p>Are you sure you want to assign this task to this contractor?</p>
          <p className="text-sm text-muted-foreground mt-2">
            Once assigned, they will be responsible for completing this task and you will be able to create invoices.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssignTask} 
            disabled={isAssigning}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
