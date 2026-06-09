import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
  createGroup, 
  getGroupDetails, 
  joinGroup, 
  leaveGroup, 
  getGroupPosts, 
  createGroupPost, 
  listGroups 
} from '../controllers/groupController.js';

const router = express.Router();

router.post('/', protect, createGroup);
router.get('/', protect, listGroups);
router.get('/:slug', protect, getGroupDetails);
router.post('/join/:slug', protect, joinGroup);
router.post('/leave/:slug', protect, leaveGroup);
router.get('/posts/:slug', protect, getGroupPosts);
router.post('/posts/:slug', protect, createGroupPost);

export default router;
