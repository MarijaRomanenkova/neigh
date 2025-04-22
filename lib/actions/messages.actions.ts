'use server';

/**
 * Message and notification functions for system-generated messages
 * @module MessageActions
 * @group API
 */

import { prisma } from '@/db/prisma';
import { convertToPlainObject } from '@/lib/utils';

/**
 * Create a system message in a conversation related to a task assignment
 * Used for automated notifications about status changes and invoices
 * 
 * @param taskAssignmentId - ID of the task assignment
 * @param message - Content of the message
 * @param eventType - Type of event (e.g., 'status-update', 'invoice-created')
 * @returns The created message or null if creation fails
 */
export async function createTaskAssignmentNotification(
  taskAssignmentId: string,
  message: string,
  eventType: 'status-update' | 'invoice-created'
) {
  try {
    // Get task assignment to find the client and contractor
    const taskAssignment = await prisma.taskAssignment.findUnique({
      where: { 
        id: taskAssignmentId 
      },
      include: {
        task: {
          select: {
            id: true,
            name: true
          }
        },
        client: {
          select: {
            id: true
          }
        },
        contractor: {
          select: {
            id: true
          }
        }
      }
    });

    if (!taskAssignment) {
      console.error(`Task assignment not found: ${taskAssignmentId}`);
      return null;
    }

    // Find the conversation between the client and contractor about this task
    const conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { taskId: taskAssignment.task.id },
          {
            participants: {
              some: {
                userId: taskAssignment.clientId
              }
            }
          },
          {
            participants: {
              some: {
                userId: taskAssignment.contractorId
              }
            }
          }
        ]
      }
    });

    if (!conversation) {
      console.error(`No conversation found for task assignment: ${taskAssignmentId}`);
      return null;
    }

    // Create the system message - use try/catch to handle schema compatibility issues
    let systemMessage;
    try {
      // Try with full system message properties
      systemMessage = await prisma.message.create({
        data: {
          content: message,
          conversationId: conversation.id,
          senderId: taskAssignment.contractorId, // Use contractor as sender for these notifications
          isSystemMessage: true,
          metadata: {
            eventType,
            taskAssignmentId,
            taskName: taskAssignment.task.name
          }
        }
      });
    } catch (err) {
      console.log("Could not create system message with metadata, falling back to standard message", err);
      // Fall back to standard message if the schema doesn't support system messages yet
      systemMessage = await prisma.message.create({
        data: {
          content: `[SYSTEM] ${message}`,
          conversationId: conversation.id,
          senderId: taskAssignment.contractorId
        }
      });
    }

    // Update conversation's last activity timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() }
    });

    return convertToPlainObject(systemMessage);
  } catch (error) {
    console.error("Error creating task assignment notification:", error);
    return null;
  }
}

/**
 * Send a notification to all conversations about a task when it's archived
 * Informs contractors that the task is no longer available
 * 
 * @param taskId - The ID of the archived task
 * @returns Array of created messages or empty array if none created
 */
export async function sendTaskArchivedNotifications(taskId: string) {
  try {
    // Get task details
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        name: true,
        createdById: true
      }
    });

    if (!task) {
      console.error(`Task not found: ${taskId}`);
      return [];
    }

    // Find all conversations about this task
    const conversations = await prisma.conversation.findMany({
      where: {
        taskId: taskId
      },
      include: {
        participants: {
          select: {
            userId: true
          }
        }
      }
    });

    if (!conversations || conversations.length === 0) {
      console.log(`No conversations found for task: ${taskId}`);
      return [];
    }

    const messages = [];

    // Find all task assignments for this task
    const taskAssignments = await prisma.taskAssignment.findMany({
      where: {
        taskId: taskId
      },
      select: {
        contractorId: true
      }
    });

    // Get array of contractor IDs who have been assigned to this task
    const assignedContractorIds = taskAssignments.map(ta => ta.contractorId);

    // Process each conversation and send notifications
    for (const conversation of conversations) {
      // Get all contractor participants (those who are not the task creator/client)
      const contractorParticipants = conversation.participants
        .filter(participant => participant.userId !== task.createdById);

      // For each contractor, check if they have been assigned to the task
      for (const participant of contractorParticipants) {
        const isAssigned = assignedContractorIds.includes(participant.userId);

        // If contractor is not assigned, send notification
        if (!isAssigned) {
          // Create the system message
          try {
            const message = await prisma.message.create({
              data: {
                content: `This task is no longer available: "${task.name}"`,
                conversationId: conversation.id,
                senderId: task.createdById, // Use task creator (client) as sender
                isSystemMessage: true,
                metadata: {
                  eventType: 'task-archived',
                  taskId: task.id,
                  taskName: task.name
                }
              }
            });

            messages.push(convertToPlainObject(message));
          } catch (err) {
            console.log("Could not create system message with metadata, falling back to standard message", err);
            
            // Fall back to standard message if the schema doesn't support system messages
            const message = await prisma.message.create({
              data: {
                content: `[SYSTEM] This task is no longer available: "${task.name}"`,
                conversationId: conversation.id,
                senderId: task.createdById
              }
            });

            messages.push(convertToPlainObject(message));
          }

          // Update conversation's last activity timestamp
          await prisma.conversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() }
          });
        }
      }
    }

    return messages;
  } catch (error) {
    console.error("Error sending task archived notifications:", error);
    return [];
  }
} 
