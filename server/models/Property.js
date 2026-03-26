import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  propertyType: {
    type: String,
    required: [true, 'Please specify property type'],
    trim: true
  },
  address: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'Nepal'
    }
  },
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number] // [longitude, latitude]
    }
  },
  rent: {
    type: Number,
    required: [true, 'Please add rent amount']
  },
  securityDeposit: {
    type: Number,
    required: [true, 'Please add security deposit']
  },
  leaseDuration: {
    type: String,
    enum: ['monthly', '3-months', '6-months', 'yearly'],
    default: 'yearly'
  },
  availableFrom: {
    type: Date,
    required: true
  },
  bedrooms: Number,
  bathrooms: Number,
  area: {
    value: Number,
    unit: {
      type: String,
      enum: ['sqft', 'sqm'],
      default: 'sqft'
    }
  },
  amenities: [{
    type: String,
    enum: ['parking', 'wifi', 'furnished', 'ac', 'heating', 'gym', 'pool', 
           'security', 'elevator', 'garden', 'balcony', 'pets-allowed', 
           'smoking-allowed', 'laundry', 'kitchen']
  }],
  images: [{
    url: String,
    public_id: String
  }],
  verificationDocuments: [{
    url: String,
    public_id: String,
    documentType: String
  }],
  status: {
    type: String,
    enum: ['pending', 'active', 'rented', 'inactive', 'archived', 'rejected'],
    default: 'pending'
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  rejectionReason: String,
  rejectionEditCount: {
    type: Number,
    default: 0
  },
  
  // Lease tracking
  currentLease: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lease'
  },
  
  // Rating
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  numReviews: {
    type: Number,
    default: 0
  },
  
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  inquiries: {
    type: Number,
    default: 0
  },
  
  // Rules
  rules: [String],
  
  // Utilities included
  utilitiesIncluded: [{
    type: String,
    enum: ['electricity', 'water', 'gas', 'internet', 'trash']
  }],
  
  // Maintenance history
  maintenanceHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Maintenance'
  }],
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create geospatial index
propertySchema.index({ location: '2dsphere' });

// Static method to get properties within radius
propertySchema.statics.getPropertiesInRadius = async function(coordinates, radius) {
  return await this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: radius * 1000 // Convert km to meters
      }
    },
    status: 'active',
    verificationStatus: 'verified'
  });
};

const Property = mongoose.model('Property', propertySchema);

export default Property;
