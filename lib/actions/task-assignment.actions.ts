'use server';

/**
 * Task assignment management functions for creating, retrieving, updating and deleting task assignments
 * @module TaskAssignmentActions
 * @group API
 * 
 * This module provides server-side functions for managing task assignments, including:
 * - Creating and updating task assignments
 * - Managing task assignment statuses
 * - Handling client and contractor reviews
 * - Processing task completion and acceptance
 * - Managing invoice relationships
 * - Calculating and updating user ratings
 */

import { prisma } from '@/db/prisma';
import { convertToPlainObject } from '@/lib/utils';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { insertTaskAssignmentSchema } from '@/lib/validators';
import { z } from 'zod';
import { auth } from '@/auth';

/**
 * Type guard to check if an object is a Prisma Decimal
 * 
 * @param value - The value to check
 * @returns True if the value is a Prisma Decimal object
 */
function isDecimal(value: unknown): value is { toString(): string } {
  return (
    typeof value === 'object' && 
    value !== null && 
    'constructor' in value && 
    value.constructor !== null &&
    typeof value.constructor === 'function' &&
    value.constructor.name === 'Decimal' &&
    typeof (value as { toString?: () => string }).toString === 'function'
  );
}

/**
 * Helper function to serialize data and convert Decimal objects to regular numbers
 * 
 * @param data - The data to serialize
 * @returns The serialized data with Decimal values converted to numbers
 * 
 * @example
 * // Convert Prisma data with Decimal values to plain objects
 * const taskData = await prisma.task.findUnique({
 *   where: { id: taskId }
 * });
 * const serializedData = await serializeData(taskData);
 */
export async function serializeData(data: unknown): Promise<unknown> {
  if (data === null || data === undefined) {
    return data;
  }
  
  // Check if it's a Prisma Decimal type
  if (isDecimal(data)) {
    return parseFloat(data.toString());
  }
  
  // If it's an array, process each item
  if (Array.isArray(data)) {
    return await Promise.all((data as unknown[]).map((item: unknown) => serializeData(item)));
  }
  
  // If it's an object, process each property
  if (typeof data === 'object' && data !== null) {
    const result: Record<string, unknown> = {};
    const obj = data as Record<string, unknown>;
    
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = await serializeData(obj[key]);
      }
    }
    return result;
  }
  
  // For primitive types, return as is
  return data;
}

/**
 * Type definition for task assignments with detailed contractor view information
 * Includes task details, client information, status, and invoice data
 * 
 * @typedef {Object} TaskAssignmentWithContractorDetails
 * @property {Object} task - Task details including name, price, and category
 * @property {Object} client - Client information including name and email
 * @property {Object} status - Assignment status with name and color
 * @property {Array} invoiceItems - Related invoice items with payment status
 */
type TaskAssignmentWithContractorDetails = Prisma.TaskAssignmentGetPayload<{
  include: {
    task: {
      select: {
        id: true;
        name: true;
        price: true;
        description: true;
        category: {
          select: {
            name: true;
          };
        };
      };
    };
    client: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    status: {
      select: {
        name: true;
        color: true;
      };
    };
    invoiceItems: {
      include: {
        invoice: {
          select: {
            id: true;
            invoiceNumber: true;
            paymentId: true;
            payment: {
              select: {
                isPaid: true;
              };
            };
          };
        };
      };
    };
  };
}>;

/**
 * Paginated list of task assignments for contractor view
 * 
 * @typedef {Object} TaskAssignmentContractorList
 * @property {Array<TaskAssignmentWithContractorDetails>} data - Array of task assignments
 * @property {number} totalPages - Total number of pages
 */
type TaskAssignmentContractorList = {
  /** Array of task assignments with detailed information */
  data: TaskAssignmentWithContractorDetails[];
  /** Total number of pages */
  totalPages: number;
};

/**
 * Type definition for task assignments with client view information
 * Includes minimal task details, contractor name, and status
 * 
 * @typedef {Object} TaskAssignmentWithClientDetails
 * @property {Object} task - Task details including name and price
 * @property {Object} contractor - Contractor's basic information
 * @property {Object} status - Assignment status with name and color
 */
type TaskAssignmentWithClientDetails = Prisma.TaskAssignmentGetPayload<{
  include: {
    task: {
      select: {
        id: true;
        name: true;
        price: true;
        description: true;
        category: {
          select: {
            name: true;
          };
        };
      };
    };
    contractor: {
      select: {
        id: true;
        name: true;
      };
    };
    status: {
      select: {
        name: true;
        color: true;
      };
    };
  };
}>;

