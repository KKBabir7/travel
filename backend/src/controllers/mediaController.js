import mongoose from 'mongoose';
import { getGridFSBucket } from '../config/db.js';
import { uploadToGridFS } from '../middleware/uploadMiddleware.js';
import winston from 'winston';

export const uploadMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const gridFile = await uploadToGridFS(req.file);
    return res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      fileId: gridFile.id,
      filename: gridFile.filename,
      contentType: gridFile.contentType,
      url: `/api/media/${gridFile.id}`
    });
  } catch (error) {
    next(error);
  }
};

export const getMedia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bucket = getGridFSBucket();
    const fileId = new mongoose.Types.ObjectId(id);

    // Fetch file metadata to check mime type
    const files = await bucket.find({ _id: fileId }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const file = files[0];
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Length', file.length);

    const downloadStream = bucket.openDownloadStream(fileId);
    downloadStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

// Stream video with support for Range headers (HTTP 206 Partial Content)
export const streamVideo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bucket = getGridFSBucket();
    const fileId = new mongoose.Types.ObjectId(id);

    // Fetch metadata
    const files = await bucket.find({ _id: fileId }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    const file = files[0];
    const range = req.headers.range;

    if (!range) {
      // If no range, send full file
      res.setHeader('Content-Type', file.contentType);
      res.setHeader('Content-Length', file.length);
      res.setHeader('Accept-Ranges', 'bytes');
      return bucket.openDownloadStream(fileId).pipe(res);
    }

    // Parse Range header: "bytes=start-end"
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : file.length - 1;

    if (start >= file.length || end >= file.length) {
      res.setHeader('Content-Range', `bytes */${file.length}`);
      return res.status(416).send('Requested range not satisfiable');
    }

    const chunkSize = (end - start) + 1;
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${file.length}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': file.contentType
    });

    const downloadStream = bucket.openDownloadStream(fileId, {
      start,
      end: end + 1 // GridFS end is exclusive, so we increment by 1
    });

    downloadStream.pipe(res);
  } catch (error) {
    next(error);
  }
};
