'use server';

/**
 * Task assignment status management functions
 * @module TaskAssignmentStatusActions
 * @group API
 * 
 * This module provides server-side functions for managing task assignment statuses:
 * - Retrieving all available statuses
 * - Finding statuses by name
 * - Updating task assignment statuses
 */

import { prisma } from '@/db/prisma';
import { revalidatePath } from 'next/cache';
import { serializeData } from '@/lib/actions/task-assignment.actions';

/**
 * Retrieves all task assignment statuses ordered by their defined sequence
 * 
 * @returns Array of task assignment statuses
 * 
 * @example
 * // In a status selection component
 * const StatusSelect = async () => {
 *   const statuses = await getAllTaskAssignmentStatuses();
 *   
 *   return (
 *     <select>
 *       {statuses.map(status => (
 *         <option key={status.id} value={status.name}>
 *           {status.name}
 *         </option>
 *       ))}
 *     </select>
 *   );
 * };
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
 * Retrieves a task assignment status by its name
 * 
 * @param name - The name of the status to find (case-insensitive)
 * @returns The task assignment status object
 * @throws Error if status is not found
 * 
 * @example
 * // In a status validation function
 * const validateStatus = async (statusName: string) => {
 *   try {
 *     const status = await getTaskAssignmentStatusByName(statusName);
 *     return status;
 *   } catch (error) {
 *     console.error('Invalid status:', error);
 *     return null;
 *   }
 * };
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
 * Updates a task assignment's status
 * 
 * @param id - The unique identifier of the task assignment
 * @param statusName - The name of the new status (e.g., 'completed')
 * @returns The updated task assignment with its new status
 * @throws Error if status is not found or update fails
 * 
 * @example
 * // In a task assignment component
 * const TaskAssignment = ({ assignment }) => {
 *   const handleStatusChange = async (newStatus: string) => {
 *     try {
 *       const updated = await updateTaskAssignmentStatus(
 *         assignment.id,
 *         newStatus
 *       );
 *       // Update UI with new status
 *     } catch (error) {
 *       // Handle error
 *     }
 *   };
 *   
 *   return (
 *     <div>
 *       <h3>{assignment.task.name}</h3>
 *       <StatusSelect
 *         currentStatus={assignment.status.name}
 *         onChange={handleStatusChange}
 *       />
 *     </div>
 *   );
 * };
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
