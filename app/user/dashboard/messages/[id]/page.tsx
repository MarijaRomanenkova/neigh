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
  try {
    // Await the params object
    const { id } = await params;
    
    // Validate the ID parameter
    if (!id || typeof id !== 'string') {
      notFound();
    }

    const session = await auth();
    if (!session?.user) {
      redirect('/login');
    }

    // Check if user is a participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: id,
        userId: session.user.id
      }
    });

    if (!participant) {
      redirect('/user/dashboard/messages');
    }

    // Get conversation details
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
        task: true
      }
    });

    if (!conversation) {
      notFound();
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Get other participants
    const otherParticipants = conversation.participants
      .filter(p => p.userId !== session.user.id)
      .map(p => p.user);
      
    // Check if task is already assigned to this specific contractor
    let isTaskAssignedToContractor = false;
    let contractorId = '';
    let taskAssignmentId = '';
    
    if (conversation.task) {
      // Get the first other participant as the contractor
      if (otherParticipants.length > 0) {
        contractorId = otherParticipants[0].id;
      }
      
      if (contractorId) {
        // Check if this specific contractor is already assigned to this task
        const taskAssignment = await prisma.taskAssignment.findFirst({
          where: { 
            taskId: conversation.task.id,
            contractorId
          }
        });
        
        if (taskAssignment) {
          isTaskAssignedToContractor = true;
          taskAssignmentId = taskAssignment.id;
        }
      }
    }

    // Determine if current user is the client (task owner)
    const isClient = session.user.id === conversation.task?.createdById;

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
            <h1 className="text-2xl font-bold">
              {otherParticipants.length > 0
                ? (otherParticipants.length > 1
                  ? `Conversation with ${otherParticipants[0]?.name || 'Unknown'} and ${otherParticipants.length - 1} others`
                  : `Conversation with ${otherParticipants[0]?.name || 'Unknown'}`)
                : 'Conversation'}
            </h1>
            
            {/* Task Assignment Button or View Assignment Link */}
            {conversation.task && contractorId && (
              <>
                {!isTaskAssignedToContractor && isClient ? (
                  <TaskAssignButton
                    taskId={conversation.task.id}
                    taskOwnerId={conversation.task.createdById || ''}
                    contractorId={contractorId}
                  />
                ) : isTaskAssignedToContractor && taskAssignmentId && (
                  <Link 
                    href={isClient 
                      ? `/user/dashboard/client/task-assignments/${taskAssignmentId}`
                      : `/user/dashboard/contractor/assignments/${taskAssignmentId}`
                    }
                  >
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Clipboard className="h-4 w-4 mr-2" />
                      View Task Assignment
                    </Button>
                  </Link>
                )}
              </>
            )}
          </div>
          
          {conversation.task && (
            <p className="text-muted-foreground">
              Regarding task: {conversation.task.name}
              {isTaskAssignedToContractor && (
                <span className="ml-2 text-green-600 font-medium flex items-center gap-1 mt-1">
                  <CheckCircle className="h-4 w-4" />
                  Task assigned to this contractor
                </span>
              )}
            </p>
          )}
        </div>
        
        <ChatInterface 
          conversationId={id} 
          initialMessages={messages} 
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
