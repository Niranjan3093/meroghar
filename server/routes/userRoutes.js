import express from 'express';
const router = express.Router();
import { protect, authorize } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Property from '../models/Property.js';

// Search users by name or email
router.get('/search', protect, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ success: true, data: [] });
    }

    const searchRegex = new RegExp(q.trim(), 'i');

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { name: searchRegex },
        { email: searchRegex }
      ],
      isBanned: { $ne: true }
    })
      .select('name email avatar role')
      .limit(20);

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ success: false, message: 'Failed to search users' });
  }
});

// Get user's favorites
router.get('/favorites', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'favorites',
      populate: { path: 'host', select: 'name email avatar' }
    });
    
    // Filter out any null properties (in case property was deleted)
    const favorites = user.favorites.filter(prop => prop !== null);
    
    res.json({ success: true, data: favorites });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch favorites' });
  }
});

// Add property to favorites
router.post('/favorites/:propertyId', protect, async (req, res) => {
  try {
    const { propertyId } = req.params;
    
    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }
    
    const user = await User.findById(req.user._id);
    
    // Check if already in favorites
    if (user.favorites.includes(propertyId)) {
      return res.status(400).json({ success: false, message: 'Property already in favorites' });
    }
    
    user.favorites.push(propertyId);
    await user.save();
    
    res.json({ success: true, message: 'Property added to favorites', data: user.favorites });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({ success: false, message: 'Failed to add to favorites' });
  }
});

// Remove property from favorites
router.delete('/favorites/:propertyId', protect, async (req, res) => {
  try {
    const { propertyId } = req.params;
    
    const user = await User.findById(req.user._id);
    
    user.favorites = user.favorites.filter(favId => favId.toString() !== propertyId);
    await user.save();
    
    res.json({ success: true, message: 'Property removed from favorites', data: user.favorites });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({ success: false, message: 'Failed to remove from favorites' });
  }
});

// Check if property is in favorites
router.get('/favorites/check/:propertyId', protect, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const user = await User.findById(req.user._id);
    
    const isFavorite = user.favorites.includes(propertyId);
    
    res.json({ success: true, data: { isFavorite } });
  } catch (error) {
    console.error('Error checking favorite:', error);
    res.status(500).json({ success: false, message: 'Failed to check favorite status' });
  }
});

// User routes will be implemented here
router.get('/:id', protect, async (req, res) => {
  res.json({ message: 'Get user by ID' });
});

export default router;
