import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { statusId } = body;

    if (!statusId) {
      return new NextResponse("Status ID is required", { status: 400 });
    }

    // Update the task assignment
    const updatedAssignment = await prisma.taskAssignment.update({
      where: {
        id: params.id,
        contractorId: session.user.id, // Ensure only the assigned contractor can update
      },
      data: {
        statusId,
        completedAt: new Date(),
      },
    });

    return NextResponse.json(updatedAssignment);
  } catch (error) {
    console.error("[TASK_ASSIGNMENT_UPDATE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 
