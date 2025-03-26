'use server'; 
import { prisma } from '@/db/prisma';
import { convertToPlainObject, formatError } from '../utils';
import { PAGE_SIZE } from '../constants';
import { revalidatePath } from 'next/cache';
import { insertTaskSchema, updateTaskSchema } from '../validators';
import { z } from 'zod';
import { Prisma, Task } from '@prisma/client';

type GetAllTasksParams = {
  query?: string;
  category?: string;
  price?: string;
  sort?: 'newest' | 'lowest' | 'highest';
  page?: number;
};

// get latest tasks
export async function getLatestTasks() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
      take: 12,
      include: {
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return tasks.map(task => ({
      ...task,
      price: Number(task.price),
      rating: '0',
      author: task.createdBy ? {
        name: task.createdBy.name,
        email: task.createdBy.email
      } : undefined
    }));
  } catch (error) {
    console.error('Error getting latest tasks:', error);
    throw error;
  }
}

export async function getTaskBySlug(slug: string) {
  return await prisma.task.findFirst({
    where: { slug: slug },
  });
}

// Get single task by it's ID
export async function getTaskById(taskId: string) {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(taskId)) {
      console.error('Invalid UUID format:', taskId);
      return null;
    }
    
    const data = await prisma.task.findFirst({
      where: { id: taskId },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    const plainObject = convertToPlainObject(data);
    
    if (plainObject && plainObject.createdBy) {
      return {
        ...plainObject,
        author: {
          name: plainObject.createdBy.name,
          email: plainObject.createdBy.email
        }
      };
    }
    
    return plainObject;
  } catch (error) {
    console.error('Error fetching task by ID:', error);
    return null;
  }
}

// Get all tasks
export async function getAllTasks({
  query = 'all',
  category = 'all',
  price = 'all',
  sort = 'newest',
  page = 1,
}: GetAllTasksParams) {
  try {
    const conditions: Prisma.TaskWhereInput = {};
    
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
        category: {
          select: {
            name: true
          }
        },
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return {
      data: tasks.map(task => ({
        ...task,
        price: Number(task.price),
        author: task.createdBy ? {
          name: task.createdBy.name,
          email: task.createdBy.email
        } : undefined
      })),
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

// Delete a task
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

// Create a task
export async function createTask(data: z.infer<typeof insertTaskSchema> & { userId: string }) {
  console.log('createTask called with userId:', data.userId);
  
  try {
    const task = insertTaskSchema.parse(data);
    const openStatus = await prisma.taskStatus.findFirst({
      where: { name: 'OPEN' }
    });
    
    const createdTask = await prisma.task.create({ 
      data: {
        name: task.name,
        slug: task.slug,
        categoryId: task.categoryId,
        images: task.images,
        description: task.description,
        price: new Prisma.Decimal(task.price || 0),
        statusId: openStatus!.id,
        createdById: data.userId
      } 
    });
    
    console.log('Task created with createdById:', createdTask.createdById);
    
    revalidatePath('/');
    revalidatePath('/user/dashboard/client/tasks');
    return { success: true, message: 'Task created successfully' };
  } catch (error) {
    console.error('Error in createTask:', error);
    return { success: false, message: formatError(error) };
  }
}

// Update a task
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
      category: true
    }
  });
  
  return {
    data: tasks,
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

    console.log('Task ownership check:', {
      taskId,
      currentUserId: userId,
      taskCreatorId: task?.createdById
    });

    return task?.createdById === userId;
  } catch (error) {
    console.error('Error checking task ownership:', error);
    return false;
  }
};
