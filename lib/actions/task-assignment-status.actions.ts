'use server';

/**
 * Task assignment status management functions
 * @module TaskAssignmentStatusActions
 * @group API
 */

import { prisma } from '@/db/prisma';

/**
 * Get all task assignment statuses ordered by their defined sequence
 */
export async function getAllTaskAssignmentStatuses() {
  try {
    const statuses = await prisma.taskAssignmentStatus.findMany({
      orderBy: { order: 'asc' }
    });
    return statuses;
  } catch (error) {
    throw error;
  }
}

/**
 * Get a task assignment status by its name
 */
export async function getTaskAssignmentStatusByName(name: string) {
  try {
    const status = await prisma.taskAssignmentStatus.findFirst({
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
