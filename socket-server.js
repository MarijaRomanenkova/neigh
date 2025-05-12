const { createServer } = require('http');
const { Server } = require('socket.io');

// Create HTTP server
const httpServer = createServer((req, res) => {
  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200);
    res.end('OK');
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
  transports: ["websocket", "polling"],
  path: '/api/socketio',
  addTrailingSlash: false
});

// Socket.IO event handlers
io.on("connection", (socket) => {   
  console.log('Client connected:', socket.id);
  
  socket.on("join-conversation", (conversationId) => {
    console.log('Client joined conversation:', conversationId);
    socket.join(conversationId);
  });
  
  socket.on("send-message", (data) => {
    console.log('Message sent:', data);
    socket.to(data.conversationId).emit("new-message", data.message);
  });

  socket.on("disconnect", () => {
    console.log('Client disconnected:', socket.id);
  });

  socket.on("error", (error) => {
    console.error('Socket error:', error);
  });
});

// Start the server
const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
}).on('error', (error) => {
  console.error('Failed to start Socket.IO server:', error);
  process.exit(1);
}); 
