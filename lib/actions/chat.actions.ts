/**
 * Chat and conversation management functions
 * @module ChatActions
 * @group API
 * 
 * This module provides server-side functions for managing chat conversations:
 * - Creating new conversations between users
 * - Retrieving existing conversations
 * - Managing conversation participants
 */

// Get or create a conversation between users
import { prisma } from '@/db/prisma';
import { auth } from '@/auth';
import { convertToPlainObject } from '@/lib/utils';

/**
 * Gets an existing conversation or creates a new one between two users for a specific task
 * 
 * @param currentUserId - The ID of the current user initiating the conversation
 * @param taskId - The ID of the task this conversation is related to
 * @param clientId - The ID of the client (task creator)
 * @param contractorId - The ID of the contractor
 * @returns Object containing either conversation data or an error message
 * 
 * @example
 * // In a task detail component when contacting the owner
 * const handleContactOwner = async () => {
 *   const result = await getOrCreateConversation(
 *     session.user.id,
 *     task.id,
 *     task.createdById,
 *     task.contractorId
 *   );
 *   
 *   if (result.error) {
 *     showError(result.error);
 *   } else {
 *     router.push(`/user/dashboard/messages/${result.conversation.id}`);
 *   }
 * };
 * 
 * @example
 * // In a task list component with contact buttons
 * const TaskList = ({ tasks }) => {
 *   return (
 *     <div>
 *       {tasks.map(task => (
 *         <div key={task.id}>
 *           <h3>{task.name}</h3>
 *           <button
 *             onClick={() => handleContactOwner(task)}
 *             disabled={task.createdById === session.user.id}
 *           >
 *             Contact Owner
 *           </button>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * };
 */
export const getOrCreateConversation = async (
  currentUserId: string,
  taskId: string,
  clientId: string,
  contractorId: string
) => {
  try {
    // Log the incoming parameters
    console.log('Creating conversation with parameters:', {
      currentUserId,
      taskId,
      clientId,
      contractorId
    });

    // Verify all users exist
    const [currentUser, client, contractor] = await Promise.all([
      prisma.user.findUnique({ where: { id: currentUserId } }),
      prisma.user.findUnique({ where: { id: clientId } }),
      prisma.user.findUnique({ where: { id: contractorId } })
    ]);

    // Log which users were found/not found with their details
    console.log('User verification details:', {
      currentUser: currentUser ? {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email
      } : 'not found',
      client: client ? {
        id: client.id,
        name: client.name,
        email: client.email
      } : 'not found',
      contractor: contractor ? {
        id: contractor.id,
        name: contractor.name,
        email: contractor.email
      } : 'not found'
    });

    if (!currentUser || !client || !contractor) {
      const missingUsers = [];
      if (!currentUser) missingUsers.push('current user');
      if (!client) missingUsers.push('client');
      if (!contractor) missingUsers.push('contractor');
      return { error: `One or more participants not found: ${missingUsers.join(', ')}` };
    }

    // Make sure we're not creating a conversation with ourselves
    if (currentUserId === clientId || currentUserId === contractorId) {
      return { error: 'Cannot create a conversation with yourself' };
    }

    // Check for existing conversation
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        taskId,
        participants: {
          every: {
            userId: {
              in: [clientId, contractorId]
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
          take: 1
        }
      }
    });

    if (existingConversation) {
      return { conversation: existingConversation };
    }

    // Create new conversation
    const newConversation = await prisma.conversation.create({
      data: {
        taskId,
        participants: {
          create: [
            { userId: clientId },
            { userId: contractorId }
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
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    return { conversation: newConversation };
  } catch (error) {
    console.error('Error in getOrCreateConversation:', error);
    return { error: 'Failed to get or create conversation' };
  }
};

/**
 * Gets a conversation by ID
 * 
 * @param conversationId - The ID of the conversation to fetch
 * @returns The conversation object with participants and task details
 * 
 * @example
 * // In a conversation detail page
 * const conversation = await getConversationById(conversationId);
 * 
 * if (conversation) {
 *   return (
 *     <div>
 *       <h1>Conversation with {conversation.participants[0].user.name}</h1>
 *       <ChatInterface conversationId={conversation.id} />
 *     </div>
 *   );
 * }
 */
export async function getConversationById(conversationId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
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
        task: {
          select: {
            id: true,
            name: true,
            createdById: true,
            assignments: {
              select: {
                id: true,
                status: {
                  select: {
                    name: true
                  }
                },
                reviews: {
                  where: {
                    reviewType: {
                      name: 'Client Review'
                    }
                  },
                  select: {
                    id: true
                  }
                }
              },
              orderBy: {
                createdAt: 'desc'
              },
              take: 1
            }
          }
        }
      }
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    return conversation;
  } catch (error) {
    console.error('Error fetching conversation:', error);
    throw error;
  }
} 
