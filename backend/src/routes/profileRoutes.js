import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
  getProfile, 
  updateProfile, 
  followUser, 
  unfollowUser, 
  getFollowers, 
  getFollowing, 
  getSuggestedTravelers 
} from '../controllers/profileController.js';

const router = express.Router();

router.get('/suggested', protect, getSuggestedTravelers);
router.get('/:username', protect, getProfile);
router.put('/update', protect, updateProfile);
router.post('/follow/:id', protect, followUser);
router.post('/unfollow/:id', protect, unfollowUser);
router.get('/:username/followers', protect, getFollowers);
router.get('/:username/following', protect, getFollowing);

export default router;
