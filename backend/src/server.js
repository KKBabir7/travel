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

const isVercel = !!process.env.VERCEL;

// Configs
import { connectDB } from './config/db.js';
import { connectRedis } from './config/redis.js';
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

// BullMQ Workers — only start in non-serverless environments
if (!isVercel) {
  await import('./queues/emailWorker.js');
  await import('./queues/notificationWorker.js');
  await import('./queues/feedWorker.js');
}

// Logger configuration — no file transports on Vercel (read-only filesystem)
const logTransports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  })
];

if (!isVercel) {
  logTransports.push(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  );
}

winston.configure({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: logTransports
});

const app = express();
const server = http.createServer(app);

// Basic Security & Parsing
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(morgan('combined', { stream: { write: (message) => winston.info(message.trim()) } }));

// API Rate Limiting
app.use('/api', apiLimiter);

// SSE Subscription Endpoint
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

// Socket.io — only in non-serverless environments
if (!isVercel) {
  const { initSocket } = await import('./config/socket.js');
  initSocket(server);
}

// Asynchronous DB & Redis connection
const initServices = async () => {
  try {
    await connectDB();
    await connectRedis();
  } catch (err) {
    winston.error(`Services init failed: ${err.message}`);
  }
};
initServices();

// Start HTTP listener only outside Vercel
if (!isVercel) {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    winston.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

export default app;

