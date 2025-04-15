'use server'; 

/**
 * Task management functions for creating, retrieving, updating and deleting tasks
 * @module TaskActions
 * @group API
 */

import { prisma } from '@/db/prisma';
import { convertToPlainObject, formatError } from '../utils';
import { PAGE_SIZE } from '../constants';
import { revalidatePath } from 'next/cache';
import { insertTaskSchema, updateTaskSchema } from '../validators';
import { z } from 'zod';
import { Prisma, Task as PrismaTask } from '@prisma/client';
import { Task } from '@/types';
import { auth } from '@/auth';

// Define a type that includes exactly what Prisma returns with relations
type TaskWithRelations = {
  id: string;
  name: string;
  description: string | null;
  price: Prisma.Decimal;
  images: string[];
  categoryId: string;
  statusId: string | null;
  createdAt: Date;
  updatedAt: Date;  // Explicitly include updatedAt
  isArchived: boolean;
  archivedAt: Date | null;
  category?: { id: string; name: string };
  createdBy?: { id: string; name: string; email: string };
};

/**
 * Parameters for retrieving and filtering tasks
 */
type GetAllTasksParams = {
  /** Search query to filter tasks by name */
  query?: string;
  /** Category name to filter tasks by */
  category?: string;
  /** Price range to filter tasks by (format: 'min-max') */
  price?: string;
  /** Sort order for returned tasks */
  sort?: 'newest' | 'lowest' | 'highest';
  /** Page number for pagination */
  page?: number;
};

/**
 * Retrieves the most recent tasks
 * 
 * @returns Array of the latest 12 tasks with author information
 * @throws Will throw an error if the database operation fails
 * 
 * @example
 * try {
 *   const latestTasks = await getLatestTasks();
 *   // Display tasks to the user
 * } catch (error) {
 *   console.error('Failed to load latest tasks');
 * }
 */
