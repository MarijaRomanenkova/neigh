require('dotenv').config();

const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// Track active connections and rooms
const activeConnections = new Map();
const activeRooms = new Map();

// Create HTTP server
const httpServer = createServer((req, res) => {
  // Enhanced health check endpoint
  if (req.url === '/health') {
    const healthData = {
      status: 'ok',
      connections: activeConnections.size,
      rooms: activeRooms.size,
      uptime: process.uptime()
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(healthData));
    return;
  }
});

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["polling", "websocket"],
  path: '/api/socketio',
  addTrailingSlash: false,
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e8 // 100MB max message size
});

// Authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication token missing'));
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    if (!decoded) {
      return next(new Error('Invalid authentication token'));
    }

    // Add user info to socket
    socket.user = {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name
    };
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
});

// Socket.IO event handlers
io.on("connection", (socket) => {   
  console.log('Client connected:', socket.id, 'User:', socket.user.email);
  activeConnections.set(socket.id, {
    connectedAt: new Date(),
    rooms: new Set(),
    user: socket.user
  });
  
  socket.on("join-conversation", (conversationId) => {
    console.log('Client joined conversation:', conversationId);
    socket.join(conversationId);
    
    // Track room membership
    const userConnections = activeConnections.get(socket.id);
    if (userConnections) {
      userConnections.rooms.add(conversationId);
    }
    
    // Track room participants
    if (!activeRooms.has(conversationId)) {
      activeRooms.set(conversationId, new Set());
    }
    activeRooms.get(conversationId).add(socket.id);
  });
  
  socket.on("send-message", (data) => {
    console.log('Message sent:', data);
    // Add message delivery tracking
    const messageId = Date.now().toString();
    socket.to(data.conversationId).emit("new-message", {
      ...data.message,
      messageId,
      delivered: false,
      sender: socket.user
    });
    
    // Confirm delivery to sender
    socket.emit("message-delivered", { messageId });
  });

  socket.on("message-delivered", ({ messageId, conversationId }) => {
    socket.to(conversationId).emit("message-delivered", { messageId });
  });

  socket.on("disconnect", () => {
    console.log('Client disconnected:', socket.id);
    // Clean up connection tracking
    const userConnections = activeConnections.get(socket.id);
    if (userConnections) {
      // Remove from all rooms
      userConnections.rooms.forEach(roomId => {
        const room = activeRooms.get(roomId);
        if (room) {
          room.delete(socket.id);
          if (room.size === 0) {
            activeRooms.delete(roomId);
          }
        }
      });
      activeConnections.delete(socket.id);
    }
  });

  socket.on("error", (error) => {
    console.error('Socket error:', error);
    // Log error details for monitoring
    console.error({
      socketId: socket.id,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  });
});

// Start the server
const PORT = 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Socket.IO server running on port ${PORT}`);
  console.log('Server configuration:', {
    cors: io.engine.opts.cors,
    transports: io.engine.opts.transports,
    pingTimeout: io.engine.opts.pingTimeout,
    pingInterval: io.engine.opts.pingInterval
  });
}).on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please ensure no other socket server is running.`);
  } else {
    console.error('Failed to start Socket.IO server:', error);
  }
  process.exit(1);
}); 
