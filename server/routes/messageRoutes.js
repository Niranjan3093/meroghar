import express from 'express';
const router = express.Router();
import { protect } from '../middleware/authMiddleware.js';
import { Message, Conversation } from '../models/Message.js';
import Report from '../models/Report.js';
import Property from '../models/Property.js';
import User from '../models/User.js';

// Get all conversations for logged-in user
router.get('/conversations', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id
    })
      .populate('participants', 'name email avatar role')
      .populate('property', 'title images address rent')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    // Add other participant info and unread count for each conversation
    const conversationsWithDetails = conversations.map(conv => {
      const otherParticipant = conv.participants.find(
        p => p._id.toString() !== req.user._id.toString()
      );
      const unreadCount = conv.unreadCount?.get(req.user._id.toString()) || 0;
      
      return {
        ...conv.toObject(),
        otherParticipant,
        unreadCount
      };
    });

    res.json({ success: true, data: conversationsWithDetails });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
  }
});

// Get or create conversation
router.post('/conversation', protect, async (req, res) => {
  try {
    const { receiverId, propertyId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ success: false, message: 'Receiver ID is required' });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, receiverId] },
      ...(propertyId && { property: propertyId })
    })
      .populate('participants', 'name email avatar role')
      .populate('property', 'title images address rent')
      .populate('lastMessage');

    if (!conversation) {
      // Create new conversation
      conversation = await Conversation.create({
        participants: [req.user._id, receiverId],
        property: propertyId || null,
        unreadCount: new Map()
      });

      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name email avatar role')
        .populate('property', 'title images address rent');
    }

    const otherParticipant = conversation.participants.find(
      p => p._id.toString() !== req.user._id.toString()
    );

    res.json({ 
      success: true, 
      data: {
        ...conversation.toObject(),
        otherParticipant
      }
    });
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    res.status(500).json({ success: false, message: 'Failed to get/create conversation' });
  }
});

// Get messages for a conversation
router.get('/:conversationId', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is part of conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Message.countDocuments({ conversation: conversationId });

    res.json({ 
      success: true, 
      data: messages.reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
});

// Send message
router.post('/send', protect, async (req, res) => {
  try {
    const { receiverId, propertyId, content, conversationId, messageType = 'text' } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    let conversation;

    if (conversationId) {
      // Use existing conversation
      conversation = await Conversation.findOne({
        _id: conversationId,
        participants: req.user._id
      });

      if (!conversation) {
        return res.status(404).json({ success: false, message: 'Conversation not found' });
      }
    } else if (receiverId) {
      // Find or create conversation
      conversation = await Conversation.findOne({
        participants: { $all: [req.user._id, receiverId] },
        ...(propertyId && { property: propertyId })
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [req.user._id, receiverId],
          property: propertyId || null,
          unreadCount: new Map()
        });
      }
    } else {
      return res.status(400).json({ success: false, message: 'Receiver ID or Conversation ID is required' });
    }

    // Create message
    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      content: content.trim(),
      messageType
    });

    await message.populate('sender', 'name email avatar');

    // Get receiver ID
    const receiverUserId = conversation.participants.find(
      p => p.toString() !== req.user._id.toString()
    );

    // Update conversation
    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessage: message._id,
      $inc: { [`unreadCount.${receiverUserId}`]: 1 }
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(conversation._id.toString()).emit('new-message', message);
      io.to(receiverUserId.toString()).emit('notification', {
        type: 'new-message',
        message: `New message from ${req.user.name}`,
        data: message
      });
    }

    // Update property inquiries count
    if (propertyId) {
      await Property.findByIdAndUpdate(propertyId, { $inc: { inquiries: 1 } });
    }

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

// Mark messages as read
router.put('/:conversationId/read', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Verify user is part of conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Mark all messages from other users as read
    await Message.updateMany(
      { 
        conversation: conversationId, 
        sender: { $ne: req.user._id },
        isRead: false
      },
      { 
        isRead: true,
        $push: { readBy: { user: req.user._id, readAt: new Date() } }
      }
    );

    // Reset unread count
    await Conversation.findByIdAndUpdate(conversationId, {
      [`unreadCount.${req.user._id}`]: 0
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(conversationId).emit('messages-read', { 
        conversationId, 
        userId: req.user._id 
      });
    }

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark messages as read' });
  }
});

// Block user (via conversation)
router.post('/block/:conversationId', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Find the conversation to get the other user
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Get the other participant
    const userIdToBlock = conversation.participants.find(
      p => p.toString() !== req.user._id.toString()
    );

    if (!userIdToBlock) {
      return res.status(400).json({ success: false, message: 'No user to block' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { blockedUsers: userIdToBlock }
    });

    res.json({ success: true, message: 'User blocked successfully' });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ success: false, message: 'Failed to block user' });
  }
});

// Unblock user
router.delete('/block/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { blockedUsers: userId }
    });

    res.json({ success: true, message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ success: false, message: 'Failed to unblock user' });
  }
});

// Report message/user
router.post('/report', protect, async (req, res) => {
  try {
    const { reportedUserId, messageId, conversationId, propertyId, reportType, type, description } = req.body;

    const actualReportType = reportType || type;
    
    if (!actualReportType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Report type is required' 
      });
    }

    // If conversationId is provided, get the reported user from the conversation
    let userToReport = reportedUserId;
    if (!userToReport && conversationId) {
      const conversation = await Conversation.findById(conversationId);
      if (conversation) {
        userToReport = conversation.participants.find(
          p => p.toString() !== req.user._id.toString()
        );
      }
    }

    const report = await Report.create({
      reporter: req.user._id,
      reportedUser: userToReport,
      reportedMessage: messageId,
      conversation: conversationId,
      property: propertyId,
      reportType: actualReportType,
      description: description || ''
    });

    res.status(201).json({ success: true, data: report, message: 'Report submitted successfully' });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ success: false, message: 'Failed to submit report' });
  }
});

// Delete conversation (soft delete - just leave conversation)
router.delete('/conversation/:conversationId', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Remove user from participants
    await Conversation.findByIdAndUpdate(conversationId, {
      $pull: { participants: req.user._id }
    });

    res.json({ success: true, message: 'Left conversation successfully' });
  } catch (error) {
    console.error('Error leaving conversation:', error);
    res.status(500).json({ success: false, message: 'Failed to leave conversation' });
  }
});

export default router;
