import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.put('/mark-all-read', protect, markAllAsRead);
router.put('/:id', protect, markAsRead);

export default router;
