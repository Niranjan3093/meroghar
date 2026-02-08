import express from 'express';
const router = express.Router();
import { protect } from '../middleware/authMiddleware.js';

// Analytics routes will be implemented here
router.get('/host/earnings', protect, async (req, res) => {
  res.json({ message: 'Get host earnings analytics' });
});

router.get('/occupancy-rate', protect, async (req, res) => {
  res.json({ message: 'Get occupancy rate' });
});

export default router;
