'use client';

/**
 * Chat Interface Component
 * @module Components
 * @group Shared/Chat
 * 
 * This client-side component provides a real-time chat interface with message history,
 * message input, and WebSocket-based delivery for instant messaging.
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import { useSocket } from '@/components/providers/socket-provider';

/**
 * User Interface
 * @interface User
 * @property {string} id - Unique identifier for the user
 * @property {string|null} name - Display name of the user
 * @property {string|null} image - URL to the user's profile image
 */
interface User {
  id: string;
  name: string | null;
  image: string | null;
}

/**
 * Message Interface
 * @interface Message
 * @property {string} id - Unique identifier for the message
 * @property {string} content - Text content of the message
 * @property {Date} createdAt - Timestamp when the message was created
 * @property {string} senderId - ID of the user who sent the message
 * @property {User} sender - User object of the sender
 */
interface Message {
  id: string;
  content: string;
  createdAt: Date;
  senderId: string;
  sender: User;
}

/**
 * Props for the ChatInterface component
 * @interface ChatInterfaceProps
 * @property {string} conversationId - ID of the current conversation
 * @property {Message[]} initialMessages - Initial set of messages to display
 */
interface ChatInterfaceProps {
  conversationId: string;
  initialMessages: Message[];
}

/**
 * Chat Interface Component
 * 
 * Renders a full-featured chat interface with:
 * - Message history display with sender avatars
 * - Real-time message updates via WebSockets
 * - Message timestamp formatting
 * - Message input with keyboard shortcuts
 * - Automatic scrolling to new messages
 * - Read receipts functionality
 * 
 * @param {ChatInterfaceProps} props - Component properties
 * @returns {JSX.Element} The rendered chat interface
 */
export default function ChatInterface({ conversationId, initialMessages }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages || []);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { socket, isConnected } = useSocket();

  // Mark messages as read when the conversation is opened
  useEffect(() => {
    if (!session?.user) return;
    
    const markMessagesAsRead = async () => {
      try {
        const response = await fetch('/api/messages/read', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ conversationId }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to mark messages as read: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.markedAsRead > 0) {
          console.log(`Marked ${result.markedAsRead} messages as read`);
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    };
    
    markMessagesAsRead();
  }, [conversationId, session?.user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket.io event handlers
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    // Join the conversation room
    socket.emit('join-conversation', conversationId);
    
    // Handler for new messages
    const handleNewMessage = (message: Message) => {
      // Only add if it's not from the current user
      if (message.senderId !== session?.user?.id) {
        setMessages(prev => {
          // Check if message already exists in the previous state
          if (prev.some(m => m.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });
      }
    };
    
    // Listen for new messages
    socket.on('new-message', handleNewMessage);
    
    return () => {
      socket.off('new-message', handleNewMessage);
      socket.emit('leave-conversation', conversationId);
    };
  }, [socket, isConnected, conversationId, session?.user?.id]);

  /**
   * Scrolls the message container to the bottom
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Handles keyboard events in the message input
   * Sends the message when Enter is pressed without Shift
   * 
   * @param {React.KeyboardEvent<HTMLTextAreaElement>} e - Keyboard event
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Sends a new message
   * Handles API request, updates local state, and emits socket event
   */
  const handleSendMessage = async () => {
    if (!newMessage.trim() || loading || !session?.user) return;
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
          conversationId
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add the new message to the list
      setMessages(prev => [...prev, data]);
      
      // If socket is connected, emit the message
      if (socket && isConnected) {
        socket.emit('send-message', { conversationId, message: data });
      }
      
      // Clear the input
      setNewMessage('');
    } catch (error: unknown) {
      console.error('Error sending message:', error instanceof Error ? error.message : 'Unknown error');
      
      toast({
        variant: 'destructive',
        title: 'Failed to send message',
        description: 'Please try again later',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[60vh] border rounded-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.senderId === session?.user?.id;
            const messageDate = new Date(message.createdAt);
            
            return (
              <div 
                key={message.id} 
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-2 max-w-[80%]`}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.sender.image || ''} alt={message.sender.name || 'User'} />
                    <AvatarFallback>
                      {message.sender.name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className={`${
                      isCurrentUser 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                      } p-3 rounded-lg whitespace-pre-wrap break-words`}
                    >
                      {message.content}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(messageDate, { 
                        addSuffix: true 
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="resize-none"
            rows={2}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={loading || !newMessage.trim()}
          >
            {loading ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
} 
