import { NextResponse } from "next/server";
import { auth } from '@/auth';
import { prisma } from "@/db/prisma";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get all conversations where the user is a participant
    const userConversations = await prisma.conversationParticipant.findMany({
      where: {
        userId: session.user.id
      },
      select: {
        conversationId: true
      }
    });
    
    const conversationIds = userConversations.map(c => c.conversationId);
    
    // Count messages that are:
    // 1. In conversations where the user is a participant
    // 2. Not sent by the user
    // 3. Have not been read (readAt is null)
    const unreadCount = await prisma.message.count({
      where: {
        conversationId: { in: conversationIds },
        senderId: { not: session.user.id },
        readAt: null
      }
    });
    
    return NextResponse.json({ count: unreadCount });
    
  } catch (error) {
    console.error("Error counting unread messages:", error);
    return NextResponse.json(
      { error: "Failed to count unread messages", count: 0 },
      { status: 500 }
    );
  }
} 
