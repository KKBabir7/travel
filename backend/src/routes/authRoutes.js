import express from 'express';
import { 
  register, 
  verifyOtp, 
  login, 
  refreshToken, 
  forgotPassword, 
  resetPassword, 
  logout 
} from '../controllers/authController.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/verify-otp', verifyOtp);
router.post('/login', authLimiter, login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', logout);

export default router;
