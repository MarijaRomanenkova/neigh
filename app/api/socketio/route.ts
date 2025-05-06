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
import { NextApiRequest } from 'next';
import { MessageData } from '@/types/chat/message.types';

// Global Socket.IO instance
let io: SocketIOServer | null = null;
let httpServer: NetServer | null = null;

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
  if (!io) {
    // Create a standalone HTTP server for Socket.IO
    httpServer = createServer();
    
    // Initialize Socket.IO
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL,
        methods: ["GET", "POST"]
      },
      transports: ["websocket"]
    });
    
    io.on("connection", (socket) => {   
      socket.on("join-conversation", (conversationId: string) => {
        socket.join(conversationId);
       });
      
      socket.on("send-message", (data: MessageData) => {
        socket.to(data.conversationId).emit("new-message", data.message);
      });
    });
    
    // Start the server on a port
    const PORT = 3100;
    httpServer.listen(PORT);
  }
  
  return NextResponse.json({ status: "Socket.IO initialized" });
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
  // Handle POST requests similarly
  const url = new URL(req.url);
  const searchParams = url.searchParams;
  const body = await req.text();
  
  const PORT = global.SOCKET_PORT || 3100;
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
