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

    // Query conversations for this user related to the specific task
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: session.user.id
          }
        },
        ...(taskId ? { taskId } : {})
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
        },
        task: true,
        // Include the latest messages
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json(conversations);
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
    
    // Ensure current user is included in participants
    const allParticipantIds = [...new Set([...participantIds, session.user.id])];
    
    // Create conversation
    const conversation = await prisma.conversation.create({
      data: {
        taskId,
        participants: {
          create: allParticipantIds.map(userId => ({
            userId
          }))
        }
      }
    });
    
    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    
    // Fix the error object formatting
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: 'Failed to create conversation', message: errorMessage },
      { status: 500 }
    );
  }
} 
