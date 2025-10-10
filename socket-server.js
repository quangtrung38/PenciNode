const { createServer } = require('http');
const { Server: SocketIOServer } = require('socket.io');

const port = parseInt(process.env.SOCKET_PORT || '8080', 10);
const hostname = 'localhost';

// Tạo HTTP server với endpoints
const server = createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'Socket.IO server is running', port }));
  } else if (req.url === '/emit-notification' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const { userId, data } = JSON.parse(body);
        
        // Emit notification to specific user
        io.emit(`notification:${userId}`, data);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          message: `Notification emitted to user ${userId}`,
          connectedClients: io.engine.clientsCount 
        }));
        
        console.log(`📢 Emitted notification to user ${userId}:`, data);
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Socket.IO Server - Use port 3000 for Next.js app');
  }
});

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store Socket.IO instance globally for use in API routes
global.io = io;

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(port, hostname, () => {
  console.log(`🚀 Socket.IO server listening at http://${hostname}:${port}`);
  console.log(`📱 Health check: http://${hostname}:${port}/health`);
  console.log(`🌐 Next.js app should run on port 3000`);
});