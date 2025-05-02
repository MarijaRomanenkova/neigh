// Mock chat functionality data and functions for testing

import { z } from 'zod';

// UUID helper
const generateUuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0;
  const v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

// Mock users
export const mockUsers = {
  client: {
    id: generateUuid(),
    name: 'Test Client',
    email: 'client@example.com',
    image: null
  },
  contractor: {
    id: generateUuid(),
    name: 'Test Contractor',
    email: 'contractor@example.com',
    image: null
  }
};

// Mock task
export const mockTask = {
  id: generateUuid(),
  name: 'Test Task',
  description: 'Description for test task',
  price: 100,
  images: ['image1.jpg', 'image2.jpg'],
  categoryId: generateUuid(),
  createdById: mockUsers.client.id,
  isArchived: false,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Define a type for system message metadata
type SystemMessageMetadata = {
  eventType: string;
  taskAssignmentId?: string;
  taskName?: string;
};

// Define Message type
type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  readAt: null | Date;
  imageUrl: string | null;
  isSystemMessage: boolean;
  metadata: SystemMessageMetadata | null;
  sender: typeof mockUsers.client | typeof mockUsers.contractor;
};

// Mock conversation
export const mockConversation = {
  id: generateUuid(),
  createdAt: new Date(),
  updatedAt: new Date(),
  taskId: mockTask.id,
  participants: [
    {
      id: generateUuid(),
      userId: mockUsers.client.id,
      conversationId: null, // Will be set after creation
      joinedAt: new Date(),
      user: mockUsers.client
    },
    {
      id: generateUuid(),
      userId: mockUsers.contractor.id,
      conversationId: null, // Will be set after creation
      joinedAt: new Date(),
      user: mockUsers.contractor
    }
  ],
  messages: [] as Message[] // Initially empty, will be populated in tests
};

// Mock message
export const createMockMessage = (senderId: string, content: string, isSystemMessage = false): Message => ({
  id: generateUuid(),
  conversationId: mockConversation.id,
  senderId,
  content,
  createdAt: new Date(),
  readAt: null,
  imageUrl: null,
  isSystemMessage,
  metadata: isSystemMessage ? { eventType: 'status-update' } as SystemMessageMetadata : null,
  sender: senderId === mockUsers.client.id ? mockUsers.client : mockUsers.contractor
});

// Mock initial messages for testing
export const mockMessages = [
  createMockMessage(mockUsers.contractor.id, 'I can help with that. What do you need?'),
  createMockMessage(mockUsers.client.id, 'I need someone to fix my leaky faucet')
];

// Conversation with messages for testing
export const mockConversationWithMessages = {
  ...mockConversation,
  messages: mockMessages
};

// Mock function to get or create a conversation
export const getOrCreateConversation = jest.fn().mockImplementation(
  async (currentUserId: string, taskId: string, taskCreatorId: string) => {
    // Validate parameters
    if (!currentUserId || !taskId || !taskCreatorId) {
      return { error: 'Missing required parameters' };
    }

    // Check if trying to create conversation with self
    if (currentUserId === taskCreatorId) {
      return { error: 'Cannot create a conversation with yourself' };
    }

    // Return successful mock response
    return {
      conversation: {
        ...mockConversation,
        taskId,
        participants: mockConversation.participants.map(p => ({
          ...p,
          conversationId: mockConversation.id
        }))
      }
    };
  }
);

// Mock function to send a message
export const sendMessage = jest.fn().mockImplementation(
  async (conversationId: string, content: string, senderId: string, imageUrl?: string) => {
    // Validate parameters
    if (!conversationId || !content || !senderId) {
      return { error: 'Missing required fields' };
    }

    // Create a new message
    const newMessage = createMockMessage(senderId, content);
    
    if (imageUrl) {
      newMessage.imageUrl = imageUrl;
    }

    return { success: true, message: newMessage };
  }
);

// Mock function to get conversation messages
export const getConversationMessages = jest.fn().mockImplementation(
  async (conversationId: string) => {
    if (conversationId !== mockConversation.id) {
      return { error: 'Conversation not found' };
    }

    return { success: true, messages: mockMessages };
  }
);

// Mock function to create system notification
export const createTaskAssignmentNotification = jest.fn().mockImplementation(
  async (taskAssignmentId: string, message: string, eventType: string) => {
    const systemMessage = createMockMessage(mockUsers.client.id, message, true);
    // Set metadata for system message
    systemMessage.metadata = {
      eventType,
      taskAssignmentId,
      taskName: mockTask.name
    };
    
    return systemMessage;
  }
);

// Mock Prisma client for chat
export const mockPrismaChat = {
  conversation: {
    findUnique: jest.fn().mockImplementation(({ where, include }) => {
      if (where.id === mockConversation.id) {
        const result = { ...mockConversation };
        if (include?.participants) {
          result.participants = mockConversation.participants;
        }
        if (include?.messages) {
          result.messages = mockMessages;
        }
        return result;
      }
      return null;
    }),
    findFirst: jest.fn().mockImplementation(({ where }) => {
      // Simple implementation - just check if the taskId matches
      if (where?.taskId === mockTask.id) {
        return mockConversation;
      }
      return null;
    }),
    findMany: jest.fn().mockImplementation(({ where }) => {
      // If looking for conversations where a specific user is a participant
      if (where?.participants?.some?.userId) {
        const userId = where.participants.some.userId;
        if (mockConversation.participants.some(p => p.userId === userId)) {
          return [mockConversation];
        }
      }
      return [];
    }),
    create: jest.fn().mockImplementation(({ data }) => {
      return {
        ...mockConversation,
        taskId: data.taskId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }),
    update: jest.fn().mockImplementation(({ where, data }) => {
      return {
        ...mockConversation,
        id: where.id,
        updatedAt: new Date()
      };
    })
  },
  conversationParticipant: {
    create: jest.fn().mockImplementation(({ data }) => {
      return {
        id: generateUuid(),
        userId: data.userId,
        conversationId: data.conversationId,
        joinedAt: new Date()
      };
    }),
    findMany: jest.fn().mockImplementation(({ where }) => {
      if (where?.conversationId === mockConversation.id) {
        return mockConversation.participants;
      }
      return [];
    })
  },
  message: {
    create: jest.fn().mockImplementation(({ data, include }) => {
      const message = createMockMessage(data.senderId, data.content, data.isSystemMessage || false);
      if (data.imageUrl) {
        message.imageUrl = data.imageUrl;
      }
      if (data.metadata) {
        message.metadata = data.metadata;
      }
      
      if (include?.sender) {
        message.sender = data.senderId === mockUsers.client.id 
          ? mockUsers.client 
          : mockUsers.contractor;
      }
      
      return message;
    }),
    findMany: jest.fn().mockImplementation(({ where, orderBy, include }) => {
      if (where?.conversationId === mockConversation.id) {
        const messages = [...mockMessages];
        if (orderBy?.createdAt === 'desc') {
          messages.reverse();
        }
        return messages;
      }
      return [];
    })
  }
}; 
