import express from 'express';
const router = express.Router();
import { protect } from '../middleware/authMiddleware.js';

// Review routes will be implemented here
router.post('/', protect, async (req, res) => {
  res.json({ message: 'Create review' });
});

router.get('/property/:propertyId', async (req, res) => {
  res.json({ message: 'Get property reviews' });
});

export default router;
