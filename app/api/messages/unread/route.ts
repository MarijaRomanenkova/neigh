/**
 * Unread Messages Count API Route
 * @module API
 * @group Chat
 * 
 * This API endpoint provides a count of unread messages for the current user.
 * It helps support notifications and visual indicators of unread messages
 * across all conversations where the user is a participant.
 */

import { NextResponse } from "next/server";
import { auth } from '@/auth';
import { prisma } from "@/db/prisma";

/**
 * GET handler for unread message count
 * 
 * Counts all unread messages for the authenticated user across all conversations.
 * Only counts messages that:
 * - Are in conversations where the user is a participant
 * - Were not sent by the user themself
 * - Have not been marked as read
 * 
 * @returns {Promise<NextResponse>} JSON response with unread message count
 * @example
 * // Response format
 * // { "count": 10 }
 */
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
