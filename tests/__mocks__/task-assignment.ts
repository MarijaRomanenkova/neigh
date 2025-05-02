// Mock task assignment data and functions for testing

import { z } from 'zod';
import { insertTaskAssignmentSchema } from '@/lib/validators';

// UUID helper for predictable test IDs
const generateTestId = (prefix: string = 'test') => `${prefix}-${Math.floor(Math.random() * 10000)}`;
const generateUuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0;
  const v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

// Mock status data
export const mockTaskAssignmentStatuses = {
  inProgress: {
    id: generateUuid(),
    name: 'IN_PROGRESS',
    description: 'Task is in progress',
    color: '#3b82f6',
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  completed: {
    id: generateUuid(),
    name: 'COMPLETED',
    description: 'Task has been completed',
    color: '#10b981',
    order: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  accepted: {
    id: generateUuid(),
    name: 'ACCEPTED',
    description: 'Task has been accepted by client',
    color: '#4ade80',
    order: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  }
};

// Mock users for testing
export const mockUsers = {
  client: {
    id: generateUuid(),
    name: 'Test Client',
    email: 'client@example.com',
    role: 'CLIENT'
  },
  contractor: {
    id: generateUuid(),
    name: 'Test Contractor',
    email: 'contractor@example.com',
    role: 'CONTRACTOR'
  },
  admin: {
    id: generateUuid(),
    name: 'Test Admin',
    email: 'admin@example.com',
    role: 'ADMIN'
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

// Base mock task assignment
export const mockTaskAssignment = {
  id: generateUuid(),
  taskId: mockTask.id,
  clientId: mockUsers.client.id,
  contractorId: mockUsers.contractor.id,
  statusId: mockTaskAssignmentStatuses.inProgress.id,
  createdAt: new Date(),
  completedAt: null,
  task: {
    name: mockTask.name,
    price: mockTask.price,
    description: mockTask.description
  },
  contractor: {
    name: mockUsers.contractor.name,
    email: mockUsers.contractor.email
  },
  client: {
    name: mockUsers.client.name,
    email: mockUsers.client.email
  },
  status: mockTaskAssignmentStatuses.inProgress
};

// Mock functions for task assignment operations

// Create task assignment
export const createTaskAssignment = jest.fn().mockImplementation(
  async (data: z.infer<typeof insertTaskAssignmentSchema>) => {
    // Validate required fields
    if (!data.taskId || !data.contractorId || !data.clientId) {
      return {
        success: false,
        message: 'Missing required fields'
      };
    }

    // Mock creation behavior - always sets to IN_PROGRESS status
    const assignment = {
      id: generateTestId('assignment'),
      taskId: data.taskId,
      contractorId: data.contractorId,
      clientId: data.clientId,
      statusId: mockTaskAssignmentStatuses.inProgress.id,
      createdAt: new Date(),
      completedAt: null,
      task: {
        name: 'Mock Task Name'
      },
      contractor: {
        name: 'Mock Contractor Name'
      }
    };

    return {
      success: true,
      message: 'Task assigned successfully',
      data: assignment
    };
  }
);

// Update task assignment status
export const updateTaskAssignmentStatus = jest.fn().mockImplementation(
  async (id: string, statusName: string) => {
    // Check if status exists
    const normalizedStatus = statusName.toUpperCase();
    const statusEntry = Object.values(mockTaskAssignmentStatuses).find(
      s => s.name === normalizedStatus
    );

    if (!statusEntry) {
      throw new Error(`Status "${statusName}" not found`);
    }

    // Mock permission check logic
    if (statusName === 'COMPLETED' && mockTaskAssignment.contractorId !== mockUsers.contractor.id) {
      throw new Error('Only the assigned contractor can mark a task as completed');
    }

    // Create updated assignment object
    const updatedAssignment = {
      ...mockTaskAssignment,
      statusId: statusEntry.id,
      status: {
        ...statusEntry
      },
      completedAt: normalizedStatus === 'COMPLETED' ? new Date() : null
    };

    return updatedAssignment;
  }
);

// Get task assignment by ID
export const getTaskAssignmentById = jest.fn().mockImplementation(
  async (id: string) => {
    if (id === generateUuid()) {
      return null;
    }
    
    return {
      ...mockTaskAssignment,
      id
    };
  }
);

// Accept task assignment - client specific action
export const acceptTaskAssignment = jest.fn().mockImplementation(
  async (id: string, userId: string) => {
    // Check if the assignment exists
    const nonExistentId = generateUuid();
    if (id === nonExistentId) {
      return {
        success: false,
        message: 'Task assignment not found'
      };
    }

    // Check if the user is the client
    if (userId !== mockUsers.client.id) {
      return {
        success: false,
        message: 'Only the client can accept this task'
      };
    }

    // Check if the status is completed
    if (mockTaskAssignment.status.name !== 'COMPLETED') {
      return {
        success: false,
        message: 'Only completed tasks can be accepted'
      };
    }

    // Mock successful acceptance
    const acceptedAssignment = {
      ...mockTaskAssignment,
      statusId: mockTaskAssignmentStatuses.accepted.id,
      status: mockTaskAssignmentStatuses.accepted
    };

    return {
      success: true,
      message: 'Task accepted successfully',
      data: acceptedAssignment
    };
  }
);

// Mock functions to be exported for task assignment Status API
export const mockTaskAssignmentStatusAPI = {
  getAllTaskAssignmentStatuses: jest.fn().mockResolvedValue(
    Object.values(mockTaskAssignmentStatuses)
  ),
  
  getTaskAssignmentStatusByName: jest.fn().mockImplementation(
    async (name: string) => {
      const statusEntry = Object.values(mockTaskAssignmentStatuses).find(
        s => s.name === name.toUpperCase()
      );
      
      if (!statusEntry) {
        throw new Error(`Status "${name}" not found`);
      }
      
      return statusEntry;
    }
  ),
  
  updateTaskAssignmentStatus
};

// Mock Prisma client for task assignments
export const mockPrismaTaskAssignment = {
  taskAssignment: {
    findUnique: jest.fn().mockImplementation(({ where }) => {
      if (where.id === 'non-existent') {
        return null;
      }
      return { ...mockTaskAssignment, id: where.id };
    }),
    findFirst: jest.fn().mockImplementation(({ where }) => {
      if (where?.id === 'non-existent') return null;
      return { ...mockTaskAssignment, ...where };
    }),
    findMany: jest.fn().mockResolvedValue([mockTaskAssignment]),
    create: jest.fn().mockImplementation(({ data }) => ({
      ...mockTaskAssignment,
      ...data,
      id: generateTestId('assignment')
    })),
    update: jest.fn().mockImplementation(({ where, data }) => ({
      ...mockTaskAssignment,
      ...data,
      id: where.id
    })),
    delete: jest.fn().mockResolvedValue(mockTaskAssignment)
  },
  taskAssignmentStatus: {
    findFirst: jest.fn().mockImplementation(({ where }) => {
      const statusName = where?.name;
      if (!statusName) return mockTaskAssignmentStatuses.inProgress;
      
      const status = Object.values(mockTaskAssignmentStatuses).find(
        s => s.name === statusName
      );
      
      return status || null;
    }),
    findUnique: jest.fn().mockImplementation(({ where }) => {
      if (!where?.id) return null;
      
      const status = Object.values(mockTaskAssignmentStatuses).find(
        s => s.id === where.id
      );
      
      return status || null;
    }),
    findMany: jest.fn().mockResolvedValue(Object.values(mockTaskAssignmentStatuses))
  }
};

// Helper for mocking authenticated sessions
export const mockAuthSession = (role: 'CLIENT' | 'CONTRACTOR' | 'ADMIN' = 'CLIENT') => {
  const userMap = {
    'CLIENT': mockUsers.client,
    'CONTRACTOR': mockUsers.contractor,
    'ADMIN': mockUsers.admin
  };
  
  return {
    user: userMap[role]
  };
}; 
