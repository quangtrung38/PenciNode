const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

// const dev = process.env.NODE_ENV !== 'production';
const dev = false;
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Prepare Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Create Socket.IO server
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Socket.IO event handlers
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // User joined room
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
    });

    // Design collaboration events
    socket.on('design-update', (data) => {
      socket.to(data.roomId).emit('design-updated', {
        userId: socket.id,
        ...data
      });
    });

    // Real-time notifications
    socket.on('send-notification', (data) => {
      io.emit('notification', {
        id: Date.now(),
        message: data.message,
        type: data.type || 'info',
        timestamp: new Date().toISOString()
      });
    });

    // Admin broadcast
    socket.on('admin-broadcast', (data) => {
      io.emit('admin-message', {
        message: data.message,
        from: 'admin',
        timestamp: new Date().toISOString()
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Health check endpoint for Socket.IO
  httpServer.on('request', (req, res) => {
    if (req.url === '/socket/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'ok', 
        connectedClients: io.sockets.sockets.size,
        uptime: process.uptime()
      }));
      return;
    }
  });

  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`🚀 Next.js server ready on http://${hostname}:${port}`);
    console.log(`🔌 Socket.IO server ready on the same port`);
    console.log(`📱 Health check: http://${hostname}:${port}/socket/health`);
  });
});