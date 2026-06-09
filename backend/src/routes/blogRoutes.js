import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
  createBlog, 
  getBlogBySlug, 
  listBlogs, 
  saveBlog, 
  unsaveBlog 
} from '../controllers/blogController.js';

const router = express.Router();

router.post('/', protect, createBlog);
router.get('/', protect, listBlogs);
router.get('/slug/:slug', protect, getBlogBySlug);
router.post('/save/:id', protect, saveBlog);
router.post('/unsave/:id', protect, unsaveBlog);

export default router;
