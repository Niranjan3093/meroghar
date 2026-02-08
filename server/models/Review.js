import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  lease: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lease',
    required: true
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewType: {
    type: String,
    enum: ['property', 'host', 'tenant'],
    required: true
  },
  
  // Ratings (1-5)
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  
  // Property specific ratings
  cleanliness: {
    type: Number,
    min: 1,
    max: 5
  },
  accuracy: {
    type: Number,
    min: 1,
    max: 5
  },
  location: {
    type: Number,
    min: 1,
    max: 5
  },
  value: {
    type: Number,
    min: 1,
    max: 5
  },
  
  // Communication rating (for host/tenant)
  communication: {
    type: Number,
    min: 1,
    max: 5
  },
  
  // Tenant specific ratings
  responsibleTenant: {
    type: Number,
    min: 1,
    max: 5
  },
  respectfulOfRules: {
    type: Number,
    min: 1,
    max: 5
  },
  
  // Review content
  title: String,
  comment: {
    type: String,
    required: true
  },
  
  // Images
  images: [{
    url: String,
    public_id: String
  }],
  
  // Moderation
  isPublished: {
    type: Boolean,
    default: true
  },
  isFlagged: {
    type: Boolean,
    default: false
  },
  flagReason: String,
  
  // Response
  response: {
    comment: String,
    respondedAt: Date
  },
  
  // Helpful votes
  helpfulCount: {
    type: Number,
    default: 0
  },
  helpfulVotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Prevent duplicate reviews
reviewSchema.index({ lease: 1, reviewer: 1, reviewType: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
