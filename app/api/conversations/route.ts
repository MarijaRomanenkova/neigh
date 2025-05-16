/**
 * Conversations API Route
 * @module API
 * @group Chat
 * 
 * This API endpoint manages conversations between users.
 * It supports retrieving conversations for a user and creating new conversations.
 * Conversations are related to tasks and include participants.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { auth } from '@/auth';
import { Prisma } from '@prisma/client';

/**
 * GET handler for conversations
 * 
 * Retrieves all conversations where the authenticated user is a participant.
 * Can be filtered by taskId via query parameter.
 * Returns conversations with participants, task details, and the latest message.
 * 
 * @param {Request} req - The incoming request
 * @returns {Promise<NextResponse>} JSON response with conversations or error details
 * @example
 * // Query with task filter
 * GET /api/conversations?taskId=123
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');

    // Get all conversations where the user is a participant
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: session.user.id
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                contractorRating: true,
                clientRating: true
              }
            }
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        task: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Transform the data to include other participant info and unread count
    const transformedConversations = conversations.map(conversation => {
      const otherParticipant = conversation.participants
        .find(p => p.user.id !== session.user.id)
        ?.user;

      const unreadCount = conversation.messages.filter(
        message => !message.readAt && message.senderId !== session.user.id
      ).length;

      return {
        id: conversation.id,
        otherParticipant: {
          id: otherParticipant?.id,
          name: otherParticipant?.name,
          image: otherParticipant?.image,
          contractorRating: otherParticipant?.contractorRating
        },
        lastMessage: conversation.messages[0] ? {
          content: conversation.messages[0].content,
          createdAt: conversation.messages[0].createdAt,
          senderId: conversation.messages[0].senderId,
          senderName: conversation.messages[0].sender.name
        } : null,
        unreadCount,
        updatedAt: conversation.updatedAt,
        task: conversation.task
      };
    });

    return NextResponse.json(transformedConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for conversations
 * 
 * Creates a new conversation for a specific task and set of participants.
 * The authenticated user is automatically added as a participant.
 * 
 * @param {Request} req - The incoming request
 * @returns {Promise<NextResponse>} JSON response with created conversation or error details
 * @example
 * // Request body format
 * // { "taskId": "123", "participantIds": ["user1", "user2"] }
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { taskId, participantIds } = body;
    
    if (!taskId || !participantIds || !Array.isArray(participantIds)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Verify the task exists and get its details
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { 
        id: true, 
        createdById: true,
        isArchived: true
      }
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    if (task.isArchived) {
      return NextResponse.json(
        { error: 'Cannot create conversation for archived task' },
        { status: 400 }
      );
    }

    // Verify all participant IDs are valid users
    const participants = await prisma.user.findMany({
      where: {
        id: {
          in: [...new Set([...participantIds, session.user.id])]
        }
      },
      select: { id: true }
    });

    if (participants.length !== new Set([...participantIds, session.user.id]).size) {
      return NextResponse.json(
        { error: 'One or more participants not found' },
        { status: 404 }
      );
    }

    // Verify the current user is either the task creator or one of the participants
    if (task.createdById !== session.user.id && !participantIds.includes(session.user.id)) {
      // Allow any user to create a conversation with the task owner
      // The task owner's ID should be in the participantIds array
      if (!participantIds.includes(task.createdById)) {
        return NextResponse.json(
          { error: 'You can only create conversations with the task owner' },
          { status: 403 }
        );
      }
    }

    // Check for existing conversation
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        taskId,
        participants: {
          every: {
            userId: {
              in: [...new Set([...participantIds, session.user.id])]
            }
          }
        }
      },
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
        }
      }
    });

    if (existingConversation) {
      return NextResponse.json(existingConversation);
    }
    
    // Create conversation with all participants
    const conversation = await prisma.conversation.create({
      data: {
        taskId,
        participants: {
          create: [
            { userId: session.user.id },
            ...participantIds.map(id => ({ userId: id }))
          ]
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                contractorRating: true,
                clientRating: true
              }
            }
          }
        },
        task: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    
    // Handle specific Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'A conversation already exists for this task and participants' },
          { status: 409 }
        );
      }
      
      if (error.code === 'P2003') {
        return NextResponse.json(
          { error: 'Invalid task or participant reference' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
} 
