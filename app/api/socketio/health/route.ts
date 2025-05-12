import { NextResponse } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';

// Import the shared socket instance
import { io } from '../route';

export async function GET() {
  try {
    // Check if socket server is initialized
    if (!io) {
      return NextResponse.json(
        { error: 'Socket server not initialized' },
        { status: 503 }
      );
    }

    // Check if socket server is running
    const isRunning = io.engine?.clientsCount !== undefined;
    
    if (!isRunning) {
      return NextResponse.json(
        { error: 'Socket server not running' },
        { status: 503 }
      );
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Socket server health check error:', error);
    return NextResponse.json(
      { error: 'Socket server is not available' },
      { status: 503 }
    );
  }
} 
