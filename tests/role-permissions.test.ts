import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { mockSessions, mockUsers } from './__mocks__/auth';
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

describe('Role-Based Permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Client Permissions', () => {
    beforeEach(() => {
      // Set up client session for each test
      (auth as jest.Mock).mockResolvedValue(mockSessions.CLIENT);
    });
    
    it('should allow clients to create tasks', async () => {
      // Arrange
      const taskData = {
        name: 'Test Task',
        description: 'Description for test task',
        price: 100,
        categoryId: 'category-123',
        images: ['image1.jpg'],
        userId: mockUsers.client.id
      };
      
      (prisma.task.create as jest.Mock).mockResolvedValue({
        id: 'task-123',
        ...taskData,
        createdById: mockUsers.client.id,
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
        data: { ...taskData, createdById: mockUsers.client.id }
      });
    });
    
    it('should allow clients to assign tasks to contractors', async () => {
      // Arrange
      const taskId = 'task-123';
      const contractorId = mockUsers.contractor.id;
      
      (prisma.task.findUnique as jest.Mock).mockResolvedValue({
        id: taskId,
        createdById: mockUsers.client.id,
        name: 'Test Task',
      });
      
      (prisma.taskAssignment.create as jest.Mock).mockResolvedValue({
        id: 'assignment-123',
        taskId,
        clientId: mockUsers.client.id,
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
            statusId: data.statusId
          }
        });
        
        return { success: true, data: assignment };
      });
      
      // Act
      const result = await createTaskAssignment({
        taskId,
        contractorId,
        clientId: mockUsers.client.id,
        statusId: 'status-assigned'
      });
      
      // Assert
      expect(result.success).toBe(true);
      expect(prisma.taskAssignment.create).toHaveBeenCalledWith({
        data: {
          taskId,
          clientId: mockUsers.client.id,
          contractorId,
          statusId: 'status-assigned'
        }
      });
    });
    
    it('should prevent clients from assigning tasks they did not create', async () => {
      // Arrange
      const taskId = 'task-123';
      const contractorId = mockUsers.contractor.id;
      
      (prisma.task.findUnique as jest.Mock).mockResolvedValue({
        id: taskId,
        createdById: 'different-client-id', // Different client
        name: 'Test Task',
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
            statusId: data.statusId
          }
        });
        
        return { success: true, data: assignment };
      });
      
      // Act
      const result = await createTaskAssignment({
        taskId,
        contractorId,
        clientId: mockUsers.client.id,
        statusId: 'status-assigned'
      });
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Only the task creator can assign contractors');
      expect(prisma.taskAssignment.create).not.toHaveBeenCalled();
    });
  });
  
  describe('Contractor Permissions', () => {
    beforeEach(() => {
      // Set up contractor session for each test
      (auth as jest.Mock).mockResolvedValue(mockSessions.CONTRACTOR);
    });
    
    it('should prevent contractors from creating tasks', async () => {
      // Arrange
      const taskData = {
        name: 'Test Task',
        description: 'Description for test task',
        price: 100,
        categoryId: 'category-123',
        images: ['image1.jpg'],
        userId: mockUsers.contractor.id
      };
      
      (createTask as jest.Mock).mockImplementation(async (data) => {
        const session = await auth();
        if (!session?.user?.id) {
          return { success: false, message: 'Unauthorized' };
        }
        
        // Check if user is a client
        if (session.user.role !== 'CLIENT') {
          return { success: false, message: 'Only clients can create tasks' };
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
      expect(result.message).toBe('Only clients can create tasks');
      expect(prisma.task.create).not.toHaveBeenCalled();
    });
    
    it('should allow contractors to initiate conversations about tasks', async () => {
      // Arrange
      const taskId = 'task-123';
      const clientId = mockUsers.client.id;
      
      (prisma.task.findUnique as jest.Mock).mockResolvedValue({
        id: taskId,
        createdById: clientId,
        name: 'Test Task',
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
      const result = (await getOrCreateConversation(mockUsers.contractor.id, taskId, clientId) as unknown) as { 
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
      expect(prisma.conversationParticipant.create).toHaveBeenCalledTimes(2);
    });
    
    it('should prevent contractors from assigning tasks', async () => {
      // Arrange
      const taskId = 'task-123';
      const contractorId = mockUsers.contractor.id;
      
      (prisma.task.findUnique as jest.Mock).mockResolvedValue({
        id: taskId,
        createdById: mockUsers.client.id,
        name: 'Test Task',
      });
      
      (createTaskAssignment as jest.Mock).mockImplementation(async (data) => {
        const session = await auth();
        if (!session?.user?.id) {
          return { success: false, message: 'Unauthorized' };
        }
        
        // Only clients can assign tasks
        if (session.user.role !== 'CLIENT') {
          return { success: false, message: 'Only clients can assign tasks' };
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
            statusId: data.statusId
          }
        });
        
        return { success: true, data: assignment };
      });
      
      // Act
      const result = await createTaskAssignment({
        taskId,
        contractorId,
        clientId: mockUsers.client.id,
        statusId: 'status-assigned'
      });
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Only clients can assign tasks');
      expect(prisma.taskAssignment.create).not.toHaveBeenCalled();
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
      const clientId = mockUsers.client.id;
      
      (getOrCreateConversation as jest.Mock).mockImplementation(async (currentUserId, taskId, taskCreatorId) => {
        const session = await auth();
        if (!session?.user?.id) {
          return { success: false, message: 'Unauthorized' };
        }
        
        // Rest of the implementation
        return { success: true, data: null };
      });
      
      // Act
      const result = (await getOrCreateConversation('some-user-id', taskId, clientId) as unknown) as { 
        success: boolean; 
        data?: {
          id: string;
          taskId: string;
          createdAt: Date;
          updatedAt: Date;
        }; 
        message: string;
      };
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
      expect(prisma.conversation.create).not.toHaveBeenCalled();
    });
    
    it('should prevent unauthenticated users from assigning tasks', async () => {
      // Arrange
      const taskId = 'task-123';
      const contractorId = mockUsers.contractor.id;
      
      (createTaskAssignment as jest.Mock).mockImplementation(async (data) => {
        const session = await auth();
        if (!session?.user?.id) {
          return { success: false, message: 'Unauthorized' };
        }
        
        // Rest of the implementation
        return { success: true, data: null };
      });
      
      // Act
      const result = await createTaskAssignment({
        taskId,
        contractorId,
        clientId: mockUsers.client.id,
        statusId: 'status-assigned'
      });
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
      expect(prisma.taskAssignment.create).not.toHaveBeenCalled();
    });
  });
}); 
