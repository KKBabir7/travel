import mongoose from 'mongoose';
import winston from 'winston';

let gridFSBucket = null;

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    winston.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Initialize GridFS bucket
    const db = conn.connection.db;
    gridFSBucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: 'media'
    });
    winston.info('GridFS Bucket initialized');
  } catch (error) {
    winston.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

export const getGridFSBucket = () => {
  if (!gridFSBucket) {
    throw new Error('GridFS Bucket not initialized. Connect to DB first.');
  }
  return gridFSBucket;
};
