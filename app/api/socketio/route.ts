import { NextRequest, NextResponse } from "next/server";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { Server as NetServer } from "http";

// Global Socket.IO instance
let io: SocketIOServer | null = null;
let httpServer: any = null;

export async function GET() {
  if (!io) {
    // Create a standalone HTTP server for Socket.IO
    httpServer = createServer();
    
    // Initialize Socket.IO
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      transports: ["websocket"]
    });
    
    io.on("connection", (socket) => {
      console.log("Socket connected:", socket.id);
      
      socket.on("join-conversation", (conversationId: string) => {
        socket.join(conversationId);
        console.log(`Socket ${socket.id} joined conversation: ${conversationId}`);
      });
      
      socket.on("send-message", (data: any) => {
        socket.to(data.conversationId).emit("new-message", data.message);
      });
    });
    
    // Start the server on a port
    const PORT = 3100;
    httpServer.listen(PORT, () => {
      console.log(`Socket.IO server running on port ${PORT}`);
    });
  }
  
  return NextResponse.json({ status: "Socket.IO initialized" });
}

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
