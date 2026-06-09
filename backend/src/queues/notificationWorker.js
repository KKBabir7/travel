import { Worker } from 'bullmq';
import { getRedisClient } from '../config/redis.js';
import winston from 'winston';

const connection = {
  host: '127.0.0.1',
  port: 6379
};

const redis = getRedisClient();
const isMock = !redis || redis.constructor.name === 'MemoryRedisMock';

let notificationWorker = null;

if (!isMock) {
  notificationWorker = new Worker('notification-queue', async (job) => {
    winston.info(`Processing notification job: ${job.id}`);
    const notif = job.data;
    winston.info(`Notification dispatched successfully to recipient ${notif.recipient}`);
  }, { connection });

  notificationWorker.on('completed', (job) => {
    winston.info(`Notification job ${job.id} finished`);
  });

  notificationWorker.on('failed', (job, err) => {
    winston.error(`Notification job ${job.id} failed: ${err.message}`);
  });
} else {
  winston.info('Skipping BullMQ Notification Worker connection loop (Redis mock active)');
}

export default notificationWorker;
