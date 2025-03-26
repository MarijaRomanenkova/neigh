'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface TaskContactButtonProps {
  taskId: string;
  taskOwnerId: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

const TaskContactButton = ({ 
  taskId, 
  taskOwnerId,
  variant = 'default',
  size = 'default',
  className = ''
}: TaskContactButtonProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { data: session } = useSession();
  
  const handleContact = async () => {
    if (!session?.user?.id) {
      router.push('/login');
      return;
    }
    
    // Prevent task owner from contacting themselves
    if (session.user.id === taskOwnerId) {
      toast({
        variant: 'destructive',
        title: 'Cannot contact',
        description: 'This is your own task',
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // First, check if a conversation already exists for this task
      const checkResponse = await fetch(`/api/conversations?taskId=${taskId}`);
      
      if (!checkResponse.ok) {
        throw new Error(`Failed to check for existing conversations: ${checkResponse.status} ${checkResponse.statusText}`);
      }
      
      let conversations = [];
      const checkText = await checkResponse.text();
      
      // Only try to parse as JSON if there's actual content
      if (checkText && checkText.trim()) {
        try {
          conversations = JSON.parse(checkText);
        } catch (parseError) {
          console.error('Error parsing conversations response:', parseError);
          throw new Error('Invalid response format when checking conversations');
        }
      }
      
      if (conversations.length > 0) {
        // Conversation exists, navigate to it
        router.push(`/user/dashboard/messages/${conversations[0].id}`);
      } else {
        // Create new conversation
        const createResponse = await fetch('/api/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            taskId,
            participantIds: [taskOwnerId]
          }),
        });
        
        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          let errorMessage = `Failed to create conversation: ${createResponse.status} ${createResponse.statusText}`;
          
          if (errorText && errorText.trim()) {
            try {
              const errorData = JSON.parse(errorText);
              if (errorData.message || errorData.error) {
                errorMessage = errorData.message || errorData.error;
              }
            } catch (parseError) {
              console.error('Error parsing error response:', parseError);
            }
          }
          
          throw new Error(errorMessage);
        }
        
        let newConversation;
        const createText = await createResponse.text();
        
        if (!createText || !createText.trim()) {
          throw new Error('Empty response when creating conversation');
        }
        
        try {
          newConversation = JSON.parse(createText);
        } catch (parseError) {
          console.error('Error parsing new conversation response:', createText, parseError);
          throw new Error('Invalid response format when creating conversation');
        }
        
        router.push(`/user/dashboard/messages/${newConversation.id}`);
      }
    } catch (error: any) {
      console.error('Error starting conversation:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to start conversation',
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Button
      onClick={handleContact}
      disabled={loading}
      variant={variant}
      size={size}
      className={className}
    >
      {loading ? 'Starting chat...' : 'Contact Client'}
    </Button>
  );
};

export default TaskContactButton; 
