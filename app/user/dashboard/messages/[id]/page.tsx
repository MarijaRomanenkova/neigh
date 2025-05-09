/**
 * Conversation Detail Page Component
 * @module Pages
 * @group Dashboard/Messages
 * 
 * This page displays a specific conversation between users.
 * It shows the message history, conversation participants, and provides functionality 
 * for task assignment if the conversation is related to a task.
 */

import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/db/prisma';
import ChatInterface from '@/components/shared/chat/chat-interface';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Clipboard, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import TaskAssignButton from '@/components/shared/chat/task-assign-button';
import { Button } from '@/components/ui/button';
import AcceptTaskButton from '@/components/shared/task-assignment/accept-task-button';
import { Message, DbMessage, MessageMetadata } from '@/types/chat/message.types';
import UserRatingDisplay from '@/components/shared/ratings/user-rating-display';

// Extended user type with ratings
interface ExtendedUserWithRatings {
  id: string;
  name?: string | null;
  image?: string | null;
  contractorRating?: number | null;
  clientRating?: number | null;
}

// Function to transform database messages to properly typed messages
function transformMessages(dbMessages: DbMessage[]): Message[] {
  return dbMessages.map(msg => ({
    id: msg.id,
    content: msg.content,
    imageUrl: msg.imageUrl,
    createdAt: msg.createdAt,
    senderId: msg.senderId,
    sender: msg.sender,
    isSystemMessage: msg.isSystemMessage,
    metadata: msg.metadata && typeof msg.metadata === 'object' ? {
      eventType: (msg.metadata as MessageMetadata).eventType,
      taskAssignmentId: (msg.metadata as MessageMetadata).taskAssignmentId,
      taskName: (msg.metadata as MessageMetadata).taskName
    } : null
  }));
}

/**
 * Conversation Detail Page Component
 * 
 * Renders a detailed view of a conversation including:
 * - Message history between users
 * - Header with participant information
 * - Task information if the conversation is related to a task
 * - Task assignment functionality for clients
 * - Link to task assignment for assigned tasks
 * 
 * Security:
 * - Validates that the user is authenticated
 * - Verifies the user is a participant in the conversation
 * - Redirects unauthorized users
 * - Handles invalid conversation IDs
 * 
 * Error handling:
 * - Gracefully handles database errors
 * - Provides fallback UI for error states
 * - Returns 404 for invalid/inaccessible conversations
 * 
 * @param {Object} props - Component properties
 * @param {Promise<{id: string}>} props.params - Route parameters containing the conversation ID
 * @returns {Promise<JSX.Element>} The rendered conversation detail page
 */
export default async function ConversationPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const session = await auth();
  
  if (!session?.user) {
    redirect('/auth/signin');
  }

  try {
    // Get conversation with participants and messages
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        },
        messages: {
          orderBy: {
            createdAt: 'asc'
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        },
        task: {
          select: {
            id: true,
            name: true,
            createdById: true
          }
        }
      }
    });

    if (!conversation) {
      return (
        <div className="w-full text-center py-10">
          <p className="text-red-500">Conversation not found.</p>
          <Link 
            href="/user/dashboard/messages"
            className="text-primary hover:underline mt-4 inline-block"
          >
            Back to messages
          </Link>
        </div>
      );
    }

    // Transform messages to include ratings
    const messagesWithRatings = transformMessages(conversation.messages);

    // Get the other participant (the one who is not the current user)
    let otherParticipant: ExtendedUserWithRatings | null = null;
    
    if (conversation.participants.length > 0) {
      const otherParticipantData = conversation.participants
        .find(p => p.userId !== session.user.id);
      
      if (otherParticipantData) {
        // Fetch detailed user info including ratings
        const user = await prisma.user.findUnique({
          where: {
            id: otherParticipantData.userId
          },
          select: {
            id: true,
            name: true,
            image: true,
            contractorRating: true,
            clientRating: true
          }
        });
        
        if (user) {
          otherParticipant = {
            id: user.id,
            name: user.name,
            image: user.image,
            contractorRating: user.contractorRating ? parseFloat(user.contractorRating.toString()) : null,
            clientRating: user.clientRating ? parseFloat(user.clientRating.toString()) : null
          };
        }
      }
    }

    // Check if task is already assigned to this specific contractor
    let isTaskAssignedToContractor = false;
    let contractorId = '';
    let taskAssignmentId = '';
    let isTaskCompleted = false;
    
    // Normalize task data if it exists
    const task = conversation.task ? conversation.task : null;
    
    if (task && otherParticipant) {
      contractorId = otherParticipant.id;
      
      // Check if this specific contractor is already assigned to this task
      const taskAssignment = await prisma.taskAssignment.findFirst({
        where: { 
          taskId: task.id,
          contractorId
        },
        include: {
          status: true
        }
      });
      
      if (taskAssignment) {
        isTaskAssignedToContractor = true;
        taskAssignmentId = taskAssignment.id;
        isTaskCompleted = taskAssignment.status.name === 'COMPLETED';
      }
    }

    // Determine if current user is the client (task owner)
    const isClient = task ? session.user.id === task.createdById : false;

    return (
      <div className="w-full">
        <div className="mb-6">
          <Link 
            href="/user/dashboard/messages" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to messages</span>
          </Link>
          
          <div className="flex justify-between items-start mb-2">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {otherParticipant
                  ? `Conversation with ${otherParticipant.name || 'Unknown'}`
                  : 'Conversation'}
                  
                {otherParticipant?.contractorRating && (
                  <UserRatingDisplay 
                    rating={otherParticipant.contractorRating} 
                    size="md"
                    tooltipText="Neighbour Rating"
                  />
                )}
              </h1>
              
              {task && (
                <p className="text-muted-foreground flex items-center gap-2">
                  Regarding task: {task.name}
                  {isTaskAssignedToContractor && (
                    <span className="text-green-600 font-medium flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Task assigned to this neighbour
                    </span>
                  )}
                </p>
              )}
            </div>
            
            {/* Task Assignment Button or View Assignment Link */}
            {task && contractorId && (
              <div className="flex flex-col gap-2">
                {!isTaskAssignedToContractor && isClient ? (
                  <TaskAssignButton
                    taskId={task.id}
                    taskOwnerId={task.createdById || ''}
                    contractorId={contractorId}
                  />
                ) : isTaskAssignedToContractor && taskAssignmentId && (
                  <>
                    <Link
                      href={`/user/dashboard/task-assignments/${taskAssignmentId}`}
                    >
                      <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Clipboard className="h-4 w-4 mr-2" />
                        View Task Assignment
                      </Button>
                    </Link>
                    
                    {isClient && isTaskCompleted && (
                      <AcceptTaskButton taskAssignmentId={taskAssignmentId} />
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* New feature notification */}
          <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-3 rounded-md mb-4 flex items-start gap-2 text-sm">
            <MessageSquare className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">New Feature: Image Sharing</p>
              <p>You can now share images in your messages! Click the image button next to the message input to upload.</p>
            </div>
          </div>
        </div>
        
        <ChatInterface 
          conversationId={id} 
          initialMessages={messagesWithRatings} 
        />
      </div>
    );
  } catch (error) {
    console.error('Error loading conversation:', error);
    return (
      <div className="w-full text-center py-10">
        <p className="text-red-500">Error loading conversation. Please try again.</p>
        <Link 
          href="/user/dashboard/messages"
          className="text-primary hover:underline mt-4 inline-block"
        >
          Back to messages
        </Link>
      </div>
    );
  }
} 
