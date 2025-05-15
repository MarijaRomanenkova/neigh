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
 * @property {function} initializeSocket - Function to initialize the socket
 */
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  unreadCount: number;
  incrementUnreadCount: () => void;
  decrementUnreadCount: () => void;
  resetUnreadCount: () => void;
  initializeSocket: () => Promise<void>;
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
  resetUnreadCount: () => {},
  initializeSocket: async () => {}
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

  const initializeSocket = async () => {
    if (!session?.user?.token || socketRef.current?.connected) return;

    try {
      // Check server health first
      const healthResponse = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'}/socket-health`);
      const healthData = await healthResponse.json();
      
      if (healthData.status !== 'ok') {
        console.log('Socket server not ready:', healthData);
        return;
      }

      // Clear any existing retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      // Disconnect existing socket if any
      if (socketRef.current?.connected) {
        socketRef.current.disconnect();
      }

      const socketInstance = ClientIO(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
        path: '/socket.io',
        addTrailingSlash: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['polling', 'websocket'],
        autoConnect: false,
        withCredentials: true,
        timeout: 10000,
        forceNew: true,
        auth: {
          token: session.user.token
        }
      });

      // Track message delivery status
      const messageStatus = new Map<string, boolean>();

      socketInstance.on('connect', () => {
        console.log('Socket connected:', socketInstance.id);
        setIsConnected(true);
        // Clear any pending retry timeout
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = undefined;
        }
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
        // Attempt to reconnect after delay
        retryTimeoutRef.current = setTimeout(() => {
          socketInstance.connect();
        }, 2000);
      });

      socketInstance.on('connect_error', (err) => {
        console.log('Socket connection error:', err.message);
        setIsConnected(false);
        // Only retry if we haven't exceeded max attempts
        const maxAttempts = socketInstance.io.opts.reconnectionAttempts || 5;
        if (socketInstance.io.reconnectionAttempts() < maxAttempts) {
          retryTimeoutRef.current = setTimeout(() => {
            socketInstance.connect();
          }, 2000);
        } else {
          console.log('Max reconnection attempts reached');
        }
      });

      socketInstance.on('new-message', (message) => {
        console.log('New message received:', message);
        // Track message delivery
        if (message.messageId) {
          messageStatus.set(message.messageId, false);
          // Acknowledge message receipt
          socketInstance.emit('message-delivered', {
            messageId: message.messageId,
            conversationId: message.conversationId
          });
        }
        // Update unread count
        setUnreadCount(prev => prev + 1);
      });

      socketInstance.on('message-delivered', ({ messageId }) => {
        console.log('Message delivered:', messageId);
        messageStatus.set(messageId, true);
      });

      socketRef.current = socketInstance;
      setSocket(socketInstance);
      socketInstance.connect(); // Explicitly connect after setting up handlers
    } catch (error) {
      console.error('Failed to initialize socket:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (socketRef.current?.connected) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ 
      socket, 
      isConnected, 
      unreadCount,
      incrementUnreadCount,
      decrementUnreadCount,
      resetUnreadCount,
      initializeSocket
    }}>
      {children}
    </SocketContext.Provider>
  );
} 
