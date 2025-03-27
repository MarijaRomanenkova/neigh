/**
 * Messages API Route
 * @module API
 * @group Chat
 * 
 * This API endpoint handles message creation in conversations.
 * It allows users to send messages to conversations they're participants in,
 * and updates the conversation's timestamp when new messages are added.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from '@/auth';
import { prisma } from "@/db/prisma";

/**
 * POST handler for creating a new message
 * 
 * Creates a new message in a conversation and updates the conversation's
 * last activity timestamp. Validates that the sender is a participant in
 * the conversation before allowing the message to be created.
 * 
 * @param {NextRequest} req - The incoming request
 * @returns {Promise<NextResponse>} JSON response with the created message or error details
 * @example
 * // Request body format
 * // { "content": "Hello world", "conversationId": "123" }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { content, conversationId } = body;
    
    if (!content || !conversationId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Check if user is a participant in this conversation
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
        participants: {
          some: {
            userId: session.user.id
          }
        }
      },
      include: {
        participants: true
      }
    });
    
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found or you are not a participant" },
        { status: 404 }
      );
    }
    
    // Create the message
    const message = await prisma.message.create({
      data: {
        content,
        conversationId,
        senderId: session.user.id
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });
    
    // Update conversation's last message timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });
    
    return NextResponse.json(message);
    
  } catch (error) {
    console.error("Error in messages API:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
} 
