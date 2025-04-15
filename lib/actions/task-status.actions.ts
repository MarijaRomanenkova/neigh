'use server';

/**
 * Task status management functions
 * @module TaskStatusActions
 * @group API
 */

import { prisma } from '@/db/prisma';

/**
 * Get all task statuses ordered by their defined sequence
 */
export async function getAllTaskStatuses() {
  try {
    const statuses = await prisma.taskStatus.findMany({
      orderBy: { order: 'asc' }
    });
    return statuses;
  } catch (error) {
    throw error;
  }
}

/**
 * Get a task status by its name
 */
export async function getTaskStatusByName(name: string) {
  try {
    const status = await prisma.taskStatus.findFirst({
      where: { 
        name: name.toUpperCase() 
      }
    });
    
    if (!status) {
      throw new Error(`Status "${name}" not found`);
    }
    
    return status;
  } catch (error) {
    throw error;
  }
} 
