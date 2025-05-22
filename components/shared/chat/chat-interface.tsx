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
import { useSocket } from '@/hooks/use-socket';
import MessageImageUpload from './message-image-upload';
import Image from 'next/image';
import { ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Message, ExtendedMessage, MessageMetadata } from '@/types/chat/message.types';
import UserRatingDisplay from '../ratings/user-rating-display';
import { markMessageAsRead, getConversationMessages, createMessage } from '@/lib/actions/messages.actions';
import { UserWithRating } from '@/types/user.types';
import { Loader2, Send } from 'lucide-react';

/**
 * Props for the ChatInterface component
 * @interface ChatInterfaceProps
 * @property {string} conversationId - ID of the current conversation
 * @property {string} receiverId - ID of the receiver
 * @property {ExtendedMessage[]} initialMessages - Initial set of messages to display
 */
interface ChatInterfaceProps {
  conversationId: string;
  receiverId: string;
  initialMessages: ExtendedMessage[];
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
export default function ChatInterface({ 
  conversationId, 
  receiverId,
  initialMessages 
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ExtendedMessage[]>(initialMessages);
  const [mounted, setMounted] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadMessages, setUnreadMessages] = useState<Set<string>>(new Set());
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const { toast } = useToast();
  const { socket, isConnected, sendMessage } = useSocket();

  // Set mounted state after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize messages
  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
      setIsLoadingMessages(false);
    }
  }, [initialMessages]);

  // Fetch messages when component mounts or conversationId changes
  useEffect(() => {
    if (!mounted) return; // Don't fetch until after hydration

    const fetchMessages = async () => {
      if (!conversationId) return;
      
      try {
        setIsLoadingMessages(true);
        const response = await fetch(`/api/messages?conversationId=${conversationId}`);
        if (!response.ok) throw new Error('Failed to fetch messages');
        
        const data = await response.json();
        // Convert Decimal to number for ratings and ensure proper typing
        const convertedMessages = data.map((msg: {
          id: string;
          content: string;
          imageUrl: string | null;
          createdAt: string;
          senderId: string;
          isSystemMessage: boolean;
          metadata: MessageMetadata | null;
          readAt: string | null;
          sender: {
            id: string;
            name: string | null;
            image: string | null;
            contractorRating: number | null;
            clientRating: number | null;
          };
        }) => ({
          id: msg.id,
          content: msg.content,
          imageUrl: msg.imageUrl,
          createdAt: msg.createdAt,
          senderId: msg.senderId,
          isSystemMessage: msg.isSystemMessage,
          metadata: msg.metadata,
          readAt: msg.readAt,
          sender: {
            id: msg.sender.id,
            name: msg.sender.name,
            image: msg.sender.image,
            contractorRating: Number(msg.sender.contractorRating || 0),
            clientRating: Number(msg.sender.clientRating || 0)
          }
        })) as ExtendedMessage[];
        setMessages(convertedMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError('Failed to load messages');
        toast({
          title: 'Error',
          description: 'Failed to load messages. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [conversationId, toast, mounted]);

  // Format message dates after hydration
  useEffect(() => {
    if (!mounted) return; // Don't format until after hydration

    setMessages(prev => prev.map(msg => ({
      ...msg,
      createdAt: new Date(msg.createdAt),
      readAt: msg.readAt ? new Date(msg.readAt) : null
    })));
  }, [mounted]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    const markMessagesAsRead = async () => {
      if (!conversationId || !session?.user?.id) return;
      
      try {
        await fetch(`/api/messages/read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId }),
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    };

    markMessagesAsRead();
  }, [conversationId, session?.user?.id]);

  // Track unread messages
  useEffect(() => {
    if (!socket || !isConnected || !session?.user?.id) return;

    const handleNewMessage = (message: ExtendedMessage) => {
      setMessages(prev => [...prev, message]);
      if (message.senderId !== session?.user?.id) {
        setUnreadMessages(prev => new Set([...prev, message.id]));
      }
    };

    socket.on('new-message', handleNewMessage);
    return () => {
      socket.off('new-message', handleNewMessage);
    };
  }, [unreadMessages, session?.user, socket, isConnected]);

  // Don't render anything until client-side hydration is complete
  if (!mounted) {
    return (
      <div className="flex flex-col h-[600px] border rounded-lg">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Loading chat...
          </div>
        </div>
      </div>
    );
  }

  /**
   * Handles sending a new message
   * 
   * @param {string} content - The text content of the message
   * @param {string} imageUrl - The URL of the uploaded image
   */
  const handleSendMessage = async (content: string, imageUrl?: string | null) => {
    if (!content.trim() && !imageUrl || loading || !session?.user) return;
    
    setLoading(true);
    try {
      const message = await createMessage(content, conversationId, imageUrl || undefined);
      // Convert Decimal to number for ratings and ensure proper typing
      const convertedMessage: ExtendedMessage = {
        id: message.id,
        content: message.content,
        imageUrl: message.imageUrl,
        createdAt: new Date(message.createdAt),
        senderId: message.senderId,
        isSystemMessage: message.isSystemMessage,
        metadata: message.metadata as MessageMetadata | null,
        readAt: message.readAt ? new Date(message.readAt) : null,
        sender: {
          id: message.sender.id,
          name: message.sender.name,
          image: message.sender.image,
          contractorRating: Number(message.sender.contractorRating || 0),
          clientRating: Number(message.sender.clientRating || 0)
        }
      };
      
      setMessages(prev => [...prev, convertedMessage]);
      setNewMessage('');
      setImageUrl(null);
      setShowImageUpload(false);

      // If socket is connected, emit the message
      if (socket && isConnected) {
        socket.emit('new-message', convertedMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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

  return (
    <div className="flex flex-col h-[600px] border rounded-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 messages-container">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
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
                      "bg-green-100 border-green-200 text-green-800 dark:bg-success/20 dark:border-success/30 dark:text-success-foreground/80",
                    message.metadata?.eventType === 'review-submitted' &&
                      "bg-amber-100 border-amber-200 text-amber-800 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-300"
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

            return (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  isCurrentUser ? "justify-end" : "justify-start"
                )}
                data-message-id={message.id}
              >
                <div className={cn(
                  "flex flex-col max-w-[80%]",
                  isCurrentUser ? "items-end" : "items-start"
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    {!isCurrentUser && (
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={message.sender.image || undefined}
                          alt={message.sender.name || 'User'}
                        />
                        <AvatarFallback>
                          {message.sender.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <span className="text-sm font-medium">
                      {isCurrentUser ? 'You' : message.sender.name || 'Unknown User'}
                    </span>
                  </div>
                  
                  <div className={`${
                    isCurrentUser 
                    ? 'bg-primary text-primary-foreground rounded-tl-lg rounded-tr-none' 
                    : 'bg-muted rounded-tr-lg rounded-tl-none'
                  } p-3 rounded-bl-lg rounded-br-lg text-sm`}>
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
                            sizes="(max-width: 768px) 100vw, 384px"
                            onClick={() => window.open(message.imageUrl || '', '_blank')}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-1 flex gap-1">
                    {formatDistanceToNow(messageDate, { addSuffix: true })}
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
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(newMessage, imageUrl);
              }
            }}
            className="min-h-[48px] max-h-[200px] resize-none"
          />
          
          <Button
            onClick={() => handleSendMessage(newMessage, imageUrl)}
            disabled={(!newMessage.trim() && !imageUrl) || loading}
            className="bg-primary text-primary-foreground"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 