/**
 * Paginated list of task assignments for client view
 * 
 * @typedef {Object} TaskAssignmentClientList
 * @property {Array<TaskAssignmentWithClientDetails>} data - Array of task assignments
 * @property {number} totalPages - Total number of pages
 */
type TaskAssignmentClientList = {
  /** Array of task assignments with client-focused information */
  data: TaskAssignmentWithClientDetails[];
  /** Total number of pages */
  totalPages: number;
};

/**
 * Retrieves all task assignments for a specific contractor
 * 
 * @param contractorId - The unique identifier of the contractor
 * @returns Paginated list of task assignments with details relevant to contractors
 * 
 * @example
 * // In a contractor dashboard component
 * const { data: assignments, totalPages } = await getAllTaskAssignmentsByContractorId(user.id);
 * return (
 *   <div>
 *     {assignments.map(assignment => (
 *       <AssignmentCard 
 *         key={assignment.id}
 *         taskName={assignment.task.name}
 *         clientName={assignment.client.name}
 *         status={assignment.status.name}
 *         price={assignment.task.price}
 *       />
 *     ))}
 *   </div>
 * );
 */
export async function getAllTaskAssignmentsByContractorId(
  contractorId: string
): Promise<TaskAssignmentContractorList> {
  const assignments = await prisma.taskAssignment.findMany({
    where: { contractorId },
    include: {
      task: {
        select: {
          id: true,
          name: true,
          price: true,
          description: true,
          category: {
            select: {
              name: true
            }
          }
        }
      },
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          clientRating: true
        }
      },
      status: {
        select: {
          name: true,
          color: true
        }
      },
      invoiceItems: {
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              paymentId: true,
              payment: {
                select: {
                  isPaid: true
                }
              }
            }
          }
        }
      },
      reviews: {
        select: {
          rating: true,
          description: true,
          reviewerId: true,
          reviewType: {
            select: {
              name: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Enhance the data with review flags
  const enhancedAssignments = assignments.map(assignment => {
    const clientReview = assignment.reviews?.find(
      review => review.reviewType.name === 'Client Review'
    );
    
    const contractorReview = assignment.reviews?.find(
      review => review.reviewType.name === 'Contractor Review' && 
      review.reviewerId === contractorId
    );
    
    return {
      ...assignment,
      wasReviewed: !!clientReview,
      wasClientReviewed: !!contractorReview
    };
  });

  const plainData = convertToPlainObject(enhancedAssignments);

  return {
    data: plainData,
    totalPages: Math.ceil(assignments.length / 10)
  };
}

/**
 * Retrieves all task assignments for a specific client
 * 
 * @param clientId - The unique identifier of the client
 * @returns Paginated list of task assignments with details relevant to clients
 * 
 * @example
 * // In a client dashboard component
 * const { data: assignments } = await getAllTaskAssignmentsByClientId(user.id);
 * return (
 *   <div>
 *     {assignments.map(assignment => (
 *       <TaskCard 
 *         key={assignment.id}
 *         taskName={assignment.task.name}
 *         contractorName={assignment.contractor.name}
 *         status={assignment.status.name}
 *       />
 *     ))}
 *   </div>
 * );
 */
export async function getAllTaskAssignmentsByClientId(
  clientId: string
): Promise<TaskAssignmentClientList> {
  const assignments = await prisma.taskAssignment.findMany({
    where: { clientId },
    include: {
      task: {
        select: {
          id: true,
          name: true,
          price: true,
          description: true,
          category: {
            select: {
              name: true
            }
          }
        }
      },
      contractor: {
        select: {
          id: true,
          name: true
        }
      },
      status: {
        select: {
          name: true,
          color: true
        }
      },
      reviews: {
        select: {
          rating: true,
          description: true,
          reviewerId: true,
          reviewType: {
            select: {
              name: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Enhance the data with review flags
  const enhancedAssignments = assignments.map(assignment => {
    const clientReview = assignment.reviews?.find(
      review => review.reviewType.name === 'Client Review' && 
      review.reviewerId === clientId
    );
    
    const contractorReview = assignment.reviews?.find(
      review => review.reviewType.name === 'Contractor Review'
    );
    
    return {
      ...assignment,
      wasReviewed: !!clientReview,
      wasClientReviewed: !!contractorReview
    };
  });

  // Serialize the data to convert Decimal types to regular numbers
  const serializedData = await serializeData(enhancedAssignments) as TaskAssignmentWithClientDetails[];

  return {
    data: serializedData,
    totalPages: Math.ceil(assignments.length / 10)
  };
}

/**
 * Retrieves a single task assignment by its ID with comprehensive details
 * 
 * @param id - The unique identifier of the task assignment
 * @returns Object containing success status, message, and task assignment data if found
 * 
 * @example
 * // In a task assignment detail component
 * const { success, data, message } = await getTaskAssignmentById('assignment-123');
 * 
 * if (success) {
 *   return (
 *     <div>
 *       <h1>{data.task.name}</h1>
 *       <p>Client: {data.client.name}</p>
 *       <p>Contractor: {data.contractor.name}</p>
 *       <StatusBadge status={data.status.name} color={data.status.color} />
 *     </div>
 *   );
 * } else {
 *   return <ErrorMessage message={message} />;
 * }
 */
export async function getTaskAssignmentById(id: string) {
  try {
    // First fetch the task assignment with basic information
    const assignment = await prisma.taskAssignment.findUnique({
      where: { id },
      include: {
        task: {
          select: {
            id: true,
            name: true,
            price: true,
            description: true,
            images: true,
            category: {
              select: {
                name: true
              }
            }
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        contractor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        status: {
          select: {
            name: true,
            color: true
          }
        },
        invoiceItems: {
          include: {
            invoice: {
              select: {
                id: true,
                invoiceNumber: true,
                paymentId: true,
                payment: {
                  select: {
                    isPaid: true
                  }
                }
              }
            }
          }
        },
        // Include reviews related to this assignment
        reviews: {
          select: {
            rating: true,
            description: true,
            createdAt: true,
            reviewType: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    if (!assignment) {
      return {
        success: false,
        message: 'Task assignment not found'
      };
    }
    
    // Add wasReviewed flag and review data
    const clientReview = assignment.reviews?.find(
      (review: { reviewType: { name: string } }) => review.reviewType.name === 'Client Review'
    );
    
    // Find contractor review of client if exists
    const contractorReview = assignment.reviews?.find(
      (review: { reviewType: { name: string } }) => review.reviewType.name === 'Contractor Review'
    );
    
    // Format dates to ensure they're proper ISO strings
    const enhancedAssignment = {
      ...assignment,
      createdAt: assignment.createdAt.toISOString(),
      // No updatedAt in the response, so set it to the createdAt for consistency
      updatedAt: assignment.createdAt.toISOString(),
      wasReviewed: !!clientReview,
      reviewRating: clientReview?.rating || null,
      reviewFeedback: clientReview?.description || null,
      wasClientReviewed: !!contractorReview,
      clientReviewRating: contractorReview?.rating || null, 
      clientReviewFeedback: contractorReview?.description || null,
      contractorId: assignment.contractor?.id,
      clientId: assignment.client.id,
      reviews: assignment.reviews // Keep the reviews array for referencing in the UI
    };
    
    // Serialize the data to convert any Decimal types to regular numbers
    const serializedData = await serializeData(enhancedAssignment);

    return {
      success: true,
      data: serializedData
    };
  } catch (error) {
    console.error('Error fetching task assignment:', error);
    return {
      success: false,
      message: 'Failed to fetch task assignment'
    };
  }
}

/**
 * Creates a new task assignment
 * 
 * @param data - Task assignment data including task ID, contractor ID, client ID, and status ID
 * @returns Object containing success status, message, and the created assignment data
 * 
 * @example
 * // In a task assignment form component
 * async function handleSubmit(formData) {
 *   const assignmentData = {
 *     taskId: formData.taskId,
 *     contractorId: selectedContractor.id,
 *     clientId: currentUser.id,
 *     statusId: openStatusId
 *   };
 *   
 *   const { success, message, data } = await createTaskAssignment(assignmentData);
 *   
 *   if (success) {
 *     router.push(`/assignments/${data.id}`);
 *   } else {
 *     setError(message);
 *   }
 * }
 */
export async function createTaskAssignment(
  data: z.infer<typeof insertTaskAssignmentSchema>
) {
  try {
    // Get the IN_PROGRESS status ID
    const inProgressStatus = await prisma.taskAssignmentStatus.findFirst({
      where: { name: 'IN_PROGRESS' }
    });

    if (!inProgressStatus) {
      throw new Error('IN_PROGRESS status not found');
    }

    const assignment = await prisma.taskAssignment.create({
      data: {
        taskId: data.taskId,
        contractorId: data.contractorId,
        clientId: data.clientId,
        statusId: inProgressStatus.id
      },
      include: {
        contractor: {
          select: { name: true }
        },
        task: {
          select: { name: true }
        }
      }
    });

    // Create a notification in the messenger
    try {
      // Import the notification function dynamically to avoid circular dependencies
      const { createTaskAssignmentNotification } = await import('./messages.actions');
      
      // Create notification message
      await createTaskAssignmentNotification(
        assignment.id,
        `Task "${assignment.task.name}" is assigned to ${assignment.contractor.name}`,
        'status-update'
      );
    } catch (error) {
      console.error('Failed to send assignment notification message:', error);
      // Don't throw here, just log - we still want to create the assignment even if notification fails
    }

    revalidatePath('/user/dashboard/client/tasks');
    revalidatePath('/user/dashboard/messages');
    
    return {
      success: true,
      message: 'Task assigned successfully',
      data: assignment
    };
  } catch (error) {
    console.error('Error creating task assignment:', error);
    return {
      success: false,
      message: 'Failed to assign task'
    };
  }
}

/**
 * Updates a task assignment's status
 * 
 * @param id - The task assignment ID
 * @param statusId - The new status ID
 * @returns Result with success status and message
 * 
 * @example
 * // In a task status update component
 * const handleStatusChange = async (newStatusId) => {
 *   const result = await updateTaskAssignment(taskId, newStatusId);
 *   
 *   if (result.success) {
 *     showNotification('Success', result.message);
 *     refreshTaskStatus();
 *   } else {
 *     showError(result.message);
 *   }
 * };
 */
export async function updateTaskAssignment(id: string, statusId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Get status details to create appropriate message
    const status = await prisma.taskAssignmentStatus.findUnique({
      where: { id: statusId },
      select: { name: true }
    });

    if (!status) {
      throw new Error('Status not found');
    }

    const updatedAssignment = await prisma.taskAssignment.update({
      where: {
        id,
        contractorId: session.user.id, // Ensure only the assigned contractor can update
      },
      data: {
        statusId,
        completedAt: new Date(),
      },
      include: {
        contractor: {
          select: { name: true }
        },
        task: {
          select: { name: true }
        }
      }
    });

    // If marked as completed, send notification to client
    if (status.name === 'COMPLETED') {
      try {
        // Import the notification function dynamically to avoid circular dependencies
        const { createTaskAssignmentNotification } = await import('./messages.actions');
        
        // Create notification message
        await createTaskAssignmentNotification(
          id,
          `${updatedAssignment.contractor.name} has marked task "${updatedAssignment.task.name}" as completed. Please review and accept it.`,
          'status-update'
        );
      } catch (error) {
        console.error('Failed to send notification message:', error);
        // Don't throw here, just log - we still want to update the status even if notification fails
      }
    }

    revalidatePath('/user/dashboard/contractor/assignments');
    
    return {
      success: true,
      message: 'Task assignment updated successfully',
      data: updatedAssignment
    };
  } catch (error) {
    console.error('[TASK_ASSIGNMENT_UPDATE]', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to update task assignment' 
    };
  }
}

/**
 * Adds or updates a review from a client for a task assignment
 * 
 * @param id - The task assignment ID
 * @param rating - The rating (1-5)
 * @param feedback - Optional review feedback text
 * @returns Result with success status and message
 * 
 * @example
 * // In a task review form
 * const handleReviewSubmit = async (formData) => {
 *   const result = await markTaskAsReviewed(
 *     taskId,
 *     parseInt(formData.rating),
 *     formData.feedback
 *   );
 *   
 *   if (result.success) {
 *     showNotification('Success', 'Review submitted successfully');
 *     router.push('/dashboard/tasks');
 *   } else {
 *     showError(result.message);
 *   }
 * };
 */
export async function markTaskAsReviewed(id: string, rating: number, feedback?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Fetch the task assignment to verify the client is the one reviewing
    const taskAssignment = await prisma.taskAssignment.findUnique({
      where: { id },
      select: { 
        clientId: true,
        contractorId: true,
        task: {
          select: {
            id: true,
            name: true
          }
        },
        client: {
          select: {
            id: true,
            name: true
          }
        },
        reviews: {
          where: {
            reviewType: {
              name: 'Client Review'
            },
            reviewerId: session.user.id
          },
          select: {
            id: true
          }
        }
      }
    });

    if (!taskAssignment) {
      throw new Error('Task assignment not found');
    }

    if (taskAssignment.clientId !== session.user.id) {
      throw new Error('Only the client can review this task');
    }

    // Get the review type ID for client reviews
    let reviewType = await prisma.reviewType.findFirst({
      where: { name: 'Client Review' },
      select: { id: true }
    });

    // If review type doesn't exist, create it
    if (!reviewType) {
      reviewType = await prisma.reviewType.create({
        data: {
          name: 'Client Review',
          description: 'Review from a client to a contractor'
        },
        select: { id: true }
      });
    }

    // Check if a review already exists
    let review;
    let message = 'Review submitted successfully';
    
    if (taskAssignment.reviews.length > 0) {
      // Update existing review
      review = await prisma.review.update({
        where: { id: taskAssignment.reviews[0].id },
        data: {
          rating,
          description: feedback || 'No feedback provided'
        }
      });
      message = 'Review updated successfully';
    } else {
      // Create a new review
      review = await prisma.review.create({
        data: {
          assignmentId: id,
          reviewerId: session.user.id, // Client is the reviewer
          revieweeId: taskAssignment.contractorId, // Neighbor is being reviewed
          rating,
          title: 'Task Review',
          description: feedback || 'No feedback provided',
          typeId: reviewType.id
        }
      });
    }

    // Update contractor rating
    await updateContractorRating(taskAssignment.contractorId);
    
    // Send notification to contractor about the review
    try {
      // Import the notification function dynamically to avoid circular dependencies
      const { createTaskAssignmentNotification } = await import('./messages.actions');
      
      // Truncate feedback if it's too long (limit to 150 characters)
      const truncatedFeedback = feedback && feedback.length > 150 
        ? `${feedback.substring(0, 147)}...` 
        : feedback || 'No feedback provided';
      
      // Create stars representation
      const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
      
      // Create notification message with different text for new vs updated reviews
      const actionText = taskAssignment.reviews.length > 0 ? 'updated their review' : 'submitted a review';
      
      await createTaskAssignmentNotification(
        id,
        `${taskAssignment.client.name} has ${actionText} for task "${taskAssignment.task.name}". Rating: ${stars} (${rating}/5). Feedback: "${truncatedFeedback}"`,
        'review-submitted',
        {
          reviewRating: rating,
          reviewFeedback: truncatedFeedback
        }
      );
    } catch (error) {
      console.error('Failed to send review notification message:', error);
      // Don't throw here, just log - we still want to create the review even if notification fails
    }

    revalidatePath('/user/dashboard/client/task-assignments');
    
    return {
      success: true,
      message,
      data: review
    };
  } catch (error) {
    console.error('[TASK_ASSIGNMENT_REVIEW]', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to submit review' 
    };
  }
}

/**
 * Updates the average rating for a contractor based on their task reviews
 * 
 * @param contractorId - The ID of the contractor to update
 * @returns The updated average rating or null if no reviews exist
 * 
 * @example
 * // After submitting a contractor review
 * await updateContractorRating(taskAssignment.contractorId);
 */
async function updateContractorRating(contractorId: string) {
  // Calculate average rating
  const reviews = await prisma.review.findMany({
    where: { revieweeId: contractorId },
    select: { rating: true }
  });
  
  if (reviews.length === 0) return;
  
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;
  
  // Update the contractor's rating
  await prisma.user.update({
    where: { id: contractorId },
    data: {
      contractorRating: averageRating,
      numReviews: reviews.length
    }
  });
}

/**
 * Accepts a task assignment and marks it as completed
 * 
 * @param id - The task assignment ID
 * @returns Result with success status and message
 * 
 * @example
 * // In a task acceptance component
 * const handleAcceptTask = async () => {
 *   const result = await acceptTaskAssignment(taskId);
 *   
 *   if (result.success) {
 *     showNotification('Success', 'Task accepted successfully');
 *     refreshTaskStatus();
 *   } else {
 *     showError(result.message);
 *   }
 * };
 */
export async function acceptTaskAssignment(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // First get the task assignment to verify it's completed and the user is the client
    const taskAssignment = await prisma.taskAssignment.findUnique({
      where: { id },
      include: {
        status: true,
        task: {
          select: {
            name: true
          }
        },
        client: {
          select: {
            name: true
          }
        }
      }
    });

    if (!taskAssignment) {
      throw new Error('Task assignment not found');
    }

    if (taskAssignment.clientId !== session.user.id) {
      throw new Error('Only the client can accept this task');
    }

    if (taskAssignment.status.name !== 'COMPLETED') {
      throw new Error('Only completed tasks can be accepted');
    }

    // Get the ACCEPTED status ID
    let acceptedStatus = await prisma.taskAssignmentStatus.findFirst({
      where: { name: 'ACCEPTED' }
    });

    // If ACCEPTED status doesn't exist, throw an error
    if (!acceptedStatus) {
      throw new Error('ACCEPTED status not found in the database');
    }

    // Update the task assignment status
    const updatedAssignment = await prisma.taskAssignment.update({
      where: { id },
      data: {
        statusId: acceptedStatus.id,
      },
    });

    // Send notification to contractor about task acceptance
    try {
      // Import the notification function dynamically to avoid circular dependencies
      const { createTaskAssignmentNotification } = await import('./messages.actions');
      
      // Create notification message
      await createTaskAssignmentNotification(
        id,
        `${taskAssignment.client.name} has accepted the completed task "${taskAssignment.task.name}". The task is now marked as accepted.`,
        'status-update'
      );
    } catch (error) {
      console.error('Failed to send task acceptance notification message:', error);
      // Don't throw here, just log - we still want to update the status even if notification fails
    }

    revalidatePath('/user/dashboard/client/task-assignments');
    
    return {
      success: true,
      message: 'Task accepted successfully',
      data: await serializeData(updatedAssignment)
    };
  } catch (error) {
    console.error('[TASK_ASSIGNMENT_ACCEPT]', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to accept task' 
    };
  }
}

/**
 * Retrieves the invoice history for a task assignment
 * 
 * @param assignmentId - The task assignment ID
 * @returns Object containing invoiced status and array of related invoices
 * 
 * @example
 * // In a task invoice history component
 * const TaskInvoiceHistory = async ({ assignmentId }) => {
 *   const { invoiced, invoices } = await getTaskAssignmentInvoiceHistory(assignmentId);
 *   
 *   return (
 *     <div>
 *       <h3>Invoice History</h3>
 *       {invoiced ? (
 *         <ul>
 *           {invoices.map(invoice => (
 *             <li key={invoice.id}>
 *               Invoice #{invoice.invoiceNumber} - {formatDate(invoice.createdAt)}
 *             </li>
 *           ))}
 *         </ul>
 *       ) : (
 *         <p>No invoices found</p>
 *       )}
 *     </div>
 *   );
 * };
 */
export async function getTaskAssignmentInvoiceHistory(assignmentId: string): Promise<{
  invoiced: boolean;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    createdAt: Date;
  }>;
}> {
  try {
    const invoiceItems = await prisma.invoiceItem.findMany({
      where: {
        assignmentId: assignmentId,
      },
      select: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            createdAt: true,
          }
        }
      },
      orderBy: {
        invoice: {
          createdAt: 'desc'
        }
      }
    });

    if (invoiceItems.length === 0) {
      return { 
        invoiced: false,
        invoices: []
      };
    }

    // Create a map to track unique invoices by ID
    const uniqueInvoices = new Map();
    
    // Process each invoice item and only keep unique invoices
    invoiceItems.forEach(item => {
      if (!uniqueInvoices.has(item.invoice.id)) {
        uniqueInvoices.set(item.invoice.id, {
          id: item.invoice.id,
          invoiceNumber: item.invoice.invoiceNumber,
          createdAt: item.invoice.createdAt
        });
      }
    });

    return {
      invoiced: true,
      invoices: Array.from(uniqueInvoices.values())
    };
  } catch (error) {
    console.error('[GET_TASK_ASSIGNMENT_INVOICE_HISTORY]', error);
    return { 
      invoiced: false,
      invoices: []
    };
  }
}

/**
 * Checks if a task assignment has been invoiced
 * 
 * @param assignmentId - The task assignment ID
 * @returns Object containing invoiced status and invoice details if found
 * 
 * @example
 * // In a task action button component
 * const TaskActions = async ({ assignmentId }) => {
 *   const { invoiced, invoiceNumber } = await isTaskAssignmentInvoiced(assignmentId);
 *   
 *   return (
 *     <div>
 *       {invoiced ? (
 *         <p>Invoiced: #{invoiceNumber}</p>
 *       ) : (
 *         <button onClick={handleCreateInvoice}>Create Invoice</button>
 *       )}
 *     </div>
 *   );
 * };
 */
export async function isTaskAssignmentInvoiced(assignmentId: string): Promise<{
  invoiced: boolean;
  invoiceNumber?: string;
  invoiceId?: string;
}> {
  try {
    const invoiceHistory = await getTaskAssignmentInvoiceHistory(assignmentId);
    
    if (!invoiceHistory.invoiced || invoiceHistory.invoices.length === 0) {
      return { invoiced: false };
    }

    // Return the most recent invoice (should be the first one since we sort by descending date)
    const latestInvoice = invoiceHistory.invoices[0];
    return {
      invoiced: true,
      invoiceNumber: latestInvoice.invoiceNumber,
      invoiceId: latestInvoice.id
    };
  } catch (error) {
    console.error('[IS_TASK_ASSIGNMENT_INVOICED]', error);
    return { invoiced: false };
  }
}

/**
 * Retrieves a task assignment by invoice number
 * 
 * @param invoiceNumber - The invoice number to search for
 * @returns Object containing success status and task assignment ID if found
 * 
 * @example
 * // In an invoice detail component
 * const InvoiceDetails = async ({ invoiceNumber }) => {
 *   const { success, taskAssignmentId } = await getTaskAssignmentByInvoiceNumber(invoiceNumber);
 *   
 *   if (success && taskAssignmentId) {
 *     return <TaskAssignmentDetails id={taskAssignmentId} />;
 *   }
 *   
 *   return <p>No task assignment found for this invoice</p>;
 * };
 */
export async function getTaskAssignmentByInvoiceNumber(invoiceNumber: string): Promise<{
  success: boolean;
  taskAssignmentId?: string;
  message?: string;
}> {
  try {
    // Find the invoice item linked to this invoice number
    const invoiceItem = await prisma.invoiceItem.findFirst({
      where: {
        invoice: {
          invoiceNumber: invoiceNumber
        }
      },
      select: {
        assignmentId: true
      }
    });

    if (!invoiceItem) {
      return { 
        success: false,
        message: 'No task assignment found for this invoice'
      };
    }

    return {
      success: true,
      taskAssignmentId: invoiceItem.assignmentId
    };
  } catch (error) {
    console.error('[GET_TASK_ASSIGNMENT_BY_INVOICE_NUMBER]', error);
    return { 
      success: false,
      message: 'Error finding task assignment for invoice'
    };
  }
}

/**
 * Adds or updates a review from a contractor for a client
 * 
 * @param id - The task assignment ID
 * @param rating - The rating (1-5)
 * @param feedback - Optional review feedback text
 * @returns Result with success status and message
 * 
 * @example
 * // In a client review form
 * const handleClientReview = async (formData) => {
 *   const result = await markClientAsReviewed(
 *     taskId,
 *     parseInt(formData.rating),
 *     formData.feedback
 *   );
 *   
 *   if (result.success) {
 *     showNotification('Success', 'Client review submitted');
 *     router.push('/dashboard/clients');
 *   } else {
 *     showError(result.message);
 *   }
 * };
 */
export async function markClientAsReviewed(id: string, rating: number, feedback?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Fetch the task assignment to verify the contractor is the one reviewing
    const taskAssignment = await prisma.taskAssignment.findUnique({
      where: { id },
      select: { 
        clientId: true,
        contractorId: true,
        task: {
          select: {
            id: true,
            name: true
          }
        },
        client: {
          select: {
            id: true,
            name: true
          }
        },
        contractor: {
          select: {
            id: true,
            name: true
          }
        },
        reviews: {
          where: {
            reviewType: {
              name: 'Contractor Review'
            },
            reviewerId: session.user.id
          },
          select: {
            id: true
          }
        }
      }
    });

    if (!taskAssignment) {
      throw new Error('Task assignment not found');
    }

    if (taskAssignment.contractorId !== session.user.id) {
      throw new Error('Only the contractor can review this client');
    }

    // Get the review type ID for contractor reviews
    let reviewType = await prisma.reviewType.findFirst({
      where: { name: 'Contractor Review' },
      select: { id: true }
    });

    // If review type doesn't exist, create it
    if (!reviewType) {
      reviewType = await prisma.reviewType.create({
        data: {
          name: 'Contractor Review',
          description: 'Review from a contractor to a client'
        },
        select: { id: true }
      });
    }

    // Check if a review already exists
    let review;
    let message = 'Review submitted successfully';
    
    if (taskAssignment.reviews.length > 0) {
      // Update existing review
      review = await prisma.review.update({
        where: { id: taskAssignment.reviews[0].id },
        data: {
          rating,
          description: feedback || 'No feedback provided'
        }
      });
      message = 'Review updated successfully';
    } else {
      // Create a new review
      review = await prisma.review.create({
        data: {
          assignmentId: id,
          reviewerId: session.user.id, // Contractor is the reviewer
          revieweeId: taskAssignment.clientId, // Client is being reviewed
          rating,
          title: 'Client Review',
          description: feedback || 'No feedback provided',
          typeId: reviewType.id
        }
      });
    }

    // Update client rating
    await updateClientRating(taskAssignment.clientId);
    
    // Send notification to client about the review
    try {
      // Import the notification function dynamically to avoid circular dependencies
      const { createTaskAssignmentNotification } = await import('./messages.actions');
      
      // Truncate feedback if it's too long (limit to 150 characters)
      const truncatedFeedback = feedback && feedback.length > 150 
        ? `${feedback.substring(0, 147)}...` 
        : feedback || 'No feedback provided';
      
      // Create stars representation
      const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
      
      // Create notification message with different text for new vs updated reviews
      const actionText = taskAssignment.reviews.length > 0 ? 'updated their review' : 'submitted a review';
      
      await createTaskAssignmentNotification(
        id,
        `${taskAssignment.contractor.name} has ${actionText} for you on task "${taskAssignment.task.name}". Rating: ${stars} (${rating}/5). Feedback: "${truncatedFeedback}"`,
        'review-submitted',
        {
          reviewRating: rating,
          reviewFeedback: truncatedFeedback
        }
      );
    } catch (error) {
      console.error('Failed to send review notification message:', error);
      // Don't throw here, just log - we still want to create the review even if notification fails
    }

    revalidatePath('/user/dashboard/contractor/assignments');
    
    return {
      success: true,
      message,
      data: review
    };
  } catch (error) {
    console.error('[CLIENT_REVIEW]', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to submit review' 
    };
  }
}

/**
 * Updates the average rating for a client based on their task reviews
 * 
 * @param clientId - The ID of the client to update
 * @returns The updated average rating or null if no reviews exist
 * 
 * @example
 * // After submitting a client review
 * await updateClientRating(taskAssignment.clientId);
 */
async function updateClientRating(clientId: string) {
  // Calculate average rating
  const reviews = await prisma.review.findMany({
    where: { 
      revieweeId: clientId,
      reviewType: {
        name: 'Contractor Review'
      }
    },
    select: { rating: true }
  });
  
  if (reviews.length === 0) return;
  
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;
  
  // Update the client's rating
  await prisma.user.update({
    where: { id: clientId },
    data: {
      clientRating: averageRating,
      numReviews: reviews.length
    }
  });
}

/**
 * Retrieves the client's review of a task assignment
 * 
 * @param id - The task assignment ID
 * @returns Object containing success status and review details if found
 * 
 * @example
 * // In a task review display component
 * const TaskReview = async ({ taskId }) => {
 *   const { success, review } = await getClientReviewOfTask(taskId);
 *   
 *   if (success && review) {
 *     return (
 *       <div>
 *         <h3>Client Review</h3>
 *         <Rating value={review.rating} readOnly />
 *         <p>{review.feedback}</p>
 *       </div>
 *     );
 *   }
 *   
 *   return <p>No review yet</p>;
 * };
 */
export async function getClientReviewOfTask(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const assignment = await prisma.taskAssignment.findUnique({
      where: { id },
      include: {
        reviews: {
          where: {
            reviewType: {
              name: 'Client Review'
            }
          },
          select: {
            rating: true,
            description: true,
            createdAt: true
          }
        }
      }
    });

    if (!assignment) {
      return { success: false, message: 'Task assignment not found' };
    }

    if (assignment.reviews.length === 0) {
      return { success: false, message: 'No review found' };
    }

    return {
      success: true,
      data: {
        rating: assignment.reviews[0].rating,
        feedback: assignment.reviews[0].description
      }
    };
  } catch (error) {
    console.error('[GET_CLIENT_REVIEW]', error);
    return { success: false, message: 'Failed to fetch review' };
  }
}

/**
 * Retrieves the contractor's review of a client for a task assignment
 * 
 * @param id - The task assignment ID
 * @returns Object containing success status and review details if found
 * 
 * @example
 * // In a client review display component
 * const ClientReview = async ({ taskId }) => {
 *   const { success, review } = await getContractorReviewOfClient(taskId);
 *   
 *   if (success && review) {
 *     return (
 *       <div>
 *         <h3>Contractor's Review</h3>
 *         <Rating value={review.rating} readOnly />
 *         <p>{review.feedback}</p>
 *       </div>
 *     );
 *   }
 *   
 *   return <p>No review yet</p>;
 * };
 */
export async function getContractorReviewOfClient(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const assignment = await prisma.taskAssignment.findUnique({
      where: { id },
      include: {
        reviews: {
          where: {
            reviewType: {
              name: 'Contractor Review'
            }
          },
          select: {
            rating: true,
            description: true,
            createdAt: true
          }
        }
      }
    });

    if (!assignment) {
      return { success: false, message: 'Task assignment not found' };
    }

    if (assignment.reviews.length === 0) {
      return { success: false, message: 'No review found' };
    }

    return {
      success: true,
      data: {
        rating: assignment.reviews[0].rating,
        feedback: assignment.reviews[0].description
      }
    };
  } catch (error) {
    console.error('[GET_CONTRACTOR_REVIEW]', error);
    return { success: false, message: 'Failed to fetch review' };
  }
} 

/**
 * Gets the ID of the "Completed" task assignment status
 * 
 * @returns The ID and name of the completed status
 */
export async function getCompletedTaskAssignmentStatus() {
  const status = await prisma.taskAssignmentStatus.findFirst({
    where: {
      name: 'Completed'
    },
    select: {
      id: true,
      name: true
    }
  });

  if (!status) {
    throw new Error('Completed status not found');
  }

  return status;
} 
