/**
 * Socket.IO API Route
 * @module API
 * @group Communication
 * 
 * This API endpoint initializes and manages the Socket.IO server for real-time communication.
 * It creates a standalone HTTP server for WebSocket connections and handles message routing
 * between clients in conversation rooms.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { Server as NetServer } from "http";
import { MessageData } from '@/types/chat/message.types';

// Global Socket.IO instance
export let io: SocketIOServer | null = null;
let httpServer: NetServer | null = null;

// Initialize socket server
const initializeSocketServer = () => {
  if (!io) {
    // Create a standalone HTTP server for Socket.IO
    httpServer = createServer();
    
    // Initialize Socket.IO with proper configuration
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ["websocket", "polling"],
      path: '/api/socketio',
      addTrailingSlash: false
    });
    
    io.on("connection", (socket) => {   
      console.log('Client connected:', socket.id);
      
      socket.on("join-conversation", (conversationId: string) => {
        console.log('Client joined conversation:', conversationId);
        socket.join(conversationId);
      });
      
      socket.on("send-message", (data: MessageData) => {
        console.log('Message sent:', data);
        socket.to(data.conversationId).emit("new-message", data.message);
      });

      socket.on("disconnect", () => {
        console.log('Client disconnected:', socket.id);
      });

      socket.on("error", (error) => {
        console.error('Socket error:', error);
      });
    });
    
    // Start the server on port 3001
    const PORT = 3001;
    httpServer.listen(PORT);
    console.log(`Socket.IO server running on port ${PORT}`);
  }
  return io;
};

// Initialize socket server on module load
initializeSocketServer();

/**
 * GET handler for Socket.IO initialization
 * 
 * Initializes the Socket.IO server if not already running.
 * Sets up event handlers for client connections, joining conversations,
 * and message passing between clients.
 * 
 * @returns {Promise<NextResponse>} JSON response confirming initialization status
 */
export async function GET() {
  try {
    if (!io) {
      io = initializeSocketServer();
    }
    
    return NextResponse.json({ status: "Socket.IO initialized" });
  } catch (error) {
    console.error('Socket.IO initialization error:', error);
    return NextResponse.json(
      { error: "Failed to initialize Socket.IO" },
      { status: 500 }
    );
  }
}

/**
 * POST handler for Socket.IO HTTP polling fallback
 * 
 * Handles HTTP-based Socket.IO communication when WebSockets are not available.
 * This proxies requests to the local Socket.IO server running on a separate port.
 * 
 * @param {NextRequest} req - The incoming request
 * @returns {Promise<Response>} Raw response from the Socket.IO server
 */
export async function POST(req: NextRequest) {
  try {
    if (!io) {
      throw new Error('Socket.IO server not initialized');
    }

    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const body = await req.text();
    
    const PORT = 3001;
    const response = await fetch(`http://localhost:${PORT}/socket.io/?${searchParams.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body,
    });
    
    const data = await response.text();
    
    return new Response(data, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('Socket.IO POST error:', error);
    return NextResponse.json(
      { error: "Failed to handle Socket.IO request" },
      { status: 500 }
    );
  }
}

// Add this to global.d.ts or declare it here
declare global {
  var SOCKET_PORT: number;
  var socketIOHandler: boolean;
  namespace NodeJS {
    interface Global {
      process: {
        server: NetServer;
      };
    }
  }
}
