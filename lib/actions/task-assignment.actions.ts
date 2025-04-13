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
        }
      }
    });

    if (!assignment) {
      return {
        success: false,
        message: 'Task assignment not found'
      };
    }

    return {
      success: true,
      data: assignment
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
    const assignment = await prisma.taskAssignment.create({
      data: {
        taskId: data.taskId,
        contractorId: data.contractorId,
        clientId: data.clientId,
        statusId: data.statusId
      }
    });

    revalidatePath('/user/dashboard/client/tasks');
    
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
