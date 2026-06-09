import { Worker } from 'bullmq';
import { sendMail } from '../config/email.js';
import { getRedisClient } from '../config/redis.js';
import winston from 'winston';

const connection = {
  host: '127.0.0.1',
  port: 6379
};

const redis = getRedisClient();
const isMock = !redis || redis.constructor.name === 'MemoryRedisMock';

let emailWorker = null;

if (!isMock) {
  emailWorker = new Worker('email-queue', async (job) => {
    winston.info(`Processing email job: ${job.id}`);
    const { to, subject, html, text } = job.data;
    await sendMail({ to, subject, html, text });
  }, { connection });

  emailWorker.on('completed', (job) => {
    winston.info(`Email job ${job.id} completed successfully`);
  });

  emailWorker.on('failed', (job, err) => {
    winston.error(`Email job ${job.id} failed with error: ${err.message}`);
  });
} else {
  winston.info('Skipping BullMQ Email Worker connection loop (Redis mock active)');
}

export default emailWorker;
