const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // userId -> Set of WebSocket connections
    this.rooms = new Map(); // roomId -> Set of WebSocket connections
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws',
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    
    logger.info('WebSocket server initialized');
  }

  verifyClient(info) {
    try {
      const url = new URL(info.req.url, `http://${info.req.headers.host}`);
      const token = url.searchParams.get('token');
      
      if (!token) {
        logger.warn('WebSocket connection rejected: No token provided');
        return false;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      info.req.user = decoded;
      return true;
    } catch (error) {
      logger.warn('WebSocket connection rejected: Invalid token', error.message);
      return false;
    }
  }

  handleConnection(ws, req) {
    const user = req.user;
    const userId = user.id;
    
    logger.info(`WebSocket client connected: ${user.email} (${userId})`);

    // Add client to user's connection set
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId).add(ws);

    // Send welcome message
    this.sendToClient(ws, {
      type: 'connection',
      message: 'Connected to real-time updates',
      timestamp: new Date().toISOString()
    });

    // Handle messages from client
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        this.handleClientMessage(ws, user, data);
      } catch (error) {
        logger.error('Error parsing WebSocket message:', error);
        this.sendToClient(ws, {
          type: 'error',
          message: 'Invalid message format'
        });
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      logger.info(`WebSocket client disconnected: ${user.email} (${userId})`);
      this.removeClient(userId, ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error(`WebSocket error for user ${userId}:`, error);
      this.removeClient(userId, ws);
    });
  }

  handleClientMessage(ws, user, data) {
    switch (data.type) {
      case 'join_room':
        this.joinRoom(ws, user.id, data.roomId);
        break;
      case 'leave_room':
        this.leaveRoom(ws, user.id, data.roomId);
        break;
      case 'ping':
        this.sendToClient(ws, { type: 'pong', timestamp: new Date().toISOString() });
        break;
      default:
        logger.warn(`Unknown message type: ${data.type}`);
    }
  }

  joinRoom(ws, userId, roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId).add(ws);
    
    logger.info(`User ${userId} joined room ${roomId}`);
    
    this.sendToClient(ws, {
      type: 'room_joined',
      roomId: roomId,
      message: `Joined room ${roomId}`
    });
  }

  leaveRoom(ws, userId, roomId) {
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(ws);
      
      if (this.rooms.get(roomId).size === 0) {
        this.rooms.delete(roomId);
      }
    }
    
    logger.info(`User ${userId} left room ${roomId}`);
    
    this.sendToClient(ws, {
      type: 'room_left',
      roomId: roomId,
      message: `Left room ${roomId}`
    });
  }

  removeClient(userId, ws) {
    // Remove from user's connections
    if (this.clients.has(userId)) {
      this.clients.get(userId).delete(ws);
      if (this.clients.get(userId).size === 0) {
        this.clients.delete(userId);
      }
    }

    // Remove from all rooms
    for (const [roomId, roomClients] of this.rooms.entries()) {
      roomClients.delete(ws);
      if (roomClients.size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  sendToClient(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  // Send message to specific user
  sendToUser(userId, data) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      userClients.forEach(ws => {
        this.sendToClient(ws, data);
      });
    }
  }

  // Send message to all clients in a room
  sendToRoom(roomId, data) {
    const roomClients = this.rooms.get(roomId);
    if (roomClients) {
      roomClients.forEach(ws => {
        this.sendToClient(ws, data);
      });
    }
  }

  // Send message to all connected clients
  broadcast(data) {
    this.wss.clients.forEach(ws => {
      this.sendToClient(ws, data);
    });
  }

  // Event-specific methods
  sendEventUpdate(eventId, data) {
    this.sendToRoom(`event_${eventId}`, {
      type: 'event_update',
      eventId: eventId,
      data: data,
      timestamp: new Date().toISOString()
    });
  }

  sendNotification(userId, notification) {
    this.sendToUser(userId, {
      type: 'notification',
      data: notification,
      timestamp: new Date().toISOString()
    });
  }

  sendRegistrationUpdate(eventId, userId, data) {
    // Send to event room
    this.sendToRoom(`event_${eventId}`, {
      type: 'registration_update',
      eventId: eventId,
      userId: userId,
      data: data,
      timestamp: new Date().toISOString()
    });

    // Send to specific user
    this.sendToUser(userId, {
      type: 'registration_update',
      eventId: eventId,
      data: data,
      timestamp: new Date().toISOString()
    });
  }

  // Get connection stats
  getStats() {
    return {
      totalClients: this.wss.clients.size,
      totalUsers: this.clients.size,
      totalRooms: this.rooms.size,
      userConnections: Array.from(this.clients.entries()).map(([userId, clients]) => ({
        userId,
        connectionCount: clients.size
      }))
    };
  }
}

module.exports = new WebSocketService();
