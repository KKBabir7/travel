import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
  createJournal, 
  getJournalBySlug, 
  getUserJournals, 
  addDayLog, 
  updateDayLog, 
  deleteDayLog 
} from '../controllers/journalController.js';

const router = express.Router();

router.post('/', protect, createJournal);
router.get('/slug/:slug', protect, getJournalBySlug);
router.get('/user/:username', protect, getUserJournals);
router.post('/:id/log', protect, addDayLog);
router.put('/:id/log/:logId', protect, updateDayLog);
router.delete('/:id/log/:logId', protect, deleteDayLog);

export default router;
