import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
  createPost, 
  getFeeds, 
  reactToPost, 
  commentOnPost, 
  getComments, 
  getCommentReplies, 
  savePost, 
  unsavePost, 
  getActiveStories, 
  getReels 
} from '../controllers/postController.js';

const router = express.Router();

router.post('/', protect, createPost);
router.get('/feed', protect, getFeeds);
router.post('/react/:id', protect, reactToPost);
router.post('/comment/:id', protect, commentOnPost);
router.get('/comments/:id', protect, getComments);
router.get('/comments/replies/:commentId', protect, getCommentReplies);
router.post('/save/:id', protect, savePost);
router.post('/unsave/:id', protect, unsavePost);
router.get('/stories', protect, getActiveStories);
router.get('/reels', protect, getReels);

export default router;
