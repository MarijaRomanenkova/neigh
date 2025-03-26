// Get or create a conversation between users
import { prisma } from '@/db/prisma';

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
