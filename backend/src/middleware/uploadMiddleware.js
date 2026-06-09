import multer from 'multer';
import { Readable } from 'stream';
import { getGridFSBucket } from '../config/db.js';

// Configure Multer to store uploaded files in memory buffers
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max file size (important for video stories/reels)
  },
  fileFilter: (req, file, cb) => {
    // Accept standard images and video formats
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video uploads are supported'), false);
    }
  }
});

// Utility to stream file from memory buffer to GridFS
export const uploadToGridFS = (file) => {
  return new Promise((resolve, reject) => {
    const bucket = getGridFSBucket();
    
    // Generate a unique filename using timestamp
    const uniqueFilename = `${Date.now()}-${file.originalname}`;
    
    const uploadStream = bucket.openUploadStream(uniqueFilename, {
      contentType: file.mimetype
    });

    const readableStream = new Readable();
    readableStream._read = () => {};
    readableStream.push(file.buffer);
    readableStream.push(null);

    readableStream.pipe(uploadStream)
      .on('error', (error) => {
        reject(error);
      })
      .on('finish', () => {
        resolve({
          id: uploadStream.id.toString(),
          filename: uniqueFilename,
          contentType: file.mimetype
        });
      });
  });
};
