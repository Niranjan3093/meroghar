import mongoose from 'mongoose';

const visitSittingSchema = new mongoose.Schema({
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
  visitDate: {
    type: Date,
    required: [true, 'Please add a visit date']
  },
  visitTime: {
    type: String,
    required: [true, 'Please add a visit time'],
    match: [/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/, 'Please provide time in HH:MM format']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  approvedAt: Date,
  rejectedAt: Date,
  rejectionReason: String,
  message: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for querying available dates per property
visitSittingSchema.index({ property: 1, visitDate: 1, status: 1 });
visitSittingSchema.index({ tenant: 1, visitDate: 1 });
visitSittingSchema.index({ host: 1, status: 1 });

// Update timestamp before saving
visitSittingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('VisitSitting', visitSittingSchema);
