import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import winston from 'winston';
import dotenv from 'dotenv';

// Load Env
dotenv.config();

// Configs
import { connectDB } from './config/db.js';
import { connectRedis } from './config/redis.js';
import { initSocket } from './config/socket.js';
import { sseSubscribe } from './config/sse.js';

// Middlewares
import { protect } from './middleware/authMiddleware.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import postRoutes from './routes/postRoutes.js';
import journalRoutes from './routes/journalRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// BullMQ Workers (Import to start listening)
import './queues/emailWorker.js';
import './queues/notificationWorker.js';
import './queues/feedWorker.js';

// Logger configuration
winston.configure({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

const app = express();
const server = http.createServer(app);

// Basic Security & Parsing
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP in dev for direct resource serving
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(morgan('combined', { stream: { write: (message) => winston.info(message.trim()) } }));

// API Rate Limiting
app.use('/api', apiLimiter);

// SSE Subscription Endpoint (Real-Time notification center / updates)
app.get('/api/events/subscribe', protect, sseSubscribe);

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Fallback Error Handler
app.use(errorHandler);

// Initialize WebSockets
initSocket(server);

// Asynchronous connection helper
const initServices = async () => {
  try {
    await connectDB();
    await connectRedis();
  } catch (err) {
    winston.error(`Background services initialization failed: ${err.message}`);
  }
};
initServices();

// Start standalone HTTP listener if not on Vercel
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    winston.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

export default app;
