import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    const response = await fetch(`${socketUrl}/health`, {
      headers: {
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });
    
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }
    
    return NextResponse.json(
      { error: 'Socket server not responding' },
      { status: 503 }
    );
  } catch (error) {
    console.error('Socket server health check error:', error);
    return NextResponse.json(
      { error: 'Socket server is not available' },
      { status: 503 }
    );
  }
} 
