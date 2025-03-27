/**
 * Task Assignment API Route
 * @module API
 * @group Tasks
 * 
 * This API endpoint handles the assignment of tasks to contractors by clients.
 * It creates task assignment records in the database and updates task statuses.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { auth } from '@/auth';
import { insertTaskAssignmentSchema } from '@/lib/validators';

/**
 * POST handler for task assignment
 * 
 * Creates a new task assignment linking a task to a contractor.
 * Updates the task status to reflect the assignment.
 * 
 * Security:
 * - Requires authentication
 * - Validates that the user is the owner of the task
 * - Prevents duplicate assignments to the same contractor
 * 
 * @param {Request} req - The incoming request
 * @returns {Promise<NextResponse>} JSON response with assignment data or error details
 * @example
 * // Request body format
 * // { "taskId": "123", "clientId": "456", "contractorId": "789", "statusId": "in_progress" }
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // Validate request data
    const validationResult = insertTaskAssignmentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { taskId, clientId, contractorId, statusId } = validationResult.data;
    
    // Verify the current user is the client
    if (session.user.id !== clientId) {
      return NextResponse.json(
        { error: 'You can only assign your own tasks' },
        { status: 403 }
      );
    }
    
    // Check if the task exists and is owned by the client
    const task = await prisma.task.findFirst({
      where: { 
        id: taskId,
        createdById: clientId
      }
    });
    
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found or you do not own this task' },
        { status: 404 }
      );
    }
    
    // Check if task is already assigned to this specific contractor
    const existingAssignment = await prisma.taskAssignment.findFirst({
      where: { 
        taskId,
        contractorId
      }
    });
    
    if (existingAssignment) {
      return NextResponse.json(
        { error: 'This task is already assigned to this contractor' },
        { status: 400 }
      );
    }
    
    // Create task assignment
    const assignment = await prisma.taskAssignment.create({
      data: {
        taskId,
        clientId,
        contractorId,
        statusId
      },
      include: {
        status: true,
        task: {
          select: {
            name: true
          }
        }
      }
    });
    
    // Update task status if not already in progress
    await prisma.task.update({
      where: { id: taskId },
      data: { statusId }
    });
    
    return NextResponse.json({
      message: 'Task assigned successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Error assigning task:', error);
    
    return NextResponse.json(
      { error: 'Failed to assign task', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
