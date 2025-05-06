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

/**
 * Gets an existing conversation or creates a new one between two users for a specific task
 * 
 * @param currentUserId - The ID of the current user initiating the conversation
 * @param taskId - The ID of the task this conversation is related to
 * @param taskCreatorId - The ID of the user who created the task
 * @returns Object containing either conversation data or an error message
 * 
 * @example
 * // In a task detail component when contacting the owner
 * const handleContactOwner = async () => {
 *   const result = await getOrCreateConversation(
 *     session.user.id,
 *     task.id,
 *     task.createdById
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
  taskCreatorId: string
) => {
  try {
    // Get fresh user data to ensure we have current info
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId }
    });

    if (!currentUser) {
      return { error: 'User not found' };
    }

    // Make sure we're not creating a conversation with ourselves
    if (currentUserId === taskCreatorId) {
      return { error: 'Cannot create a conversation with yourself' };
    }

    // Check for existing conversation
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        taskId,
        participants: {
          every: {
            userId: {
              in: [currentUserId, taskCreatorId]
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
      return { conversation: existingConversation };
    }

    // Create new conversation
    const newConversation = await prisma.conversation.create({
      data: {
        taskId,
        participants: {
          create: [
            { userId: currentUserId },
            { userId: taskCreatorId }
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
                image: true
              }
            }
          }
        }
      }
    });

    return { conversation: newConversation };
  } catch (error) {
    console.error('Error in getOrCreateConversation:', error);
    return { error: 'Failed to get or create conversation' };
  }
}; 
