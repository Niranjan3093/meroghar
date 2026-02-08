import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reportedMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation'
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  reportType: {
    type: String,
    enum: ['spam', 'harassment', 'scam', 'inappropriate', 'fake-listing', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true,
    maxLength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'resolved', 'dismissed'],
    default: 'pending'
  },
  resolution: {
    action: {
      type: String,
      enum: ['warning', 'message-deleted', 'user-banned', 'no-action', 'other']
    },
    notes: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date
  },
  evidence: [{
    url: String,
    public_id: String,
    type: String
  }]
}, {
  timestamps: true
});

const Report = mongoose.model('Report', reportSchema);

export default Report;
