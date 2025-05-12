'use client';

/**
 * Socket.IO Provider Component
 * @module Components/Providers
 * 
 * This component provides real-time WebSocket connectivity via Socket.IO
 * throughout the application, enabling real-time features such as chat
 * and notifications.
 */

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io as ClientIO, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

/**
 * Socket Context Type Definition
 * @interface SocketContextType
 * @property {Socket|null} socket - The Socket.IO client instance or null if not connected
 * @property {boolean} isConnected - Whether the socket is currently connected
 * @property {number} unreadCount - The count of unread messages
 * @property {function} incrementUnreadCount - Function to increment the unread count
 * @property {function} decrementUnreadCount - Function to decrement the unread count
 * @property {function} resetUnreadCount - Function to reset the unread count
 */
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  unreadCount: number;
  incrementUnreadCount: () => void;
  decrementUnreadCount: () => void;
  resetUnreadCount: () => void;
}

/**
 * Socket Context
 * Provides socket instance and connection status to child components
 */
const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  unreadCount: 0,
  incrementUnreadCount: () => {},
  decrementUnreadCount: () => {},
  resetUnreadCount: () => {}
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
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const { status, data: session } = useSession();

  const incrementUnreadCount = () => setUnreadCount(prev => prev + 1);
  const decrementUnreadCount = () => setUnreadCount(prev => Math.max(0, prev - 1));
  const resetUnreadCount = () => setUnreadCount(0);

  useEffect(() => {
    let mounted = true;

    const checkSocketServer = async () => {
      try {
        const response = await fetch('/api/socketio/health');
        return response.ok;
      } catch (error) {
        console.error('Socket server health check failed:', error);
        return false;
      }
    };

    const initializeSocket = async () => {
      if (!mounted) return;

      // Clear any existing retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      // Disconnect existing socket if any
      if (socketRef.current?.connected) {
        socketRef.current.disconnect();
      }

      // Only proceed if user is authenticated
      if (status !== 'authenticated') {
        setSocket(null);
        setIsConnected(false);
        return;
      }

      const isServerReady = await checkSocketServer();
      if (!isServerReady) {
        console.log('Socket server not ready, retrying in 2 seconds...');
        retryTimeoutRef.current = setTimeout(initializeSocket, 2000);
        return;
      }

      const socketInstance = ClientIO('http://localhost:3001', {
        path: '/api/socketio',
        addTrailingSlash: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling'],
        autoConnect: true,
        withCredentials: true,
        timeout: 10000
      });

      socketInstance.on('connect', () => {
        if (!mounted) return;
        console.log('Socket connected:', socketInstance.id);
        setIsConnected(true);
      });

      socketInstance.on('disconnect', () => {
        if (!mounted) return;
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      socketInstance.on('connect_error', (err) => {
        if (!mounted) return;
        console.error('Socket connection error:', err);
        setIsConnected(false);
        retryTimeoutRef.current = setTimeout(initializeSocket, 2000);
      });

      // Handle new message events
      socketInstance.on('new_message', (data) => {
        if (!mounted) return;
        // Only increment if the message is not from the current user
        if (data.senderId !== session?.user?.id) {
          console.log('New message received from other user, incrementing unread count');
          incrementUnreadCount();
        }
      });

      // Handle message read events
      socketInstance.on('message_read', (data) => {
        if (!mounted) return;
        // Only decrement if the message was read by the current user
        if (data.readByUserId === session?.user?.id) {
          console.log('Message read by current user, decrementing unread count');
          decrementUnreadCount();
        }
      });

      if (mounted) {
        socketRef.current = socketInstance;
        setSocket(socketInstance);
      } else {
        socketInstance.disconnect();
      }
    };

    // Initial connection attempt
    initializeSocket();

    return () => {
      mounted = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (socketRef.current?.connected) {
        socketRef.current.disconnect();
      }
    };
  }, [status, session]); // Add status and session as dependencies

  // Always render children, even if socket is not connected
  return (
    <SocketContext.Provider value={{ 
      socket, 
      isConnected, 
      unreadCount,
      incrementUnreadCount,
      decrementUnreadCount,
      resetUnreadCount
    }}>
      {children}
    </SocketContext.Provider>
  );
} 
