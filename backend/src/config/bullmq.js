import { Queue } from 'bullmq';
import winston from 'winston';
import { getRedisClient } from './redis.js';
import { sendMail } from './email.js';
import Follow from '../models/Follow.js';

const redisConnection = {
  host: '127.0.0.1',
  port: 6379
};

export let emailQueue = null;
export let feedQueue = null;
export let notificationQueue = null;

const initQueues = () => {
  const redis = getRedisClient();
  const isMock = !redis || redis.constructor.name === 'MemoryRedisMock';

  if (isMock) {
    winston.info('Redis connection unavailable. Booting with Mock In-Process Queues.');
    
    const createMockQueue = (name) => ({
      add: async (jobName, data) => {
        winston.info(`[Mock Queue: ${name}] Queueing job: ${jobName}`);
        
        // Execute asynchronously in-process
        setTimeout(async () => {
          try {
            if (name === 'email-queue') {
              await sendMail(data);
            } else if (name === 'feed-queue') {
              const { postId, userId } = data;
              const followers = await Follow.find({ following: userId }).select('follower');
              for (const follow of followers) {
                await redis.del(`feed:following:${follow.follower.toString()}:1`);
              }
            } else if (name === 'notification-queue') {
              winston.info(`Mock Notification sent to user: ${data.recipient}`);
            }
          } catch (err) {
            winston.error(`Mock Queue worker error: ${err.message}`);
          }
        }, 100);
        return { id: `mock-${Date.now()}` };
      }
    });

    emailQueue = createMockQueue('email-queue');
    feedQueue = createMockQueue('feed-queue');
    notificationQueue = createMockQueue('notification-queue');
  } else {
    try {
      emailQueue = new Queue('email-queue', { connection: redisConnection });
      feedQueue = new Queue('feed-queue', { connection: redisConnection });
      notificationQueue = new Queue('notification-queue', { connection: redisConnection });
      winston.info('BullMQ Queues initialized (email-queue, feed-queue, notification-queue)');
    } catch (error) {
      winston.error(`Failed to initialize BullMQ Queue: ${error.message}`);
    }
  }
};

// Initialize right away
initQueues();

export const addEmailJob = async (data) => {
  if (!emailQueue) initQueues();
  await emailQueue.add('send-email', data, { removeOnComplete: true });
};

export const addFeedJob = async (data) => {
  if (!feedQueue) initQueues();
  await feedQueue.add('process-feed', data, { removeOnComplete: true });
};

export const addNotificationJob = async (data) => {
  if (!notificationQueue) initQueues();
  await notificationQueue.add('send-notification', data, { removeOnComplete: true });
};
