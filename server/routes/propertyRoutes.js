import express from 'express';
import {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  uploadPropertyImages,
  getPropertiesNearby,
  searchProperties,
  getHostProperties
} from '../controllers/propertyController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getProperties)
  .post(protect, authorize('host', 'admin'), createProperty);

router.get('/host/my-properties', protect, authorize('host'), getHostProperties);
router.get('/search', searchProperties);
router.get('/nearby', getPropertiesNearby);

router.route('/:id')
  .get(getProperty)
  .put(protect, authorize('host', 'admin'), updateProperty)
  .delete(protect, authorize('host', 'admin'), deleteProperty);

router.post('/:id/images', protect, authorize('host', 'admin'), upload.array('images', 10), uploadPropertyImages);

export default router;
