import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

export async function GET() {
  try {
    const completedStatus = await prisma.taskStatus.findFirst({
      where: { name: "COMPLETED" }
    });

    if (!completedStatus) {
      return NextResponse.json(
        { error: "Completed status not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(completedStatus);
  } catch (error) {
    console.error("Error fetching completed status:", error);
    return NextResponse.json(
      { error: "Failed to fetch completed status" },
      { status: 500 }
    );
  }
} 
