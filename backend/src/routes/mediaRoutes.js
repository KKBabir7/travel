import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { uploadMedia, getMedia, streamVideo } from '../controllers/mediaController.js';

const router = express.Router();

router.post('/upload', protect, upload.single('file'), uploadMedia);
router.get('/:id', getMedia);
router.get('/stream/:id', streamVideo);

export default router;
