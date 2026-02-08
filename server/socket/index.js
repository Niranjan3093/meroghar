import { Message, Conversation } from '../models/Message.js';
import { notifyNewMessage } from '../utils/notifications.js';

export const setupSocketIO = (io) => {
  // Store active users
  const activeUsers = new Map();

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // User joins
    socket.on('join', (userId) => {
      activeUsers.set(userId, socket.id);
      socket.userId = userId;
      socket.join(userId);
      
      // Emit online status
      io.emit('user-online', userId);
      
      // Send current online users to the joining user
      const onlineUsers = Array.from(activeUsers.keys());
      socket.emit('online-users', onlineUsers);
    });

    // Join conversation room
    socket.on('join-conversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    });

    // Leave conversation room
    socket.on('leave-conversation', (conversationId) => {
      socket.leave(conversationId);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });

    // Send message
    socket.on('send-message', async (data) => {
      try {
        const { conversationId, senderId, receiverId, content, messageType = 'text' } = data;

        const message = await Message.create({
          conversation: conversationId,
          sender: senderId,
          content,
          messageType
        });

        await message.populate('sender', 'name avatar');

        // Update conversation
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: message._id,
          updatedAt: new Date(),
          $inc: {
            [`unreadCount.${receiverId}`]: 1
          }
        });

        // Emit to conversation room
        io.to(conversationId).emit('new-message', message);

        // Create persistent notification and emit to receiver
        await notifyNewMessage(io, {
          senderId,
          receiverId,
          senderName: message.sender.name,
          conversationId
        });
      } catch (error) {
        console.error('Socket send-message error:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Mark messages as read
    socket.on('mark-read', async (data) => {
      try {
        const { conversationId, userId } = data;

        await Message.updateMany(
          { conversation: conversationId, sender: { $ne: userId }, isRead: false },
          { isRead: true, $push: { readBy: { user: userId, readAt: new Date() } } }
        );

        await Conversation.findByIdAndUpdate(conversationId, {
          [`unreadCount.${userId}`]: 0
        });

        // Notify other participants that messages were read
        io.to(conversationId).emit('messages-read', { conversationId, userId });
      } catch (error) {
        console.error('Socket mark-read error:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Typing indicator
    socket.on('typing', (data) => {
      socket.to(data.conversationId).emit('user-typing', {
        userId: data.userId,
        userName: data.userName,
        conversationId: data.conversationId
      });
    });

    socket.on('stop-typing', (data) => {
      socket.to(data.conversationId).emit('user-stop-typing', {
        userId: data.userId,
        conversationId: data.conversationId
      });
    });

    // Check if user is online
    socket.on('check-online', (userId) => {
      const isOnline = activeUsers.has(userId);
      socket.emit('user-status', { userId, isOnline });
    });

    // Lease request notifications
    socket.on('lease-request-update', (data) => {
      const { receiverId, type, payload } = data;
      const receiverSocketId = activeUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('lease-request-notification', {
          type,
          data: payload
        });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      if (socket.userId) {
        activeUsers.delete(socket.userId);
        io.emit('user-offline', socket.userId);
      }
      console.log('Client disconnected:', socket.id);
    });
  });

  // Expose activeUsers for external access
  io.activeUsers = activeUsers;

  return io;
};
