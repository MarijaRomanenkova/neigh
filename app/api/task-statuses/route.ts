/**
 * Task Statuses API Route
 * @module API
 * @group Tasks
 * 
 * This API endpoint handles retrieving task status information.
 * It allows fetching all available statuses or a specific status by name.
 * Task statuses represent the current state of a task (e.g., "PENDING", "IN_PROGRESS", "COMPLETED").
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { auth } from '@/auth';

/**
 * GET handler for task statuses
 * 
 * Retrieves all task statuses or a specific status by name.
 * Statuses are returned in order of their defined sequence.
 * 
 * Security:
 * - Requires authentication
 * 
 * @param {Request} req - The incoming request
 * @returns {Promise<NextResponse>} JSON response with status data or error details
 * @example
 * // Request: GET /api/task-statuses
 * // Response: [{ id: "1", name: "PENDING", order: 1 }, ...]
 * 
 * // Request: GET /api/task-statuses?name=in_progress
 * // Response: { id: "2", name: "IN_PROGRESS", order: 2 }
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');

    if (name) {
      // Get specific status by name
      const status = await prisma.taskStatus.findFirst({
        where: { 
          name: name.toUpperCase() 
        }
      });

      if (!status) {
        return NextResponse.json(
          { error: `Status "${name}" not found` }, 
          { status: 404 }
        );
      }

      return NextResponse.json(status);
    } else {
      // Get all statuses
      const statuses = await prisma.taskStatus.findMany({
        orderBy: { order: 'asc' }
      });
      
      return NextResponse.json(statuses);
    }
  } catch (error) {
    console.error('Error fetching task statuses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task statuses' },
      { status: 500 }
    );
  }
} 
