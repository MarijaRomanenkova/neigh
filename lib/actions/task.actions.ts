'use server'; 

/**
 * Task management functions for creating, retrieving, updating and deleting tasks
 * @module TaskActions
 * @group API
 * 
 * This module provides server-side functions for handling task operations including:
 * - Creating and updating tasks
 * - Managing task assignments
 * - Retrieving task listings with filtering and pagination
 * - Archiving tasks
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
  createdAt: Date;
  updatedAt: Date;  // Explicitly include updatedAt
  isArchived: boolean;
  archivedAt: Date | null;
  category?: { id: string; name: string };
  createdBy?: { 
    id: string; 
    name: string; 
    email: string;
    clientRating?: number | null;
  };
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
            email: true,
            clientRating: true
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
        createdAt: taskWithRelations.createdAt,
        updatedAt: taskWithRelations.updatedAt,
        isArchived: taskWithRelations.isArchived,
        archivedAt: taskWithRelations.archivedAt,
        author: taskWithRelations.createdBy ? {
          id: taskWithRelations.createdBy.id,
          name: taskWithRelations.createdBy.name,
          email: taskWithRelations.createdBy.email,
          clientRating: taskWithRelations.createdBy.clientRating !== null && taskWithRelations.createdBy.clientRating !== undefined
            ? Number(taskWithRelations.createdBy.clientRating)
            : null
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
 *   // Handle task data
 * }
 */
