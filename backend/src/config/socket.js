import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import winston from 'winston';
import { getRedisClient } from './redis.js';

let io = null;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Socket Auth Middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers['x-auth-token'];
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // Store user details (id, username, roles)
      next();
    } catch (error) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    winston.info(`Socket connected: User ${userId} (${socket.id})`);
    
    // Track online user in Redis
    const redis = getRedisClient();
    if (redis) {
      await redis.hSet('online_users', userId, socket.id);
      socket.broadcast.emit('user_online', { userId });
    }

    // Join user's personal room (for direct notifications / events)
    socket.join(`user:${userId}`);

    // Join custom chat room (one-to-one or group chat)
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      winston.info(`User ${userId} joined room ${roomId}`);
    });

    // Leave custom chat room
    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      winston.info(`User ${userId} left room ${roomId}`);
    });

    // Messaging
    socket.on('send_message', (data) => {
      const { roomId, message } = data;
      // Emit message to everyone in the room except sender
      socket.to(roomId).emit('message_received', message);
    });

    // Typing Indicators
    socket.on('typing', (data) => {
      const { roomId, isTyping } = data;
      socket.to(roomId).emit('typing_status', { userId, isTyping });
    });

    // Message Seen Status
    socket.on('message_seen', (data) => {
      const { roomId, messageId } = data;
      socket.to(roomId).emit('message_seen_update', { messageId, seenBy: userId });
    });

    // Disconnect
    socket.on('disconnect', async () => {
      winston.info(`Socket disconnected: User ${userId} (${socket.id})`);
      if (redis) {
        await redis.hDel('online_users', userId);
        socket.broadcast.emit('user_offline', { userId });
      }
    });
  });

  return io;
};

export const getIO = () => {
  return io;
};
