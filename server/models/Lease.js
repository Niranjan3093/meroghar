import mongoose from 'mongoose';

const leaseSchema = new mongoose.Schema({
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
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
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
  status: {
    type: String,
    enum: ['pending', 'active', 'renewed', 'expired', 'terminated', 'archived'],
    default: 'pending'
  },
  
  // Contract
  contractDocument: {
    url: String,
    public_id: String
  },
  
  // Signatures
  hostSignature: {
    signed: {
      type: Boolean,
      default: false
    },
    signedAt: Date,
    signature: String
  },
  tenantSignature: {
    signed: {
      type: Boolean,
      default: false
    },
    signedAt: Date,
    signature: String
  },
  
  // DocuSign Integration
  docusign: {
    envelopeId: String,
    status: {
      type: String,
      enum: ['created', 'sent', 'delivered', 'signed', 'completed', 'declined', 'voided'],
      default: 'created'
    },
    createdAt: Date,
    sentAt: Date,
    completedAt: Date,
    voidedAt: Date,
    useLocalSigning: {
      type: Boolean,
      default: false
    }
  },
  
  // Terms
  terms: [String],
  rules: [String],
  
  // Renewal
  renewalRequested: {
    type: Boolean,
    default: false
  },
  renewalRequestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  renewalRequestedAt: Date,
  renewalApproved: Boolean,
  renewedLease: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lease'
  },
  previousLease: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lease'
  },
  
  // Payments
  payments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  }],
  
  // Maintenance
  maintenanceIssues: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Maintenance'
  }],
  
  // Utilities and expenses
  monthlyExpenses: [{
    month: Date,
    electricity: Number,
    water: Number,
    gas: Number,
    internet: Number,
    other: Number,
    total: Number
  }],
  
  // Termination
  terminationReason: String,
  terminatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  terminatedAt: Date,
  
  // Reminders sent
  remindersSent: [{
    type: {
      type: String,
      enum: ['rent-due', 'renewal', 'expiry', 'reactivation']
    },
    sentAt: Date
  }],
  
  // Archive
  archivedAt: Date,
  
  notes: String
}, {
  timestamps: true
});

// Check if lease is expiring soon
leaseSchema.methods.isExpiringSoon = function() {
  const daysUntilExpiry = Math.ceil((this.endDate - Date.now()) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry <= 14 && daysUntilExpiry > 0;
};

// Check if lease has expired
leaseSchema.methods.hasExpired = function() {
  return this.endDate < Date.now();
};

const Lease = mongoose.model('Lease', leaseSchema);

export default Lease;
