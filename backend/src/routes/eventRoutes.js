import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
  createEvent, 
  getEventDetails, 
  rsvpEvent, 
  listEvents, 
  getEventDiscussion, 
  createEventDiscussionPost 
} from '../controllers/eventController.js';

const router = express.Router();

router.post('/', protect, createEvent);
router.get('/', protect, listEvents);
router.get('/:slug', protect, getEventDetails);
router.post('/rsvp/:slug', protect, rsvpEvent);
router.get('/discussion/:slug', protect, getEventDiscussion);
router.post('/discussion/:slug', protect, createEventDiscussionPost);

export default router;
