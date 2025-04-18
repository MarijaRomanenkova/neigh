'use server';

/**
 * Task assignment management functions for creating, retrieving, updating and deleting task assignments
 * @module TaskAssignmentActions
 * @group API
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
 */
function serializeData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }
  
  // Check if it's a Prisma Decimal type
  if (isDecimal(data)) {
    return parseFloat(data.toString());
  }
  
  // If it's an array, process each item
  if (Array.isArray(data)) {
    return (data as unknown[]).map((item: unknown) => serializeData(item));
  }
  
  // If it's an object, process each property
  if (typeof data === 'object' && data !== null) {
    const result: Record<string, unknown> = {};
    const obj = data as Record<string, unknown>;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = serializeData(obj[key]);
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
 */
type TaskAssignmentWithClientDetails = Prisma.TaskAssignmentGetPayload<{
  include: {
    task: {
      select: {
        name: true;
        price: true;
      };
    };
    contractor: {
      select: {
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
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const plainData = convertToPlainObject(assignments);

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
          name: true,
          price: true
        }
      },
      contractor: {
        select: {
          name: true
        }
      },
      status: {
        select: {
          name: true,
          color: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return {
    data: assignments,
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
    
    // Format dates to ensure they're proper ISO strings
    const enhancedAssignment = {
      ...assignment,
      createdAt: assignment.createdAt.toISOString(),
      // No updatedAt in the response, so set it to the createdAt for consistency
      updatedAt: assignment.createdAt.toISOString(),
      wasReviewed: !!clientReview,
      reviewRating: clientReview?.rating || null,
      reviewFeedback: clientReview?.description || null,
      reviews: undefined // Remove the original reviews array to avoid duplication
    };
    
    // Serialize the data to convert any Decimal types to regular numbers
    const serializedData = serializeData(enhancedAssignment);

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
 * Deletes a task assignment by its ID
 * 
 * @param id - The unique identifier of the task assignment to delete
 * @returns Object containing success status and message
 * 
 * @example
 * // In a task management component
 * async function handleDelete(assignmentId) {
 *   const { success, message } = await deleteTaskAssignment(assignmentId);
 *   
 *   if (success) {
 *     showNotification('Success', message);
 *     refreshAssignments();
 *   } else {
 *     showNotification('Error', message);
 *   }
 * }
 */
export async function deleteTaskAssignment(id: string) {
  "use server";
  
  try {
    await prisma.taskAssignment.delete({
      where: { id }
    });

    revalidatePath('/user/dashboard/contractor/assignments');
    revalidatePath('/user/dashboard/client/task-assignments');
    
    return {
      success: true,
      message: 'Task assignment deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting task assignment:', error);
    return {
      success: false,
      message: 'Failed to delete task assignment'
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
      }
    });

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
 * Retrieves all available task categories
 * 
 * @returns List of categories with task counts
 * 
 * @example
 * const categories = await getAllCategories();
 * categories.forEach(cat => console.log(`${cat.name}: ${cat._count.tasks} tasks`));
 */
export async function getAllCategories() {
  // Implementation
}

/**
 * Updates a task assignment's status
 * 
 * @param id - The task assignment ID
 * @param statusId - The new status ID
 * @returns Result with success status and message
 */
export async function updateTaskAssignment(id: string, statusId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
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
    });

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
 * Marks a task assignment as reviewed and adds rating
 * 
 * @param id - The task assignment ID
 * @param rating - The rating (1-5)
 * @param feedback - Optional review feedback text
 * @returns Result with success status and message
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
        contractorId: true
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

    // Create a new review
    const review = await prisma.review.create({
      data: {
        assignmentId: id,
        reviewerId: session.user.id, // Client is the reviewer
        revieweeId: taskAssignment.contractorId, // Contractor is being reviewed
        rating,
        title: 'Task Review',
        description: feedback || 'No feedback provided',
        typeId: reviewType.id
      }
    });

    // Update contractor rating
    await updateContractorRating(taskAssignment.contractorId);

    revalidatePath('/user/dashboard/client/task-assignments');
    
    return {
      success: true,
      message: 'Review submitted successfully',
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
 * Updates a contractor's average rating based on their reviews
 * 
 * @param contractorId - The contractor's user ID
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
 * Accepts a completed task assignment (client only)
 * 
 * @param id - The task assignment ID
 * @returns Result with success status and message
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
        status: true
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

    revalidatePath('/user/dashboard/client/task-assignments');
    
    return {
      success: true,
      message: 'Task accepted successfully',
      data: updatedAssignment
    };
  } catch (error) {
    console.error('[TASK_ASSIGNMENT_ACCEPT]', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to accept task' 
    };
  }
} 
