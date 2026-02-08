import mongoose from 'mongoose';

const leaseRequestSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'payment-pending', 'completed'],
    default: 'pending'
  },
  message: {
    type: String,
    maxLength: 500
  },
  proposedMoveIn: {
    type: Date,
    required: true
  },
  proposedDuration: {
    type: String,
    enum: ['monthly', '3-months', '6-months', 'yearly'],
    required: true
  },
  monthlyRent: {
    type: Number,
    required: true
  },
  securityDeposit: {
    type: Number,
    required: true
  },
  // Host response
  hostResponse: {
    message: String,
    respondedAt: Date
  },
  // Payment tracking
  securityDepositPayment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  securityDepositPaid: {
    type: Boolean,
    default: false
  },
  securityDepositPaidAt: Date,
  // Lease created from this request
  lease: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lease'
  },
  // Cancellation
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: String,
  cancelledAt: Date,
  // Expiry
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  }
}, {
  timestamps: true
});

// Index for faster queries
leaseRequestSchema.index({ property: 1, tenant: 1, status: 1 });
leaseRequestSchema.index({ host: 1, status: 1 });

const LeaseRequest = mongoose.model('LeaseRequest', leaseRequestSchema);

export default LeaseRequest;
