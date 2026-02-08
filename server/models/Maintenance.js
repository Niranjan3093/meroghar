import mongoose from 'mongoose';

const maintenanceSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  lease: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lease'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['plumbing', 'electrical', 'hvac', 'appliance', 'structural', 'pest-control', 'cleaning', 'other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'emergency'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'cancelled'],
    default: 'pending'
  },
  images: [{
    url: String,
    public_id: String,
    caption: String
  }],
  
  // Cost
  estimatedCost: Number,
  actualCost: Number,
  paidBy: {
    type: String,
    enum: ['host', 'tenant', 'split'],
    default: 'host'
  },
  
  // Timeline
  reportedAt: {
    type: Date,
    default: Date.now
  },
  startedAt: Date,
  resolvedAt: Date,
  
  // Resolution
  resolutionNotes: String,
  resolutionImages: [{
    url: String,
    public_id: String
  }],
  
  // Confirmation
  confirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  confirmedAt: Date,
  
  // Rating
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: String,
  
  notes: String
}, {
  timestamps: true
});

const Maintenance = mongoose.model('Maintenance', maintenanceSchema);

export default Maintenance;
