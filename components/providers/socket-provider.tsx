'use client';

/**
 * Socket.IO Provider Component
 * @module Components/Providers
 * 
 * This component provides real-time WebSocket connectivity via Socket.IO
 * throughout the application, enabling real-time features such as chat
 * and notifications.
 */

import { createContext, useContext, useEffect, useState } from 'react';
import { io as ClientIO, Socket } from 'socket.io-client';

/**
 * Socket Context Type Definition
 * @interface SocketContextType
 * @property {Socket|null} socket - The Socket.IO client instance or null if not connected
 * @property {boolean} isConnected - Whether the socket is currently connected
 */
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

/**
 * Socket Context
 * Provides socket instance and connection status to child components
 */
const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false
});

/**
 * Custom hook to access the Socket context
 * @returns {SocketContextType} Socket context with socket instance and connection status
 */
export const useSocket = () => {
  return useContext(SocketContext);
};

/**
 * SocketProvider Component
 * 
 * Establishes and manages Socket.IO connection with features like:
 * - Automatic reconnection with configurable attempts
 * - Connection status tracking
 * - Error handling for connection issues
 * - Cleanup on unmount
 * 
 * @param {Object} props - Component properties
 * @param {React.ReactNode} props.children - Child components to be wrapped
 * @returns {JSX.Element} The SocketContext.Provider with children
 */
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socketInstance = ClientIO('/', {
      path: '/api/socketio',
      addTrailingSlash: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket'],
      autoConnect: true,
      withCredentials: false,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('error', (err: Error) => {
      setError(err.message);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
} 
