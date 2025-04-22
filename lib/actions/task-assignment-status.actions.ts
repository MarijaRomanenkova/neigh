'use server';

/**
 * Task assignment status management functions
 * @module TaskAssignmentStatusActions
 * @group API
 */

import { prisma } from '@/db/prisma';
import { revalidatePath } from 'next/cache';
import { serializeData } from '@/lib/actions/task-assignment.actions';

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

/**
 * Update a task assignment's status
 * @param id - The unique identifier of the task assignment
 * @param statusName - The name of the new status (e.g., 'completed')
 * @returns The updated task assignment
 */
export async function updateTaskAssignmentStatus(id: string, statusName: string) {
  try {
    // Find the status by name
    const status = await getTaskAssignmentStatusByName(statusName);
    
    if (!status) {
      throw new Error(`Status "${statusName}" not found`);
    }
    
    // Update the task assignment with the new status
    const updatedAssignment = await prisma.taskAssignment.update({
      where: { id },
      data: {
        statusId: status.id,
        // If status is completed, set completedAt to now
        ...(statusName.toLowerCase() === 'completed' && { completedAt: new Date() })
      },
      include: {
        status: true
      }
    });
    
    // Revalidate relevant paths to reflect the changes
    revalidatePath('/dashboard');
    revalidatePath(`/task-assignments/${id}`);
    
    // Serialize data to handle Decimal values
    return await serializeData(updatedAssignment);
  } catch (error) {
    console.error('Error updating task assignment status:', error);
    throw error;
  }
} 
