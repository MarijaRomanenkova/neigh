'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';
import { ExtendedMessage } from '@/types';

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (message: Omit<ExtendedMessage, 'id' | 'createdAt'>) => void;
}

export function useSocket(): UseSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.id) return;

    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      auth: {
        userId: session.user.id
      }
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [session?.user?.id]);

  const sendMessage = (message: Omit<ExtendedMessage, 'id' | 'createdAt'>) => {
    if (!socket || !isConnected) return;
    socket.emit('send-message', message);
  };

  return {
    socket,
    isConnected,
    sendMessage
  };
} 