export async function getTaskById(taskId: string) {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(taskId)) {
      return null;
    }
    
    const task = await prisma.task.findFirst({
      where: { id: taskId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            clientRating: true
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

    if (!task) return null;

    // Cast to TaskWithRelations to ensure consistent typing
    const taskWithRelations = task as unknown as TaskWithRelations;
    
    // Map the task to the expected format with author property instead of createdBy
    return {
      id: taskWithRelations.id,
      name: taskWithRelations.name,
      description: taskWithRelations.description,
      price: Number(taskWithRelations.price),
      images: taskWithRelations.images,
      categoryId: taskWithRelations.categoryId,
      createdAt: taskWithRelations.createdAt,
      updatedAt: taskWithRelations.updatedAt,
      isArchived: taskWithRelations.isArchived,
      archivedAt: taskWithRelations.archivedAt,
      author: taskWithRelations.createdBy ? {
        id: taskWithRelations.createdBy.id,
        name: taskWithRelations.createdBy.name,
        email: taskWithRelations.createdBy.email,
        clientRating: taskWithRelations.createdBy.clientRating !== null && taskWithRelations.createdBy.clientRating !== undefined
          ? Number(taskWithRelations.createdBy.clientRating)
          : null
      } : undefined,
      category: taskWithRelations.category ? {
        id: taskWithRelations.category.id,
        name: taskWithRelations.category.name
      } : undefined
    } satisfies Task;
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
            email: true,
            clientRating: true
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
          createdAt: taskWithRelations.createdAt,
          updatedAt: taskWithRelations.updatedAt,
          isArchived: taskWithRelations.isArchived,
          archivedAt: taskWithRelations.archivedAt,
          author: taskWithRelations.createdBy ? {
            id: taskWithRelations.createdBy.id,
            name: taskWithRelations.createdBy.name,
            email: taskWithRelations.createdBy.email,
            clientRating: taskWithRelations.createdBy.clientRating !== null && taskWithRelations.createdBy.clientRating !== undefined
              ? Number(taskWithRelations.createdBy.clientRating)
              : null
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
 * @param formData - Form data containing task details
 * @returns Object containing success status, message, and task ID if successful
 * 
 * @example
 * // In a task creation form
 * const handleSubmit = async (formData: FormData) => {
 *   const result = await createTask(formData);
 *   if (result.success) {
 *     router.push(`/task/${result.data}`);
 *   } else {
 *     showError(result.message);
 *   }
 * };
 */
export async function createTask(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const taskData = {
      name: formData.get('name') as string,
      categoryId: formData.get('categoryId') as string,
      images: formData.getAll('images') as string[],
      description: formData.get('description') as string,
      price: formData.get('price') as string,
    };

    const validatedData = insertTaskSchema.parse(taskData);

    const task = await prisma.task.create({
      data: {
        ...validatedData,
        createdById: session.user.id,
      },
    });

    revalidatePath('/tasks');

    return {
      success: true,
      message: 'Task created successfully',
      data: task.id,
    };
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

/**
 * Retrieves all categories with task counts
 * 
 * @returns Array of categories with their task counts
 * 
 * @example
 * // In a category filter component
 * const categories = await getAllCategories();
 * 
 * return (
 *   <div>
 *     <h3>Categories</h3>
 *     {categories.map(category => (
 *       <CategoryItem
 *         key={category.id}
 *         name={category.name}
 *         count={category._count.tasks}
 *       />
 *     ))}
 *   </div>
 * );
 */
export async function getAllCategories() {
  try {
    // Check Prisma's connection status properly
    try {
      // A simple query to test the connection
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      // If the above query fails, try to reconnect
      await prisma.$connect();
    }
    
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
  } catch (error) {
    console.error('Error fetching categories:', error);
    // Return an empty array instead of throwing
    return [];
  }
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
          email: true,
          clientRating: true
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
        createdAt: taskWithRelations.createdAt,
        updatedAt: taskWithRelations.updatedAt,
        isArchived: taskWithRelations.isArchived,
        archivedAt: taskWithRelations.archivedAt,
        author: taskWithRelations.createdBy ? {
          id: taskWithRelations.createdBy.id,
          name: taskWithRelations.createdBy.name,
          email: taskWithRelations.createdBy.email,
          clientRating: taskWithRelations.createdBy.clientRating !== null && taskWithRelations.createdBy.clientRating !== undefined
            ? Number(taskWithRelations.createdBy.clientRating)
            : null
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
    // Get count of open tasks with error handling
    let openTasksCount = 0;
    try {
      openTasksCount = await prisma.task.count({
        where: {
          assignments: {
            some: {
              status: {
                name: 'OPEN'
              }
            }
          }
        }
      });
    } catch (countError) {
      console.error('Error counting open tasks:', countError);
      // Continue with zero count if this query fails
    }

    // Get weekly task creation data for the last 8 weeks
    const now = new Date();
    const eightWeeksAgo = new Date(now.getTime() - (8 * 7 * 24 * 60 * 60 * 1000));

    // Define a type for the weekly tasks data
    type WeeklyTaskItem = {
      createdAt: Date;
      _count: {
        id: number;
      };
    };

    let weeklyTasks: Array<{createdAt: Date, _count: {id: number}}> = [];
    try {
      const result = await prisma.task.groupBy({
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
      
      weeklyTasks = result.map(item => ({
        createdAt: new Date(item.createdAt),
        _count: {
          id: item._count.id
        }
      }));
    } catch (groupError) {
      console.error('Error getting weekly task data:', groupError);
      // Continue with empty array if this query fails
    }

    // Process weekly data
    const weeklyData = Array.from({ length: 8 }, (_, i) => {
      const weekStart = new Date(now.getTime() - ((7 - i) * 7 * 24 * 60 * 60 * 1000));
      const weekEnd = new Date(weekStart.getTime() + (7 * 24 * 60 * 60 * 1000));
      
      const tasksInWeek = weeklyTasks.filter(task => {
        try {
          const taskDate = new Date(task.createdAt);
          return taskDate >= weekStart && taskDate < weekEnd;
        } catch (error) {
          return false;
        }
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
    // Return default values instead of throwing
    return {
      openTasksCount: 0,
      weeklyData: Array.from({ length: 8 }, (_, i) => ({
        week: `Week ${i + 1}`,
        totalTasks: 0
      }))
    };
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
 *   // Handle success
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

    // Send notifications to any contractors who have conversations about this task
    try {
      // Import the notification function dynamically to avoid circular dependencies
      const { sendTaskArchivedNotifications } = await import('./messages.actions');
      
      // Send notifications about the archived task
      await sendTaskArchivedNotifications(taskId);
    } catch (error) {
      console.error('Failed to send task archived notifications:', error);
      // Don't throw here, just log - we still want to archive the task even if notifications fail
    }

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
