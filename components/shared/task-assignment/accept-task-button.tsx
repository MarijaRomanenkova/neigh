'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { acceptTaskAssignment } from '@/lib/actions/task-assignment.actions';
import { useRouter } from 'next/navigation';

interface AcceptTaskButtonProps {
  taskAssignmentId: string;
  className?: string;
}

export default function AcceptTaskButton({ taskAssignmentId, className = '' }: AcceptTaskButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      const result = await acceptTaskAssignment(taskAssignmentId);
      
      if (result.success) {
        toast({
          title: "Task Assignment is Accepted",
          description: "You have successfully accepted this task.",
          variant: "default",
        });
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to accept task assignment.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      console.error("Error accepting task:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleAccept}
      disabled={isLoading}
      variant="success"
      size="sm"
      className={className}
    >
      <CheckCircle className="h-4 w-4 mr-2" />
      {isLoading ? "Processing..." : "Accept Task"}
    </Button>
  );
} 
