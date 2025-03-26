'use server';

import { prisma } from '@/db/prisma';
import { convertToPlainObject } from '@/lib/utils';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { insertTaskAssignmentSchema } from '@/lib/validators';
import { z } from 'zod';

// Types for contractor view
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

type TaskAssignmentContractorList = {
  data: TaskAssignmentWithContractorDetails[];
  totalPages: number;
};

// Types for client view
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

type TaskAssignmentClientList = {
  data: TaskAssignmentWithClientDetails[];
  totalPages: number;
};

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

export async function getTaskAssignmentById(id: string) {
  try {
    const assignment = await prisma.taskAssignment.findUnique({
      where: { id },
      include: {
        task: {
          select: {
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
