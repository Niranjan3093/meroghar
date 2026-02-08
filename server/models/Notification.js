import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      // Common
      'message',
      'warning',
      
      // Host notifications
      'lease_request',
      'rent_payment',
      'maintenance_request',
      'lease_expiring',
      'payment_received',
      'review_received',
      'property_approved',
      'property_rejected',
      
      // Tenant notifications
      'lease_request_approved',
      'lease_request_rejected',
      'contract_renewal',
      'rent_reminder',
      'lease_signed',
      'maintenance_resolved',
      'maintenance_update',
      
      // Admin notifications
      'new_user',
      'pending_property',
      'pending_verification',
      'user_report',
      'system_alert'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    // Related entity IDs
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property'
    },
    leaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lease'
    },
    leaseRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LeaseRequest'
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    },
    maintenanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Maintenance'
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation'
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // Additional data
    amount: Number,
    propertyTitle: String,
    senderName: String,
    actionUrl: String
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  // For grouping similar notifications
  category: {
    type: String,
    enum: ['lease', 'payment', 'maintenance', 'message', 'admin', 'system'],
    default: 'system'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Index for faster queries
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });

// Static method to create and emit notification
notificationSchema.statics.createAndEmit = async function(io, notificationData) {
  const notification = await this.create(notificationData);
  await notification.populate('sender', 'name avatar');
  
  // Emit via socket
  if (io) {
    io.to(notificationData.recipient.toString()).emit('new-notification', notification);
  }
  
  return notification;
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