export async function getLatestTasks() {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        isArchived: false
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 12
    });

    // Make TypeScript happy by ensuring all required fields exist
    return tasks.map(task => {
      // Create a properly typed object with all required Task fields
      const taskWithRelations = task as unknown as TaskWithRelations;
      
      return {
        id: taskWithRelations.id,
        name: taskWithRelations.name,
        description: taskWithRelations.description,
        price: Number(taskWithRelations.price),
        images: taskWithRelations.images,
        categoryId: taskWithRelations.categoryId,
        statusId: taskWithRelations.statusId,
        createdAt: taskWithRelations.createdAt,
        updatedAt: taskWithRelations.updatedAt,
        isArchived: taskWithRelations.isArchived,
        archivedAt: taskWithRelations.archivedAt,
        author: taskWithRelations.createdBy ? {
          id: taskWithRelations.createdBy.id,
          name: taskWithRelations.createdBy.name,
          email: taskWithRelations.createdBy.email
        } : undefined,
        category: taskWithRelations.category ? {
          id: taskWithRelations.category.id,
          name: taskWithRelations.category.name
        } : undefined
      } satisfies Task;
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Retrieves a single task by its unique ID
 * 
 * @param taskId - The task's unique identifier
 * @returns The task with creator information or null if not found
 * 
 * @example
 * const task = await getTaskById('task-123');
 * if (task) {
 *   console.log(`Found task: ${task.name} by ${task.createdBy.name}`);
 * }
 */
export async function getTaskById(taskId: string) {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(taskId)) {
      return null;
    }
    
    const data = await prisma.task.findFirst({
      where: { id: taskId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return convertToPlainObject(data);
  } catch (error) {
    return null;
  }
}

/**
 * Retrieves tasks with filtering, sorting and pagination
 * 
 * @param options - Query parameters for filtering tasks
 * @param options.query - Text to search in task names
 * @param options.category - Category name to filter by
 * @param options.price - Price range in format 'min-max'
 * @param options.sort - Sort order (newest, lowest price, highest price)
 * @param options.page - Page number for pagination
 * @returns Paginated list of tasks and total pages
 * 
 * @example
 * const { data, totalPages } = await getAllTasks({
 *   category: 'Cleaning',
 *   sort: 'lowest',
 *   page: 1
 * });
 */
export async function getAllTasks({
  query = 'all',
  category = 'all',
  price = 'all',
  sort = 'newest',
  page = 1,
}: GetAllTasksParams) {
  try {
    const conditions: Prisma.TaskWhereInput = {
      isArchived: false
    };
    
    // Category filter
    if (category !== 'all') {
      const categoryRecord = await prisma.category.findFirst({
        where: { name: category }
      });
      
      if (categoryRecord) {
        conditions['categoryId'] = categoryRecord.id;
      }
    }

    // Price filter
    if (price !== 'all') {
      const [min, max] = price.split('-').map(Number);
      conditions['price'] = {
        gte: min,
        lte: max,
      };
    }

    // Search query
    if (query !== 'all') {
      conditions.name = {
        contains: query,
        mode: 'insensitive'
      };
    }

    // Get tasks with conditions
    const tasks = await prisma.task.findMany({
      where: conditions,
      orderBy: [
        ...(sort === 'newest' ? [{ createdAt: 'desc' as const }] : []),
        ...(sort === 'lowest' ? [{ price: 'asc' as const }] : []),
        ...(sort === 'highest' ? [{ price: 'desc' as const }] : []),
      ],
      include: {
        category: true, // Include full category to get id
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Map tasks to the expected format
    return {
      data: tasks.map(task => {
        // Use the same type casting approach as other functions
        const taskWithRelations = task as unknown as TaskWithRelations;
        
        return {
          id: taskWithRelations.id,
          name: taskWithRelations.name,
          description: taskWithRelations.description,
          price: Number(taskWithRelations.price),
          images: taskWithRelations.images,
          categoryId: taskWithRelations.categoryId,
          statusId: taskWithRelations.statusId,
          createdAt: taskWithRelations.createdAt,
          updatedAt: taskWithRelations.updatedAt,
          isArchived: taskWithRelations.isArchived,
          archivedAt: taskWithRelations.archivedAt,
          author: taskWithRelations.createdBy ? {
            id: taskWithRelations.createdBy.id,
            name: taskWithRelations.createdBy.name,
            email: taskWithRelations.createdBy.email
          } : undefined,
          category: taskWithRelations.category ? {
            id: taskWithRelations.category.id,
            name: taskWithRelations.category.name
          } : undefined
        };
      }),
      totalPages: Math.ceil(tasks.length / PAGE_SIZE)
    };
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return {
      data: [],
      totalPages: 0
    };
  }
}

/**
 * Deletes a task by its ID
 * 
 * @param id - The task's unique identifier
 * @returns Result with success status and message
 * 
 * @example
 * const result = await deleteTask('task-123');
 * if (result.success) {
 *   showNotification(result.message);
 * }
 */
export async function deleteTask(id: string) {
  try {
    const taskExists = await prisma.task.findFirst({
      where: { id },
    });

    if (!taskExists) throw new Error('task not found');

    await prisma.task.delete({ where: { id } });

    revalidatePath('/user/dashboard/client/tasks');

    return {
      success: true,
      message: 'task deleted successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

/**
 * Creates a new task
 * 
 * @param data - Task data including user ID of the creator
 * @returns Result with success status and message
 * 
 * @example
 * const result = await createTask({
 *   name: 'House Painting',
 *   slug: 'house-painting',
 *   categoryId: 'category-123',
 *   description: 'Professional house painting service',
 *   price: 200,
 *   images: ['image1.jpg', 'image2.jpg'],
 *   userId: 'user-123'
 * });
 */
export async function createTask(data: z.infer<typeof insertTaskSchema> & { userId: string }) {
  try {
    const task = insertTaskSchema.parse(data);
    const openStatus = await prisma.taskStatus.findFirst({
      where: { name: 'OPEN' }
    });
    
    const createdTask = await prisma.task.create({ 
      data: {
        name: task.name,
        categoryId: task.categoryId,
        images: task.images,
        description: task.description,
        price: new Prisma.Decimal(task.price || 0),
        statusId: openStatus!.id,
        createdById: data.userId
      } 
    });
    
    revalidatePath('/');
    revalidatePath('/user/dashboard/client/tasks');
    return { success: true, message: 'Task created successfully' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

/**
 * Updates an existing task
 * 
 * @param data - Task data with updated fields
 * @returns Result with success status and message
 * 
 * @example
 * const result = await updateTask({
 *   id: 'task-123',
 *   name: 'Updated Task Name',
 *   price: 250
 * });
 */
export async function updateTask(data: z.infer<typeof updateTaskSchema>) {
  try {
    const task = updateTaskSchema.parse(data);
    const taskExists = await prisma.task.findFirst({
      where: { id: task.id },
    });

    if (!taskExists) throw new Error('Task not found');

    await prisma.task.update({
      where: { id: task.id },
      data: task,
    });

    revalidatePath('/user/dashboard/client/tasks');

    return {
      success: true,
      message: 'Task updated successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Get all categories
export async function getAllCategories() {
  const data = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      _count: {
        select: {
          tasks: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  return data;
}

type TasksWithPagination = {
  data: Task[];
  totalPages: number;
};

export async function getAllTasksByClientId(clientId: string): Promise<TasksWithPagination> {
  const where: Prisma.TaskWhereInput = {
    isArchived: false,
    OR: [
      { createdById: clientId },
      {
        assignments: {
          some: {
            clientId: clientId
          }
        }
      }
    ]
  };

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignments: true,
      category: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
  
  return {
    data: tasks.map(task => {
      // Create a properly typed object with all required Task fields
      const taskWithRelations = task as unknown as TaskWithRelations;
      
      return {
        id: taskWithRelations.id,
        name: taskWithRelations.name,
        description: taskWithRelations.description,
        price: Number(taskWithRelations.price),
        images: taskWithRelations.images,
        categoryId: taskWithRelations.categoryId,
        statusId: taskWithRelations.statusId,
        createdAt: taskWithRelations.createdAt,
        updatedAt: taskWithRelations.updatedAt,
        isArchived: taskWithRelations.isArchived,
        archivedAt: taskWithRelations.archivedAt,
        author: taskWithRelations.createdBy ? {
          id: taskWithRelations.createdBy.id,
          name: taskWithRelations.createdBy.name,
          email: taskWithRelations.createdBy.email
        } : undefined,
        category: taskWithRelations.category ? {
          id: taskWithRelations.category.id,
          name: taskWithRelations.category.name
        } : undefined
      } as Task;
    }),
    totalPages: Math.ceil(tasks.length / 10)
  };
}

// Check if the current user owns the task
export const checkTaskOwnership = async (
  taskId: string,
  userId: string
): Promise<boolean> => {
  try {
    // Clear any cached task data first
    await prisma.$queryRaw`SELECT pg_advisory_unlock_all()`;  // If using PostgreSQL
    
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { createdById: true }
    });

    return task?.createdById === userId;
  } catch (error) {
    return false;
  }
};

/**
 * Get task statistics for admin dashboard
 * Returns the count of open tasks and weekly task creation data
 */
export async function getTaskStatistics() {
  try {
    // Get count of open tasks
    const openTasksCount = await prisma.task.count({
      where: {
        status: {
          name: 'OPEN'
        }
      }
    });

    // Get weekly task creation data for the last 8 weeks
    const now = new Date();
    const eightWeeksAgo = new Date(now.getTime() - (8 * 7 * 24 * 60 * 60 * 1000));

    const weeklyTasks = await prisma.task.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: eightWeeksAgo
        }
      },
      _count: {
        id: true
      }
    });

    // Process weekly data
    const weeklyData = Array.from({ length: 8 }, (_, i) => {
      const weekStart = new Date(now.getTime() - ((7 - i) * 7 * 24 * 60 * 60 * 1000));
      const weekEnd = new Date(weekStart.getTime() + (7 * 24 * 60 * 60 * 1000));
      
      const tasksInWeek = weeklyTasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate >= weekStart && taskDate < weekEnd;
      });

      const totalTasks = tasksInWeek.reduce((sum, task) => sum + task._count.id, 0);
      
      return {
        week: `Week ${i + 1}`,
        totalTasks
      };
    });

    return {
      openTasksCount,
      weeklyData
    };
  } catch (error) {
    console.error('Error getting task statistics:', error);
    throw error;
  }
}

/**
 * Archives a task
 * 
 * @param taskId - The ID of the task to archive
 * @returns Result with success status and message
 * 
 * @example
 * const result = await archiveTask('task-123');
 * if (result.success) {
 *   console.log('Task archived successfully');
 * }
 */
export async function archiveTask(taskId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Check if task exists and user owns it
    const taskExists = await prisma.task.findFirst({
      where: { 
        id: taskId,
        createdById: session.user.id 
      },
    });

    if (!taskExists) {
      throw new Error('Task not found or unauthorized');
    }

    // Update task to archived status
    await prisma.task.update({
      where: { id: taskId },
      data: {
        isArchived: true,
        archivedAt: new Date(),
      },
    });

    revalidatePath('/user/dashboard/client/tasks');

    return {
      success: true,
      message: 'Task archived successfully',
    };
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to archive task' 
    };
  }
}
