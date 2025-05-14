import { Server as NetServer } from 'http';
import { NextApiRequest } from 'next';
import { Server as ServerIO } from 'socket.io';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Add type declarations
declare module 'http' {
  interface Server {
    io?: ServerIO;
  }
}

declare module 'next/server' {
  interface NextResponse {
    socket?: {
      server: NetServer;
    };
  }
}

export async function GET(req: NextApiRequest) {
  try {
    if (!process.env.NEXTAUTH_SECRET) {
      throw new Error('NEXTAUTH_SECRET is not defined');
    }

    const res = new NextResponse();
    const httpServer = res.socket?.server as unknown as NetServer;

    if (!httpServer.io) {
      const io = new ServerIO(httpServer, {
        path: '/api/socketio',
        addTrailingSlash: false,
        cors: {
          origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          methods: ['GET', 'POST'],
          credentials: true
        },
        transports: ['polling', 'websocket'],
        pingTimeout: 60000,
        pingInterval: 25000
      });

      httpServer.io = io;
    }

    return new NextResponse('Socket.IO server is running', { status: 200 });
  } catch (error) {
    console.error('Socket.IO server error:', error);
    return new NextResponse('Socket.IO server error', { status: 500 });
  }
} 
