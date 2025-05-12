/**
 * @module API/Messages
 */

import { NextResponse } from "next/server";
import { auth } from '@/auth';
import { prisma } from "@/db/prisma";

/**
 * Retrieves the count of unread messages for the authenticated user
 * @returns {Promise<NextResponse>} JSON response containing the unread message count or error
 */
export async function GET() {
  try {
    console.log('Fetching session in unread messages API');
    const session = await auth();
    console.log('Session in API:', session);
    
    if (!session?.user?.id) {
      console.log('No session or user ID found');
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
    
    console.log('User conversations:', userConversations);
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
    
    console.log('Unread count:', unreadCount);
    return NextResponse.json({ count: unreadCount });
    
  } catch (error) {
    console.error("Error counting unread messages:", error);
    return NextResponse.json(
      { error: "Failed to count unread messages", count: 0 },
      { status: 500 }
    );
  }
} 
