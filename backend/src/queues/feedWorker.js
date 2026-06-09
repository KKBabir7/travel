import { Worker } from 'bullmq';
import { getRedisClient } from '../config/redis.js';
import Follow from '../models/Follow.js';
import winston from 'winston';

const connection = {
  host: '127.0.0.1',
  port: 6379
};

const redis = getRedisClient();
const isMock = !redis || redis.constructor.name === 'MemoryRedisMock';

let feedWorker = null;

if (!isMock) {
  feedWorker = new Worker('feed-queue', async (job) => {
    winston.info(`Processing feed job: ${job.id}`);
    const { postId, userId } = job.data;

    const redis = getRedisClient();
    if (!redis) return;

    // Find followers of the poster
    const followers = await Follow.find({ following: userId }).select('follower');
    
    // Invalidate feed caches of followers
    for (const follow of followers) {
      await redis.del(`feed:following:${follow.follower.toString()}:1`);
    }
    
    winston.info(`Feed fan-out cache invalidations completed for post ${postId}`);
  }, { connection });

  feedWorker.on('completed', (job) => {
    winston.info(`Feed job ${job.id} finished`);
  });

  feedWorker.on('failed', (job, err) => {
    winston.error(`Feed job ${job.id} failed: ${err.message}`);
  });
} else {
  winston.info('Skipping BullMQ Feed Worker connection loop (Redis mock active)');
}

export default feedWorker;
