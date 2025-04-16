'use server'

import { prisma } from "@/db/prisma";

export async function getCompletedTaskAssignmentStatus() {
  try {
    const status = await prisma.taskAssignmentStatus.findFirst({
      where: { 
        name: 'COMPLETED'
      }
    });
    
    if (!status) {
      throw new Error('Completed status not found');
    }
    
    return status;
  } catch (error) {
    console.error('Error fetching completed status:', error);
    throw error;
  }
} 
