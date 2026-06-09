import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { 
  getDashboardStats, 
  listUsers, 
  updateUserRole, 
  toggleUserVerification, 
  createReport, 
  listReports, 
  updateReportStatus, 
  deleteFlaggedContent 
} from '../controllers/adminController.js';

const router = express.Router();

// User Reporting Endpoint (available to all logged in users)
router.post('/report', protect, createReport);

// Dashboard stats & User management (restricted to Admin & Super Admin)
router.get('/stats', protect, restrictTo('Admin', 'Super Admin'), getDashboardStats);
router.get('/users', protect, restrictTo('Admin', 'Super Admin'), listUsers);
router.put('/users/:id/role', protect, restrictTo('Admin', 'Super Admin'), updateUserRole);
router.put('/users/:id/verify', protect, restrictTo('Admin', 'Super Admin'), toggleUserVerification);

// Report logs & Moderation (restricted to Moderator, Admin, Super Admin)
router.get('/reports', protect, restrictTo('Moderator', 'Admin', 'Super Admin'), listReports);
router.put('/reports/:id', protect, restrictTo('Moderator', 'Admin', 'Super Admin'), updateReportStatus);
router.delete('/content', protect, restrictTo('Moderator', 'Admin', 'Super Admin'), deleteFlaggedContent);

export default router;
