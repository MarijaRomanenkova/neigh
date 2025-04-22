import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { useRouter } from 'next/router';
import { toast } from '@/hooks/use-toast';

interface ContactButtonProps {
  taskId: string;
  clientId: string;
  contractorId: string;
  viewType?: 'client' | 'contractor';
}

export const ContactButton: React.FC<ContactButtonProps> = ({
  taskId,
  clientId,
  contractorId,
  viewType = 'client'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const Router = useRouter();
  
  const handleContact = async () => {
    setIsLoading(true);
    try {
      // Redirect to the chat page with the correct other user ID
      const otherUserId = viewType === 'client' ? contractorId : clientId;
      Router.push(`/user/dashboard/messages?taskId=${taskId}&otherUserId=${otherUserId}`);
    } catch (error) {
      console.error('Failed to navigate to messages:', error);
      toast({
        title: "Error",
        description: "Could not open chat at this time. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="success"
      onClick={handleContact}
      disabled={isLoading}
    >
      {isLoading ? "Connecting..." : (
        <>
          <MessageSquare className="mr-1 h-4 w-4" />
          Contact
        </>
      )}
    </Button>
  );
}; 
