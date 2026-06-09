import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { sendMessage, getChats, getChatMessages } from '../controllers/messageController.js';

const router = express.Router();

router.post('/', protect, sendMessage);
router.get('/', protect, getChats);
router.get('/history/:partnerId', protect, getChatMessages);

export default router;
