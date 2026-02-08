import express from 'express';
const router = express.Router();
import { protect, authorize } from '../middleware/authMiddleware.js';

// User routes will be implemented here
router.get('/:id', protect, async (req, res) => {
  res.json({ message: 'Get user by ID' });
});

export default router;
