import { createClient } from 'redis';
import winston from 'winston';

let redisClient = null;

// Simple in-memory fallback for Redis
class MemoryRedisMock {
  constructor() {
    this.store = new Map();
    this.hashStore = new Map();
    winston.info('Initialized in-memory Redis cache fallback');
  }
  async connect() {
    return 'OK';
  }
  async get(key) {
    return this.store.get(key) || null;
  }
  async set(key, value, options) {
    this.store.set(key, value);
    return 'OK';
  }
  async del(key) {
    this.store.delete(key);
    return 1;
  }
  async hSet(key, field, value) {
    if (!this.hashStore.has(key)) {
      this.hashStore.set(key, new Map());
    }
    this.hashStore.get(key).set(field, value);
    return 1;
  }
  async hDel(key, field) {
    if (this.hashStore.has(key)) {
      this.hashStore.get(key).delete(field);
    }
    return 1;
  }
  on(event, handler) {
    // mock event handler
  }
}

export const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 1) {
            // Switch to mock fast
            return new Error('Redis connection failed');
          }
          return 500;
        }
      }
    });

    redisClient.on('error', (err) => {
      winston.warn(`Redis client error: ${err.message}. Switching to in-memory fallback.`);
      redisClient = new MemoryRedisMock();
    });

    await redisClient.connect();
  } catch (error) {
    winston.warn(`Could not connect to Redis: ${error.message}. Using in-memory fallback.`);
    redisClient = new MemoryRedisMock();
  }
};

export const getRedisClient = () => {
  if (!redisClient) {
    redisClient = new MemoryRedisMock();
  }
  return redisClient;
};
