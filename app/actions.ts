'use server'

import { prisma } from "@/db/prisma";

export async function getCompletedTaskStatus() {
  try {
    const status = await prisma.taskStatus.findFirst({
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
