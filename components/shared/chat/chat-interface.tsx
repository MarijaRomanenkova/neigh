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
import MessageImageUpload from './message-image-upload';
import Image from 'next/image';
import { ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Message, User } from '@/types/chat/message.types';

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
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
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
   * Toggles the image upload interface
   */
  const toggleImageUpload = () => {
    setShowImageUpload(!showImageUpload);
    if (showImageUpload && imageUrl) {
      setImageUrl(null);
    }
  };

  /**
   * Handles image upload completion
   * 
   * @param {string} url - URL of the uploaded image
   */
  const handleImageUpload = (url: string) => {
    setImageUrl(url);
  };

  /**
   * Cancels the current image upload
   */
  const cancelImageUpload = () => {
    setImageUrl(null);
  };

  /**
   * Sends a new message
   * Handles API request, updates local state, and emits socket event
   */
  const handleSendMessage = async () => {
    // Don't send if there's no content and no image
    if ((!newMessage.trim() && !imageUrl) || loading || !session?.user) return;
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage || ' ', // Send at least a space if there's only an image
          imageUrl: imageUrl,
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
      
      // Clear the input and image
      setNewMessage('');
      setImageUrl(null);
      setShowImageUpload(false);
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
            
            // Special display for system messages
            if (message.isSystemMessage) {
              return (
                <div key={message.id} className="flex justify-center my-4">
                  <div className={cn(
                    "border rounded-md px-4 py-2 text-sm max-w-[90%] text-center",
                    message.metadata?.eventType === 'status-update' && 
                      "bg-blue-100 border-blue-200 text-blue-800 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-300",
                    message.metadata?.eventType === 'invoice-created' && 
                      "bg-success/10 border-success/20 text-success-foreground/90 dark:bg-success/20 dark:border-success/30 dark:text-success-foreground/80"
                  )}>
                    <div className="font-medium">
                      {message.content}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(messageDate, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            }
            
            // Regular message display
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
                    } px-3 py-2 rounded-lg`}
                    >
                      {message.content}
                      
                      {/* Render image if present */}
                      {message.imageUrl && (
                        <div className="mt-2">
                          <div className="relative rounded-md overflow-hidden h-48 w-full max-w-sm">
                            <Image 
                              src={message.imageUrl} 
                              alt="Message image" 
                              className="object-contain cursor-pointer"
                              fill
                              onClick={() => window.open(message.imageUrl || '', '_blank')}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-1 ml-1">
                      {formatDistanceToNow(messageDate, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <div className="border-t p-4">
        {showImageUpload && (
          <div className="mb-4">
            <MessageImageUpload
              onImageUpload={handleImageUpload}
              onCancel={cancelImageUpload}
              currentImage={imageUrl}
            />
          </div>
        )}
      
        <div className="flex items-start space-x-2">
          <Button
            type="button"
            size="icon"
            variant={showImageUpload ? "secondary" : "ghost"}
            onClick={toggleImageUpload}
            className="rounded-full h-12 w-12 flex-shrink-0 flex items-center justify-center"
            title="Add Image"
          >
            {imageUrl ? (
              <div className="relative h-9 w-9 flex items-center justify-center">
                <div className="absolute -top-1 -right-1 bg-green-500 h-3 w-3 rounded-full border-2 border-background" />
                <ImageIcon className="h-9 w-9" style={{ width: '2.25rem', height: '2.25rem' }} />
              </div>
            ) : (
              <ImageIcon className="h-9 w-9" style={{ width: '2.25rem', height: '2.25rem' }} />
            )}
          </Button>
          
          <Textarea
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-10 resize-none"
            disabled={loading}
          />
          
          <Button
            onClick={handleSendMessage}
            disabled={(!newMessage.trim() && !imageUrl) || loading}
            className="bg-primary text-primary-foreground"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
} 
