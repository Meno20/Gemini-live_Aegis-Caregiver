import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer();
const io = new Server(httpServer, {
  path: '/',
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Store connected clients by type
const controllers = new Set();
const viewers = new Set();

io.on('connection', (socket) => {
  console.log(`[${new Date().toISOString()}] Client connected: ${socket.id}`);
  console.log(`  Transport: ${socket.conn.transport.name}`);

  // Client identifies as controller (page 1)
  socket.on('join-controller', () => {
    controllers.add(socket.id);
    socket.join('controllers');
    console.log(`[${new Date().toISOString()}] Controller joined: ${socket.id}`);
    console.log(`  Total controllers: ${controllers.size}, Total viewers: ${viewers.size}`);
    
    // Notify about viewer count
    socket.emit('viewer-count', { count: viewers.size });
  });

  // Client identifies as viewer (page 2 - camera viewer)
  socket.on('join-viewer', () => {
    viewers.add(socket.id);
    socket.join('viewers');
    console.log(`[${new Date().toISOString()}] Viewer joined: ${socket.id}`);
    console.log(`  Total controllers: ${controllers.size}, Total viewers: ${viewers.size}`);
    
    // Notify all controllers about new viewer
    io.to('controllers').emit('viewer-count', { count: viewers.size });
  });

  // Controller requests to enable camera on viewer
  socket.on('enable-camera', () => {
    console.log(`[${new Date().toISOString()}] Camera enable request from controller: ${socket.id}`);
    console.log(`  Broadcasting to ${viewers.size} viewers`);
    io.to('viewers').emit('enable-camera');
  });

  // Controller requests to disable camera on viewer
  socket.on('disable-camera', () => {
    console.log(`[${new Date().toISOString()}] Camera disable request from controller: ${socket.id}`);
    console.log(`  Broadcasting to ${viewers.size} viewers`);
    io.to('viewers').emit('disable-camera');
  });

  // Viewer reports camera status
  socket.on('camera-status', (data) => {
    console.log(`[${new Date().toISOString()}] Viewer ${socket.id} camera status: ${data.enabled}`);
    io.to('controllers').emit('viewer-camera-status', { 
      viewerId: socket.id, 
      enabled: data.enabled 
    });
  });

  socket.on('disconnect', (reason) => {
    console.log(`[${new Date().toISOString()}] Client disconnected: ${socket.id}, reason: ${reason}`);
    if (controllers.has(socket.id)) {
      controllers.delete(socket.id);
      console.log(`  Controller removed. Remaining controllers: ${controllers.size}`);
    }
    if (viewers.has(socket.id)) {
      viewers.delete(socket.id);
      console.log(`  Viewer removed. Remaining viewers: ${viewers.size}`);
      io.to('controllers').emit('viewer-count', { count: viewers.size });
    }
  });

  socket.on('error', (error) => {
    console.error(`[${new Date().toISOString()}] Socket error (${socket.id}):`, error);
  });
});

const PORT = 8082; // Updated port per instructions
httpServer.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Camera signaling server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal, shutting down server...');
  httpServer.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('Received SIGINT signal, shutting down server...');
  httpServer.close(() => process.exit(0));
});
