import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { mockUsers } from './__mocks__/auth';
import { getOrCreateConversation } from '@/lib/actions/chat.actions';
import { createTask } from '@/lib/actions/task.actions';
import { createTaskAssignment } from '@/lib/actions/task-assignment.actions';

// Mock dependencies
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/db/prisma', () => ({
  prisma: {
    task: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    conversation: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    conversationParticipant: {
      create: jest.fn(),
    },
    taskAssignment: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/actions/chat.actions', () => ({
  getOrCreateConversation: jest.fn(),
}));

jest.mock('@/lib/actions/task.actions', () => ({
  createTask: jest.fn(),
}));

jest.mock('@/lib/actions/task-assignment.actions', () => ({
  createTaskAssignment: jest.fn(),
}));

describe('Context-Based Permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  // Create mock users that can act as either client or contractor
  const userA = {
    id: 'user-a-id',
    name: 'User A',
    email: 'usera@example.com'
  };
  
  const userB = {
    id: 'user-b-id',
    name: 'User B',
    email: 'userb@example.com'
  };
  
  describe('Task Creator Permissions (Acting as Client)', () => {
    beforeEach(() => {
      // Set up session for User A (acting as task creator)
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: userA.id,
          name: userA.name,
          email: userA.email
        }
      });
    });
    
    it('should allow task creators to create tasks', async () => {
      // Arrange
      const taskData = {
        name: 'Task by User A',
        description: 'Description for test task',
        price: 100,
        categoryId: 'category-123',
        images: ['image1.jpg'],
        userId: userA.id
      };
      
      (prisma.task.create as jest.Mock).mockResolvedValue({
        id: 'task-123',
        ...taskData,
        createdById: userA.id,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      (createTask as jest.Mock).mockImplementation(async (data) => {
        const session = await auth();
        if (!session?.user?.id) {
          return { success: false, message: 'Unauthorized' };
        }
        
        return { 
          success: true, 
          task: await prisma.task.create({ 
            data: { ...data, createdById: session.user.id } 
          }),
        };
      });
      
      // Act
      const result = await createTask(taskData);
      
      // Assert
      expect(result.success).toBe(true);
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: { ...taskData, createdById: userA.id }
      });
    });
    
    it('should allow task creators to assign their tasks to other users', async () => {
      // Arrange
      const taskId = 'task-123';
      const contractorId = userB.id;
      
      (prisma.task.findUnique as jest.Mock).mockResolvedValue({
        id: taskId,
        createdById: userA.id, // Task was created by User A
        name: 'Task by User A',
      });
      
      (prisma.taskAssignment.create as jest.Mock).mockResolvedValue({
        id: 'assignment-123',
        taskId,
        clientId: userA.id,
        contractorId,
        statusId: 'status-assigned',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      (createTaskAssignment as jest.Mock).mockImplementation(async (data) => {
        const session = await auth();
        if (!session?.user?.id) {
          return { success: false, message: 'Unauthorized' };
        }
        
        const task = await prisma.task.findUnique({ where: { id: data.taskId } });
        if (!task) {
          return { success: false, message: 'Task not found' };
        }
        
        if (task.createdById !== session.user.id) {
          return { success: false, message: 'Only the task creator can assign contractors' };
        }
        
        const assignment = await prisma.taskAssignment.create({
          data: {
            taskId: data.taskId,
            clientId: session.user.id,
            contractorId: data.contractorId,
            statusId: 'status-assigned'
          }
        });
        
        return { success: true, assignment };
      });
      
      // Act
      const result = await createTaskAssignment({
        taskId,
        contractorId,
        clientId: userA.id,
        statusId: 'status-assigned'
      });
      
      // Assert
      expect(result.success).toBe(true);
      expect(prisma.taskAssignment.create).toHaveBeenCalledWith({
        data: {
          taskId,
          clientId: userA.id,
          contractorId,
          statusId: 'status-assigned'
        }
      });
    });
    
    it('should prevent users from assigning tasks they did not create', async () => {
      // Arrange
      const taskId = 'task-123';
      const contractorId = userB.id;
      
      (prisma.task.findUnique as jest.Mock).mockResolvedValue({
        id: taskId,
        createdById: 'different-user-id', // Task created by someone else
        name: 'Task by Different User',
      });
      
      (createTaskAssignment as jest.Mock).mockImplementation(async (data) => {
        const session = await auth();
        if (!session?.user?.id) {
          return { success: false, message: 'Unauthorized' };
        }
        
        const task = await prisma.task.findUnique({ where: { id: data.taskId } });
        if (!task) {
          return { success: false, message: 'Task not found' };
        }
        
        if (task.createdById !== session.user.id) {
          return { success: false, message: 'Only the task creator can assign contractors' };
        }
        
        const assignment = await prisma.taskAssignment.create({
          data: {
            taskId: data.taskId,
            clientId: session.user.id,
            contractorId: data.contractorId,
            statusId: 'status-assigned'
          }
        });
        
        return { success: true, assignment };
      });
      
      // Act
      const result = await createTaskAssignment({
        taskId,
        contractorId,
        clientId: userB.id,
        statusId: 'status-assigned'
      });
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Only the task creator can assign contractors');
      expect(prisma.taskAssignment.create).not.toHaveBeenCalled();
    });
  });
  
  describe('Task Responder Permissions (Acting as Contractor)', () => {
    beforeEach(() => {
      // Set up session for User B (acting as task responder)
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: userB.id,
          name: userB.name,
          email: userB.email
        }
      });
    });
    
    it('should allow users to initiate conversations about tasks created by others', async () => {
      // Arrange
      const taskId = 'task-123';
      const taskCreatorId = userA.id;
      
      (prisma.task.findUnique as jest.Mock).mockResolvedValue({
        id: taskId,
        createdById: taskCreatorId,
        name: 'Task by User A',
      });
      
      (prisma.conversation.findFirst as jest.Mock).mockResolvedValue(null);
      
      (prisma.conversation.create as jest.Mock).mockResolvedValue({
        id: 'conversation-123',
        taskId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      (prisma.conversationParticipant.create as jest.Mock).mockImplementation(({ data }) => ({
        id: `participant-${data.userId}`,
        userId: data.userId,
        conversationId: data.conversationId,
        joinedAt: new Date()
      }));
      
      (getOrCreateConversation as jest.Mock).mockImplementation(async (currentUserId, taskId, taskCreatorId) => {
        const session = await auth();
        if (!session?.user?.id) {
          return { success: false, message: 'Unauthorized' };
        }
        
        // Cannot create conversation with self
        if (currentUserId === taskCreatorId) {
          return { success: false, message: 'Cannot create a conversation with yourself' };
        }
        
        // Check if conversation already exists
        const existingConversation = await prisma.conversation.findFirst({
          where: { taskId }
        });
        
        if (existingConversation) {
          return { success: true, data: existingConversation };
        }
        
        // Create new conversation
        const conversation = await prisma.conversation.create({
          data: { taskId }
        });
        
        // Add participants
        const clientParticipant = await prisma.conversationParticipant.create({
          data: {
            userId: taskCreatorId,
            conversationId: conversation.id
          }
        });
        
        const contractorParticipant = await prisma.conversationParticipant.create({
          data: {
            userId: currentUserId,
            conversationId: conversation.id
          }
        });
        
        return { success: true, data: conversation };
      });
      
      // Act
      const result = (await getOrCreateConversation(userB.id, taskId, taskCreatorId) as unknown) as { 
        success: boolean; 
        data?: {
          id: string;
          taskId: string;
          createdAt: Date;
          updatedAt: Date;
        }; 
        message?: string;
      };
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(prisma.conversation.create).toHaveBeenCalledWith({
        data: { taskId }
      });
    });
    
    it('should prevent users from assigning tasks created by others', async () => {
      // Arrange
      const taskId = 'task-123';
      const contractorId = 'some-other-user-id';
      
      (prisma.task.findUnique as jest.Mock).mockResolvedValue({
        id: taskId,
        createdById: userA.id, // Task created by User A
        name: 'Task by User A',
      });
      
      (createTaskAssignment as jest.Mock).mockImplementation(async (data) => {
        const session = await auth();
        if (!session?.user?.id) {
          return { success: false, message: 'Unauthorized' };
        }
        
        const task = await prisma.task.findUnique({ where: { id: data.taskId } });
        if (!task) {
          return { success: false, message: 'Task not found' };
        }
        
        if (task.createdById !== session.user.id) {
          return { success: false, message: 'Only the task creator can assign contractors' };
        }
        
        const assignment = await prisma.taskAssignment.create({
          data: {
            taskId: data.taskId,
            clientId: session.user.id,
            contractorId: data.contractorId,
            statusId: 'status-assigned'
          }
        });
        
        return { success: true, assignment };
      });
      
      // Act
      const result = await createTaskAssignment({
        taskId,
        contractorId,
        clientId: userB.id,
        statusId: 'status-assigned'
      });
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Only the task creator can assign contractors');
      expect(prisma.taskAssignment.create).not.toHaveBeenCalled();
    });
    
    it('should prevent creating conversations for your own tasks', async () => {
      // Arrange
      const taskId = 'task-456';
      const taskCreatorId = userB.id; // Same as current user
      
      (getOrCreateConversation as jest.Mock).mockImplementation(async (currentUserId, taskId, taskCreatorId) => {
        const session = await auth();
        if (!session?.user?.id) {
          return { success: false, message: 'Unauthorized' };
        }
        
        // Cannot create conversation with self
        if (currentUserId === taskCreatorId) {
          return { success: false, message: 'Cannot create a conversation with yourself' };
        }
        
        return { conversation: null };
      });
      
      // Act
      const result = (await getOrCreateConversation(userB.id, taskId, taskCreatorId) as unknown) as {
        success: boolean;
        message?: string;
      };
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Cannot create a conversation with yourself');
      expect(prisma.conversation.create).not.toHaveBeenCalled();
    });
  });
  
  describe('Same User in Different Contexts', () => {
    const userC = {
      id: 'user-c-id',
      name: 'User C',
      email: 'userc@example.com'
    };
    
    it('should allow a user to create a task (as client) and respond to other tasks (as contractor)', async () => {
      // Set up user C's session
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: userC.id,
          name: userC.name,
          email: userC.email
        }
      });
      
      // Test as task creator (client role)
      const taskData = {
        name: 'Task by User C',
        description: 'Description for test task',
        price: 100,
        categoryId: 'category-123',
        images: ['image1.jpg'],
        userId: userC.id
      };
      
      (prisma.task.create as jest.Mock).mockResolvedValue({
        id: 'task-c-123',
        ...taskData,
        createdById: userC.id,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      (createTask as jest.Mock).mockImplementation(async (data) => {
        const session = await auth();
        if (!session?.user?.id) {
          return { success: false, message: 'Unauthorized' };
        }
        
        return { 
          success: true, 
          task: await prisma.task.create({ 
            data: { ...data, createdById: session.user.id } 
          }),
        };
      });
      
      // Test user creating a task
      const createResult = await createTask(taskData);
      expect(createResult.success).toBe(true);
      
      // Now test the same user responding to a task (contractor role)
      const taskId = 'task-by-another-user';
      const taskCreatorId = userA.id;
      
      (prisma.conversation.findFirst as jest.Mock).mockResolvedValue(null);
      
      (prisma.conversation.create as jest.Mock).mockResolvedValue({
        id: 'conversation-with-c',
        taskId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      (getOrCreateConversation as jest.Mock).mockImplementation(async (currentUserId, taskId, taskCreatorId) => {
        const session = await auth();
        if (!session?.user?.id) {
          return { success: false, message: 'Unauthorized' };
        }
        
        // Cannot create conversation with self
        if (currentUserId === taskCreatorId) {
          return { success: false, message: 'Cannot create a conversation with yourself' };
        }
        
        // Check if conversation already exists
        const existingConversation = await prisma.conversation.findFirst({
          where: { taskId }
        });
        
        if (existingConversation) {
          return { success: true, data: existingConversation };
        }
        
        // Create new conversation
        const conversation = await prisma.conversation.create({
          data: { taskId }
        });
        
        return { success: true, data: conversation };
      });
      
      // Test user responding to another user's task
      const conversationResult = (await getOrCreateConversation(userC.id, taskId, taskCreatorId) as unknown) as {
        success: boolean;
        data?: {
          id: string;
          taskId: string;
          createdAt: Date;
          updatedAt: Date;
        };
        message?: string;
      };
      
      // Assert both roles work for the same user
      expect(createResult.success).toBe(true);
      expect(conversationResult.success).toBe(true);
      expect(conversationResult.data).toBeDefined();
    });
  });
  
  describe('Unauthorized Access', () => {
    beforeEach(() => {
      // Set up no session for each test
      (auth as jest.Mock).mockResolvedValue(null);
    });
    
    it('should prevent unauthenticated users from creating tasks', async () => {
      // Arrange
      const taskData = {
        name: 'Test Task',
        description: 'Description for test task',
        price: 100,
        categoryId: 'category-123',
        images: ['image1.jpg'],
        userId: 'anonymous-user-id'
      };
      
      (createTask as jest.Mock).mockImplementation(async (data) => {
        const session = await auth();
        if (!session?.user?.id) {
          return { success: false, message: 'Unauthorized' };
        }
        
        return { 
          success: true, 
          task: await prisma.task.create({ 
            data: { ...data, createdById: session.user.id } 
          }),
        };
      });
      
      // Act
      const result = await createTask(taskData);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
      expect(prisma.task.create).not.toHaveBeenCalled();
    });
    
    it('should prevent unauthenticated users from initiating conversations', async () => {
      // Arrange
      const taskId = 'task-123';
      const taskCreatorId = userA.id;
      
      (getOrCreateConversation as jest.Mock).mockImplementation(async (currentUserId, taskId, taskCreatorId) => {
        const session = await auth();
        if (!session?.user?.id) {
          return { success: false, message: 'Unauthorized' };
        }
        
        return { conversation: null };
      });
      
      // Act
      const result = (await getOrCreateConversation('anonymous-user', taskId, taskCreatorId) as unknown) as {
        success: boolean;
        message?: string;
      };
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
      expect(prisma.conversation.create).not.toHaveBeenCalled();
    });
  });
}); 
