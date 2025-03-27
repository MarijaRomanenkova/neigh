/**
 * Chat and conversation management functions
 * @module ChatActions
 * @group API
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

    console.log('Conversation participants:', {
      currentUserId,
      taskCreatorId,
      isSame: currentUserId === taskCreatorId
    });

    // Make sure we're not creating a conversation with ourselves
    if (currentUserId === taskCreatorId) {
      return { error: 'Cannot create a conversation with yourself' };
    }

    // Check for existing conversation
    // ... rest of your logic ...
  } catch (error) {
    console.error('Error in getOrCreateConversation:', error);
    return { error: 'Failed to get or create conversation' };
  }
}; 
